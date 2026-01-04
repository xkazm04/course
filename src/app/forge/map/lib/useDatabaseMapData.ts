// ============================================================================
// Database-Driven Map Data Hook
// Fetches map nodes from the database and transforms them for HexGrid
//
// HIERARCHY MAPPING:
// The Oracle/Database uses a 5-level hierarchy that maps to KnowledgeMap types:
//
// | Depth | DB node_type | KM Level  | DB Entity Created | Content      |
// |-------|--------------|-----------|-------------------|--------------|
// | 0     | domain       | domain    | map_nodes         | -            |
// | 1     | topic        | course    | map_nodes         | -            |
// | 2     | skill        | chapter   | map_nodes         | -            |
// | 3     | course       | section   | map_nodes+courses | Course entry |
// | 4     | lesson       | concept   | map_nodes+chapters| AI Content ✓ |
//
// Example hierarchy:
//   Frontend Development (domain, depth 0)
//   └── React (topic, depth 1)
//       └── Components (skill, depth 2)
//           └── React Hooks Course (course, depth 3) → creates courses entry
//               └── useState Hook Lesson (lesson, depth 4) → creates chapter + AI content
//
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import type { MapNode } from "@/app/features/knowledge-map/lib/types";
import type { KnowledgeMapData } from "@/app/features/knowledge-map/lib/types";
import { generateKnowledgeMapData } from "@/app/features/knowledge-map/lib/mapData";

// ============================================================================
// Types
// ============================================================================

interface DatabaseMapNode {
    id: string;
    slug: string;
    name: string;
    description: string;
    level: string;
    nodeType: string;
    status: string;
    progress: number;
    parentId: string | null;
    childIds: string[];
    domainId: string;
    color: string;
    depth: number;
    sortOrder: number;
    estimatedHours: number | null;
    difficulty: string | null;
    courseId: string | null;
    isGroupNode: boolean;
    isAiGenerated: boolean;
    icon: string | null;
    totalChildren: number;
}

interface MapNodesResponse {
    nodes: Record<string, DatabaseMapNode>;
    connections: Array<{
        id: string;
        fromId: string;
        toId: string;
        type: string;
        label?: string;
    }>;
    rootNodeIds: string[];
    totalCount: number;
    domainId: string | null;
}

interface UseDatabaseMapDataOptions {
    domain?: string | null;
    includeProgress?: boolean;
    fallbackToMock?: boolean;
}

interface UseDatabaseMapDataResult {
    mapData: KnowledgeMapData;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
    hasDatabaseNodes: boolean;
    nodeCount: number;
}

// ============================================================================
// Transform database node to MapNode format
// ============================================================================

function transformToMapNode(dbNode: DatabaseMapNode): MapNode {
    // =========================================================================
    // Map Oracle/DB node_type to KnowledgeMap level
    // Oracle hierarchy: domain(0) → topic(1) → skill(2) → course(3) → lesson(4)
    // KM hierarchy:     domain(0) → course(1) → chapter(2) → section(3) → concept(4)
    // =========================================================================
    const nodeTypeToLevel: Record<string, string> = {
        domain: "domain",   // depth 0
        topic: "course",    // depth 1
        skill: "chapter",   // depth 2
        course: "section",  // depth 3 - creates courses table entry
        lesson: "concept",  // depth 4 - creates chapters table entry (content generated here)
    };

    // Map database status to frontend status
    const statusMap: Record<string, string> = {
        locked: "locked",
        available: "available",
        in_progress: "in_progress",
        completed: "completed",
    };

    // Use nodeType (Oracle naming) for mapping, fall back to depth-based inference
    const nodeType = dbNode.nodeType || inferNodeType(dbNode.depth);
    const level = nodeTypeToLevel[nodeType] || "concept";

    const baseNode = {
        id: dbNode.id,
        name: dbNode.name,
        description: dbNode.description || "",
        level: level as any,
        status: (statusMap[dbNode.status] || "available") as any,
        progress: dbNode.progress || 0,
        parentId: dbNode.parentId,
        childIds: dbNode.childIds || [],
        color: dbNode.domainId as any,
        domainId: dbNode.domainId as any,
        estimatedHours: dbNode.estimatedHours || undefined,
    };

    // Add level-specific properties based on Oracle node_type
    if (nodeType === "domain") {
        return {
            ...baseNode,
            level: "domain",
            courseCount: dbNode.totalChildren,
            totalHours: dbNode.estimatedHours || 0,
        } as any;
    }

    if (nodeType === "topic") {
        // Maps to KM "course" level
        return {
            ...baseNode,
            level: "course",
            difficulty: (dbNode.difficulty || "beginner") as any,
            chapterCount: dbNode.totalChildren,
            skills: [],
        } as any;
    }

    if (nodeType === "skill") {
        // Maps to KM "chapter" level
        return {
            ...baseNode,
            level: "chapter",
            courseId: dbNode.courseId || dbNode.parentId || "",
            sectionCount: dbNode.totalChildren,
            xpReward: 50,
            durationMinutes: (dbNode.estimatedHours || 1) * 60,
        } as any;
    }

    if (nodeType === "course") {
        // Maps to KM "section" level - creates courses table entry
        return {
            ...baseNode,
            level: "section",
            courseId: dbNode.courseId || "",
            chapterId: dbNode.parentId || "",
            sectionType: "lesson" as any,
            duration: `${dbNode.estimatedHours || 1}h`,
        } as any;
    }

    // Default: lesson → concept (depth 4, content generation target)
    return {
        ...baseNode,
        level: "concept",
        sectionId: dbNode.parentId || "",
        conceptType: "text" as any,
        content: dbNode.description,
    } as any;
}

// Infer node_type from depth if not provided
function inferNodeType(depth: number): string {
    const depthToType: Record<number, string> = {
        0: "domain",
        1: "topic",
        2: "skill",
        3: "course",
        4: "lesson",
    };
    return depthToType[depth] || "lesson";
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDatabaseMapData(
    options: UseDatabaseMapDataOptions = {}
): UseDatabaseMapDataResult {
    const { domain, includeProgress = true, fallbackToMock = true } = options;

    const [dbNodes, setDbNodes] = useState<Record<string, DatabaseMapNode>>({});
    const [connections, setConnections] = useState<any[]>([]);
    const [rootNodeIds, setRootNodeIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasDatabaseNodes, setHasDatabaseNodes] = useState(false);

    // Fetch data from API
    const fetchMapData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (domain) params.set("domain", domain);
            if (includeProgress) params.set("progress", "true");

            const response = await fetch(`/api/map-nodes?${params.toString()}`);

            if (!response.ok) {
                throw new Error("Failed to fetch map nodes");
            }

            const data: MapNodesResponse = await response.json();

            setDbNodes(data.nodes);
            setConnections(data.connections);
            setRootNodeIds(data.rootNodeIds);
            setHasDatabaseNodes(data.totalCount > 0);
        } catch (err) {
            console.error("Error fetching map data:", err);
            setError(err instanceof Error ? err.message : "Unknown error");
            setHasDatabaseNodes(false);
        } finally {
            setIsLoading(false);
        }
    }, [domain, includeProgress]);

    // Initial fetch
    useEffect(() => {
        fetchMapData();
    }, [fetchMapData]);

    // Transform to KnowledgeMapData format
    const mapData = useMemo((): KnowledgeMapData => {
        // If no database nodes and fallback enabled, use mock data
        if (!hasDatabaseNodes && fallbackToMock && !isLoading) {
            return generateKnowledgeMapData();
        }

        // Transform database nodes to MapNode format
        const nodes = new Map<string, MapNode>();

        for (const [id, dbNode] of Object.entries(dbNodes)) {
            nodes.set(id, transformToMapNode(dbNode));
        }

        // Transform connections
        const mapConnections = connections.map((c) => ({
            id: c.id,
            fromId: c.fromId,
            toId: c.toId,
            type: c.type as any,
            label: c.label,
        }));

        return {
            nodes,
            connections: mapConnections,
            rootNodeIds,
        };
    }, [dbNodes, connections, rootNodeIds, hasDatabaseNodes, fallbackToMock, isLoading]);

    return {
        mapData,
        isLoading,
        error,
        refresh: fetchMapData,
        hasDatabaseNodes,
        nodeCount: Object.keys(dbNodes).length,
    };
}

// ============================================================================
// Merge database nodes with dynamic path nodes
// ============================================================================

export function mergeWithDynamicNodes(
    baseMapData: KnowledgeMapData,
    dynamicNodes: Record<string, any>
): KnowledgeMapData {
    const mergedNodes = new Map(baseMapData.nodes);
    const mergedRootIds = [...baseMapData.rootNodeIds];

    for (const [id, node] of Object.entries(dynamicNodes)) {
        // Transform dynamic node to MapNode format
        const mapNode: MapNode = {
            id: node.id,
            name: node.name,
            description: node.description || "",
            level: mapDepthToLevel(node.depth),
            status: mapGenerationStatus(node.status),
            progress: node.progress || 0,
            parentId: node.parentId,
            childIds: [],
            color: "frontend" as any, // Use domain color
            domainId: "frontend" as any,
            estimatedHours: node.estimatedHours,
        } as any;

        mergedNodes.set(id, mapNode);

        // Add to parent's childIds if parent exists
        if (node.parentId && mergedNodes.has(node.parentId)) {
            const parent = mergedNodes.get(node.parentId)!;
            if (!parent.childIds.includes(id)) {
                parent.childIds.push(id);
            }
        }

        // Add to root if no parent
        if (!node.parentId && !mergedRootIds.includes(id)) {
            mergedRootIds.push(id);
        }
    }

    return {
        nodes: mergedNodes,
        connections: baseMapData.connections,
        rootNodeIds: mergedRootIds,
    };
}

function mapDepthToLevel(depth: number): any {
    const levels = ["domain", "course", "chapter", "section", "concept"];
    return levels[Math.min(depth, levels.length - 1)];
}

function mapGenerationStatus(status: string): any {
    if (status === "ready" || status === "completed") return "available";
    if (status === "generating" || status === "pending") return "in_progress";
    if (status === "failed") return "locked";
    return "available";
}
