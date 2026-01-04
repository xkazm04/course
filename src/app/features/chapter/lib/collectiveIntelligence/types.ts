/**
 * Collective Intelligence Types
 *
 * Types for the emergent curriculum system that derives learning dependencies
 * from collective learner behavior rather than hand-crafted prerequisites.
 */

import type { ChapterNodeId } from "../chapterGraph";
import type { LearnerPace, LearnerConfidence, SectionBehavior } from "../conductorTypes";

// ============================================================================
// LEARNER JOURNEY TYPES
// ============================================================================

/**
 * Represents a single learner's journey through chapters
 */
export interface LearnerJourney {
    /** Unique identifier for the learner */
    userId: string;
    /** Ordered list of chapters attempted */
    chapterSequence: ChapterAttempt[];
    /** Overall success metrics */
    successMetrics: JourneySuccessMetrics;
    /** Profile snapshot at journey completion */
    finalProfile: JourneyProfile;
    /** Journey timestamp data */
    timestamps: {
        started: number;
        lastActivity: number;
        completed?: number;
    };
}

/**
 * A single chapter attempt within a learner's journey
 */
export interface ChapterAttempt {
    /** Chapter node ID */
    chapterId: ChapterNodeId;
    /** When the chapter was started */
    startedAt: number;
    /** When the chapter was completed (if at all) */
    completedAt?: number;
    /** Whether the chapter was successfully completed */
    completed: boolean;
    /** Time spent in minutes */
    timeSpentMinutes: number;
    /** Number of retry attempts */
    retryCount: number;
    /** Aggregated section behaviors */
    sectionBehaviors: SectionBehaviorSummary[];
    /** Struggle indicators */
    struggleMetrics: StruggleMetrics;
    /** Success indicators */
    successMetrics: ChapterSuccessMetrics;
}

/**
 * Summarized section behavior for analysis
 */
export interface SectionBehaviorSummary {
    sectionId: string;
    timeSpent: number;
    completed: boolean;
    errorCount: number;
    retryCount: number;
    hintsUsed: number;
    pauseCount: number;
    replayCount: number;
}

/**
 * Metrics indicating struggle during a chapter
 */
export interface StruggleMetrics {
    /** Total errors encountered */
    errorCount: number;
    /** Number of times hints were requested */
    hintsRequested: number;
    /** Number of video replays */
    videoReplays: number;
    /** Number of significant pauses (>30s) */
    significantPauses: number;
    /** Average time on stuck sections (vs expected) */
    avgTimeOverExpected: number;
    /** Whether user abandoned any sections */
    abandonedSections: string[];
    /** Frustration indicators (rapid actions, erratic behavior) */
    frustrationScore: number;
}

/**
 * Metrics indicating success during a chapter
 */
export interface ChapterSuccessMetrics {
    /** Overall completion rate (0-1) */
    completionRate: number;
    /** First-try success rate for exercises */
    firstTrySuccessRate: number;
    /** Speed relative to average (1.0 = average) */
    speedFactor: number;
    /** Quiz accuracy */
    quizAccuracy: number;
    /** Code exercise accuracy */
    codeAccuracy: number;
}

/**
 * Overall journey success metrics
 */
export interface JourneySuccessMetrics {
    /** Total chapters completed */
    chaptersCompleted: number;
    /** Total chapters attempted */
    chaptersAttempted: number;
    /** Overall completion rate */
    completionRate: number;
    /** Average time to complete chapters */
    avgTimePerChapter: number;
    /** Overall struggle score */
    overallStruggleScore: number;
}

/**
 * Learner profile at journey end
 */
export interface JourneyProfile {
    pace: LearnerPace;
    confidence: LearnerConfidence;
    strengthAreas: string[];
    weaknessAreas: string[];
}

// ============================================================================
// IMPLICIT PREREQUISITE TYPES
// ============================================================================

/**
 * An implicit prerequisite derived from collective behavior
 */
export interface ImplicitPrerequisite {
    /** The prerequisite chapter */
    prerequisiteChapterId: ChapterNodeId;
    /** The dependent chapter that benefits from the prerequisite */
    dependentChapterId: ChapterNodeId;
    /** Strength of the relationship (0-1) */
    strength: number;
    /** Confidence in this relationship (0-1) */
    confidence: number;
    /** Evidence supporting this relationship */
    evidence: PrerequisiteEvidence;
    /** When this relationship was last updated */
    lastUpdated: number;
}

/**
 * Evidence supporting an implicit prerequisite
 */
export interface PrerequisiteEvidence {
    /** Number of learners who completed prereq before dependent */
    learnersWithPrereq: number;
    /** Number of learners who attempted dependent without prereq */
    learnersWithoutPrereq: number;
    /** Success rate with prerequisite */
    successRateWithPrereq: number;
    /** Success rate without prerequisite */
    successRateWithoutPrereq: number;
    /** Improvement in struggle metrics with prereq */
    struggleReduction: number;
    /** Improvement in time-to-completion with prereq */
    timeImprovement: number;
    /** Sample journeys demonstrating the pattern */
    sampleJourneyIds: string[];
}

/**
 * Common error pattern that suggests prerequisite need
 */
export interface CommonError {
    /** The error type or category */
    errorType: string;
    /** Chapter where the error occurs */
    chapterId: ChapterNodeId;
    /** Section where the error occurs most */
    sectionId: string;
    /** Frequency of this error (0-1 of learners) */
    frequency: number;
    /** Chapters that help prevent this error */
    preventedByChapters: ChapterNodeId[];
    /** Suggested resolution/explanation */
    resolution: string;
}

/**
 * Struggle point identified from collective behavior
 */
export interface StrugglePoint {
    /** Chapter ID */
    chapterId: ChapterNodeId;
    /** Section ID within the chapter */
    sectionId: string;
    /** Type of struggle */
    struggleType: StruggleType;
    /** Severity score (0-1) */
    severity: number;
    /** Percentage of learners affected */
    affectedPercentage: number;
    /** Most common causes */
    commonCauses: string[];
    /** Chapters that help when completed first */
    beneficialPriorChapters: ChapterNodeId[];
    /** Timestamp of last update */
    lastUpdated: number;
}

export type StruggleType =
    | "conceptual" // Learners don't understand the concept
    | "technical" // Learners have technical difficulties (syntax, tools)
    | "prerequisite" // Learners missing prerequisite knowledge
    | "complexity" // Content is too complex/dense
    | "engagement" // Learners lose interest/focus
    | "pacing"; // Content moves too fast/slow

// ============================================================================
// OPTIMAL PATH TYPES
// ============================================================================

/**
 * An optimal learning path discovered from collective behavior
 */
export interface OptimalPath {
    /** Unique identifier for this path pattern */
    id: string;
    /** Ordered sequence of chapters */
    chapterSequence: ChapterNodeId[];
    /** Number of learners who took this path */
    learnerCount: number;
    /** Success metrics for this path */
    metrics: PathMetrics;
    /** Learner profiles that benefit most from this path */
    suitableFor: PathSuitability;
    /** When this path was last validated */
    lastValidated: number;
}

/**
 * Metrics for an optimal path
 */
export interface PathMetrics {
    /** Average completion rate for this path */
    completionRate: number;
    /** Average time to complete the full path */
    avgCompletionTimeMinutes: number;
    /** Average struggle score (lower is better) */
    avgStruggleScore: number;
    /** Retention rate (learners who continue after each chapter) */
    retentionRate: number;
    /** Success rate on subsequent chapters */
    downstreamSuccessRate: number;
}

/**
 * Profile characteristics suited for a path
 */
export interface PathSuitability {
    /** Suitable pace levels */
    paces: LearnerPace[];
    /** Suitable confidence levels */
    confidences: LearnerConfidence[];
    /** Beneficial for learners with these strengths */
    strengthAreas: string[];
    /** Beneficial for learners with these weaknesses */
    weaknessAreas: string[];
}

// ============================================================================
// EMERGENT CURRICULUM TYPES
// ============================================================================

/**
 * The complete emergent curriculum derived from collective intelligence
 */
export interface EmergentCurriculum {
    /** Version/timestamp for cache invalidation */
    version: string;
    /** When the curriculum was last computed */
    generatedAt: number;
    /** Implicit prerequisites derived from behavior */
    implicitPrerequisites: ImplicitPrerequisite[];
    /** Identified struggle points */
    strugglePoints: StrugglePoint[];
    /** Common errors and their prevention */
    commonErrors: CommonError[];
    /** Discovered optimal paths */
    optimalPaths: OptimalPath[];
    /** Overall curriculum health metrics */
    healthMetrics: CurriculumHealthMetrics;
    /** Recommendations for curriculum improvement */
    recommendations: CurriculumRecommendation[];
}

/**
 * Health metrics for the overall curriculum
 */
export interface CurriculumHealthMetrics {
    /** Total learners analyzed */
    totalLearners: number;
    /** Average completion rate across all chapters */
    avgCompletionRate: number;
    /** Average struggle score across all chapters */
    avgStruggleScore: number;
    /** Number of identified prerequisite relationships */
    prerequisiteCount: number;
    /** Confidence in derived relationships */
    overallConfidence: number;
    /** Chapters with high struggle rates */
    problematicChapters: ChapterNodeId[];
    /** Chapters with excellent success rates */
    successfulChapters: ChapterNodeId[];
}

/**
 * A recommendation for curriculum improvement
 */
export interface CurriculumRecommendation {
    /** Type of recommendation */
    type: RecommendationType;
    /** Priority (1-10, higher = more important) */
    priority: number;
    /** Description of the recommendation */
    description: string;
    /** Affected chapters */
    affectedChapters: ChapterNodeId[];
    /** Suggested action */
    suggestedAction: string;
    /** Expected impact if implemented */
    expectedImpact: string;
    /** Evidence supporting this recommendation */
    evidence: string;
}

export type RecommendationType =
    | "add_prerequisite" // Add a new prerequisite edge
    | "remove_prerequisite" // Remove an unnecessary prerequisite
    | "reorder_content" // Reorder chapters/sections
    | "add_remedial" // Add remedial content
    | "simplify_content" // Simplify complex content
    | "add_practice" // Add more practice exercises
    | "improve_explanation" // Improve explanations for common errors
    | "split_chapter" // Split a chapter that's too complex
    | "merge_chapters"; // Merge chapters that are too simple

// ============================================================================
// AGGREGATION CONFIG
// ============================================================================

/**
 * Configuration for collective intelligence aggregation
 */
export interface CollectiveIntelligenceConfig {
    /** Minimum learners required for statistical significance */
    minLearnersForAnalysis: number;
    /** Confidence threshold for implicit prerequisites */
    prerequisiteConfidenceThreshold: number;
    /** Minimum difference in success rate to establish prerequisite */
    minSuccessRateDifference: number;
    /** Time window for recent data (milliseconds) */
    recentDataWindow: number;
    /** How often to recompute the curriculum (milliseconds) */
    recomputeInterval: number;
    /** Weight for recent data vs historical data */
    recencyWeight: number;
}

export const DEFAULT_COLLECTIVE_INTELLIGENCE_CONFIG: CollectiveIntelligenceConfig = {
    minLearnersForAnalysis: 10,
    prerequisiteConfidenceThreshold: 0.7,
    minSuccessRateDifference: 0.15, // 15% improvement
    recentDataWindow: 30 * 24 * 60 * 60 * 1000, // 30 days
    recomputeInterval: 24 * 60 * 60 * 1000, // 24 hours
    recencyWeight: 0.6,
};
