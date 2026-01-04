/**
 * Living Graph Module
 *
 * Unified graph system that models behavior metrics as edge weights on the chapter DAG.
 * The key insight: ChapterGraph (static curriculum structure) and Conductor (runtime behavior)
 * are two views of the same underlying concept - learner state in a learning space.
 *
 * By fusing them, the graph itself becomes the orchestration engine:
 * - Node traversability = prerequisites + predicted struggle
 * - Edge weights = success rate improvements from prerequisites
 * - Path recommendations = collective intelligence + learner profile
 *
 * This creates a "living graph" where paths adapt based on collective intelligence.
 */

// Types
export type {
    // Edge weights
    BehaviorEdgeWeight,
    LivingEdge,
    // Traversability
    TraversabilityScore,
    TraversabilityRecommendation,
    TraversabilityFactor,
    TraversabilityFactorType,
    TraversabilityParams,
    // Living nodes
    LivingNode,
    NodeVisibility,
    // Adaptive paths
    AdaptivePath,
    AdaptivePathMetrics,
    AdaptivePathParams,
    PathDerivation,
    LearnerProfileSummary,
    AdaptivePathAlternative,
    PathCheckpoint,
    CheckpointAction,
    PathOptimizationTarget,
    // Graph state
    LivingGraphState,
    LivingGraphMetrics,
    GraphPosition,
    GraphHealthIndicators,
    // Configuration
    LivingGraphConfig,
    // Events
    LivingGraphEvent,
    GraphHealthWarning,
} from "./types";

export { DEFAULT_LIVING_GRAPH_CONFIG } from "./types";

// Traversability computation
export {
    computeTraversability,
    computeTraversabilityBatch,
    sortByTraversability,
} from "./traversability";

// Behavior edge weights
export {
    computeBehaviorEdgeWeight,
    createLivingEdge,
    createEmergentEdge,
    computeAllLivingEdges,
    getHighStruggleEdges,
    getEdgesBySuccessImprovement,
    findMostBeneficialPrerequisite,
} from "./behaviorEdges";

// Adaptive path computation
export {
    computeAdaptivePath,
    getRecommendedNextNode,
    findLowStrugglePath,
} from "./adaptivePath";

// React hook
export {
    useLivingGraph,
    type UseLivingGraphOptions,
    type UseLivingGraphReturn,
} from "./useLivingGraph";
