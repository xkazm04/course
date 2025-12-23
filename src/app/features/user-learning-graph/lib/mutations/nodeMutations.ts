/**
 * Node Mutation Functions
 *
 * Functions for mutating nodes and paths in the user learning graph.
 */

import type { LearningDomainId } from "@/app/shared/lib/learningDomains";
import type {
    UserLearningGraph,
    UserNodeState,
    UserPathBranch,
    UserNodeStatus,
} from "../types";
import { createNodeState, createPathBranch } from "./factories";
import { createMutation, addMutationToHistory } from "./mutationHelpers";

/**
 * Selects a learning path for the user
 */
export function selectPath(
    graph: UserLearningGraph,
    pathId: LearningDomainId,
    options: { makePrimary?: boolean; source?: string } = {}
): UserLearningGraph {
    const now = new Date().toISOString();
    const { makePrimary = true, source } = options;

    const existingPath = graph.paths[pathId];
    let updatedPaths = { ...graph.paths };

    if (existingPath) {
        updatedPaths[pathId] = {
            ...existingPath,
            isAbandoned: false,
            lastActivityAt: now,
            isPrimary: makePrimary || existingPath.isPrimary,
        };
    } else {
        updatedPaths[pathId] = createPathBranch(pathId, makePrimary);
    }

    if (makePrimary) {
        Object.keys(updatedPaths).forEach((id) => {
            if (id !== pathId && updatedPaths[id as LearningDomainId]) {
                updatedPaths[id as LearningDomainId] = {
                    ...updatedPaths[id as LearningDomainId],
                    isPrimary: false,
                };
            }
        });
    }

    const mutation = createMutation({
        type: "path_selected",
        nodeId: pathId,
        pathId,
        newState: "in_progress",
        context: { source, isExplicit: true },
    });

    return {
        ...graph,
        lastModifiedAt: now,
        paths: updatedPaths,
        mutationHistory: addMutationToHistory(graph, mutation),
    };
}

/**
 * Starts a learning node
 */
export function startNode(
    graph: UserLearningGraph,
    nodeId: string,
    options: { pathId?: LearningDomainId; source?: string; skippedPrerequisites?: string[] } = {}
): UserLearningGraph {
    const now = new Date().toISOString();
    const { pathId, source, skippedPrerequisites = [] } = options;

    const existingNode = graph.nodes[nodeId];
    const previousState = existingNode?.status ?? "not_started";

    const updatedNode: UserNodeState = existingNode
        ? {
            ...existingNode,
            status: "in_progress",
            visitCount: existingNode.visitCount + 1,
        }
        : createNodeState(nodeId, "in_progress", true);

    const mutation = createMutation(
        {
            type: "node_started",
            nodeId,
            pathId,
            newState: "in_progress",
            context: { source, isExplicit: true, skippedPrerequisites },
        },
        previousState
    );

    let updatedPaths = graph.paths;
    if (pathId && graph.paths[pathId]) {
        updatedPaths = {
            ...graph.paths,
            [pathId]: { ...graph.paths[pathId], lastActivityAt: now },
        };
    }

    return {
        ...graph,
        lastModifiedAt: now,
        nodes: { ...graph.nodes, [nodeId]: updatedNode },
        paths: updatedPaths,
        mutationHistory: addMutationToHistory(graph, mutation),
    };
}

/**
 * Completes a learning node
 */
export function completeNode(
    graph: UserLearningGraph,
    nodeId: string,
    options: { pathId?: LearningDomainId; source?: string; timeSpentMinutes?: number; confidenceLevel?: 1 | 2 | 3 | 4 | 5 } = {}
): UserLearningGraph {
    const now = new Date().toISOString();
    const { pathId, source, timeSpentMinutes, confidenceLevel } = options;

    const existingNode = graph.nodes[nodeId];
    const previousState = existingNode?.status ?? "not_started";

    const updatedNode: UserNodeState = {
        ...(existingNode ?? createNodeState(nodeId, "completed", true)),
        status: "completed",
        completedAt: now,
        progress: 100,
        timeSpentMinutes: timeSpentMinutes ?? (existingNode?.timeSpentMinutes ?? 0),
        confidenceLevel: confidenceLevel ?? existingNode?.confidenceLevel,
    };

    const mutation = createMutation(
        {
            type: "node_completed",
            nodeId,
            pathId,
            newState: "completed",
            context: { source, isExplicit: true },
        },
        previousState
    );

    let updatedPaths = graph.paths;
    if (pathId && graph.paths[pathId]) {
        const path = graph.paths[pathId];
        updatedPaths = {
            ...graph.paths,
            [pathId]: {
                ...path,
                completedNodes: path.completedNodes + 1,
                progress: path.totalNodes > 0
                    ? Math.round(((path.completedNodes + 1) / path.totalNodes) * 100)
                    : 0,
                lastActivityAt: now,
            },
        };
    }

    return {
        ...graph,
        lastModifiedAt: now,
        nodes: { ...graph.nodes, [nodeId]: updatedNode },
        paths: updatedPaths,
        mutationHistory: addMutationToHistory(graph, mutation),
    };
}

/**
 * Skips a prerequisite node
 */
export function skipNode(
    graph: UserLearningGraph,
    nodeId: string,
    options: { pathId?: LearningDomainId; source?: string } = {}
): UserLearningGraph {
    const now = new Date().toISOString();
    const { pathId, source } = options;

    const existingNode = graph.nodes[nodeId];
    const previousState = existingNode?.status ?? "not_started";

    const updatedNode: UserNodeState = {
        ...(existingNode ?? createNodeState(nodeId, "skipped", true)),
        status: "skipped",
    };

    const mutation = createMutation(
        {
            type: "node_skipped",
            nodeId,
            pathId,
            newState: "skipped",
            context: { source, isExplicit: true },
        },
        previousState
    );

    return {
        ...graph,
        lastModifiedAt: now,
        nodes: { ...graph.nodes, [nodeId]: updatedNode },
        mutationHistory: addMutationToHistory(graph, mutation),
    };
}

/**
 * Bookmarks a node for later
 */
export function bookmarkNode(
    graph: UserLearningGraph,
    nodeId: string,
    options: { pathId?: LearningDomainId; source?: string } = {}
): UserLearningGraph {
    const now = new Date().toISOString();
    const { pathId, source } = options;

    const existingNode = graph.nodes[nodeId];
    const previousState = existingNode?.status ?? "not_started";

    if (existingNode?.status === "in_progress" || existingNode?.status === "completed") {
        return graph;
    }

    const updatedNode: UserNodeState = {
        ...(existingNode ?? createNodeState(nodeId, "bookmarked", true)),
        status: "bookmarked",
    };

    const mutation = createMutation(
        {
            type: "node_bookmarked",
            nodeId,
            pathId,
            newState: "bookmarked",
            context: { source, isExplicit: true },
        },
        previousState
    );

    return {
        ...graph,
        lastModifiedAt: now,
        nodes: { ...graph.nodes, [nodeId]: updatedNode },
        mutationHistory: addMutationToHistory(graph, mutation),
    };
}

/**
 * Removes a bookmark from a node
 */
export function unbookmarkNode(
    graph: UserLearningGraph,
    nodeId: string,
    options: { source?: string } = {}
): UserLearningGraph {
    const now = new Date().toISOString();
    const { source } = options;

    const existingNode = graph.nodes[nodeId];

    if (existingNode?.status !== "bookmarked") {
        return graph;
    }

    const newStatus: UserNodeStatus = "not_started";

    const updatedNode: UserNodeState = {
        ...existingNode,
        status: newStatus,
    };

    const mutation = createMutation(
        {
            type: "node_unbookmarked",
            nodeId,
            newState: newStatus,
            context: { source, isExplicit: true },
        },
        "bookmarked"
    );

    return {
        ...graph,
        lastModifiedAt: now,
        nodes: { ...graph.nodes, [nodeId]: updatedNode },
        mutationHistory: addMutationToHistory(graph, mutation),
    };
}

/**
 * Updates node progress
 */
export function updateNodeProgress(
    graph: UserLearningGraph,
    nodeId: string,
    progress: number,
    options: { timeSpentMinutes?: number } = {}
): UserLearningGraph {
    const now = new Date().toISOString();
    const { timeSpentMinutes } = options;

    const existingNode = graph.nodes[nodeId];
    if (!existingNode) {
        return graph;
    }

    const clampedProgress = Math.max(0, Math.min(100, progress));

    if (clampedProgress === 100) {
        return completeNode(graph, nodeId, { timeSpentMinutes });
    }

    const updatedNode: UserNodeState = {
        ...existingNode,
        progress: clampedProgress,
        timeSpentMinutes: timeSpentMinutes ?? existingNode.timeSpentMinutes,
    };

    return {
        ...graph,
        lastModifiedAt: now,
        nodes: { ...graph.nodes, [nodeId]: updatedNode },
    };
}

/**
 * Abandons a learning path
 */
export function abandonPath(
    graph: UserLearningGraph,
    pathId: LearningDomainId,
    options: { source?: string } = {}
): UserLearningGraph {
    const now = new Date().toISOString();
    const { source } = options;

    const existingPath = graph.paths[pathId];
    if (!existingPath) {
        return graph;
    }

    const updatedPath: UserPathBranch = {
        ...existingPath,
        isAbandoned: true,
        isPrimary: false,
        lastActivityAt: now,
    };

    const mutation = createMutation(
        {
            type: "path_abandoned",
            nodeId: pathId,
            pathId,
            newState: "not_started",
            context: { source, isExplicit: true },
        },
        "in_progress"
    );

    return {
        ...graph,
        lastModifiedAt: now,
        paths: { ...graph.paths, [pathId]: updatedPath },
        mutationHistory: addMutationToHistory(graph, mutation),
    };
}

/**
 * Resets progress on a node
 */
export function resetNodeProgress(
    graph: UserLearningGraph,
    nodeId: string,
    options: { source?: string } = {}
): UserLearningGraph {
    const now = new Date().toISOString();
    const { source } = options;

    const existingNode = graph.nodes[nodeId];
    if (!existingNode) {
        return graph;
    }

    const previousState = existingNode.status;

    const updatedNode: UserNodeState = {
        ...existingNode,
        status: "not_started",
        progress: 0,
        completedAt: undefined,
        confidenceLevel: undefined,
    };

    const mutation = createMutation(
        {
            type: "progress_reset",
            nodeId,
            newState: "not_started",
            context: { source, isExplicit: true },
        },
        previousState
    );

    return {
        ...graph,
        lastModifiedAt: now,
        nodes: { ...graph.nodes, [nodeId]: updatedNode },
        mutationHistory: addMutationToHistory(graph, mutation),
    };
}
