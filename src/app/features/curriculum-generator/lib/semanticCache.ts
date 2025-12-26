"use client";

/**
 * Semantic Cache Module
 *
 * Extends the curriculum storage with semantic deduplication capabilities.
 * Enables partial cache hits based on semantic similarity between requests,
 * reducing API calls through intelligent content reuse.
 */

import { createLocalStorage, generateId } from "@/app/shared/lib/storageFactory";
import type {
    CurriculumGenerationRequest,
    GeneratedCurriculum,
    CurriculumCacheEntry,
    LessonOutline,
    CodeExercise,
    Quiz,
    ProjectSpecification,
} from "./types";
import {
    generateSemanticFingerprint,
    findBestSemanticMatch,
    shouldUseDeltaRegeneration,
    createDeltaRequest,
    computeFingerprintSimilarity,
    SEMANTIC_SIMILARITY_THRESHOLD,
    FULL_REUSE_THRESHOLD,
    type SemanticFingerprint,
    type SemanticCacheMatch,
    type DeltaGenerationRequest,
    type SemanticCacheMetadata,
} from "./semanticFingerprinting";

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

const STORAGE_KEY = "curriculum_semantic_cache_v1";
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Extended cache entry with semantic metadata
 */
export interface SemanticCacheEntry extends CurriculumCacheEntry {
    /** Semantic fingerprint for similarity matching */
    semanticMetadata: SemanticCacheMetadata;
    /** Whether this entry was created from delta generation */
    isDeltaGenerated: boolean;
    /** Parent entry key if delta generated */
    parentCacheKey?: string;
    /** Semantic similarity stats */
    semanticStats: {
        /** Number of semantic hits (non-exact) */
        semanticHits: number;
        /** Number of times used as base for delta */
        deltaBaseCount: number;
        /** Average similarity score of matches */
        avgMatchSimilarity: number;
    };
}

/**
 * Semantic cache data structure
 */
interface SemanticCacheData {
    entries: Record<string, SemanticCacheEntry>;
    stats: {
        totalExactHits: number;
        totalSemanticHits: number;
        totalDeltaGenerations: number;
        totalMisses: number;
        estimatedApiCallsSaved: number;
        lastCleanup: string;
    };
}

// ============================================================================
// STORAGE INSTANCE
// ============================================================================

const semanticCacheStorage = createLocalStorage<SemanticCacheData>({
    storageKey: STORAGE_KEY,
    getDefault: () => ({
        entries: {},
        stats: {
            totalExactHits: 0,
            totalSemanticHits: 0,
            totalDeltaGenerations: 0,
            totalMisses: 0,
            estimatedApiCallsSaved: 0,
            lastCleanup: new Date().toISOString(),
        },
    }),
    version: "1.0",
});

// ============================================================================
// SEMANTIC CACHE LOOKUP
// ============================================================================

/**
 * Result of a semantic cache lookup
 */
export interface SemanticLookupResult {
    /** Type of cache result */
    type: "exact" | "semantic" | "delta_candidate" | "miss";
    /** Matched curriculum if found */
    curriculum: GeneratedCurriculum | null;
    /** Cache key of the match */
    cacheKey: string | null;
    /** Similarity score (1.0 for exact, 0-1 for semantic) */
    similarity: number;
    /** Skills that need delta generation */
    missingSkills: string[];
    /** Delta request if applicable */
    deltaRequest: DeltaGenerationRequest | null;
    /** Debug info */
    debug: {
        searchedEntries: number;
        matchesFound: number;
        bestMatchSimilarity: number;
    };
}

/**
 * Look up curriculum using semantic matching
 */
export function semanticLookup(
    request: CurriculumGenerationRequest
): SemanticLookupResult {
    const cache = semanticCacheStorage.get();
    const entries = Object.values(cache.entries);
    const now = new Date();

    // Filter out expired entries
    const validEntries = entries.filter(
        entry => new Date(entry.expiresAt) >= now
    );

    const requestFingerprint = generateSemanticFingerprint(request);

    // Build cached fingerprints array
    const cachedFingerprints = validEntries.map(entry => ({
        fingerprint: entry.semanticMetadata.fingerprint,
        cacheKey: entry.cacheKey,
        curriculum: entry.curriculum,
    }));

    // Find best semantic match
    const bestMatch = findBestSemanticMatch(requestFingerprint, cachedFingerprints);

    // No match found
    if (!bestMatch) {
        semanticCacheStorage.update(data => ({
            ...data,
            stats: {
                ...data.stats,
                totalMisses: data.stats.totalMisses + 1,
            },
        }));

        return {
            type: "miss",
            curriculum: null,
            cacheKey: null,
            similarity: 0,
            missingSkills: request.module.skills,
            deltaRequest: null,
            debug: {
                searchedEntries: validEntries.length,
                matchesFound: 0,
                bestMatchSimilarity: 0,
            },
        };
    }

    // Exact match
    if (bestMatch.isExactMatch) {
        // Update cache stats
        semanticCacheStorage.update(data => ({
            ...data,
            entries: {
                ...data.entries,
                [bestMatch.cacheKey]: {
                    ...data.entries[bestMatch.cacheKey],
                    hitCount: (data.entries[bestMatch.cacheKey]?.hitCount || 0) + 1,
                    lastAccessed: now.toISOString(),
                },
            },
            stats: {
                ...data.stats,
                totalExactHits: data.stats.totalExactHits + 1,
                estimatedApiCallsSaved: data.stats.estimatedApiCallsSaved + 1,
            },
        }));

        return {
            type: "exact",
            curriculum: bestMatch.curriculum!,
            cacheKey: bestMatch.cacheKey,
            similarity: bestMatch.similarity,
            missingSkills: [],
            deltaRequest: null,
            debug: {
                searchedEntries: validEntries.length,
                matchesFound: 1,
                bestMatchSimilarity: bestMatch.similarity,
            },
        };
    }

    // Check if we should use delta regeneration
    if (shouldUseDeltaRegeneration(bestMatch)) {
        const deltaRequest = createDeltaRequest(request, bestMatch);

        if (deltaRequest) {
            // Update semantic hit stats
            semanticCacheStorage.update(data => {
                const entry = data.entries[bestMatch.cacheKey];
                if (entry) {
                    const currentAvg = entry.semanticStats.avgMatchSimilarity;
                    const count = entry.semanticStats.semanticHits;
                    const newAvg = (currentAvg * count + bestMatch.similarity) / (count + 1);

                    return {
                        ...data,
                        entries: {
                            ...data.entries,
                            [bestMatch.cacheKey]: {
                                ...entry,
                                semanticStats: {
                                    ...entry.semanticStats,
                                    deltaBaseCount: entry.semanticStats.deltaBaseCount + 1,
                                    avgMatchSimilarity: newAvg,
                                },
                                lastAccessed: now.toISOString(),
                            },
                        },
                        stats: {
                            ...data.stats,
                            totalDeltaGenerations: data.stats.totalDeltaGenerations + 1,
                            // Partial API savings (reusing base content)
                            estimatedApiCallsSaved:
                                data.stats.estimatedApiCallsSaved + (1 - deltaRequest.missingSkills.length / request.module.skills.length),
                        },
                    };
                }
                return data;
            });

            return {
                type: "delta_candidate",
                curriculum: bestMatch.curriculum!,
                cacheKey: bestMatch.cacheKey,
                similarity: bestMatch.similarity,
                missingSkills: bestMatch.missingSkills,
                deltaRequest,
                debug: {
                    searchedEntries: validEntries.length,
                    matchesFound: 1,
                    bestMatchSimilarity: bestMatch.similarity,
                },
            };
        }
    }

    // Semantic match that can be used directly (high similarity but not exact)
    if (bestMatch.similarity >= SEMANTIC_SIMILARITY_THRESHOLD) {
        semanticCacheStorage.update(data => {
            const entry = data.entries[bestMatch.cacheKey];
            if (entry) {
                const currentAvg = entry.semanticStats.avgMatchSimilarity;
                const count = entry.semanticStats.semanticHits;
                const newAvg = (currentAvg * count + bestMatch.similarity) / (count + 1);

                return {
                    ...data,
                    entries: {
                        ...data.entries,
                        [bestMatch.cacheKey]: {
                            ...entry,
                            hitCount: entry.hitCount + 1,
                            semanticStats: {
                                ...entry.semanticStats,
                                semanticHits: entry.semanticStats.semanticHits + 1,
                                avgMatchSimilarity: newAvg,
                            },
                            lastAccessed: now.toISOString(),
                        },
                    },
                    stats: {
                        ...data.stats,
                        totalSemanticHits: data.stats.totalSemanticHits + 1,
                        estimatedApiCallsSaved: data.stats.estimatedApiCallsSaved + bestMatch.similarity,
                    },
                };
            }
            return data;
        });

        return {
            type: "semantic",
            curriculum: bestMatch.curriculum!,
            cacheKey: bestMatch.cacheKey,
            similarity: bestMatch.similarity,
            missingSkills: bestMatch.missingSkills,
            deltaRequest: null,
            debug: {
                searchedEntries: validEntries.length,
                matchesFound: 1,
                bestMatchSimilarity: bestMatch.similarity,
            },
        };
    }

    // Miss
    semanticCacheStorage.update(data => ({
        ...data,
        stats: {
            ...data.stats,
            totalMisses: data.stats.totalMisses + 1,
        },
    }));

    return {
        type: "miss",
        curriculum: null,
        cacheKey: null,
        similarity: bestMatch.similarity,
        missingSkills: request.module.skills,
        deltaRequest: null,
        debug: {
            searchedEntries: validEntries.length,
            matchesFound: 1,
            bestMatchSimilarity: bestMatch.similarity,
        },
    };
}

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Store curriculum with semantic metadata
 */
export function storeSemanticCache(
    request: CurriculumGenerationRequest,
    curriculum: GeneratedCurriculum,
    options?: {
        isDeltaGenerated?: boolean;
        parentCacheKey?: string;
    }
): string {
    const now = new Date();
    const fingerprint = generateSemanticFingerprint(request);
    const cacheKey = `semantic-${fingerprint.id}`;

    const entry: SemanticCacheEntry = {
        cacheKey,
        curriculum,
        cachedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + CACHE_EXPIRY_MS).toISOString(),
        hitCount: 0,
        lastAccessed: now.toISOString(),
        semanticMetadata: {
            fingerprint,
            createdAt: now.toISOString(),
        },
        isDeltaGenerated: options?.isDeltaGenerated || false,
        parentCacheKey: options?.parentCacheKey,
        semanticStats: {
            semanticHits: 0,
            deltaBaseCount: 0,
            avgMatchSimilarity: 0,
        },
    };

    semanticCacheStorage.update(data => ({
        ...data,
        entries: {
            ...data.entries,
            [cacheKey]: entry,
        },
    }));

    return cacheKey;
}

/**
 * Get cached curriculum by exact key
 */
export function getSemanticCacheByKey(cacheKey: string): GeneratedCurriculum | null {
    const cache = semanticCacheStorage.get();
    const entry = cache.entries[cacheKey];

    if (!entry) return null;
    if (new Date(entry.expiresAt) < new Date()) {
        removeSemanticCacheEntry(cacheKey);
        return null;
    }

    return entry.curriculum;
}

/**
 * Remove a cache entry
 */
export function removeSemanticCacheEntry(cacheKey: string): void {
    semanticCacheStorage.update(data => {
        const { [cacheKey]: _, ...rest } = data.entries;
        return { ...data, entries: rest };
    });
}

/**
 * Clear all semantic cache
 */
export function clearSemanticCache(): void {
    semanticCacheStorage.save({
        entries: {},
        stats: {
            totalExactHits: 0,
            totalSemanticHits: 0,
            totalDeltaGenerations: 0,
            totalMisses: 0,
            estimatedApiCallsSaved: 0,
            lastCleanup: new Date().toISOString(),
        },
    });
}

/**
 * Cleanup expired entries
 */
export function cleanupSemanticCache(): number {
    const cache = semanticCacheStorage.get();
    const now = new Date();
    let removedCount = 0;

    const validEntries: Record<string, SemanticCacheEntry> = {};

    Object.entries(cache.entries).forEach(([key, entry]) => {
        if (new Date(entry.expiresAt) >= now) {
            validEntries[key] = entry;
        } else {
            removedCount++;
        }
    });

    semanticCacheStorage.save({
        entries: validEntries,
        stats: {
            ...cache.stats,
            lastCleanup: now.toISOString(),
        },
    });

    return removedCount;
}

// ============================================================================
// DELTA CONTENT MERGING
// ============================================================================

/**
 * Merge delta-generated content with base curriculum
 */
export function mergeDeltaCurriculum(
    baseCurriculum: GeneratedCurriculum,
    deltaContent: {
        lessons?: LessonOutline[];
        exercises?: CodeExercise[];
        quizzes?: Quiz[];
        projects?: ProjectSpecification[];
    },
    missingSkills: string[]
): GeneratedCurriculum {
    const now = new Date().toISOString();

    // Merge lessons - add delta lessons, mark them appropriately
    const mergedLessons = [
        ...baseCurriculum.lessons,
        ...(deltaContent.lessons || []).map(lesson => ({
            ...lesson,
            id: `delta-${lesson.id}`,
            title: lesson.title,
        })),
    ];

    // Merge exercises
    const mergedExercises = [
        ...baseCurriculum.exercises,
        ...(deltaContent.exercises || []).map(exercise => ({
            ...exercise,
            id: `delta-${exercise.id}`,
        })),
    ];

    // Merge quizzes
    const mergedQuizzes = [
        ...baseCurriculum.quizzes,
        ...(deltaContent.quizzes || []).map(quiz => ({
            ...quiz,
            id: `delta-${quiz.id}`,
        })),
    ];

    // Merge projects
    const mergedProjects = [
        ...baseCurriculum.projects,
        ...(deltaContent.projects || []).map(project => ({
            ...project,
            id: `delta-${project.id}`,
        })),
    ];

    // Combine skills covered
    const allSkillsCovered = new Set([
        ...baseCurriculum.skillsCovered,
        ...missingSkills,
    ]);

    // Calculate new total hours
    const deltaHours =
        (deltaContent.lessons?.reduce((sum, l) => sum + l.estimatedMinutes / 60, 0) || 0) +
        (deltaContent.exercises?.reduce((sum, e) => sum + e.estimatedMinutes / 60, 0) || 0) +
        (deltaContent.quizzes?.reduce((sum, q) => sum + q.timeLimit / 60, 0) || 0) +
        (deltaContent.projects?.reduce((sum, p) => sum + p.estimatedHours, 0) || 0);

    return {
        ...baseCurriculum,
        id: `merged-${generateId()}`,
        lessons: mergedLessons,
        exercises: mergedExercises,
        quizzes: mergedQuizzes,
        projects: mergedProjects,
        skillsCovered: Array.from(allSkillsCovered),
        totalHours: baseCurriculum.totalHours + deltaHours,
        metadata: {
            ...baseCurriculum.metadata,
            lastUpdated: now,
            useCount: baseCurriculum.metadata.useCount + 1,
        },
    };
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Semantic cache statistics
 */
export interface SemanticCacheStats {
    totalEntries: number;
    exactHitRate: number;
    semanticHitRate: number;
    overallHitRate: number;
    estimatedApiCallsSaved: number;
    averageSimilarityScore: number;
    deltaGenerationCount: number;
    topSemanticMatches: Array<{
        cacheKey: string;
        moduleTitle: string;
        semanticHits: number;
        avgSimilarity: number;
    }>;
}

/**
 * Get semantic cache statistics
 */
export function getSemanticCacheStats(): SemanticCacheStats {
    const cache = semanticCacheStorage.get();
    const entries = Object.values(cache.entries);
    const { stats } = cache;

    const totalRequests =
        stats.totalExactHits +
        stats.totalSemanticHits +
        stats.totalDeltaGenerations +
        stats.totalMisses;

    // Calculate average similarity
    let totalSimilarity = 0;
    let similarityCount = 0;
    entries.forEach(entry => {
        if (entry.semanticStats.semanticHits > 0) {
            totalSimilarity += entry.semanticStats.avgMatchSimilarity * entry.semanticStats.semanticHits;
            similarityCount += entry.semanticStats.semanticHits;
        }
    });

    // Get top semantic matches
    const topMatches = entries
        .filter(e => e.semanticStats.semanticHits > 0)
        .sort((a, b) => b.semanticStats.semanticHits - a.semanticStats.semanticHits)
        .slice(0, 5)
        .map(entry => ({
            cacheKey: entry.cacheKey,
            moduleTitle: entry.curriculum.moduleTitle,
            semanticHits: entry.semanticStats.semanticHits,
            avgSimilarity: entry.semanticStats.avgMatchSimilarity,
        }));

    return {
        totalEntries: entries.length,
        exactHitRate: totalRequests > 0 ? stats.totalExactHits / totalRequests : 0,
        semanticHitRate: totalRequests > 0 ? stats.totalSemanticHits / totalRequests : 0,
        overallHitRate:
            totalRequests > 0
                ? (stats.totalExactHits + stats.totalSemanticHits + stats.totalDeltaGenerations) / totalRequests
                : 0,
        estimatedApiCallsSaved: stats.estimatedApiCallsSaved,
        averageSimilarityScore: similarityCount > 0 ? totalSimilarity / similarityCount : 0,
        deltaGenerationCount: stats.totalDeltaGenerations,
        topSemanticMatches: topMatches,
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const semanticCache = {
    lookup: semanticLookup,
    store: storeSemanticCache,
    getByKey: getSemanticCacheByKey,
    remove: removeSemanticCacheEntry,
    clear: clearSemanticCache,
    cleanup: cleanupSemanticCache,
    mergeDelta: mergeDeltaCurriculum,
    getStats: getSemanticCacheStats,
    // Thresholds for external use
    SIMILARITY_THRESHOLD: SEMANTIC_SIMILARITY_THRESHOLD,
    FULL_REUSE_THRESHOLD: FULL_REUSE_THRESHOLD,
};
