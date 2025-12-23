/**
 * React Hooks for GraphDataSource
 *
 * Provides convenient React hooks for using graph data sources in components.
 * These hooks make variants into pure renderers that work with any data source.
 *
 * UNIFIED PROGRESSION COORDINATE SYSTEM:
 * These hooks now expose progression-aware methods that provide consistent
 * sorting and grouping across all visualizations:
 * - sortedByProgression: Nodes sorted by learning journey position
 * - groupedByProgression: Nodes grouped by progression level
 * - getProgressionLabel: Get display label for a node's level
 */

import { useMemo, useCallback } from "react";
import {
    GraphDataSource,
    GraphNode,
    GraphNodeFilter,
    GraphStats,
    GraphEdgeRendering,
    type ProgressionLevel,
    getProgressionLabel,
    getProgressionMeta,
    PROGRESSION_LEVELS,
} from "./graphDataSource";
import {
    getLearningPathDataSource,
    getCurriculumDataSource,
    LearningPathGraphDataSource,
    CurriculumGraphDataSource,
    LearningPathNodeMeta,
    CurriculumNodeMeta,
} from "./graphDataSourceAdapters";

// ============================================================================
// GENERIC GRAPH DATA SOURCE HOOK
// ============================================================================

/**
 * Options for useGraphData hook
 */
export interface UseGraphDataOptions<T> {
    /** The graph data source to use */
    source: GraphDataSource<T>;

    /** Optional filter to apply to nodes */
    filter?: GraphNodeFilter;
}

/**
 * Return type for useGraphData hook
 */
export interface UseGraphDataResult<T> {
    /** Filtered nodes */
    nodes: GraphNode<T>[];

    /** All edges */
    edges: GraphEdgeRendering[];

    /** Graph statistics */
    stats: GraphStats;

    /** Get a node by ID */
    getNodeById: (id: string) => GraphNode<T> | undefined;

    /** Get prerequisites for a node */
    getPrerequisites: (nodeId: string) => GraphNode<T>[];

    /** Get dependents of a node */
    getDependents: (nodeId: string) => GraphNode<T>[];

    /** All available categories */
    categories: string[];

    // ========================================================================
    // PROGRESSION COORDINATE SYSTEM
    // ========================================================================

    /**
     * Nodes sorted by progression level (foundation first, expert last).
     * This is the unified way to sort nodes across all visualizations.
     */
    sortedByProgression: GraphNode<T>[];

    /**
     * Nodes grouped by progression level.
     * Useful for rendering level-based sections or tiers.
     */
    groupedByProgression: Map<ProgressionLevel, GraphNode<T>[]>;

    /**
     * Get the display label for a node's progression level
     */
    getNodeProgressionLabel: (nodeId: string) => string;

    /**
     * Get full progression metadata for a node
     */
    getNodeProgressionMeta: (nodeId: string) => ReturnType<typeof getProgressionMeta> | null;
}

/**
 * Generic hook for working with any GraphDataSource
 */
export function useGraphData<T = Record<string, unknown>>(
    options: UseGraphDataOptions<T>
): UseGraphDataResult<T> {
    const { source, filter } = options;

    const nodes = useMemo(() => source.getNodes(filter), [source, filter]);

    const edges = useMemo(() => source.getEdgesForRendering(), [source]);

    const stats = useMemo(() => source.getStats(filter), [source, filter]);

    const categories = useMemo(() => source.getCategories(), [source]);

    const getNodeById = useCallback(
        (id: string) => source.getNodeById(id),
        [source]
    );

    const getPrerequisites = useCallback(
        (nodeId: string) => source.getPrerequisites(nodeId),
        [source]
    );

    const getDependents = useCallback(
        (nodeId: string) => source.getDependents(nodeId),
        [source]
    );

    // Progression coordinate system
    const sortedByProgression = useMemo(
        () => source.getNodesSortedByProgression(),
        [source]
    );

    const groupedByProgression = useMemo(
        () => source.getNodesGroupedByProgression(),
        [source]
    );

    const getNodeProgressionLabel = useCallback(
        (nodeId: string) => {
            const node = source.getNodeById(nodeId);
            if (!node) return "Unknown";
            return getProgressionLabel(node.progressionLevel);
        },
        [source]
    );

    const getNodeProgressionMeta = useCallback(
        (nodeId: string) => {
            const node = source.getNodeById(nodeId);
            if (!node) return null;
            return getProgressionMeta(node.progressionLevel);
        },
        [source]
    );

    return {
        nodes,
        edges,
        stats,
        getNodeById,
        getPrerequisites,
        getDependents,
        categories,
        sortedByProgression,
        groupedByProgression,
        getNodeProgressionLabel,
        getNodeProgressionMeta,
    };
}

// ============================================================================
// LEARNING PATH DATA SOURCE HOOKS
// ============================================================================

/**
 * Return type for useLearningPathData hook
 */
export interface UseLearningPathDataResult extends UseGraphDataResult<LearningPathNodeMeta> {
    /** Data source instance for advanced operations */
    dataSource: LearningPathGraphDataSource;

    /** Nodes sorted by hierarchy level */
    sortedByHierarchy: GraphNode<LearningPathNodeMeta>[];

    /** Entry point nodes */
    entryPoints: GraphNode<LearningPathNodeMeta>[];
}

/**
 * Hook for working with learning path data
 */
export function useLearningPathData(
    filter?: GraphNodeFilter
): UseLearningPathDataResult {
    const dataSource = useMemo(() => getLearningPathDataSource(), []);

    const baseResult = useGraphData<LearningPathNodeMeta>({
        source: dataSource,
        filter,
    });

    const sortedByHierarchy = useMemo(
        () => dataSource.getNodesSortedByHierarchy(),
        [dataSource]
    );

    const entryPoints = useMemo(() => dataSource.getEntryPoints(), [dataSource]);

    return {
        ...baseResult,
        dataSource,
        sortedByHierarchy,
        entryPoints,
    };
}

// ============================================================================
// CURRICULUM DATA SOURCE HOOKS
// ============================================================================

/**
 * Options for useCurriculumData hook
 */
export interface UseCurriculumDataOptions {
    /** Filter by category */
    category?: string;

    /** Additional node filter */
    filter?: GraphNodeFilter;
}

/**
 * Return type for useCurriculumData hook
 */
export interface UseCurriculumDataResult extends UseGraphDataResult<CurriculumNodeMeta> {
    /** Data source instance for advanced operations */
    dataSource: CurriculumGraphDataSource;

    /** Total node count in the curriculum */
    totalNodeCount: number;

    /** Category metadata */
    categoryMeta: ReturnType<CurriculumGraphDataSource["getCategoryMeta"]>;

    /** Get prerequisite chain for a node */
    getPrerequisiteChain: (nodeId: string) => GraphNode<CurriculumNodeMeta>[];
}

/**
 * Hook for working with curriculum data
 */
export function useCurriculumData(
    options: UseCurriculumDataOptions = {}
): UseCurriculumDataResult {
    const { category, filter: additionalFilter } = options;

    const dataSource = useMemo(() => getCurriculumDataSource(), []);

    // Combine category filter with additional filter
    const combinedFilter = useMemo((): GraphNodeFilter | undefined => {
        if (!category && !additionalFilter) return undefined;

        return {
            ...(additionalFilter || {}),
            ...(category ? { category } : {}),
        };
    }, [category, additionalFilter]);

    const baseResult = useGraphData<CurriculumNodeMeta>({
        source: dataSource,
        filter: combinedFilter,
    });

    const totalNodeCount = useMemo(
        () => dataSource.getTotalNodeCount(),
        [dataSource]
    );

    const categoryMeta = useMemo(
        () => dataSource.getCategoryMeta(),
        [dataSource]
    );

    const getPrerequisiteChain = useCallback(
        (nodeId: string) => dataSource.getPrerequisiteChain(nodeId),
        [dataSource]
    );

    return {
        ...baseResult,
        dataSource,
        totalNodeCount,
        categoryMeta,
        getPrerequisiteChain,
    };
}

// ============================================================================
// SELECTED NODE HOOK
// ============================================================================

/**
 * Hook for managing selected node state with graph context
 */
export function useSelectedNode<T>(
    source: GraphDataSource<T>,
    selectedId: string | null
) {
    const node = useMemo(() => {
        if (!selectedId) return null;
        return source.getNodeById(selectedId) ?? null;
    }, [source, selectedId]);

    const prerequisites = useMemo(() => {
        if (!selectedId) return [];
        return source.getPrerequisites(selectedId);
    }, [source, selectedId]);

    const dependents = useMemo(() => {
        if (!selectedId) return [];
        return source.getDependents(selectedId);
    }, [source, selectedId]);

    const connections = useMemo(() => {
        if (!selectedId) return [];
        return source.getConnections(selectedId);
    }, [source, selectedId]);

    return {
        node,
        prerequisites,
        dependents,
        connections,
        hasNode: node !== null,
    };
}

// ============================================================================
// RE-EXPORT PROGRESSION COORDINATE TYPES
// ============================================================================

export {
    type ProgressionLevel,
    type GraphNode,
    type GraphEdgeRendering,
    type GraphStats,
    PROGRESSION_LEVELS,
    getProgressionLabel,
    getProgressionMeta,
} from "./graphDataSource";

// Re-export adapter types for convenience
export { type LearningPathNodeMeta, type CurriculumNodeMeta } from "./graphDataSourceAdapters";
