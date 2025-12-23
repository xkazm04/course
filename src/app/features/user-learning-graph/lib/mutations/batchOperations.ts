/**
 * Batch Operation Functions
 *
 * Functions for batch operations on the user learning graph.
 */

import type { LearningDomainId } from "@/app/shared/lib/learningDomains";
import type { UserLearningGraph } from "../types";
import { completeNode, startNode } from "./nodeMutations";

/**
 * Batch complete multiple nodes
 */
export function batchCompleteNodes(
    graph: UserLearningGraph,
    nodeIds: string[],
    options: { pathId?: LearningDomainId; source?: string } = {}
): UserLearningGraph {
    return nodeIds.reduce(
        (g, nodeId) => completeNode(g, nodeId, options),
        graph
    );
}

/**
 * Batch start multiple nodes
 */
export function batchStartNodes(
    graph: UserLearningGraph,
    nodeIds: string[],
    options: { pathId?: LearningDomainId; source?: string } = {}
): UserLearningGraph {
    return nodeIds.reduce(
        (g, nodeId) => startNode(g, nodeId, options),
        graph
    );
}

/**
 * Imports graph data (for restore/sync)
 */
export function importGraph(
    existingGraph: UserLearningGraph,
    importData: Partial<UserLearningGraph>,
    options: { merge?: boolean } = {}
): UserLearningGraph {
    const { merge = false } = options;
    const now = new Date().toISOString();

    if (!merge) {
        return {
            ...existingGraph,
            ...importData,
            lastModifiedAt: now,
        };
    }

    // Merge nodes (new data wins on conflicts)
    const mergedNodes = {
        ...existingGraph.nodes,
        ...(importData.nodes ?? {}),
    };

    // Merge paths (new data wins on conflicts)
    const mergedPaths = {
        ...existingGraph.paths,
        ...(importData.paths ?? {}),
    };

    // Merge mutation history
    const mergedHistory = [
        ...existingGraph.mutationHistory,
        ...(importData.mutationHistory ?? []),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
        ...existingGraph,
        nodes: mergedNodes,
        paths: mergedPaths,
        mutationHistory: mergedHistory,
        lastModifiedAt: now,
    };
}
