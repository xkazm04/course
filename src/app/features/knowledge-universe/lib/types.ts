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
 * Orbit node - represents a skill/sub-topic within a chapter
 * Visual: smaller glowing orb orbiting moons, intermediate between moon and star
 */
export interface OrbitNode extends UniverseNodeBase {
    type: "orbit";
    parentMoonId: string;
    skillId: string;
    lessonCount: number;
    estimatedHours?: number;
    difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
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
 * Asteroid node - represents optional/bonus content
 */
export interface AsteroidNode extends UniverseNodeBase {
    type: "asteroid";
    parentMoonId: string;
    contentId: string;
    contentType: "bonus" | "deep-dive" | "reference";
    fragmentCount: number;
}

/**
 * Comet node - represents time-limited challenges
 */
export interface CometNode extends UniverseNodeBase {
    type: "comet";
    parentMoonId: string;
    challengeId: string;
    expiresAt: number; // Unix timestamp
    tailLength: number;
    tailAngle: number;
    difficulty: "easy" | "medium" | "hard";
}

// ============================================================================
// CLUSTER NODES (for LOD/hierarchical visualization)
// ============================================================================

/**
 * Cluster level representing aggregation depth
 * - galaxy-cluster: Aggregates multiple domains into mega-clusters
 * - domain-cluster: Single domain with aggregated topics
 * - topic-cluster: Single topic with aggregated skills
 * - skill-cluster: Single skill with aggregated lessons
 */
export type ClusterLevel = "galaxy-cluster" | "domain-cluster" | "topic-cluster" | "skill-cluster";

/**
 * Cluster node - represents an aggregation of child nodes
 * Rendered as a glowing nebula that "explodes" into children on zoom
 */
export interface ClusterNode extends UniverseNodeBase {
    type: "cluster";
    /** The aggregation level of this cluster */
    clusterLevel: ClusterLevel;
    /** IDs of the nodes this cluster aggregates */
    childNodeIds: string[];
    /** Cached count of all descendant nodes (for metrics) */
    totalDescendants: number;
    /** Aggregate metrics for display */
    metrics: ClusterMetrics;
    /** Primary domain ID (for coloring, if single domain) */
    primaryDomainId?: string;
    /** Whether this cluster is currently expanded (animating to children) */
    isExpanding?: boolean;
    /** Animation progress (0-1) for expansion/collapse */
    expansionProgress?: number;
    /** Positions for child node animation targets */
    childPositions?: Map<string, { x: number; y: number }>;
}

/**
 * Aggregate metrics shown on cluster nodes
 */
export interface ClusterMetrics {
    /** Total estimated hours of content */
    totalHours: number;
    /** Completion percentage (0-100) */
    completionPercent: number;
    /** Number of nodes in this cluster */
    nodeCount: number;
    /** Number of completed nodes */
    completedCount: number;
    /** Difficulty breakdown */
    difficultyBreakdown?: {
        beginner: number;
        intermediate: number;
        advanced: number;
        expert: number;
    };
}

/**
 * LOD (Level of Detail) configuration
 * 5-level hierarchy: galaxy → domain → topic → skill → lesson
 */
export interface LODConfig {
    /** Zoom scale thresholds for LOD transitions */
    thresholds: {
        /** Below this scale: show galaxy clusters */
        galaxyCluster: number;
        /** Below this scale: show domain clusters */
        domainCluster: number;
        /** Below this scale: show topic clusters */
        topicCluster: number;
        /** Below this scale: show skill clusters */
        skillCluster: number;
        /** Above this: show individual nodes */
        fullDetail: number;
    };
    /** Animation duration for cluster transitions (ms) */
    transitionDuration: number;
    /** Minimum nodes to form a cluster */
    minClusterSize: number;
}

/**
 * Default LOD configuration
 * Adjusted thresholds for smooth 5-level navigation
 */
export const DEFAULT_LOD_CONFIG: LODConfig = {
    thresholds: {
        galaxyCluster: 0.12,
        domainCluster: 0.22,
        topicCluster: 0.40,
        skillCluster: 0.60,
        fullDetail: 0.85,
    },
    transitionDuration: 400,
    minClusterSize: 3,
};

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
export type UniverseNode = PlanetNode | MoonNode | OrbitNode | StarNode | AsteroidNode | CometNode | ClusterNode;

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
