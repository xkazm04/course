"use client";

import React, { createContext, useContext, useCallback, useEffect, useState, useMemo, useRef } from "react";
import type {
    ComprehensionModel,
    ComprehensionLevel,
    AdaptationConfig,
    BehaviorSignal,
    QuizSignal,
    PlaygroundSignal,
    SectionTimeSignal,
    VideoSignal,
    NavigationSignal,
} from "./types";
import { DEFAULT_ADAPTATION_CONFIGS } from "./types";
import {
    loadComprehensionModel,
    saveComprehensionModel,
    clearComprehensionData,
} from "./comprehensionStorage";
import {
    updateComprehensionModel,
    getComprehensionInsights,
} from "./comprehensionEngine";

// ============================================================================
// Context Types
// ============================================================================

interface AdaptiveContentContextValue {
    // Current state
    model: ComprehensionModel;
    adaptationConfig: AdaptationConfig;
    isLoading: boolean;

    // Computed insights
    comprehensionLevel: ComprehensionLevel;
    confidence: number;
    trend: "improving" | "stable" | "struggling";
    recentPerformance: number;

    // Signal recording functions
    recordQuizResult: (data: Omit<QuizSignal, "type" | "timestamp">) => void;
    recordPlaygroundInteraction: (data: Omit<PlaygroundSignal, "type" | "timestamp">) => void;
    recordSectionTime: (data: Omit<SectionTimeSignal, "type" | "timestamp">) => void;
    recordVideoInteraction: (data: Omit<VideoSignal, "type" | "timestamp">) => void;
    recordNavigation: (data: Omit<NavigationSignal, "type" | "timestamp">) => void;

    // General signal recording
    recordSignal: (signal: BehaviorSignal) => void;

    // Actions
    resetComprehension: () => void;
    setManualLevel: (level: ComprehensionLevel) => void;

    // Section-specific helpers
    getSectionLevel: (sectionId: string) => ComprehensionLevel;
    getSectionConfig: (sectionId: string) => AdaptationConfig;
}

// ============================================================================
// Context Creation
// ============================================================================

const AdaptiveContentContext = createContext<AdaptiveContentContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface AdaptiveContentProviderProps {
    courseId: string;
    userId?: string;
    children: React.ReactNode;
    initialLevel?: ComprehensionLevel;
}

export function AdaptiveContentProvider({
    courseId,
    userId,
    children,
    initialLevel,
}: AdaptiveContentProviderProps) {
    const [model, setModel] = useState<ComprehensionModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [manualLevel, setManualLevel] = useState<ComprehensionLevel | null>(initialLevel ?? null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load model on mount
    useEffect(() => {
        const loaded = loadComprehensionModel(courseId, userId);
        setModel(loaded);
        setIsLoading(false);
    }, [courseId, userId]);

    // Debounced save
    const debouncedSave = useCallback((modelToSave: ComprehensionModel) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveComprehensionModel(modelToSave);
        }, 1000);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Record a signal and update model
    const recordSignal = useCallback((signal: BehaviorSignal) => {
        setModel((prev) => {
            if (!prev) return prev;
            const updated = updateComprehensionModel(prev, signal);
            debouncedSave(updated);
            return updated;
        });
    }, [debouncedSave]);

    // Convenience signal recorders
    const recordQuizResult = useCallback(
        (data: Omit<QuizSignal, "type" | "timestamp">) => {
            recordSignal({
                type: "quiz",
                timestamp: Date.now(),
                ...data,
            });
        },
        [recordSignal]
    );

    const recordPlaygroundInteraction = useCallback(
        (data: Omit<PlaygroundSignal, "type" | "timestamp">) => {
            recordSignal({
                type: "playground",
                timestamp: Date.now(),
                ...data,
            });
        },
        [recordSignal]
    );

    const recordSectionTime = useCallback(
        (data: Omit<SectionTimeSignal, "type" | "timestamp">) => {
            recordSignal({
                type: "sectionTime",
                timestamp: Date.now(),
                ...data,
            });
        },
        [recordSignal]
    );

    const recordVideoInteraction = useCallback(
        (data: Omit<VideoSignal, "type" | "timestamp">) => {
            recordSignal({
                type: "video",
                timestamp: Date.now(),
                ...data,
            });
        },
        [recordSignal]
    );

    const recordNavigation = useCallback(
        (data: Omit<NavigationSignal, "type" | "timestamp">) => {
            recordSignal({
                type: "navigation",
                timestamp: Date.now(),
                ...data,
            });
        },
        [recordSignal]
    );

    // Reset comprehension data
    const resetComprehension = useCallback(() => {
        clearComprehensionData(courseId);
        const fresh = loadComprehensionModel(courseId, userId);
        setModel(fresh);
        setManualLevel(null);
    }, [courseId, userId]);

    // Manual level override
    const handleSetManualLevel = useCallback((level: ComprehensionLevel) => {
        setManualLevel(level);
    }, []);

    // Get section-specific level
    const getSectionLevel = useCallback(
        (sectionId: string): ComprehensionLevel => {
            if (manualLevel) return manualLevel;
            if (!model) return "intermediate";

            const sectionScore = model.sectionScores[sectionId];
            if (sectionScore && sectionScore.score.confidence > 0.3) {
                return sectionScore.score.level;
            }

            return model.overallScore.level;
        },
        [model, manualLevel]
    );

    // Get section-specific adaptation config
    const getSectionConfig = useCallback(
        (sectionId: string): AdaptationConfig => {
            const level = getSectionLevel(sectionId);
            return DEFAULT_ADAPTATION_CONFIGS[level];
        },
        [getSectionLevel]
    );

    // Compute current values
    const computedValues = useMemo(() => {
        if (!model) {
            return {
                comprehensionLevel: "intermediate" as ComprehensionLevel,
                confidence: 0,
                trend: "stable" as const,
                recentPerformance: 50,
                adaptationConfig: DEFAULT_ADAPTATION_CONFIGS.intermediate,
            };
        }

        const level = manualLevel ?? model.overallScore.level;
        const insights = getComprehensionInsights(model);

        return {
            comprehensionLevel: level,
            confidence: model.overallScore.confidence,
            trend: insights.trend,
            recentPerformance: insights.recentPerformance,
            adaptationConfig: DEFAULT_ADAPTATION_CONFIGS[level],
        };
    }, [model, manualLevel]);

    // Default model for loading state
    const displayModel = model ?? {
        courseId,
        userId,
        overallScore: {
            level: "intermediate" as const,
            score: 50,
            confidence: 0,
            lastUpdated: Date.now(),
        },
        sectionScores: {},
        signalHistory: [],
        lastUpdated: Date.now(),
    };

    const value: AdaptiveContentContextValue = {
        model: displayModel,
        isLoading,
        ...computedValues,
        recordQuizResult,
        recordPlaygroundInteraction,
        recordSectionTime,
        recordVideoInteraction,
        recordNavigation,
        recordSignal,
        resetComprehension,
        setManualLevel: handleSetManualLevel,
        getSectionLevel,
        getSectionConfig,
    };

    return (
        <AdaptiveContentContext.Provider value={value}>
            {children}
        </AdaptiveContentContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useAdaptiveContent(): AdaptiveContentContextValue {
    const context = useContext(AdaptiveContentContext);
    if (!context) {
        throw new Error("useAdaptiveContent must be used within an AdaptiveContentProvider");
    }
    return context;
}

/**
 * Optional version that returns null if not in provider
 * Useful for components that might be used outside adaptive context
 */
export function useAdaptiveContentOptional(): AdaptiveContentContextValue | null {
    return useContext(AdaptiveContentContext);
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for tracking section time
 */
export function useSectionTimeTracker(sectionId: string) {
    const context = useAdaptiveContentOptional();
    const startTimeRef = useRef<number>(Date.now());
    const completionRef = useRef<number>(0);
    const visitCountRef = useRef<number>(0);

    useEffect(() => {
        if (!context) return;

        visitCountRef.current += 1;
        startTimeRef.current = Date.now();

        return () => {
            const timeSpent = Date.now() - startTimeRef.current;
            context.recordSectionTime({
                sectionId,
                timeSpentMs: timeSpent,
                completionPercentage: completionRef.current,
                revisitCount: visitCountRef.current - 1,
            });
        };
    }, [context, sectionId]);

    const updateCompletion = useCallback((percentage: number) => {
        completionRef.current = Math.max(completionRef.current, percentage);
    }, []);

    return { updateCompletion };
}

/**
 * Hook for tracking video interactions
 */
export function useVideoTracker(sectionId: string) {
    const context = useAdaptiveContentOptional();
    const statsRef = useRef({
        pauseCount: 0,
        rewindCount: 0,
        playbackSpeed: 1,
        watchedPercentage: 0,
        skippedSegments: 0,
    });

    const trackPause = useCallback(() => {
        statsRef.current.pauseCount += 1;
    }, []);

    const trackRewind = useCallback(() => {
        statsRef.current.rewindCount += 1;
    }, []);

    const trackSpeed = useCallback((speed: number) => {
        statsRef.current.playbackSpeed = speed;
    }, []);

    const trackProgress = useCallback((percentage: number) => {
        statsRef.current.watchedPercentage = Math.max(
            statsRef.current.watchedPercentage,
            percentage
        );
    }, []);

    const trackSkip = useCallback(() => {
        statsRef.current.skippedSegments += 1;
    }, []);

    const submitStats = useCallback(() => {
        if (!context) return;
        context.recordVideoInteraction({
            sectionId,
            ...statsRef.current,
        });
    }, [context, sectionId]);

    useEffect(() => {
        return () => {
            submitStats();
        };
    }, [submitStats]);

    return {
        trackPause,
        trackRewind,
        trackSpeed,
        trackProgress,
        trackSkip,
        submitStats,
    };
}
