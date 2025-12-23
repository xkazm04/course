"use client";

/**
 * usePathComparison Hook
 *
 * Manages path comparison state and provides methods for
 * adding/removing paths from comparison.
 */

import { useState, useCallback, useMemo } from "react";
import type { LearningPath } from "@/app/shared/lib/types";
import type { ComparisonSession, PathComparisonData } from "./types";
import { generateComparisonData } from "./comparisonUtils";

interface UsePathComparisonOptions {
    /** Maximum paths that can be compared simultaneously */
    maxPaths?: number;
    /** All available learning paths */
    allPaths: LearningPath[];
}

interface UsePathComparisonReturn {
    /** Current comparison session state */
    session: ComparisonSession;
    /** Computed comparison data for selected paths */
    comparisonData: PathComparisonData[];
    /** Add a path to comparison */
    addPath: (path: LearningPath) => void;
    /** Remove a path from comparison */
    removePath: (pathId: string) => void;
    /** Toggle a path in/out of comparison */
    togglePath: (path: LearningPath) => void;
    /** Check if a path is selected for comparison */
    isSelected: (pathId: string) => boolean;
    /** Open the comparison modal */
    openModal: () => void;
    /** Close the comparison modal */
    closeModal: () => void;
    /** Clear all selected paths */
    clearSelection: () => void;
    /** Whether more paths can be added */
    canAddMore: boolean;
    /** Whether comparison is possible (at least 2 paths) */
    canCompare: boolean;
}

export function usePathComparison({
    maxPaths = 3,
    allPaths,
}: UsePathComparisonOptions): UsePathComparisonReturn {
    const [selectedPaths, setSelectedPaths] = useState<LearningPath[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const session: ComparisonSession = useMemo(
        () => ({
            selectedPaths,
            maxPaths,
            isOpen,
        }),
        [selectedPaths, maxPaths, isOpen]
    );

    const comparisonData = useMemo(
        () => generateComparisonData(selectedPaths, allPaths),
        [selectedPaths, allPaths]
    );

    const addPath = useCallback(
        (path: LearningPath) => {
            setSelectedPaths(prev => {
                if (prev.length >= maxPaths) return prev;
                if (prev.some(p => p.id === path.id)) return prev;
                return [...prev, path];
            });
        },
        [maxPaths]
    );

    const removePath = useCallback((pathId: string) => {
        setSelectedPaths(prev => prev.filter(p => p.id !== pathId));
    }, []);

    const togglePath = useCallback(
        (path: LearningPath) => {
            setSelectedPaths(prev => {
                const isCurrentlySelected = prev.some(p => p.id === path.id);
                if (isCurrentlySelected) {
                    return prev.filter(p => p.id !== path.id);
                }
                if (prev.length >= maxPaths) return prev;
                return [...prev, path];
            });
        },
        [maxPaths]
    );

    const isSelected = useCallback(
        (pathId: string) => selectedPaths.some(p => p.id === pathId),
        [selectedPaths]
    );

    const openModal = useCallback(() => setIsOpen(true), []);
    const closeModal = useCallback(() => setIsOpen(false), []);
    const clearSelection = useCallback(() => setSelectedPaths([]), []);

    const canAddMore = selectedPaths.length < maxPaths;
    const canCompare = selectedPaths.length >= 2;

    return {
        session,
        comparisonData,
        addPath,
        removePath,
        togglePath,
        isSelected,
        openModal,
        closeModal,
        clearSelection,
        canAddMore,
        canCompare,
    };
}
