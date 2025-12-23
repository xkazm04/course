/**
 * Skill Assessment Types
 *
 * Type definitions for the interactive skill assessment system
 * that transforms the landing hero into a personalized onboarding experience.
 */

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type LearningPath =
    | "frontend-mastery"
    | "fullstack-architect"
    | "backend-specialist"
    | "devops-engineer"
    | "mobile-developer"
    | "ai-ml-engineer";

export type LearningIntensity =
    | "4-week-sprint"
    | "8-week-balanced"
    | "12-week-intensive"
    | "16-week-comprehensive";

export type PrimaryGoal =
    | "career-switch"
    | "skill-upgrade"
    | "first-job"
    | "promotion"
    | "side-project"
    | "freelance";

/**
 * A single answer option for a question
 */
export interface AssessmentOption {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    /** Score weights for different paths */
    pathWeights?: Partial<Record<LearningPath, number>>;
    /** Affects which questions come next */
    nextQuestionId?: string;
}

/**
 * A single question in the assessment
 */
export interface AssessmentQuestion {
    id: string;
    category: "experience" | "goals" | "preferences" | "availability";
    question: string;
    subtext?: string;
    options: AssessmentOption[];
    /** Allow multiple selections */
    multiSelect?: boolean;
    /** Question order weight (lower = earlier) */
    order: number;
    /** Conditional - only show if previous answers match */
    showIf?: {
        questionId: string;
        answerId: string | string[];
    };
}

/**
 * User's answer to a single question
 */
export interface AssessmentAnswer {
    questionId: string;
    selectedOptionIds: string[];
    timestamp: number;
}

/**
 * Complete assessment state
 */
export interface AssessmentState {
    currentQuestionIndex: number;
    answers: AssessmentAnswer[];
    startedAt: number;
    completedAt?: number;
    isComplete: boolean;
}

/**
 * Personalized recommendation generated from assessment
 */
export interface AssessmentResult {
    id: string;
    /** Primary recommended path */
    recommendedPath: LearningPath;
    /** Path display name */
    pathDisplayName: string;
    /** Confidence score 0-100 */
    confidence: number;
    /** Recommended intensity */
    recommendedIntensity: LearningIntensity;
    /** Intensity display name */
    intensityDisplayName: string;
    /** Personalized tags for floating badges */
    personalizedTags: string[];
    /** Suggested module order */
    moduleOrder: string[];
    /** Brief personalized message */
    summary: string;
    /** Estimated time to complete */
    estimatedWeeks: number;
    /** Skill level detected */
    skillLevel: SkillLevel;
    /** Primary goal identified */
    primaryGoal: PrimaryGoal;
}

/**
 * Full assessment profile stored for the user
 */
export interface AssessmentProfile {
    id: string;
    result: AssessmentResult;
    answers: AssessmentAnswer[];
    completedAt: string;
    version: string;
}

/**
 * Assessment storage data structure
 */
export interface AssessmentStorageData {
    currentAssessment: AssessmentState | null;
    profile: AssessmentProfile | null;
    hasCompletedOnboarding: boolean;
}

/**
 * Path configuration for display and scoring
 */
export interface PathConfig {
    id: LearningPath;
    name: string;
    shortName: string;
    description: string;
    icon: string;
    color: string;
    gradient: string;
    modules: string[];
}

/**
 * Intensity configuration
 */
export interface IntensityConfig {
    id: LearningIntensity;
    name: string;
    weeks: number;
    hoursPerWeek: number;
    description: string;
}
