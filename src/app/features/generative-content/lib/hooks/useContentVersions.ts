/**
 * Content Versions Hook
 *
 * Hook for managing content versions.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { GeneratedChapter, ContentVersion } from "../types";
import {
    saveVersion,
    getVersionsForContent,
    getCurrentVersion,
    restoreVersion,
} from "../pathStorage";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Hook for managing content versions
 */
export function useContentVersions(contentId: string) {
    const [versions, setVersions] = useState<ContentVersion[]>([]);
    const [currentVersion, setCurrentVersionState] = useState<ContentVersion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { userId } = useCurrentUser();

    // Load versions
    useEffect(() => {
        const loadedVersions = getVersionsForContent(contentId);
        const current = getCurrentVersion(contentId);

        setVersions(loadedVersions);
        setCurrentVersionState(current || null);
        setIsLoading(false);
    }, [contentId]);

    /**
     * Create a new version
     */
    const createVersion = useCallback(
        (chapter: GeneratedChapter, changelog: string[]) => {
            const versionNumber = versions.length + 1;

            const newVersion: ContentVersion = {
                versionId: `v_${Date.now()}`,
                contentId,
                version: `1.${versionNumber}.0`,
                changelog,
                qualityScore: chapter.qualityMetrics.overallScore,
                contentSnapshot: chapter,
                createdAt: new Date().toISOString(),
                createdBy: userId,
                isCurrent: true,
            };

            saveVersion(newVersion);

            setVersions((prev) =>
                prev.map((v) => ({ ...v, isCurrent: false })).concat(newVersion)
            );
            setCurrentVersionState(newVersion);

            return newVersion;
        },
        [contentId, userId, versions.length]
    );

    /**
     * Restore a specific version
     */
    const restore = useCallback(
        (versionId: string) => {
            restoreVersion(versionId);

            const updated = getVersionsForContent(contentId);
            const current = getCurrentVersion(contentId);

            setVersions(updated);
            setCurrentVersionState(current || null);
        },
        [contentId]
    );

    return {
        versions,
        currentVersion,
        isLoading,
        createVersion,
        restore,
    };
}
