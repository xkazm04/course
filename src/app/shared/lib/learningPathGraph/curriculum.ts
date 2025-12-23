/**
 * Unified Curriculum Graph Types and Functions
 *
 * Extended graph types for multi-level curriculum representation
 * (domain -> chapter -> section).
 */

import type { LearningDomainId } from "../learningDomains";
import type {
    SpatialPosition,
    HierarchyLevel,
    TimelinePhase,
    RelationshipType,
    GraphNode,
    GraphEdge,
} from "./types";
import { GRAPH_NODES, GRAPH_EDGES } from "./constants";

// ============================================================================
// UNIFIED CURRICULUM GRAPH TYPES
// ============================================================================

/**
 * Node type discriminator for the unified curriculum graph.
 */
export type CurriculumNodeType = "domain" | "chapter" | "section";

/**
 * Base interface for all curriculum nodes
 */
interface CurriculumNodeBase {
    nodeType: CurriculumNodeType;
    id: string;
    name: string;
    position: SpatialPosition;
    hierarchyLevel: HierarchyLevel;
    timelinePhase: TimelinePhase;
    isEntryPoint: boolean;
    sortOrder: number;
}

/**
 * Domain-level node (existing GraphNode extended)
 */
export interface DomainCurriculumNode extends CurriculumNodeBase {
    nodeType: "domain";
    id: LearningDomainId;
}

/**
 * Chapter-level node for fine-grained curriculum mapping
 */
export interface ChapterCurriculumNode extends CurriculumNodeBase {
    nodeType: "chapter";
    domainId: LearningDomainId;
    courseId: string;
    chapterId: string;
    durationMinutes: number;
    sectionCount: number;
    xpReward: number;
}

/**
 * Section-level node (most granular)
 */
export interface SectionCurriculumNode extends CurriculumNodeBase {
    nodeType: "section";
    chapterNodeId: string;
    sectionId: string;
    sectionType: "video" | "lesson" | "interactive" | "exercise";
    duration: string;
    completed: boolean;
}

/**
 * Union type for all curriculum nodes
 */
export type CurriculumNode = DomainCurriculumNode | ChapterCurriculumNode | SectionCurriculumNode;

/**
 * Edge in the unified curriculum graph
 */
export interface CurriculumEdge {
    from: string;
    to: string;
    type: RelationshipType;
    weight: number;
    label?: string;
    fromType: CurriculumNodeType;
    toType: CurriculumNodeType;
}

/**
 * Complete unified curriculum graph
 */
export interface UnifiedCurriculumGraph {
    domainNodes: DomainCurriculumNode[];
    chapterNodes: ChapterCurriculumNode[];
    sectionNodes?: SectionCurriculumNode[];
    edges: CurriculumEdge[];
    metadata: {
        version: string;
        lastUpdated: string;
    };
}

// ============================================================================
// DOMAIN NAME MAPPING
// ============================================================================

const DOMAIN_NAMES: Record<LearningDomainId, string> = {
    frontend: "Frontend Development",
    fullstack: "Full Stack Development",
    backend: "Backend Development",
    databases: "Database Engineering",
    games: "Game Development",
    mobile: "Mobile Development",
};

/**
 * Get domain name for display
 */
export function getDomainName(id: LearningDomainId): string {
    return DOMAIN_NAMES[id] || id;
}

// ============================================================================
// CONVERTERS
// ============================================================================

/**
 * Convert existing GraphNode to DomainCurriculumNode
 */
export function graphNodeToCurriculumNode(node: GraphNode): DomainCurriculumNode {
    return {
        nodeType: "domain",
        id: node.id,
        name: getDomainName(node.id),
        position: node.position,
        hierarchyLevel: node.hierarchyLevel,
        timelinePhase: node.timelinePhase,
        isEntryPoint: node.isEntryPoint,
        sortOrder: node.sortOrder,
    };
}

/**
 * Convert GraphEdge to CurriculumEdge
 */
export function graphEdgeToCurriculumEdge(edge: GraphEdge): CurriculumEdge {
    return {
        from: edge.from,
        to: edge.to,
        type: edge.type,
        weight: edge.weight,
        label: edge.label,
        fromType: "domain",
        toType: "domain",
    };
}

/**
 * Create unified curriculum graph from existing graph data
 */
export function createUnifiedCurriculumGraph(): UnifiedCurriculumGraph {
    return {
        domainNodes: GRAPH_NODES.map(graphNodeToCurriculumNode),
        chapterNodes: [],
        sectionNodes: undefined,
        edges: GRAPH_EDGES.map(graphEdgeToCurriculumEdge),
        metadata: {
            version: "2.0.0",
            lastUpdated: new Date().toISOString(),
        },
    };
}

// ============================================================================
// GRAPH ACCESSORS
// ============================================================================

/**
 * Get all curriculum nodes of a specific type
 */
export function getCurriculumNodesByType<T extends CurriculumNode>(
    graph: UnifiedCurriculumGraph,
    nodeType: CurriculumNodeType
): T[] {
    switch (nodeType) {
        case "domain":
            return graph.domainNodes as T[];
        case "chapter":
            return graph.chapterNodes as T[];
        case "section":
            return (graph.sectionNodes ?? []) as T[];
    }
}

/**
 * Get a curriculum node by ID
 */
export function getCurriculumNode(
    graph: UnifiedCurriculumGraph,
    id: string
): CurriculumNode | undefined {
    return (
        graph.domainNodes.find((n) => n.id === id) ??
        graph.chapterNodes.find((n) => n.id === id) ??
        graph.sectionNodes?.find((n) => n.id === id)
    );
}

/**
 * Get edges for a specific node
 */
export function getCurriculumEdgesFor(
    graph: UnifiedCurriculumGraph,
    nodeId: string,
    direction: "incoming" | "outgoing" | "both" = "both"
): CurriculumEdge[] {
    return graph.edges.filter((edge) => {
        if (direction === "incoming") return edge.to === nodeId;
        if (direction === "outgoing") return edge.from === nodeId;
        return edge.from === nodeId || edge.to === nodeId;
    });
}

/**
 * Get prerequisites for a curriculum node
 */
export function getCurriculumPrerequisites(
    graph: UnifiedCurriculumGraph,
    nodeId: string
): CurriculumNode[] {
    const prereqEdges = graph.edges.filter(
        (edge) => edge.to === nodeId && edge.type === "prerequisite"
    );

    return prereqEdges
        .map((edge) => getCurriculumNode(graph, edge.from))
        .filter((node): node is CurriculumNode => node !== undefined);
}

/**
 * Check if all prerequisites are met for a node
 */
export function areCurriculumPrerequisitesMet(
    graph: UnifiedCurriculumGraph,
    nodeId: string,
    completedIds: Set<string>
): boolean {
    const prereqs = getCurriculumPrerequisites(graph, nodeId);
    return prereqs.every((prereq) => completedIds.has(prereq.id));
}

/**
 * Get suggested next nodes after completing a node
 */
export function getSuggestedNextNodes(
    graph: UnifiedCurriculumGraph,
    completedNodeId: string
): CurriculumNode[] {
    const nextEdges = graph.edges.filter(
        (edge) =>
            edge.from === completedNodeId &&
            (edge.type === "builds-upon" || edge.type === "enables")
    );

    return nextEdges
        .map((edge) => getCurriculumNode(graph, edge.to))
        .filter((node): node is CurriculumNode => node !== undefined);
}

/**
 * Get chapters for a specific domain
 */
export function getChaptersForDomain(
    graph: UnifiedCurriculumGraph,
    domainId: LearningDomainId
): ChapterCurriculumNode[] {
    return graph.chapterNodes.filter((node) => node.domainId === domainId);
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a curriculum node is a domain node
 */
export function isDomainNode(node: CurriculumNode): node is DomainCurriculumNode {
    return node.nodeType === "domain";
}

/**
 * Check if a curriculum node is a chapter node
 */
export function isChapterNode(node: CurriculumNode): node is ChapterCurriculumNode {
    return node.nodeType === "chapter";
}

/**
 * Check if a curriculum node is a section node
 */
export function isSectionNode(node: CurriculumNode): node is SectionCurriculumNode {
    return node.nodeType === "section";
}
