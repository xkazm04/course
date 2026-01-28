"use client";

/**
 * Bandit Intervention Hook
 *
 * React hook for integrating multi-armed bandit intervention selection
 * with the proactive scaffolding engine. Provides automatic selection,
 * outcome tracking, and reward attribution.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
    InterventionType,
    LearnerContext,
    SelectionResult,
    BanditHealthMetrics,
} from "./types";
import type { OutcomeResolution } from "./outcomeTracker";

// ============================================================================
// Types
// ============================================================================

export interface BanditInterventionState {
    /** Current selection */
    currentSelection: SelectionResult | null;
    /** Is selecting */
    isSelecting: boolean;
    /** Selection error */
    error: string | null;
    /** Health metrics */
    health: BanditHealthMetrics | null;
}

export interface BanditInterventionActions {
    /** Select an intervention */
    selectIntervention: (
        sectionId: string,
        availableTypes: InterventionType[],
        context?: Partial<LearnerContext>
    ) => Promise<SelectionResult | null>;

    /** Record outcome */
    recordOutcome: (
        outcome: "helped" | "ignored" | "dismissed"
    ) => Promise<OutcomeResolution | null>;

    /** Record engagement signal */
    recordEngagement: (value: number) => void;

    /** Record learning gain signal */
    recordLearningGain: (value: number) => void;

    /** Record completion signal */
    recordCompletion: (value: number) => void;

    /** Clear current selection */
    clearSelection: () => void;

    /** Refresh health metrics */
    refreshHealth: () => Promise<void>;
}

export interface UseBanditInterventionReturn {
    state: BanditInterventionState;
    actions: BanditInterventionActions;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useBanditIntervention(
    userId: string | null,
    options: {
        /** Auto-fetch health on mount */
        fetchHealthOnMount?: boolean;
        /** Enable local caching */
        enableCache?: boolean;
        /** Cache key prefix */
        cachePrefix?: string;
    } = {}
): UseBanditInterventionReturn {
    const { fetchHealthOnMount = true, enableCache = true, cachePrefix = "bandit" } = options;

    // State
    const [currentSelection, setCurrentSelection] = useState<SelectionResult | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [health, setHealth] = useState<BanditHealthMetrics | null>(null);

    // Refs for signal buffering
    const signalBufferRef = useRef<
        Array<{
            type: "engagement" | "learning_gain" | "completion";
            value: number;
            timestamp: number;
        }>
    >([]);

    // Cache key for selection
    const getCacheKey = useCallback(
        (sectionId: string) => `${cachePrefix}_selection_${sectionId}`,
        [cachePrefix]
    );

    /**
     * Select an intervention using bandit
     */
    const selectIntervention = useCallback(
        async (
            sectionId: string,
            availableTypes: InterventionType[],
            context?: Partial<LearnerContext>
        ): Promise<SelectionResult | null> => {
            if (!userId) {
                setError("User not authenticated");
                return null;
            }

            // Check cache first
            if (enableCache) {
                const cacheKey = getCacheKey(sectionId);
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    try {
                        const cachedSelection = JSON.parse(cached) as SelectionResult;
                        // Only use cache if within 5 minutes
                        const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_ts`);
                        if (cacheTimestamp) {
                            const age = Date.now() - parseInt(cacheTimestamp, 10);
                            if (age < 5 * 60 * 1000) {
                                setCurrentSelection(cachedSelection);
                                return cachedSelection;
                            }
                        }
                    } catch {
                        // Invalid cache, continue with API call
                    }
                }
            }

            setIsSelecting(true);
            setError(null);

            try {
                const response = await fetch("/api/bandit/select", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sectionId,
                        availableInterventions: availableTypes,
                        learnerContext: context,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Selection failed");
                }

                const data = await response.json();

                if (!data.success || !data.selection) {
                    throw new Error(data.message || "No selection returned");
                }

                const selection: SelectionResult = {
                    armId: `arm_${data.selection.interventionType}`,
                    interventionType: data.selection.interventionType,
                    sampledValue: 0, // Not returned from API
                    reason: data.selection.reason,
                    isExploration: data.selection.isExploration,
                    confidence: data.selection.confidence,
                    outcomeId: data.selection.outcomeId,
                    alternatives: [],
                };

                setCurrentSelection(selection);

                // Cache selection
                if (enableCache) {
                    const cacheKey = getCacheKey(sectionId);
                    sessionStorage.setItem(cacheKey, JSON.stringify(selection));
                    sessionStorage.setItem(`${cacheKey}_ts`, Date.now().toString());
                }

                // Clear signal buffer for new selection
                signalBufferRef.current = [];

                return selection;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Selection failed";
                setError(message);
                return null;
            } finally {
                setIsSelecting(false);
            }
        },
        [userId, enableCache, getCacheKey]
    );

    /**
     * Record outcome and get reward
     */
    const recordOutcome = useCallback(
        async (
            outcome: "helped" | "ignored" | "dismissed"
        ): Promise<OutcomeResolution | null> => {
            if (!currentSelection) {
                setError("No active selection to record outcome for");
                return null;
            }

            try {
                const response = await fetch("/api/bandit/reward", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        outcomeId: currentSelection.outcomeId,
                        rawOutcome: outcome,
                        signals: signalBufferRef.current,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Reward recording failed");
                }

                const data = await response.json();

                if (!data.success || !data.resolution) {
                    throw new Error(data.message || "No resolution returned");
                }

                // Clear selection after recording outcome
                setCurrentSelection(null);
                signalBufferRef.current = [];

                return data.resolution;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Outcome recording failed";
                setError(message);
                return null;
            }
        },
        [currentSelection]
    );

    /**
     * Record engagement signal
     */
    const recordEngagement = useCallback((value: number) => {
        signalBufferRef.current.push({
            type: "engagement",
            value: Math.max(0, Math.min(1, value)),
            timestamp: Date.now(),
        });
    }, []);

    /**
     * Record learning gain signal
     */
    const recordLearningGain = useCallback((value: number) => {
        signalBufferRef.current.push({
            type: "learning_gain",
            value: Math.max(0, Math.min(1, value)),
            timestamp: Date.now(),
        });
    }, []);

    /**
     * Record completion signal
     */
    const recordCompletion = useCallback((value: number) => {
        signalBufferRef.current.push({
            type: "completion",
            value: Math.max(0, Math.min(1, value)),
            timestamp: Date.now(),
        });
    }, []);

    /**
     * Clear current selection
     */
    const clearSelection = useCallback(() => {
        setCurrentSelection(null);
        signalBufferRef.current = [];
        setError(null);
    }, []);

    /**
     * Refresh health metrics
     */
    const refreshHealth = useCallback(async () => {
        try {
            const response = await fetch("/api/bandit/stats");

            if (!response.ok) {
                throw new Error("Failed to fetch health metrics");
            }

            const data = await response.json();
            setHealth(data.health);
        } catch (err) {
            console.error("Failed to fetch bandit health:", err);
        }
    }, []);

    // Fetch health on mount if enabled
    useEffect(() => {
        if (fetchHealthOnMount && userId) {
            refreshHealth();
        }
    }, [fetchHealthOnMount, userId, refreshHealth]);

    // Auto-record outcome as "ignored" when component unmounts with active selection
    useEffect(() => {
        return () => {
            if (currentSelection) {
                // Fire and forget - record as ignored
                fetch("/api/bandit/reward", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        outcomeId: currentSelection.outcomeId,
                        rawOutcome: "ignored",
                        signals: signalBufferRef.current,
                    }),
                    keepalive: true, // Ensure request completes even after unmount
                }).catch(() => {
                    // Ignore errors on cleanup
                });
            }
        };
    }, [currentSelection]);

    return {
        state: {
            currentSelection,
            isSelecting,
            error,
            health,
        },
        actions: {
            selectIntervention,
            recordOutcome,
            recordEngagement,
            recordLearningGain,
            recordCompletion,
            clearSelection,
            refreshHealth,
        },
    };
}

// ============================================================================
// Helper Hook: Bandit-Enhanced Scaffolding Selection
// ============================================================================

/**
 * Hook for selecting scaffolding intervention with bandit optimization
 */
export function useBanditScaffolding(
    userId: string | null,
    sectionId: string | null,
    availableTypes: InterventionType[]
): {
    selectedType: InterventionType | null;
    outcomeId: string | null;
    isLoading: boolean;
    confidence: number;
    isExploration: boolean;
    recordOutcome: (outcome: "helped" | "ignored" | "dismissed") => Promise<void>;
} {
    const { state, actions } = useBanditIntervention(userId, {
        fetchHealthOnMount: false,
    });

    const [selectionData, setSelectionData] = useState<{
        type: InterventionType | null;
        outcomeId: string | null;
        confidence: number;
        isExploration: boolean;
        forSection: string | null;
    }>({
        type: null,
        outcomeId: null,
        confidence: 0,
        isExploration: false,
        forSection: null,
    });

    const pendingSelectionRef = useRef(false);

    // Select intervention when section changes
    useEffect(() => {
        // Skip if no user, section, or available types
        if (!userId || !sectionId || availableTypes.length === 0) {
            return;
        }

        // Skip if already selecting or already selected for this section
        if (pendingSelectionRef.current || selectionData.forSection === sectionId) {
            return;
        }

        pendingSelectionRef.current = true;

        actions.selectIntervention(sectionId, availableTypes).then((selection) => {
            pendingSelectionRef.current = false;

            if (selection) {
                setSelectionData({
                    type: selection.interventionType,
                    outcomeId: selection.outcomeId,
                    confidence: selection.confidence,
                    isExploration: selection.isExploration,
                    forSection: sectionId,
                });
            }
        }).catch(() => {
            pendingSelectionRef.current = false;
        });
    }, [userId, sectionId, availableTypes, actions, selectionData.forSection]);

    const recordOutcome = useCallback(
        async (outcome: "helped" | "ignored" | "dismissed") => {
            await actions.recordOutcome(outcome);
        },
        [actions]
    );

    // Only return data if it's for the current section
    const isCurrentSection = selectionData.forSection === sectionId;

    return {
        selectedType: isCurrentSection ? selectionData.type : null,
        outcomeId: isCurrentSection ? selectionData.outcomeId : null,
        isLoading: state.isSelecting,
        confidence: isCurrentSection ? selectionData.confidence : 0,
        isExploration: isCurrentSection ? selectionData.isExploration : false,
        recordOutcome,
    };
}
