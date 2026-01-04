/**
 * State Machine Factory
 *
 * Creates machine instances from declarative definitions.
 * Handles transitions, guards, actions, effects, and subscriptions.
 */

import type {
  StateId,
  EventId,
  MachineContext,
  MachineDefinition,
  MachineState,
  MachineInstance,
  MachineListener,
  TransitionEvent,
  TransitionDefinition,
  SendResult,
  StateMetadata,
} from "./types";

/**
 * Generate a unique ID for transition events
 */
function generateTransitionId(): string {
  return `tr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a machine instance from a definition
 */
export function createMachine<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>(
  definition: MachineDefinition<TState, TContext, TEvent>,
  initialSnapshot?: MachineState<TState, TContext, TEvent>
): MachineInstance<TState, TContext, TEvent> {
  // Initialize state
  let state: MachineState<TState, TContext, TEvent> = initialSnapshot ?? {
    currentState: definition.initialState,
    context: definition.createInitialContext(),
    stateEnteredAt: Date.now(),
    history: [],
    maxHistoryLength: 50,
    lastUpdated: Date.now(),
  };

  // Listeners for state changes
  const listeners = new Set<MachineListener<TState, TContext, TEvent>>();

  /**
   * Notify all listeners of state change
   */
  function notifyListeners(transition?: TransitionEvent<TState, TEvent, TContext>) {
    listeners.forEach((listener) => {
      try {
        listener(state, transition);
      } catch (e) {
        console.error("[StateMachine] Listener error:", e);
      }
    });
  }

  /**
   * Get transitions for a given event from current state
   */
  function getTransitionsForEvent(
    event: TEvent
  ): TransitionDefinition<TState, TContext, TEvent>[] {
    const currentStateDef = definition.states[state.currentState];
    if (!currentStateDef?.on?.[event]) return [];

    const transitions = currentStateDef.on[event];
    return Array.isArray(transitions) ? transitions : [transitions];
  }

  /**
   * Find the first valid transition for an event
   */
  function findValidTransition(
    event: TEvent,
    payload?: unknown
  ): TransitionDefinition<TState, TContext, TEvent> | null {
    const transitions = getTransitionsForEvent(event);

    // Sort by priority (higher first)
    const sorted = [...transitions].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    for (const transition of sorted) {
      if (!transition.guard || transition.guard(state.context, event, payload)) {
        return transition;
      }
    }

    return null;
  }

  /**
   * Evaluate auto-transitions (always conditions)
   */
  function evaluateAutoTransitions(): TransitionDefinition<TState, TContext, TEvent> | null {
    const currentStateDef = definition.states[state.currentState];
    if (!currentStateDef?.always) return null;

    const sorted = [...currentStateDef.always].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );

    for (const transition of sorted) {
      if (!transition.guard || transition.guard(state.context, "" as TEvent, undefined)) {
        return transition;
      }
    }

    return null;
  }

  /**
   * Execute a transition
   */
  function executeTransition(
    transition: TransitionDefinition<TState, TContext, TEvent>,
    event: TEvent,
    payload?: unknown
  ): TransitionEvent<TState, TEvent, TContext> {
    const now = Date.now();
    const fromState = state.currentState;
    const toState = transition.target;

    // Execute exit actions from current state
    const fromStateDef = definition.states[fromState];
    if (fromStateDef?.onExit) {
      for (const action of fromStateDef.onExit) {
        const result = action(state.context, event, payload);
        if (result) state.context = result;
      }
    }

    // Execute transition actions
    if (transition.actions) {
      for (const action of transition.actions) {
        const result = action(state.context, event, payload);
        if (result) state.context = result;
      }
    }

    // Execute entry actions for new state
    const toStateDef = definition.states[toState];
    if (toStateDef?.onEntry) {
      for (const action of toStateDef.onEntry) {
        const result = action(state.context, event, payload);
        if (result) state.context = result;
      }
    }

    // Create transition event
    const transitionEvent: TransitionEvent<TState, TEvent, TContext> = {
      id: generateTransitionId(),
      timestamp: now,
      fromState,
      toState,
      event,
      payload,
      triggeredBy: transition.description,
      contextSnapshot: { ...state.context },
    };

    // Update state
    state = {
      ...state,
      currentState: toState,
      stateEnteredAt: now,
      history: [...state.history, transitionEvent].slice(-state.maxHistoryLength),
      lastUpdated: now,
    };

    // Execute transition effects (async-safe)
    if (transition.effects) {
      for (const effect of transition.effects) {
        try {
          const result = effect(state.context, event, payload);
          if (result instanceof Promise) {
            result.catch((e) => console.error("[StateMachine] Effect error:", e));
          }
        } catch (e) {
          console.error("[StateMachine] Effect error:", e);
        }
      }
    }

    // Execute global transition effects
    if (definition.onTransition) {
      for (const effect of definition.onTransition) {
        try {
          const result = effect(state.context, event, payload);
          if (result instanceof Promise) {
            result.catch((e) => console.error("[StateMachine] Global effect error:", e));
          }
        } catch (e) {
          console.error("[StateMachine] Global effect error:", e);
        }
      }
    }

    return transitionEvent;
  }

  /**
   * Process auto-transitions recursively (with safety limit)
   */
  function processAutoTransitions(maxDepth = 10): TransitionEvent<TState, TEvent, TContext> | null {
    let lastTransition: TransitionEvent<TState, TEvent, TContext> | null = null;
    let depth = 0;

    while (depth < maxDepth) {
      const autoTransition = evaluateAutoTransitions();
      if (!autoTransition) break;

      lastTransition = executeTransition(autoTransition, "AUTO" as TEvent, undefined);
      notifyListeners(lastTransition);
      depth++;
    }

    if (depth >= maxDepth) {
      console.warn("[StateMachine] Max auto-transition depth reached, possible infinite loop");
    }

    return lastTransition;
  }

  // The machine instance
  const instance: MachineInstance<TState, TContext, TEvent> = {
    getState() {
      return state.currentState;
    },

    getContext() {
      return state.context;
    },

    getSnapshot() {
      return { ...state };
    },

    send(event: TEvent, payload?: unknown): SendResult<TState> {
      const transition = findValidTransition(event, payload);

      if (!transition) {
        return {
          transitioned: false,
          currentState: state.currentState,
        };
      }

      const previousState = state.currentState;
      const transitionEvent = executeTransition(transition, event, payload);

      notifyListeners(transitionEvent);

      // Check for auto-transitions after the main transition
      processAutoTransitions();

      return {
        transitioned: true,
        previousState,
        currentState: state.currentState,
        transition: transitionEvent,
      };
    },

    updateContext(updater: (ctx: TContext) => TContext): SendResult<TState> {
      state = {
        ...state,
        context: updater(state.context),
        lastUpdated: Date.now(),
      };

      notifyListeners();

      // Check for auto-transitions after context update
      const autoTransition = processAutoTransitions();

      return {
        transitioned: !!autoTransition,
        currentState: state.currentState,
        transition: autoTransition ?? undefined,
      };
    },

    can(event: TEvent, payload?: unknown): boolean {
      return findValidTransition(event, payload) !== null;
    },

    getAvailableTransitions() {
      const currentStateDef = definition.states[state.currentState];
      if (!currentStateDef?.on) return [];

      const available: { event: TEvent; target: TState; description?: string }[] = [];

      for (const [event, transitions] of Object.entries(currentStateDef.on)) {
        const transitionList = Array.isArray(transitions) ? transitions : [transitions];

        for (const transition of transitionList) {
          const t = transition as TransitionDefinition<TState, TContext, TEvent>;
          if (!t.guard || t.guard(state.context, event as TEvent, undefined)) {
            available.push({
              event: event as TEvent,
              target: t.target,
              description: t.description,
            });
          }
        }
      }

      return available;
    },

    getHistory() {
      return [...state.history];
    },

    reset() {
      const now = Date.now();
      state = {
        currentState: definition.initialState,
        context: definition.createInitialContext(),
        stateEnteredAt: now,
        history: [],
        maxHistoryLength: state.maxHistoryLength,
        lastUpdated: now,
      };
      notifyListeners();
    },

    getStateMeta(targetState?: TState): StateMetadata {
      const s = targetState ?? state.currentState;
      return definition.states[s]?.meta ?? {
        label: s,
        description: "",
        icon: "❓",
        style: {
          text: "text-[var(--forge-text-primary)]",
          bg: "bg-[var(--forge-bg-elevated)]",
          border: "border-[var(--forge-border)]",
        },
      };
    },

    subscribe(listener: MachineListener<TState, TContext, TEvent>) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    restore(snapshot: MachineState<TState, TContext, TEvent>) {
      state = { ...snapshot };
      notifyListeners();
    },
  };

  // Run initial auto-transitions
  processAutoTransitions();

  return instance;
}

/**
 * Helper to create a type-safe machine definition
 */
export function defineMachine<
  TState extends string,
  TContext extends MachineContext,
  TEvent extends string
>(
  definition: MachineDefinition<TState, TContext, TEvent>
): MachineDefinition<TState, TContext, TEvent> {
  return definition;
}
