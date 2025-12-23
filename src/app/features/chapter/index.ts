// Unified polymorphic ChapterView component (preferred)
export { ChapterView } from "./ChapterView";
export type { ChapterViewProps, ChapterViewVariantProps } from "./ChapterView";

// Adaptive ChapterView with intelligent content density
export { AdaptiveChapterView, AdaptiveModeRenderer } from "./AdaptiveChapterView";
export type { AdaptiveChapterViewProps } from "./AdaptiveChapterView";

// AI-Orchestrated Conductor ChapterView
export { ConductorChapterView } from "./ConductorChapterView";
export type { ConductorChapterViewProps } from "./ConductorChapterView";

// Mode templates are now inlined in ChapterView - use layout templates directly
// Import from ./lib for classicLayoutTemplate, expandableLayoutTemplate, ideLayoutTemplate

// Playback speed components and hooks
export { PlaybackSpeedControl, SpeedIndicator, SpeedChangeToast } from "./components";

// Chapter Graph Components
export {
    PrerequisiteWarning,
    SuggestedNextChapters,
    ChapterStatusBadge,
} from "./components";
export type {
    PrerequisiteWarningProps,
    SuggestedNextChaptersProps,
    ChapterStatusBadgeProps,
} from "./components";

// AI Learning Conductor Components
export {
    PeerSolutionCard,
    PeerSolutionsPanel,
    OrchestrationCard,
    OrchestrationCardCompact,
    CelebrationOverlay,
} from "./components";
export type {
    PeerSolutionCardProps,
    PeerSolutionsPanelProps,
    OrchestrationCardProps,
    CelebrationOverlayProps,
} from "./components";
export {
    usePlaybackSpeed,
    useVideoKeyboardShortcuts,
    getPlaybackSpeed,
    setPlaybackSpeed,
    increaseSpeed,
    decreaseSpeed,
    getSkipSilence,
    setSkipSilence,
    toggleSkipSilence,
    formatSpeed,
    PRESET_SPEEDS,
    MIN_SPEED,
    MAX_SPEED,
    SPEED_STEP,
    DEFAULT_SPEED,
    // Chapter state and modes
    useChapterState,
    MODE_CONFIGS,
    getModeConfig,
    VARIANT_TO_MODE,
    MODE_TO_VARIANT,
    // Chapter data
    COURSE_INFO,
    HOOKS_FUNDAMENTALS_COURSE_INFO,
    CHAPTER_SECTIONS,
    getSimplifiedSections,
} from "./lib";
export type {
    SpeedPreferences,
    ChapterStateConfig,
    ChapterState,
    ChapterMode,
    ModeRendererProps,
    ModeConfig,
    CourseInfo,
    ChapterSection,
    // Content Slot types
    ContentSlot,
    VideoSlot,
    CodeSlot,
    KeyPointsSlot,
    QuizSlot,
    NavigationSlot,
    TextSlot,
    ProgressSlot,
    ActionsSlot,
    SectionListSlot,
    PlaygroundSlot,
    HeaderSlot,
    SlotType,
    LayoutRegion,
    SlotPlacement,
    LayoutTemplate,
    SlotRendererProps,
} from "./lib";

// Content Slot System
export {
    // Slot factory functions
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
    // Type guards
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
    // Layout templates
    classicLayoutTemplate,
    expandableLayoutTemplate,
    ideLayoutTemplate,
    layoutTemplates,
    getLayoutTemplate,
    getSlotsForRegion,
    getSlotById,
    createLayout,
    LayoutBuilder,
} from "./lib";

// Slot Renderers
export {
    SlotRenderer,
    SlotListRenderer,
    SlotBasedLayout,
    VideoSlotRenderer,
    CodeSlotRenderer,
    KeyPointsSlotRenderer,
    NavigationSlotRenderer,
    TextSlotRenderer,
    ProgressSlotRenderer,
    ActionsSlotRenderer,
    SectionListSlotRenderer,
    PlaygroundSlotRenderer,
    HeaderSlotRenderer,
} from "./slots";

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
    // React hooks
    useChapterGraph,
    useCurriculumChapters,
    useCurriculumEdges,
    useChapterAvailability,
    useCourseProgress,
    useLearningPathRecommendations,
    // Curriculum data
    CURRICULUM_CHAPTERS,
    CHAPTER_CURRICULUM_EDGES,
    getChapterNode,
    getChaptersByCourse,
    getChaptersByDomain,
    areChapterPrerequisitesMet,
    getChapterPrerequisiteWarnings,
    getOptimalChapterOrder,
    calculateCourseXP,
    calculateCourseDuration,
} from "./lib";
export type {
    ChapterNodeId,
    NodeGranularity,
    ChapterDifficulty,
    ChapterNodeStatus,
    ChapterNode,
    ChapterSectionNode,
    ChapterEdge,
    ChapterGraph,
    ChapterGraphData,
    UseChapterGraphOptions,
} from "./lib";

// AI Learning Conductor exports from lib
export {
    LearningConductorProvider,
    useLearningConductor,
    useBehaviorTracking,
    useOrchestration,
    learnerProfileStorage,
    behaviorEventStorage,
    sectionBehaviorStorage,
    collectiveInsightStorage,
    peerSolutionStorage,
    decisionStorage,
    conductorConfigStorage,
    getDefaultSectionBehavior,
    DEFAULT_CONDUCTOR_CONFIG,
    DEFAULT_VIDEO_BEHAVIOR,
    DEFAULT_QUIZ_BEHAVIOR,
    DEFAULT_CODE_BEHAVIOR,
    DEFAULT_SECTION_BEHAVIOR,
    DEFAULT_LEARNER_PROFILE,
} from "./lib";

export type {
    ConductorContextValue,
    ConductorProviderProps,
    UseBehaviorTrackingOptions,
    UseBehaviorTrackingReturn,
    UseOrchestrationOptions,
    UseOrchestrationReturn,
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
} from "./lib";

/**
 * Chapter variant metadata
 * Maps display names to variant keys and modes
 */
export const chapterVariants = [
    { name: "Classic", key: "A", mode: "classic" as const },
    { name: "Expandable", key: "C", mode: "expandable" as const },
    { name: "IDE", key: "D", mode: "ide" as const },
    { name: "AI Conductor", key: "conductor", mode: "classic" as const },
];
