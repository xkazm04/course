/**
 * Curriculum Data Adapters
 *
 * Adapters that transform various data sources into the canonical
 * CurriculumGraph format. This abstraction layer allows the universe
 * visualization (and future visualizations) to work with any data source.
 */

import type {
    CurriculumGraph,
    CurriculumDomainNode,
    CurriculumTopicNode,
    CurriculumSkillNode,
    CurriculumConnection,
    CurriculumDataSource,
} from "./curriculumGraph";
import { createEmptyCurriculumGraph } from "./curriculumGraph";

// ============================================================================
// ADAPTER INTERFACE
// ============================================================================

/**
 * Interface for curriculum data adapters.
 * Each adapter transforms a specific data source into CurriculumGraph format.
 */
export interface CurriculumAdapter<TInput> {
    /** Unique identifier for this adapter */
    readonly id: string;
    /** Data source type */
    readonly source: CurriculumDataSource;
    /** Transform input data to CurriculumGraph */
    transform(input: TInput): CurriculumGraph;
}

// ============================================================================
// MOCK DATA ADAPTER
// ============================================================================

/**
 * Input types for mock data adapter
 */
interface MockGraphNode {
    id: string;
    position: { x: number; y: number };
    hierarchyLevel: number;
    timelinePhase: string;
    isEntryPoint: boolean;
    sortOrder: number;
    progressionLevel?: number;
    progressionBreadth?: number;
}

interface MockGraphEdge {
    from: string;
    to: string;
    type: string;
    weight: number;
    label?: string;
}

interface MockDomainInfo {
    name: string;
    description: string;
}

// Reserved for future use with chapter metadata
// interface MockChapterInfo {
//     name: string;
// }

interface MockSectionInfo {
    id: number;
    sectionId: string;
    title: string;
    duration: string;
    time: string;
    type: "video" | "lesson" | "interactive" | "exercise";
    completed: boolean;
    content: { description: string };
}

export interface MockDataInput {
    graphNodes: MockGraphNode[];
    graphEdges: MockGraphEdge[];
    domains: Record<string, MockDomainInfo>;
    /** Optional chapter names per domain */
    chapterNames?: Record<string, string[]>;
    /** Optional chapter counts per domain */
    chapterCounts?: Record<string, number>;
    /** Optional sections data */
    sections?: MockSectionInfo[];
}

/**
 * Adapter for hardcoded mock data (GRAPH_NODES, GRAPH_EDGES, etc.)
 */
export const mockDataAdapter: CurriculumAdapter<MockDataInput> = {
    id: "mock",
    source: "mock",

    transform(input: MockDataInput): CurriculumGraph {
        const graph = createEmptyCurriculumGraph("mock");

        // Default chapter counts and names
        const defaultChapterCounts: Record<string, number> = {
            frontend: 8,
            fullstack: 12,
            backend: 10,
            databases: 6,
            games: 7,
            mobile: 9,
        };

        const defaultChapterNames: Record<string, string[]> = {
            frontend: ["HTML Basics", "CSS Styling", "JavaScript Fundamentals", "React Basics", "State Management", "Hooks", "Routing", "Testing"],
            fullstack: ["Architecture", "APIs", "Authentication", "Databases", "Deployment", "DevOps", "Microservices", "Security", "Performance", "Monitoring", "CI/CD", "Cloud"],
            backend: ["Node.js", "Express", "REST APIs", "GraphQL", "Databases", "Caching", "Message Queues", "Logging", "Auth", "Testing"],
            databases: ["SQL Basics", "NoSQL", "Schema Design", "Indexing", "Optimization", "Replication"],
            games: ["Game Loops", "Physics", "Graphics", "Input", "Audio", "Networking", "AI"],
            mobile: ["React Native", "Navigation", "State", "Native Modules", "Animations", "Push Notifications", "App Store", "Testing", "Performance"],
        };

        const chapterCounts = input.chapterCounts || defaultChapterCounts;
        const chapterNames = input.chapterNames || defaultChapterNames;

        // Transform graph nodes to domain nodes
        graph.domains = input.graphNodes.map((node): CurriculumDomainNode => {
            const domainInfo = input.domains[node.id];
            return {
                id: node.id,
                nodeType: "domain",
                name: domainInfo?.name || node.id,
                description: domainInfo?.description,
                domainId: node.id,
                isEntryPoint: node.isEntryPoint,
                childCount: chapterCounts[node.id] || 5,
                hierarchyLevel: node.hierarchyLevel,
                source: "mock",
            };
        });

        // Generate topic nodes from chapter data
        graph.domains.forEach((domain) => {
            const count = chapterCounts[domain.domainId] || 5;
            const names = chapterNames[domain.domainId] || [];

            for (let i = 0; i < count; i++) {
                const topicNode: CurriculumTopicNode = {
                    id: `topic-${domain.domainId}-${i}`,
                    nodeType: "topic",
                    name: names[i] || `Chapter ${i + 1}`,
                    parentDomainId: domain.id,
                    chapterId: `ch-${domain.domainId}-${i}`,
                    childCount: 3 + Math.floor(Math.random() * 5),
                    estimatedHours: 2 + Math.floor(Math.random() * 4),
                    source: "mock",
                };
                graph.topics.push(topicNode);
            }
        });

        // Generate skill nodes from sections or mock data
        graph.topics.forEach((topic) => {
            const sectionCount = topic.childCount;
            const sectionTypes = ["video", "lesson", "interactive", "exercise"] as const;

            for (let i = 0; i < sectionCount; i++) {
                const skillNode: CurriculumSkillNode = {
                    id: `skill-${topic.id}-${i}`,
                    nodeType: "skill",
                    name: `Section ${i + 1}`,
                    parentTopicId: topic.id,
                    lessonId: `section-${topic.id}-${i}`,
                    contentType: sectionTypes[i % 4],
                    duration: `${5 + Math.floor(Math.random() * 15)} min`,
                    completed: Math.random() > 0.5,
                    source: "mock",
                };
                graph.skills.push(skillNode);
            }
        });

        // Transform edges to connections
        graph.connections = input.graphEdges.map((edge, index): CurriculumConnection => ({
            id: `connection-${index}`,
            fromId: edge.from,
            toId: edge.to,
            type: edge.type === "prerequisite" ? "prerequisite" :
                  edge.type === "builds-upon" ? "builds_upon" :
                  edge.type === "complements" ? "related" : "related",
            weight: edge.weight / 3, // Normalize to 0-1
            label: edge.label,
        }));

        // Update metadata
        graph.metadata.counts = {
            domains: graph.domains.length,
            topics: graph.topics.length,
            skills: graph.skills.length,
            connections: graph.connections.length,
        };

        return graph;
    },
};

// ============================================================================
// SUPABASE DATA ADAPTER
// ============================================================================

/**
 * Supabase map_nodes table structure
 */
export interface SupabaseMapNode {
    id: string;
    slug: string;
    name: string;
    parent_id: string | null;
    domain_id: string | null;
    depth: number;
    node_type: "domain" | "topic" | "skill" | "course" | "lesson" | "group";
    is_group_node: boolean;
    icon: string | null;
    color: string | null;
    description: string | null;
    estimated_hours: number | null;
    difficulty: string | null;
    total_children: number;
    sort_order: number;
}

/**
 * Supabase map_node_connections table structure
 */
export interface SupabaseMapConnection {
    id: string;
    from_node_id: string;
    to_node_id: string;
    connection_type: "parent_child" | "prerequisite" | "recommended" | "related" | "group_member";
    weight: number;
    label: string | null;
}

export interface SupabaseDataInput {
    nodes: SupabaseMapNode[];
    connections: SupabaseMapConnection[];
}

/**
 * Adapter for Supabase map_nodes data
 */
export const supabaseDataAdapter: CurriculumAdapter<SupabaseDataInput> = {
    id: "supabase",
    source: "supabase",

    transform(input: SupabaseDataInput): CurriculumGraph {
        const graph = createEmptyCurriculumGraph("supabase");

        // Separate nodes by type
        const domains = input.nodes.filter((n) => n.node_type === "domain");
        const topics = input.nodes.filter((n) => n.node_type === "topic");
        const skills = input.nodes.filter((n) =>
            n.node_type === "skill" || n.node_type === "course" || n.node_type === "lesson"
        );

        // Transform domains
        graph.domains = domains.map((node): CurriculumDomainNode => ({
            id: node.id,
            nodeType: "domain",
            name: node.name,
            description: node.description || undefined,
            domainId: node.domain_id || node.slug,
            isEntryPoint: node.depth === 0,
            childCount: node.total_children,
            color: node.color || undefined,
            hierarchyLevel: node.depth,
            source: "supabase",
        }));

        // Create domain lookup for parent resolution
        const domainByDbId = new Map(domains.map((d) => [d.id, d]));

        // Transform topics
        graph.topics = topics.map((node): CurriculumTopicNode => {
            // Find parent domain
            const parentDomain = node.parent_id ? domainByDbId.get(node.parent_id) : undefined;

            return {
                id: node.id,
                nodeType: "topic",
                name: node.name,
                description: node.description || undefined,
                parentDomainId: parentDomain?.id || node.parent_id || "",
                chapterId: node.slug,
                childCount: node.total_children,
                estimatedHours: node.estimated_hours || undefined,
                difficulty: mapDifficulty(node.difficulty),
                source: "supabase",
            };
        });

        // Create topic lookup for parent resolution
        const topicByDbId = new Map(topics.map((t) => [t.id, t]));

        // Transform skills
        graph.skills = skills.map((node): CurriculumSkillNode => {
            // Find parent topic
            const parentTopic = node.parent_id ? topicByDbId.get(node.parent_id) : undefined;

            return {
                id: node.id,
                nodeType: "skill",
                name: node.name,
                description: node.description || undefined,
                parentTopicId: parentTopic?.id || node.parent_id || "",
                lessonId: node.slug,
                contentType: "lesson", // Default, could be extended with more metadata
                duration: node.estimated_hours ? `${node.estimated_hours}h` : undefined,
                difficulty: mapDifficulty(node.difficulty),
                source: "supabase",
            };
        });

        // Transform connections (exclude parent_child as those are implicit)
        graph.connections = input.connections
            .filter((conn) => conn.connection_type !== "parent_child" && conn.connection_type !== "group_member")
            .map((conn): CurriculumConnection => ({
                id: conn.id,
                fromId: conn.from_node_id,
                toId: conn.to_node_id,
                type: mapConnectionType(conn.connection_type),
                weight: conn.weight / 10, // Normalize to 0-1
                label: conn.label || undefined,
            }));

        // Update metadata
        graph.metadata.counts = {
            domains: graph.domains.length,
            topics: graph.topics.length,
            skills: graph.skills.length,
            connections: graph.connections.length,
        };

        return graph;
    },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapDifficulty(
    difficulty: string | null
): "beginner" | "intermediate" | "advanced" | "expert" | undefined {
    if (!difficulty) return undefined;
    const normalized = difficulty.toLowerCase();
    if (normalized === "beginner" || normalized === "easy") return "beginner";
    if (normalized === "intermediate" || normalized === "medium") return "intermediate";
    if (normalized === "advanced" || normalized === "hard") return "advanced";
    if (normalized === "expert") return "expert";
    return undefined;
}

function mapConnectionType(
    type: "parent_child" | "prerequisite" | "recommended" | "related" | "group_member"
): CurriculumConnection["type"] {
    switch (type) {
        case "prerequisite":
            return "prerequisite";
        case "recommended":
            return "recommended";
        case "related":
            return "related";
        default:
            return "related";
    }
}

// ============================================================================
// ADAPTER REGISTRY
// ============================================================================

/**
 * Registry of all available adapters
 */
export const adapterRegistry = {
    mock: mockDataAdapter,
    supabase: supabaseDataAdapter,
} as const;

export type AdapterType = keyof typeof adapterRegistry;
