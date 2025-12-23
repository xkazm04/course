/**
 * Progression Coordinate System
 *
 * This module provides a unified "progression coordinate" that encodes
 * the same fundamental concept across all visualizations:
 * "How far along the learning journey is this topic?"
 *
 * TWO-DIMENSIONAL COORDINATE SYSTEM:
 * 1. ProgressionLevel (0-4) - Vertical axis: "How advanced is this topic?"
 * 2. ProgressionBreadth (0-4) - Horizontal axis: "How many peer topics exist?"
 *
 * The implementation is split into focused modules for maintainability:
 * - types: Core type definitions
 * - constants: Static definitions for levels, breadths, zones
 * - conversions: Functions for converting between representations
 * - sorting: Sorting and grouping utilities
 * - spatial: Spatial position calculations
 * - display: UI rendering helpers
 * - heatmap: 2D visualization support
 * - legacy: Backward compatibility
 */

// Re-export everything from the modular implementation
export * from "./progressionCoordinate/index";
