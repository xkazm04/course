/**
 * Fork Storage
 *
 * Storage operations for content forks.
 */

import type { ContentFork } from "../types";
import { STORAGE_KEYS } from "./constants";
import { getStorageItem, setStorageItem } from "./helpers";

/**
 * Save a fork record (without triggering metrics update)
 */
export function saveForkOnly(fork: ContentFork): void {
    const forks = getStorageItem<ContentFork[]>(STORAGE_KEYS.FORKS, []);
    forks.push(fork);
    setStorageItem(STORAGE_KEYS.FORKS, forks);
}

/**
 * Get all forks
 */
export function getAllForks(): ContentFork[] {
    return getStorageItem<ContentFork[]>(STORAGE_KEYS.FORKS, []);
}

/**
 * Get forks of a chapter
 */
export function getForksOfChapter(chapterId: string): ContentFork[] {
    const forks = getAllForks();
    return forks.filter((f) => f.originalContentId === chapterId);
}

/**
 * Get forks by user
 */
export function getForksByUser(userId: string): ContentFork[] {
    const forks = getAllForks();
    return forks.filter((f) => f.forkedBy === userId);
}

/**
 * Get fork info for a chapter
 */
export function getForkInfo(forkedChapterId: string): ContentFork | undefined {
    const forks = getAllForks();
    return forks.find((f) => f.forkedContentId === forkedChapterId);
}

/**
 * Mark fork as merged
 */
export function markForkMerged(forkId: string): void {
    const forks = getAllForks();
    const fork = forks.find((f) => f.forkId === forkId);

    if (fork) {
        fork.mergedBack = true;
        setStorageItem(STORAGE_KEYS.FORKS, forks);
    }
}
