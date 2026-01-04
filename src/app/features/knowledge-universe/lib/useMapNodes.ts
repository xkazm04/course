/**
 * Map Nodes Data Hook
 *
 * Fetches map nodes from Supabase and transforms them into
 * UniverseData format for visualization.
 */

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
    PlanetNode,
    MoonNode,
    StarNode,
    UniverseNode,
    UniverseConnection,
    ZoomLevel,
} from "./types";
import type { UniverseData } from "./universeData";

// ============================================================================
// TYPES
// ============================================================================

interface MapNode {
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

interface MapConnection {
    id: string;
    from_node_id: string;
    to_node_id: string;
    connection_type: "parent_child" | "prerequisite" | "recommended" | "related" | "group_member";
    weight: number;
    label: string | null;
}

// ============================================================================
// COLORS
// ============================================================================

const DOMAIN_COLORS: Record<string, { base: string; glow: string }> = {
    frontend: { base: "#6366f1", glow: "rgba(99, 102, 241, 0.5)" },
    fullstack: { base: "#a855f7", glow: "rgba(168, 85, 247, 0.5)" },
    backend: { base: "#10b981", glow: "rgba(16, 185, 129, 0.5)" },
    databases: { base: "#06b6d4", glow: "rgba(6, 182, 212, 0.5)" },
    games: { base: "#f97316", glow: "rgba(249, 115, 22, 0.5)" },
    mobile: { base: "#ec4899", glow: "rgba(236, 72, 153, 0.5)" },
};

const SKILL_COLORS: Record<string, string> = {
    beginner: "#22c55e",
    intermediate: "#f59e0b",
    advanced: "#ef4444",
    expert: "#8b5cf6",
};

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

function transformToUniverseData(
    nodes: MapNode[],
    connections: MapConnection[],
    worldScale: number = 1000
): UniverseData {
    // Separate by depth/type
    const domains = nodes.filter((n) => n.node_type === "domain");
    const topics = nodes.filter((n) => n.node_type === "topic");
    const skills = nodes.filter((n) => n.node_type === "skill" || n.node_type === "course");
    const lessons = nodes.filter((n) => n.node_type === "lesson");

    // Create planet nodes from domains
    const planets: PlanetNode[] = domains.map((domain, index) => {
        // Arrange in a circle
        const angle = (index / Math.max(domains.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const orbitRadius = worldScale * 0.35;

        const colors = DOMAIN_COLORS[domain.domain_id || "frontend"] || DOMAIN_COLORS.frontend;

        return {
            id: `planet-${domain.slug}`,
            type: "planet",
            name: domain.name,
            domainId: (domain.domain_id || domain.slug) as any,
            x: Math.cos(angle) * orbitRadius,
            y: Math.sin(angle) * orbitRadius,
            radius: 50 + (domain.total_children * 2),
            color: domain.color || colors.base,
            glowColor: colors.glow,
            orbitalRings: Math.min(domain.total_children, 5),
            moons: [],
            visibleAtZoom: ["galaxy", "solar", "constellation"],
        };
    });

    // Create moon nodes from topics
    const planetMap = new Map(domains.map((d) => [d.id, planets.find((p) => p.id === `planet-${d.slug}`)]));
    const moons: MoonNode[] = [];

    topics.forEach((topic, index) => {
        const parentPlanet = planetMap.get(topic.parent_id || "");
        if (!parentPlanet) return;

        // Get siblings for positioning
        const siblings = topics.filter((t) => t.parent_id === topic.parent_id);
        const siblingIndex = siblings.findIndex((s) => s.id === topic.id);
        const angle = (siblingIndex / Math.max(siblings.length, 1)) * Math.PI * 2;
        const orbitRadius = 100 + (siblingIndex % 3) * 30;

        moons.push({
            id: `moon-${topic.slug}`,
            type: "moon",
            name: topic.name,
            parentPlanetId: parentPlanet.id,
            chapterId: topic.id,
            x: parentPlanet.x + Math.cos(angle) * orbitRadius,
            y: parentPlanet.y + Math.sin(angle) * orbitRadius,
            radius: 15 + Math.min(topic.total_children, 10) * 1.5,
            color: parentPlanet.color,
            glowColor: parentPlanet.glowColor,
            sectionCount: topic.total_children || 3,
            visibleAtZoom: ["solar", "constellation", "star"],
        });
    });

    // Update planets with moons
    moons.forEach((moon) => {
        const planet = planets.find((p) => p.id === moon.parentPlanetId);
        if (planet) {
            planet.moons.push(moon);
        }
    });

    // Create star nodes from skills
    const moonMap = new Map(topics.map((t) => [t.id, moons.find((m) => m.id === `moon-${t.slug}`)]));
    const stars: StarNode[] = [];

    skills.forEach((skill) => {
        const parentMoon = moonMap.get(skill.parent_id || "");
        if (!parentMoon) return;

        // Get siblings for positioning
        const siblings = skills.filter((s) => s.parent_id === skill.parent_id);
        const siblingIndex = siblings.findIndex((s) => s.id === skill.id);
        const angle = (siblingIndex / Math.max(siblings.length, 1)) * Math.PI * 2 + Math.random() * 0.2;
        const orbitRadius = 30 + (siblingIndex % 2) * 15;

        stars.push({
            id: `star-${skill.slug}`,
            type: "star",
            name: skill.name,
            parentMoonId: parentMoon.id,
            lessonId: skill.id,
            lessonType: "lesson",
            completed: false,
            duration: skill.estimated_hours ? `${skill.estimated_hours}h` : "1h",
            x: parentMoon.x + Math.cos(angle) * orbitRadius,
            y: parentMoon.y + Math.sin(angle) * orbitRadius,
            radius: 5 + Math.random() * 3,
            color: SKILL_COLORS[skill.difficulty || "beginner"] || "#ffffff",
            glowColor: `${SKILL_COLORS[skill.difficulty || "beginner"] || "#ffffff"}80`,
            visibleAtZoom: ["constellation", "star"],
        });
    });

    // Create universe connections from prerequisites
    const nodeIdMap = new Map<string, string>();
    domains.forEach((d) => nodeIdMap.set(d.id, `planet-${d.slug}`));
    topics.forEach((t) => nodeIdMap.set(t.id, `moon-${t.slug}`));
    skills.forEach((s) => nodeIdMap.set(s.id, `star-${s.slug}`));

    const universeConnections: UniverseConnection[] = connections
        .filter((c) => c.connection_type === "prerequisite" || c.connection_type === "recommended")
        .map((conn, index) => {
            const fromId = nodeIdMap.get(conn.from_node_id);
            const toId = nodeIdMap.get(conn.to_node_id);

            if (!fromId || !toId) return null;

            const fromNode = [...planets, ...moons, ...stars].find((n) => n.id === fromId);

            return {
                id: `connection-${index}`,
                fromId,
                toId,
                type: conn.connection_type === "prerequisite" ? "prerequisite" as const : "builds-upon" as const,
                strength: conn.weight / 10,
                color: fromNode?.color || "#ffffff",
            };
        })
        .filter(Boolean) as UniverseConnection[];

    const allNodes: UniverseNode[] = [...planets, ...moons, ...stars];

    return {
        planets,
        moons,
        stars,
        connections: universeConnections,
        allNodes,
        nodeCount: {
            planets: planets.length,
            moons: moons.length,
            stars: stars.length,
            total: allNodes.length,
        },
    };
}

// ============================================================================
// HOOK
// ============================================================================

export interface UseMapNodesReturn {
    data: UniverseData | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useMapNodes(worldScale: number = 1000): UseMapNodesReturn {
    const [nodes, setNodes] = useState<MapNode[]>([]);
    const [connections, setConnections] = useState<MapConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            // Fetch nodes
            const { data: nodesData, error: nodesError } = await supabase
                .from("map_nodes")
                .select("*")
                .order("depth", { ascending: true })
                .order("sort_order", { ascending: true });

            if (nodesError) throw nodesError;

            // Fetch connections
            const { data: connectionsData, error: connectionsError } = await supabase
                .from("map_node_connections")
                .select("*");

            if (connectionsError) throw connectionsError;

            setNodes(nodesData || []);
            setConnections(connectionsData || []);
        } catch (err) {
            console.error("Error fetching map nodes:", err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const data = useMemo(() => {
        if (nodes.length === 0) return null;
        return transformToUniverseData(nodes, connections, worldScale);
    }, [nodes, connections, worldScale]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchData,
    };
}
