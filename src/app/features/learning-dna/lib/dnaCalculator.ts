/**
 * Learning DNA Calculator
 *
 * Aggregation engine that synthesizes signals from multiple platforms
 * into a unified Learning DNA score and skill proficiency assessment.
 */

import type {
    ExternalAchievementSignal,
    LearningDNADimensions,
    LearningDNAProfile,
    DerivedSkillProficiency,
    GitHubSignals,
    StackOverflowSignals,
    LeetCodeSignals,
    CourseSignals,
    SignalCategory,
} from './types';
import { PLATFORM_CONFIGS } from './platformConfig';

// ============================================================================
// NORMALIZATION CONSTANTS
// ============================================================================

/**
 * Thresholds for normalizing GitHub signals (95th percentile values)
 */
const GITHUB_NORMALIZATION = {
    publicRepos: 50,
    followers: 500,
    contributionsLastYear: 1000,
    totalPRs: 200,
    mergedPRs: 150,
    totalStars: 500,
    contributedRepos: 50,
    commitStreak: 100,
};

/**
 * Thresholds for normalizing Stack Overflow signals
 */
const STACKOVERFLOW_NORMALIZATION = {
    reputation: 10000,
    goldBadges: 5,
    silverBadges: 30,
    bronzeBadges: 100,
    acceptedAnswers: 100,
    reach: 1000000,
};

/**
 * Thresholds for normalizing LeetCode signals
 */
const LEETCODE_NORMALIZATION = {
    totalSolved: 500,
    hardSolved: 100,
    contestRating: 2000,
    streak: 100,
};

/**
 * Dimension weights for overall score calculation
 */
const DIMENSION_WEIGHTS: Record<keyof LearningDNADimensions, number> = {
    contribution: 0.20,
    problemSolving: 0.18,
    learning: 0.18,
    community: 0.15,
    breadth: 0.14,
    depth: 0.15,
};

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize a value to 0-100 scale using logarithmic scaling for better distribution
 */
function normalizeValue(value: number, maxValue: number): number {
    if (value <= 0) return 0;
    if (value >= maxValue) return 100;

    // Use logarithmic scaling for more natural distribution
    const logValue = Math.log(value + 1);
    const logMax = Math.log(maxValue + 1);
    return Math.round((logValue / logMax) * 100);
}

/**
 * Linear normalization (for percentages and rates)
 */
function linearNormalize(value: number, maxValue: number): number {
    return Math.min(100, Math.round((value / maxValue) * 100));
}

// ============================================================================
// SIGNAL EXTRACTION
// ============================================================================

/**
 * Extract achievement signals from GitHub data
 */
export function extractGitHubSignals(data: GitHubSignals): ExternalAchievementSignal[] {
    const signals: ExternalAchievementSignal[] = [];
    const now = new Date().toISOString();

    // Contribution signal
    signals.push({
        id: `github_contributions_${Date.now()}`,
        platform: 'github',
        category: 'contribution',
        title: 'GitHub Contributions',
        description: `${data.contributionsLastYear} contributions in the last year`,
        rawValue: data.contributionsLastYear,
        normalizedScore: normalizeValue(data.contributionsLastYear, GITHUB_NORMALIZATION.contributionsLastYear),
        skills: Object.keys(data.languages).slice(0, 5),
        earnedAt: now,
        metadata: { type: 'contributions' },
    });

    // Open Source signal
    if (data.contributedRepos > 0) {
        signals.push({
            id: `github_opensource_${Date.now()}`,
            platform: 'github',
            category: 'contribution',
            title: 'Open Source Contributor',
            description: `Contributed to ${data.contributedRepos} repositories`,
            rawValue: data.contributedRepos,
            normalizedScore: normalizeValue(data.contributedRepos, GITHUB_NORMALIZATION.contributedRepos),
            skills: ['open-source', 'collaboration', 'git'],
            earnedAt: now,
            metadata: { type: 'opensource' },
        });
    }

    // PR expertise signal
    if (data.totalPRs > 0) {
        const mergeRate = data.mergedPRs / data.totalPRs;
        signals.push({
            id: `github_prs_${Date.now()}`,
            platform: 'github',
            category: 'contribution',
            title: 'Pull Request Author',
            description: `${data.mergedPRs} PRs merged (${Math.round(mergeRate * 100)}% merge rate)`,
            rawValue: data.mergedPRs,
            normalizedScore: normalizeValue(data.mergedPRs, GITHUB_NORMALIZATION.mergedPRs),
            skills: ['code-review', 'collaboration', 'git'],
            earnedAt: now,
            metadata: { type: 'pull_requests', mergeRate },
        });
    }

    // Community impact signal
    if (data.totalStars > 0) {
        signals.push({
            id: `github_stars_${Date.now()}`,
            platform: 'github',
            category: 'community',
            title: 'Community Impact',
            description: `${data.totalStars} stars received on repositories`,
            rawValue: data.totalStars,
            normalizedScore: normalizeValue(data.totalStars, GITHUB_NORMALIZATION.totalStars),
            skills: ['open-source', 'documentation'],
            earnedAt: now,
            metadata: { type: 'stars' },
        });
    }

    return signals;
}

/**
 * Extract achievement signals from Stack Overflow data
 */
export function extractStackOverflowSignals(data: StackOverflowSignals): ExternalAchievementSignal[] {
    const signals: ExternalAchievementSignal[] = [];
    const now = new Date().toISOString();

    // Reputation signal
    signals.push({
        id: `stackoverflow_reputation_${Date.now()}`,
        platform: 'stackoverflow',
        category: 'reputation',
        title: 'Stack Overflow Reputation',
        description: `${data.reputation.toLocaleString()} reputation points`,
        rawValue: data.reputation,
        normalizedScore: normalizeValue(data.reputation, STACKOVERFLOW_NORMALIZATION.reputation),
        skills: data.topTags.slice(0, 5).map(t => t.name),
        earnedAt: now,
        metadata: { type: 'reputation' },
    });

    // Knowledge sharing signal
    if (data.acceptedAnswers > 0) {
        signals.push({
            id: `stackoverflow_answers_${Date.now()}`,
            platform: 'stackoverflow',
            category: 'community',
            title: 'Knowledge Sharer',
            description: `${data.acceptedAnswers} accepted answers`,
            rawValue: data.acceptedAnswers,
            normalizedScore: normalizeValue(data.acceptedAnswers, STACKOVERFLOW_NORMALIZATION.acceptedAnswers),
            skills: ['mentorship', 'technical-writing', ...data.topTags.slice(0, 3).map(t => t.name)],
            earnedAt: now,
            metadata: { type: 'answers' },
        });
    }

    // Reach signal
    signals.push({
        id: `stackoverflow_reach_${Date.now()}`,
        platform: 'stackoverflow',
        category: 'community',
        title: 'Community Reach',
        description: `Helped ~${(data.reach / 1000).toFixed(0)}k developers`,
        rawValue: data.reach,
        normalizedScore: normalizeValue(data.reach, STACKOVERFLOW_NORMALIZATION.reach),
        skills: ['communication', 'technical-writing'],
        earnedAt: now,
        metadata: { type: 'reach' },
    });

    // Badges signal
    const totalBadges = data.goldBadges + data.silverBadges + data.bronzeBadges;
    if (totalBadges > 0) {
        signals.push({
            id: `stackoverflow_badges_${Date.now()}`,
            platform: 'stackoverflow',
            category: 'skill_validation',
            title: 'Badge Collector',
            description: `${data.goldBadges} gold, ${data.silverBadges} silver, ${data.bronzeBadges} bronze`,
            rawValue: data.goldBadges * 10 + data.silverBadges * 3 + data.bronzeBadges,
            normalizedScore: linearNormalize(
                data.goldBadges * 10 + data.silverBadges * 3 + data.bronzeBadges,
                STACKOVERFLOW_NORMALIZATION.goldBadges * 10 +
                STACKOVERFLOW_NORMALIZATION.silverBadges * 3 +
                STACKOVERFLOW_NORMALIZATION.bronzeBadges
            ),
            skills: data.topTags.slice(0, 3).map(t => t.name),
            earnedAt: now,
            metadata: { type: 'badges', gold: data.goldBadges, silver: data.silverBadges, bronze: data.bronzeBadges },
        });
    }

    return signals;
}

/**
 * Extract achievement signals from LeetCode data
 */
export function extractLeetCodeSignals(data: LeetCodeSignals): ExternalAchievementSignal[] {
    const signals: ExternalAchievementSignal[] = [];
    const now = new Date().toISOString();

    // Problem solving signal
    signals.push({
        id: `leetcode_problems_${Date.now()}`,
        platform: 'leetcode',
        category: 'problem_solving',
        title: 'Problem Solver',
        description: `${data.totalSolved} problems solved (${data.easySolved}E/${data.mediumSolved}M/${data.hardSolved}H)`,
        rawValue: data.totalSolved,
        normalizedScore: normalizeValue(data.totalSolved, LEETCODE_NORMALIZATION.totalSolved),
        skills: ['algorithms', 'data-structures', 'problem-solving'],
        earnedAt: now,
        metadata: { type: 'problems', easy: data.easySolved, medium: data.mediumSolved, hard: data.hardSolved },
    });

    // Hard problem expertise
    if (data.hardSolved > 0) {
        signals.push({
            id: `leetcode_hard_${Date.now()}`,
            platform: 'leetcode',
            category: 'problem_solving',
            title: 'Hard Problem Expert',
            description: `${data.hardSolved} hard problems solved`,
            rawValue: data.hardSolved,
            normalizedScore: normalizeValue(data.hardSolved, LEETCODE_NORMALIZATION.hardSolved),
            skills: ['dynamic-programming', 'advanced-algorithms', 'optimization'],
            earnedAt: now,
            metadata: { type: 'hard_problems' },
        });
    }

    // Contest signal
    if (data.contestRating > 0) {
        signals.push({
            id: `leetcode_contest_${Date.now()}`,
            platform: 'leetcode',
            category: 'problem_solving',
            title: 'Contest Participant',
            description: `Rating: ${data.contestRating} (${data.contestsAttended} contests)`,
            rawValue: data.contestRating,
            normalizedScore: normalizeValue(data.contestRating, LEETCODE_NORMALIZATION.contestRating),
            skills: ['competitive-programming', 'time-management', 'algorithms'],
            earnedAt: now,
            metadata: { type: 'contest', contests: data.contestsAttended },
        });
    }

    return signals;
}

/**
 * Extract achievement signals from course platform data
 */
export function extractCourseSignals(data: CourseSignals): ExternalAchievementSignal[] {
    const signals: ExternalAchievementSignal[] = [];
    const now = new Date().toISOString();

    // Course completion signal
    signals.push({
        id: `${data.platform}_courses_${Date.now()}`,
        platform: data.platform,
        category: 'completion',
        title: 'Course Completions',
        description: `${data.coursesCompleted} courses (${data.totalHours}h total)`,
        rawValue: data.coursesCompleted,
        normalizedScore: linearNormalize(data.coursesCompleted, 50),
        skills: data.skillsLearned.slice(0, 5),
        earnedAt: now,
        metadata: { type: 'courses', hours: data.totalHours },
    });

    // Certifications signal
    if (data.certifications.length > 0) {
        signals.push({
            id: `${data.platform}_certs_${Date.now()}`,
            platform: data.platform,
            category: 'skill_validation',
            title: 'Certified Professional',
            description: `${data.certifications.length} certifications earned`,
            rawValue: data.certifications.length,
            normalizedScore: linearNormalize(data.certifications.length, 10),
            skills: data.skillsLearned.slice(0, 5),
            earnedAt: now,
            metadata: { type: 'certifications', certs: data.certifications },
        });
    }

    return signals;
}

// ============================================================================
// DIMENSION CALCULATION
// ============================================================================

/**
 * Calculate Learning DNA dimensions from signals
 */
export function calculateDimensions(signals: ExternalAchievementSignal[]): LearningDNADimensions {
    // Group signals by category
    const byCategory = signals.reduce((acc, signal) => {
        if (!acc[signal.category]) acc[signal.category] = [];
        acc[signal.category].push(signal);
        return acc;
    }, {} as Record<SignalCategory, ExternalAchievementSignal[]>);

    // Calculate dimension scores
    const contribution = calculateCategoryScore(byCategory.contribution || []);
    const problemSolving = calculateCategoryScore(byCategory.problem_solving || []);
    const learning = calculateCategoryScore([
        ...(byCategory.completion || []),
        ...(byCategory.skill_validation || []),
    ]);
    const community = calculateCategoryScore([
        ...(byCategory.community || []),
        ...(byCategory.reputation || []),
    ]);

    // Calculate breadth (number of unique skills across all signals)
    const allSkills = new Set(signals.flatMap(s => s.skills));
    const breadth = linearNormalize(allSkills.size, 30);

    // Calculate depth (highest scores in top skills)
    const skillScores: Record<string, number[]> = {};
    signals.forEach(signal => {
        signal.skills.forEach(skill => {
            if (!skillScores[skill]) skillScores[skill] = [];
            skillScores[skill].push(signal.normalizedScore);
        });
    });
    const topSkillScores = Object.values(skillScores)
        .map(scores => Math.max(...scores))
        .sort((a, b) => b - a)
        .slice(0, 5);
    const depth = topSkillScores.length > 0
        ? Math.round(topSkillScores.reduce((a, b) => a + b, 0) / topSkillScores.length)
        : 0;

    return {
        contribution,
        problemSolving,
        learning,
        community,
        breadth,
        depth,
    };
}

/**
 * Calculate weighted score for a category of signals
 */
function calculateCategoryScore(signals: ExternalAchievementSignal[]): number {
    if (signals.length === 0) return 0;

    // Apply platform weights
    const weightedScores = signals.map(signal => {
        const weight = PLATFORM_CONFIGS[signal.platform]?.scoreWeight || 1;
        return signal.normalizedScore * weight;
    });

    // Use weighted average with diminishing returns for many signals
    const totalWeight = weightedScores.length;
    const sum = weightedScores.reduce((a, b) => a + b, 0);
    const average = sum / totalWeight;

    // Apply diminishing returns factor
    const diminishingFactor = 1 + Math.log10(Math.max(1, totalWeight)) * 0.2;

    return Math.min(100, Math.round(average * diminishingFactor));
}

// ============================================================================
// SKILL DERIVATION
// ============================================================================

/**
 * Derive skill proficiencies from signals
 */
export function deriveSkillProficiencies(signals: ExternalAchievementSignal[]): DerivedSkillProficiency[] {
    // Aggregate skill evidence
    const skillEvidence: Record<string, {
        scores: number[];
        sources: DerivedSkillProficiency['sources'];
    }> = {};

    signals.forEach(signal => {
        signal.skills.forEach(skill => {
            if (!skillEvidence[skill]) {
                skillEvidence[skill] = { scores: [], sources: [] };
            }
            skillEvidence[skill].scores.push(signal.normalizedScore);
            skillEvidence[skill].sources.push({
                platform: signal.platform,
                signalType: signal.category,
                evidence: signal.title,
                weight: PLATFORM_CONFIGS[signal.platform]?.scoreWeight || 1,
            });
        });
    });

    // Calculate proficiency for each skill
    const proficiencies: DerivedSkillProficiency[] = Object.entries(skillEvidence)
        .map(([skillId, evidence]) => {
            const avgScore = evidence.scores.reduce((a, b) => a + b, 0) / evidence.scores.length;
            const confidence = Math.min(100, evidence.sources.length * 15 + avgScore * 0.5);

            return {
                skillId,
                skillName: formatSkillName(skillId),
                confidence: Math.round(confidence),
                proficiency: scoreToProficiency(avgScore),
                sources: evidence.sources,
                lastUpdated: new Date().toISOString(),
            };
        })
        .sort((a, b) => b.confidence - a.confidence);

    return proficiencies;
}

/**
 * Convert score to proficiency level
 */
function scoreToProficiency(score: number): DerivedSkillProficiency['proficiency'] {
    if (score >= 80) return 'expert';
    if (score >= 60) return 'advanced';
    if (score >= 35) return 'intermediate';
    return 'beginner';
}

/**
 * Format skill ID to display name
 */
function formatSkillName(skillId: string): string {
    return skillId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ============================================================================
// OVERALL SCORE
// ============================================================================

/**
 * Calculate overall Learning DNA score
 */
export function calculateOverallScore(dimensions: LearningDNADimensions): number {
    const weighted = Object.entries(DIMENSION_WEIGHTS).reduce((acc, [key, weight]) => {
        return acc + dimensions[key as keyof LearningDNADimensions] * weight;
    }, 0);

    return Math.round(weighted);
}

/**
 * Build complete Learning DNA profile
 */
export function buildLearningDNAProfile(
    userId: string,
    signals: ExternalAchievementSignal[],
    platformData: LearningDNAProfile['platformData'],
    connectedPlatforms: LearningDNAProfile['connectedPlatforms']
): LearningDNAProfile {
    const dimensions = calculateDimensions(signals);
    const overallScore = calculateOverallScore(dimensions);
    const derivedSkills = deriveSkillProficiencies(signals);
    const now = new Date().toISOString();

    return {
        userId,
        overallScore,
        dimensions,
        connectedPlatforms,
        signals,
        derivedSkills,
        platformData,
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
    };
}
