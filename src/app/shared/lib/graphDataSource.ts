/**
 * GraphDataSource - Unified Interface for Graph-Based Learning Data
 *
 * This module exposes the hidden isomorphism between different data structures
 * in the codebase (learningPaths from mockData.ts and curriculumData from curriculumData.ts).
 * Both represent the same conceptual structure: hierarchical nodes with connections.
 *
 * By creating a unified GraphDataSource interface, any visualization variant
 * can work with any data source through a common graph API:
 * - getNodes(): Get all nodes in the graph
 * - getEdges(): Get all edges/connections
 * - getNodeById(): Get a specific node
 * - getConnections(): Get connections for a specific node
 *
 * This makes variants into pure renderers that don't care about the data source.
 *
 * UNIFIED PROGRESSION COORDINATE SYSTEM:
 * All nodes now have a `progressionLevel` (0-4) that encodes the same
 * fundamental concept across all visualizations: "How far along the learning
 * journey is this topic?"
 *
 * This unifies:
 * - tier (0-4) in curriculumData.ts
 * - hierarchyLevel (0-3) in learningPathGraph.ts
 * - sortOrder in VariantB's list view
 *
 * See progressionCoordinate.ts for the full system.
 */

import {
    type ProgressionLevel,
    type ProgressionPhase,
    type ProgressionBreadth,
    type ProgressionCoordinate,
    PROGRESSION_LEVELS,
    PROGRESSION_BREADTHS,
    getProgressionLabel,
    getProgressionMeta,
    getBreadthLabel,
    getBreadthMeta,
    toProgressionLevel,
    toProgressionBreadth,
    sortByProgression,
    groupByProgression,
    sortByProgressionCoordinate,
    groupByCoordinate,
    compareProgressionLevels,
    compareProgressionCoordinates,
} from "./progressionCoordinate";

// ============================================================================
// CORE GRAPH TYPES
// ============================================================================

/**
 * Position for spatial rendering
 */
export interface GraphPosition {
    x: number;
    y: number;
}

/**
 * Status of a graph node in terms of user progress
 */
export type GraphNodeStatus = "completed" | "in_progress" | "available" | "locked";

/**
 * Type of connection between nodes
 */
export type GraphEdgeType =
    | "required"
    | "recommended"
    | "optional"
    | "prerequisite"
    | "builds-upon"
    | "complements"
    | "specializes"
    | "enables";

/**
 * Core node in a graph data source.
 * Represents a learning topic, path, or section.
 */
export interface GraphNode<TMetadata = Record<string, unknown>> {
    /** Unique identifier */
    id: string;

    /** Display name */
    name: string;

    /** Description of this node */
    description: string;

    /** Position for spatial rendering */
    position: GraphPosition;

    /** Status of this node (for progress visualization) */
    status: GraphNodeStatus;

    /**
     * @deprecated Use progressionLevel instead for consistent cross-view behavior
     * Hierarchy level (0 = foundation, higher = more specialized)
     */
    tier: number;

    /**
     * UNIFIED PROGRESSION LEVEL (0-4) - THE Y-AXIS
     *
     * This is the canonical representation of where this topic sits
     * on the learning journey. It provides consistent semantics across
     * all visualization types:
     *
     * - Y-position (Knowledge Map): higher level = lower on screen
     * - Sort order (Split View): lower level = appears first
     * - Ring distance (Orbital): lower level = closer to center
     *
     * Values: 0=Foundation, 1=Core, 2=Intermediate, 3=Advanced, 4=Expert
     */
    progressionLevel: ProgressionLevel;

    /**
     * PROGRESSION BREADTH (0-4) - THE X-AXIS
     *
     * Represents how many peer topics exist at the same level,
     * indicating optionality/electiveness:
     *
     * - 0 = Mandatory (only path at this level)
     * - 1 = Recommended (few alternatives)
     * - 2 = Suggested (several options)
     * - 3 = Optional (many alternatives)
     * - 4 = Elective (very many alternatives)
     *
     * Combined with progressionLevel, enables 2D coordinate system
     * for heat-map visualizations where density indicates optionality.
     */
    progressionBreadth: ProgressionBreadth;

    /** Category/group this node belongs to */
    category: string;

    /** Optional subcategory */
    subcategory?: string;

    /** Skills or tags associated with this node */
    skills: string[];

    /** Estimated hours to complete */
    estimatedHours: number;

    /** Additional metadata specific to the data source */
    metadata: TMetadata;
}

/**
 * Edge connecting two nodes in a graph
 */
export interface GraphEdge {
    /** Source node ID */
    from: string;

    /** Target node ID */
    to: string;

    /** Type of relationship */
    type: GraphEdgeType;

    /** Visual weight (1-3, affects rendering) */
    weight: number;

    /** Optional label for the connection */
    label?: string;
}

/**
 * Rendering data for an edge (includes position information)
 */
export interface GraphEdgeRendering extends GraphEdge {
    /** Start position */
    startPos: GraphPosition;

    /** End position */
    endPos: GraphPosition;
}

// ============================================================================
// GRAPH DATA SOURCE INTERFACE
// ============================================================================

/**
 * Filter options for querying nodes
 */
export interface GraphNodeFilter {
    /** Filter by category */
    category?: string;

    /** Filter by status */
    status?: GraphNodeStatus | GraphNodeStatus[];

    /**
     * @deprecated Use progressionLevel filter instead
     * Filter by tier/hierarchy level
     */
    tier?: number | number[];

    /**
     * Filter by progression level (0-4)
     * The unified way to filter by learning journey position
     */
    progressionLevel?: ProgressionLevel | ProgressionLevel[];

    /** Filter by minimum estimated hours */
    minHours?: number;

    /** Filter by maximum estimated hours */
    maxHours?: number;
}

/**
 * Connection direction for querying edges
 */
export type EdgeDirection = "incoming" | "outgoing" | "both";

/**
 * The unified GraphDataSource interface.
 *
 * This is the "theory of everything" for this domain - it treats all
 * learning data as graphs of interconnected nodes. Any visualization
 * variant can work with any data source that implements this interface.
 */
export interface GraphDataSource<TNodeMeta = Record<string, unknown>> {
    /**
     * Get all nodes in the graph
     */
    getNodes(filter?: GraphNodeFilter): GraphNode<TNodeMeta>[];

    /**
     * Get all edges in the graph
     */
    getEdges(): GraphEdge[];

    /**
     * Get a specific node by ID
     */
    getNodeById(id: string): GraphNode<TNodeMeta> | undefined;

    /**
     * Get all connections (edges) for a specific node
     */
    getConnections(nodeId: string, direction?: EdgeDirection): GraphEdge[];

    /**
     * Get edges with position data for rendering
     */
    getEdgesForRendering(): GraphEdgeRendering[];

    /**
     * Get prerequisite nodes (nodes that should be completed first)
     */
    getPrerequisites(nodeId: string): GraphNode<TNodeMeta>[];

    /**
     * Get dependent nodes (nodes that build on this one)
     */
    getDependents(nodeId: string): GraphNode<TNodeMeta>[];

    /**
     * Get all unique categories in the graph
     */
    getCategories(): string[];

    /**
     * Get statistics about the graph
     */
    getStats(filter?: GraphNodeFilter): GraphStats;

    // ========================================================================
    // PROGRESSION COORDINATE SYSTEM METHODS
    // ========================================================================

    /**
     * Get nodes sorted by progression level (foundation first, expert last).
     * This is the unified way to sort nodes across all visualizations.
     */
    getNodesSortedByProgression(): GraphNode<TNodeMeta>[];

    /**
     * Get nodes grouped by their progression level.
     * Useful for rendering level-based sections or tiers.
     */
    getNodesGroupedByProgression(): Map<ProgressionLevel, GraphNode<TNodeMeta>[]>;
}

/**
 * Statistics about a graph or subset of a graph
 */
export interface GraphStats {
    /** Total number of nodes */
    totalNodes: number;

    /** Number of completed nodes */
    completedNodes: number;

    /** Number of in-progress nodes */
    inProgressNodes: number;

    /** Number of available nodes */
    availableNodes: number;

    /** Number of locked nodes */
    lockedNodes: number;

    /** Total estimated hours */
    totalHours: number;

    /** Number of edges/connections */
    totalEdges: number;
}

// ============================================================================
// ABSTRACT BASE CLASS FOR COMMON FUNCTIONALITY
// ============================================================================

/**
 * Abstract base class that provides common functionality for GraphDataSource implementations.
 * Subclasses only need to implement getNodes() and getEdges().
 */
export abstract class BaseGraphDataSource<TNodeMeta = Record<string, unknown>>
    implements GraphDataSource<TNodeMeta>
{
    /**
     * Get all nodes in the graph, optionally filtered
     */
    abstract getNodes(filter?: GraphNodeFilter): GraphNode<TNodeMeta>[];

    /**
     * Get all edges in the graph
     */
    abstract getEdges(): GraphEdge[];

    // ========================================================================
    // PROGRESSION COORDINATE SYSTEM METHODS
    // ========================================================================

    /**
     * Get nodes sorted by progression level (foundation first, expert last).
     */
    getNodesSortedByProgression(): GraphNode<TNodeMeta>[] {
        return sortByProgression(this.getNodes(), (node) => node.progressionLevel);
    }

    /**
     * Get nodes grouped by their progression level.
     */
    getNodesGroupedByProgression(): Map<ProgressionLevel, GraphNode<TNodeMeta>[]> {
        return groupByProgression(this.getNodes(), (node) => node.progressionLevel);
    }

    /**
     * Get a specific node by ID
     */
    getNodeById(id: string): GraphNode<TNodeMeta> | undefined {
        return this.getNodes().find((node) => node.id === id);
    }

    /**
     * Get all connections for a specific node
     */
    getConnections(nodeId: string, direction: EdgeDirection = "both"): GraphEdge[] {
        const edges = this.getEdges();

        return edges.filter((edge) => {
            if (direction === "incoming") return edge.to === nodeId;
            if (direction === "outgoing") return edge.from === nodeId;
            return edge.from === nodeId || edge.to === nodeId;
        });
    }

    /**
     * Get edges with position data for rendering
     */
    getEdgesForRendering(): GraphEdgeRendering[] {
        const edges = this.getEdges();
        const nodes = this.getNodes();
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));

        return edges
            .map((edge) => {
                const fromNode = nodeMap.get(edge.from);
                const toNode = nodeMap.get(edge.to);

                if (!fromNode || !toNode) return null;

                return {
                    ...edge,
                    startPos: fromNode.position,
                    endPos: toNode.position,
                };
            })
            .filter((e): e is GraphEdgeRendering => e !== null);
    }

    /**
     * Get prerequisite nodes
     */
    getPrerequisites(nodeId: string): GraphNode<TNodeMeta>[] {
        const prereqEdges = this.getConnections(nodeId, "incoming").filter(
            (edge) => edge.type === "required" || edge.type === "prerequisite"
        );

        return prereqEdges
            .map((edge) => this.getNodeById(edge.from))
            .filter((node): node is GraphNode<TNodeMeta> => node !== undefined);
    }

    /**
     * Get dependent nodes
     */
    getDependents(nodeId: string): GraphNode<TNodeMeta>[] {
        const dependentEdges = this.getConnections(nodeId, "outgoing");

        return dependentEdges
            .map((edge) => this.getNodeById(edge.to))
            .filter((node): node is GraphNode<TNodeMeta> => node !== undefined);
    }

    /**
     * Get all unique categories
     */
    getCategories(): string[] {
        const nodes = this.getNodes();
        return [...new Set(nodes.map((n) => n.category))];
    }

    /**
     * Get statistics about the graph
     */
    getStats(filter?: GraphNodeFilter): GraphStats {
        const nodes = this.getNodes(filter);
        const edges = filter ? this.getEdges() : this.getEdges();

        return {
            totalNodes: nodes.length,
            completedNodes: nodes.filter((n) => n.status === "completed").length,
            inProgressNodes: nodes.filter((n) => n.status === "in_progress").length,
            availableNodes: nodes.filter((n) => n.status === "available").length,
            lockedNodes: nodes.filter((n) => n.status === "locked").length,
            totalHours: nodes.reduce((sum, n) => sum + n.estimatedHours, 0),
            totalEdges: edges.length,
        };
    }

    /**
     * Helper method to apply filters to nodes
     */
    protected applyFilter(
        nodes: GraphNode<TNodeMeta>[],
        filter?: GraphNodeFilter
    ): GraphNode<TNodeMeta>[] {
        if (!filter) return nodes;

        return nodes.filter((node) => {
            // Category filter
            if (filter.category && node.category !== filter.category) {
                return false;
            }

            // Status filter
            if (filter.status) {
                const statuses = Array.isArray(filter.status)
                    ? filter.status
                    : [filter.status];
                if (!statuses.includes(node.status)) {
                    return false;
                }
            }

            // Progression level filter (preferred over tier)
            if (filter.progressionLevel !== undefined) {
                const levels = Array.isArray(filter.progressionLevel)
                    ? filter.progressionLevel
                    : [filter.progressionLevel];
                if (!levels.includes(node.progressionLevel)) {
                    return false;
                }
            }

            // Tier filter (deprecated - use progressionLevel instead)
            if (filter.tier !== undefined) {
                const tiers = Array.isArray(filter.tier) ? filter.tier : [filter.tier];
                if (!tiers.includes(node.tier)) {
                    return false;
                }
            }

            // Hour filters
            if (filter.minHours !== undefined && node.estimatedHours < filter.minHours) {
                return false;
            }
            if (filter.maxHours !== undefined && node.estimatedHours > filter.maxHours) {
                return false;
            }

            return true;
        });
    }
}

// ============================================================================
// RE-EXPORT PROGRESSION COORDINATE TYPES
// ============================================================================

export {
    type ProgressionLevel,
    type ProgressionPhase,
    type ProgressionBreadth,
    type ProgressionCoordinate,
    PROGRESSION_LEVELS,
    PROGRESSION_BREADTHS,
    getProgressionLabel,
    getProgressionMeta,
    getBreadthLabel,
    getBreadthMeta,
    toProgressionLevel,
    toProgressionBreadth,
    sortByProgression,
    groupByProgression,
    sortByProgressionCoordinate,
    groupByCoordinate,
    compareProgressionLevels,
    compareProgressionCoordinates,
} from "./progressionCoordinate";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if two nodes are connected
 */
export function areNodesConnected(
    source: GraphDataSource,
    nodeA: string,
    nodeB: string
): boolean {
    const edges = source.getEdges();
    return edges.some(
        (edge) =>
            (edge.from === nodeA && edge.to === nodeB) ||
            (edge.from === nodeB && edge.to === nodeA)
    );
}

/**
 * Get all nodes that can be reached from a starting node
 */
export function getReachableNodes(
    source: GraphDataSource,
    startNodeId: string,
    maxDepth: number = Infinity
): string[] {
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [
        { id: startNodeId, depth: 0 },
    ];

    while (queue.length > 0) {
        const { id, depth } = queue.shift()!;

        if (visited.has(id) || depth > maxDepth) continue;
        visited.add(id);

        const outgoing = source.getConnections(id, "outgoing");
        for (const edge of outgoing) {
            if (!visited.has(edge.to)) {
                queue.push({ id: edge.to, depth: depth + 1 });
            }
        }
    }

    return Array.from(visited);
}

/**
 * Get the shortest path between two nodes (if one exists)
 */
export function getShortestPath(
    source: GraphDataSource,
    fromId: string,
    toId: string
): string[] | null {
    const visited = new Map<string, string | null>();
    const queue: string[] = [fromId];
    visited.set(fromId, null);

    while (queue.length > 0) {
        const current = queue.shift()!;

        if (current === toId) {
            // Reconstruct path
            const path: string[] = [];
            let node: string | null | undefined = toId;
            while (node) {
                path.unshift(node);
                node = visited.get(node);
            }
            return path;
        }

        const outgoing = source.getConnections(current, "outgoing");
        for (const edge of outgoing) {
            if (!visited.has(edge.to)) {
                visited.set(edge.to, current);
                queue.push(edge.to);
            }
        }
    }

    return null;
}

/**
 * Get nodes sorted by topology (nodes with no dependencies first)
 */
export function getTopologicallySortedNodes<T>(source: GraphDataSource<T>): GraphNode<T>[] {
    const nodes = source.getNodes();
    const edges = source.getEdges();

    // Calculate in-degree for each node
    const inDegree = new Map<string, number>();
    nodes.forEach((n) => inDegree.set(n.id, 0));

    edges.forEach((edge) => {
        if (edge.type === "required" || edge.type === "prerequisite") {
            inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
        }
    });

    // Start with nodes that have no prerequisites
    const queue: GraphNode<T>[] = nodes.filter((n) => inDegree.get(n.id) === 0);
    const sorted: GraphNode<T>[] = [];

    while (queue.length > 0) {
        const node = queue.shift()!;
        sorted.push(node);

        // For each node this one leads to
        edges
            .filter((e) => e.from === node.id && (e.type === "required" || e.type === "prerequisite"))
            .forEach((edge) => {
                const newDegree = (inDegree.get(edge.to) || 0) - 1;
                inDegree.set(edge.to, newDegree);
                if (newDegree === 0) {
                    const nextNode = source.getNodeById(edge.to);
                    if (nextNode) queue.push(nextNode);
                }
            });
    }

    // Add any remaining nodes (handles cycles)
    nodes.forEach((n) => {
        if (!sorted.find((s) => s.id === n.id)) {
            sorted.push(n);
        }
    });

    return sorted;
}
