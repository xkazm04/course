/**
 * ViewQuery System
 *
 * Treats views as queries on the learning graph. This module provides:
 *
 * - ViewQuery type: Declarative representation of view state
 * - QueryExecutor: Executes queries against GraphDataSource
 * - Serialization: URL encoding for shareable views
 * - React Hooks: State management and URL sync
 *
 * Key insight: Each variant's filter + selection + viewport state
 * implicitly defines a query on the GraphDataSource.
 *
 * - VariantB's categoryFilter is a WHERE clause
 * - VariantD's focusMode is a graph traversal (BFS)
 * - The comparison modal is a JOIN of multiple paths
 *
 * This module makes these concepts explicit and composable.
 */

// Types
export * from "./types";

// Query Executor
export {
    QueryExecutor,
    createQueryExecutor,
    executeQuery,
    getNodesForQuery,
} from "./QueryExecutor";

// Serialization
export {
    serializeQueryToParams,
    serializeQueryToUrl,
    deserializeParamsToQuery,
    deserializeUrlToQuery,
    getQueryFromCurrentUrl,
    updateUrlWithQuery,
    generateShareableUrl,
    areQueriesEqual,
    getQueryDiff,
} from "./serialization";

// React Hooks
export {
    useViewQuery,
    useUrlSyncedQuery,
    useComposedQuery,
    useFocusQuery,
    useCategoryQuery,
    variantStateToQuery,
    queryToVariantState,
    type UseViewQueryOptions,
    type UseViewQueryReturn,
} from "./useViewQuery";
