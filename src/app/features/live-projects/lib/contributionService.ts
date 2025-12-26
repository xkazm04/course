/**
 * Contribution Service
 *
 * Service for tracking and managing user contributions to open-source projects.
 * Handles progress tracking, mentorship sessions, and outcome management.
 */

import type {
    Contribution,
    ContributionStatus,
    PhaseProgress,
    PullRequestInfo,
    MentorSession,
    AIAssistanceLog,
    ContributionOutcome,
    ContributionBadge,
    ContributionCertificate,
    UserContributionStats,
    LeaderboardEntry,
    AnalyzedIssue,
    AIAssistanceType,
} from "./types";

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

const STORAGE_KEYS = {
    CONTRIBUTIONS: "live-projects-contributions",
    STATS: "live-projects-stats",
    LEADERBOARD: "live-projects-leaderboard",
} as const;

// Simple storage helper that works with dynamic keys
function getStorageItem<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
}

function setStorageItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to save to ${key}:`, error);
    }
}

// ============================================================================
// CONTRIBUTION MANAGEMENT
// ============================================================================

/**
 * Start a new contribution
 */
export function startContribution(userId: string, analyzedIssue: AnalyzedIssue): Contribution {
    const contribution: Contribution = {
        id: `contrib-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        userId,
        analyzedIssue,
        status: "exploring",
        phaseProgress: analyzedIssue.learningPath.phases.map((phase) => ({
            phaseId: phase.id,
            status: "not_started",
            tasksCompleted: 0,
            totalTasks: phase.tasks.length,
            timeSpentMinutes: 0,
        })),
        mentorSessions: [],
        aiAssistanceLog: [],
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
    };

    // Start first phase
    contribution.phaseProgress[0].status = "in_progress";
    contribution.phaseProgress[0].startedAt = new Date().toISOString();

    // Save to storage
    const contributions = getContributions(userId);
    contributions.push(contribution);
    saveContributions(userId, contributions);

    // Update stats
    updateStats(userId, { totalContributions: 1 });

    return contribution;
}

/**
 * Get all contributions for a user
 */
export function getContributions(userId: string): Contribution[] {
    const data = getStorageItem<Contribution[]>(`${STORAGE_KEYS.CONTRIBUTIONS}-${userId}`);
    return data || [];
}

/**
 * Get a specific contribution
 */
export function getContribution(userId: string, contributionId: string): Contribution | undefined {
    const contributions = getContributions(userId);
    return contributions.find((c) => c.id === contributionId);
}

/**
 * Save contributions
 */
function saveContributions(userId: string, contributions: Contribution[]): void {
    setStorageItem(`${STORAGE_KEYS.CONTRIBUTIONS}-${userId}`, contributions);
}

/**
 * Update contribution status
 */
export function updateContributionStatus(
    userId: string,
    contributionId: string,
    status: ContributionStatus
): Contribution | undefined {
    const contributions = getContributions(userId);
    const index = contributions.findIndex((c) => c.id === contributionId);
    if (index === -1) return undefined;

    contributions[index].status = status;
    contributions[index].lastActivityAt = new Date().toISOString();

    if (status === "merged") {
        contributions[index].completedAt = new Date().toISOString();
        handleContributionSuccess(userId, contributions[index]);
    } else if (status === "abandoned") {
        contributions[index].completedAt = new Date().toISOString();
    }

    saveContributions(userId, contributions);
    return contributions[index];
}

/**
 * Update phase progress
 */
export function updatePhaseProgress(
    userId: string,
    contributionId: string,
    phaseId: string,
    update: Partial<PhaseProgress>
): Contribution | undefined {
    const contributions = getContributions(userId);
    const contribIndex = contributions.findIndex((c) => c.id === contributionId);
    if (contribIndex === -1) return undefined;

    const phaseIndex = contributions[contribIndex].phaseProgress.findIndex((p) => p.phaseId === phaseId);
    if (phaseIndex === -1) return undefined;

    const currentProgress = contributions[contribIndex].phaseProgress[phaseIndex];
    contributions[contribIndex].phaseProgress[phaseIndex] = {
        ...currentProgress,
        ...update,
    };

    // Update status based on tasks
    if (update.tasksCompleted !== undefined && update.tasksCompleted >= currentProgress.totalTasks) {
        contributions[contribIndex].phaseProgress[phaseIndex].status = "completed";
        contributions[contribIndex].phaseProgress[phaseIndex].completedAt = new Date().toISOString();

        // Start next phase if available
        if (phaseIndex < contributions[contribIndex].phaseProgress.length - 1) {
            contributions[contribIndex].phaseProgress[phaseIndex + 1].status = "in_progress";
            contributions[contribIndex].phaseProgress[phaseIndex + 1].startedAt = new Date().toISOString();
        }

        // Update overall status based on phase progression
        updateContributionStatusFromPhases(contributions[contribIndex]);
    }

    contributions[contribIndex].lastActivityAt = new Date().toISOString();
    saveContributions(userId, contributions);
    return contributions[contribIndex];
}

/**
 * Complete a task in a phase
 */
export function completeTask(
    userId: string,
    contributionId: string,
    phaseId: string,
    taskId: string
): Contribution | undefined {
    const contribution = getContribution(userId, contributionId);
    if (!contribution) return undefined;

    const phase = contribution.analyzedIssue.learningPath.phases.find((p) => p.id === phaseId);
    if (!phase) return undefined;

    const taskIndex = phase.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return undefined;

    // Mark task as completed in the analyzed issue (this is a reference update)
    phase.tasks[taskIndex].completed = true;

    // Update phase progress
    const phaseProgress = contribution.phaseProgress.find((p) => p.phaseId === phaseId);
    if (phaseProgress) {
        const completedCount = phase.tasks.filter((t) => t.completed).length;
        return updatePhaseProgress(userId, contributionId, phaseId, {
            tasksCompleted: completedCount,
        });
    }

    return contribution;
}

/**
 * Update contribution status based on phase progression
 */
function updateContributionStatusFromPhases(contribution: Contribution): void {
    const phases = contribution.phaseProgress;
    const currentPhaseIndex = phases.findIndex((p) => p.status === "in_progress");

    if (currentPhaseIndex === -1) {
        // All phases completed
        if (contribution.pullRequest) {
            contribution.status = "review_ready";
        }
        return;
    }

    const currentPhase = contribution.analyzedIssue.learningPath.phases[currentPhaseIndex];
    if (currentPhase) {
        switch (currentPhase.type) {
            case "exploration":
            case "learning":
                contribution.status = "exploring";
                break;
            case "implementation":
            case "planning":
            case "testing":
                contribution.status = "in_progress";
                break;
            case "review":
                contribution.status = "review_ready";
                break;
            case "refinement":
                contribution.status = "changes_requested";
                break;
        }
    }
}

// ============================================================================
// PULL REQUEST TRACKING
// ============================================================================

/**
 * Link a pull request to a contribution
 */
export function linkPullRequest(
    userId: string,
    contributionId: string,
    pullRequest: PullRequestInfo
): Contribution | undefined {
    const contributions = getContributions(userId);
    const index = contributions.findIndex((c) => c.id === contributionId);
    if (index === -1) return undefined;

    contributions[index].pullRequest = pullRequest;
    contributions[index].status = "review_ready";
    contributions[index].lastActivityAt = new Date().toISOString();

    saveContributions(userId, contributions);
    return contributions[index];
}

/**
 * Update pull request status
 */
export function updatePullRequest(
    userId: string,
    contributionId: string,
    update: Partial<PullRequestInfo>
): Contribution | undefined {
    const contributions = getContributions(userId);
    const index = contributions.findIndex((c) => c.id === contributionId);
    if (index === -1 || !contributions[index].pullRequest) return undefined;

    contributions[index].pullRequest = {
        ...contributions[index].pullRequest!,
        ...update,
    };

    // Update contribution status based on PR status
    if (update.state === "merged") {
        contributions[index].status = "merged";
        contributions[index].completedAt = new Date().toISOString();
        contributions[index].pullRequest!.mergedAt = new Date().toISOString();
        handleContributionSuccess(userId, contributions[index]);
    } else if (update.reviewStatus === "changes_requested") {
        contributions[index].status = "changes_requested";
    } else if (update.reviewStatus === "approved") {
        contributions[index].status = "approved";
    }

    contributions[index].lastActivityAt = new Date().toISOString();
    saveContributions(userId, contributions);
    return contributions[index];
}

// ============================================================================
// MENTORSHIP & AI ASSISTANCE
// ============================================================================

/**
 * Log a mentor session
 */
export function logMentorSession(
    userId: string,
    contributionId: string,
    session: Omit<MentorSession, "id">
): MentorSession {
    const fullSession: MentorSession = {
        ...session,
        id: `session-${Date.now()}`,
    };

    const contributions = getContributions(userId);
    const index = contributions.findIndex((c) => c.id === contributionId);
    if (index !== -1) {
        contributions[index].mentorSessions.push(fullSession);
        contributions[index].lastActivityAt = new Date().toISOString();
        saveContributions(userId, contributions);
    }

    return fullSession;
}

/**
 * Log AI assistance usage
 */
export function logAIAssistance(
    userId: string,
    contributionId: string,
    type: AIAssistanceType,
    context: string
): AIAssistanceLog {
    const log: AIAssistanceLog = {
        id: `ai-${Date.now()}`,
        type,
        context,
        timestamp: new Date().toISOString(),
    };

    const contributions = getContributions(userId);
    const index = contributions.findIndex((c) => c.id === contributionId);
    if (index !== -1) {
        contributions[index].aiAssistanceLog.push(log);
        contributions[index].lastActivityAt = new Date().toISOString();
        saveContributions(userId, contributions);
    }

    return log;
}

/**
 * Rate AI assistance helpfulness
 */
export function rateAIAssistance(
    userId: string,
    contributionId: string,
    logId: string,
    wasHelpful: boolean
): void {
    const contributions = getContributions(userId);
    const index = contributions.findIndex((c) => c.id === contributionId);
    if (index === -1) return;

    const logIndex = contributions[index].aiAssistanceLog.findIndex((l) => l.id === logId);
    if (logIndex !== -1) {
        contributions[index].aiAssistanceLog[logIndex].wasHelpful = wasHelpful;
        saveContributions(userId, contributions);
    }
}

// ============================================================================
// SUCCESS HANDLING & REWARDS
// ============================================================================

/**
 * Handle successful contribution (PR merged)
 */
function handleContributionSuccess(userId: string, contribution: Contribution): void {
    const outcome: ContributionOutcome = {
        success: true,
        skillsDemonstrated: contribution.analyzedIssue.requiredSkills.map((s) => s.name),
        githubContributionEarned: true,
    };

    // Determine badge based on contribution
    const badge = determineBadge(contribution);
    if (badge) {
        outcome.badgeEarned = badge;
    }

    // Check for certificate eligibility
    const certificate = checkCertificateEligibility(userId, contribution);
    if (certificate) {
        outcome.certificateEarned = certificate;
    }

    // Update contribution with outcome
    const contributions = getContributions(userId);
    const index = contributions.findIndex((c) => c.id === contribution.id);
    if (index !== -1) {
        contributions[index].outcome = outcome;
        saveContributions(userId, contributions);
    }

    // Update user stats
    updateStats(userId, {
        mergedPRs: 1,
        totalAdditions: contribution.pullRequest?.additions || 0,
        totalDeletions: contribution.pullRequest?.deletions || 0,
        skillsUsed: outcome.skillsDemonstrated,
    });

    if (badge) {
        addBadge(userId, badge);
    }
}

/**
 * Determine badge to award
 */
function determineBadge(contribution: Contribution): ContributionBadge | undefined {
    const repo = contribution.analyzedIssue.issue.repository;

    // First contribution badge
    const allContributions = getContributions(contribution.userId);
    const mergedCount = allContributions.filter((c) => c.status === "merged").length;

    if (mergedCount === 0) {
        return {
            id: `badge-first-${Date.now()}`,
            name: "First Contribution",
            description: "Made your first open-source contribution!",
            iconUrl: "/badges/first-contribution.svg",
            level: "bronze",
            earnedAt: new Date().toISOString(),
            repository: repo.fullName,
        };
    }

    // Popular repo badge
    if (repo.stars > 10000) {
        return {
            id: `badge-popular-${Date.now()}`,
            name: "Popular Project Contributor",
            description: `Contributed to a project with ${Math.round(repo.stars / 1000)}K+ stars`,
            iconUrl: "/badges/popular-project.svg",
            level: "gold",
            earnedAt: new Date().toISOString(),
            repository: repo.fullName,
        };
    }

    // Partner company badge
    if (repo.isPartner) {
        return {
            id: `badge-partner-${Date.now()}`,
            name: "Partner Contributor",
            description: "Contributed to a partner company's open-source project",
            iconUrl: "/badges/partner.svg",
            level: "silver",
            earnedAt: new Date().toISOString(),
            repository: repo.fullName,
        };
    }

    return undefined;
}

/**
 * Check certificate eligibility
 */
function checkCertificateEligibility(userId: string, contribution: Contribution): ContributionCertificate | undefined {
    const stats = getStats(userId);
    const repo = contribution.analyzedIssue.issue.repository;

    // Certificate for 5 merged PRs in same repo
    const repoContributions = getContributions(userId).filter(
        (c) => c.status === "merged" && c.analyzedIssue.issue.repository.fullName === repo.fullName
    );

    if (repoContributions.length >= 5) {
        return {
            id: `cert-${repo.name}-${Date.now()}`,
            title: `${repo.name} Contributor`,
            description: `Demonstrated consistent contribution to ${repo.fullName}`,
            skills: contribution.analyzedIssue.requiredSkills.map((s) => s.name),
            issuedAt: new Date().toISOString(),
            issuer: repo.owner,
            verificationUrl: `https://example.com/verify/${userId}/${repo.name}`,
            shareable: true,
        };
    }

    // Certificate for 10 total merged PRs
    if ((stats?.mergedPRs || 0) + 1 >= 10) {
        return {
            id: `cert-contributor-${Date.now()}`,
            title: "Open Source Contributor",
            description: "Completed 10 contributions to open-source projects",
            skills: stats?.skillsUsed || [],
            issuedAt: new Date().toISOString(),
            issuer: "Live Projects Platform",
            verificationUrl: `https://example.com/verify/${userId}/contributor`,
            shareable: true,
        };
    }

    return undefined;
}

// ============================================================================
// STATS & LEADERBOARD
// ============================================================================

/**
 * Get user stats
 */
export function getStats(userId: string): UserContributionStats | undefined {
    return getStorageItem<UserContributionStats>(`${STORAGE_KEYS.STATS}-${userId}`) || undefined;
}

/**
 * Update user stats
 */
function updateStats(
    userId: string,
    update: Partial<{
        totalContributions: number;
        mergedPRs: number;
        totalAdditions: number;
        totalDeletions: number;
        skillsUsed: string[];
        partnerContributions: number;
    }>
): void {
    const current = getStats(userId) || createEmptyStats(userId);

    if (update.totalContributions) {
        current.totalContributions += update.totalContributions;
    }
    if (update.mergedPRs) {
        current.mergedPRs += update.mergedPRs;
        current.repositoriesCount = getUniqueRepositoryCount(userId);
    }
    if (update.totalAdditions) {
        current.totalAdditions += update.totalAdditions;
    }
    if (update.totalDeletions) {
        current.totalDeletions += update.totalDeletions;
    }
    if (update.skillsUsed) {
        const skillSet = new Set([...current.skillsUsed, ...update.skillsUsed]);
        current.skillsUsed = Array.from(skillSet);
    }
    if (update.partnerContributions) {
        current.partnerContributions += update.partnerContributions;
    }

    // Update streak
    updateStreak(current);

    setStorageItem(`${STORAGE_KEYS.STATS}-${userId}`, current);

    // Update leaderboard
    updateLeaderboard(userId, current);
}

/**
 * Create empty stats
 */
function createEmptyStats(userId: string): UserContributionStats {
    return {
        userId,
        totalContributions: 0,
        mergedPRs: 0,
        repositoriesCount: 0,
        totalAdditions: 0,
        totalDeletions: 0,
        skillsUsed: [],
        badges: [],
        certificates: [],
        partnerContributions: 0,
        referralsReceived: 0,
        currentStreak: 0,
        longestStreak: 0,
    };
}

/**
 * Get unique repository count
 */
function getUniqueRepositoryCount(userId: string): number {
    const contributions = getContributions(userId);
    const repos = new Set(
        contributions
            .filter((c) => c.status === "merged")
            .map((c) => c.analyzedIssue.issue.repository.fullName)
    );
    return repos.size;
}

/**
 * Update contribution streak
 */
function updateStreak(stats: UserContributionStats): void {
    // Simple streak logic - would be more sophisticated in production
    stats.currentStreak = Math.min(stats.currentStreak + 1, 365);
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
}

/**
 * Add badge to user stats
 */
function addBadge(userId: string, badge: ContributionBadge): void {
    const stats = getStats(userId);
    if (stats) {
        stats.badges.push(badge);
        setStorageItem(`${STORAGE_KEYS.STATS}-${userId}`, stats);
    }
}

/**
 * Get leaderboard
 */
export function getLeaderboard(limit: number = 20): LeaderboardEntry[] {
    const leaderboard = getStorageItem<LeaderboardEntry[]>(STORAGE_KEYS.LEADERBOARD) || [];
    return leaderboard.slice(0, limit);
}

/**
 * Update leaderboard with user stats
 */
function updateLeaderboard(userId: string, stats: UserContributionStats): void {
    const leaderboard = getStorageItem<LeaderboardEntry[]>(STORAGE_KEYS.LEADERBOARD) || [];

    // Calculate points
    const points = calculatePoints(stats);

    // Find or create entry
    const existingIndex = leaderboard.findIndex((e) => e.userId === userId);
    const entry: LeaderboardEntry = {
        rank: 0, // Will be set after sorting
        userId,
        username: `user-${userId.slice(-6)}`, // Would come from user profile
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        mergedPRs: stats.mergedPRs,
        points,
        topSkills: stats.skillsUsed.slice(0, 3),
        featuredBadge: stats.badges[stats.badges.length - 1],
    };

    if (existingIndex !== -1) {
        leaderboard[existingIndex] = entry;
    } else {
        leaderboard.push(entry);
    }

    // Sort and assign ranks
    leaderboard.sort((a, b) => b.points - a.points);
    leaderboard.forEach((e, i) => {
        e.rank = i + 1;
    });

    // Keep top 100
    setStorageItem(STORAGE_KEYS.LEADERBOARD, leaderboard.slice(0, 100));
}

/**
 * Calculate leaderboard points
 */
function calculatePoints(stats: UserContributionStats): number {
    return (
        stats.mergedPRs * 100 +
        stats.badges.length * 50 +
        stats.certificates.length * 200 +
        stats.partnerContributions * 150 +
        stats.currentStreak * 10
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export const contributionStorage = {
    getContributions,
    getContribution,
    getStats,
    getLeaderboard,
};
