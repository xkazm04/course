"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { BehaviorSignal } from "./types";
import type {
    PredictiveConfig,
    PredictiveModelState,
    StruggePrediction,
    InterventionRecommendation,
    CollectiveStrugglePattern,
    ActiveIntervention,
    TemporalSignal,
    PredictionEvent,
} from "./predictiveLearning.types";
import { DEFAULT_PREDICTIVE_CONFIG, PREDICTIVE_STORAGE_KEY, PREDICTIVE_VERSION } from "./predictiveLearning.types";
import {
    createPredictiveModelState,
    updatePredictiveModel,
    recordInterventionOutcome,
    validatePrediction,
    recordToCollectivePatterns,
    encodePatternSignature,
} from "./predictiveEngine";
import { enrichSignalsWithTemporal } from "./temporalPatternAnalyzer";
import {
    ScaffoldingSlot,
    ScaffoldingState,
    createScaffoldingState,
    interventionToScaffoldingSlot,
    shouldShowScaffolding,
    markScaffoldingShown,
    markScaffoldingDismissed,
    markScaffoldingEngaged,
    prioritizeScaffoldingSlots,
    getFloatingScaffolding,
} from "./proactiveScaffoldingEngine";

// ============================================================================
// Storage Functions
// ============================================================================

function loadPredictiveState(courseId: string): PredictiveModelState {
    if (typeof window === "undefined") return createPredictiveModelState();

    try {
        const stored = localStorage.getItem(`${PREDICTIVE_STORAGE_KEY}-${courseId}`);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.version === PREDICTIVE_VERSION) {
                return {
                    ...createPredictiveModelState(),
                    ...parsed.modelState,
                    patternHistory: new Map(Object.entries(parsed.modelState.patternHistory || {})),
                    signalEmbeddings: new Map(Object.entries(parsed.modelState.signalEmbeddings || {})),
                };
            }
        }
    } catch {
        // Ignore parse errors
    }
    return createPredictiveModelState();
}

function savePredictiveState(courseId: string, state: PredictiveModelState): void {
    if (typeof window === "undefined") return;

    try {
        const serializable = {
            version: PREDICTIVE_VERSION,
            modelState: {
                ...state,
                patternHistory: Object.fromEntries(state.patternHistory),
                signalEmbeddings: Object.fromEntries(state.signalEmbeddings),
                currentSequence: [], // Don't persist transient data
            },
            lastUpdated: Date.now(),
        };
        localStorage.setItem(`${PREDICTIVE_STORAGE_KEY}-${courseId}`, JSON.stringify(serializable));
    } catch {
        // Ignore storage errors
    }
}

function loadCollectivePatterns(courseId: string): CollectiveStrugglePattern[] {
    if (typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(`${PREDICTIVE_STORAGE_KEY}-collective-${courseId}`);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // Ignore parse errors
    }
    return [];
}

function saveCollectivePatterns(courseId: string, patterns: CollectiveStrugglePattern[]): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(`${PREDICTIVE_STORAGE_KEY}-collective-${courseId}`, JSON.stringify(patterns));
    } catch {
        // Ignore storage errors
    }
}

// ============================================================================
// Main Hook
// ============================================================================

export interface UsePredictiveLearningOptions {
    courseId: string;
    userId?: string;
    enabled?: boolean;
    config?: Partial<PredictiveConfig>;
    onPrediction?: (prediction: StruggePrediction) => void;
    onIntervention?: (intervention: InterventionRecommendation) => void;
}

export interface UsePredictiveLearningReturn {
    // State
    isEnabled: boolean;
    modelState: PredictiveModelState;
    recentPredictions: StruggePrediction[];
    activeInterventions: ActiveIntervention[];

    // Scaffolding
    scaffoldingSlots: ScaffoldingSlot[];
    floatingScaffolding: ScaffoldingSlot[];
    scaffoldingState: ScaffoldingState;

    // Stats
    predictionAccuracy: number;
    interventionSuccessRate: number;

    // Actions
    processSignal: (signal: BehaviorSignal, sectionId: string) => void;
    dismissIntervention: (interventionId: string) => void;
    engageIntervention: (interventionId: string) => void;
    provideFeedback: (interventionId: string, helpful: boolean) => void;
    recordOutcome: (sectionId: string, struggled: boolean) => void;
    resetPredictions: () => void;
    setEnabled: (enabled: boolean) => void;
}

export function usePredictiveLearning({
    courseId,
    userId,
    enabled = true,
    config: configOverrides = {},
    onPrediction,
    onIntervention,
}: UsePredictiveLearningOptions): UsePredictiveLearningReturn {
    // Merge config with defaults
    const config = useMemo<PredictiveConfig>(
        () => ({ ...DEFAULT_PREDICTIVE_CONFIG, ...configOverrides, enabled }),
        [configOverrides, enabled]
    );

    // State
    const [modelState, setModelState] = useState<PredictiveModelState>(() =>
        loadPredictiveState(courseId)
    );
    const [collectivePatterns, setCollectivePatterns] = useState<CollectiveStrugglePattern[]>(() =>
        loadCollectivePatterns(courseId)
    );
    const [scaffoldingState, setScaffoldingState] = useState<ScaffoldingState>(createScaffoldingState);
    const [isEnabled, setIsEnabled] = useState(enabled);
    const [allSignals, setAllSignals] = useState<BehaviorSignal[]>([]);
    const [currentSectionId, setCurrentSectionId] = useState<string>("");

    // Refs for debouncing
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced save
    const debouncedSave = useCallback(
        (state: PredictiveModelState, patterns: CollectiveStrugglePattern[]) => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                savePredictiveState(courseId, state);
                saveCollectivePatterns(courseId, patterns);
            }, 1000);
        },
        [courseId]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Process new signal
    const processSignal = useCallback(
        (signal: BehaviorSignal, sectionId: string) => {
            if (!isEnabled || !config.enabled) return;

            setCurrentSectionId(sectionId);
            setAllSignals((prev) => [...prev, signal].slice(-200));

            // Update model
            const { state: newState, prediction, newIntervention } = updatePredictiveModel(
                modelState,
                signal,
                [...allSignals, signal],
                sectionId,
                collectivePatterns,
                config
            );

            setModelState(newState);

            // Handle prediction
            if (prediction) {
                onPrediction?.(prediction);
            }

            // Handle intervention
            if (newIntervention) {
                onIntervention?.(newIntervention);
            }

            // Debounced save
            debouncedSave(newState, collectivePatterns);
        },
        [isEnabled, config, modelState, allSignals, collectivePatterns, onPrediction, onIntervention, debouncedSave]
    );

    // Dismiss intervention
    const dismissIntervention = useCallback(
        (interventionId: string) => {
            const newState = recordInterventionOutcome(modelState, interventionId, "dismissed");
            setModelState(newState);
            setScaffoldingState((prev) => markScaffoldingDismissed(prev, `scaffold_${interventionId}`));
            debouncedSave(newState, collectivePatterns);
        },
        [modelState, collectivePatterns, debouncedSave]
    );

    // Engage intervention
    const engageIntervention = useCallback(
        (interventionId: string) => {
            // Mark as viewed in active interventions
            setModelState((prev) => ({
                ...prev,
                activeInterventions: prev.activeInterventions.map((ai) =>
                    ai.intervention.id === interventionId
                        ? { ...ai, viewedAt: ai.viewedAt || Date.now(), engagedAt: Date.now() }
                        : ai
                ),
            }));
            setScaffoldingState((prev) => markScaffoldingEngaged(prev, `scaffold_${interventionId}`));
        },
        []
    );

    // Provide feedback
    const provideFeedback = useCallback(
        (interventionId: string, helpful: boolean) => {
            const outcome = helpful ? "helped" : "ignored";
            const newState = recordInterventionOutcome(modelState, interventionId, outcome);
            setModelState(newState);

            // Record to collective patterns if helpful
            if (helpful) {
                const intervention = modelState.activeInterventions.find(
                    (ai) => ai.intervention.id === interventionId
                );
                if (intervention) {
                    const sessionStart = allSignals.length > 0 ? allSignals[0].timestamp : Date.now();
                    const temporalSignals = enrichSignalsWithTemporal(allSignals, sessionStart);
                    const newPatterns = recordToCollectivePatterns(
                        collectivePatterns,
                        temporalSignals,
                        intervention.prediction.sectionId,
                        "recovered",
                        intervention.intervention.type
                    );
                    setCollectivePatterns(newPatterns);
                    debouncedSave(newState, newPatterns);
                    return;
                }
            }

            debouncedSave(newState, collectivePatterns);
        },
        [modelState, allSignals, collectivePatterns, debouncedSave]
    );

    // Record outcome (for prediction validation)
    const recordOutcome = useCallback(
        (sectionId: string, struggled: boolean) => {
            // Find predictions for this section
            const sectionPredictions = modelState.recentPredictions.filter(
                (p) => p.sectionId === sectionId
            );

            let newState = modelState;
            for (const prediction of sectionPredictions) {
                newState = validatePrediction(newState, prediction.id, struggled);
            }

            // Record to collective patterns
            const sessionStart = allSignals.length > 0 ? allSignals[0].timestamp : Date.now();
            const temporalSignals = enrichSignalsWithTemporal(allSignals, sessionStart);
            const newPatterns = recordToCollectivePatterns(
                collectivePatterns,
                temporalSignals,
                sectionId,
                struggled ? "struggled" : "succeeded"
            );

            setModelState(newState);
            setCollectivePatterns(newPatterns);
            debouncedSave(newState, newPatterns);
        },
        [modelState, allSignals, collectivePatterns, debouncedSave]
    );

    // Reset predictions
    const resetPredictions = useCallback(() => {
        const freshState = createPredictiveModelState(config);
        setModelState(freshState);
        setAllSignals([]);
        setScaffoldingState(createScaffoldingState());
        savePredictiveState(courseId, freshState);
    }, [courseId, config]);

    // Generate scaffolding slots from active interventions
    const scaffoldingSlots = useMemo<ScaffoldingSlot[]>(() => {
        const slots: ScaffoldingSlot[] = [];

        for (const ai of modelState.activeInterventions) {
            if (!ai.dismissedAt) {
                const slot = interventionToScaffoldingSlot(ai.intervention, ai.prediction);
                if (shouldShowScaffolding(slot, scaffoldingState, config)) {
                    slots.push(slot);
                }
            }
        }

        return prioritizeScaffoldingSlots(slots, config.maxActiveInterventions, config);
    }, [modelState.activeInterventions, scaffoldingState, config]);

    // Get floating scaffolding
    const floatingScaffolding = useMemo(
        () => getFloatingScaffolding(scaffoldingSlots, currentSectionId),
        [scaffoldingSlots, currentSectionId]
    );

    return {
        // State
        isEnabled,
        modelState,
        recentPredictions: modelState.recentPredictions,
        activeInterventions: modelState.activeInterventions,

        // Scaffolding
        scaffoldingSlots,
        floatingScaffolding,
        scaffoldingState,

        // Stats
        predictionAccuracy: modelState.predictionAccuracy,
        interventionSuccessRate: modelState.interventionSuccessRate,

        // Actions
        processSignal,
        dismissIntervention,
        engageIntervention,
        provideFeedback,
        recordOutcome,
        resetPredictions,
        setEnabled: setIsEnabled,
    };
}

// ============================================================================
// Context Integration Hook
// ============================================================================

/**
 * Hook to bridge predictive learning with AdaptiveContentContext
 */
export function usePredictiveSignalBridge(
    processSignal: (signal: BehaviorSignal, sectionId: string) => void,
    currentSectionId: string
) {
    const lastSignalRef = useRef<string | null>(null);

    // Create a wrapped signal handler that prevents duplicates
    const handleSignal = useCallback(
        (signal: BehaviorSignal) => {
            const signalKey = `${signal.type}_${signal.timestamp}`;
            if (signalKey === lastSignalRef.current) return;

            lastSignalRef.current = signalKey;
            processSignal(signal, currentSectionId);
        },
        [processSignal, currentSectionId]
    );

    return handleSignal;
}

// ============================================================================
// Scaffolding Display Hook
// ============================================================================

export interface UseScaffoldingDisplayOptions {
    slots: ScaffoldingSlot[];
    maxVisible?: number;
    autoShow?: boolean;
    showDelay?: number;
}

export interface UseScaffoldingDisplayReturn {
    visibleSlots: ScaffoldingSlot[];
    currentSlot: ScaffoldingSlot | null;
    hasMore: boolean;
    showNext: () => void;
    dismissCurrent: () => void;
}

export function useScaffoldingDisplay({
    slots,
    maxVisible = 1,
    autoShow = true,
    showDelay = 2000,
}: UseScaffoldingDisplayOptions): UseScaffoldingDisplayReturn {
    const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
    const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set());

    // Auto-show first slot after delay
    useEffect(() => {
        if (!autoShow || slots.length === 0) return;

        const timeout = setTimeout(() => {
            setVisibleIndices(new Set([0]));
        }, showDelay);

        return () => clearTimeout(timeout);
    }, [autoShow, slots.length, showDelay]);

    const visibleSlots = useMemo(() => {
        return slots.filter(
            (_, i) => visibleIndices.has(i) && !dismissedIndices.has(i)
        ).slice(0, maxVisible);
    }, [slots, visibleIndices, dismissedIndices, maxVisible]);

    const currentSlot = visibleSlots[0] || null;

    const hasMore = useMemo(() => {
        const shownOrDismissed = new Set([...visibleIndices, ...dismissedIndices]);
        return slots.some((_, i) => !shownOrDismissed.has(i));
    }, [slots, visibleIndices, dismissedIndices]);

    const showNext = useCallback(() => {
        const shownOrDismissed = new Set([...visibleIndices, ...dismissedIndices]);
        const nextIndex = slots.findIndex((_, i) => !shownOrDismissed.has(i));
        if (nextIndex >= 0) {
            setVisibleIndices((prev) => new Set([...prev, nextIndex]));
        }
    }, [slots, visibleIndices, dismissedIndices]);

    const dismissCurrent = useCallback(() => {
        if (currentSlot) {
            const currentIndex = slots.indexOf(currentSlot);
            if (currentIndex >= 0) {
                setDismissedIndices((prev) => new Set([...prev, currentIndex]));
            }
        }
    }, [currentSlot, slots]);

    return {
        visibleSlots,
        currentSlot,
        hasMore,
        showNext,
        dismissCurrent,
    };
}

// ============================================================================
// Exports
// ============================================================================

export type { PredictiveConfig, StruggePrediction, InterventionRecommendation };
