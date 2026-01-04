/**
 * Signal Pipeline Framework - Types
 *
 * Generic types for building declarative signal processing pipelines
 * with built-in localStorage persistence and event replay.
 *
 * The pattern: collect → aggregate → transform → decide
 */

// ============================================================================
// Core Pipeline Types
// ============================================================================

/**
 * Unique identifier for signals and pipeline instances
 */
export type SignalId = string;
export type PipelineId = string;
export type SessionId = string;

/**
 * Base interface for all signals flowing through the pipeline
 */
export interface BaseSignal {
    /** Unique identifier */
    id: SignalId;
    /** Signal type discriminator */
    type: string;
    /** When the signal was created */
    timestamp: number;
    /** Optional metadata */
    meta?: Record<string, unknown>;
}

/**
 * Signal with enriched metadata after collection
 */
export interface CollectedSignal<TSignal extends BaseSignal = BaseSignal> {
    signal: TSignal;
    collectedAt: number;
    sessionId: SessionId;
    sequenceIndex: number;
    previousSignalId?: SignalId;
}

// ============================================================================
// Pipeline Stage Definitions
// ============================================================================

/**
 * Collection stage - transforms raw input into pipeline signals
 */
export interface CollectionStage<TInput, TSignal extends BaseSignal> {
    /** Transform raw input into a signal */
    collect: (input: TInput, context: CollectionContext) => TSignal;
    /** Optional validation before collection */
    validate?: (input: TInput) => boolean;
    /** Optional filtering of inputs */
    filter?: (input: TInput) => boolean;
}

/**
 * Context available during collection
 */
export interface CollectionContext {
    sessionId: SessionId;
    pipelineId: PipelineId;
    signalCount: number;
    sessionStartTime: number;
    lastSignalTime?: number;
}

/**
 * Aggregation stage - groups and combines signals
 */
export interface AggregationStage<TSignal extends BaseSignal, TAggregate> {
    /** Aggregate collected signals into a summary */
    aggregate: (signals: CollectedSignal<TSignal>[], context: AggregationContext) => TAggregate;
    /** Optional windowing strategy */
    window?: WindowConfig;
    /** Optional grouping function */
    groupBy?: (signal: TSignal) => string;
}

/**
 * Context available during aggregation
 */
export interface AggregationContext {
    sessionId: SessionId;
    pipelineId: PipelineId;
    windowStart: number;
    windowEnd: number;
    totalSignals: number;
}

/**
 * Time window configuration for aggregation
 */
export interface WindowConfig {
    /** Window type */
    type: "sliding" | "tumbling" | "session" | "count";
    /** Size in milliseconds (for time-based) or count */
    size: number;
    /** Slide interval for sliding windows (ms) */
    slide?: number;
    /** Session gap timeout (ms) */
    sessionGap?: number;
}

/**
 * Decision stage - produces decisions/actions from aggregates
 */
export interface DecisionStage<TAggregate, TDecision> {
    /** Make a decision based on aggregate data */
    decide: (aggregate: TAggregate, context: DecisionContext) => TDecision | null;
    /** Optional confidence threshold to trigger decision */
    confidenceThreshold?: number;
    /** Optional debounce to prevent rapid decisions */
    debounceMs?: number;
}

/**
 * Context available during decision making
 */
export interface DecisionContext {
    sessionId: SessionId;
    pipelineId: PipelineId;
    previousDecision?: unknown;
    previousDecisionTime?: number;
    decisionCount: number;
}

/**
 * Decision result with metadata
 */
export interface DecisionResult<TDecision> {
    decision: TDecision;
    confidence: number;
    timestamp: number;
    triggeredBy: SignalId[];
    reasoning?: string;
}

// ============================================================================
// Pipeline Configuration
// ============================================================================

/**
 * Complete pipeline configuration
 */
export interface PipelineConfig<
    TInput,
    TSignal extends BaseSignal,
    TAggregate,
    TDecision
> {
    /** Unique pipeline identifier */
    id: PipelineId;
    /** Human-readable name */
    name: string;
    /** Pipeline version for migrations */
    version: number;
    /** Collection stage */
    collection: CollectionStage<TInput, TSignal>;
    /** Aggregation stage */
    aggregation: AggregationStage<TSignal, TAggregate>;
    /** Decision stage */
    decision: DecisionStage<TAggregate, TDecision>;
    /** Persistence configuration */
    persistence?: PersistenceConfig;
    /** Replay configuration */
    replay?: ReplayConfig;
}

/**
 * Persistence configuration
 */
export interface PersistenceConfig {
    /** Enable localStorage persistence */
    enabled: boolean;
    /** Storage key prefix */
    keyPrefix?: string;
    /** Maximum signals to store */
    maxSignals?: number;
    /** Maximum age of stored signals (ms) */
    maxAge?: number;
    /** Debounce save operations (ms) */
    saveDebounce?: number;
    /** Version for data migrations */
    storageVersion?: number;
}

/**
 * Replay configuration
 */
export interface ReplayConfig {
    /** Enable event replay on load */
    enabled: boolean;
    /** Replay speed multiplier (1 = realtime, 0 = instant) */
    speed?: number;
    /** Skip replaying old events (older than ms) */
    skipOlderThan?: number;
}

// ============================================================================
// Pipeline State
// ============================================================================

/**
 * Current pipeline state
 */
export interface PipelineState<
    TSignal extends BaseSignal,
    TAggregate,
    TDecision
> {
    /** Pipeline identifier */
    pipelineId: PipelineId;
    /** Current session */
    sessionId: SessionId;
    /** Session start time */
    sessionStartTime: number;
    /** All collected signals */
    signals: CollectedSignal<TSignal>[];
    /** Current aggregate (updated after each signal) */
    currentAggregate: TAggregate | null;
    /** History of decisions made */
    decisions: DecisionResult<TDecision>[];
    /** Last decision timestamp */
    lastDecisionTime?: number;
    /** Signal count */
    signalCount: number;
    /** Is pipeline active */
    isActive: boolean;
}

/**
 * Stored state for persistence
 */
export interface StoredPipelineState<
    TSignal extends BaseSignal,
    TAggregate,
    TDecision
> {
    version: number;
    pipelineId: PipelineId;
    signals: CollectedSignal<TSignal>[];
    decisions: DecisionResult<TDecision>[];
    sessions: SessionMetadata[];
    lastUpdated: number;
}

/**
 * Session metadata for tracking
 */
export interface SessionMetadata {
    id: SessionId;
    startTime: number;
    endTime?: number;
    signalCount: number;
    decisionCount: number;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Events emitted by the pipeline
 */
export type PipelineEvent<TSignal extends BaseSignal, TAggregate, TDecision> =
    | { type: "signal_collected"; signal: CollectedSignal<TSignal> }
    | { type: "aggregate_updated"; aggregate: TAggregate }
    | { type: "decision_made"; decision: DecisionResult<TDecision> }
    | { type: "session_started"; sessionId: SessionId }
    | { type: "session_ended"; sessionId: SessionId }
    | { type: "state_loaded"; signalCount: number }
    | { type: "state_saved" }
    | { type: "replay_started"; signalCount: number }
    | { type: "replay_completed" }
    | { type: "error"; error: Error };

/**
 * Event listener callback
 */
export type PipelineEventListener<
    TSignal extends BaseSignal,
    TAggregate,
    TDecision
> = (event: PipelineEvent<TSignal, TAggregate, TDecision>) => void;

// ============================================================================
// Pipeline Statistics
// ============================================================================

/**
 * Pipeline statistics
 */
export interface PipelineStats {
    pipelineId: PipelineId;
    totalSignals: number;
    totalDecisions: number;
    totalSessions: number;
    signalsByType: Record<string, number>;
    averageSignalsPerSession: number;
    averageDecisionsPerSession: number;
    timeRange: { start: number; end: number } | null;
    lastActivity: number | null;
}

// ============================================================================
// Builder Types for Fluent API
// ============================================================================

/**
 * Builder for creating pipeline configurations
 */
export interface PipelineBuilder<
    TInput,
    TSignal extends BaseSignal,
    TAggregate,
    TDecision
> {
    /** Configure collection stage */
    collect: (stage: CollectionStage<TInput, TSignal>) => this;
    /** Configure aggregation stage */
    aggregate: (stage: AggregationStage<TSignal, TAggregate>) => this;
    /** Configure decision stage */
    decide: (stage: DecisionStage<TAggregate, TDecision>) => this;
    /** Configure persistence */
    persist: (config: PersistenceConfig) => this;
    /** Configure replay */
    replay: (config: ReplayConfig) => this;
    /** Build the pipeline configuration */
    build: () => PipelineConfig<TInput, TSignal, TAggregate, TDecision>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract signal type from pipeline config
 */
export type SignalOf<T> = T extends PipelineConfig<
    unknown,
    infer TSignal,
    unknown,
    unknown
>
    ? TSignal
    : never;

/**
 * Extract aggregate type from pipeline config
 */
export type AggregateOf<T> = T extends PipelineConfig<
    unknown,
    BaseSignal,
    infer TAggregate,
    unknown
>
    ? TAggregate
    : never;

/**
 * Extract decision type from pipeline config
 */
export type DecisionOf<T> = T extends PipelineConfig<
    unknown,
    BaseSignal,
    unknown,
    infer TDecision
>
    ? TDecision
    : never;

/**
 * Generate unique IDs
 */
export function generateSignalId(): SignalId {
    return `sig_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateSessionId(): SessionId {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generatePipelineId(name: string): PipelineId {
    return `pipe_${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
}
