/**
 * useViewQuery - React Hooks for ViewQuery System
 *
 * Provides React hooks for:
 * - Managing ViewQuery state
 * - URL synchronization (shareable views)
 * - Query execution against GraphDataSource
 * - Query composition
 */

"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { GraphDataSource, GraphNode } from "../graphDataSource";
import type { ViewQuery, ViewQueryResult, ViewportState, SelectionState } from "./types";
import { createEmptyQuery, composeQueries, hasActiveFilters, createFocusQuery, createSkillGapQuery, createCategoryQuery } from "./types";
import { QueryExecutor, executeQuery, getNodesForQuery } from "./QueryExecutor";
import {
    serializeQueryToUrl,
    deserializeParamsToQuery,
    getQueryFromCurrentUrl,
    updateUrlWithQuery,
    generateShareableUrl,
    areQueriesEqual,
} from "./serialization";

// ============================================================================
// CORE QUERY HOOK
// ============================================================================

export interface UseViewQueryOptions<T = Record<string, unknown>> {
    /** The GraphDataSource to query against */
    dataSource: GraphDataSource<T>;
    /** Initial query state */
    initialQuery?: ViewQuery;
    /** Whether to sync query to URL */
    syncToUrl?: boolean;
    /** Whether to initialize from URL params */
    initFromUrl?: boolean;
    /** Callback when query changes */
    onQueryChange?: (query: ViewQuery, result: ViewQueryResult<T>) => void;
}

export interface UseViewQueryReturn<T = Record<string, unknown>> {
    /** Current query state */
    query: ViewQuery;
    /** Query execution result */
    result: ViewQueryResult<T>;
    /** Nodes matching the query */
    nodes: GraphNode<T>[];
    /** Whether any filters are active */
    hasFilters: boolean;

    // Query mutations
    /** Set the entire query */
    setQuery: (query: ViewQuery) => void;
    /** Update specific query fields */
    updateQuery: (updates: Partial<ViewQuery>) => void;
    /** Reset to empty query */
    resetQuery: () => void;

    // Common filter shortcuts
    /** Set category filter */
    setCategory: (category: string | null) => void;
    /** Set search filter */
    setSearch: (search: string | null) => void;
    /** Toggle focus mode for a node */
    toggleFocusMode: (nodeId: string | null) => void;
    /** Toggle skill gap mode */
    toggleSkillGapMode: () => void;
    /** Set comparison paths */
    setComparePaths: (pathIds: string[]) => void;

    // Viewport/selection shortcuts
    /** Update viewport state */
    setViewport: (viewport: ViewportState) => void;
    /** Update selection state */
    setSelection: (selection: Partial<SelectionState>) => void;
    /** Select a node */
    selectNode: (nodeId: string) => void;
    /** Clear selection */
    clearSelection: () => void;

    // URL/sharing
    /** Get shareable URL for current query */
    getShareableUrl: () => string;
    /** Load query from URL params */
    loadFromUrl: () => void;
}

/**
 * Core hook for managing ViewQuery state and execution
 */
export function useViewQuery<T = Record<string, unknown>>(
    options: UseViewQueryOptions<T>
): UseViewQueryReturn<T> {
    const {
        dataSource,
        initialQuery,
        syncToUrl = false,
        initFromUrl = false,
        onQueryChange,
    } = options;

    // Initialize query state
    const [query, setQueryState] = useState<ViewQuery>(() => {
        if (initFromUrl && typeof window !== "undefined") {
            const urlQuery = getQueryFromCurrentUrl();
            if (hasActiveFilters(urlQuery)) {
                return urlQuery;
            }
        }
        return initialQuery ?? createEmptyQuery();
    });

    // Create executor
    const executor = useMemo(
        () => new QueryExecutor<T>(dataSource),
        [dataSource]
    );

    // Execute query
    const result = useMemo(() => executor.execute(query), [executor, query]);

    // Get matching nodes
    const nodes = useMemo(
        () => getNodesForQuery(dataSource, query),
        [dataSource, query]
    );

    // Track if we have active filters
    const hasFilters = useMemo(() => hasActiveFilters(query), [query]);

    // Ref to track if we should skip the next URL update (to prevent loops)
    const skipUrlUpdate = useRef(false);

    // Sync to URL when query changes
    useEffect(() => {
        if (syncToUrl && !skipUrlUpdate.current) {
            updateUrlWithQuery(query, { replace: true });
        }
        skipUrlUpdate.current = false;
    }, [query, syncToUrl]);

    // Listen for popstate events (browser back/forward)
    useEffect(() => {
        if (!syncToUrl) return;

        const handlePopState = () => {
            skipUrlUpdate.current = true;
            const urlQuery = getQueryFromCurrentUrl();
            setQueryState(urlQuery);
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [syncToUrl]);

    // Notify on query change
    useEffect(() => {
        onQueryChange?.(query, result);
    }, [query, result, onQueryChange]);

    // ========================================================================
    // QUERY MUTATIONS
    // ========================================================================

    const setQuery = useCallback((newQuery: ViewQuery) => {
        setQueryState(newQuery);
    }, []);

    const updateQuery = useCallback((updates: Partial<ViewQuery>) => {
        setQueryState((prev) => ({ ...prev, ...updates }));
    }, []);

    const resetQuery = useCallback(() => {
        setQueryState(createEmptyQuery());
    }, []);

    // ========================================================================
    // FILTER SHORTCUTS
    // ========================================================================

    const setCategory = useCallback((category: string | null) => {
        setQueryState((prev) => ({ ...prev, category }));
    }, []);

    const setSearch = useCallback((search: string | null) => {
        setQueryState((prev) => ({ ...prev, search }));
    }, []);

    const toggleFocusMode = useCallback((nodeId: string | null) => {
        setQueryState((prev) => {
            if (!nodeId || (prev.focusMode && prev.traversal?.startNodeId === nodeId)) {
                // Turn off focus mode
                return { ...prev, focusMode: false, traversal: null };
            }
            // Turn on focus mode for this node
            return {
                ...prev,
                focusMode: true,
                traversal: {
                    startNodeId: nodeId,
                    direction: "both",
                    maxDepth: -1,
                    includeStart: true,
                },
            };
        });
    }, []);

    const toggleSkillGapMode = useCallback(() => {
        setQueryState((prev) => ({ ...prev, skillGapMode: !prev.skillGapMode }));
    }, []);

    const setComparePaths = useCallback((pathIds: string[]) => {
        setQueryState((prev) => ({
            ...prev,
            comparePaths: pathIds.length > 0 ? pathIds : null,
            join: pathIds.length > 0
                ? { type: "union", queries: pathIds }
                : null,
        }));
    }, []);

    // ========================================================================
    // VIEWPORT/SELECTION SHORTCUTS
    // ========================================================================

    const setViewport = useCallback((viewport: ViewportState) => {
        setQueryState((prev) => ({ ...prev, viewport }));
    }, []);

    const setSelection = useCallback((selection: Partial<SelectionState>) => {
        setQueryState((prev) => ({
            ...prev,
            selection: {
                selectedIds: [],
                hoveredId: null,
                focusedId: null,
                ...prev.selection,
                ...selection,
            },
        }));
    }, []);

    const selectNode = useCallback((nodeId: string) => {
        setQueryState((prev) => ({
            ...prev,
            selection: {
                selectedIds: [nodeId],
                hoveredId: null,
                focusedId: nodeId,
                ...prev.selection,
            },
        }));
    }, []);

    const clearSelection = useCallback(() => {
        setQueryState((prev) => ({
            ...prev,
            selection: {
                selectedIds: [],
                hoveredId: null,
                focusedId: null,
            },
        }));
    }, []);

    // ========================================================================
    // URL/SHARING
    // ========================================================================

    const getShareableUrl = useCallback(() => {
        return generateShareableUrl(query);
    }, [query]);

    const loadFromUrl = useCallback(() => {
        skipUrlUpdate.current = true;
        setQueryState(getQueryFromCurrentUrl());
    }, []);

    return {
        query,
        result,
        nodes,
        hasFilters,
        setQuery,
        updateQuery,
        resetQuery,
        setCategory,
        setSearch,
        toggleFocusMode,
        toggleSkillGapMode,
        setComparePaths,
        setViewport,
        setSelection,
        selectNode,
        clearSelection,
        getShareableUrl,
        loadFromUrl,
    };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook specifically for URL-synced view queries
 */
export function useUrlSyncedQuery<T = Record<string, unknown>>(
    dataSource: GraphDataSource<T>
): UseViewQueryReturn<T> {
    return useViewQuery({
        dataSource,
        syncToUrl: true,
        initFromUrl: true,
    });
}

/**
 * Hook for composing multiple queries
 */
export function useComposedQuery<T = Record<string, unknown>>(
    dataSource: GraphDataSource<T>,
    baseQuery: ViewQuery,
    ...extensions: Partial<ViewQuery>[]
): ViewQueryResult<T> {
    const composedQuery = useMemo(
        () => composeQueries(baseQuery, ...extensions),
        [baseQuery, ...extensions]
    );

    return useMemo(
        () => executeQuery(dataSource, composedQuery),
        [dataSource, composedQuery]
    );
}

/**
 * Hook for focus mode (BFS traversal from a node)
 */
export function useFocusQuery<T = Record<string, unknown>>(
    dataSource: GraphDataSource<T>,
    focusNodeId: string | null,
    enabled: boolean = true
): {
    focusedNodeIds: Set<string> | undefined;
    isFocused: boolean;
} {
    const result = useMemo(() => {
        if (!enabled || !focusNodeId) {
            return { focusedNodeIds: undefined, isFocused: false };
        }

        const query = createFocusQuery(focusNodeId);
        const result = executeQuery(dataSource, query);

        return {
            focusedNodeIds: new Set(result.nodeIds),
            isFocused: true,
        };
    }, [dataSource, focusNodeId, enabled]);

    return result;
}

/**
 * Hook for category filtering
 */
export function useCategoryQuery<T = Record<string, unknown>>(
    dataSource: GraphDataSource<T>,
    category: string | null
): {
    nodes: GraphNode<T>[];
    result: ViewQueryResult<T>;
} {
    const queryResult = useMemo(() => {
        if (!category) {
            return executeQuery(dataSource, createEmptyQuery());
        }
        return executeQuery(dataSource, createCategoryQuery(category));
    }, [dataSource, category]);

    const nodes = useMemo(
        () =>
            queryResult.nodeIds
                .map((id) => dataSource.getNodeById(id))
                .filter((n): n is GraphNode<T> => n !== undefined),
        [dataSource, queryResult.nodeIds]
    );

    return { nodes, result: queryResult };
}

// ============================================================================
// QUERY STATE FROM VARIANT STATE
// ============================================================================

/**
 * Convert variant-specific state to a ViewQuery.
 * This helps migrate existing variants to the query system.
 */
export function variantStateToQuery(state: {
    categoryFilter?: string | null;
    focusMode?: boolean;
    focusNodeId?: string | null;
    skillGapMode?: boolean;
    comparePaths?: string[];
    viewport?: ViewportState;
    selectedNodeId?: string | null;
}): ViewQuery {
    const query = createEmptyQuery();

    if (state.categoryFilter) {
        query.category = state.categoryFilter;
    }

    if (state.focusMode && state.focusNodeId) {
        query.focusMode = true;
        query.traversal = {
            startNodeId: state.focusNodeId,
            direction: "both",
            maxDepth: -1,
            includeStart: true,
        };
    }

    if (state.skillGapMode) {
        query.skillGapMode = true;
    }

    if (state.comparePaths && state.comparePaths.length > 0) {
        query.comparePaths = state.comparePaths;
        query.join = { type: "union", queries: state.comparePaths };
    }

    if (state.viewport) {
        query.viewport = state.viewport;
    }

    if (state.selectedNodeId) {
        query.selection = {
            selectedIds: [state.selectedNodeId],
            hoveredId: null,
            focusedId: state.selectedNodeId,
        };
    }

    return query;
}

/**
 * Convert a ViewQuery back to variant-specific state.
 * This helps variants consume query state.
 */
export function queryToVariantState(query: ViewQuery): {
    categoryFilter: string | null;
    focusMode: boolean;
    focusNodeId: string | null;
    skillGapMode: boolean;
    comparePaths: string[];
    viewport: ViewportState | null;
    selectedNodeId: string | null;
} {
    return {
        categoryFilter: query.category ?? null,
        focusMode: query.focusMode ?? false,
        focusNodeId: query.traversal?.startNodeId ?? null,
        skillGapMode: query.skillGapMode ?? false,
        comparePaths: query.comparePaths ?? [],
        viewport: query.viewport ?? null,
        selectedNodeId: query.selection?.focusedId ?? query.selection?.selectedIds?.[0] ?? null,
    };
}
