/**
 * Oracle Stepper State Machine - Example Definition
 *
 * Demonstrates how to convert the existing OracleStepper machine
 * to use the declarative state machine engine.
 *
 * Steps: experience → branch_1 → branch_2 → branch_3 → commitment → free_input → generating → results
 */

import { defineMachine } from "../createMachine";

// ============================================================================
// Types
// ============================================================================

export type OracleStepperState =
  | "experience"
  | "branch_1"
  | "branch_2"
  | "branch_3"
  | "commitment"
  | "free_input"
  | "generating"
  | "results";

export type OracleStepperEvent =
  | "NEXT"
  | "BACK"
  | "GENERATE"
  | "GENERATION_SUCCESS"
  | "GENERATION_ERROR"
  | "SELECT_PATH"
  | "RESET";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface OraclePath {
  id: string;
  name: string;
  description: string;
  nodes: unknown[];
  estimatedDuration: string;
}

export interface OracleStepperContext {
  [key: string]: unknown;
  domain: string | null;
  experience: ExperienceLevel | null;
  branchAnswers: Record<string, string | string[]>;
  commitment: string | null;
  freeInput: string;
  paths: OraclePath[];
  selectedPathId: string | null;
  error: string | null;
  isLoading: boolean;
}

// ============================================================================
// Step Configuration
// ============================================================================

export const STEP_CONFIG: Record<
  OracleStepperState,
  {
    index: number;
    label: string;
    labelByExperience?: Record<ExperienceLevel, string>;
    icon: string;
    description: string;
  }
> = {
  experience: {
    index: 0,
    label: "Your Experience",
    icon: "🎯",
    description: "Tell us about your background",
  },
  branch_1: {
    index: 1,
    label: "Tell Us More",
    labelByExperience: {
      beginner: "Your Journey",
      intermediate: "Breaking Through",
      advanced: "Your Expertise",
    },
    icon: "🔀",
    description: "Help us understand your goals",
  },
  branch_2: {
    index: 2,
    label: "Tell Us More",
    labelByExperience: {
      beginner: "Your Journey",
      intermediate: "Breaking Through",
      advanced: "Your Expertise",
    },
    icon: "🔀",
    description: "Refining your path",
  },
  branch_3: {
    index: 3,
    label: "Tell Us More",
    labelByExperience: {
      beginner: "Your Journey",
      intermediate: "Breaking Through",
      advanced: "Your Expertise",
    },
    icon: "🔀",
    description: "Almost there",
  },
  commitment: {
    index: 4,
    label: "Your Commitment",
    icon: "⏰",
    description: "How much time can you dedicate?",
  },
  free_input: {
    index: 5,
    label: "Final Thoughts",
    icon: "💭",
    description: "Any additional context you want to share",
  },
  generating: {
    index: 6,
    label: "Crafting Your Path",
    icon: "✨",
    description: "The Oracle is generating your personalized learning path",
  },
  results: {
    index: 7,
    label: "Your Learning Paths",
    icon: "🗺️",
    description: "Here are your personalized paths",
  },
};

// ============================================================================
// Guards
// ============================================================================

function hasExperience(ctx: OracleStepperContext): boolean {
  return ctx.experience !== null;
}

function hasBranchAnswer(questionIndex: number) {
  return (ctx: OracleStepperContext): boolean => {
    // Get the question ID for this branch
    const questionIds = Object.keys(ctx.branchAnswers);
    return questionIds.length > questionIndex;
  };
}

function hasCommitment(ctx: OracleStepperContext): boolean {
  return ctx.commitment !== null;
}

function hasRequiredFields(ctx: OracleStepperContext): boolean {
  return ctx.domain !== null && ctx.experience !== null && ctx.commitment !== null;
}

// ============================================================================
// Actions
// ============================================================================

function setError(message: string): (ctx: OracleStepperContext) => OracleStepperContext {
  return (ctx) => ({
    ...ctx,
    error: message,
    isLoading: false,
  });
}

function clearError(ctx: OracleStepperContext): OracleStepperContext {
  return {
    ...ctx,
    error: null,
  };
}

function startLoading(ctx: OracleStepperContext): OracleStepperContext {
  return {
    ...ctx,
    isLoading: true,
    error: null,
  };
}

function stopLoading(ctx: OracleStepperContext): OracleStepperContext {
  return {
    ...ctx,
    isLoading: false,
  };
}

function setPaths(ctx: OracleStepperContext, _event: unknown, payload?: unknown): OracleStepperContext {
  const { paths } = payload as { paths: OraclePath[] };
  return {
    ...ctx,
    paths,
    isLoading: false,
  };
}

function selectPath(ctx: OracleStepperContext, _event: unknown, payload?: unknown): OracleStepperContext {
  const { pathId } = payload as { pathId: string };
  return {
    ...ctx,
    selectedPathId: pathId,
  };
}

function resetContext(_ctx: OracleStepperContext): OracleStepperContext {
  return {
    domain: null,
    experience: null,
    branchAnswers: {},
    commitment: null,
    freeInput: "",
    paths: [],
    selectedPathId: null,
    error: null,
    isLoading: false,
  };
}

// ============================================================================
// Machine Definition
// ============================================================================

export const oracleStepperMachine = defineMachine<
  OracleStepperState,
  OracleStepperContext,
  OracleStepperEvent
>({
  id: "oracle-stepper",
  name: "Learning Oracle",
  description: "Multi-step wizard for generating personalized learning paths",
  version: "1.0.0",
  initialState: "experience",

  createInitialContext: () => ({
    domain: null,
    experience: null,
    branchAnswers: {},
    commitment: null,
    freeInput: "",
    paths: [],
    selectedPathId: null,
    error: null,
    isLoading: false,
  }),

  states: {
    experience: {
      id: "experience",
      meta: {
        label: STEP_CONFIG.experience.label,
        description: STEP_CONFIG.experience.description,
        icon: STEP_CONFIG.experience.icon,
        style: {
          text: "text-[var(--ember)]",
          bg: "bg-[var(--ember)]/10",
          border: "border-[var(--ember)]/30",
        },
      },
      on: {
        NEXT: {
          target: "branch_1",
          guard: hasExperience,
          description: "Continue to first branch question",
          actions: [clearError],
        },
      },
    },

    branch_1: {
      id: "branch_1",
      meta: {
        label: STEP_CONFIG.branch_1.label,
        description: STEP_CONFIG.branch_1.description,
        icon: STEP_CONFIG.branch_1.icon,
        style: {
          text: "text-[var(--forge-info)]",
          bg: "bg-[var(--forge-info)]/10",
          border: "border-[var(--forge-info)]/30",
        },
      },
      on: {
        NEXT: {
          target: "branch_2",
          guard: hasBranchAnswer(0),
          description: "Continue to second branch question",
          actions: [clearError],
        },
        BACK: {
          target: "experience",
          description: "Go back to experience",
          actions: [clearError],
        },
      },
    },

    branch_2: {
      id: "branch_2",
      meta: {
        label: STEP_CONFIG.branch_2.label,
        description: STEP_CONFIG.branch_2.description,
        icon: STEP_CONFIG.branch_2.icon,
        style: {
          text: "text-[var(--forge-info)]",
          bg: "bg-[var(--forge-info)]/10",
          border: "border-[var(--forge-info)]/30",
        },
      },
      on: {
        NEXT: {
          target: "branch_3",
          guard: hasBranchAnswer(1),
          description: "Continue to third branch question",
          actions: [clearError],
        },
        BACK: {
          target: "branch_1",
          description: "Go back to first branch",
          actions: [clearError],
        },
      },
    },

    branch_3: {
      id: "branch_3",
      meta: {
        label: STEP_CONFIG.branch_3.label,
        description: STEP_CONFIG.branch_3.description,
        icon: STEP_CONFIG.branch_3.icon,
        style: {
          text: "text-[var(--forge-info)]",
          bg: "bg-[var(--forge-info)]/10",
          border: "border-[var(--forge-info)]/30",
        },
      },
      on: {
        NEXT: {
          target: "commitment",
          guard: hasBranchAnswer(2),
          description: "Continue to commitment",
          actions: [clearError],
        },
        BACK: {
          target: "branch_2",
          description: "Go back to second branch",
          actions: [clearError],
        },
      },
    },

    commitment: {
      id: "commitment",
      meta: {
        label: STEP_CONFIG.commitment.label,
        description: STEP_CONFIG.commitment.description,
        icon: STEP_CONFIG.commitment.icon,
        style: {
          text: "text-[var(--gold)]",
          bg: "bg-[var(--gold)]/10",
          border: "border-[var(--gold)]/30",
        },
      },
      on: {
        NEXT: {
          target: "free_input",
          guard: hasCommitment,
          description: "Continue to free input",
          actions: [clearError],
        },
        BACK: {
          target: "branch_3",
          description: "Go back to third branch",
          actions: [clearError],
        },
      },
    },

    free_input: {
      id: "free_input",
      meta: {
        label: STEP_CONFIG.free_input.label,
        description: STEP_CONFIG.free_input.description,
        icon: STEP_CONFIG.free_input.icon,
        style: {
          text: "text-[var(--forge-text-primary)]",
          bg: "bg-[var(--forge-bg-elevated)]",
          border: "border-[var(--forge-border)]",
        },
      },
      on: {
        GENERATE: {
          target: "generating",
          guard: hasRequiredFields,
          description: "Start path generation",
          actions: [startLoading],
        },
        BACK: {
          target: "commitment",
          description: "Go back to commitment",
          actions: [clearError],
        },
      },
    },

    generating: {
      id: "generating",
      meta: {
        label: STEP_CONFIG.generating.label,
        description: STEP_CONFIG.generating.description,
        icon: STEP_CONFIG.generating.icon,
        style: {
          text: "text-[var(--ember-glow)]",
          bg: "bg-[var(--ember-glow)]/10",
          border: "border-[var(--ember-glow)]/30",
        },
      },
      on: {
        GENERATION_SUCCESS: {
          target: "results",
          description: "Generation completed successfully",
          actions: [setPaths, stopLoading],
        },
        GENERATION_ERROR: {
          target: "free_input",
          description: "Generation failed, go back to input",
          actions: [
            stopLoading,
            (ctx, _event, payload) => {
              const { error } = payload as { error: string };
              return { ...ctx, error };
            },
          ],
        },
      },
    },

    results: {
      id: "results",
      meta: {
        label: STEP_CONFIG.results.label,
        description: STEP_CONFIG.results.description,
        icon: STEP_CONFIG.results.icon,
        style: {
          text: "text-[var(--forge-success)]",
          bg: "bg-[var(--forge-success)]/10",
          border: "border-[var(--forge-success)]/30",
        },
      },
      on: {
        SELECT_PATH: {
          target: "results",
          description: "Select a learning path",
          actions: [selectPath],
        },
        RESET: {
          target: "experience",
          description: "Start over",
          actions: [resetContext],
        },
      },
    },
  },
});

// ============================================================================
// Helpers
// ============================================================================

export function getStepLabel(
  step: OracleStepperState,
  experience?: ExperienceLevel
): string {
  const config = STEP_CONFIG[step];
  if (config.labelByExperience && experience) {
    return config.labelByExperience[experience] ?? config.label;
  }
  return config.label;
}

export function getStepIndex(step: OracleStepperState): number {
  return STEP_CONFIG[step].index;
}

export function getTotalInputSteps(): number {
  // experience, 3 branch questions, commitment, free_input = 6 input steps
  return 6;
}

export function isInputStep(step: OracleStepperState): boolean {
  return step !== "generating" && step !== "results";
}

export function canNavigateBack(step: OracleStepperState): boolean {
  return step !== "experience" && step !== "generating" && step !== "results";
}
