/**
 * Project Matching Service
 *
 * Service for matching learners with appropriate open-source projects
 * based on their skills, interests, and career goals.
 */

import type {
    AnalyzedIssue,
    GitHubIssue,
    ProjectDiscoveryRequest,
    ProjectDiscoveryResponse,
    ProjectMatch,
    MatchReason,
    SkillGap,
    SkillLevel,
    UserSkillProfile,
    PartnerCompany,
} from "./types";
import { searchGoodFirstIssues, analyzeIssue } from "./githubService";

// ============================================================================
// CONFIGURATION
// ============================================================================

const SKILL_LEVEL_ORDER: SkillLevel[] = ["none", "beginner", "intermediate", "advanced", "expert"];

// Partner companies (would come from database in production)
const PARTNER_COMPANIES: PartnerCompany[] = [
    {
        id: "partner-1",
        name: "TechCorp",
        logoUrl: "/partners/techcorp.png",
        description: "Leading technology company focused on developer tools",
        website: "https://techcorp.example.com",
        industry: "Developer Tools",
        size: "large",
        techStack: ["TypeScript", "React", "Node.js", "Go"],
        openPositions: 15,
        contributorsHired: 42,
        contributorRating: 4.8,
        repositories: [],
        hiringPrograms: [
            {
                id: "prog-1",
                name: "Contributor to Employee",
                description: "Fast-track hiring for proven contributors",
                requirements: ["2+ merged PRs", "Completed learning path"],
                positionsAvailable: 5,
                isActive: true,
            },
        ],
    },
];

// ============================================================================
// PROJECT DISCOVERY
// ============================================================================

/**
 * Discover matching projects for a user
 */
export async function discoverProjects(
    request: ProjectDiscoveryRequest,
    githubToken?: string
): Promise<ProjectDiscoveryResponse> {
    const { userSkills, preferredLanguages, preferredDifficulty, preferPartnerCompanies, maxResults = 20 } = request;

    // Fetch candidate issues
    const candidateIssues: GitHubIssue[] = [];
    const appliedFilters: string[] = [];

    // Search for issues in preferred languages
    for (const language of preferredLanguages.slice(0, 3)) {
        const issues = await searchGoodFirstIssues(
            {
                language,
                minStars: 100,
                maxIssues: 30,
            },
            githubToken
        );
        candidateIssues.push(...issues);
        appliedFilters.push(`language:${language}`);
    }

    // If no language specified, search generally
    if (preferredLanguages.length === 0) {
        const issues = await searchGoodFirstIssues(
            {
                minStars: 500,
                maxIssues: 50,
            },
            githubToken
        );
        candidateIssues.push(...issues);
    }

    // De-duplicate
    const uniqueIssues = Array.from(new Map(candidateIssues.map((i) => [i.id, i])).values());

    // Analyze and score each issue
    const skillsForAnalysis = userSkills.map((s) => ({ name: s.name, level: s.level }));
    const matches: ProjectMatch[] = [];

    for (const issue of uniqueIssues.slice(0, 50)) {
        // Limit analysis to first 50
        const analyzed = await analyzeIssue(issue, skillsForAnalysis);

        // Filter by difficulty if specified
        if (preferredDifficulty && analyzed.difficulty.overall !== preferredDifficulty) {
            continue;
        }

        // Calculate detailed match
        const match = calculateDetailedMatch(analyzed, request);
        matches.push(match);
    }

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    // Filter partner companies if preferred
    let finalMatches = matches;
    if (preferPartnerCompanies) {
        const partnerMatches = matches.filter((m) => m.analyzedIssue.issue.repository.isPartner);
        if (partnerMatches.length >= 3) {
            finalMatches = partnerMatches;
            appliedFilters.push("partner-only");
        }
    }

    return {
        matches: finalMatches.slice(0, maxResults),
        metadata: {
            totalAvailable: uniqueIssues.length,
            matchingFilters: finalMatches.length,
            appliedFilters,
        },
    };
}

/**
 * Calculate detailed match between user and issue
 */
function calculateDetailedMatch(analyzed: AnalyzedIssue, request: ProjectDiscoveryRequest): ProjectMatch {
    const reasons: MatchReason[] = [];
    const skillGaps: SkillGap[] = [];
    let totalWeight = 0;
    let weightedScore = 0;

    // Skill matching (weight: 40)
    const skillMatchResult = calculateSkillMatch(analyzed.requiredSkills, request.userSkills);
    const skillWeight = 40;
    weightedScore += skillMatchResult.score * (skillWeight / 100);
    totalWeight += skillWeight;

    if (skillMatchResult.score >= 70) {
        reasons.push({
            type: "skill_match",
            description: `Your ${skillMatchResult.matchingSkills.join(", ")} skills align with this project`,
            weight: skillWeight,
        });
    }

    // Add skill gaps
    skillGaps.push(...skillMatchResult.gaps);

    // Time matching (weight: 20)
    const timeWeight = 20;
    const estimatedWeeklyHours = analyzed.estimatedHours / 2; // Assume 2 weeks to complete
    const timeMatchScore = request.weeklyHoursAvailable >= estimatedWeeklyHours ? 100 : (request.weeklyHoursAvailable / estimatedWeeklyHours) * 100;

    if (timeMatchScore >= 80) {
        reasons.push({
            type: "time_match",
            description: "Fits within your available weekly hours",
            weight: timeWeight,
        });
    }
    weightedScore += timeMatchScore * (timeWeight / 100);
    totalWeight += timeWeight;

    // Difficulty matching (weight: 25)
    const difficultyWeight = 25;
    const difficultyScore = calculateDifficultyMatch(analyzed.difficulty.overall, getAverageUserLevel(request.userSkills));
    weightedScore += difficultyScore * (difficultyWeight / 100);
    totalWeight += difficultyWeight;

    if (difficultyScore >= 80) {
        reasons.push({
            type: "difficulty_match",
            description: "Difficulty level matches your experience",
            weight: difficultyWeight,
        });
    }

    // Partner company bonus (weight: 15)
    const partnerWeight = 15;
    if (analyzed.issue.repository.isPartner) {
        reasons.push({
            type: "partner_company",
            description: "Partner company with hiring opportunities",
            weight: partnerWeight,
        });
        weightedScore += 100 * (partnerWeight / 100);
    }
    totalWeight += partnerWeight;

    // Calculate gap learning time
    const gapLearningHours = skillGaps.reduce((sum, gap) => {
        const gapHours = gap.gapSize === "large" ? 10 : gap.gapSize === "medium" ? 5 : 2;
        return sum + gapHours;
    }, 0);

    return {
        analyzedIssue: analyzed,
        score: Math.round(weightedScore),
        reasons,
        skillGaps,
        gapLearningHours,
    };
}

/**
 * Calculate skill match score
 */
function calculateSkillMatch(
    required: { name: string; requiredLevel: SkillLevel; isCritical: boolean }[],
    userSkills: UserSkillProfile[]
): {
    score: number;
    matchingSkills: string[];
    gaps: SkillGap[];
} {
    const userSkillMap = new Map(userSkills.map((s) => [s.name.toLowerCase(), s]));
    const matchingSkills: string[] = [];
    const gaps: SkillGap[] = [];
    let score = 0;
    let totalWeight = 0;

    for (const req of required) {
        const weight = req.isCritical ? 2 : 1;
        totalWeight += weight;

        const userSkill = userSkillMap.get(req.name.toLowerCase());
        const userLevel = userSkill?.level || "none";
        const requiredIndex = SKILL_LEVEL_ORDER.indexOf(req.requiredLevel);
        const userIndex = SKILL_LEVEL_ORDER.indexOf(userLevel);

        if (userIndex >= requiredIndex) {
            score += weight;
            matchingSkills.push(req.name);
        } else {
            // Calculate gap
            const gapSize = requiredIndex - userIndex;
            gaps.push({
                skill: req.name,
                requiredLevel: req.requiredLevel,
                userLevel,
                gapSize: gapSize >= 2 ? "large" : gapSize === 1 ? "medium" : "small",
                bridgeResources: [
                    {
                        title: `Learn ${req.name}`,
                        type: "tutorial",
                        url: `https://example.com/learn/${req.name.toLowerCase()}`,
                    },
                ],
            });

            // Partial credit for close matches
            if (userIndex === requiredIndex - 1) {
                score += weight * 0.5;
            }
        }
    }

    return {
        score: totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 70,
        matchingSkills,
        gaps,
    };
}

/**
 * Calculate difficulty match score
 */
function calculateDifficultyMatch(issueDifficulty: string, userLevel: SkillLevel): number {
    const difficultyMap: Record<string, SkillLevel> = {
        beginner: "beginner",
        intermediate: "intermediate",
        advanced: "advanced",
        expert: "expert",
    };

    const issueLevelIndex = SKILL_LEVEL_ORDER.indexOf(difficultyMap[issueDifficulty] || "intermediate");
    const userLevelIndex = SKILL_LEVEL_ORDER.indexOf(userLevel);

    // Perfect match
    if (issueLevelIndex === userLevelIndex) return 100;

    // One level above user (stretch goal) - good
    if (issueLevelIndex === userLevelIndex + 1) return 85;

    // One level below user - good for confidence
    if (issueLevelIndex === userLevelIndex - 1) return 75;

    // Two levels difference
    if (Math.abs(issueLevelIndex - userLevelIndex) === 2) return 50;

    // More than two levels
    return 25;
}

/**
 * Get average user skill level
 */
function getAverageUserLevel(userSkills: UserSkillProfile[]): SkillLevel {
    if (userSkills.length === 0) return "beginner";

    const avgIndex =
        userSkills.reduce((sum, s) => sum + SKILL_LEVEL_ORDER.indexOf(s.level), 0) / userSkills.length;

    return SKILL_LEVEL_ORDER[Math.round(avgIndex)] || "beginner";
}

// ============================================================================
// PARTNER COMPANY FUNCTIONS
// ============================================================================

/**
 * Get partner companies
 */
export function getPartnerCompanies(): PartnerCompany[] {
    return PARTNER_COMPANIES;
}

/**
 * Get partner company by ID
 */
export function getPartnerCompanyById(id: string): PartnerCompany | undefined {
    return PARTNER_COMPANIES.find((c) => c.id === id);
}

/**
 * Check if repository is from partner
 */
export function isPartnerRepository(owner: string): boolean {
    // In production, would check against actual partner data
    return PARTNER_COMPANIES.some((c) => c.name.toLowerCase() === owner.toLowerCase());
}

// ============================================================================
// RECOMMENDATION ENGINE
// ============================================================================

/**
 * Get personalized recommendations based on user journey
 */
export async function getPersonalizedRecommendations(
    userSkills: UserSkillProfile[],
    completedContributions: number,
    targetRole: string,
    githubToken?: string
): Promise<{
    nextSteps: AnalyzedIssue[];
    stretchGoals: AnalyzedIssue[];
    partnerOpportunities: AnalyzedIssue[];
}> {
    // Determine appropriate difficulty based on experience
    let preferredDifficulty: "beginner" | "intermediate" | "advanced" = "beginner";
    if (completedContributions >= 5) preferredDifficulty = "intermediate";
    if (completedContributions >= 15) preferredDifficulty = "advanced";

    // Get role-specific skills
    const roleSkills = getRoleSkills(targetRole);
    const focusLanguages = roleSkills.filter((s) => ["JavaScript", "TypeScript", "Python", "Go", "Rust", "Java"].includes(s));

    const response = await discoverProjects(
        {
            userSkills,
            targetRole,
            preferredLanguages: focusLanguages.slice(0, 3),
            weeklyHoursAvailable: 10,
            preferredDifficulty,
            preferPartnerCompanies: completedContributions >= 3,
            maxResults: 30,
        },
        githubToken
    );

    // Categorize matches
    const nextSteps = response.matches
        .filter((m) => m.skillGaps.length === 0 && m.score >= 70)
        .slice(0, 5)
        .map((m) => m.analyzedIssue);

    const stretchGoals = response.matches
        .filter((m) => m.skillGaps.length > 0 && m.skillGaps.length <= 2 && m.score >= 50)
        .slice(0, 5)
        .map((m) => m.analyzedIssue);

    const partnerOpportunities = response.matches
        .filter((m) => m.analyzedIssue.issue.repository.isPartner)
        .slice(0, 5)
        .map((m) => m.analyzedIssue);

    return {
        nextSteps,
        stretchGoals,
        partnerOpportunities,
    };
}

/**
 * Get skills for a target role
 */
function getRoleSkills(role: string): string[] {
    const roleSkillMap: Record<string, string[]> = {
        "frontend-developer": ["JavaScript", "TypeScript", "React", "Vue", "CSS", "HTML", "Testing"],
        "backend-developer": ["Node.js", "Python", "Java", "Go", "SQL", "REST APIs", "Testing"],
        "fullstack-developer": ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "REST APIs"],
        "mobile-developer": ["React Native", "Swift", "Kotlin", "JavaScript", "TypeScript"],
        "devops-engineer": ["Docker", "Kubernetes", "CI/CD", "Python", "Bash", "AWS", "Terraform"],
        "data-engineer": ["Python", "SQL", "Spark", "Airflow", "AWS", "Data Modeling"],
        "ml-engineer": ["Python", "TensorFlow", "PyTorch", "ML", "Data Science"],
    };

    const normalizedRole = role.toLowerCase().replace(/\s+/g, "-");
    return roleSkillMap[normalizedRole] || roleSkillMap["fullstack-developer"];
}

// ============================================================================
// EXPORTS
// ============================================================================

export { SKILL_LEVEL_ORDER };
