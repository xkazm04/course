/**
 * Declarative State Machine Engine Types
 *
 * A generic, declarative state machine engine that accepts definitions
 * and generates runtime behavior with built-in visualization and persistence.
 */

// ============================================================================
// Core State Machine Types
// ============================================================================

/**
 * Base state identifier - can be any string
 */
export type StateId = string;

/**
 * Event identifier - can be any string
 */
export type EventId = string;

/**
 * Transition identifier - typically "fromState_to_toState"
 */
export type TransitionId = string;

/**
 * Context type for storing machine-specific data
 */
export type MachineContext = Record<string, unknown>;

/**
 * Guard function that determines if a transition can occur
 */
export type GuardFn<TContext extends MachineContext, TEvent extends EventId> = (
  context: TContext,
  event: TEvent,
  payload?: unknown
) => boolean;

/**
 * Action function executed during transitions
 */
export type ActionFn<TContext extends MachineContext, TEvent extends EventId> = (
  context: TContext,
  event: TEvent,
  payload?: unknown
) => TContext | void;

/**
 * Side effect function (doesn't modify context)
 */
export type EffectFn<TContext extends MachineContext, TEvent extends EventId> = (
  context: TContext,
  event: TEvent,
  payload?: unknown
) => void | Promise<void>;

// ============================================================================
// State Definition
// ============================================================================

/**
 * Visual styling for a state
 */
export interface StateStyle {
  /** Text color class (Tailwind) */
  text: string;
  /** Background color class (Tailwind) */
  bg: string;
  /** Border color class (Tailwind) */
  border: string;
  /** Optional gradient classes */
  gradient?: string;
}

/**
 * State metadata for display and debugging
 */
export interface StateMetadata {
  /** Human-readable label */
  label: string;
  /** Description of what this state means */
  description: string;
  /** Emoji or icon identifier */
  icon: string;
  /** Visual styling */
  style: StateStyle;
}

/**
 * Transition definition within a state
 */
export interface TransitionDefinition<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
> {
  /** Target state to transition to */
  target: TState;
  /** Optional guard condition - transition only occurs if guard returns true */
  guard?: GuardFn<TContext, TEvent>;
  /** Description of this transition (for debugging/visualization) */
  description?: string;
  /** Actions to execute during transition (can modify context) */
  actions?: ActionFn<TContext, TEvent>[];
  /** Side effects to execute (async-safe, don't modify context) */
  effects?: EffectFn<TContext, TEvent>[];
  /** Priority for guard evaluation (higher = checked first) */
  priority?: number;
}

/**
 * Complete state definition
 */
export interface StateDefinition<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
> {
  /** State identifier */
  id: TState;
  /** Metadata for display */
  meta: StateMetadata;
  /** Transitions from this state, keyed by event */
  on?: Record<TEvent, TransitionDefinition<TState, TContext, TEvent> | TransitionDefinition<TState, TContext, TEvent>[]>;
  /** Actions to execute when entering this state */
  onEntry?: ActionFn<TContext, TEvent>[];
  /** Actions to execute when exiting this state */
  onExit?: ActionFn<TContext, TEvent>[];
  /** Is this a final state (no outgoing transitions expected)? */
  isFinal?: boolean;
  /** Auto-transitions that evaluate on any context change */
  always?: TransitionDefinition<TState, TContext, TEvent>[];
}

// ============================================================================
// Machine Definition
// ============================================================================

/**
 * Complete state machine definition
 */
export interface MachineDefinition<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
> {
  /** Unique identifier for this machine type */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this machine does */
  description?: string;
  /** Version for migrations */
  version: string;
  /** Initial state when machine is created */
  initialState: TState;
  /** Factory function to create initial context */
  createInitialContext: () => TContext;
  /** All state definitions */
  states: Record<TState, StateDefinition<TState, TContext, TEvent>>;
  /** Global effects that run on any transition */
  onTransition?: EffectFn<TContext, TEvent>[];
}

// ============================================================================
// Machine Instance (Runtime State)
// ============================================================================

/**
 * A recorded transition event
 */
export interface TransitionEvent<
  TState extends StateId,
  TEvent extends EventId,
  TContext extends MachineContext
> {
  /** Unique ID for this event */
  id: string;
  /** Timestamp of transition */
  timestamp: number;
  /** State before transition */
  fromState: TState;
  /** State after transition */
  toState: TState;
  /** Event that triggered the transition */
  event: TEvent;
  /** Payload passed with the event */
  payload?: unknown;
  /** Description of why this transition occurred */
  triggeredBy?: string;
  /** Context snapshot at time of transition */
  contextSnapshot?: TContext;
}

/**
 * Machine instance state (the runtime model)
 */
export interface MachineState<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
> {
  /** Current state */
  currentState: TState;
  /** Machine context */
  context: TContext;
  /** When the current state was entered */
  stateEnteredAt: number;
  /** History of transitions (most recent last) */
  history: TransitionEvent<TState, TEvent, TContext>[];
  /** Maximum history length (for memory management) */
  maxHistoryLength: number;
  /** Last updated timestamp */
  lastUpdated: number;
}

// ============================================================================
// Machine Instance API
// ============================================================================

/**
 * Result of sending an event to a machine
 */
export interface SendResult<TState extends StateId> {
  /** Whether a transition occurred */
  transitioned: boolean;
  /** Previous state (if transitioned) */
  previousState?: TState;
  /** Current state */
  currentState: TState;
  /** Transition that occurred (if any) */
  transition?: TransitionEvent<TState, string, MachineContext>;
}

/**
 * Machine instance - the runtime object
 */
export interface MachineInstance<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
> {
  /** Get current state */
  getState(): TState;
  /** Get current context */
  getContext(): TContext;
  /** Get full machine state (for persistence) */
  getSnapshot(): MachineState<TState, TContext, TEvent>;
  /** Send an event to the machine */
  send(event: TEvent, payload?: unknown): SendResult<TState>;
  /** Update context directly (will trigger auto-transitions) */
  updateContext(updater: (ctx: TContext) => TContext): SendResult<TState>;
  /** Check if a transition can occur for an event */
  can(event: TEvent, payload?: unknown): boolean;
  /** Get available transitions from current state */
  getAvailableTransitions(): { event: TEvent; target: TState; description?: string }[];
  /** Get transition history */
  getHistory(): TransitionEvent<TState, TEvent, TContext>[];
  /** Reset to initial state */
  reset(): void;
  /** Get state metadata */
  getStateMeta(state?: TState): StateMetadata;
  /** Subscribe to state changes */
  subscribe(listener: MachineListener<TState, TContext, TEvent>): () => void;
  /** Restore from snapshot */
  restore(snapshot: MachineState<TState, TContext, TEvent>): void;
}

/**
 * Listener for machine state changes
 */
export type MachineListener<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
> = (state: MachineState<TState, TContext, TEvent>, transition?: TransitionEvent<TState, TEvent, TContext>) => void;

// ============================================================================
// Persistence Types
// ============================================================================

/**
 * Storage adapter interface for persistence middleware
 */
export interface StorageAdapter<TState extends StateId, TContext extends MachineContext, TEvent extends EventId> {
  /** Load state from storage */
  load(machineId: string, instanceId: string): MachineState<TState, TContext, TEvent> | null;
  /** Save state to storage */
  save(machineId: string, instanceId: string, state: MachineState<TState, TContext, TEvent>): void;
  /** Remove state from storage */
  remove(machineId: string, instanceId: string): void;
}

/**
 * Persistence middleware options
 */
export interface PersistenceOptions<TState extends StateId, TContext extends MachineContext, TEvent extends EventId> {
  /** Storage adapter */
  adapter: StorageAdapter<TState, TContext, TEvent>;
  /** Instance identifier (for multiple instances of same machine) */
  instanceId?: string;
  /** Debounce saves (in ms) */
  debounceMs?: number;
  /** States to exclude from persistence */
  excludeStates?: TState[];
  /** Version for migration */
  version?: string;
}

// ============================================================================
// Visualization Types
// ============================================================================

/**
 * Node for visualization graph
 */
export interface VisualizationNode<TState extends StateId> {
  id: TState;
  label: string;
  description: string;
  icon: string;
  style: StateStyle;
  isCurrent: boolean;
  isFinal: boolean;
  /** Number of times this state was visited */
  visitCount: number;
  /** Total time spent in this state (ms) */
  totalTimeInState: number;
}

/**
 * Edge for visualization graph
 */
export interface VisualizationEdge<TState extends StateId, TEvent extends EventId> {
  id: string;
  source: TState;
  target: TState;
  event: TEvent;
  description?: string;
  /** Number of times this transition occurred */
  transitionCount: number;
  /** Was this the most recent transition? */
  isRecent: boolean;
}

/**
 * Complete visualization data
 */
export interface VisualizationData<TState extends StateId, TEvent extends EventId> {
  nodes: VisualizationNode<TState>[];
  edges: VisualizationEdge<TState, TEvent>[];
  currentState: TState;
  transitionHistory: {
    from: TState;
    to: TState;
    event: TEvent;
    timestamp: number;
  }[];
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extract state type from a machine definition
 */
export type ExtractState<T> = T extends MachineDefinition<infer S, MachineContext, EventId> ? S : never;

/**
 * Extract context type from a machine definition
 */
export type ExtractContext<T> = T extends MachineDefinition<StateId, infer C, EventId> ? C : never;

/**
 * Extract event type from a machine definition
 */
export type ExtractEvent<T> = T extends MachineDefinition<StateId, MachineContext, infer E> ? E : never;
