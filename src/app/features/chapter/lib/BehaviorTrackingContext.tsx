/**
 * Behavior Tracking Context
 *
 * Provides behavior tracking callbacks to slot renderers without prop drilling.
 * This enables the AI Learning Conductor to track user interactions with video,
 * quiz, and code components for adaptive content orchestration.
 */

"use client";

import React, { createContext, useContext, useMemo, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

export interface BehaviorTrackingCallbacks {
    // Video tracking
    onVideoPause?: (timestamp: number) => void;
    onVideoPlay?: (timestamp: number) => void;
    onVideoSeek?: (from: number, to: number) => void;
    onVideoReplay?: (startTime: number, endTime: number) => void;
    onVideoSpeedChange?: (speed: number) => void;
    onVideoProgress?: (watchDuration: number, totalDuration: number) => void;

    // Quiz tracking
    onQuizAttempt?: (questionId: string, correct: boolean, timeSpent: number) => void;
    onQuizHint?: (questionId: string) => void;
    onQuizComplete?: (score: number, totalQuestions: number) => void;

    // Code tracking
    onCodeExecution?: (success: boolean, error?: string) => void;
    onCodeEdit?: () => void;
    onCodeHint?: () => void;

    // Section tracking
    onSectionComplete?: (sectionId: string) => void;
}

interface BehaviorTrackingContextValue {
    /**
     * Whether behavior tracking is enabled
     */
    enabled: boolean;

    /**
     * Tracking callbacks for various user interactions
     */
    callbacks: BehaviorTrackingCallbacks;

    /**
     * Track a video pause event
     */
    trackVideoPause: (timestamp: number) => void;

    /**
     * Track a video play event
     */
    trackVideoPlay: (timestamp: number) => void;

    /**
     * Track a video seek event
     */
    trackVideoSeek: (from: number, to: number) => void;

    /**
     * Track a video replay event
     */
    trackVideoReplay: (startTime: number, endTime: number) => void;

    /**
     * Track a video speed change event
     */
    trackVideoSpeedChange: (speed: number) => void;

    /**
     * Track video progress
     */
    trackVideoProgress: (watchDuration: number, totalDuration: number) => void;

    /**
     * Track a quiz attempt
     */
    trackQuizAttempt: (questionId: string, correct: boolean, timeSpent: number) => void;

    /**
     * Track a quiz hint request
     */
    trackQuizHint: (questionId: string) => void;

    /**
     * Track quiz completion
     */
    trackQuizComplete: (score: number, totalQuestions: number) => void;

    /**
     * Track code execution
     */
    trackCodeExecution: (success: boolean, error?: string) => void;

    /**
     * Track code edit
     */
    trackCodeEdit: () => void;

    /**
     * Track code hint request
     */
    trackCodeHint: () => void;

    /**
     * Track section completion
     */
    trackSectionComplete: (sectionId: string) => void;
}

// ============================================================================
// Context
// ============================================================================

const BehaviorTrackingContext = createContext<BehaviorTrackingContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export interface BehaviorTrackingProviderProps {
    children: React.ReactNode;
    enabled?: boolean;
    callbacks?: BehaviorTrackingCallbacks;
}

export function BehaviorTrackingProvider({
    children,
    enabled = true,
    callbacks = {},
}: BehaviorTrackingProviderProps) {
    // Memoize wrapper functions that check enabled state
    const trackVideoPause = useCallback(
        (timestamp: number) => {
            if (enabled && callbacks.onVideoPause) {
                callbacks.onVideoPause(timestamp);
            }
        },
        [enabled, callbacks]
    );

    const trackVideoPlay = useCallback(
        (timestamp: number) => {
            if (enabled && callbacks.onVideoPlay) {
                callbacks.onVideoPlay(timestamp);
            }
        },
        [enabled, callbacks]
    );

    const trackVideoSeek = useCallback(
        (from: number, to: number) => {
            if (enabled && callbacks.onVideoSeek) {
                callbacks.onVideoSeek(from, to);
            }
        },
        [enabled, callbacks]
    );

    const trackVideoReplay = useCallback(
        (startTime: number, endTime: number) => {
            if (enabled && callbacks.onVideoReplay) {
                callbacks.onVideoReplay(startTime, endTime);
            }
        },
        [enabled, callbacks]
    );

    const trackVideoSpeedChange = useCallback(
        (speed: number) => {
            if (enabled && callbacks.onVideoSpeedChange) {
                callbacks.onVideoSpeedChange(speed);
            }
        },
        [enabled, callbacks]
    );

    const trackVideoProgress = useCallback(
        (watchDuration: number, totalDuration: number) => {
            if (enabled && callbacks.onVideoProgress) {
                callbacks.onVideoProgress(watchDuration, totalDuration);
            }
        },
        [enabled, callbacks]
    );

    const trackQuizAttempt = useCallback(
        (questionId: string, correct: boolean, timeSpent: number) => {
            if (enabled && callbacks.onQuizAttempt) {
                callbacks.onQuizAttempt(questionId, correct, timeSpent);
            }
        },
        [enabled, callbacks]
    );

    const trackQuizHint = useCallback(
        (questionId: string) => {
            if (enabled && callbacks.onQuizHint) {
                callbacks.onQuizHint(questionId);
            }
        },
        [enabled, callbacks]
    );

    const trackQuizComplete = useCallback(
        (score: number, totalQuestions: number) => {
            if (enabled && callbacks.onQuizComplete) {
                callbacks.onQuizComplete(score, totalQuestions);
            }
        },
        [enabled, callbacks]
    );

    const trackCodeExecution = useCallback(
        (success: boolean, error?: string) => {
            if (enabled && callbacks.onCodeExecution) {
                callbacks.onCodeExecution(success, error);
            }
        },
        [enabled, callbacks]
    );

    const trackCodeEdit = useCallback(() => {
        if (enabled && callbacks.onCodeEdit) {
            callbacks.onCodeEdit();
        }
    }, [enabled, callbacks]);

    const trackCodeHint = useCallback(() => {
        if (enabled && callbacks.onCodeHint) {
            callbacks.onCodeHint();
        }
    }, [enabled, callbacks]);

    const trackSectionComplete = useCallback(
        (sectionId: string) => {
            if (enabled && callbacks.onSectionComplete) {
                callbacks.onSectionComplete(sectionId);
            }
        },
        [enabled, callbacks]
    );

    const value = useMemo<BehaviorTrackingContextValue>(
        () => ({
            enabled,
            callbacks,
            trackVideoPause,
            trackVideoPlay,
            trackVideoSeek,
            trackVideoReplay,
            trackVideoSpeedChange,
            trackVideoProgress,
            trackQuizAttempt,
            trackQuizHint,
            trackQuizComplete,
            trackCodeExecution,
            trackCodeEdit,
            trackCodeHint,
            trackSectionComplete,
        }),
        [
            enabled,
            callbacks,
            trackVideoPause,
            trackVideoPlay,
            trackVideoSeek,
            trackVideoReplay,
            trackVideoSpeedChange,
            trackVideoProgress,
            trackQuizAttempt,
            trackQuizHint,
            trackQuizComplete,
            trackCodeExecution,
            trackCodeEdit,
            trackCodeHint,
            trackSectionComplete,
        ]
    );

    return (
        <BehaviorTrackingContext.Provider value={value}>
            {children}
        </BehaviorTrackingContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access behavior tracking context
 * Returns null values for tracking functions when not wrapped in provider
 * (allows slot renderers to work both inside and outside of ConductorChapterView)
 */
export function useBehaviorTrackingContext(): BehaviorTrackingContextValue {
    const context = useContext(BehaviorTrackingContext);

    // Return a no-op context if not wrapped in provider
    // This allows slot renderers to work standalone without the conductor
    if (!context) {
        return {
            enabled: false,
            callbacks: {},
            trackVideoPause: () => {},
            trackVideoPlay: () => {},
            trackVideoSeek: () => {},
            trackVideoReplay: () => {},
            trackVideoSpeedChange: () => {},
            trackVideoProgress: () => {},
            trackQuizAttempt: () => {},
            trackQuizHint: () => {},
            trackQuizComplete: () => {},
            trackCodeExecution: () => {},
            trackCodeEdit: () => {},
            trackCodeHint: () => {},
            trackSectionComplete: () => {},
        };
    }

    return context;
}

/**
 * Optional hook that throws if not wrapped in provider
 * Use when behavior tracking is required
 */
export function useRequiredBehaviorTracking(): BehaviorTrackingContextValue {
    const context = useContext(BehaviorTrackingContext);

    if (!context) {
        throw new Error(
            "useRequiredBehaviorTracking must be used within a BehaviorTrackingProvider"
        );
    }

    return context;
}

export default BehaviorTrackingContext;
