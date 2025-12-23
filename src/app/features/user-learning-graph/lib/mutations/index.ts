/**
 * Mutations Module Exports
 *
 * Barrel file for graph mutation functions.
 */

// Factories
export {
    createUserLearningGraph,
    createDefaultAnalytics,
    createDefaultStrategyProfile,
    createNodeState,
    createPathBranch,
} from "./factories";

// Mutation helpers
export { createMutation, addMutationToHistory } from "./mutationHelpers";

// Node mutations
export {
    selectPath,
    startNode,
    completeNode,
    skipNode,
    bookmarkNode,
    unbookmarkNode,
    updateNodeProgress,
    abandonPath,
    resetNodeProgress,
} from "./nodeMutations";

// Mutation queries
export { queryMutations, aggregateMutations } from "./mutationQueries";

// Analytics
export { recalculateAnalytics, calculateDepthVsBreadth } from "./analyticsRecalculation";

// Batch operations
export { batchCompleteNodes, batchStartNodes, importGraph } from "./batchOperations";
