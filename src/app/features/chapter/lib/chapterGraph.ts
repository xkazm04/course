/**
 * Chapter Graph System
 *
 * This module connects ChapterSection to the learningPathGraph.ts structure,
 * making chapters first-class nodes in the curriculum DAG. This enables:
 * - Cross-chapter prerequisites
 * - Suggested next chapters
 * - Prerequisite warnings
 * - Unified learning path traversal
 *
 * The key insight: ChapterSection already contains id, sectionId, dependencies
 * (implicit via order), duration, and completion state - exactly the fields of a graph node.
 */

import type { LearningDomainId } from "@/app/shared/lib/learningDomains";
import type {
    SpatialPosition,
    HierarchyLevel,
    TimelinePhase,
    RelationshipType,
} from "@/app/shared/lib/learningPathGraph";
import type { ChapterSection, CourseInfo } from "./chapterData";

// ============================================================================
// CHAPTER NODE TYPES
// ============================================================================

/**
 * Unique identifier for a chapter node in the curriculum graph.
 * Format: `{courseId}:{chapterId}` for course-level chapters
 * or `{courseId}:{chapterId}:{sectionId}` for section-level nodes
 */
export type ChapterNodeId = string;

/**
 * Granularity level for chapter nodes in the graph.
 * - chapter: Entire chapter as a single node
 * - section: Each section within a chapter as a separate node
 */
export type NodeGranularity = "chapter" | "section";

/**
 * Chapter node difficulty level (maps to timeline phases)
 */
export type ChapterDifficulty = "beginner" | "intermediate" | "advanced" | "expert";

/**
 * Status of a chapter node based on user progress
 */
export type ChapterNodeStatus = "locked" | "available" | "in_progress" | "completed";

/**
 * A chapter as a first-class node in the curriculum DAG.
 * Mirrors the GraphNode structure from learningPathGraph.ts but
 * specialized for chapter-level content.
 */
export interface ChapterNode {
    /** Unique identifier: `{courseId}:{chapterId}` */
    id: ChapterNodeId;

    /** Course this chapter belongs to */
    courseId: string;

    /** Chapter identifier within the course */
    chapterId: string;

    /** Display title for the chapter */
    title: string;

    /** Associated learning domain (inherits from course) */
    domainId: LearningDomainId;

    /** Spatial position for map/spatial views (percentage-based) */
    position: SpatialPosition;

    /** Hierarchy level in the curriculum (0 = foundation, 3 = expert) */
    hierarchyLevel: HierarchyLevel;

    /** Timeline phase for roadmap/progression views */
    timelinePhase: TimelinePhase;

    /** Difficulty level */
    difficulty: ChapterDifficulty;

    /** Estimated duration in minutes */
    durationMinutes: number;

    /** Sort order within the course */
    sortOrder: number;

    /** Whether this chapter can be started without prerequisites */
    isEntryPoint: boolean;

    /** XP awarded upon completion */
    xpReward: number;

    /** Section count within this chapter */
    sectionCount: number;

    /** Optional sections data (for section-level graph views) */
    sections?: ChapterSectionNode[];
}

/**
 * A section within a chapter as a graph node.
 * Enables fine-grained prerequisite tracking within chapters.
 */
export interface ChapterSectionNode {
    /** Unique identifier: `{courseId}:{chapterId}:{sectionId}` */
    id: ChapterNodeId;

    /** Parent chapter node ID */
    chapterNodeId: ChapterNodeId;

    /** Section ID from ChapterSection */
    sectionId: string;

    /** Numeric order within the chapter */
    order: number;

    /** Display title */
    title: string;

    /** Duration string (e.g., "5 min") */
    duration: string;

    /** Duration in minutes for calculations */
    durationMinutes: number;

    /** Section type */
    type: "video" | "lesson" | "interactive" | "exercise";

    /** Completion status */
    completed: boolean;

    /** Reference to original ChapterSection data */
    originalSection: ChapterSection;
}

/**
 * Edge connecting chapter nodes in the graph
 */
export interface ChapterEdge {
    /** Source chapter node ID */
    from: ChapterNodeId;

    /** Target chapter node ID */
    to: ChapterNodeId;

    /** Type of relationship */
    type: RelationshipType;

    /** Visual weight for rendering (1-3) */
    weight: number;

    /** Optional descriptive label */
    label?: string;

    /** Whether this is an intra-chapter edge (within same chapter) */
    isIntraChapter: boolean;
}

/**
 * Complete chapter curriculum graph
 */
export interface ChapterGraph {
    /** All chapter nodes */
    nodes: ChapterNode[];

    /** All edges connecting chapters */
    edges: ChapterEdge[];

    /** Graph metadata */
    metadata: {
        version: string;
        courseId: string;
        lastUpdated: string;
    };
}

// ============================================================================
// CHAPTER NODE FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a ChapterNodeId from course and chapter IDs
 */
export function createChapterNodeId(courseId: string, chapterId: string): ChapterNodeId {
    return `${courseId}:${chapterId}`;
}

/**
 * Create a section-level node ID
 */
export function createSectionNodeId(
    courseId: string,
    chapterId: string,
    sectionId: string
): ChapterNodeId {
    return `${courseId}:${chapterId}:${sectionId}`;
}

/**
 * Parse a ChapterNodeId into its components
 */
export function parseChapterNodeId(nodeId: ChapterNodeId): {
    courseId: string;
    chapterId: string;
    sectionId?: string;
} {
    const parts = nodeId.split(":");
    return {
        courseId: parts[0] || "",
        chapterId: parts[1] || "",
        sectionId: parts[2],
    };
}

/**
 * Convert a ChapterSection to a ChapterSectionNode
 */
export function sectionToNode(
    section: ChapterSection,
    courseInfo: CourseInfo
): ChapterSectionNode {
    const chapterNodeId = createChapterNodeId(courseInfo.courseId, courseInfo.chapterId);
    const durationMinutes = parseInt(section.duration, 10) || 0;

    return {
        id: createSectionNodeId(courseInfo.courseId, courseInfo.chapterId, section.sectionId),
        chapterNodeId,
        sectionId: section.sectionId,
        order: section.id,
        title: section.title,
        duration: section.duration,
        durationMinutes,
        type: section.type,
        completed: section.completed,
        originalSection: section,
    };
}

/**
 * Convert an array of ChapterSections to ChapterSectionNodes
 */
export function sectionsToNodes(
    sections: ChapterSection[],
    courseInfo: CourseInfo
): ChapterSectionNode[] {
    return sections.map((section) => sectionToNode(section, courseInfo));
}

/**
 * Create a ChapterNode from CourseInfo and sections
 */
export function createChapterNode(
    courseInfo: CourseInfo,
    sections: ChapterSection[],
    options: {
        domainId: LearningDomainId;
        position: SpatialPosition;
        hierarchyLevel: HierarchyLevel;
        timelinePhase: TimelinePhase;
        difficulty: ChapterDifficulty;
        sortOrder: number;
        isEntryPoint?: boolean;
        xpReward?: number;
    }
): ChapterNode {
    const totalMinutes = sections.reduce((sum, s) => {
        const mins = parseInt(s.duration, 10);
        return sum + (isNaN(mins) ? 0 : mins);
    }, 0);

    const sectionNodes = sectionsToNodes(sections, courseInfo);

    return {
        id: createChapterNodeId(courseInfo.courseId, courseInfo.chapterId),
        courseId: courseInfo.courseId,
        chapterId: courseInfo.chapterId,
        title: courseInfo.chapterTitle,
        domainId: options.domainId,
        position: options.position,
        hierarchyLevel: options.hierarchyLevel,
        timelinePhase: options.timelinePhase,
        difficulty: options.difficulty,
        durationMinutes: totalMinutes,
        sortOrder: options.sortOrder,
        isEntryPoint: options.isEntryPoint ?? false,
        xpReward: options.xpReward ?? 100,
        sectionCount: sections.length,
        sections: sectionNodes,
    };
}

// ============================================================================
// PREREQUISITE & DEPENDENCY FUNCTIONS
// ============================================================================

/**
 * Get all prerequisite chapter IDs for a given chapter
 */
export function getChapterPrerequisites(
    chapterNodeId: ChapterNodeId,
    edges: ChapterEdge[]
): ChapterNodeId[] {
    return edges
        .filter(
            (edge) =>
                edge.to === chapterNodeId &&
                edge.type === "prerequisite" &&
                !edge.isIntraChapter
        )
        .map((edge) => edge.from);
}

/**
 * Get chapters that depend on a given chapter
 */
export function getChapterDependents(
    chapterNodeId: ChapterNodeId,
    edges: ChapterEdge[]
): ChapterNodeId[] {
    return edges
        .filter(
            (edge) =>
                edge.from === chapterNodeId &&
                edge.type === "prerequisite" &&
                !edge.isIntraChapter
        )
        .map((edge) => edge.to);
}

/**
 * Get suggested next chapters after completing a chapter
 */
export function getSuggestedNextChapters(
    chapterNodeId: ChapterNodeId,
    edges: ChapterEdge[]
): ChapterNodeId[] {
    return edges
        .filter(
            (edge) =>
                edge.from === chapterNodeId &&
                (edge.type === "builds-upon" || edge.type === "enables") &&
                !edge.isIntraChapter
        )
        .map((edge) => edge.to);
}

/**
 * Check if a chapter's prerequisites are met based on completed chapters
 */
export function arePrerequisitesMet(
    chapterNodeId: ChapterNodeId,
    edges: ChapterEdge[],
    completedChapterIds: Set<ChapterNodeId>
): boolean {
    const prerequisites = getChapterPrerequisites(chapterNodeId, edges);
    return prerequisites.every((prereq) => completedChapterIds.has(prereq));
}

/**
 * Get prerequisite warnings for a chapter
 */
export function getPrerequisiteWarnings(
    chapterNodeId: ChapterNodeId,
    edges: ChapterEdge[],
    nodes: ChapterNode[],
    completedChapterIds: Set<ChapterNodeId>
): Array<{ nodeId: ChapterNodeId; title: string }> {
    const prerequisites = getChapterPrerequisites(chapterNodeId, edges);
    const unmet = prerequisites.filter((prereq) => !completedChapterIds.has(prereq));

    return unmet.map((prereqId) => {
        const node = nodes.find((n) => n.id === prereqId);
        return {
            nodeId: prereqId,
            title: node?.title ?? prereqId,
        };
    });
}

/**
 * Calculate chapter node status based on prerequisites and progress
 */
export function getChapterNodeStatus(
    chapterNode: ChapterNode,
    edges: ChapterEdge[],
    completedChapterIds: Set<ChapterNodeId>,
    inProgressChapterId?: ChapterNodeId
): ChapterNodeStatus {
    // Check if completed
    if (completedChapterIds.has(chapterNode.id)) {
        return "completed";
    }

    // Check if currently in progress
    if (chapterNode.id === inProgressChapterId) {
        return "in_progress";
    }

    // Check prerequisites
    if (!arePrerequisitesMet(chapterNode.id, edges, completedChapterIds)) {
        return "locked";
    }

    return "available";
}

// ============================================================================
// INTRA-CHAPTER SECTION DEPENDENCIES
// ============================================================================

/**
 * Get implicit section dependencies within a chapter.
 * Sections are ordered, so each section implicitly depends on the previous one.
 */
export function getSectionDependencies(sections: ChapterSectionNode[]): ChapterEdge[] {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const edges: ChapterEdge[] = [];

    for (let i = 1; i < sorted.length; i++) {
        edges.push({
            from: sorted[i - 1]!.id,
            to: sorted[i]!.id,
            type: "prerequisite",
            weight: 2,
            label: "Sequential order",
            isIntraChapter: true,
        });
    }

    return edges;
}

/**
 * Check if a section is available based on previous sections' completion
 */
export function isSectionAvailable(
    sectionNode: ChapterSectionNode,
    allSections: ChapterSectionNode[]
): boolean {
    // First section is always available
    if (sectionNode.order === 1) {
        return true;
    }

    // Check if previous section is completed
    const previousSection = allSections.find((s) => s.order === sectionNode.order - 1);
    return previousSection?.completed ?? false;
}

/**
 * Get the next available section in a chapter
 */
export function getNextAvailableSection(
    sections: ChapterSectionNode[]
): ChapterSectionNode | undefined {
    const sorted = [...sections].sort((a, b) => a.order - b.order);

    // Find first incomplete section
    for (const section of sorted) {
        if (!section.completed) {
            // Check if it's available
            if (isSectionAvailable(section, sorted)) {
                return section;
            }
        }
    }

    // All sections completed or none available
    return undefined;
}

// ============================================================================
// GRAPH TRAVERSAL UTILITIES
// ============================================================================

/**
 * Get all chapters reachable from a starting chapter (DFS traversal)
 */
export function getReachableChapters(
    startNodeId: ChapterNodeId,
    edges: ChapterEdge[],
    nodes: ChapterNode[]
): ChapterNode[] {
    const visited = new Set<ChapterNodeId>();
    const result: ChapterNode[] = [];

    function dfs(nodeId: ChapterNodeId) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
            result.push(node);
        }

        // Get outgoing edges (chapters this leads to)
        const outgoing = edges
            .filter((e) => e.from === nodeId && !e.isIntraChapter)
            .map((e) => e.to);

        for (const nextId of outgoing) {
            dfs(nextId);
        }
    }

    dfs(startNodeId);
    return result;
}

/**
 * Find the optimal learning path through chapters (topological sort)
 */
export function getOptimalLearningPath(
    nodes: ChapterNode[],
    edges: ChapterEdge[]
): ChapterNode[] {
    // Filter to only cross-chapter prerequisite edges
    const prereqEdges = edges.filter((e) => e.type === "prerequisite" && !e.isIntraChapter);

    // Build adjacency list and in-degree count
    const inDegree = new Map<ChapterNodeId, number>();
    const adjacency = new Map<ChapterNodeId, ChapterNodeId[]>();

    for (const node of nodes) {
        inDegree.set(node.id, 0);
        adjacency.set(node.id, []);
    }

    for (const edge of prereqEdges) {
        const currentInDegree = inDegree.get(edge.to) ?? 0;
        inDegree.set(edge.to, currentInDegree + 1);

        const adj = adjacency.get(edge.from) ?? [];
        adj.push(edge.to);
        adjacency.set(edge.from, adj);
    }

    // Kahn's algorithm for topological sort
    const queue: ChapterNodeId[] = [];
    for (const [nodeId, degree] of inDegree) {
        if (degree === 0) {
            queue.push(nodeId);
        }
    }

    const result: ChapterNode[] = [];

    while (queue.length > 0) {
        // Sort by sortOrder within same hierarchy level
        queue.sort((a, b) => {
            const nodeA = nodes.find((n) => n.id === a);
            const nodeB = nodes.find((n) => n.id === b);
            if (!nodeA || !nodeB) return 0;
            if (nodeA.hierarchyLevel !== nodeB.hierarchyLevel) {
                return nodeA.hierarchyLevel - nodeB.hierarchyLevel;
            }
            return nodeA.sortOrder - nodeB.sortOrder;
        });

        const current = queue.shift()!;
        const node = nodes.find((n) => n.id === current);
        if (node) {
            result.push(node);
        }

        const neighbors = adjacency.get(current) ?? [];
        for (const neighbor of neighbors) {
            const degree = (inDegree.get(neighbor) ?? 1) - 1;
            inDegree.set(neighbor, degree);
            if (degree === 0) {
                queue.push(neighbor);
            }
        }
    }

    return result;
}

/**
 * Calculate total XP available in a learning path
 */
export function calculatePathXP(nodes: ChapterNode[]): number {
    return nodes.reduce((sum, node) => sum + node.xpReward, 0);
}

/**
 * Calculate total duration of a learning path in minutes
 */
export function calculatePathDuration(nodes: ChapterNode[]): number {
    return nodes.reduce((sum, node) => sum + node.durationMinutes, 0);
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatPathDuration(totalMinutes: number): string {
    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
        return `${hours} hr`;
    }
    return `${hours} hr ${minutes} min`;
}
