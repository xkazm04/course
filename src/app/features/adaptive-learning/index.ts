// Components
export { AdaptiveLearningMap } from "./components/AdaptiveLearningMap";
export {
    NodePredictionOverlay,
    PathVisualizer,
    RecommendedPathIndicator,
    AnimatedConnection,
} from "./components/NodePredictionOverlay";

// Context & Hooks
export { AdaptiveLearningProvider, useAdaptiveLearning } from "./lib/AdaptiveLearningContext";

// Types
export type {
    LearnerProfile,
    LearningSession,
    SkillAssessment,
    CareerObjective,
    CompletionPrediction,
    PredictionFactor,
    PathRecommendation,
    AdaptationSuggestion,
    JobMarketData,
    SkillGapAnalysis,
    LearningVelocity,
    LearningAnalytics,
    AdaptiveLearningState,
} from "./lib/types";

// Utilities
export {
    getLearnerProfile,
    saveLearnerProfile,
    startLearningSession,
    endLearningSession,
    recordNodeView,
    markNodeCompleted,
    toggleNodeBookmark,
} from "./lib/behaviorStorage";

// Lazy-loaded prediction engine functions (for code splitting)
export {
    lazyGenerateRecommendations,
    lazyGeneratePredictions,
    lazyAnalyzeLearningData,
    preloadEngine,
    isEngineLoaded,
} from "./lib/lazyPredictionEngine";

// Direct engine access (for components that need synchronous access)
// Note: These are NOT lazy-loaded and will be bundled with the initial chunk.
// Prefer using the lazy versions above for better initial load performance.
export {
    calculateLearningVelocity,
    analyzeSkillGaps,
} from "./lib/predictionEngine";
