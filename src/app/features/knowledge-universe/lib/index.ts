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
    type LabelConfig,
    // Built-in visibility rules
    minRadiusRule,
    zoomLevelRule,
    // Built-in render strategies
    orbitalRingsStrategy,
    completionIndicatorStrategy,
    asteroidBeltStrategy,
    cometTailStrategy,
    timeLimitedPulseStrategy,
    // Label rendering
    nodeLabelStrategy,
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

// ============================================================================
// HIERARCHICAL CLUSTERING - LOD (Level-of-Detail) System
// ============================================================================

// Clustering Strategy - Hierarchical node aggregation
export {
    generateClusteredData,
    getNodesForScale,
    getLODLevel,
    getLODTransitionState,
    getClusterExpansionPositions,
    interpolateExpansionPosition,
    type ClusteredUniverseData,
    type ClusteringOptions,
    type LODTransitionState,
} from "./clusteringStrategy";

// LOD Coordinator - Integration with WorldCoordinator
export {
    useLODCoordinator,
    getNodeOpacity,
    shouldShowExpansionAffordance,
    type LODCoordinatorState,
    type LODCoordinatorOptions,
    type LODCoordinatorResult,
} from "./useLODCoordinator";

// ============================================================================
// SEMANTIC ZOOM - 4-Tier Progressive Disclosure System
// ============================================================================

// Zoom Level Manager - Tracks semantic zoom levels
export {
    ZoomLevelManager,
    createZoomLevelManager,
    getSemanticLevel,
    zoomLevelToSemanticId,
    semanticIdToZoomLevel,
    getInterLevelInterpolation,
    SEMANTIC_LEVELS,
    type SemanticLevel,
    type DetailCategory,
    type LabelVisibility,
    type ClusterBehavior,
    type ZoomLevelTransition,
    type ZoomLevelManagerState,
} from "./zoomLevelManager";

// Level Transitioner - Smooth animated transitions
export {
    LevelTransitioner,
    createLevelTransitioner,
    easings,
    calculateZoomDuration,
    calculatePanDuration,
    interpolate,
    interpolateColor,
    DEFAULT_TRANSITION_CONFIG,
    type EasingFunction,
    type TransitionConfig,
    type ActiveTransition,
    type TransitionState,
    type NodeTransitionState,
    type MomentumState,
} from "./levelTransitioner";

// Cluster Aggregator - Node grouping at far zoom
export {
    ClusterAggregator,
    createClusterAggregator,
    calculateClutterReduction,
    calculateOptimalCellSize,
    DEFAULT_CLUSTER_CONFIG,
    type ClusterAggregatorConfig,
    type ClusterResult,
} from "./clusterAggregator";

// Contextual Labels - Zoom-dependent label visibility
export {
    ContextualLabelRenderer,
    createContextualLabelRenderer,
    drawLabel,
    measureText,
    DEFAULT_LABEL_CONFIGS,
    type LabelConfig as ContextualLabelConfig,
    type ComputedLabel,
    type LabelBounds,
    type LabelPriority,
} from "./contextualLabels";

// Cluster node rendering strategies (from nodeTypeRegistry)
export {
    nebulaClusterStrategy,
    clusterMetricsStrategy,
    clusterDiveAffordanceStrategy,
    clusterExpansionStrategy,
} from "./nodeTypeRegistry";

// ============================================================================
// TERRITORY MAP - Google Maps-inspired visualization
// ============================================================================

// Territory Types
export type {
    TerritoryNode,
    TerritoryLevel,
    TerritoryMetrics,
    TerritoryNodeData,
    TerritoryLayoutConfig,
    TerritoryZoomState,
    BreadcrumbItem as TerritoryBreadcrumbItem,
    TerritoryColorScheme,
    VisibilityConfig,
    TerritoryAction,
    TerritoryInteractionState,
} from "./territoryTypes";

export {
    DEFAULT_LAYOUT_CONFIG as TERRITORY_LAYOUT_CONFIG,
    DEFAULT_COLOR_SCHEME,
    DEFAULT_VISIBILITY,
    INITIAL_ZOOM_STATE,
} from "./territoryTypes";

// Treemap Layout
export {
    computeTreemapLayout,
    computeHierarchicalLayout,
    calculateLabelFontSize,
    getLabelVariant,
    shouldShowChildren,
    isInViewport,
    getVisibleDepth,
} from "./treemapLayout";

// Territory Data Adapter
export type { MapNodeRecord } from "./territoryDataAdapter";
export {
    buildHierarchy,
    createMockHierarchy,
} from "./territoryDataAdapter";

// Territory Zoom Hook
export {
    useTerritoryZoom,
    DEFAULT_ZOOM_CONFIG,
    type TerritoryZoomConfig,
    type ViewportInfo,
} from "./useTerritoryZoom";

// ============================================================================
// WEBGL RENDERING - High-performance 10k+ node rendering
// ============================================================================

// WebGL Renderer - Core Three.js-based renderer
export {
    WebGLUniverseRenderer,
    createWebGLRenderer,
    detectWebGLSupport,
    DEFAULT_WEBGL_CONFIG,
    type WebGLRendererConfig,
    type WebGLRendererStats,
    type NodeRenderData,
} from "./webglRenderer";

// Node Instance Batcher - Efficient batching for instanced rendering
export {
    NodeInstanceBatcher,
    createNodeInstanceBatcher,
    estimateOptimalBatchSize,
    estimateMemoryUsage,
    DEFAULT_BATCHER_CONFIG,
    type NodeBatch,
    type InstanceData,
    type NodeInstanceBatcherConfig,
    type BatchUpdateResult,
} from "./nodeInstanceBatcher";

// Shader Manager - GLSL shader management
export {
    ShaderManager,
    createShaderManager,
    getShaderSource,
    SHADER_LIBRARY,
    type ShaderDefinition,
    type ShaderQuality,
    type CompiledShader,
} from "./shaderManager";

// Particle Engine - GPU-accelerated particle systems
export {
    ParticleEngine,
    createParticleEngine,
    createDefaultParticleEngine,
    PARTICLE_PRESETS,
    type ParticleConfig,
    type ParticleType,
    type ParticleData,
    type ParticleStats,
} from "./particleEngine";
