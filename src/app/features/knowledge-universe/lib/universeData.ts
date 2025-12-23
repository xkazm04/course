/**
 * Universe Data Generator
 *
 * Generates the complete knowledge universe from the learning graph data.
 * Transforms the curriculum structure into a spatial visualization with
 * planets (domains), moons (chapters), and stars (lessons).
 */

import {
    LEARNING_DOMAINS,
    type LearningDomainId,
    HEX_COLORS,
} from "@/app/shared/lib/learningDomains";
import {
    GRAPH_NODES,
    GRAPH_EDGES,
    type GraphNode,
} from "@/app/shared/lib/learningPathGraph";
import { CHAPTER_SECTIONS, type ChapterSection } from "@/app/features/chapter/lib/chapterData";
import type {
    PlanetNode,
    MoonNode,
    StarNode,
    UniverseNode,
    UniverseConnection,
    ZoomLevel,
} from "./types";

// ============================================================================
// COLOR UTILITIES
// ============================================================================

const DOMAIN_COLORS: Record<LearningDomainId, { base: string; glow: string }> = {
    frontend: { base: "#6366f1", glow: "rgba(99, 102, 241, 0.5)" },
    fullstack: { base: "#a855f7", glow: "rgba(168, 85, 247, 0.5)" },
    backend: { base: "#10b981", glow: "rgba(16, 185, 129, 0.5)" },
    databases: { base: "#06b6d4", glow: "rgba(6, 182, 212, 0.5)" },
    games: { base: "#f97316", glow: "rgba(249, 115, 22, 0.5)" },
    mobile: { base: "#ec4899", glow: "rgba(236, 72, 153, 0.5)" },
};

const SECTION_TYPE_COLORS: Record<string, string> = {
    video: "#3b82f6",
    lesson: "#8b5cf6",
    interactive: "#06b6d4",
    exercise: "#f59e0b",
};

// ============================================================================
// UNIVERSE GENERATION
// ============================================================================

/**
 * Generate a planet node from a graph node
 */
function generatePlanet(
    graphNode: GraphNode,
    worldScale: number = 1000
): PlanetNode {
    const domain = LEARNING_DOMAINS[graphNode.id];
    const colors = DOMAIN_COLORS[graphNode.id];

    // Scale positions from percentage to world coordinates
    const x = (graphNode.position.x / 100) * worldScale - worldScale / 2;
    const y = (graphNode.position.y / 100) * worldScale - worldScale / 2;

    // Larger planets for entry points
    const baseRadius = graphNode.isEntryPoint ? 60 : 45;

    return {
        id: `planet-${graphNode.id}`,
        type: "planet",
        name: domain.name,
        domainId: graphNode.id,
        x,
        y,
        radius: baseRadius,
        color: colors.base,
        glowColor: colors.glow,
        orbitalRings: graphNode.hierarchyLevel + 1,
        moons: [],
        visibleAtZoom: ["galaxy", "solar", "constellation"],
    };
}

/**
 * Generate moon nodes (chapters) for a planet
 */
function generateMoons(planet: PlanetNode): MoonNode[] {
    // Mock chapter data per domain - in real app, this would come from API
    const chapterCounts: Record<LearningDomainId, number> = {
        frontend: 8,
        fullstack: 12,
        backend: 10,
        databases: 6,
        games: 7,
        mobile: 9,
    };

    const chapterNames: Record<LearningDomainId, string[]> = {
        frontend: ["HTML Basics", "CSS Styling", "JavaScript Fundamentals", "React Basics", "State Management", "Hooks", "Routing", "Testing"],
        fullstack: ["Architecture", "APIs", "Authentication", "Databases", "Deployment", "DevOps", "Microservices", "Security", "Performance", "Monitoring", "CI/CD", "Cloud"],
        backend: ["Node.js", "Express", "REST APIs", "GraphQL", "Databases", "Caching", "Message Queues", "Logging", "Auth", "Testing"],
        databases: ["SQL Basics", "NoSQL", "Schema Design", "Indexing", "Optimization", "Replication"],
        games: ["Game Loops", "Physics", "Graphics", "Input", "Audio", "Networking", "AI"],
        mobile: ["React Native", "Navigation", "State", "Native Modules", "Animations", "Push Notifications", "App Store", "Testing", "Performance"],
    };

    const count = chapterCounts[planet.domainId] || 5;
    const names = chapterNames[planet.domainId] || [];
    const moons: MoonNode[] = [];

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const orbitRadius = 120 + (i % 3) * 40;

        moons.push({
            id: `moon-${planet.domainId}-${i}`,
            type: "moon",
            name: names[i] || `Chapter ${i + 1}`,
            parentPlanetId: planet.id,
            chapterId: `ch-${planet.domainId}-${i}`,
            x: planet.x + Math.cos(angle) * orbitRadius,
            y: planet.y + Math.sin(angle) * orbitRadius,
            radius: 15 + Math.random() * 8,
            color: planet.color,
            glowColor: planet.glowColor,
            sectionCount: 3 + Math.floor(Math.random() * 5),
            visibleAtZoom: ["solar", "constellation", "star"],
        });
    }

    return moons;
}

/**
 * Generate star nodes (lessons) for a moon
 */
function generateStars(moon: MoonNode, sections: ChapterSection[]): StarNode[] {
    const stars: StarNode[] = [];

    // Use actual section data or generate mock if not enough
    const sectionData = sections.length >= moon.sectionCount
        ? sections.slice(0, moon.sectionCount)
        : Array.from({ length: moon.sectionCount }, (_, i) => ({
            id: i,
            sectionId: `section-${i}`,
            title: `Section ${i + 1}`,
            duration: `${5 + Math.floor(Math.random() * 15)} min`,
            time: "0:00",
            type: (["video", "lesson", "interactive", "exercise"] as const)[i % 4],
            completed: Math.random() > 0.5,
            content: { description: "" },
        }));

    sectionData.forEach((section, i) => {
        const angle = (i / sectionData.length) * Math.PI * 2 + Math.random() * 0.3;
        const orbitRadius = 35 + (i % 2) * 15;

        stars.push({
            id: `star-${moon.id}-${i}`,
            type: "star",
            name: section.title,
            parentMoonId: moon.id,
            lessonId: section.sectionId,
            lessonType: section.type,
            x: moon.x + Math.cos(angle) * orbitRadius,
            y: moon.y + Math.sin(angle) * orbitRadius,
            radius: 4 + Math.random() * 3,
            color: SECTION_TYPE_COLORS[section.type] || "#ffffff",
            glowColor: `${SECTION_TYPE_COLORS[section.type] || "#ffffff"}80`,
            completed: section.completed,
            duration: section.duration,
            visibleAtZoom: ["constellation", "star"],
        });
    });

    return stars;
}

/**
 * Generate connections from graph edges
 */
function generateConnections(planets: PlanetNode[]): UniverseConnection[] {
    const connections: UniverseConnection[] = [];
    const planetMap = new Map(planets.map((p) => [p.domainId, p]));

    GRAPH_EDGES.forEach((edge, i) => {
        const fromPlanet = planetMap.get(edge.from);
        const toPlanet = planetMap.get(edge.to);

        if (fromPlanet && toPlanet) {
            connections.push({
                id: `connection-${i}`,
                fromId: fromPlanet.id,
                toId: toPlanet.id,
                type: edge.type === "prerequisite"
                    ? "prerequisite"
                    : edge.type === "builds-upon"
                        ? "builds-upon"
                        : "complements",
                strength: edge.weight / 3,
                color: fromPlanet.color,
            });
        }
    });

    return connections;
}

// ============================================================================
// UNIVERSE DATA INTERFACE
// ============================================================================

export interface UniverseData {
    planets: PlanetNode[];
    moons: MoonNode[];
    stars: StarNode[];
    connections: UniverseConnection[];
    allNodes: UniverseNode[];
    nodeCount: {
        planets: number;
        moons: number;
        stars: number;
        total: number;
    };
}

/**
 * Generate the complete universe data structure
 */
export function generateUniverseData(worldScale: number = 1000): UniverseData {
    // Generate planets from graph nodes
    const planets = GRAPH_NODES.map((node) => generatePlanet(node, worldScale));

    // Generate moons for each planet
    const allMoons: MoonNode[] = [];
    planets.forEach((planet) => {
        const moons = generateMoons(planet);
        planet.moons = moons;
        allMoons.push(...moons);
    });

    // Generate stars for each moon
    const allStars: StarNode[] = [];
    allMoons.forEach((moon) => {
        const stars = generateStars(moon, CHAPTER_SECTIONS);
        allStars.push(...stars);
    });

    // Generate connections
    const connections = generateConnections(planets);

    // Combine all nodes
    const allNodes: UniverseNode[] = [...planets, ...allMoons, ...allStars];

    return {
        planets,
        moons: allMoons,
        stars: allStars,
        connections,
        allNodes,
        nodeCount: {
            planets: planets.length,
            moons: allMoons.length,
            stars: allStars.length,
            total: allNodes.length,
        },
    };
}

/**
 * Get visible nodes for a given zoom level
 */
export function getVisibleNodesForZoom(
    data: UniverseData,
    zoomLevel: ZoomLevel
): UniverseNode[] {
    return data.allNodes.filter((node) => node.visibleAtZoom.includes(zoomLevel));
}

/**
 * Get nodes within viewport bounds
 */
export function getNodesInViewport(
    nodes: UniverseNode[],
    viewportX: number,
    viewportY: number,
    viewportWidth: number,
    viewportHeight: number,
    scale: number,
    margin: number = 100
): UniverseNode[] {
    const scaledMargin = margin / scale;

    return nodes.filter((node) => {
        const nodeRadius = node.radius / scale;
        return (
            node.x + nodeRadius >= viewportX - scaledMargin &&
            node.x - nodeRadius <= viewportX + viewportWidth / scale + scaledMargin &&
            node.y + nodeRadius >= viewportY - scaledMargin &&
            node.y - nodeRadius <= viewportY + viewportHeight / scale + scaledMargin
        );
    });
}

/**
 * Find node at position (for hit testing)
 */
export function findNodeAtPosition(
    nodes: UniverseNode[],
    x: number,
    y: number,
    scale: number
): UniverseNode | null {
    // Search in reverse order (top-most first)
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const dx = x - node.x;
        const dy = y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Scale-aware hit testing
        const hitRadius = node.radius + 10 / scale;
        if (distance <= hitRadius) {
            return node;
        }
    }
    return null;
}
