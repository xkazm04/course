import type { HexLayoutNode, Point } from "./types";
import type { Bounds } from "./viewportManager";

/**
 * Connection between two nodes
 */
export interface NodeConnection {
    id: string;
    from: string;
    to: string;
    fromPoint: Point;
    toPoint: Point;
}

/**
 * Visible connection with culling metadata
 */
export interface VisibleConnection extends NodeConnection {
    /** Whether connection is fully visible */
    fullyVisible: boolean;
    /** Clip points if partially visible */
    clipStart?: Point;
    clipEnd?: Point;
}

/**
 * ConnectionCuller - Efficiently culls off-screen connections
 *
 * Features:
 * - Fast visibility testing for edges
 * - Edge clipping for partially visible connections
 * - Distance-based filtering (only show nearby connections)
 * - Optimized for large connection counts
 */
export class ConnectionCuller {
    private maxConnectionDistance = 250;

    /**
     * Set maximum distance for connections to render
     */
    setMaxDistance(distance: number): void {
        this.maxConnectionDistance = distance;
    }

    /**
     * Generate connections between nearby nodes
     */
    generateConnections(nodes: HexLayoutNode[]): NodeConnection[] {
        const connections: NodeConnection[] = [];
        const maxDistSq = this.maxConnectionDistance * this.maxConnectionDistance;

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];

                // Quick distance check
                const dx = a.pixel.x - b.pixel.x;
                const dy = a.pixel.y - b.pixel.y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= maxDistSq) {
                    connections.push({
                        id: `${a.id}-${b.id}`,
                        from: a.id,
                        to: b.id,
                        fromPoint: a.pixel,
                        toPoint: b.pixel,
                    });
                }
            }
        }

        return connections;
    }

    /**
     * Cull connections to only those visible in viewport
     */
    cullConnections(
        connections: NodeConnection[],
        bounds: Bounds,
        padding = 50
    ): VisibleConnection[] {
        const extendedBounds: Bounds = {
            minX: bounds.minX - padding,
            minY: bounds.minY - padding,
            maxX: bounds.maxX + padding,
            maxY: bounds.maxY + padding,
        };

        const visible: VisibleConnection[] = [];

        for (const conn of connections) {
            const visibility = this.getConnectionVisibility(conn, extendedBounds);

            if (visibility.visible) {
                visible.push({
                    ...conn,
                    fullyVisible: visibility.fullyVisible,
                    clipStart: visibility.clipStart,
                    clipEnd: visibility.clipEnd,
                });
            }
        }

        return visible;
    }

    /**
     * Check visibility of a single connection
     */
    private getConnectionVisibility(
        conn: NodeConnection,
        bounds: Bounds
    ): {
        visible: boolean;
        fullyVisible: boolean;
        clipStart?: Point;
        clipEnd?: Point;
    } {
        const { fromPoint, toPoint } = conn;

        const fromInside = this.isPointInBounds(fromPoint, bounds);
        const toInside = this.isPointInBounds(toPoint, bounds);

        // Both endpoints inside - fully visible
        if (fromInside && toInside) {
            return { visible: true, fullyVisible: true };
        }

        // Both endpoints outside - check if line intersects bounds
        if (!fromInside && !toInside) {
            const intersection = this.lineIntersectsBounds(fromPoint, toPoint, bounds);
            if (intersection) {
                return {
                    visible: true,
                    fullyVisible: false,
                    clipStart: intersection.entry,
                    clipEnd: intersection.exit,
                };
            }
            return { visible: false, fullyVisible: false };
        }

        // One endpoint inside - partially visible
        const inside = fromInside ? fromPoint : toPoint;
        const outside = fromInside ? toPoint : fromPoint;
        const clipPoint = this.clipLineToEdge(inside, outside, bounds);

        return {
            visible: true,
            fullyVisible: false,
            clipStart: fromInside ? undefined : clipPoint,
            clipEnd: fromInside ? clipPoint : undefined,
        };
    }

    /**
     * Check if point is within bounds
     */
    private isPointInBounds(point: Point, bounds: Bounds): boolean {
        return (
            point.x >= bounds.minX &&
            point.x <= bounds.maxX &&
            point.y >= bounds.minY &&
            point.y <= bounds.maxY
        );
    }

    /**
     * Check if line intersects bounds and return entry/exit points
     */
    private lineIntersectsBounds(
        p1: Point,
        p2: Point,
        bounds: Bounds
    ): { entry: Point; exit: Point } | null {
        const intersections: Array<{ point: Point; t: number }> = [];

        // Check all four edges
        const edges: Array<{ start: Point; end: Point }> = [
            { start: { x: bounds.minX, y: bounds.minY }, end: { x: bounds.maxX, y: bounds.minY } }, // Top
            { start: { x: bounds.maxX, y: bounds.minY }, end: { x: bounds.maxX, y: bounds.maxY } }, // Right
            { start: { x: bounds.minX, y: bounds.maxY }, end: { x: bounds.maxX, y: bounds.maxY } }, // Bottom
            { start: { x: bounds.minX, y: bounds.minY }, end: { x: bounds.minX, y: bounds.maxY } }, // Left
        ];

        for (const edge of edges) {
            const intersection = this.lineLineIntersection(p1, p2, edge.start, edge.end);
            if (intersection) {
                intersections.push(intersection);
            }
        }

        if (intersections.length < 2) {
            return null;
        }

        // Sort by parameter t to get entry and exit
        intersections.sort((a, b) => a.t - b.t);
        return {
            entry: intersections[0].point,
            exit: intersections[intersections.length - 1].point,
        };
    }

    /**
     * Find intersection between two lines
     */
    private lineLineIntersection(
        p1: Point,
        p2: Point,
        p3: Point,
        p4: Point
    ): { point: Point; t: number } | null {
        const d1x = p2.x - p1.x;
        const d1y = p2.y - p1.y;
        const d2x = p4.x - p3.x;
        const d2y = p4.y - p3.y;

        const denominator = d1x * d2y - d1y * d2x;

        if (Math.abs(denominator) < 0.0001) {
            return null; // Parallel lines
        }

        const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denominator;
        const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denominator;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                point: {
                    x: p1.x + t * d1x,
                    y: p1.y + t * d1y,
                },
                t,
            };
        }

        return null;
    }

    /**
     * Clip a line segment to the edge of bounds
     */
    private clipLineToEdge(inside: Point, outside: Point, bounds: Bounds): Point {
        const dx = outside.x - inside.x;
        const dy = outside.y - inside.y;

        let t = 1;

        // Check each edge
        if (dx !== 0) {
            if (outside.x < bounds.minX) {
                t = Math.min(t, (bounds.minX - inside.x) / dx);
            }
            if (outside.x > bounds.maxX) {
                t = Math.min(t, (bounds.maxX - inside.x) / dx);
            }
        }

        if (dy !== 0) {
            if (outside.y < bounds.minY) {
                t = Math.min(t, (bounds.minY - inside.y) / dy);
            }
            if (outside.y > bounds.maxY) {
                t = Math.min(t, (bounds.maxY - inside.y) / dy);
            }
        }

        return {
            x: inside.x + t * dx,
            y: inside.y + t * dy,
        };
    }

    /**
     * Get visible connections for a set of nodes
     */
    getVisibleConnections(
        nodes: HexLayoutNode[],
        bounds: Bounds
    ): VisibleConnection[] {
        const connections = this.generateConnections(nodes);
        return this.cullConnections(connections, bounds);
    }

    /**
     * Optimized: Get visible connections from pre-indexed nodes
     * Only checks connections between visible nodes
     */
    getVisibleConnectionsOptimized(
        visibleNodes: HexLayoutNode[],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        allNodes: Map<string, HexLayoutNode>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        bounds: Bounds
    ): VisibleConnection[] {
        const connections: NodeConnection[] = [];
        const maxDistSq = this.maxConnectionDistance * this.maxConnectionDistance;

        // For each visible node, check connections to other visible nodes
        for (let i = 0; i < visibleNodes.length; i++) {
            const a = visibleNodes[i];

            for (let j = i + 1; j < visibleNodes.length; j++) {
                const b = visibleNodes[j];

                const dx = a.pixel.x - b.pixel.x;
                const dy = a.pixel.y - b.pixel.y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= maxDistSq) {
                    connections.push({
                        id: `${a.id}-${b.id}`,
                        from: a.id,
                        to: b.id,
                        fromPoint: a.pixel,
                        toPoint: b.pixel,
                    });
                }
            }
        }

        // All connections between visible nodes are visible
        return connections.map(conn => ({
            ...conn,
            fullyVisible: true,
        }));
    }
}

/**
 * Singleton connection culler
 */
let connectionCullerInstance: ConnectionCuller | null = null;

export function getConnectionCuller(): ConnectionCuller {
    if (!connectionCullerInstance) {
        connectionCullerInstance = new ConnectionCuller();
    }
    return connectionCullerInstance;
}

export function resetConnectionCuller(): void {
    connectionCullerInstance = null;
}
