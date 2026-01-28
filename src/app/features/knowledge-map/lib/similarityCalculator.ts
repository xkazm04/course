/**
 * Similarity Calculator
 *
 * Computes relationships and similarity scores between knowledge map nodes.
 * Used by the recommendation engine to find related content and suggest
 * optimal learning paths.
 *
 * Similarity Factors:
 * - Tag/Skill overlap
 * - Dependency distance (prerequisite chains)
 * - Domain proximity
 * - Level alignment
 * - Content type matching
 */

import type {
    MapNode,
    MapConnection,
    NodeLevel,
    ConnectionType,
    DifficultyLevel,
} from "./types";
import {
    isDomainNode,
    isCourseNode,
    isChapterNode,
    isSectionNode,
    isConceptNode,
    getLevelDepth,
} from "./types";
import type { LearningDomainId } from "@/app/shared/lib/learningDomains";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Similarity score breakdown
 */
export interface SimilarityScore {
    /** Overall similarity (0-1) */
    overall: number;
    /** Tag/skill overlap contribution */
    tagOverlap: number;
    /** Dependency distance contribution */
    dependencyDistance: number;
    /** Domain proximity contribution */
    domainProximity: number;
    /** Level alignment contribution */
    levelAlignment: number;
    /** Content type similarity */
    contentTypeSimilarity: number;
}

/**
 * Similarity weights for different factors
 */
export interface SimilarityWeights {
    tagOverlap: number;
    dependencyDistance: number;
    domainProximity: number;
    levelAlignment: number;
    contentTypeSimilarity: number;
}

/**
 * Node with computed similarity to a reference node
 */
export interface SimilarNode {
    node: MapNode;
    similarity: SimilarityScore;
    relationship: NodeRelationship;
}

/**
 * Relationship type between nodes
 */
export type NodeRelationship =
    | "prerequisite"      // Target is a prerequisite of reference
    | "dependent"         // Target depends on reference
    | "sibling"           // Same parent
    | "ancestor"          // Target is an ancestor of reference
    | "descendant"        // Target is a descendant of reference
    | "related"           // Has "related" connection
    | "same-domain"       // Same learning domain
    | "cross-domain"      // Different domain but similar content
    | "sequential"        // Connected via "next" relationship
    | "none";             // No direct relationship

/**
 * Prerequisite gap information
 */
export interface PrerequisiteGap {
    /** Missing prerequisite node */
    prerequisite: MapNode;
    /** How important is this prerequisite (0-1) */
    importance: number;
    /** Chain depth (how many steps away) */
    depth: number;
    /** Whether it can be skipped */
    isSkippable: boolean;
    /** Reason why it's needed */
    reason: string;
}

/**
 * Domain similarity matrix
 */
const DOMAIN_SIMILARITY: Record<LearningDomainId, Record<LearningDomainId, number>> = {
    frontend: { frontend: 1.0, backend: 0.4, fullstack: 0.8, databases: 0.3, mobile: 0.6, games: 0.3 },
    backend: { frontend: 0.4, backend: 1.0, fullstack: 0.8, databases: 0.7, mobile: 0.5, games: 0.3 },
    fullstack: { frontend: 0.8, backend: 0.8, fullstack: 1.0, databases: 0.6, mobile: 0.6, games: 0.4 },
    databases: { frontend: 0.3, backend: 0.7, fullstack: 0.6, databases: 1.0, mobile: 0.3, games: 0.2 },
    mobile: { frontend: 0.6, backend: 0.5, fullstack: 0.6, databases: 0.3, mobile: 1.0, games: 0.4 },
    games: { frontend: 0.3, backend: 0.3, fullstack: 0.4, databases: 0.2, mobile: 0.4, games: 1.0 },
};

/**
 * Default similarity weights
 */
export const DEFAULT_SIMILARITY_WEIGHTS: SimilarityWeights = {
    tagOverlap: 0.35,
    dependencyDistance: 0.25,
    domainProximity: 0.15,
    levelAlignment: 0.15,
    contentTypeSimilarity: 0.10,
};

// ============================================================================
// SIMILARITY CALCULATOR CLASS
// ============================================================================

export class SimilarityCalculator {
    private nodes: Map<string, MapNode>;
    private connections: MapConnection[];
    private weights: SimilarityWeights;

    // Cached computations
    private prerequisiteCache: Map<string, Set<string>> = new Map();
    private dependentCache: Map<string, Set<string>> = new Map();
    private ancestorCache: Map<string, string[]> = new Map();

    constructor(
        nodes: Map<string, MapNode>,
        connections: MapConnection[],
        weights: SimilarityWeights = DEFAULT_SIMILARITY_WEIGHTS
    ) {
        this.nodes = nodes;
        this.connections = connections;
        this.weights = weights;
        this.buildCaches();
    }

    /**
     * Build caches for efficient lookups
     */
    private buildCaches(): void {
        // Build prerequisite and dependent caches from connections
        for (const conn of this.connections) {
            if (conn.type === "prerequisite") {
                // fromId is prerequisite of toId
                if (!this.prerequisiteCache.has(conn.toId)) {
                    this.prerequisiteCache.set(conn.toId, new Set());
                }
                this.prerequisiteCache.get(conn.toId)!.add(conn.fromId);

                // toId depends on fromId
                if (!this.dependentCache.has(conn.fromId)) {
                    this.dependentCache.set(conn.fromId, new Set());
                }
                this.dependentCache.get(conn.fromId)!.add(conn.toId);
            }
        }

        // Build ancestor cache
        for (const node of this.nodes.values()) {
            this.ancestorCache.set(node.id, this.computeAncestors(node.id));
        }
    }

    /**
     * Compute ancestors for a node
     */
    private computeAncestors(nodeId: string): string[] {
        const ancestors: string[] = [];
        let current = this.nodes.get(nodeId);

        while (current && current.parentId) {
            ancestors.push(current.parentId);
            current = this.nodes.get(current.parentId);
        }

        return ancestors;
    }

    /**
     * Calculate similarity between two nodes
     */
    public calculateSimilarity(nodeAId: string, nodeBId: string): SimilarityScore {
        const nodeA = this.nodes.get(nodeAId);
        const nodeB = this.nodes.get(nodeBId);

        if (!nodeA || !nodeB || nodeAId === nodeBId) {
            return {
                overall: 0,
                tagOverlap: 0,
                dependencyDistance: 0,
                domainProximity: 0,
                levelAlignment: 0,
                contentTypeSimilarity: 0,
            };
        }

        // Calculate individual scores
        const tagOverlap = this.calculateTagOverlap(nodeA, nodeB);
        const dependencyDistance = this.calculateDependencyDistance(nodeA, nodeB);
        const domainProximity = this.calculateDomainProximity(nodeA, nodeB);
        const levelAlignment = this.calculateLevelAlignment(nodeA, nodeB);
        const contentTypeSimilarity = this.calculateContentTypeSimilarity(nodeA, nodeB);

        // Calculate weighted overall score
        const overall =
            tagOverlap * this.weights.tagOverlap +
            dependencyDistance * this.weights.dependencyDistance +
            domainProximity * this.weights.domainProximity +
            levelAlignment * this.weights.levelAlignment +
            contentTypeSimilarity * this.weights.contentTypeSimilarity;

        return {
            overall: Math.min(1, Math.max(0, overall)),
            tagOverlap,
            dependencyDistance,
            domainProximity,
            levelAlignment,
            contentTypeSimilarity,
        };
    }

    /**
     * Calculate tag/skill overlap between nodes
     */
    private calculateTagOverlap(nodeA: MapNode, nodeB: MapNode): number {
        const tagsA = this.extractTags(nodeA);
        const tagsB = this.extractTags(nodeB);

        if (tagsA.size === 0 || tagsB.size === 0) {
            // Fall back to name similarity
            return this.calculateNameSimilarity(nodeA.name, nodeB.name);
        }

        // Jaccard similarity
        const intersection = new Set([...tagsA].filter((x) => tagsB.has(x)));
        const union = new Set([...tagsA, ...tagsB]);

        return intersection.size / union.size;
    }

    /**
     * Extract tags/skills from a node
     */
    private extractTags(node: MapNode): Set<string> {
        const tags = new Set<string>();

        // Add domain as a tag
        tags.add(node.domainId.toLowerCase());

        // Extract from name (split on common separators)
        const nameWords = node.name.toLowerCase().split(/[\s\-_:]+/);
        nameWords.forEach((word) => {
            if (word.length > 2) tags.add(word);
        });

        // Add skills if course node
        if (isCourseNode(node) && node.skills) {
            node.skills.forEach((skill) => tags.add(skill.toLowerCase()));
        }

        // Add related concepts if concept node
        if (isConceptNode(node) && node.relatedConcepts) {
            node.relatedConcepts.forEach((id) => tags.add(id.toLowerCase()));
        }

        return tags;
    }

    /**
     * Calculate name similarity using Levenshtein-based approach
     */
    private calculateNameSimilarity(nameA: string, nameB: string): number {
        const a = nameA.toLowerCase();
        const b = nameB.toLowerCase();

        // Check for exact match or containment
        if (a === b) return 1;
        if (a.includes(b) || b.includes(a)) return 0.8;

        // Word overlap
        const wordsA = new Set(a.split(/\s+/));
        const wordsB = new Set(b.split(/\s+/));
        const intersection = [...wordsA].filter((x) => wordsB.has(x));

        if (intersection.length > 0) {
            return intersection.length / Math.max(wordsA.size, wordsB.size);
        }

        return 0;
    }

    /**
     * Calculate dependency distance score
     * Higher score = closer in dependency graph
     */
    private calculateDependencyDistance(nodeA: MapNode, nodeB: MapNode): number {
        // Check direct prerequisite relationship
        const prereqsA = this.prerequisiteCache.get(nodeA.id) || new Set();
        const prereqsB = this.prerequisiteCache.get(nodeB.id) || new Set();

        if (prereqsA.has(nodeB.id) || prereqsB.has(nodeA.id)) {
            return 1.0; // Direct prerequisite
        }

        // Check shared prerequisites
        const sharedPrereqs = [...prereqsA].filter((x) => prereqsB.has(x));
        if (sharedPrereqs.length > 0) {
            return 0.7 + (0.2 * sharedPrereqs.length / Math.max(prereqsA.size, prereqsB.size));
        }

        // Check if in same chain (A -> ... -> B or B -> ... -> A)
        const chainDistance = this.findChainDistance(nodeA.id, nodeB.id);
        if (chainDistance > 0 && chainDistance <= 5) {
            return 0.5 / chainDistance;
        }

        // Check sibling relationship (same parent)
        if (nodeA.parentId && nodeA.parentId === nodeB.parentId) {
            return 0.6;
        }

        return 0;
    }

    /**
     * Find distance in prerequisite chain
     */
    private findChainDistance(startId: string, endId: string, maxDepth: number = 5): number {
        const visited = new Set<string>();
        const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];

        while (queue.length > 0) {
            const { id, depth } = queue.shift()!;

            if (id === endId) return depth;
            if (depth >= maxDepth || visited.has(id)) continue;

            visited.add(id);

            // Check both directions
            const prereqs = this.prerequisiteCache.get(id) || new Set();
            const dependents = this.dependentCache.get(id) || new Set();

            for (const nextId of [...prereqs, ...dependents]) {
                if (!visited.has(nextId)) {
                    queue.push({ id: nextId, depth: depth + 1 });
                }
            }
        }

        return -1; // Not connected
    }

    /**
     * Calculate domain proximity score
     */
    private calculateDomainProximity(nodeA: MapNode, nodeB: MapNode): number {
        return DOMAIN_SIMILARITY[nodeA.domainId]?.[nodeB.domainId] ?? 0;
    }

    /**
     * Calculate level alignment score
     */
    private calculateLevelAlignment(nodeA: MapNode, nodeB: MapNode): number {
        const depthA = getLevelDepth(nodeA.level);
        const depthB = getLevelDepth(nodeB.level);
        const diff = Math.abs(depthA - depthB);

        // Same level = 1.0, adjacent levels = 0.7, etc.
        return Math.max(0, 1 - diff * 0.3);
    }

    /**
     * Calculate content type similarity
     */
    private calculateContentTypeSimilarity(nodeA: MapNode, nodeB: MapNode): number {
        // Check difficulty alignment for courses
        if (isCourseNode(nodeA) && isCourseNode(nodeB)) {
            return this.calculateDifficultySimilarity(nodeA.difficulty, nodeB.difficulty);
        }

        // Check section type alignment
        if (isSectionNode(nodeA) && isSectionNode(nodeB)) {
            return nodeA.sectionType === nodeB.sectionType ? 1.0 : 0.3;
        }

        // Check concept type alignment
        if (isConceptNode(nodeA) && isConceptNode(nodeB)) {
            return nodeA.conceptType === nodeB.conceptType ? 1.0 : 0.3;
        }

        return 0.5; // Default for mixed types
    }

    /**
     * Calculate difficulty similarity
     */
    private calculateDifficultySimilarity(diffA: DifficultyLevel, diffB: DifficultyLevel): number {
        const levels: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];
        const indexA = levels.indexOf(diffA);
        const indexB = levels.indexOf(diffB);
        const diff = Math.abs(indexA - indexB);

        return 1 - diff * 0.4;
    }

    /**
     * Find similar nodes to a reference node
     */
    public findSimilarNodes(
        referenceId: string,
        options: {
            limit?: number;
            minSimilarity?: number;
            excludeIds?: Set<string>;
            sameLevel?: boolean;
            sameDomain?: boolean;
        } = {}
    ): SimilarNode[] {
        const {
            limit = 10,
            minSimilarity = 0.1,
            excludeIds = new Set(),
            sameLevel = false,
            sameDomain = false,
        } = options;

        const reference = this.nodes.get(referenceId);
        if (!reference) return [];

        const results: SimilarNode[] = [];

        for (const [nodeId, node] of this.nodes) {
            // Skip self and excluded nodes
            if (nodeId === referenceId || excludeIds.has(nodeId)) continue;

            // Apply filters
            if (sameLevel && node.level !== reference.level) continue;
            if (sameDomain && node.domainId !== reference.domainId) continue;

            // Calculate similarity
            const similarity = this.calculateSimilarity(referenceId, nodeId);

            if (similarity.overall >= minSimilarity) {
                const relationship = this.determineRelationship(referenceId, nodeId);
                results.push({ node, similarity, relationship });
            }
        }

        // Sort by similarity descending
        results.sort((a, b) => b.similarity.overall - a.similarity.overall);

        return results.slice(0, limit);
    }

    /**
     * Determine the relationship between two nodes
     */
    public determineRelationship(referenceId: string, targetId: string): NodeRelationship {
        const reference = this.nodes.get(referenceId);
        const target = this.nodes.get(targetId);

        if (!reference || !target) return "none";

        // Check direct connections
        for (const conn of this.connections) {
            if (conn.fromId === referenceId && conn.toId === targetId) {
                if (conn.type === "prerequisite") return "dependent";
                if (conn.type === "related") return "related";
                if (conn.type === "next") return "sequential";
            }
            if (conn.fromId === targetId && conn.toId === referenceId) {
                if (conn.type === "prerequisite") return "prerequisite";
                if (conn.type === "related") return "related";
                if (conn.type === "next") return "sequential";
            }
        }

        // Check hierarchy relationships
        const refAncestors = this.ancestorCache.get(referenceId) || [];
        const targetAncestors = this.ancestorCache.get(targetId) || [];

        if (refAncestors.includes(targetId)) return "ancestor";
        if (targetAncestors.includes(referenceId)) return "descendant";

        // Check sibling (same parent)
        if (reference.parentId && reference.parentId === target.parentId) {
            return "sibling";
        }

        // Check domain relationship
        if (reference.domainId === target.domainId) return "same-domain";

        // Check for cross-domain similarity
        const similarity = this.calculateSimilarity(referenceId, targetId);
        if (similarity.tagOverlap > 0.3) return "cross-domain";

        return "none";
    }

    /**
     * Find prerequisite gaps for a target node
     */
    public findPrerequisiteGaps(
        targetId: string,
        completedNodeIds: Set<string>
    ): PrerequisiteGap[] {
        const gaps: PrerequisiteGap[] = [];
        const visited = new Set<string>();

        const findGaps = (nodeId: string, depth: number): void => {
            if (visited.has(nodeId) || depth > 5) return;
            visited.add(nodeId);

            const prereqs = this.prerequisiteCache.get(nodeId) || new Set();

            for (const prereqId of prereqs) {
                const prereq = this.nodes.get(prereqId);
                if (!prereq) continue;

                if (!completedNodeIds.has(prereqId)) {
                    // Calculate importance based on depth and connection strength
                    const importance = Math.max(0.3, 1 - depth * 0.2);

                    // Determine if skippable (based on difficulty difference)
                    const target = this.nodes.get(targetId);
                    let isSkippable = false;
                    let reason = "Required foundation for this topic";

                    if (target && isCourseNode(prereq) && isCourseNode(target)) {
                        if (prereq.difficulty === "beginner" && target.difficulty !== "beginner") {
                            reason = `Beginner ${prereq.name} concepts build foundation for ${target.name}`;
                        } else {
                            isSkippable = prereq.difficulty === target.difficulty;
                            if (isSkippable) {
                                reason = `Optional but recommended: ${prereq.name} covers related topics`;
                            }
                        }
                    }

                    gaps.push({
                        prerequisite: prereq,
                        importance,
                        depth,
                        isSkippable,
                        reason,
                    });
                }

                // Recursively find gaps in prerequisites
                findGaps(prereqId, depth + 1);
            }
        };

        findGaps(targetId, 0);

        // Sort by importance descending
        gaps.sort((a, b) => b.importance - a.importance);

        return gaps;
    }

    /**
     * Calculate dependency depth (longest prerequisite chain)
     */
    public calculateDependencyDepth(nodeId: string): number {
        const visited = new Set<string>();

        const computeDepth = (id: string): number => {
            if (visited.has(id)) return 0;
            visited.add(id);

            const prereqs = this.prerequisiteCache.get(id) || new Set();
            if (prereqs.size === 0) return 0;

            let maxDepth = 0;
            for (const prereqId of prereqs) {
                maxDepth = Math.max(maxDepth, computeDepth(prereqId) + 1);
            }

            return maxDepth;
        };

        return computeDepth(nodeId);
    }

    /**
     * Get all nodes that depend on a given node
     */
    public getDependentNodes(nodeId: string): MapNode[] {
        const dependents: MapNode[] = [];
        const visited = new Set<string>();

        const collectDependents = (id: string): void => {
            const directDependents = this.dependentCache.get(id) || new Set();

            for (const depId of directDependents) {
                if (visited.has(depId)) continue;
                visited.add(depId);

                const dep = this.nodes.get(depId);
                if (dep) {
                    dependents.push(dep);
                    collectDependents(depId);
                }
            }
        };

        collectDependents(nodeId);
        return dependents;
    }

    /**
     * Get nodes in the same context (siblings + nearby in prerequisite graph)
     */
    public getContextualNodes(nodeId: string, limit: number = 5): MapNode[] {
        const node = this.nodes.get(nodeId);
        if (!node) return [];

        const contextual: Map<string, { node: MapNode; score: number }> = new Map();

        // Add siblings (same parent)
        if (node.parentId) {
            const parent = this.nodes.get(node.parentId);
            if (parent) {
                for (const siblingId of parent.childIds) {
                    if (siblingId !== nodeId) {
                        const sibling = this.nodes.get(siblingId);
                        if (sibling) {
                            contextual.set(siblingId, { node: sibling, score: 0.9 });
                        }
                    }
                }
            }
        }

        // Add prerequisites (with decay)
        const prereqs = this.prerequisiteCache.get(nodeId) || new Set();
        for (const prereqId of prereqs) {
            const prereq = this.nodes.get(prereqId);
            if (prereq && !contextual.has(prereqId)) {
                contextual.set(prereqId, { node: prereq, score: 0.8 });
            }
        }

        // Add dependents
        const dependents = this.dependentCache.get(nodeId) || new Set();
        for (const depId of dependents) {
            const dep = this.nodes.get(depId);
            if (dep && !contextual.has(depId)) {
                contextual.set(depId, { node: dep, score: 0.7 });
            }
        }

        // Sort by score and return top N
        return [...contextual.values()]
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((c) => c.node);
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a similarity calculator instance
 */
export function createSimilarityCalculator(
    nodes: Map<string, MapNode>,
    connections: MapConnection[],
    weights?: SimilarityWeights
): SimilarityCalculator {
    return new SimilarityCalculator(nodes, connections, weights);
}
