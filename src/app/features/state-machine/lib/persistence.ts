/**
 * Persistence Middleware for State Machines
 *
 * Provides localStorage and custom storage adapters for
 * persisting machine state across sessions.
 */

import type {
  StateId,
  EventId,
  MachineContext,
  MachineState,
  MachineInstance,
  StorageAdapter,
  PersistenceOptions,
} from "./types";

// ============================================================================
// Local Storage Adapter
// ============================================================================

/**
 * Create a localStorage-based storage adapter
 */
export function createLocalStorageAdapter<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>(options?: {
  /** Key prefix for storage */
  prefix?: string;
  /** Time-to-live in milliseconds (default: no expiry) */
  ttlMs?: number;
}): StorageAdapter<TState, TContext, TEvent> {
  const prefix = options?.prefix ?? "state-machine";
  const ttlMs = options?.ttlMs;

  function getKey(machineId: string, instanceId: string): string {
    return `${prefix}:${machineId}:${instanceId}`;
  }

  return {
    load(machineId: string, instanceId: string): MachineState<TState, TContext, TEvent> | null {
      if (typeof window === "undefined") return null;

      try {
        const key = getKey(machineId, instanceId);
        const stored = localStorage.getItem(key);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as {
          state: MachineState<TState, TContext, TEvent>;
          savedAt: number;
        };

        // Check TTL
        if (ttlMs && Date.now() - parsed.savedAt > ttlMs) {
          localStorage.removeItem(key);
          return null;
        }

        return parsed.state;
      } catch (e) {
        console.error("[StateMachine] Failed to load persisted state:", e);
        return null;
      }
    },

    save(machineId: string, instanceId: string, state: MachineState<TState, TContext, TEvent>): void {
      if (typeof window === "undefined") return;

      try {
        const key = getKey(machineId, instanceId);
        const toStore = {
          state,
          savedAt: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(toStore));
      } catch (e) {
        console.error("[StateMachine] Failed to persist state:", e);
      }
    },

    remove(machineId: string, instanceId: string): void {
      if (typeof window === "undefined") return;

      try {
        const key = getKey(machineId, instanceId);
        localStorage.removeItem(key);
      } catch (e) {
        console.error("[StateMachine] Failed to remove persisted state:", e);
      }
    },
  };
}

// ============================================================================
// Persistence Wrapper
// ============================================================================

/**
 * Wrap a machine instance with persistence middleware
 */
export function withPersistence<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>(
  machine: MachineInstance<TState, TContext, TEvent>,
  machineId: string,
  options: PersistenceOptions<TState, TContext, TEvent>
): MachineInstance<TState, TContext, TEvent> {
  const {
    adapter,
    instanceId = "default",
    debounceMs = 100,
    excludeStates = [],
  } = options;

  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Save current state to storage (debounced)
   */
  function saveState(): void {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
      const snapshot = machine.getSnapshot();

      // Don't persist excluded states
      if (excludeStates.includes(snapshot.currentState)) {
        return;
      }

      adapter.save(machineId, instanceId, snapshot);
    }, debounceMs);
  }

  // Subscribe to changes and auto-save
  machine.subscribe(() => {
    saveState();
  });

  // Try to restore from storage on init
  const stored = adapter.load(machineId, instanceId);
  if (stored && !excludeStates.includes(stored.currentState)) {
    machine.restore(stored);
  }

  // Wrap send to track persistence
  const originalSend = machine.send.bind(machine);
  const originalUpdateContext = machine.updateContext.bind(machine);
  const originalReset = machine.reset.bind(machine);

  return {
    ...machine,

    send(event: TEvent, payload?: unknown) {
      const result = originalSend(event, payload);
      // Save happens via subscription
      return result;
    },

    updateContext(updater: (ctx: TContext) => TContext) {
      const result = originalUpdateContext(updater);
      // Save happens via subscription
      return result;
    },

    reset() {
      originalReset();
      // Clear persisted state on reset
      adapter.remove(machineId, instanceId);
    },

    /** Additional method to clear persistence without reset */
    clearPersistence(): void {
      adapter.remove(machineId, instanceId);
    },
  } as MachineInstance<TState, TContext, TEvent> & { clearPersistence: () => void };
}

// ============================================================================
// Helper: Load or Create Machine
// ============================================================================

import { createMachine } from "./createMachine";
import type { MachineDefinition } from "./types";

/**
 * Create a machine with persistence support
 * Will restore from storage if available
 */
export function createPersistedMachine<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>(
  definition: MachineDefinition<TState, TContext, TEvent>,
  options: PersistenceOptions<TState, TContext, TEvent> & {
    instanceId?: string;
  }
): MachineInstance<TState, TContext, TEvent> & { clearPersistence: () => void } {
  const {
    adapter,
    instanceId = "default",
    excludeStates = [],
  } = options;

  // Try to load existing state
  const stored = adapter.load(definition.id, instanceId);
  const shouldRestore = stored && !excludeStates.includes(stored.currentState);

  // Create machine with optional initial snapshot
  const machine = createMachine(definition, shouldRestore ? stored : undefined);

  // Wrap with persistence
  return withPersistence(machine, definition.id, options) as MachineInstance<TState, TContext, TEvent> & {
    clearPersistence: () => void;
  };
}

// ============================================================================
// Session Storage Adapter
// ============================================================================

/**
 * Create a sessionStorage-based storage adapter
 * State is cleared when browser/tab is closed
 */
export function createSessionStorageAdapter<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>(options?: {
  prefix?: string;
}): StorageAdapter<TState, TContext, TEvent> {
  const prefix = options?.prefix ?? "state-machine";

  function getKey(machineId: string, instanceId: string): string {
    return `${prefix}:${machineId}:${instanceId}`;
  }

  return {
    load(machineId: string, instanceId: string): MachineState<TState, TContext, TEvent> | null {
      if (typeof window === "undefined") return null;

      try {
        const key = getKey(machineId, instanceId);
        const stored = sessionStorage.getItem(key);
        if (!stored) return null;

        return JSON.parse(stored) as MachineState<TState, TContext, TEvent>;
      } catch (e) {
        console.error("[StateMachine] Failed to load from session:", e);
        return null;
      }
    },

    save(machineId: string, instanceId: string, state: MachineState<TState, TContext, TEvent>): void {
      if (typeof window === "undefined") return;

      try {
        const key = getKey(machineId, instanceId);
        sessionStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        console.error("[StateMachine] Failed to save to session:", e);
      }
    },

    remove(machineId: string, instanceId: string): void {
      if (typeof window === "undefined") return;

      try {
        const key = getKey(machineId, instanceId);
        sessionStorage.removeItem(key);
      } catch (e) {
        console.error("[StateMachine] Failed to remove from session:", e);
      }
    },
  };
}

// ============================================================================
// Memory Adapter (for testing)
// ============================================================================

/**
 * Create an in-memory storage adapter
 * Useful for testing or when persistence should be temporary
 */
export function createMemoryAdapter<
  TState extends StateId,
  TContext extends MachineContext,
  TEvent extends EventId
>(): StorageAdapter<TState, TContext, TEvent> & {
  getAll(): Map<string, MachineState<TState, TContext, TEvent>>;
  clear(): void;
} {
  const store = new Map<string, MachineState<TState, TContext, TEvent>>();

  function getKey(machineId: string, instanceId: string): string {
    return `${machineId}:${instanceId}`;
  }

  return {
    load(machineId: string, instanceId: string) {
      return store.get(getKey(machineId, instanceId)) ?? null;
    },

    save(machineId: string, instanceId: string, state: MachineState<TState, TContext, TEvent>) {
      store.set(getKey(machineId, instanceId), state);
    },

    remove(machineId: string, instanceId: string) {
      store.delete(getKey(machineId, instanceId));
    },

    getAll() {
      return store;
    },

    clear() {
      store.clear();
    },
  };
}
