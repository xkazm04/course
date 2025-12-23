/**
 * Graph Mutation Functions
 *
 * This module provides pure functions for mutating the user learning graph.
 * All mutations are tracked in history for analytics and undo capability.
 *
 * Key principles:
 * - All mutations are immutable (return new state, don't modify in place)
 * - All mutations are tracked in history
 * - Mutations can be explicit (user action) or implicit (automatic unlocks)
 */

// Re-export all mutation functions from modular files
export {
    // Factories
    createUserLearningGraph,
    createDefaultAnalytics,
    createDefaultStrategyProfile,
    createNodeState,
    createPathBranch,

    // Mutation helpers
    createMutation,
    addMutationToHistory,

    // Node mutations
    selectPath,
    startNode,
    completeNode,
    skipNode,
    bookmarkNode,
    unbookmarkNode,
    updateNodeProgress,
    abandonPath,
    resetNodeProgress,

    // Mutation queries
    queryMutations,
    aggregateMutations,

    // Analytics
    recalculateAnalytics,
    calculateDepthVsBreadth,

    // Batch operations
    batchCompleteNodes,
    batchStartNodes,
    importGraph,
} from "./mutations";
