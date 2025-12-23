/**
 * Intent Resolution System - React Hooks
 *
 * Custom hooks for integrating the Intent Resolver system into React components.
 * These hooks handle async resolution, state management, and provide a clean API
 * for UI components.
 */

"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
    Intent,
    Constraints,
    ResolutionContext,
    ResolutionResult,
    ResolutionStatus,
    ResolvedPlan,
    MissingInput,
} from "./types";
import { IntentResolver, ResolverRegistry, ResolverConfig } from "./IntentResolver";
import { createDefaultRegistry } from "./factories";

// ============================================================================
// USE INTENT RESOLVER HOOK
// ============================================================================

export interface UseIntentResolverOptions {
    /** Auto-resolve when intent changes */
    autoResolve?: boolean;
    /** Debounce delay for auto-resolve in ms */
    debounceMs?: number;
    /** Callback when resolution completes */
    onComplete?: (result: ResolutionResult) => void;
    /** Callback when resolution fails */
    onError?: (error: string) => void;
    /** Resolver configuration */
    resolverConfig?: ResolverConfig;
}

export interface UseIntentResolverReturn<T extends Intent> {
    /** Current resolution status */
    status: ResolutionStatus;
    /** Resolved plan (if completed) */
    plan: ResolvedPlan | null;
    /** Error message (if failed) */
    error: string | null;
    /** Missing inputs (if requires-input) */
    missingInputs: MissingInput[];
    /** Whether currently resolving */
    isResolving: boolean;
    /** Resolution duration in ms */
    durationMs: number;
    /** Trigger resolution manually */
    resolve: (intent: T, constraints: Constraints, context: ResolutionContext) => Promise<ResolutionResult>;
    /** Reset state */
    reset: () => void;
}

/**
 * Hook for using a specific intent resolver in a component
 *
 * @example
 * ```tsx
 * const { status, plan, resolve, isResolving } = useIntentResolver(
 *   new LearningPathResolver()
 * );
 *
 * const handleGenerate = async () => {
 *   await resolve(intent, constraints, context);
 * };
 *
 * if (status === "completed" && plan) {
 *   return <PlanDisplay plan={plan} />;
 * }
 * ```
 */
export function useIntentResolver<T extends Intent>(
    resolver: IntentResolver<T>,
    options: UseIntentResolverOptions = {}
): UseIntentResolverReturn<T> {
    const { onComplete, onError, debounceMs = 300 } = options;

    const [status, setStatus] = useState<ResolutionStatus>("pending");
    const [plan, setPlan] = useState<ResolvedPlan | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [missingInputs, setMissingInputs] = useState<MissingInput[]>([]);
    const [durationMs, setDurationMs] = useState(0);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const resolve = useCallback(
        async (
            intent: T,
            constraints: Constraints,
            context: ResolutionContext
        ): Promise<ResolutionResult> => {
            // Clear any pending debounce
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            if (!isMountedRef.current) {
                return { status: "failed", error: "Component unmounted", durationMs: 0 };
            }

            setStatus("resolving");
            setError(null);
            setMissingInputs([]);

            try {
                const result = await resolver.resolve(intent, constraints, context);

                if (!isMountedRef.current) {
                    return result;
                }

                setStatus(result.status);
                setDurationMs(result.durationMs);

                if (result.status === "completed" && result.plan) {
                    setPlan(result.plan);
                    onComplete?.(result);
                } else if (result.status === "failed" && result.error) {
                    setError(result.error);
                    onError?.(result.error);
                } else if (result.status === "requires-input" && result.missingInput) {
                    setMissingInputs(result.missingInput);
                }

                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";

                if (isMountedRef.current) {
                    setStatus("failed");
                    setError(errorMessage);
                    onError?.(errorMessage);
                }

                return { status: "failed", error: errorMessage, durationMs: 0 };
            }
        },
        [resolver, onComplete, onError]
    );

    const reset = useCallback(() => {
        setStatus("pending");
        setPlan(null);
        setError(null);
        setMissingInputs([]);
        setDurationMs(0);
    }, []);

    const isResolving = status === "resolving";

    return {
        status,
        plan,
        error,
        missingInputs,
        isResolving,
        durationMs,
        resolve,
        reset,
    };
}

// ============================================================================
// USE RESOLVER REGISTRY HOOK
// ============================================================================

export interface UseResolverRegistryReturn {
    /** The registry instance */
    registry: ResolverRegistry;
    /** Current resolution status */
    status: ResolutionStatus;
    /** Resolved plan (if completed) */
    plan: ResolvedPlan | null;
    /** Error message (if failed) */
    error: string | null;
    /** Missing inputs (if requires-input) */
    missingInputs: MissingInput[];
    /** Whether currently resolving */
    isResolving: boolean;
    /** Resolve any supported intent type */
    resolve: (
        intent: Intent,
        constraints: Constraints,
        context: ResolutionContext
    ) => Promise<ResolutionResult>;
    /** Reset state */
    reset: () => void;
}

/**
 * Hook for using the resolver registry in a component.
 * Automatically routes intents to the appropriate resolver.
 *
 * @example
 * ```tsx
 * const { resolve, isResolving, plan } = useResolverRegistry();
 *
 * // Can handle any intent type
 * await resolve(learningPathIntent, constraints, context);
 * await resolve(projectPlanIntent, constraints, context);
 * ```
 */
export function useResolverRegistry(
    customRegistry?: ResolverRegistry,
    options: UseIntentResolverOptions = {}
): UseResolverRegistryReturn {
    const { onComplete, onError } = options;

    const registry = useMemo(
        () => customRegistry ?? createDefaultRegistry(),
        [customRegistry]
    );

    const [status, setStatus] = useState<ResolutionStatus>("pending");
    const [plan, setPlan] = useState<ResolvedPlan | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [missingInputs, setMissingInputs] = useState<MissingInput[]>([]);

    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const resolve = useCallback(
        async (
            intent: Intent,
            constraints: Constraints,
            context: ResolutionContext
        ): Promise<ResolutionResult> => {
            if (!isMountedRef.current) {
                return { status: "failed", error: "Component unmounted", durationMs: 0 };
            }

            setStatus("resolving");
            setError(null);
            setMissingInputs([]);

            try {
                const result = await registry.resolve(intent, constraints, context);

                if (!isMountedRef.current) {
                    return result;
                }

                setStatus(result.status);

                if (result.status === "completed" && result.plan) {
                    setPlan(result.plan);
                    onComplete?.(result);
                } else if (result.status === "failed" && result.error) {
                    setError(result.error);
                    onError?.(result.error);
                } else if (result.status === "requires-input" && result.missingInput) {
                    setMissingInputs(result.missingInput);
                }

                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";

                if (isMountedRef.current) {
                    setStatus("failed");
                    setError(errorMessage);
                    onError?.(errorMessage);
                }

                return { status: "failed", error: errorMessage, durationMs: 0 };
            }
        },
        [registry, onComplete, onError]
    );

    const reset = useCallback(() => {
        setStatus("pending");
        setPlan(null);
        setError(null);
        setMissingInputs([]);
    }, []);

    return {
        registry,
        status,
        plan,
        error,
        missingInputs,
        isResolving: status === "resolving",
        resolve,
        reset,
    };
}
