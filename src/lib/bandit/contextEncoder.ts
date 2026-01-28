/**
 * Context Encoder
 *
 * Encodes learner context features into a normalized feature vector
 * for contextual bandit decision-making. Provides consistent encoding
 * and hashing for context identification.
 */

import type {
    LearnerContext,
    EncodedContext,
    PreStruggleIndicator,
} from "./types";

// ============================================================================
// Feature Encoding Constants
// ============================================================================

const PACE_VALUES = ["struggling", "slow", "normal", "fast", "accelerated"] as const;
const CONFIDENCE_VALUES = ["low", "moderate", "high", "expert"] as const;
const COMPREHENSION_VALUES = ["beginner", "intermediate", "advanced"] as const;
const LEARNING_STYLE_VALUES = ["visual", "practice", "quiz", "balanced"] as const;
const TIME_OF_DAY_VALUES = ["morning", "afternoon", "evening", "night"] as const;
const OUTCOME_VALUES = ["helped", "ignored", "dismissed"] as const;

const INDICATOR_WEIGHTS: Record<PreStruggleIndicator, number> = {
    quiz_hesitation: 0.6,
    playground_error_sequence: 0.8,
    video_rewind_cluster: 0.5,
    section_skip_pattern: 0.7,
    slow_progression: 0.4,
    high_pause_frequency: 0.5,
    error_recovery_failure: 0.9,
    concept_avoidance: 0.8,
};

// ============================================================================
// Feature Names
// ============================================================================

const FEATURE_NAMES = [
    // Pace features (one-hot: 5 features)
    "pace_struggling",
    "pace_slow",
    "pace_normal",
    "pace_fast",
    "pace_accelerated",
    // Confidence features (one-hot: 4 features)
    "confidence_low",
    "confidence_moderate",
    "confidence_high",
    "confidence_expert",
    // Continuous features
    "struggle_severity",
    // Comprehension features (one-hot: 3 features)
    "comprehension_beginner",
    "comprehension_intermediate",
    "comprehension_advanced",
    // Learning style features (one-hot: 4 features)
    "style_visual",
    "style_practice",
    "style_quiz",
    "style_balanced",
    // Time of day features (one-hot: 4 features)
    "time_morning",
    "time_afternoon",
    "time_evening",
    "time_night",
    // Session features
    "session_progress",
    "interventions_shown_normalized",
    // Previous outcome features (one-hot + none: 4 features)
    "prev_outcome_helped",
    "prev_outcome_ignored",
    "prev_outcome_dismissed",
    "prev_outcome_none",
    // Indicator aggregate features
    "indicator_count_normalized",
    "indicator_severity_weighted",
    // Individual indicator features (8 features)
    "indicator_quiz_hesitation",
    "indicator_playground_error_sequence",
    "indicator_video_rewind_cluster",
    "indicator_section_skip_pattern",
    "indicator_slow_progression",
    "indicator_high_pause_frequency",
    "indicator_error_recovery_failure",
    "indicator_concept_avoidance",
];

// Total: 5 + 4 + 1 + 3 + 4 + 4 + 1 + 1 + 4 + 2 + 8 = 37 features

// ============================================================================
// Encoding Functions
// ============================================================================

/**
 * One-hot encode a categorical value
 */
function oneHotEncode<T extends string>(
    value: T,
    categories: readonly T[]
): number[] {
    return categories.map((cat) => (cat === value ? 1 : 0));
}

/**
 * Normalize a value to 0-1 range
 */
function normalize(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Calculate weighted indicator severity
 */
function calculateIndicatorSeverity(indicators: PreStruggleIndicator[]): number {
    if (indicators.length === 0) return 0;

    const totalWeight = indicators.reduce(
        (sum, ind) => sum + INDICATOR_WEIGHTS[ind],
        0
    );

    // Normalize by max possible (all indicators)
    const maxPossible = Object.values(INDICATOR_WEIGHTS).reduce((a, b) => a + b, 0);
    return totalWeight / maxPossible;
}

/**
 * Simple hash function for context identification
 * Uses FNV-1a algorithm for fast, good distribution
 */
function fnv1aHash(str: string): string {
    let hash = 2166136261; // FNV offset basis

    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619); // FNV prime
    }

    // Convert to hex string
    return (hash >>> 0).toString(16).padStart(8, "0");
}

// ============================================================================
// Context Encoder Class
// ============================================================================

export class ContextEncoder {
    private featureNames: string[];

    constructor() {
        this.featureNames = [...FEATURE_NAMES];
    }

    /**
     * Encode learner context to feature vector
     */
    encode(context: LearnerContext): EncodedContext {
        const features: number[] = [];

        // 1. Pace (one-hot: 5 features)
        features.push(...oneHotEncode(context.pace, PACE_VALUES));

        // 2. Confidence (one-hot: 4 features)
        features.push(...oneHotEncode(context.confidence, CONFIDENCE_VALUES));

        // 3. Struggle severity (continuous: 1 feature)
        features.push(context.struggleSeverity);

        // 4. Comprehension state (one-hot: 3 features)
        features.push(...oneHotEncode(context.comprehensionState, COMPREHENSION_VALUES));

        // 5. Learning style (one-hot: 4 features)
        features.push(...oneHotEncode(context.learningStyle, LEARNING_STYLE_VALUES));

        // 6. Time of day (one-hot: 4 features)
        features.push(...oneHotEncode(context.timeOfDay, TIME_OF_DAY_VALUES));

        // 7. Session progress (continuous: 1 feature)
        features.push(context.sessionProgress);

        // 8. Interventions shown (normalized: 1 feature)
        // Normalize assuming max ~10 interventions per session
        features.push(normalize(context.interventionsShownInSession, 0, 10));

        // 9. Previous outcome (one-hot + none: 4 features)
        if (context.previousInterventionOutcome) {
            features.push(...oneHotEncode(context.previousInterventionOutcome, OUTCOME_VALUES));
            features.push(0); // none
        } else {
            features.push(0, 0, 0, 1); // none
        }

        // 10. Indicator aggregates (2 features)
        features.push(normalize(context.indicators.length, 0, 8));
        features.push(calculateIndicatorSeverity(context.indicators));

        // 11. Individual indicators (8 features)
        const indicatorSet = new Set(context.indicators);
        features.push(
            indicatorSet.has("quiz_hesitation") ? 1 : 0,
            indicatorSet.has("playground_error_sequence") ? 1 : 0,
            indicatorSet.has("video_rewind_cluster") ? 1 : 0,
            indicatorSet.has("section_skip_pattern") ? 1 : 0,
            indicatorSet.has("slow_progression") ? 1 : 0,
            indicatorSet.has("high_pause_frequency") ? 1 : 0,
            indicatorSet.has("error_recovery_failure") ? 1 : 0,
            indicatorSet.has("concept_avoidance") ? 1 : 0
        );

        // Generate context hash
        const contextHash = this.hashFeatures(features);

        return {
            features,
            featureNames: this.featureNames,
            contextHash,
        };
    }

    /**
     * Create a simplified context from partial data
     */
    encodePartial(partialContext: Partial<LearnerContext>): EncodedContext {
        const fullContext: LearnerContext = {
            pace: partialContext.pace ?? "normal",
            confidence: partialContext.confidence ?? "moderate",
            struggleSeverity: partialContext.struggleSeverity ?? 0,
            comprehensionState: partialContext.comprehensionState ?? "intermediate",
            learningStyle: partialContext.learningStyle ?? "balanced",
            timeOfDay: partialContext.timeOfDay ?? this.getCurrentTimeOfDay(),
            sessionProgress: partialContext.sessionProgress ?? 0,
            interventionsShownInSession: partialContext.interventionsShownInSession ?? 0,
            previousInterventionOutcome: partialContext.previousInterventionOutcome,
            indicators: partialContext.indicators ?? [],
        };

        return this.encode(fullContext);
    }

    /**
     * Get current time of day category
     */
    private getCurrentTimeOfDay(): LearnerContext["timeOfDay"] {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "morning";
        if (hour >= 12 && hour < 17) return "afternoon";
        if (hour >= 17 && hour < 21) return "evening";
        return "night";
    }

    /**
     * Hash features for context identification
     */
    private hashFeatures(features: number[]): string {
        // Quantize features to reduce hash collisions for similar contexts
        const quantized = features.map((f) => Math.round(f * 10) / 10);
        const str = quantized.join(",");
        return fnv1aHash(str);
    }

    /**
     * Calculate cosine similarity between two encoded contexts
     */
    cosineSimilarity(context1: EncodedContext, context2: EncodedContext): number {
        const vec1 = context1.features;
        const vec2 = context2.features;

        if (vec1.length !== vec2.length) {
            throw new Error("Feature vectors must have same length");
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        if (norm1 === 0 || norm2 === 0) return 0;

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * Calculate Euclidean distance between two encoded contexts
     */
    euclideanDistance(context1: EncodedContext, context2: EncodedContext): number {
        const vec1 = context1.features;
        const vec2 = context2.features;

        if (vec1.length !== vec2.length) {
            throw new Error("Feature vectors must have same length");
        }

        let sumSquares = 0;

        for (let i = 0; i < vec1.length; i++) {
            const diff = vec1[i] - vec2[i];
            sumSquares += diff * diff;
        }

        return Math.sqrt(sumSquares);
    }

    /**
     * Get feature importance weights
     * Higher weight = more important for intervention selection
     */
    getFeatureWeights(): Record<string, number> {
        const weights: Record<string, number> = {};

        for (const name of this.featureNames) {
            // Assign weights based on feature category
            if (name.startsWith("pace_")) {
                weights[name] = 0.8; // Pace is highly important
            } else if (name.startsWith("confidence_")) {
                weights[name] = 0.7;
            } else if (name === "struggle_severity") {
                weights[name] = 0.9; // Most important
            } else if (name.startsWith("comprehension_")) {
                weights[name] = 0.6;
            } else if (name.startsWith("style_")) {
                weights[name] = 0.5;
            } else if (name.startsWith("time_")) {
                weights[name] = 0.2; // Less important
            } else if (name === "session_progress") {
                weights[name] = 0.4;
            } else if (name.startsWith("prev_outcome_")) {
                weights[name] = 0.6;
            } else if (name.startsWith("indicator_")) {
                weights[name] = 0.7;
            } else {
                weights[name] = 0.5;
            }
        }

        return weights;
    }

    /**
     * Calculate weighted similarity between contexts
     */
    weightedSimilarity(context1: EncodedContext, context2: EncodedContext): number {
        const weights = this.getFeatureWeights();
        const vec1 = context1.features;
        const vec2 = context2.features;

        let weightedDotProduct = 0;
        let weightedNorm1 = 0;
        let weightedNorm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            const weight = weights[this.featureNames[i]] ?? 0.5;
            const w1 = vec1[i] * weight;
            const w2 = vec2[i] * weight;

            weightedDotProduct += w1 * w2;
            weightedNorm1 += w1 * w1;
            weightedNorm2 += w2 * w2;
        }

        if (weightedNorm1 === 0 || weightedNorm2 === 0) return 0;

        return weightedDotProduct / (Math.sqrt(weightedNorm1) * Math.sqrt(weightedNorm2));
    }

    /**
     * Get feature names
     */
    getFeatureNames(): string[] {
        return [...this.featureNames];
    }

    /**
     * Get feature count
     */
    getFeatureCount(): number {
        return this.featureNames.length;
    }

    /**
     * Decode context hash to approximate context description
     * (for debugging/logging purposes)
     */
    describeContext(context: EncodedContext): string {
        const parts: string[] = [];

        // Find pace
        const paceIdx = PACE_VALUES.findIndex((_, i) => context.features[i] === 1);
        if (paceIdx >= 0) parts.push(`pace:${PACE_VALUES[paceIdx]}`);

        // Find confidence
        const confOffset = 5;
        const confIdx = CONFIDENCE_VALUES.findIndex(
            (_, i) => context.features[confOffset + i] === 1
        );
        if (confIdx >= 0) parts.push(`conf:${CONFIDENCE_VALUES[confIdx]}`);

        // Struggle severity
        const severity = context.features[9];
        if (severity > 0.3) parts.push(`severity:${severity.toFixed(2)}`);

        // Indicator count
        const indicatorCount = context.features[27] * 8;
        if (indicatorCount > 0) parts.push(`indicators:${Math.round(indicatorCount)}`);

        return parts.join(" | ");
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let encoderInstance: ContextEncoder | null = null;

export function getContextEncoder(): ContextEncoder {
    if (!encoderInstance) {
        encoderInstance = new ContextEncoder();
    }
    return encoderInstance;
}

export function resetContextEncoder(): void {
    encoderInstance = null;
}
