/**
 * Experimentation Types
 *
 * Type definitions for the A/B testing framework
 */

// ============================================================================
// Core Experiment Types
// ============================================================================

export type ExperimentStatus = "draft" | "running" | "paused" | "concluded" | "rolled_out";

export type ExperimentType =
    | "ab_test" // Standard A/B test
    | "multivariate" // Multiple variants
    | "holdout" // Control vs treatment
    | "rollout"; // Gradual percentage rollout

export type TargetArea =
    | "orchestration" // Conductor decisions
    | "slot_variant" // UI slot variants
    | "content" // Content variations
    | "timing" // Intervention timing
    | "layout"; // Page layouts

/**
 * Experiment Variant
 */
export interface ExperimentVariant {
    /** Unique variant ID */
    id: string;
    /** Human-readable name */
    name: string;
    /** Variant description */
    description?: string;
    /** Traffic allocation (0-100, all variants should sum to 100) */
    weight: number;
    /** Whether this is the control variant */
    isControl: boolean;
    /** Variant-specific configuration */
    config: Record<string, unknown>;
}

/**
 * Experiment Definition
 */
export interface Experiment {
    /** Unique experiment ID */
    id: string;
    /** Human-readable name */
    name: string;
    /** Experiment description */
    description?: string;
    /** Experiment type */
    type: ExperimentType;
    /** Target area for the experiment */
    targetArea: TargetArea;
    /** Current status */
    status: ExperimentStatus;
    /** Experiment variants */
    variants: ExperimentVariant[];
    /** Traffic allocation percentage (0-100) */
    trafficAllocation: number;
    /** Targeting rules (optional) */
    targeting?: ExperimentTargeting;
    /** Primary metric to optimize */
    primaryMetric: string;
    /** Secondary metrics to track */
    secondaryMetrics: string[];
    /** Minimum sample size per variant */
    minSampleSize: number;
    /** Statistical significance threshold (e.g., 0.05 for 95% confidence) */
    significanceThreshold: number;
    /** Experiment start date */
    startedAt?: string;
    /** Experiment end date */
    endedAt?: string;
    /** Created timestamp */
    createdAt: string;
    /** Updated timestamp */
    updatedAt: string;
    /** Version for optimistic locking */
    version: number;
    /** Winning variant ID (set when concluded) */
    winningVariantId?: string;
    /** Experiment metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Experiment Targeting Rules
 */
export interface ExperimentTargeting {
    /** Include only specific user IDs */
    userIds?: string[];
    /** Include users from specific courses */
    courseIds?: string[];
    /** Include users with specific domain focus */
    domainIds?: string[];
    /** Include new users only (first session) */
    newUsersOnly?: boolean;
    /** Include returning users only */
    returningUsersOnly?: boolean;
    /** Minimum user sessions count */
    minSessions?: number;
    /** User cohort names */
    cohorts?: string[];
}

// ============================================================================
// Cohort Assignment Types
// ============================================================================

/**
 * Cohort Assignment Result
 */
export interface CohortAssignment {
    /** Experiment ID */
    experimentId: string;
    /** User ID */
    userId: string;
    /** Assigned variant ID */
    variantId: string;
    /** Assignment timestamp */
    assignedAt: string;
    /** Hash value used for assignment (for debugging) */
    hashValue: number;
    /** Whether assignment was cached */
    cached: boolean;
}

/**
 * Bucketing Info (for debugging)
 */
export interface BucketInfo {
    /** Hash of user+experiment */
    hash: number;
    /** Normalized value (0-1) */
    normalizedValue: number;
    /** Bucket boundaries */
    buckets: Array<{
        variantId: string;
        start: number;
        end: number;
    }>;
    /** Selected variant */
    selectedVariant: string;
}

// ============================================================================
// Metric Types
// ============================================================================

export type MetricType =
    | "count" // Simple count (clicks, views)
    | "conversion" // Binary outcome (completed/not)
    | "continuous" // Numeric value (time, score)
    | "revenue"; // Monetary value

/**
 * Metric Definition
 */
export interface MetricDefinition {
    /** Metric name/key */
    name: string;
    /** Display label */
    label: string;
    /** Metric type */
    type: MetricType;
    /** Description */
    description?: string;
    /** Unit (e.g., "seconds", "USD", "percent") */
    unit?: string;
    /** Higher is better? */
    higherIsBetter: boolean;
}

/**
 * Metric Event
 */
export interface MetricEvent {
    /** Event ID */
    id: string;
    /** Experiment ID */
    experimentId: string;
    /** User ID */
    userId: string;
    /** Variant ID */
    variantId: string;
    /** Metric name */
    metricName: string;
    /** Metric value */
    value: number;
    /** Event timestamp */
    timestamp: string;
    /** Additional context */
    context?: Record<string, unknown>;
}

/**
 * Aggregated Metric for a Variant
 */
export interface VariantMetric {
    /** Variant ID */
    variantId: string;
    /** Metric name */
    metricName: string;
    /** Sample size */
    sampleSize: number;
    /** Sum of values */
    sum: number;
    /** Mean value */
    mean: number;
    /** Standard deviation */
    stdDev: number;
    /** Conversion rate (for binary metrics) */
    conversionRate?: number;
    /** Conversions count (for binary metrics) */
    conversions?: number;
    /** Confidence interval (95%) */
    confidenceInterval: {
        lower: number;
        upper: number;
    };
}

// ============================================================================
// Statistical Analysis Types
// ============================================================================

export type SignificanceLevel = "not_significant" | "marginally" | "significant" | "highly_significant";

/**
 * Statistical Test Result
 */
export interface StatisticalTestResult {
    /** Test type used */
    testType: "chi_squared" | "t_test" | "z_test" | "mann_whitney";
    /** Test statistic */
    statistic: number;
    /** P-value */
    pValue: number;
    /** Significance level */
    significance: SignificanceLevel;
    /** Degrees of freedom */
    degreesOfFreedom?: number;
    /** Effect size */
    effectSize: number;
    /** Effect size interpretation */
    effectSizeInterpretation: "negligible" | "small" | "medium" | "large";
    /** Confidence level used */
    confidenceLevel: number;
}

/**
 * Variant Comparison Result
 */
export interface VariantComparison {
    /** Control variant ID */
    controlId: string;
    /** Treatment variant ID */
    treatmentId: string;
    /** Metric being compared */
    metricName: string;
    /** Control metric data */
    control: VariantMetric;
    /** Treatment metric data */
    treatment: VariantMetric;
    /** Relative lift (percentage change) */
    relativeLift: number;
    /** Absolute difference */
    absoluteDifference: number;
    /** Statistical test result */
    testResult: StatisticalTestResult;
    /** Probability treatment is better (Bayesian) */
    probabilityBetter: number;
    /** Recommendation */
    recommendation: "keep_control" | "adopt_treatment" | "continue_testing";
}

/**
 * Experiment Analysis Report
 */
export interface ExperimentAnalysis {
    /** Experiment ID */
    experimentId: string;
    /** Analysis timestamp */
    analyzedAt: string;
    /** Total participants */
    totalParticipants: number;
    /** Per-variant metrics */
    variantMetrics: Record<string, VariantMetric[]>;
    /** Pairwise comparisons */
    comparisons: VariantComparison[];
    /** Overall winner (if any) */
    winner?: {
        variantId: string;
        confidence: number;
        metric: string;
    };
    /** Minimum detectable effect at current sample */
    mde: number;
    /** Estimated days to significance */
    estimatedDaysToSignificance?: number;
    /** Power analysis */
    power: number;
    /** Warnings */
    warnings: string[];
}

// ============================================================================
// Rollout Types
// ============================================================================

export type RolloutStage = "canary" | "early_adopters" | "general" | "full";

/**
 * Rollout Configuration
 */
export interface RolloutConfig {
    /** Target traffic percentage */
    targetPercentage: number;
    /** Current percentage */
    currentPercentage: number;
    /** Rollout stage */
    stage: RolloutStage;
    /** Percentage increments */
    increments: number[];
    /** Hours between increments */
    incrementIntervalHours: number;
    /** Automatic rollback on metric regression */
    autoRollback: boolean;
    /** Rollback threshold (percentage decrease) */
    rollbackThreshold: number;
    /** Metrics to monitor during rollout */
    monitorMetrics: string[];
}

/**
 * Rollout Status
 */
export interface RolloutStatus {
    /** Experiment ID */
    experimentId: string;
    /** Config */
    config: RolloutConfig;
    /** Current health */
    health: "healthy" | "degraded" | "critical";
    /** Last increment timestamp */
    lastIncrementAt?: string;
    /** Next scheduled increment */
    nextIncrementAt?: string;
    /** Rollback history */
    rollbacks: Array<{
        timestamp: string;
        reason: string;
        fromPercentage: number;
        toPercentage: number;
    }>;
}

// ============================================================================
// Storage Types
// ============================================================================

/**
 * Cached Assignment Entry
 */
export interface CachedAssignment {
    variantId: string;
    assignedAt: string;
    experimentVersion: number;
}

/**
 * Local Experiment Cache
 */
export interface ExperimentCache {
    experiments: Record<string, Experiment>;
    assignments: Record<string, CachedAssignment>; // key: `${experimentId}:${userId}`
    lastSyncedAt: string;
    version: number;
}
