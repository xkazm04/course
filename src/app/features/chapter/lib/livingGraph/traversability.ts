/**
 * Traversability Calculation
 *
 * Computes node traversability by combining:
 * 1. Static prerequisites (hand-crafted curriculum structure)
 * 2. Emergent prerequisites (derived from collective behavior)
 * 3. Predicted struggle (from CollectiveInsight)
 * 4. Learner profile (pace, confidence, strengths/weaknesses)
 *
 * The key insight: A node's "traversability" becomes a function of both
 * prerequisites AND predicted struggle for learners like you.
 */

import type { ChapterNodeId } from "../chapterGraph";
import type { LearnerPace, LearnerConfidence, CollectiveInsight } from "../conductorTypes";
import type { ImplicitPrerequisite, StrugglePoint } from "../collectiveIntelligence";
import type {
    TraversabilityScore,
    TraversabilityRecommendation,
    TraversabilityFactor,
    TraversabilityFactorType,
    TraversabilityParams,
    LivingGraphConfig,
    LearnerProfileSummary,
    DEFAULT_LIVING_GRAPH_CONFIG,
} from "./types";
import {
    getChapterPrerequisites,
    areChapterPrerequisitesMet,
} from "../curriculumChapters";

// ============================================================================
// MAIN TRAVERSABILITY CALCULATION
// ============================================================================

/**
 * Compute traversability score for a node.
 *
 * This is the core algorithm that unifies static prerequisites with
 * behavior-derived signals to determine if a learner should proceed.
 */
export function computeTraversability(
    params: TraversabilityParams
): TraversabilityScore {
    const {
        nodeId,
        completedChapterIds,
        learnerProfile,
        config,
        collectiveInsights,
        implicitPrerequisites,
        strugglePoints,
    } = params;

    const factors: TraversabilityFactor[] = [];

    // 1. Static Prerequisites
    const staticPrereqFactor = computeStaticPrerequisiteFactor(
        nodeId,
        completedChapterIds
    );
    factors.push(staticPrereqFactor);

    // 2. Emergent Prerequisites
    const emergentPrereqFactor = computeEmergentPrerequisiteFactor(
        nodeId,
        completedChapterIds,
        implicitPrerequisites,
        config.minEmergentConfidence
    );
    if (emergentPrereqFactor) {
        factors.push(emergentPrereqFactor);
    }

    // 3. Collective Struggle
    const collectiveStruggleFactor = computeCollectiveStruggleFactor(
        nodeId,
        collectiveInsights,
        strugglePoints,
        learnerProfile
    );
    if (collectiveStruggleFactor) {
        factors.push(collectiveStruggleFactor);
    }

    // 4. Learner Profile Match
    const profileFactor = computeLearnerProfileFactor(
        nodeId,
        learnerProfile,
        collectiveInsights.get(nodeId)
    );
    factors.push(profileFactor);

    // 5. Past Performance (if available)
    const pastPerformanceFactor = computePastPerformanceFactor(
        nodeId,
        completedChapterIds,
        learnerProfile
    );
    if (pastPerformanceFactor) {
        factors.push(pastPerformanceFactor);
    }

    // Compute weighted score
    const { score, prerequisitesMet, emergentPrerequisitesMet } = computeWeightedScore(
        factors,
        config
    );

    // Compute predicted struggle
    const { predictedStruggle, struggleConfidence } = computePredictedStruggle(
        nodeId,
        learnerProfile,
        collectiveInsights.get(nodeId),
        strugglePoints.filter((sp) => sp.chapterId === nodeId)
    );

    // Determine recommendation
    const recommendation = determineRecommendation(
        score,
        prerequisitesMet,
        emergentPrerequisitesMet,
        predictedStruggle,
        learnerProfile
    );

    return {
        score,
        prerequisitesMet,
        emergentPrerequisitesMet,
        predictedStruggle,
        struggleConfidence,
        recommendation,
        factors,
    };
}

// ============================================================================
// FACTOR COMPUTATION
// ============================================================================

/**
 * Compute factor for static prerequisites (hand-crafted curriculum).
 */
function computeStaticPrerequisiteFactor(
    nodeId: ChapterNodeId,
    completedChapterIds: Set<ChapterNodeId>
): TraversabilityFactor {
    const staticPrereqs = getChapterPrerequisites(nodeId);
    const met = areChapterPrerequisitesMet(nodeId, completedChapterIds);
    const missingCount = staticPrereqs.filter(
        (p) => !completedChapterIds.has(p.id)
    ).length;

    let value: number;
    let description: string;

    if (staticPrereqs.length === 0) {
        value = 1.0;
        description = "No prerequisites required";
    } else if (met) {
        value = 1.0;
        description = `All ${staticPrereqs.length} prerequisites completed`;
    } else {
        // Partial completion gives partial credit
        value = (staticPrereqs.length - missingCount) / staticPrereqs.length;
        description = `Missing ${missingCount} of ${staticPrereqs.length} prerequisites`;
    }

    return {
        type: "static_prerequisite",
        value,
        influence: 0.4, // Static prereqs have high influence
        description,
    };
}

/**
 * Compute factor for emergent prerequisites (behavior-derived).
 */
function computeEmergentPrerequisiteFactor(
    nodeId: ChapterNodeId,
    completedChapterIds: Set<ChapterNodeId>,
    implicitPrerequisites: ImplicitPrerequisite[],
    minConfidence: number
): TraversabilityFactor | null {
    const emergentPrereqs = implicitPrerequisites.filter(
        (p) =>
            p.dependentChapterId === nodeId &&
            p.confidence >= minConfidence
    );

    if (emergentPrereqs.length === 0) {
        return null;
    }

    const metCount = emergentPrereqs.filter((p) =>
        completedChapterIds.has(p.prerequisiteChapterId)
    ).length;

    const value = emergentPrereqs.length > 0 ? metCount / emergentPrereqs.length : 1.0;

    // Weight by average confidence of the prerequisites
    const avgConfidence =
        emergentPrereqs.reduce((sum, p) => sum + p.confidence, 0) /
        emergentPrereqs.length;

    const description =
        value === 1.0
            ? `All ${emergentPrereqs.length} recommended prerequisites completed`
            : `${metCount} of ${emergentPrereqs.length} recommended prerequisites (based on learner behavior)`;

    return {
        type: "emergent_prerequisite",
        value,
        influence: 0.2 * avgConfidence, // Influence scales with confidence
        description,
    };
}

/**
 * Compute factor based on collective struggle data.
 */
function computeCollectiveStruggleFactor(
    nodeId: ChapterNodeId,
    collectiveInsights: Map<ChapterNodeId, CollectiveInsight>,
    strugglePoints: StrugglePoint[],
    learnerProfile: LearnerProfileSummary
): TraversabilityFactor | null {
    const insight = collectiveInsights.get(nodeId);
    const nodeStrugglePoints = strugglePoints.filter(
        (sp) => sp.chapterId === nodeId
    );

    if (!insight && nodeStrugglePoints.length === 0) {
        return null;
    }

    // Calculate base struggle from collective insight
    let baseStruggle = 0;
    if (insight) {
        // Higher dropoff rate = higher struggle
        baseStruggle += insight.dropoffRate * 0.4;

        // Average struggle point severity
        if (insight.strugglePoints.length > 0) {
            const avgPause =
                insight.strugglePoints.reduce((sum, sp) => sum + sp.pauseFrequency, 0) /
                insight.strugglePoints.length;
            baseStruggle += Math.min(1, avgPause / 5) * 0.3;
        }

        // Common errors indicate struggle
        if (insight.commonErrors.length > 0) {
            baseStruggle += Math.min(1, insight.commonErrors.length / 5) * 0.3;
        }
    }

    // Add identified struggle points
    if (nodeStrugglePoints.length > 0) {
        const avgSeverity =
            nodeStrugglePoints.reduce((sum, sp) => sum + sp.severity, 0) /
            nodeStrugglePoints.length;
        baseStruggle = (baseStruggle + avgSeverity) / 2;
    }

    // Adjust based on learner profile
    const profileAdjustment = getProfileStruggleAdjustment(learnerProfile);
    const adjustedStruggle = Math.min(1, baseStruggle * profileAdjustment);

    // Convert struggle to traversability (inverse relationship)
    const value = 1 - adjustedStruggle;

    const description =
        adjustedStruggle < 0.3
            ? "Low predicted difficulty based on learner behavior"
            : adjustedStruggle < 0.6
            ? "Moderate predicted difficulty - some learners struggle here"
            : "High predicted difficulty - many learners struggle here";

    return {
        type: "collective_struggle",
        value,
        influence: 0.25,
        description,
    };
}

/**
 * Compute factor based on learner profile match.
 */
function computeLearnerProfileFactor(
    nodeId: ChapterNodeId,
    learnerProfile: LearnerProfileSummary,
    insight?: CollectiveInsight
): TraversabilityFactor {
    // Base value starts neutral
    let value = 0.5;

    // Adjust based on pace
    const paceAdjustment = getPaceTraversabilityBonus(learnerProfile.pace);
    value += paceAdjustment * 0.2;

    // Adjust based on confidence
    const confidenceAdjustment = getConfidenceTraversabilityBonus(
        learnerProfile.confidence
    );
    value += confidenceAdjustment * 0.2;

    // Check if node aligns with strengths/weaknesses
    if (insight?.commonErrors) {
        // If learner has strengths that address common errors, boost
        const relevantStrengths = learnerProfile.strengths.filter((s) =>
            insight.commonErrors.some((e) =>
                e.resolution.toLowerCase().includes(s.toLowerCase())
            )
        );
        value += relevantStrengths.length * 0.05;

        // If learner has weaknesses that match common errors, reduce
        const relevantWeaknesses = learnerProfile.weaknesses.filter((w) =>
            insight.commonErrors.some((e) =>
                e.errorType.toLowerCase().includes(w.toLowerCase())
            )
        );
        value -= relevantWeaknesses.length * 0.05;
    }

    value = Math.max(0, Math.min(1, value));

    const description =
        value > 0.7
            ? "Your profile suggests good fit for this content"
            : value > 0.4
            ? "Neutral match based on your learning profile"
            : "Content may challenge areas you're developing";

    return {
        type: "learner_profile",
        value,
        influence: 0.15,
        description,
    };
}

/**
 * Compute factor based on past performance with similar content.
 */
function computePastPerformanceFactor(
    nodeId: ChapterNodeId,
    completedChapterIds: Set<ChapterNodeId>,
    learnerProfile: LearnerProfileSummary
): TraversabilityFactor | null {
    // This would ideally look at the learner's actual performance history
    // For now, we infer from the number of completed chapters

    if (completedChapterIds.size === 0) {
        return null; // No history to base on
    }

    // More completions = more experience = higher traversability
    const experienceBonus = Math.min(1, completedChapterIds.size / 10);

    // Adjust by confidence (confident learners perform better)
    const confidenceMultiplier =
        learnerProfile.confidence === "expert"
            ? 1.2
            : learnerProfile.confidence === "high"
            ? 1.1
            : learnerProfile.confidence === "moderate"
            ? 1.0
            : 0.9;

    const value = Math.min(1, experienceBonus * confidenceMultiplier);

    const description = `Based on ${completedChapterIds.size} completed chapter(s)`;

    return {
        type: "past_performance",
        value,
        influence: 0.1,
        description,
    };
}

// ============================================================================
// WEIGHTED SCORE COMPUTATION
// ============================================================================

interface WeightedScoreResult {
    score: number;
    prerequisitesMet: boolean;
    emergentPrerequisitesMet: boolean;
}

/**
 * Compute weighted traversability score from factors.
 */
function computeWeightedScore(
    factors: TraversabilityFactor[],
    config: LivingGraphConfig
): WeightedScoreResult {
    let totalWeight = 0;
    let weightedSum = 0;
    let prerequisitesMet = true;
    let emergentPrerequisitesMet = true;

    for (const factor of factors) {
        // Apply config weights
        let adjustedInfluence = factor.influence;

        switch (factor.type) {
            case "static_prerequisite":
                adjustedInfluence *= config.staticPrerequisiteWeight / 0.4;
                if (factor.value < 1.0) prerequisitesMet = false;
                break;
            case "emergent_prerequisite":
                if (!config.includeEmergentPrerequisites) continue;
                adjustedInfluence *= config.emergentPrerequisiteWeight / 0.2;
                if (factor.value < 1.0) emergentPrerequisitesMet = false;
                break;
            case "collective_struggle":
                adjustedInfluence *= config.collectiveStruggleWeight / 0.25;
                break;
            case "learner_profile":
                adjustedInfluence *= config.learnerProfileWeight / 0.15;
                break;
        }

        weightedSum += factor.value * adjustedInfluence;
        totalWeight += adjustedInfluence;
    }

    const score = totalWeight > 0 ? weightedSum / totalWeight : 0.5;

    return { score, prerequisitesMet, emergentPrerequisitesMet };
}

// ============================================================================
// PREDICTED STRUGGLE
// ============================================================================

interface PredictedStruggleResult {
    predictedStruggle: number;
    struggleConfidence: number;
}

/**
 * Compute predicted struggle level for the learner.
 */
function computePredictedStruggle(
    nodeId: ChapterNodeId,
    learnerProfile: LearnerProfileSummary,
    insight: CollectiveInsight | undefined,
    nodeStrugglePoints: StrugglePoint[]
): PredictedStruggleResult {
    if (!insight && nodeStrugglePoints.length === 0) {
        return { predictedStruggle: 0.3, struggleConfidence: 0.2 }; // Low confidence default
    }

    let basePrediction = 0;
    const confidenceSum = 0;
    let confidenceCount = 0;

    // From collective insight
    if (insight) {
        // Time-based struggle indicator
        if (insight.medianTimeSpent > 0 && insight.averageTimeSpent > 0) {
            const timeVariance = Math.abs(
                (insight.averageTimeSpent - insight.medianTimeSpent) /
                insight.medianTimeSpent
            );
            basePrediction += Math.min(1, timeVariance) * 0.3;
        }

        // Dropoff indicates struggle
        basePrediction += insight.dropoffRate * 0.4;

        // Peer solution usage indicates struggle
        basePrediction += Math.min(1, insight.peerSolutionUsage / 5) * 0.3;

        confidenceCount++;
    }

    // From struggle points
    if (nodeStrugglePoints.length > 0) {
        const avgSeverity =
            nodeStrugglePoints.reduce((sum, sp) => sum + sp.severity, 0) /
            nodeStrugglePoints.length;
        basePrediction = (basePrediction + avgSeverity) / 2;

        // Check if learner profile matches struggle causes
        const profileRelevance = nodeStrugglePoints.filter((sp) => {
            if (sp.struggleType === "prerequisite") {
                return (
                    learnerProfile.weaknesses.some((w) =>
                        sp.commonCauses.some((c) =>
                            c.toLowerCase().includes(w.toLowerCase())
                        )
                    ) || learnerProfile.confidence === "low"
                );
            }
            if (sp.struggleType === "conceptual") {
                return learnerProfile.confidence === "low";
            }
            if (sp.struggleType === "pacing") {
                return (
                    learnerProfile.pace === "struggling" ||
                    learnerProfile.pace === "slow"
                );
            }
            return false;
        });

        if (profileRelevance.length > 0) {
            basePrediction += 0.1 * (profileRelevance.length / nodeStrugglePoints.length);
        }

        confidenceCount++;
    }

    // Adjust by learner profile
    const profileAdjustment = getProfileStruggleAdjustment(learnerProfile);
    const predictedStruggle = Math.min(1, Math.max(0, basePrediction * profileAdjustment));

    // Confidence based on data availability
    const struggleConfidence =
        confidenceCount > 0
            ? Math.min(1, 0.4 + confidenceCount * 0.3)
            : 0.2;

    return { predictedStruggle, struggleConfidence };
}

// ============================================================================
// RECOMMENDATION
// ============================================================================

/**
 * Determine the recommended action based on traversability analysis.
 */
function determineRecommendation(
    score: number,
    prerequisitesMet: boolean,
    emergentPrerequisitesMet: boolean,
    predictedStruggle: number,
    learnerProfile: LearnerProfileSummary
): TraversabilityRecommendation {
    // Hard block if prerequisites not met
    if (!prerequisitesMet) {
        return "blocked";
    }

    // High score with low struggle = proceed or accelerate
    if (score > 0.8 && predictedStruggle < 0.2) {
        if (
            learnerProfile.pace === "fast" ||
            learnerProfile.pace === "accelerated" ||
            learnerProfile.confidence === "expert"
        ) {
            return "accelerate";
        }
        return "proceed";
    }

    // High score with moderate struggle = proceed with caution
    if (score > 0.6 && predictedStruggle < 0.5) {
        return "proceed";
    }

    // Moderate score = consider prerequisites
    if (score > 0.4 || !emergentPrerequisitesMet) {
        return "consider_prerequisites";
    }

    // Low score with high struggle = proceed with caution or blocked
    if (score > 0.3 && predictedStruggle > 0.6) {
        return "proceed_with_caution";
    }

    // Very low score = should consider prerequisites
    if (score <= 0.3) {
        return "consider_prerequisites";
    }

    return "proceed_with_caution";
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get struggle adjustment multiplier based on learner profile.
 */
function getProfileStruggleAdjustment(profile: LearnerProfileSummary): number {
    let multiplier = 1.0;

    // Pace adjustment
    switch (profile.pace) {
        case "struggling":
            multiplier *= 1.4;
            break;
        case "slow":
            multiplier *= 1.2;
            break;
        case "normal":
            multiplier *= 1.0;
            break;
        case "fast":
            multiplier *= 0.8;
            break;
        case "accelerated":
            multiplier *= 0.6;
            break;
    }

    // Confidence adjustment
    switch (profile.confidence) {
        case "low":
            multiplier *= 1.3;
            break;
        case "moderate":
            multiplier *= 1.0;
            break;
        case "high":
            multiplier *= 0.8;
            break;
        case "expert":
            multiplier *= 0.6;
            break;
    }

    return multiplier;
}

/**
 * Get traversability bonus based on pace.
 */
function getPaceTraversabilityBonus(pace: LearnerPace): number {
    switch (pace) {
        case "accelerated":
            return 0.3;
        case "fast":
            return 0.15;
        case "normal":
            return 0;
        case "slow":
            return -0.1;
        case "struggling":
            return -0.25;
    }
}

/**
 * Get traversability bonus based on confidence.
 */
function getConfidenceTraversabilityBonus(confidence: LearnerConfidence): number {
    switch (confidence) {
        case "expert":
            return 0.3;
        case "high":
            return 0.15;
        case "moderate":
            return 0;
        case "low":
            return -0.2;
    }
}

// ============================================================================
// BATCH COMPUTATION
// ============================================================================

/**
 * Compute traversability for multiple nodes efficiently.
 */
export function computeTraversabilityBatch(
    nodeIds: ChapterNodeId[],
    completedChapterIds: Set<ChapterNodeId>,
    learnerProfile: LearnerProfileSummary,
    config: LivingGraphConfig,
    collectiveInsights: Map<ChapterNodeId, CollectiveInsight>,
    implicitPrerequisites: ImplicitPrerequisite[],
    strugglePoints: StrugglePoint[]
): Map<ChapterNodeId, TraversabilityScore> {
    const results = new Map<ChapterNodeId, TraversabilityScore>();

    for (const nodeId of nodeIds) {
        const score = computeTraversability({
            nodeId,
            completedChapterIds,
            learnerProfile,
            config,
            collectiveInsights,
            implicitPrerequisites,
            strugglePoints,
        });
        results.set(nodeId, score);
    }

    return results;
}

/**
 * Get nodes sorted by traversability (most accessible first).
 */
export function sortByTraversability(
    traversabilityMap: Map<ChapterNodeId, TraversabilityScore>
): ChapterNodeId[] {
    return Array.from(traversabilityMap.entries())
        .sort((a, b) => {
            // First sort by recommendation (proceed > caution > consider > blocked)
            const recOrder: Record<TraversabilityRecommendation, number> = {
                accelerate: 0,
                skip: 1,
                proceed: 2,
                proceed_with_caution: 3,
                consider_prerequisites: 4,
                blocked: 5,
            };
            const recDiff = recOrder[a[1].recommendation] - recOrder[b[1].recommendation];
            if (recDiff !== 0) return recDiff;

            // Then by score (higher first)
            return b[1].score - a[1].score;
        })
        .map(([nodeId]) => nodeId);
}
