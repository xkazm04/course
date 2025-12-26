/**
 * GitHub Integration Service
 *
 * Service for fetching and analyzing GitHub issues for live project contributions.
 * Handles API calls to GitHub and issue analysis with AI.
 */

import type {
    GitHubRepository,
    GitHubIssue,
    IssueLabel,
    GitHubUser,
    AnalyzedIssue,
    IssueAnalysis,
    ScaffoldedLearningPath,
    LearningPhase,
    LearningCheckpoint,
    SkillRequirement,
    IssueDifficulty,
    SkillLevel,
    PhaseType,
} from "./types";

// ============================================================================
// CONFIGURATION
// ============================================================================

const GITHUB_API_BASE = "https://api.github.com";
const ANALYZE_ENDPOINT = "/api/live-projects/analyze";
const GOOD_FIRST_ISSUE_LABELS = ["good first issue", "good-first-issue", "beginner", "beginner-friendly", "easy"];
const HELP_WANTED_LABELS = ["help wanted", "help-wanted", "contributions welcome"];

// ============================================================================
// GITHUB API SERVICE
// ============================================================================

/**
 * Fetch repository information
 */
export async function fetchRepository(
    owner: string,
    name: string,
    token?: string
): Promise<GitHubRepository | null> {
    try {
        const headers: HeadersInit = {
            Accept: "application/vnd.github.v3+json",
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${name}`, { headers });
        if (!response.ok) return null;

        const data = await response.json();
        return mapRepositoryData(data);
    } catch (error) {
        console.error("Failed to fetch repository:", error);
        return null;
    }
}

/**
 * Search for good first issues across GitHub
 */
export async function searchGoodFirstIssues(
    params: {
        language?: string;
        labels?: string[];
        minStars?: number;
        maxIssues?: number;
        sortBy?: "created" | "updated" | "comments";
    },
    token?: string
): Promise<GitHubIssue[]> {
    const { language, labels = ["good first issue"], minStars = 100, maxIssues = 50, sortBy = "updated" } = params;

    const queryParts = [
        "is:issue",
        "is:open",
        "no:assignee",
        ...labels.map((l) => `label:"${l}"`),
        minStars > 0 ? `stars:>=${minStars}` : "",
        language ? `language:${language}` : "",
    ].filter(Boolean);

    const query = encodeURIComponent(queryParts.join(" "));

    try {
        const headers: HeadersInit = {
            Accept: "application/vnd.github.v3+json",
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
            `${GITHUB_API_BASE}/search/issues?q=${query}&sort=${sortBy}&order=desc&per_page=${maxIssues}`,
            { headers }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const issues: GitHubIssue[] = [];

        for (const item of data.items) {
            // Fetch repository info for each issue
            const repoUrl = item.repository_url;
            const [owner, name] = repoUrl.split("/").slice(-2);
            const repo = await fetchRepository(owner, name, token);
            if (!repo) continue;

            issues.push(mapIssueData(item, repo));
        }

        return issues;
    } catch (error) {
        console.error("Failed to search issues:", error);
        return [];
    }
}

/**
 * Fetch issues from a specific repository
 */
export async function fetchRepositoryIssues(
    owner: string,
    name: string,
    params?: {
        labels?: string[];
        state?: "open" | "closed" | "all";
        maxIssues?: number;
    },
    token?: string
): Promise<GitHubIssue[]> {
    const { labels = [], state = "open", maxIssues = 30 } = params || {};

    try {
        const headers: HeadersInit = {
            Accept: "application/vnd.github.v3+json",
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const repo = await fetchRepository(owner, name, token);
        if (!repo) return [];

        let url = `${GITHUB_API_BASE}/repos/${owner}/${name}/issues?state=${state}&per_page=${maxIssues}`;
        if (labels.length > 0) {
            url += `&labels=${encodeURIComponent(labels.join(","))}`;
        }

        const response = await fetch(url, { headers });
        if (!response.ok) return [];

        const data = await response.json();
        return data
            .filter((item: { pull_request?: unknown }) => !item.pull_request) // Exclude PRs
            .map((item: unknown) => mapIssueData(item, repo));
    } catch (error) {
        console.error("Failed to fetch repository issues:", error);
        return [];
    }
}

// ============================================================================
// ISSUE ANALYSIS SERVICE
// ============================================================================

/**
 * Analyze an issue and create a scaffolded learning path
 */
export async function analyzeIssue(
    issue: GitHubIssue,
    userSkills: { name: string; level: SkillLevel }[]
): Promise<AnalyzedIssue> {
    try {
        const response = await fetch(ANALYZE_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                issue,
                userSkills,
            }),
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error("API analysis failed, using local analysis:", error);
    }

    // Fallback to local analysis
    return generateLocalAnalysis(issue, userSkills);
}

/**
 * Generate local analysis when API is unavailable
 */
function generateLocalAnalysis(
    issue: GitHubIssue,
    userSkills: { name: string; level: SkillLevel }[]
): AnalyzedIssue {
    const analysis = analyzeIssueLocally(issue);
    const difficulty = assessDifficulty(issue);
    const requiredSkills = extractRequiredSkills(issue, difficulty);
    const matchScore = calculateMatchScore(requiredSkills, userSkills);
    const learningPath = generateLearningPath(issue, analysis, requiredSkills);

    return {
        issue,
        analysis,
        learningPath,
        requiredSkills,
        estimatedHours: estimateHours(difficulty, requiredSkills),
        difficulty,
        matchScore,
        matchReasons: generateMatchReasons(matchScore, requiredSkills, userSkills),
        potentialBlockers: identifyBlockers(issue, requiredSkills, userSkills),
        mentorAvailable: issue.repository.isPartner,
    };
}

/**
 * Analyze issue content locally
 */
function analyzeIssueLocally(issue: GitHubIssue): IssueAnalysis {
    const body = issue.body || "";
    const title = issue.title;

    // Extract requirements from issue body
    const requirements: string[] = [];
    const technicalApproach: string[] = [];
    const testingRequirements: string[] = [];

    // Parse bullet points as requirements
    const bulletPoints = body.match(/^[\s]*[-*]\s+(.+)$/gm) || [];
    bulletPoints.forEach((point) => {
        const text = point.replace(/^[\s]*[-*]\s+/, "").trim();
        if (text.toLowerCase().includes("test")) {
            testingRequirements.push(text);
        } else {
            requirements.push(text);
        }
    });

    // Generate summary
    const summary = `This issue requests ${title.toLowerCase()}. ${
        requirements.length > 0
            ? `It involves ${requirements.length} main requirements.`
            : "Review the issue description for specific requirements."
    }`;

    // Identify likely files based on keywords
    const likelyFiles: string[] = [];
    const filePatterns = body.match(/[\w\/\-\.]+\.(ts|tsx|js|jsx|py|java|go|rs|css|html)/gi) || [];
    likelyFiles.push(...filePatterns);

    // Identify patterns
    const relatedPatterns: string[] = [];
    if (body.includes("component") || body.includes("Component")) {
        relatedPatterns.push("React component patterns");
    }
    if (body.includes("API") || body.includes("api")) {
        relatedPatterns.push("API integration patterns");
    }
    if (body.includes("hook") || body.includes("use")) {
        relatedPatterns.push("React hooks patterns");
    }
    if (body.includes("state") || body.includes("redux") || body.includes("context")) {
        relatedPatterns.push("State management patterns");
    }

    return {
        summary,
        requirements: requirements.length > 0 ? requirements : ["Review issue description for details"],
        technicalApproach: [
            "Read and understand the existing codebase structure",
            "Identify the components/files that need modification",
            "Plan the implementation before writing code",
            "Write tests alongside implementation",
            "Update documentation as needed",
        ],
        likelyFiles,
        relatedPatterns,
        edgeCases: [
            "Consider error handling scenarios",
            "Think about edge cases in user input",
            "Consider accessibility requirements",
        ],
        testingRequirements: testingRequirements.length > 0
            ? testingRequirements
            : ["Write unit tests for new functionality", "Ensure existing tests pass"],
        documentationNeeds: ["Update relevant documentation", "Add inline code comments where helpful"],
        prerequisiteStudy: [
            `Understand the ${issue.repository.name} codebase structure`,
            `Review the contributing guidelines`,
            `Study similar implementations in the codebase`,
        ],
    };
}

/**
 * Assess issue difficulty
 */
function assessDifficulty(issue: GitHubIssue): IssueDifficulty {
    const factors: { name: string; impact: number; explanation: string }[] = [];

    // Label-based difficulty
    const labelNames = issue.labels.map((l) => l.name.toLowerCase());
    let baseDifficulty: "beginner" | "intermediate" | "advanced" | "expert" = "intermediate";

    if (labelNames.some((l) => GOOD_FIRST_ISSUE_LABELS.includes(l))) {
        baseDifficulty = "beginner";
        factors.push({
            name: "Good First Issue Label",
            impact: 1,
            explanation: "Maintainers have marked this as suitable for beginners",
        });
    }

    if (labelNames.some((l) => l.includes("complex") || l.includes("hard"))) {
        baseDifficulty = "advanced";
        factors.push({
            name: "Complexity Label",
            impact: 4,
            explanation: "This issue has been marked as complex",
        });
    }

    // Body length suggests complexity
    const bodyLength = (issue.body || "").length;
    if (bodyLength > 2000) {
        factors.push({
            name: "Detailed Description",
            impact: 3,
            explanation: "The issue has extensive details, suggesting complexity",
        });
        if (baseDifficulty === "beginner") baseDifficulty = "intermediate";
    }

    // Comments suggest ongoing discussion/complexity
    if (issue.commentsCount > 10) {
        factors.push({
            name: "Active Discussion",
            impact: 2,
            explanation: "Many comments suggest the issue has nuances to understand",
        });
    }

    // Repository size/popularity
    if (issue.repository.stars > 10000) {
        factors.push({
            name: "Popular Repository",
            impact: 2,
            explanation: "Large codebases can be harder to navigate",
        });
    }

    return {
        overall: baseDifficulty,
        factors,
        recommendedExperience:
            baseDifficulty === "beginner"
                ? "Some programming experience, enthusiasm to learn"
                : baseDifficulty === "intermediate"
                ? "1-2 years of experience with the relevant technologies"
                : "3+ years of experience with complex codebases",
    };
}

/**
 * Extract required skills from issue
 */
function extractRequiredSkills(issue: GitHubIssue, difficulty: IssueDifficulty): SkillRequirement[] {
    const skills: SkillRequirement[] = [];
    const language = issue.repository.language;
    const body = issue.body?.toLowerCase() || "";
    const topics = issue.repository.topics;

    // Primary language skill
    if (language) {
        skills.push({
            name: language,
            requiredLevel: difficulty.overall === "beginner" ? "beginner" : "intermediate",
            isCritical: true,
        });
    }

    // Framework detection
    if (body.includes("react") || topics.includes("react")) {
        skills.push({
            name: "React",
            requiredLevel: difficulty.overall === "beginner" ? "beginner" : "intermediate",
            isCritical: body.includes("react"),
        });
    }

    if (body.includes("vue") || topics.includes("vue")) {
        skills.push({
            name: "Vue.js",
            requiredLevel: difficulty.overall === "beginner" ? "beginner" : "intermediate",
            isCritical: body.includes("vue"),
        });
    }

    if (body.includes("node") || topics.includes("nodejs")) {
        skills.push({
            name: "Node.js",
            requiredLevel: difficulty.overall === "beginner" ? "beginner" : "intermediate",
            isCritical: body.includes("node"),
        });
    }

    // Testing
    if (body.includes("test")) {
        skills.push({
            name: "Testing",
            requiredLevel: "beginner",
            isCritical: false,
        });
    }

    // Git is always required
    skills.push({
        name: "Git",
        requiredLevel: "beginner",
        isCritical: true,
    });

    return skills;
}

/**
 * Calculate match score between required skills and user skills
 */
function calculateMatchScore(
    required: SkillRequirement[],
    userSkills: { name: string; level: SkillLevel }[]
): number {
    if (required.length === 0) return 70; // Default score if no requirements identified

    const userSkillMap = new Map(userSkills.map((s) => [s.name.toLowerCase(), s.level]));
    let score = 0;
    let totalWeight = 0;

    const levelOrder: SkillLevel[] = ["none", "beginner", "intermediate", "advanced", "expert"];

    for (const req of required) {
        const weight = req.isCritical ? 2 : 1;
        totalWeight += weight;

        const userLevel = userSkillMap.get(req.name.toLowerCase()) || "none";
        const requiredIndex = levelOrder.indexOf(req.requiredLevel);
        const userIndex = levelOrder.indexOf(userLevel);

        if (userIndex >= requiredIndex) {
            score += weight; // Full points
        } else if (userIndex === requiredIndex - 1) {
            score += weight * 0.5; // Partial points for close match
        }
    }

    return Math.round((score / totalWeight) * 100);
}

/**
 * Generate match reasons
 */
function generateMatchReasons(
    score: number,
    required: SkillRequirement[],
    userSkills: { name: string; level: SkillLevel }[]
): string[] {
    const reasons: string[] = [];
    const userSkillMap = new Map(userSkills.map((s) => [s.name.toLowerCase(), s.level]));

    // Strong matches
    for (const req of required) {
        const userLevel = userSkillMap.get(req.name.toLowerCase());
        if (userLevel && userLevel !== "none") {
            reasons.push(`Your ${req.name} experience matches this issue's requirements`);
        }
    }

    if (score >= 80) {
        reasons.push("Your skill profile is an excellent match for this issue");
    } else if (score >= 60) {
        reasons.push("This issue will help you grow while building on existing skills");
    } else if (score >= 40) {
        reasons.push("This is a stretch goal that will significantly expand your abilities");
    }

    return reasons.slice(0, 3);
}

/**
 * Identify potential blockers
 */
function identifyBlockers(
    issue: GitHubIssue,
    required: SkillRequirement[],
    userSkills: { name: string; level: SkillLevel }[]
): string[] {
    const blockers: string[] = [];
    const userSkillMap = new Map(userSkills.map((s) => [s.name.toLowerCase(), s.level]));

    // Critical skill gaps
    for (const req of required) {
        if (req.isCritical) {
            const userLevel = userSkillMap.get(req.name.toLowerCase());
            if (!userLevel || userLevel === "none") {
                blockers.push(`You may need to learn ${req.name} basics first`);
            }
        }
    }

    // Large codebase
    if (issue.repository.stars > 50000) {
        blockers.push("Very large codebase may take time to navigate");
    }

    // Many comments/active discussion
    if (issue.commentsCount > 20) {
        blockers.push("Read through all comments to understand the current state");
    }

    return blockers;
}

/**
 * Estimate hours to complete
 */
function estimateHours(difficulty: IssueDifficulty, skills: SkillRequirement[]): number {
    const baseHours = {
        beginner: 5,
        intermediate: 15,
        advanced: 30,
        expert: 50,
    };

    let hours = baseHours[difficulty.overall];

    // Add time for skill learning
    const criticalSkills = skills.filter((s) => s.isCritical).length;
    hours += criticalSkills * 2;

    return hours;
}

/**
 * Generate scaffolded learning path
 */
function generateLearningPath(
    issue: GitHubIssue,
    analysis: IssueAnalysis,
    skills: SkillRequirement[]
): ScaffoldedLearningPath {
    const phases: LearningPhase[] = [
        {
            id: "phase-1-explore",
            order: 1,
            title: "Codebase Exploration",
            description: `Understand the ${issue.repository.name} repository structure and find relevant code.`,
            type: "exploration" as PhaseType,
            tasks: [
                {
                    id: "task-1-1",
                    title: "Fork and clone the repository",
                    description: `Fork ${issue.repository.fullName} and set up locally`,
                    completed: false,
                    aiAssistanceType: "approach_guidance",
                },
                {
                    id: "task-1-2",
                    title: "Review contributing guidelines",
                    description: "Read CONTRIBUTING.md and CODE_OF_CONDUCT.md",
                    completed: false,
                    resources: issue.repository.contributingUrl
                        ? [{ title: "Contributing Guide", type: "documentation", url: issue.repository.contributingUrl }]
                        : undefined,
                },
                {
                    id: "task-1-3",
                    title: "Locate relevant code",
                    description: `Find the files related to this issue: ${analysis.likelyFiles.join(", ") || "explore the codebase"}`,
                    completed: false,
                    aiAssistanceType: "code_explanation",
                },
            ],
            estimatedHours: 2,
            mentorshipPrompts: [
                "How do I navigate a large codebase efficiently?",
                "What patterns should I look for when understanding existing code?",
            ],
        },
        {
            id: "phase-2-learn",
            order: 2,
            title: "Concept Review",
            description: "Review the skills and patterns needed for this issue.",
            type: "learning" as PhaseType,
            tasks: skills.map((skill, i) => ({
                id: `task-2-${i + 1}`,
                title: `Review ${skill.name} fundamentals`,
                description: `Ensure you understand ${skill.name} at the ${skill.requiredLevel} level`,
                completed: false,
                aiAssistanceType: "code_explanation" as const,
            })),
            estimatedHours: 3,
            mentorshipPrompts: analysis.relatedPatterns.map((p) => `Help me understand ${p}`),
        },
        {
            id: "phase-3-plan",
            order: 3,
            title: "Implementation Planning",
            description: "Plan your approach before writing code.",
            type: "planning" as PhaseType,
            tasks: [
                {
                    id: "task-3-1",
                    title: "Draft implementation plan",
                    description: "Write out the steps you'll take to solve this issue",
                    completed: false,
                    aiAssistanceType: "approach_guidance",
                },
                {
                    id: "task-3-2",
                    title: "Identify edge cases",
                    description: `Consider: ${analysis.edgeCases.join("; ")}`,
                    completed: false,
                },
                {
                    id: "task-3-3",
                    title: "Plan test cases",
                    description: `Determine what tests you'll need: ${analysis.testingRequirements.join("; ")}`,
                    completed: false,
                },
            ],
            estimatedHours: 1,
            mentorshipPrompts: [
                "What's the best approach for this implementation?",
                "What edge cases might I be missing?",
            ],
        },
        {
            id: "phase-4-implement",
            order: 4,
            title: "Implementation",
            description: "Write the code to solve the issue.",
            type: "implementation" as PhaseType,
            tasks: analysis.technicalApproach.map((approach, i) => ({
                id: `task-4-${i + 1}`,
                title: approach,
                description: `Complete: ${approach}`,
                completed: false,
                aiAssistanceType: i === 0 ? ("approach_guidance" as const) : undefined,
            })),
            estimatedHours: 5,
            mentorshipPrompts: [
                "Review my code for best practices",
                "Help me debug this issue",
            ],
        },
        {
            id: "phase-5-test",
            order: 5,
            title: "Testing",
            description: "Verify your implementation works correctly.",
            type: "testing" as PhaseType,
            tasks: [
                {
                    id: "task-5-1",
                    title: "Run existing tests",
                    description: "Ensure all existing tests still pass",
                    completed: false,
                },
                {
                    id: "task-5-2",
                    title: "Write new tests",
                    description: "Add tests for your new functionality",
                    completed: false,
                    aiAssistanceType: "best_practices",
                },
                {
                    id: "task-5-3",
                    title: "Manual testing",
                    description: "Test your changes manually to verify they work",
                    completed: false,
                },
            ],
            estimatedHours: 2,
            mentorshipPrompts: [
                "What additional test cases should I add?",
                "How do I test edge cases effectively?",
            ],
        },
        {
            id: "phase-6-submit",
            order: 6,
            title: "Pull Request",
            description: "Submit your contribution for review.",
            type: "review" as PhaseType,
            tasks: [
                {
                    id: "task-6-1",
                    title: "Create descriptive commit message",
                    description: "Write a clear commit message following project conventions",
                    completed: false,
                },
                {
                    id: "task-6-2",
                    title: "Create pull request",
                    description: "Open a PR with a clear description of your changes",
                    completed: false,
                    aiAssistanceType: "best_practices",
                },
                {
                    id: "task-6-3",
                    title: "Respond to feedback",
                    description: "Address any review comments promptly and professionally",
                    completed: false,
                },
            ],
            estimatedHours: 1,
            mentorshipPrompts: [
                "How do I write a good PR description?",
                "How should I respond to review feedback?",
            ],
        },
    ];

    const checkpoints: LearningCheckpoint[] = [
        {
            id: "checkpoint-1",
            title: "Understanding Verified",
            verificationCriteria: [
                "Can explain what the issue is asking for",
                "Know which files need to be modified",
                "Understand the codebase patterns being used",
            ],
            selfAssessment: [
                "Can you explain this issue to someone else?",
                "Do you know where to start coding?",
            ],
            passed: false,
        },
        {
            id: "checkpoint-2",
            title: "Implementation Complete",
            verificationCriteria: [
                "Code compiles/runs without errors",
                "New functionality works as expected",
                "Existing tests still pass",
            ],
            selfAssessment: [
                "Does your implementation handle edge cases?",
                "Is your code following the project's style?",
            ],
            passed: false,
        },
        {
            id: "checkpoint-3",
            title: "Contribution Ready",
            verificationCriteria: [
                "All tests pass",
                "Documentation is updated",
                "PR is well-described",
            ],
            selfAssessment: [
                "Would you be proud to show this code to a senior developer?",
                "Have you tested thoroughly?",
            ],
            passed: false,
        },
    ];

    return {
        id: `path-${issue.id}`,
        title: `Contributing to: ${issue.title}`,
        overview: `This learning path guides you through making a real contribution to ${issue.repository.fullName}. You'll learn the codebase, plan your approach, implement the solution, and submit a professional pull request.`,
        phases,
        checkpoints,
        successCriteria: [
            "Pull request is submitted with clear description",
            "All tests pass",
            "Code follows project conventions",
            "PR is reviewed and approved by maintainers",
            "Contribution is merged into the main branch",
        ],
    };
}

// ============================================================================
// DATA MAPPING HELPERS
// ============================================================================

function mapRepositoryData(data: {
    id: number;
    owner: { login: string };
    name: string;
    full_name: string;
    description: string;
    language: string;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    html_url: string;
    topics?: string[];
    license?: { spdx_id: string };
    updated_at: string;
}): GitHubRepository {
    return {
        id: String(data.id),
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
        description: data.description || "",
        language: data.language || "",
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        url: data.html_url,
        topics: data.topics || [],
        license: data.license?.spdx_id,
        isPartner: false, // Would be determined by partner database
        updatedAt: data.updated_at,
    };
}

function mapIssueData(data: {
    id: number;
    number: number;
    title: string;
    body: string;
    html_url: string;
    state: string;
    labels: Array<{ id: number; name: string; color: string; description?: string }>;
    assignees: Array<{ id: number; login: string; avatar_url: string; html_url: string }>;
    user: { id: number; login: string; avatar_url: string; html_url: string };
    comments: number;
    created_at: string;
    updated_at: string;
    reactions?: { "+1": number; "-1": number; heart: number; total_count: number };
}, repo: GitHubRepository): GitHubIssue {
    const labelNames = data.labels.map((l) => l.name.toLowerCase());

    return {
        id: String(data.id),
        number: data.number,
        title: data.title,
        body: data.body || "",
        url: data.html_url,
        state: data.state as "open" | "closed",
        labels: data.labels.map(
            (l): IssueLabel => ({
                id: String(l.id),
                name: l.name,
                color: l.color,
                description: l.description,
            })
        ),
        assignees: data.assignees.map(
            (a): GitHubUser => ({
                id: String(a.id),
                login: a.login,
                avatarUrl: a.avatar_url,
                profileUrl: a.html_url,
            })
        ),
        author: {
            id: String(data.user.id),
            login: data.user.login,
            avatarUrl: data.user.avatar_url,
            profileUrl: data.user.html_url,
        },
        commentsCount: data.comments,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        repository: repo,
        isGoodFirstIssue: labelNames.some((l) => GOOD_FIRST_ISSUE_LABELS.includes(l)),
        isHelpWanted: labelNames.some((l) => HELP_WANTED_LABELS.includes(l)),
        reactions: {
            thumbsUp: data.reactions?.["+1"] || 0,
            thumbsDown: data.reactions?.["-1"] || 0,
            heart: data.reactions?.heart || 0,
            total: data.reactions?.total_count || 0,
        },
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    GOOD_FIRST_ISSUE_LABELS,
    HELP_WANTED_LABELS,
};
