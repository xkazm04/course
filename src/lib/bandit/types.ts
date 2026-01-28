/**
 * Multi-Armed Bandit Types
 *
 * Type definitions for the intervention optimization system.
 */

// ============================================================================
// Intervention Types (from adaptive-content)
// ============================================================================

export type InterventionType =
    | "interactive_hint"
    | "worked_example"
    | "scaffolding_content"
    | "simplified_example"
    | "prerequisite_review"
    | "visual_aid"
    | "alternative_explanation"
    | "concept_bridge"
    | "pace_adjustment"
    | "micro_practice";

export type PreStruggleIndicator =
    | "quiz_hesitation"
    | "playground_error_sequence"
    | "video_rewind_cluster"
    | "section_skip_pattern"
    | "slow_progression"
    | "high_pause_frequency"
    | "error_recovery_failure"
    | "concept_avoidance";

// ============================================================================
// Context Features
// ============================================================================

/**
 * Learner context features for contextual bandits
 */
export interface LearnerContext {
    /** Learner pace: struggling, slow, normal, fast, accelerated */
    pace: "struggling" | "slow" | "normal" | "fast" | "accelerated";
    /** Confidence level: low, moderate, high, expert */
    confidence: "low" | "moderate" | "high" | "expert";
    /** Struggle severity: 0-1, higher means more severe */
    struggleSeverity: number;
    /** Current comprehension state */
    comprehensionState: "beginner" | "intermediate" | "advanced";
    /** Learning style preference */
    learningStyle: "visual" | "practice" | "quiz" | "balanced";
    /** Time of day: morning, afternoon, evening, night */
    timeOfDay: "morning" | "afternoon" | "evening" | "night";
    /** Session progress: 0-1 */
    sessionProgress: number;
    /** Interventions already shown in session */
    interventionsShownInSession: number;
    /** Previous intervention outcome if any */
    previousInterventionOutcome?: "helped" | "ignored" | "dismissed";
    /** Pre-struggle indicators detected */
    indicators: PreStruggleIndicator[];
}

/**
 * Encoded context as feature vector
 */
export interface EncodedContext {
    /** Feature vector (normalized 0-1) */
    features: number[];
    /** Feature names for interpretability */
    featureNames: string[];
    /** Context hash for caching */
    contextHash: string;
}

// ============================================================================
// Arm Statistics
// ============================================================================

/**
 * Beta distribution parameters for Thompson Sampling
 */
export interface BetaParameters {
    /** Alpha (successes + prior) */
    alpha: number;
    /** Beta (failures + prior) */
    beta: number;
}

/**
 * Arm statistics for a single intervention
 */
export interface ArmStatistics {
    /** Arm identifier (intervention type) */
    armId: string;
    /** Intervention type */
    interventionType: InterventionType;
    /** Total pulls (times selected) */
    totalPulls: number;
    /** Total rewards accumulated */
    totalReward: number;
    /** Beta parameters for Thompson Sampling */
    betaParams: BetaParameters;
    /** UCB1 values for fallback */
    ucb1Value: number;
    /** Average reward */
    averageReward: number;
    /** Last updated timestamp */
    lastUpdated: string;
    /** Is arm active */
    isActive: boolean;
    /** Context-specific statistics */
    contextStats: Map<string, ContextualArmStats>;
}

/**
 * Context-specific arm statistics
 */
export interface ContextualArmStats {
    /** Context hash */
    contextHash: string;
    /** Pulls in this context */
    pulls: number;
    /** Rewards in this context */
    rewards: number;
    /** Beta parameters for this context */
    betaParams: BetaParameters;
}

// ============================================================================
// Outcome Tracking
// ============================================================================

/**
 * Intervention outcome record
 */
export interface InterventionOutcome {
    /** Unique outcome ID */
    id: string;
    /** User ID */
    userId: string;
    /** Section ID */
    sectionId: string;
    /** Selected arm */
    armId: string;
    /** Intervention type */
    interventionType: InterventionType;
    /** Encoded context at selection time */
    context: EncodedContext;
    /** Selection timestamp */
    selectedAt: string;
    /** Raw outcome if resolved */
    rawOutcome?: "helped" | "ignored" | "dismissed";
    /** Calculated reward (0-1) */
    reward?: number;
    /** Component rewards */
    rewardComponents?: {
        engagement: number; // 0.3 weight
        learningGain: number; // 0.5 weight
        completion: number; // 0.2 weight
    };
    /** Outcome timestamp */
    resolvedAt?: string;
    /** Attribution confidence (0-1) */
    attributionConfidence?: number;
}

/**
 * Reward calculation config
 */
export interface RewardConfig {
    /** Weight for engagement component */
    engagementWeight: number;
    /** Weight for learning gain component */
    learningGainWeight: number;
    /** Weight for completion component */
    completionWeight: number;
    /** Decay factor for delayed outcomes */
    delayDecayFactor: number;
    /** Max delay before reward is discounted */
    maxDelayMs: number;
}

// ============================================================================
// Bandit Configuration
// ============================================================================

/**
 * Bandit algorithm parameters
 */
export interface BanditConfig {
    /** Algorithm type */
    algorithm: "thompson_sampling" | "ucb1" | "epsilon_greedy";
    /** Prior alpha for Beta distribution */
    priorAlpha: number;
    /** Prior beta for Beta distribution */
    priorBeta: number;
    /** Exploration rate for epsilon-greedy */
    epsilon: number;
    /** UCB1 exploration constant */
    ucbConstant: number;
    /** Minimum pulls before exploitation */
    minPullsBeforeExploitation: number;
    /** Arm retirement threshold (min success rate) */
    armRetirementThreshold: number;
    /** Minimum pulls before retirement consideration */
    minPullsBeforeRetirement: number;
    /** Enable contextual bandits */
    enableContextual: boolean;
    /** Context similarity threshold for pooling */
    contextSimilarityThreshold: number;
    /** Reward configuration */
    rewardConfig: RewardConfig;
}

/**
 * Default bandit configuration
 */
export const DEFAULT_BANDIT_CONFIG: BanditConfig = {
    algorithm: "thompson_sampling",
    priorAlpha: 1,
    priorBeta: 1,
    epsilon: 0.1,
    ucbConstant: 2,
    minPullsBeforeExploitation: 10,
    armRetirementThreshold: 0.1,
    minPullsBeforeRetirement: 50,
    enableContextual: true,
    contextSimilarityThreshold: 0.7,
    rewardConfig: {
        engagementWeight: 0.3,
        learningGainWeight: 0.5,
        completionWeight: 0.2,
        delayDecayFactor: 0.95,
        maxDelayMs: 24 * 60 * 60 * 1000, // 24 hours
    },
};

// ============================================================================
// Selection Result
// ============================================================================

/**
 * Result of arm selection
 */
export interface SelectionResult {
    /** Selected arm ID */
    armId: string;
    /** Selected intervention type */
    interventionType: InterventionType;
    /** Sampled value (for debugging) */
    sampledValue: number;
    /** Selection reason */
    reason: "thompson_sampling" | "ucb1_fallback" | "exploration" | "warm_start";
    /** Exploration flag */
    isExploration: boolean;
    /** Confidence in selection (0-1) */
    confidence: number;
    /** Outcome tracking ID */
    outcomeId: string;
    /** Alternative arms considered */
    alternatives: Array<{
        armId: string;
        sampledValue: number;
    }>;
}

// ============================================================================
// Dashboard Types
// ============================================================================

/**
 * Arm performance summary for dashboard
 */
export interface ArmPerformanceSummary {
    armId: string;
    interventionType: InterventionType;
    totalPulls: number;
    averageReward: number;
    successRate: number;
    explorationRate: number;
    trend: "improving" | "stable" | "declining";
    confidenceInterval: {
        lower: number;
        upper: number;
    };
    lastPullAt?: string;
    isRetired: boolean;
}

/**
 * Bandit system health metrics
 */
export interface BanditHealthMetrics {
    /** Total selections made */
    totalSelections: number;
    /** Total rewards collected */
    totalRewards: number;
    /** Average reward across all arms */
    averageReward: number;
    /** Exploration rate (last 100 selections) */
    recentExplorationRate: number;
    /** Number of active arms */
    activeArms: number;
    /** Number of retired arms */
    retiredArms: number;
    /** Time since last update */
    lastUpdateAt: string;
    /** Convergence metric (variance of arm values) */
    convergenceMetric: number;
}

// ============================================================================
// Storage Types
// ============================================================================

/**
 * Bandit state for persistence
 */
export interface BanditState {
    /** All arm statistics */
    arms: Record<string, ArmStatistics>;
    /** Pending outcomes awaiting resolution */
    pendingOutcomes: InterventionOutcome[];
    /** Resolved outcomes (recent) */
    recentOutcomes: InterventionOutcome[];
    /** Configuration */
    config: BanditConfig;
    /** Health metrics */
    health: BanditHealthMetrics;
    /** Last synced with server */
    lastSyncedAt: string;
    /** State version */
    version: number;
}
