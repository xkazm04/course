/**
 * Living Graph Types
 *
 * Unified graph system that models behavior metrics as edge weights on the chapter DAG.
 * Fuses the static curriculum structure (ChapterGraph) with dynamic runtime behavior
 * (Conductor) to create a "living graph" where paths adapt based on collective intelligence.
 *
 * Key concepts:
 * - BehaviorEdgeWeight: Edge weights derived from collective learner behavior
 * - Traversability: A node's accessibility based on prerequisites + predicted struggle
 * - AdaptivePath: Dynamic path recommendations considering both structure and behavior
 */

import type { ChapterNodeId, ChapterEdge } from "../chapterGraph";
import type { ChapterCurriculumNode, CurriculumEdge } from "@/app/shared/lib/learningPathGraph";
import type { LearnerPace, LearnerConfidence, CollectiveInsight } from "../conductorTypes";
import type { ImplicitPrerequisite, StrugglePoint, OptimalPath } from "../collectiveIntelligence";

// ============================================================================
// BEHAVIOR EDGE WEIGHTS
// ============================================================================

/**
 * Behavior metrics that inform edge weights in the living graph.
 * These are derived from CollectiveInsight data and represent
 * the "difficulty" of traversing from one node to another.
 */
export interface BehaviorEdgeWeight {
    /** The edge this weight applies to */
    edgeId: string;

    /** Source node ID */
    from: ChapterNodeId;

    /** Target node ID */
    to: ChapterNodeId;

    /** Struggle score (0-1): Higher means more learners struggled */
    struggleScore: number;

    /** Success rate when traversing with prerequisite complete (0-1) */
    successRateWithPrereq: number;

    /** Success rate when traversing without prerequisite (0-1) */
    successRateWithoutPrereq: number;

    /** Average time factor (1.0 = average, >1 = slower, <1 = faster) */
    avgTimeFactor: number;

    /** Drop-off rate at target node (0-1): learners who abandon */
    dropOffRate: number;

    /** Retry rate: average number of retries needed */
    retryRate: number;

    /** Confidence in this weight (0-1) based on sample size */
    confidence: number;

    /** Number of learners this weight is derived from */
    sampleSize: number;

    /** Last updated timestamp */
    lastUpdated: number;
}

/**
 * Edge with combined static structure and behavior weight
 */
export interface LivingEdge extends ChapterEdge {
    /** Behavior-derived weight (if available) */
    behaviorWeight?: BehaviorEdgeWeight;

    /** Combined weight score (static weight + behavior) */
    combinedWeight: number;

    /** Whether this edge is derived from behavior (emergent) vs static */
    isEmergent: boolean;
}

// ============================================================================
// TRAVERSABILITY
// ============================================================================

/**
 * Traversability score for a node, combining prerequisites and predicted struggle.
 * This determines whether a learner should attempt a chapter.
 */
export interface TraversabilityScore {
    /** Overall traversability (0-1): 1 = fully accessible, 0 = blocked */
    score: number;

    /** Whether static prerequisites are met */
    prerequisitesMet: boolean;

    /** Whether emergent prerequisites are met */
    emergentPrerequisitesMet: boolean;

    /** Predicted struggle level for this learner (0-1) */
    predictedStruggle: number;

    /** Confidence in predicted struggle (0-1) */
    struggleConfidence: number;

    /** Recommended action based on traversability */
    recommendation: TraversabilityRecommendation;

    /** Factors contributing to the score */
    factors: TraversabilityFactor[];
}

export type TraversabilityRecommendation =
    | "proceed" // Safe to proceed
    | "proceed_with_caution" // May struggle, but can try
    | "consider_prerequisites" // Should complete prerequisites first
    | "blocked" // Cannot proceed
    | "skip" // Could skip (over-qualified)
    | "accelerate"; // Should move faster

/**
 * Individual factor contributing to traversability
 */
export interface TraversabilityFactor {
    /** Factor type */
    type: TraversabilityFactorType;

    /** Factor value (0-1 or -1 to 1 for modifiers) */
    value: number;

    /** Influence on final score (0-1) */
    influence: number;

    /** Human-readable description */
    description: string;
}

export type TraversabilityFactorType =
    | "static_prerequisite" // Hand-crafted prerequisite
    | "emergent_prerequisite" // Behavior-derived prerequisite
    | "collective_struggle" // Struggle observed in similar learners
    | "learner_profile" // Current learner's characteristics
    | "past_performance" // Learner's history with similar content
    | "content_density" // How much content needs to be absorbed
    | "time_since_prereq" // Time elapsed since completing prerequisites
    | "peer_success"; // Success rate of similar peers

// ============================================================================
// LIVING NODE
// ============================================================================

/**
 * A chapter node enriched with behavior data and traversability.
 * Extends ChapterCurriculumNode with living graph behavior data.
 */
export interface LivingNode extends ChapterCurriculumNode {
    /** Display title (alias for name from ChapterCurriculumNode) */
    title: string;
    /** Current traversability for the active learner */
    traversability: TraversabilityScore;

    /** Collective insight data for this node */
    collectiveInsight?: CollectiveInsight;

    /** Struggle points within this node */
    strugglePoints: StrugglePoint[];

    /** Behavior-weighted edges from this node */
    outgoingEdges: LivingEdge[];

    /** Behavior-weighted edges to this node */
    incomingEdges: LivingEdge[];

    /** Predicted completion time for current learner (minutes) */
    predictedDuration: number;

    /** Predicted success rate for current learner (0-1) */
    predictedSuccessRate: number;

    /** Whether this node is part of the recommended path */
    isOnRecommendedPath: boolean;

    /** Node's visibility state in the living graph */
    visibility: NodeVisibility;
}

export type NodeVisibility =
    | "visible" // Fully visible and accessible
    | "preview" // Visible but locked
    | "hinted" // Partially visible (teaser)
    | "hidden"; // Not visible at all

// ============================================================================
// ADAPTIVE PATH
// ============================================================================

/**
 * An adaptive learning path that considers both structure and behavior.
 */
export interface AdaptivePath {
    /** Unique path identifier */
    id: string;

    /** Ordered sequence of nodes */
    nodes: LivingNode[];

    /** Path metrics */
    metrics: AdaptivePathMetrics;

    /** How this path was derived */
    derivation: PathDerivation;

    /** Learner profile this path is optimized for */
    optimizedFor: LearnerProfileSummary;

    /** Alternative paths if this one fails */
    alternatives: AdaptivePathAlternative[];

    /** Checkpoints for progress tracking */
    checkpoints: PathCheckpoint[];

    /** Last computed timestamp */
    computedAt: number;
}

export interface AdaptivePathMetrics {
    /** Total estimated duration (minutes) */
    estimatedDuration: number;

    /** Total XP reward */
    totalXP: number;

    /** Predicted completion rate for this learner (0-1) */
    predictedCompletionRate: number;

    /** Average struggle score along path (0-1) */
    avgStruggleScore: number;

    /** Path efficiency score (0-1) */
    efficiencyScore: number;

    /** Number of learners who completed similar paths */
    validationCount: number;
}

export type PathDerivation =
    | "static" // From static curriculum only
    | "collective" // From collective behavior patterns
    | "personalized" // Personalized for this learner
    | "hybrid"; // Mix of static and behavior

export interface LearnerProfileSummary {
    pace: LearnerPace;
    confidence: LearnerConfidence;
    strengths: string[];
    weaknesses: string[];
}

export interface AdaptivePathAlternative {
    /** Alternative path ID */
    pathId: string;

    /** Why this is an alternative */
    reason: string;

    /** Difference in difficulty */
    difficultyDelta: number;

    /** Difference in duration */
    durationDelta: number;
}

export interface PathCheckpoint {
    /** Node ID at checkpoint */
    nodeId: ChapterNodeId;

    /** Expected progress percentage at this point */
    expectedProgress: number;

    /** Minimum mastery required to continue */
    minMastery: number;

    /** Actions if checkpoint not met */
    onFailure: CheckpointAction[];
}

export type CheckpointAction =
    | "suggest_remedial" // Suggest remedial content
    | "offer_peer_solution" // Show peer solutions
    | "slow_pace" // Reduce pace
    | "suggest_alternative_path" // Offer different path
    | "allow_skip"; // Allow skipping ahead

// ============================================================================
// LIVING GRAPH STATE
// ============================================================================

/**
 * Complete state of the living graph for a learner.
 */
export interface LivingGraphState {
    /** All nodes with behavior enrichment */
    nodes: Map<ChapterNodeId, LivingNode>;

    /** All edges with behavior weights */
    edges: Map<string, LivingEdge>;

    /** Current adaptive path */
    currentPath: AdaptivePath | null;

    /** Alternative paths available */
    alternativePaths: AdaptivePath[];

    /** Global graph metrics */
    metrics: LivingGraphMetrics;

    /** Learner's position in the graph */
    currentPosition: GraphPosition;

    /** Graph health indicators */
    health: GraphHealthIndicators;

    /** Last updated timestamp */
    lastUpdated: number;
}

export interface LivingGraphMetrics {
    /** Total nodes in graph */
    totalNodes: number;

    /** Nodes with behavior data */
    nodesWithBehaviorData: number;

    /** Edges with behavior weights */
    edgesWithBehaviorWeights: number;

    /** Average traversability across all nodes */
    avgTraversability: number;

    /** Coverage of collective intelligence (0-1) */
    collectiveIntelligenceCoverage: number;
}

export interface GraphPosition {
    /** Current node (if any) */
    currentNode: ChapterNodeId | null;

    /** Progress within current node (0-1) */
    nodeProgress: number;

    /** Overall path progress (0-1) */
    pathProgress: number;

    /** Nodes completed */
    completedNodes: Set<ChapterNodeId>;

    /** Nodes in progress */
    inProgressNodes: Set<ChapterNodeId>;
}

export interface GraphHealthIndicators {
    /** Nodes with low traversability */
    lowTraversabilityNodes: ChapterNodeId[];

    /** Edges with high struggle scores */
    highStruggleEdges: string[];

    /** Nodes needing more data */
    dataGaps: ChapterNodeId[];

    /** Potential dead ends */
    potentialDeadEnds: ChapterNodeId[];

    /** Nodes with conflicting signals */
    conflictingSignalNodes: ChapterNodeId[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration for living graph computation.
 */
export interface LivingGraphConfig {
    /** Minimum sample size for behavior weights to apply */
    minSampleSize: number;

    /** Minimum confidence for emergent prerequisites */
    minEmergentConfidence: number;

    /** Weight for static prerequisites in traversability (0-1) */
    staticPrerequisiteWeight: number;

    /** Weight for emergent prerequisites in traversability (0-1) */
    emergentPrerequisiteWeight: number;

    /** Weight for collective struggle in traversability (0-1) */
    collectiveStruggleWeight: number;

    /** Weight for learner profile in traversability (0-1) */
    learnerProfileWeight: number;

    /** Threshold for "low" traversability warning */
    lowTraversabilityThreshold: number;

    /** Threshold for "high" struggle edge warning */
    highStruggleThreshold: number;

    /** Whether to include emergent prerequisites */
    includeEmergentPrerequisites: boolean;

    /** How often to recompute (milliseconds) */
    recomputeInterval: number;

    /** Cache duration (milliseconds) */
    cacheDuration: number;
}

export const DEFAULT_LIVING_GRAPH_CONFIG: LivingGraphConfig = {
    minSampleSize: 10,
    minEmergentConfidence: 0.7,
    staticPrerequisiteWeight: 0.4,
    emergentPrerequisiteWeight: 0.2,
    collectiveStruggleWeight: 0.25,
    learnerProfileWeight: 0.15,
    lowTraversabilityThreshold: 0.3,
    highStruggleThreshold: 0.6,
    includeEmergentPrerequisites: true,
    recomputeInterval: 60000, // 1 minute
    cacheDuration: 300000, // 5 minutes
};

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Events emitted by the living graph system.
 */
export type LivingGraphEvent =
    | { type: "node_traversability_changed"; nodeId: ChapterNodeId; oldScore: number; newScore: number }
    | { type: "path_recommendation_updated"; oldPath: string | null; newPath: string }
    | { type: "struggle_detected"; nodeId: ChapterNodeId; sectionId: string; severity: number }
    | { type: "checkpoint_reached"; checkpointId: string; passed: boolean }
    | { type: "edge_weight_updated"; edgeId: string; newWeight: number }
    | { type: "graph_health_warning"; warning: GraphHealthWarning }
    | { type: "learner_profile_impact"; factor: string; impact: number };

export interface GraphHealthWarning {
    type: "low_traversability" | "high_struggle" | "data_gap" | "dead_end";
    nodeId: ChapterNodeId;
    severity: "info" | "warning" | "critical";
    message: string;
    suggestedAction: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Parameters for computing traversability.
 */
export interface TraversabilityParams {
    /** Node to compute traversability for */
    nodeId: ChapterNodeId;

    /** Completed chapter IDs */
    completedChapterIds: Set<ChapterNodeId>;

    /** Learner profile */
    learnerProfile: LearnerProfileSummary;

    /** Configuration */
    config: LivingGraphConfig;

    /** Collective insights map */
    collectiveInsights: Map<ChapterNodeId, CollectiveInsight>;

    /** Implicit prerequisites */
    implicitPrerequisites: ImplicitPrerequisite[];

    /** Struggle points */
    strugglePoints: StrugglePoint[];
}

/**
 * Parameters for computing adaptive path.
 */
export interface AdaptivePathParams {
    /** Starting node (or current position) */
    startNodeId: ChapterNodeId | null;

    /** Goal nodes (if any) */
    goalNodeIds?: ChapterNodeId[];

    /** Completed chapter IDs */
    completedChapterIds: Set<ChapterNodeId>;

    /** Learner profile */
    learnerProfile: LearnerProfileSummary;

    /** Configuration */
    config: LivingGraphConfig;

    /** Maximum path length */
    maxPathLength?: number;

    /** Optimization target */
    optimizeFor: PathOptimizationTarget;
}

export type PathOptimizationTarget =
    | "fastest" // Minimize time
    | "easiest" // Minimize struggle
    | "most_xp" // Maximize XP
    | "balanced" // Balance all factors
    | "completion_rate"; // Maximize completion probability
