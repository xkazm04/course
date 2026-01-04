// Types
export type {
  StateId,
  EventId,
  TransitionId,
  MachineContext,
  GuardFn,
  ActionFn,
  EffectFn,
  StateStyle,
  StateMetadata,
  TransitionDefinition,
  StateDefinition,
  MachineDefinition,
  TransitionEvent,
  MachineState,
  SendResult,
  MachineInstance,
  MachineListener,
  StorageAdapter,
  PersistenceOptions,
  VisualizationNode,
  VisualizationEdge,
  VisualizationData,
  ExtractState,
  ExtractContext,
  ExtractEvent,
} from "./types";

// Core
export { createMachine, defineMachine } from "./createMachine";

// Persistence
export {
  createLocalStorageAdapter,
  createSessionStorageAdapter,
  createMemoryAdapter,
  createPersistedMachine,
  withPersistence,
} from "./persistence";

// Visualization
export {
  generateVisualization,
  getTransitionTimeline,
  calculateProgressMetrics,
  generateDotGraph,
} from "./visualization";

// React Hooks
export {
  useMachine,
  useMachineVisualization,
  useMachineState,
  useMachineMatches,
  useMachineContext,
  useMachineSelector,
} from "./useMachine";
export type { UseMachineOptions, UseMachineReturn, UseMachineVisualizationReturn } from "./useMachine";

// Example Machines
export * as examples from "./examples";
