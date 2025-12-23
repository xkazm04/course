/**
 * Metrics Computation
 *
 * Functions for computing topology metrics.
 */

import type { GraphNode, GraphEdge, LearningDomainId, RelationshipType } from "../../learningPathGraph";
import type { ProgressionLevel } from "../../progressionCoordinate";
import type { TopologyMetrics } from "../types";
import { getInDegree, getOutDegree } from "./graphHelpers";

export interface ComputeMetricsParams {
    nodes: GraphNode[];
    edges: GraphEdge[];
    adjacencyList: Map<LearningDomainId, LearningDomainId[]>;
    reverseAdjacencyList: Map<LearningDomainId, LearningDomainId[]>;
}

/**
 * Compute comprehensive topology metrics.
 */
export function computeMetrics({
    nodes,
    edges,
    adjacencyList,
    reverseAdjacencyList,
}: ComputeMetricsParams): TopologyMetrics {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const maxPossibleEdges = totalNodes * (totalNodes - 1);
    const density = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;

    let totalInDegree = 0;
    let totalOutDegree = 0;
    let entryPointCount = 0;
    let terminalCount = 0;

    for (const node of nodes) {
        const inDeg = getInDegree(node.id, reverseAdjacencyList);
        const outDeg = getOutDegree(node.id, adjacencyList);
        totalInDegree += inDeg;
        totalOutDegree += outDeg;

        const hasPrerequisiteIn = edges.some(
            (e) => e.to === node.id && e.type === "prerequisite"
        );
        if (!hasPrerequisiteIn && node.isEntryPoint) {
            entryPointCount++;
        }

        if (outDeg === 0) {
            terminalCount++;
        }
    }

    const avgInDegree = totalNodes > 0 ? totalInDegree / totalNodes : 0;
    const avgOutDegree = totalNodes > 0 ? totalOutDegree / totalNodes : 0;

    // Tier distribution
    const tierDistribution: Record<ProgressionLevel, number> = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
    };
    for (const node of nodes) {
        tierDistribution[node.progressionLevel]++;
    }

    // Edge type distribution
    const edgeTypeDistribution: Record<RelationshipType, number> = {
        prerequisite: 0,
        "builds-upon": 0,
        complements: 0,
        specializes: 0,
        enables: 0,
    };
    for (const edge of edges) {
        edgeTypeDistribution[edge.type]++;
    }

    // Convergence and divergence
    let convergentEdges = 0;
    let divergentEdges = 0;

    for (const node of nodes) {
        const inDeg = getInDegree(node.id, reverseAdjacencyList);
        const outDeg = getOutDegree(node.id, adjacencyList);

        if (inDeg >= 2) {
            convergentEdges += inDeg;
        }
        if (outDeg >= 2) {
            divergentEdges += outDeg;
        }
    }

    const convergenceRatio = totalEdges > 0 ? convergentEdges / totalEdges : 0;
    const divergenceRatio = totalEdges > 0 ? divergentEdges / totalEdges : 0;

    const { longest, shortest } = computePathLengths(
        nodes,
        edges,
        adjacencyList
    );

    return {
        totalNodes,
        totalEdges,
        density,
        avgInDegree,
        avgOutDegree,
        entryPointCount,
        terminalCount,
        longestPathLength: longest,
        shortestPathLength: shortest,
        convergenceRatio,
        divergenceRatio,
        tierDistribution,
        edgeTypeDistribution,
    };
}

/**
 * Compute longest and shortest path lengths using BFS.
 */
export function computePathLengths(
    nodes: GraphNode[],
    edges: GraphEdge[],
    adjacencyList: Map<LearningDomainId, LearningDomainId[]>
): { longest: number; shortest: number } {
    const entryPoints = nodes.filter(
        (n) =>
            n.isEntryPoint ||
            !edges.some((e) => e.to === n.id && e.type === "prerequisite")
    );

    const terminals = nodes.filter(
        (n) => (adjacencyList.get(n.id)?.length ?? 0) === 0
    );

    if (entryPoints.length === 0 || terminals.length === 0) {
        return { longest: 0, shortest: 0 };
    }

    let longest = 0;
    let shortest = Infinity;

    for (const entry of entryPoints) {
        const distances = new Map<LearningDomainId, number>();
        const queue: LearningDomainId[] = [entry.id];
        distances.set(entry.id, 0);

        while (queue.length > 0) {
            const current = queue.shift()!;
            const currentDist = distances.get(current)!;
            const neighbors = adjacencyList.get(current) || [];

            for (const neighbor of neighbors) {
                if (!distances.has(neighbor)) {
                    distances.set(neighbor, currentDist + 1);
                    queue.push(neighbor);
                }
            }
        }

        for (const terminal of terminals) {
            const dist = distances.get(terminal.id);
            if (dist !== undefined) {
                longest = Math.max(longest, dist);
                shortest = Math.min(shortest, dist);
            }
        }
    }

    return {
        longest,
        shortest: shortest === Infinity ? 0 : shortest,
    };
}
