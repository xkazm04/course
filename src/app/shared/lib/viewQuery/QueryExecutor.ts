/**
 * QueryExecutor - Executes ViewQueries against a GraphDataSource
 *
 * This module transforms a ViewQuery into a filtered/transformed result set.
 * It implements the query semantics:
 * - WHERE clauses (category, status, progression filters)
 * - Graph traversals (focus mode BFS)
 * - JOINs (path comparison)
 * - Sorting and pagination
 */

import type {
    GraphDataSource,
    GraphNode,
    GraphNodeFilter,
    GraphEdge,
} from "../graphDataSource";
import type {
    ViewQuery,
    ViewQueryResult,
    TraversalSpec,
    FilterClause,
    FilterGroup,
    ComparisonOperator,
} from "./types";

// ============================================================================
// QUERY EXECUTOR CLASS
// ============================================================================

/**
 * QueryExecutor executes ViewQueries against a GraphDataSource.
 * It transforms the declarative query into imperative graph operations.
 */
export class QueryExecutor<TMetadata = Record<string, unknown>> {
    constructor(private readonly dataSource: GraphDataSource<TMetadata>) {}

    /**
     * Execute a ViewQuery and return the result
     */
    execute(query: ViewQuery): ViewQueryResult<TMetadata> {
        // Start with all nodes
        let nodeIds = this.dataSource.getNodes().map((n) => n.id);

        // Apply category filter
        if (query.category) {
            nodeIds = this.applyCategoryFilter(nodeIds, query.category);
        }

        // Apply status filter
        if (query.status) {
            nodeIds = this.applyStatusFilter(nodeIds, query.status);
        }

        // Apply progression level filter
        if (query.progressionLevel !== undefined && query.progressionLevel !== null) {
            nodeIds = this.applyProgressionFilter(nodeIds, query.progressionLevel);
        }

        // Apply search filter
        if (query.search) {
            nodeIds = this.applySearchFilter(nodeIds, query.search);
        }

        // Apply advanced filters
        if (query.filters) {
            nodeIds = this.applyFilterGroup(nodeIds, query.filters);
        }

        // Apply traversal (focus mode)
        let focusPath: string[] | undefined;
        if (query.focusMode && query.traversal) {
            const traversalResult = this.executeTraversal(query.traversal);
            focusPath = traversalResult;
            // Intersect with current results
            const traversalSet = new Set(traversalResult);
            nodeIds = nodeIds.filter((id) => traversalSet.has(id));
        }

        // Apply comparison/join
        if (query.comparePaths && query.comparePaths.length > 0) {
            nodeIds = this.applyPathComparison(nodeIds, query.comparePaths, query.join?.type ?? "union");
        }

        // Get total count before pagination
        const totalCount = nodeIds.length;

        // Apply sorting
        if (query.sortBy) {
            nodeIds = this.applySorting(nodeIds, query.sortBy, query.sortDirection ?? "asc");
        }

        // Apply pagination
        if (query.offset !== undefined && query.offset > 0) {
            nodeIds = nodeIds.slice(query.offset);
        }
        if (query.limit !== undefined && query.limit > 0) {
            nodeIds = nodeIds.slice(0, query.limit);
        }

        // Calculate stats
        const stats = this.calculateStats(nodeIds);

        return {
            query,
            nodeIds,
            totalCount,
            stats,
            isFocused: query.focusMode ?? false,
            focusPath,
        };
    }

    // ========================================================================
    // FILTER METHODS
    // ========================================================================

    private applyCategoryFilter(nodeIds: string[], category: string): string[] {
        return nodeIds.filter((id) => {
            const node = this.dataSource.getNodeById(id);
            return node?.category === category;
        });
    }

    private applyStatusFilter(
        nodeIds: string[],
        status: string | string[]
    ): string[] {
        const statuses = Array.isArray(status) ? status : [status];
        return nodeIds.filter((id) => {
            const node = this.dataSource.getNodeById(id);
            return node && statuses.includes(node.status);
        });
    }

    private applyProgressionFilter(
        nodeIds: string[],
        progressionLevel: number | number[]
    ): string[] {
        const levels = Array.isArray(progressionLevel)
            ? progressionLevel
            : [progressionLevel];
        return nodeIds.filter((id) => {
            const node = this.dataSource.getNodeById(id);
            return node && levels.includes(node.progressionLevel);
        });
    }

    private applySearchFilter(nodeIds: string[], search: string): string[] {
        const searchLower = search.toLowerCase();
        return nodeIds.filter((id) => {
            const node = this.dataSource.getNodeById(id);
            if (!node) return false;
            return (
                node.name.toLowerCase().includes(searchLower) ||
                node.description.toLowerCase().includes(searchLower) ||
                node.skills.some((s) => s.toLowerCase().includes(searchLower))
            );
        });
    }

    private applyFilterGroup(nodeIds: string[], group: FilterGroup): string[] {
        if (group.clauses.length === 0) return nodeIds;

        const results = group.clauses.map((clause) => {
            if ("operator" in clause && "clauses" in clause) {
                // Nested group
                return this.applyFilterGroup(nodeIds, clause as FilterGroup);
            } else {
                // Single clause
                return this.applyFilterClause(nodeIds, clause as FilterClause);
            }
        });

        if (group.operator === "and") {
            // Intersection of all results
            return results.reduce((acc, curr) => {
                const currSet = new Set(curr);
                return acc.filter((id) => currSet.has(id));
            });
        } else {
            // Union of all results
            const unionSet = new Set<string>();
            results.forEach((r) => r.forEach((id) => unionSet.add(id)));
            return nodeIds.filter((id) => unionSet.has(id));
        }
    }

    private applyFilterClause(
        nodeIds: string[],
        clause: FilterClause
    ): string[] {
        return nodeIds.filter((id) => {
            const node = this.dataSource.getNodeById(id);
            if (!node) return false;

            const nodeValue = this.getNodeFieldValue(node, clause.field);
            return this.evaluateComparison(nodeValue, clause.operator, clause.value);
        });
    }

    private getNodeFieldValue(
        node: GraphNode<TMetadata>,
        field: string
    ): unknown {
        // Support nested fields with dot notation
        const parts = field.split(".");
        let value: unknown = node;
        for (const part of parts) {
            if (value === null || value === undefined) return undefined;
            value = (value as Record<string, unknown>)[part];
        }
        return value;
    }

    private evaluateComparison(
        nodeValue: unknown,
        operator: ComparisonOperator,
        compareValue: unknown
    ): boolean {
        switch (operator) {
            case "eq":
                return nodeValue === compareValue;
            case "neq":
                return nodeValue !== compareValue;
            case "in":
                return Array.isArray(compareValue) && compareValue.includes(nodeValue);
            case "nin":
                return Array.isArray(compareValue) && !compareValue.includes(nodeValue);
            case "gt":
                return typeof nodeValue === "number" && typeof compareValue === "number" && nodeValue > compareValue;
            case "gte":
                return typeof nodeValue === "number" && typeof compareValue === "number" && nodeValue >= compareValue;
            case "lt":
                return typeof nodeValue === "number" && typeof compareValue === "number" && nodeValue < compareValue;
            case "lte":
                return typeof nodeValue === "number" && typeof compareValue === "number" && nodeValue <= compareValue;
            default:
                return false;
        }
    }

    // ========================================================================
    // TRAVERSAL METHODS (Focus Mode)
    // ========================================================================

    /**
     * Execute a BFS/DFS traversal from a starting node.
     * This implements VariantD's focus mode.
     */
    executeTraversal(spec: TraversalSpec): string[] {
        const { startNodeId, direction, maxDepth, edgeTypes, includeStart } = spec;

        const visited = new Set<string>();
        const queue: Array<{ id: string; depth: number }> = [{ id: startNodeId, depth: 0 }];
        const result: string[] = [];

        if (!includeStart) {
            visited.add(startNodeId);
        }

        while (queue.length > 0) {
            const { id, depth } = queue.shift()!;

            if (visited.has(id)) continue;
            visited.add(id);

            if (includeStart || id !== startNodeId) {
                result.push(id);
            }

            // Don't traverse deeper if we've hit max depth
            if (maxDepth !== -1 && depth >= maxDepth) continue;

            // Get edges to follow
            const edges = this.getEdgesForTraversal(id, direction);

            // Filter by edge type if specified
            const filteredEdges = edgeTypes && edgeTypes.length > 0
                ? edges.filter((e) => edgeTypes.includes(e.type))
                : edges;

            // Add connected nodes to queue
            for (const edge of filteredEdges) {
                const nextId = edge.from === id ? edge.to : edge.from;
                if (!visited.has(nextId)) {
                    queue.push({ id: nextId, depth: depth + 1 });
                }
            }
        }

        return result;
    }

    private getEdgesForTraversal(
        nodeId: string,
        direction: "up" | "down" | "both"
    ): GraphEdge[] {
        const allEdges = this.dataSource.getEdges();

        switch (direction) {
            case "up":
                // Prerequisites (edges pointing TO this node)
                return allEdges.filter((e) => e.to === nodeId);
            case "down":
                // Dependents (edges pointing FROM this node)
                return allEdges.filter((e) => e.from === nodeId);
            case "both":
            default:
                return allEdges.filter((e) => e.from === nodeId || e.to === nodeId);
        }
    }

    // ========================================================================
    // JOIN/COMPARISON METHODS
    // ========================================================================

    /**
     * Apply path comparison (JOIN operation).
     * This implements the comparison modal functionality.
     */
    private applyPathComparison(
        nodeIds: string[],
        pathIds: string[],
        joinType: "union" | "intersection" | "difference"
    ): string[] {
        // For path comparison, we want to include nodes from all selected paths
        // and their connected subgraphs

        const pathNodeSets = pathIds.map((pathId) => {
            // Get the path node and its connected nodes
            const connectedNodes = new Set<string>([pathId]);

            // Add prerequisites and dependents
            const prereqs = this.dataSource.getPrerequisites(pathId);
            const deps = this.dataSource.getDependents(pathId);

            prereqs.forEach((n) => connectedNodes.add(n.id));
            deps.forEach((n) => connectedNodes.add(n.id));

            return connectedNodes;
        });

        let resultSet: Set<string>;

        switch (joinType) {
            case "union":
                resultSet = new Set<string>();
                pathNodeSets.forEach((set) => set.forEach((id) => resultSet.add(id)));
                break;

            case "intersection":
                if (pathNodeSets.length === 0) {
                    resultSet = new Set<string>();
                } else {
                    resultSet = new Set(pathNodeSets[0]);
                    for (let i = 1; i < pathNodeSets.length; i++) {
                        resultSet = new Set(
                            [...resultSet].filter((id) => pathNodeSets[i].has(id))
                        );
                    }
                }
                break;

            case "difference":
                if (pathNodeSets.length === 0) {
                    resultSet = new Set<string>();
                } else {
                    resultSet = new Set(pathNodeSets[0]);
                    for (let i = 1; i < pathNodeSets.length; i++) {
                        pathNodeSets[i].forEach((id) => resultSet.delete(id));
                    }
                }
                break;

            default:
                resultSet = new Set<string>();
        }

        // Intersect with existing nodeIds
        return nodeIds.filter((id) => resultSet.has(id));
    }

    // ========================================================================
    // SORTING METHODS
    // ========================================================================

    private applySorting(
        nodeIds: string[],
        sortBy: "progression" | "name" | "hours" | "status",
        direction: "asc" | "desc"
    ): string[] {
        const nodes = nodeIds
            .map((id) => this.dataSource.getNodeById(id))
            .filter((n): n is GraphNode<TMetadata> => n !== undefined);

        const sorted = [...nodes].sort((a, b) => {
            let comparison: number;

            switch (sortBy) {
                case "progression":
                    comparison = a.progressionLevel - b.progressionLevel;
                    break;
                case "name":
                    comparison = a.name.localeCompare(b.name);
                    break;
                case "hours":
                    comparison = a.estimatedHours - b.estimatedHours;
                    break;
                case "status":
                    const statusOrder = { completed: 0, in_progress: 1, available: 2, locked: 3 };
                    comparison = statusOrder[a.status] - statusOrder[b.status];
                    break;
                default:
                    comparison = 0;
            }

            return direction === "desc" ? -comparison : comparison;
        });

        return sorted.map((n) => n.id);
    }

    // ========================================================================
    // STATS METHODS
    // ========================================================================

    private calculateStats(nodeIds: string[]): ViewQueryResult<TMetadata>["stats"] {
        const nodes = nodeIds
            .map((id) => this.dataSource.getNodeById(id))
            .filter((n): n is GraphNode<TMetadata> => n !== undefined);

        return {
            totalNodes: nodes.length,
            completedNodes: nodes.filter((n) => n.status === "completed").length,
            inProgressNodes: nodes.filter((n) => n.status === "in_progress").length,
            availableNodes: nodes.filter((n) => n.status === "available").length,
            lockedNodes: nodes.filter((n) => n.status === "locked").length,
            totalHours: nodes.reduce((sum, n) => sum + n.estimatedHours, 0),
        };
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a QueryExecutor for a given data source
 */
export function createQueryExecutor<T = Record<string, unknown>>(
    dataSource: GraphDataSource<T>
): QueryExecutor<T> {
    return new QueryExecutor(dataSource);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Execute a query directly against a data source
 */
export function executeQuery<T = Record<string, unknown>>(
    dataSource: GraphDataSource<T>,
    query: ViewQuery
): ViewQueryResult<T> {
    return new QueryExecutor(dataSource).execute(query);
}

/**
 * Get nodes matching a query
 */
export function getNodesForQuery<T = Record<string, unknown>>(
    dataSource: GraphDataSource<T>,
    query: ViewQuery
): GraphNode<T>[] {
    const result = executeQuery(dataSource, query);
    return result.nodeIds
        .map((id) => dataSource.getNodeById(id))
        .filter((n): n is GraphNode<T> => n !== undefined);
}
