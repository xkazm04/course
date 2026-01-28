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
 *
 * HIERARCHICAL CLUSTERING (LOD):
 * For handling 1000+ nodes efficiently, the ClusteredKnowledgeUniverse
 * uses Level-of-Detail (LOD) rendering with hierarchical clusters:
 * - Galaxy clusters: Aggregated domains (scale < 0.15)
 * - Domain clusters: Single domains with metrics (scale < 0.25)
 * - Topic clusters: Aggregated skills/lessons (scale < 0.5)
 * - Full detail: Individual nodes (scale >= 0.7)
 */

// Components
export {
    KnowledgeUniverse,
    KnowledgeUniversePreview,
    ClusteredKnowledgeUniverse, // NEW: LOD-enabled version for 1000+ nodes
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

    // Hierarchical Clustering (LOD)
    generateClusteredData,
    getNodesForScale,
    getLODLevel,
    getLODTransitionState,
    getClusterExpansionPositions,
    interpolateExpansionPosition,
    useLODCoordinator,
    getNodeOpacity,
    shouldShowExpansionAffordance,
    type ClusterNode,
    type ClusterLevel,
    type ClusterMetrics,
    type LODConfig,
    DEFAULT_LOD_CONFIG,
    type ClusteredUniverseData,
    type ClusteringOptions,
    type LODTransitionState,
    type LODCoordinatorState,
    type LODCoordinatorOptions,
    type LODCoordinatorResult,

    // Cluster rendering strategies
    nebulaClusterStrategy,
    clusterMetricsStrategy,
    clusterDiveAffordanceStrategy,
    clusterExpansionStrategy,
} from "./lib";
