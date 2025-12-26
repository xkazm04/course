/**
 * Concept Entanglement Hooks
 *
 * React hooks for interacting with the bi-directional knowledge graph.
 * Provides easy access to root cause analysis, forward impact,
 * and repair path generation.
 */

"use client";

import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useState,
    useMemo,
    useRef,
    type ReactNode,
} from "react";
import type { BehaviorSignal } from "./types";
import {
    type ConceptEntanglementGraph,
    type ConceptNode,
    type ConceptEdge,
    type ConceptId,
    type ConceptEntanglement,
    type RootCauseResult,
    type ForwardImpactResult,
    type RepairPath,
    type EntanglementState,
    createEmptyGraph,
    addConceptNode,
    addConceptEdge,
    updateConceptEntanglement,
    findRootCause,
    analyzeForwardImpact,
    generateRepairPath,
    updateEdgeWeights,
    recordTransferPattern,
    getStrugglingConcepts,
    getKeystoneConcepts,
    getCriticalPath,
    calculateGraphHealth,
} from "./conceptEntanglementGraph";

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY = "concept-entanglement-graph";
const STORAGE_VERSION = 1;

interface StoredGraphData {
    graph: {
        nodes: Array<[ConceptId, ConceptNode]>;
        edges: ConceptEdge[];
        entanglements: Array<[ConceptId, ConceptEntanglement]>;
        transferPatterns: ConceptEntanglementGraph["transferPatterns"];
        activeRepairPaths: RepairPath[];
        metadata: ConceptEntanglementGraph["metadata"];
    };
    version: number;
}

function loadGraph(courseId: string): ConceptEntanglementGraph {
    if (typeof window === "undefined") return createEmptyGraph(courseId);

    try {
        const stored = localStorage.getItem(`${STORAGE_KEY}-${courseId}`);
        if (!stored) return createEmptyGraph(courseId);

        const data: StoredGraphData = JSON.parse(stored);
        if (data.version !== STORAGE_VERSION) {
            // Migration would go here
            return createEmptyGraph(courseId);
        }

        return {
            nodes: new Map(data.graph.nodes),
            edges: data.graph.edges,
            entanglements: new Map(data.graph.entanglements),
            transferPatterns: data.graph.transferPatterns,
            activeRepairPaths: data.graph.activeRepairPaths,
            metadata: data.graph.metadata,
        };
    } catch {
        return createEmptyGraph(courseId);
    }
}

function saveGraph(graph: ConceptEntanglementGraph): void {
    if (typeof window === "undefined") return;

    try {
        const data: StoredGraphData = {
            graph: {
                nodes: Array.from(graph.nodes.entries()),
                edges: graph.edges,
                entanglements: Array.from(graph.entanglements.entries()),
                transferPatterns: graph.transferPatterns,
                activeRepairPaths: graph.activeRepairPaths,
                metadata: graph.metadata,
            },
            version: STORAGE_VERSION,
        };

        localStorage.setItem(
            `${STORAGE_KEY}-${graph.metadata.courseId}`,
            JSON.stringify(data)
        );
    } catch {
        // Storage full or unavailable
    }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface ConceptEntanglementContextValue {
    // Graph state
    graph: ConceptEntanglementGraph;
    isLoading: boolean;

    // Graph health
    graphHealth: ReturnType<typeof calculateGraphHealth>;

    // Node management
    addConcept: (node: ConceptNode) => void;
    addEdge: (edge: Omit<ConceptEdge, "id">) => void;
    bulkAddConcepts: (nodes: ConceptNode[], edges: Omit<ConceptEdge, "id">[]) => void;

    // Signal recording
    recordConceptSignal: (conceptId: ConceptId, signal: BehaviorSignal) => void;

    // Analysis functions
    findRootCause: (conceptId: ConceptId) => RootCauseResult;
    analyzeForwardImpact: (conceptId: ConceptId) => ForwardImpactResult;
    generateRepairPath: (conceptId: ConceptId) => RepairPath;

    // Learning transfer
    recordTransfer: (
        fromId: ConceptId,
        toId: ConceptId,
        fromScore: number,
        toScore: number,
        success: boolean
    ) => void;

    // Queries
    getConceptEntanglement: (conceptId: ConceptId) => ConceptEntanglement | undefined;
    getStrugglingConcepts: () => ReturnType<typeof getStrugglingConcepts>;
    getKeystoneConcepts: () => ConceptNode[];
    getCriticalPath: () => ConceptId[];

    // Repair paths
    activeRepairPaths: RepairPath[];
    startRepairPath: (targetConceptId: ConceptId) => RepairPath;
    completeRepairStep: (repairPathId: string, conceptId: ConceptId) => void;
    dismissRepairPath: (repairPathId: string) => void;

    // Actions
    resetGraph: () => void;
}

const ConceptEntanglementContext = createContext<ConceptEntanglementContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface ConceptEntanglementProviderProps {
    courseId: string;
    userId?: string;
    children: ReactNode;
    /** Optional initial concepts to seed the graph */
    initialConcepts?: ConceptNode[];
    /** Optional initial edges to seed the graph */
    initialEdges?: Omit<ConceptEdge, "id">[];
}

export function ConceptEntanglementProvider({
    courseId,
    userId,
    children,
    initialConcepts = [],
    initialEdges = [],
}: ConceptEntanglementProviderProps) {
    // Use lazy initialization to load from storage
    const [graph, setGraph] = useState<ConceptEntanglementGraph>(() => {
        const loaded = loadGraph(courseId);

        // Seed with initial concepts if graph is empty
        if (loaded.nodes.size === 0 && initialConcepts.length > 0) {
            let seeded = loaded;
            for (const concept of initialConcepts) {
                seeded = addConceptNode(seeded, concept);
            }
            for (const edge of initialEdges) {
                seeded = addConceptEdge(seeded, edge);
            }
            return seeded;
        }

        return loaded;
    });
    const isLoading = false; // Sync initialization, so never loading
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initializedRef = useRef(false);

    // Mark as initialized on mount
    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true;
        }
    }, []);

    // Debounced save
    const debouncedSave = useCallback((graphToSave: ConceptEntanglementGraph) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveGraph(graphToSave);
        }, 1000);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Add concept
    const handleAddConcept = useCallback(
        (node: ConceptNode) => {
            setGraph((prev) => {
                const updated = addConceptNode(prev, node);
                debouncedSave(updated);
                return updated;
            });
        },
        [debouncedSave]
    );

    // Add edge
    const handleAddEdge = useCallback(
        (edge: Omit<ConceptEdge, "id">) => {
            setGraph((prev) => {
                const updated = addConceptEdge(prev, edge);
                debouncedSave(updated);
                return updated;
            });
        },
        [debouncedSave]
    );

    // Bulk add
    const handleBulkAdd = useCallback(
        (nodes: ConceptNode[], edges: Omit<ConceptEdge, "id">[]) => {
            setGraph((prev) => {
                let updated = prev;
                for (const node of nodes) {
                    updated = addConceptNode(updated, node);
                }
                for (const edge of edges) {
                    updated = addConceptEdge(updated, edge);
                }
                debouncedSave(updated);
                return updated;
            });
        },
        [debouncedSave]
    );

    // Record signal
    const handleRecordSignal = useCallback(
        (conceptId: ConceptId, signal: BehaviorSignal) => {
            setGraph((prev) => {
                const updated = updateConceptEntanglement(prev, conceptId, signal);
                debouncedSave(updated);
                return updated;
            });
        },
        [debouncedSave]
    );

    // Root cause analysis
    const handleFindRootCause = useCallback(
        (conceptId: ConceptId): RootCauseResult => {
            return findRootCause(graph, conceptId);
        },
        [graph]
    );

    // Forward impact
    const handleAnalyzeForwardImpact = useCallback(
        (conceptId: ConceptId): ForwardImpactResult => {
            return analyzeForwardImpact(graph, conceptId);
        },
        [graph]
    );

    // Generate repair path
    const handleGenerateRepairPath = useCallback(
        (conceptId: ConceptId): RepairPath => {
            const rootCause = findRootCause(graph, conceptId);
            return generateRepairPath(graph, conceptId, rootCause);
        },
        [graph]
    );

    // Record transfer
    const handleRecordTransfer = useCallback(
        (
            fromId: ConceptId,
            toId: ConceptId,
            fromScore: number,
            toScore: number,
            success: boolean
        ) => {
            setGraph((prev) => {
                let updated = updateEdgeWeights(prev, fromId, toId, success);
                updated = recordTransferPattern(updated, fromId, toId, fromScore, toScore);
                debouncedSave(updated);
                return updated;
            });
        },
        [debouncedSave]
    );

    // Get entanglement
    const handleGetEntanglement = useCallback(
        (conceptId: ConceptId): ConceptEntanglement | undefined => {
            return graph.entanglements.get(conceptId);
        },
        [graph]
    );

    // Get struggling concepts
    const handleGetStrugglingConcepts = useCallback(() => {
        return getStrugglingConcepts(graph);
    }, [graph]);

    // Get keystone concepts
    const handleGetKeystoneConcepts = useCallback(() => {
        return getKeystoneConcepts(graph);
    }, [graph]);

    // Get critical path
    const handleGetCriticalPath = useCallback(() => {
        return getCriticalPath(graph);
    }, [graph]);

    // Start repair path
    const handleStartRepairPath = useCallback(
        (targetConceptId: ConceptId): RepairPath => {
            const rootCause = findRootCause(graph, targetConceptId);
            const repairPath = generateRepairPath(graph, targetConceptId, rootCause);

            setGraph((prev) => {
                const updated = {
                    ...prev,
                    activeRepairPaths: [...prev.activeRepairPaths, repairPath],
                };
                debouncedSave(updated);
                return updated;
            });

            return repairPath;
        },
        [graph, debouncedSave]
    );

    // Complete repair step
    const handleCompleteRepairStep = useCallback(
        (repairPathId: string, conceptId: ConceptId) => {
            setGraph((prev) => {
                const pathIndex = prev.activeRepairPaths.findIndex((p) => p.id === repairPathId);
                if (pathIndex === -1) return prev;

                const path = prev.activeRepairPaths[pathIndex];
                const stepIndex = path.steps.findIndex((s) => s.conceptId === conceptId);
                if (stepIndex === -1) return prev;

                // Check if all steps are complete
                const completedSteps = stepIndex + 1;
                const isComplete = completedSteps >= path.steps.length;

                const newPaths = isComplete
                    ? prev.activeRepairPaths.filter((p) => p.id !== repairPathId)
                    : prev.activeRepairPaths;

                const updated = {
                    ...prev,
                    activeRepairPaths: newPaths,
                };
                debouncedSave(updated);
                return updated;
            });
        },
        [debouncedSave]
    );

    // Dismiss repair path
    const handleDismissRepairPath = useCallback(
        (repairPathId: string) => {
            setGraph((prev) => {
                const updated = {
                    ...prev,
                    activeRepairPaths: prev.activeRepairPaths.filter((p) => p.id !== repairPathId),
                };
                debouncedSave(updated);
                return updated;
            });
        },
        [debouncedSave]
    );

    // Reset graph
    const handleReset = useCallback(() => {
        const fresh = createEmptyGraph(courseId, userId);
        setGraph(fresh);
        saveGraph(fresh);
    }, [courseId, userId]);

    // Calculate graph health
    const graphHealth = useMemo(() => calculateGraphHealth(graph), [graph]);

    const value: ConceptEntanglementContextValue = {
        graph,
        isLoading,
        graphHealth,
        addConcept: handleAddConcept,
        addEdge: handleAddEdge,
        bulkAddConcepts: handleBulkAdd,
        recordConceptSignal: handleRecordSignal,
        findRootCause: handleFindRootCause,
        analyzeForwardImpact: handleAnalyzeForwardImpact,
        generateRepairPath: handleGenerateRepairPath,
        recordTransfer: handleRecordTransfer,
        getConceptEntanglement: handleGetEntanglement,
        getStrugglingConcepts: handleGetStrugglingConcepts,
        getKeystoneConcepts: handleGetKeystoneConcepts,
        getCriticalPath: handleGetCriticalPath,
        activeRepairPaths: graph.activeRepairPaths,
        startRepairPath: handleStartRepairPath,
        completeRepairStep: handleCompleteRepairStep,
        dismissRepairPath: handleDismissRepairPath,
        resetGraph: handleReset,
    };

    return (
        <ConceptEntanglementContext.Provider value={value}>
            {children}
        </ConceptEntanglementContext.Provider>
    );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Main hook for concept entanglement
 */
export function useConceptEntanglement(): ConceptEntanglementContextValue {
    const context = useContext(ConceptEntanglementContext);
    if (!context) {
        throw new Error(
            "useConceptEntanglement must be used within a ConceptEntanglementProvider"
        );
    }
    return context;
}

/**
 * Optional hook that returns null if not in provider
 */
export function useConceptEntanglementOptional(): ConceptEntanglementContextValue | null {
    return useContext(ConceptEntanglementContext);
}

/**
 * Hook for a specific concept's entanglement state
 */
export function useConceptState(conceptId: ConceptId): {
    entanglement: ConceptEntanglement | undefined;
    state: EntanglementState;
    score: number;
    rootCauses: RootCauseResult | null;
    forwardImpact: ForwardImpactResult | null;
} {
    const context = useConceptEntanglement();
    const { graph, findRootCause, analyzeForwardImpact } = context;

    const entanglement = useMemo(
        () => graph.entanglements.get(conceptId),
        [graph, conceptId]
    );

    const state = entanglement?.state ?? "unknown";
    const score = entanglement?.comprehensionScore ?? 50;

    // Only compute analysis if struggling
    const needsAnalysis = state === "struggling" || state === "collapsed";

    const rootCauses = useMemo(() => {
        if (!needsAnalysis) return null;
        return findRootCause(conceptId);
    }, [needsAnalysis, findRootCause, conceptId]);

    const forwardImpact = useMemo(() => {
        if (!needsAnalysis) return null;
        return analyzeForwardImpact(conceptId);
    }, [needsAnalysis, analyzeForwardImpact, conceptId]);

    return {
        entanglement,
        state,
        score,
        rootCauses,
        forwardImpact,
    };
}

/**
 * Hook for tracking repair path progress
 */
export function useRepairPath(targetConceptId: ConceptId): {
    repairPath: RepairPath | null;
    currentStep: number;
    isActive: boolean;
    start: () => RepairPath;
    completeStep: (conceptId: ConceptId) => void;
    dismiss: () => void;
} {
    const context = useConceptEntanglement();
    const {
        activeRepairPaths,
        startRepairPath,
        completeRepairStep,
        dismissRepairPath,
    } = context;

    const repairPath = useMemo(
        () =>
            activeRepairPaths.find((p) => p.targetConceptId === targetConceptId) ?? null,
        [activeRepairPaths, targetConceptId]
    );

    const [currentStep, setCurrentStep] = useState(0);
    const isActive = repairPath !== null;

    const start = useCallback(() => {
        setCurrentStep(0);
        return startRepairPath(targetConceptId);
    }, [startRepairPath, targetConceptId]);

    const completeStep = useCallback(
        (conceptId: ConceptId) => {
            if (repairPath) {
                completeRepairStep(repairPath.id, conceptId);
                setCurrentStep((prev) => prev + 1);
            }
        },
        [repairPath, completeRepairStep]
    );

    const dismiss = useCallback(() => {
        if (repairPath) {
            dismissRepairPath(repairPath.id);
        }
    }, [repairPath, dismissRepairPath]);

    return {
        repairPath,
        currentStep,
        isActive,
        start,
        completeStep,
        dismiss,
    };
}

/**
 * Hook for graph health monitoring
 */
export function useGraphHealth(): {
    score: number;
    stats: ReturnType<typeof calculateGraphHealth>;
    strugglingConcepts: ReturnType<typeof getStrugglingConcepts>;
    keystoneConcepts: ConceptNode[];
    criticalPath: ConceptId[];
    hasIssues: boolean;
    criticalIssues: number;
} {
    const context = useConceptEntanglement();
    const { graphHealth, getStrugglingConcepts, getKeystoneConcepts, getCriticalPath } =
        context;

    const strugglingConcepts = useMemo(() => getStrugglingConcepts(), [getStrugglingConcepts]);
    const keystoneConcepts = useMemo(() => getKeystoneConcepts(), [getKeystoneConcepts]);
    const criticalPath = useMemo(() => getCriticalPath(), [getCriticalPath]);

    const hasIssues = graphHealth.strugglingCount > 0 || graphHealth.collapsedCount > 0;
    const criticalIssues = graphHealth.collapsedCount;

    return {
        score: graphHealth.score,
        stats: graphHealth,
        strugglingConcepts,
        keystoneConcepts,
        criticalPath,
        hasIssues,
        criticalIssues,
    };
}

/**
 * Hook to integrate with AdaptiveContent signals
 */
export function useConceptSignalBridge(sectionId: string): {
    recordSignal: (signal: BehaviorSignal) => void;
} {
    const context = useConceptEntanglementOptional();

    const recordSignal = useCallback(
        (signal: BehaviorSignal) => {
            if (!context) return;

            // Find concepts in this section
            const concepts = Array.from(context.graph.nodes.values()).filter(
                (n) => n.sectionId === sectionId
            );

            // Record signal for all concepts in section
            for (const concept of concepts) {
                context.recordConceptSignal(concept.id, signal);
            }
        },
        [context, sectionId]
    );

    return { recordSignal };
}
