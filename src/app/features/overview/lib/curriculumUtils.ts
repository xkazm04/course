/**
 * Curriculum Utility Functions
 * Pre-computed Maps and O(1) lookup utilities for curriculum data
 */

import { CurriculumNode, CurriculumConnection, CATEGORY_META, CurriculumData } from "./curriculumTypes";
import {
    htmlCssNodes,
    javascriptNodes,
    typescriptNodes,
    reactNodes,
    vueNodes,
    angularNodes,
    testingNodes,
    buildToolsNodes,
    performanceNodes,
    accessibilityNodes,
    designSystemsNodes,
    stateManagementNodes,
    curriculumConnections,
} from "./nodes";

// ============================================================================
// Aggregate All Nodes
// ============================================================================

const allNodes: CurriculumNode[] = [
    ...htmlCssNodes,
    ...javascriptNodes,
    ...typescriptNodes,
    ...reactNodes,
    ...vueNodes,
    ...angularNodes,
    ...testingNodes,
    ...buildToolsNodes,
    ...performanceNodes,
    ...accessibilityNodes,
    ...designSystemsNodes,
    ...stateManagementNodes,
];

// ============================================================================
// Pre-computed Lookup Maps (O(1) access)
// ============================================================================

/**
 * Pre-computed Map for O(1) node lookups by ID.
 * With 123+ nodes and 200+ connections calling getNodeById per connection,
 * this reduces O(n) array scans to O(1) Map lookups.
 */
const nodeById: Map<string, CurriculumNode> = new Map(
    allNodes.map(node => [node.id, node])
);

/**
 * Pre-computed Map for O(1) category grouping lookups.
 * Avoids recalculating category groupings on each call.
 */
const nodesByCategory: Map<string, CurriculumNode[]> = (() => {
    const map = new Map<string, CurriculumNode[]>();
    for (const node of allNodes) {
        const existing = map.get(node.category);
        if (existing) {
            existing.push(node);
        } else {
            map.set(node.category, [node]);
        }
    }
    return map;
})();

/**
 * Pre-computed Map for O(1) connection lookups by node ID.
 * Structure: nodeId -> { incoming: [], outgoing: [], all: [] }
 */
interface ConnectionsForNode {
    incoming: CurriculumConnection[];
    outgoing: CurriculumConnection[];
    all: CurriculumConnection[];
}

const connectionsByNodeId: Map<string, ConnectionsForNode> = (() => {
    const map = new Map<string, ConnectionsForNode>();

    // Initialize all nodes with empty connection arrays
    for (const node of allNodes) {
        map.set(node.id, { incoming: [], outgoing: [], all: [] });
    }

    // Populate connection arrays
    for (const conn of curriculumConnections) {
        const fromConnections = map.get(conn.from);
        const toConnections = map.get(conn.to);

        if (fromConnections) {
            fromConnections.outgoing.push(conn);
            fromConnections.all.push(conn);
        }
        if (toConnections) {
            toConnections.incoming.push(conn);
            toConnections.all.push(conn);
        }
    }

    return map;
})();

/**
 * Pre-computed prerequisite node IDs by node ID.
 * Only includes "required" type connections for true prerequisites.
 */
const prerequisitesByNodeId: Map<string, string[]> = (() => {
    const map = new Map<string, string[]>();

    for (const node of allNodes) {
        map.set(node.id, []);
    }

    for (const conn of curriculumConnections) {
        if (conn.type === "required") {
            const prereqs = map.get(conn.to);
            if (prereqs) {
                prereqs.push(conn.from);
            }
        }
    }

    return map;
})();

/**
 * Pre-computed Map for O(1) skill-to-nodes lookups.
 * Maps each skill string to an array of nodes that contain that skill.
 * Nodes are pre-sorted by tier (ascending) for gap analysis optimization.
 *
 * This transforms skill gap analysis from O(skills * nodes) to O(skills)
 * by eliminating repeated full array scans during gap calculations.
 */
const nodesBySkill: Map<string, CurriculumNode[]> = (() => {
    const map = new Map<string, CurriculumNode[]>();

    for (const node of allNodes) {
        for (const skill of node.skills) {
            const existing = map.get(skill);
            if (existing) {
                existing.push(node);
            } else {
                map.set(skill, [node]);
            }
        }
    }

    // Pre-sort each skill's nodes by tier for gap analysis
    for (const nodes of map.values()) {
        nodes.sort((a, b) => a.tier - b.tier);
    }

    return map;
})();

// ============================================================================
// Pre-computed Static Values
// ============================================================================

/** Total node count - computed once at module initialization */
export const TOTAL_NODES = allNodes.length;

/** Total connection count */
export const TOTAL_CONNECTIONS = curriculumConnections.length;

/** Node counts by status */
export const NODE_COUNTS_BY_STATUS = (() => {
    const counts = {
        completed: 0,
        in_progress: 0,
        available: 0,
        locked: 0,
    };
    for (const node of allNodes) {
        counts[node.status]++;
    }
    return counts as Readonly<typeof counts>;
})();

/** Node counts by category */
export const NODE_COUNTS_BY_CATEGORY: ReadonlyMap<string, number> = new Map(
    Array.from(nodesByCategory.entries()).map(([cat, nodes]) => [cat, nodes.length])
);

/** Total estimated hours */
export const TOTAL_ESTIMATED_HOURS = allNodes.reduce(
    (sum, node) => sum + node.estimatedHours,
    0
);

// ============================================================================
// Utility Functions (using pre-computed Maps)
// ============================================================================

/**
 * Get nodes by category - O(1) lookup.
 * Returns a new array to prevent mutation of cached data.
 */
export function getNodesByCategory(category: string): CurriculumNode[] {
    return nodesByCategory.get(category)?.slice() ?? [];
}

/**
 * Get node by ID - O(1) lookup.
 * This is the critical performance fix: previously O(n) array scan per call,
 * now O(1) Map lookup. With 200+ connections calling this function,
 * this eliminates 400+ array scans per render.
 */
export function getNodeById(id: string): CurriculumNode | undefined {
    return nodeById.get(id);
}

/**
 * Get connections for a node - O(1) lookup.
 * Returns all connections where the node is either source or target.
 */
export function getConnectionsForNode(nodeId: string): CurriculumConnection[] {
    return connectionsByNodeId.get(nodeId)?.all.slice() ?? [];
}

/**
 * Get incoming connections for a node - O(1) lookup.
 * Connections where this node is the target.
 */
export function getIncomingConnections(nodeId: string): CurriculumConnection[] {
    return connectionsByNodeId.get(nodeId)?.incoming.slice() ?? [];
}

/**
 * Get outgoing connections for a node - O(1) lookup.
 * Connections where this node is the source.
 */
export function getOutgoingConnections(nodeId: string): CurriculumConnection[] {
    return connectionsByNodeId.get(nodeId)?.outgoing.slice() ?? [];
}

/**
 * Get prerequisite nodes - O(1) lookup for IDs, O(k) for node resolution.
 * Returns nodes that are required prerequisites for the given node.
 */
export function getPrerequisites(nodeId: string): CurriculumNode[] {
    const prereqIds = prerequisitesByNodeId.get(nodeId) ?? [];
    return prereqIds
        .map(id => nodeById.get(id))
        .filter((node): node is CurriculumNode => node !== undefined);
}

/**
 * Check if a node exists - O(1) lookup.
 */
export function hasNode(id: string): boolean {
    return nodeById.has(id);
}

/**
 * Get all category IDs - O(1) access to cached keys.
 */
export function getAllCategories(): string[] {
    return Array.from(nodesByCategory.keys());
}

/**
 * Get nodes by skill - O(1) lookup.
 * Returns nodes that contain the specified skill, pre-sorted by tier.
 * This is the critical performance optimization for skill gap analysis:
 * transforms O(skills * nodes) to O(skills) by using pre-computed index.
 *
 * @param skill - The skill to search for
 * @returns Array of nodes containing the skill, sorted by tier (ascending)
 */
export function getNodesBySkill(skill: string): CurriculumNode[] {
    return nodesBySkill.get(skill)?.slice() ?? [];
}

// ============================================================================
// Export Complete Curriculum Data
// ============================================================================

export const curriculumData: CurriculumData = {
    nodes: allNodes,
    connections: curriculumConnections,
    categories: CATEGORY_META,
};
