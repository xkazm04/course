export * from "./types";
export * from "./behaviorStorage";
export { AdaptiveLearningProvider, useAdaptiveLearning } from "./AdaptiveLearningContext";
// Note: predictionEngine is no longer exported directly to encourage lazy loading.
// Use the lazy-loaded versions from lazyPredictionEngine or via context.refreshRecommendations()
export {
    lazyGenerateRecommendations,
    lazyGeneratePredictions,
    lazyAnalyzeLearningData,
    preloadEngine,
    isEngineLoaded,
} from "./lazyPredictionEngine";
