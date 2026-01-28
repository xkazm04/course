import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { MapNode, NodeLevel, NodeStatus, DifficultyLevel } from "@/app/features/knowledge-map/lib/types";
import { MapSearchEngine, type SearchResult, type SearchOptions } from "./searchEngine";
import { MapFilterEngine, type FilterCriteria, type FilterFacets, type FilterMode } from "./filterEngine";

/**
 * Search history entry
 */
export interface SearchHistoryEntry {
    query: string;
    timestamp: number;
    resultCount: number;
}

/**
 * Saved search/filter configuration
 */
export interface SavedSearch {
    id: string;
    name: string;
    query: string;
    filters: FilterCriteria;
    createdAt: number;
}

/**
 * Search state for the map
 */
export interface MapSearchState {
    /** Current search query */
    query: string;
    /** Whether search is active (input focused or has results) */
    isActive: boolean;
    /** Search results */
    results: SearchResult[];
    /** Loading state */
    isSearching: boolean;
    /** Current filter criteria */
    filters: FilterCriteria;
    /** Filter mode (AND/OR) */
    filterMode: FilterMode;
    /** Available facets */
    facets: FilterFacets | null;
    /** Search suggestions */
    suggestions: string[];
    /** IDs of highlighted nodes on the map */
    highlightedNodeIds: Set<string>;
    /** Search history */
    history: SearchHistoryEntry[];
    /** Saved searches */
    savedSearches: SavedSearch[];
    /** Error message if any */
    error: string | null;
}

const STORAGE_KEY_HISTORY = "forge-map-search-history";
const STORAGE_KEY_SAVED = "forge-map-saved-searches";
const MAX_HISTORY_ENTRIES = 10;

/**
 * Load search history from localStorage
 */
function loadHistory(): SearchHistoryEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Save search history to localStorage
 */
function saveHistory(history: SearchHistoryEntry[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
        // Ignore storage errors
    }
}

/**
 * Load saved searches from localStorage
 */
function loadSavedSearches(): SavedSearch[] {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SAVED);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Save saved searches to localStorage
 */
function saveSavedSearches(searches: SavedSearch[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(searches));
    } catch {
        // Ignore storage errors
    }
}

/**
 * useMapSearch - React hook for hex map search and filtering
 *
 * Provides:
 * - Fuzzy text search with debouncing
 * - Faceted filtering with AND/OR logic
 * - Search suggestions
 * - Search history persistence
 * - Saved searches
 * - Node highlighting on map
 */
export function useMapSearch(nodes: MapNode[]) {
    // Initialize engines
    const searchEngine = useMemo(() => new MapSearchEngine(nodes), []);
    const filterEngine = useMemo(() => new MapFilterEngine(nodes), []);

    // Update engines when nodes change
    useEffect(() => {
        searchEngine.updateIndex(nodes);
        filterEngine.updateIndex(nodes);
    }, [nodes, searchEngine, filterEngine]);

    // Search state
    const [query, setQuery] = useState("");
    const [isActive, setIsActive] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [filters, setFilters] = useState<FilterCriteria>({});
    const [filterMode, setFilterMode] = useState<FilterMode>("AND");
    const [facets, setFacets] = useState<FilterFacets | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());
    const [history, setHistory] = useState<SearchHistoryEntry[]>(() => loadHistory());
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => loadSavedSearches());
    const [error, setError] = useState<string | null>(null);

    // Debounce timer ref
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    /**
     * Execute search with current query and filters
     */
    const executeSearch = useCallback((searchQuery: string, searchFilters: FilterCriteria) => {
        setIsSearching(true);
        setError(null);

        try {
            // First, apply text search
            let searchResults: SearchResult[] = [];
            let nodesToFilter: MapNode[] = nodes;

            if (searchQuery.trim()) {
                searchResults = searchEngine.search(searchQuery, {
                    limit: 50,
                    threshold: 0.4,
                });
                nodesToFilter = searchResults.map(r => r.node);
            }

            // Apply filters
            const hasFilters = Object.values(searchFilters).some(v => {
                if (Array.isArray(v)) return v.length > 0;
                if (typeof v === "object" && v !== null) {
                    return Object.values(v).some(x => x !== undefined);
                }
                return v !== undefined && v !== null && v !== "";
            });

            if (hasFilters) {
                const filterResult = filterEngine.filter(searchFilters, filterMode, nodesToFilter);

                // Update results to only include filtered nodes
                if (searchQuery.trim()) {
                    const filteredIds = new Set(filterResult.nodes.map(n => n.id));
                    searchResults = searchResults.filter(r => filteredIds.has(r.node.id));
                } else {
                    // Convert filtered nodes to search results
                    searchResults = filterResult.nodes.map(node => ({
                        node,
                        score: 0,
                        matches: [],
                        highlightedName: node.name,
                    }));
                }

                setFacets(filterResult.facets);
            } else {
                // Get facets from all nodes
                setFacets(filterEngine.getFacets(nodesToFilter));
            }

            setResults(searchResults);
            setHighlightedNodeIds(new Set(searchResults.map(r => r.node.id)));

            // Update suggestions
            if (searchQuery.length >= 2) {
                setSuggestions(searchEngine.getSuggestions(searchQuery, 5));
            } else {
                setSuggestions([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Search failed");
            setResults([]);
            setHighlightedNodeIds(new Set());
        } finally {
            setIsSearching(false);
        }
    }, [nodes, searchEngine, filterEngine, filterMode]);

    /**
     * Update search query with debouncing
     */
    const updateQuery = useCallback((newQuery: string) => {
        setQuery(newQuery);

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce search execution
        debounceRef.current = setTimeout(() => {
            executeSearch(newQuery, filters);
        }, 150);
    }, [filters, executeSearch]);

    /**
     * Update filters
     */
    const updateFilters = useCallback((newFilters: FilterCriteria) => {
        setFilters(newFilters);
        executeSearch(query, newFilters);
    }, [query, executeSearch]);

    /**
     * Toggle a filter value
     */
    const toggleFilter = useCallback(<T extends keyof FilterCriteria>(
        key: T,
        value: FilterCriteria[T] extends (infer U)[] | undefined ? U : never
    ) => {
        setFilters(prev => {
            const currentValues = (prev[key] as unknown[]) ?? [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];

            const newFilters = { ...prev, [key]: newValues.length > 0 ? newValues : undefined };

            // Execute search with new filters
            setTimeout(() => executeSearch(query, newFilters), 0);

            return newFilters;
        });
    }, [query, executeSearch]);

    /**
     * Clear all filters
     */
    const clearFilters = useCallback(() => {
        setFilters({});
        executeSearch(query, {});
    }, [query, executeSearch]);

    /**
     * Clear search
     */
    const clearSearch = useCallback(() => {
        setQuery("");
        setResults([]);
        setHighlightedNodeIds(new Set());
        setSuggestions([]);
        setError(null);
        setFacets(filterEngine.getFacets());
    }, [filterEngine]);

    /**
     * Add entry to search history
     */
    const addToHistory = useCallback((searchQuery: string, resultCount: number) => {
        if (!searchQuery.trim()) return;

        setHistory(prev => {
            // Remove duplicates
            const filtered = prev.filter(h => h.query !== searchQuery);

            // Add new entry
            const newHistory = [
                { query: searchQuery, timestamp: Date.now(), resultCount },
                ...filtered,
            ].slice(0, MAX_HISTORY_ENTRIES);

            saveHistory(newHistory);
            return newHistory;
        });
    }, []);

    /**
     * Clear search history
     */
    const clearHistory = useCallback(() => {
        setHistory([]);
        saveHistory([]);
    }, []);

    /**
     * Save current search
     */
    const saveCurrentSearch = useCallback((name: string) => {
        if (!query.trim() && Object.keys(filters).length === 0) return;

        const newSaved: SavedSearch = {
            id: `saved-${Date.now()}`,
            name,
            query,
            filters,
            createdAt: Date.now(),
        };

        setSavedSearches(prev => {
            const updated = [newSaved, ...prev];
            saveSavedSearches(updated);
            return updated;
        });
    }, [query, filters]);

    /**
     * Delete a saved search
     */
    const deleteSavedSearch = useCallback((id: string) => {
        setSavedSearches(prev => {
            const updated = prev.filter(s => s.id !== id);
            saveSavedSearches(updated);
            return updated;
        });
    }, []);

    /**
     * Load a saved search
     */
    const loadSavedSearch = useCallback((saved: SavedSearch) => {
        setQuery(saved.query);
        setFilters(saved.filters);
        executeSearch(saved.query, saved.filters);
    }, [executeSearch]);

    /**
     * Activate search (show input/results)
     */
    const activate = useCallback(() => {
        setIsActive(true);
        // Initialize facets if not already set
        if (!facets) {
            setFacets(filterEngine.getFacets());
        }
    }, [facets, filterEngine]);

    /**
     * Deactivate search
     */
    const deactivate = useCallback(() => {
        setIsActive(false);
    }, []);

    /**
     * Navigate to a result node on the map
     */
    const navigateToResult = useCallback((nodeId: string) => {
        // Add current search to history
        if (query.trim()) {
            addToHistory(query, results.length);
        }

        // Return the node for external navigation handling
        return searchEngine.getNode(nodeId);
    }, [query, results.length, addToHistory, searchEngine]);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return {
        // State
        query,
        isActive,
        results,
        isSearching,
        filters,
        filterMode,
        facets,
        suggestions,
        highlightedNodeIds,
        history,
        savedSearches,
        error,

        // Actions
        updateQuery,
        updateFilters,
        toggleFilter,
        setFilterMode,
        clearFilters,
        clearSearch,
        addToHistory,
        clearHistory,
        saveCurrentSearch,
        deleteSavedSearch,
        loadSavedSearch,
        activate,
        deactivate,
        navigateToResult,
    };
}

export type MapSearchHook = ReturnType<typeof useMapSearch>;
