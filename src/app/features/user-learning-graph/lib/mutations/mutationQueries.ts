/**
 * Mutation Query Functions
 *
 * Functions for querying and aggregating mutations.
 */

import type { LearningDomainId } from "@/app/shared/lib/learningDomains";
import type {
    UserLearningGraph,
    GraphMutation,
    GraphMutationType,
    MutationQueryOptions,
    MutationAggregation,
} from "../types";

/**
 * Query mutations from history
 */
export function queryMutations(
    graph: UserLearningGraph,
    options: MutationQueryOptions = {}
): GraphMutation[] {
    let mutations = [...graph.mutationHistory];

    // Filter by type
    if (options.types && options.types.length > 0) {
        mutations = mutations.filter((m) => options.types!.includes(m.type));
    }

    // Filter by nodeId
    if (options.nodeId) {
        mutations = mutations.filter((m) => m.nodeId === options.nodeId);
    }

    // Filter by pathId
    if (options.pathId) {
        mutations = mutations.filter((m) => m.pathId === options.pathId);
    }

    // Filter by date range
    if (options.dateRange) {
        const start = new Date(options.dateRange.start).getTime();
        const end = new Date(options.dateRange.end).getTime();
        mutations = mutations.filter((m) => {
            const ts = new Date(m.timestamp).getTime();
            return ts >= start && ts <= end;
        });
    }

    // Sort
    const sortOrder = options.sortOrder ?? "desc";
    mutations.sort((a, b) => {
        const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        return sortOrder === "asc" ? diff : -diff;
    });

    // Limit
    if (options.limit && options.limit > 0) {
        mutations = mutations.slice(0, options.limit);
    }

    return mutations;
}

/**
 * Aggregate mutations for analytics
 */
export function aggregateMutations(graph: UserLearningGraph): MutationAggregation {
    const mutations = graph.mutationHistory;

    if (mutations.length === 0) {
        return {
            totalCount: 0,
            byType: {} as Record<GraphMutationType, number>,
            byPath: {} as Record<LearningDomainId, number>,
            mostCommonType: "path_selected",
            firstMutationAt: "",
            lastMutationAt: "",
        };
    }

    // Count by type
    const byType = mutations.reduce(
        (acc, m) => {
            acc[m.type] = (acc[m.type] || 0) + 1;
            return acc;
        },
        {} as Record<GraphMutationType, number>
    );

    // Count by path
    const byPath = mutations.reduce(
        (acc, m) => {
            if (m.pathId) {
                acc[m.pathId] = (acc[m.pathId] || 0) + 1;
            }
            return acc;
        },
        {} as Record<LearningDomainId, number>
    );

    // Find most common type
    let mostCommonType: GraphMutationType = "path_selected";
    let maxCount = 0;
    Object.entries(byType).forEach(([type, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mostCommonType = type as GraphMutationType;
        }
    });

    return {
        totalCount: mutations.length,
        byType,
        byPath,
        mostCommonType,
        firstMutationAt: mutations[0].timestamp,
        lastMutationAt: mutations[mutations.length - 1].timestamp,
    };
}
