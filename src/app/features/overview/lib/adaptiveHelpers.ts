/**
 * Adaptive Knowledge Map Helper Functions
 *
 * Utility functions for the AI-powered adaptive learning map.
 */

import type { curriculumData } from "./curriculumData";

/**
 * Calculate all nodes in a learning path from a selected node.
 * Uses BFS to find both prerequisites (upstream) and dependents (downstream).
 *
 * @param selectedNodeId - The starting node for path calculation
 * @param data - The curriculum data with nodes and connections
 * @returns Set of node IDs that form the complete learning path
 */
export function calculateFocusedPath(
    selectedNodeId: string,
    data: typeof curriculumData
): Set<string> {
    const focusedNodes = new Set<string>();
    const prerequisiteMap: Record<string, string[]> = {};
    const dependentMap: Record<string, string[]> = {};

    // Build adjacency maps
    data.connections.forEach(conn => {
        if (!dependentMap[conn.from]) dependentMap[conn.from] = [];
        dependentMap[conn.from].push(conn.to);
        if (!prerequisiteMap[conn.to]) prerequisiteMap[conn.to] = [];
        prerequisiteMap[conn.to].push(conn.from);
    });

    // BFS upstream (prerequisites)
    const visitedUp = new Set<string>();
    const queueUp: string[] = [selectedNodeId];
    while (queueUp.length > 0) {
        const current = queueUp.shift()!;
        if (visitedUp.has(current)) continue;
        visitedUp.add(current);
        focusedNodes.add(current);
        const prerequisites = prerequisiteMap[current] || [];
        prerequisites.forEach((prereqId: string) => {
            if (!visitedUp.has(prereqId)) queueUp.push(prereqId);
        });
    }

    // BFS downstream (dependents)
    const visitedDown = new Set<string>();
    const queueDown: string[] = [selectedNodeId];
    while (queueDown.length > 0) {
        const current = queueDown.shift()!;
        if (visitedDown.has(current)) continue;
        visitedDown.add(current);
        focusedNodes.add(current);
        const dependents = dependentMap[current] || [];
        dependents.forEach((depId: string) => {
            if (!visitedDown.has(depId)) queueDown.push(depId);
        });
    }

    return focusedNodes;
}
