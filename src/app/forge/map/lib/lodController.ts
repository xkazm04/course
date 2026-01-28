import type { HexLayoutNode, Point } from "./types";
import type { Bounds } from "./viewportManager";
import { SpatialIndex } from "./spatialIndex";

/**
 * LOD (Level of Detail) tier
 */
export type LODTier = "cluster" | "node" | "detailed";

/**
 * Cluster representation for far zoom levels
 */
export interface NodeCluster {
    id: string;
    center: Point;
    count: number;
    nodeIds: string[];
    radius: number;
    dominantStatus: "completed" | "in_progress" | "available" | "locked";
    progress: number;
}

/**
 * Renderable item - either a node or a cluster
 */
export type RenderableItem =
    | { type: "node"; data: HexLayoutNode; lod: "node" | "detailed" }
    | { type: "cluster"; data: NodeCluster; lod: "cluster" };

/**
 * LOD thresholds based on zoom scale
 */
const LOD_THRESHOLDS = {
    /** Below this scale, show clusters */
    clusterThreshold: 0.4,
    /** Above this scale, show detailed nodes */
    detailedThreshold: 1.2,
};

/**
 * Grid size for clustering at different zoom levels
 */
const CLUSTER_GRID_SIZES = {
    far: 400, // Very zoomed out
    medium: 250, // Moderately zoomed out
};

/**
 * LODController - Manages level-of-detail rendering for large maps
 *
 * Features:
 * - 3-tier LOD: cluster → node → detailed node
 * - Dynamic clustering based on zoom level
 * - Smooth transitions between LOD tiers
 * - Memory-efficient rendering for 10k+ nodes
 */
export class LODController {
    private spatialIndex: SpatialIndex<HexLayoutNode>;
    private currentScale: number = 1;
    private clusterCache: Map<string, NodeCluster[]> = new Map();
    private lastClusterBounds: Bounds | null = null;

    constructor(spatialIndex: SpatialIndex<HexLayoutNode>) {
        this.spatialIndex = spatialIndex;
    }

    /**
     * Update the current zoom scale
     */
    setScale(scale: number): void {
        this.currentScale = scale;
    }

    /**
     * Get the current LOD tier based on zoom
     */
    getCurrentTier(): LODTier {
        if (this.currentScale < LOD_THRESHOLDS.clusterThreshold) {
            return "cluster";
        }
        if (this.currentScale >= LOD_THRESHOLDS.detailedThreshold) {
            return "detailed";
        }
        return "node";
    }

    /**
     * Get renderable items for the current viewport
     */
    getRenderables(bounds: Bounds): RenderableItem[] {
        const tier = this.getCurrentTier();

        switch (tier) {
            case "cluster":
                return this.getClusterRenderables(bounds);
            case "detailed":
                return this.getDetailedRenderables(bounds);
            default:
                return this.getNodeRenderables(bounds);
        }
    }

    /**
     * Get cluster renderables for far zoom
     */
    private getClusterRenderables(bounds: Bounds): RenderableItem[] {
        const gridSize = this.currentScale < 0.25
            ? CLUSTER_GRID_SIZES.far
            : CLUSTER_GRID_SIZES.medium;

        const clusters = this.computeClusters(bounds, gridSize);

        return clusters.map(cluster => ({
            type: "cluster" as const,
            data: cluster,
            lod: "cluster" as const,
        }));
    }

    /**
     * Get node renderables for medium zoom
     */
    private getNodeRenderables(bounds: Bounds): RenderableItem[] {
        const nodes = this.spatialIndex.query(bounds);

        return nodes.map(node => ({
            type: "node" as const,
            data: node,
            lod: "node" as const,
        }));
    }

    /**
     * Get detailed renderables for close zoom
     */
    private getDetailedRenderables(bounds: Bounds): RenderableItem[] {
        const nodes = this.spatialIndex.query(bounds);

        return nodes.map(node => ({
            type: "node" as const,
            data: node,
            lod: "detailed" as const,
        }));
    }

    /**
     * Compute clusters for the given bounds
     */
    private computeClusters(bounds: Bounds, gridSize: number): NodeCluster[] {
        // Check cache
        const cacheKey = `${gridSize}-${Math.floor(bounds.minX / gridSize)}-${Math.floor(bounds.minY / gridSize)}`;
        if (this.clusterCache.has(cacheKey) && this.boundsEqual(bounds, this.lastClusterBounds)) {
            return this.clusterCache.get(cacheKey)!;
        }

        const rawClusters = this.spatialIndex.getClusters(bounds, gridSize);

        const clusters: NodeCluster[] = rawClusters.map((raw, index) => {
            // Calculate dominant status
            const statusCounts = { completed: 0, in_progress: 0, available: 0, locked: 0 };
            let totalProgress = 0;

            for (const item of raw.items) {
                const status = item.status ?? "available";
                statusCounts[status]++;
                totalProgress += item.progress ?? 0;
            }

            const dominantStatus = Object.entries(statusCounts)
                .sort((a, b) => b[1] - a[1])[0][0] as NodeCluster["dominantStatus"];

            const avgProgress = raw.count > 0 ? totalProgress / raw.count : 0;

            // Calculate cluster radius based on item spread
            let maxDist = 0;
            for (const item of raw.items) {
                const dx = item.pixel.x - raw.center.x;
                const dy = item.pixel.y - raw.center.y;
                maxDist = Math.max(maxDist, Math.sqrt(dx * dx + dy * dy));
            }

            return {
                id: `cluster-${index}-${cacheKey}`,
                center: raw.center,
                count: raw.count,
                nodeIds: raw.items.map(i => i.id),
                radius: Math.max(40, Math.min(100, maxDist + 20)),
                dominantStatus,
                progress: avgProgress,
            };
        });

        // Cache results
        this.clusterCache.set(cacheKey, clusters);
        this.lastClusterBounds = bounds;

        // Limit cache size
        if (this.clusterCache.size > 50) {
            const firstKey = this.clusterCache.keys().next().value;
            if (firstKey) this.clusterCache.delete(firstKey);
        }

        return clusters;
    }

    /**
     * Get visible node count at current zoom
     */
    getVisibleCount(bounds: Bounds): number {
        return this.spatialIndex.queryCount(bounds);
    }

    /**
     * Get total nodes in index
     */
    getTotalCount(): number {
        return this.spatialIndex.size;
    }

    /**
     * Check if current zoom should show clusters
     */
    shouldShowClusters(): boolean {
        return this.getCurrentTier() === "cluster";
    }

    /**
     * Check if current zoom should show detailed nodes
     */
    shouldShowDetails(): boolean {
        return this.getCurrentTier() === "detailed";
    }

    /**
     * Get recommended max nodes to render based on zoom
     */
    getMaxRenderCount(): number {
        const tier = this.getCurrentTier();
        switch (tier) {
            case "cluster":
                return 200; // Clusters are cheap
            case "detailed":
                return 50; // Detailed is expensive
            default:
                return 150; // Normal nodes
        }
    }

    /**
     * Invalidate cluster cache
     */
    invalidateCache(): void {
        this.clusterCache.clear();
        this.lastClusterBounds = null;
    }

    /**
     * Update the spatial index reference
     */
    setSpatialIndex(index: SpatialIndex<HexLayoutNode>): void {
        this.spatialIndex = index;
        this.invalidateCache();
    }

    // Utility
    private boundsEqual(a: Bounds | null, b: Bounds | null): boolean {
        if (!a || !b) return false;
        return (
            a.minX === b.minX &&
            a.minY === b.minY &&
            a.maxX === b.maxX &&
            a.maxY === b.maxY
        );
    }
}

/**
 * Create a LOD controller with a spatial index
 */
export function createLODController(nodes: HexLayoutNode[] = []): {
    lodController: LODController;
    spatialIndex: SpatialIndex<HexLayoutNode>;
} {
    const spatialIndex = new SpatialIndex<HexLayoutNode>();
    if (nodes.length > 0) {
        spatialIndex.bulkInsert(nodes);
    }
    const lodController = new LODController(spatialIndex);
    return { lodController, spatialIndex };
}
