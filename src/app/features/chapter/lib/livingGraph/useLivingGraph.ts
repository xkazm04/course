/**
 * useLivingGraph Hook
 *
 * React hook for accessing the unified living graph that combines
 * static curriculum structure with dynamic behavior weights.
 *
 * The living graph is the "orchestration engine" - it provides:
 * - Node traversability based on prerequisites AND predicted struggle
 * - Adaptive path recommendations
 * - Real-time behavior weight updates
 * - Collective intelligence integration
 */

"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type { ChapterNodeId, ChapterNode } from "../chapterGraph";
import type { CollectiveInsight } from "../conductorTypes";
import type { ImplicitPrerequisite, StrugglePoint, OptimalPath } from "../collectiveIntelligence";
import type {
    LivingGraphState,
    LivingNode,
    LivingEdge,
    AdaptivePath,
    LivingGraphConfig,
    LearnerProfileSummary,
    TraversabilityScore,
    LivingGraphEvent,
    GraphPosition,
    PathOptimizationTarget,
    NodeVisibility,
    DEFAULT_LIVING_GRAPH_CONFIG,
} from "./types";
import { computeTraversability, computeTraversabilityBatch, sortByTraversability } from "./traversability";
import { computeAllLivingEdges, getHighStruggleEdges } from "./behaviorEdges";
import { computeAdaptivePath, getRecommendedNextNode } from "./adaptivePath";
import { CURRICULUM_CHAPTERS, CHAPTER_CURRICULUM_EDGES } from "../curriculumChapters";
import {
    getEmergentCurriculum,
    getImplicitPrerequisitesForChapter,
    getStrugglePointsForChapter,
} from "../collectiveIntelligence";

// ============================================================================
// TYPES
// ============================================================================

export interface UseLivingGraphOptions {
    /** Learner profile for personalization */
    learnerProfile: LearnerProfileSummary;

    /** Completed chapter IDs */
    completedChapterIds: Set<ChapterNodeId>;

    /** Current chapter ID (if any) */
    currentChapterId?: ChapterNodeId;

    /** Configuration */
    config?: Partial<LivingGraphConfig>;

    /** Whether to auto-update */
    autoUpdate?: boolean;

    /** Update interval in milliseconds */
    updateInterval?: number;

    /** Path optimization target */
    optimizeFor?: PathOptimizationTarget;
}

export interface UseLivingGraphReturn {
    /** Current graph state */
    state: LivingGraphState;

    /** Is the graph loading/computing */
    isLoading: boolean;

    /** Last error (if any) */
    error: Error | null;

    /** Get a living node by ID */
    getNode: (nodeId: ChapterNodeId) => LivingNode | undefined;

    /** Get traversability for a node */
    getTraversability: (nodeId: ChapterNodeId) => TraversabilityScore | undefined;

    /** Get all available (traversable) nodes */
    getAvailableNodes: () => LivingNode[];

    /** Get recommended path */
    getRecommendedPath: () => AdaptivePath | null;

    /** Get next recommended node */
    getNextRecommendedNode: () => LivingNode | null;

    /** Check if node should show warning */
    shouldShowWarning: (nodeId: ChapterNodeId) => boolean;

    /** Get warning message for node */
    getWarningMessage: (nodeId: ChapterNodeId) => string | null;

    /** Refresh the graph */
    refresh: () => void;

    /** Update learner profile */
    updateProfile: (profile: Partial<LearnerProfileSummary>) => void;

    /** Mark node as completed */
    markNodeCompleted: (nodeId: ChapterNodeId) => void;

    /** Subscribe to graph events */
    onEvent: (callback: (event: LivingGraphEvent) => void) => () => void;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const defaultConfig: LivingGraphConfig = {
    minSampleSize: 10,
    minEmergentConfidence: 0.7,
    staticPrerequisiteWeight: 0.4,
    emergentPrerequisiteWeight: 0.2,
    collectiveStruggleWeight: 0.25,
    learnerProfileWeight: 0.15,
    lowTraversabilityThreshold: 0.3,
    highStruggleThreshold: 0.6,
    includeEmergentPrerequisites: true,
    recomputeInterval: 60000,
    cacheDuration: 300000,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useLivingGraph(options: UseLivingGraphOptions): UseLivingGraphReturn {
    const {
        learnerProfile: initialProfile,
        completedChapterIds: initialCompleted,
        currentChapterId,
        config: userConfig,
        autoUpdate = true,
        updateInterval = 60000,
        optimizeFor = "balanced",
    } = options;

    // Merge config
    const config = useMemo(
        () => ({ ...defaultConfig, ...userConfig }),
        [userConfig]
    );

    // State
    const [state, setState] = useState<LivingGraphState>(() =>
        createInitialState()
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [learnerProfile, setLearnerProfile] = useState(initialProfile);
    const [completedChapterIds, setCompletedChapterIds] = useState(initialCompleted);

    // Event listeners
    const eventListenersRef = useRef<Set<(event: LivingGraphEvent) => void>>(new Set());

    // Emit event helper
    const emitEvent = useCallback((event: LivingGraphEvent) => {
        eventListenersRef.current.forEach((listener) => listener(event));
    }, []);

    // ========================================================================
    // GRAPH COMPUTATION
    // ========================================================================

    const computeGraph = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get collective intelligence data
            const curriculum = getEmergentCurriculum();
            const implicitPrerequisites = curriculum?.implicitPrerequisites ?? [];
            const strugglePoints = curriculum?.strugglePoints ?? [];
            const optimalPaths = curriculum?.optimalPaths ?? [];

            // Build collective insights map
            const collectiveInsights = new Map<ChapterNodeId, CollectiveInsight>();
            if (curriculum?.strugglePoints) {
                // Group struggle points by chapter
                for (const sp of curriculum.strugglePoints) {
                    if (!collectiveInsights.has(sp.chapterId)) {
                        collectiveInsights.set(sp.chapterId, {
                            sectionId: sp.sectionId,
                            chapterId: sp.chapterId,
                            averageTimeSpent: 0,
                            medianTimeSpent: 0,
                            dropoffRate: sp.severity,
                            strugglePoints: [],
                            commonErrors: [],
                            successPatterns: [],
                            peerSolutionUsage: 0,
                            optimalPaths: [],
                        });
                    }
                }
            }

            // Compute traversability for all nodes
            const nodeIds = CURRICULUM_CHAPTERS.map((ch) => ch.id);
            const traversabilityMap = computeTraversabilityBatch(
                nodeIds,
                completedChapterIds,
                learnerProfile,
                config,
                collectiveInsights,
                implicitPrerequisites,
                strugglePoints
            );

            // Compute living edges
            const livingEdges = computeAllLivingEdges(
                CHAPTER_CURRICULUM_EDGES,
                implicitPrerequisites,
                collectiveInsights,
                strugglePoints,
                config
            );

            // Build living nodes
            const livingNodes = new Map<ChapterNodeId, LivingNode>();

            for (const chapter of CURRICULUM_CHAPTERS) {
                const traversability = traversabilityMap.get(chapter.id) ?? createDefaultTraversability();
                const nodeStrugglePoints = strugglePoints.filter(
                    (sp) => sp.chapterId === chapter.id
                );

                // Compute predicted duration based on profile
                const paceMultiplier = getPaceMultiplier(learnerProfile.pace);
                const predictedDuration = Math.round(chapter.durationMinutes * paceMultiplier);

                // Compute predicted success rate
                const predictedSuccessRate = 1 - traversability.predictedStruggle;

                // Determine visibility
                const visibility = determineVisibility(
                    chapter.id,
                    completedChapterIds,
                    traversability
                );

                // Get edges for this node
                const outgoingEdges = livingEdges.filter((e) => e.from === chapter.id);
                const incomingEdges = livingEdges.filter((e) => e.to === chapter.id);

                livingNodes.set(chapter.id, {
                    ...chapter,
                    title: chapter.name, // Map name to title for compatibility
                    traversability,
                    collectiveInsight: collectiveInsights.get(chapter.id),
                    strugglePoints: nodeStrugglePoints,
                    outgoingEdges,
                    incomingEdges,
                    predictedDuration,
                    predictedSuccessRate,
                    isOnRecommendedPath: false, // Will be set after path computation
                    visibility,
                });
            }

            // Compute adaptive path
            const currentPath = computeAdaptivePath(
                {
                    startNodeId: currentChapterId ?? null,
                    completedChapterIds,
                    learnerProfile,
                    config,
                    optimizeFor,
                },
                livingNodes,
                livingEdges,
                optimalPaths
            );

            // Mark nodes on recommended path
            if (currentPath) {
                for (const node of currentPath.nodes) {
                    const livingNode = livingNodes.get(node.id);
                    if (livingNode) {
                        livingNode.isOnRecommendedPath = true;
                    }
                }
            }

            // Build edges map
            const edgesMap = new Map<string, LivingEdge>();
            for (const edge of livingEdges) {
                edgesMap.set(`${edge.from}->${edge.to}`, edge);
            }

            // Compute health indicators
            const lowTraversabilityNodes = Array.from(livingNodes.values())
                .filter((n) => n.traversability.score < config.lowTraversabilityThreshold)
                .map((n) => n.id);

            const highStruggleEdges = getHighStruggleEdges(livingEdges, config.highStruggleThreshold)
                .map((e) => `${e.from}->${e.to}`);

            // Find data gaps (nodes with low confidence)
            const dataGaps = Array.from(livingNodes.values())
                .filter((n) => n.traversability.struggleConfidence < 0.3)
                .map((n) => n.id);

            // Update state
            setState({
                nodes: livingNodes,
                edges: edgesMap,
                currentPath,
                alternativePaths: [], // Could compute alternatives here
                metrics: {
                    totalNodes: livingNodes.size,
                    nodesWithBehaviorData: Array.from(livingNodes.values()).filter(
                        (n) => n.collectiveInsight
                    ).length,
                    edgesWithBehaviorWeights: livingEdges.filter((e) => e.behaviorWeight).length,
                    avgTraversability:
                        Array.from(livingNodes.values()).reduce(
                            (sum, n) => sum + n.traversability.score,
                            0
                        ) / livingNodes.size,
                    collectiveIntelligenceCoverage:
                        curriculum ? Math.min(1, curriculum.implicitPrerequisites.length / nodeIds.length) : 0,
                },
                currentPosition: {
                    currentNode: currentChapterId ?? null,
                    nodeProgress: 0,
                    pathProgress: currentPath
                        ? completedChapterIds.size / currentPath.nodes.length
                        : 0,
                    completedNodes: completedChapterIds,
                    inProgressNodes: currentChapterId ? new Set([currentChapterId]) : new Set(),
                },
                health: {
                    lowTraversabilityNodes,
                    highStruggleEdges,
                    dataGaps,
                    potentialDeadEnds: [], // Could compute dead ends
                    conflictingSignalNodes: [], // Could identify conflicts
                },
                lastUpdated: Date.now(),
            });
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setIsLoading(false);
        }
    }, [
        completedChapterIds,
        learnerProfile,
        config,
        currentChapterId,
        optimizeFor,
    ]);

    // Initial computation
    useEffect(() => {
        computeGraph();
    }, [computeGraph]);

    // Auto-update
    useEffect(() => {
        if (!autoUpdate) return;

        const interval = setInterval(() => {
            computeGraph();
        }, updateInterval);

        return () => clearInterval(interval);
    }, [autoUpdate, updateInterval, computeGraph]);

    // ========================================================================
    // ACCESSORS
    // ========================================================================

    const getNode = useCallback(
        (nodeId: ChapterNodeId): LivingNode | undefined => {
            return state.nodes.get(nodeId);
        },
        [state.nodes]
    );

    const getTraversability = useCallback(
        (nodeId: ChapterNodeId): TraversabilityScore | undefined => {
            return state.nodes.get(nodeId)?.traversability;
        },
        [state.nodes]
    );

    const getAvailableNodes = useCallback((): LivingNode[] => {
        return Array.from(state.nodes.values())
            .filter(
                (node) =>
                    !completedChapterIds.has(node.id) &&
                    node.traversability.recommendation !== "blocked"
            )
            .sort((a, b) => b.traversability.score - a.traversability.score);
    }, [state.nodes, completedChapterIds]);

    const getRecommendedPath = useCallback((): AdaptivePath | null => {
        return state.currentPath;
    }, [state.currentPath]);

    const getNextRecommendedNode = useCallback((): LivingNode | null => {
        return getRecommendedNextNode(
            currentChapterId ?? null,
            completedChapterIds,
            state.nodes,
            Array.from(state.edges.values())
        );
    }, [currentChapterId, completedChapterIds, state.nodes, state.edges]);

    const shouldShowWarning = useCallback(
        (nodeId: ChapterNodeId): boolean => {
            const node = state.nodes.get(nodeId);
            if (!node) return false;

            return (
                node.traversability.recommendation === "consider_prerequisites" ||
                node.traversability.recommendation === "proceed_with_caution" ||
                node.traversability.predictedStruggle > 0.5
            );
        },
        [state.nodes]
    );

    const getWarningMessage = useCallback(
        (nodeId: ChapterNodeId): string | null => {
            const node = state.nodes.get(nodeId);
            if (!node) return null;

            const { traversability } = node;

            if (!traversability.prerequisitesMet) {
                const staticFactor = traversability.factors.find(
                    (f) => f.type === "static_prerequisite"
                );
                return staticFactor?.description ?? "Missing prerequisites";
            }

            if (!traversability.emergentPrerequisitesMet) {
                const emergentFactor = traversability.factors.find(
                    (f) => f.type === "emergent_prerequisite"
                );
                return (
                    emergentFactor?.description ??
                    "Recommended prerequisites based on learner behavior"
                );
            }

            if (traversability.predictedStruggle > 0.5) {
                const struggleFactor = traversability.factors.find(
                    (f) => f.type === "collective_struggle"
                );
                return struggleFactor?.description ?? "High predicted difficulty";
            }

            return null;
        },
        [state.nodes]
    );

    // ========================================================================
    // ACTIONS
    // ========================================================================

    const refresh = useCallback(() => {
        computeGraph();
    }, [computeGraph]);

    const updateProfile = useCallback(
        (updates: Partial<LearnerProfileSummary>) => {
            setLearnerProfile((prev) => ({ ...prev, ...updates }));
        },
        []
    );

    const markNodeCompleted = useCallback(
        (nodeId: ChapterNodeId) => {
            setCompletedChapterIds((prev) => new Set([...prev, nodeId]));

            // Emit event
            emitEvent({
                type: "checkpoint_reached",
                checkpointId: nodeId,
                passed: true,
            });
        },
        [emitEvent]
    );

    const onEvent = useCallback(
        (callback: (event: LivingGraphEvent) => void): (() => void) => {
            eventListenersRef.current.add(callback);
            return () => {
                eventListenersRef.current.delete(callback);
            };
        },
        []
    );

    return {
        state,
        isLoading,
        error,
        getNode,
        getTraversability,
        getAvailableNodes,
        getRecommendedPath,
        getNextRecommendedNode,
        shouldShowWarning,
        getWarningMessage,
        refresh,
        updateProfile,
        markNodeCompleted,
        onEvent,
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createInitialState(): LivingGraphState {
    return {
        nodes: new Map(),
        edges: new Map(),
        currentPath: null,
        alternativePaths: [],
        metrics: {
            totalNodes: 0,
            nodesWithBehaviorData: 0,
            edgesWithBehaviorWeights: 0,
            avgTraversability: 0,
            collectiveIntelligenceCoverage: 0,
        },
        currentPosition: {
            currentNode: null,
            nodeProgress: 0,
            pathProgress: 0,
            completedNodes: new Set(),
            inProgressNodes: new Set(),
        },
        health: {
            lowTraversabilityNodes: [],
            highStruggleEdges: [],
            dataGaps: [],
            potentialDeadEnds: [],
            conflictingSignalNodes: [],
        },
        lastUpdated: 0,
    };
}

function createDefaultTraversability(): TraversabilityScore {
    return {
        score: 0.5,
        prerequisitesMet: true,
        emergentPrerequisitesMet: true,
        predictedStruggle: 0.3,
        struggleConfidence: 0.2,
        recommendation: "proceed",
        factors: [],
    };
}

function getPaceMultiplier(pace: LearnerProfileSummary["pace"]): number {
    switch (pace) {
        case "accelerated":
            return 0.7;
        case "fast":
            return 0.85;
        case "normal":
            return 1.0;
        case "slow":
            return 1.3;
        case "struggling":
            return 1.6;
    }
}

function determineVisibility(
    nodeId: ChapterNodeId,
    completedChapterIds: Set<ChapterNodeId>,
    traversability: TraversabilityScore
): NodeVisibility {
    if (completedChapterIds.has(nodeId)) {
        return "visible";
    }

    if (traversability.recommendation === "blocked") {
        return "preview";
    }

    if (traversability.score < 0.3) {
        return "hinted";
    }

    return "visible";
}

export default useLivingGraph;
