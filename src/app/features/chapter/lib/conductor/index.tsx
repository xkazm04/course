/**
 * Learning Conductor Context
 *
 * Provides AI-powered learning orchestration across the Chapter system.
 * Manages behavior tracking, profile updates, orchestration decisions,
 * and collective intelligence.
 */

"use client";

import React, {
    createContext,
    useContext,
    useReducer,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from "react";
import {
    learnerProfileStorage,
    sectionBehaviorStorage,
    collectiveInsightStorage,
    peerSolutionStorage,
    decisionStorage,
    conductorConfigStorage,
    getDefaultSectionBehavior,
} from "../conductorStorage";
import type {
    ConductorState,
    ConductorConfig,
    LearnerProfile,
    OrchestrationDecision,
    OrchestrationAction,
    SectionBehavior,
} from "../conductorTypes";
import type { ConductorContextValue, ConductorProviderProps } from "./types";
import { conductorReducer } from "./reducer";
import {
    mergeBehavior,
    getDecisionPriority,
    analyzeBehaviorForDecisions,
    analyzeProfileFromBehavior,
    generateRemedialContent,
} from "./helpers";

// ============================================================================
// Context
// ============================================================================

const ConductorContext = createContext<ConductorContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function LearningConductorProvider({
    children,
    userId,
    courseId,
    chapterId,
    initialSectionId = "intro",
    config: configOverrides,
}: ConductorProviderProps) {
    // Load initial config
    const storedConfig = conductorConfigStorage.getConfig();
    const config: ConductorConfig = { ...storedConfig, ...configOverrides };

    // Load or create learner profile
    const existingProfile = learnerProfileStorage.getProfile(userId, courseId);
    const initialProfile: LearnerProfile = existingProfile || {
        userId,
        courseId,
        pace: "normal",
        confidence: "moderate",
        preferredContentDepth: "standard",
        strengths: [],
        weaknesses: [],
        learningStyle: {
            prefersVideo: 0.5,
            prefersCode: 0.5,
            prefersText: 0.5,
            prefersInteractive: 0.5,
        },
        engagementScore: 50,
        retentionScore: 50,
        lastUpdated: Date.now(),
    };

    // Load existing behaviors for this chapter
    const existingBehaviors = sectionBehaviorStorage.getAllForUser(userId, courseId, chapterId);
    const sectionBehaviors: Record<string, SectionBehavior> = {};
    for (const [key, behavior] of Object.entries(existingBehaviors)) {
        const sectionId = key.split(":")[3];
        if (sectionId) {
            sectionBehaviors[sectionId] = behavior;
        }
    }

    // Initial state
    const initialState: ConductorState = {
        isActive: true,
        userId,
        courseId,
        chapterId,
        currentSectionId: initialSectionId,
        learnerProfile: initialProfile,
        sectionBehaviors,
        pendingDecisions: decisionStorage.getPendingDecisions(),
        executedDecisions: decisionStorage.getExecutedDecisions(),
        optimizedOrder: null,
        injectedContent: [],
        suggestedPeerSolutions: [],
        collectiveInsights: [],
        sessionStartedAt: Date.now(),
        lastActivityAt: Date.now(),
    };

    const [state, dispatch] = useReducer(conductorReducer, initialState);
    const lastDecisionTimeRef = useRef<number>(0);

    // ========================================================================
    // Profile Management
    // ========================================================================

    const updateProfile = useCallback(
        (updates: Partial<LearnerProfile>) => {
            dispatch({ type: "UPDATE_PROFILE", payload: updates });

            // Persist to storage
            const current = learnerProfileStorage.getProfile(userId, courseId) || initialProfile;
            learnerProfileStorage.saveProfile({ ...current, ...updates, lastUpdated: Date.now() });
        },
        [userId, courseId, initialProfile]
    );

    const getLearnerProfile = useCallback(() => state.learnerProfile, [state.learnerProfile]);

    // ========================================================================
    // Behavior Recording
    // ========================================================================

    const recordBehavior = useCallback(
        (sectionId: string, behavior: Partial<SectionBehavior>) => {
            const current = state.sectionBehaviors[sectionId] || getDefaultSectionBehavior();
            const updated = mergeBehavior(current, behavior);

            dispatch({ type: "SET_BEHAVIOR", payload: { sectionId, behavior: updated } });

            // Persist to storage
            sectionBehaviorStorage.saveBehavior(userId, courseId, chapterId, sectionId, updated);

            // Analyze behavior for orchestration decisions
            analyzeBehaviorForDecisions(sectionId, updated, state.learnerProfile, config, (decision) => {
                // Check cooldown
                const now = Date.now();
                if (now - lastDecisionTimeRef.current < config.decisionCooldownMs) {
                    return;
                }

                dispatch({ type: "ADD_DECISION", payload: decision });
                decisionStorage.addDecision(decision);
                lastDecisionTimeRef.current = now;
            });

            // Update profile based on behavior patterns
            const profileUpdates = analyzeProfileFromBehavior(updated, state.learnerProfile);
            if (Object.keys(profileUpdates).length > 0) {
                updateProfile(profileUpdates);
            }
        },
        [state.sectionBehaviors, state.learnerProfile, userId, courseId, chapterId, config, updateProfile]
    );

    // ========================================================================
    // Orchestration Decisions
    // ========================================================================

    const getNextDecision = useCallback((): OrchestrationDecision | null => {
        return state.pendingDecisions[0] || null;
    }, [state.pendingDecisions]);

    const executeDecision = useCallback(
        (decisionId: string) => {
            dispatch({ type: "EXECUTE_DECISION", payload: decisionId });
            decisionStorage.executeDecision(decisionId);
        },
        []
    );

    const dismissDecision = useCallback(
        (decisionId: string) => {
            dispatch({ type: "DISMISS_DECISION", payload: decisionId });
            decisionStorage.dismissDecision(decisionId);
        },
        []
    );

    const triggerDecision = useCallback(
        (
            action: OrchestrationAction,
            reason: string,
            metadata: Record<string, unknown> = {}
        ) => {
            const decision: OrchestrationDecision = {
                id: `decision-${Date.now()}`,
                action,
                sectionId: state.currentSectionId,
                priority: getDecisionPriority(action),
                reason,
                metadata,
                createdAt: Date.now(),
                executed: false,
            };

            dispatch({ type: "ADD_DECISION", payload: decision });
            decisionStorage.addDecision(decision);
        },
        [state.currentSectionId]
    );

    // ========================================================================
    // Content Recommendations
    // ========================================================================

    const getRemedialContent = useCallback(
        (topic: string) => generateRemedialContent(topic, state.learnerProfile),
        [state.learnerProfile]
    );

    const getPeerSolutions = useCallback(
        (sectionId: string, context?: string) => {
            const solutions = peerSolutionStorage.getSolutions({ sectionId });

            // Filter by context if provided
            if (context) {
                return solutions.filter(
                    (s) =>
                        s.content.toLowerCase().includes(context.toLowerCase()) ||
                        s.tags.some((t) => t.toLowerCase().includes(context.toLowerCase()))
                );
            }

            return solutions;
        },
        []
    );

    const getSectionOrder = useCallback(() => {
        if (state.optimizedOrder) {
            return state.optimizedOrder.sections;
        }
        return [];
    }, [state.optimizedOrder]);

    // ========================================================================
    // Collective Intelligence
    // ========================================================================

    const contributeInsight = useCallback(
        (sectionId: string, data: Partial<typeof state.collectiveInsights[0]>) => {
            collectiveInsightStorage.updateInsight(courseId, chapterId, sectionId, (current) => {
                if (!current) {
                    return {
                        sectionId,
                        chapterId,
                        averageTimeSpent: data.averageTimeSpent || 0,
                        medianTimeSpent: data.medianTimeSpent || 0,
                        dropoffRate: data.dropoffRate || 0,
                        strugglePoints: data.strugglePoints || [],
                        commonErrors: data.commonErrors || [],
                        successPatterns: data.successPatterns || [],
                        peerSolutionUsage: data.peerSolutionUsage || 0,
                        optimalPaths: data.optimalPaths || [],
                    };
                }
                return { ...current, ...data };
            });
        },
        [courseId, chapterId]
    );

    const getCollectiveInsights = useCallback(
        (sectionId: string) => collectiveInsightStorage.getInsight(courseId, chapterId, sectionId),
        [courseId, chapterId]
    );

    // ========================================================================
    // Configuration
    // ========================================================================

    const updateConfig = useCallback((updates: Partial<ConductorConfig>) => {
        conductorConfigStorage.updateConfig(updates);
    }, []);

    // ========================================================================
    // Section Navigation
    // ========================================================================

    const setCurrentSection = useCallback((sectionId: string) => {
        dispatch({ type: "SET_CURRENT_SECTION", payload: sectionId });
    }, []);

    // ========================================================================
    // Effects
    // ========================================================================

    // Load collective insights on mount
    useEffect(() => {
        const insights = collectiveInsightStorage.getAllInsights().filter(
            (i) => i.chapterId === chapterId
        );
        dispatch({ type: "SET_COLLECTIVE_INSIGHTS", payload: insights });
    }, [chapterId]);

    // Load peer solutions when section changes
    useEffect(() => {
        if (config.enablePeerSolutions) {
            const solutions = peerSolutionStorage.getTopSolutions(state.currentSectionId, 5);
            dispatch({ type: "SET_PEER_SOLUTIONS", payload: solutions });
        }
    }, [state.currentSectionId, config.enablePeerSolutions]);

    // ========================================================================
    // Context Value
    // ========================================================================

    const value = useMemo<ConductorContextValue>(
        () => ({
            state,
            config,
            updateProfile,
            getLearnerProfile,
            recordBehavior,
            getNextDecision,
            executeDecision,
            dismissDecision,
            triggerDecision,
            getRemedialContent,
            getPeerSolutions,
            getSectionOrder,
            contributeInsight,
            getCollectiveInsights,
            updateConfig,
            setCurrentSection,
        }),
        [
            state,
            config,
            updateProfile,
            getLearnerProfile,
            recordBehavior,
            getNextDecision,
            executeDecision,
            dismissDecision,
            triggerDecision,
            getRemedialContent,
            getPeerSolutions,
            getSectionOrder,
            contributeInsight,
            getCollectiveInsights,
            updateConfig,
            setCurrentSection,
        ]
    );

    return <ConductorContext.Provider value={value}>{children}</ConductorContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useLearningConductor(): ConductorContextValue {
    const context = useContext(ConductorContext);
    if (!context) {
        throw new Error("useLearningConductor must be used within a LearningConductorProvider");
    }
    return context;
}

// ============================================================================
// Exports
// ============================================================================

export { ConductorContext };
export type { ConductorContextValue, ConductorProviderProps } from "./types";
