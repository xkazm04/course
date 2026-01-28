// ============================================================================
// Path Sync Selectors - Derived state hooks for the PathSyncStore
//
// This file contains selector hooks that compute derived views from the store.
// Separating selectors from the store definition follows Zustand best practices
// and creates a clear mental model:
// - usePathSyncStore.ts: state + actions
// - usePathSyncSelectors.ts: computed/derived data
// ============================================================================

import { usePathSyncStore, type DynamicMapNode } from "./usePathSyncStore";

// ============================================================================
// Simple State Selectors
// ============================================================================

/**
 * Get the currently accepted path info
 */
export const useAcceptedPath = () => usePathSyncStore(state => state.acceptedPath);

/**
 * Get all dynamic nodes as a record
 */
export const useDynamicNodes = () => usePathSyncStore(state => state.dynamicNodes);

/**
 * Get sidebar open state
 */
export const useIsSidebarOpen = () => usePathSyncStore(state => state.isSidebarOpen);

/**
 * Get polling state
 */
export const useIsPolling = () => usePathSyncStore(state => state.isPolling);

/**
 * Get all generation jobs
 */
export const useGenerationJobs = () => usePathSyncStore(state => state.generationJobs);

// ============================================================================
// Computed/Derived Selectors
// ============================================================================

/**
 * Get nodes as array sorted by depth then order
 * Useful for rendering flat lists in hierarchical order
 */
export const useSortedDynamicNodes = () => {
    const nodes = usePathSyncStore(state => state.dynamicNodes);
    return Object.values(nodes).sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        return a.order - b.order;
    });
};

/**
 * Get nodes grouped by parent ID
 * Useful for rendering tree structures
 * Returns { root: [...], [parentId]: [...] }
 */
export const useNodesByParent = () => {
    const nodes = usePathSyncStore(state => state.dynamicNodes);
    const byParent: Record<string, DynamicMapNode[]> = { root: [] };

    for (const node of Object.values(nodes)) {
        const parentKey = node.parentId || "root";
        if (!byParent[parentKey]) byParent[parentKey] = [];
        byParent[parentKey].push(node);
    }

    // Sort each group by order
    for (const key in byParent) {
        byParent[key].sort((a, b) => a.order - b.order);
    }

    return byParent;
};

/**
 * Get overall generation progress as a percentage (0-100)
 * Returns 100 if no jobs exist
 */
export const useOverallProgress = () => {
    const jobs = usePathSyncStore(state => state.generationJobs);
    const jobArray = Object.values(jobs);
    if (jobArray.length === 0) return 100;

    const completed = jobArray.filter(j => j.status === "ready" || j.status === "completed").length;
    return Math.round((completed / jobArray.length) * 100);
};
