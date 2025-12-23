/**
 * Learning Path Spatial Graph
 *
 * This file serves as the main entry point, re-exporting from modular sources.
 * For implementation details, see ./learningPathGraph/
 *
 * The graph structure describes how knowledge domains relate semantically:
 * - Spatial positions for map views
 * - Hierarchy levels for tree views
 * - Timeline phases for roadmap views
 * - Progression coordinates for unified navigation
 */

// Re-export everything from the modular implementation
export * from "./learningPathGraph/index";
