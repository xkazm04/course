/**
 * Learning Path Graph Accessors
 *
 * Functions for accessing nodes and edges from the graph.
 */

import type { LearningDomainId } from "../learningDomains";
import type { GraphNode, GraphEdge, HierarchyLevel, TimelinePhase } from "./types";
import { GRAPH_NODES, GRAPH_EDGES, nodeById, edgesBySource, edgesByTarget } from "./constants";

// ============================================================================
// NODE ACCESSORS
// ============================================================================

/**
 * Get a node by its ID (O(1) lookup)
 */
export function getGraphNode(id: LearningDomainId): GraphNode | undefined {
    return nodeById.get(id);
}

/**
 * Get all nodes at a specific hierarchy level
 */
export function getNodesByHierarchy(level: HierarchyLevel): GraphNode[] {
    return GRAPH_NODES.filter(node => node.hierarchyLevel === level);
}

/**
 * Get all nodes in a specific timeline phase
 */
export function getNodesByPhase(phase: TimelinePhase): GraphNode[] {
    return GRAPH_NODES.filter(node => node.timelinePhase === phase);
}

/**
 * Get nodes sorted by hierarchy (foundation first)
 */
export function getNodesSortedByHierarchy(): GraphNode[] {
    return [...GRAPH_NODES].sort((a, b) => {
        if (a.hierarchyLevel !== b.hierarchyLevel) {
            return a.hierarchyLevel - b.hierarchyLevel;
        }
        return a.sortOrder - b.sortOrder;
    });
}

/**
 * Get entry point nodes (recommended starting points)
 */
export function getEntryPoints(): GraphNode[] {
    return GRAPH_NODES.filter(node => node.isEntryPoint);
}

// ============================================================================
// EDGE ACCESSORS
// ============================================================================

/**
 * Get all edges from a specific node (O(1) lookup)
 */
export function getOutgoingEdges(nodeId: LearningDomainId): GraphEdge[] {
    return edgesBySource.get(nodeId) ?? [];
}

/**
 * Get all edges pointing to a specific node (O(1) lookup)
 */
export function getIncomingEdges(nodeId: LearningDomainId): GraphEdge[] {
    return edgesByTarget.get(nodeId) ?? [];
}

/**
 * Get all connected nodes (both incoming and outgoing)
 */
export function getConnectedNodes(nodeId: LearningDomainId): LearningDomainId[] {
    const connected = new Set<LearningDomainId>();

    const outgoing = edgesBySource.get(nodeId) ?? [];
    const incoming = edgesByTarget.get(nodeId) ?? [];

    outgoing.forEach(edge => connected.add(edge.to));
    incoming.forEach(edge => connected.add(edge.from));

    return Array.from(connected);
}

/**
 * Get prerequisites for a node (nodes that should be learned first)
 */
export function getPrerequisites(nodeId: LearningDomainId): LearningDomainId[] {
    return (edgesByTarget.get(nodeId) ?? [])
        .filter(edge => edge.type === "prerequisite")
        .map(edge => edge.from);
}

/**
 * Get nodes that build upon a given node
 */
export function getDependents(nodeId: LearningDomainId): LearningDomainId[] {
    return (edgesBySource.get(nodeId) ?? []).map(edge => edge.to);
}

/**
 * Check if there's a direct connection between two nodes
 */
export function areConnected(nodeA: LearningDomainId, nodeB: LearningDomainId): boolean {
    const outgoing = edgesBySource.get(nodeA) ?? [];
    const incoming = edgesByTarget.get(nodeA) ?? [];

    return (
        outgoing.some(edge => edge.to === nodeB) ||
        incoming.some(edge => edge.from === nodeB)
    );
}

/**
 * Get the relationship between two nodes if it exists
 */
export function getRelationship(
    from: LearningDomainId,
    to: LearningDomainId
): GraphEdge | undefined {
    return GRAPH_EDGES.find(edge => edge.from === from && edge.to === to);
}
