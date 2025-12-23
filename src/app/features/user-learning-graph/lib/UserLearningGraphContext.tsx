"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";
import type { LearningDomainId } from "@/app/shared/lib/learningDomains";
import type {
    UserLearningGraph,
    UserNodeState,
    UserPathBranch,
    GraphMutation,
    UserNodeStatus,
    NodeSuggestion,
    PathRecommendation,
    LearningStrategyProfile,
} from "./types";
import {
    selectPath,
    startNode,
    completeNode,
    skipNode,
    bookmarkNode,
    unbookmarkNode,
    updateNodeProgress,
    abandonPath,
    resetNodeProgress,
    recalculateAnalytics,
    queryMutations,
    aggregateMutations,
} from "./graphMutations";
import {
    getUserLearningGraph,
    saveUserLearningGraph,
    exportUserLearningGraph,
    importUserLearningGraph,
    downloadUserLearningGraph,
    clearUserLearningGraph,
    getRecentMutations,
} from "./graphStorage";

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface UserLearningGraphContextValue {
    // Graph state
    graph: UserLearningGraph;
    isLoading: boolean;

    // Node state accessors
    getNodeState: (nodeId: string) => UserNodeState | undefined;
    getNodeStatus: (nodeId: string) => UserNodeStatus;
    isNodeCompleted: (nodeId: string) => boolean;
    isNodeInProgress: (nodeId: string) => boolean;
    isNodeBookmarked: (nodeId: string) => boolean;
    isNodeSkipped: (nodeId: string) => boolean;

    // Path state accessors
    getPathBranch: (pathId: LearningDomainId) => UserPathBranch | undefined;
    isPathSelected: (pathId: LearningDomainId) => boolean;
    isPrimaryPath: (pathId: LearningDomainId) => boolean;
    getPathProgress: (pathId: LearningDomainId) => number;
    getSelectedPaths: () => LearningDomainId[];
    getPrimaryPath: () => LearningDomainId | undefined;

    // Node mutations
    selectLearningPath: (pathId: LearningDomainId, makePrimary?: boolean) => void;
    startLearningNode: (nodeId: string, pathId?: LearningDomainId, skippedPrereqs?: string[]) => void;
    completeLearningNode: (nodeId: string, pathId?: LearningDomainId, timeSpent?: number) => void;
    skipLearningNode: (nodeId: string, pathId?: LearningDomainId) => void;
    bookmarkLearningNode: (nodeId: string, pathId?: LearningDomainId) => void;
    unbookmarkLearningNode: (nodeId: string) => void;
    updateLearningProgress: (nodeId: string, progress: number, timeSpent?: number) => void;
    resetLearningNode: (nodeId: string) => void;

    // Path mutations
    abandonLearningPath: (pathId: LearningDomainId) => void;

    // Analytics
    getRecentActivity: (limit?: number) => GraphMutation[];
    getStrategyProfile: () => LearningStrategyProfile;
    getSuggestedNodes: (limit?: number) => NodeSuggestion[];
    getPathRecommendations: (limit?: number) => PathRecommendation[];

    // Export/Import
    exportGraph: (includeMutationHistory?: boolean) => string;
    importGraph: (jsonString: string, merge?: boolean) => boolean;
    downloadGraph: (filename?: string) => void;
    clearGraph: () => void;

    // Utility
    refresh: () => void;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const UserLearningGraphContext = createContext<UserLearningGraphContextValue | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface UserLearningGraphProviderProps {
    children: ReactNode;
}

export function UserLearningGraphProvider({ children }: UserLearningGraphProviderProps) {
    const [graph, setGraph] = useState<UserLearningGraph>(() => getUserLearningGraph());
    const [isLoading, setIsLoading] = useState(true);

    // Initialize on mount
    useEffect(() => {
        setGraph(getUserLearningGraph());
        setIsLoading(false);

        // Listen for storage changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "user-learning-graph") {
                setGraph(getUserLearningGraph());
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Save graph whenever it changes
    const updateGraph = useCallback((updater: (current: UserLearningGraph) => UserLearningGraph) => {
        setGraph((current) => {
            const updated = updater(current);
            saveUserLearningGraph(updated);
            return updated;
        });
    }, []);

    // ========================================================================
    // NODE STATE ACCESSORS
    // ========================================================================

    const getNodeState = useCallback(
        (nodeId: string): UserNodeState | undefined => graph.nodes[nodeId],
        [graph.nodes]
    );

    const getNodeStatus = useCallback(
        (nodeId: string): UserNodeStatus => graph.nodes[nodeId]?.status ?? "not_started",
        [graph.nodes]
    );

    const isNodeCompleted = useCallback(
        (nodeId: string): boolean => graph.nodes[nodeId]?.status === "completed",
        [graph.nodes]
    );

    const isNodeInProgress = useCallback(
        (nodeId: string): boolean => graph.nodes[nodeId]?.status === "in_progress",
        [graph.nodes]
    );

    const isNodeBookmarked = useCallback(
        (nodeId: string): boolean => graph.nodes[nodeId]?.status === "bookmarked",
        [graph.nodes]
    );

    const isNodeSkipped = useCallback(
        (nodeId: string): boolean => graph.nodes[nodeId]?.status === "skipped",
        [graph.nodes]
    );

    // ========================================================================
    // PATH STATE ACCESSORS
    // ========================================================================

    const getPathBranch = useCallback(
        (pathId: LearningDomainId): UserPathBranch | undefined => graph.paths[pathId],
        [graph.paths]
    );

    const isPathSelected = useCallback(
        (pathId: LearningDomainId): boolean => {
            const path = graph.paths[pathId];
            return path !== undefined && !path.isAbandoned;
        },
        [graph.paths]
    );

    const isPrimaryPath = useCallback(
        (pathId: LearningDomainId): boolean => graph.paths[pathId]?.isPrimary ?? false,
        [graph.paths]
    );

    const getPathProgress = useCallback(
        (pathId: LearningDomainId): number => graph.paths[pathId]?.progress ?? 0,
        [graph.paths]
    );

    const getSelectedPaths = useCallback((): LearningDomainId[] => {
        return (Object.keys(graph.paths) as LearningDomainId[]).filter(
            (pathId) => !graph.paths[pathId]?.isAbandoned
        );
    }, [graph.paths]);

    const getPrimaryPath = useCallback((): LearningDomainId | undefined => {
        const primaryEntry = (Object.entries(graph.paths) as [LearningDomainId, UserPathBranch][]).find(
            ([, branch]) => branch.isPrimary && !branch.isAbandoned
        );
        return primaryEntry?.[0];
    }, [graph.paths]);

    // ========================================================================
    // NODE MUTATIONS
    // ========================================================================

    const selectLearningPath = useCallback(
        (pathId: LearningDomainId, makePrimary: boolean = true) => {
            updateGraph((current) =>
                selectPath(current, pathId, { makePrimary, source: "user-action" })
            );
        },
        [updateGraph]
    );

    const startLearningNode = useCallback(
        (nodeId: string, pathId?: LearningDomainId, skippedPrereqs?: string[]) => {
            updateGraph((current) =>
                startNode(current, nodeId, {
                    pathId,
                    source: "user-action",
                    skippedPrerequisites: skippedPrereqs,
                })
            );
        },
        [updateGraph]
    );

    const completeLearningNode = useCallback(
        (nodeId: string, pathId?: LearningDomainId, timeSpent?: number) => {
            updateGraph((current) =>
                recalculateAnalytics(
                    completeNode(current, nodeId, {
                        pathId,
                        source: "user-action",
                        timeSpentMinutes: timeSpent,
                    })
                )
            );
        },
        [updateGraph]
    );

    const skipLearningNode = useCallback(
        (nodeId: string, pathId?: LearningDomainId) => {
            updateGraph((current) =>
                recalculateAnalytics(
                    skipNode(current, nodeId, { pathId, source: "user-action" })
                )
            );
        },
        [updateGraph]
    );

    const bookmarkLearningNode = useCallback(
        (nodeId: string, pathId?: LearningDomainId) => {
            updateGraph((current) =>
                bookmarkNode(current, nodeId, { pathId, source: "user-action" })
            );
        },
        [updateGraph]
    );

    const unbookmarkLearningNode = useCallback(
        (nodeId: string) => {
            updateGraph((current) =>
                unbookmarkNode(current, nodeId, { source: "user-action" })
            );
        },
        [updateGraph]
    );

    const updateLearningProgress = useCallback(
        (nodeId: string, progress: number, timeSpent?: number) => {
            updateGraph((current) =>
                updateNodeProgress(current, nodeId, progress, { timeSpentMinutes: timeSpent })
            );
        },
        [updateGraph]
    );

    const resetLearningNode = useCallback(
        (nodeId: string) => {
            updateGraph((current) =>
                recalculateAnalytics(
                    resetNodeProgress(current, nodeId, { source: "user-action" })
                )
            );
        },
        [updateGraph]
    );

    // ========================================================================
    // PATH MUTATIONS
    // ========================================================================

    const abandonLearningPath = useCallback(
        (pathId: LearningDomainId) => {
            updateGraph((current) =>
                recalculateAnalytics(
                    abandonPath(current, pathId, { source: "user-action" })
                )
            );
        },
        [updateGraph]
    );

    // ========================================================================
    // ANALYTICS
    // ========================================================================

    const getRecentActivity = useCallback(
        (limit: number = 10): GraphMutation[] => {
            return getRecentMutations(limit);
        },
        []
    );

    const getStrategyProfile = useCallback((): LearningStrategyProfile => {
        return graph.analytics.strategyProfile;
    }, [graph.analytics.strategyProfile]);

    const getSuggestedNodes = useCallback(
        (limit: number = 5): NodeSuggestion[] => {
            // Simple suggestion algorithm based on graph state
            const suggestions: NodeSuggestion[] = [];

            // 1. Continue in-progress nodes
            Object.values(graph.nodes)
                .filter((n) => n.status === "in_progress")
                .forEach((n) => {
                    suggestions.push({
                        nodeId: n.nodeId,
                        priority: 100 - n.progress, // Higher priority for less complete
                        suggestionType: "continue",
                        reason: `Continue where you left off (${n.progress}% complete)`,
                    });
                });

            // 2. Bookmarked nodes
            Object.values(graph.nodes)
                .filter((n) => n.status === "bookmarked")
                .forEach((n) => {
                    suggestions.push({
                        nodeId: n.nodeId,
                        priority: 50,
                        suggestionType: "explore",
                        reason: "You bookmarked this for later",
                    });
                });

            // 3. Skill gaps from analytics
            graph.analytics.skillGaps.forEach((nodeId) => {
                if (!suggestions.some((s) => s.nodeId === nodeId)) {
                    suggestions.push({
                        nodeId,
                        priority: 30,
                        suggestionType: "fill_gap",
                        reason: "Recommended to fill a skill gap",
                    });
                }
            });

            // Sort by priority and limit
            return suggestions.sort((a, b) => b.priority - a.priority).slice(0, limit);
        },
        [graph.nodes, graph.analytics.skillGaps]
    );

    const getPathRecommendations = useCallback(
        (limit: number = 3): PathRecommendation[] => {
            const recommendations: PathRecommendation[] = [];
            const selectedPaths = new Set(getSelectedPaths());

            // Simple recommendation: suggest paths not yet selected
            const allPaths: LearningDomainId[] = [
                "frontend",
                "backend",
                "fullstack",
                "databases",
                "games",
                "mobile",
            ];

            allPaths.forEach((pathId) => {
                if (!selectedPaths.has(pathId)) {
                    recommendations.push({
                        pathId,
                        confidence: 0.7,
                        reason: "Expand your skills in a new area",
                        estimatedHours: 100, // Placeholder
                        prerequisiteOverlap: 0.3, // Placeholder
                        skillGapCoverage: 0.5, // Placeholder
                    });
                }
            });

            return recommendations.slice(0, limit);
        },
        [getSelectedPaths]
    );

    // ========================================================================
    // EXPORT / IMPORT
    // ========================================================================

    const exportGraph = useCallback(
        (includeMutationHistory: boolean = true): string => {
            return exportUserLearningGraph({ includeMutationHistory });
        },
        []
    );

    const importGraphData = useCallback(
        (jsonString: string, merge: boolean = false): boolean => {
            const result = importUserLearningGraph(jsonString, { merge });
            if (result.success) {
                setGraph(getUserLearningGraph());
            }
            return result.success;
        },
        []
    );

    const downloadGraph = useCallback((filename?: string) => {
        downloadUserLearningGraph(filename);
    }, []);

    const clearGraph = useCallback(() => {
        clearUserLearningGraph();
        setGraph(getUserLearningGraph());
    }, []);

    // ========================================================================
    // UTILITY
    // ========================================================================

    const refresh = useCallback(() => {
        setGraph(getUserLearningGraph());
    }, []);

    // ========================================================================
    // CONTEXT VALUE
    // ========================================================================

    const value = useMemo<UserLearningGraphContextValue>(
        () => ({
            // State
            graph,
            isLoading,

            // Node accessors
            getNodeState,
            getNodeStatus,
            isNodeCompleted,
            isNodeInProgress,
            isNodeBookmarked,
            isNodeSkipped,

            // Path accessors
            getPathBranch,
            isPathSelected,
            isPrimaryPath,
            getPathProgress,
            getSelectedPaths,
            getPrimaryPath,

            // Node mutations
            selectLearningPath,
            startLearningNode,
            completeLearningNode,
            skipLearningNode,
            bookmarkLearningNode,
            unbookmarkLearningNode,
            updateLearningProgress,
            resetLearningNode,

            // Path mutations
            abandonLearningPath,

            // Analytics
            getRecentActivity,
            getStrategyProfile,
            getSuggestedNodes,
            getPathRecommendations,

            // Export/Import
            exportGraph,
            importGraph: importGraphData,
            downloadGraph,
            clearGraph,

            // Utility
            refresh,
        }),
        [
            graph,
            isLoading,
            getNodeState,
            getNodeStatus,
            isNodeCompleted,
            isNodeInProgress,
            isNodeBookmarked,
            isNodeSkipped,
            getPathBranch,
            isPathSelected,
            isPrimaryPath,
            getPathProgress,
            getSelectedPaths,
            getPrimaryPath,
            selectLearningPath,
            startLearningNode,
            completeLearningNode,
            skipLearningNode,
            bookmarkLearningNode,
            unbookmarkLearningNode,
            updateLearningProgress,
            resetLearningNode,
            abandonLearningPath,
            getRecentActivity,
            getStrategyProfile,
            getSuggestedNodes,
            getPathRecommendations,
            exportGraph,
            importGraphData,
            downloadGraph,
            clearGraph,
            refresh,
        ]
    );

    return (
        <UserLearningGraphContext.Provider value={value}>
            {children}
        </UserLearningGraphContext.Provider>
    );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access the user learning graph context
 */
export function useUserLearningGraph(): UserLearningGraphContextValue {
    const context = useContext(UserLearningGraphContext);

    if (!context) {
        throw new Error(
            "useUserLearningGraph must be used within a UserLearningGraphProvider"
        );
    }

    return context;
}

/**
 * Lightweight hook for just checking node status (minimal re-renders)
 */
export function useNodeStatus(nodeId: string): UserNodeStatus {
    const { getNodeStatus } = useUserLearningGraph();
    return getNodeStatus(nodeId);
}

/**
 * Lightweight hook for checking path selection status
 */
export function usePathStatus(pathId: LearningDomainId): {
    isSelected: boolean;
    isPrimary: boolean;
    progress: number;
} {
    const { isPathSelected, isPrimaryPath, getPathProgress } = useUserLearningGraph();
    return {
        isSelected: isPathSelected(pathId),
        isPrimary: isPrimaryPath(pathId),
        progress: getPathProgress(pathId),
    };
}
