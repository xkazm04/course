/**
 * Unified Learning Node Base Type
 *
 * This module defines the canonical base type for learning nodes in the curriculum DAG.
 * All content units (ChapterSections, MapNodes, ChapterNodes) share this foundation,
 * enabling unified chapter progression and curriculum graph integration.
 *
 * Key insight: ChapterSection has id, sectionId, content with code/keyPoints, and
 * completed status - exactly matching a LearningNode in a curriculum graph.
 * By unifying these types, chapter progress integrates naturally with the learning
 * graph, enabling cross-chapter prerequisite validation and smarter path recommendations.
 */

import type { LearningDomainId, DomainColorKey } from "@/app/shared/lib/learningDomains";

// ============================================================================
// BASE LEARNING NODE TYPE
// ============================================================================

/**
 * Status of a learning node in the curriculum graph.
 * Unified across all node types for consistent progress tracking.
 */
export type LearningNodeStatus =
    | "locked"       // Prerequisites not met
    | "available"    // Ready to start
    | "in_progress"  // Currently being learned
    | "completed"    // Finished successfully
    | "skipped";     // User chose to skip

/**
 * Content type classification for learning nodes.
 * Maps to different learning modalities and rendering strategies.
 */
export type LearningContentType =
    | "video"       // Video-based content
    | "lesson"      // Text-based lesson
    | "interactive" // Interactive tutorial
    | "exercise"    // Practice exercise
    | "quiz";       // Knowledge check quiz

/**
 * Base interface for all learning nodes in the curriculum DAG.
 * This is the foundation type that ChapterSection, MapNode (section level),
 * and ChapterSectionNode all extend or implement.
 *
 * Core invariant: Every learning unit that can be completed, tracked,
 * or used as a prerequisite implements this interface.
 */
export interface LearningNodeBase {
    /**
     * Unique identifier for this learning node.
     * For chapter sections: sectionId (e.g., "intro", "building")
     * For graph nodes: composite ID (e.g., "course:chapter:section")
     */
    id: string;

    /**
     * Human-readable title for display
     */
    title: string;

    /**
     * Current completion/availability status
     */
    status: LearningNodeStatus;

    /**
     * Type of content this node represents
     */
    contentType: LearningContentType;

    /**
     * Estimated duration to complete (in minutes or as formatted string)
     */
    duration: string | number;

    /**
     * Progress percentage (0-100)
     * 0 = not started, 100 = fully completed
     */
    progress: number;
}

/**
 * Extended learning node with graph relationships.
 * Used when the node participates in the curriculum DAG with
 * explicit prerequisite and dependency relationships.
 */
export interface LearningNodeWithRelations extends LearningNodeBase {
    /**
     * Parent node ID (for hierarchy traversal)
     * Null for root-level nodes
     */
    parentId: string | null;

    /**
     * Child node IDs (for drill-down navigation)
     */
    childIds: string[];

    /**
     * Prerequisite node IDs that must be completed first
     */
    prerequisiteIds: string[];

    /**
     * Node IDs that this node unlocks when completed
     */
    unlocksIds: string[];
}

/**
 * Learning node with domain and theming information.
 * Used for visual representation in knowledge maps and graphs.
 */
export interface LearningNodeWithDomain extends LearningNodeBase {
    /**
     * Learning domain this node belongs to
     */
    domainId: LearningDomainId;

    /**
     * Color key for theming and visual differentiation
     */
    color: DomainColorKey;

    /**
     * Description text for the node
     */
    description: string;
}

/**
 * Fully-featured learning node with all capabilities.
 * Combines base properties with relations and domain info.
 */
export interface LearningNode extends LearningNodeWithRelations, LearningNodeWithDomain {
    /**
     * XP reward for completing this node
     */
    xpReward?: number;

    /**
     * Sort order within parent container
     */
    sortOrder: number;

    /**
     * Whether this node is an entry point (can start without prerequisites)
     */
    isEntryPoint: boolean;
}

// ============================================================================
// CONTENT DESCRIPTOR TYPE
// ============================================================================

/**
 * Content descriptor for a learning node.
 * Provides detailed content information beyond the basic node metadata.
 */
export interface LearningNodeContent {
    /**
     * Detailed description of the content
     */
    description: string;

    /**
     * Code snippet associated with this content (for code lessons)
     */
    code?: string;

    /**
     * Key learning points
     */
    keyPoints?: string[];

    /**
     * Whether content includes visual/screenshot materials
     */
    hasVisuals?: boolean;
}

// ============================================================================
// TYPE CONVERSION UTILITIES
// ============================================================================

/**
 * Convert a basic status string to LearningNodeStatus
 */
export function toLearningNodeStatus(
    completed: boolean,
    available: boolean = true
): LearningNodeStatus {
    if (completed) return "completed";
    if (!available) return "locked";
    return "available";
}

/**
 * Convert LearningNodeStatus to boolean completion state
 */
export function isCompleted(status: LearningNodeStatus): boolean {
    return status === "completed";
}

/**
 * Check if a node is available for learning
 */
export function isAvailable(status: LearningNodeStatus): boolean {
    return status === "available" || status === "in_progress";
}

/**
 * Check if a node is locked
 */
export function isLocked(status: LearningNodeStatus): boolean {
    return status === "locked";
}

/**
 * Calculate progress percentage from completion state
 */
export function calculateNodeProgress(
    completed: boolean,
    partialProgress?: number
): number {
    if (completed) return 100;
    return partialProgress ?? 0;
}

/**
 * Parse duration string to minutes
 */
export function parseDurationToMinutes(duration: string | number): number {
    if (typeof duration === "number") return duration;

    // Handle formats like "5 min", "10m", "1h 30m"
    const minMatch = duration.match(/(\d+)\s*(?:min|m)/i);
    const hourMatch = duration.match(/(\d+)\s*(?:hour|hr|h)/i);

    let minutes = 0;
    if (minMatch) minutes += parseInt(minMatch[1], 10);
    if (hourMatch) minutes += parseInt(hourMatch[1], 10) * 60;

    // If no match, try parsing as plain number
    if (minutes === 0) {
        const parsed = parseInt(duration, 10);
        if (!isNaN(parsed)) minutes = parsed;
    }

    return minutes;
}

/**
 * Format minutes to human-readable duration string
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hr`;
    return `${hours} hr ${remainingMinutes} min`;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a node has domain information
 */
export function hasNodeDomain(
    node: LearningNodeBase
): node is LearningNodeWithDomain {
    return "domainId" in node && "color" in node;
}

/**
 * Type guard to check if a node has relationship information
 */
export function hasNodeRelations(
    node: LearningNodeBase
): node is LearningNodeWithRelations {
    return "parentId" in node && "childIds" in node;
}

/**
 * Type guard to check if a node is a full LearningNode
 */
export function isFullLearningNode(
    node: LearningNodeBase
): node is LearningNode {
    return hasNodeDomain(node) && hasNodeRelations(node);
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a minimal learning node base from required fields
 */
export function createLearningNodeBase(params: {
    id: string;
    title: string;
    contentType: LearningContentType;
    duration: string | number;
    completed?: boolean;
    progress?: number;
}): LearningNodeBase {
    return {
        id: params.id,
        title: params.title,
        contentType: params.contentType,
        duration: params.duration,
        status: params.completed ? "completed" : "available",
        progress: params.progress ?? (params.completed ? 100 : 0),
    };
}

/**
 * Create a learning node with relations
 */
export function createLearningNodeWithRelations(
    base: LearningNodeBase,
    relations: {
        parentId: string | null;
        childIds?: string[];
        prerequisiteIds?: string[];
        unlocksIds?: string[];
    }
): LearningNodeWithRelations {
    return {
        ...base,
        parentId: relations.parentId,
        childIds: relations.childIds ?? [],
        prerequisiteIds: relations.prerequisiteIds ?? [],
        unlocksIds: relations.unlocksIds ?? [],
    };
}
