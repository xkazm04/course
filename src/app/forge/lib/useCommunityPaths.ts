"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MOCK_COMMUNITY_PATHS } from "./mockCommunityPaths";
import type { CommunityPath, CommunityPathsFilters, CommunityPathsPagination } from "./communityPathsTypes";

interface UseCommunityPathsOptions {
    initialFilters?: Partial<CommunityPathsFilters>;
    useMockData?: boolean; // Set to true to use mock data instead of API
}

interface UseCommunityPathsResult {
    paths: CommunityPath[];
    isLoading: boolean;
    error: Error | null;
    filters: CommunityPathsFilters;
    setFilter: (key: keyof CommunityPathsFilters, value: string) => void;
    clearFilters: () => void;
    totalCount: number;
    pagination: CommunityPathsPagination | null;
    refetch: () => void;
}

const DEFAULT_FILTERS: CommunityPathsFilters = {
    domain: "all",
    difficulty: "all",
    duration: "any",
    sort: "popular",
    search: "",
};

// Build query string from filters
function buildQueryString(filters: CommunityPathsFilters, page = 1, limit = 20): string {
    const params = new URLSearchParams();

    if (filters.domain && filters.domain !== "all") {
        params.set("domain", filters.domain);
    }
    if (filters.difficulty && filters.difficulty !== "all") {
        params.set("difficulty", filters.difficulty);
    }
    if (filters.duration && filters.duration !== "any") {
        params.set("duration", filters.duration);
    }
    if (filters.sort) {
        params.set("sort", filters.sort);
    }
    if (filters.search) {
        params.set("search", filters.search);
    }

    params.set("page", page.toString());
    params.set("limit", limit.toString());

    return params.toString();
}

// Client-side filtering for mock data
function filterMockPaths(paths: CommunityPath[], filters: CommunityPathsFilters): CommunityPath[] {
    let result = [...paths];

    // Filter by domain
    if (filters.domain && filters.domain !== "all") {
        result = result.filter((p) => p.domain === filters.domain);
    }

    // Filter by difficulty
    if (filters.difficulty && filters.difficulty !== "all") {
        result = result.filter((p) => p.difficulty === filters.difficulty);
    }

    // Filter by duration
    if (filters.duration && filters.duration !== "any") {
        result = result.filter((p) => {
            switch (filters.duration) {
                case "short":
                    return p.estimatedHours < 10;
                case "medium":
                    return p.estimatedHours >= 10 && p.estimatedHours < 30;
                case "long":
                    return p.estimatedHours >= 30 && p.estimatedHours < 60;
                case "extended":
                    return p.estimatedHours >= 60;
                default:
                    return true;
            }
        });
    }

    // Filter by search
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(
            (p) =>
                p.title.toLowerCase().includes(searchLower) ||
                p.description?.toLowerCase().includes(searchLower) ||
                p.subtitle?.toLowerCase().includes(searchLower)
        );
    }

    // Sort
    switch (filters.sort) {
        case "popular":
            result.sort((a, b) => b.enrollmentCount - a.enrollmentCount);
            break;
        case "recent":
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
        case "duration_asc":
            result.sort((a, b) => a.estimatedHours - b.estimatedHours);
            break;
        case "duration_desc":
            result.sort((a, b) => b.estimatedHours - a.estimatedHours);
            break;
    }

    return result;
}

export function useCommunityPaths(options: UseCommunityPathsOptions = {}): UseCommunityPathsResult {
    const { useMockData = false } = options;

    const [filters, setFiltersState] = useState<CommunityPathsFilters>({
        ...DEFAULT_FILTERS,
        ...options.initialFilters,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [paths, setPaths] = useState<CommunityPath[]>([]);
    const [pagination, setPagination] = useState<CommunityPathsPagination | null>(null);

    // Debounce timer ref for search
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch paths from API or mock data
    const fetchPaths = useCallback(async (currentFilters: CommunityPathsFilters) => {
        setIsLoading(true);
        setError(null);

        try {
            if (useMockData) {
                // Use mock data with client-side filtering
                await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate delay
                const filtered = filterMockPaths(MOCK_COMMUNITY_PATHS, currentFilters);
                setPaths(filtered);
                setPagination({
                    page: 1,
                    limit: filtered.length,
                    total: filtered.length,
                    totalPages: 1,
                });
            } else {
                // Fetch from API
                const queryString = buildQueryString(currentFilters);
                const response = await fetch(`/api/community-paths?${queryString}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch paths: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                setPaths(data.paths || []);
                setPagination(data.pagination || null);
            }
        } catch (err) {
            console.error("Error fetching community paths:", err);
            setError(err instanceof Error ? err : new Error("Failed to fetch paths"));

            // Fallback to mock data on error
            if (!useMockData) {
                console.log("Falling back to mock data");
                const filtered = filterMockPaths(MOCK_COMMUNITY_PATHS, currentFilters);
                setPaths(filtered);
                setPagination({
                    page: 1,
                    limit: filtered.length,
                    total: filtered.length,
                    totalPages: 1,
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [useMockData]);

    // Initial fetch and fetch on filter change
    useEffect(() => {
        // Clear existing debounce
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        // Debounce search queries
        if (filters.search) {
            searchDebounceRef.current = setTimeout(() => {
                fetchPaths(filters);
            }, 300);
        } else {
            fetchPaths(filters);
        }

        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, [filters, fetchPaths]);

    const setFilter = useCallback((key: keyof CommunityPathsFilters, value: string) => {
        setFiltersState((prev) => ({ ...prev, [key]: value }));
    }, []);

    const clearFilters = useCallback(() => {
        setFiltersState(DEFAULT_FILTERS);
    }, []);

    const refetch = useCallback(() => {
        fetchPaths(filters);
    }, [fetchPaths, filters]);

    return {
        paths,
        isLoading,
        error,
        filters,
        setFilter,
        clearFilters,
        totalCount: pagination?.total || paths.length,
        pagination,
        refetch,
    };
}
