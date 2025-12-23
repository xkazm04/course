/**
 * Unified Learner Profile Type
 *
 * This module unifies what were previously two separate concepts:
 * - GoalFormState (goal, timeCommitment, deadline, focus, learningStyle)
 * - UserSkillProfile (currentSkills, targetRole, weeklyHours, learningStyle, riskTolerance)
 *
 * Both were attempting to capture "who is this learner and what do they want".
 * LearnerProfile becomes the single source of truth that all modes read and write,
 * enabling cross-mode continuity and persistent user profiles across sessions.
 *
 * This is the foundation for:
 * - Mode switching without data loss
 * - Persistent user profiles
 * - Richer personalization across the application
 */

// Note: IndustrySector is defined inline to avoid circular dependency with predictiveTypes.
// The values match those defined in predictiveTypes.ts
/**
 * Industry sector for job market matching.
 * This is a copy of the type from predictiveTypes to avoid circular imports.
 * Keep in sync with predictiveTypes.IndustrySector.
 */
export type IndustrySector =
    | "tech_startups"
    | "enterprise"
    | "fintech"
    | "healthcare"
    | "ecommerce"
    | "gaming"
    | "ai_ml"
    | "cybersecurity"
    | "cloud_infrastructure"
    | "web3_blockchain";

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Skill proficiency levels (1-5 scale)
 */
export type SkillProficiency = 1 | 2 | 3 | 4 | 5;

/**
 * Skill level categories for simpler assessments
 */
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

/**
 * Learning style preferences
 * Unified from both the wizard's simple labels and Career Oracle's options
 */
export type LearningStyle =
    | "video"       // Video-based learning
    | "text"        // Text/documentation-based learning
    | "project"     // Project-based/hands-on learning
    | "interactive" // Interactive tutorials/exercises
    | "mixed";      // Combination of styles (default)

/**
 * Risk tolerance for career/learning decisions
 * Used by Career Oracle and can influence path recommendations
 */
export type RiskTolerance = "conservative" | "moderate" | "aggressive";

/**
 * Remote work preference for job market integration
 */
export type RemotePreference = "no" | "hybrid" | "full" | "any";

// ============================================================================
// LEARNER SKILL
// ============================================================================

/**
 * A skill the learner currently possesses
 * Combines detailed tracking (for Career Oracle) with simpler use cases
 */
export interface LearnerSkill {
    /** Skill name */
    name: string;
    /** Proficiency level (1-5) */
    proficiency: SkillProficiency;
    /** Years of experience with this skill */
    yearsOfExperience?: number;
    /** When the skill was last actively used */
    lastUsed?: string; // ISO date string
}

// ============================================================================
// LEARNER PROFILE
// ============================================================================

/**
 * Unified Learner Profile
 *
 * This is the single source of truth for learner data across all modes:
 * - Wizard mode: Uses goal, timeCommitment, deadline, focusAreas
 * - Live Form mode: Uses the same fields with real-time preview
 * - AI Chat mode: Builds profile conversationally
 * - Career Oracle: Uses the full profile including skills and market preferences
 *
 * All fields are optional to support progressive profile building.
 */
export interface LearnerProfile {
    // ========================================================================
    // IDENTITY & GOALS
    // ========================================================================

    /** User's primary learning goal or objective */
    goal?: string;

    /** Target career role (e.g., "Senior Frontend Engineer") */
    targetRole?: string;

    /** Target industry sector for job market matching */
    targetSector?: IndustrySector;

    // ========================================================================
    // SKILLS
    // ========================================================================

    /** Skills the learner currently has */
    currentSkills?: LearnerSkill[];

    /** Focus areas to prioritize in learning path */
    focusAreas?: string[];

    /** Current skill level (simplified assessment) */
    currentLevel?: SkillLevel;

    // ========================================================================
    // TIME & COMMITMENT
    // ========================================================================

    /** Hours available per week for learning */
    weeklyHours?: number;

    /** Target deadline in months */
    deadlineMonths?: number;

    // ========================================================================
    // LEARNING PREFERENCES
    // ========================================================================

    /** Preferred learning style */
    learningStyle?: LearningStyle;

    /** Risk tolerance for career decisions */
    riskTolerance?: RiskTolerance;

    // ========================================================================
    // JOB MARKET PREFERENCES (for Career Oracle)
    // ========================================================================

    /** Location for job market matching */
    location?: string;

    /** Remote work preference */
    remotePreference?: RemotePreference;

    /** Target salary (optional) */
    targetSalary?: number;
}

// ============================================================================
// PARTIAL TYPES FOR SPECIFIC USE CASES
// ============================================================================

/**
 * Minimum fields required for path calculation
 * This represents what the simple Wizard mode needs
 */
export interface PathCalculationProfile {
    goal: string;
    weeklyHours: number;
    deadlineMonths: number;
    focusAreas: string[];
    learningStyle?: LearningStyle;
}

/**
 * Goal form state type for UI components.
 * This is a minimal interface for form state that maps directly to LearnerProfile fields.
 *
 * Field mapping:
 * - goal → LearnerProfile.goal
 * - timeCommitment → LearnerProfile.weeklyHours
 * - deadline → LearnerProfile.deadlineMonths
 * - focus → LearnerProfile.focusAreas
 * - learningStyle → LearnerProfile.learningStyle
 */
export interface GoalFormState {
    goal: string;
    timeCommitment: number;  // hours per week (maps to weeklyHours)
    deadline: number;        // months (maps to deadlineMonths)
    focus: string[];         // maps to focusAreas
    learningStyle?: string;  // maps to learningStyle
}

/**
 * Convert a GoalFormState to LearnerProfile fields
 */
export function goalFormStateToProfile(formState: GoalFormState): Partial<LearnerProfile> {
    return {
        goal: formState.goal,
        weeklyHours: formState.timeCommitment,
        deadlineMonths: formState.deadline,
        focusAreas: formState.focus,
        learningStyle: normalizeLearningStyle(formState.learningStyle),
    };
}

/**
 * Convert a LearnerProfile to GoalFormState
 * Useful for UI components that work with the form state interface
 */
export function profileToGoalFormState(profile: Partial<LearnerProfile>): GoalFormState {
    return {
        goal: profile.goal ?? "Become a Full Stack Developer",
        timeCommitment: profile.weeklyHours ?? 15,
        deadline: profile.deadlineMonths ?? 6,
        focus: profile.focusAreas ?? ["frontend", "backend"],
        learningStyle: profile.learningStyle,
    };
}

/**
 * Fields used by Career Oracle for predictive intelligence
 */
export interface CareerOracleProfile {
    currentSkills: LearnerSkill[];
    targetRole: string;
    targetSector?: IndustrySector;
    weeklyHours: number;
    learningStyle: LearningStyle;
    riskTolerance: RiskTolerance;
    location?: string;
    remotePreference: RemotePreference;
    targetSalary?: number;
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert a LearnerProfile to the format needed for path calculation
 * Provides defaults for required fields
 */
export function toPathCalculationProfile(
    profile: Partial<LearnerProfile>
): PathCalculationProfile {
    return {
        goal: profile.goal ?? "Become a Full Stack Developer",
        weeklyHours: profile.weeklyHours ?? 15,
        deadlineMonths: profile.deadlineMonths ?? 6,
        focusAreas: profile.focusAreas ?? ["frontend", "backend"],
        learningStyle: profile.learningStyle,
    };
}

/**
 * Convert a LearnerProfile to the format needed for Career Oracle
 * Provides defaults for required fields
 */
export function toCareerOracleProfile(
    profile: Partial<LearnerProfile>
): CareerOracleProfile {
    return {
        currentSkills: profile.currentSkills ?? [],
        targetRole: profile.targetRole ?? "Full Stack Developer",
        targetSector: profile.targetSector,
        weeklyHours: profile.weeklyHours ?? 10,
        learningStyle: profile.learningStyle ?? "mixed",
        riskTolerance: profile.riskTolerance ?? "moderate",
        location: profile.location,
        remotePreference: profile.remotePreference ?? "any",
        targetSalary: profile.targetSalary,
    };
}

/**
 * Create skill entries from simple skill names
 * Useful for quick profile creation
 */
export function createSkillsFromNames(
    skillNames: string[],
    defaultProficiency: SkillProficiency = 3
): LearnerSkill[] {
    return skillNames.map((name) => ({
        name,
        proficiency: defaultProficiency,
        yearsOfExperience: 1,
    }));
}

/**
 * Map learning style string to standardized LearningStyle
 * Handles various input formats from different UIs
 */
export function normalizeLearningStyle(style?: string): LearningStyle {
    if (!style) return "mixed";

    const normalized = style.toLowerCase().trim();

    // Map common variations
    if (normalized.includes("video")) return "video";
    if (normalized.includes("text") || normalized.includes("doc") || normalized.includes("book")) return "text";
    if (normalized.includes("project") || normalized.includes("hands")) return "project";
    if (normalized.includes("interactive") || normalized.includes("tutorial")) return "interactive";

    return "mixed";
}

/**
 * Map SkillLevel to SkillProficiency
 */
export function skillLevelToProficiency(level: SkillLevel): SkillProficiency {
    switch (level) {
        case "beginner": return 1;
        case "intermediate": return 3;
        case "advanced": return 4;
        case "expert": return 5;
        default: return 3;
    }
}

/**
 * Map SkillProficiency to SkillLevel
 */
export function proficiencyToSkillLevel(proficiency: SkillProficiency): SkillLevel {
    if (proficiency <= 1) return "beginner";
    if (proficiency <= 2) return "intermediate";
    if (proficiency <= 4) return "advanced";
    return "expert";
}

// ============================================================================
// DEFAULT PROFILE
// ============================================================================

/**
 * Default learner profile with sensible starting values
 */
export const DEFAULT_LEARNER_PROFILE: LearnerProfile = {
    goal: "Become a Full Stack Developer",
    weeklyHours: 15,
    deadlineMonths: 6,
    focusAreas: ["frontend", "backend"],
    learningStyle: "mixed",
    currentLevel: "beginner",
    riskTolerance: "moderate",
    remotePreference: "any",
};

// ============================================================================
// PROFILE MERGE UTILITY
// ============================================================================

/**
 * Merge partial profile updates into an existing profile
 * Useful for progressive profile building across modes
 */
export function mergeProfiles(
    base: Partial<LearnerProfile>,
    updates: Partial<LearnerProfile>
): LearnerProfile {
    return {
        ...base,
        ...updates,
        // Deep merge arrays only if both exist
        currentSkills: updates.currentSkills ?? base.currentSkills,
        focusAreas: updates.focusAreas ?? base.focusAreas,
    };
}
