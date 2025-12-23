/**
 * Path Seed Storage
 *
 * Storage operations for learning path seeds.
 */

import type { LearningPathSeed } from "../types";
import { STORAGE_KEYS } from "./constants";
import { getStorageItem, setStorageItem } from "./helpers";

/**
 * Save a learning path seed
 */
export function savePath(path: LearningPathSeed): void {
    const paths = getStorageItem<LearningPathSeed[]>(STORAGE_KEYS.PATHS, []);
    const existingIndex = paths.findIndex((p) => p.pathId === path.pathId);

    if (existingIndex >= 0) {
        paths[existingIndex] = path;
    } else {
        paths.push(path);
    }

    setStorageItem(STORAGE_KEYS.PATHS, paths);
}

/**
 * Get all saved paths
 */
export function getAllPaths(): LearningPathSeed[] {
    return getStorageItem<LearningPathSeed[]>(STORAGE_KEYS.PATHS, []);
}

/**
 * Get path by ID
 */
export function getPathById(pathId: string): LearningPathSeed | undefined {
    const paths = getAllPaths();
    return paths.find((p) => p.pathId === pathId);
}

/**
 * Get paths by user
 */
export function getPathsByUser(userId: string): LearningPathSeed[] {
    const paths = getAllPaths();
    return paths.filter((p) => p.createdBy === userId);
}

/**
 * Search paths by topics
 */
export function searchPathsByTopics(topics: string[]): LearningPathSeed[] {
    const paths = getAllPaths();
    const topicsLower = topics.map((t) => t.toLowerCase());

    return paths.filter((path) =>
        topicsLower.every((topic) =>
            path.topics.some((t) => t.toLowerCase().includes(topic))
        )
    );
}

/**
 * Check if a path combination already exists
 */
export function pathExists(topics: string[]): LearningPathSeed | undefined {
    const paths = getAllPaths();
    const sortedTopics = [...topics].sort().map((t) => t.toLowerCase());

    return paths.find((path) => {
        const pathTopics = [...path.topics].sort().map((t) => t.toLowerCase());
        return (
            pathTopics.length === sortedTopics.length &&
            pathTopics.every((t, i) => t === sortedTopics[i])
        );
    });
}

/**
 * Delete a path
 */
export function deletePath(pathId: string): void {
    const paths = getAllPaths();
    const filtered = paths.filter((p) => p.pathId !== pathId);
    setStorageItem(STORAGE_KEYS.PATHS, filtered);
}
