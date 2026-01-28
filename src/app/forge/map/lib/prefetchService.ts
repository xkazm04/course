import type { Bounds, ViewportManager } from "./viewportManager";
import type { NodeLoader } from "./nodeLoader";

/**
 * Prefetch priority levels
 */
export type PrefetchPriority = "high" | "medium" | "low";

/**
 * Prefetch task
 */
interface PrefetchTask {
    bounds: Bounds;
    priority: PrefetchPriority;
    domain?: string;
    createdAt: number;
}

/**
 * PrefetchService - Predictive prefetching based on pan direction
 *
 * Features:
 * - Velocity-based prediction of future viewport
 * - Priority queue for prefetch tasks
 * - Idle-time prefetching using requestIdleCallback
 * - Cancellation of stale prefetch tasks
 * - Rate limiting to avoid server overload
 */
export class PrefetchService {
    private viewportManager: ViewportManager;
    private nodeLoader: NodeLoader;
    private taskQueue: PrefetchTask[] = [];
    private isProcessing = false;
    private idleCallbackId: number | null = null;
    private domain?: string;

    /** Time between prefetch requests (ms) */
    private minInterval = 200;
    private lastPrefetchTime = 0;

    /** Maximum queued tasks */
    private maxQueueSize = 5;

    /** How far ahead to predict (ms) */
    private predictionAhead = 500;

    constructor(viewportManager: ViewportManager, nodeLoader: NodeLoader) {
        this.viewportManager = viewportManager;
        this.nodeLoader = nodeLoader;
    }

    /**
     * Set the current domain for prefetching
     */
    setDomain(domain?: string): void {
        this.domain = domain;
    }

    /**
     * Schedule prefetching based on current viewport
     */
    schedulePrefetch(): void {
        const { prefetch } = this.viewportManager.getExtendedBounds();
        const velocity = this.viewportManager.getSmoothedVelocity();

        // Calculate predicted bounds
        const predictedBounds = this.viewportManager.getPredictedBounds(this.predictionAhead);

        // High priority: predicted viewport (where user is panning)
        if (Math.abs(velocity.vx) > 0.1 || Math.abs(velocity.vy) > 0.1) {
            this.addTask(predictedBounds, "high");
        }

        // Medium priority: extended bounds around current view
        this.addTask(prefetch, "medium");

        // Process queue
        this.processQueue();
    }

    /**
     * Add a prefetch task to the queue
     */
    private addTask(bounds: Bounds, priority: PrefetchPriority): void {
        // Check for duplicate/overlapping tasks
        const isDuplicate = this.taskQueue.some(task =>
            this.boundsOverlap(task.bounds, bounds) && task.priority === priority
        );

        if (isDuplicate) return;

        // Add task
        this.taskQueue.push({
            bounds,
            priority,
            domain: this.domain,
            createdAt: Date.now(),
        });

        // Sort by priority
        this.taskQueue.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        // Trim queue if too large
        while (this.taskQueue.length > this.maxQueueSize) {
            this.taskQueue.pop(); // Remove lowest priority
        }
    }

    /**
     * Process the prefetch queue
     */
    private processQueue(): void {
        if (this.isProcessing || this.taskQueue.length === 0) {
            return;
        }

        // Rate limiting
        const now = Date.now();
        if (now - this.lastPrefetchTime < this.minInterval) {
            // Schedule for later
            setTimeout(() => this.processQueue(), this.minInterval);
            return;
        }

        // Use requestIdleCallback for non-critical prefetching
        if ("requestIdleCallback" in window) {
            this.idleCallbackId = requestIdleCallback(
                (deadline) => this.processTasksDuringIdle(deadline),
                { timeout: 1000 }
            );
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => this.processTasksDuringIdle({ timeRemaining: () => 50 } as IdleDeadline), 0);
        }
    }

    /**
     * Process tasks during browser idle time
     */
    private async processTasksDuringIdle(deadline: IdleDeadline): Promise<void> {
        this.isProcessing = true;

        while (
            this.taskQueue.length > 0 &&
            (deadline.timeRemaining() > 0 || deadline.didTimeout)
        ) {
            const task = this.taskQueue.shift();
            if (!task) break;

            // Skip stale tasks
            if (Date.now() - task.createdAt > 2000) {
                continue;
            }

            try {
                await this.nodeLoader.prefetch(task.bounds, task.domain);
                this.lastPrefetchTime = Date.now();
            } catch (error) {
                console.warn("Prefetch failed:", error);
            }
        }

        this.isProcessing = false;

        // Continue processing if more tasks
        if (this.taskQueue.length > 0) {
            this.processQueue();
        }
    }

    /**
     * Cancel all pending prefetch tasks
     */
    cancel(): void {
        this.taskQueue = [];
        if (this.idleCallbackId !== null && "cancelIdleCallback" in window) {
            cancelIdleCallback(this.idleCallbackId);
            this.idleCallbackId = null;
        }
        this.isProcessing = false;
    }

    /**
     * Prefetch nodes around a specific point (e.g., for hover preview)
     */
    prefetchAround(x: number, y: number, radius = 500): void {
        const bounds: Bounds = {
            minX: x - radius,
            minY: y - radius,
            maxX: x + radius,
            maxY: y + radius,
        };

        this.addTask(bounds, "low");
        this.processQueue();
    }

    /**
     * Prefetch children of a node (for drill-down)
     */
    async prefetchChildren(parentId: string): Promise<void> {
        try {
            const response = await fetch(`/api/map-nodes?parentId=${parentId}`);
            if (response.ok) {
                // Prefetch is silent - results are cached
            }
        } catch {
            // Prefetch failures are non-critical
        }
    }

    /**
     * Get queue status for debugging
     */
    getStatus(): {
        queueLength: number;
        isProcessing: boolean;
        tasks: Array<{ priority: PrefetchPriority; age: number }>;
    } {
        const now = Date.now();
        return {
            queueLength: this.taskQueue.length,
            isProcessing: this.isProcessing,
            tasks: this.taskQueue.map(t => ({
                priority: t.priority,
                age: now - t.createdAt,
            })),
        };
    }

    // Utility
    private boundsOverlap(a: Bounds, b: Bounds): boolean {
        return !(
            a.maxX < b.minX ||
            a.minX > b.maxX ||
            a.maxY < b.minY ||
            a.minY > b.maxY
        );
    }
}

/**
 * Singleton prefetch service
 */
let prefetchServiceInstance: PrefetchService | null = null;

export function getPrefetchService(
    viewportManager: ViewportManager,
    nodeLoader: NodeLoader
): PrefetchService {
    if (!prefetchServiceInstance) {
        prefetchServiceInstance = new PrefetchService(viewportManager, nodeLoader);
    }
    return prefetchServiceInstance;
}

export function resetPrefetchService(): void {
    prefetchServiceInstance?.cancel();
    prefetchServiceInstance = null;
}
