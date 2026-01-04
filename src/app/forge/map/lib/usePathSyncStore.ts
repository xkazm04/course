// ============================================================================
// Path Sync Store - Zustand store for syncing Oracle paths with the map
//
// This store bridges the gap between:
// - Static mock map data (string IDs like "chapter-frontend-html-basics")
// - Dynamic database nodes (UUIDs created when accepting Oracle paths)
// ============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export type NodeGenerationStatus = "pending" | "generating" | "ready" | "completed" | "failed";

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
};

export const usePathSyncStore = create<PathSyncStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            acceptPath: (path, domain, response) => {
                const dynamicNodes: Record<string, DynamicMapNode> = {};
                const pathToMapNodeId: Record<string, string> = {};
                const mapNodeToChapterId: Record<string, string> = {};
                const generationJobs: Record<string, GenerationJob> = {};

                const pathNodes = path.nodes || [];

                // CRITICAL: Sort created_nodes by depth to ensure parents are processed before children
                // This ensures pathToMapNodeId[parent_id] is populated when processing child nodes
                const sortedCreatedNodes = [...response.created_nodes].sort((a, b) => a.depth - b.depth);

                // Process created nodes from response (now sorted by depth)
                for (const created of sortedCreatedNodes) {
                    pathToMapNodeId[created.path_node_id] = created.map_node_id;

                    if (created.chapter_id) {
                        mapNodeToChapterId[created.map_node_id] = created.chapter_id;
                    }

                    // Find the original path node for full info
                    const pathNode = pathNodes.find(n => n.id === created.path_node_id);

                    // Find parent map_node_id
                    let parentMapNodeId: string | null = null;
                    if (pathNode?.parent_id) {
                        parentMapNodeId = pathToMapNodeId[pathNode.parent_id] || null;
                    }

                    // Determine initial status
                    const hasJob = response.generation_jobs.some(
                        j => j.map_node_id === created.map_node_id
                    );

                    dynamicNodes[created.map_node_id] = {
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
                    };
                }

                // Process generation jobs
                for (const job of response.generation_jobs) {
                    generationJobs[job.job_id] = {
                        jobId: job.job_id,
                        mapNodeId: job.map_node_id,
                        chapterId: job.chapter_id,
                        nodeName: job.node_name,
                        status: job.status as NodeGenerationStatus,
                    };

                    if (job.chapter_id) {
                        mapNodeToChapterId[job.map_node_id] = job.chapter_id;
                    }
                }

                set({
                    acceptedPath: {
                        id: path.id || response.learning_path_id,
                        name: path.name,
                        description: path.description,
                        domain,
                        learningPathId: response.learning_path_id,
                        batchId: response.batch_id,
                        estimatedWeeks: path.estimated_weeks,
                        acceptedAt: new Date().toISOString(),
                    },
                    dynamicNodes,
                    generationJobs,
                    pathToMapNodeId,
                    mapNodeToChapterId,
                    isSidebarOpen: true,
                    isPolling: Object.keys(generationJobs).length > 0,
                });
            },

            updateNodeStatus: (mapNodeId, status, progress, message, error) => {
                set(state => {
                    const node = state.dynamicNodes[mapNodeId];
                    if (!node) return state;

                    return {
                        dynamicNodes: {
                            ...state.dynamicNodes,
                            [mapNodeId]: {
                                ...node,
                                status,
                                progress,
                                message,
                                error,
                            },
                        },
                    };
                });
            },

            updateJobStatus: (jobId, status, progress) => {
                set(state => {
                    const job = state.generationJobs[jobId];
                    if (!job) return state;

                    const updatedJobs = {
                        ...state.generationJobs,
                        [jobId]: { ...job, status, progress },
                    };

                    // Also update the corresponding node
                    const node = state.dynamicNodes[job.mapNodeId];
                    const updatedNodes = node
                        ? {
                            ...state.dynamicNodes,
                            [job.mapNodeId]: { ...node, status, progress },
                        }
                        : state.dynamicNodes;

                    return {
                        generationJobs: updatedJobs,
                        dynamicNodes: updatedNodes,
                    };
                });
            },

            updateFromPoll: (jobs) => {
                set(state => {
                    const updatedJobs = { ...state.generationJobs };
                    const updatedNodes = { ...state.dynamicNodes };
                    const updatedChapterMap = { ...state.mapNodeToChapterId };

                    for (const pollJob of jobs) {
                        // Find our job by ID
                        const ourJob = Object.values(state.generationJobs).find(
                            j => j.jobId === pollJob.id
                        );
                        if (!ourJob) continue;

                        const status = pollJob.status as NodeGenerationStatus;

                        // Update job
                        updatedJobs[ourJob.jobId] = {
                            ...ourJob,
                            status,
                            progress: pollJob.progress_percent,
                            chapterId: pollJob.chapter_id || ourJob.chapterId,
                        };

                        // Update chapter ID mapping
                        if (pollJob.chapter_id) {
                            updatedChapterMap[ourJob.mapNodeId] = pollJob.chapter_id;
                        }

                        // Update node
                        const node = updatedNodes[ourJob.mapNodeId];
                        if (node) {
                            updatedNodes[ourJob.mapNodeId] = {
                                ...node,
                                status,
                                progress: pollJob.progress_percent,
                                message: pollJob.progress_message,
                                error: pollJob.error_message,
                                chapterId: pollJob.chapter_id || node.chapterId,
                            };
                        }
                    }

                    // Check if any jobs are still pending/generating
                    const stillGenerating = Object.values(updatedJobs).some(
                        j => j.status === "pending" || j.status === "generating"
                    );

                    return {
                        generationJobs: updatedJobs,
                        dynamicNodes: updatedNodes,
                        mapNodeToChapterId: updatedChapterMap,
                        isPolling: stillGenerating,
                        lastPollAt: Date.now(),
                    };
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
                set({ isSidebarOpen: open });
            },

            setPolling: (polling) => {
                set({ isPolling: polling });
            },

            clearPath: () => {
                set(initialState);
            },
        }),
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
// Selector Hooks for common patterns
// ============================================================================

export const useAcceptedPath = () => usePathSyncStore(state => state.acceptedPath);
export const useDynamicNodes = () => usePathSyncStore(state => state.dynamicNodes);
export const useIsSidebarOpen = () => usePathSyncStore(state => state.isSidebarOpen);
export const useIsPolling = () => usePathSyncStore(state => state.isPolling);
export const useGenerationJobs = () => usePathSyncStore(state => state.generationJobs);

// Get nodes as array sorted by depth then order
export const useSortedDynamicNodes = () => {
    const nodes = usePathSyncStore(state => state.dynamicNodes);
    return Object.values(nodes).sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        return a.order - b.order;
    });
};

// Get nodes grouped by parent
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

// Get overall progress
export const useOverallProgress = () => {
    const jobs = usePathSyncStore(state => state.generationJobs);
    const jobArray = Object.values(jobs);
    if (jobArray.length === 0) return 100;

    const completed = jobArray.filter(j => j.status === "ready" || j.status === "completed").length;
    return Math.round((completed / jobArray.length) * 100);
};
