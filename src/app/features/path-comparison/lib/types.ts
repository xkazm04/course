/**
 * Path Comparison Types
 *
 * Types for the path comparison matrix feature that helps users
 * compare 2-3 learning paths side-by-side to reduce decision paralysis.
 */

import type { LearningPath } from "@/app/shared/lib/types";

/**
 * Comparison dimension identifiers
 */
export type ComparisonDimension =
    | "time_investment"
    | "skill_overlap"
    | "career_outcomes"
    | "squad_activity";

/**
 * Comparison result indicator (visual diff)
 */
export type ComparisonIndicator = "advantage" | "neutral" | "disadvantage";

/**
 * Single dimension comparison for a path
 */
export interface DimensionScore {
    /** The dimension being scored */
    dimension: ComparisonDimension;
    /** Numeric value for comparison */
    value: number;
    /** Display label */
    label: string;
    /** Comparison indicator relative to other paths */
    indicator: ComparisonIndicator;
    /** Optional detail text */
    detail?: string;
}

/**
 * Complete comparison data for a single path
 */
export interface PathComparisonData {
    /** The learning path being compared */
    path: LearningPath;
    /** Scores for each comparison dimension */
    scores: DimensionScore[];
    /** Overall recommendation score (0-100) */
    overallScore: number;
}

/**
 * Dimension metadata for display
 */
export interface DimensionMetadata {
    id: ComparisonDimension;
    label: string;
    description: string;
    icon: string;
    unit?: string;
}

/**
 * Comparison session state
 */
export interface ComparisonSession {
    /** Paths selected for comparison */
    selectedPaths: LearningPath[];
    /** Maximum paths allowed (2-3) */
    maxPaths: number;
    /** Whether comparison modal is open */
    isOpen: boolean;
}

/**
 * Dimension definitions with metadata
 */
export const COMPARISON_DIMENSIONS: DimensionMetadata[] = [
    {
        id: "time_investment",
        label: "Time Investment",
        description: "Total hours to complete the learning path",
        icon: "Clock",
        unit: "hours",
    },
    {
        id: "skill_overlap",
        label: "Skill Overlap",
        description: "How many skills transfer to other paths",
        icon: "GitBranch",
        unit: "%",
    },
    {
        id: "career_outcomes",
        label: "Career Outcomes",
        description: "Job market demand and salary potential",
        icon: "TrendingUp",
    },
    {
        id: "squad_activity",
        label: "Squad Activity",
        description: "Active learners and study groups",
        icon: "Users",
    },
];

/**
 * Skill analysis for a path comparison
 */
export interface SkillAnalysis {
    /** Skills unique to this path */
    uniqueSkills: string[];
    /** Skills shared with other selected paths */
    sharedSkills: string[];
    /** All skills from this path */
    allSkills: string[];
}

/**
 * Prerequisite relationship for a path
 */
export interface PrerequisiteInfo {
    /** IDs of paths that are prerequisites */
    prerequisites: string[];
    /** IDs of paths that depend on this one */
    dependents: string[];
    /** Whether this path has prerequisites among selected paths */
    hasSelectedPrerequisites: boolean;
    /** Whether other selected paths depend on this path */
    hasSelectedDependents: boolean;
}

/**
 * Combined path analysis for multiple paths
 */
export interface CombinedPathAnalysis {
    /** Total hours if user takes all selected paths */
    totalHours: number;
    /** Effective hours accounting for skill overlap (estimated time saved) */
    effectiveHours: number;
    /** Time saved due to overlapping content */
    hoursSaved: number;
    /** Percentage of time saved */
    efficiencyGain: number;
    /** Total unique skills gained from all paths */
    totalUniqueSkills: string[];
    /** Skills that appear in multiple paths */
    overlappingSkills: string[];
    /** Total number of courses */
    totalCourses: number;
    /** Suggested learning order (path IDs in sequence) */
    suggestedOrder: string[];
    /** Is this a recommended combination? */
    isRecommendedCombo: boolean;
    /** Reason for recommendation or concern */
    recommendation: string;
}

/**
 * Extended comparison data including skill and prerequisite analysis
 */
export interface ExtendedPathComparisonData extends PathComparisonData {
    /** Skill analysis for this path */
    skillAnalysis: SkillAnalysis;
    /** Prerequisite information */
    prerequisiteInfo: PrerequisiteInfo;
}
