/**
 * Universe Data Provider
 *
 * Unified interface for accessing universe visualization data from any source.
 * This is the single entry point for components that need UniverseData.
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CurriculumGraph, CurriculumDataSource } from "./curriculumGraph";
import {
    mockDataAdapter,
    supabaseDataAdapter,
    type MockDataInput,
    type SupabaseMapNode,
    type SupabaseMapConnection,
} from "./curriculumAdapters";
import {
    transformCurriculumToUniverse,
    DEFAULT_LAYOUT_CONFIG,
    orbitalPositioningStrategy,
    gridPositioningStrategy,
    type UniverseLayoutConfig,
    type PositioningStrategy,
} from "./universeLayoutStrategies";
import type { UniverseData } from "./universeData";

// Import mock data sources
import { GRAPH_NODES, GRAPH_EDGES } from "@/app/shared/lib/learningPathGraph";
import { LEARNING_DOMAINS } from "@/app/shared/lib/learningDomains";
import type { LearningDomainId } from "@/app/shared/lib/learningDomains";

// ============================================================================
// PROVIDER CONFIGURATION
// ============================================================================

/**
 * Data source type for the provider
 */
export type UniverseDataSourceType = "mock" | "supabase" | "auto";

/**
 * Layout strategy type
 */
export type LayoutStrategyType = "orbital" | "grid";

/**
 * Provider configuration
 */
export interface UniverseDataProviderConfig {
    /** Data source type (default: "auto" - tries supabase, falls back to mock) */
    source?: UniverseDataSourceType;
    /** Layout strategy (default: "orbital") */
    layoutStrategy?: LayoutStrategyType;
    /** Custom layout configuration */
    layoutConfig?: Partial<UniverseLayoutConfig>;
    /** World scale for coordinate system (default: 1000) */
    worldScale?: number;
    /** Whether to include skills/lessons in the data (can be performance heavy) */
    includeSkills?: boolean;
}

/**
 * Provider state
 */
export interface UniverseDataProviderState {
    /** The generated universe data */
    data: UniverseData | null;
    /** The underlying curriculum graph */
    curriculumGraph: CurriculumGraph | null;
    /** Loading state */
    isLoading: boolean;
    /** Error state */
    error: Error | null;
    /** Actual data source being used */
    activeSource: CurriculumDataSource | null;
    /** Refetch function */
    refetch: () => Promise<void>;
}

// ============================================================================
// MOCK DATA GENERATION
// ============================================================================

function createMockDataInput(): MockDataInput {
    const domains: Record<string, { name: string; description: string }> = {};

    for (const id of Object.keys(LEARNING_DOMAINS) as LearningDomainId[]) {
        const domain = LEARNING_DOMAINS[id];
        domains[id] = {
            name: domain.name,
            description: domain.description,
        };
    }

    return {
        graphNodes: GRAPH_NODES,
        graphEdges: GRAPH_EDGES,
        domains,
    };
}

// ============================================================================
// SUPABASE DATA FETCHING
// ============================================================================

async function fetchSupabaseData(): Promise<{ nodes: SupabaseMapNode[]; connections: SupabaseMapConnection[] } | null> {
    try {
        const supabase = createClient();

        // Fetch nodes
        const { data: nodesData, error: nodesError } = await supabase
            .from("map_nodes")
            .select("*")
            .order("depth", { ascending: true })
            .order("sort_order", { ascending: true });

        if (nodesError) throw nodesError;

        // Fetch connections
        const { data: connectionsData, error: connectionsError } = await supabase
            .from("map_node_connections")
            .select("*");

        if (connectionsError) throw connectionsError;

        return {
            nodes: nodesData || [],
            connections: connectionsData || [],
        };
    } catch (error) {
        console.warn("Failed to fetch Supabase data:", error);
        return null;
    }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook to access universe data from a unified provider
 */
export function useUniverseDataProvider(
    config: UniverseDataProviderConfig = {}
): UniverseDataProviderState {
    const {
        source = "auto",
        layoutStrategy = "orbital",
        layoutConfig,
        worldScale = 1000,
        includeSkills = true,
    } = config;

    const [curriculumGraph, setCurriculumGraph] = useState<CurriculumGraph | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [activeSource, setActiveSource] = useState<CurriculumDataSource | null>(null);

    // Merge layout config
    const mergedLayoutConfig = useMemo(
        () => ({
            ...DEFAULT_LAYOUT_CONFIG,
            worldScale,
            ...layoutConfig,
        }),
        [layoutConfig, worldScale]
    );

    // Select positioning strategy
    const positioningStrategy = useMemo(
        (): PositioningStrategy => layoutStrategy === "grid" ? gridPositioningStrategy : orbitalPositioningStrategy,
        [layoutStrategy]
    );

    // Fetch data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let graph: CurriculumGraph | null = null;

            // Try Supabase if source is "supabase" or "auto"
            if (source === "supabase" || source === "auto") {
                const supabaseData = await fetchSupabaseData();

                if (supabaseData && supabaseData.nodes.length > 0) {
                    graph = supabaseDataAdapter.transform(supabaseData);
                    setActiveSource("supabase");
                }
            }

            // Fall back to mock if no supabase data or source is "mock"
            if (!graph && (source === "mock" || source === "auto")) {
                const mockInput = createMockDataInput();
                graph = mockDataAdapter.transform(mockInput);
                setActiveSource("mock");
            }

            // Strip skills if not needed (performance optimization)
            if (graph && !includeSkills) {
                graph = {
                    ...graph,
                    skills: [],
                    metadata: {
                        ...graph.metadata,
                        counts: {
                            ...graph.metadata.counts,
                            skills: 0,
                        },
                    },
                };
            }

            setCurriculumGraph(graph);
        } catch (err) {
            console.error("Error in universe data provider:", err);
            setError(err as Error);

            // Still try to provide mock data on error
            if (source !== "mock") {
                try {
                    const mockInput = createMockDataInput();
                    const graph = mockDataAdapter.transform(mockInput);
                    setCurriculumGraph(graph);
                    setActiveSource("mock");
                } catch (mockErr) {
                    console.error("Failed to load mock data:", mockErr);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [source, includeSkills]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Transform to universe data
    const data = useMemo((): UniverseData | null => {
        if (!curriculumGraph) return null;
        return transformCurriculumToUniverse(
            curriculumGraph,
            mergedLayoutConfig,
            positioningStrategy
        );
    }, [curriculumGraph, mergedLayoutConfig, positioningStrategy]);

    return {
        data,
        curriculumGraph,
        isLoading,
        error,
        activeSource,
        refetch: fetchData,
    };
}

// ============================================================================
// CONVENIENCE FACTORIES
// ============================================================================

/**
 * Create universe data from mock sources only (synchronous)
 */
export function createMockUniverseData(
    layoutConfig: Partial<UniverseLayoutConfig> = {},
    layoutStrategy: LayoutStrategyType = "orbital"
): UniverseData {
    const mockInput = createMockDataInput();
    const graph = mockDataAdapter.transform(mockInput);

    const config = {
        ...DEFAULT_LAYOUT_CONFIG,
        ...layoutConfig,
    };

    const strategy = layoutStrategy === "grid" ? gridPositioningStrategy : orbitalPositioningStrategy;

    return transformCurriculumToUniverse(graph, config, strategy);
}

/**
 * Create universe data from a curriculum graph
 */
export function createUniverseDataFromGraph(
    graph: CurriculumGraph,
    layoutConfig: Partial<UniverseLayoutConfig> = {},
    layoutStrategy: LayoutStrategyType = "orbital"
): UniverseData {
    const config = {
        ...DEFAULT_LAYOUT_CONFIG,
        ...layoutConfig,
    };

    const strategy = layoutStrategy === "grid" ? gridPositioningStrategy : orbitalPositioningStrategy;

    return transformCurriculumToUniverse(graph, config, strategy);
}
