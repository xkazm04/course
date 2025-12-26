/**
 * Bi-Directional Knowledge Graph with Concept Entanglement
 *
 * Creates a dynamic knowledge graph where each concept node is 'entangled'
 * with the learner's comprehension state. When a learner struggles with
 * concept A, the system traces backward through prerequisite concepts to
 * identify the ROOT cause, and traces forward to show affected future concepts.
 *
 * Key capabilities:
 * - Bi-directional concept dependency tracking
 * - Root cause analysis for comprehension gaps
 * - Forward impact propagation
 * - Repair path generation
 * - Edge weight adjustment based on learning patterns
 */

import type { BehaviorSignal } from "./types";

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Unique identifier for a concept node
 */
export type ConceptId = string;

/**
 * Concept entanglement state - how a concept is "entangled" with learner comprehension
 */
export type EntanglementState =
    | "mastered" // Deep understanding, no issues
    | "stable" // Good understanding, minor gaps
    | "unstable" // Partial understanding, may collapse
    | "struggling" // Active difficulty
    | "collapsed" // Failed to understand, needs repair
    | "unknown"; // Not yet encountered

/**
 * Edge type for concept relationships
 */
export type ConceptEdgeType =
    | "prerequisite" // Must understand A before B
    | "reinforces" // Understanding A helps with B
    | "related" // Conceptually similar but independent
    | "builds-upon"; // Extends A with new ideas

/**
 * A concept node in the entanglement graph
 */
export interface ConceptNode {
    /** Unique identifier */
    id: ConceptId;
    /** Display title */
    title: string;
    /** Brief description */
    description: string;
    /** Section ID where this concept is taught */
    sectionId: string;
    /** Chapter ID containing this concept */
    chapterId: string;
    /** Course ID containing this concept */
    courseId: string;
    /** Order within the section (for sequencing) */
    order: number;
    /** Difficulty level (0-100) */
    difficulty: number;
    /** XP reward for mastering this concept */
    xpReward: number;
    /** Skills taught by this concept */
    skills: string[];
    /** Prerequisites (concept IDs) */
    prerequisites: ConceptId[];
    /** Concepts that build on this one */
    dependents: ConceptId[];
    /** Related concepts (for cross-referencing) */
    related: ConceptId[];
}

/**
 * An edge in the concept graph
 */
export interface ConceptEdge {
    /** Unique identifier */
    id: string;
    /** Source concept ID */
    from: ConceptId;
    /** Target concept ID */
    to: ConceptId;
    /** Edge type */
    type: ConceptEdgeType;
    /** Edge weight (0-1): higher = stronger relationship */
    weight: number;
    /** Learning transfer coefficient: how well understanding flows from->to */
    transferCoefficient: number;
    /** Times this edge was traversed successfully */
    successfulTraversals: number;
    /** Times this edge was traversed with difficulty */
    difficultTraversals: number;
    /** Label for display */
    label?: string;
}

/**
 * Concept entanglement data - per-concept learner state
 */
export interface ConceptEntanglement {
    /** Concept ID */
    conceptId: ConceptId;
    /** Current entanglement state */
    state: EntanglementState;
    /** Comprehension score (0-100) */
    comprehensionScore: number;
    /** Confidence in this assessment (0-1) */
    confidence: number;
    /** Number of attempts/interactions */
    attempts: number;
    /** Time spent on this concept (ms) */
    timeSpent: number;
    /** Signals recorded for this concept */
    signals: BehaviorSignal[];
    /** Last interaction timestamp */
    lastInteraction: number;
    /** Times this concept caused confusion downstream */
    cascadeFailures: number;
    /** Times understanding this concept helped downstream */
    cascadeSuccesses: number;
}

/**
 * Root cause analysis result
 */
export interface RootCauseResult {
    /** The struggling concept that triggered the analysis */
    triggerConceptId: ConceptId;
    /** Identified root cause concepts (sorted by likelihood) */
    rootCauses: Array<{
        conceptId: ConceptId;
        confidence: number; // 0-1 confidence this is the root cause
        evidence: string[]; // Evidence supporting this diagnosis
        severity: "critical" | "major" | "minor";
    }>;
    /** Chain of causation from root to trigger */
    causationChain: ConceptId[];
    /** Timestamp of analysis */
    analysisTimestamp: number;
}

/**
 * Forward impact analysis result
 */
export interface ForwardImpactResult {
    /** The concept with the gap */
    sourceConceptId: ConceptId;
    /** Future concepts that will be affected */
    affectedConcepts: Array<{
        conceptId: ConceptId;
        impactLevel: "high" | "medium" | "low";
        estimatedScoreReduction: number; // Expected score reduction if gap isn't fixed
        pathLength: number; // How many concepts away
    }>;
    /** Total concepts at risk */
    totalAtRisk: number;
    /** Critical path concepts (must understand for course completion) */
    criticalPathAffected: ConceptId[];
}

/**
 * Repair path - a sequence of concepts to revisit for remediation
 */
export interface RepairPath {
    /** Unique ID for this repair path */
    id: string;
    /** Target: the concept the learner is trying to understand */
    targetConceptId: ConceptId;
    /** Ordered list of concepts to review */
    steps: Array<{
        conceptId: ConceptId;
        reason: string; // Why this step is needed
        estimatedTime: number; // Minutes to review
        priority: "required" | "recommended" | "optional";
        activities: Array<{
            type: "review" | "quiz" | "practice" | "video";
            description: string;
        }>;
    }>;
    /** Total estimated time (minutes) */
    totalEstimatedTime: number;
    /** Expected comprehension improvement (0-100) */
    expectedImprovement: number;
    /** Generated at timestamp */
    generatedAt: number;
}

/**
 * Learning transfer pattern - observed patterns in how understanding transfers
 */
export interface LearningTransferPattern {
    /** Pattern ID */
    id: string;
    /** Source concept */
    fromConcept: ConceptId;
    /** Target concept */
    toConcept: ConceptId;
    /** Observed transfer rate (0-1): 1 = perfect transfer */
    transferRate: number;
    /** Sample size for this observation */
    sampleSize: number;
    /** Correlation coefficient between scores */
    correlation: number;
    /** Last updated timestamp */
    lastUpdated: number;
}

/**
 * Complete concept entanglement graph
 */
export interface ConceptEntanglementGraph {
    /** All concept nodes */
    nodes: Map<ConceptId, ConceptNode>;
    /** All edges */
    edges: ConceptEdge[];
    /** Per-concept entanglement state */
    entanglements: Map<ConceptId, ConceptEntanglement>;
    /** Observed learning transfer patterns */
    transferPatterns: LearningTransferPattern[];
    /** Active repair paths */
    activeRepairPaths: RepairPath[];
    /** Graph metadata */
    metadata: {
        courseId: string;
        userId?: string;
        lastUpdated: number;
        version: number;
    };
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Convert comprehension score to entanglement state
 */
export function scoreToEntanglementState(
    score: number,
    confidence: number,
    cascadeFailures: number
): EntanglementState {
    if (confidence < 0.2) return "unknown";
    if (cascadeFailures >= 3) return "collapsed";
    if (score >= 85) return "mastered";
    if (score >= 70) return "stable";
    if (score >= 50) return "unstable";
    if (score >= 30) return "struggling";
    return "collapsed";
}

/**
 * Calculate comprehension score from signals for a concept
 */
export function calculateConceptComprehension(signals: BehaviorSignal[]): {
    score: number;
    confidence: number;
} {
    if (signals.length === 0) {
        return { score: 50, confidence: 0 };
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const signal of signals) {
        const { score, weight } = scoreSignalForConcept(signal);

        // Apply time decay
        const now = Date.now();
        const age = now - signal.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        const timeDecay = Math.max(0.3, 1 - (age / maxAge) * 0.7);

        weightedSum += score * weight * timeDecay;
        totalWeight += weight * timeDecay;
    }

    const score = totalWeight > 0 ? weightedSum / totalWeight : 50;
    const confidence = Math.min(1, signals.length / 10);

    return { score: Math.round(score), confidence };
}

/**
 * Score a signal for concept comprehension
 */
function scoreSignalForConcept(signal: BehaviorSignal): { score: number; weight: number } {
    switch (signal.type) {
        case "quiz": {
            const accuracy = (signal.correctAnswers / signal.totalQuestions) * 100;
            const attemptPenalty = Math.max(0, (signal.attemptsUsed - 1) * 10);
            return {
                score: Math.max(0, Math.min(100, accuracy - attemptPenalty)),
                weight: 0.4,
            };
        }
        case "playground": {
            if (signal.runCount === 0) return { score: 50, weight: 0.1 };
            const successRate = (signal.successfulRuns / signal.runCount) * 100;
            const errorPenalty = (signal.errorCount / signal.runCount) * 20;
            return {
                score: Math.max(0, Math.min(100, successRate - errorPenalty)),
                weight: 0.3,
            };
        }
        case "sectionTime": {
            let score = signal.completionPercentage;
            if (signal.revisitCount > 2) score -= 5 * (signal.revisitCount - 2);
            return {
                score: Math.max(0, Math.min(100, score)),
                weight: 0.15,
            };
        }
        case "errorPattern": {
            return {
                score: Math.max(0, 100 - signal.repeatedCount * 25),
                weight: 0.1,
            };
        }
        case "video": {
            let score = signal.watchedPercentage;
            score -= Math.min(20, signal.rewindCount * 4);
            return {
                score: Math.max(0, Math.min(100, score)),
                weight: 0.1,
            };
        }
        case "navigation": {
            return {
                score: signal.isBackward ? 50 : 75,
                weight: 0.05,
            };
        }
        default:
            return { score: 50, weight: 0.1 };
    }
}

// ============================================================================
// GRAPH OPERATIONS
// ============================================================================

/**
 * Create an empty concept entanglement graph
 */
export function createEmptyGraph(courseId: string, userId?: string): ConceptEntanglementGraph {
    return {
        nodes: new Map(),
        edges: [],
        entanglements: new Map(),
        transferPatterns: [],
        activeRepairPaths: [],
        metadata: {
            courseId,
            userId,
            lastUpdated: Date.now(),
            version: 1,
        },
    };
}

/**
 * Add a concept node to the graph
 */
export function addConceptNode(
    graph: ConceptEntanglementGraph,
    node: ConceptNode
): ConceptEntanglementGraph {
    const newNodes = new Map(graph.nodes);
    newNodes.set(node.id, node);

    // Initialize entanglement if not present
    const newEntanglements = new Map(graph.entanglements);
    if (!newEntanglements.has(node.id)) {
        newEntanglements.set(node.id, {
            conceptId: node.id,
            state: "unknown",
            comprehensionScore: 50,
            confidence: 0,
            attempts: 0,
            timeSpent: 0,
            signals: [],
            lastInteraction: 0,
            cascadeFailures: 0,
            cascadeSuccesses: 0,
        });
    }

    return {
        ...graph,
        nodes: newNodes,
        entanglements: newEntanglements,
        metadata: {
            ...graph.metadata,
            lastUpdated: Date.now(),
        },
    };
}

/**
 * Add an edge to the graph
 */
export function addConceptEdge(
    graph: ConceptEntanglementGraph,
    edge: Omit<ConceptEdge, "id">
): ConceptEntanglementGraph {
    const newEdge: ConceptEdge = {
        ...edge,
        id: `edge_${edge.from}_${edge.to}_${edge.type}`,
    };

    // Update node prerequisites/dependents
    const newNodes = new Map(graph.nodes);
    const fromNode = newNodes.get(edge.from);
    const toNode = newNodes.get(edge.to);

    if (fromNode && edge.type === "prerequisite") {
        newNodes.set(edge.from, {
            ...fromNode,
            dependents: [...new Set([...fromNode.dependents, edge.to])],
        });
    }

    if (toNode && edge.type === "prerequisite") {
        newNodes.set(edge.to, {
            ...toNode,
            prerequisites: [...new Set([...toNode.prerequisites, edge.from])],
        });
    }

    return {
        ...graph,
        nodes: newNodes,
        edges: [...graph.edges, newEdge],
        metadata: {
            ...graph.metadata,
            lastUpdated: Date.now(),
        },
    };
}

/**
 * Update concept entanglement with a new signal
 */
export function updateConceptEntanglement(
    graph: ConceptEntanglementGraph,
    conceptId: ConceptId,
    signal: BehaviorSignal
): ConceptEntanglementGraph {
    const currentEntanglement = graph.entanglements.get(conceptId);
    if (!currentEntanglement) return graph;

    const newSignals = [...currentEntanglement.signals, signal].slice(-50); // Keep last 50
    const { score, confidence } = calculateConceptComprehension(newSignals);

    // Update time spent based on signal
    const additionalTime = getSignalTimeSpent(signal);

    const newEntanglement: ConceptEntanglement = {
        ...currentEntanglement,
        signals: newSignals,
        comprehensionScore: score,
        confidence,
        attempts: currentEntanglement.attempts + 1,
        timeSpent: currentEntanglement.timeSpent + additionalTime,
        lastInteraction: Date.now(),
        state: scoreToEntanglementState(
            score,
            confidence,
            currentEntanglement.cascadeFailures
        ),
    };

    const newEntanglements = new Map(graph.entanglements);
    newEntanglements.set(conceptId, newEntanglement);

    return {
        ...graph,
        entanglements: newEntanglements,
        metadata: {
            ...graph.metadata,
            lastUpdated: Date.now(),
        },
    };
}

/**
 * Get time spent from a signal
 */
function getSignalTimeSpent(signal: BehaviorSignal): number {
    switch (signal.type) {
        case "quiz":
        case "playground":
        case "sectionTime":
            return signal.timeSpentMs;
        case "video":
            // Estimate based on watched percentage (assume 10 min video)
            return (signal.watchedPercentage / 100) * 10 * 60 * 1000;
        default:
            return 0;
    }
}

// ============================================================================
// ROOT CAUSE ANALYSIS
// ============================================================================

/**
 * Trace backward through prerequisites to find root cause of comprehension gap
 */
export function findRootCause(
    graph: ConceptEntanglementGraph,
    triggerConceptId: ConceptId,
    maxDepth: number = 5
): RootCauseResult {
    const rootCauses: RootCauseResult["rootCauses"] = [];
    const visited = new Set<ConceptId>();
    const causationChain: ConceptId[] = [triggerConceptId];

    /**
     * Recursive DFS to find problematic prerequisites
     */
    function traceBack(
        conceptId: ConceptId,
        depth: number,
        pathToHere: ConceptId[]
    ): void {
        if (depth > maxDepth || visited.has(conceptId)) return;
        visited.add(conceptId);

        const node = graph.nodes.get(conceptId);
        const entanglement = graph.entanglements.get(conceptId);
        if (!node || !entanglement) return;

        // Check each prerequisite
        for (const prereqId of node.prerequisites) {
            const prereqEntanglement = graph.entanglements.get(prereqId);
            if (!prereqEntanglement) continue;

            const isProblematic =
                prereqEntanglement.state === "collapsed" ||
                prereqEntanglement.state === "struggling" ||
                prereqEntanglement.state === "unstable";

            if (isProblematic) {
                // Calculate confidence this is the root cause
                const cascadeRatio =
                    prereqEntanglement.cascadeFailures /
                    Math.max(1, prereqEntanglement.attempts);
                const scoreGap = 100 - prereqEntanglement.comprehensionScore;
                const depthFactor = 1 - depth / (maxDepth + 1); // Closer = more likely

                const confidence = Math.min(
                    1,
                    (cascadeRatio * 0.3 + (scoreGap / 100) * 0.4 + depthFactor * 0.3)
                );

                // Determine severity
                let severity: "critical" | "major" | "minor" = "minor";
                if (prereqEntanglement.state === "collapsed") {
                    severity = "critical";
                } else if (prereqEntanglement.state === "struggling") {
                    severity = "major";
                }

                // Build evidence
                const evidence: string[] = [];
                if (prereqEntanglement.state === "collapsed") {
                    evidence.push("This concept has collapsed - needs complete review");
                }
                if (prereqEntanglement.cascadeFailures > 2) {
                    evidence.push(
                        `Caused ${prereqEntanglement.cascadeFailures} downstream failures`
                    );
                }
                if (prereqEntanglement.comprehensionScore < 40) {
                    evidence.push(
                        `Low comprehension score: ${prereqEntanglement.comprehensionScore}%`
                    );
                }
                if (prereqEntanglement.attempts > 5 && prereqEntanglement.comprehensionScore < 60) {
                    evidence.push(
                        `Multiple attempts (${prereqEntanglement.attempts}) with limited progress`
                    );
                }

                rootCauses.push({
                    conceptId: prereqId,
                    confidence,
                    evidence,
                    severity,
                });

                // Update causation chain if this is the most likely root
                if (rootCauses.length === 1 || confidence > rootCauses[0].confidence) {
                    causationChain.length = 0;
                    causationChain.push(...[...pathToHere, prereqId].reverse());
                }
            }

            // Continue tracing back
            traceBack(prereqId, depth + 1, [...pathToHere, prereqId]);
        }
    }

    // Start tracing from the trigger concept
    traceBack(triggerConceptId, 0, [triggerConceptId]);

    // Sort root causes by confidence
    rootCauses.sort((a, b) => b.confidence - a.confidence);

    return {
        triggerConceptId,
        rootCauses,
        causationChain,
        analysisTimestamp: Date.now(),
    };
}

// ============================================================================
// FORWARD IMPACT ANALYSIS
// ============================================================================

/**
 * Analyze forward impact of a comprehension gap
 */
export function analyzeForwardImpact(
    graph: ConceptEntanglementGraph,
    sourceConceptId: ConceptId,
    maxDepth: number = 5
): ForwardImpactResult {
    const affectedConcepts: ForwardImpactResult["affectedConcepts"] = [];
    const visited = new Set<ConceptId>();
    const criticalPathAffected: ConceptId[] = [];

    const sourceEntanglement = graph.entanglements.get(sourceConceptId);
    const sourceGap = sourceEntanglement
        ? 100 - sourceEntanglement.comprehensionScore
        : 50;

    /**
     * BFS to find affected downstream concepts
     */
    function propagateForward(startId: ConceptId): void {
        const queue: Array<{ id: ConceptId; depth: number }> = [
            { id: startId, depth: 0 },
        ];

        while (queue.length > 0) {
            const { id, depth } = queue.shift()!;
            if (depth > maxDepth || visited.has(id)) continue;
            visited.add(id);

            const node = graph.nodes.get(id);
            if (!node) continue;

            // Check each dependent concept
            for (const dependentId of node.dependents) {
                if (visited.has(dependentId)) continue;

                const dependentNode = graph.nodes.get(dependentId);
                if (!dependentNode) continue;

                // Calculate impact level based on edge strength and depth
                const edge = graph.edges.find(
                    (e) => e.from === id && e.to === dependentId
                );
                const edgeWeight = edge?.weight ?? 0.5;
                const transferCoef = edge?.transferCoefficient ?? 0.7;

                // Estimate score reduction: gap * transfer coefficient * decay by depth
                const decayFactor = Math.pow(0.8, depth);
                const estimatedReduction = sourceGap * transferCoef * decayFactor * edgeWeight;

                // Determine impact level
                let impactLevel: "high" | "medium" | "low" = "low";
                if (estimatedReduction > 30) impactLevel = "high";
                else if (estimatedReduction > 15) impactLevel = "medium";

                affectedConcepts.push({
                    conceptId: dependentId,
                    impactLevel,
                    estimatedScoreReduction: Math.round(estimatedReduction),
                    pathLength: depth + 1,
                });

                // Check if this is on a critical path (has many dependents itself)
                if (dependentNode.dependents.length > 2 && impactLevel === "high") {
                    criticalPathAffected.push(dependentId);
                }

                // Continue propagation
                queue.push({ id: dependentId, depth: depth + 1 });
            }
        }
    }

    propagateForward(sourceConceptId);

    // Sort by impact level and path length
    affectedConcepts.sort((a, b) => {
        const levelOrder = { high: 0, medium: 1, low: 2 };
        const levelDiff = levelOrder[a.impactLevel] - levelOrder[b.impactLevel];
        if (levelDiff !== 0) return levelDiff;
        return a.pathLength - b.pathLength;
    });

    return {
        sourceConceptId,
        affectedConcepts,
        totalAtRisk: affectedConcepts.length,
        criticalPathAffected,
    };
}

// ============================================================================
// REPAIR PATH GENERATION
// ============================================================================

/**
 * Generate a repair path to fix comprehension gaps
 */
export function generateRepairPath(
    graph: ConceptEntanglementGraph,
    targetConceptId: ConceptId,
    rootCauseAnalysis: RootCauseResult
): RepairPath {
    const steps: RepairPath["steps"] = [];
    const visited = new Set<ConceptId>();

    // Start from root causes and work toward target
    for (const rootCause of rootCauseAnalysis.rootCauses) {
        if (visited.has(rootCause.conceptId)) continue;

        const node = graph.nodes.get(rootCause.conceptId);
        const entanglement = graph.entanglements.get(rootCause.conceptId);
        if (!node || !entanglement) continue;

        visited.add(rootCause.conceptId);

        // Determine activities based on state
        const activities: RepairPath["steps"][0]["activities"] = [];

        if (entanglement.state === "collapsed") {
            activities.push({
                type: "video",
                description: `Re-watch the explanation for "${node.title}"`,
            });
            activities.push({
                type: "review",
                description: "Review key concepts and examples",
            });
        }

        if (entanglement.state === "struggling" || entanglement.state === "collapsed") {
            activities.push({
                type: "practice",
                description: "Complete guided practice exercises",
            });
        }

        activities.push({
            type: "quiz",
            description: "Verify understanding with a short quiz",
        });

        // Estimate time based on state
        let estimatedTime = 5;
        if (entanglement.state === "collapsed") estimatedTime = 20;
        else if (entanglement.state === "struggling") estimatedTime = 15;
        else if (entanglement.state === "unstable") estimatedTime = 10;

        steps.push({
            conceptId: rootCause.conceptId,
            reason:
                rootCause.severity === "critical"
                    ? "Critical gap - this concept needs complete review"
                    : rootCause.severity === "major"
                    ? "Major gap - focused practice needed"
                    : "Minor gap - quick review recommended",
            estimatedTime,
            priority:
                rootCause.severity === "critical"
                    ? "required"
                    : rootCause.severity === "major"
                    ? "required"
                    : "recommended",
            activities,
        });
    }

    // Add intermediate concepts from causation chain
    for (const conceptId of rootCauseAnalysis.causationChain) {
        if (visited.has(conceptId) || conceptId === targetConceptId) continue;

        const node = graph.nodes.get(conceptId);
        const entanglement = graph.entanglements.get(conceptId);
        if (!node || !entanglement) continue;

        // Only add if there's a gap
        if (entanglement.comprehensionScore >= 70) continue;

        visited.add(conceptId);

        steps.push({
            conceptId,
            reason: "Bridges the gap between root cause and target",
            estimatedTime: 8,
            priority: "recommended",
            activities: [
                {
                    type: "review",
                    description: `Quick review of "${node.title}"`,
                },
                {
                    type: "quiz",
                    description: "Verify understanding",
                },
            ],
        });
    }

    // Add the target concept as the final step
    const targetNode = graph.nodes.get(targetConceptId);
    if (targetNode && !visited.has(targetConceptId)) {
        steps.push({
            conceptId: targetConceptId,
            reason: "Your goal - ready to master this concept",
            estimatedTime: 10,
            priority: "required",
            activities: [
                {
                    type: "review",
                    description: `Approach "${targetNode.title}" with fresh understanding`,
                },
                {
                    type: "practice",
                    description: "Apply what you've learned",
                },
            ],
        });
    }

    // Calculate totals
    const totalEstimatedTime = steps.reduce((sum, s) => sum + s.estimatedTime, 0);
    const expectedImprovement = Math.min(
        40,
        steps.filter((s) => s.priority === "required").length * 15
    );

    return {
        id: `repair_${targetConceptId}_${Date.now()}`,
        targetConceptId,
        steps,
        totalEstimatedTime,
        expectedImprovement,
        generatedAt: Date.now(),
    };
}

// ============================================================================
// EDGE WEIGHT ADJUSTMENT
// ============================================================================

/**
 * Update edge weights based on observed learning transfer patterns
 */
export function updateEdgeWeights(
    graph: ConceptEntanglementGraph,
    fromConceptId: ConceptId,
    toConceptId: ConceptId,
    success: boolean
): ConceptEntanglementGraph {
    const edgeIndex = graph.edges.findIndex(
        (e) => e.from === fromConceptId && e.to === toConceptId
    );

    if (edgeIndex === -1) return graph;

    const edge = graph.edges[edgeIndex];
    const newEdges = [...graph.edges];

    // Update traversal counts
    const newEdge: ConceptEdge = {
        ...edge,
        successfulTraversals: edge.successfulTraversals + (success ? 1 : 0),
        difficultTraversals: edge.difficultTraversals + (success ? 0 : 1),
    };

    // Recalculate transfer coefficient
    const totalTraversals = newEdge.successfulTraversals + newEdge.difficultTraversals;
    if (totalTraversals >= 3) {
        // Bayesian-ish update: blend prior (0.7) with observed rate
        const observedRate = newEdge.successfulTraversals / totalTraversals;
        const prior = 0.7;
        const priorWeight = 3 / (totalTraversals + 3);
        newEdge.transferCoefficient = prior * priorWeight + observedRate * (1 - priorWeight);
    }

    // Update edge weight based on transfer coefficient
    newEdge.weight = 0.3 + 0.7 * newEdge.transferCoefficient;

    newEdges[edgeIndex] = newEdge;

    // Also update cascade counts on the source concept
    const sourceEntanglement = graph.entanglements.get(fromConceptId);
    if (sourceEntanglement) {
        const newEntanglements = new Map(graph.entanglements);
        newEntanglements.set(fromConceptId, {
            ...sourceEntanglement,
            cascadeSuccesses: sourceEntanglement.cascadeSuccesses + (success ? 1 : 0),
            cascadeFailures: sourceEntanglement.cascadeFailures + (success ? 0 : 1),
        });

        return {
            ...graph,
            edges: newEdges,
            entanglements: newEntanglements,
            metadata: {
                ...graph.metadata,
                lastUpdated: Date.now(),
            },
        };
    }

    return {
        ...graph,
        edges: newEdges,
        metadata: {
            ...graph.metadata,
            lastUpdated: Date.now(),
        },
    };
}

/**
 * Record a learning transfer pattern
 */
export function recordTransferPattern(
    graph: ConceptEntanglementGraph,
    fromConcept: ConceptId,
    toConcept: ConceptId,
    fromScore: number,
    toScore: number
): ConceptEntanglementGraph {
    // Calculate correlation-like transfer rate
    const expectedToScore = fromScore * 0.8; // Assume 80% transfer if perfect
    const actualTransfer = toScore / Math.max(1, expectedToScore);
    const transferRate = Math.min(1, Math.max(0, actualTransfer));

    const existingPattern = graph.transferPatterns.find(
        (p) => p.fromConcept === fromConcept && p.toConcept === toConcept
    );

    const newPatterns = [...graph.transferPatterns];

    if (existingPattern) {
        // Update existing pattern with running average
        const idx = newPatterns.indexOf(existingPattern);
        const newSampleSize = existingPattern.sampleSize + 1;
        const newTransferRate =
            (existingPattern.transferRate * existingPattern.sampleSize + transferRate) /
            newSampleSize;

        newPatterns[idx] = {
            ...existingPattern,
            transferRate: newTransferRate,
            sampleSize: newSampleSize,
            lastUpdated: Date.now(),
        };
    } else {
        // Create new pattern
        newPatterns.push({
            id: `pattern_${fromConcept}_${toConcept}`,
            fromConcept,
            toConcept,
            transferRate,
            sampleSize: 1,
            correlation: 0, // Would need more data to calculate
            lastUpdated: Date.now(),
        });
    }

    return {
        ...graph,
        transferPatterns: newPatterns,
        metadata: {
            ...graph.metadata,
            lastUpdated: Date.now(),
        },
    };
}

// ============================================================================
// GRAPH QUERIES
// ============================================================================

/**
 * Get all concepts in struggling or collapsed state
 */
export function getStrugglingConcepts(
    graph: ConceptEntanglementGraph
): Array<{ concept: ConceptNode; entanglement: ConceptEntanglement }> {
    const results: Array<{ concept: ConceptNode; entanglement: ConceptEntanglement }> = [];

    for (const [conceptId, entanglement] of graph.entanglements) {
        if (
            entanglement.state === "struggling" ||
            entanglement.state === "collapsed"
        ) {
            const concept = graph.nodes.get(conceptId);
            if (concept) {
                results.push({ concept, entanglement });
            }
        }
    }

    // Sort by severity (collapsed first, then by cascade failures)
    results.sort((a, b) => {
        if (a.entanglement.state === "collapsed" && b.entanglement.state !== "collapsed") return -1;
        if (a.entanglement.state !== "collapsed" && b.entanglement.state === "collapsed") return 1;
        return b.entanglement.cascadeFailures - a.entanglement.cascadeFailures;
    });

    return results;
}

/**
 * Get concepts that are keystone (many dependents rely on them)
 */
export function getKeystoneConcepts(
    graph: ConceptEntanglementGraph,
    minDependents: number = 3
): ConceptNode[] {
    const keystones: ConceptNode[] = [];

    for (const [, node] of graph.nodes) {
        if (node.dependents.length >= minDependents) {
            keystones.push(node);
        }
    }

    // Sort by number of dependents
    keystones.sort((a, b) => b.dependents.length - a.dependents.length);

    return keystones;
}

/**
 * Get the critical path through the graph (longest chain of prerequisites)
 */
export function getCriticalPath(
    graph: ConceptEntanglementGraph
): ConceptId[] {
    const memo = new Map<ConceptId, ConceptId[]>();

    function getLongestPath(conceptId: ConceptId): ConceptId[] {
        if (memo.has(conceptId)) return memo.get(conceptId)!;

        const node = graph.nodes.get(conceptId);
        if (!node || node.dependents.length === 0) {
            const path = [conceptId];
            memo.set(conceptId, path);
            return path;
        }

        let longestDownstream: ConceptId[] = [];
        for (const dependentId of node.dependents) {
            const downstreamPath = getLongestPath(dependentId);
            if (downstreamPath.length > longestDownstream.length) {
                longestDownstream = downstreamPath;
            }
        }

        const fullPath = [conceptId, ...longestDownstream];
        memo.set(conceptId, fullPath);
        return fullPath;
    }

    // Find entry points (no prerequisites)
    const entryPoints: ConceptId[] = [];
    for (const [conceptId, node] of graph.nodes) {
        if (node.prerequisites.length === 0) {
            entryPoints.push(conceptId);
        }
    }

    // Get longest path from any entry point
    let criticalPath: ConceptId[] = [];
    for (const entryPoint of entryPoints) {
        const path = getLongestPath(entryPoint);
        if (path.length > criticalPath.length) {
            criticalPath = path;
        }
    }

    return criticalPath;
}

/**
 * Calculate overall graph health score
 */
export function calculateGraphHealth(
    graph: ConceptEntanglementGraph
): {
    score: number;
    masteredCount: number;
    stableCount: number;
    unstableCount: number;
    strugglingCount: number;
    collapsedCount: number;
    unknownCount: number;
    recommendations: string[];
} {
    let masteredCount = 0;
    let stableCount = 0;
    let unstableCount = 0;
    let strugglingCount = 0;
    let collapsedCount = 0;
    let unknownCount = 0;

    for (const [, entanglement] of graph.entanglements) {
        switch (entanglement.state) {
            case "mastered":
                masteredCount++;
                break;
            case "stable":
                stableCount++;
                break;
            case "unstable":
                unstableCount++;
                break;
            case "struggling":
                strugglingCount++;
                break;
            case "collapsed":
                collapsedCount++;
                break;
            case "unknown":
                unknownCount++;
                break;
        }
    }

    const total = graph.entanglements.size;
    const knownTotal = total - unknownCount;

    // Calculate score (weighted by severity)
    const score =
        knownTotal > 0
            ? Math.round(
                  ((masteredCount * 100 +
                      stableCount * 80 +
                      unstableCount * 50 +
                      strugglingCount * 25 +
                      collapsedCount * 0) /
                      knownTotal)
              )
            : 50;

    // Generate recommendations
    const recommendations: string[] = [];

    if (collapsedCount > 0) {
        recommendations.push(
            `${collapsedCount} concept(s) need immediate attention - review fundamentals`
        );
    }

    if (strugglingCount > 2) {
        recommendations.push(
            `Multiple concepts in struggling state - consider a repair path`
        );
    }

    const keystones = getKeystoneConcepts(graph, 3);
    const strugglingKeystones = keystones.filter((k) => {
        const ent = graph.entanglements.get(k.id);
        return ent && (ent.state === "struggling" || ent.state === "collapsed");
    });

    if (strugglingKeystones.length > 0) {
        recommendations.push(
            `Critical: ${strugglingKeystones.length} keystone concept(s) need repair`
        );
    }

    if (unstableCount > knownTotal * 0.3) {
        recommendations.push(
            `Many concepts are unstable - consider more practice before advancing`
        );
    }

    return {
        score,
        masteredCount,
        stableCount,
        unstableCount,
        strugglingCount,
        collapsedCount,
        unknownCount,
        recommendations,
    };
}
