/**
 * Path Storage and Tracking
 *
 * This module handles persistent storage for user learning paths, generated content,
 * and content quality metrics. It uses localStorage for client-side persistence
 * with the option to sync to a backend.
 */

import type { ContentRating, ContentFork } from "./types";
import {
    // Path seed storage
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
    saveRatingOnly,
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
    saveForkOnly,
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
    // User path storage
    trackUserPath,
    getUserExploredPaths,
    getPathPopularity,
    // Quality metrics
    updateQualityMetrics,
    updateForkCount,
} from "./storage";

// Re-export all functions for backward compatibility
export {
    savePath,
    getAllPaths,
    getPathById,
    getPathsByUser,
    searchPathsByTopics,
    pathExists,
    deletePath,
    saveChapter,
    getAllChapters,
    getChapterById,
    getChaptersByPathSeed,
    getPublishedChapters,
    updateChapterStatus,
    deleteChapter,
    getAllRatings,
    getRatingsForContent,
    getAverageRating,
    hasUserRated,
    getUserRating,
    saveAnnotation,
    getAnnotationsForContent,
    getPublicAnnotations,
    getUserAnnotations,
    upvoteAnnotation,
    markAnnotationIncorporated,
    deleteAnnotation,
    saveVersion,
    getVersionsForContent,
    getCurrentVersion,
    restoreVersion,
    getForksOfChapter,
    getForksByUser,
    getForkInfo,
    markForkMerged,
    saveJob,
    getJobById,
    getActiveJobs,
    getJobsForPathSeed,
    cleanupOldJobs,
    trackUserPath,
    getUserExploredPaths,
    getPathPopularity,
    updateQualityMetrics,
};

/**
 * Save a content rating with quality metrics update
 */
export function saveRating(rating: ContentRating): void {
    saveRatingOnly(rating);
    updateQualityMetrics(rating.contentId);
}

/**
 * Save a fork record with metrics update
 */
export function saveFork(fork: ContentFork): void {
    saveForkOnly(fork);
    updateForkCount(fork.originalContentId);
}

// Unified export object for backward compatibility
export const pathStorage = {
    // Paths
    savePath,
    getAllPaths,
    getPathById,
    getPathsByUser,
    searchPathsByTopics,
    pathExists,
    deletePath,
    // Chapters
    saveChapter,
    getAllChapters,
    getChapterById,
    getChaptersByPathSeed,
    getPublishedChapters,
    updateChapterStatus,
    deleteChapter,
    // Ratings
    saveRating,
    getAllRatings,
    getRatingsForContent,
    getAverageRating,
    hasUserRated,
    getUserRating,
    // Annotations
    saveAnnotation,
    getAnnotationsForContent,
    getPublicAnnotations,
    getUserAnnotations,
    upvoteAnnotation,
    markAnnotationIncorporated,
    deleteAnnotation,
    // Versions
    saveVersion,
    getVersionsForContent,
    getCurrentVersion,
    restoreVersion,
    // Forks
    saveFork,
    getForksOfChapter,
    getForksByUser,
    getForkInfo,
    markForkMerged,
    // Jobs
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
};
