/**
 * ViewQuery Type System
 *
 * Treats views as queries on the learning graph. Each variant's filter +
 * selection + viewport state implicitly defines a query on the GraphDataSource.
 *
 * This module makes this concept explicit:
 * - VariantB's categoryFilter is a WHERE clause
 * - VariantD's focusMode is a graph traversal (BFS)
 * - The comparison modal is a JOIN of multiple paths
 *
 * Benefits:
 * - Query composition (filter + focus + skill-gap)
 * - Query serialization (shareable URLs encode the query)
 * - Consistent filtering across all variants
 */

import type { GraphNodeStatus, ProgressionLevel } from "../graphDataSource";

// ============================================================================
// QUERY CLAUSE TYPES
// ============================================================================

/**
 * Comparison operators for filter clauses
 */
export type ComparisonOperator = "eq" | "neq" | "in" | "nin" | "gt" | "gte" | "lt" | "lte";

/**
 * A single filter condition
 */
export interface FilterClause {
    /** The field to filter on */
    field: string;
    /** The comparison operator */
    operator: ComparisonOperator;
    /** The value(s) to compare against */
    value: unknown;
}

/**
 * Logical operators for combining clauses
 */
export type LogicalOperator = "and" | "or";

/**
 * A group of filter clauses combined with a logical operator
 */
export interface FilterGroup {
    /** How to combine the clauses */
    operator: LogicalOperator;
    /** The clauses or nested groups */
    clauses: (FilterClause | FilterGroup)[];
}

// ============================================================================
// TRAVERSAL TYPES
// ============================================================================

/**
 * Direction for graph traversal
 */
export type TraversalDirection = "up" | "down" | "both";

/**
 * Graph traversal specification (for focus mode, path finding, etc.)
 */
export interface TraversalSpec {
    /** Starting node ID for the traversal */
    startNodeId: string;
    /** Direction of traversal */
    direction: TraversalDirection;
    /** Maximum depth to traverse (-1 for unlimited) */
    maxDepth: number;
    /** Edge types to follow (empty = all) */
    edgeTypes?: string[];
    /** Whether to include the start node in results */
    includeStart: boolean;
}

// ============================================================================
// JOIN TYPES (for path comparison)
// ============================================================================

/**
 * Type of join operation
 */
export type JoinType = "union" | "intersection" | "difference";

/**
 * Join specification for combining multiple queries
 */
export interface JoinSpec {
    /** Type of join */
    type: JoinType;
    /** Query IDs or inline queries to join */
    queries: (string | ViewQuery)[];
}

// ============================================================================
// VIEWPORT/SELECTION STATE
// ============================================================================

/**
 * Viewport state for spatial views
 */
export interface ViewportState {
    /** Horizontal translation */
    translateX: number;
    /** Vertical translation */
    translateY: number;
    /** Zoom scale (1 = 100%) */
    scale: number;
}

/**
 * Selection state
 */
export interface SelectionState {
    /** Currently selected node IDs */
    selectedIds: string[];
    /** Currently hovered node ID */
    hoveredId: string | null;
    /** Focused node ID (for focus mode) */
    focusedId: string | null;
}

// ============================================================================
// VIEW QUERY TYPE
// ============================================================================

/**
 * The ViewQuery type - represents a complete query on the learning graph.
 *
 * A view is a query that can be:
 * - Composed with other queries
 * - Serialized to a URL
 * - Shared between users
 * - Saved as a named view
 */
export interface ViewQuery {
    /** Unique identifier for this query */
    id?: string;

    /** Human-readable name for this query */
    name?: string;

    /** Query version for compatibility */
    version: 1;

    // ========================================================================
    // FILTER CLAUSES (WHERE)
    // ========================================================================

    /**
     * Category filter - equivalent to a WHERE category = x clause
     * VariantB and VariantD both use this
     */
    category?: string | null;

    /**
     * Status filter - filter by node completion status
     */
    status?: GraphNodeStatus | GraphNodeStatus[] | null;

    /**
     * Progression level filter
     */
    progressionLevel?: ProgressionLevel | ProgressionLevel[] | null;

    /**
     * Search query - text search across node names and descriptions
     */
    search?: string | null;

    /**
     * Advanced filter groups (for complex queries)
     */
    filters?: FilterGroup | null;

    // ========================================================================
    // GRAPH TRAVERSAL (for focus mode, path isolation)
    // ========================================================================

    /**
     * Traversal specification for focus mode
     * When set, only nodes reachable via this traversal are shown
     */
    traversal?: TraversalSpec | null;

    /**
     * Focus mode flag - enables path isolation
     * VariantD's focusMode uses this
     */
    focusMode?: boolean;

    /**
     * Skill gap mode - shows mastery levels
     */
    skillGapMode?: boolean;

    // ========================================================================
    // JOIN/COMPARISON (for path comparison modal)
    // ========================================================================

    /**
     * Join specification for combining multiple queries
     * The comparison modal uses this to JOIN multiple paths
     */
    join?: JoinSpec | null;

    /**
     * IDs of paths being compared
     */
    comparePaths?: string[] | null;

    // ========================================================================
    // VIEWPORT & SELECTION STATE
    // ========================================================================

    /**
     * Viewport state (for spatial views like Knowledge Map)
     */
    viewport?: ViewportState | null;

    /**
     * Selection state
     */
    selection?: SelectionState | null;

    // ========================================================================
    // SORTING & PAGINATION
    // ========================================================================

    /**
     * Sort field
     */
    sortBy?: "progression" | "name" | "hours" | "status" | null;

    /**
     * Sort direction
     */
    sortDirection?: "asc" | "desc";

    /**
     * Pagination offset
     */
    offset?: number;

    /**
     * Pagination limit (-1 for no limit)
     */
    limit?: number;
}

// ============================================================================
// QUERY RESULT TYPE
// ============================================================================

/**
 * Result of executing a ViewQuery
 */
export interface ViewQueryResult<TMetadata = Record<string, unknown>> {
    /** The query that was executed */
    query: ViewQuery;

    /** Matching node IDs */
    nodeIds: string[];

    /** Total count before pagination */
    totalCount: number;

    /** Statistics about the result set */
    stats: {
        totalNodes: number;
        completedNodes: number;
        inProgressNodes: number;
        availableNodes: number;
        lockedNodes: number;
        totalHours: number;
    };

    /** Whether focus mode is active */
    isFocused: boolean;

    /** The traversal path if focus mode is active */
    focusPath?: string[];
}

// ============================================================================
// QUERY BUILDER HELPERS
// ============================================================================

/**
 * Create a default empty query
 */
export function createEmptyQuery(): ViewQuery {
    return {
        version: 1,
        sortDirection: "asc",
        limit: -1,
        offset: 0,
    };
}

/**
 * Create a category filter query
 */
export function createCategoryQuery(category: string): ViewQuery {
    return {
        ...createEmptyQuery(),
        category,
    };
}

/**
 * Create a focus mode query (BFS traversal from a node)
 */
export function createFocusQuery(nodeId: string): ViewQuery {
    return {
        ...createEmptyQuery(),
        focusMode: true,
        traversal: {
            startNodeId: nodeId,
            direction: "both",
            maxDepth: -1,
            includeStart: true,
        },
    };
}

/**
 * Create a comparison query (JOIN of multiple paths)
 */
export function createComparisonQuery(pathIds: string[]): ViewQuery {
    return {
        ...createEmptyQuery(),
        comparePaths: pathIds,
        join: {
            type: "union",
            queries: pathIds,
        },
    };
}

/**
 * Create a skill gap mode query
 */
export function createSkillGapQuery(category?: string): ViewQuery {
    return {
        ...createEmptyQuery(),
        skillGapMode: true,
        category: category ?? null,
    };
}

/**
 * Compose two queries (AND combination)
 */
export function composeQueries(base: ViewQuery, ...extensions: Partial<ViewQuery>[]): ViewQuery {
    return extensions.reduce<ViewQuery>(
        (acc, ext) => ({
            ...acc,
            ...ext,
            // Ensure version is preserved
            version: 1,
            // Merge filters if both have them
            filters: acc.filters && ext.filters
                ? { operator: "and" as const, clauses: [acc.filters, ext.filters] }
                : acc.filters ?? ext.filters ?? null,
        }),
        base
    );
}

/**
 * Check if a query has any active filters
 */
export function hasActiveFilters(query: ViewQuery): boolean {
    return !!(
        query.category ||
        query.status ||
        query.progressionLevel ||
        query.search ||
        query.filters ||
        query.traversal ||
        query.focusMode ||
        query.skillGapMode ||
        query.comparePaths?.length
    );
}
