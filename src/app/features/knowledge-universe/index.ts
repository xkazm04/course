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
 *
 * SEMANTIC ZOOM (Progressive Disclosure):
 * The zoom levels are not just visual scales—they represent progressive
 * information disclosure. The SemanticZoomController manages:
 * - Data fetching granularity (lazy-load lesson details only at star level)
 * - Interaction affordances (hover shows different info per level)
 * - Learning context ("you are here" breadcrumbs)
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
    // Semantic Zoom UI Components
    SemanticTooltip,
    MiniTooltip,
    SemanticBreadcrumb,
    LearningContextDisplay,
    CompactBreadcrumb,
    PositionIndicator,
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

    // Semantic Zoom (Progressive Disclosure)
    SemanticZoomController,
    createSemanticZoomController,
    useSemanticZoom,
    ZOOM_LEVEL_FETCH_STRATEGIES,
    ZOOM_LEVEL_INTERACTIONS,
    type SemanticZoomControllerConfig,
    type SemanticZoomState,
    type NodeDetailData,
    type FetchState,
    type ZoomLevelFetchStrategy,
    type ZoomLevelInteraction,
    type TooltipInfo,
    type KeyboardShortcut,
    type BreadcrumbItem,
    type LearningContext,
    type UseSemanticZoomOptions,
    type UseSemanticZoomReturn,
} from "./lib";
