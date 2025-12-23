/**
 * Tier Analysis
 *
 * Functions for analyzing curriculum tiers and relationships.
 */

import type { GraphNode, GraphEdge, LearningDomainId, RelationshipType } from "../../learningPathGraph";
import type { ProgressionLevel } from "../../progressionCoordinate";
import type { TierStatistics, TierRelationship } from "../types";
import { getInDegree, getOutDegree } from "./graphHelpers";

export interface TierAnalysisParams {
    nodes: GraphNode[];
    edges: GraphEdge[];
    nodeMap: Map<LearningDomainId, GraphNode>;
    adjacencyList: Map<LearningDomainId, LearningDomainId[]>;
    reverseAdjacencyList: Map<LearningDomainId, LearningDomainId[]>;
}

/**
 * Compute statistics for each progression tier.
 */
export function computeTierStatistics({
    nodes,
    adjacencyList,
    reverseAdjacencyList,
}: TierAnalysisParams): TierStatistics[] {
    const levels: ProgressionLevel[] = [0, 1, 2, 3, 4];
    const stats: TierStatistics[] = [];

    for (const level of levels) {
        const nodesAtTier = nodes.filter((n) => n.progressionLevel === level);

        let incomingEdges = 0;
        let outgoingEdges = 0;

        for (const node of nodesAtTier) {
            incomingEdges += getInDegree(node.id, reverseAdjacencyList);
            outgoingEdges += getOutDegree(node.id, adjacencyList);
        }

        const nodeCount = nodesAtTier.length;
        const avgInDegree = nodeCount > 0 ? incomingEdges / nodeCount : 0;
        const avgOutDegree = nodeCount > 0 ? outgoingEdges / nodeCount : 0;

        const isConvergenceTier = avgInDegree > 1.5 && nodeCount > 0;
        const isDivergenceTier = avgOutDegree > 1.5 && nodeCount > 0;
        const isEntryTier = nodesAtTier.some((n) => n.isEntryPoint);

        stats.push({
            level,
            nodeCount,
            nodes: nodesAtTier,
            incomingEdges,
            outgoingEdges,
            avgInDegree,
            avgOutDegree,
            isEntryTier,
            isConvergenceTier,
            isDivergenceTier,
        });
    }

    return stats;
}

/**
 * Compute relationships between tiers.
 */
export function computeTierRelationships({
    edges,
    nodeMap,
}: TierAnalysisParams): TierRelationship[] {
    const relationships: TierRelationship[] = [];
    const edgesByTierPair = new Map<string, GraphEdge[]>();

    // Group edges by tier pairs
    for (const edge of edges) {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        if (!fromNode || !toNode) continue;

        const key = `${fromNode.progressionLevel}-${toNode.progressionLevel}`;
        if (!edgesByTierPair.has(key)) {
            edgesByTierPair.set(key, []);
        }
        edgesByTierPair.get(key)!.push(edge);
    }

    // Analyze each tier pair
    for (const [key, pairEdges] of edgesByTierPair) {
        const [fromTier, toTier] = key.split("-").map(Number) as [
            ProgressionLevel,
            ProgressionLevel
        ];

        // Find dominant relationship type
        const typeCounts = new Map<RelationshipType, number>();
        for (const edge of pairEdges) {
            typeCounts.set(edge.type, (typeCounts.get(edge.type) || 0) + 1);
        }

        let dominantType: RelationshipType = "builds-upon";
        let maxCount = 0;
        for (const [type, count] of typeCounts) {
            if (count > maxCount) {
                maxCount = count;
                dominantType = type;
            }
        }

        const direction =
            toTier > fromTier ? "up" : toTier < fromTier ? "down" : "same";

        relationships.push({
            fromTier,
            toTier,
            edgeCount: pairEdges.length,
            dominantRelationType: dominantType,
            direction,
            flowStrength: pairEdges.length / edges.length,
        });
    }

    return relationships;
}
