/**
 * Learning Path Graph Progression Accessors
 *
 * Functions for working with the unified progression coordinate system.
 */

import type { LearningDomainId } from "../learningDomains";
import type {
    ProgressionLevel,
    ProgressionBreadth,
    ProgressionCoordinate,
    CoordinateZone,
} from "../progressionCoordinate";
import {
    getProgressionLabel,
    getProgressionMeta,
    getBreadthLabel,
    getCoordinateLabel,
    progressionToYPosition,
    progressionToOrbitalRadius,
    sortByProgression,
    groupByProgression,
    sortByProgressionCoordinate,
    groupByCoordinate,
    getCoordinateZone,
} from "../progressionCoordinate";
import type { GraphNode } from "./types";
import { GRAPH_NODES, nodeById } from "./constants";

// ============================================================================
// PROGRESSION LEVEL ACCESSORS
// ============================================================================

/**
 * Get nodes sorted by progression level (foundation first, expert last).
 */
export function getNodesSortedByProgression(): GraphNode[] {
    return sortByProgression(GRAPH_NODES, (node) => node.progressionLevel);
}

/**
 * Get nodes grouped by progression level.
 */
export function getNodesGroupedByProgression(): Map<ProgressionLevel, GraphNode[]> {
    return groupByProgression(GRAPH_NODES, (node) => node.progressionLevel);
}

/**
 * Get the display label for a node's progression level.
 */
export function getNodeProgressionLabel(nodeId: LearningDomainId): string {
    const node = nodeById.get(nodeId);
    if (!node) return "Unknown";
    return getProgressionLabel(node.progressionLevel);
}

/**
 * Get full progression metadata for a node.
 */
export function getNodeProgressionMeta(nodeId: LearningDomainId) {
    const node = nodeById.get(nodeId);
    if (!node) return null;
    return getProgressionMeta(node.progressionLevel);
}

/**
 * Compute Y position for a node based on its progression level.
 *
 * @param nodeId - The node ID
 * @param positionWithinLevel - Position within the level range (0-1)
 */
export function getNodeYPositionFromProgression(
    nodeId: LearningDomainId,
    positionWithinLevel: number = 0.5
): number {
    const node = nodeById.get(nodeId);
    if (!node) return 50;
    return progressionToYPosition(node.progressionLevel, positionWithinLevel);
}

/**
 * Compute orbital radius for a node based on its progression level.
 *
 * @param nodeId - The node ID
 * @param maxRadius - Maximum radius in pixels or units
 */
export function getNodeOrbitalRadius(
    nodeId: LearningDomainId,
    maxRadius: number = 100
): number {
    const node = nodeById.get(nodeId);
    if (!node) return maxRadius / 2;
    return progressionToOrbitalRadius(node.progressionLevel, maxRadius);
}

// ============================================================================
// 2D COORDINATE ACCESSORS
// ============================================================================

/**
 * Get the full 2D progression coordinate for a node.
 */
export function getNodeProgressionCoordinate(
    nodeId: LearningDomainId
): ProgressionCoordinate | null {
    const node = nodeById.get(nodeId);
    if (!node) return null;
    return {
        level: node.progressionLevel,
        breadth: node.progressionBreadth,
    };
}

/**
 * Get the breadth label for a node (e.g., "Mandatory", "Elective").
 */
export function getNodeBreadthLabel(nodeId: LearningDomainId): string {
    const node = nodeById.get(nodeId);
    if (!node) return "Unknown";
    return getBreadthLabel(node.progressionBreadth);
}

/**
 * Get the full 2D coordinate label for a node (e.g., "Core Recommended").
 */
export function getNodeCoordinateLabel(nodeId: LearningDomainId): string {
    const coord = getNodeProgressionCoordinate(nodeId);
    if (!coord) return "Unknown";
    return getCoordinateLabel(coord);
}

/**
 * Get the learning zone for a node.
 */
export function getNodeCoordinateZone(nodeId: LearningDomainId): CoordinateZone | null {
    const coord = getNodeProgressionCoordinate(nodeId);
    if (!coord) return null;
    return getCoordinateZone(coord);
}

/**
 * Get nodes sorted by full 2D coordinate (level first, then breadth).
 */
export function getNodesSortedByCoordinate(): GraphNode[] {
    return sortByProgressionCoordinate(GRAPH_NODES, (node) => ({
        level: node.progressionLevel,
        breadth: node.progressionBreadth,
    }));
}

/**
 * Get nodes grouped by full 2D coordinate.
 * Returns nested map: level -> breadth -> nodes
 */
export function getNodesGroupedByCoordinate(): Map<
    ProgressionLevel,
    Map<ProgressionBreadth, GraphNode[]>
> {
    return groupByCoordinate(GRAPH_NODES, (node) => ({
        level: node.progressionLevel,
        breadth: node.progressionBreadth,
    }));
}

/**
 * Get all nodes in a specific learning zone.
 */
export function getNodesByZone(zone: CoordinateZone): GraphNode[] {
    return GRAPH_NODES.filter((node) => {
        const coord = { level: node.progressionLevel, breadth: node.progressionBreadth };
        return getCoordinateZone(coord) === zone;
    });
}

/**
 * Check if a node is on the critical path (foundational + mandatory).
 */
export function isNodeOnCriticalPath(nodeId: LearningDomainId): boolean {
    const zone = getNodeCoordinateZone(nodeId);
    return zone === "critical-path";
}

/**
 * Check if a node is elective (high breadth value).
 */
export function isNodeElective(nodeId: LearningDomainId): boolean {
    const node = nodeById.get(nodeId);
    if (!node) return false;
    return node.progressionBreadth >= 3;
}
