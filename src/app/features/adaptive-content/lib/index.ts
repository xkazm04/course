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
    adaptiveSlotsToContentSlots,
    getPaceRecommendation,
    getAdjustedQuizParams,
} from "./contentAdaptationEngine";
export type { AdaptationContext } from "./contentAdaptationEngine";

// Context and Hooks
export {
    AdaptiveContentProvider,
    useAdaptiveContent,
    useAdaptiveContentOptional,
    useSectionTimeTracker,
    useVideoTracker,
} from "./AdaptiveContentContext";

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
