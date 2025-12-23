/**
 * User Path Storage
 *
 * Storage operations for user path tracking.
 */

import { STORAGE_KEYS } from "./constants";
import { getStorageItem, setStorageItem } from "./helpers";

/**
 * Track a user's explored path
 */
export function trackUserPath(userId: string, pathId: string): void {
    const userPaths = getStorageItem<Record<string, string[]>>(STORAGE_KEYS.USER_PATHS, {});

    if (!userPaths[userId]) {
        userPaths[userId] = [];
    }

    if (!userPaths[userId].includes(pathId)) {
        userPaths[userId].push(pathId);
    }

    setStorageItem(STORAGE_KEYS.USER_PATHS, userPaths);
}

/**
 * Get user's explored paths
 */
export function getUserExploredPaths(userId: string): string[] {
    const userPaths = getStorageItem<Record<string, string[]>>(STORAGE_KEYS.USER_PATHS, {});
    return userPaths[userId] || [];
}

/**
 * Get path popularity (number of users who explored it)
 */
export function getPathPopularity(pathId: string): number {
    const userPaths = getStorageItem<Record<string, string[]>>(STORAGE_KEYS.USER_PATHS, {});
    let count = 0;

    Object.values(userPaths).forEach((paths) => {
        if (paths.includes(pathId)) {
            count++;
        }
    });

    return count;
}
