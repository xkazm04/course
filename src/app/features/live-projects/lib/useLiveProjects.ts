/**
 * useLiveProjects Hook
 *
 * React hook for managing live project discovery, contributions, and progress tracking.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import type {
    AnalyzedIssue,
    Contribution,
    ContributionStatus,
    ProjectDiscoveryRequest,
    ProjectMatch,
    UserContributionStats,
    LeaderboardEntry,
    SkillLevel,
    AIAssistanceType,
    PullRequestInfo,
} from "./types";
import { discoverProjects, getPersonalizedRecommendations } from "./projectMatchingService";
import {
    startContribution,
    getContributions,
    getContribution,
    updateContributionStatus,
    updatePhaseProgress,
    completeTask,
    linkPullRequest,
    updatePullRequest,
    logMentorSession,
    logAIAssistance,
    rateAIAssistance,
    getStats,
    getLeaderboard,
} from "./contributionService";

// ============================================================================
// TYPES
// ============================================================================

export interface UseLiveProjectsOptions {
    userId: string;
    autoLoadContributions?: boolean;
    autoLoadStats?: boolean;
}

export interface UseLiveProjectsReturn {
    // Discovery
    isSearching: boolean;
    searchResults: ProjectMatch[];
    recommendations: {
        nextSteps: AnalyzedIssue[];
        stretchGoals: AnalyzedIssue[];
        partnerOpportunities: AnalyzedIssue[];
    } | null;
    discoverProjects: (request: Omit<ProjectDiscoveryRequest, "userSkills">) => Promise<void>;
    loadRecommendations: () => Promise<void>;

    // Active contributions
    contributions: Contribution[];
    activeContribution: Contribution | null;
    loadContributions: () => void;
    startNewContribution: (analyzedIssue: AnalyzedIssue) => Contribution;
    selectContribution: (contributionId: string) => void;

    // Progress tracking
    updateStatus: (status: ContributionStatus) => void;
    completePhaseTask: (phaseId: string, taskId: string) => void;
    linkPR: (pullRequest: PullRequestInfo) => void;
    updatePR: (update: Partial<PullRequestInfo>) => void;

    // Mentorship & AI
    logMentor: (
        type: "ai" | "human" | "community",
        focus: string,
        durationMinutes: number,
        takeaways: string[]
    ) => void;
    logAI: (type: AIAssistanceType, context: string) => string;
    rateAI: (logId: string, wasHelpful: boolean) => void;

    // Stats & Leaderboard
    stats: UserContributionStats | null;
    leaderboard: LeaderboardEntry[];
    loadStats: () => void;
    loadLeaderboard: () => void;

    // User skills (for matching)
    userSkills: { name: string; level: SkillLevel }[];
    setUserSkills: (skills: { name: string; level: SkillLevel }[]) => void;

    // Error handling
    error: string | null;
    clearError: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useLiveProjects(options: UseLiveProjectsOptions): UseLiveProjectsReturn {
    const { userId, autoLoadContributions = true, autoLoadStats = true } = options;

    // State
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<ProjectMatch[]>([]);
    const [recommendations, setRecommendations] = useState<{
        nextSteps: AnalyzedIssue[];
        stretchGoals: AnalyzedIssue[];
        partnerOpportunities: AnalyzedIssue[];
    } | null>(null);

    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [activeContribution, setActiveContribution] = useState<Contribution | null>(null);

    const [stats, setStats] = useState<UserContributionStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    const [userSkills, setUserSkills] = useState<{ name: string; level: SkillLevel }[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Load contributions on mount
    useEffect(() => {
        if (autoLoadContributions) {
            loadContributions();
        }
        if (autoLoadStats) {
            loadStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // ========================================================================
    // DISCOVERY FUNCTIONS
    // ========================================================================

    const discoverProjectsHandler = useCallback(
        async (request: Omit<ProjectDiscoveryRequest, "userSkills">) => {
            setIsSearching(true);
            setError(null);

            try {
                const fullRequest: ProjectDiscoveryRequest = {
                    ...request,
                    userSkills: userSkills.map((s) => ({
                        name: s.name,
                        level: s.level,
                        projectsCompleted: 0,
                    })),
                };

                const response = await discoverProjects(fullRequest);
                setSearchResults(response.matches);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to discover projects");
            } finally {
                setIsSearching(false);
            }
        },
        [userSkills]
    );

    const loadRecommendations = useCallback(async () => {
        setIsSearching(true);
        setError(null);

        try {
            const currentStats = getStats(userId);
            const completedCount = currentStats?.mergedPRs || 0;

            const recs = await getPersonalizedRecommendations(
                userSkills.map((s) => ({
                    name: s.name,
                    level: s.level,
                    projectsCompleted: 0,
                })),
                completedCount,
                "fullstack-developer" // Would come from user profile
            );

            setRecommendations(recs);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load recommendations");
        } finally {
            setIsSearching(false);
        }
    }, [userId, userSkills]);

    // ========================================================================
    // CONTRIBUTION FUNCTIONS
    // ========================================================================

    const loadContributions = useCallback(() => {
        const loaded = getContributions(userId);
        setContributions(loaded);

        // Set active contribution to most recent in-progress one
        const active = loaded.find(
            (c) => !["merged", "abandoned", "blocked"].includes(c.status)
        );
        if (active) {
            setActiveContribution(active);
        }
    }, [userId]);

    const startNewContribution = useCallback(
        (analyzedIssue: AnalyzedIssue): Contribution => {
            const contribution = startContribution(userId, analyzedIssue);
            setContributions((prev) => [...prev, contribution]);
            setActiveContribution(contribution);
            return contribution;
        },
        [userId]
    );

    const selectContribution = useCallback(
        (contributionId: string) => {
            const contribution = getContribution(userId, contributionId);
            if (contribution) {
                setActiveContribution(contribution);
            }
        },
        [userId]
    );

    // ========================================================================
    // PROGRESS FUNCTIONS
    // ========================================================================

    const updateStatus = useCallback(
        (status: ContributionStatus) => {
            if (!activeContribution) return;

            const updated = updateContributionStatus(userId, activeContribution.id, status);
            if (updated) {
                setActiveContribution(updated);
                setContributions((prev) =>
                    prev.map((c) => (c.id === updated.id ? updated : c))
                );

                // Refresh stats if contribution was completed
                if (status === "merged") {
                    loadStats();
                }
            }
        },
        [userId, activeContribution]
    );

    const completePhaseTask = useCallback(
        (phaseId: string, taskId: string) => {
            if (!activeContribution) return;

            const updated = completeTask(userId, activeContribution.id, phaseId, taskId);
            if (updated) {
                setActiveContribution(updated);
                setContributions((prev) =>
                    prev.map((c) => (c.id === updated.id ? updated : c))
                );
            }
        },
        [userId, activeContribution]
    );

    const linkPR = useCallback(
        (pullRequest: PullRequestInfo) => {
            if (!activeContribution) return;

            const updated = linkPullRequest(userId, activeContribution.id, pullRequest);
            if (updated) {
                setActiveContribution(updated);
                setContributions((prev) =>
                    prev.map((c) => (c.id === updated.id ? updated : c))
                );
            }
        },
        [userId, activeContribution]
    );

    const updatePR = useCallback(
        (update: Partial<PullRequestInfo>) => {
            if (!activeContribution) return;

            const updated = updatePullRequest(userId, activeContribution.id, update);
            if (updated) {
                setActiveContribution(updated);
                setContributions((prev) =>
                    prev.map((c) => (c.id === updated.id ? updated : c))
                );

                // Refresh stats if PR was merged
                if (update.state === "merged") {
                    loadStats();
                }
            }
        },
        [userId, activeContribution]
    );

    // ========================================================================
    // MENTORSHIP & AI FUNCTIONS
    // ========================================================================

    const logMentor = useCallback(
        (
            type: "ai" | "human" | "community",
            focus: string,
            durationMinutes: number,
            takeaways: string[]
        ) => {
            if (!activeContribution) return;

            logMentorSession(userId, activeContribution.id, {
                type,
                focus,
                startedAt: new Date().toISOString(),
                durationMinutes,
                takeaways,
                followUpActions: [],
            });

            // Refresh active contribution
            const updated = getContribution(userId, activeContribution.id);
            if (updated) {
                setActiveContribution(updated);
            }
        },
        [userId, activeContribution]
    );

    const logAI = useCallback(
        (type: AIAssistanceType, context: string): string => {
            if (!activeContribution) return "";

            const log = logAIAssistance(userId, activeContribution.id, type, context);

            // Refresh active contribution
            const updated = getContribution(userId, activeContribution.id);
            if (updated) {
                setActiveContribution(updated);
            }

            return log.id;
        },
        [userId, activeContribution]
    );

    const rateAI = useCallback(
        (logId: string, wasHelpful: boolean) => {
            if (!activeContribution) return;

            rateAIAssistance(userId, activeContribution.id, logId, wasHelpful);

            // Refresh active contribution
            const updated = getContribution(userId, activeContribution.id);
            if (updated) {
                setActiveContribution(updated);
            }
        },
        [userId, activeContribution]
    );

    // ========================================================================
    // STATS & LEADERBOARD FUNCTIONS
    // ========================================================================

    const loadStats = useCallback(() => {
        const loaded = getStats(userId);
        setStats(loaded || null);
    }, [userId]);

    const loadLeaderboard = useCallback(() => {
        const loaded = getLeaderboard(20);
        setLeaderboard(loaded);
    }, []);

    // ========================================================================
    // ERROR HANDLING
    // ========================================================================

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        // Discovery
        isSearching,
        searchResults,
        recommendations,
        discoverProjects: discoverProjectsHandler,
        loadRecommendations,

        // Active contributions
        contributions,
        activeContribution,
        loadContributions,
        startNewContribution,
        selectContribution,

        // Progress tracking
        updateStatus,
        completePhaseTask,
        linkPR,
        updatePR,

        // Mentorship & AI
        logMentor,
        logAI,
        rateAI,

        // Stats & Leaderboard
        stats,
        leaderboard,
        loadStats,
        loadLeaderboard,

        // User skills
        userSkills,
        setUserSkills,

        // Error handling
        error,
        clearError,
    };
}

export default useLiveProjects;
