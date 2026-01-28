/**
 * Knowledge Map Library Exports
 */

// Types
export * from "./types";

// Unified Curriculum Entity Types
export type {
    MaterializationStatus,
    CurriculumEntityBase,
    CurriculumEntityWithMap,
    CurriculumEntityWithOracle,
    CurriculumEntity,
} from "./curriculumEntity";

export {
    isProposed,
    isMaterialized,
    isForging,
    hasOracleProperties,
    hasMapProperties,
    isFullCurriculumEntity,
    createProposedEntity,
    createMaterializedEntity,
    createFullEntity,
    addMapProperties,
    addOracleProperties,
    startForging,
    materialize,
} from "./curriculumEntity";

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

// Unified Scene Graph - combines navigation and viewport
export {
    useSceneGraph,
    type SceneGraphState,
    type SceneTransitionType,
    type SceneTransitionConfig,
    type UseSceneGraphOptions,
    type UseSceneGraphReturn,
    TRANSITION_CONFIGS,
} from "./useSceneGraph";

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
    // Unified CurriculumEntity mapping functions
    moduleToCurriculumEntity,
    modulesToCurriculumEntities,
    curriculumEntityToHypotheticalNode,
    hypotheticalNodeToCurriculumEntity,
    mapNodeToCurriculumEntity,
} from "./oracleNodeMapping";

// Similarity Calculator - Node relationship computation
export {
    SimilarityCalculator,
    createSimilarityCalculator,
    type SimilarityScore,
    type SimilarNode,
    type PrerequisiteGap,
    type NodeRelationship,
    type SimilarityWeights,
} from "./similarityCalculator";

// Path Analyzer - Learning path analysis
export {
    PathAnalyzer,
    createPathAnalyzer,
    type PathSegment,
    type PathSuggestion,
    type HiddenGem,
    type NodePathData,
    type LearnerJourney,
} from "./pathAnalyzer";

// Recommendation Engine - Smart suggestions
export {
    RecommendationEngine,
    createRecommendationEngine,
    type Recommendation,
    type RecommendationType,
    type RecommendationBatch,
    type RecommendationOptions,
    type RecommendationMetadata,
    type PrerequisiteWarning,
    type LearnerProfile,
    type RecommendationEngineContextValue,
} from "./recommendationEngine";

// Path History Manager - Navigation history tracking
export {
    PathHistoryManager,
    createPathHistoryManager,
    getPathHistoryManager,
    usePathHistory,
    type HistoryEntry,
    type PathHistoryState,
    type PathHistoryConfig,
} from "./pathHistoryManager";

// Scene Graph with History - Extended scene graph with navigation history
export {
    useSceneGraphWithHistory,
    getKeyboardShortcuts,
    type UseSceneGraphWithHistoryOptions,
    type UseSceneGraphWithHistoryReturn,
} from "./useSceneGraphWithHistory";
