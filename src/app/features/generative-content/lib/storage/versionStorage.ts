/**
 * Version Storage
 *
 * Storage operations for content versions.
 */

import type { ContentVersion, GeneratedChapter } from "../types";
import { STORAGE_KEYS } from "./constants";
import { getStorageItem, setStorageItem } from "./helpers";
import { saveChapter } from "./chapterStorage";

/**
 * Save a content version
 */
export function saveVersion(version: ContentVersion): void {
    const versions = getStorageItem<ContentVersion[]>(STORAGE_KEYS.VERSIONS, []);

    // Mark all existing versions as not current
    versions.forEach((v) => {
        if (v.contentId === version.contentId) {
            v.isCurrent = false;
        }
    });

    versions.push(version);
    setStorageItem(STORAGE_KEYS.VERSIONS, versions);
}

/**
 * Get all versions for content
 */
export function getVersionsForContent(contentId: string): ContentVersion[] {
    const versions = getStorageItem<ContentVersion[]>(STORAGE_KEYS.VERSIONS, []);
    return versions
        .filter((v) => v.contentId === contentId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get current version for content
 */
export function getCurrentVersion(contentId: string): ContentVersion | undefined {
    const versions = getVersionsForContent(contentId);
    return versions.find((v) => v.isCurrent);
}

/**
 * Restore a specific version
 */
export function restoreVersion(versionId: string): void {
    const versions = getStorageItem<ContentVersion[]>(STORAGE_KEYS.VERSIONS, []);
    const targetVersion = versions.find((v) => v.versionId === versionId);

    if (targetVersion) {
        // Mark all versions of this content as not current
        versions.forEach((v) => {
            if (v.contentId === targetVersion.contentId) {
                v.isCurrent = v.versionId === versionId;
            }
        });

        setStorageItem(STORAGE_KEYS.VERSIONS, versions);

        // Update the actual chapter content
        const chapter = targetVersion.contentSnapshot as GeneratedChapter;
        if (chapter) {
            saveChapter(chapter);
        }
    }
}
