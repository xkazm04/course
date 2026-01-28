/**
 * Spatial Indexing for Universe Renderer
 *
 * Implements a quadtree-based spatial index for efficient viewport culling.
 * This enables 60fps rendering even with hundreds of nodes by only processing
 * nodes that are visible in the current viewport.
 */

import type { UniverseNode, SpatialIndexConfig } from "./types";

// ============================================================================
// QUADTREE IMPLEMENTATION
// ============================================================================

interface QuadTreeNode {
    x: number;
    y: number;
    width: number;
    height: number;
    nodes: UniverseNode[];
    children: QuadTreeNode[] | null;
    depth: number;
}

const DEFAULT_CONFIG: SpatialIndexConfig = {
    maxNodesPerCell: 8,
    maxDepth: 6,
    worldBounds: {
        minX: -1000,
        maxX: 1000,
        minY: -1000,
        maxY: 1000,
    },
};

/**
 * Create an empty quadtree node
 */
function createQuadTreeNode(
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number
): QuadTreeNode {
    return {
        x,
        y,
        width,
        height,
        nodes: [],
        children: null,
        depth,
    };
}

/**
 * Check if a point is within a rectangle
 */
function pointInRect(
    px: number,
    py: number,
    rx: number,
    ry: number,
    rw: number,
    rh: number
): boolean {
    return px >= rx && px < rx + rw && py >= ry && py < ry + rh;
}

/**
 * Check if two rectangles intersect
 */
function rectsIntersect(
    ax: number,
    ay: number,
    aw: number,
    ah: number,
    bx: number,
    by: number,
    bw: number,
    bh: number
): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/**
 * Subdivide a quadtree node into 4 children
 */
function subdivide(node: QuadTreeNode): void {
    const halfW = node.width / 2;
    const halfH = node.height / 2;
    const newDepth = node.depth + 1;

    node.children = [
        createQuadTreeNode(node.x, node.y, halfW, halfH, newDepth), // NW
        createQuadTreeNode(node.x + halfW, node.y, halfW, halfH, newDepth), // NE
        createQuadTreeNode(node.x, node.y + halfH, halfW, halfH, newDepth), // SW
        createQuadTreeNode(node.x + halfW, node.y + halfH, halfW, halfH, newDepth), // SE
    ];
}

/**
 * Insert a node into the quadtree
 */
function insertNode(
    qtNode: QuadTreeNode,
    universeNode: UniverseNode,
    config: SpatialIndexConfig
): void {
    // Check if the node is within this cell
    if (!pointInRect(universeNode.x, universeNode.y, qtNode.x, qtNode.y, qtNode.width, qtNode.height)) {
        return;
    }

    // If this node has children, insert into appropriate child
    if (qtNode.children) {
        for (const child of qtNode.children) {
            insertNode(child, universeNode, config);
        }
        return;
    }

    // Add to this node
    qtNode.nodes.push(universeNode);

    // Subdivide if we exceed capacity and haven't reached max depth
    if (qtNode.nodes.length > config.maxNodesPerCell && qtNode.depth < config.maxDepth) {
        subdivide(qtNode);

        // Redistribute nodes to children
        const nodesToRedistribute = [...qtNode.nodes];
        qtNode.nodes = [];

        for (const n of nodesToRedistribute) {
            for (const child of qtNode.children!) {
                insertNode(child, n, config);
            }
        }
    }
}

/**
 * Query nodes within a viewport rectangle
 */
function queryRect(
    qtNode: QuadTreeNode,
    qx: number,
    qy: number,
    qw: number,
    qh: number,
    result: UniverseNode[]
): void {
    // Check if query rect intersects this cell
    if (!rectsIntersect(qtNode.x, qtNode.y, qtNode.width, qtNode.height, qx, qy, qw, qh)) {
        return;
    }

    // Add nodes from this cell that are in the query rect
    for (const node of qtNode.nodes) {
        if (pointInRect(node.x, node.y, qx, qy, qw, qh)) {
            result.push(node);
        }
    }

    // Query children
    if (qtNode.children) {
        for (const child of qtNode.children) {
            queryRect(child, qx, qy, qw, qh, result);
        }
    }
}

// ============================================================================
// SPATIAL INDEX CLASS
// ============================================================================

export class SpatialIndex {
    private root: QuadTreeNode;
    private config: SpatialIndexConfig;
    private nodeCount: number = 0;

    constructor(config: Partial<SpatialIndexConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        const { minX, maxX, minY, maxY } = this.config.worldBounds;

        this.root = createQuadTreeNode(minX, minY, maxX - minX, maxY - minY, 0);
    }

    /**
     * Build the spatial index from a list of nodes
     */
    build(nodes: UniverseNode[]): void {
        // Reset the tree
        const { minX, maxX, minY, maxY } = this.config.worldBounds;
        this.root = createQuadTreeNode(minX, minY, maxX - minX, maxY - minY, 0);
        this.nodeCount = 0;

        // Insert all nodes
        for (const node of nodes) {
            insertNode(this.root, node, this.config);
            this.nodeCount++;
        }
    }

    /**
     * Query nodes visible in a viewport
     */
    queryViewport(
        viewportX: number,
        viewportY: number,
        viewportWidth: number,
        viewportHeight: number,
        scale: number,
        margin: number = 100
    ): UniverseNode[] {
        // Convert viewport to world coordinates
        const scaledMargin = margin / scale;
        const worldX = viewportX - scaledMargin;
        const worldY = viewportY - scaledMargin;
        const worldWidth = viewportWidth / scale + scaledMargin * 2;
        const worldHeight = viewportHeight / scale + scaledMargin * 2;

        const result: UniverseNode[] = [];
        queryRect(this.root, worldX, worldY, worldWidth, worldHeight, result);

        return result;
    }

    /**
     * Get statistics about the index
     */
    getStats(): { nodeCount: number; depth: number; cellCount: number } {
        let maxDepth = 0;
        let cellCount = 0;

        const traverse = (node: QuadTreeNode) => {
            cellCount++;
            maxDepth = Math.max(maxDepth, node.depth);

            if (node.children) {
                for (const child of node.children) {
                    traverse(child);
                }
            }
        };

        traverse(this.root);

        return {
            nodeCount: this.nodeCount,
            depth: maxDepth,
            cellCount,
        };
    }
}

// ============================================================================
// FRUSTUM CULLING UTILITIES
// ============================================================================

/**
 * Calculate visible bounds for the current camera state
 */
export function calculateVisibleBounds(
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number,
    scale: number
): { minX: number; maxX: number; minY: number; maxY: number } {
    const halfWidth = viewportWidth / (2 * scale);
    const halfHeight = viewportHeight / (2 * scale);

    return {
        minX: cameraX - halfWidth,
        maxX: cameraX + halfWidth,
        minY: cameraY - halfHeight,
        maxY: cameraY + halfHeight,
    };
}

/**
 * Check if a node is visible in the viewport
 */
export function isNodeVisible(
    node: UniverseNode,
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
    margin: number = 50
): boolean {
    return (
        node.x + node.radius + margin >= bounds.minX &&
        node.x - node.radius - margin <= bounds.maxX &&
        node.y + node.radius + margin >= bounds.minY &&
        node.y - node.radius - margin <= bounds.maxY
    );
}

/**
 * Sort nodes by distance from camera (for rendering order)
 */
export function sortNodesByDepth(
    nodes: UniverseNode[],
    cameraX: number,
    cameraY: number
): UniverseNode[] {
    return [...nodes].sort((a, b) => {
        // Clusters first (background), then planets, moons, stars, asteroids, comets
        const typeOrder: Record<string, number> = {
            cluster: -1,  // Render clusters first (background)
            planet: 0,
            moon: 1,
            star: 2,
            asteroid: 3,
            comet: 4,
        };
        const typeA = typeOrder[a.type] ?? 2;
        const typeB = typeOrder[b.type] ?? 2;

        if (typeA !== typeB) {
            return typeA - typeB;
        }

        // Within same type, sort by distance (further = render first)
        const distA = Math.sqrt((a.x - cameraX) ** 2 + (a.y - cameraY) ** 2);
        const distB = Math.sqrt((b.x - cameraX) ** 2 + (b.y - cameraY) ** 2);

        return distB - distA;
    });
}
