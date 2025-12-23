/**
 * Goal Path Configuration
 *
 * Shared configuration, types, and constants for the Goal Path component.
 * Now consolidated to use Career Oracle as the single unified experience.
 */

import {
    createVariantConfig,
    createMode,
} from "@/app/shared/lib/variantMachine";
import type { GoalFormState } from "@/app/shared/lib/learnerProfile";

// ============================================================================
// Mode Configuration
// ============================================================================

export type GoalPathMode = "career-oracle";

export const goalPathConfig = createVariantConfig<GoalPathMode>({
    id: "goal-path",
    name: "Goal Generation",
    modes: [
        createMode("career-oracle", "Career Oracle", "AI-powered career path analysis with market intelligence"),
    ],
    defaultMode: "career-oracle",
});

// ============================================================================
// Shared Data
// ============================================================================

export const defaultFormState: GoalFormState = {
    goal: "Become a Full Stack Developer",
    timeCommitment: 15,
    deadline: 6,
    focus: ["frontend", "backend"],
};

export const goalOptions = [
    "Get a new job",
    "Upskill current role",
    "Build a side project",
    "Start freelancing",
];

export const learningStyles = [
    { label: "Video Based", icon: "📹" },
    { label: "Text Based", icon: "📖" },
    { label: "Project Based", icon: "🔨" },
    { label: "Interactive", icon: "🎮" },
];

export const contextHelp: Record<number, string> = {
    1: "Define the north star of your learning journey. Be specific!",
    2: "We'll adapt the content format to match how you learn best.",
    3: "This helps us estimate a realistic timeline for you.",
};

// ============================================================================
// Wizard Helpers
// ============================================================================

/**
 * Determine initial wizard step from form state
 */
export function getInitialWizardStep(formState: GoalFormState): number {
    if (formState.goal && formState.goal !== defaultFormState.goal) {
        if (formState.learningStyle) {
            if (formState.timeCommitment !== defaultFormState.timeCommitment) {
                return 4; // All done
            }
            return 3; // Time commitment pending
        }
        return 2; // Learning style pending
    }
    return 1; // Starting from goal
}

/**
 * Parse time commitment from wizard slider selection
 */
export function parseWizardTimeCommitment(selection: string): number {
    const match = selection.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 10;
}

// Re-export GoalFormState for convenience
export type { GoalFormState } from "@/app/shared/lib/learnerProfile";
