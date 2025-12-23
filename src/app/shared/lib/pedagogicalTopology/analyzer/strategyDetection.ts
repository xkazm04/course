/**
 * Strategy Detection
 *
 * Functions for detecting teaching strategies from graph topology.
 */

import type { GraphNode, LearningDomainId } from "../../learningPathGraph";
import type { ProgressionLevel } from "../../progressionCoordinate";
import type {
    TeachingStrategy,
    StructureCharacteristic,
    TierStatistics,
    TopologyMetrics,
} from "../types";
import { getInDegree, getOutDegree } from "./graphHelpers";

export interface StrategyDetectionParams {
    nodes: GraphNode[];
    adjacencyList: Map<LearningDomainId, LearningDomainId[]>;
    reverseAdjacencyList: Map<LearningDomainId, LearningDomainId[]>;
}

/**
 * Detect structure characteristics from tier statistics and metrics.
 */
export function detectStructureCharacteristics(
    tierStats: TierStatistics[],
    metrics: TopologyMetrics,
    params: StrategyDetectionParams
): StructureCharacteristic[] {
    const { nodes, adjacencyList, reverseAdjacencyList } = params;
    const characteristics: StructureCharacteristic[] = [];

    // Foundational breadth: many tier-0 and tier-1 nodes
    const foundationNodes =
        (metrics.tierDistribution[0] || 0) + (metrics.tierDistribution[1] || 0);
    const advancedNodes =
        (metrics.tierDistribution[3] || 0) + (metrics.tierDistribution[4] || 0);

    if (foundationNodes >= nodes.length * 0.4) {
        characteristics.push("foundational-breadth");
    }

    // Skill convergence: edges merging at mid-tiers
    const midTierStats = tierStats.find((s) => s.level === 2);
    if (midTierStats && midTierStats.isConvergenceTier) {
        characteristics.push("skill-convergence");
    }

    // Specialization divergence: edges branching at high tiers
    const highTierStats = tierStats.filter(
        (s) => s.level >= 3 && s.isDivergenceTier
    );
    if (highTierStats.length > 0) {
        characteristics.push("specialization-divergence");
    }

    // Balance analysis
    const variance = calculateTierVariance(metrics.tierDistribution);
    if (variance < 1) {
        characteristics.push("balanced-hierarchy");
    } else if (advancedNodes > foundationNodes) {
        characteristics.push("top-heavy");
    } else if (foundationNodes > advancedNodes * 2) {
        characteristics.push("bottom-heavy");
    }

    // Hub-and-spoke detection
    const hubNode = nodes.find((n) => {
        const inDeg = getInDegree(n.id, reverseAdjacencyList);
        const outDeg = getOutDegree(n.id, adjacencyList);
        return inDeg + outDeg >= nodes.length - 1;
    });
    if (hubNode) {
        characteristics.push("hub-and-spoke");
    }

    return characteristics;
}

/**
 * Calculate variance in tier distribution.
 */
export function calculateTierVariance(
    distribution: Record<ProgressionLevel, number>
): number {
    const values = Object.values(distribution).filter((v) => v > 0);
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
}

/**
 * Detect teaching strategy from characteristics and metrics.
 */
export function detectTeachingStrategy(
    characteristics: StructureCharacteristic[],
    tierStats: TierStatistics[],
    metrics: TopologyMetrics
): {
    primaryStrategy: TeachingStrategy;
    secondaryStrategies: TeachingStrategy[];
    confidence: number;
} {
    const scores: Record<TeachingStrategy, number> = {
        "breadth-first": 0,
        "depth-first": 0,
        spiral: 0,
        "mastery-based": 0,
        exploratory: 0,
        convergent: 0,
        divergent: 0,
        hybrid: 0,
    };

    // Score based on characteristics
    if (characteristics.includes("foundational-breadth")) {
        scores["breadth-first"] += 3;
    }

    if (characteristics.includes("skill-convergence")) {
        scores.convergent += 3;
    }

    if (characteristics.includes("specialization-divergence")) {
        scores.divergent += 3;
    }

    if (characteristics.includes("hub-and-spoke")) {
        scores.exploratory += 2;
    }

    // Score based on metrics
    if (metrics.entryPointCount >= 2) {
        scores.exploratory += 2;
    }

    if (metrics.edgeTypeDistribution.prerequisite > metrics.totalEdges * 0.4) {
        scores["mastery-based"] += 3;
    }

    if (metrics.convergenceRatio > 0.3) {
        scores.convergent += 2;
    }

    if (metrics.divergenceRatio > 0.3) {
        scores.divergent += 2;
    }

    if (
        metrics.longestPathLength > metrics.shortestPathLength * 2 &&
        metrics.totalNodes > 5
    ) {
        scores["depth-first"] += 2;
    }

    // Find primary and secondary strategies
    const sortedStrategies = (
        Object.entries(scores) as [TeachingStrategy, number][]
    ).sort((a, b) => b[1] - a[1]);

    const primaryStrategy = sortedStrategies[0][0];
    const primaryScore = sortedStrategies[0][1];

    const secondaryStrategies = sortedStrategies
        .slice(1)
        .filter(([_, score]) => score >= primaryScore * 0.5)
        .map(([strategy]) => strategy);

    // If multiple high-scoring strategies, mark as hybrid
    if (secondaryStrategies.length >= 2 && primaryScore < 5) {
        return {
            primaryStrategy: "hybrid",
            secondaryStrategies: [primaryStrategy, ...secondaryStrategies],
            confidence: 0.6,
        };
    }

    // Calculate confidence
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence =
        totalScore > 0 ? Math.min(0.95, primaryScore / totalScore + 0.3) : 0.5;

    return {
        primaryStrategy,
        secondaryStrategies,
        confidence,
    };
}
