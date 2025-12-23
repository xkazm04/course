/**
 * Learning Path Spatial Graph
 *
 * This module elevates position and connection data from component-local constants
 * to a first-class spatial data model. The graph structure describes how knowledge
 * domains relate to each other semantically.
 *
 * Different visualizations can render this same underlying structure:
 * - Knowledge Map (VariantD): Renders as spatial 2D layout with connections
 * - Split View (VariantB): Renders as hierarchical list with dependencies
 * - Roadmap: Renders as timeline/progression view
 *
 * MODULAR STRUCTURE:
 * - types: Core type definitions
 * - constants: Static graph data and pre-computed lookup maps
 * - accessors: Node and edge accessor functions
 * - visualization: Rendering helpers for different visual formats
 * - progression: Unified progression coordinate system accessors
 * - curriculum: Extended multi-level curriculum graph types
 */

// Types
export type {
    SpatialPosition,
    HierarchyLevel,
    TimelinePhase,
    RelationshipType,
    GraphNode,
    GraphEdge,
    LearningPathGraph,
} from "./types";

// Re-export LearningDomainId from learningDomains for convenience
export type { LearningDomainId } from "../learningDomains";

// Constants
export {
    GRAPH_NODES,
    GRAPH_EDGES,
    LEARNING_PATH_GRAPH,
    PHASE_LABELS,
    HIERARCHY_LABELS,
    nodeById,
    edgesBySource,
    edgesByTarget,
} from "./constants";

// Accessors
export {
    getGraphNode,
    getNodesByHierarchy,
    getNodesByPhase,
    getNodesSortedByHierarchy,
    getEntryPoints,
    getOutgoingEdges,
    getIncomingEdges,
    getConnectedNodes,
    getPrerequisites,
    getDependents,
    areConnected,
    getRelationship,
} from "./accessors";

// Visualization helpers
export {
    getPositionMap,
    positionMap,
    getConnectionsForRendering,
    getNodesGroupedByHierarchy,
    getNodesGroupedByPhase,
    getNodesGroupedByHierarchyMemoized,
    getNodesGroupedByPhaseMemoized,
    getConnectionsForRenderingMemoized,
} from "./visualization";
export type { RenderableConnection } from "./visualization";

// Progression accessors
export {
    getNodesSortedByProgression,
    getNodesGroupedByProgression,
    getNodeProgressionLabel,
    getNodeProgressionMeta,
    getNodeYPositionFromProgression,
    getNodeOrbitalRadius,
    getNodeProgressionCoordinate,
    getNodeBreadthLabel,
    getNodeCoordinateLabel,
    getNodeCoordinateZone,
    getNodesSortedByCoordinate,
    getNodesGroupedByCoordinate,
    getNodesByZone,
    isNodeOnCriticalPath,
    isNodeElective,
} from "./progression";

// Curriculum graph types and functions
export type {
    CurriculumNodeType,
    DomainCurriculumNode,
    ChapterCurriculumNode,
    SectionCurriculumNode,
    CurriculumNode,
    CurriculumEdge,
    UnifiedCurriculumGraph,
} from "./curriculum";

export {
    getDomainName,
    graphNodeToCurriculumNode,
    graphEdgeToCurriculumEdge,
    createUnifiedCurriculumGraph,
    getCurriculumNodesByType,
    getCurriculumNode,
    getCurriculumEdgesFor,
    getCurriculumPrerequisites,
    areCurriculumPrerequisitesMet,
    getSuggestedNextNodes,
    getChaptersForDomain,
    isDomainNode,
    isChapterNode,
    isSectionNode,
} from "./curriculum";

// Re-export progression coordinate utilities for convenience
export {
    type ProgressionLevel,
    type ProgressionPhase,
    type ProgressionBreadth,
    type ProgressionCoordinate,
    type CoordinateZone,
    PROGRESSION_LEVELS,
    PROGRESSION_BREADTHS,
    getProgressionLabel,
    getProgressionMeta,
    getBreadthLabel,
    getBreadthMeta,
    getCoordinateLabel,
    getCoordinateMeta,
    progressionToYPosition,
    progressionToOrbitalRadius,
    sortByProgression,
    groupByProgression,
    sortByProgressionCoordinate,
    groupByCoordinate,
    peerCountToBreadth,
    getCoordinateZone,
} from "../progressionCoordinate";
