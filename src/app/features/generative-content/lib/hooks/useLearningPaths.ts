/**
 * Learning Paths Hook
 *
 * Hook for managing learning path seeds.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { LearningPathSeed } from "../types";
import { createPathSeed } from "../types";
import {
    savePath,
    getAllPaths,
    pathExists,
    getChaptersByPathSeed,
    trackUserPath,
    getUserExploredPaths,
} from "../pathStorage";
import type { LearningDomainId } from "@/app/shared/lib/learningDomains";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Hook for managing learning path seeds
 */
export function useLearningPaths() {
    const [paths, setPaths] = useState<LearningPathSeed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userId } = useCurrentUser();

    // Load paths on mount
    useEffect(() => {
        const loadedPaths = getAllPaths();
        setPaths(loadedPaths);
        setIsLoading(false);
    }, []);

    /**
     * Create a new learning path
     */
    const createPath = useCallback(
        (
            topics: string[],
            domainId: LearningDomainId,
            options?: { userGoal?: string; skillLevel?: LearningPathSeed["skillLevel"] }
        ): LearningPathSeed | null => {
            // Check if path already exists
            const existing = pathExists(topics);
            if (existing) {
                return existing;
            }

            // Create new path
            const newPath = createPathSeed(topics, domainId, userId, options);
            savePath(newPath);
            trackUserPath(userId, newPath.pathId);

            setPaths((prev) => [...prev, newPath]);
            return newPath;
        },
        [userId]
    );

    /**
     * Search for existing paths
     */
    const searchPaths = useCallback((topics: string[]): LearningPathSeed[] => {
        const topicsLower = topics.map((t) => t.toLowerCase());
        return paths.filter((path) =>
            topicsLower.every((topic) =>
                path.topics.some((t) => t.toLowerCase().includes(topic))
            )
        );
    }, [paths]);

    /**
     * Get user's explored paths
     */
    const userPaths = useMemo(() => {
        const exploredIds = getUserExploredPaths(userId);
        return paths.filter((p) => exploredIds.includes(p.pathId));
    }, [paths, userId]);

    /**
     * Get popular paths
     */
    const popularPaths = useMemo(() => {
        return [...paths]
            .map((path) => ({
                path,
                popularity: getChaptersByPathSeed(path.pathId).length,
            }))
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 10)
            .map(({ path }) => path);
    }, [paths]);

    return {
        paths,
        userPaths,
        popularPaths,
        isLoading,
        createPath,
        searchPaths,
        getPathById: (id: string) => paths.find((p) => p.pathId === id),
    };
}
