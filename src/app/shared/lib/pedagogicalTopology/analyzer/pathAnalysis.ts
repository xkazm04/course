/**
 * Path Analysis
 *
 * Functions for analyzing path characteristics and patterns.
 */

import type { GraphNode, GraphEdge, LearningDomainId } from "../../learningPathGraph";
import type { PathCharacteristics, SequencePattern, TopologyMetrics } from "../types";
import { getOutDegree, getInDegree } from "./graphHelpers";

export interface PathAnalysisParams {
    nodes: GraphNode[];
    edges: GraphEdge[];
    nodeMap: Map<LearningDomainId, GraphNode>;
    adjacencyList: Map<LearningDomainId, LearningDomainId[]>;
    reverseAdjacencyList: Map<LearningDomainId, LearningDomainId[]>;
}

/**
 * Compute characteristics for the learning path.
 */
export function computePathCharacteristics(
    params: PathAnalysisParams,
    metrics: TopologyMetrics
): PathCharacteristics {
    const { nodes, edges, adjacencyList, reverseAdjacencyList } = params;

    const entryPoints = nodes
        .filter(
            (n) =>
                n.isEntryPoint ||
                !edges.some((e) => e.to === n.id && e.type === "prerequisite")
        )
        .map((n) => n.id);

    const terminalNodes = nodes
        .filter((n) => getOutDegree(n.id, adjacencyList) === 0)
        .map((n) => n.id);

    // Calculate max width (nodes at any single tier)
    const tierCounts = new Map<number, number>();
    for (const node of nodes) {
        const level = node.progressionLevel;
        tierCounts.set(level, (tierCounts.get(level) || 0) + 1);
    }
    const maxWidth = Math.max(...tierCounts.values(), 0);

    // Calculate depth
    const depth = new Set(nodes.map((n) => n.progressionLevel)).size;

    // Detect sequence pattern
    const sequencePattern = detectSequencePattern(
        nodes,
        adjacencyList,
        reverseAdjacencyList
    );

    // Check for backtracking
    const hasBacktracking = edges.some((e) => {
        const fromNode = params.nodeMap.get(e.from);
        const toNode = params.nodeMap.get(e.to);
        return (
            fromNode &&
            toNode &&
            toNode.progressionLevel < fromNode.progressionLevel
        );
    });

    // Calculate complexity score
    const complexityScore = calculateComplexityScore(metrics);

    return {
        pathId: "main",
        entryPoints,
        terminalNodes,
        nodeCount: nodes.length,
        depth,
        maxWidth,
        sequencePattern,
        hasBacktracking,
        complexityScore,
    };
}

/**
 * Detect the sequence pattern type.
 */
export function detectSequencePattern(
    nodes: GraphNode[],
    adjacencyList: Map<LearningDomainId, LearningDomainId[]>,
    reverseAdjacencyList: Map<LearningDomainId, LearningDomainId[]>
): SequencePattern {
    let mergePoints = 0;
    let branchPoints = 0;

    for (const node of nodes) {
        const inDeg = getInDegree(node.id, reverseAdjacencyList);
        const outDeg = getOutDegree(node.id, adjacencyList);

        if (inDeg >= 2) mergePoints++;
        if (outDeg >= 2) branchPoints++;
    }

    if (mergePoints === 0 && branchPoints === 0) {
        return "linear";
    } else if (mergePoints > 0 && branchPoints > 0) {
        if (mergePoints === 1 && branchPoints === 1) {
            return "diamond";
        }
        return "dag";
    } else if (branchPoints > 0 && mergePoints === 0) {
        return "tree";
    } else if (mergePoints > 0 && branchPoints === 0) {
        return "merging";
    }

    return "dag";
}

/**
 * Calculate complexity score (1-10).
 */
export function calculateComplexityScore(metrics: TopologyMetrics): number {
    const factors = [
        metrics.totalNodes / 10,
        metrics.totalEdges / 10,
        metrics.convergenceRatio * 3,
        metrics.divergenceRatio * 3,
        (metrics.longestPathLength - metrics.shortestPathLength) / 2,
    ];

    const score = Math.min(10, Math.max(1, factors.reduce((a, b) => a + b, 0)));
    return Math.round(score * 10) / 10;
}
