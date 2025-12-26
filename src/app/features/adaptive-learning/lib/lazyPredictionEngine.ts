/**
 * Lazy-loaded Prediction Engine
 *
 * Provides lazy-loading wrappers for the prediction engine functions.
 * The engine modules are loaded on-demand when first accessed, reducing
 * initial bundle size and deferring heavy computation until needed.
 */

import type {
    LearnerProfile,
    PathRecommendation,
    CompletionPrediction,
    LearningAnalytics,
} from "./types";

// Type for the engine module
type PredictionEngineModule = typeof import("./engine");

// Cached reference to the lazily loaded engine module
let engineModule: PredictionEngineModule | null = null;
let loadingPromise: Promise<PredictionEngineModule> | null = null;

/**
 * Dynamically import the prediction engine module.
 * Uses a singleton pattern to ensure the module is only loaded once.
 */
async function loadEngine(): Promise<PredictionEngineModule> {
    if (engineModule) {
        return engineModule;
    }

    if (loadingPromise) {
        return loadingPromise;
    }

    loadingPromise = import("./engine").then((mod) => {
        engineModule = mod;
        return mod;
    });

    return loadingPromise;
}

/**
 * Check if the engine has been loaded
 */
export function isEngineLoaded(): boolean {
    return engineModule !== null;
}

/**
 * Preload the engine without waiting for it.
 * Useful for preloading on hover or other anticipatory interactions.
 */
export function preloadEngine(): void {
    if (!engineModule && !loadingPromise) {
        loadEngine().catch(() => {
            // Silently fail preload, actual errors will be caught when functions are called
        });
    }
}

/**
 * Lazy-loaded version of generateRecommendations
 */
export async function lazyGenerateRecommendations(
    profile: LearnerProfile
): Promise<PathRecommendation[]> {
    const engine = await loadEngine();
    return engine.generateRecommendations(profile);
}

/**
 * Lazy-loaded version of generatePredictions
 */
export async function lazyGeneratePredictions(
    profile: LearnerProfile,
    nodeIds: string[]
): Promise<Record<string, CompletionPrediction>> {
    const engine = await loadEngine();
    return engine.generatePredictions(profile, nodeIds);
}

/**
 * Lazy-loaded version of analyzeLearningData
 */
export async function lazyAnalyzeLearningData(
    profile: LearnerProfile
): Promise<LearningAnalytics> {
    const engine = await loadEngine();
    return engine.analyzeLearningData(profile);
}
