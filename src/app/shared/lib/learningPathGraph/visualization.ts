/**
 * Learning Path Graph Visualization Helpers
 *
 * Functions for rendering the graph in different visual formats.
 */

import type { LearningDomainId } from "../learningDomains";
import type { GraphNode, SpatialPosition, RelationshipType, HierarchyLevel, TimelinePhase } from "./types";
import { GRAPH_NODES, GRAPH_EDGES } from "./constants";

// ============================================================================
// SPATIAL RENDERING HELPERS
// ============================================================================

/**
 * Position lookup map for efficient access in spatial views
 */
export function getPositionMap(): Record<LearningDomainId, SpatialPosition> {
    return GRAPH_NODES.reduce(
        (map, node) => {
            map[node.id] = node.position;
            return map;
        },
        {} as Record<LearningDomainId, SpatialPosition>
    );
}

/**
 * Pre-computed position map for O(1) lookups
 */
export const positionMap: Record<LearningDomainId, SpatialPosition> = getPositionMap();

/**
 * Connection data for SVG line rendering
 */
export interface RenderableConnection {
    from: LearningDomainId;
    to: LearningDomainId;
    startPos: SpatialPosition;
    endPos: SpatialPosition;
    weight: number;
    type: RelationshipType;
}

/**
 * Get connections in the format needed for SVG line rendering
 */
export function getConnectionsForRendering(): RenderableConnection[] {
    return GRAPH_EDGES.map(edge => ({
        from: edge.from,
        to: edge.to,
        startPos: positionMap[edge.from],
        endPos: positionMap[edge.to],
        weight: edge.weight,
        type: edge.type,
    })).filter(conn => conn.startPos && conn.endPos);
}

// ============================================================================
// GROUPING HELPERS
// ============================================================================

/**
 * Group nodes by hierarchy level for tree rendering
 */
export function getNodesGroupedByHierarchy(): Record<HierarchyLevel, GraphNode[]> {
    return GRAPH_NODES.reduce(
        (groups, node) => {
            if (!groups[node.hierarchyLevel]) {
                groups[node.hierarchyLevel] = [];
            }
            groups[node.hierarchyLevel].push(node);
            return groups;
        },
        {} as Record<HierarchyLevel, GraphNode[]>
    );
}

/**
 * Group nodes by timeline phase for roadmap rendering
 */
export function getNodesGroupedByPhase(): Record<TimelinePhase, GraphNode[]> {
    return GRAPH_NODES.reduce(
        (groups, node) => {
            if (!groups[node.timelinePhase]) {
                groups[node.timelinePhase] = [];
            }
            groups[node.timelinePhase].push(node);
            return groups;
        },
        {} as Record<TimelinePhase, GraphNode[]>
    );
}

// ============================================================================
// MEMOIZED RESULTS (Performance Optimization)
// ============================================================================

/** Cached hierarchy groups */
let cachedHierarchyGroups: Record<HierarchyLevel, GraphNode[]> | null = null;

/**
 * Get nodes grouped by hierarchy (memoized)
 */
export function getNodesGroupedByHierarchyMemoized(): Record<HierarchyLevel, GraphNode[]> {
    if (!cachedHierarchyGroups) {
        cachedHierarchyGroups = getNodesGroupedByHierarchy();
    }
    return cachedHierarchyGroups;
}

/** Cached phase groups */
let cachedPhaseGroups: Record<TimelinePhase, GraphNode[]> | null = null;

/**
 * Get nodes grouped by phase (memoized)
 */
export function getNodesGroupedByPhaseMemoized(): Record<TimelinePhase, GraphNode[]> {
    if (!cachedPhaseGroups) {
        cachedPhaseGroups = getNodesGroupedByPhase();
    }
    return cachedPhaseGroups;
}

/** Cached renderable connections */
let cachedConnections: RenderableConnection[] | null = null;

/**
 * Get connections for rendering (memoized)
 */
export function getConnectionsForRenderingMemoized(): RenderableConnection[] {
    if (!cachedConnections) {
        cachedConnections = getConnectionsForRendering();
    }
    return cachedConnections;
}
