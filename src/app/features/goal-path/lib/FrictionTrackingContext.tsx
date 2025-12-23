"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { SkillAssessment } from "./useFrictionDetection";

/**
 * Friction tracking methods passed through context
 * This replaces the window.__goalPathFriction global pattern
 *
 * Now includes skill assessment for friction-aware curriculum adjustments.
 */
export interface FrictionTrackingContextValue {
    trackBackNavigation: () => void;
    trackAbandonmentAttempt: () => void;
    trackStepChange: (stepName?: string) => void;
    /** Current skill assessment derived from friction signals */
    skillAssessment?: SkillAssessment;
    /** Get reinforcement topics for a specific step */
    getReinforcementForStep?: (step: string) => string[];
}

const defaultValue: FrictionTrackingContextValue = {
    trackBackNavigation: () => {},
    trackAbandonmentAttempt: () => {},
    trackStepChange: () => {},
    skillAssessment: undefined,
    getReinforcementForStep: () => [],
};

const FrictionTrackingContext = createContext<FrictionTrackingContextValue>(defaultValue);

export interface FrictionTrackingProviderProps {
    children: React.ReactNode;
    trackBackNavigation: () => void;
    trackAbandonmentAttempt: () => void;
    trackStepChange: (stepName?: string) => void;
    /** Skill assessment for friction-aware curriculum adjustments */
    skillAssessment?: SkillAssessment;
    /** Get reinforcement topics for a specific step */
    getReinforcementForStep?: (step: string) => string[];
}

/**
 * Provider for friction tracking methods
 *
 * Used by GoalPathAdaptive to pass friction tracking callbacks down to
 * child components like WizardMode without using window globals.
 *
 * Now includes skill assessment for friction-aware curriculum adjustments.
 */
export function FrictionTrackingProvider({
    children,
    trackBackNavigation,
    trackAbandonmentAttempt,
    trackStepChange,
    skillAssessment,
    getReinforcementForStep,
}: FrictionTrackingProviderProps) {
    const value = useMemo(
        () => ({
            trackBackNavigation,
            trackAbandonmentAttempt,
            trackStepChange,
            skillAssessment,
            getReinforcementForStep,
        }),
        [trackBackNavigation, trackAbandonmentAttempt, trackStepChange, skillAssessment, getReinforcementForStep]
    );

    return (
        <FrictionTrackingContext.Provider value={value}>
            {children}
        </FrictionTrackingContext.Provider>
    );
}

/**
 * Hook to access friction tracking methods
 *
 * Returns no-op functions if used outside of FrictionTrackingProvider,
 * making it safe to use in components that may be rendered standalone.
 */
export function useFrictionTracking(): FrictionTrackingContextValue {
    return useContext(FrictionTrackingContext);
}
