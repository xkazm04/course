"use client";

/**
 * Curriculum Storage Module
 *
 * Manages local storage of generated curriculum content for caching,
 * reuse, and offline access. Uses the storage factory pattern.
 *
 * Enhanced with semantic deduplication for intelligent content reuse.
 */

import { createLocalStorage, createArrayStorage, generateId } from "@/app/shared/lib/storageFactory";
import type {
    GeneratedCurriculum,
    CurriculumCacheEntry,
    ContentFeedback,
    CompletionData,
    ContentQualityMetrics,
    CacheStats,
    CurriculumGenerationRequest,
    DifficultyLevel,
} from "./types";
import {
    semanticCache,
    type SemanticLookupResult,
    type SemanticCacheStats,
} from "./semanticCache";
import {
    generateMasterySignal,
    type MasterySignal,
    type SkillProficiency,
} from "./masterySignal";
import { masteryStorage } from "./masteryStorage";

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
    CURRICULUM_CACHE: "curriculum_cache_v1",
    CONTENT_FEEDBACK: "curriculum_feedback_v1",
    COMPLETION_DATA: "curriculum_completion_v1",
    QUALITY_METRICS: "curriculum_quality_v1",
    USER_GENERATED: "curriculum_user_generated_v1",
};

// Cache expiry: 7 days
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// ============================================================================
// CURRICULUM CACHE STORAGE
// ============================================================================

interface CurriculumCacheData {
    entries: Record<string, CurriculumCacheEntry>;
    stats: {
        totalHits: number;
        totalMisses: number;
        lastCleanup: string;
    };
}

const curriculumCacheStorage = createLocalStorage<CurriculumCacheData>({
    storageKey: STORAGE_KEYS.CURRICULUM_CACHE,
    getDefault: () => ({
        entries: {},
        stats: {
            totalHits: 0,
            totalMisses: 0,
            lastCleanup: new Date().toISOString(),
        },
    }),
    version: "1.0",
});

/**
 * Get cached curriculum by key
 */
export function getCachedCurriculum(cacheKey: string): GeneratedCurriculum | null {
    const cache = curriculumCacheStorage.get();
    const entry = cache.entries[cacheKey];

    if (!entry) {
        // Cache miss
        curriculumCacheStorage.update((data) => ({
            ...data,
            stats: { ...data.stats, totalMisses: data.stats.totalMisses + 1 },
        }));
        return null;
    }

    // Check expiry
    if (new Date(entry.expiresAt) < new Date()) {
        // Expired, remove and return null
        removeCachedCurriculum(cacheKey);
        return null;
    }

    // Cache hit - update stats
    curriculumCacheStorage.update((data) => ({
        ...data,
        entries: {
            ...data.entries,
            [cacheKey]: {
                ...entry,
                hitCount: entry.hitCount + 1,
                lastAccessed: new Date().toISOString(),
            },
        },
        stats: { ...data.stats, totalHits: data.stats.totalHits + 1 },
    }));

    return entry.curriculum;
}

/**
 * Cache curriculum content
 */
export function cacheCurriculum(
    cacheKey: string,
    curriculum: GeneratedCurriculum
): void {
    const now = new Date();
    const entry: CurriculumCacheEntry = {
        cacheKey,
        curriculum,
        cachedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + CACHE_EXPIRY_MS).toISOString(),
        hitCount: 0,
        lastAccessed: now.toISOString(),
    };

    curriculumCacheStorage.update((data) => ({
        ...data,
        entries: {
            ...data.entries,
            [cacheKey]: entry,
        },
    }));
}

/**
 * Remove cached curriculum
 */
export function removeCachedCurriculum(cacheKey: string): void {
    curriculumCacheStorage.update((data) => {
        const { [cacheKey]: _, ...rest } = data.entries;
        return { ...data, entries: rest };
    });
}

/**
 * Clear all cached curricula
 */
export function clearCurriculumCache(): void {
    curriculumCacheStorage.save({
        entries: {},
        stats: {
            totalHits: 0,
            totalMisses: 0,
            lastCleanup: new Date().toISOString(),
        },
    });
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCache(): number {
    const cache = curriculumCacheStorage.get();
    const now = new Date();
    let removedCount = 0;

    const validEntries: Record<string, CurriculumCacheEntry> = {};

    Object.entries(cache.entries).forEach(([key, entry]) => {
        if (new Date(entry.expiresAt) >= now) {
            validEntries[key] = entry;
        } else {
            removedCount++;
        }
    });

    curriculumCacheStorage.save({
        entries: validEntries,
        stats: {
            ...cache.stats,
            lastCleanup: now.toISOString(),
        },
    });

    return removedCount;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
    const cache = curriculumCacheStorage.get();
    const entries = Object.values(cache.entries);

    // Estimate size (rough approximation)
    const totalSize = entries.reduce((sum, entry) => {
        return sum + JSON.stringify(entry).length * 2; // UTF-16 characters
    }, 0);

    // Calculate hit rate
    const totalRequests = cache.stats.totalHits + cache.stats.totalMisses;
    const hitRate = totalRequests > 0 ? cache.stats.totalHits / totalRequests : 0;

    // Get popular entries
    const popularEntries = entries
        .sort((a, b) => b.hitCount - a.hitCount)
        .slice(0, 5)
        .map((entry) => ({
            cacheKey: entry.cacheKey,
            hitCount: entry.hitCount,
            moduleTitle: entry.curriculum.moduleTitle,
        }));

    return {
        totalEntries: entries.length,
        totalSize,
        hitRate,
        popularEntries,
    };
}

// ============================================================================
// FEEDBACK STORAGE
// ============================================================================

const feedbackStorage = createArrayStorage<ContentFeedback>({
    storageKey: STORAGE_KEYS.CONTENT_FEEDBACK,
});

/**
 * Submit feedback for content
 */
export function submitFeedback(
    feedback: Omit<ContentFeedback, "id" | "createdAt">
): ContentFeedback {
    const newFeedback: ContentFeedback = {
        ...feedback,
        id: generateId(),
        createdAt: new Date().toISOString(),
    };

    feedbackStorage.add(newFeedback);
    updateQualityMetrics(feedback.contentId, feedback.contentType);
    return newFeedback;
}

/**
 * Get all feedback for content
 */
export function getFeedbackForContent(contentId: string): ContentFeedback[] {
    return feedbackStorage.getAll().filter((f) => f.contentId === contentId);
}

/**
 * Get user's feedback history
 */
export function getUserFeedback(userId: string): ContentFeedback[] {
    return feedbackStorage.getAll().filter((f) => f.userId === userId);
}

// ============================================================================
// COMPLETION DATA STORAGE
// ============================================================================

const completionStorage = createArrayStorage<CompletionData>({
    storageKey: STORAGE_KEYS.COMPLETION_DATA,
});

/**
 * Extended completion tracking options for mastery signal generation
 */
export interface TrackCompletionOptions {
    /** Skills associated with this content */
    skills?: Array<{ id: string; name: string }>;
    /** Content difficulty level */
    contentDifficulty?: DifficultyLevel;
    /** Whether to generate mastery signals */
    generateMasterySignals?: boolean;
}

/**
 * Track content completion and optionally generate mastery signals
 */
export function trackCompletion(
    data: Omit<CompletionData, "id">,
    options?: TrackCompletionOptions
): CompletionData {
    // Check for existing record
    const existing = completionStorage
        .getAll()
        .find(
            (c) =>
                c.userId === data.userId &&
                c.contentId === data.contentId &&
                c.curriculumId === data.curriculumId
        );

    let completionData: CompletionData;

    if (existing) {
        // Update existing
        completionData = completionStorage.updateEntity(existing.id, {
            ...data,
            attempts: existing.attempts + 1,
        }) as CompletionData;
    } else {
        // Create new
        completionData = completionStorage.add({
            ...data,
            id: generateId(),
        });
    }

    // Generate mastery signals if enabled and content is completed
    if (
        options?.generateMasterySignals !== false &&
        data.status === "completed" &&
        options?.skills &&
        options.skills.length > 0
    ) {
        const difficulty = options.contentDifficulty || "intermediate";

        for (const skill of options.skills) {
            const signal = generateMasterySignal(
                completionData,
                skill.id,
                skill.name,
                difficulty
            );

            // Store the signal
            masteryStorage.storeMasterySignal(signal);

            // Update skill proficiency
            masteryStorage.updateSkillProficiency(
                data.userId,
                skill.id,
                skill.name
            );
        }
    }

    return completionData;
}

/**
 * Track completion with automatic mastery signal generation
 * This is a convenience wrapper that always generates signals
 */
export function trackCompletionWithMastery(
    data: Omit<CompletionData, "id">,
    skills: Array<{ id: string; name: string }>,
    contentDifficulty: DifficultyLevel = "intermediate"
): { completion: CompletionData; signals: MasterySignal[] } {
    const completionData = trackCompletion(data, {
        skills,
        contentDifficulty,
        generateMasterySignals: true,
    });

    // Retrieve the generated signals
    const signals = masteryStorage.getContentMasterySignals(data.contentId);

    return {
        completion: completionData,
        signals,
    };
}

/**
 * Get completion data for a user's curriculum
 */
export function getUserCompletionData(
    userId: string,
    curriculumId: string
): CompletionData[] {
    return completionStorage
        .getAll()
        .filter((c) => c.userId === userId && c.curriculumId === curriculumId);
}

/**
 * Get completion rate for curriculum
 */
export function getCurriculumCompletionRate(
    userId: string,
    curriculumId: string
): number {
    const completions = getUserCompletionData(userId, curriculumId);
    if (completions.length === 0) return 0;

    const completed = completions.filter((c) => c.status === "completed").length;
    return completed / completions.length;
}

/**
 * Get user's overall progress stats
 */
export function getUserProgressStats(userId: string): {
    totalCompleted: number;
    totalInProgress: number;
    totalTimeSpent: number;
    averageScore: number;
} {
    const completions = completionStorage
        .getAll()
        .filter((c) => c.userId === userId);

    const completed = completions.filter((c) => c.status === "completed");
    const inProgress = completions.filter((c) => c.status === "in_progress");
    const totalTimeSpent = completions.reduce((sum, c) => sum + c.timeSpent, 0);

    const scores = completed.filter((c) => c.score !== undefined);
    const averageScore =
        scores.length > 0
            ? scores.reduce((sum, c) => sum + (c.score || 0), 0) / scores.length
            : 0;

    return {
        totalCompleted: completed.length,
        totalInProgress: inProgress.length,
        totalTimeSpent,
        averageScore,
    };
}

// ============================================================================
// QUALITY METRICS STORAGE
// ============================================================================

interface QualityMetricsData {
    metrics: Record<string, ContentQualityMetrics>;
}

const qualityMetricsStorage = createLocalStorage<QualityMetricsData>({
    storageKey: STORAGE_KEYS.QUALITY_METRICS,
    getDefault: () => ({ metrics: {} }),
});

/**
 * Update quality metrics for content based on feedback
 */
function updateQualityMetrics(
    contentId: string,
    contentType: ContentFeedback["contentType"]
): void {
    const allFeedback = getFeedbackForContent(contentId);
    if (allFeedback.length === 0) return;

    const totalRatings = allFeedback.length;
    const averageRating =
        allFeedback.reduce((sum, f) => sum + f.rating, 0) / totalRatings;
    const averageClarity =
        allFeedback.reduce((sum, f) => sum + f.feedback.clarity, 0) / totalRatings;
    const averageDifficultyMatch =
        allFeedback.reduce((sum, f) => sum + f.feedback.difficultyMatch, 0) /
        totalRatings;
    const averageRelevance =
        allFeedback.reduce((sum, f) => sum + f.feedback.relevance, 0) / totalRatings;
    const averageEngagement =
        allFeedback.reduce((sum, f) => sum + f.feedback.engagement, 0) /
        totalRatings;
    const completionRate =
        allFeedback.filter((f) => f.completed).length / totalRatings;
    const averageTimeSpent =
        allFeedback.reduce((sum, f) => sum + f.timeSpent, 0) / totalRatings;
    const struggleRate =
        allFeedback.filter((f) => f.struggled).length / totalRatings;

    const metrics: ContentQualityMetrics = {
        contentId,
        contentType,
        totalRatings,
        averageRating,
        averageClarity,
        averageDifficultyMatch,
        averageRelevance,
        averageEngagement,
        completionRate,
        averageTimeSpent,
        struggleRate,
        lastUpdated: new Date().toISOString(),
    };

    qualityMetricsStorage.update((data) => ({
        metrics: {
            ...data.metrics,
            [contentId]: metrics,
        },
    }));
}

/**
 * Get quality metrics for content
 */
export function getQualityMetrics(contentId: string): ContentQualityMetrics | null {
    const data = qualityMetricsStorage.get();
    return data.metrics[contentId] || null;
}

/**
 * Get all high-quality content (rating >= 4)
 */
export function getHighQualityContent(): ContentQualityMetrics[] {
    const data = qualityMetricsStorage.get();
    return Object.values(data.metrics)
        .filter((m) => m.averageRating >= 4 && m.totalRatings >= 3)
        .sort((a, b) => b.averageRating - a.averageRating);
}

// ============================================================================
// USER GENERATED CONTENT STORAGE
// ============================================================================

interface UserGeneratedData {
    curricula: Record<string, GeneratedCurriculum>;
    favorites: string[];
}

const userGeneratedStorage = createLocalStorage<UserGeneratedData>({
    storageKey: STORAGE_KEYS.USER_GENERATED,
    getDefault: () => ({
        curricula: {},
        favorites: [],
    }),
});

/**
 * Save user's generated curriculum
 */
export function saveUserCurriculum(curriculum: GeneratedCurriculum): void {
    userGeneratedStorage.update((data) => ({
        ...data,
        curricula: {
            ...data.curricula,
            [curriculum.id]: curriculum,
        },
    }));
}

/**
 * Get user's saved curricula
 */
export function getUserCurricula(): GeneratedCurriculum[] {
    const data = userGeneratedStorage.get();
    return Object.values(data.curricula);
}

/**
 * Get specific user curriculum
 */
export function getUserCurriculum(id: string): GeneratedCurriculum | null {
    const data = userGeneratedStorage.get();
    return data.curricula[id] || null;
}

/**
 * Delete user curriculum
 */
export function deleteUserCurriculum(id: string): boolean {
    const data = userGeneratedStorage.get();
    if (!(id in data.curricula)) return false;

    const { [id]: _, ...rest } = data.curricula;
    userGeneratedStorage.save({
        ...data,
        curricula: rest,
        favorites: data.favorites.filter((f) => f !== id),
    });
    return true;
}

/**
 * Toggle curriculum as favorite
 */
export function toggleFavorite(curriculumId: string): boolean {
    const data = userGeneratedStorage.get();
    const isFavorite = data.favorites.includes(curriculumId);

    userGeneratedStorage.save({
        ...data,
        favorites: isFavorite
            ? data.favorites.filter((f) => f !== curriculumId)
            : [...data.favorites, curriculumId],
    });

    return !isFavorite;
}

/**
 * Get favorite curricula
 */
export function getFavoriteCurricula(): GeneratedCurriculum[] {
    const data = userGeneratedStorage.get();
    return data.favorites
        .map((id) => data.curricula[id])
        .filter((c): c is GeneratedCurriculum => c !== undefined);
}

// ============================================================================
// SEMANTIC CACHE INTEGRATION
// ============================================================================

/**
 * Look up curriculum using semantic similarity matching.
 * This enables partial cache hits where semantically similar requests
 * can reuse cached content, reducing API calls significantly.
 *
 * @param request - The curriculum generation request
 * @returns Semantic lookup result with match type and content
 */
export function getSemanticCachedCurriculum(
    request: CurriculumGenerationRequest
): SemanticLookupResult {
    return semanticCache.lookup(request);
}

/**
 * Store curriculum with semantic fingerprinting for similarity matching.
 *
 * @param request - The original generation request
 * @param curriculum - The generated curriculum to cache
 * @param options - Optional metadata for delta-generated content
 * @returns Cache key for the stored entry
 */
export function cacheSemanticCurriculum(
    request: CurriculumGenerationRequest,
    curriculum: GeneratedCurriculum,
    options?: {
        isDeltaGenerated?: boolean;
        parentCacheKey?: string;
    }
): string {
    // Also store in traditional cache for backwards compatibility
    const traditionalKey = `curriculum-${curriculum.id}`;
    cacheCurriculum(traditionalKey, curriculum);

    // Store with semantic metadata
    return semanticCache.store(request, curriculum, options);
}

/**
 * Get semantic cache statistics including hit rates and API savings.
 */
export function getSemanticCacheStats(): SemanticCacheStats {
    return semanticCache.getStats();
}

/**
 * Combined cache statistics including both traditional and semantic caches.
 */
export interface CombinedCacheStats extends CacheStats {
    semantic: SemanticCacheStats;
    totalApiCallsSaved: number;
    effectiveHitRate: number;
}

/**
 * Get combined statistics from both caching systems.
 */
export function getCombinedCacheStats(): CombinedCacheStats {
    const traditional = getCacheStats();
    const semantic = getSemanticCacheStats();

    // Calculate effective hit rate considering semantic matches
    const traditionalRequests = traditional.hitRate > 0
        ? traditional.popularEntries.reduce((sum, e) => sum + e.hitCount, 0)
        : 0;

    const totalSemanticRequests =
        semantic.exactHitRate + semantic.semanticHitRate > 0
            ? semantic.totalEntries
            : 0;

    const totalRequests = Math.max(traditionalRequests, totalSemanticRequests, 1);

    return {
        ...traditional,
        semantic,
        totalApiCallsSaved: semantic.estimatedApiCallsSaved,
        effectiveHitRate: semantic.overallHitRate,
    };
}

/**
 * Clear both traditional and semantic caches.
 */
export function clearAllCaches(): void {
    clearCurriculumCache();
    semanticCache.clear();
}

/**
 * Cleanup expired entries from both caches.
 */
export function cleanupAllCaches(): { traditional: number; semantic: number } {
    return {
        traditional: cleanupExpiredCache(),
        semantic: semanticCache.cleanup(),
    };
}

// ============================================================================
// EXPORT ALL STORAGE FUNCTIONS
// ============================================================================

export const curriculumStorage = {
    // Traditional Cache
    getCached: getCachedCurriculum,
    cache: cacheCurriculum,
    removeCache: removeCachedCurriculum,
    clearCache: clearCurriculumCache,
    cleanupCache: cleanupExpiredCache,
    getCacheStats,

    // Semantic Cache
    getSemanticCached: getSemanticCachedCurriculum,
    cacheWithSemantic: cacheSemanticCurriculum,
    getSemanticStats: getSemanticCacheStats,
    getCombinedStats: getCombinedCacheStats,
    clearAllCaches,
    cleanupAllCaches,

    // Delta content merging
    mergeDeltaCurriculum: semanticCache.mergeDelta,

    // Semantic thresholds
    SEMANTIC_SIMILARITY_THRESHOLD: semanticCache.SIMILARITY_THRESHOLD,
    FULL_REUSE_THRESHOLD: semanticCache.FULL_REUSE_THRESHOLD,

    // Feedback
    submitFeedback,
    getFeedbackForContent,
    getUserFeedback,

    // Completion
    trackCompletion,
    trackCompletionWithMastery,
    getUserCompletionData,
    getCurriculumCompletionRate,
    getUserProgressStats,

    // Quality
    getQualityMetrics,
    getHighQualityContent,

    // User generated
    saveUserCurriculum,
    getUserCurricula,
    getUserCurriculum,
    deleteUserCurriculum,
    toggleFavorite,
    getFavoriteCurricula,

    // Mastery Signals (delegated to masteryStorage)
    getMasterySignals: masteryStorage.getUserMasterySignals,
    getSkillMasterySignals: masteryStorage.getSkillMasterySignals,
    getSkillProficiency: masteryStorage.getSkillProficiency,
    getUserSkillProficiencies: masteryStorage.getUserSkillProficiencies,
    recalculateUserProficiencies: masteryStorage.recalculateUserProficiencies,
    generatePathRecalibration: masteryStorage.generateAndStoreRecalibration,
    getPathRecalibration: masteryStorage.getPathRecalibration,
    getMasteryAnalytics: masteryStorage.getMasteryAnalytics,
    getSkillsNeedingAttention: masteryStorage.getSkillsNeedingAttention,
    getHighPerformingSkills: masteryStorage.getHighPerformingSkills,
};
