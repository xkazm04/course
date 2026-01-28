"use client";

/**
 * Conductor Integration
 *
 * Integrates experimentation framework with the Learning Conductor.
 * Allows experiments to modify orchestration decisions and track learning outcomes.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
    useExperimentsForArea,
    useExperimentContext,
} from "./useExperiment";
import { getMetricCollector } from "./metricCollector";
import type { DeliveredVariant } from "./variantDeliverer";

// ============================================================================
// Types
// ============================================================================

/**
 * Orchestration config that can be overridden by experiments
 */
export interface ExperimentalOrchestrationConfig {
    /** Enable/disable specific orchestration actions */
    enableBehaviorTracking?: boolean;
    enableAdaptiveOrdering?: boolean;
    enableRemedialInjection?: boolean;
    enablePeerSolutions?: boolean;
    enableAcceleration?: boolean;

    /** Timing overrides */
    decisionCooldownMs?: number;
    remedialTriggerThreshold?: number;
    accelerationTriggerThreshold?: number;

    /** Content depth preferences */
    defaultContentDepth?: "remedial" | "basic" | "standard" | "advanced" | "expert";

    /** Intervention timing */
    showBreakSuggestionAfterMinutes?: number;
    showCelebrationAtCompletion?: boolean;
}

/**
 * Learning metrics to track
 */
export interface LearningMetrics {
    chapterStarted: boolean;
    chapterCompleted: boolean;
    quizScore?: number;
    quizAttempts: number;
    timeSpentMinutes: number;
    sectionsCompleted: number;
    totalSections: number;
    interventionsShown: number;
    interventionsAccepted: number;
    errorsEncountered: number;
}

// ============================================================================
// Conductor Integration Hook
// ============================================================================

/**
 * Hook for integrating experiments with conductor orchestration
 */
export function useConductorExperiments(userId: string, _courseId: string) {
    void _courseId; // Used for context, reserved for future targeting
    const orchestrationExperiments = useExperimentsForArea("orchestration");
    const timingExperiments = useExperimentsForArea("timing");
    const metricsRef = useRef<LearningMetrics>({
        chapterStarted: false,
        chapterCompleted: false,
        quizAttempts: 0,
        timeSpentMinutes: 0,
        sectionsCompleted: 0,
        totalSections: 0,
        interventionsShown: 0,
        interventionsAccepted: 0,
        errorsEncountered: 0,
    });
    const sessionStartRef = useRef<number | null>(null);

    // Initialize session start on first render
    useEffect(() => {
        if (sessionStartRef.current === null) {
            sessionStartRef.current = Date.now();
        }
    }, []);

    /**
     * Build config overrides from active experiments
     */
    const configOverrides = useMemo<ExperimentalOrchestrationConfig>(() => {
        const overrides: ExperimentalOrchestrationConfig = {};

        for (const exp of orchestrationExperiments) {
            if (exp.config) {
                Object.assign(overrides, exp.config);
            }
        }

        for (const exp of timingExperiments) {
            if (exp.config) {
                Object.assign(overrides, exp.config);
            }
        }

        return overrides;
    }, [orchestrationExperiments, timingExperiments]);

    /**
     * Track learning metric for all active experiments
     */
    const trackLearningMetric = useCallback(
        (metricName: string, value: number = 1, context?: Record<string, unknown>) => {
            const collector = getMetricCollector();

            // Track for orchestration experiments
            for (const exp of orchestrationExperiments) {
                collector.track(
                    exp.experimentId,
                    userId,
                    exp.variantId,
                    metricName,
                    value,
                    context
                );
            }

            // Track for timing experiments
            for (const exp of timingExperiments) {
                collector.track(
                    exp.experimentId,
                    userId,
                    exp.variantId,
                    metricName,
                    value,
                    context
                );
            }
        },
        [userId, orchestrationExperiments, timingExperiments]
    );

    /**
     * Track chapter started
     */
    const trackChapterStarted = useCallback(
        (chapterId: string) => {
            if (!metricsRef.current.chapterStarted) {
                metricsRef.current.chapterStarted = true;
                sessionStartRef.current = Date.now();
                trackLearningMetric("chapter_started", 1, { chapterId });
            }
        },
        [trackLearningMetric]
    );

    /**
     * Track chapter completed
     */
    const trackChapterCompleted = useCallback(
        (chapterId: string, score?: number) => {
            if (!metricsRef.current.chapterCompleted) {
                metricsRef.current.chapterCompleted = true;
                const startTime = sessionStartRef.current ?? Date.now();
                const timeSpent = (Date.now() - startTime) / 60000;
                metricsRef.current.timeSpentMinutes = timeSpent;

                trackLearningMetric("chapter_completed", 1, {
                    chapterId,
                    timeSpentMinutes: timeSpent,
                    score,
                });

                // Also track time spent as separate metric
                trackLearningMetric("time_spent", timeSpent, { chapterId });
            }
        },
        [trackLearningMetric]
    );

    /**
     * Track quiz attempt
     */
    const trackQuizAttempt = useCallback(
        (sectionId: string, score: number, isCorrect: boolean) => {
            metricsRef.current.quizAttempts++;
            metricsRef.current.quizScore = score;

            trackLearningMetric("quiz_attempt", 1, {
                sectionId,
                score,
                isCorrect,
                attemptNumber: metricsRef.current.quizAttempts,
            });

            if (isCorrect) {
                trackLearningMetric("quiz_correct", 1, { sectionId });
            }

            trackLearningMetric("quiz_score", score, { sectionId });
        },
        [trackLearningMetric]
    );

    /**
     * Track section completed
     */
    const trackSectionCompleted = useCallback(
        (sectionId: string, timeSpentSeconds: number) => {
            metricsRef.current.sectionsCompleted++;

            trackLearningMetric("section_completed", 1, {
                sectionId,
                timeSpentSeconds,
                sectionsCompleted: metricsRef.current.sectionsCompleted,
            });
        },
        [trackLearningMetric]
    );

    /**
     * Track intervention shown
     */
    const trackInterventionShown = useCallback(
        (interventionType: string, sectionId: string) => {
            metricsRef.current.interventionsShown++;

            trackLearningMetric("intervention_shown", 1, {
                interventionType,
                sectionId,
            });
        },
        [trackLearningMetric]
    );

    /**
     * Track intervention response
     */
    const trackInterventionResponse = useCallback(
        (interventionType: string, accepted: boolean, sectionId: string) => {
            if (accepted) {
                metricsRef.current.interventionsAccepted++;
            }

            trackLearningMetric("intervention_response", accepted ? 1 : 0, {
                interventionType,
                accepted,
                sectionId,
            });
        },
        [trackLearningMetric]
    );

    /**
     * Track error encountered
     */
    const trackError = useCallback(
        (errorType: string, sectionId: string) => {
            metricsRef.current.errorsEncountered++;

            trackLearningMetric("error_encountered", 1, {
                errorType,
                sectionId,
                totalErrors: metricsRef.current.errorsEncountered,
            });
        },
        [trackLearningMetric]
    );

    /**
     * Flush metrics on unmount
     */
    useEffect(() => {
        return () => {
            // Track session end metrics
            const startTime = sessionStartRef.current;
            if (startTime !== null) {
                const timeSpent = (Date.now() - startTime) / 60000;
                if (timeSpent > 0.5) {
                    // Only track if session was > 30 seconds
                    trackLearningMetric("session_duration", timeSpent);
                }
            }
        };
    }, [trackLearningMetric]);

    return {
        configOverrides,
        experiments: {
            orchestration: orchestrationExperiments,
            timing: timingExperiments,
        },
        tracking: {
            trackChapterStarted,
            trackChapterCompleted,
            trackQuizAttempt,
            trackSectionCompleted,
            trackInterventionShown,
            trackInterventionResponse,
            trackError,
            trackMetric: trackLearningMetric,
        },
        getMetrics: () => metricsRef.current,
    };
}

// ============================================================================
// Config Helper
// ============================================================================

/**
 * Merge experiment overrides with default conductor config
 */
export function mergeExperimentConfig<T extends Record<string, unknown>>(
    defaultConfig: T,
    experimentOverrides: ExperimentalOrchestrationConfig
): T {
    const merged = { ...defaultConfig };

    for (const [key, value] of Object.entries(experimentOverrides)) {
        if (value !== undefined && key in merged) {
            (merged as Record<string, unknown>)[key] = value;
        }
    }

    return merged;
}

// ============================================================================
// Slot Variant Hook
// ============================================================================

/**
 * Hook for slot variants in conductor UI components
 */
export function useConductorSlotVariant(slotId: string): {
    variant: DeliveredVariant | null;
    config: Record<string, unknown>;
    trackImpression: () => void;
    trackInteraction: (action: string) => void;
} {
    const experimentContext = useExperimentContext();
    const slotExperiments = useExperimentsForArea("slot_variant");

    const variant = useMemo(() => {
        // Find experiment for this slot
        return slotExperiments.find((exp) => {
            const slotConfig = exp.config as { slotId?: string };
            return slotConfig.slotId === slotId;
        }) || null;
    }, [slotExperiments, slotId]);

    const trackImpression = useCallback(() => {
        if (variant && experimentContext.userId) {
            getMetricCollector().track(
                variant.experimentId,
                experimentContext.userId,
                variant.variantId,
                "slot_impression",
                1,
                { slotId }
            );
        }
    }, [variant, experimentContext.userId, slotId]);

    const trackInteraction = useCallback(
        (action: string) => {
            if (variant && experimentContext.userId) {
                getMetricCollector().track(
                    variant.experimentId,
                    experimentContext.userId,
                    variant.variantId,
                    "slot_interaction",
                    1,
                    { slotId, action }
                );
            }
        },
        [variant, experimentContext.userId, slotId]
    );

    return {
        variant,
        config: variant?.config || {},
        trackImpression,
        trackInteraction,
    };
}
