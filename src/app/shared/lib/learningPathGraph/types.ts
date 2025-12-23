/**
 * Learning Path Graph Type Definitions
 *
 * Core types for the spatial learning path graph structure.
 */

import type { LearningDomainId } from "../learningDomains";
import type { ProgressionLevel, ProgressionBreadth } from "../progressionCoordinate";

/**
 * 2D position for spatial rendering (percentage-based for responsive layouts)
 */
export interface SpatialPosition {
    /** X position as percentage (0-100) */
    x: number;
    /** Y position as percentage (0-100) */
    y: number;
}

/**
 * Hierarchy level for tree/list rendering
 * Lower numbers = more foundational, higher = more specialized
 */
export type HierarchyLevel = 0 | 1 | 2 | 3;

/**
 * Timeline phase for roadmap/progression rendering
 */
export type TimelinePhase = "foundation" | "intermediate" | "advanced" | "specialization";

/**
 * Relationship type between nodes
 */
export type RelationshipType =
    | "prerequisite"      // Target requires source knowledge
    | "builds-upon"       // Target extends/enhances source
    | "complements"       // Target pairs well with source
    | "specializes"       // Target is a specialization of source
    | "enables";          // Source enables/unlocks target

/**
 * Complete node in the learning path graph
 * Contains all positioning data for different visualization modes
 */
export interface GraphNode {
    /** Domain identifier linking to LearningPath data */
    id: LearningDomainId;

    /** Spatial position for map/spatial views (percentage-based) */
    position: SpatialPosition;

    /** Hierarchy level for tree/list views (0 = foundation, 3 = specialization) */
    hierarchyLevel: HierarchyLevel;

    /** Timeline phase for roadmap/progression views */
    timelinePhase: TimelinePhase;

    /** Whether this is a "starting point" node for new learners */
    isEntryPoint: boolean;

    /** Order within the hierarchy level (for sorting in list views) */
    sortOrder: number;

    /**
     * UNIFIED PROGRESSION LEVEL (0-4) - THE Y-AXIS
     *
     * This is the canonical representation of where this topic sits
     * on the learning journey. It unifies:
     * - Y-position (Knowledge Map): higher level = lower on screen
     * - Sort order (Split View): lower level = appears first
     * - Ring distance (Orbital): lower level = closer to center
     */
    progressionLevel: ProgressionLevel;

    /**
     * PROGRESSION BREADTH (0-4) - THE X-AXIS
     *
     * Represents how many peer topics exist at the same level,
     * indicating optionality/electiveness:
     * - 0 = Mandatory (only path at this level)
     * - 4 = Elective (many alternatives)
     */
    progressionBreadth: ProgressionBreadth;
}

/**
 * Edge connecting two nodes in the graph
 */
export interface GraphEdge {
    /** Source node ID */
    from: LearningDomainId;

    /** Target node ID */
    to: LearningDomainId;

    /** Type of relationship */
    type: RelationshipType;

    /** Visual weight for rendering (1-3, affects line thickness) */
    weight: number;

    /** Optional label for the connection */
    label?: string;
}

/**
 * Complete learning path graph structure
 */
export interface LearningPathGraph {
    /** All nodes in the graph */
    nodes: GraphNode[];

    /** All edges connecting nodes */
    edges: GraphEdge[];

    /** Metadata about the graph */
    metadata: {
        /** Version for potential future migrations */
        version: string;
        /** Default entry point node */
        defaultEntryPoint: LearningDomainId;
        /** Timestamp of last update */
        lastUpdated: string;
    };
}
