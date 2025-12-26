"use client";

import React, {
    createContext,
    useContext,
    useReducer,
    useCallback,
    useEffect,
    ReactNode,
} from "react";
import type {
    AdaptiveLearningState,
    AdaptiveLearningAction,
    LearnerProfile,
    PathRecommendation,
    CompletionPrediction,
    AdaptationSuggestion,
    LearningAnalytics,
    LearningSession,
    JobMarketData,
} from "./types";
import {
    getLearnerProfile,
    createDefaultProfile,
    saveLearnerProfile,
    startLearningSession,
    endLearningSession,
    getActiveSession,
    recordNodeView,
    markNodeCompleted,
    markNodeInProgress,
} from "./behaviorStorage";
import {
    lazyGenerateRecommendations,
    lazyGeneratePredictions,
    lazyAnalyzeLearningData,
    preloadEngine,
} from "./lazyPredictionEngine";

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AdaptiveLearningState = {
    profile: null,
    recommendations: [],
    predictions: {},
    suggestions: [],
    jobMarketData: {},
    analytics: null,
    isLoading: true,
    lastRefresh: null,
    activeSession: null,
};

// ============================================================================
// REDUCER
// ============================================================================

function adaptiveLearningReducer(
    state: AdaptiveLearningState,
    action: AdaptiveLearningAction
): AdaptiveLearningState {
    switch (action.type) {
        case "SET_PROFILE":
            return { ...state, profile: action.payload };

        case "UPDATE_PROFILE":
            if (!state.profile) return state;
            return {
                ...state,
                profile: { ...state.profile, ...action.payload },
            };

        case "SET_RECOMMENDATIONS":
            return { ...state, recommendations: action.payload };

        case "SET_PREDICTIONS":
            return { ...state, predictions: action.payload };

        case "ADD_SUGGESTION":
            return {
                ...state,
                suggestions: [action.payload, ...state.suggestions].slice(0, 10),
            };

        case "DISMISS_SUGGESTION":
            return {
                ...state,
                suggestions: state.suggestions.filter(s => s.title !== action.payload),
            };

        case "SET_ANALYTICS":
            return { ...state, analytics: action.payload };

        case "SET_JOB_MARKET_DATA":
            return {
                ...state,
                jobMarketData: {
                    ...state.jobMarketData,
                    [action.payload.role]: action.payload.data,
                },
            };

        case "START_SESSION":
            return { ...state, activeSession: action.payload };

        case "END_SESSION":
            return { ...state, activeSession: null };

        case "RECORD_NODE_VIEW":
            if (!state.profile) return state;
            // Update in-progress nodes if not already tracked
            const inProgressNodes = state.profile.inProgressNodes.includes(action.payload.nodeId)
                ? state.profile.inProgressNodes
                : [...state.profile.inProgressNodes, action.payload.nodeId].filter(
                    id => !state.profile!.completedNodes.includes(id)
                );
            return {
                ...state,
                profile: {
                    ...state.profile,
                    inProgressNodes,
                },
            };

        case "RECORD_NODE_COMPLETION":
            if (!state.profile) return state;
            return {
                ...state,
                profile: {
                    ...state.profile,
                    completedNodes: state.profile.completedNodes.includes(action.payload)
                        ? state.profile.completedNodes
                        : [...state.profile.completedNodes, action.payload],
                    inProgressNodes: state.profile.inProgressNodes.filter(id => id !== action.payload),
                },
            };

        case "SET_LOADING":
            return { ...state, isLoading: action.payload };

        case "REFRESH":
            return { ...state, lastRefresh: new Date() };

        default:
            return state;
    }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface AdaptiveLearningContextValue {
    state: AdaptiveLearningState;
    // Profile actions
    initializeProfile: () => void;
    updateProfile: (updates: Partial<LearnerProfile>) => void;
    // Session actions
    startSession: () => void;
    endSession: () => void;
    // Node tracking actions
    viewNode: (nodeId: string, durationSeconds: number) => void;
    completeNode: (nodeId: string) => void;
    // Recommendation actions
    refreshRecommendations: () => Promise<void>;
    getPredictionForNode: (nodeId: string) => CompletionPrediction | null;
    getRecommendedPath: () => PathRecommendation | null;
    // Suggestion actions
    dismissSuggestion: (title: string) => void;
    // Engine preloading (for anticipatory loading on hover, etc.)
    preloadPredictionEngine: () => void;
}

const AdaptiveLearningContext = createContext<AdaptiveLearningContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface AdaptiveLearningProviderProps {
    children: ReactNode;
}

export function AdaptiveLearningProvider({ children }: AdaptiveLearningProviderProps) {
    const [state, dispatch] = useReducer(adaptiveLearningReducer, initialState);

    // Initialize profile on mount
    const initializeProfile = useCallback(() => {
        let profile = getLearnerProfile();
        if (!profile) {
            profile = createDefaultProfile();
            saveLearnerProfile(profile);
        }
        dispatch({ type: "SET_PROFILE", payload: profile });

        // Check for active session
        const activeSession = getActiveSession();
        if (activeSession) {
            dispatch({ type: "START_SESSION", payload: activeSession });
        }

        dispatch({ type: "SET_LOADING", payload: false });
    }, []);

    // Update profile
    const updateProfile = useCallback((updates: Partial<LearnerProfile>) => {
        if (!state.profile) return;
        const updated = { ...state.profile, ...updates };
        saveLearnerProfile(updated);
        dispatch({ type: "UPDATE_PROFILE", payload: updates });
    }, [state.profile]);

    // Session management
    const startSession = useCallback(() => {
        const session = startLearningSession();
        dispatch({ type: "START_SESSION", payload: session });
    }, []);

    const endSession = useCallback(() => {
        endLearningSession();
        dispatch({ type: "END_SESSION" });
    }, []);

    // Node tracking
    const viewNode = useCallback((nodeId: string, durationSeconds: number) => {
        recordNodeView(nodeId, durationSeconds);
        markNodeInProgress(nodeId);
        dispatch({ type: "RECORD_NODE_VIEW", payload: { nodeId, duration: durationSeconds } });
    }, []);

    const completeNode = useCallback((nodeId: string) => {
        markNodeCompleted(nodeId);
        dispatch({ type: "RECORD_NODE_COMPLETION", payload: nodeId });

        // Generate suggestion for next step
        if (state.recommendations.length > 0) {
            const nextNodeId = findNextRecommendedNode(nodeId, state.recommendations, state.profile?.completedNodes || []);
            if (nextNodeId) {
                const suggestion: AdaptationSuggestion = {
                    type: "path_adjustment",
                    severity: "suggestion",
                    title: "Great progress! Here's your next step",
                    message: "Based on your learning path, we recommend continuing with the next topic.",
                    action: { type: "navigate", targetNodeId: nextNodeId },
                    generatedAt: new Date(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                };
                dispatch({ type: "ADD_SUGGESTION", payload: suggestion });
            }
        }
    }, [state.recommendations, state.profile?.completedNodes]);

    // Refresh recommendations (lazy-loads prediction engine on first call)
    const refreshRecommendations = useCallback(async () => {
        if (!state.profile) return;

        dispatch({ type: "SET_LOADING", payload: true });

        try {
            // Generate new recommendations based on profile (lazy-loads engine)
            const recommendations = await lazyGenerateRecommendations(state.profile);
            dispatch({ type: "SET_RECOMMENDATIONS", payload: recommendations });

            // Generate predictions for all nodes in recommendations
            const nodeIds = recommendations.flatMap(r => r.nodeIds);
            const uniqueNodeIds = [...new Set(nodeIds)];
            const predictions = await lazyGeneratePredictions(state.profile, uniqueNodeIds);
            dispatch({ type: "SET_PREDICTIONS", payload: predictions });

            // Analyze learning data
            const analytics = await lazyAnalyzeLearningData(state.profile);
            dispatch({ type: "SET_ANALYTICS", payload: analytics });

            // Check for suggestions based on analytics
            generateAdaptationSuggestions(analytics, state.profile, dispatch);

            dispatch({ type: "REFRESH" });
        } catch (error) {
            console.error("Failed to refresh recommendations:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    }, [state.profile]);

    // Get prediction for a specific node
    const getPredictionForNode = useCallback((nodeId: string): CompletionPrediction | null => {
        return state.predictions[nodeId] || null;
    }, [state.predictions]);

    // Get the top recommended path
    const getRecommendedPath = useCallback((): PathRecommendation | null => {
        if (state.recommendations.length === 0) return null;
        return state.recommendations.reduce((best, current) =>
            current.optimality > best.optimality ? current : best
        );
    }, [state.recommendations]);

    // Dismiss a suggestion
    const dismissSuggestion = useCallback((title: string) => {
        dispatch({ type: "DISMISS_SUGGESTION", payload: title });
    }, []);

    // Auto-initialize on mount
    useEffect(() => {
        initializeProfile();
    }, [initializeProfile]);

    // Preload prediction engine when user starts a session (likely to use recommendations)
    useEffect(() => {
        if (state.activeSession) {
            preloadEngine();
        }
    }, [state.activeSession]);

    // NOTE: Auto-refresh on mount has been removed for performance optimization.
    // The prediction engine is now lazy-loaded and will only be fetched when:
    // 1. User explicitly calls refreshRecommendations()
    // 2. User starts a learning session (preloads engine)
    // 3. Components that need recommendations call refreshRecommendations()

    const value: AdaptiveLearningContextValue = {
        state,
        initializeProfile,
        updateProfile,
        startSession,
        endSession,
        viewNode,
        completeNode,
        refreshRecommendations,
        getPredictionForNode,
        getRecommendedPath,
        dismissSuggestion,
        preloadPredictionEngine: preloadEngine,
    };

    return (
        <AdaptiveLearningContext.Provider value={value}>
            {children}
        </AdaptiveLearningContext.Provider>
    );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAdaptiveLearning(): AdaptiveLearningContextValue {
    const context = useContext(AdaptiveLearningContext);
    if (!context) {
        throw new Error("useAdaptiveLearning must be used within an AdaptiveLearningProvider");
    }
    return context;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find the next recommended node after completing one
 */
function findNextRecommendedNode(
    completedNodeId: string,
    recommendations: PathRecommendation[],
    completedNodes: string[]
): string | null {
    for (const rec of recommendations) {
        const nodeIndex = rec.nodeIds.indexOf(completedNodeId);
        if (nodeIndex >= 0 && nodeIndex < rec.nodeIds.length - 1) {
            // Find next uncompleted node in this path
            for (let i = nodeIndex + 1; i < rec.nodeIds.length; i++) {
                if (!completedNodes.includes(rec.nodeIds[i])) {
                    return rec.nodeIds[i];
                }
            }
        }
    }
    return null;
}

/**
 * Generate adaptation suggestions based on analytics
 */
function generateAdaptationSuggestions(
    analytics: LearningAnalytics,
    profile: LearnerProfile,
    dispatch: React.Dispatch<AdaptiveLearningAction>
): void {
    // Check for declining velocity
    if (analytics.velocity.classification === "decelerating") {
        dispatch({
            type: "ADD_SUGGESTION",
            payload: {
                type: "pace_change",
                severity: "suggestion",
                title: "Learning pace adjustment",
                message: "Your learning velocity has decreased recently. Consider reviewing your schedule or taking on shorter topics.",
                action: { type: "review_content" },
                generatedAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
    }

    // Check for skill gaps
    if (analytics.skillGaps.overallGapScore > 70) {
        const criticalGap = analytics.skillGaps.gaps.find(g => g.priority === "critical");
        if (criticalGap && criticalGap.relatedNodes.length > 0) {
            dispatch({
                type: "ADD_SUGGESTION",
                payload: {
                    type: "skill_boost",
                    severity: "recommendation",
                    title: `Critical skill gap: ${criticalGap.skill}`,
                    message: `You're missing a critical skill for your career goal. We recommend focusing on this area.`,
                    action: { type: "navigate", targetNodeId: criticalGap.relatedNodes[0] },
                    generatedAt: new Date(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
        }
    }

    // Check for break suggestion
    const lastSession = profile.sessions[0];
    if (lastSession && lastSession.endTime) {
        const sessionDuration = (lastSession.endTime.getTime() - lastSession.startTime.getTime()) / (1000 * 60 * 60);
        if (sessionDuration > 3) {
            dispatch({
                type: "ADD_SUGGESTION",
                payload: {
                    type: "break_suggestion",
                    severity: "info",
                    title: "Take a break",
                    message: "You've been learning for a while. Taking breaks helps with retention!",
                    action: { type: "take_break" },
                    generatedAt: new Date(),
                    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
                },
            });
        }
    }

    // Check streak milestone
    if (profile.currentStreak > 0 && profile.currentStreak % 7 === 0) {
        dispatch({
            type: "ADD_SUGGESTION",
            payload: {
                type: "path_adjustment",
                severity: "info",
                title: `${profile.currentStreak}-day streak! 🔥`,
                message: "Amazing consistency! You're building great learning habits.",
                action: { type: "review_content" },
                generatedAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });
    }
}
