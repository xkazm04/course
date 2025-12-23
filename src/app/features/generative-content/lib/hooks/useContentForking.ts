/**
 * Content Forking Hook
 *
 * Hook for forking content.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { GeneratedChapter, ContentFork } from "../types";
import {
    saveChapter,
    getChapterById,
    saveFork,
    getForksOfChapter,
    getForkInfo,
} from "../pathStorage";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Hook for forking content
 */
export function useContentForking(chapterId: string) {
    const [forks, setForks] = useState<ContentFork[]>([]);
    const [forkInfo, setForkInfo] = useState<ContentFork | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { userId } = useCurrentUser();

    // Load fork data
    useEffect(() => {
        const loadedForks = getForksOfChapter(chapterId);
        const info = getForkInfo(chapterId);

        setForks(loadedForks);
        setForkInfo(info || null);
        setIsLoading(false);
    }, [chapterId]);

    /**
     * Fork a chapter
     */
    const forkChapter = useCallback(
        (
            originalChapter: GeneratedChapter,
            reason?: string,
            customizations?: ContentFork["customizations"]
        ): GeneratedChapter => {
            // Create forked chapter
            const forkedChapter: GeneratedChapter = {
                ...originalChapter,
                id: `fork_${Date.now()}`,
                forkInfo: {
                    parentChapterId: originalChapter.id,
                    forkDate: new Date().toISOString(),
                    forkedBy: userId,
                },
                qualityMetrics: {
                    overallScore: 0,
                    ratingCount: 0,
                    averageRating: 0,
                    completionRate: 0,
                    quizPassRate: 0,
                    forkCount: 0,
                    trend: "stable",
                },
            };

            // Save forked chapter
            saveChapter(forkedChapter);

            // Create fork record
            const fork: ContentFork = {
                forkId: `fork_record_${Date.now()}`,
                originalContentId: originalChapter.id,
                forkedContentId: forkedChapter.id,
                forkedBy: userId,
                forkReason: reason,
                customizations: customizations || [],
                forkedAt: new Date().toISOString(),
                mergedBack: false,
            };

            saveFork(fork);
            setForks((prev) => [...prev, fork]);

            return forkedChapter;
        },
        [userId]
    );

    /**
     * Check if this chapter is a fork
     */
    const isFork = useMemo(() => forkInfo !== null, [forkInfo]);

    /**
     * Get the original chapter if this is a fork
     */
    const getOriginal = useCallback(() => {
        if (!forkInfo) return null;
        return getChapterById(forkInfo.originalContentId);
    }, [forkInfo]);

    return {
        forks,
        forkInfo,
        forkCount: forks.length,
        isFork,
        isLoading,
        forkChapter,
        getOriginal,
    };
}
