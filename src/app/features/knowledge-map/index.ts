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
export { useMapNavigation } from "./lib/useMapNavigation";
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
} from "./lib/oracleNodeMapping";

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
