import type { Point, HexLayoutNode } from "./types";
import type { Bounds } from "./viewportManager";

/**
 * Quadtree node capacity before subdivision
 */
const MAX_CAPACITY = 8;

/**
 * Maximum tree depth to prevent infinite subdivision
 */
const MAX_DEPTH = 10;

/**
 * Quadtree node for spatial indexing
 */
interface QuadTreeNode<T extends { pixel: Point }> {
    bounds: Bounds;
    items: T[];
    children: QuadTreeNode<T>[] | null;
    depth: number;
}

/**
 * SpatialIndex - Quadtree-based spatial index for O(log n) viewport queries
 *
 * Features:
 * - Fast range queries for viewport-based node loading
 * - Efficient node insertion/removal
 * - Cluster aggregation for LOD
 * - K-nearest-neighbor queries
 */
export class SpatialIndex<T extends { id: string; pixel: Point }> {
    private root: QuadTreeNode<T>;
    private nodeMap: Map<string, { item: T; node: QuadTreeNode<T> }> = new Map();
    private worldBounds: Bounds;

    constructor(worldBounds?: Bounds) {
        this.worldBounds = worldBounds ?? {
            minX: -10000,
            minY: -10000,
            maxX: 10000,
            maxY: 10000,
        };
        this.root = this.createNode(this.worldBounds, 0);
    }

    /**
     * Create a new quadtree node
     */
    private createNode(bounds: Bounds, depth: number): QuadTreeNode<T> {
        return {
            bounds,
            items: [],
            children: null,
            depth,
        };
    }

    /**
     * Insert an item into the index
     */
    insert(item: T): boolean {
        if (!this.isPointInBounds(item.pixel, this.worldBounds)) {
            // Expand world bounds if needed
            this.expandWorldBounds(item.pixel);
        }

        const node = this.insertIntoNode(this.root, item);
        if (node) {
            this.nodeMap.set(item.id, { item, node });
            return true;
        }
        return false;
    }

    /**
     * Insert item into a specific node
     */
    private insertIntoNode(node: QuadTreeNode<T>, item: T): QuadTreeNode<T> | null {
        if (!this.isPointInBounds(item.pixel, node.bounds)) {
            return null;
        }

        // If node has children, insert into appropriate child
        if (node.children) {
            for (const child of node.children) {
                const result = this.insertIntoNode(child, item);
                if (result) return result;
            }
            // Shouldn't happen if bounds are correct
            return null;
        }

        // Add to this node
        node.items.push(item);

        // Subdivide if over capacity and not at max depth
        if (node.items.length > MAX_CAPACITY && node.depth < MAX_DEPTH) {
            this.subdivide(node);
        }

        return node;
    }

    /**
     * Subdivide a node into 4 children
     */
    private subdivide(node: QuadTreeNode<T>): void {
        const { minX, minY, maxX, maxY } = node.bounds;
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        const nextDepth = node.depth + 1;

        node.children = [
            this.createNode({ minX, minY, maxX: midX, maxY: midY }, nextDepth), // NW
            this.createNode({ minX: midX, minY, maxX, maxY: midY }, nextDepth), // NE
            this.createNode({ minX, minY: midY, maxX: midX, maxY }, nextDepth), // SW
            this.createNode({ minX: midX, minY: midY, maxX, maxY }, nextDepth), // SE
        ];

        // Redistribute items to children
        const items = node.items;
        node.items = [];

        for (const item of items) {
            for (const child of node.children) {
                if (this.isPointInBounds(item.pixel, child.bounds)) {
                    child.items.push(item);
                    this.nodeMap.set(item.id, { item, node: child });
                    break;
                }
            }
        }
    }

    /**
     * Remove an item from the index
     */
    remove(id: string): boolean {
        const entry = this.nodeMap.get(id);
        if (!entry) return false;

        const idx = entry.node.items.findIndex(item => item.id === id);
        if (idx !== -1) {
            entry.node.items.splice(idx, 1);
        }

        this.nodeMap.delete(id);
        return true;
    }

    /**
     * Update an item's position
     */
    update(item: T): boolean {
        const entry = this.nodeMap.get(item.id);
        if (!entry) {
            return this.insert(item);
        }

        // Check if item is still in same node
        if (this.isPointInBounds(item.pixel, entry.node.bounds)) {
            // Update in place
            const idx = entry.node.items.findIndex(i => i.id === item.id);
            if (idx !== -1) {
                entry.node.items[idx] = item;
                entry.item = item;
            }
            return true;
        }

        // Remove and reinsert
        this.remove(item.id);
        return this.insert(item);
    }

    /**
     * Query items within bounds
     */
    query(bounds: Bounds): T[] {
        const results: T[] = [];
        this.queryNode(this.root, bounds, results);
        return results;
    }

    /**
     * Query a specific node and its children
     */
    private queryNode(node: QuadTreeNode<T>, bounds: Bounds, results: T[]): void {
        // Check if query bounds intersect node bounds
        if (!this.boundsIntersect(node.bounds, bounds)) {
            return;
        }

        // Add items from this node that are within bounds
        for (const item of node.items) {
            if (this.isPointInBounds(item.pixel, bounds)) {
                results.push(item);
            }
        }

        // Query children
        if (node.children) {
            for (const child of node.children) {
                this.queryNode(child, bounds, results);
            }
        }
    }

    /**
     * Query count of items within bounds (faster than full query)
     */
    queryCount(bounds: Bounds): number {
        const counter = { count: 0 };
        this.queryCountNode(this.root, bounds, counter);
        return counter.count;
    }

    private queryCountNode(node: QuadTreeNode<T>, bounds: Bounds, counter: { count: number }): void {
        if (!this.boundsIntersect(node.bounds, bounds)) {
            return;
        }

        // If node is fully contained, add all items
        if (this.boundsContains(bounds, node.bounds)) {
            counter.count += this.getNodeTotalCount(node);
            return;
        }

        // Count items in this node
        for (const item of node.items) {
            if (this.isPointInBounds(item.pixel, bounds)) {
                counter.count++;
            }
        }

        // Query children
        if (node.children) {
            for (const child of node.children) {
                this.queryCountNode(child, bounds, counter);
            }
        }
    }

    /**
     * Get total item count in a node and all children
     */
    private getNodeTotalCount(node: QuadTreeNode<T>): number {
        let count = node.items.length;
        if (node.children) {
            for (const child of node.children) {
                count += this.getNodeTotalCount(child);
            }
        }
        return count;
    }

    /**
     * Find k nearest neighbors to a point
     */
    kNearest(point: Point, k: number): T[] {
        const candidates: Array<{ item: T; dist: number }> = [];

        // Query items in expanding bounds until we have k candidates
        let radius = 500;
        while (candidates.length < k && radius < 50000) {
            const bounds: Bounds = {
                minX: point.x - radius,
                minY: point.y - radius,
                maxX: point.x + radius,
                maxY: point.y + radius,
            };

            const items = this.query(bounds);
            candidates.length = 0;

            for (const item of items) {
                const dist = this.distance(point, item.pixel);
                candidates.push({ item, dist });
            }

            radius *= 2;
        }

        // Sort by distance and return k nearest
        candidates.sort((a, b) => a.dist - b.dist);
        return candidates.slice(0, k).map(c => c.item);
    }

    /**
     * Get cluster centers for LOD visualization
     * Groups nearby nodes into clusters at given grid size
     */
    getClusters(bounds: Bounds, gridSize: number): Array<{
        center: Point;
        count: number;
        items: T[];
    }> {
        const items = this.query(bounds);
        const clusters = new Map<string, { center: Point; count: number; items: T[] }>();

        for (const item of items) {
            // Calculate grid cell
            const cellX = Math.floor(item.pixel.x / gridSize);
            const cellY = Math.floor(item.pixel.y / gridSize);
            const key = `${cellX},${cellY}`;

            const existing = clusters.get(key);
            if (existing) {
                existing.count++;
                existing.items.push(item);
                // Update center to average
                existing.center.x = existing.items.reduce((sum, i) => sum + i.pixel.x, 0) / existing.count;
                existing.center.y = existing.items.reduce((sum, i) => sum + i.pixel.y, 0) / existing.count;
            } else {
                clusters.set(key, {
                    center: { ...item.pixel },
                    count: 1,
                    items: [item],
                });
            }
        }

        return Array.from(clusters.values());
    }

    /**
     * Bulk insert multiple items
     */
    bulkInsert(items: T[]): void {
        // Calculate optimal bounds
        if (items.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const item of items) {
                minX = Math.min(minX, item.pixel.x);
                minY = Math.min(minY, item.pixel.y);
                maxX = Math.max(maxX, item.pixel.x);
                maxY = Math.max(maxY, item.pixel.y);
            }

            // Expand bounds with padding
            const padding = Math.max(maxX - minX, maxY - minY) * 0.5;
            this.worldBounds = {
                minX: minX - padding,
                minY: minY - padding,
                maxX: maxX + padding,
                maxY: maxY + padding,
            };
            this.root = this.createNode(this.worldBounds, 0);
        }

        for (const item of items) {
            this.insert(item);
        }
    }

    /**
     * Clear the entire index
     */
    clear(): void {
        this.root = this.createNode(this.worldBounds, 0);
        this.nodeMap.clear();
    }

    /**
     * Get all items in the index
     */
    getAll(): T[] {
        return Array.from(this.nodeMap.values()).map(e => e.item);
    }

    /**
     * Get item by ID
     */
    get(id: string): T | undefined {
        return this.nodeMap.get(id)?.item;
    }

    /**
     * Get total item count
     */
    get size(): number {
        return this.nodeMap.size;
    }

    // Utility methods
    private isPointInBounds(point: Point, bounds: Bounds): boolean {
        return (
            point.x >= bounds.minX &&
            point.x <= bounds.maxX &&
            point.y >= bounds.minY &&
            point.y <= bounds.maxY
        );
    }

    private boundsIntersect(a: Bounds, b: Bounds): boolean {
        return !(
            a.maxX < b.minX ||
            a.minX > b.maxX ||
            a.maxY < b.minY ||
            a.minY > b.maxY
        );
    }

    private boundsContains(outer: Bounds, inner: Bounds): boolean {
        return (
            inner.minX >= outer.minX &&
            inner.maxX <= outer.maxX &&
            inner.minY >= outer.minY &&
            inner.maxY <= outer.maxY
        );
    }

    private distance(a: Point, b: Point): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private expandWorldBounds(point: Point): void {
        const padding = 1000;
        if (point.x < this.worldBounds.minX) {
            this.worldBounds.minX = point.x - padding;
        }
        if (point.x > this.worldBounds.maxX) {
            this.worldBounds.maxX = point.x + padding;
        }
        if (point.y < this.worldBounds.minY) {
            this.worldBounds.minY = point.y - padding;
        }
        if (point.y > this.worldBounds.maxY) {
            this.worldBounds.maxY = point.y + padding;
        }

        // Rebuild tree with new bounds
        const allItems = this.getAll();
        this.root = this.createNode(this.worldBounds, 0);
        this.nodeMap.clear();
        for (const item of allItems) {
            this.insert(item);
        }
    }
}

/**
 * Create a spatial index for HexLayoutNodes
 */
export function createNodeSpatialIndex(nodes: HexLayoutNode[] = []): SpatialIndex<HexLayoutNode> {
    const index = new SpatialIndex<HexLayoutNode>();
    if (nodes.length > 0) {
        index.bulkInsert(nodes);
    }
    return index;
}
