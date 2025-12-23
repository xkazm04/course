/**
 * Learning Path Graph Constants
 *
 * Static graph data - the single source of truth for
 * the learning path structure.
 */

import type { LearningDomainId } from "../learningDomains";
import type { ProgressionLevel, ProgressionBreadth } from "../progressionCoordinate";
import { hierarchyLevelToProgression, peerCountToBreadth } from "../progressionCoordinate";
import type { GraphNode, GraphEdge, LearningPathGraph, HierarchyLevel, TimelinePhase } from "./types";

// ============================================================================
// PROGRESSION HELPERS
// ============================================================================

/**
 * Pre-computed peer counts at each progression level.
 * Used to calculate breadth for each node.
 */
const PEER_COUNTS_BY_LEVEL: Record<ProgressionLevel, number> = {
    0: 1,  // databases only
    1: 2,  // frontend, backend
    2: 1,  // fullstack only (at level 2)
    3: 0,  // no level 3 nodes
    4: 2,  // games, mobile
};

/**
 * Compute progressionLevel from hierarchyLevel and timelinePhase.
 */
function computeProgressionLevel(
    hierarchyLevel: HierarchyLevel,
    timelinePhase: TimelinePhase
): ProgressionLevel {
    if (timelinePhase === "specialization") {
        return 4;
    }
    return hierarchyLevelToProgression(hierarchyLevel);
}

/**
 * Compute breadth from peer count at the same level.
 */
function computeProgressionBreadth(level: ProgressionLevel): ProgressionBreadth {
    const peerCount = PEER_COUNTS_BY_LEVEL[level];
    return peerCountToBreadth(peerCount);
}

// ============================================================================
// GRAPH DATA
// ============================================================================

/**
 * Node definitions with all positioning and hierarchy data.
 */
export const GRAPH_NODES: GraphNode[] = [
    {
        id: "frontend",
        position: { x: 50, y: 15 },
        hierarchyLevel: 1,
        timelinePhase: "intermediate",
        isEntryPoint: false,
        sortOrder: 2,
        progressionLevel: computeProgressionLevel(1, "intermediate"),
        progressionBreadth: computeProgressionBreadth(computeProgressionLevel(1, "intermediate")),
    },
    {
        id: "fullstack",
        position: { x: 50, y: 50 },
        hierarchyLevel: 2,
        timelinePhase: "advanced",
        isEntryPoint: true,
        sortOrder: 1,
        progressionLevel: computeProgressionLevel(2, "advanced"),
        progressionBreadth: computeProgressionBreadth(computeProgressionLevel(2, "advanced")),
    },
    {
        id: "backend",
        position: { x: 50, y: 85 },
        hierarchyLevel: 1,
        timelinePhase: "intermediate",
        isEntryPoint: false,
        sortOrder: 3,
        progressionLevel: computeProgressionLevel(1, "intermediate"),
        progressionBreadth: computeProgressionBreadth(computeProgressionLevel(1, "intermediate")),
    },
    {
        id: "databases",
        position: { x: 15, y: 70 },
        hierarchyLevel: 0,
        timelinePhase: "foundation",
        isEntryPoint: false,
        sortOrder: 5,
        progressionLevel: computeProgressionLevel(0, "foundation"),
        progressionBreadth: computeProgressionBreadth(computeProgressionLevel(0, "foundation")),
    },
    {
        id: "games",
        position: { x: 20, y: 30 },
        hierarchyLevel: 2,
        timelinePhase: "specialization",
        isEntryPoint: false,
        sortOrder: 6,
        progressionLevel: computeProgressionLevel(2, "specialization"),
        progressionBreadth: computeProgressionBreadth(computeProgressionLevel(2, "specialization")),
    },
    {
        id: "mobile",
        position: { x: 80, y: 30 },
        hierarchyLevel: 2,
        timelinePhase: "specialization",
        isEntryPoint: false,
        sortOrder: 4,
        progressionLevel: computeProgressionLevel(2, "specialization"),
        progressionBreadth: computeProgressionBreadth(computeProgressionLevel(2, "specialization")),
    },
];

/**
 * Edge definitions describing relationships between domains
 */
export const GRAPH_EDGES: GraphEdge[] = [
    {
        from: "frontend",
        to: "fullstack",
        type: "builds-upon",
        weight: 2,
        label: "Adds backend skills",
    },
    {
        from: "backend",
        to: "fullstack",
        type: "builds-upon",
        weight: 2,
        label: "Adds frontend skills",
    },
    {
        from: "databases",
        to: "backend",
        type: "prerequisite",
        weight: 3,
        label: "Data foundation",
    },
    {
        from: "games",
        to: "frontend",
        type: "specializes",
        weight: 1,
        label: "Visual specialization",
    },
    {
        from: "mobile",
        to: "fullstack",
        type: "complements",
        weight: 1,
        label: "Platform extension",
    },
];

/**
 * The complete learning path graph - single source of truth
 */
export const LEARNING_PATH_GRAPH: LearningPathGraph = {
    nodes: GRAPH_NODES,
    edges: GRAPH_EDGES,
    metadata: {
        version: "1.0.0",
        defaultEntryPoint: "fullstack",
        lastUpdated: new Date().toISOString(),
    },
};

/**
 * Timeline phase display labels
 */
export const PHASE_LABELS: Record<TimelinePhase, string> = {
    foundation: "Foundation",
    intermediate: "Intermediate",
    advanced: "Advanced",
    specialization: "Specialization",
};

/**
 * Hierarchy level display labels
 * @deprecated Use PROGRESSION_LABELS from progressionCoordinate.ts instead
 */
export const HIERARCHY_LABELS: Record<HierarchyLevel, string> = {
    0: "Foundation",
    1: "Core Skills",
    2: "Advanced",
    3: "Expert",
};

// ============================================================================
// PRE-COMPUTED LOOKUP MAPS (Performance Optimization)
// ============================================================================

/** O(1) node lookup by ID */
export const nodeById = new Map<LearningDomainId, GraphNode>(
    GRAPH_NODES.map((node) => [node.id, node])
);

/** O(1) edges lookup by source node */
export const edgesBySource = new Map<LearningDomainId, GraphEdge[]>();
GRAPH_EDGES.forEach((edge) => {
    const existing = edgesBySource.get(edge.from) ?? [];
    existing.push(edge);
    edgesBySource.set(edge.from, existing);
});

/** O(1) edges lookup by target node */
export const edgesByTarget = new Map<LearningDomainId, GraphEdge[]>();
GRAPH_EDGES.forEach((edge) => {
    const existing = edgesByTarget.get(edge.to) ?? [];
    existing.push(edge);
    edgesByTarget.set(edge.to, existing);
});
