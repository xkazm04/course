/**
 * Universe Layout Strategies
 *
 * Configurable strategies for transforming CurriculumGraph into UniverseData.
 * The layout logic (orbital positioning, color mapping, radius calculations)
 * lives here as composable strategies.
 */

import type {
    CurriculumGraph,
    CurriculumDomainNode,
    CurriculumTopicNode,
    CurriculumSkillNode,
} from "./curriculumGraph";
import type {
    PlanetNode,
    MoonNode,
    StarNode,
    UniverseNode,
    UniverseConnection,
    ZoomLevel,
} from "./types";
import type { LearningDomainId } from "@/app/shared/lib/learningDomains";
import type { UniverseData } from "./universeData";

// ============================================================================
// LAYOUT CONFIGURATION
// ============================================================================

/**
 * Configuration for universe layout generation
 */
export interface UniverseLayoutConfig {
    /** World coordinate scale (default: 1000) */
    worldScale: number;
    /** Base planet radius for entry points */
    basePlanetRadiusEntryPoint: number;
    /** Base planet radius for non-entry points */
    basePlanetRadius: number;
    /** Scale factor for planet radius based on child count */
    planetChildScale: number;
    /** Moon orbit radius from planet center */
    moonOrbitBaseRadius: number;
    /** Moon orbit radius variation */
    moonOrbitRadiusVariation: number;
    /** Base moon radius */
    baseMoonRadius: number;
    /** Moon radius variation based on child count */
    moonChildScale: number;
    /** Star orbit radius from moon center */
    starOrbitBaseRadius: number;
    /** Star orbit radius variation */
    starOrbitRadiusVariation: number;
    /** Base star radius */
    baseStarRadius: number;
    /** Star radius random variation */
    starRadiusVariation: number;
}

/**
 * Default layout configuration
 */
export const DEFAULT_LAYOUT_CONFIG: UniverseLayoutConfig = {
    worldScale: 1000,
    basePlanetRadiusEntryPoint: 60,
    basePlanetRadius: 45,
    planetChildScale: 2,
    moonOrbitBaseRadius: 120,
    moonOrbitRadiusVariation: 40,
    baseMoonRadius: 15,
    moonChildScale: 1.5,
    starOrbitBaseRadius: 35,
    starOrbitRadiusVariation: 15,
    baseStarRadius: 4,
    starRadiusVariation: 3,
};

// ============================================================================
// COLOR STRATEGIES
// ============================================================================

/**
 * Default domain color mapping
 */
export const DOMAIN_COLORS: Record<string, { base: string; glow: string }> = {
    frontend: { base: "#6366f1", glow: "rgba(99, 102, 241, 0.5)" },
    fullstack: { base: "#a855f7", glow: "rgba(168, 85, 247, 0.5)" },
    backend: { base: "#10b981", glow: "rgba(16, 185, 129, 0.5)" },
    databases: { base: "#06b6d4", glow: "rgba(6, 182, 212, 0.5)" },
    games: { base: "#f97316", glow: "rgba(249, 115, 22, 0.5)" },
    mobile: { base: "#ec4899", glow: "rgba(236, 72, 153, 0.5)" },
    // Default fallback
    default: { base: "#6b7280", glow: "rgba(107, 114, 128, 0.5)" },
};

/**
 * Skill/lesson type color mapping
 */
export const CONTENT_TYPE_COLORS: Record<string, string> = {
    video: "#3b82f6",
    lesson: "#8b5cf6",
    interactive: "#06b6d4",
    exercise: "#f59e0b",
};

/**
 * Difficulty-based color mapping
 */
export const DIFFICULTY_COLORS: Record<string, string> = {
    beginner: "#22c55e",
    intermediate: "#f59e0b",
    advanced: "#ef4444",
    expert: "#8b5cf6",
};

/**
 * Get colors for a domain
 */
export function getDomainColors(domainId: string, customColor?: string): { base: string; glow: string } {
    if (customColor) {
        return {
            base: customColor,
            glow: `${customColor}80`, // 50% opacity
        };
    }
    return DOMAIN_COLORS[domainId] || DOMAIN_COLORS.default;
}

/**
 * Get color for a skill based on content type or difficulty
 */
export function getSkillColor(skill: CurriculumSkillNode): { base: string; glow: string } {
    // Prefer difficulty-based coloring if available
    if (skill.difficulty && DIFFICULTY_COLORS[skill.difficulty]) {
        const base = DIFFICULTY_COLORS[skill.difficulty];
        return { base, glow: `${base}80` };
    }
    // Fall back to content type
    const base = CONTENT_TYPE_COLORS[skill.contentType] || "#ffffff";
    return { base, glow: `${base}80` };
}

// ============================================================================
// POSITION STRATEGIES
// ============================================================================

/**
 * Positioning strategy interface
 */
export interface PositioningStrategy {
    /** Position domains (planets) in world space */
    positionDomains(domains: CurriculumDomainNode[], config: UniverseLayoutConfig): Map<string, { x: number; y: number }>;
    /** Position topics (moons) around their parent domain */
    positionTopics(topics: CurriculumTopicNode[], domainPositions: Map<string, { x: number; y: number }>, config: UniverseLayoutConfig): Map<string, { x: number; y: number }>;
    /** Position skills (stars) around their parent topic */
    positionSkills(skills: CurriculumSkillNode[], topicPositions: Map<string, { x: number; y: number }>, config: UniverseLayoutConfig): Map<string, { x: number; y: number }>;
}

/**
 * Circular/orbital positioning strategy (default)
 */
export const orbitalPositioningStrategy: PositioningStrategy = {
    positionDomains(domains, config): Map<string, { x: number; y: number }> {
        const positions = new Map<string, { x: number; y: number }>();
        const count = domains.length;
        const orbitRadius = config.worldScale * 0.35;

        domains.forEach((domain, index) => {
            const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
            positions.set(domain.id, {
                x: Math.cos(angle) * orbitRadius,
                y: Math.sin(angle) * orbitRadius,
            });
        });

        return positions;
    },

    positionTopics(topics, domainPositions, config): Map<string, { x: number; y: number }> {
        const positions = new Map<string, { x: number; y: number }>();

        // Group topics by parent domain
        const topicsByDomain = new Map<string, CurriculumTopicNode[]>();
        topics.forEach((topic) => {
            const existing = topicsByDomain.get(topic.parentDomainId) || [];
            existing.push(topic);
            topicsByDomain.set(topic.parentDomainId, existing);
        });

        // Position each group
        topicsByDomain.forEach((domainTopics, domainId) => {
            const domainPos = domainPositions.get(domainId);
            if (!domainPos) return;

            const count = domainTopics.length;
            domainTopics.forEach((topic, index) => {
                const angle = (index / Math.max(count, 1)) * Math.PI * 2;
                const orbitRadius = config.moonOrbitBaseRadius + (index % 3) * config.moonOrbitRadiusVariation;

                positions.set(topic.id, {
                    x: domainPos.x + Math.cos(angle) * orbitRadius,
                    y: domainPos.y + Math.sin(angle) * orbitRadius,
                });
            });
        });

        return positions;
    },

    positionSkills(skills, topicPositions, config): Map<string, { x: number; y: number }> {
        const positions = new Map<string, { x: number; y: number }>();

        // Group skills by parent topic
        const skillsByTopic = new Map<string, CurriculumSkillNode[]>();
        skills.forEach((skill) => {
            const existing = skillsByTopic.get(skill.parentTopicId) || [];
            existing.push(skill);
            skillsByTopic.set(skill.parentTopicId, existing);
        });

        // Position each group
        skillsByTopic.forEach((topicSkills, topicId) => {
            const topicPos = topicPositions.get(topicId);
            if (!topicPos) return;

            const count = topicSkills.length;
            topicSkills.forEach((skill, index) => {
                // Add some randomness for visual appeal
                const angleOffset = (Math.random() - 0.5) * 0.3;
                const angle = (index / Math.max(count, 1)) * Math.PI * 2 + angleOffset;
                const orbitRadius = config.starOrbitBaseRadius + (index % 2) * config.starOrbitRadiusVariation;

                positions.set(skill.id, {
                    x: topicPos.x + Math.cos(angle) * orbitRadius,
                    y: topicPos.y + Math.sin(angle) * orbitRadius,
                });
            });
        });

        return positions;
    },
};

/**
 * Grid-based positioning strategy (alternative)
 */
export const gridPositioningStrategy: PositioningStrategy = {
    positionDomains(domains, config): Map<string, { x: number; y: number }> {
        const positions = new Map<string, { x: number; y: number }>();
        const count = domains.length;
        const cols = Math.ceil(Math.sqrt(count));
        const cellSize = config.worldScale / cols;

        domains.forEach((domain, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            positions.set(domain.id, {
                x: (col + 0.5) * cellSize - config.worldScale / 2,
                y: (row + 0.5) * cellSize - config.worldScale / 2,
            });
        });

        return positions;
    },

    positionTopics(topics, domainPositions, config): Map<string, { x: number; y: number }> {
        // Use orbital positioning for moons even in grid layout
        return orbitalPositioningStrategy.positionTopics(topics, domainPositions, config);
    },

    positionSkills(skills, topicPositions, config): Map<string, { x: number; y: number }> {
        // Use orbital positioning for stars
        return orbitalPositioningStrategy.positionSkills(skills, topicPositions, config);
    },
};

// ============================================================================
// UNIVERSE DATA TRANSFORMER
// ============================================================================

/**
 * Transform CurriculumGraph into UniverseData using configured strategies
 */
export function transformCurriculumToUniverse(
    graph: CurriculumGraph,
    config: UniverseLayoutConfig = DEFAULT_LAYOUT_CONFIG,
    positioningStrategy: PositioningStrategy = orbitalPositioningStrategy
): UniverseData {
    // Calculate positions
    const domainPositions = positioningStrategy.positionDomains(graph.domains, config);
    const topicPositions = positioningStrategy.positionTopics(graph.topics, domainPositions, config);
    const skillPositions = positioningStrategy.positionSkills(graph.skills, topicPositions, config);

    // Transform domains to planets
    const planets: PlanetNode[] = graph.domains.map((domain): PlanetNode => {
        const pos = domainPositions.get(domain.id) || { x: 0, y: 0 };
        const colors = getDomainColors(domain.domainId, domain.color);
        const baseRadius = domain.isEntryPoint
            ? config.basePlanetRadiusEntryPoint
            : config.basePlanetRadius;

        return {
            id: `planet-${domain.domainId}`,
            type: "planet",
            name: domain.name,
            domainId: domain.domainId as LearningDomainId, // Cast for type compatibility
            x: pos.x,
            y: pos.y,
            radius: baseRadius + domain.childCount * config.planetChildScale,
            color: colors.base,
            glowColor: colors.glow,
            orbitalRings: Math.min(domain.hierarchyLevel + 1, 5),
            moons: [],
            visibleAtZoom: ["galaxy", "solar", "constellation"] as ZoomLevel[],
        };
    });

    // Create lookup maps
    const planetByDomainId = new Map(planets.map((p) => [p.id.replace("planet-", ""), p]));

    // Transform topics to moons
    const moons: MoonNode[] = graph.topics.map((topic): MoonNode => {
        const pos = topicPositions.get(topic.id) || { x: 0, y: 0 };
        // Find parent domain to inherit colors
        const parentDomain = graph.domains.find((d) => d.id === topic.parentDomainId);
        const colors = parentDomain
            ? getDomainColors(parentDomain.domainId, parentDomain.color)
            : DOMAIN_COLORS.default;

        return {
            id: `moon-${topic.chapterId}`,
            type: "moon",
            name: topic.name,
            parentPlanetId: `planet-${parentDomain?.domainId || "unknown"}`,
            chapterId: topic.chapterId,
            x: pos.x,
            y: pos.y,
            radius: config.baseMoonRadius + Math.min(topic.childCount, 10) * config.moonChildScale,
            color: colors.base,
            glowColor: colors.glow,
            sectionCount: topic.childCount,
            visibleAtZoom: ["solar", "constellation", "star"] as ZoomLevel[],
        };
    });

    // Update planets with their moons
    moons.forEach((moon) => {
        const domainId = moon.parentPlanetId.replace("planet-", "");
        const planet = planetByDomainId.get(domainId);
        if (planet) {
            planet.moons.push(moon);
        }
    });

    // Transform skills to stars
    const moonByChapterId = new Map(moons.map((m) => [m.chapterId, m]));

    const stars: StarNode[] = graph.skills.map((skill): StarNode => {
        const pos = skillPositions.get(skill.id) || { x: 0, y: 0 };
        const parentTopic = graph.topics.find((t) => t.id === skill.parentTopicId);
        const parentMoon = parentTopic ? moonByChapterId.get(parentTopic.chapterId) : undefined;
        const colors = getSkillColor(skill);

        return {
            id: `star-${skill.lessonId}`,
            type: "star",
            name: skill.name,
            parentMoonId: parentMoon?.id || "unknown",
            lessonId: skill.lessonId,
            lessonType: skill.contentType,
            x: pos.x,
            y: pos.y,
            radius: config.baseStarRadius + Math.random() * config.starRadiusVariation,
            color: colors.base,
            glowColor: colors.glow,
            completed: skill.completed || false,
            duration: skill.duration || "1h",
            visibleAtZoom: ["constellation", "star"] as ZoomLevel[],
        };
    });

    // Transform connections
    const nodeIdMap = new Map<string, string>();
    graph.domains.forEach((d) => nodeIdMap.set(d.id, `planet-${d.domainId}`));
    graph.topics.forEach((t) => nodeIdMap.set(t.id, `moon-${t.chapterId}`));
    graph.skills.forEach((s) => nodeIdMap.set(s.id, `star-${s.lessonId}`));

    const connections: UniverseConnection[] = graph.connections
        .filter((conn) => conn.type === "prerequisite" || conn.type === "recommended" || conn.type === "builds_upon")
        .map((conn, index): UniverseConnection | null => {
            const fromId = nodeIdMap.get(conn.fromId);
            const toId = nodeIdMap.get(conn.toId);

            if (!fromId || !toId) return null;

            const fromNode = [...planets, ...moons, ...stars].find((n) => n.id === fromId);

            return {
                id: `connection-${index}`,
                fromId,
                toId,
                type: conn.type === "prerequisite" ? "prerequisite" :
                      conn.type === "builds_upon" ? "builds-upon" : "complements",
                strength: conn.weight,
                color: fromNode?.color || "#ffffff",
            };
        })
        .filter((c): c is UniverseConnection => c !== null);

    // Combine all nodes
    const allNodes: UniverseNode[] = [...planets, ...moons, ...stars];

    return {
        planets,
        moons,
        stars,
        connections,
        allNodes,
        nodeCount: {
            planets: planets.length,
            moons: moons.length,
            stars: stars.length,
            total: allNodes.length,
        },
    };
}
