/**
 * Comprehension State Machine - Example Definition
 *
 * Demonstrates how to convert the existing ComprehensionState machine
 * to use the declarative state machine engine.
 *
 * States: confusion → struggling → progressing → breakthrough → mastery
 */

import { defineMachine } from "../createMachine";
import type { MachineDefinition } from "../types";

// ============================================================================
// Types
// ============================================================================

export type ComprehensionState =
  | "confusion"
  | "struggling"
  | "progressing"
  | "breakthrough"
  | "mastery";

export type ComprehensionEvent =
  | "SIGNAL_RECEIVED"
  | "QUIZ_COMPLETED"
  | "PLAYGROUND_SUCCESS"
  | "PLAYGROUND_FAILURE"
  | "SECTION_COMPLETED"
  | "AUTO";

export interface ComprehensionContext {
  [key: string]: unknown;
  recentScore: number;
  olderScore: number;
  scoreDelta: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  signalsInState: number;
  timeInState: number;
  recentQuizAccuracy: number;
  recentPlaygroundSuccess: number;
  repeatedErrors: number;
  backwardNavigations: number;
  totalSignals: number;
}

// ============================================================================
// Transition Messages
// ============================================================================

export interface TransitionMessage {
  title: string;
  message: string;
  encouragement: string;
  celebration: boolean;
}

export const TRANSITION_MESSAGES: Record<string, TransitionMessage> = {
  confusion_to_struggling: {
    title: "Progress!",
    message: "You're starting to find your footing",
    encouragement: "Keep exploring - each attempt teaches something",
    celebration: true,
  },
  struggling_to_confusion: {
    title: "Let's Pause",
    message: "This concept needs more exploration",
    encouragement: "No worries - let's try a different angle",
    celebration: false,
  },
  struggling_to_progressing: {
    title: "Breaking Through!",
    message: "You're starting to get it",
    encouragement: "Your persistence is paying off",
    celebration: true,
  },
  progressing_to_struggling: {
    title: "Challenge Ahead",
    message: "This part takes more practice",
    encouragement: "Every expert was once a beginner",
    celebration: false,
  },
  progressing_to_breakthrough: {
    title: "Breakthrough!",
    message: "Something just clicked!",
    encouragement: "You're on fire - keep the momentum",
    celebration: true,
  },
  breakthrough_to_progressing: {
    title: "Consolidating",
    message: "Building on your breakthrough",
    encouragement: "Solid foundation being built",
    celebration: false,
  },
  breakthrough_to_mastery: {
    title: "Mastery Achieved!",
    message: "You've truly understood this concept",
    encouragement: "Ready for advanced challenges",
    celebration: true,
  },
  mastery_to_progressing: {
    title: "New Territory",
    message: "Exploring new concepts",
    encouragement: "Your mastery of basics will help here",
    celebration: false,
  },
};

// ============================================================================
// Machine Definition
// ============================================================================

export const comprehensionMachine = defineMachine<
  ComprehensionState,
  ComprehensionContext,
  ComprehensionEvent
>({
  id: "comprehension",
  name: "Comprehension Tracker",
  description: "Tracks learner comprehension state based on behavior signals",
  version: "1.0.0",
  initialState: "progressing",

  createInitialContext: () => ({
    recentScore: 50,
    olderScore: 50,
    scoreDelta: 0,
    consecutiveSuccesses: 0,
    consecutiveFailures: 0,
    signalsInState: 0,
    timeInState: 0,
    recentQuizAccuracy: 50,
    recentPlaygroundSuccess: 50,
    repeatedErrors: 0,
    backwardNavigations: 0,
    totalSignals: 0,
  }),

  states: {
    confusion: {
      id: "confusion",
      meta: {
        label: "Finding Footing",
        description: "Taking time to understand the fundamentals",
        icon: "🌊",
        style: {
          text: "text-[var(--forge-info)]",
          bg: "bg-[var(--forge-info)]/10",
          border: "border-[var(--forge-info)]/30",
          gradient: "from-[var(--forge-info)]/20 to-[var(--forge-info)]/20",
        },
      },
      always: [
        {
          target: "progressing",
          description: "Sudden comprehension jump",
          priority: 20,
          guard: (ctx) => ctx.scoreDelta >= 25 && ctx.recentScore >= 45,
        },
        {
          target: "struggling",
          description: "Starting to make progress",
          priority: 10,
          guard: (ctx) => ctx.recentScore >= 30 && ctx.consecutiveFailures < 2,
        },
      ],
    },

    struggling: {
      id: "struggling",
      meta: {
        label: "Building Foundation",
        description: "Working through challenges, learning from mistakes",
        icon: "🔧",
        style: {
          text: "text-[var(--forge-warning)]",
          bg: "bg-[var(--forge-warning)]/10",
          border: "border-[var(--forge-warning)]/30",
          gradient: "from-[var(--forge-warning)]/20 to-[var(--ember)]/20",
        },
      },
      always: [
        {
          target: "breakthrough",
          description: "Sudden breakthrough!",
          priority: 30,
          guard: (ctx) => ctx.scoreDelta >= 30 && ctx.recentScore >= 60,
        },
        {
          target: "progressing",
          description: "Starting to progress",
          priority: 20,
          guard: (ctx) => ctx.recentScore >= 45 && ctx.scoreDelta >= 5,
        },
        {
          target: "confusion",
          description: "Falling back to confusion",
          priority: 10,
          guard: (ctx) => ctx.consecutiveFailures >= 3 || ctx.recentScore < 20,
        },
      ],
    },

    progressing: {
      id: "progressing",
      meta: {
        label: "Growing Skills",
        description: "Making steady progress, concepts are clicking",
        icon: "🌱",
        style: {
          text: "text-[var(--forge-success)]",
          bg: "bg-[var(--forge-success)]/10",
          border: "border-[var(--forge-success)]/30",
          gradient: "from-[var(--forge-success)]/20 to-[var(--forge-success)]/20",
        },
      },
      always: [
        {
          target: "breakthrough",
          description: "Breakthrough moment!",
          priority: 20,
          guard: (ctx) =>
            (ctx.scoreDelta >= 20 && ctx.recentScore >= 70) ||
            (ctx.consecutiveSuccesses >= 4 && ctx.recentScore >= 65),
        },
        {
          target: "struggling",
          description: "Hitting a wall",
          priority: 10,
          guard: (ctx) =>
            ctx.scoreDelta <= -15 ||
            (ctx.recentScore < 40 && ctx.consecutiveFailures >= 2),
        },
      ],
    },

    breakthrough: {
      id: "breakthrough",
      meta: {
        label: "Breakthrough!",
        description: "Concepts just clicked - building momentum!",
        icon: "💡",
        style: {
          text: "text-[var(--gold)]",
          bg: "bg-[var(--gold)]/10",
          border: "border-[var(--gold)]/30",
          gradient: "from-[var(--gold)]/20 to-[var(--ember)]/20",
        },
      },
      always: [
        {
          target: "mastery",
          description: "Achieving mastery!",
          priority: 20,
          guard: (ctx) =>
            ctx.recentScore >= 85 &&
            ctx.signalsInState >= 3 &&
            ctx.consecutiveSuccesses >= 3,
        },
        {
          target: "progressing",
          description: "Stabilizing after breakthrough",
          priority: 10,
          guard: (ctx) =>
            ctx.signalsInState >= 5 && ctx.scoreDelta < 5 && ctx.recentScore < 80,
        },
      ],
    },

    mastery: {
      id: "mastery",
      meta: {
        label: "Mastery",
        description: "Deep understanding achieved - ready for challenges",
        icon: "🚀",
        style: {
          text: "text-[var(--ember-glow)]",
          bg: "bg-[var(--ember-glow)]/10",
          border: "border-[var(--ember-glow)]/30",
          gradient: "from-[var(--ember-glow)]/20 to-[var(--ember)]/20",
        },
      },
      isFinal: false,
      always: [
        {
          target: "progressing",
          description: "Revisiting fundamentals",
          priority: 10,
          guard: (ctx) => ctx.recentScore < 70 || ctx.consecutiveFailures >= 2,
        },
      ],
    },
  },

  onTransition: [
    (context, event, payload) => {
      // Log transition for analytics
      console.log("[Comprehension] Transition triggered:", event, payload);
    },
  ],
});

// ============================================================================
// Helper: Get transition message
// ============================================================================

export function getTransitionMessage(
  fromState: ComprehensionState,
  toState: ComprehensionState
): TransitionMessage | null {
  const key = `${fromState}_to_${toState}`;
  return TRANSITION_MESSAGES[key] ?? null;
}

// ============================================================================
// Helper: Calculate progress to next state
// ============================================================================

export function getProgressToNextState(
  currentState: ComprehensionState,
  context: ComprehensionContext
): { progress: number; nextState: ComprehensionState; requirements: string[] } {
  const requirements: string[] = [];
  let progress = 0;

  switch (currentState) {
    case "confusion":
      progress = Math.min(100, (context.recentScore / 30) * 100);
      if (context.recentScore < 30) {
        requirements.push("Improve score to 30+");
      }
      if (context.consecutiveFailures >= 2) {
        requirements.push("Get 2 correct in a row");
      }
      return { progress, nextState: "struggling", requirements };

    case "struggling":
      progress = Math.min(100, ((context.recentScore - 25) / 20) * 100);
      if (context.recentScore < 45) {
        requirements.push("Reach score of 45+");
      }
      if (context.scoreDelta < 5) {
        requirements.push("Show improving trend");
      }
      return { progress, nextState: "progressing", requirements };

    case "progressing":
      progress = Math.min(100, ((context.recentScore - 45) / 25) * 100);
      if (context.recentScore < 70) {
        requirements.push("Reach score of 70+");
      }
      if (context.consecutiveSuccesses < 4) {
        requirements.push(`Get ${4 - context.consecutiveSuccesses} more correct`);
      }
      return { progress, nextState: "breakthrough", requirements };

    case "breakthrough":
      progress = Math.min(100, ((context.recentScore - 70) / 15) * 100);
      if (context.recentScore < 85) {
        requirements.push("Reach score of 85+");
      }
      if (context.consecutiveSuccesses < 3) {
        requirements.push(`Maintain streak of ${3 - context.consecutiveSuccesses} more`);
      }
      return { progress, nextState: "mastery", requirements };

    case "mastery":
      return { progress: 100, nextState: "mastery", requirements: ["You've achieved mastery!"] };
  }
}
