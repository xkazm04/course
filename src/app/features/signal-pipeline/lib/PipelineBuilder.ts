/**
 * Pipeline Builder - Fluent API for creating pipelines
 *
 * Provides a type-safe, chainable API for defining signal pipelines.
 */

import {
    BaseSignal,
    PipelineConfig,
    CollectionStage,
    AggregationStage,
    DecisionStage,
    PersistenceConfig,
    ReplayConfig,
    WindowConfig,
    generatePipelineId,
} from "./types";
import { SignalPipeline, createPipeline } from "./SignalPipeline";

// ============================================================================
// Builder Class
// ============================================================================

export class PipelineBuilder<
    TInput = unknown,
    TSignal extends BaseSignal = BaseSignal,
    TAggregate = unknown,
    TDecision = unknown
> {
    private _id: string;
    private _name: string;
    private _version: number = 1;
    private _collection: CollectionStage<TInput, TSignal> | null = null;
    private _aggregation: AggregationStage<TSignal, TAggregate> | null = null;
    private _decision: DecisionStage<TAggregate, TDecision> | null = null;
    private _persistence: PersistenceConfig = { enabled: true };
    private _replay: ReplayConfig = { enabled: true };

    constructor(name: string) {
        this._name = name;
        this._id = generatePipelineId(name);
    }

    /**
     * Set the pipeline ID explicitly
     */
    id(id: string): this {
        this._id = id;
        return this;
    }

    /**
     * Set the pipeline version
     */
    version(version: number): this {
        this._version = version;
        return this;
    }

    /**
     * Define the collection stage
     */
    collect<TNewInput, TNewSignal extends BaseSignal>(
        collector: (input: TNewInput, context: { sessionId: string; signalCount: number }) => TNewSignal,
        options?: {
            validate?: (input: TNewInput) => boolean;
            filter?: (input: TNewInput) => boolean;
        }
    ): PipelineBuilder<TNewInput, TNewSignal, TAggregate, TDecision> {
        const builder = this as unknown as PipelineBuilder<
            TNewInput,
            TNewSignal,
            TAggregate,
            TDecision
        >;
        builder._collection = {
            collect: collector,
            validate: options?.validate,
            filter: options?.filter,
        };
        return builder;
    }

    /**
     * Define the aggregation stage
     */
    aggregate<TNewAggregate>(
        aggregator: (
            signals: Array<{ signal: TSignal; sessionId: string; sequenceIndex: number }>,
            context: { sessionId: string; totalSignals: number }
        ) => TNewAggregate,
        options?: {
            window?: WindowConfig;
            groupBy?: (signal: TSignal) => string;
        }
    ): PipelineBuilder<TInput, TSignal, TNewAggregate, TDecision> {
        const builder = this as unknown as PipelineBuilder<
            TInput,
            TSignal,
            TNewAggregate,
            TDecision
        >;
        builder._aggregation = {
            aggregate: aggregator,
            window: options?.window,
            groupBy: options?.groupBy,
        };
        return builder;
    }

    /**
     * Define the decision stage
     */
    decide<TNewDecision>(
        decider: (
            aggregate: TAggregate,
            context: { previousDecision?: unknown; decisionCount: number }
        ) => TNewDecision | null,
        options?: {
            confidenceThreshold?: number;
            debounceMs?: number;
        }
    ): PipelineBuilder<TInput, TSignal, TAggregate, TNewDecision> {
        const builder = this as unknown as PipelineBuilder<
            TInput,
            TSignal,
            TAggregate,
            TNewDecision
        >;
        builder._decision = {
            decide: decider,
            confidenceThreshold: options?.confidenceThreshold,
            debounceMs: options?.debounceMs,
        };
        return builder;
    }

    /**
     * Configure persistence
     */
    persist(config: Partial<PersistenceConfig> | boolean = true): this {
        if (typeof config === "boolean") {
            this._persistence = { enabled: config };
        } else {
            this._persistence = { enabled: true, ...config };
        }
        return this;
    }

    /**
     * Disable persistence
     */
    noPersist(): this {
        this._persistence = { enabled: false };
        return this;
    }

    /**
     * Configure replay
     */
    replay(config: Partial<ReplayConfig> | boolean = true): this {
        if (typeof config === "boolean") {
            this._replay = { enabled: config };
        } else {
            this._replay = { enabled: true, ...config };
        }
        return this;
    }

    /**
     * Add sliding time window to aggregation
     */
    withSlidingWindow(sizeMs: number, slideMs?: number): this {
        if (this._aggregation) {
            this._aggregation.window = {
                type: "sliding",
                size: sizeMs,
                slide: slideMs,
            };
        }
        return this;
    }

    /**
     * Add tumbling time window to aggregation
     */
    withTumblingWindow(sizeMs: number): this {
        if (this._aggregation) {
            this._aggregation.window = {
                type: "tumbling",
                size: sizeMs,
            };
        }
        return this;
    }

    /**
     * Add session-based window to aggregation
     */
    withSessionWindow(gapMs?: number): this {
        if (this._aggregation) {
            this._aggregation.window = {
                type: "session",
                size: 0,
                sessionGap: gapMs,
            };
        }
        return this;
    }

    /**
     * Add count-based window to aggregation
     */
    withCountWindow(count: number): this {
        if (this._aggregation) {
            this._aggregation.window = {
                type: "count",
                size: count,
            };
        }
        return this;
    }

    /**
     * Add debounce to decision stage
     */
    debounce(ms: number): this {
        if (this._decision) {
            this._decision.debounceMs = ms;
        }
        return this;
    }

    /**
     * Build the pipeline configuration
     */
    buildConfig(): PipelineConfig<TInput, TSignal, TAggregate, TDecision> {
        if (!this._collection) {
            throw new Error("Pipeline must have a collection stage");
        }
        if (!this._aggregation) {
            throw new Error("Pipeline must have an aggregation stage");
        }
        if (!this._decision) {
            throw new Error("Pipeline must have a decision stage");
        }

        return {
            id: this._id,
            name: this._name,
            version: this._version,
            collection: this._collection,
            aggregation: this._aggregation,
            decision: this._decision,
            persistence: this._persistence,
            replay: this._replay,
        };
    }

    /**
     * Build and create the pipeline instance
     */
    build(): SignalPipeline<TInput, TSignal, TAggregate, TDecision> {
        const config = this.buildConfig();
        return createPipeline(config);
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Start building a new pipeline
 */
export function pipeline(name: string): PipelineBuilder {
    return new PipelineBuilder(name);
}

// ============================================================================
// Common Signal Factories
// ============================================================================

/**
 * Create a timestamped signal from any data
 */
export function createSignal<T extends Record<string, unknown>>(
    type: string,
    data: T
): BaseSignal & T {
    return {
        id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type,
        timestamp: Date.now(),
        ...data,
    };
}

// ============================================================================
// Common Aggregation Helpers
// ============================================================================

/**
 * Count signals by type
 */
export function countByType<T extends BaseSignal>(
    signals: Array<{ signal: T }>
): Record<string, number> {
    return signals.reduce(
        (acc, { signal }) => {
            acc[signal.type] = (acc[signal.type] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );
}

/**
 * Group signals by a key function
 */
export function groupSignals<T extends BaseSignal, K extends string>(
    signals: Array<{ signal: T }>,
    keyFn: (signal: T) => K
): Record<K, T[]> {
    return signals.reduce(
        (acc, { signal }) => {
            const key = keyFn(signal);
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(signal);
            return acc;
        },
        {} as Record<K, T[]>
    );
}

/**
 * Calculate average of a numeric property
 */
export function average<T extends BaseSignal>(
    signals: Array<{ signal: T }>,
    valueFn: (signal: T) => number
): number {
    if (signals.length === 0) return 0;
    const sum = signals.reduce((acc, { signal }) => acc + valueFn(signal), 0);
    return sum / signals.length;
}

/**
 * Find the most recent signal of a type
 */
export function latest<T extends BaseSignal>(
    signals: Array<{ signal: T }>,
    type?: string
): T | null {
    const filtered = type
        ? signals.filter(({ signal }) => signal.type === type)
        : signals;
    if (filtered.length === 0) return null;
    return filtered.sort((a, b) => b.signal.timestamp - a.signal.timestamp)[0]
        .signal;
}

// ============================================================================
// Common Decision Helpers
// ============================================================================

/**
 * Threshold-based decision maker
 */
export function thresholdDecision<T>(
    value: number,
    thresholds: Array<{ min: number; decision: T }>
): T | null {
    // Sort thresholds by min value descending
    const sorted = [...thresholds].sort((a, b) => b.min - a.min);
    for (const threshold of sorted) {
        if (value >= threshold.min) {
            return threshold.decision;
        }
    }
    return null;
}

/**
 * Create a debounced decision that only triggers on significant changes
 */
export function significantChange<T>(
    current: T,
    previous: T | undefined,
    isEqual: (a: T, b: T) => boolean = (a, b) => a === b
): T | null {
    if (previous === undefined) return current;
    return isEqual(current, previous) ? null : current;
}
