/**
 * Comprehension Engine
 *
 * Calculates comprehension scores from behavior signals using
 * weighted algorithms to build a real-time model of learner understanding.
 */

import type {
    BehaviorSignal,
    ComprehensionLevel,
    ComprehensionScore,
    ComprehensionModel,
    SectionComprehension,
    QuizSignal,
    PlaygroundSignal,
    SectionTimeSignal,
    ErrorPatternSignal,
    VideoSignal,
    NavigationSignal,
} from "./types";

// ============================================================================
// Signal Weights - How much each signal type contributes to comprehension
// ============================================================================

const SIGNAL_WEIGHTS = {
    quiz: 0.35, // Most reliable signal
    playground: 0.25, // Code interactions are meaningful
    video: 0.15, // Video behavior is informative
    sectionTime: 0.15, // Time spent matters
    navigation: 0.05, // Navigation patterns
    errorPattern: 0.05, // Error patterns
};

// ============================================================================
// Individual Signal Scorers
// ============================================================================

/**
 * Score quiz performance (0-100)
 */
function scoreQuizSignal(signal: QuizSignal): number {
    const accuracy = (signal.correctAnswers / signal.totalQuestions) * 100;

    // Penalize for multiple attempts (each retry reduces score)
    const attemptPenalty = Math.max(0, (signal.attemptsUsed - 1) * 10);

    // Adjust for time - very fast might mean guessing, very slow might mean struggling
    const expectedTimePerQuestion = 30000; // 30 seconds
    const expectedTime = expectedTimePerQuestion * signal.totalQuestions;
    const timeRatio = signal.timeSpentMs / expectedTime;

    let timeAdjustment = 0;
    if (timeRatio < 0.3) {
        // Too fast - might be guessing
        timeAdjustment = -10;
    } else if (timeRatio > 3) {
        // Very slow - struggling
        timeAdjustment = -5;
    }

    return Math.max(0, Math.min(100, accuracy - attemptPenalty + timeAdjustment));
}

/**
 * Score playground interactions (0-100)
 */
function scorePlaygroundSignal(signal: PlaygroundSignal): number {
    if (signal.runCount === 0) return 50; // No data

    const successRate = (signal.successfulRuns / signal.runCount) * 100;

    // More modifications generally mean more exploration (positive)
    const modificationBonus = Math.min(10, signal.modificationsCount * 2);

    // High error count relative to runs is concerning
    const errorPenalty = signal.runCount > 0 ? (signal.errorCount / signal.runCount) * 30 : 0;

    return Math.max(0, Math.min(100, successRate + modificationBonus - errorPenalty));
}

/**
 * Score section time behavior (0-100)
 */
function scoreSectionTimeSignal(signal: SectionTimeSignal): number {
    // Base score from completion
    let score = signal.completionPercentage;

    // Revisiting content might indicate confusion (slight penalty)
    // But also could be review (not too harsh)
    const revisitAdjustment = signal.revisitCount > 2 ? -5 * (signal.revisitCount - 2) : 0;

    // Very short time suggests skipping
    if (signal.timeSpentMs < 10000 && signal.completionPercentage < 50) {
        score -= 20;
    }

    return Math.max(0, Math.min(100, score + revisitAdjustment));
}

/**
 * Score error patterns (0-100)
 * Higher score = fewer/less repeated errors
 */
function scoreErrorPatternSignal(signal: ErrorPatternSignal): number {
    // Repeated errors are more concerning
    const baseScore = 100;
    const repeatPenalty = signal.repeatedCount * 15;

    // Syntax errors are more basic than logic errors
    const errorTypePenalty =
        signal.errorType === "syntax" ? 10 : signal.errorType === "runtime" ? 5 : 0;

    return Math.max(0, baseScore - repeatPenalty - errorTypePenalty);
}

/**
 * Score video behavior (0-100)
 */
function scoreVideoSignal(signal: VideoSignal): number {
    let score = signal.watchedPercentage;

    // Rewinding suggests confusion (but not always bad - could be complex content)
    const rewindPenalty = Math.min(15, signal.rewindCount * 3);

    // Too many pauses might indicate struggle
    const pausePenalty = signal.pauseCount > 10 ? (signal.pauseCount - 10) * 2 : 0;

    // Slower playback might indicate difficulty
    if (signal.playbackSpeed < 1) {
        score -= 5;
    }

    // Skipping sections suggests either confidence OR disengagement
    const skipPenalty = signal.skippedSegments * 5;

    return Math.max(0, Math.min(100, score - rewindPenalty - pausePenalty - skipPenalty));
}

/**
 * Score navigation patterns (0-100)
 */
function scoreNavigationSignal(signal: NavigationSignal): number {
    let score = 80; // Base score

    // Going backward frequently suggests confusion
    if (signal.isBackward) {
        score -= 15;
    }

    // Very short time in previous section before navigating away
    if (signal.timeInPreviousSection < 5000) {
        score -= 10; // Quick navigation might mean skipping
    }

    return Math.max(0, Math.min(100, score));
}

// ============================================================================
// Comprehension Score Calculator
// ============================================================================

/**
 * Calculate a single score from a signal
 */
function scoreSignal(signal: BehaviorSignal): number {
    switch (signal.type) {
        case "quiz":
            return scoreQuizSignal(signal);
        case "playground":
            return scorePlaygroundSignal(signal);
        case "sectionTime":
            return scoreSectionTimeSignal(signal);
        case "errorPattern":
            return scoreErrorPatternSignal(signal);
        case "video":
            return scoreVideoSignal(signal);
        case "navigation":
            return scoreNavigationSignal(signal);
        default:
            return 50; // Unknown signal type
    }
}

/**
 * Get the weight for a signal type
 */
function getSignalWeight(signal: BehaviorSignal): number {
    return SIGNAL_WEIGHTS[signal.type] || 0.1;
}

/**
 * Calculate comprehension level from score
 */
function scoreToLevel(score: number): ComprehensionLevel {
    if (score >= 75) return "advanced";
    if (score >= 45) return "intermediate";
    return "beginner";
}

/**
 * Calculate confidence based on signal count and recency
 */
function calculateConfidence(signals: BehaviorSignal[], now: number): number {
    if (signals.length === 0) return 0;

    // More signals = higher confidence (up to a point)
    const countFactor = Math.min(1, signals.length / 10);

    // More recent signals = higher confidence
    const mostRecent = Math.max(...signals.map((s) => s.timestamp));
    const age = now - mostRecent;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const recencyFactor = Math.max(0, 1 - age / maxAge);

    return (countFactor * 0.6 + recencyFactor * 0.4);
}

/**
 * Calculate weighted average score from signals
 */
function calculateWeightedScore(signals: BehaviorSignal[]): number {
    if (signals.length === 0) return 50; // Default to intermediate

    let weightedSum = 0;
    let totalWeight = 0;

    // Group signals by type and take recent ones
    const recentSignals = signals.slice(-50); // Last 50 signals

    for (const signal of recentSignals) {
        const score = scoreSignal(signal);
        const weight = getSignalWeight(signal);

        // Apply time decay - recent signals matter more
        const now = Date.now();
        const age = now - signal.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        const timeDecay = Math.max(0.3, 1 - (age / maxAge) * 0.7);

        weightedSum += score * weight * timeDecay;
        totalWeight += weight * timeDecay;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 50;
}

/**
 * Calculate comprehension score from signals
 */
export function calculateComprehensionScore(signals: BehaviorSignal[]): ComprehensionScore {
    const now = Date.now();
    const score = calculateWeightedScore(signals);
    const confidence = calculateConfidence(signals, now);
    const level = scoreToLevel(score);

    return {
        level,
        score: Math.round(score),
        confidence,
        lastUpdated: now,
    };
}

/**
 * Calculate section-specific comprehension
 */
export function calculateSectionComprehension(
    sectionId: string,
    signals: BehaviorSignal[]
): SectionComprehension {
    // Filter signals for this section
    const sectionSignals = signals.filter((s) => {
        if ("sectionId" in s) return s.sectionId === sectionId;
        if ("playgroundId" in s) return s.playgroundId.includes(sectionId);
        return false;
    });

    return {
        sectionId,
        score: calculateComprehensionScore(sectionSignals),
        signals: sectionSignals,
    };
}

/**
 * Update a comprehension model with a new signal
 */
export function updateComprehensionModel(
    model: ComprehensionModel,
    signal: BehaviorSignal
): ComprehensionModel {
    const newSignalHistory = [...model.signalHistory, signal].slice(-200); // Keep last 200 signals

    // Update overall score
    const overallScore = calculateComprehensionScore(newSignalHistory);

    // Update section-specific score if applicable
    let sectionId: string | null = null;
    if ("sectionId" in signal) {
        sectionId = signal.sectionId;
    } else if ("playgroundId" in signal && signal.type !== "errorPattern") {
        // Try to extract section from playground ID
        const match = signal.playgroundId.match(/section-(\w+)/);
        if (match) sectionId = match[1];
    }

    const sectionScores = { ...model.sectionScores };
    if (sectionId) {
        const existingSection = sectionScores[sectionId];
        const sectionSignals = existingSection?.signals || [];
        sectionScores[sectionId] = calculateSectionComprehension(sectionId, [
            ...sectionSignals,
            signal,
        ]);
    }

    return {
        ...model,
        overallScore,
        sectionScores,
        signalHistory: newSignalHistory,
        lastUpdated: Date.now(),
    };
}

/**
 * Create a new empty comprehension model
 */
export function createComprehensionModel(courseId: string, userId?: string): ComprehensionModel {
    return {
        courseId,
        userId,
        overallScore: {
            level: "intermediate", // Start at intermediate
            score: 50,
            confidence: 0,
            lastUpdated: Date.now(),
        },
        sectionScores: {},
        signalHistory: [],
        lastUpdated: Date.now(),
    };
}

/**
 * Get suggested adaptation based on comprehension
 */
export function getComprehensionInsights(model: ComprehensionModel): {
    trend: "improving" | "stable" | "struggling";
    recentPerformance: number;
    strengths: string[];
    weaknesses: string[];
} {
    const signals = model.signalHistory;
    const recentSignals = signals.slice(-20);
    const olderSignals = signals.slice(-40, -20);

    const recentScore = calculateWeightedScore(recentSignals);
    const olderScore = calculateWeightedScore(olderSignals);

    let trend: "improving" | "stable" | "struggling" = "stable";
    if (recentScore > olderScore + 10) {
        trend = "improving";
    } else if (recentScore < olderScore - 10) {
        trend = "struggling";
    }

    // Analyze signal types for strengths/weaknesses
    const typeScores: Record<string, number[]> = {};
    for (const signal of recentSignals) {
        if (!typeScores[signal.type]) {
            typeScores[signal.type] = [];
        }
        typeScores[signal.type].push(scoreSignal(signal));
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    for (const [type, scores] of Object.entries(typeScores)) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg >= 75) {
            strengths.push(type === "quiz" ? "Quizzes" : type === "playground" ? "Code Practice" : type);
        } else if (avg <= 40) {
            weaknesses.push(type === "quiz" ? "Quizzes" : type === "playground" ? "Code Practice" : type);
        }
    }

    return {
        trend,
        recentPerformance: Math.round(recentScore),
        strengths,
        weaknesses,
    };
}
