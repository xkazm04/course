/**
 * Hierarchical Clustering Strategy
 *
 * Transforms UniverseData into clustered views based on zoom level.
 * At galaxy level: show galaxy clusters (aggregated domains)
 * At solar level: show domain clusters (aggregated topics)
 * At constellation level: show topic clusters (aggregated skills)
 * At star level: show individual nodes
 */

import type {
    UniverseNode,
    PlanetNode,
    MoonNode,
    OrbitNode,
    StarNode,
    ClusterNode,
    ClusterLevel,
    ClusterMetrics,
    LODConfig,
    ZoomLevel,
} from "./types";
import { DEFAULT_LOD_CONFIG } from "./types";
import type { UniverseData } from "./universeData";
import { DOMAIN_COLORS } from "./universeLayoutStrategies";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Clustered universe data with LOD support
 * 5-level hierarchy: galaxy → domain → topic → skill → lesson
 */
export interface ClusteredUniverseData {
    /** Original universe data */
    original: UniverseData;
    /** Galaxy-level clusters (for scale < 0.12) */
    galaxyClusters: ClusterNode[];
    /** Domain-level clusters (for scale < 0.22) */
    domainClusters: ClusterNode[];
    /** Topic-level clusters (for scale < 0.40) */
    topicClusters: ClusterNode[];
    /** Skill-level clusters (for scale < 0.60) */
    skillClusters: ClusterNode[];
    /** Pre-computed cluster positions for smooth transitions */
    clusterPositions: Map<string, { x: number; y: number }>;
}

/**
 * Options for cluster generation
 */
export interface ClusteringOptions {
    /** LOD configuration */
    lodConfig: LODConfig;
    /** Base radius for clusters at each level */
    clusterRadii: {
        galaxyCluster: number;
        domainCluster: number;
        topicCluster: number;
        skillCluster: number;
    };
    /** Maximum clusters per level (for grouping) */
    maxClustersPerLevel: number;
}

const DEFAULT_CLUSTERING_OPTIONS: ClusteringOptions = {
    lodConfig: DEFAULT_LOD_CONFIG,
    clusterRadii: {
        galaxyCluster: 120,
        domainCluster: 80,
        topicCluster: 40,
        skillCluster: 25,
    },
    maxClustersPerLevel: 8,
};

// ============================================================================
// METRICS CALCULATION
// ============================================================================

/**
 * Calculate aggregate metrics for a set of nodes
 */
function calculateMetrics(nodes: UniverseNode[]): ClusterMetrics {
    let totalHours = 0;
    let completedCount = 0;
    let totalLessons = 0;

    const difficultyBreakdown = {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        expert: 0,
    };

    for (const node of nodes) {
        if (node.type === "star") {
            const star = node as StarNode;
            totalLessons++;
            if (star.completed) completedCount++;
            // Parse duration (e.g., "15 min" → 0.25 hours)
            const durationMatch = star.duration?.match(/(\d+)/);
            if (durationMatch) {
                const minutes = parseInt(durationMatch[1], 10);
                totalHours += minutes / 60;
            }
        } else if (node.type === "moon") {
            const moon = node as MoonNode;
            // Estimate hours based on section count
            totalHours += moon.sectionCount * 0.5;
        } else if (node.type === "planet") {
            const planet = node as PlanetNode;
            // Sum up moon estimates
            totalHours += planet.moons.length * 2;
        }
    }

    return {
        totalHours: Math.round(totalHours * 10) / 10,
        completionPercent: totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0,
        nodeCount: nodes.length,
        completedCount,
        difficultyBreakdown,
    };
}

/**
 * Calculate the centroid position of a set of nodes
 */
function calculateCentroid(nodes: UniverseNode[]): { x: number; y: number } {
    if (nodes.length === 0) return { x: 0, y: 0 };

    let sumX = 0;
    let sumY = 0;

    for (const node of nodes) {
        sumX += node.x;
        sumY += node.y;
    }

    return {
        x: sumX / nodes.length,
        y: sumY / nodes.length,
    };
}

/**
 * Blend colors from multiple nodes
 */
function blendColors(nodes: UniverseNode[]): { base: string; glow: string } {
    if (nodes.length === 0) {
        return { base: "#6b7280", glow: "rgba(107, 114, 128, 0.5)" };
    }

    // Use the most common color, or the first planet's color
    const colorCounts = new Map<string, number>();
    for (const node of nodes) {
        const count = colorCounts.get(node.color) || 0;
        colorCounts.set(node.color, count + 1);
    }

    let maxCount = 0;
    let dominantColor = nodes[0].color;
    for (const [color, count] of colorCounts) {
        if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
        }
    }

    return {
        base: dominantColor,
        glow: `${dominantColor}80`,
    };
}

// ============================================================================
// CLUSTER GENERATION
// ============================================================================

/**
 * Create a galaxy cluster from multiple domains
 * Groups domains that are spatially close together
 */
function createGalaxyCluster(
    domains: PlanetNode[],
    index: number,
    options: ClusteringOptions
): ClusterNode {
    const centroid = calculateCentroid(domains);
    const colors = blendColors(domains);

    // Collect all descendant node IDs
    const childNodeIds = domains.map(d => d.id);
    const allDescendants: UniverseNode[] = [...domains];
    for (const domain of domains) {
        allDescendants.push(...domain.moons);
    }

    const metrics = calculateMetrics(allDescendants);
    metrics.nodeCount = domains.length; // Show domain count, not total

    // Generate name from domain names
    const domainNames = domains.map(d => d.name);
    const clusterName = domainNames.length <= 2
        ? domainNames.join(" & ")
        : `${domainNames[0]} + ${domainNames.length - 1} more`;

    return {
        id: `galaxy-cluster-${index}`,
        type: "cluster",
        name: clusterName,
        clusterLevel: "galaxy-cluster",
        childNodeIds,
        totalDescendants: allDescendants.length,
        metrics,
        primaryDomainId: domains[0]?.domainId,
        x: centroid.x,
        y: centroid.y,
        radius: options.clusterRadii.galaxyCluster,
        color: colors.base,
        glowColor: colors.glow,
        visibleAtZoom: ["galaxy"],
    };
}

/**
 * Create a domain cluster from a single domain's topics
 */
function createDomainCluster(
    domain: PlanetNode,
    options: ClusteringOptions
): ClusterNode {
    const childNodeIds = domain.moons.map(m => m.id);
    const allDescendants: UniverseNode[] = [domain, ...domain.moons];

    const metrics = calculateMetrics(allDescendants);
    metrics.nodeCount = domain.moons.length; // Show topic count

    const colors = DOMAIN_COLORS[domain.domainId] || DOMAIN_COLORS.default;

    return {
        id: `domain-cluster-${domain.domainId}`,
        type: "cluster",
        name: domain.name,
        clusterLevel: "domain-cluster",
        childNodeIds,
        totalDescendants: allDescendants.length,
        metrics,
        primaryDomainId: domain.domainId,
        x: domain.x,
        y: domain.y,
        radius: options.clusterRadii.domainCluster,
        color: colors.base,
        glowColor: colors.glow,
        visibleAtZoom: ["galaxy", "solar"],
    };
}

/**
 * Create a topic cluster from a moon's children (orbits/skills)
 */
function createTopicCluster(
    moon: MoonNode,
    orbits: OrbitNode[],
    options: ClusteringOptions
): ClusterNode {
    const childNodeIds = orbits.map(o => o.id);
    const allDescendants: UniverseNode[] = [moon, ...orbits];

    const metrics = calculateMetrics(orbits);

    return {
        id: `topic-cluster-${moon.chapterId}`,
        type: "cluster",
        name: moon.name,
        clusterLevel: "topic-cluster",
        childNodeIds,
        totalDescendants: allDescendants.length,
        metrics,
        x: moon.x,
        y: moon.y,
        radius: options.clusterRadii.topicCluster,
        color: moon.color,
        glowColor: moon.glowColor,
        visibleAtZoom: ["solar", "constellation"],
    };
}

/**
 * Create a skill cluster from an orbit's children (lessons/stars)
 */
function createSkillCluster(
    orbit: OrbitNode,
    lessons: StarNode[],
    options: ClusteringOptions
): ClusterNode {
    const childNodeIds = lessons.map(l => l.id);
    const metrics = calculateMetrics(lessons);

    return {
        id: `skill-cluster-${orbit.skillId}`,
        type: "cluster",
        name: orbit.name,
        clusterLevel: "skill-cluster",
        childNodeIds,
        totalDescendants: lessons.length,
        metrics,
        x: orbit.x,
        y: orbit.y,
        radius: options.clusterRadii.skillCluster,
        color: orbit.color,
        glowColor: orbit.glowColor,
        visibleAtZoom: ["constellation", "star"],
    };
}

/**
 * Group domains into galaxy clusters using k-means-like clustering
 */
function groupDomainsIntoClusters(
    domains: PlanetNode[],
    maxClusters: number
): PlanetNode[][] {
    if (domains.length <= maxClusters) {
        // Each domain is its own cluster
        return domains.map(d => [d]);
    }

    // Simple spatial clustering based on distance
    const clusters: PlanetNode[][] = [];
    const assigned = new Set<string>();

    // Sort domains by position to create spatial groups
    const sortedDomains = [...domains].sort((a, b) => {
        const angleA = Math.atan2(a.y, a.x);
        const angleB = Math.atan2(b.y, b.x);
        return angleA - angleB;
    });

    // Group adjacent domains
    const groupSize = Math.ceil(sortedDomains.length / maxClusters);
    for (let i = 0; i < sortedDomains.length; i += groupSize) {
        const group = sortedDomains.slice(i, i + groupSize);
        clusters.push(group);
    }

    return clusters;
}

// ============================================================================
// MAIN CLUSTERING FUNCTION
// ============================================================================

/**
 * Generate clustered universe data from raw universe data
 * Supports 5-level hierarchy: galaxy → domain → topic → skill → lesson
 */
export function generateClusteredData(
    data: UniverseData,
    options: Partial<ClusteringOptions> = {}
): ClusteredUniverseData {
    const opts: ClusteringOptions = { ...DEFAULT_CLUSTERING_OPTIONS, ...options };

    // Generate galaxy clusters (groups of domains)
    const domainGroups = groupDomainsIntoClusters(data.planets, opts.maxClustersPerLevel);
    const galaxyClusters = domainGroups.map((group, index) =>
        createGalaxyCluster(group, index, opts)
    );

    // Generate domain clusters (one per domain)
    const domainClusters = data.planets.map(planet =>
        createDomainCluster(planet, opts)
    );

    // Group orbits by moon for topic clusters
    const orbitsByMoon = new Map<string, OrbitNode[]>();
    const orbits = (data.orbits || []) as OrbitNode[];
    for (const orbit of orbits) {
        const existing = orbitsByMoon.get(orbit.parentMoonId) || [];
        existing.push(orbit);
        orbitsByMoon.set(orbit.parentMoonId, existing);
    }

    // Generate topic clusters (one per moon with orbits)
    const topicClusters = data.moons
        .filter(moon => {
            const moonOrbits = orbitsByMoon.get(moon.id) || [];
            return moonOrbits.length >= opts.lodConfig.minClusterSize;
        })
        .map(moon => {
            const moonOrbits = orbitsByMoon.get(moon.id) || [];
            return createTopicCluster(moon, moonOrbits, opts);
        });

    // Group stars by orbit for skill clusters
    const starsByOrbit = new Map<string, StarNode[]>();
    for (const star of data.stars) {
        // Stars reference their parent orbit via parentMoonId (which is actually orbit ID)
        const existing = starsByOrbit.get(star.parentMoonId) || [];
        existing.push(star);
        starsByOrbit.set(star.parentMoonId, existing);
    }

    // Generate skill clusters (one per orbit with lessons)
    const skillClusters = orbits
        .filter(orbit => {
            const orbitStars = starsByOrbit.get(orbit.id) || [];
            return orbitStars.length >= opts.lodConfig.minClusterSize;
        })
        .map(orbit => {
            const orbitStars = starsByOrbit.get(orbit.id) || [];
            return createSkillCluster(orbit, orbitStars, opts);
        });

    // Build cluster position map for smooth transitions
    const clusterPositions = new Map<string, { x: number; y: number }>();
    for (const cluster of [...galaxyClusters, ...domainClusters, ...topicClusters, ...skillClusters]) {
        clusterPositions.set(cluster.id, { x: cluster.x, y: cluster.y });
    }

    return {
        original: data,
        galaxyClusters,
        domainClusters,
        topicClusters,
        skillClusters,
        clusterPositions,
    };
}

// ============================================================================
// LOD NODE SELECTION
// ============================================================================

/**
 * Cache for getNodesForScale to avoid creating new arrays every frame
 * Key: clusteredData reference, Value: { level, nodes }
 */
const nodesForScaleCache = new WeakMap<ClusteredUniverseData, {
    level: string;
    nodes: UniverseNode[];
}>();

/**
 * Get the appropriate nodes to render based on current scale
 * Uses caching to return the same array reference within a LOD level
 */
export function getNodesForScale(
    clusteredData: ClusteredUniverseData,
    scale: number,
    lodConfig: LODConfig = DEFAULT_LOD_CONFIG
): UniverseNode[] {
    const currentLevel = getLODLevel(scale, lodConfig);

    // Check cache - return same array if level hasn't changed
    const cached = nodesForScaleCache.get(clusteredData);
    if (cached && cached.level === currentLevel) {
        return cached.nodes; // Same reference - prevents React re-renders
    }

    const { thresholds } = lodConfig;
    const { original, galaxyClusters, domainClusters, topicClusters, skillClusters } = clusteredData;
    const orbits = (original.orbits || []) as OrbitNode[];

    let nodes: UniverseNode[];

    // Galaxy cluster level (most zoomed out)
    if (scale < thresholds.galaxyCluster) {
        nodes = [...galaxyClusters];
    }
    // Domain cluster level
    else if (scale < thresholds.domainCluster) {
        nodes = [...domainClusters];
    }
    // Topic cluster level - show planets + topic clusters
    else if (scale < thresholds.topicCluster) {
        nodes = [...original.planets, ...topicClusters];
    }
    // Skill cluster level - show planets, moons, skill clusters
    else if (scale < thresholds.skillCluster) {
        nodes = [...original.planets, ...original.moons, ...skillClusters];
    }
    // Full detail level - show planets, moons, orbits, skill clusters
    else if (scale < thresholds.fullDetail) {
        nodes = [...original.planets, ...original.moons, ...orbits, ...skillClusters];
    }
    // Maximum detail - show everything
    else {
        nodes = original.allNodes;
    }

    // Update cache
    nodesForScaleCache.set(clusteredData, { level: currentLevel, nodes });

    return nodes;
}

/**
 * LOD level type for 5-level hierarchy
 */
export type LODLevelName = "galaxy-cluster" | "domain-cluster" | "topic-cluster" | "skill-cluster" | "full-detail";

/**
 * Get the current LOD level name based on scale
 * 5-level hierarchy: galaxy → domain → topic → skill → full-detail
 */
export function getLODLevel(
    scale: number,
    lodConfig: LODConfig = DEFAULT_LOD_CONFIG
): LODLevelName {
    const { thresholds } = lodConfig;

    if (scale < thresholds.galaxyCluster) return "galaxy-cluster";
    if (scale < thresholds.domainCluster) return "domain-cluster";
    if (scale < thresholds.topicCluster) return "topic-cluster";
    if (scale < thresholds.skillCluster) return "skill-cluster";
    return "full-detail";
}

// ============================================================================
// TRANSITION HELPERS
// ============================================================================

/**
 * Calculate transition state between two LOD levels
 */
export interface LODTransitionState {
    fromLevel: LODLevelName;
    toLevel: LODLevelName;
    progress: number;
    fadingOutNodes: string[];
    fadingInNodes: string[];
}

/**
 * Get the transition state for smooth LOD changes
 * Supports 5-level hierarchy transitions
 */
export function getLODTransitionState(
    previousScale: number,
    currentScale: number,
    clusteredData: ClusteredUniverseData,
    lodConfig: LODConfig = DEFAULT_LOD_CONFIG
): LODTransitionState | null {
    const previousLevel = getLODLevel(previousScale, lodConfig);
    const currentLevel = getLODLevel(currentScale, lodConfig);

    if (previousLevel === currentLevel) return null;

    // Calculate progress through the transition zone
    const { thresholds } = lodConfig;
    let transitionMin = 0;
    let transitionMax = 0;

    // Determine transition zone based on levels
    if (currentLevel === "galaxy-cluster" || previousLevel === "galaxy-cluster") {
        transitionMin = 0;
        transitionMax = thresholds.galaxyCluster;
    } else if (currentLevel === "domain-cluster" || previousLevel === "domain-cluster") {
        transitionMin = thresholds.galaxyCluster;
        transitionMax = thresholds.domainCluster;
    } else if (currentLevel === "topic-cluster" || previousLevel === "topic-cluster") {
        transitionMin = thresholds.domainCluster;
        transitionMax = thresholds.topicCluster;
    } else if (currentLevel === "skill-cluster" || previousLevel === "skill-cluster") {
        transitionMin = thresholds.topicCluster;
        transitionMax = thresholds.skillCluster;
    } else {
        transitionMin = thresholds.skillCluster;
        transitionMax = thresholds.fullDetail;
    }

    const progress = Math.max(0, Math.min(1,
        (currentScale - transitionMin) / (transitionMax - transitionMin)
    ));

    // Determine which nodes are fading
    const zoomingIn = currentScale > previousScale;
    const fadingOutNodes: string[] = [];
    const fadingInNodes: string[] = [];
    const orbits = (clusteredData.original.orbits || []) as OrbitNode[];

    if (zoomingIn) {
        // Clusters fade out, children fade in
        if (previousLevel === "galaxy-cluster") {
            fadingOutNodes.push(...clusteredData.galaxyClusters.map(c => c.id));
            fadingInNodes.push(...clusteredData.domainClusters.map(c => c.id));
        } else if (previousLevel === "domain-cluster") {
            fadingOutNodes.push(...clusteredData.domainClusters.map(c => c.id));
            fadingInNodes.push(...clusteredData.original.planets.map(p => p.id));
            fadingInNodes.push(...clusteredData.topicClusters.map(c => c.id));
        } else if (previousLevel === "topic-cluster") {
            fadingOutNodes.push(...clusteredData.topicClusters.map(c => c.id));
            fadingInNodes.push(...clusteredData.original.moons.map(m => m.id));
            fadingInNodes.push(...clusteredData.skillClusters.map(c => c.id));
        } else if (previousLevel === "skill-cluster") {
            fadingOutNodes.push(...clusteredData.skillClusters.map(c => c.id));
            fadingInNodes.push(...orbits.map(o => o.id));
        }
    } else {
        // Children fade out, clusters fade in
        if (currentLevel === "galaxy-cluster") {
            fadingInNodes.push(...clusteredData.galaxyClusters.map(c => c.id));
            fadingOutNodes.push(...clusteredData.domainClusters.map(c => c.id));
        } else if (currentLevel === "domain-cluster") {
            fadingInNodes.push(...clusteredData.domainClusters.map(c => c.id));
            fadingOutNodes.push(...clusteredData.original.planets.map(p => p.id));
            fadingOutNodes.push(...clusteredData.topicClusters.map(c => c.id));
        } else if (currentLevel === "topic-cluster") {
            fadingInNodes.push(...clusteredData.topicClusters.map(c => c.id));
            fadingOutNodes.push(...clusteredData.original.moons.map(m => m.id));
            fadingOutNodes.push(...clusteredData.skillClusters.map(c => c.id));
        } else if (currentLevel === "skill-cluster") {
            fadingInNodes.push(...clusteredData.skillClusters.map(c => c.id));
            fadingOutNodes.push(...orbits.map(o => o.id));
        }
    }

    return {
        fromLevel: previousLevel,
        toLevel: currentLevel,
        progress: zoomingIn ? progress : 1 - progress,
        fadingOutNodes,
        fadingInNodes,
    };
}

// ============================================================================
// CLUSTER EXPANSION/COLLAPSE
// ============================================================================

/**
 * Get child positions for cluster expansion animation
 */
export function getClusterExpansionPositions(
    cluster: ClusterNode,
    clusteredData: ClusteredUniverseData
): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();

    // Find the actual child nodes
    const childNodes: UniverseNode[] = [];
    for (const childId of cluster.childNodeIds) {
        const node = clusteredData.original.allNodes.find(n => n.id === childId);
        if (node) {
            childNodes.push(node);
        }
    }

    // If no children found, generate radial positions
    if (childNodes.length === 0) {
        const count = cluster.childNodeIds.length;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const distance = cluster.radius * 2;
            positions.set(cluster.childNodeIds[i], {
                x: cluster.x + Math.cos(angle) * distance,
                y: cluster.y + Math.sin(angle) * distance,
            });
        }
    } else {
        // Use actual child positions
        for (const child of childNodes) {
            positions.set(child.id, { x: child.x, y: child.y });
        }
    }

    return positions;
}

/**
 * Interpolate position during cluster expansion
 */
export function interpolateExpansionPosition(
    cluster: ClusterNode,
    childId: string,
    progress: number,
    targetPositions: Map<string, { x: number; y: number }>
): { x: number; y: number } {
    const target = targetPositions.get(childId);
    if (!target) {
        return { x: cluster.x, y: cluster.y };
    }

    // Ease out cubic for smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 3);

    return {
        x: cluster.x + (target.x - cluster.x) * eased,
        y: cluster.y + (target.y - cluster.y) * eased,
    };
}
