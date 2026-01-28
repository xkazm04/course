"use client";

/**
 * useExperiment Hook
 *
 * React hook for accessing experiment variants and tracking metrics.
 * Provides a simple API for components to participate in experiments.
 */

import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";
import type { ReactNode } from "react";
import type {
    TargetArea,
} from "./types";
import {
    variantDeliverer,
    initializeVariantDeliverer,
    type DeliveredVariant,
    type DeliveryContext,
} from "./variantDeliverer";
import { getMetricCollector } from "./metricCollector";

// ============================================================================
// Types
// ============================================================================

export interface ExperimentState {
    /** Whether the experiment is loaded */
    isLoaded: boolean;
    /** Whether user is enrolled in the experiment */
    isEnrolled: boolean;
    /** The assigned variant (null if not enrolled) */
    variant: DeliveredVariant | null;
    /** Variant configuration */
    config: Record<string, unknown>;
    /** Whether this is the control variant */
    isControl: boolean;
    /** Track a metric for this experiment */
    trackMetric: (metricName: string, value?: number, context?: Record<string, unknown>) => void;
    /** Track a conversion event */
    trackConversion: (metricName: string, converted?: boolean) => void;
    /** Get a config value with type safety */
    getConfigValue: <T>(key: string, defaultValue: T) => T;
}

export interface ExperimentContextValue {
    /** User ID for experiments */
    userId: string | null;
    /** Whether experiments are initialized */
    isInitialized: boolean;
    /** Current course context */
    courseId?: string;
    /** Current domain context */
    domainId?: string;
    /** All active experiments for user */
    experiments: Map<string, DeliveredVariant>;
    /** Get variant for a specific experiment */
    getVariant: (experimentId: string) => DeliveredVariant | null;
    /** Get variants for a target area */
    getVariantsForArea: (area: TargetArea) => DeliveredVariant[];
    /** Reload experiments */
    reload: () => Promise<void>;
    /** Track a metric */
    trackMetric: (
        experimentId: string,
        metricName: string,
        value?: number,
        context?: Record<string, unknown>
    ) => void;
}

// ============================================================================
// Context
// ============================================================================

const ExperimentContext = createContext<ExperimentContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface ExperimentProviderProps {
    children: ReactNode;
    userId: string | null;
    courseId?: string;
    domainId?: string;
    isNewUser?: boolean;
    sessionCount?: number;
    apiBase?: string;
}

export function ExperimentProvider({
    children,
    userId,
    courseId,
    domainId,
    isNewUser,
    sessionCount,
    apiBase,
}: ExperimentProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [experiments, setExperiments] = useState<Map<string, DeliveredVariant>>(new Map());
    const initRef = useRef(false);

    // Build delivery context
    const deliveryContext = useMemo<DeliveryContext | null>(
        () =>
            userId
                ? {
                    userId,
                    courseId,
                    domainId,
                    isNewUser,
                    sessionCount,
                }
                : null,
        [userId, courseId, domainId, isNewUser, sessionCount]
    );

    // Initialize experiments
    useEffect(() => {
        if (initRef.current || !deliveryContext) return;
        initRef.current = true;

        async function init() {
            try {
                await initializeVariantDeliverer(apiBase);
                const allVariants = variantDeliverer.getAllVariants(deliveryContext!);

                const variantMap = new Map<string, DeliveredVariant>();
                for (const variants of allVariants.values()) {
                    for (const variant of variants) {
                        variantMap.set(variant.experimentId, variant);
                    }
                }

                setExperiments(variantMap);
                setIsInitialized(true);
            } catch (error) {
                console.error("Failed to initialize experiments:", error);
                setIsInitialized(true); // Still mark as initialized to unblock UI
            }
        }

        init();
    }, [deliveryContext, apiBase]);

    // Reload experiments
    const reload = useCallback(async () => {
        if (!deliveryContext) return;

        try {
            await initializeVariantDeliverer(apiBase);
            const allVariants = variantDeliverer.getAllVariants(deliveryContext);

            const variantMap = new Map<string, DeliveredVariant>();
            for (const variants of allVariants.values()) {
                for (const variant of variants) {
                    variantMap.set(variant.experimentId, variant);
                }
            }

            setExperiments(variantMap);
        } catch (error) {
            console.error("Failed to reload experiments:", error);
        }
    }, [deliveryContext, apiBase]);

    // Get variant for experiment
    const getVariant = useCallback(
        (experimentId: string): DeliveredVariant | null => {
            return experiments.get(experimentId) || null;
        },
        [experiments]
    );

    // Get variants for area
    const getVariantsForArea = useCallback(
        (area: TargetArea): DeliveredVariant[] => {
            if (!deliveryContext) return [];
            return variantDeliverer.getVariantsForArea(area, deliveryContext);
        },
        [deliveryContext]
    );

    // Track metric
    const trackMetric = useCallback(
        (
            experimentId: string,
            metricName: string,
            value: number = 1,
            context?: Record<string, unknown>
        ) => {
            if (!userId) return;

            const variant = experiments.get(experimentId);
            if (!variant) return;

            getMetricCollector().track(
                experimentId,
                userId,
                variant.variantId,
                metricName,
                value,
                context
            );
        },
        [userId, experiments]
    );

    const contextValue = useMemo<ExperimentContextValue>(
        () => ({
            userId,
            isInitialized,
            courseId,
            domainId,
            experiments,
            getVariant,
            getVariantsForArea,
            reload,
            trackMetric,
        }),
        [userId, isInitialized, courseId, domainId, experiments, getVariant, getVariantsForArea, reload, trackMetric]
    );

    return (
        <ExperimentContext.Provider value={contextValue}>
            {children}
        </ExperimentContext.Provider>
    );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Access experiment context
 */
export function useExperimentContext(): ExperimentContextValue {
    const context = useContext(ExperimentContext);
    if (!context) {
        throw new Error("useExperimentContext must be used within ExperimentProvider");
    }
    return context;
}

/**
 * Hook for a specific experiment
 */
export function useExperiment(experimentId: string): ExperimentState {
    const context = useContext(ExperimentContext);

    const variant = context?.experiments.get(experimentId) || null;

    const userId = context?.userId;
    const variantId = variant?.variantId;

    const trackMetric = useCallback(
        (metricName: string, value: number = 1, metricContext?: Record<string, unknown>) => {
            if (!userId || !variantId) return;

            getMetricCollector().track(
                experimentId,
                userId,
                variantId,
                metricName,
                value,
                metricContext
            );
        },
        [userId, experimentId, variantId]
    );

    const trackConversion = useCallback(
        (metricName: string, converted: boolean = true) => {
            trackMetric(metricName, converted ? 1 : 0);
        },
        [trackMetric]
    );

    const getConfigValue = useCallback(
        <T,>(key: string, defaultValue: T): T => {
            if (!variant) return defaultValue;
            const value = variant.config[key];
            return value !== undefined ? (value as T) : defaultValue;
        },
        [variant]
    );

    return useMemo(
        () => ({
            isLoaded: context?.isInitialized ?? false,
            isEnrolled: variant !== null,
            variant,
            config: variant?.config || {},
            isControl: variant?.isControl ?? true,
            trackMetric,
            trackConversion,
            getConfigValue,
        }),
        [context?.isInitialized, variant, trackMetric, trackConversion, getConfigValue]
    );
}

/**
 * Hook for experiments in a target area
 */
export function useExperimentsForArea(area: TargetArea): DeliveredVariant[] {
    const context = useContext(ExperimentContext);

    return useMemo(() => {
        if (!context?.isInitialized) return [];
        return context.getVariantsForArea(area);
    }, [context, area]);
}

/**
 * Hook for checking if user is in treatment group
 */
export function useIsInTreatment(experimentId: string): boolean {
    const { variant, isLoaded } = useExperiment(experimentId);
    return isLoaded && variant !== null && !variant.isControl;
}

/**
 * Hook for getting experiment config value
 */
export function useExperimentConfig<T>(
    experimentId: string,
    key: string,
    defaultValue: T
): T {
    const { getConfigValue, isLoaded } = useExperiment(experimentId);

    return useMemo(() => {
        if (!isLoaded) return defaultValue;
        return getConfigValue(key, defaultValue);
    }, [isLoaded, getConfigValue, key, defaultValue]);
}

/**
 * Hook for A/B variant rendering
 */
export function useABVariant<T>(
    experimentId: string,
    controlValue: T,
    treatmentValue: T
): T {
    const { isControl, isEnrolled, isLoaded } = useExperiment(experimentId);

    return useMemo(() => {
        if (!isLoaded || !isEnrolled) return controlValue;
        return isControl ? controlValue : treatmentValue;
    }, [isLoaded, isEnrolled, isControl, controlValue, treatmentValue]);
}

// ============================================================================
// Utility Components
// ============================================================================

interface ExperimentGateProps {
    experimentId: string;
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Only render children if user is enrolled in experiment
 */
export function ExperimentGate({ experimentId, children, fallback = null }: ExperimentGateProps) {
    const { isEnrolled, isLoaded } = useExperiment(experimentId);

    if (!isLoaded) return null;
    return isEnrolled ? <>{children}</> : <>{fallback}</>;
}

interface VariantProps {
    experimentId: string;
    control: ReactNode;
    treatment: ReactNode;
}

/**
 * Render different content based on variant
 */
export function Variant({ experimentId, control, treatment }: VariantProps) {
    const { isControl, isEnrolled, isLoaded } = useExperiment(experimentId);

    if (!isLoaded) return null;
    if (!isEnrolled) return <>{control}</>;
    return isControl ? <>{control}</> : <>{treatment}</>;
}

interface MultiVariantProps {
    experimentId: string;
    variants: Record<string, ReactNode>;
    fallback?: ReactNode;
}

/**
 * Render content based on variant ID
 */
export function MultiVariant({ experimentId, variants, fallback = null }: MultiVariantProps) {
    const { variant, isLoaded, isEnrolled } = useExperiment(experimentId);

    if (!isLoaded) return null;
    if (!isEnrolled || !variant) return <>{fallback}</>;

    const content = variants[variant.variantId];
    return <>{content || fallback}</>;
}

// ============================================================================
// Metric Tracking Hooks
// ============================================================================

/**
 * Track when component mounts (impression tracking)
 */
export function useTrackImpression(
    experimentId: string,
    metricName: string = "impression"
): void {
    const { trackMetric, isEnrolled } = useExperiment(experimentId);
    const trackedRef = useRef(false);

    useEffect(() => {
        if (isEnrolled && !trackedRef.current) {
            trackedRef.current = true;
            trackMetric(metricName, 1);
        }
    }, [isEnrolled, trackMetric, metricName]);
}

/**
 * Track time spent in component
 */
export function useTrackTimeSpent(
    experimentId: string,
    metricName: string = "time_spent"
): void {
    const { trackMetric, isEnrolled } = useExperiment(experimentId);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (isEnrolled) {
            startTimeRef.current = Date.now();

            return () => {
                if (startTimeRef.current) {
                    const duration = (Date.now() - startTimeRef.current) / 1000;
                    trackMetric(metricName, duration);
                }
            };
        }
    }, [isEnrolled, trackMetric, metricName]);
}

/**
 * Create a click handler that tracks metric
 */
export function useTrackClick(
    experimentId: string,
    metricName: string
): () => void {
    const { trackMetric, isEnrolled } = useExperiment(experimentId);

    return useCallback(() => {
        if (isEnrolled) {
            trackMetric(metricName, 1);
        }
    }, [isEnrolled, trackMetric, metricName]);
}
