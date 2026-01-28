/**
 * Path Analyzer
 *
 * Analyzes learning paths to identify popular sequences, optimal routes,
 * and hidden gems. Uses collective learning data to surface patterns.
 *
 * Features:
 * - Popular path tracking (what others did after X)
 * - Optimal path computation (shortest to goal)
 * - Hidden gem detection (underexplored high-value nodes)
 * - Path completion prediction
 */

import type { MapNode, MapConnection, NodeStatus } from "./types";
import { isCourseNode, isChapterNode, getLevelDepth } from "./types";
import type { SimilarityCalculator } from "./similarityCalculator";

// ============================================================================
// TYPES
// ============================================================================

/**
 * A learning path segment (A -> B)
 */
export interface PathSegment {
    fromId: string;
    toId: string;
    frequency: number; // How many learners took this path
    averageTimeMinutes: number; // Average time to complete
    successRate: number; // % who completed target after source
}

/**
 * Aggregated path data for a node
 */
export interface NodePathData {
    nodeId: string;
    /** Total learners who completed this node */
    completions: number;
    /** Average time to complete (minutes) */
    averageTime: number;
    /** Most common next steps */
    popularNextSteps: PathSegment[];
    /** Most common previous steps */
    commonPrerequisites: PathSegment[];
    /** Completion rate (started vs completed) */
    completionRate: number;
    /** Average rating (if available) */
    averageRating?: number;
}

/**
 * Hidden gem - underexplored but valuable node
 */
export interface HiddenGem {
    node: MapNode;
    /** Why it's a gem */
    reason: string;
    /** Value score (0-1) */
    valueScore: number;
    /** Discovery score (how hidden, 0-1, higher = more hidden) */
    hiddenScore: number;
    /** Combined gem score */
    gemScore: number;
    /** Relevant skills/tags */
    relevantTags: string[];
}

/**
 * Path suggestion with reasoning
 */
export interface PathSuggestion {
    /** Sequence of node IDs */
    path: string[];
    /** Total estimated time */
    estimatedHours: number;
    /** Confidence in this path (0-1) */
    confidence: number;
    /** Reasoning for suggestion */
    reasoning: string;
    /** Source of suggestion */
    source: "popular" | "optimal" | "personalized" | "hidden-gem";
}

/**
 * Learner journey snapshot (for collective intelligence)
 */
export interface LearnerJourney {
    learnerId: string;
    completedNodeIds: string[];
    currentNodeId: string | null;
    timestamp: Date;
}

/**
 * Path analysis options
 */
export interface PathAnalysisOptions {
    /** Minimum frequency to consider a path "popular" */
    minPathFrequency?: number;
    /** Maximum path depth to analyze */
    maxPathDepth?: number;
    /** Include cross-domain paths */
    includeCrossDomain?: boolean;
    /** Weight for recency in popularity */
    recencyWeight?: number;
}

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

const DEFAULT_OPTIONS: Required<PathAnalysisOptions> = {
    minPathFrequency: 3,
    maxPathDepth: 10,
    includeCrossDomain: true,
    recencyWeight: 0.3,
};

// ============================================================================
// PATH ANALYZER CLASS
// ============================================================================

export class PathAnalyzer {
    private nodes: Map<string, MapNode>;
    private connections: MapConnection[];
    private similarityCalculator: SimilarityCalculator | null;
    private options: Required<PathAnalysisOptions>;

    // Path frequency data (would come from database in production)
    private pathFrequencies: Map<string, PathSegment> = new Map();
    private nodePathData: Map<string, NodePathData> = new Map();

    // Collective journey data
    private journeys: LearnerJourney[] = [];

    constructor(
        nodes: Map<string, MapNode>,
        connections: MapConnection[],
        similarityCalculator: SimilarityCalculator | null = null,
        options: PathAnalysisOptions = {}
    ) {
        this.nodes = nodes;
        this.connections = connections;
        this.similarityCalculator = similarityCalculator;
        this.options = { ...DEFAULT_OPTIONS, ...options };

        // Initialize with mock data for development
        this.initializeMockPathData();
    }

    /**
     * Initialize mock path data for development
     * In production, this would load from Supabase
     */
    private initializeMockPathData(): void {
        // Generate realistic path frequencies based on node structure
        const nodeArray = Array.from(this.nodes.values());

        for (const node of nodeArray) {
            // Create path data for each node
            const pathData: NodePathData = {
                nodeId: node.id,
                completions: this.generateMockCompletions(node),
                averageTime: this.generateMockAverageTime(node),
                popularNextSteps: this.generateMockNextSteps(node),
                commonPrerequisites: this.generateMockPrerequisites(node),
                completionRate: 0.6 + Math.random() * 0.35,
                averageRating: 3.5 + Math.random() * 1.5,
            };

            this.nodePathData.set(node.id, pathData);

            // Add segments to frequency map
            for (const segment of pathData.popularNextSteps) {
                const key = `${segment.fromId}->${segment.toId}`;
                this.pathFrequencies.set(key, segment);
            }
        }
    }

    private generateMockCompletions(node: MapNode): number {
        // More completions for earlier/easier content
        const levelDepth = getLevelDepth(node.level);
        const base = Math.floor(Math.random() * 500) + 100;
        return Math.floor(base / (levelDepth + 1));
    }

    private generateMockAverageTime(node: MapNode): number {
        // Time in minutes based on estimated hours
        const hours = node.estimatedHours || 1;
        return Math.floor(hours * 60 * (0.8 + Math.random() * 0.4));
    }

    private generateMockNextSteps(node: MapNode): PathSegment[] {
        const segments: PathSegment[] = [];

        // Add children as next steps
        for (const childId of node.childIds.slice(0, 3)) {
            segments.push({
                fromId: node.id,
                toId: childId,
                frequency: Math.floor(Math.random() * 100) + 20,
                averageTimeMinutes: Math.floor(Math.random() * 60) + 30,
                successRate: 0.7 + Math.random() * 0.25,
            });
        }

        // Add sequential connections
        for (const conn of this.connections) {
            if (conn.fromId === node.id && conn.type === "next") {
                segments.push({
                    fromId: node.id,
                    toId: conn.toId,
                    frequency: Math.floor(Math.random() * 80) + 15,
                    averageTimeMinutes: Math.floor(Math.random() * 45) + 20,
                    successRate: 0.75 + Math.random() * 0.2,
                });
            }
        }

        // Sort by frequency
        segments.sort((a, b) => b.frequency - a.frequency);
        return segments.slice(0, 5);
    }

    private generateMockPrerequisites(node: MapNode): PathSegment[] {
        const segments: PathSegment[] = [];

        // Parent as common prerequisite
        if (node.parentId) {
            segments.push({
                fromId: node.parentId,
                toId: node.id,
                frequency: Math.floor(Math.random() * 120) + 30,
                averageTimeMinutes: Math.floor(Math.random() * 90) + 45,
                successRate: 0.8 + Math.random() * 0.15,
            });
        }

        // Prerequisite connections
        for (const conn of this.connections) {
            if (conn.toId === node.id && conn.type === "prerequisite") {
                segments.push({
                    fromId: conn.fromId,
                    toId: node.id,
                    frequency: Math.floor(Math.random() * 60) + 10,
                    averageTimeMinutes: Math.floor(Math.random() * 60) + 30,
                    successRate: 0.65 + Math.random() * 0.3,
                });
            }
        }

        segments.sort((a, b) => b.frequency - a.frequency);
        return segments.slice(0, 5);
    }

    /**
     * Get popular next steps from a node
     */
    public getPopularNextSteps(
        nodeId: string,
        limit: number = 5
    ): Array<{ node: MapNode; segment: PathSegment }> {
        const pathData = this.nodePathData.get(nodeId);
        if (!pathData) return [];

        const results: Array<{ node: MapNode; segment: PathSegment }> = [];

        for (const segment of pathData.popularNextSteps) {
            const node = this.nodes.get(segment.toId);
            if (node) {
                results.push({ node, segment });
            }
        }

        return results.slice(0, limit);
    }

    /**
     * Get what learners typically did before reaching a node
     */
    public getCommonPrerequisites(
        nodeId: string,
        limit: number = 5
    ): Array<{ node: MapNode; segment: PathSegment }> {
        const pathData = this.nodePathData.get(nodeId);
        if (!pathData) return [];

        const results: Array<{ node: MapNode; segment: PathSegment }> = [];

        for (const segment of pathData.commonPrerequisites) {
            const node = this.nodes.get(segment.fromId);
            if (node) {
                results.push({ node, segment });
            }
        }

        return results.slice(0, limit);
    }

    /**
     * Find hidden gems - underexplored high-value nodes
     */
    public findHiddenGems(
        completedNodeIds: Set<string>,
        limit: number = 5
    ): HiddenGem[] {
        const gems: HiddenGem[] = [];
        const avgCompletions = this.calculateAverageCompletions();

        for (const [nodeId, node] of this.nodes) {
            // Skip completed nodes
            if (completedNodeIds.has(nodeId)) continue;

            const pathData = this.nodePathData.get(nodeId);
            if (!pathData) continue;

            // Calculate hidden score (lower completions = more hidden)
            const hiddenScore = Math.max(0, 1 - pathData.completions / (avgCompletions * 2));

            // Calculate value score based on multiple factors
            const valueScore = this.calculateNodeValue(node, pathData, completedNodeIds);

            // Only consider if both hidden and valuable
            if (hiddenScore > 0.3 && valueScore > 0.5) {
                const gemScore = (hiddenScore * 0.4 + valueScore * 0.6);

                // Determine reason
                const reasons: string[] = [];
                if (pathData.averageRating && pathData.averageRating > 4.0) {
                    reasons.push("Highly rated by learners");
                }
                if (pathData.completionRate > 0.85) {
                    reasons.push("High completion rate");
                }
                if (this.hasValuableSkills(node, completedNodeIds)) {
                    reasons.push("Teaches in-demand skills");
                }
                if (hiddenScore > 0.7) {
                    reasons.push("Rarely discovered");
                }

                gems.push({
                    node,
                    reason: reasons.join(". ") || "Underexplored content with high potential",
                    valueScore,
                    hiddenScore,
                    gemScore,
                    relevantTags: this.extractRelevantTags(node),
                });
            }
        }

        // Sort by gem score descending
        gems.sort((a, b) => b.gemScore - a.gemScore);

        return gems.slice(0, limit);
    }

    private calculateAverageCompletions(): number {
        let total = 0;
        let count = 0;

        for (const data of this.nodePathData.values()) {
            total += data.completions;
            count++;
        }

        return count > 0 ? total / count : 100;
    }

    private calculateNodeValue(
        node: MapNode,
        pathData: NodePathData,
        completedNodeIds: Set<string>
    ): number {
        let value = 0.5; // Base value

        // Rating contribution
        if (pathData.averageRating) {
            value += (pathData.averageRating - 3) / 5; // -0.4 to +0.4
        }

        // Completion rate contribution
        value += (pathData.completionRate - 0.5) * 0.3;

        // Skills value (if course node)
        if (isCourseNode(node) && node.skills) {
            // More skills = more value
            value += Math.min(0.2, node.skills.length * 0.05);
        }

        // Connectivity bonus (more connections = more integrated)
        const connections = this.connections.filter(
            (c) => c.fromId === node.id || c.toId === node.id
        );
        value += Math.min(0.1, connections.length * 0.02);

        // Clamp to 0-1
        return Math.max(0, Math.min(1, value));
    }

    private hasValuableSkills(node: MapNode, completedNodeIds: Set<string>): boolean {
        if (!isCourseNode(node) || !node.skills) return false;

        // Check if any skills are not yet covered by completed courses
        const coveredSkills = new Set<string>();

        for (const completedId of completedNodeIds) {
            const completed = this.nodes.get(completedId);
            if (completed && isCourseNode(completed) && completed.skills) {
                completed.skills.forEach((s) => coveredSkills.add(s.toLowerCase()));
            }
        }

        return node.skills.some((skill) => !coveredSkills.has(skill.toLowerCase()));
    }

    private extractRelevantTags(node: MapNode): string[] {
        const tags: string[] = [node.domainId];

        if (isCourseNode(node) && node.skills) {
            tags.push(...node.skills.slice(0, 3));
        }

        // Extract from name
        const words = node.name.split(/\s+/);
        tags.push(...words.filter((w) => w.length > 3).slice(0, 2));

        return [...new Set(tags)];
    }

    /**
     * Compute optimal path to a target node
     */
    public computeOptimalPath(
        fromNodeId: string,
        toNodeId: string,
        completedNodeIds: Set<string>
    ): PathSuggestion | null {
        const from = this.nodes.get(fromNodeId);
        const to = this.nodes.get(toNodeId);

        if (!from || !to) return null;

        // Use Dijkstra-like algorithm with success rate as weight
        const distances = new Map<string, number>();
        const previous = new Map<string, string | null>();
        const unvisited = new Set<string>();

        // Initialize
        for (const nodeId of this.nodes.keys()) {
            distances.set(nodeId, nodeId === fromNodeId ? 0 : Infinity);
            previous.set(nodeId, null);
            unvisited.add(nodeId);
        }

        while (unvisited.size > 0) {
            // Find minimum distance node
            let minNode: string | null = null;
            let minDist = Infinity;

            for (const nodeId of unvisited) {
                const dist = distances.get(nodeId) || Infinity;
                if (dist < minDist) {
                    minDist = dist;
                    minNode = nodeId;
                }
            }

            if (minNode === null || minDist === Infinity) break;
            if (minNode === toNodeId) break;

            unvisited.delete(minNode);

            // Get neighbors
            const neighbors = this.getNeighbors(minNode);

            for (const neighborId of neighbors) {
                if (!unvisited.has(neighborId)) continue;

                // Calculate edge weight (inverse of success rate)
                const segment = this.pathFrequencies.get(`${minNode}->${neighborId}`);
                const edgeWeight = segment
                    ? 1 / segment.successRate
                    : 2; // Penalty for unknown paths

                // Bonus for already completed nodes
                const completedBonus = completedNodeIds.has(neighborId) ? 0.5 : 0;

                const newDist = minDist + edgeWeight - completedBonus;
                const currentDist = distances.get(neighborId) || Infinity;

                if (newDist < currentDist) {
                    distances.set(neighborId, newDist);
                    previous.set(neighborId, minNode);
                }
            }
        }

        // Reconstruct path
        const path: string[] = [];
        let current: string | null = toNodeId;

        while (current !== null) {
            path.unshift(current);
            current = previous.get(current) || null;
        }

        if (path[0] !== fromNodeId) {
            return null; // No path found
        }

        // Calculate estimated hours
        let totalHours = 0;
        for (const nodeId of path) {
            const node = this.nodes.get(nodeId);
            if (node && node.estimatedHours) {
                totalHours += node.estimatedHours;
            }
        }

        // Calculate confidence
        let totalSuccessRate = 0;
        let segmentCount = 0;

        for (let i = 0; i < path.length - 1; i++) {
            const segment = this.pathFrequencies.get(`${path[i]}->${path[i + 1]}`);
            if (segment) {
                totalSuccessRate += segment.successRate;
                segmentCount++;
            }
        }

        const confidence = segmentCount > 0
            ? (totalSuccessRate / segmentCount) * 0.8 + 0.2
            : 0.5;

        return {
            path,
            estimatedHours: totalHours,
            confidence,
            reasoning: `Optimal ${path.length - 1}-step path based on success rates`,
            source: "optimal",
        };
    }

    private getNeighbors(nodeId: string): string[] {
        const neighbors = new Set<string>();
        const node = this.nodes.get(nodeId);

        if (!node) return [];

        // Add children
        for (const childId of node.childIds) {
            neighbors.add(childId);
        }

        // Add connected nodes
        for (const conn of this.connections) {
            if (conn.fromId === nodeId) {
                neighbors.add(conn.toId);
            }
            if (conn.toId === nodeId && conn.type !== "contains") {
                neighbors.add(conn.fromId);
            }
        }

        // Add siblings
        if (node.parentId) {
            const parent = this.nodes.get(node.parentId);
            if (parent) {
                for (const siblingId of parent.childIds) {
                    if (siblingId !== nodeId) {
                        neighbors.add(siblingId);
                    }
                }
            }
        }

        return [...neighbors];
    }

    /**
     * Get path suggestions for a learner
     */
    public getPathSuggestions(
        currentNodeId: string,
        completedNodeIds: Set<string>,
        goalNodeId?: string,
        limit: number = 3
    ): PathSuggestion[] {
        const suggestions: PathSuggestion[] = [];
        const current = this.nodes.get(currentNodeId);

        if (!current) return suggestions;

        // 1. Popular path suggestion
        const popularNext = this.getPopularNextSteps(currentNodeId, 1);
        if (popularNext.length > 0) {
            const { node: nextNode, segment } = popularNext[0];
            suggestions.push({
                path: [currentNodeId, nextNode.id],
                estimatedHours: nextNode.estimatedHours || 1,
                confidence: segment.successRate,
                reasoning: `${segment.frequency} learners took this path with ${Math.round(segment.successRate * 100)}% success`,
                source: "popular",
            });
        }

        // 2. Optimal path to goal (if specified)
        if (goalNodeId) {
            const optimalPath = this.computeOptimalPath(currentNodeId, goalNodeId, completedNodeIds);
            if (optimalPath && optimalPath.path.length > 1) {
                suggestions.push(optimalPath);
            }
        }

        // 3. Hidden gem suggestion
        const gems = this.findHiddenGems(completedNodeIds, 1);
        if (gems.length > 0) {
            const gem = gems[0];
            suggestions.push({
                path: [currentNodeId, gem.node.id],
                estimatedHours: gem.node.estimatedHours || 1,
                confidence: gem.valueScore,
                reasoning: gem.reason,
                source: "hidden-gem",
            });
        }

        return suggestions.slice(0, limit);
    }

    /**
     * Record a learning journey event
     * (In production, this would persist to Supabase)
     */
    public recordJourneyEvent(
        learnerId: string,
        completedNodeId: string,
        currentNodeId: string | null
    ): void {
        // Find existing journey or create new
        let journey = this.journeys.find((j) => j.learnerId === learnerId);

        if (!journey) {
            journey = {
                learnerId,
                completedNodeIds: [],
                currentNodeId: null,
                timestamp: new Date(),
            };
            this.journeys.push(journey);
        }

        if (!journey.completedNodeIds.includes(completedNodeId)) {
            journey.completedNodeIds.push(completedNodeId);
        }

        journey.currentNodeId = currentNodeId;
        journey.timestamp = new Date();

        // Update path frequencies
        if (journey.completedNodeIds.length >= 2) {
            const prevNodeId = journey.completedNodeIds[journey.completedNodeIds.length - 2];
            const key = `${prevNodeId}->${completedNodeId}`;

            const existing = this.pathFrequencies.get(key);
            if (existing) {
                existing.frequency++;
            } else {
                this.pathFrequencies.set(key, {
                    fromId: prevNodeId,
                    toId: completedNodeId,
                    frequency: 1,
                    averageTimeMinutes: 30,
                    successRate: 0.7,
                });
            }
        }
    }

    /**
     * Get path data for a node
     */
    public getNodePathData(nodeId: string): NodePathData | null {
        return this.nodePathData.get(nodeId) || null;
    }

    /**
     * Get completion statistics
     */
    public getCompletionStats(): {
        totalCompletions: number;
        uniquePaths: number;
        avgCompletionRate: number;
    } {
        let totalCompletions = 0;
        let totalCompletionRate = 0;
        let nodeCount = 0;

        for (const data of this.nodePathData.values()) {
            totalCompletions += data.completions;
            totalCompletionRate += data.completionRate;
            nodeCount++;
        }

        return {
            totalCompletions,
            uniquePaths: this.pathFrequencies.size,
            avgCompletionRate: nodeCount > 0 ? totalCompletionRate / nodeCount : 0,
        };
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a path analyzer instance
 */
export function createPathAnalyzer(
    nodes: Map<string, MapNode>,
    connections: MapConnection[],
    similarityCalculator?: SimilarityCalculator,
    options?: PathAnalysisOptions
): PathAnalyzer {
    return new PathAnalyzer(nodes, connections, similarityCalculator, options);
}
