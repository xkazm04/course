/**
 * Metric Collector
 *
 * Tracks experiment-specific metrics with batching and buffering.
 * Provides local aggregation before sending to server.
 */

import type { MetricDefinition, MetricType } from "./types";

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "openforge_experiment_metrics";
const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 10000; // 10 seconds
const MAX_BUFFER_SIZE = 500;

// ============================================================================
// Types
// ============================================================================

interface BufferedMetric {
    experimentId: string;
    userId: string;
    variantId: string;
    metricName: string;
    value: number;
    timestamp: string;
    context?: Record<string, unknown>;
    sessionId?: string;
}

interface MetricBuffer {
    metrics: BufferedMetric[];
    lastFlushed: string;
}

// ============================================================================
// Predefined Metrics
// ============================================================================

export const PREDEFINED_METRICS: Record<string, MetricDefinition> = {
    // Engagement metrics
    page_view: {
        name: "page_view",
        label: "Page Views",
        type: "count",
        description: "Number of page views",
        higherIsBetter: true,
    },
    time_on_page: {
        name: "time_on_page",
        label: "Time on Page",
        type: "continuous",
        description: "Time spent on page in seconds",
        unit: "seconds",
        higherIsBetter: true,
    },
    scroll_depth: {
        name: "scroll_depth",
        label: "Scroll Depth",
        type: "continuous",
        description: "Maximum scroll depth percentage",
        unit: "percent",
        higherIsBetter: true,
    },

    // Learning metrics
    chapter_started: {
        name: "chapter_started",
        label: "Chapters Started",
        type: "count",
        description: "Number of chapters started",
        higherIsBetter: true,
    },
    chapter_completed: {
        name: "chapter_completed",
        label: "Chapters Completed",
        type: "conversion",
        description: "Whether chapter was completed",
        higherIsBetter: true,
    },
    quiz_score: {
        name: "quiz_score",
        label: "Quiz Score",
        type: "continuous",
        description: "Quiz score percentage",
        unit: "percent",
        higherIsBetter: true,
    },
    quiz_attempts: {
        name: "quiz_attempts",
        label: "Quiz Attempts",
        type: "count",
        description: "Number of quiz attempts",
        higherIsBetter: false,
    },

    // Intervention metrics
    intervention_shown: {
        name: "intervention_shown",
        label: "Interventions Shown",
        type: "count",
        description: "Number of interventions shown",
        higherIsBetter: false, // Fewer interventions may mean better content
    },
    intervention_accepted: {
        name: "intervention_accepted",
        label: "Interventions Accepted",
        type: "conversion",
        description: "Whether intervention was accepted",
        higherIsBetter: true,
    },
    intervention_dismissed: {
        name: "intervention_dismissed",
        label: "Interventions Dismissed",
        type: "count",
        description: "Number of interventions dismissed",
        higherIsBetter: false,
    },

    // Retention metrics
    session_duration: {
        name: "session_duration",
        label: "Session Duration",
        type: "continuous",
        description: "Session duration in minutes",
        unit: "minutes",
        higherIsBetter: true,
    },
    return_visit: {
        name: "return_visit",
        label: "Return Visit",
        type: "conversion",
        description: "Whether user returned within 7 days",
        higherIsBetter: true,
    },

    // Conversion metrics
    subscription_converted: {
        name: "subscription_converted",
        label: "Subscription Converted",
        type: "conversion",
        description: "Whether user converted to paid subscription",
        higherIsBetter: true,
    },
};

// ============================================================================
// Metric Collector Class
// ============================================================================

export class MetricCollector {
    private buffer: BufferedMetric[] = [];
    private flushTimer: ReturnType<typeof setTimeout> | null = null;
    private apiBase: string;
    private sessionId: string;
    private isFlushing: boolean = false;

    constructor(apiBase: string = "/api/experiments") {
        this.apiBase = apiBase;
        this.sessionId = this.generateSessionId();
        this.loadFromStorage();
        this.startFlushTimer();
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Load buffered metrics from localStorage
     */
    private loadFromStorage(): void {
        if (typeof window === "undefined") return;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data: MetricBuffer = JSON.parse(stored);
                this.buffer = data.metrics || [];
            }
        } catch {
            // Ignore errors, start with empty buffer
        }
    }

    /**
     * Save buffered metrics to localStorage
     */
    private saveToStorage(): void {
        if (typeof window === "undefined") return;

        try {
            const data: MetricBuffer = {
                metrics: this.buffer,
                lastFlushed: new Date().toISOString(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
            // Ignore storage errors
        }
    }

    /**
     * Start periodic flush timer
     */
    private startFlushTimer(): void {
        if (typeof window === "undefined") return;

        this.flushTimer = setInterval(() => {
            this.flush();
        }, FLUSH_INTERVAL_MS);

        // Also flush on page unload
        window.addEventListener("beforeunload", () => {
            this.flushSync();
        });

        // Flush on visibility change (tab hidden)
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                this.flush();
            }
        });
    }

    /**
     * Stop flush timer
     */
    stopFlushTimer(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    /**
     * Track a metric event
     */
    track(
        experimentId: string,
        userId: string,
        variantId: string,
        metricName: string,
        value: number = 1,
        context?: Record<string, unknown>
    ): void {
        const metric: BufferedMetric = {
            experimentId,
            userId,
            variantId,
            metricName,
            value,
            timestamp: new Date().toISOString(),
            context,
            sessionId: this.sessionId,
        };

        this.buffer.push(metric);

        // Prevent buffer overflow
        if (this.buffer.length > MAX_BUFFER_SIZE) {
            this.buffer = this.buffer.slice(-MAX_BUFFER_SIZE);
        }

        this.saveToStorage();

        // Auto-flush if batch size reached
        if (this.buffer.length >= BATCH_SIZE) {
            this.flush();
        }
    }

    /**
     * Track a conversion (binary metric)
     */
    trackConversion(
        experimentId: string,
        userId: string,
        variantId: string,
        metricName: string,
        converted: boolean,
        context?: Record<string, unknown>
    ): void {
        this.track(experimentId, userId, variantId, metricName, converted ? 1 : 0, context);
    }

    /**
     * Track time spent
     */
    trackTime(
        experimentId: string,
        userId: string,
        variantId: string,
        metricName: string,
        startTime: number,
        context?: Record<string, unknown>
    ): void {
        const duration = (Date.now() - startTime) / 1000; // Convert to seconds
        this.track(experimentId, userId, variantId, metricName, duration, context);
    }

    /**
     * Flush buffered metrics to server
     */
    async flush(): Promise<void> {
        if (this.isFlushing || this.buffer.length === 0) {
            return;
        }

        this.isFlushing = true;

        // Take current batch
        const batch = this.buffer.slice(0, BATCH_SIZE);
        this.buffer = this.buffer.slice(BATCH_SIZE);
        this.saveToStorage();

        try {
            const response = await fetch(`${this.apiBase}/metrics/batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ metrics: batch }),
            });

            if (!response.ok) {
                // Re-add failed metrics to buffer
                this.buffer = [...batch, ...this.buffer].slice(0, MAX_BUFFER_SIZE);
                this.saveToStorage();
            }
        } catch {
            // Re-add failed metrics to buffer
            this.buffer = [...batch, ...this.buffer].slice(0, MAX_BUFFER_SIZE);
            this.saveToStorage();
        } finally {
            this.isFlushing = false;

            // Continue flushing if more data
            if (this.buffer.length >= BATCH_SIZE) {
                this.flush();
            }
        }
    }

    /**
     * Synchronous flush using sendBeacon (for page unload)
     */
    flushSync(): void {
        if (this.buffer.length === 0 || typeof navigator === "undefined") {
            return;
        }

        const batch = this.buffer.slice(0, BATCH_SIZE);
        const success = navigator.sendBeacon(
            `${this.apiBase}/metrics/batch`,
            JSON.stringify({ metrics: batch })
        );

        if (success) {
            this.buffer = this.buffer.slice(BATCH_SIZE);
            this.saveToStorage();
        }
    }

    /**
     * Get pending metrics count
     */
    getPendingCount(): number {
        return this.buffer.length;
    }

    /**
     * Clear all buffered metrics
     */
    clearBuffer(): void {
        this.buffer = [];
        this.saveToStorage();
    }

    /**
     * Get session ID
     */
    getSessionId(): string {
        return this.sessionId;
    }
}

// ============================================================================
// Aggregator for Local Statistics
// ============================================================================

export class MetricAggregator {
    private aggregations: Map<
        string,
        {
            count: number;
            sum: number;
            sumSquares: number;
            min: number;
            max: number;
            conversions: number;
        }
    > = new Map();

    /**
     * Get aggregation key
     */
    private getKey(experimentId: string, variantId: string, metricName: string): string {
        return `${experimentId}:${variantId}:${metricName}`;
    }

    /**
     * Add a value to aggregation
     */
    add(
        experimentId: string,
        variantId: string,
        metricName: string,
        value: number,
        metricType: MetricType = "continuous"
    ): void {
        const key = this.getKey(experimentId, variantId, metricName);
        const existing = this.aggregations.get(key) || {
            count: 0,
            sum: 0,
            sumSquares: 0,
            min: Infinity,
            max: -Infinity,
            conversions: 0,
        };

        existing.count++;
        existing.sum += value;
        existing.sumSquares += value * value;
        existing.min = Math.min(existing.min, value);
        existing.max = Math.max(existing.max, value);

        if (metricType === "conversion" && value > 0) {
            existing.conversions++;
        }

        this.aggregations.set(key, existing);
    }

    /**
     * Get aggregated statistics
     */
    getStats(
        experimentId: string,
        variantId: string,
        metricName: string
    ): {
        count: number;
        sum: number;
        mean: number;
        variance: number;
        stdDev: number;
        min: number;
        max: number;
        conversionRate: number;
    } | null {
        const key = this.getKey(experimentId, variantId, metricName);
        const agg = this.aggregations.get(key);

        if (!agg || agg.count === 0) {
            return null;
        }

        const mean = agg.sum / agg.count;
        const variance = agg.sumSquares / agg.count - mean * mean;
        const stdDev = Math.sqrt(Math.max(0, variance));

        return {
            count: agg.count,
            sum: agg.sum,
            mean,
            variance,
            stdDev,
            min: agg.min === Infinity ? 0 : agg.min,
            max: agg.max === -Infinity ? 0 : agg.max,
            conversionRate: agg.conversions / agg.count,
        };
    }

    /**
     * Clear all aggregations
     */
    clear(): void {
        this.aggregations.clear();
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let collectorInstance: MetricCollector | null = null;

export function getMetricCollector(apiBase?: string): MetricCollector {
    if (!collectorInstance) {
        collectorInstance = new MetricCollector(apiBase);
    }
    return collectorInstance;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Track a metric event
 */
export function trackMetric(
    experimentId: string,
    userId: string,
    variantId: string,
    metricName: string,
    value: number = 1,
    context?: Record<string, unknown>
): void {
    getMetricCollector().track(experimentId, userId, variantId, metricName, value, context);
}

/**
 * Track a conversion
 */
export function trackConversion(
    experimentId: string,
    userId: string,
    variantId: string,
    metricName: string,
    converted: boolean
): void {
    getMetricCollector().trackConversion(experimentId, userId, variantId, metricName, converted);
}

/**
 * Create a timer for tracking duration
 */
export function createTimer(
    experimentId: string,
    userId: string,
    variantId: string,
    metricName: string
): { stop: () => void } {
    const startTime = Date.now();
    return {
        stop: () => {
            getMetricCollector().trackTime(experimentId, userId, variantId, metricName, startTime);
        },
    };
}

/**
 * Get metric definition
 */
export function getMetricDefinition(metricName: string): MetricDefinition | undefined {
    return PREDEFINED_METRICS[metricName];
}
