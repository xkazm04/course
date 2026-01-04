/**
 * React Hooks for State Machines
 *
 * Provides React integration for state machines with
 * automatic re-rendering on state changes.
 */

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createMachine } from "./createMachine";
import {
  createLocalStorageAdapter,
  createPersistedMachine,
} from "./persistence";
import {
  generateVisualization,
  getTransitionTimeline,
  calculateProgressMetrics,
} from "./visualization";
import type {
  StateId,
  EventId,
  MachineContext,
  MachineDefinition,
  MachineInstance,
  MachineState,
  SendResult,
  VisualizationData,
  PersistenceOptions,
  StorageAdapter,
} from "./types";

// ============================================================================
// Core useMachine Hook
// ============================================================================

export interface UseMachineOptions<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
> {
  /** Enable persistence to localStorage */
  persist?: boolean;
  /** Persistence options */
  persistOptions?: Partial<PersistenceOptions<TState, TContext, TEvent>>;
  /** Instance ID for multiple instances of the same machine */
  instanceId?: string;
  /** Initial snapshot to restore from */
  initialSnapshot?: MachineState<TState, TContext, TEvent>;
}

export interface UseMachineReturn<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
> {
  /** Current state */
  state: TState;
  /** Current context */
  context: TContext;
  /** Full machine snapshot */
  snapshot: MachineState<TState, TContext, TEvent>;
  /** Send an event to the machine */
  send: (event: TEvent, payload?: unknown) => SendResult<TState>;
  /** Update context */
  updateContext: (updater: (ctx: TContext) => TContext) => SendResult<TState>;
  /** Check if an event can trigger a transition */
  can: (event: TEvent, payload?: unknown) => boolean;
  /** Get available transitions from current state */
  availableTransitions: { event: TEvent; target: TState; description?: string }[];
  /** Reset the machine */
  reset: () => void;
  /** Get state metadata */
  getStateMeta: (state?: TState) => { label: string; description: string; icon: string };
  /** Machine instance for advanced use */
  machine: MachineInstance<TState, TContext, TEvent>;
  /** Whether machine is ready (persisted state loaded) */
  isReady: boolean;
}

/**
 * React hook for using a state machine
 */
export function useMachine<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>(
  definition: MachineDefinition<TState, TContext, TEvent>,
  options?: UseMachineOptions<TState, TContext, TEvent>
): UseMachineReturn<TState, TContext, TEvent> {
  const {
    persist = false,
    persistOptions,
    instanceId = "default",
    initialSnapshot,
  } = options ?? {};

  // Create machine instance (stable reference)
  const machineRef = useRef<MachineInstance<TState, TContext, TEvent> | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize machine
  if (!machineRef.current) {
    if (persist) {
      const adapter = persistOptions?.adapter ?? createLocalStorageAdapter<TState, TContext, TEvent>({
        prefix: "sm",
        ttlMs: persistOptions?.debounceMs ? undefined : 24 * 60 * 60 * 1000, // 24h default TTL
      });

      machineRef.current = createPersistedMachine(definition, {
        adapter,
        instanceId,
        debounceMs: persistOptions?.debounceMs ?? 100,
        excludeStates: persistOptions?.excludeStates ?? [],
      });
    } else {
      machineRef.current = createMachine(definition, initialSnapshot);
    }
  }

  const machine = machineRef.current;

  // Track state for React re-renders
  const [machineState, setMachineState] = useState<MachineState<TState, TContext, TEvent>>(
    () => machine.getSnapshot()
  );

  // Subscribe to machine changes
  useEffect(() => {
    const unsubscribe = machine.subscribe((newState) => {
      setMachineState({ ...newState });
    });

    // Mark as ready after first render
    setIsReady(true);

    return unsubscribe;
  }, [machine]);

  // Memoized available transitions
  const availableTransitions = useMemo(
    () => machine.getAvailableTransitions(),
    [machine, machineState.currentState, machineState.context]
  );

  // Stable callbacks
  const send = useCallback(
    (event: TEvent, payload?: unknown) => machine.send(event, payload),
    [machine]
  );

  const updateContext = useCallback(
    (updater: (ctx: TContext) => TContext) => machine.updateContext(updater),
    [machine]
  );

  const can = useCallback(
    (event: TEvent, payload?: unknown) => machine.can(event, payload),
    [machine]
  );

  const reset = useCallback(() => machine.reset(), [machine]);

  const getStateMeta = useCallback(
    (state?: TState) => {
      const meta = machine.getStateMeta(state);
      return {
        label: meta.label,
        description: meta.description,
        icon: meta.icon,
      };
    },
    [machine]
  );

  return {
    state: machineState.currentState,
    context: machineState.context,
    snapshot: machineState,
    send,
    updateContext,
    can,
    availableTransitions,
    reset,
    getStateMeta,
    machine,
    isReady,
  };
}

// ============================================================================
// Visualization Hook
// ============================================================================

export interface UseMachineVisualizationReturn<
  TState extends StateId,
  TEvent extends EventId
> {
  /** Visualization data for rendering */
  visualization: VisualizationData<TState, TEvent>;
  /** Formatted transition timeline */
  timeline: ReturnType<typeof getTransitionTimeline>;
  /** Progress metrics */
  progress: ReturnType<typeof calculateProgressMetrics>;
}

/**
 * Hook for getting visualization data from a machine
 */
export function useMachineVisualization<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>(
  definition: MachineDefinition<TState, TContext, TEvent>,
  machine: MachineInstance<TState, TContext, TEvent>,
  options?: {
    completedStates?: TState[];
    blockedStates?: TState[];
  }
): UseMachineVisualizationReturn<TState, TEvent> {
  const [, setUpdateTrigger] = useState(0);

  // Subscribe to machine changes to trigger re-renders
  useEffect(() => {
    const unsubscribe = machine.subscribe(() => {
      setUpdateTrigger((n) => n + 1);
    });
    return unsubscribe;
  }, [machine]);

  const visualization = useMemo(
    () => generateVisualization(definition, machine),
    [definition, machine, machine.getState()]
  );

  const timeline = useMemo(
    () => getTransitionTimeline(machine, definition),
    [machine, definition, machine.getHistory().length]
  );

  const progress = useMemo(
    () => calculateProgressMetrics(machine, definition, options),
    [machine, definition, options, machine.getState()]
  );

  return {
    visualization,
    timeline,
    progress,
  };
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook for matching current state
 */
export function useMachineState<TState extends StateId>(
  machine: MachineInstance<TState, MachineContext, EventId>
): TState {
  const [state, setState] = useState<TState>(machine.getState());

  useEffect(() => {
    const unsubscribe = machine.subscribe((snapshot) => {
      setState(snapshot.currentState);
    });
    return unsubscribe;
  }, [machine]);

  return state;
}

/**
 * Hook that returns true when machine is in one of the specified states
 */
export function useMachineMatches<TState extends StateId>(
  machine: MachineInstance<TState, MachineContext, EventId>,
  states: TState | TState[]
): boolean {
  const currentState = useMachineState(machine);
  const stateList = Array.isArray(states) ? states : [states];
  return stateList.includes(currentState);
}

/**
 * Hook for accessing machine context
 */
export function useMachineContext<TContext extends MachineContext>(
  machine: MachineInstance<StateId, TContext, EventId>
): TContext {
  const [context, setContext] = useState<TContext>(machine.getContext());

  useEffect(() => {
    const unsubscribe = machine.subscribe((snapshot) => {
      setContext(snapshot.context);
    });
    return unsubscribe;
  }, [machine]);

  return context;
}

/**
 * Hook for creating a machine selector (memoized context accessor)
 */
export function useMachineSelector<TContext extends MachineContext, TSelected>(
  machine: MachineInstance<StateId, TContext, EventId>,
  selector: (context: TContext) => TSelected
): TSelected {
  const [selected, setSelected] = useState<TSelected>(() =>
    selector(machine.getContext())
  );
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  useEffect(() => {
    const unsubscribe = machine.subscribe((snapshot) => {
      const newSelected = selectorRef.current(snapshot.context);
      setSelected(newSelected);
    });
    return unsubscribe;
  }, [machine]);

  return selected;
}
