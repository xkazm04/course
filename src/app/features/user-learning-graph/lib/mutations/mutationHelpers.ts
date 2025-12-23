/**
 * Mutation Helper Functions
 *
 * Helper functions for creating and managing mutations.
 */

import { generateId } from "@/app/shared/lib/storageFactory";
import type {
    UserLearningGraph,
    GraphMutation,
    CreateMutationInput,
    UserNodeStatus,
} from "../types";

/**
 * Creates a new graph mutation record
 */
export function createMutation(
    input: CreateMutationInput,
    previousState?: UserNodeStatus
): GraphMutation {
    return {
        id: generateId(),
        type: input.type,
        nodeId: input.nodeId,
        pathId: input.pathId,
        timestamp: new Date().toISOString(),
        previousState,
        newState: input.newState,
        context: input.context,
    };
}

/**
 * Adds a mutation to the graph history, respecting max size
 */
export function addMutationToHistory(
    graph: UserLearningGraph,
    mutation: GraphMutation
): GraphMutation[] {
    const maxSize = graph.preferences.maxHistorySize;
    const newHistory = [...graph.mutationHistory, mutation];

    // Trim history if it exceeds max size
    if (newHistory.length > maxSize) {
        return newHistory.slice(newHistory.length - maxSize);
    }

    return newHistory;
}
