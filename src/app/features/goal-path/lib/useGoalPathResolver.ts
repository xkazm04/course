/**
 * Goal Path Resolver Hook
 *
 * Bridges the existing goal-path feature with the new Intent Resolver system.
 * Provides a simple interface for generating learning paths from goal form state.
 *
 * This hook now uses the unified LearnerProfile type, eliminating the need for
 * separate GoalFormState and UserSkillProfile conversions. The LearnerProfile
 * serves as the single source of truth for learner data.
 */

"use client";

import { useCallback, useMemo } from "react";
import {
    LearningPathResolver,
    useIntentResolver,
    createIntent,
    createConstraints,
    createContext,
    type LearningPathIntent,
    type ResolvedPlan,
    type SkillLevel,
    type LearningStyle,
} from "@/app/shared/lib/intent-resolver";
import {
    PathMetrics,
    calculatePathMetrics,
    calculatePathMetricsFromProfile,
} from "./usePathCalculator";
import type { LearnerProfile, GoalFormState } from "@/app/shared/lib/learnerProfile";
import { normalizeLearningStyle, goalFormStateToProfile } from "@/app/shared/lib/learnerProfile";

// ============================================================================
// TYPES
// ============================================================================

/**
 * @deprecated Use LearnerProfile from @/app/shared/lib/learnerProfile instead.
 * This interface is maintained for backward compatibility.
 */
export interface GoalPathResolverState extends GoalFormState {
    learningStyle?: LearningStyle;
    currentLevel?: SkillLevel;
    targetRole?: string;
}

export interface UseGoalPathResolverOptions {
    /** Simulated delay in ms (for demo purposes) */
    simulatedDelayMs?: number;
    /** Callback when path is generated */
    onPathGenerated?: (plan: ResolvedPlan) => void;
    /** Callback when generation fails */
    onError?: (error: string) => void;
}

export interface UseGoalPathResolverReturn {
    /** Generate a path from form state (legacy API) */
    generatePath: (state: GoalPathResolverState) => Promise<ResolvedPlan | null>;
    /** Generate a path from LearnerProfile (preferred API) */
    generatePathFromProfile: (profile: Partial<LearnerProfile>) => Promise<ResolvedPlan | null>;
    /** Whether currently generating */
    isGenerating: boolean;
    /** Generated plan */
    plan: ResolvedPlan | null;
    /** Quick metrics (for live preview) - legacy API */
    getQuickMetrics: (state: GoalPathResolverState) => PathMetrics;
    /** Quick metrics from LearnerProfile (preferred API) */
    getQuickMetricsFromProfile: (profile: Partial<LearnerProfile>) => PathMetrics;
    /** Error message if failed */
    error: string | null;
    /** Reset state */
    reset: () => void;
}

// ============================================================================
// FOCUS AREA MAPPING
// ============================================================================

const FOCUS_AREA_MAPPING: Record<string, string> = {
    frontend: "frontend",
    backend: "backend",
    devops: "devops",
    mobile: "mobile",
    data: "data",
    ai: "ai",
    security: "security",
    testing: "testing",
    // Legacy mappings
    fullstack: "frontend", // Will also add backend
    databases: "backend",
    games: "mobile",
};

function mapFocusAreas(focus: string[]): string[] {
    const mapped = new Set<string>();

    for (const area of focus) {
        const key = area.toLowerCase();
        if (FOCUS_AREA_MAPPING[key]) {
            mapped.add(FOCUS_AREA_MAPPING[key]);

            // Special case: fullstack adds both frontend and backend
            if (key === "fullstack") {
                mapped.add("backend");
            }
        } else {
            // Use as-is if no mapping
            mapped.add(key);
        }
    }

    return Array.from(mapped);
}

// ============================================================================
// LEARNING STYLE MAPPING
// ============================================================================

/**
 * Map learning style from various formats to Intent Resolver's LearningStyle.
 *
 * This now leverages the unified normalizeLearningStyle from LearnerProfile
 * and adds mappings for the Intent Resolver's hyphenated format.
 */
const LEARNING_STYLE_MAPPING: Record<string, LearningStyle> = {
    // Legacy wizard format
    "Video Based": "video-based",
    "Text Based": "text-based",
    "Project Based": "project-based",
    "Interactive": "interactive",
    // Lowercase variants
    "video based": "video-based",
    "text based": "text-based",
    "project based": "project-based",
    "interactive": "interactive",
    // Unified LearnerProfile format
    "video": "video-based",
    "text": "text-based",
    "project": "project-based",
    "mixed": "mixed",
};

function mapLearningStyle(style?: string): LearningStyle {
    if (!style) return "mixed";
    return LEARNING_STYLE_MAPPING[style] ?? LEARNING_STYLE_MAPPING[style.toLowerCase()] ?? "mixed";
}

/**
 * Convert LearnerProfile.learningStyle to Intent Resolver's LearningStyle
 */
function mapLearnerProfileLearningStyle(style?: import("@/app/shared/lib/learnerProfile").LearningStyle): LearningStyle {
    if (!style) return "mixed";
    const mapping: Record<import("@/app/shared/lib/learnerProfile").LearningStyle, LearningStyle> = {
        "video": "video-based",
        "text": "text-based",
        "project": "project-based",
        "interactive": "interactive",
        "mixed": "mixed",
    };
    return mapping[style] ?? "mixed";
}

/**
 * Convert LearnerProfile.currentLevel to Intent Resolver's SkillLevel
 */
function mapLearnerProfileSkillLevel(level?: import("@/app/shared/lib/learnerProfile").SkillLevel): SkillLevel {
    if (!level) return "beginner";
    // The types are the same, just need to handle undefined
    return level as SkillLevel;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for generating learning paths using the Intent Resolver system.
 *
 * Now supports both the legacy GoalFormState API and the new unified LearnerProfile API.
 * The LearnerProfile API is preferred as it provides a consistent data model across
 * all modes (Wizard, Live Form, AI Chat, Career Oracle).
 *
 * @example
 * ```tsx
 * const { generatePath, generatePathFromProfile, isGenerating, plan } = useGoalPathResolver();
 *
 * // Legacy API (GoalFormState)
 * const metrics = getQuickMetrics(formState);
 * const plan = await generatePath(formState);
 *
 * // Preferred API (LearnerProfile)
 * const metrics = getQuickMetricsFromProfile(learnerProfile);
 * const plan = await generatePathFromProfile(learnerProfile);
 * ```
 */
export function useGoalPathResolver(
    options: UseGoalPathResolverOptions = {}
): UseGoalPathResolverReturn {
    const { simulatedDelayMs = 1500, onPathGenerated, onError } = options;

    // Create resolver instance with configuration
    const resolver = useMemo(
        () =>
            new LearningPathResolver({
                simulateAsync: true,
                simulatedDelayMs,
            }),
        [simulatedDelayMs]
    );

    // Use the intent resolver hook
    const {
        status,
        plan,
        error,
        resolve,
        reset,
    } = useIntentResolver(resolver, {
        onComplete: (result) => {
            if (result.plan) {
                onPathGenerated?.(result.plan);
            }
        },
        onError,
    });

    /**
     * Get quick metrics for live preview (synchronous, no full plan generation)
     * @deprecated Use getQuickMetricsFromProfile with LearnerProfile instead
     */
    const getQuickMetrics = useCallback((state: GoalPathResolverState): PathMetrics => {
        return calculatePathMetrics({
            goal: state.goal,
            timeCommitment: state.timeCommitment,
            deadline: state.deadline,
            focus: state.focus,
            learningStyle: state.learningStyle,
        });
    }, []);

    /**
     * Get quick metrics from a LearnerProfile (preferred API)
     */
    const getQuickMetricsFromProfile = useCallback((profile: Partial<LearnerProfile>): PathMetrics => {
        return calculatePathMetricsFromProfile(profile);
    }, []);

    /**
     * Generate a full learning path plan from GoalFormState
     * @deprecated Use generatePathFromProfile with LearnerProfile instead
     */
    const generatePath = useCallback(
        async (state: GoalPathResolverState): Promise<ResolvedPlan | null> => {
            // Map form state to intent
            const intent = createIntent("learning-path", {
                goal: state.goal,
                focusAreas: mapFocusAreas(state.focus),
                currentLevel: state.currentLevel ?? "beginner",
                learningStyle: mapLearningStyle(state.learningStyle),
                targetRole: state.targetRole,
            }) as LearningPathIntent;

            // Create constraints
            const constraints = createConstraints({
                hoursPerWeek: state.timeCommitment,
                deadlineMonths: state.deadline,
            });

            // Create context (minimal for now)
            const context = createContext({
                experienceLevel: state.currentLevel ?? "beginner",
            });

            // Resolve the intent
            const result = await resolve(intent, constraints, context);

            return result.plan ?? null;
        },
        [resolve]
    );

    /**
     * Generate a full learning path plan from LearnerProfile (preferred API)
     *
     * This method directly uses the unified LearnerProfile, eliminating the need
     * for conversion between GoalFormState and UserSkillProfile.
     */
    const generatePathFromProfile = useCallback(
        async (profile: Partial<LearnerProfile>): Promise<ResolvedPlan | null> => {
            // Create intent directly from LearnerProfile
            const intent = createIntent("learning-path", {
                goal: profile.goal ?? "Become a Full Stack Developer",
                focusAreas: mapFocusAreas(profile.focusAreas ?? ["frontend", "backend"]),
                currentLevel: mapLearnerProfileSkillLevel(profile.currentLevel),
                learningStyle: mapLearnerProfileLearningStyle(profile.learningStyle),
                targetRole: profile.targetRole,
            }) as LearningPathIntent;

            // Create constraints from profile
            const constraints = createConstraints({
                hoursPerWeek: profile.weeklyHours ?? 15,
                deadlineMonths: profile.deadlineMonths ?? 6,
            });

            // Create context from profile
            const context = createContext({
                experienceLevel: mapLearnerProfileSkillLevel(profile.currentLevel),
            });

            // Resolve the intent
            const result = await resolve(intent, constraints, context);

            return result.plan ?? null;
        },
        [resolve]
    );

    return {
        generatePath,
        generatePathFromProfile,
        isGenerating: status === "resolving",
        plan,
        getQuickMetrics,
        getQuickMetricsFromProfile,
        error,
        reset,
    };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Convert a ResolvedPlan to the legacy path result format
 * for backward compatibility with existing UI components.
 */
export function planToLegacyResult(plan: ResolvedPlan): {
    weeks: number;
    modules: number;
    topics: number;
    projects: number;
    path: Array<{
        title: string;
        duration: string;
    }>;
} {
    return {
        weeks: plan.metrics.estimatedWeeks,
        modules: plan.metrics.moduleCount,
        topics: plan.metrics.topicCount,
        projects: plan.metrics.projectCount,
        path: plan.milestones.map((milestone) => ({
            title: milestone.title,
            duration: `${milestone.targetWeek} weeks`,
        })),
    };
}
