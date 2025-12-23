/**
 * Progression Coordinate System
 *
 * A unified 2D coordinate system that encodes learning progression:
 * - Level (Y-axis): How advanced is this topic? (0-4)
 * - Breadth (X-axis): How many peer topics exist? (0-4)
 *
 * This module provides consistent spatial reasoning across all views.
 */

// Types
export type {
    ProgressionLevel,
    ProgressionBreadth,
    ProgressionPhase,
    ProgressionOptionality,
    ProgressionCoordinate,
    ProgressionLevelMeta,
    ProgressionBreadthMeta,
    CoordinateZone,
    HeatMapCell,
} from "./types";

// Constants
export {
    PROGRESSION_LEVELS,
    PROGRESSION_BREADTHS,
    COORDINATE_ZONES,
    PROGRESSION_LABELS,
    PROGRESSION_PHASES,
    BREADTH_LABELS,
    BREADTH_OPTIONALITIES,
} from "./constants";

// Conversions
export {
    toProgressionLevel,
    getPhase,
    getProgressionLabel,
    getProgressionMeta,
    phaseToLevel,
    toProgressionBreadth,
    getOptionality,
    getBreadthLabel,
    getBreadthMeta,
    optionalityToBreadth,
    peerCountToBreadth,
    createProgressionCoordinate,
    toProgressionCoordinate,
    getCoordinateLabel,
    getCoordinateMeta,
} from "./conversions";

// Sorting & Grouping
export {
    compareProgressionCoordinates,
    coordinatesEqual,
    compareProgressionLevels,
    sortByProgression,
    sortByProgressionCoordinate,
    sortByBreadth,
    groupByProgression,
    groupByBreadth,
    groupByCoordinate,
    getPopulatedCoordinates,
    computeBreadthFromPeerCount,
} from "./sorting";

// Spatial
export {
    progressionToYPosition,
    yPositionToProgression,
    progressionToOrbitalRadius,
    coordinateToPosition,
    get2DCoordinateGradient,
} from "./spatial";

// Display
export {
    getProgressionColorClass,
    getProgressionGradient,
    getAllProgressionLevels,
    isFoundationalLevel,
    isAdvancedLevel,
    getBreadthColorClass,
    getAllProgressionBreadths,
    isMandatoryBreadth,
    isElectiveBreadth,
} from "./display";

// Heat Map
export {
    getHeatMapCell,
    generateHeatMapGrid,
    getCoordinateStyles,
    getCoordinateImportance,
    getRecommendedLearningOrder,
    getCoordinateZone,
    getZoneMeta,
} from "./heatmap";

// Legacy Compatibility
export {
    hierarchyLevelToProgression,
    timelinePhaseToProgression,
    tierToProgression,
} from "./legacy";
