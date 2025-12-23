/**
 * Intent Resolution System
 *
 * A powerful abstraction for transforming user intents into structured, actionable plans.
 * This pattern enables consistent plan generation across multiple features:
 * - Learning paths
 * - Project planning
 * - Skill gap analysis
 * - Course recommendations
 * - Career transition planning
 *
 * @example Basic usage with LearningPathResolver
 * ```typescript
 * import {
 *   LearningPathResolver,
 *   createIntent,
 *   createConstraints,
 *   createContext
 * } from "@/app/shared/lib/intent-resolver";
 *
 * const resolver = new LearningPathResolver();
 *
 * const intent = createIntent("learning-path", {
 *   goal: "Become a Full Stack Developer",
 *   focusAreas: ["frontend", "backend"],
 *   currentLevel: "beginner",
 * });
 *
 * const constraints = createConstraints({
 *   hoursPerWeek: 15,
 *   deadlineMonths: 6,
 * });
 *
 * const context = createContext({
 *   experienceLevel: "beginner",
 * });
 *
 * const result = await resolver.resolve(intent, constraints, context);
 *
 * if (result.status === "completed") {
 *   console.log(result.plan);
 * }
 * ```
 *
 * @example Using the registry for multiple intent types
 * ```typescript
 * import {
 *   ResolverRegistry,
 *   LearningPathResolver,
 *   ProjectPlanResolver,
 *   SkillGapResolver,
 * } from "@/app/shared/lib/intent-resolver";
 *
 * const registry = new ResolverRegistry();
 * registry.register(new LearningPathResolver());
 * registry.register(new ProjectPlanResolver());
 * registry.register(new SkillGapResolver());
 *
 * // The registry automatically routes to the correct resolver
 * const result = await registry.resolve(anyIntent, constraints, context);
 * ```
 */

// Core types
export type {
    // Intent types
    IntentType,
    BaseIntent,
    Intent,
    LearningPathIntent,
    ProjectPlanIntent,
    SkillGapIntent,
    CourseRecommendationIntent,
    CareerTransitionIntent,
    CreateIntentOptions,

    // Constraint types
    Constraints,
    TimeConstraints,
    ResourceConstraints,
    PreferenceConstraints,

    // Context types
    ResolutionContext,
    UserContext,
    EnvironmentContext,
    PastGoal,

    // Plan output types
    ResolvedPlan,
    PlanModule,
    PlanStep,
    Milestone,
    PlanMetrics,
    PlanRecommendation,
    Resource,
    Priority,

    // Resolution types
    ResolutionResult,
    ResolutionStatus,
    MissingInput,
    SelectOption,

    // Supporting types
    SkillLevel,
    LearningStyle,
    ProjectType,
    CourseFormat,
    AccessibilityNeed,
    SkillAssessment,
} from "./types";

// Core classes
export {
    IntentResolver,
    ResolverRegistry,
    type ResolverConfig,
} from "./IntentResolver";

// Specialized resolvers
export {
    LearningPathResolver,
    ProjectPlanResolver,
    SkillGapResolver,
} from "./resolvers";

// Factory functions and utilities
export {
    createIntent,
    createConstraints,
    createContext,
    createDefaultRegistry,
    intentTypeLabels,
    skillLevelLabels,
    learningStyleLabels,
} from "./factories";

// Hooks for React components
export {
    useIntentResolver,
    useResolverRegistry,
    type UseIntentResolverOptions,
    type UseIntentResolverReturn,
} from "./hooks";
