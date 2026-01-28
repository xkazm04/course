/**
 * Experimentation Library
 */

// Types
export type {
    Experiment,
    ExperimentVariant,
    ExperimentStatus,
    ExperimentType,
    TargetArea,
    ExperimentTargeting,
    CohortAssignment,
    BucketInfo,
    MetricDefinition,
    MetricEvent,
    MetricType,
    VariantMetric,
    StatisticalTestResult,
    SignificanceLevel,
    VariantComparison,
    ExperimentAnalysis,
    RolloutConfig,
    RolloutStatus,
    CachedAssignment,
    ExperimentCache,
} from "./types";

// Cohort Assignment
export {
    computeHash,
    normalizeHash,
    buildBuckets,
    selectVariant,
    isInTrafficAllocation,
    matchesTargeting,
    assignCohort,
    getBucketInfo,
    clearAssignmentCache,
    getCachedAssignment,
    preloadAssignments,
    validateVariantWeights,
    validateControlVariant,
} from "./cohortAssigner";

// Experiment Manager
export { ExperimentManager, experimentManager } from "./experimentManager";

// Variant Deliverer
export {
    VariantDeliverer,
    variantDeliverer,
    initializeVariantDeliverer,
    getOrchestrationVariant,
    getSlotVariant,
    getContentVariant,
    getTimingConfig,
} from "./variantDeliverer";
export type { DeliveredVariant, DeliveryContext } from "./variantDeliverer";

// Metric Collector
export {
    MetricCollector,
    MetricAggregator,
    getMetricCollector,
    trackMetric,
    trackConversion,
    createTimer,
    getMetricDefinition,
    PREDEFINED_METRICS,
} from "./metricCollector";

// Statistical Analyzer
export {
    zTestProportions,
    tTestMeans,
    chiSquaredTest,
    bayesianProbabilityBetter,
    confidenceIntervalProportion,
    confidenceIntervalMean,
    compareVariants,
    analyzeExperiment,
} from "./statisticalAnalyzer";

// React Hooks
export {
    ExperimentProvider,
    useExperimentContext,
    useExperiment,
    useExperimentsForArea,
    useIsInTreatment,
    useExperimentConfig,
    useABVariant,
    ExperimentGate,
    Variant,
    MultiVariant,
    useTrackImpression,
    useTrackTimeSpent,
    useTrackClick,
} from "./useExperiment";
export type { ExperimentState, ExperimentContextValue } from "./useExperiment";

// Conductor Integration
export {
    useConductorExperiments,
    useConductorSlotVariant,
    mergeExperimentConfig,
} from "./conductorIntegration";
export type {
    ExperimentalOrchestrationConfig,
    LearningMetrics,
} from "./conductorIntegration";
