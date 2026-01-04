/**
 * Signal Pipeline - Core Implementation
 *
 * A generic signal processing pipeline with declarative stages:
 * collect → aggregate → transform → decide
 *
 * Features:
 * - Type-safe signal flow through stages
 * - Built-in localStorage persistence
 * - Event replay for state reconstruction
 * - Session management
 * - Event subscription system
 */

import {
    BaseSignal,
    CollectedSignal,
    PipelineConfig,
    PipelineState,
    PipelineEvent,
    PipelineEventListener,
    PipelineStats,
    DecisionResult,
    SessionMetadata,
    StoredPipelineState,
    CollectionContext,
    AggregationContext,
    DecisionContext,
    generateSignalId,
    generateSessionId,
    SignalId,
    SessionId,
} from "./types";

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_PERSISTENCE = {
    enabled: true,
    keyPrefix: "signal-pipeline",
    maxSignals: 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    saveDebounce: 500,
    storageVersion: 1,
};

const DEFAULT_REPLAY = {
    enabled: true,
    speed: 0, // instant
    skipOlderThan: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// Signal Pipeline Class
// ============================================================================

export class SignalPipeline<
    TInput,
    TSignal extends BaseSignal,
    TAggregate,
    TDecision
> {
    private config: PipelineConfig<TInput, TSignal, TAggregate, TDecision>;
    private state: PipelineState<TSignal, TAggregate, TDecision>;
    private sessions: SessionMetadata[] = [];
    private listeners: Set<PipelineEventListener<TSignal, TAggregate, TDecision>> = new Set();
    private saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private lastDecisionTime: number | null = null;

    constructor(
        config: PipelineConfig<TInput, TSignal, TAggregate, TDecision>
    ) {
        this.config = {
            ...config,
            persistence: { ...DEFAULT_PERSISTENCE, ...config.persistence },
            replay: { ...DEFAULT_REPLAY, ...config.replay },
        };

        // Initialize empty state
        this.state = this.createEmptyState();

        // Load persisted state if enabled
        if (this.config.persistence?.enabled) {
            this.load();
        }

        // Initialize or resume session
        this.initializeSession();
    }

    // ============================================================================
    // Public API - Signal Collection
    // ============================================================================

    /**
     * Push a new input through the pipeline
     */
    push(input: TInput): DecisionResult<TDecision> | null {
        // Validate input if validator provided
        if (this.config.collection.validate && !this.config.collection.validate(input)) {
            return null;
        }

        // Filter input if filter provided
        if (this.config.collection.filter && !this.config.collection.filter(input)) {
            return null;
        }

        // Create collection context
        const context = this.createCollectionContext();

        // Transform input to signal
        const signal = this.config.collection.collect(input, context);

        // Wrap in collected signal with metadata
        const collectedSignal = this.wrapSignal(signal);

        // Add to state
        this.state.signals.push(collectedSignal);
        this.state.signalCount++;

        // Emit signal collected event
        this.emit({ type: "signal_collected", signal: collectedSignal });

        // Run aggregation
        const aggregate = this.runAggregation();
        this.state.currentAggregate = aggregate;
        this.emit({ type: "aggregate_updated", aggregate });

        // Run decision making
        const decision = this.runDecision(aggregate, [collectedSignal.signal.id]);

        // Prune old signals if needed
        this.pruneSignals();

        // Save state
        this.debouncedSave();

        return decision;
    }

    /**
     * Push multiple inputs through the pipeline
     */
    pushBatch(inputs: TInput[]): DecisionResult<TDecision> | null {
        let lastDecision: DecisionResult<TDecision> | null = null;
        for (const input of inputs) {
            const decision = this.push(input);
            if (decision) {
                lastDecision = decision;
            }
        }
        return lastDecision;
    }

    // ============================================================================
    // Public API - State Access
    // ============================================================================

    /**
     * Get current aggregate
     */
    getAggregate(): TAggregate | null {
        return this.state.currentAggregate;
    }

    /**
     * Get all collected signals
     */
    getSignals(): CollectedSignal<TSignal>[] {
        return [...this.state.signals];
    }

    /**
     * Get signals for current session
     */
    getSessionSignals(): CollectedSignal<TSignal>[] {
        return this.state.signals.filter(
            (s) => s.sessionId === this.state.sessionId
        );
    }

    /**
     * Get decision history
     */
    getDecisions(): DecisionResult<TDecision>[] {
        return [...this.state.decisions];
    }

    /**
     * Get latest decision
     */
    getLatestDecision(): DecisionResult<TDecision> | null {
        return this.state.decisions[this.state.decisions.length - 1] ?? null;
    }

    /**
     * Get current session ID
     */
    getSessionId(): SessionId {
        return this.state.sessionId;
    }

    /**
     * Get pipeline state
     */
    getState(): PipelineState<TSignal, TAggregate, TDecision> {
        return { ...this.state };
    }

    /**
     * Get pipeline statistics
     */
    getStats(): PipelineStats {
        const signalsByType: Record<string, number> = {};
        for (const { signal } of this.state.signals) {
            signalsByType[signal.type] = (signalsByType[signal.type] || 0) + 1;
        }

        const completedSessions = this.sessions.filter((s) => s.endTime);
        const avgSignalsPerSession =
            completedSessions.length > 0
                ? completedSessions.reduce((sum, s) => sum + s.signalCount, 0) /
                  completedSessions.length
                : 0;
        const avgDecisionsPerSession =
            completedSessions.length > 0
                ? completedSessions.reduce((sum, s) => sum + s.decisionCount, 0) /
                  completedSessions.length
                : 0;

        const sortedSignals = [...this.state.signals].sort(
            (a, b) => a.signal.timestamp - b.signal.timestamp
        );
        const timeRange =
            sortedSignals.length > 0
                ? {
                      start: sortedSignals[0].signal.timestamp,
                      end: sortedSignals[sortedSignals.length - 1].signal.timestamp,
                  }
                : null;

        return {
            pipelineId: this.config.id,
            totalSignals: this.state.signalCount,
            totalDecisions: this.state.decisions.length,
            totalSessions: this.sessions.length,
            signalsByType,
            averageSignalsPerSession: avgSignalsPerSession,
            averageDecisionsPerSession: avgDecisionsPerSession,
            timeRange,
            lastActivity: sortedSignals.length > 0
                ? sortedSignals[sortedSignals.length - 1].signal.timestamp
                : null,
        };
    }

    // ============================================================================
    // Public API - Session Management
    // ============================================================================

    /**
     * Start a new session
     */
    startNewSession(): SessionId {
        // End current session
        this.endSession();

        // Create new session
        const sessionId = generateSessionId();
        const now = Date.now();

        this.state.sessionId = sessionId;
        this.state.sessionStartTime = now;
        this.state.isActive = true;

        const metadata: SessionMetadata = {
            id: sessionId,
            startTime: now,
            signalCount: 0,
            decisionCount: 0,
        };
        this.sessions.push(metadata);

        this.emit({ type: "session_started", sessionId });
        this.debouncedSave();

        return sessionId;
    }

    /**
     * End the current session
     */
    endSession(): void {
        const currentSession = this.sessions.find(
            (s) => s.id === this.state.sessionId
        );
        if (currentSession && !currentSession.endTime) {
            currentSession.endTime = Date.now();
            currentSession.signalCount = this.state.signals.filter(
                (s) => s.sessionId === this.state.sessionId
            ).length;
            currentSession.decisionCount = this.state.decisions.filter(
                (d) =>
                    d.timestamp >= this.state.sessionStartTime &&
                    d.timestamp <= Date.now()
            ).length;

            this.state.isActive = false;
            this.emit({ type: "session_ended", sessionId: this.state.sessionId });
            this.debouncedSave();
        }
    }

    /**
     * Get all session metadata
     */
    getSessions(): SessionMetadata[] {
        return [...this.sessions];
    }

    // ============================================================================
    // Public API - Event Subscription
    // ============================================================================

    /**
     * Subscribe to pipeline events
     */
    subscribe(
        listener: PipelineEventListener<TSignal, TAggregate, TDecision>
    ): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Subscribe to specific event types
     */
    on<T extends PipelineEvent<TSignal, TAggregate, TDecision>["type"]>(
        eventType: T,
        callback: (
            event: Extract<PipelineEvent<TSignal, TAggregate, TDecision>, { type: T }>
        ) => void
    ): () => void {
        const listener: PipelineEventListener<TSignal, TAggregate, TDecision> = (
            event
        ) => {
            if (event.type === eventType) {
                callback(event as Extract<PipelineEvent<TSignal, TAggregate, TDecision>, { type: T }>);
            }
        };
        return this.subscribe(listener);
    }

    // ============================================================================
    // Public API - Replay
    // ============================================================================

    /**
     * Replay signals with a callback
     */
    replay(
        callback: (
            signal: CollectedSignal<TSignal>,
            index: number,
            total: number
        ) => void,
        options?: {
            sessionId?: SessionId;
            startTime?: number;
            endTime?: number;
            types?: string[];
        }
    ): void {
        let signals = [...this.state.signals].sort(
            (a, b) => a.signal.timestamp - b.signal.timestamp
        );

        if (options?.sessionId) {
            signals = signals.filter((s) => s.sessionId === options.sessionId);
        }
        if (options?.startTime !== undefined) {
            signals = signals.filter((s) => s.signal.timestamp >= options.startTime!);
        }
        if (options?.endTime !== undefined) {
            signals = signals.filter((s) => s.signal.timestamp <= options.endTime!);
        }
        if (options?.types && options.types.length > 0) {
            signals = signals.filter((s) => options.types!.includes(s.signal.type));
        }

        this.emit({ type: "replay_started", signalCount: signals.length });

        signals.forEach((signal, index) => {
            callback(signal, index, signals.length);
        });

        this.emit({ type: "replay_completed" });
    }

    /**
     * Replay and re-run aggregation/decision for each signal
     */
    replayWithDecisions(): DecisionResult<TDecision>[] {
        const decisions: DecisionResult<TDecision>[] = [];
        const signals = [...this.state.signals].sort(
            (a, b) => a.signal.timestamp - b.signal.timestamp
        );

        this.emit({ type: "replay_started", signalCount: signals.length });

        for (let i = 0; i < signals.length; i++) {
            const signalsUpToNow = signals.slice(0, i + 1);
            const aggregate = this.aggregateSignals(signalsUpToNow);
            const decision = this.runDecision(aggregate, [signals[i].signal.id]);
            if (decision) {
                decisions.push(decision);
            }
        }

        this.emit({ type: "replay_completed" });
        return decisions;
    }

    // ============================================================================
    // Public API - Persistence
    // ============================================================================

    /**
     * Force save state to localStorage
     */
    save(): void {
        if (this.saveTimeoutId) {
            clearTimeout(this.saveTimeoutId);
            this.saveTimeoutId = null;
        }
        this.saveToStorage();
    }

    /**
     * Clear all stored data
     */
    clear(): void {
        this.state = this.createEmptyState();
        this.sessions = [];
        this.lastDecisionTime = null;

        if (typeof window !== "undefined") {
            localStorage.removeItem(this.getStorageKey());
        }

        this.startNewSession();
    }

    /**
     * Export all data
     */
    export(): StoredPipelineState<TSignal, TAggregate, TDecision> {
        return {
            version: this.config.persistence?.storageVersion ?? 1,
            pipelineId: this.config.id,
            signals: this.state.signals,
            decisions: this.state.decisions,
            sessions: this.sessions,
            lastUpdated: Date.now(),
        };
    }

    /**
     * Import data from export
     */
    import(
        data: StoredPipelineState<TSignal, TAggregate, TDecision>
    ): boolean {
        try {
            this.state.signals = data.signals || [];
            this.state.decisions = data.decisions || [];
            this.sessions = data.sessions || [];
            this.state.signalCount = this.state.signals.length;

            // Recalculate current aggregate
            this.state.currentAggregate = this.runAggregation();

            this.saveToStorage();
            this.initializeSession();

            return true;
        } catch (error) {
            this.emit({ type: "error", error: error as Error });
            return false;
        }
    }

    // ============================================================================
    // Private - Session Management
    // ============================================================================

    private initializeSession(): void {
        const lastSession = this.sessions[this.sessions.length - 1];
        const now = Date.now();

        if (
            lastSession &&
            !lastSession.endTime &&
            now - lastSession.startTime < SESSION_TIMEOUT_MS
        ) {
            // Resume existing session
            this.state.sessionId = lastSession.id;
            this.state.sessionStartTime = lastSession.startTime;
            this.state.isActive = true;
        } else {
            // Start new session
            this.startNewSession();
        }
    }

    // ============================================================================
    // Private - Pipeline Execution
    // ============================================================================

    private createCollectionContext(): CollectionContext {
        const lastSignal = this.state.signals[this.state.signals.length - 1];
        return {
            sessionId: this.state.sessionId,
            pipelineId: this.config.id,
            signalCount: this.state.signalCount,
            sessionStartTime: this.state.sessionStartTime,
            lastSignalTime: lastSignal?.signal.timestamp,
        };
    }

    private wrapSignal(signal: TSignal): CollectedSignal<TSignal> {
        const lastSignal = this.state.signals[this.state.signals.length - 1];
        return {
            signal: {
                ...signal,
                id: signal.id || generateSignalId(),
            },
            collectedAt: Date.now(),
            sessionId: this.state.sessionId,
            sequenceIndex: this.state.signalCount,
            previousSignalId: lastSignal?.signal.id,
        };
    }

    private runAggregation(): TAggregate {
        return this.aggregateSignals(this.state.signals);
    }

    private aggregateSignals(signals: CollectedSignal<TSignal>[]): TAggregate {
        const now = Date.now();
        const window = this.config.aggregation.window;

        let filteredSignals = signals;

        // Apply window if configured
        if (window) {
            switch (window.type) {
                case "sliding":
                    filteredSignals = signals.filter(
                        (s) => s.signal.timestamp >= now - window.size
                    );
                    break;
                case "tumbling":
                    const windowStart =
                        Math.floor(now / window.size) * window.size;
                    filteredSignals = signals.filter(
                        (s) => s.signal.timestamp >= windowStart
                    );
                    break;
                case "session":
                    filteredSignals = signals.filter(
                        (s) => s.sessionId === this.state.sessionId
                    );
                    break;
                case "count":
                    filteredSignals = signals.slice(-window.size);
                    break;
            }
        }

        const context: AggregationContext = {
            sessionId: this.state.sessionId,
            pipelineId: this.config.id,
            windowStart:
                filteredSignals.length > 0
                    ? filteredSignals[0].signal.timestamp
                    : now,
            windowEnd: now,
            totalSignals: filteredSignals.length,
        };

        return this.config.aggregation.aggregate(filteredSignals, context);
    }

    private runDecision(
        aggregate: TAggregate,
        triggeredBy: SignalId[]
    ): DecisionResult<TDecision> | null {
        const now = Date.now();

        // Check debounce
        const debounceMs = this.config.decision.debounceMs ?? 0;
        if (this.lastDecisionTime && now - this.lastDecisionTime < debounceMs) {
            return null;
        }

        const context: DecisionContext = {
            sessionId: this.state.sessionId,
            pipelineId: this.config.id,
            previousDecision:
                this.state.decisions[this.state.decisions.length - 1]?.decision,
            previousDecisionTime: this.lastDecisionTime ?? undefined,
            decisionCount: this.state.decisions.length,
        };

        const decision = this.config.decision.decide(aggregate, context);

        if (decision === null) {
            return null;
        }

        // Create decision result
        const result: DecisionResult<TDecision> = {
            decision,
            confidence: 1.0, // Can be customized
            timestamp: now,
            triggeredBy,
        };

        // Check confidence threshold
        const threshold = this.config.decision.confidenceThreshold ?? 0;
        if (result.confidence < threshold) {
            return null;
        }

        // Store decision
        this.state.decisions.push(result);
        this.state.lastDecisionTime = now;
        this.lastDecisionTime = now;

        this.emit({ type: "decision_made", decision: result });

        return result;
    }

    // ============================================================================
    // Private - State Management
    // ============================================================================

    private createEmptyState(): PipelineState<TSignal, TAggregate, TDecision> {
        return {
            pipelineId: this.config.id,
            sessionId: generateSessionId(),
            sessionStartTime: Date.now(),
            signals: [],
            currentAggregate: null,
            decisions: [],
            signalCount: 0,
            isActive: true,
        };
    }

    private pruneSignals(): void {
        const maxSignals = this.config.persistence?.maxSignals ?? DEFAULT_PERSISTENCE.maxSignals;
        const maxAge = this.config.persistence?.maxAge ?? DEFAULT_PERSISTENCE.maxAge;
        const now = Date.now();

        // Prune by age
        this.state.signals = this.state.signals.filter(
            (s) => now - s.signal.timestamp < maxAge
        );

        // Prune by count (keep most recent)
        if (this.state.signals.length > maxSignals) {
            this.state.signals = this.state.signals
                .sort((a, b) => b.signal.timestamp - a.signal.timestamp)
                .slice(0, maxSignals);
        }
    }

    // ============================================================================
    // Private - Persistence
    // ============================================================================

    private getStorageKey(): string {
        const prefix = this.config.persistence?.keyPrefix ?? DEFAULT_PERSISTENCE.keyPrefix;
        return `${prefix}-${this.config.id}`;
    }

    private load(): void {
        if (typeof window === "undefined") return;

        try {
            const stored = localStorage.getItem(this.getStorageKey());
            if (!stored) return;

            const data: StoredPipelineState<TSignal, TAggregate, TDecision> =
                JSON.parse(stored);

            // Version check/migration
            const currentVersion =
                this.config.persistence?.storageVersion ??
                DEFAULT_PERSISTENCE.storageVersion;
            if (data.version < currentVersion) {
                console.log(
                    `Migrating pipeline state from v${data.version} to v${currentVersion}`
                );
            }

            this.state.signals = data.signals || [];
            this.state.decisions = data.decisions || [];
            this.sessions = data.sessions || [];
            this.state.signalCount = this.state.signals.length;

            // Recalculate current aggregate
            this.state.currentAggregate = this.runAggregation();

            this.emit({
                type: "state_loaded",
                signalCount: this.state.signals.length,
            });
        } catch (error) {
            console.warn("Failed to load pipeline state:", error);
            this.emit({ type: "error", error: error as Error });
        }
    }

    private saveToStorage(): void {
        if (typeof window === "undefined") return;
        if (!this.config.persistence?.enabled) return;

        try {
            const data: StoredPipelineState<TSignal, TAggregate, TDecision> = {
                version:
                    this.config.persistence?.storageVersion ??
                    DEFAULT_PERSISTENCE.storageVersion,
                pipelineId: this.config.id,
                signals: this.state.signals,
                decisions: this.state.decisions,
                sessions: this.sessions,
                lastUpdated: Date.now(),
            };

            localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
            this.emit({ type: "state_saved" });
        } catch (error) {
            console.warn("Failed to save pipeline state:", error);
            this.emit({ type: "error", error: error as Error });
        }
    }

    private debouncedSave(): void {
        if (!this.config.persistence?.enabled) return;

        if (this.saveTimeoutId) {
            clearTimeout(this.saveTimeoutId);
        }

        const debounce =
            this.config.persistence?.saveDebounce ?? DEFAULT_PERSISTENCE.saveDebounce;

        this.saveTimeoutId = setTimeout(() => {
            this.saveToStorage();
            this.saveTimeoutId = null;
        }, debounce);
    }

    // ============================================================================
    // Private - Event Emission
    // ============================================================================

    private emit(event: PipelineEvent<TSignal, TAggregate, TDecision>): void {
        this.listeners.forEach((listener) => {
            try {
                listener(event);
            } catch (error) {
                console.warn("Pipeline event listener error:", error);
            }
        });
    }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new signal pipeline
 */
export function createPipeline<
    TInput,
    TSignal extends BaseSignal,
    TAggregate,
    TDecision
>(
    config: PipelineConfig<TInput, TSignal, TAggregate, TDecision>
): SignalPipeline<TInput, TSignal, TAggregate, TDecision> {
    return new SignalPipeline(config);
}

// Pipeline instance cache for singleton patterns
const pipelineCache = new Map<string, SignalPipeline<unknown, BaseSignal, unknown, unknown>>();

/**
 * Get or create a pipeline instance (singleton per ID)
 */
export function getPipeline<
    TInput,
    TSignal extends BaseSignal,
    TAggregate,
    TDecision
>(
    config: PipelineConfig<TInput, TSignal, TAggregate, TDecision>
): SignalPipeline<TInput, TSignal, TAggregate, TDecision> {
    if (!pipelineCache.has(config.id)) {
        pipelineCache.set(
            config.id,
            new SignalPipeline(config) as SignalPipeline<unknown, BaseSignal, unknown, unknown>
        );
    }
    return pipelineCache.get(config.id) as SignalPipeline<
        TInput,
        TSignal,
        TAggregate,
        TDecision
    >;
}

/**
 * Clear pipeline cache
 */
export function clearPipelineCache(): void {
    pipelineCache.forEach((pipeline) => pipeline.save());
    pipelineCache.clear();
}
