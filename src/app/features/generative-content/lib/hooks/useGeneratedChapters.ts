/**
 * Generated Chapters Hook
 *
 * Hook for managing generated chapters.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { GeneratedChapter } from "../types";
import {
    getAllChapters,
    getChapterById,
    getChaptersByPathSeed,
} from "../pathStorage";

/**
 * Hook for managing generated chapters
 */
export function useGeneratedChapters(pathSeedId?: string) {
    const [chapters, setChapters] = useState<GeneratedChapter[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load chapters on mount or when pathSeedId changes
    useEffect(() => {
        const loadedChapters = pathSeedId
            ? getChaptersByPathSeed(pathSeedId)
            : getAllChapters();
        setChapters(loadedChapters);
        setIsLoading(false);
    }, [pathSeedId]);

    /**
     * Refresh chapters
     */
    const refresh = useCallback(() => {
        const loadedChapters = pathSeedId
            ? getChaptersByPathSeed(pathSeedId)
            : getAllChapters();
        setChapters(loadedChapters);
    }, [pathSeedId]);

    /**
     * Get chapter by ID
     */
    const getChapter = useCallback((id: string) => {
        return chapters.find((c) => c.id === id) || getChapterById(id);
    }, [chapters]);

    return {
        chapters,
        isLoading,
        refresh,
        getChapter,
    };
}
