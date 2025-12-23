/**
 * Analytics Recalculation Functions
 *
 * Functions for recalculating user learning analytics.
 */

import type { LearningDomainId } from "@/app/shared/lib/learningDomains";
import type {
    UserLearningGraph,
    LearningStrategyProfile,
} from "../types";

/**
 * Recalculates analytics from the current graph state
 */
export function recalculateAnalytics(graph: UserLearningGraph): UserLearningGraph {
    const now = new Date().toISOString();
    const nodes = Object.values(graph.nodes);
    const paths = Object.values(graph.paths);

    // Basic counts
    const totalCompleted = nodes.filter((n) => n.status === "completed").length;
    const totalStarted = nodes.filter(
        (n) => n.status === "in_progress" || n.status === "completed"
    ).length;
    const totalTimeSpent = nodes.reduce((sum, n) => sum + n.timeSpentMinutes, 0);

    // Completion rate
    const completionRate = totalStarted > 0 ? totalCompleted / totalStarted : 0;

    // Average completion time
    const completedNodes = nodes.filter((n) => n.status === "completed");
    const avgCompletionTime =
        completedNodes.length > 0
            ? completedNodes.reduce((sum, n) => sum + n.timeSpentMinutes, 0) / completedNodes.length
            : 0;

    // Primary domain (most completed nodes)
    const domainCounts: Record<string, number> = {};
    paths.forEach((p) => {
        domainCounts[p.pathId] = p.completedNodes;
    });
    const primaryDomain = Object.entries(domainCounts).sort(([, a], [, b]) => b - a)[0]?.[0] as
        | LearningDomainId
        | undefined;

    // Prerequisite skip rate
    const skippedNodes = nodes.filter((n) => n.status === "skipped").length;
    const prerequisiteSkipRate = nodes.length > 0 ? skippedNodes / nodes.length : 0;

    // Paths explored (non-abandoned)
    const pathsExplored = paths.filter((p) => !p.isAbandoned).length;

    // Strategy profile
    const strategyProfile: LearningStrategyProfile = {
        depthVsBreadth: calculateDepthVsBreadth(graph),
        theoryVsPractice: 0.5,
        prerequisiteSkipRate,
        avgTimePerNode: avgCompletionTime,
        completionRate,
        pathsExplored,
        lastCalculatedAt: now,
    };

    // Skill gaps (bookmarked but not started)
    const skillGaps = nodes
        .filter((n) => n.status === "bookmarked")
        .map((n) => n.nodeId);

    // Recommendations (simple heuristic: unlocked nodes not yet started)
    const recommendedNodes = nodes
        .filter((n) => n.status === "unlocked")
        .map((n) => n.nodeId)
        .slice(0, 5);

    return {
        ...graph,
        analytics: {
            ...graph.analytics,
            totalCompleted,
            totalStarted,
            totalTimeSpent,
            avgCompletionTime,
            primaryDomain,
            strategyProfile,
            skillGaps,
            recommendedNodes,
        },
    };
}

/**
 * Calculates depth vs breadth preference (0 = breadth, 1 = depth)
 * Based on how focused the user is on a single path vs exploring many
 */
export function calculateDepthVsBreadth(graph: UserLearningGraph): number {
    const paths = Object.values(graph.paths).filter((p) => !p.isAbandoned);

    if (paths.length === 0) return 0.5;
    if (paths.length === 1) return 1;

    const totalProgress = paths.reduce((sum, p) => sum + p.progress, 0);
    if (totalProgress === 0) return 0.5;

    const maxProgress = Math.max(...paths.map((p) => p.progress));
    const concentration = maxProgress / totalProgress;

    return Math.min(1, concentration);
}
