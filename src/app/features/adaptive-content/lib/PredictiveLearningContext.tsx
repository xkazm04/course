"use client";

import React, { createContext, useContext, useEffect, useCallback, useMemo } from "react";
import type { BehaviorSignal } from "./types";
import type {
    PredictiveConfig,
    PredictiveModelState,
    StruggePrediction,
    InterventionRecommendation,
    ActiveIntervention,
} from "./predictiveLearning.types";
import { DEFAULT_PREDICTIVE_CONFIG } from "./predictiveLearning.types";
import type { ScaffoldingSlot, ScaffoldingState } from "./proactiveScaffoldingEngine";
import {
    usePredictiveLearning,
    usePredictiveSignalBridge,
    type UsePredictiveLearningReturn,
} from "./usePredictiveLearning";
import { useAdaptiveContentOptional } from "./AdaptiveContentContext";

// ============================================================================
// Context Types
// ============================================================================

interface PredictiveLearningContextValue extends UsePredictiveLearningReturn {
    // Integration state
    isIntegrated: boolean;
    currentSectionId: string;

    // Computed helpers
    hasPendingInterventions: boolean;
    topIntervention: {
        intervention: InterventionRecommendation;
        prediction: StruggePrediction;
    } | null;

    // Section helpers
    getSectionPredictions: (sectionId: string) => StruggePrediction[];
    getSectionScaffolding: (sectionId: string) => ScaffoldingSlot[];
}

// ============================================================================
// Context Creation
// ============================================================================

const PredictiveLearningContext = createContext<PredictiveLearningContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface PredictiveLearningProviderProps {
    children: React.ReactNode;
    courseId: string;
    userId?: string;
    enabled?: boolean;
    config?: Partial<PredictiveConfig>;
    currentSectionId?: string;
    onPrediction?: (prediction: StruggePrediction) => void;
    onIntervention?: (intervention: InterventionRecommendation) => void;
}

export function PredictiveLearningProvider({
    children,
    courseId,
    userId,
    enabled = true,
    config: configOverrides = {},
    currentSectionId: sectionIdProp = "",
    onPrediction,
    onIntervention,
}: PredictiveLearningProviderProps) {
    // Get adaptive content context if available
    const adaptiveContext = useAdaptiveContentOptional();

    // Determine current section from prop or context
    const currentSectionId = sectionIdProp || "";

    // Initialize predictive learning hook
    const predictive = usePredictiveLearning({
        courseId,
        userId,
        enabled,
        config: configOverrides,
        onPrediction,
        onIntervention,
    });

    // Create signal bridge for integration
    const handleSignal = usePredictiveSignalBridge(
        predictive.processSignal,
        currentSectionId
    );

    // Bridge signals from AdaptiveContentContext
    useEffect(() => {
        if (!adaptiveContext || !enabled) return;

        // Subscribe to signals from the model's signal history
        // We check for new signals by comparing length
        const lastProcessedRef = { count: 0 };

        const checkForNewSignals = () => {
            const signals = adaptiveContext.model.signalHistory;
            if (signals.length > lastProcessedRef.count) {
                // Process new signals
                const newSignals = signals.slice(lastProcessedRef.count);
                for (const signal of newSignals) {
                    handleSignal(signal);
                }
                lastProcessedRef.count = signals.length;
            }
        };

        // Check immediately
        checkForNewSignals();

        // Check periodically for new signals
        const interval = setInterval(checkForNewSignals, 500);

        return () => {
            clearInterval(interval);
        };
    }, [adaptiveContext, enabled, handleSignal]);

    // Computed: Has pending interventions
    const hasPendingInterventions = useMemo(() => {
        return predictive.activeInterventions.some((ai) => !ai.dismissedAt && !ai.outcome);
    }, [predictive.activeInterventions]);

    // Computed: Top intervention
    const topIntervention = useMemo(() => {
        const pending = predictive.activeInterventions
            .filter((ai) => !ai.dismissedAt && !ai.outcome)
            .sort((a, b) => b.intervention.priority - a.intervention.priority);

        if (pending.length === 0) return null;

        return {
            intervention: pending[0].intervention,
            prediction: pending[0].prediction,
        };
    }, [predictive.activeInterventions]);

    // Helper: Get predictions for section
    const getSectionPredictions = useCallback(
        (sectionId: string): StruggePrediction[] => {
            return predictive.recentPredictions.filter((p) => p.sectionId === sectionId);
        },
        [predictive.recentPredictions]
    );

    // Helper: Get scaffolding for section
    const getSectionScaffolding = useCallback(
        (sectionId: string): ScaffoldingSlot[] => {
            return predictive.scaffoldingSlots.filter(
                (s) => s.targetSection === sectionId || !s.targetSection
            );
        },
        [predictive.scaffoldingSlots]
    );

    const value: PredictiveLearningContextValue = {
        ...predictive,
        isIntegrated: !!adaptiveContext,
        currentSectionId,
        hasPendingInterventions,
        topIntervention,
        getSectionPredictions,
        getSectionScaffolding,
    };

    return (
        <PredictiveLearningContext.Provider value={value}>
            {children}
        </PredictiveLearningContext.Provider>
    );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Use predictive learning context
 */
export function usePredictiveLearningContext(): PredictiveLearningContextValue {
    const context = useContext(PredictiveLearningContext);
    if (!context) {
        throw new Error(
            "usePredictiveLearningContext must be used within a PredictiveLearningProvider"
        );
    }
    return context;
}

/**
 * Optional version that returns null if not in provider
 */
export function usePredictiveLearningOptional(): PredictiveLearningContextValue | null {
    return useContext(PredictiveLearningContext);
}

/**
 * Hook for section-specific predictive features
 */
export function useSectionPrediction(sectionId: string) {
    const context = usePredictiveLearningOptional();

    const predictions = useMemo(() => {
        if (!context) return [];
        return context.getSectionPredictions(sectionId);
    }, [context, sectionId]);

    const scaffolding = useMemo(() => {
        if (!context) return [];
        return context.getSectionScaffolding(sectionId);
    }, [context, sectionId]);

    const hasPrediction = predictions.length > 0;
    const topPrediction = predictions[0] || null;

    return {
        isEnabled: context?.isEnabled ?? false,
        predictions,
        scaffolding,
        hasPrediction,
        topPrediction,
        recordOutcome: context?.recordOutcome,
    };
}

/**
 * Hook for intervention management
 */
export function useInterventionManager() {
    const context = usePredictiveLearningOptional();

    if (!context) {
        return {
            hasInterventions: false,
            interventions: [] as ActiveIntervention[],
            topIntervention: null,
            dismissIntervention: () => {},
            engageIntervention: () => {},
            provideFeedback: () => {},
        };
    }

    return {
        hasInterventions: context.hasPendingInterventions,
        interventions: context.activeInterventions,
        topIntervention: context.topIntervention,
        dismissIntervention: context.dismissIntervention,
        engageIntervention: context.engageIntervention,
        provideFeedback: context.provideFeedback,
    };
}

/**
 * Hook for prediction stats
 */
export function usePredictionStats() {
    const context = usePredictiveLearningOptional();

    if (!context) {
        return {
            predictionAccuracy: 0,
            interventionSuccessRate: 0,
            totalPredictions: 0,
            totalInterventions: 0,
        };
    }

    return {
        predictionAccuracy: context.predictionAccuracy,
        interventionSuccessRate: context.interventionSuccessRate,
        totalPredictions: context.recentPredictions.length,
        totalInterventions: context.activeInterventions.length,
    };
}

// ============================================================================
// Combined Provider Component
// ============================================================================

interface AdaptivePredictiveProviderProps {
    children: React.ReactNode;
    courseId: string;
    userId?: string;
    enablePredictive?: boolean;
    predictiveConfig?: Partial<PredictiveConfig>;
    currentSectionId?: string;
}

/**
 * Combined provider that wraps both AdaptiveContent and PredictiveLearning
 * Use this when you want both systems working together
 */
export function AdaptivePredictiveProvider({
    children,
    courseId,
    userId,
    enablePredictive = true,
    predictiveConfig,
    currentSectionId,
}: AdaptivePredictiveProviderProps) {
    // Import and use AdaptiveContentProvider dynamically to avoid circular deps
    // In practice, this should be composed at the app level

    return (
        <PredictiveLearningProvider
            courseId={courseId}
            userId={userId}
            enabled={enablePredictive}
            config={predictiveConfig}
            currentSectionId={currentSectionId}
        >
            {children}
        </PredictiveLearningProvider>
    );
}

// ============================================================================
// Exports
// ============================================================================

export type { PredictiveLearningContextValue };
