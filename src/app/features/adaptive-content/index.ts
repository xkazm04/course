/**
 * Adaptive Content Density Feature
 *
 * An intelligent content system that dynamically adjusts chapter complexity
 * based on learner behavior signals. Tracks quiz performance, code playground
 * interactions, time spent on sections, and error patterns to build a real-time
 * comprehension model.
 *
 * The slot-based layout system automatically injects additional explanations,
 * simplified examples, or advanced challenges - content literally reshapes
 * itself to match each learner's level.
 *
 * @example
 * // Wrap your chapter content with the provider
 * <AdaptiveContentProvider courseId="react-hooks-101">
 *   <ChapterView mode="classic" />
 * </AdaptiveContentProvider>
 *
 * @example
 * // Use adaptive slots in your sections
 * <AdaptiveSectionWrapper sectionId="hooks-basics" topic="Custom Hooks">
 *   <SectionContent />
 * </AdaptiveSectionWrapper>
 *
 * @example
 * // Inject adaptive content dynamically
 * <AdaptiveSlotInjector sectionId="hooks-basics" topic="useState">
 *   <MainContent />
 * </AdaptiveSlotInjector>
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
} from "./lib/types";

export {
    DEFAULT_ADAPTATION_CONFIGS,
    COMPREHENSION_STORAGE_KEY,
    COMPREHENSION_VERSION,
} from "./lib/types";

// Comprehension Engine
export {
    calculateComprehensionScore,
    calculateSectionComprehension,
    updateComprehensionModel,
    createComprehensionModel,
    getComprehensionInsights,
} from "./lib/comprehensionEngine";

// Storage
export {
    loadComprehensionModel,
    saveComprehensionModel,
    recordSignal,
    clearComprehensionData,
    getStoredCourseIds,
    exportComprehensionData,
    importComprehensionData,
} from "./lib/comprehensionStorage";

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
} from "./lib/signalCollectors";

export type {
    QuizResultInput,
    PlaygroundStatsInput,
    SectionTimeInput,
    ErrorInput,
    VideoStatsInput,
    NavigationInput,
} from "./lib/signalCollectors";

// Content Adaptation Engine
export {
    generateAdaptiveSlots,
    adaptiveSlotsToContentSlots,
    getPaceRecommendation,
    getAdjustedQuizParams,
} from "./lib/contentAdaptationEngine";

export type { AdaptationContext } from "./lib/contentAdaptationEngine";

// Context and Hooks
export {
    AdaptiveContentProvider,
    useAdaptiveContent,
    useAdaptiveContentOptional,
    useSectionTimeTracker,
    useVideoTracker,
} from "./lib/AdaptiveContentContext";

// Slot Hooks
export {
    useAdaptiveSlots,
    useAdaptiveVisibility,
    useSectionAdaptation,
} from "./lib/useAdaptiveSlots";

// Tracker Hooks
export {
    useQuizTracker,
    usePlaygroundTracker,
    useNavigationTracker,
} from "./lib/useQuizTracker";

// Components
export {
    ComprehensionIndicator,
    ComprehensionBadge,
    StateMachineIndicator,
    StateBadge,
    StateJourneyVisualization,
    StateTransitionCelebration,
    StateProgress,
    StateJourneyTimeline,
    AdaptiveContentCard,
    AdaptiveSectionWrapper,
    AdaptiveSlotInjector,
    LevelProgress,
    SLOT_STYLES,
    LearningTimeline,
    CompactTimeline,
    // Concept Entanglement Graph Components
    GraphHealthOverview,
    ConceptNodeCard,
    RepairPathWizard,
    CascadeVisualization,
} from "./components";

// State Machine Types
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
} from "./lib/comprehensionStateMachine";

// State Machine Functions
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
} from "./lib/comprehensionStateMachine";

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
    StoredEventData,
    SessionMetadata,
    EventStoreStats,
    TimelineSegment,
    SegmentSummary,
    LearningPattern,
    PatternType,
    TimelineInsight,
    LearnerProfile,
    UseEventStoreOptions,
    UseEventStoreReturn,
    UsePatternDetectionOptions,
    UseSessionTrackingReturn,
    UseJourneyReplayOptions,
    UseJourneyReplayReturn,
} from "./lib";

export {
    // Learning Event Creation
    generateEventId,
    generateSessionId,
    getEventCategory,
    getEventSignificance,
    createLearningEvent,
    createMilestoneEvent,
    signalsToEvents,
    eventsToSignals,
    // Event Filtering
    filterByCategory,
    filterBySignificance,
    filterByTimeRange,
    filterBySession,
    filterBySection,
    sortByTime,
    sortBySignificance,
    // Event Store
    EventStore,
    getEventStore,
    clearEventStoreCache,
    // Timeline Analysis
    segmentTimeline,
    discoverPatterns,
    generateInsights,
    buildLearnerProfile,
    findEventCorrelations,
    // Hooks
    useEventStore,
    useEventSubscription,
    usePatternDetection,
    useSessionTracking,
    useJourneyReplay,
    // Concept Entanglement Graph
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
    // Concept Entanglement Hooks
    ConceptEntanglementProvider,
    useConceptEntanglement,
    useConceptEntanglementOptional,
    useConceptState,
    useRepairPath,
    useGraphHealth,
    useConceptSignalBridge,
} from "./lib";

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
} from "./lib";

// ============================================================================
// Predictive Learning Path Orchestrator with Neural Foresight
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
    ScaffoldingSlot,
    ScaffoldingState,
    InjectionPosition,
    UsePredictiveLearningOptions,
    UsePredictiveLearningReturn,
    UseScaffoldingDisplayOptions,
    UseScaffoldingDisplayReturn,
    PredictiveLearningContextValue,
} from "./lib";

export {
    // Configuration
    DEFAULT_PREDICTIVE_CONFIG,
    PREDICTIVE_STORAGE_KEY,
    PREDICTIVE_VERSION,
    // Temporal Pattern Analysis
    enrichSignalsWithTemporal,
    groupBySection,
    detectQuizHesitation,
    detectErrorSequences,
    detectVideoPatterns,
    detectNavigationPatterns,
    detectPreStruggleSignals,
    calculateSignalAttention,
    createSequenceEmbedding,
    // Predictive Engine
    findMatchingPatterns,
    encodePatternSignature,
    aggregatePreStruggleSignals,
    createPredictiveModelState,
    updatePredictiveModel,
    recordInterventionOutcome,
    validatePrediction,
    recordToCollectivePatterns,
    // Proactive Scaffolding
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
    // Hooks
    usePredictiveLearning,
    usePredictiveSignalBridge,
    useScaffoldingDisplay,
    // Context
    PredictiveLearningProvider,
    usePredictiveLearningContext,
    usePredictiveLearningOptional,
    useSectionPrediction,
    useInterventionManager,
    usePredictionStats,
    AdaptivePredictiveProvider,
} from "./lib";

// Predictive Intervention Components
export {
    PredictiveInterventionPanel,
    FloatingInterventionContainer,
    InlineInterventionCard,
    PredictionPreviewBadge,
    PredictionStats,
} from "./components";
