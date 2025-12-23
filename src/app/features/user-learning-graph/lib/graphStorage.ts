"use client";

/**
 * User Learning Graph Storage
 *
 * Persists the user's learning graph to localStorage with:
 * - SSR safety
 * - Version migration support
 * - Export/import functionality
 * - Conflict-free merging for multi-device sync
 */

import { createLocalStorage } from "@/app/shared/lib/storageFactory";
import type {
    UserLearningGraph,
    UserLearningGraphExport,
    GraphMutation,
} from "./types";
import {
    createUserLearningGraph,
    recalculateAnalytics,
    importGraph,
} from "./graphMutations";

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

const STORAGE_KEY = "user-learning-graph";
const CURRENT_VERSION = "1.0.0";
const DEFAULT_USER_ID = "local-user";

/**
 * Creates the default graph for new users
 */
function getDefaultGraph(): UserLearningGraph {
    return createUserLearningGraph(DEFAULT_USER_ID);
}

/**
 * Migration function for version updates
 */
function migrateGraph(oldData: unknown, oldVersion: string | undefined): UserLearningGraph {
    // For now, no migrations needed - just return default if invalid
    if (!oldData || typeof oldData !== "object") {
        return getDefaultGraph();
    }

    const data = oldData as Record<string, unknown>;

    // Validate essential fields
    if (!data.userId || !data.nodes || !data.paths) {
        return getDefaultGraph();
    }

    // Return as-is if valid structure (future migrations would go here)
    return oldData as UserLearningGraph;
}

// ============================================================================
// STORAGE MODULE
// ============================================================================

/**
 * The localStorage module for the user learning graph
 */
const graphStorage = createLocalStorage<UserLearningGraph>({
    storageKey: STORAGE_KEY,
    getDefault: getDefaultGraph,
    version: CURRENT_VERSION,
    migrate: migrateGraph,
});

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get the current user learning graph
 */
export function getUserLearningGraph(): UserLearningGraph {
    return graphStorage.get();
}

/**
 * Save the user learning graph
 */
export function saveUserLearningGraph(graph: UserLearningGraph): void {
    graphStorage.save(graph);
}

/**
 * Update the graph using a callback (read-modify-write pattern)
 */
export function updateUserLearningGraph(
    updater: (current: UserLearningGraph) => UserLearningGraph
): UserLearningGraph {
    return graphStorage.update(updater);
}

/**
 * Clear all graph data and start fresh
 */
export function clearUserLearningGraph(): void {
    graphStorage.clear();
}

/**
 * Check if user has any graph data
 */
export function hasUserLearningGraph(): boolean {
    return graphStorage.exists();
}

/**
 * Get the storage key (for debugging)
 */
export function getStorageKey(): string {
    return graphStorage.getKey();
}

// ============================================================================
// EXPORT / IMPORT
// ============================================================================

/**
 * Export the user learning graph to JSON string
 */
export function exportUserLearningGraph(
    options: { includeMutationHistory?: boolean } = {}
): string {
    const { includeMutationHistory = true } = options;
    const graph = getUserLearningGraph();

    const exportData: UserLearningGraphExport = {
        exportedAt: new Date().toISOString(),
        exportVersion: CURRENT_VERSION,
        graph: includeMutationHistory
            ? graph
            : {
                ...graph,
                mutationHistory: [],
            },
        includeMutationHistory,
    };

    return JSON.stringify(exportData, null, 2);
}

/**
 * Import a user learning graph from JSON string
 */
export function importUserLearningGraph(
    jsonString: string,
    options: { merge?: boolean } = {}
): { success: boolean; error?: string } {
    const { merge = false } = options;

    try {
        const importData = JSON.parse(jsonString) as UserLearningGraphExport;

        // Validate import structure
        if (!importData.graph || !importData.exportVersion) {
            return { success: false, error: "Invalid export format" };
        }

        const currentGraph = getUserLearningGraph();

        // Import (merge or replace)
        const newGraph = importGraph(currentGraph, importData.graph, { merge });

        // Recalculate analytics
        const graphWithAnalytics = recalculateAnalytics(newGraph);

        // Save
        saveUserLearningGraph(graphWithAnalytics);

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Download the graph as a JSON file
 */
export function downloadUserLearningGraph(
    filename: string = "learning-graph.json"
): void {
    if (typeof window === "undefined") return;

    const jsonString = exportUserLearningGraph({ includeMutationHistory: true });
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Get the aggregated mutation patterns for recommendation engine
 */
export function getMutationPatterns(): {
    pathPreferences: Record<string, number>;
    completionTimes: number[];
    skipPatterns: string[];
    activeHours: number[];
} {
    const graph = getUserLearningGraph();
    const mutations = graph.mutationHistory;

    // Path preferences (count of selections)
    const pathPreferences: Record<string, number> = {};
    mutations
        .filter((m) => m.type === "path_selected")
        .forEach((m) => {
            if (m.pathId) {
                pathPreferences[m.pathId] = (pathPreferences[m.pathId] || 0) + 1;
            }
        });

    // Completion times (time between started and completed)
    const completionTimes: number[] = [];
    const startTimes: Record<string, number> = {};

    mutations.forEach((m) => {
        if (m.type === "node_started") {
            startTimes[m.nodeId] = new Date(m.timestamp).getTime();
        } else if (m.type === "node_completed" && startTimes[m.nodeId]) {
            const duration = new Date(m.timestamp).getTime() - startTimes[m.nodeId];
            completionTimes.push(duration / 1000 / 60); // Convert to minutes
        }
    });

    // Skip patterns (which nodes get skipped)
    const skipPatterns = mutations
        .filter((m) => m.type === "node_skipped")
        .map((m) => m.nodeId);

    // Active hours (when user is most active)
    const activeHours: number[] = Array(24).fill(0);
    mutations.forEach((m) => {
        const hour = new Date(m.timestamp).getHours();
        activeHours[hour]++;
    });

    return {
        pathPreferences,
        completionTimes,
        skipPatterns,
        activeHours,
    };
}

/**
 * Get recent mutations for activity feed
 */
export function getRecentMutations(limit: number = 10): GraphMutation[] {
    const graph = getUserLearningGraph();
    return graph.mutationHistory
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
}

/**
 * Get mutations for a specific node
 */
export function getNodeMutations(nodeId: string): GraphMutation[] {
    const graph = getUserLearningGraph();
    return graph.mutationHistory
        .filter((m) => m.nodeId === nodeId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Get mutations for a specific path
 */
export function getPathMutations(pathId: string): GraphMutation[] {
    const graph = getUserLearningGraph();
    return graph.mutationHistory
        .filter((m) => m.pathId === pathId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// ============================================================================
// SYNC HELPERS (for future multi-device support)
// ============================================================================

/**
 * Get a hash of the current graph state for sync comparison
 */
export function getGraphHash(): string {
    const graph = getUserLearningGraph();
    const stateString = JSON.stringify({
        nodes: Object.keys(graph.nodes).sort(),
        paths: Object.keys(graph.paths).sort(),
        lastModified: graph.lastModifiedAt,
    });

    // Simple hash for comparison
    let hash = 0;
    for (let i = 0; i < stateString.length; i++) {
        const char = stateString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

/**
 * Get last modification timestamp
 */
export function getLastModified(): string {
    const graph = getUserLearningGraph();
    return graph.lastModifiedAt;
}

/**
 * Check if local graph needs sync (based on timestamp comparison)
 */
export function needsSync(remoteTimestamp: string): boolean {
    const localTimestamp = getLastModified();
    return new Date(remoteTimestamp).getTime() > new Date(localTimestamp).getTime();
}
