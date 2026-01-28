/**
 * Recommendation Engine
 *
 * Smart node recommendations for the Knowledge Map Navigator.
 * Generates personalized suggestions based on learner profile,
 * learning history, and collective intelligence.
 *
 * Recommendation Types:
 * - "Up Next": Optimal next steps based on current position
 * - "Related": Similar content based on tags/skills
 * - "Prerequisites": Missing foundations with warnings
 * - "Popular": What others did from this position
 * - "Hidden Gems": Underexplored high-value content
 */

import type { MapNode, MapConnection, NodeStatus } from "./types";
import { isCourseNode, isChapterNode, getLevelDepth } from "./types";
import {
    SimilarityCalculator,
    createSimilarityCalculator,
    type SimilarNode,
    type PrerequisiteGap,
    type NodeRelationship,
} from "./similarityCalculator";
import {
    PathAnalyzer,
    createPathAnalyzer,
    type PathSuggestion,
    type HiddenGem,
    type NodePathData,
} from "./pathAnalyzer";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Recommendation type
 */
export type RecommendationType =
    | "up-next"       // Optimal next step
    | "related"       // Similar content
    | "prerequisite"  // Missing foundation
    | "popular"       // Popular path from here
    | "hidden-gem"    // Underexplored valuable content
    | "continue"      // Continue where you left off
    | "explore";      // Cross-domain exploration

/**
 * A single recommendation
 */
export interface Recommendation {
    /** Unique ID for this recommendation */
    id: string;
    /** Recommended node */
    node: MapNode;
    /** Type of recommendation */
    type: RecommendationType;
    /** Confidence score (0-1) */
    confidence: number;
    /** Human-readable reason */
    reason: string;
    /** Detailed explanation */
    explanation: string;
    /** Priority (higher = show first) */
    priority: number;
    /** Can this be dismissed */
    dismissable: boolean;
    /** Additional metadata */
    metadata: RecommendationMetadata;
}

/**
 * Recommendation metadata
 */
export interface RecommendationMetadata {
    /** Relationship to current/reference node */
    relationship?: NodeRelationship;
    /** Similarity score if applicable */
    similarityScore?: number;
    /** Path frequency if popular */
    pathFrequency?: number;
    /** Success rate if available */
    successRate?: number;
    /** Estimated time to complete */
    estimatedMinutes?: number;
    /** Skills/tags that triggered this recommendation */
    relevantSkills?: string[];
    /** Source algorithm */
    algorithm: string;
}

/**
 * Recommendation request options
 */
export interface RecommendationOptions {
    /** Reference node ID (current position) */
    referenceNodeId?: string;
    /** Learner's completed node IDs */
    completedNodeIds?: Set<string>;
    /** Learner's in-progress node IDs */
    inProgressNodeIds?: Set<string>;
    /** Target goal node ID (if learner has a goal) */
    goalNodeId?: string;
    /** Learner's skill interests */
    skillInterests?: string[];
    /** Previously dismissed recommendation IDs */
    dismissedIds?: Set<string>;
    /** Maximum recommendations to return */
    limit?: number;
    /** Minimum confidence threshold */
    minConfidence?: number;
    /** Include specific recommendation types */
    includeTypes?: RecommendationType[];
    /** Exclude specific recommendation types */
    excludeTypes?: RecommendationType[];
}

/**
 * Batch of recommendations with metadata
 */
export interface RecommendationBatch {
    /** All recommendations */
    recommendations: Recommendation[];
    /** Recommendations grouped by type */
    byType: Record<RecommendationType, Recommendation[]>;
    /** Top "Up Next" recommendation */
    upNext: Recommendation | null;
    /** Prerequisite warnings */
    prerequisiteWarnings: PrerequisiteWarning[];
    /** Hidden gems discovered */
    hiddenGems: Recommendation[];
    /** Generation timestamp */
    generatedAt: Date;
    /** Cache key for invalidation */
    cacheKey: string;
}

/**
 * Prerequisite warning
 */
export interface PrerequisiteWarning {
    /** Node that has missing prerequisites */
    targetNode: MapNode;
    /** Missing prerequisites */
    missingPrerequisites: Array<{
        node: MapNode;
        importance: number;
        isSkippable: boolean;
        reason: string;
    }>;
    /** Overall severity (0-1, higher = more critical) */
    severity: number;
    /** Recommendation: proceed, review, or stop */
    action: "proceed" | "review" | "stop";
}

/**
 * Learner profile for personalization
 */
export interface LearnerProfile {
    /** Learner ID */
    id: string;
    /** Preferred learning pace */
    pace: "fast" | "moderate" | "thorough";
    /** Preferred content types */
    preferredContentTypes: string[];
    /** Skill interests */
    skillInterests: string[];
    /** Learning goals */
    goals: string[];
    /** Dismissed recommendation IDs */
    dismissedRecommendations: Set<string>;
    /** Feedback on past recommendations */
    feedback: Map<string, "helpful" | "not-helpful">;
}

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<RecommendationOptions, "referenceNodeId" | "goalNodeId" | "skillInterests">> = {
    completedNodeIds: new Set(),
    inProgressNodeIds: new Set(),
    dismissedIds: new Set(),
    limit: 10,
    minConfidence: 0.3,
    includeTypes: ["up-next", "related", "prerequisite", "popular", "hidden-gem", "continue", "explore"],
    excludeTypes: [],
};

// ============================================================================
// RECOMMENDATION ENGINE CLASS
// ============================================================================

export class RecommendationEngine {
    private nodes: Map<string, MapNode>;
    private connections: MapConnection[];
    private similarityCalculator: SimilarityCalculator;
    private pathAnalyzer: PathAnalyzer;

    // Caches
    private recommendationCache: Map<string, RecommendationBatch> = new Map();
    private cacheTimeout: number = 60000; // 1 minute

    constructor(
        nodes: Map<string, MapNode>,
        connections: MapConnection[]
    ) {
        this.nodes = nodes;
        this.connections = connections;
        this.similarityCalculator = createSimilarityCalculator(nodes, connections);
        this.pathAnalyzer = createPathAnalyzer(nodes, connections, this.similarityCalculator);
    }

    /**
     * Generate recommendations for a learner
     */
    public generateRecommendations(options: RecommendationOptions = {}): RecommendationBatch {
        const opts = { ...DEFAULT_OPTIONS, ...options };
        const cacheKey = this.generateCacheKey(opts);

        // Check cache
        const cached = this.recommendationCache.get(cacheKey);
        if (cached && Date.now() - cached.generatedAt.getTime() < this.cacheTimeout) {
            return cached;
        }

        const recommendations: Recommendation[] = [];
        const activeTypes = opts.includeTypes.filter((t) => !opts.excludeTypes.includes(t));

        // 1. Generate "Continue" recommendations (in-progress nodes)
        if (activeTypes.includes("continue")) {
            recommendations.push(...this.generateContinueRecommendations(opts));
        }

        // 2. Generate "Up Next" recommendations
        if (activeTypes.includes("up-next") && opts.referenceNodeId) {
            recommendations.push(...this.generateUpNextRecommendations(opts));
        }

        // 3. Generate "Related" recommendations
        if (activeTypes.includes("related") && opts.referenceNodeId) {
            recommendations.push(...this.generateRelatedRecommendations(opts));
        }

        // 4. Generate "Popular" recommendations
        if (activeTypes.includes("popular") && opts.referenceNodeId) {
            recommendations.push(...this.generatePopularRecommendations(opts));
        }

        // 5. Generate "Hidden Gem" recommendations
        if (activeTypes.includes("hidden-gem")) {
            recommendations.push(...this.generateHiddenGemRecommendations(opts));
        }

        // 6. Generate "Explore" recommendations (cross-domain)
        if (activeTypes.includes("explore")) {
            recommendations.push(...this.generateExploreRecommendations(opts));
        }

        // Filter by confidence and dismissals
        const filteredRecs = recommendations.filter(
            (r) => r.confidence >= opts.minConfidence && !opts.dismissedIds.has(r.id)
        );

        // Sort by priority and confidence
        filteredRecs.sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            return b.confidence - a.confidence;
        });

        // Limit results
        const limitedRecs = filteredRecs.slice(0, opts.limit);

        // Generate prerequisite warnings
        const prerequisiteWarnings = this.generatePrerequisiteWarnings(opts);

        // Build batch
        const batch: RecommendationBatch = {
            recommendations: limitedRecs,
            byType: this.groupByType(limitedRecs),
            upNext: limitedRecs.find((r) => r.type === "up-next") || null,
            prerequisiteWarnings,
            hiddenGems: limitedRecs.filter((r) => r.type === "hidden-gem"),
            generatedAt: new Date(),
            cacheKey,
        };

        // Cache result
        this.recommendationCache.set(cacheKey, batch);

        return batch;
    }

    /**
     * Generate cache key for options
     */
    private generateCacheKey(opts: RecommendationOptions): string {
        const parts = [
            opts.referenceNodeId || "none",
            opts.goalNodeId || "none",
            opts.completedNodeIds?.size || 0,
            opts.inProgressNodeIds?.size || 0,
            opts.skillInterests?.join(",") || "",
        ];
        return parts.join("|");
    }

    /**
     * Group recommendations by type
     */
    private groupByType(recs: Recommendation[]): Record<RecommendationType, Recommendation[]> {
        const grouped: Record<RecommendationType, Recommendation[]> = {
            "up-next": [],
            related: [],
            prerequisite: [],
            popular: [],
            "hidden-gem": [],
            continue: [],
            explore: [],
        };

        for (const rec of recs) {
            grouped[rec.type].push(rec);
        }

        return grouped;
    }

    /**
     * Generate "Continue" recommendations
     */
    private generateContinueRecommendations(opts: RecommendationOptions): Recommendation[] {
        const recs: Recommendation[] = [];

        for (const nodeId of opts.inProgressNodeIds || []) {
            const node = this.nodes.get(nodeId);
            if (!node) continue;

            recs.push({
                id: `continue-${nodeId}`,
                node,
                type: "continue",
                confidence: 0.95,
                reason: "Continue where you left off",
                explanation: `You've made progress on "${node.name}" (${node.progress}% complete). Pick up where you left off!`,
                priority: 100, // Highest priority
                dismissable: false,
                metadata: {
                    algorithm: "in-progress-detection",
                    estimatedMinutes: this.estimateRemainingTime(node),
                },
            });
        }

        return recs;
    }

    /**
     * Generate "Up Next" recommendations
     */
    private generateUpNextRecommendations(opts: RecommendationOptions): Recommendation[] {
        if (!opts.referenceNodeId) return [];

        const recs: Recommendation[] = [];
        const reference = this.nodes.get(opts.referenceNodeId);
        if (!reference) return [];

        // Get path suggestions from analyzer
        const pathSuggestions = this.pathAnalyzer.getPathSuggestions(
            opts.referenceNodeId,
            opts.completedNodeIds || new Set(),
            opts.goalNodeId,
            3
        );

        for (const suggestion of pathSuggestions) {
            // Get the immediate next node in the path
            const nextNodeId = suggestion.path[1];
            if (!nextNodeId) continue;

            const nextNode = this.nodes.get(nextNodeId);
            if (!nextNode) continue;

            // Skip completed nodes
            if (opts.completedNodeIds?.has(nextNodeId)) continue;

            recs.push({
                id: `up-next-${nextNodeId}`,
                node: nextNode,
                type: "up-next",
                confidence: suggestion.confidence,
                reason: this.formatUpNextReason(suggestion),
                explanation: suggestion.reasoning,
                priority: 90,
                dismissable: true,
                metadata: {
                    algorithm: suggestion.source,
                    successRate: suggestion.confidence,
                    estimatedMinutes: (nextNode.estimatedHours || 1) * 60,
                },
            });
        }

        // Add children as potential next steps
        for (const childId of reference.childIds.slice(0, 2)) {
            if (opts.completedNodeIds?.has(childId)) continue;
            if (recs.find((r) => r.node.id === childId)) continue;

            const child = this.nodes.get(childId);
            if (!child) continue;

            recs.push({
                id: `up-next-child-${childId}`,
                node: child,
                type: "up-next",
                confidence: 0.85,
                reason: "Dive deeper into this topic",
                explanation: `Explore "${child.name}" as part of ${reference.name}`,
                priority: 85,
                dismissable: true,
                metadata: {
                    relationship: "descendant",
                    algorithm: "hierarchy-next",
                    estimatedMinutes: (child.estimatedHours || 0.5) * 60,
                },
            });
        }

        return recs;
    }

    private formatUpNextReason(suggestion: PathSuggestion): string {
        switch (suggestion.source) {
            case "popular":
                return "Most popular next step";
            case "optimal":
                return "Optimal path to your goal";
            case "hidden-gem":
                return "Discover something new";
            case "personalized":
                return "Recommended for you";
            default:
                return "Suggested next step";
        }
    }

    /**
     * Generate "Related" recommendations
     */
    private generateRelatedRecommendations(opts: RecommendationOptions): Recommendation[] {
        if (!opts.referenceNodeId) return [];

        const recs: Recommendation[] = [];

        // Get similar nodes
        const similarNodes = this.similarityCalculator.findSimilarNodes(opts.referenceNodeId, {
            limit: 5,
            minSimilarity: 0.3,
            excludeIds: new Set([
                ...(opts.completedNodeIds || []),
                ...(opts.inProgressNodeIds || []),
                opts.referenceNodeId,
            ]),
        });

        for (const { node, similarity, relationship } of similarNodes) {
            recs.push({
                id: `related-${node.id}`,
                node,
                type: "related",
                confidence: similarity.overall,
                reason: this.formatRelatedReason(relationship, similarity),
                explanation: this.formatRelatedExplanation(node, similarity),
                priority: 70 + Math.floor(similarity.overall * 20),
                dismissable: true,
                metadata: {
                    relationship,
                    similarityScore: similarity.overall,
                    algorithm: "similarity-calculator",
                    relevantSkills: this.extractMatchingSkills(opts.referenceNodeId, node.id),
                },
            });
        }

        return recs;
    }

    private formatRelatedReason(relationship: NodeRelationship, similarity: { tagOverlap: number }): string {
        if (similarity.tagOverlap > 0.5) return "Covers similar topics";
        if (relationship === "sibling") return "Related content";
        if (relationship === "same-domain") return "Same learning domain";
        if (relationship === "cross-domain") return "Cross-domain connection";
        return "Related content";
    }

    private formatRelatedExplanation(node: MapNode, similarity: { overall: number; tagOverlap: number }): string {
        const matchPercent = Math.round(similarity.overall * 100);
        return `"${node.name}" shares ${matchPercent}% similarity with your current topic`;
    }

    private extractMatchingSkills(nodeAId: string, nodeBId: string): string[] {
        const nodeA = this.nodes.get(nodeAId);
        const nodeB = this.nodes.get(nodeBId);

        if (!nodeA || !nodeB) return [];

        const skillsA = isCourseNode(nodeA) && nodeA.skills ? new Set(nodeA.skills.map((s) => s.toLowerCase())) : new Set<string>();
        const skillsB = isCourseNode(nodeB) && nodeB.skills ? new Set(nodeB.skills.map((s) => s.toLowerCase())) : new Set<string>();

        return [...skillsA].filter((s) => skillsB.has(s));
    }

    /**
     * Generate "Popular" recommendations
     */
    private generatePopularRecommendations(opts: RecommendationOptions): Recommendation[] {
        if (!opts.referenceNodeId) return [];

        const recs: Recommendation[] = [];
        const popularNext = this.pathAnalyzer.getPopularNextSteps(opts.referenceNodeId, 3);

        for (const { node, segment } of popularNext) {
            // Skip if already recommended or completed
            if (opts.completedNodeIds?.has(node.id)) continue;

            recs.push({
                id: `popular-${node.id}`,
                node,
                type: "popular",
                confidence: segment.successRate,
                reason: `${segment.frequency} learners chose this path`,
                explanation: `After completing your current topic, ${segment.frequency} other learners moved on to "${node.name}" with ${Math.round(segment.successRate * 100)}% success rate`,
                priority: 75,
                dismissable: true,
                metadata: {
                    pathFrequency: segment.frequency,
                    successRate: segment.successRate,
                    algorithm: "path-frequency",
                    estimatedMinutes: segment.averageTimeMinutes,
                },
            });
        }

        return recs;
    }

    /**
     * Generate "Hidden Gem" recommendations
     */
    private generateHiddenGemRecommendations(opts: RecommendationOptions): Recommendation[] {
        const recs: Recommendation[] = [];
        const gems = this.pathAnalyzer.findHiddenGems(opts.completedNodeIds || new Set(), 3);

        for (const gem of gems) {
            recs.push({
                id: `gem-${gem.node.id}`,
                node: gem.node,
                type: "hidden-gem",
                confidence: gem.gemScore,
                reason: gem.reason,
                explanation: `"${gem.node.name}" is an underexplored topic with high value. ${gem.reason}`,
                priority: 65,
                dismissable: true,
                metadata: {
                    algorithm: "hidden-gem-detector",
                    relevantSkills: gem.relevantTags,
                    estimatedMinutes: (gem.node.estimatedHours || 1) * 60,
                },
            });
        }

        return recs;
    }

    /**
     * Generate "Explore" recommendations (cross-domain)
     */
    private generateExploreRecommendations(opts: RecommendationOptions): Recommendation[] {
        const recs: Recommendation[] = [];

        // Get reference node's domain
        const refDomain = opts.referenceNodeId
            ? this.nodes.get(opts.referenceNodeId)?.domainId
            : null;

        // Find high-value nodes in other domains
        for (const [nodeId, node] of this.nodes) {
            // Skip same domain
            if (refDomain && node.domainId === refDomain) continue;

            // Skip completed/in-progress
            if (opts.completedNodeIds?.has(nodeId)) continue;
            if (opts.inProgressNodeIds?.has(nodeId)) continue;

            // Only consider course-level nodes for exploration
            if (!isCourseNode(node)) continue;

            // Check if matches skill interests
            const matchesInterests = opts.skillInterests?.some((skill) =>
                node.skills?.some((s) => s.toLowerCase().includes(skill.toLowerCase()))
            );

            if (matchesInterests) {
                recs.push({
                    id: `explore-${nodeId}`,
                    node,
                    type: "explore",
                    confidence: 0.6,
                    reason: "Expand your horizons",
                    explanation: `"${node.name}" in ${node.domainId} matches your interests and could broaden your skill set`,
                    priority: 50,
                    dismissable: true,
                    metadata: {
                        relationship: "cross-domain",
                        algorithm: "interest-matching",
                        relevantSkills: opts.skillInterests?.filter((s) =>
                            node.skills?.some((ns) => ns.toLowerCase().includes(s.toLowerCase()))
                        ),
                        estimatedMinutes: (node.estimatedHours || 2) * 60,
                    },
                });
            }
        }

        return recs.slice(0, 2);
    }

    /**
     * Generate prerequisite warnings
     */
    private generatePrerequisiteWarnings(opts: RecommendationOptions): PrerequisiteWarning[] {
        const warnings: PrerequisiteWarning[] = [];

        // Check in-progress nodes for prerequisite gaps
        for (const nodeId of opts.inProgressNodeIds || []) {
            const gaps = this.similarityCalculator.findPrerequisiteGaps(
                nodeId,
                opts.completedNodeIds || new Set()
            );

            if (gaps.length === 0) continue;

            const node = this.nodes.get(nodeId);
            if (!node) continue;

            // Calculate severity
            const criticalGaps = gaps.filter((g) => !g.isSkippable && g.importance > 0.7);
            const severity = criticalGaps.length > 0
                ? Math.min(1, criticalGaps.reduce((sum, g) => sum + g.importance, 0) / criticalGaps.length)
                : 0.3;

            // Determine action
            let action: PrerequisiteWarning["action"] = "proceed";
            if (severity > 0.7) action = "stop";
            else if (severity > 0.4) action = "review";

            warnings.push({
                targetNode: node,
                missingPrerequisites: gaps.map((gap) => ({
                    node: gap.prerequisite,
                    importance: gap.importance,
                    isSkippable: gap.isSkippable,
                    reason: gap.reason,
                })),
                severity,
                action,
            });
        }

        // Sort by severity
        warnings.sort((a, b) => b.severity - a.severity);

        return warnings;
    }

    /**
     * Estimate remaining time for a node
     */
    private estimateRemainingTime(node: MapNode): number {
        const totalMinutes = (node.estimatedHours || 1) * 60;
        const completedMinutes = (node.progress / 100) * totalMinutes;
        return Math.max(5, Math.round(totalMinutes - completedMinutes));
    }

    /**
     * Dismiss a recommendation
     */
    public dismissRecommendation(recommendationId: string): void {
        // Clear cache to regenerate without this recommendation
        this.recommendationCache.clear();
    }

    /**
     * Record feedback on a recommendation
     */
    public recordFeedback(
        recommendationId: string,
        feedback: "helpful" | "not-helpful"
    ): void {
        // In production, this would persist to database for algorithm improvement
        console.log(`Feedback recorded: ${recommendationId} = ${feedback}`);
    }

    /**
     * Get recommendation by ID
     */
    public getRecommendation(id: string, batch: RecommendationBatch): Recommendation | null {
        return batch.recommendations.find((r) => r.id === id) || null;
    }

    /**
     * Invalidate cache for a node (call when progress changes)
     */
    public invalidateCacheForNode(nodeId: string): void {
        // Remove any cached batches that reference this node
        for (const [key, batch] of this.recommendationCache) {
            if (key.includes(nodeId) ||
                batch.recommendations.some((r) => r.node.id === nodeId)) {
                this.recommendationCache.delete(key);
            }
        }
    }

    /**
     * Clear all cached recommendations
     */
    public clearCache(): void {
        this.recommendationCache.clear();
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a recommendation engine instance
 */
export function createRecommendationEngine(
    nodes: Map<string, MapNode>,
    connections: MapConnection[]
): RecommendationEngine {
    return new RecommendationEngine(nodes, connections);
}

// ============================================================================
// REACT HOOK SUPPORT
// ============================================================================

/**
 * Context value type for recommendation engine
 */
export interface RecommendationEngineContextValue {
    engine: RecommendationEngine;
    getRecommendations: (options?: RecommendationOptions) => RecommendationBatch;
    dismissRecommendation: (id: string) => void;
    recordFeedback: (id: string, feedback: "helpful" | "not-helpful") => void;
}
