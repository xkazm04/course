/**
 * Collective Patterns Storage
 *
 * Persists and aggregates learning patterns from all users.
 * Uses localStorage for client-side storage, but designed to easily
 * integrate with server-side storage for true collective intelligence.
 *
 * In a production environment, this would sync with a backend service
 * to aggregate patterns across all learners.
 */

import type {
    CollectivePatterns,
    LearnerFingerprint,
    LearningPattern,
    HelpfulContent,
} from "./collaborativeFiltering";
import {
    createEmptyCollectivePatterns,
    mergeLearningPatterns,
    mergeHelpfulContent,
} from "./collaborativeFiltering";

// ============================================================================
// Storage Keys
// ============================================================================

const COLLECTIVE_PATTERNS_KEY = "collective-learning-patterns";
const STORAGE_VERSION = 1;

interface StoredCollectiveData {
    data: CollectivePatterns;
    version: number;
}

// ============================================================================
// Local Storage Operations
// ============================================================================

/**
 * Get storage key for a course's collective patterns
 */
function getStorageKey(courseId: string): string {
    return `${COLLECTIVE_PATTERNS_KEY}-${courseId}`;
}

/**
 * Load collective patterns from storage
 */
export function loadCollectivePatterns(courseId: string): CollectivePatterns {
    if (typeof window === "undefined") {
        return createEmptyCollectivePatterns(courseId);
    }

    try {
        const key = getStorageKey(courseId);
        const stored = localStorage.getItem(key);

        if (!stored) {
            return createEmptyCollectivePatterns(courseId);
        }

        const data: StoredCollectiveData = JSON.parse(stored);

        // Handle version migrations
        if (data.version < STORAGE_VERSION) {
            console.log(
                `Migrating collective patterns from v${data.version} to v${STORAGE_VERSION}`
            );
        }

        return data.data;
    } catch (error) {
        console.warn("Failed to load collective patterns:", error);
        return createEmptyCollectivePatterns(courseId);
    }
}

/**
 * Save collective patterns to storage
 */
export function saveCollectivePatterns(patterns: CollectivePatterns): void {
    if (typeof window === "undefined") return;

    try {
        const key = getStorageKey(patterns.courseId);
        const data: StoredCollectiveData = {
            data: patterns,
            version: STORAGE_VERSION,
        };

        // Prune old data before saving
        const pruned = pruneOldData(patterns);
        data.data = pruned;

        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.warn("Failed to save collective patterns:", error);
    }
}

/**
 * Prune old data to keep storage size manageable
 */
function pruneOldData(patterns: CollectivePatterns): CollectivePatterns {
    const MAX_FINGERPRINTS = 500;
    const MAX_PATTERNS = 100;
    const MAX_CONTENT_PER_USER = 50;
    const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

    const now = Date.now();

    // Prune fingerprints
    let fingerprints = patterns.fingerprints
        .filter((f) => now - f.lastUpdated < MAX_AGE_MS)
        .sort((a, b) => b.lastUpdated - a.lastUpdated)
        .slice(0, MAX_FINGERPRINTS);

    // Prune patterns by frequency
    let learningPatterns = patterns.patterns
        .sort((a, b) => b.patternFrequency - a.patternFrequency)
        .slice(0, MAX_PATTERNS);

    // Prune content effectiveness
    const contentEffectiveness: Record<string, HelpfulContent[]> = {};
    for (const [userId, contents] of Object.entries(patterns.contentEffectiveness)) {
        const filtered = contents
            .filter((c) => now - c.timestamp < MAX_AGE_MS)
            .sort((a, b) => b.improvementScore - a.improvementScore)
            .slice(0, MAX_CONTENT_PER_USER);

        if (filtered.length > 0) {
            contentEffectiveness[userId] = filtered;
        }
    }

    return {
        ...patterns,
        fingerprints,
        patterns: learningPatterns,
        contentEffectiveness,
    };
}

// ============================================================================
// Pattern Aggregation
// ============================================================================

/**
 * Add or update a learner's fingerprint
 */
export function addOrUpdateFingerprint(
    courseId: string,
    fingerprint: LearnerFingerprint
): CollectivePatterns {
    const patterns = loadCollectivePatterns(courseId);

    const existingIdx = patterns.fingerprints.findIndex(
        (f) => f.userId === fingerprint.userId
    );

    if (existingIdx >= 0) {
        patterns.fingerprints[existingIdx] = fingerprint;
    } else {
        patterns.fingerprints.push(fingerprint);
        patterns.learnerCount += 1;
    }

    patterns.lastAggregated = Date.now();
    saveCollectivePatterns(patterns);

    return patterns;
}

/**
 * Add a learning pattern to the collective
 */
export function addLearningPattern(
    courseId: string,
    pattern: LearningPattern
): CollectivePatterns {
    const patterns = loadCollectivePatterns(courseId);

    const existingIdx = patterns.patterns.findIndex(
        (p) => p.sectionId === pattern.sectionId && p.topic === pattern.topic
    );

    if (existingIdx >= 0) {
        patterns.patterns[existingIdx] = mergeLearningPatterns(
            patterns.patterns[existingIdx],
            pattern
        );
    } else {
        patterns.patterns.push(pattern);
    }

    patterns.lastAggregated = Date.now();
    saveCollectivePatterns(patterns);

    return patterns;
}

/**
 * Record that content was helpful for a learner
 */
export function recordHelpfulContent(
    courseId: string,
    userId: string,
    content: HelpfulContent
): CollectivePatterns {
    const patterns = loadCollectivePatterns(courseId);

    if (!patterns.contentEffectiveness[userId]) {
        patterns.contentEffectiveness[userId] = [];
    }

    const userContent = patterns.contentEffectiveness[userId];
    const existingIdx = userContent.findIndex(
        (c) =>
            c.slotType === content.slotType &&
            c.sectionId === content.sectionId &&
            c.topic === content.topic
    );

    if (existingIdx >= 0) {
        userContent[existingIdx] = mergeHelpfulContent(userContent[existingIdx], content);
    } else {
        userContent.push(content);
    }

    // Also update the relevant learning pattern
    const patternIdx = patterns.patterns.findIndex(
        (p) => p.sectionId === content.sectionId
    );

    if (patternIdx >= 0) {
        const pattern = patterns.patterns[patternIdx];
        const recoveryIdx = pattern.recoveryContent.findIndex(
            (c) => c.slotType === content.slotType && c.topic === content.topic
        );

        if (recoveryIdx >= 0) {
            pattern.recoveryContent[recoveryIdx] = mergeHelpfulContent(
                pattern.recoveryContent[recoveryIdx],
                content
            );
        } else {
            pattern.recoveryContent.push(content);
        }
    }

    patterns.lastAggregated = Date.now();
    saveCollectivePatterns(patterns);

    return patterns;
}

// ============================================================================
// Analytics & Insights
// ============================================================================

/**
 * Get statistics about collective patterns
 */
export function getCollectiveStats(courseId: string): {
    totalLearners: number;
    totalPatterns: number;
    mostCommonStruggles: { sectionId: string; topic: string; frequency: number }[];
    mostHelpfulContent: { slotType: string; topic: string; avgImprovement: number }[];
} {
    const patterns = loadCollectivePatterns(courseId);

    // Most common struggles
    const mostCommonStruggles = patterns.patterns
        .sort((a, b) => b.patternFrequency - a.patternFrequency)
        .slice(0, 5)
        .map((p) => ({
            sectionId: p.sectionId,
            topic: p.topic,
            frequency: p.patternFrequency,
        }));

    // Most helpful content (aggregated across all users)
    const contentMap: Map<string, { slotType: string; topic: string; scores: number[] }> =
        new Map();

    for (const contents of Object.values(patterns.contentEffectiveness)) {
        for (const content of contents) {
            const key = `${content.slotType}-${content.topic}`;
            const existing = contentMap.get(key);

            if (existing) {
                existing.scores.push(content.improvementScore);
            } else {
                contentMap.set(key, {
                    slotType: content.slotType,
                    topic: content.topic,
                    scores: [content.improvementScore],
                });
            }
        }
    }

    const mostHelpfulContent = Array.from(contentMap.values())
        .map((c) => ({
            slotType: c.slotType,
            topic: c.topic,
            avgImprovement: c.scores.reduce((a, b) => a + b, 0) / c.scores.length,
        }))
        .sort((a, b) => b.avgImprovement - a.avgImprovement)
        .slice(0, 5);

    return {
        totalLearners: patterns.learnerCount,
        totalPatterns: patterns.patterns.length,
        mostCommonStruggles,
        mostHelpfulContent,
    };
}

/**
 * Get content effectiveness for a specific section
 */
export function getSectionContentEffectiveness(
    courseId: string,
    sectionId: string
): HelpfulContent[] {
    const patterns = loadCollectivePatterns(courseId);

    // Aggregate all helpful content for this section
    const contentMap: Map<string, HelpfulContent> = new Map();

    for (const contents of Object.values(patterns.contentEffectiveness)) {
        for (const content of contents) {
            if (content.sectionId !== sectionId) continue;

            const key = `${content.slotType}-${content.topic}`;
            const existing = contentMap.get(key);

            if (existing) {
                contentMap.set(key, mergeHelpfulContent(existing, content));
            } else {
                contentMap.set(key, { ...content });
            }
        }
    }

    return Array.from(contentMap.values()).sort(
        (a, b) => b.improvementScore * b.helpCount - a.improvementScore * a.helpCount
    );
}

// ============================================================================
// Clear Operations
// ============================================================================

/**
 * Clear all collective patterns for a course
 */
export function clearCollectivePatterns(courseId: string): void {
    if (typeof window === "undefined") return;

    try {
        const key = getStorageKey(courseId);
        localStorage.removeItem(key);
    } catch (error) {
        console.warn("Failed to clear collective patterns:", error);
    }
}

/**
 * Clear a specific user's fingerprint and contributions
 */
export function clearUserData(courseId: string, userId: string): CollectivePatterns {
    const patterns = loadCollectivePatterns(courseId);

    // Remove fingerprint
    patterns.fingerprints = patterns.fingerprints.filter((f) => f.userId !== userId);

    // Remove user's content effectiveness data
    delete patterns.contentEffectiveness[userId];

    patterns.lastAggregated = Date.now();
    saveCollectivePatterns(patterns);

    return patterns;
}

// ============================================================================
// Export/Import for Sync
// ============================================================================

/**
 * Export collective patterns for backup or sync
 */
export function exportCollectivePatterns(courseId: string): string | null {
    if (typeof window === "undefined") return null;

    try {
        const key = getStorageKey(courseId);
        return localStorage.getItem(key);
    } catch (error) {
        console.warn("Failed to export collective patterns:", error);
        return null;
    }
}

/**
 * Import collective patterns from backup or sync
 * Merges with existing data rather than replacing
 */
export function importCollectivePatterns(
    courseId: string,
    data: string,
    merge: boolean = true
): boolean {
    if (typeof window === "undefined") return false;

    try {
        const parsed: StoredCollectiveData = JSON.parse(data);
        if (!parsed.data || typeof parsed.version !== "number") {
            throw new Error("Invalid collective patterns data format");
        }

        if (!merge) {
            saveCollectivePatterns(parsed.data);
            return true;
        }

        // Merge with existing
        const existing = loadCollectivePatterns(courseId);

        // Merge fingerprints
        for (const fingerprint of parsed.data.fingerprints) {
            const existingIdx = existing.fingerprints.findIndex(
                (f) => f.userId === fingerprint.userId
            );
            if (existingIdx >= 0) {
                if (fingerprint.lastUpdated > existing.fingerprints[existingIdx].lastUpdated) {
                    existing.fingerprints[existingIdx] = fingerprint;
                }
            } else {
                existing.fingerprints.push(fingerprint);
            }
        }

        // Merge patterns
        for (const pattern of parsed.data.patterns) {
            const existingIdx = existing.patterns.findIndex(
                (p) => p.sectionId === pattern.sectionId && p.topic === pattern.topic
            );
            if (existingIdx >= 0) {
                existing.patterns[existingIdx] = mergeLearningPatterns(
                    existing.patterns[existingIdx],
                    pattern
                );
            } else {
                existing.patterns.push(pattern);
            }
        }

        // Merge content effectiveness
        for (const [userId, contents] of Object.entries(parsed.data.contentEffectiveness)) {
            if (!existing.contentEffectiveness[userId]) {
                existing.contentEffectiveness[userId] = contents;
            } else {
                for (const content of contents) {
                    const existingContents = existing.contentEffectiveness[userId];
                    const contentIdx = existingContents.findIndex(
                        (c) =>
                            c.slotType === content.slotType &&
                            c.sectionId === content.sectionId &&
                            c.topic === content.topic
                    );
                    if (contentIdx >= 0) {
                        existingContents[contentIdx] = mergeHelpfulContent(
                            existingContents[contentIdx],
                            content
                        );
                    } else {
                        existingContents.push(content);
                    }
                }
            }
        }

        existing.learnerCount = Math.max(existing.learnerCount, parsed.data.learnerCount);
        existing.lastAggregated = Date.now();

        saveCollectivePatterns(existing);
        return true;
    } catch (error) {
        console.warn("Failed to import collective patterns:", error);
        return false;
    }
}
