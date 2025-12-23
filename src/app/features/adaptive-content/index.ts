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
    AdaptiveContentCard,
    AdaptiveSectionWrapper,
    AdaptiveSlotInjector,
    LevelProgress,
    SLOT_STYLES,
} from "./components";
