/**
 * Intent Resolution System - Core Types
 *
 * This module defines the type system for the Intent Resolver abstraction.
 * The Intent Resolver pattern transforms user preferences, goals, and constraints
 * into structured, actionable plans.
 *
 * Key concepts:
 * - Intent: User's high-level goal/desire
 * - Constraints: Time, budget, skill level limitations
 * - Context: Additional information about the user's situation
 * - Plan: Structured output with steps, milestones, and recommendations
 */

// ============================================================================
// INTENT TYPES
// ============================================================================

/**
 * Supported intent types that can be resolved
 */
export type IntentType =
    | "learning-path"      // Generate personalized curriculum
    | "project-plan"       // Plan a project with milestones
    | "skill-gap"          // Analyze skill gaps and recommend training
    | "course-recommendation" // Recommend specific courses
    | "career-transition"; // Plan career change steps

/**
 * Base intent that all specific intents extend from
 */
export interface BaseIntent {
    /** Type discriminator for the intent */
    type: IntentType;
    /** User's primary goal or objective */
    goal: string;
    /** Free-form description or context from user */
    description?: string;
    /** Unix timestamp when intent was created */
    createdAt: number;
}

/**
 * Intent for learning path generation
 */
export interface LearningPathIntent extends BaseIntent {
    type: "learning-path";
    /** Target career or skill (e.g., "Full Stack Developer") */
    targetRole?: string;
    /** Preferred learning style */
    learningStyle?: LearningStyle;
    /** Focus areas to prioritize */
    focusAreas: string[];
    /** Current skill level */
    currentLevel: SkillLevel;
}

/**
 * Intent for project planning
 */
export interface ProjectPlanIntent extends BaseIntent {
    type: "project-plan";
    /** Project name/title */
    projectName: string;
    /** Type of project */
    projectType: ProjectType;
    /** Required features or functionality */
    features: string[];
    /** Team size (1 for solo) */
    teamSize: number;
    /** Technology preferences */
    techStack?: string[];
}

/**
 * Intent for skill gap analysis
 */
export interface SkillGapIntent extends BaseIntent {
    type: "skill-gap";
    /** Skills the user currently has */
    currentSkills: SkillAssessment[];
    /** Target role/position */
    targetRole: string;
    /** Industry context */
    industry?: string;
}

/**
 * Intent for course recommendations
 */
export interface CourseRecommendationIntent extends BaseIntent {
    type: "course-recommendation";
    /** Topics of interest */
    topics: string[];
    /** Preferred course format */
    format?: CourseFormat;
    /** Preferred difficulty */
    difficulty?: SkillLevel;
}

/**
 * Intent for career transition planning
 */
export interface CareerTransitionIntent extends BaseIntent {
    type: "career-transition";
    /** Current role/position */
    currentRole: string;
    /** Target role/position */
    targetRole: string;
    /** Transferable skills */
    transferableSkills: string[];
    /** Willingness to relocate */
    willingToRelocate?: boolean;
}

/**
 * Union type for all supported intents
 */
export type Intent =
    | LearningPathIntent
    | ProjectPlanIntent
    | SkillGapIntent
    | CourseRecommendationIntent
    | CareerTransitionIntent;

// ============================================================================
// CONSTRAINT TYPES
// ============================================================================

/**
 * Time-related constraints
 */
export interface TimeConstraints {
    /** Hours available per week */
    hoursPerWeek: number;
    /** Target completion deadline in months */
    deadlineMonths?: number;
    /** Preferred session duration in minutes */
    preferredSessionLength?: number;
    /** Available days of the week (0=Sun, 6=Sat) */
    availableDays?: number[];
}

/**
 * Resource constraints
 */
export interface ResourceConstraints {
    /** Monthly budget in USD (null = no limit) */
    budget?: number | null;
    /** Hardware limitations */
    hardwareLimitations?: string[];
    /** Internet speed category */
    internetQuality?: "low" | "medium" | "high";
}

/**
 * Learning preference constraints
 */
export interface PreferenceConstraints {
    /** Preferred content language */
    language?: string;
    /** Avoid certain topics */
    excludeTopics?: string[];
    /** Require accessibility features */
    accessibilityNeeds?: AccessibilityNeed[];
    /** Prefer certified/accredited content */
    requireCertification?: boolean;
}

/**
 * Combined constraints object
 */
export interface Constraints {
    time: TimeConstraints;
    resources?: ResourceConstraints;
    preferences?: PreferenceConstraints;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * User context for personalization
 */
export interface UserContext {
    /** User's experience level */
    experienceLevel: SkillLevel;
    /** Completed courses/modules */
    completedModules?: string[];
    /** User's interests */
    interests?: string[];
    /** Past goals and their status */
    pastGoals?: PastGoal[];
    /** User's timezone */
    timezone?: string;
}

/**
 * Record of a past goal
 */
export interface PastGoal {
    goal: string;
    status: "completed" | "abandoned" | "in-progress";
    completedAt?: number;
}

/**
 * Environmental context
 */
export interface EnvironmentContext {
    /** Current date (for seasonal/trending content) */
    currentDate: number;
    /** Platform features available */
    platformFeatures?: string[];
    /** A/B test flags */
    experimentFlags?: Record<string, boolean>;
}

/**
 * Combined context object
 */
export interface ResolutionContext {
    user: UserContext;
    environment?: EnvironmentContext;
}

// ============================================================================
// PLAN OUTPUT TYPES
// ============================================================================

/**
 * Priority level for plan items
 */
export type Priority = "critical" | "high" | "medium" | "low" | "optional";

/**
 * A single step in a plan
 */
export interface PlanStep {
    /** Step identifier */
    id: string;
    /** Step title */
    title: string;
    /** Detailed description */
    description: string;
    /** Estimated duration in hours */
    estimatedHours: number;
    /** Step priority */
    priority: Priority;
    /** IDs of steps that must be completed first */
    dependencies: string[];
    /** Resources/links for this step */
    resources?: Resource[];
    /** Skills gained from this step */
    skillsGained?: string[];
    /** Optional metadata */
    metadata?: Record<string, unknown>;
}

/**
 * A milestone marking significant progress
 */
export interface Milestone {
    /** Milestone identifier */
    id: string;
    /** Milestone title */
    title: string;
    /** Description of achievement */
    description: string;
    /** Week number when milestone should be reached */
    targetWeek: number;
    /** Criteria for completion */
    completionCriteria: string[];
    /** Steps that lead to this milestone */
    stepIds: string[];
}

/**
 * A learning module within a plan
 */
export interface PlanModule {
    /** Module identifier */
    id: string;
    /** Module name */
    name: string;
    /** Module description */
    description: string;
    /** Order in the curriculum */
    order: number;
    /** Estimated hours to complete */
    estimatedHours: number;
    /** Topics covered */
    topics: string[];
    /** Steps within this module */
    steps: PlanStep[];
    /** Prerequisites (other module IDs) */
    prerequisites: string[];
}

/**
 * Resource reference
 */
export interface Resource {
    /** Resource title */
    title: string;
    /** Resource type */
    type: "course" | "article" | "video" | "book" | "tool" | "community";
    /** URL if external */
    url?: string;
    /** Internal resource ID if platform content */
    internalId?: string;
    /** Estimated time to consume */
    estimatedMinutes?: number;
}

/**
 * Metrics about the generated plan
 */
export interface PlanMetrics {
    /** Total estimated hours */
    totalHours: number;
    /** Number of modules */
    moduleCount: number;
    /** Number of topics covered */
    topicCount: number;
    /** Number of projects/hands-on work */
    projectCount: number;
    /** Estimated weeks to complete */
    estimatedWeeks: number;
    /** Confidence score (0-100) */
    confidenceScore: number;
}

/**
 * Recommendation for plan optimization
 */
export interface PlanRecommendation {
    /** Recommendation type */
    type: "optimization" | "warning" | "alternative" | "enhancement";
    /** Short title */
    title: string;
    /** Detailed message */
    message: string;
    /** Action to take */
    action?: string;
}

/**
 * The resolved plan output
 */
export interface ResolvedPlan {
    /** Plan identifier */
    id: string;
    /** Plan title */
    title: string;
    /** Plan summary */
    summary: string;
    /** The original intent that was resolved */
    intent: Intent;
    /** Constraints that were applied */
    constraints: Constraints;
    /** Ordered list of modules */
    modules: PlanModule[];
    /** Key milestones */
    milestones: Milestone[];
    /** Plan metrics */
    metrics: PlanMetrics;
    /** Recommendations for the user */
    recommendations: PlanRecommendation[];
    /** When the plan was generated */
    generatedAt: number;
    /** Plan version for updates */
    version: string;
}

// ============================================================================
// RESOLVER TYPES
// ============================================================================

/**
 * Status of an intent resolution
 */
export type ResolutionStatus =
    | "pending"
    | "resolving"
    | "completed"
    | "failed"
    | "requires-input";

/**
 * Result of an intent resolution attempt
 */
export interface ResolutionResult {
    /** Resolution status */
    status: ResolutionStatus;
    /** The resolved plan (if successful) */
    plan?: ResolvedPlan;
    /** Error message (if failed) */
    error?: string;
    /** Missing information needed */
    missingInput?: MissingInput[];
    /** Resolution duration in ms */
    durationMs: number;
}

/**
 * Information that needs to be collected from user
 */
export interface MissingInput {
    /** Field identifier */
    field: string;
    /** Human-readable question */
    question: string;
    /** Type of input expected */
    inputType: "text" | "number" | "select" | "multiselect" | "boolean";
    /** Options for select/multiselect */
    options?: SelectOption[];
    /** Whether this input is required */
    required: boolean;
}

/**
 * Option for select inputs
 */
export interface SelectOption {
    value: string;
    label: string;
    description?: string;
}

// ============================================================================
// SUPPORTING ENUMS AND TYPES
// ============================================================================

/**
 * Skill proficiency levels
 */
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

/**
 * Learning style preferences
 */
export type LearningStyle =
    | "video-based"
    | "text-based"
    | "project-based"
    | "interactive"
    | "mixed";

/**
 * Project types
 */
export type ProjectType =
    | "web-app"
    | "mobile-app"
    | "api"
    | "library"
    | "cli-tool"
    | "data-pipeline"
    | "ml-model"
    | "game"
    | "other";

/**
 * Course format preferences
 */
export type CourseFormat =
    | "self-paced"
    | "cohort-based"
    | "live-instruction"
    | "bootcamp";

/**
 * Accessibility needs
 */
export type AccessibilityNeed =
    | "screen-reader"
    | "captions"
    | "high-contrast"
    | "keyboard-navigation"
    | "large-text";

/**
 * Assessment of a single skill
 */
export interface SkillAssessment {
    /** Skill name */
    name: string;
    /** Current proficiency level */
    level: SkillLevel;
    /** Years of experience (optional) */
    yearsExperience?: number;
    /** Last used date */
    lastUsed?: number;
}

// ============================================================================
// FACTORY HELPER TYPES
// ============================================================================

/**
 * Options for creating an intent
 */
export type CreateIntentOptions<T extends IntentType> =
    T extends "learning-path" ? Omit<LearningPathIntent, "type" | "createdAt"> :
    T extends "project-plan" ? Omit<ProjectPlanIntent, "type" | "createdAt"> :
    T extends "skill-gap" ? Omit<SkillGapIntent, "type" | "createdAt"> :
    T extends "course-recommendation" ? Omit<CourseRecommendationIntent, "type" | "createdAt"> :
    T extends "career-transition" ? Omit<CareerTransitionIntent, "type" | "createdAt"> :
    never;
