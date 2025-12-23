"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { type GoalPathMode } from "./goalPathConfig";
import {
    FrictionDerivedCompetence,
    CurriculumAdjustment,
    FrictionContext,
    computeCompetenceFromFriction,
    computeCurriculumAdjustment,
    createFrictionSession,
    identifyStruggleAreas,
    getStepReinforcementTopics,
} from "./frictionSkillAssessment";

/**
 * Friction signals that indicate user difficulty with current mode
 */
export interface FrictionSignals {
    backNavigationCount: number;      // Number of times user went back
    abandonmentAttempts: number;      // Times user tried to leave mid-flow
    timeOnCurrentStep: number;        // Time (ms) spent on current step
    rapidClicks: number;              // Rapid/frustrated clicks detected
    inactivityPeriods: number;        // Long pauses indicating confusion
    errorCount: number;               // Number of validation errors
}

/**
 * Escalation suggestion (deprecated - kept for backwards compatibility)
 * With only career-oracle mode, mode escalation is no longer applicable.
 */
export interface EscalationSuggestion {
    currentMode: GoalPathMode;
    suggestedMode: GoalPathMode;
    reason: string;
    confidence: number; // 0-1 scale
}

const FRICTION_THRESHOLDS = {
    backNavigationCount: 2,           // Going back 2+ times suggests need for more control
    abandonmentAttempts: 1,           // Any abandonment attempt is significant
    timeOnCurrentStep: 30000,         // 30s+ on a step suggests confusion
    rapidClicks: 5,                   // 5+ rapid clicks suggests frustration
    inactivityPeriods: 2,             // 2+ long pauses suggests hesitation
    errorCount: 2,                    // 2+ errors suggests guidance needed
};

const RAPID_CLICK_WINDOW = 2000;      // 2 second window for rapid clicks
const INACTIVITY_THRESHOLD = 15000;   // 15 seconds counts as inactivity

/**
 * Mode escalation logic (deprecated)
 * With only career-oracle mode, this always returns null.
 * Kept for backwards compatibility with existing interfaces.
 */
function getEscalationSuggestion(
    _currentMode: GoalPathMode,
    _signals: FrictionSignals
): EscalationSuggestion | null {
    // With only career-oracle mode, mode escalation is not applicable
    return null;
}

export interface UseFrictionDetectionOptions {
    currentMode: GoalPathMode;
    enabled?: boolean;
    onEscalationSuggested?: (suggestion: EscalationSuggestion) => void;
    /** Callback when skill assessment is updated */
    onSkillAssessmentUpdated?: (assessment: SkillAssessment) => void;
}

/**
 * Skill assessment derived from friction signals
 */
export interface SkillAssessment {
    /** Competence scores derived from friction patterns */
    competence: FrictionDerivedCompetence;
    /** Recommended curriculum adjustments */
    curriculumAdjustment: CurriculumAdjustment;
    /** Step-specific struggle areas */
    struggleAreas: Map<string, CurriculumAdjustment>;
    /** Reinforcement topics recommended for the user */
    reinforcementTopics: string[];
    /** Current step being tracked */
    currentStep: string;
}

export interface UseFrictionDetectionReturn {
    signals: FrictionSignals;
    suggestion: EscalationSuggestion | null;
    /** Skill assessment derived from friction signals */
    skillAssessment: SkillAssessment;
    trackBackNavigation: () => void;
    trackAbandonmentAttempt: () => void;
    trackError: () => void;
    /** Track step change with optional step name for context */
    trackStepChange: (stepName?: string) => void;
    dismissSuggestion: () => void;
    resetSignals: () => void;
    /** Get reinforcement topics for a specific step */
    getReinforcementForStep: (step: string) => string[];
    /** Export current session data for pattern analysis */
    exportSession: () => ReturnType<typeof createFrictionSession>;
}

/**
 * Hook to detect user friction and suggest mode escalation
 *
 * Tracks various friction signals:
 * - Back navigation (going to previous steps)
 * - Abandonment attempts (trying to leave)
 * - Time spent on current step
 * - Rapid/frustrated clicking
 * - Inactivity periods (confusion/hesitation)
 * - Validation errors
 */
export function useFrictionDetection({
    currentMode,
    enabled = true,
    onEscalationSuggested,
    onSkillAssessmentUpdated,
}: UseFrictionDetectionOptions): UseFrictionDetectionReturn {
    const [signals, setSignals] = useState<FrictionSignals>({
        backNavigationCount: 0,
        abandonmentAttempts: 0,
        timeOnCurrentStep: 0,
        rapidClicks: 0,
        inactivityPeriods: 0,
        errorCount: 0,
    });

    const [suggestion, setSuggestion] = useState<EscalationSuggestion | null>(null);
    const [suggestionDismissed, setSuggestionDismissed] = useState(false);

    // Track current step name for context
    const [currentStep, setCurrentStep] = useState<string>("initial");

    // Track friction contexts per step for struggle area analysis
    const frictionContexts = useRef<FrictionContext[]>([]);
    const stepCompletions = useRef<number>(0);
    const modeChanges = useRef<number>(0);

    // Refs for tracking time-based metrics
    const stepStartTime = useRef<number>(Date.now());
    const lastClickTime = useRef<number>(0);
    const clickBuffer = useRef<number[]>([]);
    const lastActivityTime = useRef<number>(Date.now());
    const inactivityCheckInterval = useRef<NodeJS.Timeout | null>(null);

    // Track rapid clicks
    useEffect(() => {
        if (!enabled) return;

        const handleClick = () => {
            const now = Date.now();
            lastActivityTime.current = now;

            // Track rapid clicks
            clickBuffer.current.push(now);
            clickBuffer.current = clickBuffer.current.filter(
                (time) => now - time < RAPID_CLICK_WINDOW
            );

            if (clickBuffer.current.length >= 5) {
                setSignals((prev) => ({
                    ...prev,
                    rapidClicks: prev.rapidClicks + 1,
                }));
                clickBuffer.current = []; // Reset after detection
            }

            lastClickTime.current = now;
        };

        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [enabled]);

    // Track inactivity periods
    useEffect(() => {
        if (!enabled) return;

        inactivityCheckInterval.current = setInterval(() => {
            const now = Date.now();
            if (now - lastActivityTime.current >= INACTIVITY_THRESHOLD) {
                setSignals((prev) => ({
                    ...prev,
                    inactivityPeriods: prev.inactivityPeriods + 1,
                }));
                lastActivityTime.current = now; // Reset to avoid multiple counts
            }
        }, 5000); // Check every 5 seconds

        return () => {
            if (inactivityCheckInterval.current) {
                clearInterval(inactivityCheckInterval.current);
            }
        };
    }, [enabled]);

    // Track time on current step
    useEffect(() => {
        if (!enabled) return;

        const updateTime = setInterval(() => {
            setSignals((prev) => ({
                ...prev,
                timeOnCurrentStep: Date.now() - stepStartTime.current,
            }));
        }, 1000);

        return () => clearInterval(updateTime);
    }, [enabled]);

    // Compute skill assessment from signals (memoized)
    const skillAssessment = useMemo((): SkillAssessment => {
        const competence = computeCompetenceFromFriction(signals);
        const curriculumAdjustment = computeCurriculumAdjustment(competence, signals);
        const struggleAreas = identifyStruggleAreas(frictionContexts.current);

        // Collect all reinforcement topics
        const reinforcementTopics = new Set<string>();
        curriculumAdjustment.reinforcementTopics.forEach((t) => reinforcementTopics.add(t));
        struggleAreas.forEach((adjustment) => {
            adjustment.reinforcementTopics.forEach((t) => reinforcementTopics.add(t));
        });

        return {
            competence,
            curriculumAdjustment,
            struggleAreas,
            reinforcementTopics: Array.from(reinforcementTopics),
            currentStep,
        };
    }, [signals, currentStep]);

    // Notify when skill assessment updates
    useEffect(() => {
        if (enabled && onSkillAssessmentUpdated) {
            onSkillAssessmentUpdated(skillAssessment);
        }
    }, [skillAssessment, enabled, onSkillAssessmentUpdated]);

    // Evaluate escalation suggestion when signals change
    useEffect(() => {
        if (!enabled || suggestionDismissed) return;

        const newSuggestion = getEscalationSuggestion(currentMode, signals);

        if (newSuggestion && newSuggestion.confidence >= 0.5) {
            setSuggestion(newSuggestion);
            onEscalationSuggested?.(newSuggestion);
        }
    }, [signals, currentMode, enabled, suggestionDismissed, onEscalationSuggested]);

    // Reset suggestion when mode changes
    useEffect(() => {
        setSuggestion(null);
        setSuggestionDismissed(false);
        setSignals({
            backNavigationCount: 0,
            abandonmentAttempts: 0,
            timeOnCurrentStep: 0,
            rapidClicks: 0,
            inactivityPeriods: 0,
            errorCount: 0,
        });
        stepStartTime.current = Date.now();
        modeChanges.current += 1;
    }, [currentMode]);

    const trackBackNavigation = useCallback(() => {
        lastActivityTime.current = Date.now();
        setSignals((prev) => ({
            ...prev,
            backNavigationCount: prev.backNavigationCount + 1,
        }));
    }, []);

    const trackAbandonmentAttempt = useCallback(() => {
        lastActivityTime.current = Date.now();
        setSignals((prev) => ({
            ...prev,
            abandonmentAttempts: prev.abandonmentAttempts + 1,
        }));
    }, []);

    const trackError = useCallback(() => {
        lastActivityTime.current = Date.now();
        setSignals((prev) => ({
            ...prev,
            errorCount: prev.errorCount + 1,
        }));
    }, []);

    const trackStepChange = useCallback((stepName?: string) => {
        // Record friction context for the step we're leaving
        if (currentStep !== "initial") {
            frictionContexts.current.push({
                step: currentStep,
                signals: { ...signals },
                timestamp: Date.now(),
            });
        }

        lastActivityTime.current = Date.now();
        stepStartTime.current = Date.now();
        stepCompletions.current += 1;

        if (stepName) {
            setCurrentStep(stepName);
        }

        setSignals((prev) => ({
            ...prev,
            timeOnCurrentStep: 0,
        }));
    }, [currentStep, signals]);

    const dismissSuggestion = useCallback(() => {
        setSuggestion(null);
        setSuggestionDismissed(true);
    }, []);

    const resetSignals = useCallback(() => {
        setSignals({
            backNavigationCount: 0,
            abandonmentAttempts: 0,
            timeOnCurrentStep: 0,
            rapidClicks: 0,
            inactivityPeriods: 0,
            errorCount: 0,
        });
        stepStartTime.current = Date.now();
        lastActivityTime.current = Date.now();
        clickBuffer.current = [];
        frictionContexts.current = [];
        stepCompletions.current = 0;
        setCurrentStep("initial");
        setSuggestion(null);
        setSuggestionDismissed(false);
    }, []);

    const getReinforcementForStep = useCallback(
        (step: string): string[] => {
            const adjustment = skillAssessment.struggleAreas.get(step);
            if (adjustment) {
                return getStepReinforcementTopics(step, adjustment);
            }
            return [];
        },
        [skillAssessment.struggleAreas]
    );

    const exportSession = useCallback(() => {
        return createFrictionSession(
            signals,
            stepCompletions.current,
            modeChanges.current
        );
    }, [signals]);

    return {
        signals,
        suggestion,
        skillAssessment,
        trackBackNavigation,
        trackAbandonmentAttempt,
        trackError,
        trackStepChange,
        dismissSuggestion,
        resetSignals,
        getReinforcementForStep,
        exportSession,
    };
}
