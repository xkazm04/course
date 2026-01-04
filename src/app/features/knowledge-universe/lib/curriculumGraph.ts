/**
 * Curriculum Graph - Canonical Domain Model
 *
 * This is the source-agnostic domain model for learning content.
 * The "universe" visualization is just one possible representation
 * of this underlying data structure. Future visualizations (tree,
 * timeline, etc.) can all consume this same model.
 */

// ============================================================================
// CORE NODE TYPES
// ============================================================================

/**
 * Base interface for all curriculum nodes (source-agnostic)
 */
export interface CurriculumNodeBase {
    id: string;
    name: string;
    description?: string;
    /** Original source of this node (mock, supabase, api, etc.) */
    source: CurriculumDataSource;
}

/**
 * Domain node - top-level learning area (e.g., "Frontend", "Backend")
 */
export interface CurriculumDomainNode extends CurriculumNodeBase {
    nodeType: "domain";
    /** Domain identifier for color/icon mapping */
    domainId: string;
    /** Whether this is a good starting point for beginners */
    isEntryPoint: boolean;
    /** Number of child topics/chapters */
    childCount: number;
    /** Optional color override */
    color?: string;
    /** Hierarchy level (0 = foundation) */
    hierarchyLevel: number;
}

/**
 * Topic/Chapter node - mid-level grouping
 */
export interface CurriculumTopicNode extends CurriculumNodeBase {
    nodeType: "topic";
    /** Parent domain ID */
    parentDomainId: string;
    /** Unique chapter identifier */
    chapterId: string;
    /** Number of child lessons/skills */
    childCount: number;
    /** Estimated hours to complete */
    estimatedHours?: number;
    /** Difficulty level */
    difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
}

/**
 * Skill/Lesson node - most granular level
 */
export interface CurriculumSkillNode extends CurriculumNodeBase {
    nodeType: "skill";
    /** Parent topic/chapter ID */
    parentTopicId: string;
    /** Unique lesson identifier */
    lessonId: string;
    /** Content type */
    contentType: "video" | "lesson" | "interactive" | "exercise";
    /** Duration string */
    duration?: string;
    /** Whether user has completed this */
    completed?: boolean;
    /** Difficulty level */
    difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
}

/**
 * Union type for all curriculum nodes
 */
export type CurriculumGraphNode =
    | CurriculumDomainNode
    | CurriculumTopicNode
    | CurriculumSkillNode;

// ============================================================================
// CONNECTION TYPES
// ============================================================================

/**
 * Connection type between curriculum nodes
 */
export type CurriculumConnectionType =
    | "parent_child"     // Hierarchical relationship
    | "prerequisite"     // Must complete A before B
    | "recommended"      // Suggested order
    | "related"          // Topically related
    | "builds_upon";     // B extends concepts from A

/**
 * Connection between two curriculum nodes
 */
export interface CurriculumConnection {
    id: string;
    fromId: string;
    toId: string;
    type: CurriculumConnectionType;
    /** Connection strength (0-1) for visual weight */
    weight: number;
    /** Optional label for the connection */
    label?: string;
}

// ============================================================================
// CURRICULUM GRAPH STRUCTURE
// ============================================================================

/**
 * Data source identifier
 */
export type CurriculumDataSource = "mock" | "supabase" | "api" | "user_generated";

/**
 * Complete curriculum graph (source-agnostic)
 */
export interface CurriculumGraph {
    /** All domain nodes */
    domains: CurriculumDomainNode[];
    /** All topic/chapter nodes */
    topics: CurriculumTopicNode[];
    /** All skill/lesson nodes */
    skills: CurriculumSkillNode[];
    /** All connections between nodes */
    connections: CurriculumConnection[];
    /** Metadata about the graph */
    metadata: CurriculumGraphMetadata;
}

/**
 * Metadata about the curriculum graph
 */
export interface CurriculumGraphMetadata {
    /** Primary data source */
    source: CurriculumDataSource;
    /** Schema version for migrations */
    version: string;
    /** When the data was last fetched/updated */
    lastUpdated: string;
    /** Total node counts */
    counts: {
        domains: number;
        topics: number;
        skills: number;
        connections: number;
    };
}

// ============================================================================
// GRAPH ACCESSORS
// ============================================================================

/**
 * Get all nodes from a curriculum graph
 */
export function getAllNodes(graph: CurriculumGraph): CurriculumGraphNode[] {
    return [...graph.domains, ...graph.topics, ...graph.skills];
}

/**
 * Get a node by ID
 */
export function getNodeById(
    graph: CurriculumGraph,
    id: string
): CurriculumGraphNode | undefined {
    return (
        graph.domains.find((n) => n.id === id) ??
        graph.topics.find((n) => n.id === id) ??
        graph.skills.find((n) => n.id === id)
    );
}

/**
 * Get children of a node
 */
export function getChildNodes(
    graph: CurriculumGraph,
    parentId: string
): CurriculumGraphNode[] {
    const parentNode = getNodeById(graph, parentId);
    if (!parentNode) return [];

    if (parentNode.nodeType === "domain") {
        return graph.topics.filter((t) => t.parentDomainId === parentId);
    }
    if (parentNode.nodeType === "topic") {
        return graph.skills.filter((s) => s.parentTopicId === parentId);
    }
    return [];
}

/**
 * Get parent of a node
 */
export function getParentNode(
    graph: CurriculumGraph,
    nodeId: string
): CurriculumGraphNode | undefined {
    const node = getNodeById(graph, nodeId);
    if (!node) return undefined;

    if (node.nodeType === "topic") {
        return graph.domains.find((d) => d.id === node.parentDomainId);
    }
    if (node.nodeType === "skill") {
        return graph.topics.find((t) => t.id === node.parentTopicId);
    }
    return undefined;
}

/**
 * Get connections for a node
 */
export function getNodeConnections(
    graph: CurriculumGraph,
    nodeId: string,
    direction: "outgoing" | "incoming" | "both" = "both"
): CurriculumConnection[] {
    return graph.connections.filter((conn) => {
        if (direction === "outgoing") return conn.fromId === nodeId;
        if (direction === "incoming") return conn.toId === nodeId;
        return conn.fromId === nodeId || conn.toId === nodeId;
    });
}

/**
 * Get prerequisites for a node
 */
export function getPrerequisites(
    graph: CurriculumGraph,
    nodeId: string
): CurriculumGraphNode[] {
    const prereqConnections = graph.connections.filter(
        (conn) => conn.toId === nodeId && conn.type === "prerequisite"
    );
    return prereqConnections
        .map((conn) => getNodeById(graph, conn.fromId))
        .filter((n): n is CurriculumGraphNode => n !== undefined);
}

/**
 * Check if prerequisites are met
 */
export function arePrerequisitesMet(
    graph: CurriculumGraph,
    nodeId: string,
    completedIds: Set<string>
): boolean {
    const prereqs = getPrerequisites(graph, nodeId);
    return prereqs.every((prereq) => completedIds.has(prereq.id));
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isDomainNode(node: CurriculumGraphNode): node is CurriculumDomainNode {
    return node.nodeType === "domain";
}

export function isTopicNode(node: CurriculumGraphNode): node is CurriculumTopicNode {
    return node.nodeType === "topic";
}

export function isSkillNode(node: CurriculumGraphNode): node is CurriculumSkillNode {
    return node.nodeType === "skill";
}

// ============================================================================
// EMPTY GRAPH FACTORY
// ============================================================================

/**
 * Create an empty curriculum graph
 */
export function createEmptyCurriculumGraph(source: CurriculumDataSource): CurriculumGraph {
    return {
        domains: [],
        topics: [],
        skills: [],
        connections: [],
        metadata: {
            source,
            version: "1.0.0",
            lastUpdated: new Date().toISOString(),
            counts: {
                domains: 0,
                topics: 0,
                skills: 0,
                connections: 0,
            },
        },
    };
}
