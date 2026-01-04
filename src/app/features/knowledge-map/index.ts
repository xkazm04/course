/**
 * Knowledge Map Feature
 *
 * A drill-down knowledge map for navigating the curriculum hierarchy.
 *
 * Features:
 * - 5-level hierarchy: Domain -> Course -> Chapter -> Section -> Concept
 * - Click to drill down, breadcrumb to navigate back
 * - Card-based nodes with status indicators
 * - Smooth pan/zoom within each level
 * - Search functionality
 * - Dark mode support
 * - Reduced motion support
 */

// Main components
export { KnowledgeMap } from "./KnowledgeMap";
export { KnowledgeMapWithOracle } from "./KnowledgeMapWithOracle";
export { default } from "./KnowledgeMap";

// Core sub-components
export {
    MapNode,
    MapCanvas,
    MapConnections,
    MapBreadcrumb,
    MapControls,
    MapLegend,
    NodeDetailsPanel,
} from "./components";

// Oracle integration components
export {
    HypotheticalNode,
    RecommendedNodeGlow,
    OracleBottomPanel,
    OracleCollapsedBar,
    OracleExpandedWizard,
    OracleStepIndicator,
    PathPreviewSidebar,
    PathModuleCard,
    PathMilestoneMarker,
    PathEffectivenessScore,
} from "./components";

// Types - Note: MapNode type renamed to MapNodeData to avoid conflict with MapNode component
export type {
    NodeLevel,
    NodeStatus,
    MapNode as MapNodeData,
    DomainNode,
    CourseNode,
    ChapterNode,
    SectionNode,
    ConceptNode,
    MapConnection,
    ConnectionType,
    NavigationState,
    BreadcrumbItem,
    ViewportState,
    Point,
    KnowledgeMapData,
    KnowledgeMapProps,
    LevelLayoutConfig,
    StatusConfig,
    DifficultyLevel,
    SectionType,
    ConceptType,
} from "./lib/types";

// Type utilities
export {
    isDomainNode,
    isCourseNode,
    isChapterNode,
    isSectionNode,
    isConceptNode,
    getNextLevel,
    getPreviousLevel,
    getLevelDepth,
    getLevelLabel,
    getChildCountLabel,
    LAYOUT_CONFIG,
    STATUS_CONFIG,
} from "./lib/types";

// Hooks
// Unified SceneGraph - the recommended hook for navigation + viewport
export { useSceneGraph } from "./lib/useSceneGraph";
export type {
    SceneGraphState,
    SceneTransitionType,
    SceneTransitionConfig,
    UseSceneGraphOptions,
    UseSceneGraphReturn,
} from "./lib/useSceneGraph";
export { TRANSITION_CONFIGS } from "./lib/useSceneGraph";

// Legacy hooks (deprecated - use useSceneGraph instead)
/** @deprecated Use useSceneGraph for unified navigation + viewport state */
export { useMapNavigation } from "./lib/useMapNavigation";
/** @deprecated Use useSceneGraph for unified navigation + viewport state */
export { useMapViewport } from "./lib/useMapViewport";

export { useMapLayout } from "./lib/useMapLayout";
export { useOracleMapIntegration } from "./lib/useOracleMapIntegration";
export type { UseOracleMapIntegrationOptions, UseOracleMapIntegrationReturn } from "./lib/useOracleMapIntegration";

// Data utilities
export { generateKnowledgeMapData, getNodeChildren, getVisibleConnections } from "./lib/mapData";

// Oracle mapping utilities
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
    // Unified CurriculumEntity mapping functions
    moduleToCurriculumEntity,
    modulesToCurriculumEntities,
    curriculumEntityToHypotheticalNode,
    hypotheticalNodeToCurriculumEntity,
    mapNodeToCurriculumEntity,
} from "./lib/oracleNodeMapping";

// Path effectiveness utilities
export {
    calculatePathEffectiveness,
    getTierColor,
    getTierLabel,
} from "./lib/pathEffectiveness";

export type {
    PathEffectivenessScore as PathEffectivenessScoreData,
    EffectivenessFactor,
} from "./lib/pathEffectiveness";

// Oracle types
export type {
    NodeVisualMode,
    NodeVisualModeConfig,
    HypotheticalMapNode,
    RecommendedPathConnection,
    OracleWizardStep,
    OracleMapIntegrationState,
} from "./lib/types";

export { NODE_VISUAL_MODE_CONFIG, INITIAL_ORACLE_MAP_STATE } from "./lib/types";

// ============================================================================
// UNIFIED CURRICULUM ENTITY TYPES
// ============================================================================

// CurriculumEntity - the unified type for all learnable units
export type {
    MaterializationStatus,
    CurriculumEntityBase,
    CurriculumEntityWithMap,
    CurriculumEntityWithOracle,
    CurriculumEntity,
} from "./lib/curriculumEntity";

// CurriculumEntity utilities
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
} from "./lib/curriculumEntity";

// CurriculumEntity components
export { CurriculumEntityCard } from "./components/PathPreviewSidebar";
