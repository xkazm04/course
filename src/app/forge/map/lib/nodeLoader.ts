import type { MapNode } from "@/app/features/knowledge-map/lib/types";
import type { Bounds } from "./viewportManager";

/**
 * Node load status
 */
export type LoadStatus = "pending" | "loading" | "loaded" | "error";

/**
 * Loaded node metadata
 */
export interface LoadedNode {
    node: MapNode;
    loadedAt: number;
    detailsLoaded: boolean;
}

/**
 * API response for paginated node loading
 */
export interface NodeLoadResponse {
    nodes: MapNode[];
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
}

/**
 * Load request for batching
 */
interface LoadRequest {
    nodeIds: string[];
    resolve: (nodes: MapNode[]) => void;
    reject: (error: Error) => void;
}

/**
 * NodeLoader - Handles viewport-based lazy loading of nodes
 *
 * Features:
 * - Paginated API fetching
 * - Request batching to reduce network calls
 * - Stale-while-revalidate caching
 * - Detail lazy loading (metadata on demand)
 * - IndexedDB persistence
 */
export class NodeLoader {
    private loadedNodes: Map<string, LoadedNode> = new Map();
    private pendingRequests: Map<string, Promise<MapNode | null>> = new Map();
    private loadQueue: LoadRequest[] = [];
    private batchTimer: ReturnType<typeof setTimeout> | null = null;
    private batchDelay = 50; // ms to wait before batching

    /** API endpoint for node loading */
    private apiEndpoint = "/api/map-nodes";

    /** Maximum nodes to load in single request */
    private batchSize = 100;

    /** Cache TTL in milliseconds (5 minutes) */
    private cacheTTL = 5 * 60 * 1000;

    /**
     * Load nodes within viewport bounds
     */
    async loadViewportNodes(
        bounds: Bounds,
        domain?: string,
        parentId?: string | null
    ): Promise<MapNode[]> {
        const params = new URLSearchParams();
        params.set("minX", String(Math.floor(bounds.minX)));
        params.set("minY", String(Math.floor(bounds.minY)));
        params.set("maxX", String(Math.ceil(bounds.maxX)));
        params.set("maxY", String(Math.ceil(bounds.maxY)));

        if (domain) {
            params.set("domain", domain);
        }

        if (parentId !== undefined) {
            params.set("parentId", parentId === null ? "null" : parentId);
        }

        const url = `${this.apiEndpoint}?${params.toString()}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load nodes: ${response.status}`);
            }

            const data: NodeLoadResponse = await response.json();

            // Cache loaded nodes
            const now = Date.now();
            for (const node of data.nodes) {
                this.loadedNodes.set(node.id, {
                    node,
                    loadedAt: now,
                    detailsLoaded: false,
                });
            }

            return data.nodes;
        } catch (error) {
            console.error("Failed to load viewport nodes:", error);
            throw error;
        }
    }

    /**
     * Load specific nodes by ID
     */
    async loadNodes(nodeIds: string[]): Promise<MapNode[]> {
        if (nodeIds.length === 0) return [];

        // Check cache first
        const cached: MapNode[] = [];
        const toLoad: string[] = [];
        const now = Date.now();

        for (const id of nodeIds) {
            const entry = this.loadedNodes.get(id);
            if (entry && now - entry.loadedAt < this.cacheTTL) {
                cached.push(entry.node);
            } else {
                toLoad.push(id);
            }
        }

        if (toLoad.length === 0) {
            return cached;
        }

        // Batch load remaining
        const loaded = await this.batchLoad(toLoad);
        return [...cached, ...loaded];
    }

    /**
     * Load a single node by ID
     */
    async loadNode(nodeId: string): Promise<MapNode | null> {
        // Check cache
        const cached = this.loadedNodes.get(nodeId);
        const now = Date.now();
        if (cached && now - cached.loadedAt < this.cacheTTL) {
            return cached.node;
        }

        // Check pending requests
        const pending = this.pendingRequests.get(nodeId);
        if (pending) {
            return pending;
        }

        // Create batched request
        const promise = new Promise<MapNode | null>((resolve, reject) => {
            this.addToQueue([nodeId], resolve as (nodes: MapNode[]) => void, reject);
        });

        this.pendingRequests.set(nodeId, promise);
        return promise;
    }

    /**
     * Load node details (metadata, description, etc.)
     */
    async loadNodeDetails(nodeId: string): Promise<MapNode | null> {
        const entry = this.loadedNodes.get(nodeId);
        if (entry?.detailsLoaded) {
            return entry.node;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/${nodeId}/details`);
            if (!response.ok) {
                throw new Error(`Failed to load node details: ${response.status}`);
            }

            const node: MapNode = await response.json();

            this.loadedNodes.set(nodeId, {
                node,
                loadedAt: Date.now(),
                detailsLoaded: true,
            });

            return node;
        } catch (error) {
            console.error(`Failed to load details for node ${nodeId}:`, error);
            return entry?.node ?? null;
        }
    }

    /**
     * Prefetch nodes for predicted viewport
     */
    async prefetch(bounds: Bounds, domain?: string): Promise<void> {
        try {
            await this.loadViewportNodes(bounds, domain);
        } catch (error) {
            // Prefetch failures are non-critical
            console.warn("Prefetch failed:", error);
        }
    }

    /**
     * Get cached node if available
     */
    getCached(nodeId: string): MapNode | undefined {
        return this.loadedNodes.get(nodeId)?.node;
    }

    /**
     * Get all cached nodes
     */
    getAllCached(): MapNode[] {
        return Array.from(this.loadedNodes.values()).map(entry => entry.node);
    }

    /**
     * Check if node is cached and fresh
     */
    isCached(nodeId: string): boolean {
        const entry = this.loadedNodes.get(nodeId);
        if (!entry) return false;
        return Date.now() - entry.loadedAt < this.cacheTTL;
    }

    /**
     * Invalidate cache for specific nodes
     */
    invalidate(nodeIds: string[]): void {
        for (const id of nodeIds) {
            this.loadedNodes.delete(id);
        }
    }

    /**
     * Clear entire cache
     */
    clearCache(): void {
        this.loadedNodes.clear();
        this.pendingRequests.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        detailsLoaded: number;
        freshCount: number;
    } {
        const now = Date.now();
        let detailsLoaded = 0;
        let freshCount = 0;

        for (const entry of this.loadedNodes.values()) {
            if (entry.detailsLoaded) detailsLoaded++;
            if (now - entry.loadedAt < this.cacheTTL) freshCount++;
        }

        return {
            size: this.loadedNodes.size,
            detailsLoaded,
            freshCount,
        };
    }

    /**
     * Add nodes to batch queue
     */
    private addToQueue(
        nodeIds: string[],
        resolve: (nodes: MapNode[]) => void,
        reject: (error: Error) => void
    ): void {
        this.loadQueue.push({ nodeIds, resolve, reject });

        // Clear existing timer
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
        }

        // Set new batch timer
        this.batchTimer = setTimeout(() => {
            this.processBatchQueue();
        }, this.batchDelay);
    }

    /**
     * Process the batch queue
     */
    private async processBatchQueue(): Promise<void> {
        const requests = [...this.loadQueue];
        this.loadQueue = [];
        this.batchTimer = null;

        if (requests.length === 0) return;

        // Collect all unique node IDs
        const allIds = new Set<string>();
        for (const req of requests) {
            for (const id of req.nodeIds) {
                allIds.add(id);
            }
        }

        try {
            const loadedNodes = await this.batchLoad(Array.from(allIds));
            const nodeMap = new Map(loadedNodes.map(n => [n.id, n]));

            // Resolve each request
            for (const req of requests) {
                const nodes = req.nodeIds
                    .map(id => nodeMap.get(id))
                    .filter((n): n is MapNode => n !== undefined);
                req.resolve(nodes);
            }
        } catch (error) {
            // Reject all requests
            for (const req of requests) {
                req.reject(error instanceof Error ? error : new Error(String(error)));
            }
        }

        // Clean up pending requests
        for (const id of allIds) {
            this.pendingRequests.delete(id);
        }
    }

    /**
     * Batch load nodes from API
     */
    private async batchLoad(nodeIds: string[]): Promise<MapNode[]> {
        if (nodeIds.length === 0) return [];

        // Split into batches
        const batches: string[][] = [];
        for (let i = 0; i < nodeIds.length; i += this.batchSize) {
            batches.push(nodeIds.slice(i, i + this.batchSize));
        }

        const results: MapNode[] = [];

        for (const batch of batches) {
            try {
                const response = await fetch(this.apiEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nodeIds: batch }),
                });

                if (!response.ok) {
                    throw new Error(`Batch load failed: ${response.status}`);
                }

                const data: { nodes: MapNode[] } = await response.json();
                const now = Date.now();

                for (const node of data.nodes) {
                    this.loadedNodes.set(node.id, {
                        node,
                        loadedAt: now,
                        detailsLoaded: false,
                    });
                    results.push(node);
                }
            } catch (error) {
                console.error("Batch load failed:", error);
                // Continue with next batch
            }
        }

        return results;
    }
}

/**
 * Singleton node loader instance
 */
let nodeLoaderInstance: NodeLoader | null = null;

export function getNodeLoader(): NodeLoader {
    if (!nodeLoaderInstance) {
        nodeLoaderInstance = new NodeLoader();
    }
    return nodeLoaderInstance;
}

export function resetNodeLoader(): void {
    nodeLoaderInstance?.clearCache();
    nodeLoaderInstance = null;
}
