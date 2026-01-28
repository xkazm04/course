/**
 * Territory Data Adapter
 *
 * Converts map_nodes database records to TerritoryNode format.
 */

import type {
    TerritoryNode,
    TerritoryLevel,
    TerritoryMetrics,
    TerritoryColorScheme,
} from "./territoryTypes";
import { DEFAULT_COLOR_SCHEME } from "./territoryTypes";

// ============================================================================
// DATABASE TYPES (from map_nodes table)
// ============================================================================

export interface MapNodeRecord {
    id: string;
    parent_id: string | null;
    label: string;
    node_type: "domain" | "topic" | "skill" | "course" | "lesson";
    depth: number;
    position_x: number;
    position_y: number;
    metadata: {
        what_you_will_learn?: string[];
        prerequisites?: string[];
        estimated_hours?: number;
        difficulty?: string;
        tags?: string[];
    } | null;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// CONVERSION
// ============================================================================

/**
 * Convert database node type to territory level
 */
function nodeTypeToLevel(nodeType: MapNodeRecord["node_type"]): TerritoryLevel {
    const mapping: Record<MapNodeRecord["node_type"], TerritoryLevel> = {
        domain: "domain",
        topic: "topic",
        skill: "skill",
        course: "skill", // Treat courses as skills for simplicity
        lesson: "lesson",
    };
    return mapping[nodeType];
}

/**
 * Get color for a node based on its level and index
 */
function getNodeColor(
    level: TerritoryLevel,
    index: number,
    colorScheme: TerritoryColorScheme
): string {
    // Map levels to color arrays
    const colorMap: Record<TerritoryLevel, string[] | string> = {
        world: colorScheme.background,
        domain: colorScheme.domain,
        topic: colorScheme.topic,
        skill: colorScheme.skill,
        lesson: colorScheme.lesson,
    };

    const colors = colorMap[level];
    if (typeof colors === "string") {
        return colors;
    }
    return colors[index % colors.length];
}

/**
 * Build hierarchy from flat list of database records
 */
export function buildHierarchy(
    records: MapNodeRecord[],
    colorScheme: TerritoryColorScheme = DEFAULT_COLOR_SCHEME
): TerritoryNode | null {
    if (records.length === 0) return null;

    // Create lookup map
    const nodeMap = new Map<string, MapNodeRecord>();
    const childrenMap = new Map<string, MapNodeRecord[]>();

    for (const record of records) {
        nodeMap.set(record.id, record);

        const parentId = record.parent_id || "root";
        if (!childrenMap.has(parentId)) {
            childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId)!.push(record);
    }

    // Find root nodes (domains)
    const rootNodes = childrenMap.get("root") || records.filter((r) => !r.parent_id);

    // Build tree recursively
    function buildNode(
        record: MapNodeRecord,
        colorIndex: number
    ): TerritoryNode {
        const level = nodeTypeToLevel(record.node_type);
        const children = childrenMap.get(record.id) || [];
        const childNodes = children.map((child, idx) =>
            buildNode(child, colorIndex)
        );

        // Calculate metrics
        const metrics = calculateMetrics(record, childNodes);

        return {
            id: record.id,
            label: record.label,
            shortLabel: shortenLabel(record.label),
            level,
            parentId: record.parent_id,
            children: childNodes,

            // Layout will be computed later
            x: 0,
            y: 0,
            width: 0,
            height: 0,

            metrics,
            color: getNodeColor(level, colorIndex, colorScheme),
            borderColor: colorScheme.border,

            dbNodeId: record.id,
            dbData: {
                what_you_will_learn: record.metadata?.what_you_will_learn,
                prerequisites: record.metadata?.prerequisites,
                tags: record.metadata?.tags,
                estimated_hours: record.metadata?.estimated_hours,
            },
        };
    }

    // If we have multiple root nodes, create a virtual world root
    if (rootNodes.length > 1 || rootNodes[0]?.node_type !== "domain") {
        const domainNodes = rootNodes.map((record, idx) =>
            buildNode(record, idx)
        );

        const worldMetrics = calculateMetrics(null, domainNodes);

        return {
            id: "world-root",
            label: "Learning Universe",
            shortLabel: "Universe",
            level: "world",
            parentId: null,
            children: domainNodes,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            metrics: worldMetrics,
            color: colorScheme.background,
            borderColor: colorScheme.border,
        };
    }

    // Single domain root
    return buildNode(rootNodes[0], 0);
}

/**
 * Calculate metrics for a node based on its children
 */
function calculateMetrics(
    record: MapNodeRecord | null,
    children: TerritoryNode[]
): TerritoryMetrics {
    if (children.length === 0) {
        // Leaf node (lesson)
        return {
            totalItems: 0,
            totalLessons: 1,
            estimatedHours: record?.metadata?.estimated_hours || 0.5,
            completedCount: 0,
            completionPercent: 0,
            difficulty: parseDifficulty(record?.metadata?.difficulty),
        };
    }

    // Aggregate from children
    const totalLessons = children.reduce(
        (sum, child) => sum + child.metrics.totalLessons,
        0
    );
    const estimatedHours = children.reduce(
        (sum, child) => sum + child.metrics.estimatedHours,
        0
    );
    const completedCount = children.reduce(
        (sum, child) => sum + child.metrics.completedCount,
        0
    );

    return {
        totalItems: children.length,
        totalLessons,
        estimatedHours,
        completedCount,
        completionPercent:
            totalLessons > 0
                ? Math.round((completedCount / totalLessons) * 100)
                : 0,
    };
}

/**
 * Parse difficulty string to typed value
 */
function parseDifficulty(
    difficulty?: string
): "beginner" | "intermediate" | "advanced" | undefined {
    if (!difficulty) return undefined;
    const lower = difficulty.toLowerCase();
    if (lower.includes("begin") || lower.includes("easy")) return "beginner";
    if (lower.includes("inter") || lower.includes("medium")) return "intermediate";
    if (lower.includes("advan") || lower.includes("hard")) return "advanced";
    return undefined;
}

/**
 * Shorten a label for small containers
 */
function shortenLabel(label: string): string {
    if (label.length <= 12) return label;

    // Try abbreviation strategies
    const words = label.split(/\s+/);

    // Single word: truncate
    if (words.length === 1) {
        return label.slice(0, 10) + "...";
    }

    // Multiple words: use initials or first word
    if (words.length <= 3) {
        return words.map((w) => w[0].toUpperCase()).join("");
    }

    // Take first word + abbreviate rest
    return words[0] + " " + words.slice(1).map((w) => w[0]).join("");
}

// ============================================================================
// MOCK DATA FOR TESTING
// ============================================================================

export function createMockHierarchy(): TerritoryNode {
    const domains = [
        { name: "Frontend Development", topics: ["React", "TypeScript", "CSS & Styling", "Performance", "Testing"] },
        { name: "Backend Development", topics: ["Node.js", "Databases", "APIs", "Authentication", "DevOps"] },
        { name: "Data Science", topics: ["Python", "Machine Learning", "Statistics", "Data Visualization"] },
        { name: "Mobile Development", topics: ["React Native", "iOS", "Android", "Cross-Platform"] },
        { name: "Cloud & Infrastructure", topics: ["AWS", "Containers", "CI/CD", "Monitoring"] },
        { name: "AI & Agents", topics: ["LLMs", "Prompt Engineering", "Agent Systems", "RAG"] },
    ];

    const domainNodes: TerritoryNode[] = domains.map((domain, dIdx) => {
        const topicNodes: TerritoryNode[] = domain.topics.map((topic, tIdx) => {
            // Generate 3-6 skills per topic
            const skillCount = 3 + Math.floor(Math.random() * 4);
            const skillNodes: TerritoryNode[] = Array.from({ length: skillCount }, (_, sIdx) => {
                // Generate 2-5 lessons per skill
                const lessonCount = 2 + Math.floor(Math.random() * 4);
                const lessonNodes: TerritoryNode[] = Array.from({ length: lessonCount }, (_, lIdx) => ({
                    id: `lesson-${dIdx}-${tIdx}-${sIdx}-${lIdx}`,
                    label: `Lesson ${lIdx + 1}`,
                    shortLabel: `L${lIdx + 1}`,
                    level: "lesson" as const,
                    parentId: `skill-${dIdx}-${tIdx}-${sIdx}`,
                    children: [],
                    x: 0, y: 0, width: 0, height: 0,
                    metrics: {
                        totalItems: 0,
                        totalLessons: 1,
                        estimatedHours: 0.5 + Math.random() * 1.5,
                        completedCount: Math.random() > 0.7 ? 1 : 0,
                        completionPercent: Math.random() > 0.7 ? 100 : 0,
                    },
                    color: DEFAULT_COLOR_SCHEME.lesson[dIdx % DEFAULT_COLOR_SCHEME.lesson.length],
                    borderColor: DEFAULT_COLOR_SCHEME.border,
                }));

                const skillHours = lessonNodes.reduce((s, l) => s + l.metrics.estimatedHours, 0);
                const completed = lessonNodes.filter((l) => l.metrics.completionPercent === 100).length;

                return {
                    id: `skill-${dIdx}-${tIdx}-${sIdx}`,
                    label: `Skill ${sIdx + 1}`,
                    shortLabel: `S${sIdx + 1}`,
                    level: "skill" as const,
                    parentId: `topic-${dIdx}-${tIdx}`,
                    children: lessonNodes,
                    x: 0, y: 0, width: 0, height: 0,
                    metrics: {
                        totalItems: lessonCount,
                        totalLessons: lessonCount,
                        estimatedHours: skillHours,
                        completedCount: completed,
                        completionPercent: Math.round((completed / lessonCount) * 100),
                    },
                    color: DEFAULT_COLOR_SCHEME.skill[dIdx % DEFAULT_COLOR_SCHEME.skill.length],
                    borderColor: DEFAULT_COLOR_SCHEME.border,
                };
            });

            const topicLessons = skillNodes.reduce((s, sk) => s + sk.metrics.totalLessons, 0);
            const topicHours = skillNodes.reduce((s, sk) => s + sk.metrics.estimatedHours, 0);
            const topicCompleted = skillNodes.reduce((s, sk) => s + sk.metrics.completedCount, 0);

            return {
                id: `topic-${dIdx}-${tIdx}`,
                label: topic,
                shortLabel: topic.slice(0, 10),
                level: "topic" as const,
                parentId: `domain-${dIdx}`,
                children: skillNodes,
                x: 0, y: 0, width: 0, height: 0,
                metrics: {
                    totalItems: skillCount,
                    totalLessons: topicLessons,
                    estimatedHours: topicHours,
                    completedCount: topicCompleted,
                    completionPercent: Math.round((topicCompleted / topicLessons) * 100),
                },
                color: DEFAULT_COLOR_SCHEME.topic[dIdx % DEFAULT_COLOR_SCHEME.topic.length],
                borderColor: DEFAULT_COLOR_SCHEME.border,
            };
        });

        const domainLessons = topicNodes.reduce((s, t) => s + t.metrics.totalLessons, 0);
        const domainHours = topicNodes.reduce((s, t) => s + t.metrics.estimatedHours, 0);
        const domainCompleted = topicNodes.reduce((s, t) => s + t.metrics.completedCount, 0);

        return {
            id: `domain-${dIdx}`,
            label: domain.name,
            shortLabel: domain.name.split(" ")[0],
            level: "domain" as const,
            parentId: "world-root",
            children: topicNodes,
            x: 0, y: 0, width: 0, height: 0,
            metrics: {
                totalItems: domain.topics.length,
                totalLessons: domainLessons,
                estimatedHours: domainHours,
                completedCount: domainCompleted,
                completionPercent: Math.round((domainCompleted / domainLessons) * 100),
            },
            color: DEFAULT_COLOR_SCHEME.domain[dIdx % DEFAULT_COLOR_SCHEME.domain.length],
            borderColor: DEFAULT_COLOR_SCHEME.border,
        };
    });

    const totalLessons = domainNodes.reduce((s, d) => s + d.metrics.totalLessons, 0);
    const totalHours = domainNodes.reduce((s, d) => s + d.metrics.estimatedHours, 0);
    const totalCompleted = domainNodes.reduce((s, d) => s + d.metrics.completedCount, 0);

    return {
        id: "world-root",
        label: "Learning Universe",
        shortLabel: "Universe",
        level: "world",
        parentId: null,
        children: domainNodes,
        x: 0, y: 0, width: 0, height: 0,
        metrics: {
            totalItems: domains.length,
            totalLessons,
            estimatedHours: totalHours,
            completedCount: totalCompleted,
            completionPercent: Math.round((totalCompleted / totalLessons) * 100),
        },
        color: DEFAULT_COLOR_SCHEME.background,
        borderColor: DEFAULT_COLOR_SCHEME.border,
    };
}
