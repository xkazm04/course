/**
 * Knowledge Universe Types
 *
 * Type definitions for the zoomable universe metaphor visualization.
 * The hierarchy is: Solar System (modules) → Constellations (topics) → Stars (lessons)
 */

import type { LearningDomainId } from "@/app/shared/lib/learningDomains";

// ============================================================================
// ZOOM LEVELS
// ============================================================================

/**
 * Zoom level representing the visual metaphor depth
 * - galaxy: Bird's eye view of all domains
 * - solar: Module-level view (domains as planets)
 * - constellation: Topic-level view (chapters as star clusters)
 * - star: Lesson-level view (individual lessons as stars)
 */
export type ZoomLevel = "galaxy" | "solar" | "constellation" | "star";

/**
 * Zoom level configuration with scale ranges
 */
export interface ZoomLevelConfig {
    level: ZoomLevel;
    minScale: number;
    maxScale: number;
    label: string;
    description: string;
}

export const ZOOM_LEVEL_CONFIGS: ZoomLevelConfig[] = [
    { level: "galaxy", minScale: 0.1, maxScale: 0.3, label: "Galaxy View", description: "All learning domains" },
    { level: "solar", minScale: 0.3, maxScale: 0.7, label: "Solar System", description: "Modules & paths" },
    { level: "constellation", minScale: 0.7, maxScale: 1.5, label: "Constellation", description: "Chapters & topics" },
    { level: "star", minScale: 1.5, maxScale: 4.0, label: "Star System", description: "Lessons & content" },
];

// ============================================================================
// UNIVERSE NODES
// ============================================================================

/**
 * Base node type for all universe objects
 */
export interface UniverseNodeBase {
    id: string;
    name: string;
    x: number;
    y: number;
    radius: number;
    color: string;
    glowColor: string;
    visibleAtZoom: ZoomLevel[];
}

/**
 * Planet node - represents a learning domain (module)
 */
export interface PlanetNode extends UniverseNodeBase {
    type: "planet";
    domainId: LearningDomainId;
    orbitalRings: number;
    moons: MoonNode[];
}

/**
 * Moon node - represents a chapter/topic within a domain
 */
export interface MoonNode extends UniverseNodeBase {
    type: "moon";
    parentPlanetId: string;
    chapterId: string;
    sectionCount: number;
}

/**
 * Star node - represents an individual lesson
 */
export interface StarNode extends UniverseNodeBase {
    type: "star";
    parentMoonId: string;
    lessonId: string;
    lessonType: "video" | "lesson" | "interactive" | "exercise";
    completed: boolean;
    duration: string;
}

/**
 * Connection between nodes (learning paths)
 */
export interface UniverseConnection {
    id: string;
    fromId: string;
    toId: string;
    type: "prerequisite" | "builds-upon" | "complements";
    strength: number; // 0-1, affects line opacity/thickness
    color: string;
}

/**
 * Union type for all node types
 */
export type UniverseNode = PlanetNode | MoonNode | StarNode;

// ============================================================================
// VIEWPORT & CAMERA
// ============================================================================

/**
 * Camera state for pan/zoom
 */
export interface CameraState {
    x: number;
    y: number;
    scale: number;
    targetX: number;
    targetY: number;
    targetScale: number;
}

/**
 * Viewport dimensions
 */
export interface ViewportState {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
}

// ============================================================================
// SPATIAL INDEX
// ============================================================================

/**
 * Quadtree cell for spatial indexing
 */
export interface QuadTreeCell {
    x: number;
    y: number;
    width: number;
    height: number;
    nodes: UniverseNode[];
    children?: QuadTreeCell[];
}

/**
 * Spatial index configuration
 */
export interface SpatialIndexConfig {
    maxNodesPerCell: number;
    maxDepth: number;
    worldBounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
}

// ============================================================================
// INTERACTION STATE
// ============================================================================

/**
 * User interaction state
 */
export interface InteractionState {
    isDragging: boolean;
    isPinching: boolean;
    hoveredNodeId: string | null;
    selectedNodeId: string | null;
    focusedDomainId: LearningDomainId | null;
}

/**
 * Animation state for smooth transitions
 */
export interface AnimationState {
    isAnimating: boolean;
    animationProgress: number;
    animationType: "zoom" | "pan" | "focus" | null;
}
