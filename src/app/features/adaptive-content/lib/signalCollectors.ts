/**
 * Signal Collectors
 *
 * Utility functions for collecting behavior signals from various
 * sources and converting them to the standard signal format.
 */

import type {
    QuizSignal,
    PlaygroundSignal,
    SectionTimeSignal,
    ErrorPatternSignal,
    VideoSignal,
    NavigationSignal,
} from "./types";

// ============================================================================
// Quiz Signal Collector
// ============================================================================

export interface QuizResultInput {
    sectionId: string;
    quizId: string;
    correctAnswers: number;
    totalQuestions: number;
    attempts: number;
    startTime: number;
    endTime: number;
}

export function createQuizSignal(input: QuizResultInput): QuizSignal {
    return {
        type: "quiz",
        timestamp: Date.now(),
        sectionId: input.sectionId,
        quizId: input.quizId,
        correctAnswers: input.correctAnswers,
        totalQuestions: input.totalQuestions,
        attemptsUsed: input.attempts,
        timeSpentMs: input.endTime - input.startTime,
    };
}

// ============================================================================
// Playground Signal Collector
// ============================================================================

export interface PlaygroundStatsInput {
    playgroundId: string;
    startTime: number;
    runHistory: Array<{ success: boolean; hasErrors: boolean }>;
    editCount: number;
}

export function createPlaygroundSignal(input: PlaygroundStatsInput): PlaygroundSignal {
    const successfulRuns = input.runHistory.filter((r) => r.success).length;
    const errorCount = input.runHistory.filter((r) => r.hasErrors).length;

    return {
        type: "playground",
        timestamp: Date.now(),
        playgroundId: input.playgroundId,
        runCount: input.runHistory.length,
        errorCount,
        successfulRuns,
        modificationsCount: input.editCount,
        timeSpentMs: Date.now() - input.startTime,
    };
}

// ============================================================================
// Section Time Signal Collector
// ============================================================================

export interface SectionTimeInput {
    sectionId: string;
    enterTime: number;
    exitTime: number;
    maxScrollPercentage: number;
    visitNumber: number;
}

export function createSectionTimeSignal(input: SectionTimeInput): SectionTimeSignal {
    return {
        type: "sectionTime",
        timestamp: Date.now(),
        sectionId: input.sectionId,
        timeSpentMs: input.exitTime - input.enterTime,
        completionPercentage: input.maxScrollPercentage,
        revisitCount: Math.max(0, input.visitNumber - 1),
    };
}

// ============================================================================
// Error Pattern Signal Collector
// ============================================================================

export interface ErrorInput {
    playgroundId: string;
    errorType: "syntax" | "runtime" | "logic";
    errorMessage: string;
    errorHistory: string[]; // Previous error messages
}

export function createErrorPatternSignal(input: ErrorInput): ErrorPatternSignal {
    // Count how many times this same error has occurred
    const repeatedCount = input.errorHistory.filter(
        (msg) => msg === input.errorMessage
    ).length;

    return {
        type: "errorPattern",
        timestamp: Date.now(),
        playgroundId: input.playgroundId,
        errorType: input.errorType,
        errorMessage: input.errorMessage,
        repeatedCount,
    };
}

/**
 * Classify error type from error message
 */
export function classifyErrorType(errorMessage: string): "syntax" | "runtime" | "logic" {
    const lowerMessage = errorMessage.toLowerCase();

    // Syntax errors
    if (
        lowerMessage.includes("unexpected token") ||
        lowerMessage.includes("syntax error") ||
        lowerMessage.includes("unexpected identifier") ||
        lowerMessage.includes("missing") ||
        lowerMessage.includes("unterminated")
    ) {
        return "syntax";
    }

    // Runtime errors
    if (
        lowerMessage.includes("undefined") ||
        lowerMessage.includes("null") ||
        lowerMessage.includes("not a function") ||
        lowerMessage.includes("cannot read") ||
        lowerMessage.includes("is not defined") ||
        lowerMessage.includes("typeerror") ||
        lowerMessage.includes("referenceerror")
    ) {
        return "runtime";
    }

    // Default to logic (assertion failures, wrong output, etc.)
    return "logic";
}

// ============================================================================
// Video Signal Collector
// ============================================================================

export interface VideoStatsInput {
    sectionId: string;
    pauseEvents: number;
    rewindEvents: number;
    playbackSpeed: number;
    currentTime: number;
    totalDuration: number;
    skipEvents: number;
}

export function createVideoSignal(input: VideoStatsInput): VideoSignal {
    const watchedPercentage =
        input.totalDuration > 0
            ? Math.round((input.currentTime / input.totalDuration) * 100)
            : 0;

    return {
        type: "video",
        timestamp: Date.now(),
        sectionId: input.sectionId,
        pauseCount: input.pauseEvents,
        rewindCount: input.rewindEvents,
        playbackSpeed: input.playbackSpeed,
        watchedPercentage,
        skippedSegments: input.skipEvents,
    };
}

// ============================================================================
// Navigation Signal Collector
// ============================================================================

export interface NavigationInput {
    fromSection: string;
    toSection: string;
    sectionOrder: string[]; // Ordered list of section IDs
    timeInFromSection: number;
}

export function createNavigationSignal(input: NavigationInput): NavigationSignal {
    const fromIndex = input.sectionOrder.indexOf(input.fromSection);
    const toIndex = input.sectionOrder.indexOf(input.toSection);
    const isBackward = toIndex < fromIndex;

    return {
        type: "navigation",
        timestamp: Date.now(),
        fromSection: input.fromSection,
        toSection: input.toSection,
        isBackward,
        timeInPreviousSection: input.timeInFromSection,
    };
}

// ============================================================================
// Aggregate Collectors
// ============================================================================

/**
 * Session tracker for collecting signals over a learning session
 */
export class SessionSignalCollector {
    private sectionStartTimes: Map<string, number> = new Map();
    private sectionVisitCounts: Map<string, number> = new Map();
    private sectionScrollMax: Map<string, number> = new Map();
    private currentSection: string | null = null;

    enterSection(sectionId: string): void {
        if (this.currentSection && this.currentSection !== sectionId) {
            // Leaving previous section
            this.leaveSection(this.currentSection);
        }

        this.currentSection = sectionId;
        this.sectionStartTimes.set(sectionId, Date.now());

        const visitCount = (this.sectionVisitCounts.get(sectionId) || 0) + 1;
        this.sectionVisitCounts.set(sectionId, visitCount);
    }

    updateScroll(sectionId: string, percentage: number): void {
        const current = this.sectionScrollMax.get(sectionId) || 0;
        this.sectionScrollMax.set(sectionId, Math.max(current, percentage));
    }

    leaveSection(sectionId: string): SectionTimeSignal | null {
        const startTime = this.sectionStartTimes.get(sectionId);
        if (!startTime) return null;

        const signal = createSectionTimeSignal({
            sectionId,
            enterTime: startTime,
            exitTime: Date.now(),
            maxScrollPercentage: this.sectionScrollMax.get(sectionId) || 0,
            visitNumber: this.sectionVisitCounts.get(sectionId) || 1,
        });

        this.sectionStartTimes.delete(sectionId);

        return signal;
    }

    getCurrentSection(): string | null {
        return this.currentSection;
    }

    getVisitCount(sectionId: string): number {
        return this.sectionVisitCounts.get(sectionId) || 0;
    }
}
