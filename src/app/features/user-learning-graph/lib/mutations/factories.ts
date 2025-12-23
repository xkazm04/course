/**
 * Graph Factory Functions
 *
 * Factory functions for creating graph entities.
 */

import type { LearningDomainId } from "@/app/shared/lib/learningDomains";
import type {
    UserLearningGraph,
    UserNodeState,
    UserPathBranch,
    UserNodeStatus,
    UserLearningAnalytics,
    LearningStrategyProfile,
} from "../types";

/**
 * Creates a new empty user learning graph
 */
export function createUserLearningGraph(userId: string): UserLearningGraph {
    const now = new Date().toISOString();

    return {
        userId,
        version: "1.0.0",
        createdAt: now,
        lastModifiedAt: now,
        nodes: {},
        paths: {} as Record<LearningDomainId, UserPathBranch>,
        mutationHistory: [],
        analytics: createDefaultAnalytics(),
        preferences: {
            showSkippedPrerequisites: true,
            autoUnlockNodes: true,
            autoTrackTime: true,
            maxHistorySize: 1000,
        },
    };
}

/**
 * Creates default analytics object
 */
export function createDefaultAnalytics(): UserLearningAnalytics {
    return {
        totalCompleted: 0,
        totalStarted: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        avgCompletionTime: 0,
        primaryDomain: undefined,
        strategyProfile: createDefaultStrategyProfile(),
        skillGaps: [],
        recommendedNodes: [],
    };
}

/**
 * Creates default strategy profile
 */
export function createDefaultStrategyProfile(): LearningStrategyProfile {
    return {
        depthVsBreadth: 0.5,
        theoryVsPractice: 0.5,
        prerequisiteSkipRate: 0,
        avgTimePerNode: 0,
        completionRate: 0,
        pathsExplored: 0,
        lastCalculatedAt: new Date().toISOString(),
    };
}

/**
 * Creates a new node state entry
 */
export function createNodeState(
    nodeId: string,
    status: UserNodeStatus,
    isExplicit: boolean
): UserNodeState {
    return {
        nodeId,
        status,
        firstInteractionAt: new Date().toISOString(),
        progress: status === "completed" ? 100 : 0,
        timeSpentMinutes: 0,
        visitCount: 1,
        isExplicitSelection: isExplicit,
    };
}

/**
 * Creates a new path branch entry
 */
export function createPathBranch(
    pathId: LearningDomainId,
    isPrimary: boolean
): UserPathBranch {
    const now = new Date().toISOString();
    return {
        pathId,
        selectedAt: now,
        isPrimary,
        progress: 0,
        completedNodes: 0,
        totalNodes: 0,
        isAbandoned: false,
        lastActivityAt: now,
    };
}
