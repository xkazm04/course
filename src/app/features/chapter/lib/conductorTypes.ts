/**
 * AI Learning Conductor Types
 *
 * Types for the AI-powered learning conductor that observes learner behavior
 * and orchestrates adaptive learning experiences across all users.
 */

// ============================================================================
// Behavior Event Types
// ============================================================================

export type BehaviorEventType =
    | "video_pause"
    | "video_play"
    | "video_seek"
    | "video_replay"
    | "video_speed_change"
    | "section_view"
    | "section_complete"
    | "quiz_attempt"
    | "quiz_correct"
    | "quiz_incorrect"
    | "code_error"
    | "code_success"
    | "code_hint_request"
    | "scroll_depth"
    | "time_on_section"
    | "help_request"
    | "peer_solution_view";

export interface BehaviorEvent {
    id: string;
    type: BehaviorEventType;
    timestamp: number;
    sectionId: string;
    chapterId: string;
    courseId: string;
    userId: string;
    metadata: Record<string, unknown>;
}

export interface VideoBehavior {
    pauseCount: number;
    pauseTimestamps: number[];
    replayCount: number;
    replaySegments: Array<{ start: number; end: number }>;
    seekCount: number;
    speedChanges: Array<{ speed: number; timestamp: number }>;
    averageSpeed: number;
    watchDuration: number;
    totalDuration: number;
    completionPercentage: number;
}

export interface QuizBehavior {
    attempts: number;
    correctCount: number;
    incorrectCount: number;
    averageTimeToAnswer: number;
    hintsUsed: number;
    questionResults: Array<{
        questionId: string;
        correct: boolean;
        attempts: number;
        timeSpent: number;
    }>;
}

export interface CodeBehavior {
    errorCount: number;
    errorTypes: Record<string, number>;
    successCount: number;
    hintsRequested: number;
    timeTillFirstSuccess: number | null;
    averageAttempts: number;
    codeEdits: number;
}

export interface SectionBehavior {
    timeSpent: number;
    scrollDepth: number;
    revisitCount: number;
    completedAt: number | null;
    video: VideoBehavior;
    quiz: QuizBehavior;
    code: CodeBehavior;
}

// ============================================================================
// Learner Profile Types
// ============================================================================

export type LearnerPace = "struggling" | "slow" | "normal" | "fast" | "accelerated";
export type LearnerConfidence = "low" | "moderate" | "high" | "expert";
export type ContentDepth = "remedial" | "basic" | "standard" | "advanced" | "expert";

export interface LearnerProfile {
    userId: string;
    courseId: string;
    pace: LearnerPace;
    confidence: LearnerConfidence;
    preferredContentDepth: ContentDepth;
    strengths: string[];
    weaknesses: string[];
    learningStyle: {
        prefersVideo: number; // 0-1 score
        prefersCode: number;
        prefersText: number;
        prefersInteractive: number;
    };
    engagementScore: number; // 0-100
    retentionScore: number; // 0-100
    lastUpdated: number;
}

// ============================================================================
// Orchestration Types
// ============================================================================

export type OrchestrationAction =
    | "inject_remedial"
    | "skip_section"
    | "suggest_peer_solution"
    | "slow_down"
    | "accelerate"
    | "reorder_sections"
    | "add_practice"
    | "reduce_content"
    | "expand_content"
    | "suggest_break"
    | "celebrate_progress";

export interface OrchestrationDecision {
    id: string;
    action: OrchestrationAction;
    sectionId: string;
    priority: number; // 1-10, higher is more important
    reason: string;
    metadata: Record<string, unknown>;
    createdAt: number;
    executed: boolean;
    executedAt?: number;
}

export interface RemedialContent {
    id: string;
    title: string;
    type: "video" | "text" | "interactive" | "quiz";
    topic: string;
    prerequisiteFor: string[];
    content: {
        summary: string;
        keyPoints: string[];
        codeExample?: string;
        videoUrl?: string;
    };
    estimatedTime: string;
}

export interface PeerSolution {
    id: string;
    sectionId: string;
    chapterId: string;
    questionId?: string;
    codeChallenge?: string;
    solutionType: "explanation" | "code" | "approach" | "debugging";
    content: string;
    authorId: string;
    authorLevel: LearnerConfidence;
    upvotes: number;
    helpfulnessScore: number;
    createdAt: number;
    tags: string[];
}

// ============================================================================
// Section Reordering Types
// ============================================================================

export interface SectionPriority {
    sectionId: string;
    originalOrder: number;
    adjustedOrder: number;
    reason: string;
    confidence: number; // 0-1
}

export interface OptimizedSectionOrder {
    sections: SectionPriority[];
    optimizationStrategy: "struggling_learner" | "confident_learner" | "engagement_based" | "standard";
    appliedAt: number;
}

// ============================================================================
// Collective Intelligence Types
// ============================================================================

export interface CollectiveInsight {
    sectionId: string;
    chapterId: string;
    // Aggregated behavior patterns across all users
    averageTimeSpent: number;
    medianTimeSpent: number;
    dropoffRate: number;
    strugglePoints: Array<{
        timestamp: number;
        pauseFrequency: number;
        replayFrequency: number;
    }>;
    commonErrors: Array<{
        errorType: string;
        frequency: number;
        resolution: string;
    }>;
    successPatterns: Array<{
        pattern: string;
        successRate: number;
    }>;
    peerSolutionUsage: number;
    // Best performing learner paths
    optimalPaths: Array<{
        sectionOrder: string[];
        averageCompletionTime: number;
        successRate: number;
        learnerCount: number;
    }>;
}

export interface PlatformIntelligence {
    totalLearners: number;
    activeLearners: number;
    averageCompletionRate: number;
    averageEngagementScore: number;
    topStruggleAreas: Array<{ sectionId: string; struggleScore: number }>;
    topSuccessPatterns: Array<{ pattern: string; effectiveness: number }>;
    lastUpdated: number;
}

// ============================================================================
// Conductor State Types
// ============================================================================

export interface ConductorState {
    isActive: boolean;
    userId: string;
    courseId: string;
    chapterId: string;
    currentSectionId: string;
    learnerProfile: LearnerProfile;
    sectionBehaviors: Record<string, SectionBehavior>;
    pendingDecisions: OrchestrationDecision[];
    executedDecisions: OrchestrationDecision[];
    optimizedOrder: OptimizedSectionOrder | null;
    injectedContent: RemedialContent[];
    suggestedPeerSolutions: PeerSolution[];
    collectiveInsights: CollectiveInsight[];
    sessionStartedAt: number;
    lastActivityAt: number;
}

export interface ConductorConfig {
    enableBehaviorTracking: boolean;
    enableAdaptiveOrdering: boolean;
    enableRemedialInjection: boolean;
    enablePeerSolutions: boolean;
    enableAcceleration: boolean;
    behaviorSampleRate: number; // 0-1, how often to sample behavior
    minSamplesForDecision: number;
    confidenceThreshold: number; // 0-1, min confidence to act
    decisionCooldownMs: number; // Minimum time between decisions
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseConductorReturn {
    state: ConductorState;
    config: ConductorConfig;

    // Behavior tracking
    trackEvent: (event: Omit<BehaviorEvent, "id" | "timestamp" | "userId" | "courseId" | "chapterId">) => void;
    trackVideoBehavior: (behavior: Partial<VideoBehavior>) => void;
    trackQuizAttempt: (questionId: string, correct: boolean, timeSpent: number) => void;
    trackCodeExecution: (success: boolean, error?: string) => void;

    // Orchestration
    getNextDecision: () => OrchestrationDecision | null;
    executeDecision: (decisionId: string) => void;
    dismissDecision: (decisionId: string) => void;

    // Content
    getRemedialContent: (topic: string) => RemedialContent[];
    getPeerSolutions: (sectionId: string, context?: string) => PeerSolution[];
    getSectionOrder: () => SectionPriority[];

    // Profile
    getLearnerProfile: () => LearnerProfile;
    updateProfile: (updates: Partial<LearnerProfile>) => void;

    // Collective
    getCollectiveInsights: (sectionId: string) => CollectiveInsight | null;
    contributeInsight: (insight: Partial<CollectiveInsight>) => void;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_CONDUCTOR_CONFIG: ConductorConfig = {
    enableBehaviorTracking: true,
    enableAdaptiveOrdering: true,
    enableRemedialInjection: true,
    enablePeerSolutions: true,
    enableAcceleration: true,
    behaviorSampleRate: 1.0,
    minSamplesForDecision: 3,
    confidenceThreshold: 0.7,
    decisionCooldownMs: 30000, // 30 seconds
};

export const DEFAULT_VIDEO_BEHAVIOR: VideoBehavior = {
    pauseCount: 0,
    pauseTimestamps: [],
    replayCount: 0,
    replaySegments: [],
    seekCount: 0,
    speedChanges: [],
    averageSpeed: 1.0,
    watchDuration: 0,
    totalDuration: 0,
    completionPercentage: 0,
};

export const DEFAULT_QUIZ_BEHAVIOR: QuizBehavior = {
    attempts: 0,
    correctCount: 0,
    incorrectCount: 0,
    averageTimeToAnswer: 0,
    hintsUsed: 0,
    questionResults: [],
};

export const DEFAULT_CODE_BEHAVIOR: CodeBehavior = {
    errorCount: 0,
    errorTypes: {},
    successCount: 0,
    hintsRequested: 0,
    timeTillFirstSuccess: null,
    averageAttempts: 0,
    codeEdits: 0,
};

export const DEFAULT_SECTION_BEHAVIOR: SectionBehavior = {
    timeSpent: 0,
    scrollDepth: 0,
    revisitCount: 0,
    completedAt: null,
    video: DEFAULT_VIDEO_BEHAVIOR,
    quiz: DEFAULT_QUIZ_BEHAVIOR,
    code: DEFAULT_CODE_BEHAVIOR,
};

export const DEFAULT_LEARNER_PROFILE: Omit<LearnerProfile, "userId" | "courseId"> = {
    pace: "normal",
    confidence: "moderate",
    preferredContentDepth: "standard",
    strengths: [],
    weaknesses: [],
    learningStyle: {
        prefersVideo: 0.5,
        prefersCode: 0.5,
        prefersText: 0.5,
        prefersInteractive: 0.5,
    },
    engagementScore: 50,
    retentionScore: 50,
    lastUpdated: Date.now(),
};
