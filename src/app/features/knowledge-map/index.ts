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

// Main component
export { KnowledgeMap } from "./KnowledgeMap";
export { default } from "./KnowledgeMap";

// Sub-components
export {
    MapNode,
    MapCanvas,
    MapConnections,
    MapBreadcrumb,
    MapControls,
    MapLegend,
    NodeDetailsPanel,
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

// Data utilities
export { generateKnowledgeMapData, getNodeChildren, getVisibleConnections } from "./lib/mapData";
