/**
 * World Coordinator
 *
 * A unified system that owns both the camera state and spatial queries,
 * providing a single source of truth for world-to-screen transformations,
 * viewport culling, and animation. This eliminates repeated scale/offset
 * calculations scattered across components.
 */

import type {
    UniverseNode,
    CameraState,
    ZoomLevel,
    SpatialIndexConfig,
    ViewportState,
} from "./types";
import { ZOOM_LEVEL_CONFIGS } from "./types";

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface WorldCoordinatorConfig {
    // Camera settings
    minScale: number;
    maxScale: number;
    zoomSensitivity: number;
    panSensitivity: number;
    animationDuration: number;
    animationEasing: (t: number) => number;
    // Spatial settings
    maxNodesPerCell: number;
    maxDepth: number;
    worldBounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
    // Viewport margin for culling (in pixels)
    viewportMargin: number;
}

const DEFAULT_CONFIG: WorldCoordinatorConfig = {
    minScale: 0.1,
    maxScale: 4.0,
    zoomSensitivity: 0.002,
    panSensitivity: 1,
    animationDuration: 300,
    animationEasing: (t) => 1 - Math.pow(1 - t, 3), // Ease out cubic
    maxNodesPerCell: 8,
    maxDepth: 6,
    worldBounds: {
        minX: -2000,
        maxX: 2000,
        minY: -2000,
        maxY: 2000,
    },
    viewportMargin: 100,
};

// ============================================================================
// QUADTREE NODE
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

function createQuadTreeNode(
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number
): QuadTreeNode {
    return { x, y, width, height, nodes: [], children: null, depth };
}

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

function subdivide(node: QuadTreeNode): void {
    const halfW = node.width / 2;
    const halfH = node.height / 2;
    const newDepth = node.depth + 1;

    node.children = [
        createQuadTreeNode(node.x, node.y, halfW, halfH, newDepth),
        createQuadTreeNode(node.x + halfW, node.y, halfW, halfH, newDepth),
        createQuadTreeNode(node.x, node.y + halfH, halfW, halfH, newDepth),
        createQuadTreeNode(node.x + halfW, node.y + halfH, halfW, halfH, newDepth),
    ];
}

// ============================================================================
// VISIBLE BOUNDS INTERFACE
// ============================================================================

export interface VisibleBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
}

// ============================================================================
// WORLD COORDINATOR CLASS
// ============================================================================

export class WorldCoordinator {
    private config: WorldCoordinatorConfig;
    private _camera: CameraState;
    private _viewport: ViewportState;
    private quadTreeRoot: QuadTreeNode;
    private nodeCount: number = 0;
    private allNodes: UniverseNode[] = [];

    // Animation state
    private animationFrame: number | null = null;
    private animationStart: { x: number; y: number; scale: number } | null = null;
    private animationStartTime: number = 0;

    // Listeners for state changes
    private listeners: Set<() => void> = new Set();

    constructor(config: Partial<WorldCoordinatorConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        this._camera = {
            x: 0,
            y: 0,
            scale: 0.5,
            targetX: 0,
            targetY: 0,
            targetScale: 0.5,
        };

        this._viewport = {
            width: 800,
            height: 600,
            centerX: 400,
            centerY: 300,
        };

        const { minX, maxX, minY, maxY } = this.config.worldBounds;
        this.quadTreeRoot = createQuadTreeNode(minX, minY, maxX - minX, maxY - minY, 0);
    }

    // ========================================================================
    // STATE ACCESSORS
    // ========================================================================

    get camera(): CameraState {
        return this._camera;
    }

    get viewport(): ViewportState {
        return this._viewport;
    }

    get scale(): number {
        return this._camera.scale;
    }

    get zoomLevel(): ZoomLevel {
        const scale = this._camera.scale;
        for (const config of ZOOM_LEVEL_CONFIGS) {
            if (scale >= config.minScale && scale < config.maxScale) {
                return config.level;
            }
        }
        return scale < ZOOM_LEVEL_CONFIGS[0].minScale ? "galaxy" : "star";
    }

    // ========================================================================
    // VIEWPORT MANAGEMENT
    // ========================================================================

    setViewport(width: number, height: number): void {
        this._viewport = {
            width,
            height,
            centerX: width / 2,
            centerY: height / 2,
        };
        this.notify();
    }

    // ========================================================================
    // COORDINATE TRANSFORMATIONS (Single Source of Truth)
    // ========================================================================

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        const { x, y, scale } = this._camera;
        const { centerX, centerY } = this._viewport;

        return {
            x: x + (screenX - centerX) / scale,
            y: y + (screenY - centerY) / scale,
        };
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
        const { x, y, scale } = this._camera;
        const { centerX, centerY } = this._viewport;

        return {
            x: (worldX - x) * scale + centerX,
            y: (worldY - y) * scale + centerY,
        };
    }

    /**
     * Convert a world-space radius to screen-space radius
     */
    worldRadiusToScreen(worldRadius: number): number {
        return worldRadius * this._camera.scale;
    }

    /**
     * Convert a screen-space distance to world-space distance
     */
    screenDistanceToWorld(screenDistance: number): number {
        return screenDistance / this._camera.scale;
    }

    // ========================================================================
    // VISIBLE BOUNDS CALCULATION
    // ========================================================================

    /**
     * Calculate the visible bounds in world coordinates
     */
    getVisibleBounds(margin: number = 0): VisibleBounds {
        const { x, y, scale } = this._camera;
        const { width, height } = this._viewport;
        const worldMargin = margin / scale;

        const halfWidth = width / (2 * scale);
        const halfHeight = height / (2 * scale);

        return {
            minX: x - halfWidth - worldMargin,
            maxX: x + halfWidth + worldMargin,
            minY: y - halfHeight - worldMargin,
            maxY: y + halfHeight + worldMargin,
            width: (halfWidth + worldMargin) * 2,
            height: (halfHeight + worldMargin) * 2,
        };
    }

    /**
     * Check if a world-space point is within the visible viewport
     */
    isPointVisible(worldX: number, worldY: number, margin: number = 0): boolean {
        const bounds = this.getVisibleBounds(margin);
        return (
            worldX >= bounds.minX &&
            worldX <= bounds.maxX &&
            worldY >= bounds.minY &&
            worldY <= bounds.maxY
        );
    }

    /**
     * Check if a node is visible in the viewport
     */
    isNodeVisible(node: UniverseNode, margin: number = 0): boolean {
        const bounds = this.getVisibleBounds(margin);
        return (
            node.x + node.radius >= bounds.minX &&
            node.x - node.radius <= bounds.maxX &&
            node.y + node.radius >= bounds.minY &&
            node.y - node.radius <= bounds.maxY
        );
    }

    // ========================================================================
    // SPATIAL INDEXING
    // ========================================================================

    /**
     * Build the spatial index from a list of nodes
     */
    buildIndex(nodes: UniverseNode[]): void {
        this.allNodes = nodes;
        this.nodeCount = nodes.length;

        const { minX, maxX, minY, maxY } = this.config.worldBounds;
        this.quadTreeRoot = createQuadTreeNode(minX, minY, maxX - minX, maxY - minY, 0);

        for (const node of nodes) {
            this.insertNode(this.quadTreeRoot, node);
        }
    }

    private insertNode(qtNode: QuadTreeNode, universeNode: UniverseNode): void {
        if (!pointInRect(universeNode.x, universeNode.y, qtNode.x, qtNode.y, qtNode.width, qtNode.height)) {
            return;
        }

        if (qtNode.children) {
            for (const child of qtNode.children) {
                this.insertNode(child, universeNode);
            }
            return;
        }

        qtNode.nodes.push(universeNode);

        if (qtNode.nodes.length > this.config.maxNodesPerCell && qtNode.depth < this.config.maxDepth) {
            subdivide(qtNode);
            const nodesToRedistribute = [...qtNode.nodes];
            qtNode.nodes = [];

            for (const n of nodesToRedistribute) {
                for (const child of qtNode.children!) {
                    this.insertNode(child, n);
                }
            }
        }
    }

    /**
     * Query nodes visible in the current viewport
     */
    queryVisibleNodes(zoomLevelFilter?: ZoomLevel): UniverseNode[] {
        const bounds = this.getVisibleBounds(this.config.viewportMargin);
        const result: UniverseNode[] = [];

        this.queryRect(
            this.quadTreeRoot,
            bounds.minX,
            bounds.minY,
            bounds.width,
            bounds.height,
            result
        );

        if (zoomLevelFilter) {
            return result.filter((n) => n.visibleAtZoom.includes(zoomLevelFilter));
        }

        return result;
    }

    private queryRect(
        qtNode: QuadTreeNode,
        qx: number,
        qy: number,
        qw: number,
        qh: number,
        result: UniverseNode[]
    ): void {
        if (!rectsIntersect(qtNode.x, qtNode.y, qtNode.width, qtNode.height, qx, qy, qw, qh)) {
            return;
        }

        for (const node of qtNode.nodes) {
            if (pointInRect(node.x, node.y, qx, qy, qw, qh)) {
                result.push(node);
            }
        }

        if (qtNode.children) {
            for (const child of qtNode.children) {
                this.queryRect(child, qx, qy, qw, qh, result);
            }
        }
    }

    /**
     * Find node at a screen position
     */
    findNodeAtScreenPosition(screenX: number, screenY: number, hitMargin: number = 10): UniverseNode | null {
        const world = this.screenToWorld(screenX, screenY);
        const worldHitMargin = this.screenDistanceToWorld(hitMargin);
        const zoomLevel = this.zoomLevel;

        // Filter by current zoom level visibility
        const visibleNodes = this.allNodes.filter((n) => n.visibleAtZoom.includes(zoomLevel));

        // Search from top (last rendered) to bottom
        for (let i = visibleNodes.length - 1; i >= 0; i--) {
            const node = visibleNodes[i];
            const dx = world.x - node.x;
            const dy = world.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= node.radius + worldHitMargin) {
                return node;
            }
        }

        return null;
    }

    /**
     * Sort nodes by rendering order (clusters first, then planets, moons, stars)
     */
    sortNodesByDepth(nodes: UniverseNode[]): UniverseNode[] {
        const { x, y } = this._camera;

        return [...nodes].sort((a, b) => {
            const typeOrder: Record<string, number> = {
                cluster: -1,  // Render clusters first (background)
                planet: 0,
                moon: 1,
                star: 2,
                asteroid: 3,
                comet: 3,
            };
            const typeA = typeOrder[a.type] ?? 3;
            const typeB = typeOrder[b.type] ?? 3;

            if (typeA !== typeB) {
                return typeA - typeB;
            }

            const distA = Math.sqrt((a.x - x) ** 2 + (a.y - y) ** 2);
            const distB = Math.sqrt((b.x - x) ** 2 + (b.y - y) ** 2);
            return distB - distA;
        });
    }

    /**
     * Get index statistics
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

        traverse(this.quadTreeRoot);

        return { nodeCount: this.nodeCount, depth: maxDepth, cellCount };
    }

    // ========================================================================
    // CAMERA CONTROLS
    // ========================================================================

    /**
     * Pan the camera by screen delta
     */
    pan(deltaX: number, deltaY: number): void {
        const worldDelta = {
            x: deltaX / this._camera.scale,
            y: deltaY / this._camera.scale,
        };

        this._camera = {
            ...this._camera,
            x: this._camera.x - worldDelta.x,
            y: this._camera.y - worldDelta.y,
            targetX: this._camera.targetX - worldDelta.x,
            targetY: this._camera.targetY - worldDelta.y,
        };
        this.notify();
    }

    /**
     * Zoom toward a screen position
     */
    zoom(delta: number, screenCenterX?: number, screenCenterY?: number): void {
        const scaleFactor = 1 - delta * this.config.zoomSensitivity;
        const newScale = Math.max(
            this.config.minScale,
            Math.min(this.config.maxScale, this._camera.scale * scaleFactor)
        );

        let newX = this._camera.x;
        let newY = this._camera.y;

        if (screenCenterX !== undefined && screenCenterY !== undefined) {
            const worldCenter = this.screenToWorld(screenCenterX, screenCenterY);
            const scaleRatio = newScale / this._camera.scale;
            newX = worldCenter.x - (worldCenter.x - this._camera.x) * scaleRatio;
            newY = worldCenter.y - (worldCenter.y - this._camera.y) * scaleRatio;
        }

        this._camera = {
            ...this._camera,
            x: newX,
            y: newY,
            scale: newScale,
            targetX: newX,
            targetY: newY,
            targetScale: newScale,
        };
        this.notify();
    }

    /**
     * Animate to a specific scale (and optionally position)
     */
    zoomTo(targetScale: number, worldX?: number, worldY?: number): void {
        this._camera = {
            ...this._camera,
            targetX: worldX ?? this._camera.targetX,
            targetY: worldY ?? this._camera.targetY,
            targetScale: Math.max(this.config.minScale, Math.min(this.config.maxScale, targetScale)),
        };
        this.startAnimation();
    }

    /**
     * Animate to a world position
     */
    panTo(worldX: number, worldY: number): void {
        this._camera = {
            ...this._camera,
            targetX: worldX,
            targetY: worldY,
        };
        this.startAnimation();
    }

    /**
     * Focus on a world position with optional zoom
     */
    focusOn(worldX: number, worldY: number, scale?: number): void {
        this._camera = {
            ...this._camera,
            targetX: worldX,
            targetY: worldY,
            targetScale: scale ?? this._camera.targetScale,
        };
        this.startAnimation();
    }

    /**
     * Reset camera to initial position
     */
    reset(initialX: number = 0, initialY: number = 0, initialScale: number = 0.5): void {
        this._camera = {
            ...this._camera,
            targetX: initialX,
            targetY: initialY,
            targetScale: initialScale,
        };
        this.startAnimation();
    }

    /**
     * Zoom to a node, centering it and calculating optimal scale to show it
     * and its immediate context (children area)
     *
     * @param node - The node to zoom to
     * @param padding - Multiplier for how much space around the node (default 4x node radius)
     */
    zoomToNode(node: UniverseNode, padding: number = 4): void {
        // Calculate scale to fit node at ~40% of viewport
        // We want the node + some context visible
        const viewportMin = Math.min(this._viewport.width, this._viewport.height);
        const targetNodeScreenSize = viewportMin * 0.25; // Node takes 25% of viewport

        // Calculate the scale that would make the node appear at target size
        const targetScale = targetNodeScreenSize / (node.radius * padding);

        // Clamp to valid range
        const clampedScale = Math.max(
            this.config.minScale,
            Math.min(this.config.maxScale, targetScale)
        );

        this.focusOn(node.x, node.y, clampedScale);
    }

    /**
     * Set zoom level by name
     */
    setZoomLevel(level: ZoomLevel): void {
        const config = ZOOM_LEVEL_CONFIGS.find((c) => c.level === level);
        if (config) {
            const targetScale = (config.minScale + config.maxScale) / 2;
            this.zoomTo(targetScale);
        }
    }

    /**
     * Set camera state directly (for restoring state or immediate updates)
     */
    setCameraImmediate(x: number, y: number, scale: number): void {
        this._camera = {
            x,
            y,
            scale,
            targetX: x,
            targetY: y,
            targetScale: scale,
        };
        this.notify();
    }

    // ========================================================================
    // ANIMATION
    // ========================================================================

    private startAnimation(): void {
        // Guard against SSR - no animation on server
        if (typeof window === "undefined") return;

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.animationStart = {
            x: this._camera.x,
            y: this._camera.y,
            scale: this._camera.scale,
        };
        this.animationStartTime = Date.now();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    private animate(): void {
        // Guard against SSR
        if (typeof window === "undefined") return;

        const start = this.animationStart;
        if (!start) return;

        const elapsed = Date.now() - this.animationStartTime;
        const progress = Math.min(elapsed / this.config.animationDuration, 1);
        const eased = this.config.animationEasing(progress);

        this._camera = {
            ...this._camera,
            x: start.x + (this._camera.targetX - start.x) * eased,
            y: start.y + (this._camera.targetY - start.y) * eased,
            scale: start.scale + (this._camera.targetScale - start.scale) * eased,
        };

        this.notify();

        if (progress < 1) {
            this.animationFrame = requestAnimationFrame(() => this.animate());
        } else {
            this.animationFrame = null;
            this.animationStart = null;
        }
    }

    /**
     * Check if animation is in progress
     */
    isAnimating(): boolean {
        return this.animationFrame !== null;
    }

    // ========================================================================
    // PREDICTIVE VIEWPORT EXPANSION
    // ========================================================================

    /**
     * Get expanded bounds based on pan velocity (for predictive loading)
     */
    getExpandedBounds(velocityX: number, velocityY: number, expansionFactor: number = 1.5): VisibleBounds {
        const baseBounds = this.getVisibleBounds(this.config.viewportMargin);
        const expansion = {
            x: Math.abs(velocityX) * expansionFactor / this._camera.scale,
            y: Math.abs(velocityY) * expansionFactor / this._camera.scale,
        };

        return {
            minX: baseBounds.minX - (velocityX < 0 ? expansion.x : 0),
            maxX: baseBounds.maxX + (velocityX > 0 ? expansion.x : 0),
            minY: baseBounds.minY - (velocityY < 0 ? expansion.y : 0),
            maxY: baseBounds.maxY + (velocityY > 0 ? expansion.y : 0),
            width: baseBounds.width + expansion.x,
            height: baseBounds.height + expansion.y,
        };
    }

    // ========================================================================
    // LISTENER PATTERN
    // ========================================================================

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        this.listeners.forEach((listener) => listener());
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose(): void {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.listeners.clear();
    }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createWorldCoordinator(
    config?: Partial<WorldCoordinatorConfig>
): WorldCoordinator {
    return new WorldCoordinator(config);
}
