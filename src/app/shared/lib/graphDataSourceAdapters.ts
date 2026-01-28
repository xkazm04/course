/**
 * GraphDataSource Adapters
 *
 * This module provides concrete implementations of GraphDataSource
 * for the existing data sources in the codebase:
 *
 * 1. LearningPathGraphDataSource - Adapts learningPaths from mockData.ts
 *    Combined with spatial/relationship data from learningPathGraph.ts
 *
 * 2. CurriculumGraphDataSource - Adapts curriculumData from curriculumData.ts
 *    The 100+ node frontend curriculum for VariantD
 *
 * With these adapters, any variant can render any data source through
 * the unified GraphDataSource interface.
 *
 * UNIFIED PROGRESSION COORDINATE SYSTEM:
 * Both adapters now compute and set the `progressionLevel` field on all nodes,
 * providing a consistent way to understand "how far along the learning journey"
 * each topic is across all visualizations.
 */

import {
    BaseGraphDataSource,
    GraphNode,
    GraphEdge,
    GraphNodeFilter,
    GraphEdgeType,
    GraphNodeStatus,
    type ProgressionLevel,
} from "./graphDataSource";
import {
    toProgressionLevel,
    tierToProgression,
    hierarchyLevelToProgression,
    timelinePhaseToProgression,
    type ProgressionBreadth,
    peerCountToBreadth,
} from "./progressionCoordinate";
import { learningPaths, type LearningPath } from "./mockData";
import {
    GRAPH_NODES,
    GRAPH_EDGES,
    type GraphNode as LPGraphNode,
    type GraphEdge as LPGraphEdge,
} from "./learningPathGraph";
import { LEARNING_DOMAINS, type LearningDomainId } from "./learningDomains";

// ============================================================================
// LEARNING PATH DATA SOURCE
// ============================================================================

/**
 * Metadata specific to learning path nodes
 */
export interface LearningPathNodeMeta {
    /** Original LearningPath data */
    learningPath: LearningPath;

    /** Icon name for display */
    icon: string;

    /** Domain color key */
    color: string;

    /** Number of courses in this path */
    courses: number;

    /** Whether this is an entry point for new learners */
    isEntryPoint: boolean;

    /** Timeline phase */
    timelinePhase: "foundation" | "intermediate" | "advanced" | "specialization";

    /**
     * @deprecated Use node.progressionLevel instead
     * Hierarchy level (0-3)
     */
    hierarchyLevel: number;
}

/**
 * Map relationship type from LearningPathGraph to GraphEdgeType
 */
function mapLPRelationshipType(type: LPGraphEdge["type"]): GraphEdgeType {
    switch (type) {
        case "prerequisite":
            return "prerequisite";
        case "builds-upon":
            return "builds-upon";
        case "complements":
            return "complements";
        case "specializes":
            return "specializes";
        case "enables":
            return "enables";
        default:
            return "recommended";
    }
}

/**
 * GraphDataSource adapter for learning paths data.
 *
 * Combines:
 * - learningPaths from mockData.ts (path content)
 * - GRAPH_NODES from learningPathGraph.ts (spatial positions)
 * - GRAPH_EDGES from learningPathGraph.ts (relationships)
 */
export class LearningPathGraphDataSource extends BaseGraphDataSource<LearningPathNodeMeta> {
    private nodes: GraphNode<LearningPathNodeMeta>[];
    private edges: GraphEdge[];

    constructor() {
        super();
        this.nodes = this.buildNodes();
        this.edges = this.buildEdges();
    }

    private buildNodes(): GraphNode<LearningPathNodeMeta>[] {
        return learningPaths.map((lp) => {
            // Find corresponding graph node for spatial/hierarchy data
            const graphNode = GRAPH_NODES.find((n) => n.id === lp.id);
            const domain = LEARNING_DOMAINS[lp.id as LearningDomainId];

            // Default values if graph node not found
            const position = graphNode?.position ?? { x: 50, y: 50 };
            const hierarchyLevel = graphNode?.hierarchyLevel ?? 1;
            const timelinePhase = graphNode?.timelinePhase ?? "intermediate";
            const isEntryPoint = graphNode?.isEntryPoint ?? false;

            // Use progressionLevel from graph node if available, otherwise compute from hierarchy
            const progressionLevel: ProgressionLevel = graphNode?.progressionLevel
                ?? (timelinePhase === "specialization"
                    ? 4
                    : hierarchyLevelToProgression(hierarchyLevel as 0 | 1 | 2 | 3));

            // Compute progressionBreadth from graphNode or default based on progressionLevel
            const progressionBreadth: ProgressionBreadth = graphNode?.progressionBreadth
                ?? peerCountToBreadth(progressionLevel <= 1 ? 2 : progressionLevel <= 2 ? 3 : 4);

            return {
                id: lp.id,
                name: lp.name,
                description: lp.description,
                position: position,
                status: "available" as GraphNodeStatus, // Learning paths are always available
                tier: hierarchyLevel,
                progressionLevel,
                progressionBreadth,
                category: "learning-path",
                subcategory: domain?.id ?? "general",
                skills: lp.skills,
                estimatedHours: lp.hours,
                metadata: {
                    learningPath: lp,
                    icon: lp.icon,
                    color: lp.color,
                    courses: lp.courses,
                    isEntryPoint,
                    timelinePhase,
                    hierarchyLevel,
                },
            };
        });
    }

    private buildEdges(): GraphEdge[] {
        return GRAPH_EDGES.map((edge) => ({
            from: edge.from,
            to: edge.to,
            type: mapLPRelationshipType(edge.type),
            weight: edge.weight,
            label: edge.label,
        }));
    }

    getNodes(filter?: GraphNodeFilter): GraphNode<LearningPathNodeMeta>[] {
        return this.applyFilter(this.nodes, filter);
    }

    getEdges(): GraphEdge[] {
        return this.edges;
    }

    /**
     * Get a learning path by its domain ID
     */
    getLearningPath(id: LearningDomainId): LearningPath | undefined {
        return learningPaths.find((lp) => lp.id === id);
    }

    /**
     * Get nodes sorted by hierarchy (foundation first)
     */
    getNodesSortedByHierarchy(): GraphNode<LearningPathNodeMeta>[] {
        return [...this.nodes].sort((a, b) => {
            const levelDiff = a.tier - b.tier;
            if (levelDiff !== 0) return levelDiff;
            // Secondary sort by the graph node's sortOrder if available
            const aOrder = GRAPH_NODES.find((n) => n.id === a.id)?.sortOrder ?? 999;
            const bOrder = GRAPH_NODES.find((n) => n.id === b.id)?.sortOrder ?? 999;
            return aOrder - bOrder;
        });
    }

    /**
     * Get entry point nodes (recommended starting paths)
     */
    getEntryPoints(): GraphNode<LearningPathNodeMeta>[] {
        return this.nodes.filter((n) => n.metadata.isEntryPoint);
    }
}

// ============================================================================
// CURRICULUM DATA SOURCE
// ============================================================================

// Import curriculum types
import type {
    CurriculumNode as CurriculumNodeType,
    CurriculumConnection,
    CurriculumData,
    CurriculumCategory,
    NodeStatus,
    DifficultyLevel,
    CurriculumResource,
} from "@/app/features/overview/lib/curriculumTypes";
import { curriculumData, TOTAL_NODES } from "@/app/features/overview/lib/curriculumData";

/**
 * Metadata specific to curriculum nodes
 */
export interface CurriculumNodeMeta {
    /** Original curriculum node data */
    curriculumNode: CurriculumNodeType;

    /** Difficulty level */
    difficulty: DifficultyLevel;

    /** Resources for learning */
    resources: CurriculumResource[];

    /** Original category for filtering */
    curriculumCategory: CurriculumCategory;

    /** Node title (may differ from name) */
    title: string;
}

/**
 * Map curriculum connection type to GraphEdgeType
 */
function mapCurriculumConnectionType(type: CurriculumConnection["type"]): GraphEdgeType {
    switch (type) {
        case "required":
            return "required";
        case "recommended":
            return "recommended";
        case "optional":
            return "optional";
        default:
            return "recommended";
    }
}

/**
 * Map curriculum node status to GraphNodeStatus
 */
function mapCurriculumStatus(status: NodeStatus): GraphNodeStatus {
    return status;
}

/**
 * GraphDataSource adapter for curriculum data.
 *
 * Adapts curriculumData from curriculumData.ts - the 100+ node
 * frontend curriculum used by VariantD (Knowledge Map).
 */
export class CurriculumGraphDataSource extends BaseGraphDataSource<CurriculumNodeMeta> {
    private data: CurriculumData;
    private nodeCache: Map<string, GraphNode<CurriculumNodeMeta>> = new Map();

    constructor(data: CurriculumData = curriculumData) {
        super();
        this.data = data;
        this.buildNodeCache();
    }

    private buildNodeCache(): void {
        this.data.nodes.forEach((node) => {
            this.nodeCache.set(node.id, this.convertNode(node));
        });
    }

    private convertNode(node: CurriculumNodeType): GraphNode<CurriculumNodeMeta> {
        // Curriculum tier (0-4) maps directly to progressionLevel
        const progressionLevel = tierToProgression(node.tier);
        // Compute progressionBreadth based on tier (higher tier = more breadth/options)
        const progressionBreadth = peerCountToBreadth(node.tier <= 1 ? 2 : node.tier <= 2 ? 3 : 4);

        return {
            id: node.id,
            name: node.title,
            description: node.description,
            position: node.position,
            status: mapCurriculumStatus(node.status),
            tier: node.tier,
            progressionLevel,
            progressionBreadth,
            category: node.category,
            subcategory: node.subcategory,
            skills: node.skills,
            estimatedHours: node.estimatedHours,
            metadata: {
                curriculumNode: node,
                difficulty: node.difficulty,
                resources: node.resources,
                curriculumCategory: node.category,
                title: node.title,
            },
        };
    }

    getNodes(filter?: GraphNodeFilter): GraphNode<CurriculumNodeMeta>[] {
        const allNodes = Array.from(this.nodeCache.values());
        return this.applyFilter(allNodes, filter);
    }

    getEdges(): GraphEdge[] {
        return this.data.connections.map((conn) => ({
            from: conn.from,
            to: conn.to,
            type: mapCurriculumConnectionType(conn.type),
            weight: conn.type === "required" ? 3 : conn.type === "recommended" ? 2 : 1,
        }));
    }

    getNodeById(id: string): GraphNode<CurriculumNodeMeta> | undefined {
        return this.nodeCache.get(id);
    }

    /**
     * Get the original curriculum node by ID
     */
    getCurriculumNode(id: string): CurriculumNodeType | undefined {
        return this.data.nodes.find((n) => n.id === id);
    }

    /**
     * Get total node count
     */
    getTotalNodeCount(): number {
        return TOTAL_NODES;
    }

    /**
     * Get nodes by curriculum category
     */
    getNodesByCategory(category: CurriculumCategory): GraphNode<CurriculumNodeMeta>[] {
        return this.getNodes({ category });
    }

    /**
     * Get category metadata
     */
    getCategoryMeta() {
        return this.data.categories;
    }

    /**
     * Get prerequisite chain (all nodes needed before this one)
     */
    getPrerequisiteChain(nodeId: string): GraphNode<CurriculumNodeMeta>[] {
        const chain: GraphNode<CurriculumNodeMeta>[] = [];
        const visited = new Set<string>();

        const collectPrereqs = (id: string) => {
            if (visited.has(id)) return;
            visited.add(id);

            const prereqs = this.getPrerequisites(id);
            prereqs.forEach((prereq) => {
                collectPrereqs(prereq.id);
                chain.push(prereq);
            });
        };

        collectPrereqs(nodeId);
        return chain;
    }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a learning path data source instance
 */
export function createLearningPathDataSource(): LearningPathGraphDataSource {
    return new LearningPathGraphDataSource();
}

/**
 * Create a curriculum data source instance
 */
export function createCurriculumDataSource(
    data: CurriculumData = curriculumData
): CurriculumGraphDataSource {
    return new CurriculumGraphDataSource(data);
}

// ============================================================================
// WEAKMAP-BASED CACHING FOR STRUCTURAL SHARING
// ============================================================================

/**
 * WeakMap cache for CurriculumGraphDataSource instances keyed by data object.
 *
 * This provides true structural sharing - when the same data object is passed,
 * the same data source instance is returned. When the data object is garbage
 * collected, the cached data source is automatically cleaned up.
 *
 * Benefits:
 * - Eliminates redundant graph construction during component remounts
 * - Avoids iterating 123+ nodes to rebuild nodeCache Map on each mount
 * - Automatic cleanup via WeakMap semantics (no memory leaks)
 */
const curriculumDataSourceCache = new WeakMap<CurriculumData, CurriculumGraphDataSource>();

/**
 * WeakMap cache for LearningPathGraphDataSource instances.
 * Since learningPaths is a module-level constant, we use a simple key object.
 */
const learningPathCacheKey = { __brand: "learningPathCacheKey" } as const;
const learningPathDataSourceCache = new WeakMap<typeof learningPathCacheKey, LearningPathGraphDataSource>();

// ============================================================================
// SINGLETON INSTANCES (LEGACY - kept for backward compatibility)
// ============================================================================

// Lazy-initialized singleton instances for common use
let learningPathDataSourceInstance: LearningPathGraphDataSource | null = null;
let curriculumDataSourceInstance: CurriculumGraphDataSource | null = null;

/**
 * Get the shared learning path data source instance.
 * Uses WeakMap caching for structural sharing.
 */
export function getLearningPathDataSource(): LearningPathGraphDataSource {
    // Check WeakMap cache first
    const cached = learningPathDataSourceCache.get(learningPathCacheKey);
    if (cached) {
        return cached;
    }

    // Fall back to singleton pattern for initial creation
    if (!learningPathDataSourceInstance) {
        learningPathDataSourceInstance = createLearningPathDataSource();
    }

    // Store in WeakMap for consistency
    learningPathDataSourceCache.set(learningPathCacheKey, learningPathDataSourceInstance);
    return learningPathDataSourceInstance;
}

/**
 * Get the shared curriculum data source instance.
 * Uses WeakMap caching keyed by data object for structural sharing.
 *
 * @param data - Optional curriculum data. Defaults to the module-level curriculumData.
 *               When the same data object reference is passed, returns the cached instance.
 */
export function getCurriculumDataSource(data: CurriculumData = curriculumData): CurriculumGraphDataSource {
    // Check WeakMap cache for this specific data object
    const cached = curriculumDataSourceCache.get(data);
    if (cached) {
        return cached;
    }

    // Create new instance for this data object
    const instance = createCurriculumDataSource(data);

    // Cache by data object reference for structural sharing
    curriculumDataSourceCache.set(data, instance);

    // Also update module-level singleton if using default data
    if (data === curriculumData) {
        curriculumDataSourceInstance = instance;
    }

    return instance;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
    GraphNode,
    GraphEdge,
    GraphNodeFilter,
    GraphEdgeType,
    GraphNodeStatus,
    GraphStats,
    GraphDataSource,
} from "./graphDataSource";
