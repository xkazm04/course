export {
    getPlaybackSpeed,
    setPlaybackSpeed,
    increaseSpeed,
    decreaseSpeed,
    getSkipSilence,
    setSkipSilence,
    toggleSkipSilence,
    clearSpeedPreference,
    resetAllSpeedPreferences,
    formatSpeed,
    PRESET_SPEEDS,
    MIN_SPEED,
    MAX_SPEED,
    SPEED_STEP,
    DEFAULT_SPEED,
} from "./speedStorage";
export type { SpeedPreferences } from "./speedStorage";

export { usePlaybackSpeed } from "./usePlaybackSpeed";
export { useVideoKeyboardShortcuts } from "./useKeyboardShortcuts";

export {
    COURSE_INFO,
    HOOKS_FUNDAMENTALS_COURSE_INFO,
    CHAPTER_SECTIONS,
    getSimplifiedSections,
    getSectionById,
    getSectionByNumericId,
    calculateProgress,
    getTotalDuration,
    // LearningNode conversion functions
    chapterSectionToLearningNode,
    learningNodeToChapterSectionUpdate,
} from "./chapterData";
export type {
    SectionType,
    SectionContent,
    ChapterSection,
    SimplifiedSection,
    CourseInfo,
} from "./chapterData";

// Unified chapter state hook
export { useChapterState } from "./useChapterState";
export type { ChapterStateConfig, ChapterState } from "./useChapterState";

// Chapter mode definitions
export {
    MODE_CONFIGS,
    getModeConfig,
    VARIANT_TO_MODE,
    MODE_TO_VARIANT,
} from "./chapterModes";
export type {
    ChapterMode,
    ModeRendererProps,
    ModeRenderer,
    ModeRendererMap,
    ModeConfig,
} from "./chapterModes";

// Content Slot System
export {
    createVideoSlot,
    createCodeSlot,
    createKeyPointsSlot,
    createQuizSlot,
    createNavigationSlot,
    createTextSlot,
    createProgressSlot,
    createActionsSlot,
    createSectionListSlot,
    createPlaygroundSlot,
    createHeaderSlot,
    isVideoSlot,
    isCodeSlot,
    isKeyPointsSlot,
    isQuizSlot,
    isNavigationSlot,
    isTextSlot,
    isProgressSlot,
    isActionsSlot,
    isSectionListSlot,
    isPlaygroundSlot,
    isHeaderSlot,
} from "./contentSlots";
export type {
    ContentSlot,
    VideoSlot,
    VideoSlotData,
    CodeSlot,
    CodeSlotData,
    KeyPointsSlot,
    KeyPointsSlotData,
    QuizSlot,
    QuizSlotData,
    NavigationSlot,
    NavigationSlotData,
    TextSlot,
    TextSlotData,
    ProgressSlot,
    ProgressSlotData,
    ActionsSlot,
    ActionsSlotData,
    SectionListSlot,
    SectionListSlotData,
    PlaygroundSlot,
    PlaygroundSlotData,
    HeaderSlot,
    HeaderSlotData,
    SlotType,
    LayoutRegion,
    SlotPlacement,
    LayoutTemplate,
    ResponsiveConfig,
    SlotRendererProps,
} from "./contentSlots";

// Layout Templates
export {
    classicLayoutTemplate,
    expandableLayoutTemplate,
    ideLayoutTemplate,
    layoutTemplates,
    getLayoutTemplate,
    getSlotsForRegion,
    getSlotById,
    createLayout,
    LayoutBuilder,
} from "./layoutTemplates";
export type { LayoutBuilderConfig } from "./layoutTemplates";

// Chapter Layout Engine (ComposableLayoutEngine pattern)
export {
    chapterEngine,
    chapterRendererMap,
    createChapterLayoutBuilder,
    validateChapterLayout,
    getChapterSlotsForRegion,
    computeChapterRegionSlots,
} from "./chapterLayoutEngine";
export type { ChapterSlot, ChapterContext, ChapterRegion } from "./chapterLayoutEngine";

// Chapter Graph System - Chapters as first-class nodes in curriculum DAG
export {
    // Node ID helpers
    createChapterNodeId,
    createSectionNodeId,
    parseChapterNodeId,
    // Conversion functions
    sectionToNode,
    sectionsToNodes,
    createChapterNode,
    // Prerequisite functions
    getChapterPrerequisites,
    getChapterDependents,
    getSuggestedNextChapters,
    arePrerequisitesMet,
    getPrerequisiteWarnings,
    getChapterNodeStatus,
    // Section dependencies
    getSectionDependencies,
    isSectionAvailable,
    getNextAvailableSection,
    // Graph traversal
    getReachableChapters,
    getOptimalLearningPath,
    calculatePathXP,
    calculatePathDuration,
    formatPathDuration,
} from "./chapterGraph";
export type {
    ChapterNodeId,
    NodeGranularity,
    ChapterDifficulty,
    ChapterNodeStatus,
    ChapterNode,
    ChapterSectionNode,
    ChapterEdge,
    ChapterGraph,
} from "./chapterGraph";

// Curriculum Chapter Data - Pre-defined chapter nodes and edges
export {
    REACT_HOOKS_CHAPTERS,
    FULLSTACK_CHAPTERS,
    BACKEND_CHAPTERS,
    CURRICULUM_CHAPTERS,
    CHAPTER_CURRICULUM_EDGES,
    // Accessors
    getChapterNode,
    getChaptersByCourse,
    getChaptersByDomain,
    getChapterPrerequisites as getCurriculumChapterPrerequisites,
    getSuggestedNextChapters as getCurriculumSuggestedNextChapters,
    areChapterPrerequisitesMet,
    getChapterPrerequisiteWarnings,
    getOptimalChapterOrder,
    calculateCourseXP,
    calculateCourseDuration,
} from "./curriculumChapters";

// Chapter Graph React Hooks
export {
    useChapterGraph,
    useCurriculumChapters,
    useCurriculumEdges,
    useChapterAvailability,
    useCourseProgress,
    useLearningPathRecommendations,
} from "./useChapterGraph";
export type { ChapterGraphData, UseChapterGraphOptions } from "./useChapterGraph";

// Code Diff Utilities
export {
    computeDiff,
    formatDiffStats,
    hasChanges,
} from "./codeDiff";
export type {
    DiffLineType,
    DiffLine,
    DiffHunk,
    DiffResult,
    DiffStats,
} from "./codeDiff";

// AI Learning Conductor
export {
    LearningConductorProvider,
    useLearningConductor,
} from "./LearningConductorContext";
export type { ConductorContextValue, ConductorProviderProps } from "./LearningConductorContext";

export { useBehaviorTracking } from "./useBehaviorTracking";
export type { UseBehaviorTrackingOptions, UseBehaviorTrackingReturn } from "./useBehaviorTracking";

// Behavior Tracking Context (for slot renderers)
export {
    BehaviorTrackingProvider,
    useBehaviorTrackingContext,
    useRequiredBehaviorTracking,
} from "./BehaviorTrackingContext";
export type {
    BehaviorTrackingCallbacks,
    BehaviorTrackingProviderProps,
} from "./BehaviorTrackingContext";

export { useOrchestration } from "./useOrchestration";
export type { UseOrchestrationOptions, UseOrchestrationReturn } from "./useOrchestration";

// Conductor Storage
export {
    learnerProfileStorage,
    behaviorEventStorage,
    sectionBehaviorStorage,
    collectiveInsightStorage,
    peerSolutionStorage,
    decisionStorage,
    conductorConfigStorage,
    getDefaultSectionBehavior,
} from "./conductorStorage";

// Conductor Types
export type {
    BehaviorEventType,
    BehaviorEvent,
    VideoBehavior,
    QuizBehavior,
    CodeBehavior,
    SectionBehavior,
    LearnerPace,
    LearnerConfidence,
    ContentDepth,
    LearnerProfile,
    OrchestrationAction,
    OrchestrationDecision,
    RemedialContent,
    PeerSolution,
    SectionPriority,
    OptimizedSectionOrder,
    CollectiveInsight,
    PlatformIntelligence,
    ConductorState,
    ConductorConfig,
    UseConductorReturn,
} from "./conductorTypes";

export {
    DEFAULT_CONDUCTOR_CONFIG,
    DEFAULT_VIDEO_BEHAVIOR,
    DEFAULT_QUIZ_BEHAVIOR,
    DEFAULT_CODE_BEHAVIOR,
    DEFAULT_SECTION_BEHAVIOR,
    DEFAULT_LEARNER_PROFILE,
} from "./conductorTypes";
