/**
 * Generative Content Library Exports
 */

// Types
export type {
    LearningPathSeed,
    ContentGenerationParams,
    VideoScriptSegment,
    GeneratedVideoScript,
    ProgressiveCodeExample,
    GeneratedQuizQuestion,
    GeneratedKeyPoints,
    GeneratedChapter,
    GeneratedChapterSection,
    ContentQualityMetrics,
    ContentRating,
    ContentAnnotation,
    ContentVersion,
    ContentFork,
    GenerationJob,
    SlotGenerationConfig,
} from "./types";

// Type helpers and constants
export {
    createPathSeed,
    createDefaultGenerationParams,
    calculateQualityScore,
    SLOT_GENERATION_CONFIGS,
} from "./types";

// Content Generator
export {
    generateChapter,
    createGenerationJob,
    getGenerationJob,
} from "./contentGenerator";

// Storage
export {
    // Path storage
    savePath,
    getAllPaths,
    getPathById,
    getPathsByUser,
    searchPathsByTopics,
    pathExists,
    deletePath,

    // Chapter storage
    saveChapter,
    getAllChapters,
    getChapterById,
    getChaptersByPathSeed,
    getPublishedChapters,
    updateChapterStatus,
    deleteChapter,

    // Rating storage
    saveRating,
    getAllRatings,
    getRatingsForContent,
    getAverageRating,
    hasUserRated,
    getUserRating,

    // Annotation storage
    saveAnnotation,
    getAnnotationsForContent,
    getPublicAnnotations,
    getUserAnnotations,
    upvoteAnnotation,
    markAnnotationIncorporated,
    deleteAnnotation,

    // Version storage
    saveVersion,
    getVersionsForContent,
    getCurrentVersion,
    restoreVersion,

    // Fork storage
    saveFork,
    getForksOfChapter,
    getForksByUser,
    getForkInfo,
    markForkMerged,

    // Job storage
    saveJob,
    getJobById,
    getActiveJobs,
    getJobsForPathSeed,
    cleanupOldJobs,

    // User tracking
    trackUserPath,
    getUserExploredPaths,
    getPathPopularity,

    // Quality metrics
    updateQualityMetrics,

    // Namespace export
    pathStorage,
} from "./pathStorage";

// React Hooks
export {
    useCurrentUser,
    useLearningPaths,
    useContentGeneration,
    useGeneratedChapters,
    useContentRating,
    useContentAnnotations,
    useContentVersions,
    useContentForking,
    useGenerativeContentManager,
} from "./useGenerativeContent";
