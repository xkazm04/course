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

// Spatial indexing
export {
    SpatialIndex,
    calculateVisibleBounds,
    isNodeVisible,
    sortNodesByDepth,
} from "./spatialIndex";

// Camera hook
export {
    useUniverseCamera,
    getZoomLevelFromScale,
    getScaleForZoomLevel,
    type UseUniverseCameraOptions,
    type UseUniverseCameraReturn,
} from "./useUniverseCamera";
