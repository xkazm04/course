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
    clearInsightsCache,
} from "./comprehensionEngine";
import type {
    ComprehensionState,
    ComprehensionStateMachineModel,
    StateTransitionEvent,
    TransitionMetrics,
} from "./comprehensionStateMachine";
import {
    createStateMachineModel,
    updateStateMachine,
    getProgressToNextState,
    detectStuckPattern,
    stateToLegacyLevel,
    getStateDefinition,
} from "./comprehensionStateMachine";

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

    // State Machine (new)
    stateMachineModel: ComprehensionStateMachineModel;
    currentState: ComprehensionState;
    stateProgress: { progress: number; nextState: ComprehensionState; requirements: string[] };
    lastTransition: StateTransitionEvent | null;
    isStuck: { isStuck: boolean; recommendation: string };
    transitionHistory: StateTransitionEvent[];

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
    clearLastTransition: () => void;

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

// State Machine Storage Key
const STATE_MACHINE_STORAGE_KEY = "adaptive-state-machine";

function loadStateMachineModel(courseId: string): ComprehensionStateMachineModel {
    if (typeof window === "undefined") return createStateMachineModel();
    try {
        const stored = localStorage.getItem(`${STATE_MACHINE_STORAGE_KEY}-${courseId}`);
        if (stored) {
            return JSON.parse(stored) as ComprehensionStateMachineModel;
        }
    } catch {
        // Ignore parse errors
    }
    return createStateMachineModel();
}

function saveStateMachineModel(courseId: string, model: ComprehensionStateMachineModel): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(`${STATE_MACHINE_STORAGE_KEY}-${courseId}`, JSON.stringify(model));
    } catch {
        // Ignore storage errors
    }
}

export function AdaptiveContentProvider({
    courseId,
    userId,
    children,
    initialLevel,
}: AdaptiveContentProviderProps) {
    const [model, setModel] = useState<ComprehensionModel | null>(null);
    const [stateMachineModel, setStateMachineModel] = useState<ComprehensionStateMachineModel>(
        createStateMachineModel()
    );
    const [lastTransition, setLastTransition] = useState<StateTransitionEvent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [manualLevel, setManualLevel] = useState<ComprehensionLevel | null>(initialLevel ?? null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const stateMachineSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load model on mount
    useEffect(() => {
        const loaded = loadComprehensionModel(courseId, userId);
        setModel(loaded);
        const loadedStateMachine = loadStateMachineModel(courseId);
        setStateMachineModel(loadedStateMachine);
        setIsLoading(false);
    }, [courseId, userId]);

    // Debounced save for comprehension model
    const debouncedSave = useCallback((modelToSave: ComprehensionModel) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveComprehensionModel(modelToSave);
        }, 1000);
    }, []);

    // Debounced save for state machine model
    const debouncedSaveStateMachine = useCallback(
        (smModel: ComprehensionStateMachineModel) => {
            if (stateMachineSaveTimeoutRef.current) {
                clearTimeout(stateMachineSaveTimeoutRef.current);
            }
            stateMachineSaveTimeoutRef.current = setTimeout(() => {
                saveStateMachineModel(courseId, smModel);
            }, 1000);
        },
        [courseId]
    );

    // Cleanup
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (stateMachineSaveTimeoutRef.current) {
                clearTimeout(stateMachineSaveTimeoutRef.current);
            }
        };
    }, []);

    // Clear last transition
    const clearLastTransition = useCallback(() => {
        setLastTransition(null);
    }, []);

    // Record a signal and update both models
    const recordSignal = useCallback(
        (signal: BehaviorSignal) => {
            setModel((prev) => {
                if (!prev) return prev;
                const updated = updateComprehensionModel(prev, signal);
                debouncedSave(updated);

                // Update state machine with the new signal
                setStateMachineModel((prevSM) => {
                    const sectionId =
                        "sectionId" in signal
                            ? signal.sectionId
                            : "playgroundId" in signal
                            ? signal.playgroundId
                            : undefined;

                    const { model: newSM, transition } = updateStateMachine(
                        prevSM,
                        signal,
                        updated.signalHistory,
                        sectionId
                    );

                    if (transition) {
                        setLastTransition(transition);
                    }

                    debouncedSaveStateMachine(newSM);
                    return newSM;
                });

                return updated;
            });
        },
        [debouncedSave, debouncedSaveStateMachine]
    );

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
        clearInsightsCache(); // Clear memoized insights cache
        const fresh = loadComprehensionModel(courseId, userId);
        setModel(fresh);
        setManualLevel(null);
        // Reset state machine
        const freshStateMachine = createStateMachineModel();
        setStateMachineModel(freshStateMachine);
        setLastTransition(null);
        saveStateMachineModel(courseId, freshStateMachine);
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

    // Compute state machine values
    const stateMachineValues = useMemo(() => {
        const stateProgress = getProgressToNextState(stateMachineModel);
        const isStuck = detectStuckPattern(stateMachineModel);

        return {
            currentState: stateMachineModel.currentState,
            stateProgress,
            isStuck,
            transitionHistory: stateMachineModel.transitionHistory,
        };
    }, [stateMachineModel]);

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

        // Use state machine level if no manual override
        const stateLevel = stateToLegacyLevel(stateMachineModel.currentState);
        const level = manualLevel ?? stateLevel;
        const insights = getComprehensionInsights(model);

        return {
            comprehensionLevel: level,
            confidence: model.overallScore.confidence,
            trend: insights.trend,
            recentPerformance: insights.recentPerformance,
            adaptationConfig: DEFAULT_ADAPTATION_CONFIGS[level],
        };
    }, [model, manualLevel, stateMachineModel.currentState]);

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
        // State Machine values
        stateMachineModel,
        currentState: stateMachineValues.currentState,
        stateProgress: stateMachineValues.stateProgress,
        lastTransition,
        isStuck: stateMachineValues.isStuck,
        transitionHistory: stateMachineValues.transitionHistory,
        // Signal recorders
        recordQuizResult,
        recordPlaygroundInteraction,
        recordSectionTime,
        recordVideoInteraction,
        recordNavigation,
        recordSignal,
        // Actions
        resetComprehension,
        setManualLevel: handleSetManualLevel,
        clearLastTransition,
        // Section helpers
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
