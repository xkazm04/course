/**
 * Knowledge Universe Feature
 *
 * A zoomable universe metaphor visualization for the course curriculum.
 * Users can explore the learning graph as a cosmic journey from galaxy view
 * (all domains) down to individual star systems (lessons).
 *
 * Key features:
 * - Solar system view: Domains as planets
 * - Constellation view: Chapters as star clusters
 * - Star system view: Lessons as individual stars
 * - 60fps canvas rendering with spatial indexing
 * - Smooth zoom and pan transitions
 */

// Components
export {
    KnowledgeUniverse,
    KnowledgeUniversePreview,
    UniverseCanvas,
    NodeTooltip,
    UniverseControls,
    ZoomLevelIndicator,
    NavigationBreadcrumb,
    StatsDisplay,
} from "./components";

// Library
export {
    // Types
    type ZoomLevel,
    type ZoomLevelConfig,
    type UniverseNodeBase,
    type PlanetNode,
    type MoonNode,
    type StarNode,
    type UniverseNode,
    type UniverseConnection,
    type CameraState,
    type ViewportState,
    type InteractionState,
    type AnimationState,
    ZOOM_LEVEL_CONFIGS,

    // Data
    generateUniverseData,
    getVisibleNodesForZoom,
    getNodesInViewport,
    findNodeAtPosition,
    type UniverseData,

    // Spatial indexing
    SpatialIndex,
    calculateVisibleBounds,
    isNodeVisible,
    sortNodesByDepth,

    // Camera
    useUniverseCamera,
    getZoomLevelFromScale,
    getScaleForZoomLevel,
} from "./lib";
