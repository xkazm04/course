/**
 * Knowledge Map Library Exports
 */

// Types
export * from "./types";

// Learning Node Base Types - Unified curriculum DAG foundation
export {
    // Status and content types
    type LearningNodeStatus,
    type LearningContentType,
    // Base types
    type LearningNodeBase,
    type LearningNodeWithRelations,
    type LearningNodeWithDomain,
    type LearningNode,
    type LearningNodeContent,
    // Utilities
    toLearningNodeStatus,
    isCompleted,
    isAvailable,
    isLocked,
    calculateNodeProgress,
    parseDurationToMinutes,
    formatDuration,
    // Type guards
    hasNodeDomain,
    hasNodeRelations,
    isFullLearningNode,
    // Factory functions
    createLearningNodeBase,
    createLearningNodeWithRelations,
} from "./learningNode";

// Data generation
export {
    generateKnowledgeMapData,
    getNodeChildren,
    getVisibleConnections,
    getNodeById,
    getNodeAncestors,
} from "./mapData";

// Hooks
export {
    useMapNavigation,
    type UseMapNavigationOptions,
    type UseMapNavigationReturn,
} from "./useMapNavigation";

export {
    useMapViewport,
    type UseMapViewportOptions,
    type UseMapViewportReturn,
} from "./useMapViewport";

export {
    useMapLayout,
    getNodeCenter,
    getNodeConnectionPoints,
    type LayoutNode,
} from "./useMapLayout";

// Data fetching with API integration
export {
    useMapData,
    useMapNodes,
    useMapNode,
    useNodePath,
    useVisibleConnections,
    useDomainStats,
    type UseMapDataOptions,
    type UseMapDataResult,
} from "./useMapData";

// Oracle Integration
export {
    useOracleMapIntegration,
    type UseOracleMapIntegrationOptions,
    type UseOracleMapIntegrationReturn,
} from "./useOracleMapIntegration";

export {
    skillToDomainId,
    getDomainColor,
    findMatchingNodes,
    mapModuleToHypotheticalNode,
    mapPathToHypotheticalNodes,
    mapPathToConnections,
    calculateHypotheticalPositions,
    formatModuleDuration,
    getSkillDemandIndicator,
    hasPrerequisites,
    formatPrerequisites,
} from "./oracleNodeMapping";
