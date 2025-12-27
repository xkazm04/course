/**
 * Adaptive Content Library
 *
 * Core library for adaptive content density based on comprehension.
 */

// Types
export type {
    ComprehensionLevel,
    ComprehensionScore,
    ComprehensionModel,
    SectionComprehension,
    AdaptationConfig,
    BehaviorSignal,
    QuizSignal,
    PlaygroundSignal,
    SectionTimeSignal,
    ErrorPatternSignal,
    VideoSignal,
    NavigationSignal,
    AdaptiveSlot,
    AdaptiveSlotContent,
    SectionAdaptiveContent,
    StoredComprehensionData,
} from "./types";

export { DEFAULT_ADAPTATION_CONFIGS, COMPREHENSION_STORAGE_KEY, COMPREHENSION_VERSION } from "./types";

// Comprehension Engine
export {
    calculateComprehensionScore,
    calculateSectionComprehension,
    updateComprehensionModel,
    createComprehensionModel,
    getComprehensionInsights,
    clearInsightsCache,
} from "./comprehensionEngine";

// Storage
export {
    loadComprehensionModel,
    saveComprehensionModel,
    recordSignal,
    clearComprehensionData,
    getStoredCourseIds,
    exportComprehensionData,
    importComprehensionData,
} from "./comprehensionStorage";

// Signal Collectors
export {
    createQuizSignal,
    createPlaygroundSignal,
    createSectionTimeSignal,
    createErrorPatternSignal,
    createVideoSignal,
    createNavigationSignal,
    classifyErrorType,
    SessionSignalCollector,
} from "./signalCollectors";
export type {
    QuizResultInput,
    PlaygroundStatsInput,
    SectionTimeInput,
    ErrorInput,
    VideoStatsInput,
    NavigationInput,
} from "./signalCollectors";

// Content Adaptation
export {
    generateAdaptiveSlots,
    generateAdaptiveSlotsWithCollaborativeFiltering,
    adaptiveSlotsToContentSlots,
    getPaceRecommendation,
    getAdjustedQuizParams,
    trackContentView,
    recordContentImpact,
} from "./contentAdaptationEngine";
export type {
    AdaptationContext,
    EnhancedAdaptationContext,
    ContentViewTracker,
} from "./contentAdaptationEngine";

// Collaborative Filtering
export type {
    LearnerFingerprint,
    HelpfulContent,
    LearningPattern as CollaborativeLearningPattern,
    CollectivePatterns,
    CollaborativeRecommendation,
} from "./collaborativeFiltering";

export {
    calculateLearnerSimilarity,
    findSimilarLearners,
    generateLearnerFingerprint,
    findMatchingPatterns,
    generateCollaborativeRecommendations,
    recordContentEffectiveness,
    detectStrugglePattern,
    createEmptyCollectivePatterns,
} from "./collaborativeFiltering";

// Collective Patterns Storage
export {
    loadCollectivePatterns,
    saveCollectivePatterns,
    addOrUpdateFingerprint,
    addLearningPattern,
    recordHelpfulContent,
    getCollectiveStats,
    getSectionContentEffectiveness,
    clearCollectivePatterns,
    clearUserData,
    exportCollectivePatterns,
    importCollectivePatterns,
} from "./collectivePatternsStorage";

// Collaborative Filtering Hooks
export type {
    UseCollaborativeFilteringOptions,
    UseCollaborativeFilteringReturn,
    UseContentTrackingOptions,
    UseSimilarLearnersReturn,
} from "./useCollaborativeFiltering";

export {
    useCollaborativeFiltering,
    useContentTracking,
    useSimilarLearners,
} from "./useCollaborativeFiltering";

// Context and Hooks
export {
    AdaptiveContentProvider,
    useAdaptiveContent,
    useAdaptiveContentOptional,
    useSectionTimeTracker,
    useVideoTracker,
} from "./AdaptiveContentContext";

// Comprehension State Machine
export type {
    ComprehensionState,
    StateTransition,
    StateEntryCondition,
    StateExitCondition,
    StateDefinition,
    TransitionMetrics,
    StateTransitionEvent,
    ComprehensionStateMachineModel,
    TransitionMessage,
} from "./comprehensionStateMachine";

export {
    STATE_DEFINITIONS,
    TRANSITION_MESSAGES,
    calculateTransitionMetrics,
    evaluateTransitions,
    detectStuckPattern,
    createStateMachineModel,
    updateStateMachine,
    getProgressToNextState,
    stateToLegacyLevel,
    getStateDefinition,
} from "./comprehensionStateMachine";

// Slot Hooks
export {
    useAdaptiveSlots,
    useAdaptiveVisibility,
    useSectionAdaptation,
} from "./useAdaptiveSlots";

// Tracker Hooks
export {
    useQuizTracker,
    usePlaygroundTracker,
    useNavigationTracker,
} from "./useQuizTracker";

// Learning Events System
export type {
    LearningEvent,
    LearningEventId,
    SessionId,
    EventCategory,
    EventSignificance,
    LearningEventMeta,
    LearningEventContext,
    QuizEvent,
    PlaygroundEvent,
    SectionTimeEvent,
    ErrorPatternEvent,
    VideoEvent,
    NavigationEvent,
    SessionStartSignal,
    SessionEndSignal,
    MilestoneSignal,
    ExtendedSignal,
} from "./learningEvents";

export {
    generateEventId,
    generateSessionId,
    getEventCategory,
    getEventSignificance,
    createLearningEvent,
    createMilestoneEvent,
    signalsToEvents,
    eventsToSignals,
    filterByCategory,
    filterBySignificance,
    filterByTimeRange,
    filterBySession,
    filterBySection,
    sortByTime,
    sortBySignificance,
} from "./learningEvents";

// Event Store
export type {
    StoredEventData,
    SessionMetadata,
    EventStoreStats,
} from "./eventStore";

export {
    EventStore,
    getEventStore,
    clearEventStoreCache,
} from "./eventStore";

// Timeline Analysis
export type {
    TimelineSegment,
    SegmentSummary,
    LearningPattern,
    PatternType,
    TimelineInsight,
    LearnerProfile,
} from "./timelineAnalysis";

export {
    segmentTimeline,
    discoverPatterns,
    generateInsights,
    buildLearnerProfile,
    findEventCorrelations,
} from "./timelineAnalysis";

// Event Store Hooks
export type {
    UseEventStoreOptions,
    UseEventStoreReturn,
    UsePatternDetectionOptions,
    UseSessionTrackingReturn,
    UseJourneyReplayOptions,
    UseJourneyReplayReturn,
} from "./useEventStore";

export {
    useEventStore,
    useEventSubscription,
    usePatternDetection,
    useSessionTracking,
    useJourneyReplay,
} from "./useEventStore";

// Concept Entanglement Graph Types
export type {
    ConceptId,
    EntanglementState,
    ConceptEdgeType,
    ConceptNode,
    ConceptEdge,
    ConceptEntanglement,
    RootCauseResult,
    ForwardImpactResult,
    RepairPath,
    LearningTransferPattern,
    ConceptEntanglementGraph,
} from "./conceptEntanglementGraph";

// Concept Entanglement Graph Functions
export {
    scoreToEntanglementState,
    calculateConceptComprehension,
    createEmptyGraph,
    addConceptNode,
    addConceptEdge,
    updateConceptEntanglement,
    findRootCause,
    analyzeForwardImpact,
    generateRepairPath,
    updateEdgeWeights,
    recordTransferPattern,
    getStrugglingConcepts,
    getKeystoneConcepts,
    getCriticalPath,
    calculateGraphHealth,
} from "./conceptEntanglementGraph";

// Concept Entanglement Hooks
export {
    ConceptEntanglementProvider,
    useConceptEntanglement,
    useConceptEntanglementOptional,
    useConceptState,
    useRepairPath,
    useGraphHealth,
    useConceptSignalBridge,
} from "./useConceptEntanglement";

// ============================================================================
// Predictive Learning Path Orchestrator
// ============================================================================

// Predictive Learning Types
export type {
    PreStruggleIndicator,
    StruggeSeverity,
    PredictionHorizon,
    TemporalSignal,
    QuizHesitationPattern,
    ErrorSequencePattern,
    VideoEngagementPattern,
    NavigationBehaviorPattern,
    PreStruggleSignal,
    PreStruggleEvidence,
    StruggePrediction,
    InterventionRecommendation,
    InterventionType,
    InterventionContent,
    SignalAttention,
    SequenceEmbedding,
    LearnerJourneyPattern,
    PredictiveModelState,
    ActiveIntervention,
    CollectiveStrugglePattern,
    CollectiveLearnerModel,
    PredictionEvent,
    PredictiveConfig,
    StoredPredictiveData,
} from "./predictiveLearning.types";

export {
    DEFAULT_PREDICTIVE_CONFIG,
    PREDICTIVE_STORAGE_KEY,
    PREDICTIVE_VERSION,
} from "./predictiveLearning.types";

// Temporal Pattern Analyzer
export {
    enrichSignalsWithTemporal,
    groupBySection,
    detectQuizHesitation,
    detectErrorSequences,
    detectVideoPatterns,
    detectNavigationPatterns,
    detectPreStruggleSignals,
    calculateSignalAttention,
    createSequenceEmbedding,
} from "./temporalPatternAnalyzer";

// Predictive Engine
export {
    findMatchingPatterns as findMatchingPredictivePatterns,
    encodePatternSignature,
    aggregatePreStruggleSignals,
    createPredictiveModelState,
    updatePredictiveModel,
    recordInterventionOutcome,
    validatePrediction,
    recordToCollectivePatterns,
} from "./predictiveEngine";

// Proactive Scaffolding Engine
export type {
    ScaffoldingSlot,
    ScaffoldingState,
    InjectionPosition,
} from "./proactiveScaffoldingEngine";

export {
    interventionToScaffoldingSlot,
    scaffoldingSlotToContentSlot,
    scaffoldingSlotToAdaptiveSlot,
    determineInjectionPosition,
    prioritizeScaffoldingSlots,
    injectScaffoldingIntoContent,
    getFloatingScaffolding,
    createScaffoldingState,
    shouldShowScaffolding,
    markScaffoldingShown,
    markScaffoldingDismissed,
    markScaffoldingEngaged,
    estimateTimeSaved,
    calculateScaffoldingEffectiveness,
    INTERVENTION_PRIORITY,
    INTERVENTION_DISPLAY,
} from "./proactiveScaffoldingEngine";

// Predictive Learning Hooks
export type {
    UsePredictiveLearningOptions,
    UsePredictiveLearningReturn,
    UseScaffoldingDisplayOptions,
    UseScaffoldingDisplayReturn,
} from "./usePredictiveLearning";

export {
    usePredictiveLearning,
    usePredictiveSignalBridge,
    useScaffoldingDisplay,
} from "./usePredictiveLearning";

// Predictive Learning Context
export type {
    PredictiveLearningContextValue,
} from "./PredictiveLearningContext";

export {
    PredictiveLearningProvider,
    usePredictiveLearningContext,
    usePredictiveLearningOptional,
    useSectionPrediction,
    useInterventionManager,
    usePredictionStats,
    AdaptivePredictiveProvider,
} from "./PredictiveLearningContext";
