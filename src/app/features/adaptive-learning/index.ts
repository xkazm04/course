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

export {
    generateRecommendations,
    generatePredictions,
    analyzeLearningData,
    calculateLearningVelocity,
    analyzeSkillGaps,
} from "./lib/predictionEngine";
