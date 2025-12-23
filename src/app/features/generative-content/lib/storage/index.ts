/**
 * Storage Module Exports
 *
 * Barrel file for generative content storage functions.
 */

// Constants
export { STORAGE_KEYS } from "./constants";

// Helpers
export { getStorageItem, setStorageItem } from "./helpers";

// Path seed storage
export {
    savePath,
    getAllPaths,
    getPathById,
    getPathsByUser,
    searchPathsByTopics,
    pathExists,
    deletePath,
} from "./pathSeedStorage";

// Chapter storage
export {
    saveChapter,
    getAllChapters,
    getChapterById,
    getChaptersByPathSeed,
    getPublishedChapters,
    updateChapterStatus,
    deleteChapter,
} from "./chapterStorage";

// Rating storage
export {
    saveRatingOnly,
    getAllRatings,
    getRatingsForContent,
    getAverageRating,
    hasUserRated,
    getUserRating,
} from "./ratingStorage";

// Annotation storage
export {
    saveAnnotation,
    getAnnotationsForContent,
    getPublicAnnotations,
    getUserAnnotations,
    upvoteAnnotation,
    markAnnotationIncorporated,
    deleteAnnotation,
} from "./annotationStorage";

// Version storage
export {
    saveVersion,
    getVersionsForContent,
    getCurrentVersion,
    restoreVersion,
} from "./versionStorage";

// Fork storage
export {
    saveForkOnly,
    getAllForks,
    getForksOfChapter,
    getForksByUser,
    getForkInfo,
    markForkMerged,
} from "./forkStorage";

// Job storage
export {
    saveJob,
    getJobById,
    getActiveJobs,
    getJobsForPathSeed,
    cleanupOldJobs,
} from "./jobStorage";

// User path storage
export {
    trackUserPath,
    getUserExploredPaths,
    getPathPopularity,
} from "./userPathStorage";

// Quality metrics
export {
    updateQualityMetrics,
    updateForkCount,
    calculateOverallScore,
    determineTrend,
} from "./qualityMetrics";
