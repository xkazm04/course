/**
 * Chapter Storage
 *
 * Storage operations for generated chapters.
 */

import type { GeneratedChapter } from "../types";
import { STORAGE_KEYS } from "./constants";
import { getStorageItem, setStorageItem } from "./helpers";

/**
 * Save a generated chapter
 */
export function saveChapter(chapter: GeneratedChapter): void {
    const chapters = getStorageItem<GeneratedChapter[]>(STORAGE_KEYS.CHAPTERS, []);
    const existingIndex = chapters.findIndex((c) => c.id === chapter.id);

    if (existingIndex >= 0) {
        chapters[existingIndex] = chapter;
    } else {
        chapters.push(chapter);
    }

    setStorageItem(STORAGE_KEYS.CHAPTERS, chapters);
}

/**
 * Get all generated chapters
 */
export function getAllChapters(): GeneratedChapter[] {
    return getStorageItem<GeneratedChapter[]>(STORAGE_KEYS.CHAPTERS, []);
}

/**
 * Get chapter by ID
 */
export function getChapterById(chapterId: string): GeneratedChapter | undefined {
    const chapters = getAllChapters();
    return chapters.find((c) => c.id === chapterId);
}

/**
 * Get chapters by path seed ID
 */
export function getChaptersByPathSeed(pathSeedId: string): GeneratedChapter[] {
    const chapters = getAllChapters();
    return chapters.filter((c) => c.pathSeedId === pathSeedId);
}

/**
 * Get published chapters
 */
export function getPublishedChapters(): GeneratedChapter[] {
    const chapters = getAllChapters();
    return chapters.filter((c) => c.generationMeta.status === "published");
}

/**
 * Update chapter status
 */
export function updateChapterStatus(
    chapterId: string,
    status: GeneratedChapter["generationMeta"]["status"]
): void {
    const chapters = getAllChapters();
    const chapter = chapters.find((c) => c.id === chapterId);

    if (chapter) {
        chapter.generationMeta.status = status;
        setStorageItem(STORAGE_KEYS.CHAPTERS, chapters);
    }
}

/**
 * Delete a chapter
 */
export function deleteChapter(chapterId: string): void {
    const chapters = getAllChapters();
    const filtered = chapters.filter((c) => c.id !== chapterId);
    setStorageItem(STORAGE_KEYS.CHAPTERS, filtered);
}
