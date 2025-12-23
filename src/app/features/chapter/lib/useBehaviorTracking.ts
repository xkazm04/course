/**
 * Behavior Tracking Hook
 *
 * Tracks learner behavior events in real-time for the AI Learning Conductor.
 * Captures video interactions, quiz attempts, code execution, and scroll patterns.
 */

"use client";

import { useCallback, useRef, useEffect } from "react";
import {
    behaviorEventStorage,
    sectionBehaviorStorage,
    getDefaultSectionBehavior,
} from "./conductorStorage";
import type {
    BehaviorEvent,
    BehaviorEventType,
    VideoBehavior,
    QuizBehavior,
    CodeBehavior,
    SectionBehavior,
} from "./conductorTypes";

// ============================================================================
// Types
// ============================================================================

export interface UseBehaviorTrackingOptions {
    userId: string;
    courseId: string;
    chapterId: string;
    sectionId: string;
    enabled?: boolean;
    sampleRate?: number; // 0-1, probability of recording each event
}

export interface UseBehaviorTrackingReturn {
    // Generic event tracking
    trackEvent: (type: BehaviorEventType, metadata?: Record<string, unknown>) => void;

    // Video-specific tracking
    trackVideoPause: (timestamp: number) => void;
    trackVideoPlay: (timestamp: number) => void;
    trackVideoSeek: (from: number, to: number) => void;
    trackVideoReplay: (startTime: number, endTime: number) => void;
    trackVideoSpeedChange: (speed: number) => void;
    trackVideoProgress: (watchDuration: number, totalDuration: number) => void;

    // Quiz-specific tracking
    trackQuizAttempt: (questionId: string, correct: boolean, timeSpent: number) => void;
    trackQuizHint: (questionId: string) => void;

    // Code-specific tracking
    trackCodeExecution: (success: boolean, error?: string) => void;
    trackCodeEdit: () => void;
    trackCodeHint: () => void;

    // Section-level tracking
    trackScrollDepth: (depth: number) => void;
    trackSectionComplete: () => void;
    trackSectionRevisit: () => void;

    // Help tracking
    trackHelpRequest: (context: string) => void;
    trackPeerSolutionView: (solutionId: string) => void;

    // Get current behavior state
    getBehavior: () => SectionBehavior;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useBehaviorTracking(
    options: UseBehaviorTrackingOptions
): UseBehaviorTrackingReturn {
    const { userId, courseId, chapterId, sectionId, enabled = true, sampleRate = 1.0 } = options;

    // Track session start time for time calculations
    const sessionStartRef = useRef<number>(Date.now());
    const lastActivityRef = useRef<number>(Date.now());

    // Memoize behavior storage access
    const getBehavior = useCallback((): SectionBehavior => {
        return (
            sectionBehaviorStorage.getBehavior(userId, courseId, chapterId, sectionId) ||
            getDefaultSectionBehavior()
        );
    }, [userId, courseId, chapterId, sectionId]);

    const updateBehavior = useCallback(
        (updater: (current: SectionBehavior) => SectionBehavior): SectionBehavior => {
            return sectionBehaviorStorage.updateBehavior(
                userId,
                courseId,
                chapterId,
                sectionId,
                updater
            );
        },
        [userId, courseId, chapterId, sectionId]
    );

    // Determine if event should be sampled
    const shouldSample = useCallback((): boolean => {
        if (!enabled) return false;
        if (sampleRate >= 1.0) return true;
        return Math.random() < sampleRate;
    }, [enabled, sampleRate]);

    // Generic event tracking
    const trackEvent = useCallback(
        (type: BehaviorEventType, metadata: Record<string, unknown> = {}): void => {
            if (!shouldSample()) return;

            lastActivityRef.current = Date.now();

            behaviorEventStorage.addEvent({
                type,
                sectionId,
                chapterId,
                courseId,
                userId,
                metadata,
            });
        },
        [userId, courseId, chapterId, sectionId, shouldSample]
    );

    // ========================================================================
    // Video Tracking
    // ========================================================================

    const trackVideoPause = useCallback(
        (timestamp: number): void => {
            if (!shouldSample()) return;

            trackEvent("video_pause", { timestamp });

            updateBehavior((current) => ({
                ...current,
                video: {
                    ...current.video,
                    pauseCount: current.video.pauseCount + 1,
                    pauseTimestamps: [...current.video.pauseTimestamps, timestamp],
                },
            }));
        },
        [trackEvent, updateBehavior, shouldSample]
    );

    const trackVideoPlay = useCallback(
        (timestamp: number): void => {
            if (!shouldSample()) return;
            trackEvent("video_play", { timestamp });
        },
        [trackEvent, shouldSample]
    );

    const trackVideoSeek = useCallback(
        (from: number, to: number): void => {
            if (!shouldSample()) return;

            trackEvent("video_seek", { from, to });

            updateBehavior((current) => ({
                ...current,
                video: {
                    ...current.video,
                    seekCount: current.video.seekCount + 1,
                },
            }));
        },
        [trackEvent, updateBehavior, shouldSample]
    );

    const trackVideoReplay = useCallback(
        (startTime: number, endTime: number): void => {
            if (!shouldSample()) return;

            trackEvent("video_replay", { startTime, endTime });

            updateBehavior((current) => ({
                ...current,
                video: {
                    ...current.video,
                    replayCount: current.video.replayCount + 1,
                    replaySegments: [
                        ...current.video.replaySegments,
                        { start: startTime, end: endTime },
                    ],
                },
            }));
        },
        [trackEvent, updateBehavior, shouldSample]
    );

    const trackVideoSpeedChange = useCallback(
        (speed: number): void => {
            if (!shouldSample()) return;

            trackEvent("video_speed_change", { speed });

            updateBehavior((current) => {
                const speedChanges = [...current.video.speedChanges, { speed, timestamp: Date.now() }];
                const avgSpeed =
                    speedChanges.reduce((sum, s) => sum + s.speed, 0) / speedChanges.length;

                return {
                    ...current,
                    video: {
                        ...current.video,
                        speedChanges,
                        averageSpeed: avgSpeed,
                    },
                };
            });
        },
        [trackEvent, updateBehavior, shouldSample]
    );

    const trackVideoProgress = useCallback(
        (watchDuration: number, totalDuration: number): void => {
            if (!shouldSample()) return;

            const completionPercentage = totalDuration > 0 ? (watchDuration / totalDuration) * 100 : 0;

            updateBehavior((current) => ({
                ...current,
                video: {
                    ...current.video,
                    watchDuration,
                    totalDuration,
                    completionPercentage,
                },
            }));
        },
        [updateBehavior, shouldSample]
    );

    // ========================================================================
    // Quiz Tracking
    // ========================================================================

    const trackQuizAttempt = useCallback(
        (questionId: string, correct: boolean, timeSpent: number): void => {
            if (!shouldSample()) return;

            trackEvent(correct ? "quiz_correct" : "quiz_incorrect", {
                questionId,
                timeSpent,
            });

            updateBehavior((current) => {
                const existingResult = current.quiz.questionResults.find(
                    (r) => r.questionId === questionId
                );

                let questionResults;
                if (existingResult) {
                    questionResults = current.quiz.questionResults.map((r) =>
                        r.questionId === questionId
                            ? {
                                  ...r,
                                  correct: r.correct || correct,
                                  attempts: r.attempts + 1,
                                  timeSpent: r.timeSpent + timeSpent,
                              }
                            : r
                    );
                } else {
                    questionResults = [
                        ...current.quiz.questionResults,
                        { questionId, correct, attempts: 1, timeSpent },
                    ];
                }

                const totalTime = questionResults.reduce((sum, r) => sum + r.timeSpent, 0);
                const avgTime = questionResults.length > 0 ? totalTime / questionResults.length : 0;

                return {
                    ...current,
                    quiz: {
                        ...current.quiz,
                        attempts: current.quiz.attempts + 1,
                        correctCount: current.quiz.correctCount + (correct ? 1 : 0),
                        incorrectCount: current.quiz.incorrectCount + (correct ? 0 : 1),
                        averageTimeToAnswer: avgTime,
                        questionResults,
                    },
                };
            });
        },
        [trackEvent, updateBehavior, shouldSample]
    );

    const trackQuizHint = useCallback(
        (questionId: string): void => {
            if (!shouldSample()) return;

            trackEvent("help_request", { type: "quiz_hint", questionId });

            updateBehavior((current) => ({
                ...current,
                quiz: {
                    ...current.quiz,
                    hintsUsed: current.quiz.hintsUsed + 1,
                },
            }));
        },
        [trackEvent, updateBehavior, shouldSample]
    );

    // ========================================================================
    // Code Tracking
    // ========================================================================

    const trackCodeExecution = useCallback(
        (success: boolean, error?: string): void => {
            if (!shouldSample()) return;

            trackEvent(success ? "code_success" : "code_error", { error });

            updateBehavior((current) => {
                const errorTypes = { ...current.code.errorTypes };
                if (!success && error) {
                    const errorKey = extractErrorType(error);
                    errorTypes[errorKey] = (errorTypes[errorKey] || 0) + 1;
                }

                const newSuccessCount = current.code.successCount + (success ? 1 : 0);
                const totalAttempts = current.code.errorCount + newSuccessCount + (success ? 0 : 1);
                const avgAttempts = newSuccessCount > 0 ? totalAttempts / newSuccessCount : totalAttempts;

                return {
                    ...current,
                    code: {
                        ...current.code,
                        errorCount: current.code.errorCount + (success ? 0 : 1),
                        errorTypes,
                        successCount: newSuccessCount,
                        timeTillFirstSuccess:
                            success && current.code.timeTillFirstSuccess === null
                                ? Date.now() - sessionStartRef.current
                                : current.code.timeTillFirstSuccess,
                        averageAttempts: avgAttempts,
                    },
                };
            });
        },
        [trackEvent, updateBehavior, shouldSample]
    );

    const trackCodeEdit = useCallback((): void => {
        if (!shouldSample()) return;

        updateBehavior((current) => ({
            ...current,
            code: {
                ...current.code,
                codeEdits: current.code.codeEdits + 1,
            },
        }));
    }, [updateBehavior, shouldSample]);

    const trackCodeHint = useCallback((): void => {
        if (!shouldSample()) return;

        trackEvent("code_hint_request", {});

        updateBehavior((current) => ({
            ...current,
            code: {
                ...current.code,
                hintsRequested: current.code.hintsRequested + 1,
            },
        }));
    }, [trackEvent, updateBehavior, shouldSample]);

    // ========================================================================
    // Section Tracking
    // ========================================================================

    const trackScrollDepth = useCallback(
        (depth: number): void => {
            if (!shouldSample()) return;

            trackEvent("scroll_depth", { depth });

            updateBehavior((current) => ({
                ...current,
                scrollDepth: Math.max(current.scrollDepth, depth),
            }));
        },
        [trackEvent, updateBehavior, shouldSample]
    );

    const trackSectionComplete = useCallback((): void => {
        if (!shouldSample()) return;

        const timeSpent = Date.now() - sessionStartRef.current;

        trackEvent("section_complete", { timeSpent });

        updateBehavior((current) => ({
            ...current,
            completedAt: Date.now(),
            timeSpent: current.timeSpent + timeSpent,
        }));
    }, [trackEvent, updateBehavior, shouldSample]);

    const trackSectionRevisit = useCallback((): void => {
        if (!shouldSample()) return;

        trackEvent("section_view", { isRevisit: true });

        updateBehavior((current) => ({
            ...current,
            revisitCount: current.revisitCount + 1,
        }));
    }, [trackEvent, updateBehavior, shouldSample]);

    // ========================================================================
    // Help Tracking
    // ========================================================================

    const trackHelpRequest = useCallback(
        (context: string): void => {
            if (!shouldSample()) return;
            trackEvent("help_request", { context });
        },
        [trackEvent, shouldSample]
    );

    const trackPeerSolutionView = useCallback(
        (solutionId: string): void => {
            if (!shouldSample()) return;
            trackEvent("peer_solution_view", { solutionId });
        },
        [trackEvent, shouldSample]
    );

    // ========================================================================
    // Time tracking on section change
    // ========================================================================

    useEffect(() => {
        // Track section view on mount
        if (enabled) {
            trackEvent("section_view", { isRevisit: false });
        }

        // Update time spent on unmount
        return () => {
            if (enabled) {
                const timeSpent = Date.now() - sessionStartRef.current;
                updateBehavior((current) => ({
                    ...current,
                    timeSpent: current.timeSpent + timeSpent,
                }));
            }
        };
    }, [enabled, sectionId, trackEvent, updateBehavior]);

    return {
        trackEvent,
        trackVideoPause,
        trackVideoPlay,
        trackVideoSeek,
        trackVideoReplay,
        trackVideoSpeedChange,
        trackVideoProgress,
        trackQuizAttempt,
        trackQuizHint,
        trackCodeExecution,
        trackCodeEdit,
        trackCodeHint,
        trackScrollDepth,
        trackSectionComplete,
        trackSectionRevisit,
        trackHelpRequest,
        trackPeerSolutionView,
        getBehavior,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract error type from error message for categorization
 */
function extractErrorType(error: string): string {
    const lowerError = error.toLowerCase();

    if (lowerError.includes("syntax")) return "SyntaxError";
    if (lowerError.includes("reference")) return "ReferenceError";
    if (lowerError.includes("type")) return "TypeError";
    if (lowerError.includes("range")) return "RangeError";
    if (lowerError.includes("undefined")) return "UndefinedError";
    if (lowerError.includes("null")) return "NullError";
    if (lowerError.includes("import") || lowerError.includes("module")) return "ModuleError";
    if (lowerError.includes("async") || lowerError.includes("promise")) return "AsyncError";

    return "UnknownError";
}

export default useBehaviorTracking;
