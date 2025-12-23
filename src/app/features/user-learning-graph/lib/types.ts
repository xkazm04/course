/**
 * User Learning Graph Types
 *
 * This module defines the type system for tracking user decisions as learning path mutations.
 * When a user selects a path, completes a node, or skips prerequisites, they are implicitly
 * mutating their personal learning graph.
 *
 * The UserLearningGraph evolves over time based on:
 * - Selected paths (branches the user has chosen)
 * - Completed nodes (collapsed edges - already learned)
 * - Skipped prerequisites (overrides - user chose to skip)
 * - Active nodes (currently learning)
 * - Bookmarked nodes (interested but not started)
 *
 * This system turns the curriculum into a graph editor where users sculpt their
 * personalized curriculum through normal navigation actions.
 */

import type { LearningDomainId } from "@/app/shared/lib/learningDomains";

// ============================================================================
// NODE STATE TYPES
// ============================================================================

/**
 * Status of a node in the user's learning graph
 */
export type UserNodeStatus =
    | "not_started"      // User hasn't interacted with this node
    | "bookmarked"       // User has bookmarked for later
    | "in_progress"      // User is actively learning this
    | "completed"        // User has completed this node
    | "skipped"          // User explicitly skipped this prerequisite
    | "unlocked";        // Prerequisites met, available to start

/**
 * Type of user action that mutated the graph
 */
export type GraphMutationType =
    | "path_selected"        // User selected a learning path
    | "node_started"         // User started a specific node
    | "node_completed"       // User completed a node
    | "node_skipped"         // User skipped a prerequisite
    | "node_bookmarked"      // User bookmarked a node
    | "node_unbookmarked"    // User removed bookmark
    | "path_abandoned"       // User stopped pursuing a path
    | "progress_reset";      // User reset progress on a node

/**
 * Tracks a single mutation to the learning graph
 */
export interface GraphMutation {
    /** Unique identifier for this mutation */
    id: string;
    /** Type of mutation */
    type: GraphMutationType;
    /** ID of the affected node */
    nodeId: string;
    /** Optional: Related path ID (for path-level mutations) */
    pathId?: LearningDomainId;
    /** Timestamp when mutation occurred */
    timestamp: string;
    /** Optional: Previous state before mutation */
    previousState?: UserNodeStatus;
    /** New state after mutation */
    newState: UserNodeStatus;
    /** Optional: Additional context about why this mutation happened */
    context?: {
        /** Source of the mutation (e.g., which component triggered it) */
        source?: string;
        /** Whether this was an explicit user action or automatic */
        isExplicit: boolean;
        /** Parent nodes that were prerequisites */
        satisfiedPrerequisites?: string[];
        /** Nodes that were skipped to enable this */
        skippedPrerequisites?: string[];
    };
}

/**
 * Represents a node's state in the user's personal learning graph
 */
export interface UserNodeState {
    /** The node ID (matches curriculum node ID) */
    nodeId: string;
    /** Current status of this node for the user */
    status: UserNodeStatus;
    /** When the user first interacted with this node */
    firstInteractionAt?: string;
    /** When the user completed this node */
    completedAt?: string;
    /** Progress percentage (0-100) for in-progress nodes */
    progress: number;
    /** Time spent on this node in minutes */
    timeSpentMinutes: number;
    /** Number of times the user visited this node */
    visitCount: number;
    /** Notes the user has taken on this node */
    notes?: string;
    /** User's self-assessed confidence level (1-5) */
    confidenceLevel?: 1 | 2 | 3 | 4 | 5;
    /** Whether this was an explicit user selection or inferred */
    isExplicitSelection: boolean;
}

/**
 * Represents a learning path branch in the user's graph
 */
export interface UserPathBranch {
    /** The path ID */
    pathId: LearningDomainId;
    /** When the user selected this path */
    selectedAt: string;
    /** Whether this is the user's primary path */
    isPrimary: boolean;
    /** Progress through this path (0-100) */
    progress: number;
    /** Number of nodes completed in this path */
    completedNodes: number;
    /** Total nodes in this path */
    totalNodes: number;
    /** Whether the user has abandoned this path */
    isAbandoned: boolean;
    /** When the user last worked on this path */
    lastActivityAt: string;
}

// ============================================================================
// USER LEARNING GRAPH
// ============================================================================

/**
 * Learning strategy preferences inferred from user decisions
 */
export interface LearningStrategyProfile {
    /** Does user prefer depth or breadth? (0 = pure breadth, 1 = pure depth) */
    depthVsBreadth: number;
    /** Does user prefer theory or practice? (0 = pure theory, 1 = pure practice) */
    theoryVsPractice: number;
    /** Does user skip prerequisites often? (0 = never, 1 = always) */
    prerequisiteSkipRate: number;
    /** Average time spent per node */
    avgTimePerNode: number;
    /** Completion rate across started nodes */
    completionRate: number;
    /** Number of paths explored */
    pathsExplored: number;
    /** Last updated timestamp */
    lastCalculatedAt: string;
}

/**
 * Analytics about the user's learning patterns
 */
export interface UserLearningAnalytics {
    /** Total nodes completed */
    totalCompleted: number;
    /** Total nodes started */
    totalStarted: number;
    /** Total time spent learning (minutes) */
    totalTimeSpent: number;
    /** Current streak (days) */
    currentStreak: number;
    /** Longest streak achieved */
    longestStreak: number;
    /** Average completion time per node */
    avgCompletionTime: number;
    /** Most active learning domain */
    primaryDomain?: LearningDomainId;
    /** Learning strategy profile */
    strategyProfile: LearningStrategyProfile;
    /** Skill gaps identified (nodes recommended but not started) */
    skillGaps: string[];
    /** Recommended next nodes based on patterns */
    recommendedNodes: string[];
}

/**
 * The complete user learning graph
 * This is the personal curriculum that evolves based on user decisions
 */
export interface UserLearningGraph {
    /** Unique user identifier */
    userId: string;
    /** Version for migrations */
    version: string;
    /** When this graph was created */
    createdAt: string;
    /** When this graph was last modified */
    lastModifiedAt: string;
    /** All node states in the user's graph */
    nodes: Record<string, UserNodeState>;
    /** All path branches the user has selected */
    paths: Record<LearningDomainId, UserPathBranch>;
    /** History of mutations to this graph */
    mutationHistory: GraphMutation[];
    /** Analytics derived from the graph */
    analytics: UserLearningAnalytics;
    /** User preferences that affect graph behavior */
    preferences: {
        /** Show skipped prerequisites in path views */
        showSkippedPrerequisites: boolean;
        /** Auto-unlock nodes when prerequisites are met */
        autoUnlockNodes: boolean;
        /** Track time spent automatically */
        autoTrackTime: boolean;
        /** Maximum mutations to keep in history */
        maxHistorySize: number;
    };
}

// ============================================================================
// MUTATION HELPERS
// ============================================================================

/**
 * Input for creating a new graph mutation
 */
export interface CreateMutationInput {
    type: GraphMutationType;
    nodeId: string;
    pathId?: LearningDomainId;
    newState: UserNodeStatus;
    context?: GraphMutation["context"];
}

/**
 * Options for querying mutations
 */
export interface MutationQueryOptions {
    /** Filter by mutation type */
    types?: GraphMutationType[];
    /** Filter by node ID */
    nodeId?: string;
    /** Filter by path ID */
    pathId?: LearningDomainId;
    /** Filter by date range */
    dateRange?: {
        start: string;
        end: string;
    };
    /** Limit number of results */
    limit?: number;
    /** Sort order */
    sortOrder?: "asc" | "desc";
}

/**
 * Result of aggregating mutations
 */
export interface MutationAggregation {
    /** Total count of mutations */
    totalCount: number;
    /** Breakdown by type */
    byType: Record<GraphMutationType, number>;
    /** Breakdown by path */
    byPath: Record<LearningDomainId, number>;
    /** Most common mutation type */
    mostCommonType: GraphMutationType;
    /** First mutation timestamp */
    firstMutationAt: string;
    /** Last mutation timestamp */
    lastMutationAt: string;
}

// ============================================================================
// GRAPH OPERATIONS
// ============================================================================

/**
 * Represents a path recommendation based on graph analysis
 */
export interface PathRecommendation {
    /** Recommended path ID */
    pathId: LearningDomainId;
    /** Confidence score (0-1) */
    confidence: number;
    /** Reason for recommendation */
    reason: string;
    /** Estimated completion time */
    estimatedHours: number;
    /** Prerequisite overlap with completed nodes */
    prerequisiteOverlap: number;
    /** Skill gap coverage */
    skillGapCoverage: number;
}

/**
 * Represents a suggested next node based on graph state
 */
export interface NodeSuggestion {
    /** Suggested node ID */
    nodeId: string;
    /** Priority score (higher = more recommended) */
    priority: number;
    /** Type of suggestion */
    suggestionType: "continue" | "explore" | "fill_gap" | "review";
    /** Human-readable reason */
    reason: string;
    /** Path this node belongs to */
    pathId?: LearningDomainId;
}

/**
 * Export format for user learning graph (for sharing/backup)
 */
export interface UserLearningGraphExport {
    /** Export timestamp */
    exportedAt: string;
    /** Export version */
    exportVersion: string;
    /** The graph data */
    graph: UserLearningGraph;
    /** Optional: Include full mutation history */
    includeMutationHistory: boolean;
}
