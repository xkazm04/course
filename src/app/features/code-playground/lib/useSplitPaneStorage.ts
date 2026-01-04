"use client";

import { useState, useCallback } from "react";

const STORAGE_PREFIX = "code-playground-split-";
const DEFAULT_RATIO = 0.5; // 50/50 split
const MIN_RATIO = 0.2; // Minimum 20% for either pane
const MAX_RATIO = 0.8; // Maximum 80% for either pane

/** Load saved ratio from localStorage */
function getInitialRatio(
    storageId: string,
    defaultRatio: number,
    minRatio: number,
    maxRatio: number
): number {
    if (typeof window === "undefined") return defaultRatio;

    const storageKey = `${STORAGE_PREFIX}${storageId}`;
    const savedRatio = localStorage.getItem(storageKey);

    if (savedRatio) {
        const parsed = parseFloat(savedRatio);
        if (!isNaN(parsed) && parsed >= minRatio && parsed <= maxRatio) {
            return parsed;
        }
    }

    return defaultRatio;
}

export interface UseSplitPaneStorageOptions {
    /** Unique ID for persistence (uses playgroundId) */
    storageId: string;
    /** Default split ratio (0-1, represents editor portion) */
    defaultRatio?: number;
    /** Minimum ratio for the editor pane */
    minRatio?: number;
    /** Maximum ratio for the editor pane */
    maxRatio?: number;
}

export function useSplitPaneStorage({
    storageId,
    defaultRatio = DEFAULT_RATIO,
    minRatio = MIN_RATIO,
    maxRatio = MAX_RATIO,
}: UseSplitPaneStorageOptions) {
    // Use lazy initialization to load from localStorage
    const [ratio, setRatio] = useState(() =>
        getInitialRatio(storageId, defaultRatio, minRatio, maxRatio)
    );
    const [isDragging, setIsDragging] = useState(false);

    // Save ratio to localStorage
    const saveRatio = useCallback((newRatio: number) => {
        if (typeof window === "undefined") return;

        const storageKey = `${STORAGE_PREFIX}${storageId}`;
        localStorage.setItem(storageKey, newRatio.toString());
    }, [storageId]);

    // Update ratio with clamping and persistence
    const updateRatio = useCallback((newRatio: number) => {
        const clampedRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
        setRatio(clampedRatio);
        saveRatio(clampedRatio);
    }, [minRatio, maxRatio, saveRatio]);

    // Reset to default (50/50)
    const resetToDefault = useCallback(() => {
        setRatio(defaultRatio);
        saveRatio(defaultRatio);
    }, [defaultRatio, saveRatio]);

    // Start dragging
    const startDragging = useCallback(() => {
        setIsDragging(true);
    }, []);

    // Stop dragging
    const stopDragging = useCallback(() => {
        setIsDragging(false);
    }, []);

    return {
        /** Current split ratio (0-1, represents editor portion of available space) */
        ratio,
        /** Whether the user is currently dragging the handle */
        isDragging,
        /** Update the split ratio */
        updateRatio,
        /** Reset to 50/50 split */
        resetToDefault,
        /** Start drag operation */
        startDragging,
        /** Stop drag operation */
        stopDragging,
        /** Minimum allowed ratio */
        minRatio,
        /** Maximum allowed ratio */
        maxRatio,
    };
}
