/**
 * ViewQuery Serialization
 *
 * Provides URL serialization for ViewQueries, enabling:
 * - Shareable URLs that encode the current view state
 * - Deep linking to specific filtered/focused views
 * - Browser history integration
 *
 * Format:
 * Base URL params: ?view=<base64-encoded-query>
 * Or expanded params for common cases:
 *   ?cat=frontend&focus=node-123&gap=true
 */

import type { ViewQuery, ViewportState, SelectionState, TraversalSpec } from "./types";
import { createEmptyQuery } from "./types";

// ============================================================================
// URL PARAM KEYS
// ============================================================================

/**
 * Short param keys for URL encoding (to keep URLs compact)
 */
const PARAM_KEYS = {
    // Full encoded query (for complex queries)
    view: "v",
    // Common filters (expanded for readability)
    category: "cat",
    status: "st",
    progression: "pl",
    search: "q",
    // Focus mode
    focusMode: "focus",
    focusNode: "fn",
    // Skill gap mode
    skillGapMode: "gap",
    // Comparison
    comparePaths: "cmp",
    // Viewport
    viewportX: "vx",
    viewportY: "vy",
    viewportScale: "vs",
    // Selection
    selectedIds: "sel",
    // Sorting
    sortBy: "sort",
    sortDir: "dir",
} as const;

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Serialize a ViewQuery to URL search params
 */
export function serializeQueryToParams(query: ViewQuery): URLSearchParams {
    const params = new URLSearchParams();

    // Category
    if (query.category) {
        params.set(PARAM_KEYS.category, query.category);
    }

    // Status
    if (query.status) {
        const statuses = Array.isArray(query.status) ? query.status : [query.status];
        params.set(PARAM_KEYS.status, statuses.join(","));
    }

    // Progression level
    if (query.progressionLevel !== undefined && query.progressionLevel !== null) {
        const levels = Array.isArray(query.progressionLevel)
            ? query.progressionLevel
            : [query.progressionLevel];
        params.set(PARAM_KEYS.progression, levels.join(","));
    }

    // Search
    if (query.search) {
        params.set(PARAM_KEYS.search, query.search);
    }

    // Focus mode
    if (query.focusMode) {
        params.set(PARAM_KEYS.focusMode, "1");
        if (query.traversal?.startNodeId) {
            params.set(PARAM_KEYS.focusNode, query.traversal.startNodeId);
        }
    }

    // Skill gap mode
    if (query.skillGapMode) {
        params.set(PARAM_KEYS.skillGapMode, "1");
    }

    // Compare paths
    if (query.comparePaths && query.comparePaths.length > 0) {
        params.set(PARAM_KEYS.comparePaths, query.comparePaths.join(","));
    }

    // Viewport (rounded for shorter URLs)
    if (query.viewport) {
        params.set(PARAM_KEYS.viewportX, Math.round(query.viewport.translateX).toString());
        params.set(PARAM_KEYS.viewportY, Math.round(query.viewport.translateY).toString());
        params.set(PARAM_KEYS.viewportScale, query.viewport.scale.toFixed(2));
    }

    // Selected IDs
    if (query.selection?.selectedIds && query.selection.selectedIds.length > 0) {
        params.set(PARAM_KEYS.selectedIds, query.selection.selectedIds.join(","));
    }

    // Sorting
    if (query.sortBy) {
        params.set(PARAM_KEYS.sortBy, query.sortBy);
        if (query.sortDirection && query.sortDirection !== "asc") {
            params.set(PARAM_KEYS.sortDir, query.sortDirection);
        }
    }

    // For complex queries with advanced filters, encode the full query
    if (query.filters || query.join) {
        const fullQuery = encodeQueryToBase64(query);
        params.set(PARAM_KEYS.view, fullQuery);
    }

    return params;
}

/**
 * Serialize a ViewQuery to a URL string
 */
export function serializeQueryToUrl(query: ViewQuery, baseUrl?: string): string {
    const params = serializeQueryToParams(query);
    const paramString = params.toString();

    if (!paramString) {
        return baseUrl || "";
    }

    const base = baseUrl || (typeof window !== "undefined" ? window.location.pathname : "");
    return `${base}?${paramString}`;
}

/**
 * Encode a query to base64 for complex queries
 */
function encodeQueryToBase64(query: ViewQuery): string {
    try {
        const json = JSON.stringify(query);
        // Use URL-safe base64
        if (typeof window !== "undefined") {
            return btoa(json)
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=/g, "");
        }
        return Buffer.from(json).toString("base64url");
    } catch {
        return "";
    }
}

// ============================================================================
// DESERIALIZATION
// ============================================================================

/**
 * Deserialize URL search params to a ViewQuery
 */
export function deserializeParamsToQuery(params: URLSearchParams): ViewQuery {
    const query = createEmptyQuery();

    // Check for full encoded query first
    const encodedQuery = params.get(PARAM_KEYS.view);
    if (encodedQuery) {
        try {
            const decoded = decodeQueryFromBase64(encodedQuery);
            if (decoded) {
                return { ...decoded, version: 1 };
            }
        } catch {
            // Fall back to individual params
        }
    }

    // Category
    const category = params.get(PARAM_KEYS.category);
    if (category) {
        query.category = category;
    }

    // Status
    const status = params.get(PARAM_KEYS.status);
    if (status) {
        const statuses = status.split(",").filter(Boolean);
        query.status = statuses.length === 1 ? (statuses[0] as any) : (statuses as any);
    }

    // Progression level
    const progression = params.get(PARAM_KEYS.progression);
    if (progression) {
        const levels = progression.split(",").map(Number).filter((n) => !isNaN(n));
        query.progressionLevel = levels.length === 1 ? (levels[0] as any) : (levels as any);
    }

    // Search
    const search = params.get(PARAM_KEYS.search);
    if (search) {
        query.search = search;
    }

    // Focus mode
    const focusMode = params.get(PARAM_KEYS.focusMode);
    const focusNode = params.get(PARAM_KEYS.focusNode);
    if (focusMode === "1" || focusNode) {
        query.focusMode = true;
        if (focusNode) {
            query.traversal = {
                startNodeId: focusNode,
                direction: "both",
                maxDepth: -1,
                includeStart: true,
            };
        }
    }

    // Skill gap mode
    const skillGapMode = params.get(PARAM_KEYS.skillGapMode);
    if (skillGapMode === "1") {
        query.skillGapMode = true;
    }

    // Compare paths
    const comparePaths = params.get(PARAM_KEYS.comparePaths);
    if (comparePaths) {
        query.comparePaths = comparePaths.split(",").filter(Boolean);
    }

    // Viewport
    const viewportX = params.get(PARAM_KEYS.viewportX);
    const viewportY = params.get(PARAM_KEYS.viewportY);
    const viewportScale = params.get(PARAM_KEYS.viewportScale);
    if (viewportX !== null && viewportY !== null) {
        query.viewport = {
            translateX: parseFloat(viewportX) || 0,
            translateY: parseFloat(viewportY) || 0,
            scale: parseFloat(viewportScale || "1") || 1,
        };
    }

    // Selected IDs
    const selectedIds = params.get(PARAM_KEYS.selectedIds);
    if (selectedIds) {
        query.selection = {
            selectedIds: selectedIds.split(",").filter(Boolean),
            hoveredId: null,
            focusedId: null,
        };
    }

    // Sorting
    const sortBy = params.get(PARAM_KEYS.sortBy);
    if (sortBy) {
        query.sortBy = sortBy as ViewQuery["sortBy"];
        const sortDir = params.get(PARAM_KEYS.sortDir);
        if (sortDir === "desc") {
            query.sortDirection = "desc";
        }
    }

    return query;
}

/**
 * Deserialize a URL string to a ViewQuery
 */
export function deserializeUrlToQuery(url: string): ViewQuery {
    try {
        const urlObj = new URL(url, "http://localhost");
        return deserializeParamsToQuery(urlObj.searchParams);
    } catch {
        return createEmptyQuery();
    }
}

/**
 * Decode a base64-encoded query
 */
function decodeQueryFromBase64(encoded: string): ViewQuery | null {
    try {
        // Restore URL-safe base64 to standard base64
        let base64 = encoded
            .replace(/-/g, "+")
            .replace(/_/g, "/");
        // Add padding if needed
        while (base64.length % 4) {
            base64 += "=";
        }

        let json: string;
        if (typeof window !== "undefined") {
            json = atob(base64);
        } else {
            json = Buffer.from(base64, "base64").toString("utf8");
        }

        return JSON.parse(json);
    } catch {
        return null;
    }
}

// ============================================================================
// URL HELPERS
// ============================================================================

/**
 * Get the current ViewQuery from the browser URL
 */
export function getQueryFromCurrentUrl(): ViewQuery {
    if (typeof window === "undefined") {
        return createEmptyQuery();
    }
    return deserializeParamsToQuery(new URLSearchParams(window.location.search));
}

/**
 * Update the browser URL with a new query (without page reload)
 */
export function updateUrlWithQuery(query: ViewQuery, options?: { replace?: boolean }): void {
    if (typeof window === "undefined") return;

    const url = serializeQueryToUrl(query);

    if (options?.replace) {
        window.history.replaceState(null, "", url);
    } else {
        window.history.pushState(null, "", url);
    }
}

/**
 * Generate a shareable URL for a query
 */
export function generateShareableUrl(query: ViewQuery, baseUrl?: string): string {
    const base = baseUrl || (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "");
    return serializeQueryToUrl(query, base);
}

// ============================================================================
// QUERY DIFF
// ============================================================================

/**
 * Check if two queries are equivalent
 */
export function areQueriesEqual(a: ViewQuery, b: ViewQuery): boolean {
    // Serialize both and compare
    const paramsA = serializeQueryToParams(a).toString();
    const paramsB = serializeQueryToParams(b).toString();
    return paramsA === paramsB;
}

/**
 * Get the differences between two queries
 */
export function getQueryDiff(
    oldQuery: ViewQuery,
    newQuery: ViewQuery
): Partial<ViewQuery> {
    const diff: Partial<ViewQuery> = {};

    // Check each field
    if (oldQuery.category !== newQuery.category) {
        diff.category = newQuery.category;
    }
    if (JSON.stringify(oldQuery.status) !== JSON.stringify(newQuery.status)) {
        diff.status = newQuery.status;
    }
    if (JSON.stringify(oldQuery.progressionLevel) !== JSON.stringify(newQuery.progressionLevel)) {
        diff.progressionLevel = newQuery.progressionLevel;
    }
    if (oldQuery.search !== newQuery.search) {
        diff.search = newQuery.search;
    }
    if (oldQuery.focusMode !== newQuery.focusMode) {
        diff.focusMode = newQuery.focusMode;
    }
    if (oldQuery.skillGapMode !== newQuery.skillGapMode) {
        diff.skillGapMode = newQuery.skillGapMode;
    }
    if (JSON.stringify(oldQuery.comparePaths) !== JSON.stringify(newQuery.comparePaths)) {
        diff.comparePaths = newQuery.comparePaths;
    }

    return diff;
}
