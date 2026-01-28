// ============================================================================
// Path Sync Store - Zustand store for syncing Oracle paths with the map
//
// This store bridges the gap between:
// - Static mock map data (string IDs like "chapter-frontend-html-basics")
// - Dynamic database nodes (UUIDs created when accepting Oracle paths)
//
// Uses Immer middleware for mutable-style updates that produce immutable state.
//
// STALE CLOSURE PREVENTION:
// - All state updates use functional form: set(state => ...)
// - Timestamps track update order to prevent out-of-order overwrites
// - shouldUpdateStatus function prevents stale data from overwriting newer updates
// ============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { NodeGenerationStatus } from "./types";

// Re-export for backward compatibility
export type { NodeGenerationStatus };

// ============================================================================
// Types
// ============================================================================

export interface DynamicMapNode {
    id: string;                    // Database UUID (map_node_id)
    pathNodeId: string;            // Original path node ID from Oracle
    name: string;
    description?: string;
    parentId: string | null;       // Parent map_node_id (UUID or null)
    parentPathNodeId?: string;     // Parent path node ID for tree building
    depth: number;                 // 0-4 hierarchy level
    nodeType: string;              // domain, topic, skill, course, lesson
    status: NodeGenerationStatus;
    progress?: number;             // Generation progress 0-100
    message?: string;              // Status message
    error?: string;                // Error message if failed
    chapterId?: string;            // Database chapter ID for navigation
    courseId?: string;             // Database course ID
    isNew: boolean;                // Was this node created (vs existing)
    isExisting: boolean;           // Was this an existing node in the map
    order: number;                 // Sort order within parent
    estimatedHours?: number;
    /** Timestamp of last update - used for conflict resolution */
    lastUpdatedAt: number;
}

export interface AcceptedPathInfo {
    id: string;
    name: string;
    description?: string;
    domain: string;
    learningPathId: string;
    batchId: string;
    estimatedWeeks?: number;
    acceptedAt: string;
}

export interface GenerationJob {
    jobId: string;
    mapNodeId: string;
    chapterId?: string;
    nodeName: string;
    status: NodeGenerationStatus;
    progress?: number;
    /** Timestamp of last update - used for conflict resolution */
    lastUpdatedAt: number;
}

// ============================================================================
// Store State
// ============================================================================

interface PathSyncState {
    // Currently accepted path
    acceptedPath: AcceptedPathInfo | null;

    // Dynamic nodes overlaid on the map (keyed by map_node_id)
    dynamicNodes: Record<string, DynamicMapNode>;

    // Generation jobs (keyed by job_id)
    generationJobs: Record<string, GenerationJob>;

    // Mapping: pathNodeId -> mapNodeId
    pathToMapNodeId: Record<string, string>;

    // Mapping: mapNodeId -> chapterId (for navigation)
    mapNodeToChapterId: Record<string, string>;

    // UI state
    isSidebarOpen: boolean;
    isPolling: boolean;
    lastPollAt: number | null;

    /**
     * Global update version - incremented on each state change
     * Used to detect stale updates in concurrent scenarios
     */
    updateVersion: number;
}

interface PathSyncActions {
    // Accept a new path from Oracle
    acceptPath: (
        path: {
            id?: string;
            name: string;
            description?: string;
            nodes?: Array<{
                id: string;
                map_node_id?: string;
                name: string;
                description?: string;
                depth: number;
                node_type: string;
                parent_id: string | null;
                order: number;
                is_existing: boolean;
                estimated_hours?: number;
            }>;
            estimated_weeks?: number;
        },
        domain: string,
        response: {
            batch_id: string;
            learning_path_id: string;
            created_nodes: Array<{
                path_node_id: string;
                map_node_id: string;
                name: string;
                depth: number;
                node_type: string;
                course_id?: string;
                chapter_id?: string;
                is_new: boolean;
            }>;
            generation_jobs: Array<{
                job_id: string;
                map_node_id: string;
                chapter_id?: string;
                node_name: string;
                status: string;
            }>;
        }
    ) => void;

    // Update generation status for a node
    updateNodeStatus: (
        mapNodeId: string,
        status: NodeGenerationStatus,
        progress?: number,
        message?: string,
        error?: string
    ) => void;

    // Update job status
    updateJobStatus: (
        jobId: string,
        status: NodeGenerationStatus,
        progress?: number
    ) => void;

    // Batch update from polling
    updateFromPoll: (
        jobs: Array<{
            id: string;
            status: string;
            progress_percent?: number;
            progress_message?: string;
            error_message?: string;
            chapter_id?: string;
        }>
    ) => void;

    // Get node by map_node_id
    getNode: (mapNodeId: string) => DynamicMapNode | undefined;

    // Get chapter ID for a map node
    getChapterId: (mapNodeId: string) => string | undefined;

    // Check if a node is from the accepted path
    isPathNode: (mapNodeId: string) => boolean;

    // Check if any nodes are still generating
    hasGeneratingNodes: () => boolean;

    // Get all generating node IDs
    getGeneratingNodeIds: () => string[];

    // UI actions
    setSidebarOpen: (open: boolean) => void;
    setPolling: (polling: boolean) => void;

    // Clear the accepted path
    clearPath: () => void;
}

type PathSyncStore = PathSyncState & PathSyncActions;

// ============================================================================
// Store Implementation
// ============================================================================

const initialState: PathSyncState = {
    acceptedPath: null,
    dynamicNodes: {},
    generationJobs: {},
    pathToMapNodeId: {},
    mapNodeToChapterId: {},
    isSidebarOpen: false,
    isPolling: false,
    lastPollAt: null,
    updateVersion: 0,
};

// ============================================================================
// Helper Functions for Stale Closure Prevention
// ============================================================================

/**
 * Status priority for conflict resolution - higher number = more progressed
 * When two updates arrive out of order, prefer the more "progressed" status
 */
const STATUS_PRIORITY: Record<NodeGenerationStatus, number> = {
    pending: 0,
    generating: 1,
    ready: 2,
    completed: 3,
    failed: 2, // Same as ready - both are terminal-ish states
};

/**
 * Determines if the new status should replace the old status
 * Prevents regression from completed -> pending due to stale data
 */
function shouldUpdateStatus(
    currentStatus: NodeGenerationStatus,
    newStatus: NodeGenerationStatus,
    currentTimestamp: number,
    newTimestamp: number
): boolean {
    // If new data is clearly newer by timestamp, accept it
    if (newTimestamp > currentTimestamp) {
        return true;
    }

    // If timestamps are close (within 100ms), use status priority
    if (Math.abs(newTimestamp - currentTimestamp) < 100) {
        return STATUS_PRIORITY[newStatus] >= STATUS_PRIORITY[currentStatus];
    }

    // Old data - don't update (stale closure scenario)
    return false;
}

export const usePathSyncStore = create<PathSyncStore>()(
    persist(
        immer((set, get) => ({
            ...initialState,

            acceptPath: (path, domain, response) => {
                const pathNodes = path.nodes || [];

                // CRITICAL: Sort created_nodes by depth to ensure parents are processed before children
                // This ensures pathToMapNodeId[parent_id] is populated when processing child nodes
                const sortedCreatedNodes = [...response.created_nodes].sort((a, b) => a.depth - b.depth);

                // Build local pathToMapNodeId first for parent lookups
                const localPathToMapNodeId: Record<string, string> = {};
                for (const created of sortedCreatedNodes) {
                    localPathToMapNodeId[created.path_node_id] = created.map_node_id;
                }

                set(state => {
                    // Reset state for new path
                    state.dynamicNodes = {};
                    state.generationJobs = {};
                    state.pathToMapNodeId = {};
                    state.mapNodeToChapterId = {};

                    // Process created nodes from response (now sorted by depth)
                    for (const created of sortedCreatedNodes) {
                        state.pathToMapNodeId[created.path_node_id] = created.map_node_id;

                        if (created.chapter_id) {
                            state.mapNodeToChapterId[created.map_node_id] = created.chapter_id;
                        }

                        // Find the original path node for full info
                        const pathNode = pathNodes.find(n => n.id === created.path_node_id);

                        // Find parent map_node_id
                        let parentMapNodeId: string | null = null;
                        if (pathNode?.parent_id) {
                            parentMapNodeId = localPathToMapNodeId[pathNode.parent_id] || null;
                        }

                        // Determine initial status
                        const hasJob = response.generation_jobs.some(
                            j => j.map_node_id === created.map_node_id
                        );

                        state.dynamicNodes[created.map_node_id] = {
                            id: created.map_node_id,
                            pathNodeId: created.path_node_id,
                            name: created.name,
                            description: pathNode?.description,
                            parentId: parentMapNodeId,
                            parentPathNodeId: pathNode?.parent_id || undefined,
                            depth: created.depth,
                            nodeType: created.node_type,
                            status: hasJob ? "pending" : "ready",
                            chapterId: created.chapter_id,
                            courseId: created.course_id,
                            isNew: created.is_new,
                            isExisting: !created.is_new,
                            order: pathNode?.order || 0,
                            estimatedHours: pathNode?.estimated_hours,
                            lastUpdatedAt: Date.now(),
                        };
                    }

                    // Process generation jobs
                    const now = Date.now();
                    for (const job of response.generation_jobs) {
                        state.generationJobs[job.job_id] = {
                            jobId: job.job_id,
                            mapNodeId: job.map_node_id,
                            chapterId: job.chapter_id,
                            nodeName: job.node_name,
                            status: job.status as NodeGenerationStatus,
                            lastUpdatedAt: now,
                        };

                        if (job.chapter_id) {
                            state.mapNodeToChapterId[job.map_node_id] = job.chapter_id;
                        }
                    }

                    state.acceptedPath = {
                        id: path.id || response.learning_path_id,
                        name: path.name,
                        description: path.description,
                        domain,
                        learningPathId: response.learning_path_id,
                        batchId: response.batch_id,
                        estimatedWeeks: path.estimated_weeks,
                        acceptedAt: new Date().toISOString(),
                    };
                    state.isSidebarOpen = true;
                    state.isPolling = Object.keys(state.generationJobs).length > 0;
                    state.updateVersion += 1;
                });
            },

            updateNodeStatus: (mapNodeId, status, progress, message, error) => {
                set(state => {
                    const node = state.dynamicNodes[mapNodeId];
                    if (!node) return;

                    const updateTimestamp = Date.now();

                    // Check if we should apply this update (stale closure prevention)
                    if (!shouldUpdateStatus(node.status, status, node.lastUpdatedAt, updateTimestamp)) {
                        return;
                    }

                    node.status = status;
                    node.progress = progress;
                    node.message = message;
                    node.error = error;
                    node.lastUpdatedAt = updateTimestamp;
                    state.updateVersion += 1;
                });
            },

            updateJobStatus: (jobId, status, progress) => {
                set(state => {
                    const job = state.generationJobs[jobId];
                    if (!job) return;

                    const updateTimestamp = Date.now();

                    // Check if we should apply this update (stale closure prevention)
                    if (!shouldUpdateStatus(job.status, status, job.lastUpdatedAt, updateTimestamp)) {
                        return;
                    }

                    // Update job
                    job.status = status;
                    job.progress = progress;
                    job.lastUpdatedAt = updateTimestamp;

                    // Also update the corresponding node
                    const node = state.dynamicNodes[job.mapNodeId];
                    if (node && shouldUpdateStatus(node.status, status, node.lastUpdatedAt, updateTimestamp)) {
                        node.status = status;
                        node.progress = progress;
                        node.lastUpdatedAt = updateTimestamp;
                    }

                    state.updateVersion += 1;
                });
            },

            updateFromPoll: (jobs) => {
                set(state => {
                    const pollTimestamp = Date.now();
                    let hasChanges = false;

                    for (const pollJob of jobs) {
                        // Find our job by ID
                        const ourJob = state.generationJobs[pollJob.id] ||
                            Object.values(state.generationJobs).find(j => j.jobId === pollJob.id);
                        if (!ourJob) continue;

                        const status = pollJob.status as NodeGenerationStatus;

                        // Check if we should apply this update (stale closure prevention)
                        if (!shouldUpdateStatus(ourJob.status, status, ourJob.lastUpdatedAt, pollTimestamp)) {
                            continue;
                        }

                        // Update job
                        ourJob.status = status;
                        ourJob.progress = pollJob.progress_percent;
                        ourJob.chapterId = pollJob.chapter_id || ourJob.chapterId;
                        ourJob.lastUpdatedAt = pollTimestamp;
                        hasChanges = true;

                        // Update chapter ID mapping
                        if (pollJob.chapter_id) {
                            state.mapNodeToChapterId[ourJob.mapNodeId] = pollJob.chapter_id;
                        }

                        // Update node
                        const node = state.dynamicNodes[ourJob.mapNodeId];
                        if (node && shouldUpdateStatus(node.status, status, node.lastUpdatedAt, pollTimestamp)) {
                            node.status = status;
                            node.progress = pollJob.progress_percent;
                            node.message = pollJob.progress_message;
                            node.error = pollJob.error_message;
                            node.chapterId = pollJob.chapter_id || node.chapterId;
                            node.lastUpdatedAt = pollTimestamp;
                        }
                    }

                    state.lastPollAt = pollTimestamp;

                    if (hasChanges) {
                        // Check if any jobs are still pending/generating
                        state.isPolling = Object.values(state.generationJobs).some(
                            j => j.status === "pending" || j.status === "generating"
                        );
                        state.updateVersion += 1;
                    }
                });
            },

            getNode: (mapNodeId) => {
                return get().dynamicNodes[mapNodeId];
            },

            getChapterId: (mapNodeId) => {
                return get().mapNodeToChapterId[mapNodeId];
            },

            isPathNode: (mapNodeId) => {
                return mapNodeId in get().dynamicNodes;
            },

            hasGeneratingNodes: () => {
                const nodes = Object.values(get().dynamicNodes);
                return nodes.some(n => n.status === "pending" || n.status === "generating");
            },

            getGeneratingNodeIds: () => {
                return Object.values(get().dynamicNodes)
                    .filter(n => n.status === "pending" || n.status === "generating")
                    .map(n => n.id);
            },

            setSidebarOpen: (open) => {
                set(state => {
                    state.isSidebarOpen = open;
                    state.updateVersion += 1;
                });
            },

            setPolling: (polling) => {
                set(state => {
                    state.isPolling = polling;
                    state.updateVersion += 1;
                });
            },

            clearPath: () => {
                set(state => {
                    Object.assign(state, initialState);
                });
            },
        })),
        {
            name: "forge-path-sync",
            partialize: (state) => ({
                // Only persist core path data, not UI state
                acceptedPath: state.acceptedPath,
                dynamicNodes: state.dynamicNodes,
                pathToMapNodeId: state.pathToMapNodeId,
                mapNodeToChapterId: state.mapNodeToChapterId,
            }),
        }
    )
);

// ============================================================================
// Selector Hooks (Re-exported from usePathSyncSelectors.ts)
// ============================================================================

export {
    useAcceptedPath,
    useDynamicNodes,
    useIsSidebarOpen,
    useIsPolling,
    useGenerationJobs,
    useSortedDynamicNodes,
    useNodesByParent,
    useOverallProgress,
} from "./usePathSyncSelectors";
