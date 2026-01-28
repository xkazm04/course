import type { ViewportState, Point, HexLayoutNode } from "./types";

/**
 * Bounding box in screen coordinates
 */
export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/**
 * Extended bounds for prefetching
 */
export interface ExtendedBounds {
    /** Visible viewport bounds */
    visible: Bounds;
    /** Extended bounds for prefetching (1.5x viewport) */
    prefetch: Bounds;
    /** Far bounds for LOD clustering (2x viewport) */
    farBounds: Bounds;
}

/**
 * Pan velocity for prediction
 */
export interface PanVelocity {
    vx: number;
    vy: number;
    timestamp: number;
}

/**
 * ViewportManager - Manages viewport bounds and visibility calculations
 *
 * Responsibilities:
 * - Calculate visible bounds from viewport state
 * - Determine which nodes are visible
 * - Track pan velocity for prefetch prediction
 * - Provide extended bounds for different LOD tiers
 */
export class ViewportManager {
    private width: number = 0;
    private height: number = 0;
    private viewport: ViewportState = { scale: 1, offsetX: 0, offsetY: 0 };
    private velocityHistory: PanVelocity[] = [];
    private maxVelocityHistory = 5;

    /**
     * Update viewport dimensions
     */
    setDimensions(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    /**
     * Update viewport state and track velocity
     */
    setViewport(viewport: ViewportState): void {
        // Calculate velocity from position change
        const now = Date.now();
        const lastVelocity = this.velocityHistory[this.velocityHistory.length - 1];

        if (lastVelocity) {
            const dt = now - lastVelocity.timestamp;
            if (dt > 0 && dt < 100) { // Only track if recent
                const vx = (viewport.offsetX - this.viewport.offsetX) / dt;
                const vy = (viewport.offsetY - this.viewport.offsetY) / dt;

                this.velocityHistory.push({ vx, vy, timestamp: now });

                // Keep only recent history
                if (this.velocityHistory.length > this.maxVelocityHistory) {
                    this.velocityHistory.shift();
                }
            }
        } else {
            this.velocityHistory.push({ vx: 0, vy: 0, timestamp: now });
        }

        this.viewport = viewport;
    }

    /**
     * Get current visible bounds in world coordinates
     */
    getVisibleBounds(): Bounds {
        const { scale, offsetX, offsetY } = this.viewport;

        // Convert screen coordinates to world coordinates
        const minX = -offsetX / scale;
        const minY = -offsetY / scale;
        const maxX = (this.width - offsetX) / scale;
        const maxY = (this.height - offsetY) / scale;

        return { minX, minY, maxX, maxY };
    }

    /**
     * Get extended bounds for different visibility tiers
     */
    getExtendedBounds(): ExtendedBounds {
        const visible = this.getVisibleBounds();
        const width = visible.maxX - visible.minX;
        const height = visible.maxY - visible.minY;

        // Prefetch bounds: 1.5x viewport in pan direction
        const velocity = this.getSmoothedVelocity();
        const prefetchPadding = 0.5;
        const dirX = velocity.vx > 0 ? 1 : velocity.vx < 0 ? -1 : 0;
        const dirY = velocity.vy > 0 ? 1 : velocity.vy < 0 ? -1 : 0;

        const prefetch: Bounds = {
            minX: visible.minX - width * prefetchPadding * (dirX < 0 ? 1.5 : 0.5),
            minY: visible.minY - height * prefetchPadding * (dirY < 0 ? 1.5 : 0.5),
            maxX: visible.maxX + width * prefetchPadding * (dirX > 0 ? 1.5 : 0.5),
            maxY: visible.maxY + height * prefetchPadding * (dirY > 0 ? 1.5 : 0.5),
        };

        // Far bounds: 2x viewport for LOD clustering
        const farPadding = 1.0;
        const farBounds: Bounds = {
            minX: visible.minX - width * farPadding,
            minY: visible.minY - height * farPadding,
            maxX: visible.maxX + width * farPadding,
            maxY: visible.maxY + height * farPadding,
        };

        return { visible, prefetch, farBounds };
    }

    /**
     * Check if a point is within bounds
     */
    isPointInBounds(point: Point, bounds: Bounds, padding = 0): boolean {
        return (
            point.x >= bounds.minX - padding &&
            point.x <= bounds.maxX + padding &&
            point.y >= bounds.minY - padding &&
            point.y <= bounds.maxY + padding
        );
    }

    /**
     * Check if a node is visible (with optional padding for hex size)
     */
    isNodeVisible(node: HexLayoutNode, hexSize = 70): boolean {
        const bounds = this.getVisibleBounds();
        return this.isPointInBounds(node.pixel, bounds, hexSize);
    }

    /**
     * Filter nodes to only those visible in viewport
     */
    getVisibleNodes<T extends HexLayoutNode>(nodes: T[], hexSize = 70): T[] {
        const bounds = this.getVisibleBounds();
        return nodes.filter(node => this.isPointInBounds(node.pixel, bounds, hexSize));
    }

    /**
     * Filter nodes by visibility tier
     */
    categorizeNodes<T extends HexLayoutNode>(nodes: T[], hexSize = 70): {
        visible: T[];
        prefetch: T[];
        far: T[];
        hidden: T[];
    } {
        const { visible, prefetch, farBounds } = this.getExtendedBounds();

        const result = {
            visible: [] as T[],
            prefetch: [] as T[],
            far: [] as T[],
            hidden: [] as T[],
        };

        for (const node of nodes) {
            if (this.isPointInBounds(node.pixel, visible, hexSize)) {
                result.visible.push(node);
            } else if (this.isPointInBounds(node.pixel, prefetch, hexSize)) {
                result.prefetch.push(node);
            } else if (this.isPointInBounds(node.pixel, farBounds, hexSize)) {
                result.far.push(node);
            } else {
                result.hidden.push(node);
            }
        }

        return result;
    }

    /**
     * Get smoothed pan velocity (average of recent samples)
     */
    getSmoothedVelocity(): PanVelocity {
        if (this.velocityHistory.length === 0) {
            return { vx: 0, vy: 0, timestamp: Date.now() };
        }

        let totalVx = 0;
        let totalVy = 0;

        for (const v of this.velocityHistory) {
            totalVx += v.vx;
            totalVy += v.vy;
        }

        return {
            vx: totalVx / this.velocityHistory.length,
            vy: totalVy / this.velocityHistory.length,
            timestamp: Date.now(),
        };
    }

    /**
     * Predict future viewport position based on velocity
     */
    predictPosition(msAhead: number): { offsetX: number; offsetY: number } {
        const velocity = this.getSmoothedVelocity();
        return {
            offsetX: this.viewport.offsetX + velocity.vx * msAhead,
            offsetY: this.viewport.offsetY + velocity.vy * msAhead,
        };
    }

    /**
     * Get predicted visible bounds for prefetching
     */
    getPredictedBounds(msAhead: number): Bounds {
        const predicted = this.predictPosition(msAhead);
        const { scale } = this.viewport;

        const minX = -predicted.offsetX / scale;
        const minY = -predicted.offsetY / scale;
        const maxX = (this.width - predicted.offsetX) / scale;
        const maxY = (this.height - predicted.offsetY) / scale;

        return { minX, minY, maxX, maxY };
    }

    /**
     * Get current zoom level as a tier (for LOD decisions)
     */
    getZoomTier(): "far" | "medium" | "close" {
        const { scale } = this.viewport;
        if (scale < 0.5) return "far";
        if (scale < 1.2) return "medium";
        return "close";
    }

    /**
     * Screen to world coordinate conversion
     */
    screenToWorld(screenX: number, screenY: number): Point {
        const { scale, offsetX, offsetY } = this.viewport;
        return {
            x: (screenX - offsetX) / scale,
            y: (screenY - offsetY) / scale,
        };
    }

    /**
     * World to screen coordinate conversion
     */
    worldToScreen(worldX: number, worldY: number): Point {
        const { scale, offsetX, offsetY } = this.viewport;
        return {
            x: worldX * scale + offsetX,
            y: worldY * scale + offsetY,
        };
    }

    /**
     * Get viewport state
     */
    getViewport(): ViewportState {
        return { ...this.viewport };
    }

    /**
     * Get dimensions
     */
    getDimensions(): { width: number; height: number } {
        return { width: this.width, height: this.height };
    }

    /**
     * Reset velocity tracking (e.g., after drill-down)
     */
    resetVelocity(): void {
        this.velocityHistory = [];
    }
}

/**
 * Singleton instance for global viewport management
 */
let viewportManagerInstance: ViewportManager | null = null;

export function getViewportManager(): ViewportManager {
    if (!viewportManagerInstance) {
        viewportManagerInstance = new ViewportManager();
    }
    return viewportManagerInstance;
}

export function resetViewportManager(): void {
    viewportManagerInstance = null;
}
