/**
 * Adaptive Content Density System - Types
 *
 * Defines types for tracking learner behavior signals and computing
 * comprehension levels to dynamically adjust content complexity.
 */

// ============================================================================
// Comprehension Levels
// ============================================================================

export type ComprehensionLevel = "beginner" | "intermediate" | "advanced";

export interface ComprehensionScore {
    level: ComprehensionLevel;
    score: number; // 0-100
    confidence: number; // 0-1, how confident we are in this assessment
    lastUpdated: number; // timestamp
}

// ============================================================================
// Behavior Signals
// ============================================================================

/**
 * Quiz performance signal
 */
export interface QuizSignal {
    type: "quiz";
    timestamp: number;
    sectionId: string;
    quizId: string;
    correctAnswers: number;
    totalQuestions: number;
    attemptsUsed: number; // higher attempts = lower comprehension
    timeSpentMs: number;
}

/**
 * Code playground interaction signal
 */
export interface PlaygroundSignal {
    type: "playground";
    timestamp: number;
    playgroundId: string;
    runCount: number;
    errorCount: number;
    successfulRuns: number;
    modificationsCount: number; // how many changes made
    timeSpentMs: number;
}

/**
 * Section time signal
 */
export interface SectionTimeSignal {
    type: "sectionTime";
    timestamp: number;
    sectionId: string;
    timeSpentMs: number;
    completionPercentage: number; // how far they scrolled/watched
    revisitCount: number; // how many times they came back
}

/**
 * Error pattern signal (from code playground)
 */
export interface ErrorPatternSignal {
    type: "errorPattern";
    timestamp: number;
    playgroundId: string;
    errorType: string; // "syntax" | "runtime" | "logic"
    errorMessage: string;
    repeatedCount: number; // same error happening multiple times
}

/**
 * Video playback signal
 */
export interface VideoSignal {
    type: "video";
    timestamp: number;
    sectionId: string;
    pauseCount: number;
    rewindCount: number; // rewinding suggests confusion
    playbackSpeed: number;
    watchedPercentage: number;
    skippedSegments: number;
}

/**
 * Navigation pattern signal
 */
export interface NavigationSignal {
    type: "navigation";
    timestamp: number;
    fromSection: string;
    toSection: string;
    isBackward: boolean; // going back might indicate confusion
    timeInPreviousSection: number;
}

/**
 * Union of all behavior signals
 */
export type BehaviorSignal =
    | QuizSignal
    | PlaygroundSignal
    | SectionTimeSignal
    | ErrorPatternSignal
    | VideoSignal
    | NavigationSignal;

// ============================================================================
// Comprehension Model
// ============================================================================

/**
 * Per-section comprehension data
 */
export interface SectionComprehension {
    sectionId: string;
    score: ComprehensionScore;
    signals: BehaviorSignal[];
}

/**
 * Course-level comprehension model
 */
export interface ComprehensionModel {
    courseId: string;
    userId?: string; // optional for guest users
    overallScore: ComprehensionScore;
    sectionScores: Record<string, SectionComprehension>;
    signalHistory: BehaviorSignal[];
    lastUpdated: number;
}

// ============================================================================
// Adaptive Content Configuration
// ============================================================================

/**
 * Content adaptation rules for each comprehension level
 */
export interface AdaptationConfig {
    level: ComprehensionLevel;
    showSimplifiedExamples: boolean;
    showAdvancedChallenges: boolean;
    showAdditionalExplanations: boolean;
    codeExampleComplexity: "simple" | "standard" | "advanced";
    quizDifficulty: "easy" | "medium" | "hard";
    showHints: boolean;
    showDeepDives: boolean;
    paceRecommendation: "slower" | "normal" | "faster";
}

/**
 * Default adaptation configs
 */
export const DEFAULT_ADAPTATION_CONFIGS: Record<ComprehensionLevel, AdaptationConfig> = {
    beginner: {
        level: "beginner",
        showSimplifiedExamples: true,
        showAdvancedChallenges: false,
        showAdditionalExplanations: true,
        codeExampleComplexity: "simple",
        quizDifficulty: "easy",
        showHints: true,
        showDeepDives: false,
        paceRecommendation: "slower",
    },
    intermediate: {
        level: "intermediate",
        showSimplifiedExamples: false,
        showAdvancedChallenges: false,
        showAdditionalExplanations: false,
        codeExampleComplexity: "standard",
        quizDifficulty: "medium",
        showHints: false,
        showDeepDives: false,
        paceRecommendation: "normal",
    },
    advanced: {
        level: "advanced",
        showSimplifiedExamples: false,
        showAdvancedChallenges: true,
        showAdditionalExplanations: false,
        codeExampleComplexity: "advanced",
        quizDifficulty: "hard",
        showHints: false,
        showDeepDives: true,
        paceRecommendation: "faster",
    },
};

// ============================================================================
// Content Slot Adaptations
// ============================================================================

/**
 * Additional slot that can be injected based on comprehension
 */
export interface AdaptiveSlot {
    slotType: "explanation" | "example" | "challenge" | "hint" | "deepDive";
    targetLevel: ComprehensionLevel[];
    priority: number; // higher = show first
    content: AdaptiveSlotContent;
}

export interface AdaptiveSlotContent {
    title: string;
    description: string;
    code?: string;
    codeLanguage?: string;
    points?: string[];
}

/**
 * Section-specific adaptive content
 */
export interface SectionAdaptiveContent {
    sectionId: string;
    additionalSlots: AdaptiveSlot[];
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StoredComprehensionData {
    model: ComprehensionModel;
    version: number; // for migrations
}

export const COMPREHENSION_STORAGE_KEY = "adaptive-comprehension";
export const COMPREHENSION_VERSION = 1;
