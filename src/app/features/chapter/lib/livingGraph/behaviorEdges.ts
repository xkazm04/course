/**
 * Behavior Edge Weight Computation
 *
 * Computes edge weights from collective intelligence data.
 * These weights represent the "difficulty" of traversing from one node to another
 * based on observed learner behavior patterns.
 */

import type { ChapterNodeId } from "../chapterGraph";
import type { CurriculumEdge } from "@/app/shared/lib/learningPathGraph";
import type { CollectiveInsight } from "../conductorTypes";
import type { ImplicitPrerequisite, StrugglePoint } from "../collectiveIntelligence";
import type {
    BehaviorEdgeWeight,
    LivingEdge,
    LivingGraphConfig,
} from "./types";
import { CHAPTER_CURRICULUM_EDGES, getChapterNode } from "../curriculumChapters";

// ============================================================================
// EDGE WEIGHT COMPUTATION
// ============================================================================

/**
 * Compute behavior weight for an edge.
 *
 * The weight combines:
 * - Success rate difference (with vs without prerequisite)
 * - Average time factor
 * - Drop-off rate at target
 * - Retry rate at target
 */
export function computeBehaviorEdgeWeight(
    edge: CurriculumEdge,
    implicitPrerequisites: ImplicitPrerequisite[],
    collectiveInsights: Map<ChapterNodeId, CollectiveInsight>,
    strugglePoints: StrugglePoint[],
    config: LivingGraphConfig
): BehaviorEdgeWeight | null {
    // Find implicit prerequisite data for this edge
    const implicitPrereq = implicitPrerequisites.find(
        (p) =>
            p.prerequisiteChapterId === edge.from &&
            p.dependentChapterId === edge.to
    );

    // Get target node insight
    const targetInsight = collectiveInsights.get(edge.to);
    const targetStrugglePoints = strugglePoints.filter(
        (sp) => sp.chapterId === edge.to
    );

    // If no behavior data, return null
    if (!implicitPrereq && !targetInsight && targetStrugglePoints.length === 0) {
        return null;
    }

    // Compute individual metrics
    let successRateWithPrereq = 0.7; // Default
    let successRateWithoutPrereq = 0.5; // Default
    let sampleSize = 0;

    if (implicitPrereq) {
        successRateWithPrereq = implicitPrereq.evidence.successRateWithPrereq;
        successRateWithoutPrereq = implicitPrereq.evidence.successRateWithoutPrereq;
        sampleSize =
            implicitPrereq.evidence.learnersWithPrereq +
            implicitPrereq.evidence.learnersWithoutPrereq;
    }

    // Skip if sample size too small
    if (sampleSize < config.minSampleSize && !targetInsight) {
        return null;
    }

    // Compute struggle score
    let struggleScore = 0;
    if (targetInsight) {
        struggleScore += targetInsight.dropoffRate * 0.4;
        if (targetInsight.strugglePoints.length > 0) {
            const avgPause =
                targetInsight.strugglePoints.reduce((sum, sp) => sum + sp.pauseFrequency, 0) /
                targetInsight.strugglePoints.length;
            struggleScore += Math.min(1, avgPause / 5) * 0.3;
        }
        if (targetInsight.commonErrors.length > 0) {
            struggleScore += Math.min(1, targetInsight.commonErrors.length / 5) * 0.3;
        }
    }

    if (targetStrugglePoints.length > 0) {
        const avgSeverity =
            targetStrugglePoints.reduce((sum, sp) => sum + sp.severity, 0) /
            targetStrugglePoints.length;
        struggleScore = (struggleScore + avgSeverity) / 2;
    }

    // Compute time factor
    let avgTimeFactor = 1.0;
    if (targetInsight && targetInsight.medianTimeSpent > 0) {
        avgTimeFactor = targetInsight.averageTimeSpent / targetInsight.medianTimeSpent;
    }

    // Compute drop-off rate
    const dropOffRate = targetInsight?.dropoffRate ?? 0.1;

    // Compute retry rate
    let retryRate = 0;
    if (targetStrugglePoints.length > 0) {
        const avgRetries =
            targetStrugglePoints.reduce(
                (sum, sp) => sum + (sp.affectedPercentage * 2), // Rough estimate
                0
            ) / targetStrugglePoints.length;
        retryRate = avgRetries;
    }

    // Compute confidence
    const confidence = computeEdgeConfidence(sampleSize, targetInsight, config);

    return {
        edgeId: `${edge.from}->${edge.to}`,
        from: edge.from,
        to: edge.to,
        struggleScore,
        successRateWithPrereq,
        successRateWithoutPrereq,
        avgTimeFactor,
        dropOffRate,
        retryRate,
        confidence,
        sampleSize: Math.max(sampleSize, targetInsight ? 1 : 0),
        lastUpdated: Date.now(),
    };
}

/**
 * Compute confidence in edge weight based on data availability.
 */
function computeEdgeConfidence(
    sampleSize: number,
    targetInsight: CollectiveInsight | undefined,
    config: LivingGraphConfig
): number {
    let confidence = 0;

    // Sample size contribution
    const sampleConfidence = Math.min(1, sampleSize / (config.minSampleSize * 3));
    confidence += sampleConfidence * 0.5;

    // Target insight contribution
    if (targetInsight) {
        confidence += 0.3;

        // More data points = higher confidence
        if (targetInsight.strugglePoints.length > 0) {
            confidence += 0.1;
        }
        if (targetInsight.commonErrors.length > 0) {
            confidence += 0.1;
        }
    }

    return Math.min(1, confidence);
}

// ============================================================================
// LIVING EDGE CREATION
// ============================================================================

/**
 * Create a living edge from a static edge with behavior weight.
 */
export function createLivingEdge(
    staticEdge: CurriculumEdge,
    behaviorWeight: BehaviorEdgeWeight | null
): LivingEdge {
    // Compute combined weight
    let combinedWeight = staticEdge.weight;

    if (behaviorWeight) {
        // Success rate improvement indicates strong prerequisite relationship
        const successImprovement =
            behaviorWeight.successRateWithPrereq -
            behaviorWeight.successRateWithoutPrereq;

        // Higher improvement = stronger edge (higher weight)
        const behaviorBonus = successImprovement * 2; // Scale to similar range as static weight

        // Blend static and behavior weights
        const behaviorInfluence = behaviorWeight.confidence;
        combinedWeight =
            staticEdge.weight * (1 - behaviorInfluence * 0.5) +
            (staticEdge.weight + behaviorBonus) * (behaviorInfluence * 0.5);
    }

    return {
        from: staticEdge.from as ChapterNodeId,
        to: staticEdge.to as ChapterNodeId,
        type: staticEdge.type,
        weight: staticEdge.weight,
        label: staticEdge.label,
        isIntraChapter: false, // CurriculumEdge doesn't have this
        behaviorWeight: behaviorWeight ?? undefined,
        combinedWeight,
        isEmergent: false,
    };
}

/**
 * Create an emergent edge from implicit prerequisite data.
 */
export function createEmergentEdge(
    implicitPrereq: ImplicitPrerequisite,
    collectiveInsights: Map<ChapterNodeId, CollectiveInsight>,
    strugglePoints: StrugglePoint[],
    config: LivingGraphConfig
): LivingEdge | null {
    const fromNode = getChapterNode(implicitPrereq.prerequisiteChapterId);
    const toNode = getChapterNode(implicitPrereq.dependentChapterId);

    if (!fromNode || !toNode) {
        return null;
    }

    // Check if static edge already exists
    const existingEdge = CHAPTER_CURRICULUM_EDGES.find(
        (e) =>
            e.from === implicitPrereq.prerequisiteChapterId &&
            e.to === implicitPrereq.dependentChapterId
    );

    if (existingEdge) {
        return null; // Don't create emergent edge if static exists
    }

    // Compute behavior weight
    const behaviorWeight: BehaviorEdgeWeight = {
        edgeId: `${implicitPrereq.prerequisiteChapterId}->${implicitPrereq.dependentChapterId}`,
        from: implicitPrereq.prerequisiteChapterId,
        to: implicitPrereq.dependentChapterId,
        struggleScore: 1 - implicitPrereq.evidence.successRateWithoutPrereq,
        successRateWithPrereq: implicitPrereq.evidence.successRateWithPrereq,
        successRateWithoutPrereq: implicitPrereq.evidence.successRateWithoutPrereq,
        avgTimeFactor: 1 + implicitPrereq.evidence.timeImprovement,
        dropOffRate: 1 - implicitPrereq.evidence.successRateWithoutPrereq,
        retryRate: implicitPrereq.evidence.struggleReduction * 2,
        confidence: implicitPrereq.confidence,
        sampleSize:
            implicitPrereq.evidence.learnersWithPrereq +
            implicitPrereq.evidence.learnersWithoutPrereq,
        lastUpdated: implicitPrereq.lastUpdated,
    };

    // Skip if confidence too low
    if (behaviorWeight.confidence < config.minEmergentConfidence) {
        return null;
    }

    // Compute combined weight based on success improvement
    const successImprovement =
        implicitPrereq.evidence.successRateWithPrereq -
        implicitPrereq.evidence.successRateWithoutPrereq;

    const combinedWeight = Math.min(3, Math.max(1, 1 + successImprovement * 2));

    return {
        from: implicitPrereq.prerequisiteChapterId,
        to: implicitPrereq.dependentChapterId,
        type: "builds-upon", // Emergent edges are "builds-upon" type
        weight: Math.round(combinedWeight),
        label: `Behavior-derived: ${Math.round(successImprovement * 100)}% improvement`,
        isIntraChapter: false,
        behaviorWeight,
        combinedWeight,
        isEmergent: true,
    };
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Compute all living edges from static and emergent data.
 */
export function computeAllLivingEdges(
    staticEdges: CurriculumEdge[],
    implicitPrerequisites: ImplicitPrerequisite[],
    collectiveInsights: Map<ChapterNodeId, CollectiveInsight>,
    strugglePoints: StrugglePoint[],
    config: LivingGraphConfig
): LivingEdge[] {
    const livingEdges: LivingEdge[] = [];
    const processedPairs = new Set<string>();

    // Process static edges
    for (const edge of staticEdges) {
        const pairKey = `${edge.from}->${edge.to}`;
        processedPairs.add(pairKey);

        const behaviorWeight = computeBehaviorEdgeWeight(
            edge,
            implicitPrerequisites,
            collectiveInsights,
            strugglePoints,
            config
        );

        livingEdges.push(createLivingEdge(edge, behaviorWeight));
    }

    // Add emergent edges
    if (config.includeEmergentPrerequisites) {
        for (const implicitPrereq of implicitPrerequisites) {
            const pairKey = `${implicitPrereq.prerequisiteChapterId}->${implicitPrereq.dependentChapterId}`;

            if (processedPairs.has(pairKey)) {
                continue; // Skip if already covered by static edge
            }

            const emergentEdge = createEmergentEdge(
                implicitPrereq,
                collectiveInsights,
                strugglePoints,
                config
            );

            if (emergentEdge) {
                livingEdges.push(emergentEdge);
                processedPairs.add(pairKey);
            }
        }
    }

    return livingEdges;
}

/**
 * Get edges with high struggle scores (indicating problematic transitions).
 */
export function getHighStruggleEdges(
    livingEdges: LivingEdge[],
    threshold: number
): LivingEdge[] {
    return livingEdges.filter(
        (edge) =>
            edge.behaviorWeight &&
            edge.behaviorWeight.struggleScore >= threshold &&
            edge.behaviorWeight.confidence >= 0.5
    );
}

/**
 * Get edges sorted by success improvement (most beneficial first).
 */
export function getEdgesBySuccessImprovement(
    livingEdges: LivingEdge[]
): LivingEdge[] {
    return [...livingEdges]
        .filter((edge) => edge.behaviorWeight)
        .sort((a, b) => {
            const aImprovement =
                (a.behaviorWeight?.successRateWithPrereq ?? 0) -
                (a.behaviorWeight?.successRateWithoutPrereq ?? 0);
            const bImprovement =
                (b.behaviorWeight?.successRateWithPrereq ?? 0) -
                (b.behaviorWeight?.successRateWithoutPrereq ?? 0);
            return bImprovement - aImprovement;
        });
}

/**
 * Find the most beneficial prerequisite edge for a node.
 */
export function findMostBeneficialPrerequisite(
    nodeId: ChapterNodeId,
    livingEdges: LivingEdge[]
): LivingEdge | null {
    const incomingEdges = livingEdges.filter(
        (edge) =>
            edge.to === nodeId &&
            edge.behaviorWeight &&
            edge.type === "prerequisite"
    );

    if (incomingEdges.length === 0) {
        return null;
    }

    // Sort by success improvement
    return incomingEdges.reduce((best, edge) => {
        const bestImprovement =
            (best.behaviorWeight?.successRateWithPrereq ?? 0) -
            (best.behaviorWeight?.successRateWithoutPrereq ?? 0);
        const edgeImprovement =
            (edge.behaviorWeight?.successRateWithPrereq ?? 0) -
            (edge.behaviorWeight?.successRateWithoutPrereq ?? 0);

        return edgeImprovement > bestImprovement ? edge : best;
    });
}
