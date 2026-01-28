"use client";

/**
 * useSceneGraphWithHistory Hook
 *
 * Extends useSceneGraph with:
 * - Path history tracking for back/forward navigation
 * - Keyboard shortcuts (Escape to go up, Alt+Arrow for history)
 * - Automatic history synchronization
 *
 * This is a wrapper around useSceneGraph that adds browser-like
 * navigation history without modifying the core scene graph logic.
 */

import { useEffect, useCallback, useMemo } from "react";
import type { KnowledgeMapData } from "./types";
import {
    useSceneGraph,
    type UseSceneGraphOptions,
    type UseSceneGraphReturn,
} from "./useSceneGraph";
import {
    usePathHistory,
    type PathHistoryConfig,
} from "./pathHistoryManager";

// ============================================================================
// TYPES
// ============================================================================

export interface UseSceneGraphWithHistoryOptions extends UseSceneGraphOptions {
    /** Enable keyboard navigation */
    enableKeyboardNav?: boolean;
    /** Path history configuration */
    historyConfig?: PathHistoryConfig;
    /** Callback when navigating via history */
    onHistoryNavigate?: (direction: "back" | "forward") => void;
}

export interface UseSceneGraphWithHistoryReturn extends UseSceneGraphReturn {
    // History navigation
    /** Whether can go back in history */
    canGoBack: boolean;
    /** Whether can go forward in history */
    canGoForward: boolean;
    /** Go back in history */
    goBack: () => void;
    /** Go forward in history */
    goForward: () => void;
    /** All history entries */
    historyEntries: Array<{
        id: string;
        viewStack: string[];
        timestamp: number;
        title?: string;
    }>;
    /** Current position in history */
    historyIndex: number;
    /** Navigate to specific history entry */
    goToHistory: (index: number) => void;
    /** Clear navigation history */
    clearHistory: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSceneGraphWithHistory(
    data: KnowledgeMapData,
    options: UseSceneGraphWithHistoryOptions = {}
): UseSceneGraphWithHistoryReturn {
    const {
        enableKeyboardNav = true,
        historyConfig,
        onHistoryNavigate,
        ...sceneGraphOptions
    } = options;

    // Get base scene graph
    const sceneGraph = useSceneGraph(data, sceneGraphOptions);

    // Path history management
    const {
        entries: historyEntries,
        currentIndex: historyIndex,
        canGoBack,
        canGoForward,
        push: pushHistory,
        goBack: historyGoBack,
        goForward: historyGoForward,
        goTo: historyGoTo,
        clear: clearHistory,
    } = usePathHistory(historyConfig);

    // Sync scene graph changes to history
    useEffect(() => {
        // Don't push during transitions
        if (sceneGraph.isTransitioning) return;

        const viewStack = sceneGraph.scene.viewStack;
        const currentBreadcrumb = sceneGraph.breadcrumbItems[sceneGraph.breadcrumbItems.length - 1];

        pushHistory({
            viewStack,
            selectedNodeId: sceneGraph.scene.selectedNodeId,
            title: currentBreadcrumb?.label || "Root",
        });
    }, [
        sceneGraph.scene.viewStack,
        sceneGraph.scene.currentParentId,
        sceneGraph.isTransitioning,
        sceneGraph.breadcrumbItems,
        pushHistory,
    ]);

    // Navigate from history entry
    const navigateToHistoryEntry = useCallback(
        (entry: { viewStack: string[]; selectedNodeId: string | null }) => {
            // Navigate to the appropriate depth
            if (entry.viewStack.length === 0) {
                // Go to root
                sceneGraph.drillUp(-1);
            } else {
                // Navigate to the last item in viewStack
                const targetIndex = entry.viewStack.length - 1;
                sceneGraph.drillUp(targetIndex);
            }

            // Restore selection if any
            if (entry.selectedNodeId) {
                sceneGraph.selectNode(entry.selectedNodeId);
            }
        },
        [sceneGraph]
    );

    // Go back in history
    const goBack = useCallback(() => {
        if (!canGoBack || sceneGraph.isTransitioning) return;

        const entry = historyGoBack();
        if (entry) {
            navigateToHistoryEntry(entry);
            onHistoryNavigate?.("back");
        }
    }, [
        canGoBack,
        sceneGraph.isTransitioning,
        historyGoBack,
        navigateToHistoryEntry,
        onHistoryNavigate,
    ]);

    // Go forward in history
    const goForward = useCallback(() => {
        if (!canGoForward || sceneGraph.isTransitioning) return;

        const entry = historyGoForward();
        if (entry) {
            navigateToHistoryEntry(entry);
            onHistoryNavigate?.("forward");
        }
    }, [
        canGoForward,
        sceneGraph.isTransitioning,
        historyGoForward,
        navigateToHistoryEntry,
        onHistoryNavigate,
    ]);

    // Go to specific history entry
    const goToHistory = useCallback(
        (index: number) => {
            if (sceneGraph.isTransitioning) return;

            const entry = historyGoTo(index);
            if (entry) {
                navigateToHistoryEntry(entry);
            }
        },
        [sceneGraph.isTransitioning, historyGoTo, navigateToHistoryEntry]
    );

    // Keyboard navigation
    useEffect(() => {
        if (!enableKeyboardNav) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if user is typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            // Skip if transitioning
            if (sceneGraph.isTransitioning) return;

            switch (e.key) {
                case "Escape":
                    // Go up one level
                    if (sceneGraph.scene.depth > 0) {
                        e.preventDefault();
                        sceneGraph.drillUp();
                    }
                    break;

                case "Backspace":
                    // Go back in history (with Alt/Meta modifier)
                    if ((e.altKey || e.metaKey) && canGoBack) {
                        e.preventDefault();
                        goBack();
                    }
                    break;

                case "ArrowLeft":
                    // Go back in history (with Alt modifier)
                    if (e.altKey && canGoBack) {
                        e.preventDefault();
                        goBack();
                    }
                    break;

                case "ArrowRight":
                    // Go forward in history (with Alt modifier)
                    if (e.altKey && canGoForward) {
                        e.preventDefault();
                        goForward();
                    }
                    break;

                case "Home":
                    // Go to root (with Ctrl/Meta modifier)
                    if ((e.ctrlKey || e.metaKey) && sceneGraph.scene.depth > 0) {
                        e.preventDefault();
                        sceneGraph.drillUp(-1);
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        enableKeyboardNav,
        sceneGraph,
        canGoBack,
        canGoForward,
        goBack,
        goForward,
    ]);

    // Return extended interface
    return {
        ...sceneGraph,

        // History navigation
        canGoBack,
        canGoForward,
        goBack,
        goForward,
        historyEntries,
        historyIndex,
        goToHistory,
        clearHistory,
    };
}

// ============================================================================
// KEYBOARD SHORTCUT HELPERS
// ============================================================================

/**
 * Get keyboard shortcut hints for display
 */
export function getKeyboardShortcuts(): Array<{
    key: string;
    description: string;
    modifier?: string;
}> {
    return [
        { key: "Escape", description: "Go up one level" },
        { key: "←", description: "Go back in history", modifier: "Alt" },
        { key: "→", description: "Go forward in history", modifier: "Alt" },
        { key: "Home", description: "Go to root", modifier: "Ctrl" },
    ];
}

export default useSceneGraphWithHistory;
