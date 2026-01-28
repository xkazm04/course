import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { MapNode } from "@/app/features/knowledge-map/lib/types";
import type { ViewportState, HexLayoutNode, Point } from "./types";
import { ViewportManager } from "./viewportManager";
import { SpatialIndex } from "./spatialIndex";
import { LODController, type NodeCluster } from "./lodController";
import { NodeLoader } from "./nodeLoader";
import { PrefetchService } from "./prefetchService";
import { ConnectionCuller, type VisibleConnection } from "./connectionCuller";
import { layoutHexPuzzle } from "./hexUtils";

/**
 * Progressive map state
 */
export interface ProgressiveMapState {
    /** Nodes visible in current viewport */
    visibleNodes: HexLayoutNode[];
    /** Clusters for far zoom levels */
    visibleClusters: NodeCluster[];
    /** Connections between visible nodes */
    visibleConnections: VisibleConnection[];
    /** Current LOD tier */
    lodTier: "cluster" | "node" | "detailed";
    /** Whether data is loading */
    isLoading: boolean;
    /** Total node count */
    totalNodes: number;
    /** Visible node count */
    visibleCount: number;
    /** Performance metrics */
    metrics: {
        lastFrameTime: number;
        renderCount: number;
        cacheHitRate: number;
    };
}

/**
 * Progressive map options
 */
export interface ProgressiveMapOptions {
    /** Enable prefetching */
    enablePrefetch?: boolean;
    /** Enable LOD */
    enableLOD?: boolean;
    /** Enable connection culling */
    enableConnectionCulling?: boolean;
    /** Maximum nodes to render */
    maxRenderNodes?: number;
    /** Throttle viewport updates (ms) */
    throttleMs?: number;
}

const DEFAULT_OPTIONS: ProgressiveMapOptions = {
    enablePrefetch: true,
    enableLOD: true,
    enableConnectionCulling: true,
    maxRenderNodes: 200,
    throttleMs: 16, // ~60fps
};

/**
 * useProgressiveMap - React hook for progressive map rendering
 *
 * Integrates:
 * - ViewportManager for bounds calculation
 * - SpatialIndex for O(log n) queries
 * - LODController for level-of-detail
 * - NodeLoader for lazy loading
 * - PrefetchService for predictive loading
 * - ConnectionCuller for edge optimization
 */
export function useProgressiveMap(
    allNodes: MapNode[],
    viewport: ViewportState,
    dimensions: { width: number; height: number },
    domain?: string,
    options: ProgressiveMapOptions = {}
) {
    const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);

    // Refs for managers (persist across renders)
    const viewportManagerRef = useRef<ViewportManager>(new ViewportManager());
    const spatialIndexRef = useRef<SpatialIndex<HexLayoutNode>>(new SpatialIndex());
    const lodControllerRef = useRef<LODController | null>(null);
    const nodeLoaderRef = useRef<NodeLoader>(new NodeLoader());
    const prefetchServiceRef = useRef<PrefetchService | null>(null);
    const connectionCullerRef = useRef<ConnectionCuller>(new ConnectionCuller());

    // State
    const [visibleNodes, setVisibleNodes] = useState<HexLayoutNode[]>([]);
    const [visibleClusters, setVisibleClusters] = useState<NodeCluster[]>([]);
    const [visibleConnections, setVisibleConnections] = useState<VisibleConnection[]>([]);
    const [isLoading] = useState(false);
    const [lodTier, setLodTier] = useState<"cluster" | "node" | "detailed">("node");
    const [metrics, setMetrics] = useState({
        lastFrameTime: 0,
        renderCount: 0,
        cacheHitRate: 1,
    });

    // Throttle ref
    const lastUpdateRef = useRef(0);
    const rafIdRef = useRef<number | null>(null);

    // Layout all nodes with hex positions
    const layoutNodes = useMemo(() => {
        if (!dimensions.width || !dimensions.height) return [];
        return layoutHexPuzzle(allNodes, dimensions.width, dimensions.height, viewport.scale);
    }, [allNodes, dimensions.width, dimensions.height, viewport.scale]);

    // Initialize LOD controller
    useEffect(() => {
        if (!lodControllerRef.current) {
            lodControllerRef.current = new LODController(spatialIndexRef.current);
        }
    }, []);

    // Initialize prefetch service
    useEffect(() => {
        if (opts.enablePrefetch && !prefetchServiceRef.current) {
            prefetchServiceRef.current = new PrefetchService(
                viewportManagerRef.current,
                nodeLoaderRef.current
            );
        }
    }, [opts.enablePrefetch]);

    // Update spatial index when nodes change
    useEffect(() => {
        if (layoutNodes.length === 0) return;

        const startTime = performance.now();
        spatialIndexRef.current.bulkInsert(layoutNodes);

        if (lodControllerRef.current) {
            lodControllerRef.current.setSpatialIndex(spatialIndexRef.current);
        }

        const indexTime = performance.now() - startTime;
        if (indexTime > 50) {
            console.debug(`Spatial index update took ${indexTime.toFixed(1)}ms for ${layoutNodes.length} nodes`);
        }
    }, [layoutNodes]);

    // Update viewport manager
    useEffect(() => {
        viewportManagerRef.current.setDimensions(dimensions.width, dimensions.height);
    }, [dimensions.width, dimensions.height]);

    // Update domain for prefetching
    useEffect(() => {
        prefetchServiceRef.current?.setDomain(domain);
    }, [domain]);

    /**
     * Core update function - computes visible items
     */
    const updateVisible = useCallback(() => {
        const startTime = performance.now();
        const viewportManager = viewportManagerRef.current;
        const spatialIndex = spatialIndexRef.current;
        const lodController = lodControllerRef.current;
        const connectionCuller = connectionCullerRef.current;

        // Update viewport state
        viewportManager.setViewport(viewport);

        // Get visible bounds
        const bounds = viewportManager.getVisibleBounds();

        // Get current LOD tier
        if (lodController) {
            lodController.setScale(viewport.scale);
        }
        const tier = lodController?.getCurrentTier() ?? "node";

        let nodes: HexLayoutNode[] = [];
        let clusters: NodeCluster[] = [];

        if (opts.enableLOD && tier === "cluster" && lodController) {
            // Use clusters for far zoom
            const renderables = lodController.getRenderables(bounds);
            clusters = renderables
                .filter((r): r is { type: "cluster"; data: NodeCluster; lod: "cluster" } => r.type === "cluster")
                .map(r => r.data);
        } else {
            // Query visible nodes from spatial index
            nodes = spatialIndex.query(bounds);

            // Limit render count
            if (nodes.length > (opts.maxRenderNodes ?? 200)) {
                // Prioritize nodes near center
                const centerX = (bounds.minX + bounds.maxX) / 2;
                const centerY = (bounds.minY + bounds.maxY) / 2;
                nodes.sort((a, b) => {
                    const distA = Math.hypot(a.pixel.x - centerX, a.pixel.y - centerY);
                    const distB = Math.hypot(b.pixel.x - centerX, b.pixel.y - centerY);
                    return distA - distB;
                });
                nodes = nodes.slice(0, opts.maxRenderNodes);
            }
        }

        // Get visible connections
        let connections: VisibleConnection[] = [];
        if (opts.enableConnectionCulling && nodes.length > 0 && tier !== "cluster") {
            connections = connectionCuller.getVisibleConnectionsOptimized(
                nodes,
                new Map(layoutNodes.map(n => [n.id, n])),
                bounds
            );
        }

        // Update state
        setVisibleNodes(nodes);
        setVisibleClusters(clusters);
        setVisibleConnections(connections);

        // Update metrics
        const frameTime = performance.now() - startTime;
        setMetrics(prev => ({
            lastFrameTime: frameTime,
            renderCount: prev.renderCount + 1,
            cacheHitRate: nodeLoaderRef.current.getCacheStats().freshCount /
                Math.max(1, nodeLoaderRef.current.getCacheStats().size),
        }));

        // Trigger prefetching
        if (opts.enablePrefetch) {
            prefetchServiceRef.current?.schedulePrefetch();
        }
    }, [viewport, layoutNodes, opts]);

    // Throttled viewport update - schedule via RAF to avoid sync setState in effect
    useEffect(() => {
        const scheduleUpdate = () => {
            const now = performance.now();
            const elapsed = now - lastUpdateRef.current;

            if (elapsed >= (opts.throttleMs ?? 16)) {
                // Schedule via microtask to avoid direct setState in effect
                lastUpdateRef.current = now;
                queueMicrotask(updateVisible);
            } else {
                // Schedule update via RAF
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current);
                }
                rafIdRef.current = requestAnimationFrame(() => {
                    lastUpdateRef.current = performance.now();
                    updateVisible();
                });
            }
        };

        scheduleUpdate();

        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, [viewport, updateVisible, opts.throttleMs]);

    // Initial update when layout nodes change - schedule via RAF
    useEffect(() => {
        if (layoutNodes.length > 0) {
            const rafId = requestAnimationFrame(updateVisible);
            return () => cancelAnimationFrame(rafId);
        }
    }, [layoutNodes, updateVisible]);

    /**
     * Update LOD tier when scale changes
     */
    useEffect(() => {
        if (lodControllerRef.current) {
            lodControllerRef.current.setScale(viewport.scale);
            setLodTier(lodControllerRef.current.getCurrentTier());
        }
    }, [viewport.scale]);

    /**
     * Force refresh visible items
     */
    const refresh = useCallback(() => {
        updateVisible();
    }, [updateVisible]);

    /**
     * Prefetch nodes for a future viewport
     */
    const prefetchForViewport = useCallback((futureViewport: ViewportState) => {
        const tempManager = new ViewportManager();
        tempManager.setDimensions(dimensions.width, dimensions.height);
        tempManager.setViewport(futureViewport);
        const futureBounds = tempManager.getVisibleBounds();
        nodeLoaderRef.current.prefetch(futureBounds, domain);
    }, [dimensions, domain]);

    /**
     * Get node by ID from spatial index
     */
    const getNode = useCallback((nodeId: string): HexLayoutNode | undefined => {
        return spatialIndexRef.current.get(nodeId);
    }, []);

    /**
     * Get nearest nodes to a point
     */
    const getNearestNodes = useCallback((point: Point, count = 5): HexLayoutNode[] => {
        return spatialIndexRef.current.kNearest(point, count);
    }, []);

    /**
     * Check if point is in current viewport
     */
    const isInViewport = useCallback((point: Point): boolean => {
        const bounds = viewportManagerRef.current.getVisibleBounds();
        return (
            point.x >= bounds.minX &&
            point.x <= bounds.maxX &&
            point.y >= bounds.minY &&
            point.y <= bounds.maxY
        );
    }, []);

    /**
     * Get cache statistics
     */
    const getCacheStats = useCallback(() => {
        return nodeLoaderRef.current.getCacheStats();
    }, []);

    /**
     * Clear all caches
     */
    const clearCaches = useCallback(() => {
        nodeLoaderRef.current.clearCache();
        lodControllerRef.current?.invalidateCache();
    }, []);

    return {
        // State
        visibleNodes,
        visibleClusters,
        visibleConnections,
        lodTier,
        isLoading,
        totalNodes: layoutNodes.length,
        visibleCount: visibleNodes.length + visibleClusters.length,
        metrics,

        // Actions
        refresh,
        prefetchForViewport,
        getNode,
        getNearestNodes,
        isInViewport,
        getCacheStats,
        clearCaches,

        // All layout nodes (for compatibility)
        allLayoutNodes: layoutNodes,
    };
}

export type ProgressiveMapHook = ReturnType<typeof useProgressiveMap>;
