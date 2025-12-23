/**
 * Conductor Storage
 *
 * Persistent storage for the AI Learning Conductor, handling learner profiles,
 * behavior data, collective insights, and peer solutions.
 */

import {
    createLocalStorage,
    createRecordStorage,
    generateId,
} from "@/app/shared/lib/storageFactory";
import type {
    LearnerProfile,
    SectionBehavior,
    BehaviorEvent,
    CollectiveInsight,
    PeerSolution,
    OrchestrationDecision,
    ConductorConfig,
    DEFAULT_LEARNER_PROFILE,
    DEFAULT_SECTION_BEHAVIOR,
    DEFAULT_CONDUCTOR_CONFIG,
} from "./conductorTypes";

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
    LEARNER_PROFILES: "conductor-learner-profiles",
    BEHAVIOR_EVENTS: "conductor-behavior-events",
    SECTION_BEHAVIORS: "conductor-section-behaviors",
    COLLECTIVE_INSIGHTS: "conductor-collective-insights",
    PEER_SOLUTIONS: "conductor-peer-solutions",
    ORCHESTRATION_DECISIONS: "conductor-decisions",
    CONFIG: "conductor-config",
} as const;

// ============================================================================
// Learner Profile Storage
// ============================================================================

interface LearnerProfilesData {
    profiles: Record<string, LearnerProfile>;
    lastUpdated: string;
}

const profileStorage = createLocalStorage<LearnerProfilesData>({
    storageKey: STORAGE_KEYS.LEARNER_PROFILES,
    getDefault: () => ({
        profiles: {},
        lastUpdated: new Date().toISOString(),
    }),
});

export const learnerProfileStorage = {
    getProfile: (userId: string, courseId: string): LearnerProfile | null => {
        const data = profileStorage.get();
        const key = `${userId}:${courseId}`;
        return data.profiles[key] || null;
    },

    saveProfile: (profile: LearnerProfile): void => {
        profileStorage.update((data) => {
            const key = `${profile.userId}:${profile.courseId}`;
            return {
                profiles: {
                    ...data.profiles,
                    [key]: { ...profile, lastUpdated: Date.now() },
                },
                lastUpdated: new Date().toISOString(),
            };
        });
    },

    updateProfile: (
        userId: string,
        courseId: string,
        updates: Partial<LearnerProfile>
    ): LearnerProfile | null => {
        const current = learnerProfileStorage.getProfile(userId, courseId);
        if (!current) return null;

        const updated = { ...current, ...updates, lastUpdated: Date.now() };
        learnerProfileStorage.saveProfile(updated);
        return updated;
    },

    getAllProfiles: (): LearnerProfile[] => {
        const data = profileStorage.get();
        return Object.values(data.profiles);
    },
};

// ============================================================================
// Behavior Events Storage (Rolling window)
// ============================================================================

interface BehaviorEventsData {
    events: BehaviorEvent[];
    maxEvents: number;
}

const behaviorEventsStorage = createLocalStorage<BehaviorEventsData>({
    storageKey: STORAGE_KEYS.BEHAVIOR_EVENTS,
    getDefault: () => ({
        events: [],
        maxEvents: 1000, // Keep last 1000 events
    }),
});

export const behaviorEventStorage = {
    addEvent: (event: Omit<BehaviorEvent, "id" | "timestamp">): BehaviorEvent => {
        const fullEvent: BehaviorEvent = {
            ...event,
            id: generateId(),
            timestamp: Date.now(),
        };

        behaviorEventsStorage.update((data) => {
            const events = [fullEvent, ...data.events].slice(0, data.maxEvents);
            return { ...data, events };
        });

        return fullEvent;
    },

    getEvents: (filter?: {
        userId?: string;
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
        type?: string;
        since?: number;
    }): BehaviorEvent[] => {
        const data = behaviorEventsStorage.get();
        let events = data.events;

        if (filter) {
            if (filter.userId) events = events.filter((e) => e.userId === filter.userId);
            if (filter.courseId) events = events.filter((e) => e.courseId === filter.courseId);
            if (filter.chapterId) events = events.filter((e) => e.chapterId === filter.chapterId);
            if (filter.sectionId) events = events.filter((e) => e.sectionId === filter.sectionId);
            if (filter.type) events = events.filter((e) => e.type === filter.type);
            if (filter.since) events = events.filter((e) => e.timestamp >= filter.since!);
        }

        return events;
    },

    clearEvents: (userId?: string): void => {
        if (userId) {
            behaviorEventsStorage.update((data) => ({
                ...data,
                events: data.events.filter((e) => e.userId !== userId),
            }));
        } else {
            behaviorEventsStorage.update((data) => ({ ...data, events: [] }));
        }
    },
};

// ============================================================================
// Section Behaviors Storage
// ============================================================================

interface SectionBehaviorsData {
    behaviors: Record<string, SectionBehavior>; // key: `userId:courseId:chapterId:sectionId`
}

const sectionBehaviorsStorage = createLocalStorage<SectionBehaviorsData>({
    storageKey: STORAGE_KEYS.SECTION_BEHAVIORS,
    getDefault: () => ({ behaviors: {} }),
});

export const sectionBehaviorStorage = {
    getKey: (userId: string, courseId: string, chapterId: string, sectionId: string): string =>
        `${userId}:${courseId}:${chapterId}:${sectionId}`,

    getBehavior: (
        userId: string,
        courseId: string,
        chapterId: string,
        sectionId: string
    ): SectionBehavior | null => {
        const data = sectionBehaviorsStorage.get();
        const key = sectionBehaviorStorage.getKey(userId, courseId, chapterId, sectionId);
        return data.behaviors[key] || null;
    },

    saveBehavior: (
        userId: string,
        courseId: string,
        chapterId: string,
        sectionId: string,
        behavior: SectionBehavior
    ): void => {
        const key = sectionBehaviorStorage.getKey(userId, courseId, chapterId, sectionId);
        sectionBehaviorsStorage.update((data) => ({
            behaviors: {
                ...data.behaviors,
                [key]: behavior,
            },
        }));
    },

    updateBehavior: (
        userId: string,
        courseId: string,
        chapterId: string,
        sectionId: string,
        updater: (current: SectionBehavior) => SectionBehavior
    ): SectionBehavior => {
        const current =
            sectionBehaviorStorage.getBehavior(userId, courseId, chapterId, sectionId) ||
            getDefaultSectionBehavior();
        const updated = updater(current);
        sectionBehaviorStorage.saveBehavior(userId, courseId, chapterId, sectionId, updated);
        return updated;
    },

    getAllForUser: (
        userId: string,
        courseId?: string,
        chapterId?: string
    ): Record<string, SectionBehavior> => {
        const data = sectionBehaviorsStorage.get();
        const filtered: Record<string, SectionBehavior> = {};

        for (const [key, behavior] of Object.entries(data.behaviors)) {
            const parts = key.split(":");
            if (parts[0] !== userId) continue;
            if (courseId && parts[1] !== courseId) continue;
            if (chapterId && parts[2] !== chapterId) continue;
            filtered[key] = behavior;
        }

        return filtered;
    },
};

// ============================================================================
// Collective Insights Storage
// ============================================================================

interface CollectiveInsightsData {
    insights: Record<string, CollectiveInsight>; // key: `courseId:chapterId:sectionId`
    lastAggregated: string;
}

const collectiveInsightsStorage = createLocalStorage<CollectiveInsightsData>({
    storageKey: STORAGE_KEYS.COLLECTIVE_INSIGHTS,
    getDefault: () => ({
        insights: {},
        lastAggregated: new Date().toISOString(),
    }),
});

export const collectiveInsightStorage = {
    getKey: (courseId: string, chapterId: string, sectionId: string): string =>
        `${courseId}:${chapterId}:${sectionId}`,

    getInsight: (
        courseId: string,
        chapterId: string,
        sectionId: string
    ): CollectiveInsight | null => {
        const data = collectiveInsightsStorage.get();
        const key = collectiveInsightStorage.getKey(courseId, chapterId, sectionId);
        return data.insights[key] || null;
    },

    saveInsight: (insight: CollectiveInsight): void => {
        const key = collectiveInsightStorage.getKey(
            insight.chapterId.split(":")[0] || "default",
            insight.chapterId,
            insight.sectionId
        );
        collectiveInsightsStorage.update((data) => ({
            insights: {
                ...data.insights,
                [key]: insight,
            },
            lastAggregated: new Date().toISOString(),
        }));
    },

    updateInsight: (
        courseId: string,
        chapterId: string,
        sectionId: string,
        updater: (current: CollectiveInsight | null) => CollectiveInsight
    ): CollectiveInsight => {
        const current = collectiveInsightStorage.getInsight(courseId, chapterId, sectionId);
        const updated = updater(current);
        collectiveInsightStorage.saveInsight(updated);
        return updated;
    },

    getAllInsights: (): CollectiveInsight[] => {
        const data = collectiveInsightsStorage.get();
        return Object.values(data.insights);
    },
};

// ============================================================================
// Peer Solutions Storage
// ============================================================================

interface PeerSolutionsData {
    solutions: PeerSolution[];
}

const peerSolutionsStorage = createLocalStorage<PeerSolutionsData>({
    storageKey: STORAGE_KEYS.PEER_SOLUTIONS,
    getDefault: () => ({ solutions: [] }),
});

export const peerSolutionStorage = {
    addSolution: (solution: Omit<PeerSolution, "id" | "createdAt">): PeerSolution => {
        const fullSolution: PeerSolution = {
            ...solution,
            id: generateId(),
            createdAt: Date.now(),
        };

        peerSolutionsStorage.update((data) => ({
            solutions: [fullSolution, ...data.solutions],
        }));

        return fullSolution;
    },

    getSolutions: (filter?: {
        sectionId?: string;
        chapterId?: string;
        questionId?: string;
        solutionType?: PeerSolution["solutionType"];
        minScore?: number;
    }): PeerSolution[] => {
        const data = peerSolutionsStorage.get();
        let solutions = data.solutions;

        if (filter) {
            if (filter.sectionId) solutions = solutions.filter((s) => s.sectionId === filter.sectionId);
            if (filter.chapterId) solutions = solutions.filter((s) => s.chapterId === filter.chapterId);
            if (filter.questionId) solutions = solutions.filter((s) => s.questionId === filter.questionId);
            if (filter.solutionType)
                solutions = solutions.filter((s) => s.solutionType === filter.solutionType);
            if (filter.minScore !== undefined)
                solutions = solutions.filter((s) => s.helpfulnessScore >= filter.minScore!);
        }

        // Sort by helpfulness score
        return solutions.sort((a, b) => b.helpfulnessScore - a.helpfulnessScore);
    },

    upvoteSolution: (solutionId: string): void => {
        peerSolutionsStorage.update((data) => ({
            solutions: data.solutions.map((s) =>
                s.id === solutionId
                    ? { ...s, upvotes: s.upvotes + 1, helpfulnessScore: s.helpfulnessScore + 0.1 }
                    : s
            ),
        }));
    },

    getTopSolutions: (sectionId: string, limit: number = 3): PeerSolution[] => {
        return peerSolutionStorage
            .getSolutions({ sectionId })
            .slice(0, limit);
    },
};

// ============================================================================
// Orchestration Decisions Storage
// ============================================================================

interface DecisionsData {
    decisions: OrchestrationDecision[];
}

const decisionsStorage = createLocalStorage<DecisionsData>({
    storageKey: STORAGE_KEYS.ORCHESTRATION_DECISIONS,
    getDefault: () => ({ decisions: [] }),
});

export const decisionStorage = {
    addDecision: (decision: Omit<OrchestrationDecision, "id" | "createdAt">): OrchestrationDecision => {
        const fullDecision: OrchestrationDecision = {
            ...decision,
            id: generateId(),
            createdAt: Date.now(),
        };

        decisionsStorage.update((data) => ({
            decisions: [fullDecision, ...data.decisions],
        }));

        return fullDecision;
    },

    getPendingDecisions: (sectionId?: string): OrchestrationDecision[] => {
        const data = decisionsStorage.get();
        let decisions = data.decisions.filter((d) => !d.executed);

        if (sectionId) {
            decisions = decisions.filter((d) => d.sectionId === sectionId);
        }

        return decisions.sort((a, b) => b.priority - a.priority);
    },

    executeDecision: (decisionId: string): void => {
        decisionsStorage.update((data) => ({
            decisions: data.decisions.map((d) =>
                d.id === decisionId ? { ...d, executed: true, executedAt: Date.now() } : d
            ),
        }));
    },

    dismissDecision: (decisionId: string): void => {
        decisionsStorage.update((data) => ({
            decisions: data.decisions.filter((d) => d.id !== decisionId),
        }));
    },

    getExecutedDecisions: (since?: number): OrchestrationDecision[] => {
        const data = decisionsStorage.get();
        let decisions = data.decisions.filter((d) => d.executed);

        if (since) {
            decisions = decisions.filter((d) => d.executedAt && d.executedAt >= since);
        }

        return decisions;
    },
};

// ============================================================================
// Config Storage
// ============================================================================

const configStorage = createLocalStorage<ConductorConfig>({
    storageKey: STORAGE_KEYS.CONFIG,
    getDefault: () => ({
        enableBehaviorTracking: true,
        enableAdaptiveOrdering: true,
        enableRemedialInjection: true,
        enablePeerSolutions: true,
        enableAcceleration: true,
        behaviorSampleRate: 1.0,
        minSamplesForDecision: 3,
        confidenceThreshold: 0.7,
        decisionCooldownMs: 30000,
    }),
});

export const conductorConfigStorage = {
    getConfig: (): ConductorConfig => configStorage.get(),
    saveConfig: (config: ConductorConfig): void => configStorage.save(config),
    updateConfig: (updates: Partial<ConductorConfig>): ConductorConfig => {
        return configStorage.update((current) => ({ ...current, ...updates }));
    },
    resetConfig: (): void => configStorage.clear(),
};

// ============================================================================
// Helper Functions
// ============================================================================

function getDefaultSectionBehavior(): SectionBehavior {
    return {
        timeSpent: 0,
        scrollDepth: 0,
        revisitCount: 0,
        completedAt: null,
        video: {
            pauseCount: 0,
            pauseTimestamps: [],
            replayCount: 0,
            replaySegments: [],
            seekCount: 0,
            speedChanges: [],
            averageSpeed: 1.0,
            watchDuration: 0,
            totalDuration: 0,
            completionPercentage: 0,
        },
        quiz: {
            attempts: 0,
            correctCount: 0,
            incorrectCount: 0,
            averageTimeToAnswer: 0,
            hintsUsed: 0,
            questionResults: [],
        },
        code: {
            errorCount: 0,
            errorTypes: {},
            successCount: 0,
            hintsRequested: 0,
            timeTillFirstSuccess: null,
            averageAttempts: 0,
            codeEdits: 0,
        },
    };
}

// ============================================================================
// Exports
// ============================================================================

export {
    getDefaultSectionBehavior,
    STORAGE_KEYS,
};
