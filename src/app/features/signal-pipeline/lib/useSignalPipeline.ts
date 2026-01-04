"use client";

/**
 * useSignalPipeline - React hook for signal pipelines
 *
 * Provides reactive access to a signal pipeline with automatic
 * state updates and cleanup.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    BaseSignal,
    PipelineConfig,
    PipelineState,
    DecisionResult,
    CollectedSignal,
    PipelineStats,
    SessionId,
} from "./types";
import { SignalPipeline, createPipeline, getPipeline } from "./SignalPipeline";

// ============================================================================
// Hook Options
// ============================================================================

export interface UseSignalPipelineOptions {
    /** Use singleton pattern (getPipeline instead of createPipeline) */
    singleton?: boolean;
    /** Subscribe to specific event types only */
    subscribeToEvents?: Array<
        | "signal_collected"
        | "aggregate_updated"
        | "decision_made"
        | "session_started"
        | "session_ended"
    >;
    /** Callback when a decision is made */
    onDecision?: (decision: DecisionResult<unknown>) => void;
    /** Callback when aggregate updates */
    onAggregateUpdate?: (aggregate: unknown) => void;
    /** Auto-save on unmount */
    autoSaveOnUnmount?: boolean;
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseSignalPipelineReturn<
    TInput,
    TSignal extends BaseSignal,
    TAggregate,
    TDecision
> {
    /** Push input through the pipeline */
    push: (input: TInput) => DecisionResult<TDecision> | null;
    /** Push multiple inputs */
    pushBatch: (inputs: TInput[]) => DecisionResult<TDecision> | null;
    /** Current aggregate value */
    aggregate: TAggregate | null;
    /** All collected signals */
    signals: CollectedSignal<TSignal>[];
    /** Current session signals only */
    sessionSignals: CollectedSignal<TSignal>[];
    /** Decision history */
    decisions: DecisionResult<TDecision>[];
    /** Latest decision */
    latestDecision: DecisionResult<TDecision> | null;
    /** Current session ID */
    sessionId: SessionId;
    /** Total signal count */
    signalCount: number;
    /** Pipeline statistics */
    stats: PipelineStats;
    /** Start a new session */
    startNewSession: () => SessionId;
    /** End current session */
    endSession: () => void;
    /** Clear all data */
    clear: () => void;
    /** Force save to storage */
    save: () => void;
    /** Replay signals with callback */
    replay: (
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
    ) => void;
    /** Is pipeline active */
    isActive: boolean;
    /** Pipeline instance (for advanced usage) */
    pipeline: SignalPipeline<TInput, TSignal, TAggregate, TDecision>;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useSignalPipeline<
    TInput,
    TSignal extends BaseSignal,
    TAggregate,
    TDecision
>(
    config: PipelineConfig<TInput, TSignal, TAggregate, TDecision>,
    options: UseSignalPipelineOptions = {}
): UseSignalPipelineReturn<TInput, TSignal, TAggregate, TDecision> {
    const {
        singleton = true,
        subscribeToEvents,
        onDecision,
        onAggregateUpdate,
        autoSaveOnUnmount = true,
    } = options;

    // Create or get pipeline instance
    const pipelineRef = useRef<SignalPipeline<TInput, TSignal, TAggregate, TDecision> | null>(null);

    if (!pipelineRef.current) {
        pipelineRef.current = singleton
            ? getPipeline(config)
            : createPipeline(config);
    }

    const pipeline = pipelineRef.current;

    // State for reactive updates
    const [state, setState] = useState<{
        aggregate: TAggregate | null;
        signals: CollectedSignal<TSignal>[];
        decisions: DecisionResult<TDecision>[];
        sessionId: SessionId;
        signalCount: number;
        isActive: boolean;
    }>(() => {
        const pipelineState = pipeline.getState();
        return {
            aggregate: pipelineState.currentAggregate,
            signals: pipelineState.signals,
            decisions: pipelineState.decisions,
            sessionId: pipelineState.sessionId,
            signalCount: pipelineState.signalCount,
            isActive: pipelineState.isActive,
        };
    });

    // Subscribe to pipeline events
    useEffect(() => {
        const unsubscribe = pipeline.subscribe((event) => {
            // Filter by event types if specified
            if (subscribeToEvents && !subscribeToEvents.includes(event.type as typeof subscribeToEvents[number])) {
                return;
            }

            switch (event.type) {
                case "signal_collected":
                    setState((prev) => ({
                        ...prev,
                        signals: pipeline.getSignals(),
                        signalCount: prev.signalCount + 1,
                    }));
                    break;

                case "aggregate_updated":
                    setState((prev) => ({
                        ...prev,
                        aggregate: event.aggregate as TAggregate,
                    }));
                    onAggregateUpdate?.(event.aggregate);
                    break;

                case "decision_made":
                    setState((prev) => ({
                        ...prev,
                        decisions: pipeline.getDecisions(),
                    }));
                    onDecision?.(event.decision as DecisionResult<unknown>);
                    break;

                case "session_started":
                    setState((prev) => ({
                        ...prev,
                        sessionId: event.sessionId,
                        isActive: true,
                    }));
                    break;

                case "session_ended":
                    setState((prev) => ({
                        ...prev,
                        isActive: false,
                    }));
                    break;

                case "state_loaded":
                    // Refresh all state from pipeline
                    const pipelineState = pipeline.getState();
                    setState({
                        aggregate: pipelineState.currentAggregate,
                        signals: pipelineState.signals,
                        decisions: pipelineState.decisions,
                        sessionId: pipelineState.sessionId,
                        signalCount: pipelineState.signalCount,
                        isActive: pipelineState.isActive,
                    });
                    break;
            }
        });

        return () => {
            unsubscribe();
            if (autoSaveOnUnmount) {
                pipeline.save();
            }
        };
    }, [pipeline, subscribeToEvents, onDecision, onAggregateUpdate, autoSaveOnUnmount]);

    // Memoized actions
    const push = useCallback(
        (input: TInput) => pipeline.push(input),
        [pipeline]
    );

    const pushBatch = useCallback(
        (inputs: TInput[]) => pipeline.pushBatch(inputs),
        [pipeline]
    );

    const startNewSession = useCallback(
        () => pipeline.startNewSession(),
        [pipeline]
    );

    const endSession = useCallback(() => pipeline.endSession(), [pipeline]);

    const clear = useCallback(() => {
        pipeline.clear();
        setState({
            aggregate: null,
            signals: [],
            decisions: [],
            sessionId: pipeline.getSessionId(),
            signalCount: 0,
            isActive: true,
        });
    }, [pipeline]);

    const save = useCallback(() => pipeline.save(), [pipeline]);

    const replay = useCallback(
        (
            callback: (
                signal: CollectedSignal<TSignal>,
                index: number,
                total: number
            ) => void,
            opts?: {
                sessionId?: SessionId;
                startTime?: number;
                endTime?: number;
                types?: string[];
            }
        ) => pipeline.replay(callback, opts),
        [pipeline]
    );

    // Computed values
    const sessionSignals = useMemo(
        () => state.signals.filter((s) => s.sessionId === state.sessionId),
        [state.signals, state.sessionId]
    );

    const latestDecision = useMemo(
        () => state.decisions[state.decisions.length - 1] ?? null,
        [state.decisions]
    );

    const stats = useMemo(() => pipeline.getStats(), [pipeline, state.signalCount]);

    return {
        push,
        pushBatch,
        aggregate: state.aggregate,
        signals: state.signals,
        sessionSignals,
        decisions: state.decisions,
        latestDecision,
        sessionId: state.sessionId,
        signalCount: state.signalCount,
        stats,
        startNewSession,
        endSession,
        clear,
        save,
        replay,
        isActive: state.isActive,
        pipeline,
    };
}

// ============================================================================
// Simplified Hooks
// ============================================================================

/**
 * Hook that only returns the current aggregate
 */
export function useAggregate<TAggregate>(
    config: PipelineConfig<unknown, BaseSignal, TAggregate, unknown>
): TAggregate | null {
    const { aggregate } = useSignalPipeline(config, {
        subscribeToEvents: ["aggregate_updated"],
    });
    return aggregate;
}

/**
 * Hook that only returns the latest decision
 */
export function useLatestDecision<TDecision>(
    config: PipelineConfig<unknown, BaseSignal, unknown, TDecision>
): DecisionResult<TDecision> | null {
    const { latestDecision } = useSignalPipeline(config, {
        subscribeToEvents: ["decision_made"],
    });
    return latestDecision as DecisionResult<TDecision> | null;
}

/**
 * Hook that tracks decision count
 */
export function useDecisionCount(
    config: PipelineConfig<unknown, BaseSignal, unknown, unknown>
): number {
    const { decisions } = useSignalPipeline(config, {
        subscribeToEvents: ["decision_made"],
    });
    return decisions.length;
}

// ============================================================================
// Session Tracking Hook
// ============================================================================

export interface SessionTracking {
    sessionId: SessionId;
    sessionDuration: number;
    signalCount: number;
    isActive: boolean;
    startNewSession: () => SessionId;
    endSession: () => void;
}

/**
 * Hook for session tracking with auto-updating duration
 */
export function useSessionTracking(
    config: PipelineConfig<unknown, BaseSignal, unknown, unknown>,
    updateIntervalMs: number = 60000
): SessionTracking {
    const { sessionId, signalCount, isActive, startNewSession, endSession, pipeline } =
        useSignalPipeline(config);

    const [sessionDuration, setSessionDuration] = useState(0);

    useEffect(() => {
        const state = pipeline.getState();
        const updateDuration = () => {
            if (state.isActive) {
                setSessionDuration(Date.now() - state.sessionStartTime);
            }
        };

        updateDuration();
        const interval = setInterval(updateDuration, updateIntervalMs);

        return () => clearInterval(interval);
    }, [pipeline, updateIntervalMs, sessionId]);

    return {
        sessionId,
        sessionDuration,
        signalCount,
        isActive,
        startNewSession,
        endSession,
    };
}
