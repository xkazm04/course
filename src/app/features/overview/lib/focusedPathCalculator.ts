/**
 * Focused Path Calculator
 *
 * Helper to calculate all nodes in a learning path from a selected node.
 * Traverses prerequisites (up) and dependents (down) to build the full path.
 */

import type { CurriculumData } from "./curriculumTypes";

/**
 * Calculate all nodes in a learning path from a selected node.
 * Uses BFS to traverse both prerequisites (ancestors) and dependents (descendants).
 */
export function calculateFocusedPath(
    selectedNodeId: string,
    data: CurriculumData
): Set<string> {
    const focusedNodes = new Set<string>();

    // Build lookup maps for efficient traversal
    const prerequisiteMap: Record<string, string[]> = {};
    const dependentMap: Record<string, string[]> = {};

    data.connections.forEach(conn => {
        // from -> to means "from" is a prerequisite of "to"
        if (!dependentMap[conn.from]) {
            dependentMap[conn.from] = [];
        }
        dependentMap[conn.from].push(conn.to);

        if (!prerequisiteMap[conn.to]) {
            prerequisiteMap[conn.to] = [];
        }
        prerequisiteMap[conn.to].push(conn.from);
    });

    // BFS to find all prerequisites (ancestors)
    const visitedUp = new Set<string>();
    const queueUp: string[] = [selectedNodeId];
    while (queueUp.length > 0) {
        const current = queueUp.shift()!;
        if (visitedUp.has(current)) continue;
        visitedUp.add(current);
        focusedNodes.add(current);

        const prerequisites = prerequisiteMap[current] || [];
        prerequisites.forEach((prereqId: string) => {
            if (!visitedUp.has(prereqId)) {
                queueUp.push(prereqId);
            }
        });
    }

    // BFS to find all dependents (descendants)
    const visitedDown = new Set<string>();
    const queueDown: string[] = [selectedNodeId];
    while (queueDown.length > 0) {
        const current = queueDown.shift()!;
        if (visitedDown.has(current)) continue;
        visitedDown.add(current);
        focusedNodes.add(current);

        const dependents = dependentMap[current] || [];
        dependents.forEach((depId: string) => {
            if (!visitedDown.has(depId)) {
                queueDown.push(depId);
            }
        });
    }

    return focusedNodes;
}
