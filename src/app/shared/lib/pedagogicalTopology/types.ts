/**
 * Pedagogical Topology Types
 *
 * This module defines the type system for analyzing and representing
 * pedagogical structures encoded in learning path graph topologies.
 *
 * The key insight is that the shape of a curriculum graph encodes
 * teaching strategies: breadth-first vs depth-first, spiral vs linear,
 * convergent vs divergent learning sequences.
 */

import type { ProgressionLevel } from "../progressionCoordinate";
import type { RelationshipType, LearningDomainId, GraphNode, GraphEdge } from "../learningPathGraph";

// ============================================================================
// PEDAGOGICAL STRATEGY TYPES
// ============================================================================

/**
 * Fundamental teaching strategy archetypes.
 * These represent high-level pedagogical approaches.
 */
export type TeachingStrategy =
    | "breadth-first" // Build wide foundation before going deep
    | "depth-first" // Master one track deeply before branching
    | "spiral" // Revisit concepts at increasing complexity
    | "mastery-based" // Complete prerequisites before advancing
    | "exploratory" // Multiple valid entry points, self-directed
    | "convergent" // Multiple paths merge toward unified mastery
    | "divergent" // Single foundation splits into specializations
    | "hybrid"; // Combination of multiple strategies

/**
 * Learning sequence pattern types.
 * Describes how topics are ordered within a path.
 */
export type SequencePattern =
    | "linear" // A → B → C → D
    | "branching" // A → (B | C | D)
    | "merging" // (A & B & C) → D
    | "diamond" // A → (B | C) → D
    | "tree" // Hierarchical with no merges
    | "dag" // Directed acyclic graph (general)
    | "network"; // Complex interconnections

/**
 * Curriculum structure characteristics.
 */
export type StructureCharacteristic =
    | "foundational-breadth" // Many tier-0 nodes
    | "skill-convergence" // Edges merging at mid-tiers
    | "specialization-divergence" // Edges branching at high tiers
    | "balanced-hierarchy" // Even distribution across tiers
    | "top-heavy" // More advanced than foundational content
    | "bottom-heavy" // More foundational than advanced content
    | "hub-and-spoke"; // Central concept with radiating topics

// ============================================================================
// TOPOLOGY ANALYSIS RESULTS
// ============================================================================

/**
 * Statistics about a tier/level in the curriculum.
 */
export interface TierStatistics {
    /** The progression level (0-4) */
    level: ProgressionLevel;

    /** Number of nodes at this tier */
    nodeCount: number;

    /** Nodes at this tier */
    nodes: GraphNode[];

    /** Number of edges entering nodes at this tier */
    incomingEdges: number;

    /** Number of edges leaving nodes at this tier */
    outgoingEdges: number;

    /** Average in-degree of nodes at this tier */
    avgInDegree: number;

    /** Average out-degree of nodes at this tier */
    avgOutDegree: number;

    /** Is this tier an entry point tier? */
    isEntryTier: boolean;

    /** Is this tier a convergence point? */
    isConvergenceTier: boolean;

    /** Is this tier a divergence point? */
    isDivergenceTier: boolean;
}

/**
 * Relationship analysis between tiers.
 */
export interface TierRelationship {
    /** Source tier level */
    fromTier: ProgressionLevel;

    /** Target tier level */
    toTier: ProgressionLevel;

    /** Number of edges connecting these tiers */
    edgeCount: number;

    /** Dominant relationship type */
    dominantRelationType: RelationshipType;

    /** Direction: up (to higher tier), down (to lower), or same */
    direction: "up" | "down" | "same";

    /** Flow ratio (edges going up vs down) */
    flowStrength: number;
}

/**
 * Path characteristics for a learning sequence.
 */
export interface PathCharacteristics {
    /** Unique path identifier */
    pathId: string;

    /** Starting node(s) */
    entryPoints: LearningDomainId[];

    /** Ending node(s) */
    terminalNodes: LearningDomainId[];

    /** Total nodes in the path */
    nodeCount: number;

    /** Path depth (max tiers traversed) */
    depth: number;

    /** Maximum width (nodes at any single tier) */
    maxWidth: number;

    /** Sequence pattern type */
    sequencePattern: SequencePattern;

    /** Whether this path includes backtracking */
    hasBacktracking: boolean;

    /** Estimated complexity score (1-10) */
    complexityScore: number;
}

/**
 * Complete topology analysis result.
 */
export interface TopologyAnalysis {
    /** Primary teaching strategy detected */
    primaryStrategy: TeachingStrategy;

    /** Secondary strategies (if hybrid) */
    secondaryStrategies: TeachingStrategy[];

    /** Confidence score for the primary strategy (0-1) */
    confidence: number;

    /** Detected structure characteristics */
    characteristics: StructureCharacteristic[];

    /** Statistics by tier */
    tierStatistics: TierStatistics[];

    /** Relationships between tiers */
    tierRelationships: TierRelationship[];

    /** Path characteristics */
    pathCharacteristics: PathCharacteristics;

    /** Human-readable description of the teaching approach */
    pedagogicalDescription: string;

    /** Recommendations based on the topology */
    recommendations: string[];

    /** Raw metrics used in analysis */
    metrics: TopologyMetrics;
}

/**
 * Raw metrics computed during topology analysis.
 */
export interface TopologyMetrics {
    /** Total number of nodes */
    totalNodes: number;

    /** Total number of edges */
    totalEdges: number;

    /** Graph density (edges / max possible edges) */
    density: number;

    /** Average in-degree across all nodes */
    avgInDegree: number;

    /** Average out-degree across all nodes */
    avgOutDegree: number;

    /** Number of entry points (nodes with 0 in-degree from prerequisites) */
    entryPointCount: number;

    /** Number of terminal nodes (nodes with 0 out-degree) */
    terminalCount: number;

    /** Longest path length */
    longestPathLength: number;

    /** Shortest path length (entry to terminal) */
    shortestPathLength: number;

    /** Convergence ratio (edges entering convergent nodes / total edges) */
    convergenceRatio: number;

    /** Divergence ratio (edges from divergent nodes / total edges) */
    divergenceRatio: number;

    /** Distribution of nodes by tier */
    tierDistribution: Record<ProgressionLevel, number>;

    /** Edge type distribution */
    edgeTypeDistribution: Record<RelationshipType, number>;
}

// ============================================================================
// USER-FACING INSIGHT TYPES
// ============================================================================

/**
 * A pedagogical insight about a user's path choice.
 */
export interface PathInsight {
    /** Insight category */
    category:
        | "learning-style"
        | "curriculum-structure"
        | "pace-implication"
        | "skill-development"
        | "career-alignment";

    /** Short title for the insight */
    title: string;

    /** Detailed explanation */
    description: string;

    /** Relevance score (0-1) */
    relevance: number;

    /** Related teaching strategy */
    relatedStrategy?: TeachingStrategy;

    /** Icon name for display */
    icon: string;
}

/**
 * Comparison between two path choices.
 */
export interface PathComparison {
    /** First path being compared */
    pathA: LearningDomainId;

    /** Second path being compared */
    pathB: LearningDomainId;

    /** Teaching strategy difference */
    strategyDifference: string;

    /** Time investment difference */
    timeImplication: string;

    /** Skill focus difference */
    focusDifference: string;

    /** Recommendation based on comparison */
    recommendation: string;
}

/**
 * Adaptive learning recommendation based on topology analysis.
 */
export interface AdaptiveSuggestion {
    /** Type of suggestion */
    type:
        | "next-topic"
        | "review-topic"
        | "skip-ahead"
        | "branch-option"
        | "convergence-point"
        | "specialization-choice";

    /** Suggested node(s) */
    suggestedNodes: LearningDomainId[];

    /** Reasoning for the suggestion */
    reasoning: string;

    /** Based on which detected characteristic */
    basedOn: StructureCharacteristic | TeachingStrategy;

    /** Priority level (1-5, 5 being highest) */
    priority: number;
}
