import { useMemo } from "react";
import type { CurriculumAdjustment } from "./frictionSkillAssessment";
import type {
    LearnerProfile,
    GoalFormState,
} from "@/app/shared/lib/learnerProfile";
import {
    profileToGoalFormState,
    goalFormStateToProfile,
} from "@/app/shared/lib/learnerProfile";

// Re-export GoalFormState and conversion utilities for backward compatibility
export type { GoalFormState } from "@/app/shared/lib/learnerProfile";
export { goalFormStateToProfile, profileToGoalFormState } from "@/app/shared/lib/learnerProfile";

/**
 * Friction-based adjustment options for path calculation
 */
export interface FrictionAdjustment {
    /** Curriculum adjustment derived from friction signals */
    curriculumAdjustment?: CurriculumAdjustment;
    /** Reinforcement topics to include */
    reinforcementTopics?: string[];
}

/**
 * Computed metrics returned by the usePathCalculator hook.
 */
export interface PathMetrics {
    /** Total hours available across the entire learning period */
    totalHours: number;
    /** Number of learning modules */
    modules: number;
    /** Number of individual topics (derived from modules) */
    topics: number;
    /** Estimated number of lessons (derived from modules) */
    lessons: number;
    /** Number of hands-on projects */
    projects: number;
    /** Estimated weeks to complete */
    estimatedWeeks: number;
    /** Hours allocated per focus area */
    hoursPerFocusArea: number;
    /** Whether user is likely job-ready within timeline */
    isJobReady: boolean;
    /** Estimated skill level at completion */
    skillLevel: "Beginner" | "Proficient" | "Expert";

    // Friction-adjusted fields
    /** Number of foundational modules added based on friction signals */
    foundationalModules: number;
    /** Number of extra practice modules based on friction signals */
    practiceModules: number;
    /** Topics recommended for reinforcement */
    reinforcementTopics: string[];
    /** Content density recommendation */
    contentDensity: "sparse" | "normal" | "dense";
    /** Pace modifier applied (1.0 = normal) */
    paceModifier: number;
    /** Whether friction-based adjustments were applied */
    hasFrictionAdjustments: boolean;
}

/**
 * Configuration options for path calculation
 */
export interface PathCalculatorOptions {
    /** Weeks per month for calculations (default: 4) */
    weeksPerMonth?: number;
    /** Hours per module (default: 20) */
    hoursPerModule?: number;
    /** Topics per module (default: 5) */
    topicsPerModule?: number;
    /** Lessons per module (default: 4) */
    lessonsPerModule?: number;
    /** Modules per project (default: 2) */
    modulesPerProject?: number;
}

const DEFAULT_OPTIONS: Required<PathCalculatorOptions> = {
    weeksPerMonth: 4,
    hoursPerModule: 20,
    topicsPerModule: 5,
    lessonsPerModule: 4,
    modulesPerProject: 2,
};

/**
 * Hook for calculating learning path metrics from goal form state.
 *
 * Centralizes the curriculum generation logic to ensure consistent results
 * across all goal path modes (LiveFormMode, WizardMode, AIChatMode).
 *
 * Now includes friction-based adjustments that modify curriculum based on
 * implicit skill assessments derived from user behavior (back navigation,
 * inactivity, rapid clicks, etc.).
 *
 * @param formState - The current goal form state with user inputs
 * @param options - Optional configuration for calculation parameters
 * @param frictionAdjustment - Optional friction-derived curriculum adjustments
 * @returns Computed path metrics including hours, modules, topics, etc.
 *
 * @example
 * ```tsx
 * const { totalHours, modules, topics, reinforcementTopics } = usePathCalculator(
 *   {
 *     goal: "Become a Full Stack Developer",
 *     timeCommitment: 15,
 *     deadline: 6,
 *     focus: ["frontend", "backend"],
 *   },
 *   {},
 *   { curriculumAdjustment: skillAssessment.curriculumAdjustment }
 * );
 * ```
 */
export function usePathCalculator(
    formState: GoalFormState,
    options: PathCalculatorOptions = {},
    frictionAdjustment?: FrictionAdjustment
): PathMetrics {
    return useMemo(
        () => calculatePathMetrics(formState, options, frictionAdjustment),
        [formState, options, frictionAdjustment]
    );
}

/**
 * Pure function version of path calculation for use outside of React components.
 * Useful for server-side calculations or testing.
 *
 * Includes friction-based adjustments when provided.
 */
export function calculatePathMetrics(
    formState: GoalFormState,
    options: PathCalculatorOptions = {},
    frictionAdjustment?: FrictionAdjustment
): PathMetrics {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const { timeCommitment, deadline, focus } = formState;
    const adjustment = frictionAdjustment?.curriculumAdjustment;

    // Get pace modifier from friction signals
    const paceModifier = adjustment?.paceModifier ?? 1.0;

    const totalWeeks = deadline * config.weeksPerMonth;
    const totalHours = timeCommitment * totalWeeks;

    // Base modules calculation
    const baseModules = Math.max(1, Math.floor(totalHours / config.hoursPerModule));

    // Friction-based adjustments
    const foundationalModules = adjustment?.addFoundationalContent ? 2 : 0;
    const practiceModules = adjustment?.extraPracticeModules ?? 0;

    const adjustedModules = baseModules + foundationalModules + practiceModules;

    // Apply pace modifier
    const effectiveHoursPerModule = config.hoursPerModule * (2 - paceModifier);
    const paceAdjustedModules = Math.max(
        1,
        Math.floor(totalHours / effectiveHoursPerModule)
    );

    const modules = paceModifier < 1.0
        ? Math.min(adjustedModules, paceAdjustedModules)
        : adjustedModules;

    const topics = modules * config.topicsPerModule;
    const lessons = modules * config.lessonsPerModule;
    const projects = Math.max(1, Math.floor(modules / config.modulesPerProject));

    const baseWeeks = Math.max(config.weeksPerMonth, totalWeeks);
    const estimatedWeeks = Math.ceil(baseWeeks / paceModifier);

    const focusCount = focus.length || 1;
    const hoursPerFocusArea = Math.floor(totalHours / focusCount);

    const adjustedDeadline = deadline / paceModifier;
    const isJobReady = adjustedDeadline <= 6;

    let skillLevel: PathMetrics["skillLevel"] = "Proficient";
    if (timeCommitment >= 20 && paceModifier >= 1.0) {
        skillLevel = "Expert";
    } else if (timeCommitment < 10 || paceModifier < 0.8) {
        skillLevel = "Beginner";
    }

    const reinforcementTopics = [
        ...(adjustment?.reinforcementTopics ?? []),
        ...(frictionAdjustment?.reinforcementTopics ?? []),
    ];

    const contentDensity = adjustment?.contentDensity ?? "normal";

    return {
        totalHours,
        modules,
        topics,
        lessons,
        projects,
        estimatedWeeks,
        hoursPerFocusArea,
        isJobReady,
        skillLevel,
        foundationalModules,
        practiceModules,
        reinforcementTopics: Array.from(new Set(reinforcementTopics)),
        contentDensity,
        paceModifier,
        hasFrictionAdjustments: Boolean(adjustment),
    };
}

// ============================================================================
// LEARNER PROFILE BASED VERSIONS
// ============================================================================

/**
 * Hook for calculating learning path metrics from a LearnerProfile.
 *
 * This is the preferred API that uses the unified LearnerProfile type.
 * Use this instead of usePathCalculator when working with LearnerProfile data.
 *
 * @param profile - The learner profile (can be partial)
 * @param options - Optional configuration for calculation parameters
 * @param frictionAdjustment - Optional friction-derived curriculum adjustments
 * @returns Computed path metrics including hours, modules, topics, etc.
 *
 * @example
 * ```tsx
 * const { totalHours, modules, topics } = usePathCalculatorFromProfile({
 *   goal: "Become a Full Stack Developer",
 *   weeklyHours: 15,
 *   deadlineMonths: 6,
 *   focusAreas: ["frontend", "backend"],
 * });
 * ```
 */
export function usePathCalculatorFromProfile(
    profile: Partial<LearnerProfile>,
    options: PathCalculatorOptions = {},
    frictionAdjustment?: FrictionAdjustment
): PathMetrics {
    // Convert LearnerProfile to GoalFormState for calculation
    const formState = profileToGoalFormState(profile);
    return usePathCalculator(formState, options, frictionAdjustment);
}

/**
 * Pure function version of path calculation from LearnerProfile.
 * Useful for server-side calculations or testing.
 */
export function calculatePathMetricsFromProfile(
    profile: Partial<LearnerProfile>,
    options: PathCalculatorOptions = {},
    frictionAdjustment?: FrictionAdjustment
): PathMetrics {
    const formState = profileToGoalFormState(profile);
    return calculatePathMetrics(formState, options, frictionAdjustment);
}
