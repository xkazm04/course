/**
 * useChapterGraph Hook
 *
 * React hook for accessing chapter graph data including prerequisites,
 * suggested next chapters, and learning path status.
 */

import { useMemo, useCallback } from "react";
import type { ChapterCurriculumNode } from "@/app/shared/lib/learningPathGraph";
import type { ChapterNodeStatus } from "./chapterGraph";
import {
    CURRICULUM_CHAPTERS,
    CHAPTER_CURRICULUM_EDGES,
    getChapterNode,
    getChapterPrerequisites,
    getSuggestedNextChapters,
    areChapterPrerequisitesMet,
    getChapterPrerequisiteWarnings,
    getChaptersByCourse,
    getOptimalChapterOrder,
} from "./curriculumChapters";

// ============================================================================
// TYPES
// ============================================================================

export interface ChapterGraphData {
    /** Current chapter node (if found) */
    chapter: ChapterCurriculumNode | undefined;

    /** Prerequisite chapters that should be completed first */
    prerequisites: ChapterCurriculumNode[];

    /** Suggested chapters to take after this one */
    suggestedNext: ChapterCurriculumNode[];

    /** Whether all prerequisites are met */
    prerequisitesMet: boolean;

    /** Warnings for unmet prerequisites */
    prerequisiteWarnings: Array<{ id: string; title: string }>;

    /** Current status of the chapter */
    status: ChapterNodeStatus;

    /** All chapters in the same course */
    courseChapters: ChapterCurriculumNode[];

    /** Optimal order to complete course chapters */
    optimalOrder: ChapterCurriculumNode[];

    /** Total XP available in this chapter's course */
    courseTotalXP: number;

    /** Total duration of course in minutes */
    courseDurationMinutes: number;
}

export interface UseChapterGraphOptions {
    /** Completed chapter IDs */
    completedChapterIds?: Set<string>;

    /** Currently in-progress chapter ID */
    inProgressChapterId?: string;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook to access chapter graph data for a given chapter
 *
 * @param chapterNodeId - The chapter node ID (format: courseId:chapterId)
 * @param options - Optional configuration including completed chapter IDs
 * @returns Chapter graph data including prerequisites and suggestions
 *
 * @example
 * ```tsx
 * const { prerequisites, prerequisitesMet, suggestedNext } = useChapterGraph(
 *   "react-hooks:custom-hooks",
 *   { completedChapterIds: new Set(["react-hooks:hooks-fundamentals"]) }
 * );
 *
 * if (!prerequisitesMet) {
 *   // Show prerequisite warning
 * }
 * ```
 */
export function useChapterGraph(
    chapterNodeId: string,
    options: UseChapterGraphOptions = {}
): ChapterGraphData {
    const { completedChapterIds = new Set(), inProgressChapterId } = options;

    const chapter = useMemo(() => getChapterNode(chapterNodeId), [chapterNodeId]);

    const prerequisites = useMemo(
        () => getChapterPrerequisites(chapterNodeId),
        [chapterNodeId]
    );

    const suggestedNext = useMemo(
        () => getSuggestedNextChapters(chapterNodeId),
        [chapterNodeId]
    );

    const prerequisitesMet = useMemo(
        () => areChapterPrerequisitesMet(chapterNodeId, completedChapterIds),
        [chapterNodeId, completedChapterIds]
    );

    const prerequisiteWarnings = useMemo(
        () => getChapterPrerequisiteWarnings(chapterNodeId, completedChapterIds),
        [chapterNodeId, completedChapterIds]
    );

    const status: ChapterNodeStatus = useMemo(() => {
        if (completedChapterIds.has(chapterNodeId)) return "completed";
        if (chapterNodeId === inProgressChapterId) return "in_progress";
        if (!prerequisitesMet) return "locked";
        return "available";
    }, [chapterNodeId, completedChapterIds, inProgressChapterId, prerequisitesMet]);

    const courseId = chapter?.courseId ?? "";

    const courseChapters = useMemo(
        () => (courseId ? getChaptersByCourse(courseId) : []),
        [courseId]
    );

    const optimalOrder = useMemo(
        () => (courseId ? getOptimalChapterOrder(courseId) : []),
        [courseId]
    );

    const courseTotalXP = useMemo(
        () => courseChapters.reduce((sum, ch) => sum + ch.xpReward, 0),
        [courseChapters]
    );

    const courseDurationMinutes = useMemo(
        () => courseChapters.reduce((sum, ch) => sum + ch.durationMinutes, 0),
        [courseChapters]
    );

    return {
        chapter,
        prerequisites,
        suggestedNext,
        prerequisitesMet,
        prerequisiteWarnings,
        status,
        courseChapters,
        optimalOrder,
        courseTotalXP,
        courseDurationMinutes,
    };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get all curriculum chapters
 */
export function useCurriculumChapters(): ChapterCurriculumNode[] {
    return CURRICULUM_CHAPTERS;
}

/**
 * Hook to get curriculum edges
 */
export function useCurriculumEdges() {
    return CHAPTER_CURRICULUM_EDGES;
}

/**
 * Hook to check if a chapter is available based on completed prerequisites
 */
export function useChapterAvailability(
    chapterNodeId: string,
    completedChapterIds: Set<string>
): { available: boolean; missingPrerequisites: ChapterCurriculumNode[] } {
    const prerequisites = useMemo(
        () => getChapterPrerequisites(chapterNodeId),
        [chapterNodeId]
    );

    const missingPrerequisites = useMemo(
        () => prerequisites.filter((prereq) => !completedChapterIds.has(prereq.id)),
        [prerequisites, completedChapterIds]
    );

    const available = missingPrerequisites.length === 0;

    return { available, missingPrerequisites };
}

/**
 * Hook to calculate learning path progress through a course
 */
export function useCourseProgress(
    courseId: string,
    completedChapterIds: Set<string>
): {
    completedCount: number;
    totalCount: number;
    progressPercent: number;
    earnedXP: number;
    totalXP: number;
    nextChapter: ChapterCurriculumNode | undefined;
} {
    const courseChapters = useMemo(() => getChaptersByCourse(courseId), [courseId]);

    const completedCount = useMemo(
        () => courseChapters.filter((ch) => completedChapterIds.has(ch.id)).length,
        [courseChapters, completedChapterIds]
    );

    const totalCount = courseChapters.length;
    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const earnedXP = useMemo(
        () =>
            courseChapters
                .filter((ch) => completedChapterIds.has(ch.id))
                .reduce((sum, ch) => sum + ch.xpReward, 0),
        [courseChapters, completedChapterIds]
    );

    const totalXP = useMemo(
        () => courseChapters.reduce((sum, ch) => sum + ch.xpReward, 0),
        [courseChapters]
    );

    const optimalOrder = useMemo(() => getOptimalChapterOrder(courseId), [courseId]);

    const nextChapter = useMemo(
        () => optimalOrder.find((ch) => !completedChapterIds.has(ch.id)),
        [optimalOrder, completedChapterIds]
    );

    return {
        completedCount,
        totalCount,
        progressPercent,
        earnedXP,
        totalXP,
        nextChapter,
    };
}

/**
 * Hook to get learning path recommendations based on current progress
 */
export function useLearningPathRecommendations(
    completedChapterIds: Set<string>,
    currentDomainId?: string
): {
    availableChapters: ChapterCurriculumNode[];
    recommendedNext: ChapterCurriculumNode[];
    entryPoints: ChapterCurriculumNode[];
} {
    // Get all chapters that have prerequisites met
    const availableChapters = useMemo(() => {
        return CURRICULUM_CHAPTERS.filter((ch) => {
            if (completedChapterIds.has(ch.id)) return false;
            return areChapterPrerequisitesMet(ch.id, completedChapterIds);
        });
    }, [completedChapterIds]);

    // Get recommended chapters (prioritize same domain, then hierarchy level)
    const recommendedNext = useMemo(() => {
        const sorted = [...availableChapters].sort((a, b) => {
            // Prioritize same domain
            if (currentDomainId) {
                if (a.domainId === currentDomainId && b.domainId !== currentDomainId) return -1;
                if (b.domainId === currentDomainId && a.domainId !== currentDomainId) return 1;
            }
            // Then by hierarchy level
            if (a.hierarchyLevel !== b.hierarchyLevel) {
                return a.hierarchyLevel - b.hierarchyLevel;
            }
            // Then by sort order
            return a.sortOrder - b.sortOrder;
        });
        return sorted.slice(0, 3);
    }, [availableChapters, currentDomainId]);

    // Get entry point chapters (no prerequisites)
    const entryPoints = useMemo(() => {
        return CURRICULUM_CHAPTERS.filter(
            (ch) => ch.isEntryPoint && !completedChapterIds.has(ch.id)
        );
    }, [completedChapterIds]);

    return {
        availableChapters,
        recommendedNext,
        entryPoints,
    };
}
