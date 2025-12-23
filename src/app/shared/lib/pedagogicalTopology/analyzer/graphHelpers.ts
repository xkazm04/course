/**
 * Graph Helper Functions
 *
 * Utility functions for graph traversal and analysis.
 */

import type { GraphNode, GraphEdge, LearningDomainId } from "../../learningPathGraph";

/**
 * Build forward adjacency list from edges.
 */
export function buildAdjacencyList(
    nodes: GraphNode[],
    edges: GraphEdge[]
): Map<LearningDomainId, LearningDomainId[]> {
    const adj = new Map<LearningDomainId, LearningDomainId[]>();
    for (const node of nodes) {
        adj.set(node.id, []);
    }
    for (const edge of edges) {
        adj.get(edge.from)?.push(edge.to);
    }
    return adj;
}

/**
 * Build reverse adjacency list from edges.
 */
export function buildReverseAdjacencyList(
    nodes: GraphNode[],
    edges: GraphEdge[]
): Map<LearningDomainId, LearningDomainId[]> {
    const adj = new Map<LearningDomainId, LearningDomainId[]>();
    for (const node of nodes) {
        adj.set(node.id, []);
    }
    for (const edge of edges) {
        adj.get(edge.to)?.push(edge.from);
    }
    return adj;
}

/**
 * Get in-degree for a node.
 */
export function getInDegree(
    nodeId: LearningDomainId,
    reverseAdjacencyList: Map<LearningDomainId, LearningDomainId[]>
): number {
    return reverseAdjacencyList.get(nodeId)?.length ?? 0;
}

/**
 * Get out-degree for a node.
 */
export function getOutDegree(
    nodeId: LearningDomainId,
    adjacencyList: Map<LearningDomainId, LearningDomainId[]>
): number {
    return adjacencyList.get(nodeId)?.length ?? 0;
}

/**
 * Find nodes that serve as convergence targets (high in-degree) above current level.
 */
export function findConvergenceTargets(
    currentNode: LearningDomainId,
    nodes: GraphNode[],
    nodeMap: Map<LearningDomainId, GraphNode>,
    reverseAdjacencyList: Map<LearningDomainId, LearningDomainId[]>
): LearningDomainId[] {
    const targets: LearningDomainId[] = [];
    const currentLevel = nodeMap.get(currentNode)?.progressionLevel ?? 0;

    for (const node of nodes) {
        if (node.progressionLevel > currentLevel) {
            const inDegree = getInDegree(node.id, reverseAdjacencyList);
            if (inDegree >= 2) {
                targets.push(node.id);
            }
        }
    }

    return targets;
}
