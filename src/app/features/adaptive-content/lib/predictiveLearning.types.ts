/**
 * Predictive Learning Path Orchestrator - Types
 *
 * Defines types for the predictive learning system that anticipates
 * comprehension struggles BEFORE they happen using temporal pattern
 * analysis across multiple signals.
 */

import type { BehaviorSignal, ComprehensionLevel } from "./types";
import type { ComprehensionState } from "./comprehensionStateMachine";
import type { LearningEvent } from "./learningEvents";

// ============================================================================
// Core Prediction Types
// ============================================================================

/**
 * Pre-struggle indicator types that signal upcoming difficulty
 */
export type PreStruggleIndicator =
    | "quiz_hesitation" // Long pauses before answering
    | "playground_error_sequence" // Specific error patterns preceding failure
    | "video_rewind_cluster" // Multiple rewinds in short period
    | "section_skip_pattern" // Skipping ahead then coming back
    | "slow_progression" // Decreasing speed through content
    | "high_pause_frequency" // Frequent pauses suggesting confusion
    | "error_recovery_failure" // Unable to fix errors after multiple attempts
    | "concept_avoidance"; // Avoiding certain interactive elements

/**
 * Severity level of predicted struggle
 */
export type StruggeSeverity = "mild" | "moderate" | "severe";

/**
 * Time horizon for predictions
 */
export type PredictionHorizon = "immediate" | "short_term" | "medium_term";

/**
 * Temporal signal - a signal with timing metadata for pattern analysis
 */
export interface TemporalSignal {
    signal: BehaviorSignal;
    timestamp: number;
    deltaFromPrevious: number; // ms since previous signal
    sectionProgress: number; // 0-100
    sessionDuration: number; // ms since session start
    sequencePosition: number; // position in signal sequence
}

/**
 * Quiz hesitation pattern
 */
export interface QuizHesitationPattern {
    questionId: string;
    hesitationMs: number;
    expectedMs: number; // baseline timing
    hesitationRatio: number; // actual / expected
    changedAnswer: boolean;
    timeToFirstClick: number;
}

/**
 * Error sequence pattern for playground
 */
export interface ErrorSequencePattern {
    errorTypes: string[];
    errorTimestamps: number[];
    fixAttempts: number;
    timeToFix: number | null; // null if not fixed
    isRecurring: boolean;
    escalationRate: number; // how fast errors are increasing
}

/**
 * Video engagement pattern
 */
export interface VideoEngagementPattern {
    rewindTimestamps: number[];
    pauseTimestamps: number[];
    rewindClusterCount: number; // clusters of 2+ rewinds within 30s
    averagePauseDuration: number;
    playbackSpeedChanges: { timestamp: number; speed: number }[];
    segmentsRepeated: { start: number; end: number; repeatCount: number }[];
}

/**
 * Navigation behavior pattern
 */
export interface NavigationBehaviorPattern {
    backtrackCount: number;
    skipAheadCount: number;
    skipThenReturnCount: number;
    averageTimeInSection: number;
    abandonedSections: string[];
    revisitPattern: { sectionId: string; revisitCount: number }[];
}

// ============================================================================
// Prediction Model Types
// ============================================================================

/**
 * A detected pre-struggle signal
 */
export interface PreStruggleSignal {
    id: string;
    indicator: PreStruggleIndicator;
    severity: StruggeSeverity;
    confidence: number; // 0-1
    detectedAt: number;
    sectionId: string;
    conceptId?: string;
    evidence: PreStruggleEvidence;
    predictedTimeToStruggle: number; // ms until predicted struggle
}

/**
 * Evidence supporting a pre-struggle prediction
 */
export interface PreStruggleEvidence {
    signals: TemporalSignal[];
    patterns: {
        hesitation?: QuizHesitationPattern;
        errorSequence?: ErrorSequencePattern;
        videoEngagement?: VideoEngagementPattern;
        navigation?: NavigationBehaviorPattern;
    };
    historicalSimilarity: number; // 0-1, how similar to historical struggle patterns
    collectiveMatch: number; // 0-1, how many similar learners struggled here
}

/**
 * Struggle prediction with intervention recommendations
 */
export interface StruggePrediction {
    id: string;
    timestamp: number;
    horizon: PredictionHorizon;
    probability: number; // 0-1
    severity: StruggeSeverity;
    sectionId: string;
    conceptId?: string;

    // Root cause analysis
    primaryIndicators: PreStruggleIndicator[];
    contributingFactors: string[];

    // Prediction window
    predictedStruggleTime: number; // estimated timestamp
    confidenceInterval: { lower: number; upper: number };

    // Intervention data
    recommendedInterventions: InterventionRecommendation[];
    stepsAhead: number; // how many steps ahead this predicts
}

/**
 * Proactive intervention recommendation
 */
export interface InterventionRecommendation {
    id: string;
    type: InterventionType;
    priority: number; // 1-10
    content: InterventionContent;
    targetConcept?: string;
    expectedImpact: number; // 0-1, predicted improvement
    collectiveSuccessRate: number; // 0-1, how often this helped similar learners
}

/**
 * Types of proactive interventions
 */
export type InterventionType =
    | "scaffolding_content" // Additional explanatory content
    | "simplified_example" // Simpler version of current example
    | "prerequisite_review" // Review of prerequisite concepts
    | "visual_aid" // Diagram, animation, or visual
    | "interactive_hint" // Contextual hint system
    | "pace_adjustment" // Suggest slowing down
    | "alternative_explanation" // Different angle on same concept
    | "worked_example" // Step-by-step solution
    | "concept_bridge" // Connect to familiar concept
    | "micro_practice"; // Quick practice before continuing

/**
 * Content for an intervention
 */
export interface InterventionContent {
    title: string;
    description: string;
    content?: string;
    code?: string;
    codeLanguage?: string;
    points?: string[];
    visualUrl?: string;
    duration?: number; // estimated time in seconds
}

// ============================================================================
// Transformer-like Attention Model Types
// ============================================================================

/**
 * Attention weights for signal importance
 */
export interface SignalAttention {
    signalId: string;
    signalType: BehaviorSignal["type"];
    attentionWeight: number; // 0-1
    contextRelevance: number; // 0-1, relevance to current context
    temporalDecay: number; // 0-1, recency factor
}

/**
 * Sequence embedding for pattern matching
 */
export interface SequenceEmbedding {
    sectionId: string;
    embedding: number[]; // vector representation
    signalCount: number;
    timespan: number;
    dominantPattern: PreStruggleIndicator | null;
}

/**
 * Learner journey pattern for collective intelligence
 */
export interface LearnerJourneyPattern {
    patternId: string;
    sequenceEmbedding: SequenceEmbedding;
    outcome: "struggled" | "succeeded" | "recovered";
    interventionApplied?: InterventionType;
    interventionEffectiveness?: number;
    learnerCount: number; // how many learners showed this pattern
    avgTimeToOutcome: number;
}

/**
 * Model state for the predictive engine
 */
export interface PredictiveModelState {
    // Current analysis state
    currentSequence: TemporalSignal[];
    recentPredictions: StruggePrediction[];
    activeInterventions: ActiveIntervention[];

    // Pattern memory
    patternHistory: Map<string, LearnerJourneyPattern>;
    attentionWeights: SignalAttention[];

    // Model parameters (simplified transformer-like)
    signalEmbeddings: Map<string, number[]>;
    contextWindow: number; // number of signals to consider
    predictionThreshold: number; // confidence threshold for predictions

    // Statistics
    predictionAccuracy: number;
    interventionSuccessRate: number;
    falsePositiveRate: number;
}

/**
 * An active intervention being shown to learner
 */
export interface ActiveIntervention {
    intervention: InterventionRecommendation;
    prediction: StruggePrediction;
    startedAt: number;
    viewedAt?: number;
    engagedAt?: number;
    dismissedAt?: number;
    outcome?: "helped" | "ignored" | "dismissed" | "unknown";
}

// ============================================================================
// Collective Intelligence Types
// ============================================================================

/**
 * Aggregated struggle pattern from many learners
 */
export interface CollectiveStrugglePattern {
    patternId: string;
    sectionId: string;
    conceptId?: string;

    // Pattern signature
    indicatorSequence: PreStruggleIndicator[];
    signalSignature: string; // encoded pattern for matching

    // Statistics
    occurrenceCount: number;
    struggleRate: number; // 0-1, how often this pattern led to struggle
    avgTimeToStruggle: number;

    // Effective interventions
    effectiveInterventions: {
        type: InterventionType;
        successRate: number;
        usageCount: number;
    }[];
}

/**
 * Collective learner model for a section/concept
 */
export interface CollectiveLearnerModel {
    sectionId: string;
    totalLearners: number;
    strugglePatterns: CollectiveStrugglePattern[];
    commonIndicators: { indicator: PreStruggleIndicator; frequency: number }[];
    avgCompletionTime: number;
    difficultyScore: number; // 0-1
    interventionEffectiveness: Map<InterventionType, number>;
}

// ============================================================================
// Event Types for Prediction System
// ============================================================================

/**
 * Events emitted by the prediction system
 */
export type PredictionEvent =
    | { type: "prediction_made"; prediction: StruggePrediction }
    | { type: "intervention_triggered"; intervention: InterventionRecommendation; prediction: StruggePrediction }
    | { type: "intervention_viewed"; interventionId: string }
    | { type: "intervention_engaged"; interventionId: string }
    | { type: "intervention_dismissed"; interventionId: string }
    | { type: "prediction_validated"; predictionId: string; wasAccurate: boolean }
    | { type: "pattern_recorded"; pattern: CollectiveStrugglePattern };

/**
 * Configuration for the predictive system
 */
export interface PredictiveConfig {
    // Prediction settings
    enabled: boolean;
    predictionThreshold: number; // min confidence to trigger intervention
    minSignalsForPrediction: number;
    maxActiveInterventions: number;

    // Time windows
    immediateHorizonMs: number; // window for "immediate" predictions
    shortTermHorizonMs: number;
    mediumTermHorizonMs: number;

    // Pattern detection
    hesitationThresholdMs: number;
    errorSequenceWindow: number;
    rewindClusterWindowMs: number;

    // Intervention settings
    interventionCooldownMs: number; // min time between interventions
    maxInterventionsPerSection: number;

    // Collective intelligence
    collectivePatternMinSamples: number;
    similarityThreshold: number;
}

/**
 * Default configuration
 */
export const DEFAULT_PREDICTIVE_CONFIG: PredictiveConfig = {
    enabled: true,
    predictionThreshold: 0.65,
    minSignalsForPrediction: 5,
    maxActiveInterventions: 2,

    immediateHorizonMs: 30000, // 30 seconds
    shortTermHorizonMs: 120000, // 2 minutes
    mediumTermHorizonMs: 300000, // 5 minutes

    hesitationThresholdMs: 15000, // 15 seconds considered hesitation
    errorSequenceWindow: 5,
    rewindClusterWindowMs: 30000,

    interventionCooldownMs: 60000, // 1 minute between interventions
    maxInterventionsPerSection: 3,

    collectivePatternMinSamples: 10,
    similarityThreshold: 0.7,
};

// ============================================================================
// Storage Types
// ============================================================================

export interface StoredPredictiveData {
    version: number;
    modelState: Partial<PredictiveModelState>;
    collectivePatterns: CollectiveStrugglePattern[];
    config: PredictiveConfig;
    lastUpdated: number;
}

export const PREDICTIVE_STORAGE_KEY = "predictive-learning";
export const PREDICTIVE_VERSION = 1;
