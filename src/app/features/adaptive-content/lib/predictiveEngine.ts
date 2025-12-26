/**
 * Predictive Learning Engine
 *
 * A transformer-inspired prediction engine that anticipates learner struggles
 * BEFORE they happen. Uses attention mechanisms over temporal signal sequences
 * and collective learning patterns to generate proactive interventions.
 */

import type { BehaviorSignal } from "./types";
import type {
    TemporalSignal,
    PreStruggleSignal,
    StruggePrediction,
    InterventionRecommendation,
    InterventionType,
    InterventionContent,
    PredictiveConfig,
    PredictiveModelState,
    LearnerJourneyPattern,
    CollectiveStrugglePattern,
    CollectiveLearnerModel,
    ActiveIntervention,
    SignalAttention,
    SequenceEmbedding,
    PredictionHorizon,
    StruggeSeverity,
    PreStruggleIndicator,
} from "./predictiveLearning.types";
import { DEFAULT_PREDICTIVE_CONFIG } from "./predictiveLearning.types";
import {
    enrichSignalsWithTemporal,
    groupBySection,
    detectPreStruggleSignals,
    calculateSignalAttention,
    createSequenceEmbedding,
} from "./temporalPatternAnalyzer";

// ============================================================================
// Pattern Matching with Collective Intelligence
// ============================================================================

/**
 * Calculate embedding similarity using cosine similarity
 */
function calculateEmbeddingSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find matching historical patterns from collective data
 */
export function findMatchingPatterns(
    currentEmbedding: number[],
    collectivePatterns: CollectiveStrugglePattern[],
    threshold: number = 0.7
): { pattern: CollectiveStrugglePattern; similarity: number }[] {
    const matches: { pattern: CollectiveStrugglePattern; similarity: number }[] = [];

    for (const pattern of collectivePatterns) {
        // Decode pattern signature to embedding
        const patternEmbedding = decodePatternSignature(pattern.signalSignature);
        const similarity = calculateEmbeddingSimilarity(currentEmbedding, patternEmbedding);

        if (similarity >= threshold) {
            matches.push({ pattern, similarity });
        }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Decode pattern signature to embedding (simple base64 decode)
 */
function decodePatternSignature(signature: string): number[] {
    try {
        // Handle both browser and Node.js environments
        const decoded = typeof atob !== "undefined"
            ? atob(signature)
            : Buffer.from(signature, "base64").toString();
        return JSON.parse(decoded);
    } catch {
        return new Array(16).fill(0);
    }
}

/**
 * Encode embedding to pattern signature
 */
export function encodePatternSignature(embedding: number[]): string {
    const json = JSON.stringify(embedding.map((v) => Math.round(v * 1000) / 1000));
    // Handle both browser and Node.js environments
    return typeof btoa !== "undefined"
        ? btoa(json)
        : Buffer.from(json).toString("base64");
}

// ============================================================================
// Prediction Generation
// ============================================================================

/**
 * Generate unique prediction ID
 */
function generatePredictionId(): string {
    return `pred_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Determine prediction horizon from time estimate
 */
function getHorizon(timeToStruggleMs: number, config: PredictiveConfig): PredictionHorizon {
    if (timeToStruggleMs <= config.immediateHorizonMs) return "immediate";
    if (timeToStruggleMs <= config.shortTermHorizonMs) return "short_term";
    return "medium_term";
}

/**
 * Aggregate pre-struggle signals into a unified prediction
 */
export function aggregatePreStruggleSignals(
    preStruggleSignals: PreStruggleSignal[],
    currentEmbedding: number[],
    collectivePatterns: CollectiveStrugglePattern[],
    config: PredictiveConfig
): StruggePrediction | null {
    if (preStruggleSignals.length === 0) return null;

    // Find matching collective patterns
    const matchingPatterns = findMatchingPatterns(
        currentEmbedding,
        collectivePatterns,
        config.similarityThreshold
    );

    // Calculate aggregate probability from signals and collective match
    const signalProbability = calculateSignalProbability(preStruggleSignals);
    const collectiveProbability = calculateCollectiveProbability(matchingPatterns);

    // Combined probability with collective intelligence boost
    const combinedProbability = signalProbability * 0.6 + collectiveProbability * 0.4;

    if (combinedProbability < config.predictionThreshold) {
        return null;
    }

    // Determine severity (worst case from signals)
    const severity = getWorstSeverity(preStruggleSignals);

    // Get primary indicators
    const primaryIndicators = preStruggleSignals
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3)
        .map((s) => s.indicator);

    // Contributing factors from patterns
    const contributingFactors = extractContributingFactors(preStruggleSignals, matchingPatterns);

    // Estimate struggle time (min from signals)
    const predictedStruggleTime =
        Date.now() + Math.min(...preStruggleSignals.map((s) => s.predictedTimeToStruggle));

    // Generate intervention recommendations
    const recommendedInterventions = generateInterventionRecommendations(
        primaryIndicators,
        severity,
        matchingPatterns,
        preStruggleSignals[0].sectionId
    );

    // Calculate steps ahead (based on signal sequence position)
    const avgSequencePosition = preStruggleSignals.reduce(
        (sum, s) => sum + s.evidence.signals.length,
        0
    ) / preStruggleSignals.length;
    const stepsAhead = Math.max(1, Math.min(5, Math.round(avgSequencePosition / 10)));

    const horizon = getHorizon(predictedStruggleTime - Date.now(), config);

    return {
        id: generatePredictionId(),
        timestamp: Date.now(),
        horizon,
        probability: combinedProbability,
        severity,
        sectionId: preStruggleSignals[0].sectionId,
        conceptId: preStruggleSignals[0].conceptId,
        primaryIndicators,
        contributingFactors,
        predictedStruggleTime,
        confidenceInterval: {
            lower: predictedStruggleTime - config.shortTermHorizonMs / 2,
            upper: predictedStruggleTime + config.shortTermHorizonMs / 2,
        },
        recommendedInterventions,
        stepsAhead,
    };
}

/**
 * Calculate probability from pre-struggle signals
 */
function calculateSignalProbability(signals: PreStruggleSignal[]): number {
    if (signals.length === 0) return 0;

    // Weighted average of signal confidences
    const weights: Record<PreStruggleIndicator, number> = {
        quiz_hesitation: 0.9,
        playground_error_sequence: 0.85,
        error_recovery_failure: 0.8,
        video_rewind_cluster: 0.7,
        section_skip_pattern: 0.65,
        slow_progression: 0.6,
        high_pause_frequency: 0.55,
        concept_avoidance: 0.75,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const signal of signals) {
        const weight = weights[signal.indicator] || 0.5;
        weightedSum += signal.confidence * weight;
        totalWeight += weight;
    }

    // Boost for multiple indicators
    const multiIndicatorBoost = Math.min(0.2, signals.length * 0.05);

    return Math.min(1, (weightedSum / totalWeight) + multiIndicatorBoost);
}

/**
 * Calculate probability from collective pattern matches
 */
function calculateCollectiveProbability(
    matches: { pattern: CollectiveStrugglePattern; similarity: number }[]
): number {
    if (matches.length === 0) return 0;

    // Weighted average of struggle rates from matching patterns
    let weightedSum = 0;
    let totalWeight = 0;

    for (const { pattern, similarity } of matches) {
        // Weight by similarity and sample size confidence
        const sampleConfidence = Math.min(1, pattern.occurrenceCount / 20);
        const weight = similarity * sampleConfidence;

        weightedSum += pattern.struggleRate * weight;
        totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Get worst severity from signals
 */
function getWorstSeverity(signals: PreStruggleSignal[]): StruggeSeverity {
    if (signals.some((s) => s.severity === "severe")) return "severe";
    if (signals.some((s) => s.severity === "moderate")) return "moderate";
    return "mild";
}

/**
 * Extract contributing factors from signals and patterns
 */
function extractContributingFactors(
    signals: PreStruggleSignal[],
    matches: { pattern: CollectiveStrugglePattern; similarity: number }[]
): string[] {
    const factors = new Set<string>();

    // From signals
    for (const signal of signals) {
        if (signal.evidence.patterns.hesitation?.changedAnswer) {
            factors.add("Uncertainty in answers");
        }
        if (signal.evidence.patterns.errorSequence?.isRecurring) {
            factors.add("Recurring similar errors");
        }
        if (signal.evidence.patterns.videoEngagement?.rewindClusterCount) {
            factors.add("Repeated video rewinding");
        }
        if (signal.evidence.patterns.navigation?.skipThenReturnCount) {
            factors.add("Skip-then-return navigation pattern");
        }
    }

    // From collective patterns
    for (const { pattern } of matches.slice(0, 2)) {
        if (pattern.struggleRate > 0.7) {
            factors.add(`Historically challenging section (${Math.round(pattern.struggleRate * 100)}% struggle rate)`);
        }
    }

    return Array.from(factors).slice(0, 5);
}

// ============================================================================
// Intervention Recommendation System
// ============================================================================

/**
 * Generate intervention ID
 */
function generateInterventionId(): string {
    return `int_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate intervention recommendations based on indicators and collective data
 */
function generateInterventionRecommendations(
    indicators: PreStruggleIndicator[],
    severity: StruggeSeverity,
    collectiveMatches: { pattern: CollectiveStrugglePattern; similarity: number }[],
    sectionId: string
): InterventionRecommendation[] {
    const recommendations: InterventionRecommendation[] = [];

    // Map indicators to intervention types
    const indicatorInterventions: Record<PreStruggleIndicator, InterventionType[]> = {
        quiz_hesitation: ["interactive_hint", "prerequisite_review", "worked_example"],
        playground_error_sequence: ["simplified_example", "scaffolding_content", "visual_aid"],
        error_recovery_failure: ["worked_example", "alternative_explanation", "micro_practice"],
        video_rewind_cluster: ["visual_aid", "alternative_explanation", "pace_adjustment"],
        section_skip_pattern: ["prerequisite_review", "concept_bridge", "scaffolding_content"],
        slow_progression: ["pace_adjustment", "simplified_example", "micro_practice"],
        high_pause_frequency: ["scaffolding_content", "interactive_hint", "visual_aid"],
        concept_avoidance: ["concept_bridge", "micro_practice", "interactive_hint"],
    };

    // Collect intervention types from all indicators
    const interventionTypes = new Set<InterventionType>();
    for (const indicator of indicators) {
        const types = indicatorInterventions[indicator] || [];
        types.forEach((t) => interventionTypes.add(t));
    }

    // Check collective patterns for effective interventions
    const collectiveEffectiveness = new Map<InterventionType, number>();
    for (const { pattern } of collectiveMatches) {
        for (const intervention of pattern.effectiveInterventions) {
            const current = collectiveEffectiveness.get(intervention.type) || 0;
            collectiveEffectiveness.set(
                intervention.type,
                Math.max(current, intervention.successRate)
            );
        }
    }

    // Generate recommendations
    for (const type of interventionTypes) {
        const collectiveSuccessRate = collectiveEffectiveness.get(type) || 0.5;
        const content = generateInterventionContent(type, sectionId, indicators);

        // Calculate priority based on severity and collective success
        const severityMultiplier = severity === "severe" ? 1.5 : severity === "moderate" ? 1.2 : 1;
        const priority = Math.min(10, Math.round((collectiveSuccessRate * 10 + 3) * severityMultiplier));

        // Calculate expected impact
        const expectedImpact = collectiveSuccessRate * 0.7 + 0.2;

        recommendations.push({
            id: generateInterventionId(),
            type,
            priority,
            content,
            targetConcept: undefined,
            expectedImpact,
            collectiveSuccessRate,
        });
    }

    // Sort by priority and limit
    return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

/**
 * Generate intervention content based on type
 */
function generateInterventionContent(
    type: InterventionType,
    sectionId: string,
    indicators: PreStruggleIndicator[]
): InterventionContent {
    const contentMap: Record<InterventionType, () => InterventionContent> = {
        scaffolding_content: () => ({
            title: "Let's Build Understanding Step by Step",
            description:
                "Before moving forward, let's make sure the foundational concepts are clear. Here's a simplified breakdown of the key ideas.",
            points: [
                "Break down the concept into smaller parts",
                "Connect each part to what you already know",
                "Practice with simple examples first",
            ],
            duration: 180,
        }),
        simplified_example: () => ({
            title: "A Simpler Example First",
            description:
                "Sometimes starting with a simpler version helps. Here's a stripped-down example that focuses on the core concept.",
            code: "// Simplified example\n// Focus on understanding this first\nconst simple = doBasicThing();",
            codeLanguage: "typescript",
            duration: 120,
        }),
        prerequisite_review: () => ({
            title: "Quick Review of Prerequisites",
            description:
                "This concept builds on earlier material. Let's quickly review the prerequisites to ensure a solid foundation.",
            points: [
                "Review the fundamental concept",
                "Understand how it connects to the current topic",
                "Identify any gaps in understanding",
            ],
            duration: 150,
        }),
        visual_aid: () => ({
            title: "Visualizing the Concept",
            description:
                "Sometimes a visual representation helps clarify complex ideas. Here's a diagram showing how the pieces fit together.",
            visualUrl: "/visuals/concept-diagram.svg",
            duration: 90,
        }),
        interactive_hint: () => ({
            title: "Need a Hint?",
            description: indicators.includes("quiz_hesitation")
                ? "Take your time with this question. Consider what the code is doing step by step."
                : "Here's a helpful tip to guide you in the right direction.",
            points: [
                "Think about the input and expected output",
                "Consider edge cases",
                "Trace through the logic step by step",
            ],
            duration: 60,
        }),
        pace_adjustment: () => ({
            title: "Take a Moment to Absorb",
            description:
                "Learning is not a race. Taking time to fully understand each concept will help you move faster later.",
            points: [
                "It's okay to rewatch sections",
                "Try explaining the concept in your own words",
                "Take notes on key points",
            ],
            duration: 60,
        }),
        alternative_explanation: () => ({
            title: "Another Way to Think About It",
            description:
                "Sometimes hearing the same concept explained differently helps it click. Here's an alternative perspective.",
            points: [
                "Different metaphor or analogy",
                "Real-world application example",
                "Connection to familiar concepts",
            ],
            duration: 120,
        }),
        worked_example: () => ({
            title: "Worked Example: Step by Step",
            description:
                "Let's work through a complete example together, explaining each step along the way.",
            code: `// Step 1: Define the input
const input = getData();

// Step 2: Process the data
const processed = processData(input);

// Step 3: Return the result
return processed;`,
            codeLanguage: "typescript",
            points: [
                "Step 1: Understand the input",
                "Step 2: Apply the transformation",
                "Step 3: Verify the output",
            ],
            duration: 180,
        }),
        concept_bridge: () => ({
            title: "Connecting to What You Know",
            description:
                "This concept is similar to something you may already understand. Let's draw a connection.",
            points: [
                "Think of it like a familiar concept",
                "The main difference is in how it handles edge cases",
                "The core principle remains the same",
            ],
            duration: 90,
        }),
        micro_practice: () => ({
            title: "Quick Practice Exercise",
            description:
                "Before continuing, try this quick exercise to solidify your understanding.",
            code: "// Try modifying this code to achieve the goal\nconst result = ???",
            codeLanguage: "typescript",
            points: [
                "Start with the simplest case",
                "Build up complexity gradually",
                "Check your work step by step",
            ],
            duration: 120,
        }),
    };

    return contentMap[type]();
}

// ============================================================================
// Main Prediction Engine
// ============================================================================

/**
 * Create initial predictive model state
 */
export function createPredictiveModelState(
    config: PredictiveConfig = DEFAULT_PREDICTIVE_CONFIG
): PredictiveModelState {
    return {
        currentSequence: [],
        recentPredictions: [],
        activeInterventions: [],
        patternHistory: new Map(),
        attentionWeights: [],
        signalEmbeddings: new Map(),
        contextWindow: 50,
        predictionThreshold: config.predictionThreshold,
        predictionAccuracy: 0.5,
        interventionSuccessRate: 0.5,
        falsePositiveRate: 0.1,
    };
}

/**
 * Update model with new signal and generate prediction if warranted
 */
export function updatePredictiveModel(
    state: PredictiveModelState,
    signal: BehaviorSignal,
    allSignals: BehaviorSignal[],
    sectionId: string,
    collectivePatterns: CollectiveStrugglePattern[],
    config: PredictiveConfig = DEFAULT_PREDICTIVE_CONFIG
): {
    state: PredictiveModelState;
    prediction: StruggePrediction | null;
    newIntervention: InterventionRecommendation | null;
} {
    if (!config.enabled) {
        return { state, prediction: null, newIntervention: null };
    }

    const now = Date.now();
    const sessionStart = allSignals.length > 0 ? allSignals[0].timestamp : now;

    // Enrich signals with temporal data
    const temporalSignals = enrichSignalsWithTemporal(allSignals, sessionStart);

    // Update current sequence (sliding window)
    const windowStart = Math.max(0, temporalSignals.length - config.minSignalsForPrediction * 2);
    const currentSequence = temporalSignals.slice(windowStart);

    // Check cooldown
    const lastPrediction = state.recentPredictions[state.recentPredictions.length - 1];
    const cooldownActive = lastPrediction && now - lastPrediction.timestamp < config.interventionCooldownMs;

    // Check max active interventions
    const activeInterventions = state.activeInterventions.filter(
        (ai) => !ai.dismissedAt && now - ai.startedAt < config.mediumTermHorizonMs
    );
    const maxInterventionsReached = activeInterventions.length >= config.maxActiveInterventions;

    // Skip if conditions not met
    if (
        cooldownActive ||
        maxInterventionsReached ||
        currentSequence.length < config.minSignalsForPrediction
    ) {
        return {
            state: {
                ...state,
                currentSequence,
                activeInterventions,
            },
            prediction: null,
            newIntervention: null,
        };
    }

    // Calculate attention weights
    const attentionMap = calculateSignalAttention(currentSequence, now);
    const attentionWeights: SignalAttention[] = currentSequence.map((ts, i) => ({
        signalId: `${ts.signal.type}_${ts.timestamp}`,
        signalType: ts.signal.type,
        attentionWeight: attentionMap.get(i) || 0,
        contextRelevance: i / currentSequence.length,
        temporalDecay: Math.exp(-(now - ts.timestamp) / config.mediumTermHorizonMs),
    }));

    // Create sequence embedding
    const currentEmbedding = createSequenceEmbedding(currentSequence, attentionMap);

    // Detect pre-struggle signals
    const preStruggleSignals = detectPreStruggleSignals(currentSequence, sectionId, config);

    // Generate prediction
    const prediction = aggregatePreStruggleSignals(
        preStruggleSignals,
        currentEmbedding,
        collectivePatterns,
        config
    );

    // Select intervention if prediction is strong enough
    let newIntervention: InterventionRecommendation | null = null;
    const updatedInterventions = [...activeInterventions];

    if (prediction && prediction.recommendedInterventions.length > 0) {
        // Select best intervention not already active
        const activeTypes = new Set(activeInterventions.map((ai) => ai.intervention.type));
        const availableInterventions = prediction.recommendedInterventions.filter(
            (int) => !activeTypes.has(int.type)
        );

        if (availableInterventions.length > 0) {
            newIntervention = availableInterventions[0];
            updatedInterventions.push({
                intervention: newIntervention,
                prediction,
                startedAt: now,
            });
        }
    }

    // Update predictions list
    const recentPredictions = prediction
        ? [...state.recentPredictions, prediction].slice(-20)
        : state.recentPredictions;

    return {
        state: {
            ...state,
            currentSequence,
            recentPredictions,
            activeInterventions: updatedInterventions,
            attentionWeights,
        },
        prediction,
        newIntervention,
    };
}

/**
 * Record intervention outcome for learning
 */
export function recordInterventionOutcome(
    state: PredictiveModelState,
    interventionId: string,
    outcome: "helped" | "ignored" | "dismissed"
): PredictiveModelState {
    const now = Date.now();
    const updatedInterventions = state.activeInterventions.map((ai) => {
        if (ai.intervention.id === interventionId) {
            return {
                ...ai,
                outcome,
                dismissedAt: outcome === "dismissed" ? now : ai.dismissedAt,
            };
        }
        return ai;
    });

    // Update success rate
    const completedInterventions = updatedInterventions.filter((ai) => ai.outcome);
    const successfulInterventions = completedInterventions.filter((ai) => ai.outcome === "helped");
    const interventionSuccessRate =
        completedInterventions.length > 0
            ? successfulInterventions.length / completedInterventions.length
            : state.interventionSuccessRate;

    return {
        ...state,
        activeInterventions: updatedInterventions,
        interventionSuccessRate,
    };
}

/**
 * Validate prediction accuracy when actual outcome is known
 */
export function validatePrediction(
    state: PredictiveModelState,
    predictionId: string,
    didStruggle: boolean
): PredictiveModelState {
    const prediction = state.recentPredictions.find((p) => p.id === predictionId);
    if (!prediction) return state;

    const wasCorrect = prediction.probability >= 0.5 === didStruggle;
    const wasPositive = prediction.probability >= 0.5;
    const wasFalsePositive = wasPositive && !didStruggle;

    // Update accuracy metrics (exponential moving average)
    const alpha = 0.1;
    const predictionAccuracy =
        state.predictionAccuracy * (1 - alpha) + (wasCorrect ? 1 : 0) * alpha;
    const falsePositiveRate =
        state.falsePositiveRate * (1 - alpha) + (wasFalsePositive ? 1 : 0) * alpha;

    return {
        ...state,
        predictionAccuracy,
        falsePositiveRate,
    };
}

// ============================================================================
// Collective Pattern Learning
// ============================================================================

/**
 * Record a learner's pattern to collective intelligence
 */
export function recordToCollectivePatterns(
    currentPatterns: CollectiveStrugglePattern[],
    sequence: TemporalSignal[],
    sectionId: string,
    outcome: "struggled" | "succeeded" | "recovered",
    interventionApplied?: InterventionType
): CollectiveStrugglePattern[] {
    if (sequence.length === 0) return currentPatterns;

    // Create sequence embedding
    const attentionMap = calculateSignalAttention(sequence, Date.now());
    const embedding = createSequenceEmbedding(sequence, attentionMap);
    const signature = encodePatternSignature(embedding);

    // Extract indicator sequence
    const config = DEFAULT_PREDICTIVE_CONFIG;
    const preStruggleSignals = detectPreStruggleSignals(sequence, sectionId, config);
    const indicatorSequence = preStruggleSignals.map((s) => s.indicator);

    // Find existing pattern or create new
    const existingIndex = currentPatterns.findIndex(
        (p) => p.sectionId === sectionId && p.signalSignature === signature
    );

    if (existingIndex >= 0) {
        // Update existing pattern
        const existing = currentPatterns[existingIndex];
        const updated: CollectiveStrugglePattern = {
            ...existing,
            occurrenceCount: existing.occurrenceCount + 1,
            struggleRate:
                (existing.struggleRate * existing.occurrenceCount +
                    (outcome === "struggled" ? 1 : 0)) /
                (existing.occurrenceCount + 1),
        };

        // Update intervention effectiveness
        if (interventionApplied && outcome !== "struggled") {
            const intIdx = updated.effectiveInterventions.findIndex(
                (i) => i.type === interventionApplied
            );
            if (intIdx >= 0) {
                updated.effectiveInterventions[intIdx] = {
                    ...updated.effectiveInterventions[intIdx],
                    successRate:
                        (updated.effectiveInterventions[intIdx].successRate *
                            updated.effectiveInterventions[intIdx].usageCount +
                            1) /
                        (updated.effectiveInterventions[intIdx].usageCount + 1),
                    usageCount: updated.effectiveInterventions[intIdx].usageCount + 1,
                };
            } else {
                updated.effectiveInterventions.push({
                    type: interventionApplied,
                    successRate: 1,
                    usageCount: 1,
                });
            }
        }

        const newPatterns = [...currentPatterns];
        newPatterns[existingIndex] = updated;
        return newPatterns;
    } else {
        // Create new pattern
        const newPattern: CollectiveStrugglePattern = {
            patternId: `cp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            sectionId,
            indicatorSequence,
            signalSignature: signature,
            occurrenceCount: 1,
            struggleRate: outcome === "struggled" ? 1 : 0,
            avgTimeToStruggle: 0,
            effectiveInterventions: interventionApplied && outcome !== "struggled"
                ? [{ type: interventionApplied, successRate: 1, usageCount: 1 }]
                : [],
        };

        return [...currentPatterns, newPattern];
    }
}

// ============================================================================
// Exports
// ============================================================================

export {
    calculateEmbeddingSimilarity,
    generatePredictionId,
    getHorizon,
};
