/**
 * State Machine Engine Tests
 * Tests the declarative state machine engine core functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMachine,
  defineMachine,
  createMemoryAdapter,
  createPersistedMachine,
} from '@/app/features/state-machine';
import type {
  MachineDefinition,
  MachineContext,
  StateId,
  EventId,
} from '@/app/features/state-machine';

// ============================================================================
// TEST MACHINE DEFINITIONS
// ============================================================================

interface TrafficLightContext extends MachineContext {
  tickCount: number;
  lastTransitionAt: number;
}

type TrafficLightState = 'red' | 'yellow' | 'green';
type TrafficLightEvent = 'TIMER' | 'MANUAL_SWITCH' | 'EMERGENCY';

const trafficLightMachine = defineMachine<
  TrafficLightState,
  TrafficLightContext,
  TrafficLightEvent
>({
  id: 'traffic-light',
  name: 'Traffic Light',
  version: '1.0.0',
  initialState: 'red',
  createInitialContext: () => ({
    tickCount: 0,
    lastTransitionAt: Date.now(),
  }),
  states: {
    red: {
      id: 'red',
      meta: {
        label: 'Stop',
        description: 'Red light - stop',
        icon: '🔴',
        style: {
          text: 'text-red-500',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
        },
      },
      on: {
        TIMER: {
          target: 'green',
          description: 'Timer elapsed, switch to green',
          actions: [
            (ctx) => ({ ...ctx, tickCount: ctx.tickCount + 1 }),
          ],
        },
        EMERGENCY: {
          target: 'red',
          description: 'Emergency - stay red',
        },
      },
    },
    yellow: {
      id: 'yellow',
      meta: {
        label: 'Caution',
        description: 'Yellow light - prepare to stop',
        icon: '🟡',
        style: {
          text: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
        },
      },
      on: {
        TIMER: {
          target: 'red',
          description: 'Timer elapsed, switch to red',
          actions: [
            (ctx) => ({ ...ctx, tickCount: ctx.tickCount + 1 }),
          ],
        },
        EMERGENCY: {
          target: 'red',
          description: 'Emergency - switch to red',
        },
      },
    },
    green: {
      id: 'green',
      meta: {
        label: 'Go',
        description: 'Green light - proceed',
        icon: '🟢',
        style: {
          text: 'text-green-500',
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
        },
      },
      on: {
        TIMER: {
          target: 'yellow',
          description: 'Timer elapsed, switch to yellow',
          actions: [
            (ctx) => ({ ...ctx, tickCount: ctx.tickCount + 1 }),
          ],
        },
        EMERGENCY: {
          target: 'red',
          description: 'Emergency - switch to red',
        },
      },
    },
  },
});

// ============================================================================
// BASIC FUNCTIONALITY TESTS
// ============================================================================

describe('State Machine Core', () => {
  describe('createMachine', () => {
    it('should create a machine with initial state', () => {
      const machine = createMachine(trafficLightMachine);
      expect(machine.getState()).toBe('red');
    });

    it('should create a machine with initial context', () => {
      const machine = createMachine(trafficLightMachine);
      expect(machine.getContext().tickCount).toBe(0);
    });

    it('should provide snapshot with all state data', () => {
      const machine = createMachine(trafficLightMachine);
      const snapshot = machine.getSnapshot();

      expect(snapshot.currentState).toBe('red');
      expect(snapshot.context.tickCount).toBe(0);
      expect(snapshot.history).toEqual([]);
      expect(snapshot.stateEnteredAt).toBeDefined();
    });
  });

  describe('send', () => {
    it('should transition on valid event', () => {
      const machine = createMachine(trafficLightMachine);
      const result = machine.send('TIMER');

      expect(result.transitioned).toBe(true);
      expect(result.previousState).toBe('red');
      expect(result.currentState).toBe('green');
    });

    it('should not transition on invalid event', () => {
      const machine = createMachine(trafficLightMachine);
      const result = machine.send('INVALID_EVENT' as TrafficLightEvent);

      expect(result.transitioned).toBe(false);
      expect(result.currentState).toBe('red');
    });

    it('should execute transition actions', () => {
      const machine = createMachine(trafficLightMachine);

      expect(machine.getContext().tickCount).toBe(0);
      machine.send('TIMER');
      expect(machine.getContext().tickCount).toBe(1);
    });

    it('should record transition in history', () => {
      const machine = createMachine(trafficLightMachine);
      machine.send('TIMER');

      const history = machine.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].fromState).toBe('red');
      expect(history[0].toState).toBe('green');
      expect(history[0].event).toBe('TIMER');
    });
  });

  describe('can', () => {
    it('should return true for valid transitions', () => {
      const machine = createMachine(trafficLightMachine);
      expect(machine.can('TIMER')).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      const machine = createMachine(trafficLightMachine);
      expect(machine.can('INVALID' as TrafficLightEvent)).toBe(false);
    });
  });

  describe('getAvailableTransitions', () => {
    it('should return all available transitions from current state', () => {
      const machine = createMachine(trafficLightMachine);
      const transitions = machine.getAvailableTransitions();

      expect(transitions.length).toBe(2); // TIMER and EMERGENCY
      expect(transitions.map((t) => t.event)).toContain('TIMER');
      expect(transitions.map((t) => t.event)).toContain('EMERGENCY');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const machine = createMachine(trafficLightMachine);

      machine.send('TIMER');
      machine.send('TIMER');
      expect(machine.getState()).toBe('yellow');
      expect(machine.getContext().tickCount).toBe(2);

      machine.reset();

      expect(machine.getState()).toBe('red');
      expect(machine.getContext().tickCount).toBe(0);
      expect(machine.getHistory()).toEqual([]);
    });
  });

  describe('getStateMeta', () => {
    it('should return metadata for current state', () => {
      const machine = createMachine(trafficLightMachine);
      const meta = machine.getStateMeta();

      expect(meta.label).toBe('Stop');
      expect(meta.icon).toBe('🔴');
    });

    it('should return metadata for specified state', () => {
      const machine = createMachine(trafficLightMachine);
      const meta = machine.getStateMeta('green');

      expect(meta.label).toBe('Go');
      expect(meta.icon).toBe('🟢');
    });
  });
});

// ============================================================================
// GUARD TESTS
// ============================================================================

describe('State Machine Guards', () => {
  interface CounterContext extends MachineContext {
    count: number;
    maxCount: number;
  }

  type CounterState = 'idle' | 'counting' | 'maxed';
  type CounterEvent = 'INCREMENT' | 'RESET';

  const counterMachine = defineMachine<CounterState, CounterContext, CounterEvent>({
    id: 'counter',
    name: 'Counter',
    version: '1.0.0',
    initialState: 'idle',
    createInitialContext: () => ({
      count: 0,
      maxCount: 3,
    }),
    states: {
      idle: {
        id: 'idle',
        meta: {
          label: 'Idle',
          description: 'Counter is idle',
          icon: '⏸',
          style: { text: '', bg: '', border: '' },
        },
        on: {
          INCREMENT: {
            target: 'counting',
            actions: [(ctx) => ({ ...ctx, count: ctx.count + 1 })],
          },
        },
      },
      counting: {
        id: 'counting',
        meta: {
          label: 'Counting',
          description: 'Counter is counting',
          icon: '🔢',
          style: { text: '', bg: '', border: '' },
        },
        on: {
          INCREMENT: [
            {
              target: 'maxed',
              guard: (ctx) => ctx.count + 1 >= ctx.maxCount,
              description: 'Reached max count',
              priority: 10,
              actions: [(ctx) => ({ ...ctx, count: ctx.count + 1 })],
            },
            {
              target: 'counting',
              description: 'Keep counting',
              priority: 0,
              actions: [(ctx) => ({ ...ctx, count: ctx.count + 1 })],
            },
          ],
          RESET: {
            target: 'idle',
            actions: [(ctx) => ({ ...ctx, count: 0 })],
          },
        },
      },
      maxed: {
        id: 'maxed',
        meta: {
          label: 'Maxed',
          description: 'Counter is at max',
          icon: '🔝',
          style: { text: '', bg: '', border: '' },
        },
        isFinal: true,
        on: {
          RESET: {
            target: 'idle',
            actions: [(ctx) => ({ ...ctx, count: 0 })],
          },
        },
      },
    },
  });

  it('should evaluate guards and pick correct transition', () => {
    const machine = createMachine(counterMachine);

    // First increment: idle -> counting
    machine.send('INCREMENT');
    expect(machine.getState()).toBe('counting');
    expect(machine.getContext().count).toBe(1);

    // Second increment: counting -> counting (not at max yet)
    machine.send('INCREMENT');
    expect(machine.getState()).toBe('counting');
    expect(machine.getContext().count).toBe(2);

    // Third increment: counting -> maxed (reached max)
    machine.send('INCREMENT');
    expect(machine.getState()).toBe('maxed');
    expect(machine.getContext().count).toBe(3);
  });

  it('should not allow transitions when guard fails', () => {
    const guardedMachine = defineMachine<'a' | 'b', { allowed: boolean }, 'GO'>({
      id: 'guarded',
      name: 'Guarded',
      version: '1.0.0',
      initialState: 'a',
      createInitialContext: () => ({ allowed: false }),
      states: {
        a: {
          id: 'a',
          meta: { label: 'A', description: '', icon: '', style: { text: '', bg: '', border: '' } },
          on: {
            GO: {
              target: 'b',
              guard: (ctx) => ctx.allowed === true,
            },
          },
        },
        b: {
          id: 'b',
          meta: { label: 'B', description: '', icon: '', style: { text: '', bg: '', border: '' } },
        },
      },
    });

    const machine = createMachine(guardedMachine);

    // Guard fails
    expect(machine.send('GO').transitioned).toBe(false);
    expect(machine.getState()).toBe('a');

    // Update context to allow
    machine.updateContext((ctx) => ({ ...ctx, allowed: true }));

    // Guard passes
    expect(machine.send('GO').transitioned).toBe(true);
    expect(machine.getState()).toBe('b');
  });
});

// ============================================================================
// AUTO-TRANSITION TESTS
// ============================================================================

describe('State Machine Auto-Transitions', () => {
  interface ScoreContext extends MachineContext {
    score: number;
  }

  type ScoreState = 'low' | 'medium' | 'high';
  type ScoreEvent = 'SET_SCORE';

  const scoreMachine = defineMachine<ScoreState, ScoreContext, ScoreEvent>({
    id: 'score',
    name: 'Score',
    version: '1.0.0',
    initialState: 'low',
    createInitialContext: () => ({ score: 0 }),
    states: {
      low: {
        id: 'low',
        meta: { label: 'Low', description: '', icon: '', style: { text: '', bg: '', border: '' } },
        always: [
          {
            target: 'high',
            guard: (ctx) => ctx.score >= 80,
            priority: 20,
          },
          {
            target: 'medium',
            guard: (ctx) => ctx.score >= 40,
            priority: 10,
          },
        ],
      },
      medium: {
        id: 'medium',
        meta: { label: 'Medium', description: '', icon: '', style: { text: '', bg: '', border: '' } },
        always: [
          {
            target: 'high',
            guard: (ctx) => ctx.score >= 80,
          },
          {
            target: 'low',
            guard: (ctx) => ctx.score < 40,
          },
        ],
      },
      high: {
        id: 'high',
        meta: { label: 'High', description: '', icon: '', style: { text: '', bg: '', border: '' } },
        always: [
          {
            target: 'medium',
            guard: (ctx) => ctx.score < 80 && ctx.score >= 40,
          },
          {
            target: 'low',
            guard: (ctx) => ctx.score < 40,
          },
        ],
      },
    },
  });

  it('should auto-transition when context changes', () => {
    const machine = createMachine(scoreMachine);
    expect(machine.getState()).toBe('low');

    // Update to medium range
    machine.updateContext((ctx) => ({ ...ctx, score: 50 }));
    expect(machine.getState()).toBe('medium');

    // Update to high range
    machine.updateContext((ctx) => ({ ...ctx, score: 90 }));
    expect(machine.getState()).toBe('high');

    // Update back to low range
    machine.updateContext((ctx) => ({ ...ctx, score: 20 }));
    expect(machine.getState()).toBe('low');
  });

  it('should respect priority in auto-transitions', () => {
    const machine = createMachine(scoreMachine);

    // Set score to 90 - should go to high (higher priority) not medium
    machine.updateContext((ctx) => ({ ...ctx, score: 90 }));
    expect(machine.getState()).toBe('high');
  });
});

// ============================================================================
// SUBSCRIPTION TESTS
// ============================================================================

describe('State Machine Subscriptions', () => {
  it('should notify listeners on state change', () => {
    const machine = createMachine(trafficLightMachine);
    const listener = vi.fn();

    machine.subscribe(listener);
    machine.send('TIMER');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ currentState: 'green' }),
      expect.objectContaining({ fromState: 'red', toState: 'green' })
    );
  });

  it('should allow unsubscribing', () => {
    const machine = createMachine(trafficLightMachine);
    const listener = vi.fn();

    const unsubscribe = machine.subscribe(listener);
    machine.send('TIMER');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    machine.send('TIMER');
    expect(listener).toHaveBeenCalledTimes(1); // Still 1
  });

  it('should notify on context update', () => {
    const machine = createMachine(trafficLightMachine);
    const listener = vi.fn();

    machine.subscribe(listener);
    machine.updateContext((ctx) => ({ ...ctx, tickCount: 100 }));

    expect(listener).toHaveBeenCalled();
  });
});

// ============================================================================
// PERSISTENCE TESTS
// ============================================================================

describe('State Machine Persistence', () => {
  it('should persist and restore state using memory adapter', () => {
    const adapter = createMemoryAdapter<TrafficLightState, TrafficLightContext, TrafficLightEvent>();

    // Create first machine and persist
    const machine1 = createPersistedMachine(trafficLightMachine, {
      adapter,
      instanceId: 'test-1',
    });

    machine1.send('TIMER'); // red -> green
    machine1.send('TIMER'); // green -> yellow
    expect(machine1.getState()).toBe('yellow');

    // Create second machine, should restore from persistence
    const machine2 = createPersistedMachine(trafficLightMachine, {
      adapter,
      instanceId: 'test-1',
    });

    // Wait for debounce
    setTimeout(() => {
      expect(machine2.getState()).toBe('yellow');
    }, 150);
  });

  it('should exclude specified states from persistence', () => {
    const adapter = createMemoryAdapter<TrafficLightState, TrafficLightContext, TrafficLightEvent>();

    const machine = createPersistedMachine(trafficLightMachine, {
      adapter,
      instanceId: 'test-exclude',
      excludeStates: ['yellow'],
    });

    machine.send('TIMER'); // red -> green
    machine.send('TIMER'); // green -> yellow

    // Check what was persisted - should not be yellow
    const stored = adapter.load('traffic-light', 'test-exclude');
    expect(stored?.currentState).not.toBe('yellow');
  });
});

// ============================================================================
// RESTORE TESTS
// ============================================================================

describe('State Machine Restore', () => {
  it('should restore from a snapshot', () => {
    const machine = createMachine(trafficLightMachine);

    // Progress through some states
    machine.send('TIMER');
    machine.send('TIMER');

    // Get snapshot
    const snapshot = machine.getSnapshot();
    expect(snapshot.currentState).toBe('yellow');
    expect(snapshot.context.tickCount).toBe(2);

    // Create new machine and restore
    const machine2 = createMachine(trafficLightMachine);
    machine2.restore(snapshot);

    expect(machine2.getState()).toBe('yellow');
    expect(machine2.getContext().tickCount).toBe(2);
    expect(machine2.getHistory().length).toBe(2);
  });
});

// ============================================================================
// EFFECTS TESTS
// ============================================================================

describe('State Machine Effects', () => {
  it('should execute side effects on transition', () => {
    const effect = vi.fn();

    const machineWithEffects = defineMachine<'a' | 'b', { value: number }, 'GO'>({
      id: 'effects',
      name: 'Effects',
      version: '1.0.0',
      initialState: 'a',
      createInitialContext: () => ({ value: 0 }),
      states: {
        a: {
          id: 'a',
          meta: { label: 'A', description: '', icon: '', style: { text: '', bg: '', border: '' } },
          on: {
            GO: {
              target: 'b',
              effects: [effect],
            },
          },
        },
        b: {
          id: 'b',
          meta: { label: 'B', description: '', icon: '', style: { text: '', bg: '', border: '' } },
        },
      },
    });

    const machine = createMachine(machineWithEffects);
    machine.send('GO');

    expect(effect).toHaveBeenCalledTimes(1);
    expect(effect).toHaveBeenCalledWith(
      expect.objectContaining({ value: 0 }),
      'GO',
      undefined
    );
  });

  it('should execute global onTransition effects', () => {
    const globalEffect = vi.fn();

    const machineWithGlobalEffect = defineMachine<'a' | 'b', MachineContext, 'GO'>({
      id: 'global-effects',
      name: 'Global Effects',
      version: '1.0.0',
      initialState: 'a',
      createInitialContext: () => ({}),
      states: {
        a: {
          id: 'a',
          meta: { label: 'A', description: '', icon: '', style: { text: '', bg: '', border: '' } },
          on: {
            GO: { target: 'b' },
          },
        },
        b: {
          id: 'b',
          meta: { label: 'B', description: '', icon: '', style: { text: '', bg: '', border: '' } },
        },
      },
      onTransition: [globalEffect],
    });

    const machine = createMachine(machineWithGlobalEffect);
    machine.send('GO');

    expect(globalEffect).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// ENTRY/EXIT ACTIONS TESTS
// ============================================================================

describe('State Machine Entry/Exit Actions', () => {
  it('should execute entry actions when entering state', () => {
    const entryAction = vi.fn((ctx) => ctx);

    const machineWithEntry = defineMachine<'a' | 'b', MachineContext, 'GO'>({
      id: 'entry',
      name: 'Entry',
      version: '1.0.0',
      initialState: 'a',
      createInitialContext: () => ({}),
      states: {
        a: {
          id: 'a',
          meta: { label: 'A', description: '', icon: '', style: { text: '', bg: '', border: '' } },
          on: {
            GO: { target: 'b' },
          },
        },
        b: {
          id: 'b',
          meta: { label: 'B', description: '', icon: '', style: { text: '', bg: '', border: '' } },
          onEntry: [entryAction],
        },
      },
    });

    const machine = createMachine(machineWithEntry);
    machine.send('GO');

    expect(entryAction).toHaveBeenCalledTimes(1);
  });

  it('should execute exit actions when leaving state', () => {
    const exitAction = vi.fn((ctx) => ctx);

    const machineWithExit = defineMachine<'a' | 'b', MachineContext, 'GO'>({
      id: 'exit',
      name: 'Exit',
      version: '1.0.0',
      initialState: 'a',
      createInitialContext: () => ({}),
      states: {
        a: {
          id: 'a',
          meta: { label: 'A', description: '', icon: '', style: { text: '', bg: '', border: '' } },
          onExit: [exitAction],
          on: {
            GO: { target: 'b' },
          },
        },
        b: {
          id: 'b',
          meta: { label: 'B', description: '', icon: '', style: { text: '', bg: '', border: '' } },
        },
      },
    });

    const machine = createMachine(machineWithExit);
    machine.send('GO');

    expect(exitAction).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// HISTORY LIMIT TESTS
// ============================================================================

describe('State Machine History Limit', () => {
  it('should limit history to maxHistoryLength', () => {
    const machine = createMachine(trafficLightMachine);

    // Make many transitions
    for (let i = 0; i < 100; i++) {
      machine.send('TIMER');
    }

    const history = machine.getHistory();
    expect(history.length).toBeLessThanOrEqual(50); // Default max
  });
});
