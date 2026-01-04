/**
 * Knowledge Universe Library
 *
 * Export all utility functions, hooks, and types for the knowledge universe feature.
 */

// Types
export * from "./types";

// Data generation
export {
    generateUniverseData,
    getVisibleNodesForZoom,
    getNodesInViewport,
    findNodeAtPosition,
    type UniverseData,
} from "./universeData";

// Spatial indexing (legacy - prefer WorldCoordinator)
export {
    SpatialIndex,
    calculateVisibleBounds,
    isNodeVisible,
    sortNodesByDepth,
} from "./spatialIndex";

// Camera hook (legacy - prefer useWorldCoordinator)
export {
    useUniverseCamera,
    getZoomLevelFromScale,
    getScaleForZoomLevel,
    type UseUniverseCameraOptions,
    type UseUniverseCameraReturn,
} from "./useUniverseCamera";

// World Coordinator - Unified camera + spatial system
export {
    WorldCoordinator,
    createWorldCoordinator,
    type WorldCoordinatorConfig,
    type VisibleBounds,
} from "./worldCoordinator";

// World Coordinator hook
export {
    useWorldCoordinator,
    type UseWorldCoordinatorOptions,
    type UseWorldCoordinatorReturn,
} from "./useWorldCoordinator";

// Node reveal animation hook
export {
    useNodeRevealAnimation,
    type NodeRevealState,
    type UseNodeRevealAnimationOptions,
    type UseNodeRevealAnimationReturn,
} from "./useNodeRevealAnimation";

// Node type registry
export {
    NodeTypeRegistry,
    // Types
    type NodeRenderContext,
    type VisibilityRule,
    type RenderStrategy,
    type InteractionBehavior,
    type NodeTypeDefinition,
    // Built-in visibility rules
    minRadiusRule,
    zoomLevelRule,
    // Built-in render strategies
    orbitalRingsStrategy,
    completionIndicatorStrategy,
    asteroidBeltStrategy,
    cometTailStrategy,
    timeLimitedPulseStrategy,
} from "./nodeTypeRegistry";

// ============================================================================
// SEMANTIC ZOOM - Progressive Disclosure Pattern
// ============================================================================

// Semantic Zoom Controller - First-class progressive disclosure system
export {
    SemanticZoomController,
    createSemanticZoomController,
    // Fetch strategies per zoom level
    ZOOM_LEVEL_FETCH_STRATEGIES,
    // Interaction affordances per zoom level
    ZOOM_LEVEL_INTERACTIONS,
    // Types
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
} from "./semanticZoomController";

// Semantic Zoom Hook - React integration
export {
    useSemanticZoom,
    type UseSemanticZoomOptions,
    type UseSemanticZoomReturn,
} from "./useSemanticZoom";

// ============================================================================
// UNIFIED DATA LAYER - Source-agnostic curriculum data
// ============================================================================

// Curriculum Graph - Canonical domain model
export {
    // Types
    type CurriculumNodeBase,
    type CurriculumDomainNode,
    type CurriculumTopicNode,
    type CurriculumSkillNode,
    type CurriculumGraphNode,
    type CurriculumConnectionType,
    type CurriculumConnection,
    type CurriculumDataSource,
    type CurriculumGraph,
    type CurriculumGraphMetadata,
    // Accessors
    getAllNodes,
    getNodeById,
    getChildNodes,
    getParentNode,
    getNodeConnections,
    getPrerequisites,
    arePrerequisitesMet,
    // Type guards
    isDomainNode,
    isTopicNode,
    isSkillNode,
    // Factory
    createEmptyCurriculumGraph,
} from "./curriculumGraph";

// Curriculum Adapters - Transform various sources to CurriculumGraph
export {
    type CurriculumAdapter,
    type MockDataInput,
    type SupabaseMapNode,
    type SupabaseMapConnection,
    type SupabaseDataInput,
    type AdapterType,
    mockDataAdapter,
    supabaseDataAdapter,
    adapterRegistry,
} from "./curriculumAdapters";

// Universe Layout Strategies - Configurable transformation logic
export {
    type UniverseLayoutConfig,
    type PositioningStrategy,
    DEFAULT_LAYOUT_CONFIG,
    DOMAIN_COLORS,
    CONTENT_TYPE_COLORS,
    DIFFICULTY_COLORS,
    getDomainColors,
    getSkillColor,
    orbitalPositioningStrategy,
    gridPositioningStrategy,
    transformCurriculumToUniverse,
} from "./universeLayoutStrategies";

// Universe Data Provider - Unified data access
export {
    type UniverseDataSourceType,
    type LayoutStrategyType,
    type UniverseDataProviderConfig,
    type UniverseDataProviderState,
    useUniverseDataProvider,
    createMockUniverseData,
    createUniverseDataFromGraph,
} from "./universeDataProvider";
