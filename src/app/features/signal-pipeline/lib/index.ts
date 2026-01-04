/**
 * Signal Pipeline - Library Exports
 */

// Core types
export type {
    SignalId,
    PipelineId,
    SessionId,
    BaseSignal,
    CollectedSignal,
    CollectionStage,
    CollectionContext,
    AggregationStage,
    AggregationContext,
    WindowConfig,
    DecisionStage,
    DecisionContext,
    DecisionResult,
    PipelineConfig,
    PersistenceConfig,
    ReplayConfig,
    PipelineState,
    StoredPipelineState,
    SessionMetadata,
    PipelineEvent,
    PipelineEventListener,
    PipelineStats,
    PipelineBuilder as PipelineBuilderType,
    SignalOf,
    AggregateOf,
    DecisionOf,
} from "./types";

export {
    generateSignalId,
    generateSessionId,
    generatePipelineId,
} from "./types";

// Core pipeline class
export {
    SignalPipeline,
    createPipeline,
    getPipeline,
    clearPipelineCache,
} from "./SignalPipeline";

// Builder pattern
export {
    PipelineBuilder,
    pipeline,
    createSignal,
    countByType,
    groupSignals,
    average,
    latest,
    thresholdDecision,
    significantChange,
} from "./PipelineBuilder";

// React hooks
export {
    useSignalPipeline,
    useAggregate,
    useLatestDecision,
    useDecisionCount,
    useSessionTracking,
} from "./useSignalPipeline";

export type {
    UseSignalPipelineOptions,
    UseSignalPipelineReturn,
    SessionTracking,
} from "./useSignalPipeline";

// Presets
export {
    // Learning pipeline
    createLearningPipeline,
    // Contribution pipeline
    createContributionPipeline,
    // Quality pipeline
    createQualityPipeline,
    // Velocity pipeline
    createVelocityPipeline,
} from "./presets";

export type {
    // Learning types
    LearningSignal,
    LearningAggregate,
    LearningDecision,
    ComprehensionLevel,
    // Contribution types
    ContributionSignal,
    ContributionAggregate,
    ContributionDecision,
    ContributionEventType,
    ContributionHealth,
    // Quality types
    QualitySignal,
    QualityAggregate,
    QualityDecision,
    QualityGrade,
    // Velocity types
    VelocitySignal,
    VelocityAggregate,
    VelocityDecision,
    EngagementLevel,
} from "./presets";
