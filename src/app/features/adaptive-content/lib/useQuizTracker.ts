"use client";

import { useCallback, useRef, useEffect } from "react";
import { useAdaptiveContentOptional } from "./AdaptiveContentContext";
import { createQuizSignal } from "./signalCollectors";
import type { QuizResultInput } from "./signalCollectors";

// ============================================================================
// Quiz Tracker Hook
// ============================================================================

interface UseQuizTrackerOptions {
    sectionId: string;
    quizId: string;
}

interface UseQuizTrackerReturn {
    /**
     * Start tracking a quiz attempt
     */
    startAttempt: () => void;

    /**
     * Record the result of a quiz attempt
     */
    recordResult: (correctAnswers: number, totalQuestions: number) => void;

    /**
     * Increment the attempt count (for multiple attempts on same quiz)
     */
    incrementAttempt: () => void;

    /**
     * Get current attempt count
     */
    getAttemptCount: () => number;

    /**
     * Check if tracking is active
     */
    isTracking: boolean;
}

/**
 * Hook for tracking quiz performance and recording it to the adaptive system
 *
 * @example
 * const { startAttempt, recordResult } = useQuizTracker({
 *   sectionId: "hooks-basics",
 *   quizId: "quiz-1",
 * });
 *
 * // When user starts quiz
 * startAttempt();
 *
 * // When quiz is completed
 * recordResult(8, 10); // 8 correct out of 10
 */
export function useQuizTracker(options: UseQuizTrackerOptions): UseQuizTrackerReturn {
    const { sectionId, quizId } = options;
    const context = useAdaptiveContentOptional();

    const startTimeRef = useRef<number | null>(null);
    const attemptCountRef = useRef(0);

    const startAttempt = useCallback(() => {
        startTimeRef.current = Date.now();
    }, []);

    const incrementAttempt = useCallback(() => {
        attemptCountRef.current += 1;
    }, []);

    const recordResult = useCallback(
        (correctAnswers: number, totalQuestions: number) => {
            if (!context) return;

            const endTime = Date.now();
            const startTime = startTimeRef.current ?? endTime;

            const input: QuizResultInput = {
                sectionId,
                quizId,
                correctAnswers,
                totalQuestions,
                attempts: attemptCountRef.current + 1,
                startTime,
                endTime,
            };

            const signal = createQuizSignal(input);
            context.recordSignal(signal);

            // Reset for next attempt
            startTimeRef.current = null;
            attemptCountRef.current += 1;
        },
        [context, sectionId, quizId]
    );

    const getAttemptCount = useCallback(() => {
        return attemptCountRef.current;
    }, []);

    return {
        startAttempt,
        recordResult,
        incrementAttempt,
        getAttemptCount,
        isTracking: !!context,
    };
}

// ============================================================================
// Playground Tracker Hook
// ============================================================================

interface UsePlaygroundTrackerOptions {
    playgroundId: string;
    sectionId?: string;
}

interface RunResult {
    success: boolean;
    hasErrors: boolean;
}

interface UsePlaygroundTrackerReturn {
    /**
     * Start tracking a playground session
     */
    startSession: () => void;

    /**
     * Record a code run result
     */
    recordRun: (result: RunResult) => void;

    /**
     * Record a code edit
     */
    recordEdit: () => void;

    /**
     * Record an error occurrence
     */
    recordError: (errorType: "syntax" | "runtime" | "logic", errorMessage: string) => void;

    /**
     * Submit the session data (call when leaving playground)
     */
    submitSession: () => void;

    /**
     * Get current session stats
     */
    getStats: () => {
        runCount: number;
        successCount: number;
        errorCount: number;
        editCount: number;
    };

    /**
     * Check if tracking is active
     */
    isTracking: boolean;
}

/**
 * Hook for tracking code playground interactions
 *
 * @example
 * const { startSession, recordRun, recordEdit, submitSession } = usePlaygroundTracker({
 *   playgroundId: "pg-1",
 *   sectionId: "hooks-basics",
 * });
 *
 * // When user opens playground
 * useEffect(() => {
 *   startSession();
 *   return () => submitSession();
 * }, []);
 *
 * // When code runs
 * recordRun({ success: true, hasErrors: false });
 *
 * // When code is edited
 * recordEdit();
 */
export function usePlaygroundTracker(
    options: UsePlaygroundTrackerOptions
): UsePlaygroundTrackerReturn {
    const { playgroundId, sectionId } = options;
    const context = useAdaptiveContentOptional();

    const startTimeRef = useRef<number | null>(null);
    const runHistoryRef = useRef<RunResult[]>([]);
    const editCountRef = useRef(0);
    const errorHistoryRef = useRef<string[]>([]);

    const startSession = useCallback(() => {
        startTimeRef.current = Date.now();
        runHistoryRef.current = [];
        editCountRef.current = 0;
        errorHistoryRef.current = [];
    }, []);

    const recordRun = useCallback((result: RunResult) => {
        runHistoryRef.current.push(result);
    }, []);

    const recordEdit = useCallback(() => {
        editCountRef.current += 1;
    }, []);

    const recordError = useCallback(
        (errorType: "syntax" | "runtime" | "logic", errorMessage: string) => {
            if (!context) return;

            errorHistoryRef.current.push(errorMessage);

            // Record error pattern signal
            context.recordSignal({
                type: "errorPattern",
                timestamp: Date.now(),
                playgroundId,
                errorType,
                errorMessage,
                repeatedCount: errorHistoryRef.current.filter((e) => e === errorMessage).length,
            });
        },
        [context, playgroundId]
    );

    const submitSession = useCallback(() => {
        if (!context || !startTimeRef.current) return;

        const successfulRuns = runHistoryRef.current.filter((r) => r.success).length;
        const errorCount = runHistoryRef.current.filter((r) => r.hasErrors).length;

        context.recordPlaygroundInteraction({
            playgroundId,
            runCount: runHistoryRef.current.length,
            errorCount,
            successfulRuns,
            modificationsCount: editCountRef.current,
            timeSpentMs: Date.now() - startTimeRef.current,
        });

        // Reset
        startTimeRef.current = null;
    }, [context, playgroundId]);

    const getStats = useCallback(() => {
        return {
            runCount: runHistoryRef.current.length,
            successCount: runHistoryRef.current.filter((r) => r.success).length,
            errorCount: runHistoryRef.current.filter((r) => r.hasErrors).length,
            editCount: editCountRef.current,
        };
    }, []);

    // Auto-submit on unmount
    useEffect(() => {
        return () => {
            if (startTimeRef.current) {
                submitSession();
            }
        };
    }, [submitSession]);

    return {
        startSession,
        recordRun,
        recordEdit,
        recordError,
        submitSession,
        getStats,
        isTracking: !!context,
    };
}

// ============================================================================
// Navigation Tracker Hook
// ============================================================================

interface UseNavigationTrackerOptions {
    sectionOrder: string[];
}

interface UseNavigationTrackerReturn {
    /**
     * Record navigation from one section to another
     */
    recordNavigation: (fromSection: string, toSection: string) => void;

    /**
     * Set the current section (for time tracking)
     */
    setCurrentSection: (sectionId: string) => void;

    /**
     * Check if tracking is active
     */
    isTracking: boolean;
}

/**
 * Hook for tracking navigation patterns
 */
export function useNavigationTracker(
    options: UseNavigationTrackerOptions
): UseNavigationTrackerReturn {
    const { sectionOrder } = options;
    const context = useAdaptiveContentOptional();

    const sectionStartTimeRef = useRef<number>(Date.now());
    const currentSectionRef = useRef<string | null>(null);

    const setCurrentSection = useCallback((sectionId: string) => {
        currentSectionRef.current = sectionId;
        sectionStartTimeRef.current = Date.now();
    }, []);

    const recordNavigation = useCallback(
        (fromSection: string, toSection: string) => {
            if (!context) return;

            const timeInPreviousSection = Date.now() - sectionStartTimeRef.current;

            context.recordNavigation({
                fromSection,
                toSection,
                isBackward: sectionOrder.indexOf(toSection) < sectionOrder.indexOf(fromSection),
                timeInPreviousSection,
            });

            // Update current section
            setCurrentSection(toSection);
        },
        [context, sectionOrder, setCurrentSection]
    );

    return {
        recordNavigation,
        setCurrentSection,
        isTracking: !!context,
    };
}
