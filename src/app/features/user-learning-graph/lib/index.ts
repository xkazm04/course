/**
 * User Learning Graph Library
 *
 * Exports all types, utilities, and storage functions for the user learning graph feature.
 */

// Types
export type {
    UserNodeStatus,
    GraphMutationType,
    GraphMutation,
    UserNodeState,
    UserPathBranch,
    LearningStrategyProfile,
    UserLearningAnalytics,
    UserLearningGraph,
    CreateMutationInput,
    MutationQueryOptions,
    MutationAggregation,
    PathRecommendation,
    NodeSuggestion,
    UserLearningGraphExport,
} from "./types";

// Mutation functions
export {
    createUserLearningGraph,
    selectPath,
    startNode,
    completeNode,
    skipNode,
    bookmarkNode,
    unbookmarkNode,
    updateNodeProgress,
    abandonPath,
    resetNodeProgress,
    queryMutations,
    aggregateMutations,
    recalculateAnalytics,
    batchCompleteNodes,
    batchStartNodes,
    importGraph,
} from "./graphMutations";

// Storage functions
export {
    getUserLearningGraph,
    saveUserLearningGraph,
    updateUserLearningGraph,
    clearUserLearningGraph,
    hasUserLearningGraph,
    getStorageKey,
    exportUserLearningGraph,
    importUserLearningGraph,
    downloadUserLearningGraph,
    getMutationPatterns,
    getRecentMutations,
    getNodeMutations,
    getPathMutations,
    getGraphHash,
    getLastModified,
    needsSync,
} from "./graphStorage";

// Context and hooks
export {
    UserLearningGraphProvider,
    useUserLearningGraph,
    useNodeStatus,
    usePathStatus,
} from "./UserLearningGraphContext";
