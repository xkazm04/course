/**
 * Intent Resolution System - Factory Functions
 *
 * Helper functions for creating intents, constraints, and contexts
 * with sensible defaults and type safety.
 */

import {
    Intent,
    IntentType,
    LearningPathIntent,
    ProjectPlanIntent,
    SkillGapIntent,
    CourseRecommendationIntent,
    CareerTransitionIntent,
    Constraints,
    TimeConstraints,
    ResourceConstraints,
    PreferenceConstraints,
    ResolutionContext,
    UserContext,
    EnvironmentContext,
    SkillLevel,
    LearningStyle,
    CreateIntentOptions,
} from "./types";

import { ResolverRegistry } from "./IntentResolver";
import { LearningPathResolver } from "./resolvers/LearningPathResolver";
import { ProjectPlanResolver } from "./resolvers/ProjectPlanResolver";
import { SkillGapResolver } from "./resolvers/SkillGapResolver";

// ============================================================================
// INTENT FACTORY
// ============================================================================

/**
 * Create a typed intent with defaults
 */
export function createIntent<T extends IntentType>(
    type: T,
    options: CreateIntentOptions<T>
): Intent {
    const base = {
        createdAt: Date.now(),
    };

    // Note: We spread options last so user-provided values override defaults
    // Default values for goal are provided but will be overwritten by options.goal if provided
    const learningPathDefaults = {
        goal: "",
        focusAreas: [] as string[],
        currentLevel: "beginner" as const,
    };

    const projectPlanDefaults = {
        goal: "",
        projectName: "",
        projectType: "web-app" as const,
        features: [] as string[],
        teamSize: 1,
    };

    const skillGapDefaults = {
        goal: "",
        currentSkills: [] as string[],
        targetRole: "",
    };

    const courseRecommendationDefaults = {
        goal: "",
        topics: [] as string[],
    };

    const careerTransitionDefaults = {
        goal: "",
        currentRole: "",
        targetRole: "",
        transferableSkills: [] as string[],
    };

    switch (type) {
        case "learning-path":
            return {
                ...base,
                type: "learning-path",
                ...learningPathDefaults,
                ...options,
            } as LearningPathIntent;

        case "project-plan":
            return {
                ...base,
                type: "project-plan",
                ...projectPlanDefaults,
                ...options,
            } as ProjectPlanIntent;

        case "skill-gap":
            return {
                ...base,
                type: "skill-gap",
                ...skillGapDefaults,
                ...options,
            } as SkillGapIntent;

        case "course-recommendation":
            return {
                ...base,
                type: "course-recommendation",
                ...courseRecommendationDefaults,
                ...options,
            } as CourseRecommendationIntent;

        case "career-transition":
            return {
                ...base,
                type: "career-transition",
                ...careerTransitionDefaults,
                ...options,
            } as CareerTransitionIntent;

        default:
            throw new Error(`Unknown intent type: ${type}`);
    }
}

// ============================================================================
// CONSTRAINTS FACTORY
// ============================================================================

interface CreateConstraintsOptions {
    // Time constraints
    hoursPerWeek: number;
    deadlineMonths?: number;
    preferredSessionLength?: number;
    availableDays?: number[];

    // Resource constraints (optional)
    budget?: number | null;
    hardwareLimitations?: string[];
    internetQuality?: "low" | "medium" | "high";

    // Preference constraints (optional)
    language?: string;
    excludeTopics?: string[];
    requireCertification?: boolean;
}

/**
 * Create constraints object with defaults
 */
export function createConstraints(options: CreateConstraintsOptions): Constraints {
    const time: TimeConstraints = {
        hoursPerWeek: options.hoursPerWeek,
        deadlineMonths: options.deadlineMonths,
        preferredSessionLength: options.preferredSessionLength,
        availableDays: options.availableDays,
    };

    const resources: ResourceConstraints | undefined =
        options.budget !== undefined || options.hardwareLimitations || options.internetQuality
            ? {
                budget: options.budget,
                hardwareLimitations: options.hardwareLimitations,
                internetQuality: options.internetQuality,
            }
            : undefined;

    const preferences: PreferenceConstraints | undefined =
        options.language || options.excludeTopics || options.requireCertification !== undefined
            ? {
                language: options.language,
                excludeTopics: options.excludeTopics,
                requireCertification: options.requireCertification,
            }
            : undefined;

    return {
        time,
        resources,
        preferences,
    };
}

// ============================================================================
// CONTEXT FACTORY
// ============================================================================

interface CreateContextOptions {
    // User context
    experienceLevel: SkillLevel;
    completedModules?: string[];
    interests?: string[];
    timezone?: string;

    // Environment context (optional)
    platformFeatures?: string[];
    experimentFlags?: Record<string, boolean>;
}

/**
 * Create resolution context with defaults
 */
export function createContext(options: CreateContextOptions): ResolutionContext {
    const user: UserContext = {
        experienceLevel: options.experienceLevel,
        completedModules: options.completedModules,
        interests: options.interests,
        timezone: options.timezone,
    };

    const environment: EnvironmentContext = {
        currentDate: Date.now(),
        platformFeatures: options.platformFeatures,
        experimentFlags: options.experimentFlags,
    };

    return {
        user,
        environment,
    };
}

// ============================================================================
// REGISTRY FACTORY
// ============================================================================

/**
 * Create a pre-configured resolver registry with all available resolvers
 */
export function createDefaultRegistry(): ResolverRegistry {
    const registry = new ResolverRegistry();

    registry.register(new LearningPathResolver());
    registry.register(new ProjectPlanResolver());
    registry.register(new SkillGapResolver());

    return registry;
}

// ============================================================================
// LABEL HELPERS
// ============================================================================

/**
 * Human-readable labels for intent types
 */
export const intentTypeLabels: Record<IntentType, string> = {
    "learning-path": "Learning Path",
    "project-plan": "Project Plan",
    "skill-gap": "Skill Gap Analysis",
    "course-recommendation": "Course Recommendation",
    "career-transition": "Career Transition",
};

/**
 * Human-readable labels for skill levels
 */
export const skillLevelLabels: Record<SkillLevel, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert",
};

/**
 * Human-readable labels for learning styles
 */
export const learningStyleLabels: Record<LearningStyle, string> = {
    "video-based": "Video-Based Learning",
    "text-based": "Text-Based Learning",
    "project-based": "Project-Based Learning",
    "interactive": "Interactive Exercises",
    "mixed": "Mixed Learning Styles",
};
