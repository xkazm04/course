/**
 * Adaptive Learning Path Types
 *
 * Type definitions for the AI-powered adaptive learning system that
 * dynamically generates personalized learning paths based on user
 * behavior, skill gaps, career goals, and job market data.
 */

import type { CurriculumNode, CurriculumCategory } from "@/app/features/overview/lib/curriculumTypes";

// ============================================================================
// USER PROFILE & BEHAVIOR TYPES
// ============================================================================

/**
 * Tracks a user's learning session for behavior analysis.
 */
export interface LearningSession {
    /** Session unique identifier */
    id: string;
    /** Start time of the session */
    startTime: Date;
    /** End time of the session (null if ongoing) */
    endTime: Date | null;
    /** Node IDs viewed during this session */
    nodesViewed: string[];
    /** Time spent on each node in seconds */
    timePerNode: Record<string, number>;
    /** Exercises completed */
    exercisesCompleted: number;
    /** Quiz scores achieved */
    quizScores: number[];
}

/**
 * Represents a skill level assessment for a user.
 */
export interface SkillAssessment {
    /** Skill identifier */
    skillId: string;
    /** Skill name */
    skillName: string;
    /** Current proficiency level (0-100) */
    proficiency: number;
    /** Confidence level in the assessment (0-100) */
    confidence: number;
    /** Last time this skill was assessed */
    lastAssessed: Date;
    /** Evidence sources for this assessment */
    sources: ("quiz" | "exercise" | "completion" | "time_spent")[];
}

/**
 * User's declared career goal for path optimization.
 */
export interface CareerObjective {
    /** Goal identifier */
    id: string;
    /** Job title or role being targeted */
    targetRole: string;
    /** Industry focus */
    industry?: string;
    /** Target timeline in months */
    targetTimelineMonths: number;
    /** Priority level for this goal */
    priority: "primary" | "secondary" | "exploratory";
    /** Required skills for this role */
    requiredSkills: string[];
    /** Desired salary range */
    salaryRange?: { min: number; max: number };
}

/**
 * User profile containing all learning context.
 */
export interface LearnerProfile {
    /** User identifier */
    userId: string;
    /** Available hours per week for learning */
    availableHoursPerWeek: number;
    /** Preferred learning time of day */
    preferredTimeOfDay: "morning" | "afternoon" | "evening" | "night";
    /** Learning style preference */
    learningStyle: "visual" | "reading" | "hands-on" | "mixed";
    /** Current skill assessments */
    skills: SkillAssessment[];
    /** Career objectives */
    careerGoals: CareerObjective[];
    /** Learning session history */
    sessions: LearningSession[];
    /** Completed node IDs */
    completedNodes: string[];
    /** In-progress node IDs */
    inProgressNodes: string[];
    /** Bookmarked node IDs */
    bookmarkedNodes: string[];
    /** Last active timestamp */
    lastActiveAt: Date;
    /** Total learning hours logged */
    totalLearningHours: number;
    /** Current learning streak in days */
    currentStreak: number;
    /** Preferred difficulty level */
    difficultyPreference: "easier" | "optimal" | "challenging";
}

// ============================================================================
// PREDICTION & RECOMMENDATION TYPES
// ============================================================================

/**
 * AI prediction for node completion probability.
 */
export interface CompletionPrediction {
    /** Node ID this prediction is for */
    nodeId: string;
    /** Probability of completion (0-1) */
    probability: number;
    /** Confidence in this prediction (0-1) */
    confidence: number;
    /** Estimated time to complete in hours */
    estimatedHours: number;
    /** Factors affecting this prediction */
    factors: PredictionFactor[];
    /** Recommended prerequisites to complete first */
    recommendedPrerequisites: string[];
    /** Predicted struggle points */
    potentialChallenges: string[];
}

/**
 * Factor contributing to a prediction.
 */
export interface PredictionFactor {
    /** Factor type */
    type: "skill_match" | "time_available" | "prerequisite_completion" | "learning_velocity" | "difficulty_match" | "interest_alignment";
    /** Factor weight in prediction (0-1) */
    weight: number;
    /** Factor value */
    value: number;
    /** Human-readable description */
    description: string;
    /** Impact direction */
    impact: "positive" | "negative" | "neutral";
}

/**
 * Path recommendation from the AI system.
 */
export interface PathRecommendation {
    /** Unique recommendation ID */
    id: string;
    /** Recommended path name */
    name: string;
    /** Path description */
    description: string;
    /** Ordered list of node IDs in this path */
    nodeIds: string[];
    /** Total estimated hours for the path */
    totalHours: number;
    /** Overall difficulty level */
    difficulty: "beginner" | "intermediate" | "advanced" | "expert";
    /** How well this matches user's goals (0-1) */
    goalAlignment: number;
    /** How optimal this path is given constraints (0-1) */
    optimality: number;
    /** Career goals this path supports */
    supportsGoals: string[];
    /** Skills that will be developed */
    skillsGained: string[];
    /** Job roles this path prepares for */
    targetRoles: string[];
    /** Reasons why this path is recommended */
    reasoning: string[];
    /** Expected completion date based on user's pace */
    expectedCompletionDate: Date;
}

/**
 * Real-time adaptation suggestion.
 */
export interface AdaptationSuggestion {
    /** Suggestion type */
    type: "path_adjustment" | "pace_change" | "skill_boost" | "break_suggestion" | "goal_refinement";
    /** Severity/importance level */
    severity: "info" | "suggestion" | "recommendation" | "urgent";
    /** Title of the suggestion */
    title: string;
    /** Detailed message */
    message: string;
    /** Suggested action */
    action: {
        type: "navigate" | "update_goal" | "take_break" | "review_content" | "skip_node";
        targetNodeId?: string;
        metadata?: Record<string, unknown>;
    };
    /** When this suggestion was generated */
    generatedAt: Date;
    /** Expiration time for this suggestion */
    expiresAt: Date;
}

// ============================================================================
// JOB MARKET INTEGRATION TYPES
// ============================================================================

/**
 * Job market data for a specific role.
 */
export interface JobMarketData {
    /** Role title */
    role: string;
    /** Number of job postings */
    demandScore: number;
    /** Trend direction */
    trend: "growing" | "stable" | "declining";
    /** Average salary range */
    salaryRange: { min: number; max: number; median: number };
    /** Top skills in demand */
    topSkills: Array<{ skill: string; frequency: number }>;
    /** Top companies hiring */
    topCompanies: string[];
    /** Remote work percentage */
    remotePercentage: number;
    /** Experience level distribution */
    experienceDistribution: {
        entry: number;
        mid: number;
        senior: number;
        lead: number;
    };
    /** Last updated timestamp */
    lastUpdated: Date;
}

/**
 * Skill gap analysis result.
 */
export interface SkillGapAnalysis {
    /** Current skills the user has */
    currentSkills: Array<{ skill: string; level: number }>;
    /** Required skills for target role */
    requiredSkills: Array<{ skill: string; minLevel: number }>;
    /** Identified gaps */
    gaps: Array<{
        skill: string;
        currentLevel: number;
        requiredLevel: number;
        gapSize: number;
        priority: "critical" | "important" | "nice-to-have";
        relatedNodes: string[];
    }>;
    /** Overall gap score (0-100, lower is better) */
    overallGapScore: number;
    /** Estimated time to close gaps */
    estimatedTimeToClose: number;
}

// ============================================================================
// LEARNING VELOCITY & ANALYTICS TYPES
// ============================================================================

/**
 * Learning velocity metrics.
 */
export interface LearningVelocity {
    /** Nodes completed per week */
    nodesPerWeek: number;
    /** Hours spent learning per week */
    hoursPerWeek: number;
    /** Average time per node (hours) */
    averageTimePerNode: number;
    /** Completion rate for started nodes */
    completionRate: number;
    /** Quiz performance average */
    averageQuizScore: number;
    /** Trend over last 4 weeks */
    weeklyTrend: number[];
    /** Velocity classification */
    classification: "slow" | "steady" | "fast" | "accelerating" | "decelerating";
    /** Consistency score (0-1) */
    consistencyScore: number;
}

/**
 * Aggregate analytics for adaptive recommendations.
 */
export interface LearningAnalytics {
    /** User's learning velocity */
    velocity: LearningVelocity;
    /** Skill gap analysis */
    skillGaps: SkillGapAnalysis;
    /** Time-based patterns */
    patterns: {
        mostProductiveDay: string;
        mostProductiveHour: number;
        averageSessionLength: number;
        preferredCategories: CurriculumCategory[];
    };
    /** Engagement metrics */
    engagement: {
        streakDays: number;
        longestStreak: number;
        activeWeeksCount: number;
        returnRate: number;
    };
    /** Predicted outcomes */
    predictions: {
        expectedCompletionDate: Date | null;
        confidenceLevel: number;
        riskFactors: string[];
    };
}

// ============================================================================
// CONTEXT STATE TYPES
// ============================================================================

/**
 * Adaptive learning context state.
 */
export interface AdaptiveLearningState {
    /** Current learner profile */
    profile: LearnerProfile | null;
    /** Active recommendations */
    recommendations: PathRecommendation[];
    /** Node completion predictions */
    predictions: Record<string, CompletionPrediction>;
    /** Current suggestions */
    suggestions: AdaptationSuggestion[];
    /** Job market data cache */
    jobMarketData: Record<string, JobMarketData>;
    /** Overall analytics */
    analytics: LearningAnalytics | null;
    /** Whether data is being loaded */
    isLoading: boolean;
    /** Last refresh timestamp */
    lastRefresh: Date | null;
    /** Active learning session */
    activeSession: LearningSession | null;
}

/**
 * Actions for adaptive learning context.
 */
export type AdaptiveLearningAction =
    | { type: "SET_PROFILE"; payload: LearnerProfile }
    | { type: "UPDATE_PROFILE"; payload: Partial<LearnerProfile> }
    | { type: "SET_RECOMMENDATIONS"; payload: PathRecommendation[] }
    | { type: "SET_PREDICTIONS"; payload: Record<string, CompletionPrediction> }
    | { type: "ADD_SUGGESTION"; payload: AdaptationSuggestion }
    | { type: "DISMISS_SUGGESTION"; payload: string }
    | { type: "SET_ANALYTICS"; payload: LearningAnalytics }
    | { type: "SET_JOB_MARKET_DATA"; payload: { role: string; data: JobMarketData } }
    | { type: "START_SESSION"; payload: LearningSession }
    | { type: "END_SESSION" }
    | { type: "RECORD_NODE_VIEW"; payload: { nodeId: string; duration: number } }
    | { type: "RECORD_NODE_COMPLETION"; payload: string }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "REFRESH" };

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Request body for getting path recommendations.
 */
export interface GetRecommendationsRequest {
    profile: LearnerProfile;
    currentNodeId?: string;
    maxPaths?: number;
    focusGoalId?: string;
}

/**
 * Response from path recommendations API.
 */
export interface GetRecommendationsResponse {
    recommendations: PathRecommendation[];
    predictions: Record<string, CompletionPrediction>;
    suggestions: AdaptationSuggestion[];
    analytics: LearningAnalytics;
}

/**
 * Request for skill gap analysis.
 */
export interface SkillGapRequest {
    currentSkills: Array<{ skill: string; level: number }>;
    targetRole: string;
}

/**
 * Request for job market data.
 */
export interface JobMarketRequest {
    roles: string[];
    location?: string;
}
