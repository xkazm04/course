/**
 * Cluster Aggregator
 *
 * Groups nodes into visual clusters at far zoom levels to reduce visual clutter.
 * Uses grid-based spatial clustering with configurable parameters.
 *
 * Key features:
 * - Grid-based clustering for stable positions (no jumping during zoom)
 * - Progressive disclosure (clusters split as you zoom in)
 * - Aggregate metrics calculation (progress, time, difficulty)
 * - Smooth expansion/collapse animations
 */

import type {
    UniverseNode,
    ClusterNode,
    ClusterLevel,
    ClusterMetrics,
    LODConfig,
    ZoomLevel,
} from "./types";
import { DEFAULT_LOD_CONFIG } from "./types";
import type { SemanticLevel } from "./zoomLevelManager";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration for cluster aggregation
 */
export interface ClusterAggregatorConfig {
    /** Grid cell size at galaxy level */
    galaxyCellSize: number;
    /** Grid cell size at domain level */
    domainCellSize: number;
    /** Grid cell size at topic level */
    topicCellSize: number;
    /** Minimum nodes to form a cluster */
    minClusterSize: number;
    /** Maximum clusters per level (to prevent too many small clusters) */
    maxClustersPerLevel: number;
    /** Cluster radius multiplier based on node count */
    radiusMultiplier: number;
    /** Base radius for clusters */
    baseRadius: number;
}

/**
 * Cluster generation result
 */
export interface ClusterResult {
    /** Generated clusters */
    clusters: ClusterNode[];
    /** Map of node IDs to their parent cluster */
    nodeToCluster: Map<string, string>;
    /** Nodes that weren't clustered (too few in area) */
    unclustered: UniverseNode[];
}

/**
 * Grid cell for spatial clustering
 */
interface GridCell {
    x: number;
    y: number;
    nodes: UniverseNode[];
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

export const DEFAULT_CLUSTER_CONFIG: ClusterAggregatorConfig = {
    galaxyCellSize: 400,
    domainCellSize: 200,
    topicCellSize: 100,
    minClusterSize: 3,
    maxClustersPerLevel: 12,
    radiusMultiplier: 0.8,
    baseRadius: 40,
};

// ============================================================================
// CLUSTER AGGREGATOR CLASS
// ============================================================================

/**
 * ClusterAggregator - Groups nodes into visual clusters
 */
export class ClusterAggregator {
    private config: ClusterAggregatorConfig;
    private lodConfig: LODConfig;

    // Cached cluster data for each level
    private galaxyClusters: ClusterNode[] = [];
    private domainClusters: ClusterNode[] = [];
    private topicClusters: ClusterNode[] = [];

    // Maps for quick lookup
    private nodeToGalaxyCluster: Map<string, string> = new Map();
    private nodeToDomainCluster: Map<string, string> = new Map();
    private nodeToTopicCluster: Map<string, string> = new Map();

    constructor(
        config: Partial<ClusterAggregatorConfig> = {},
        lodConfig: LODConfig = DEFAULT_LOD_CONFIG
    ) {
        this.config = { ...DEFAULT_CLUSTER_CONFIG, ...config };
        this.lodConfig = lodConfig;
    }

    // ========================================================================
    // MAIN CLUSTERING
    // ========================================================================

    /**
     * Generate all cluster levels from a set of nodes
     */
    generateClusters(nodes: UniverseNode[]): {
        galaxyClusters: ClusterNode[];
        domainClusters: ClusterNode[];
        topicClusters: ClusterNode[];
    } {
        // Filter out existing clusters (only cluster leaf nodes)
        const leafNodes = nodes.filter(n => n.type !== "cluster");

        // Generate each cluster level
        const galaxyResult = this.generateClusterLevel(
            leafNodes,
            "galaxy-cluster",
            this.config.galaxyCellSize
        );
        this.galaxyClusters = galaxyResult.clusters;
        this.nodeToGalaxyCluster = galaxyResult.nodeToCluster;

        const domainResult = this.generateClusterLevel(
            leafNodes,
            "domain-cluster",
            this.config.domainCellSize
        );
        this.domainClusters = domainResult.clusters;
        this.nodeToDomainCluster = domainResult.nodeToCluster;

        const topicResult = this.generateClusterLevel(
            leafNodes,
            "topic-cluster",
            this.config.topicCellSize
        );
        this.topicClusters = topicResult.clusters;
        this.nodeToTopicCluster = topicResult.nodeToCluster;

        return {
            galaxyClusters: this.galaxyClusters,
            domainClusters: this.domainClusters,
            topicClusters: this.topicClusters,
        };
    }

    /**
     * Generate clusters for a specific level using grid-based spatial clustering
     */
    private generateClusterLevel(
        nodes: UniverseNode[],
        level: ClusterLevel,
        cellSize: number
    ): ClusterResult {
        // Create spatial grid
        const grid = this.createSpatialGrid(nodes, cellSize);

        // Merge adjacent cells if they have too few nodes
        const mergedCells = this.mergeSparseAdjacentCells(grid, this.config.minClusterSize);

        // Create clusters from cells
        const clusters: ClusterNode[] = [];
        const nodeToCluster = new Map<string, string>();
        const unclustered: UniverseNode[] = [];

        let clusterIndex = 0;
        for (const cell of mergedCells) {
            if (cell.nodes.length >= this.config.minClusterSize) {
                const cluster = this.createClusterFromNodes(
                    cell.nodes,
                    level,
                    clusterIndex++
                );
                clusters.push(cluster);

                for (const node of cell.nodes) {
                    nodeToCluster.set(node.id, cluster.id);
                }
            } else {
                unclustered.push(...cell.nodes);
            }
        }

        // Limit total clusters
        if (clusters.length > this.config.maxClustersPerLevel) {
            return this.reduceClusterCount(clusters, nodes, level, nodeToCluster);
        }

        return { clusters, nodeToCluster, unclustered };
    }

    // ========================================================================
    // GRID-BASED CLUSTERING
    // ========================================================================

    /**
     * Create a spatial grid of cells containing nodes
     */
    private createSpatialGrid(nodes: UniverseNode[], cellSize: number): Map<string, GridCell> {
        const grid = new Map<string, GridCell>();

        for (const node of nodes) {
            const cellX = Math.floor(node.x / cellSize);
            const cellY = Math.floor(node.y / cellSize);
            const key = `${cellX},${cellY}`;

            if (!grid.has(key)) {
                grid.set(key, {
                    x: cellX * cellSize + cellSize / 2,
                    y: cellY * cellSize + cellSize / 2,
                    nodes: [],
                });
            }

            grid.get(key)!.nodes.push(node);
        }

        return grid;
    }

    /**
     * Merge adjacent cells that have too few nodes
     */
    private mergeSparseAdjacentCells(
        grid: Map<string, GridCell>,
        minSize: number
    ): GridCell[] {
        const cells = Array.from(grid.values());
        const merged: GridCell[] = [];
        const processed = new Set<string>();

        // Sort by node count descending to prioritize larger cells
        cells.sort((a, b) => b.nodes.length - a.nodes.length);

        for (const cell of cells) {
            const key = `${Math.round(cell.x)},${Math.round(cell.y)}`;
            if (processed.has(key)) continue;

            if (cell.nodes.length >= minSize) {
                // Cell is large enough, keep as-is
                merged.push(cell);
                processed.add(key);
            } else {
                // Try to merge with adjacent cells
                const mergedCell = this.mergeWithAdjacent(cell, grid, processed, minSize);
                merged.push(mergedCell);
            }
        }

        return merged;
    }

    /**
     * Attempt to merge a cell with its neighbors
     */
    private mergeWithAdjacent(
        cell: GridCell,
        grid: Map<string, GridCell>,
        processed: Set<string>,
        minSize: number
    ): GridCell {
        const key = `${Math.round(cell.x)},${Math.round(cell.y)}`;
        processed.add(key);

        const mergedNodes = [...cell.nodes];

        // Check 8 adjacent cells
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1],
        ];

        for (const [dx, dy] of offsets) {
            if (mergedNodes.length >= minSize * 2) break; // Don't merge too many

            // Find adjacent cell in grid
            for (const [adjKey, adjCell] of grid.entries()) {
                if (processed.has(adjKey)) continue;

                const adjX = Math.round(adjCell.x);
                const adjY = Math.round(adjCell.y);
                const cellX = Math.round(cell.x);
                const cellY = Math.round(cell.y);

                // Check if adjacent (within 1.5x cell distance)
                const distance = Math.sqrt((adjX - cellX) ** 2 + (adjY - cellY) ** 2);
                if (distance < this.config.galaxyCellSize * 1.5) {
                    mergedNodes.push(...adjCell.nodes);
                    processed.add(adjKey);
                }
            }
        }

        // Recalculate centroid
        const centroid = this.calculateCentroid(mergedNodes);

        return {
            x: centroid.x,
            y: centroid.y,
            nodes: mergedNodes,
        };
    }

    /**
     * Reduce cluster count by merging closest clusters
     */
    private reduceClusterCount(
        clusters: ClusterNode[],
        allNodes: UniverseNode[],
        level: ClusterLevel,
        nodeToCluster: Map<string, string>
    ): ClusterResult {
        // Sort by distance to origin, keep furthest ones
        const sorted = [...clusters].sort((a, b) => {
            const distA = Math.sqrt(a.x ** 2 + a.y ** 2);
            const distB = Math.sqrt(b.x ** 2 + b.y ** 2);
            return distB - distA;
        });

        // Keep only maxClustersPerLevel clusters
        const kept = sorted.slice(0, this.config.maxClustersPerLevel);
        const removed = sorted.slice(this.config.maxClustersPerLevel);

        // Merge removed clusters into nearest kept cluster
        for (const removedCluster of removed) {
            let nearestDist = Infinity;
            let nearestCluster: ClusterNode | null = null;

            for (const keptCluster of kept) {
                const dist = Math.sqrt(
                    (keptCluster.x - removedCluster.x) ** 2 +
                    (keptCluster.y - removedCluster.y) ** 2
                );
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestCluster = keptCluster;
                }
            }

            if (nearestCluster) {
                // Merge child IDs
                nearestCluster.childNodeIds.push(...removedCluster.childNodeIds);
                nearestCluster.totalDescendants += removedCluster.totalDescendants;

                // Update node-to-cluster mapping
                for (const nodeId of removedCluster.childNodeIds) {
                    nodeToCluster.set(nodeId, nearestCluster.id);
                }

                // Recalculate metrics
                nearestCluster.metrics = this.calculateMetrics(
                    nearestCluster.childNodeIds.map(id =>
                        allNodes.find(n => n.id === id)!
                    ).filter(Boolean)
                );
            }
        }

        return {
            clusters: kept,
            nodeToCluster,
            unclustered: [],
        };
    }

    // ========================================================================
    // CLUSTER CREATION
    // ========================================================================

    /**
     * Create a cluster node from a set of nodes
     */
    private createClusterFromNodes(
        nodes: UniverseNode[],
        level: ClusterLevel,
        index: number
    ): ClusterNode {
        const centroid = this.calculateCentroid(nodes);
        const metrics = this.calculateMetrics(nodes);
        const colors = this.determineClusterColors(nodes);
        const radius = this.calculateClusterRadius(nodes.length);

        // Generate cluster name
        const name = this.generateClusterName(nodes, level);

        // Determine which zoom levels this cluster should be visible at
        const visibleAtZoom = this.getVisibleZoomLevels(level);

        return {
            id: `${level}-${index}`,
            type: "cluster",
            name,
            clusterLevel: level,
            childNodeIds: nodes.map(n => n.id),
            totalDescendants: nodes.length,
            metrics,
            primaryDomainId: this.getPrimaryDomainId(nodes),
            x: centroid.x,
            y: centroid.y,
            radius,
            color: colors.base,
            glowColor: colors.glow,
            visibleAtZoom,
        };
    }

    /**
     * Calculate centroid of nodes
     */
    private calculateCentroid(nodes: UniverseNode[]): { x: number; y: number } {
        if (nodes.length === 0) return { x: 0, y: 0 };

        let sumX = 0;
        let sumY = 0;

        for (const node of nodes) {
            sumX += node.x;
            sumY += node.y;
        }

        return {
            x: sumX / nodes.length,
            y: sumY / nodes.length,
        };
    }

    /**
     * Calculate cluster radius based on node count
     */
    private calculateClusterRadius(nodeCount: number): number {
        // Logarithmic scaling for radius
        return this.config.baseRadius + Math.log2(nodeCount + 1) * this.config.radiusMultiplier * 10;
    }

    /**
     * Calculate aggregate metrics for a cluster
     */
    private calculateMetrics(nodes: UniverseNode[]): ClusterMetrics {
        let totalHours = 0;
        let completedCount = 0;
        let totalWithCompletion = 0;

        const difficultyBreakdown = {
            beginner: 0,
            intermediate: 0,
            advanced: 0,
            expert: 0,
        };

        for (const node of nodes) {
            // Estimate hours based on node type
            if (node.type === "star") {
                const star = node as any;
                totalWithCompletion++;
                if (star.completed) completedCount++;

                // Parse duration
                const durationMatch = star.duration?.match(/(\d+)/);
                if (durationMatch) {
                    totalHours += parseInt(durationMatch[1], 10) / 60;
                }
            } else if (node.type === "moon") {
                const moon = node as any;
                totalHours += (moon.sectionCount || 1) * 0.5;
            } else if (node.type === "planet") {
                const planet = node as any;
                totalHours += (planet.moons?.length || 0) * 2;
            }
        }

        return {
            totalHours: Math.round(totalHours * 10) / 10,
            completionPercent: totalWithCompletion > 0
                ? Math.round((completedCount / totalWithCompletion) * 100)
                : 0,
            nodeCount: nodes.length,
            completedCount,
            difficultyBreakdown,
        };
    }

    /**
     * Determine cluster colors based on contained nodes
     */
    private determineClusterColors(nodes: UniverseNode[]): { base: string; glow: string } {
        if (nodes.length === 0) {
            return { base: "#6b7280", glow: "rgba(107, 114, 128, 0.5)" };
        }

        // Use most common color
        const colorCounts = new Map<string, number>();
        for (const node of nodes) {
            colorCounts.set(node.color, (colorCounts.get(node.color) || 0) + 1);
        }

        let maxCount = 0;
        let dominantColor = nodes[0].color;
        for (const [color, count] of colorCounts) {
            if (count > maxCount) {
                maxCount = count;
                dominantColor = color;
            }
        }

        return {
            base: dominantColor,
            glow: `${dominantColor}80`,
        };
    }

    /**
     * Generate a descriptive name for the cluster
     */
    private generateClusterName(nodes: UniverseNode[], level: ClusterLevel): string {
        // Get unique names
        const names = [...new Set(nodes.map(n => n.name))];

        if (names.length === 1) {
            return names[0];
        }

        if (names.length === 2) {
            return `${names[0]} & ${names[1]}`;
        }

        // For more nodes, show count
        return `${names[0]} + ${names.length - 1} more`;
    }

    /**
     * Get the primary domain ID from nodes
     */
    private getPrimaryDomainId(nodes: UniverseNode[]): string | undefined {
        for (const node of nodes) {
            if (node.type === "planet") {
                return (node as any).domainId;
            }
        }
        return undefined;
    }

    /**
     * Determine which zoom levels a cluster should be visible at
     */
    private getVisibleZoomLevels(level: ClusterLevel): ZoomLevel[] {
        switch (level) {
            case "galaxy-cluster":
                return ["galaxy"];
            case "domain-cluster":
                return ["galaxy", "solar"];
            case "topic-cluster":
                return ["solar", "constellation"];
            default:
                return ["galaxy"];
        }
    }

    // ========================================================================
    // QUERY METHODS
    // ========================================================================

    /**
     * Get clusters for a specific scale
     */
    getClustersForScale(scale: number): ClusterNode[] {
        const { thresholds } = this.lodConfig;

        if (scale < thresholds.galaxyCluster) {
            return this.galaxyClusters;
        }

        if (scale < thresholds.domainCluster) {
            return this.domainClusters;
        }

        if (scale < thresholds.topicCluster) {
            return this.topicClusters;
        }

        return []; // Full detail, no clusters
    }

    /**
     * Get the cluster containing a specific node at a given level
     */
    getClusterForNode(nodeId: string, level: ClusterLevel): ClusterNode | undefined {
        let clusterMap: Map<string, string>;
        let clusters: ClusterNode[];

        switch (level) {
            case "galaxy-cluster":
                clusterMap = this.nodeToGalaxyCluster;
                clusters = this.galaxyClusters;
                break;
            case "domain-cluster":
                clusterMap = this.nodeToDomainCluster;
                clusters = this.domainClusters;
                break;
            case "topic-cluster":
                clusterMap = this.nodeToTopicCluster;
                clusters = this.topicClusters;
                break;
            default:
                return undefined;
        }

        const clusterId = clusterMap.get(nodeId);
        if (!clusterId) return undefined;

        return clusters.find(c => c.id === clusterId);
    }

    /**
     * Get all child nodes of a cluster
     */
    getClusterChildren(clusterId: string): UniverseNode[] {
        const cluster = [
            ...this.galaxyClusters,
            ...this.domainClusters,
            ...this.topicClusters,
        ].find(c => c.id === clusterId);

        if (!cluster) return [];

        // Note: This returns IDs, caller needs to resolve to actual nodes
        return []; // Placeholder - actual implementation would need node lookup
    }

    /**
     * Check if a cluster should show expansion affordance
     */
    shouldShowExpansionAffordance(cluster: ClusterNode, scale: number): boolean {
        const { thresholds } = this.lodConfig;

        switch (cluster.clusterLevel) {
            case "galaxy-cluster":
                return scale < thresholds.domainCluster;
            case "domain-cluster":
                return scale < thresholds.topicCluster;
            case "topic-cluster":
                return scale < thresholds.fullDetail;
            default:
                return false;
        }
    }

    // ========================================================================
    // CLUSTER STABILITY
    // ========================================================================

    /**
     * Ensure cluster positions remain stable during zoom
     * (prevents clusters from "jumping" to new positions)
     */
    ensureStablePositions(
        newClusters: ClusterNode[],
        existingClusters: ClusterNode[],
        maxDrift: number = 50
    ): ClusterNode[] {
        const existingMap = new Map(existingClusters.map(c => [c.id, c]));

        return newClusters.map(cluster => {
            const existing = existingMap.get(cluster.id);
            if (!existing) return cluster;

            // If position drifted too much, interpolate
            const drift = Math.sqrt(
                (cluster.x - existing.x) ** 2 +
                (cluster.y - existing.y) ** 2
            );

            if (drift > maxDrift) {
                // Gradually move toward new position
                const factor = maxDrift / drift;
                return {
                    ...cluster,
                    x: existing.x + (cluster.x - existing.x) * factor,
                    y: existing.y + (cluster.y - existing.y) * factor,
                };
            }

            return cluster;
        });
    }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new ClusterAggregator instance
 */
export function createClusterAggregator(
    config?: Partial<ClusterAggregatorConfig>,
    lodConfig?: LODConfig
): ClusterAggregator {
    return new ClusterAggregator(config, lodConfig);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate the visual reduction percentage from clustering
 */
export function calculateClutterReduction(
    originalNodeCount: number,
    clusterCount: number
): number {
    if (originalNodeCount === 0) return 0;
    return Math.round(((originalNodeCount - clusterCount) / originalNodeCount) * 100);
}

/**
 * Determine optimal cell size based on node density
 */
export function calculateOptimalCellSize(
    nodes: UniverseNode[],
    targetClusters: number = 8
): number {
    if (nodes.length === 0) return 200;

    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const node of nodes) {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const area = width * height;

    // Target approximately targetClusters clusters
    const cellArea = area / targetClusters;
    return Math.sqrt(cellArea);
}
