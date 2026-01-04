/**
 * State Machine Visualization Utilities
 *
 * Generates visualization data for state machines that can be
 * used by debugging and display components.
 */

import type {
  StateId,
  EventId,
  MachineContext,
  MachineDefinition,
  MachineInstance,
  VisualizationData,
  VisualizationNode,
  VisualizationEdge,
  TransitionEvent,
} from "./types";

/**
 * Generate visualization data from a machine instance
 */
export function generateVisualization<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>(
  definition: MachineDefinition<TState, TContext, TEvent>,
  instance: MachineInstance<TState, TContext, TEvent>
): VisualizationData<TState, TEvent> {
  const history = instance.getHistory();
  const currentState = instance.getState();

  // Calculate statistics from history
  const visitCounts = new Map<TState, number>();
  const timeInState = new Map<TState, number>();
  const transitionCounts = new Map<string, number>();

  // Process history for statistics
  for (let i = 0; i < history.length; i++) {
    const event = history[i];
    const prevCount = visitCounts.get(event.toState) ?? 0;
    visitCounts.set(event.toState, prevCount + 1);

    // Calculate time in state
    if (i < history.length - 1) {
      const nextEvent = history[i + 1];
      const duration = nextEvent.timestamp - event.timestamp;
      const prevTime = timeInState.get(event.toState) ?? 0;
      timeInState.set(event.toState, prevTime + duration);
    }

    // Count transitions
    const edgeKey = `${event.fromState}:${event.toState}:${event.event}`;
    const prevTransCount = transitionCounts.get(edgeKey) ?? 0;
    transitionCounts.set(edgeKey, prevTransCount + 1);
  }

  // Build nodes
  const nodes: VisualizationNode<TState>[] = [];
  for (const [stateId, stateDef] of Object.entries(definition.states)) {
    const state = stateId as TState;
    const meta = (stateDef as { meta: { label: string; description: string; icon: string; style: { text: string; bg: string; border: string; gradient?: string } }; isFinal?: boolean }).meta;
    nodes.push({
      id: state,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
      style: meta.style,
      isCurrent: state === currentState,
      isFinal: (stateDef as { isFinal?: boolean }).isFinal ?? false,
      visitCount: visitCounts.get(state) ?? 0,
      totalTimeInState: timeInState.get(state) ?? 0,
    });
  }

  // Build edges from state definitions
  const edges: VisualizationEdge<TState, TEvent>[] = [];
  const seenEdges = new Set<string>();

  for (const [stateId, stateDef] of Object.entries(definition.states)) {
    const state = stateId as TState;
    const stateDefinition = stateDef as { on?: Record<string, { target: TState; description?: string } | { target: TState; description?: string }[]> };

    if (!stateDefinition.on) continue;

    for (const [event, transitions] of Object.entries(stateDefinition.on)) {
      const transitionList = Array.isArray(transitions) ? transitions : [transitions];

      for (const transition of transitionList) {
        const edgeId = `${state}:${transition.target}:${event}`;
        if (seenEdges.has(edgeId)) continue;
        seenEdges.add(edgeId);

        const transitionKey = `${state}:${transition.target}:${event}`;
        const count = transitionCounts.get(transitionKey) ?? 0;

        // Check if this was the most recent transition
        const lastTransition = history[history.length - 1];
        const isRecent = lastTransition
          ? lastTransition.fromState === state &&
            lastTransition.toState === transition.target &&
            lastTransition.event === event
          : false;

        edges.push({
          id: edgeId,
          source: state,
          target: transition.target,
          event: event as TEvent,
          description: transition.description,
          transitionCount: count,
          isRecent,
        });
      }
    }
  }

  // Build transition history for timeline
  const transitionHistory = history.map((event) => ({
    from: event.fromState,
    to: event.toState,
    event: event.event,
    timestamp: event.timestamp,
  }));

  return {
    nodes,
    edges,
    currentState,
    transitionHistory,
  };
}

/**
 * Get a formatted timeline of transitions
 */
export function getTransitionTimeline<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>(
  instance: MachineInstance<TState, TContext, TEvent>,
  definition: MachineDefinition<TState, TContext, TEvent>
): {
  id: string;
  from: { state: TState; label: string; icon: string };
  to: { state: TState; label: string; icon: string };
  event: TEvent;
  timestamp: number;
  relativeTime: string;
  description?: string;
}[] {
  const history = instance.getHistory();
  const now = Date.now();

  return history.map((event) => {
    const fromMeta = definition.states[event.fromState]?.meta;
    const toMeta = definition.states[event.toState]?.meta;

    return {
      id: event.id,
      from: {
        state: event.fromState,
        label: fromMeta?.label ?? event.fromState,
        icon: fromMeta?.icon ?? "❓",
      },
      to: {
        state: event.toState,
        label: toMeta?.label ?? event.toState,
        icon: toMeta?.icon ?? "❓",
      },
      event: event.event,
      timestamp: event.timestamp,
      relativeTime: formatRelativeTime(event.timestamp, now),
      description: event.triggeredBy,
    };
  });
}

/**
 * Format a timestamp as relative time
 */
function formatRelativeTime(timestamp: number, now: number): string {
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 5) return `${seconds}s ago`;
  return "just now";
}

/**
 * Calculate progress metrics for a machine
 */
export function calculateProgressMetrics<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>(
  instance: MachineInstance<TState, TContext, TEvent>,
  definition: MachineDefinition<TState, TContext, TEvent>,
  options?: {
    /** States considered as "completed" for progress calculation */
    completedStates?: TState[];
    /** States considered as "stuck" or blocked */
    blockedStates?: TState[];
  }
): {
  /** Percentage of states visited */
  statesVisitedPercent: number;
  /** Number of transitions made */
  totalTransitions: number;
  /** Current state info */
  currentStateInfo: { state: TState; label: string; icon: string };
  /** Is currently in a completed state */
  isCompleted: boolean;
  /** Is currently in a blocked state */
  isBlocked: boolean;
  /** Time spent in current state (ms) */
  timeInCurrentState: number;
  /** Average time per transition (ms) */
  avgTransitionTime: number;
} {
  const history = instance.getHistory();
  const currentState = instance.getState();
  const snapshot = instance.getSnapshot();
  const meta = instance.getStateMeta();

  const { completedStates = [], blockedStates = [] } = options ?? {};

  // Calculate unique states visited
  const visitedStates = new Set<TState>([currentState]);
  for (const event of history) {
    visitedStates.add(event.toState);
    visitedStates.add(event.fromState);
  }

  const totalStates = Object.keys(definition.states).length;
  const statesVisitedPercent = (visitedStates.size / totalStates) * 100;

  // Calculate average transition time
  let totalTransitionTime = 0;
  for (let i = 1; i < history.length; i++) {
    totalTransitionTime += history[i].timestamp - history[i - 1].timestamp;
  }
  const avgTransitionTime = history.length > 1 ? totalTransitionTime / (history.length - 1) : 0;

  return {
    statesVisitedPercent,
    totalTransitions: history.length,
    currentStateInfo: {
      state: currentState,
      label: meta.label,
      icon: meta.icon,
    },
    isCompleted: completedStates.includes(currentState),
    isBlocked: blockedStates.includes(currentState),
    timeInCurrentState: Date.now() - snapshot.stateEnteredAt,
    avgTransitionTime,
  };
}

/**
 * Generate a DOT graph representation for debugging
 */
export function generateDotGraph<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>(
  definition: MachineDefinition<TState, TContext, TEvent>,
  instance?: MachineInstance<TState, TContext, TEvent>
): string {
  const currentState = instance?.getState();
  const lines: string[] = [
    "digraph StateMachine {",
    '  rankdir=LR;',
    '  node [shape=box, style="rounded,filled", fontname="sans-serif"];',
    '  edge [fontname="sans-serif", fontsize=10];',
    "",
  ];

  // Add nodes
  for (const [stateId, stateDef] of Object.entries(definition.states)) {
    const state = stateId as TState;
    const meta = (stateDef as { meta: { label: string }; isFinal?: boolean }).meta;
    const isFinal = (stateDef as { isFinal?: boolean }).isFinal;
    const isCurrent = state === currentState;

    const attrs: string[] = [`label="${meta.label}"`];

    if (isCurrent) {
      attrs.push('fillcolor="#4ade80"');
      attrs.push('color="#22c55e"');
      attrs.push("penwidth=2");
    } else if (isFinal) {
      attrs.push('fillcolor="#fbbf24"');
      attrs.push('color="#f59e0b"');
    } else {
      attrs.push('fillcolor="#f3f4f6"');
      attrs.push('color="#d1d5db"');
    }

    lines.push(`  "${state}" [${attrs.join(", ")}];`);
  }

  lines.push("");

  // Add edges
  for (const [stateId, stateDef] of Object.entries(definition.states)) {
    const state = stateId as TState;
    const stateDefinition = stateDef as { on?: Record<string, { target: TState; description?: string } | { target: TState; description?: string }[]> };

    if (!stateDefinition.on) continue;

    for (const [event, transitions] of Object.entries(stateDefinition.on)) {
      const transitionList = Array.isArray(transitions) ? transitions : [transitions];

      for (const transition of transitionList) {
        const label = transition.description || event;
        lines.push(`  "${state}" -> "${transition.target}" [label="${label}"];`);
      }
    }
  }

  lines.push("}");

  return lines.join("\n");
}
