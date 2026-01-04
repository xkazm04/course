/**
 * Adaptive Path Computation
 *
 * Computes optimal learning paths that consider both curriculum structure
 * and collective learner behavior. Paths adapt based on:
 * - Traversability scores
 * - Behavior edge weights
 * - Learner profile
 * - Optimization target (speed, ease, XP, etc.)
 */

import type { ChapterNodeId, ChapterNode } from "../chapterGraph";
import type {
    LivingEdge,
    LivingNode,
    AdaptivePath,
    AdaptivePathMetrics,
    AdaptivePathParams,
    PathDerivation,
    LearnerProfileSummary,
    PathCheckpoint,
    CheckpointAction,
    AdaptivePathAlternative,
    TraversabilityScore,
    LivingGraphConfig,
    PathOptimizationTarget,
} from "./types";
import { CURRICULUM_CHAPTERS, getChapterNode } from "../curriculumChapters";
import { computeTraversability } from "./traversability";
import type { CollectiveInsight } from "../conductorTypes";
import type { ImplicitPrerequisite, StrugglePoint, OptimalPath } from "../collectiveIntelligence";

// ============================================================================
// PATH COMPUTATION
// ============================================================================

/**
 * Compute an adaptive learning path for a learner.
 *
 * The algorithm:
 * 1. Build a living graph with traversability and edge weights
 * 2. Find paths that satisfy prerequisites
 * 3. Score paths based on optimization target
 * 4. Return the best path with alternatives
 */
export function computeAdaptivePath(
    params: AdaptivePathParams,
    livingNodes: Map<ChapterNodeId, LivingNode>,
    livingEdges: LivingEdge[],
    optimalPaths: OptimalPath[]
): AdaptivePath | null {
    const {
        startNodeId,
        goalNodeIds,
        completedChapterIds,
        learnerProfile,
        config,
        maxPathLength = 10,
        optimizeFor,
    } = params;

    // Find candidate paths
    const candidatePaths = findCandidatePaths(
        startNodeId,
        goalNodeIds,
        completedChapterIds,
        livingNodes,
        livingEdges,
        maxPathLength
    );

    if (candidatePaths.length === 0) {
        return null;
    }

    // Score paths based on optimization target
    const scoredPaths = candidatePaths.map((path) => ({
        path,
        score: scorePathForTarget(path, livingNodes, optimizeFor, learnerProfile),
    }));

    // Sort by score (higher is better)
    scoredPaths.sort((a, b) => b.score - a.score);

    const bestPath = scoredPaths[0]!.path;

    // Check for matching optimal paths from collective intelligence
    const matchingOptimalPath = findMatchingOptimalPath(
        bestPath,
        optimalPaths,
        learnerProfile
    );

    // Determine derivation type
    const derivation = determineDerivation(bestPath, livingEdges, matchingOptimalPath);

    // Create checkpoints
    const checkpoints = createPathCheckpoints(bestPath, livingNodes);

    // Create alternatives
    const alternatives = createAlternatives(
        scoredPaths.slice(1, 4).map((sp) => sp.path),
        bestPath,
        livingNodes
    );

    // Compute metrics
    const metrics = computePathMetrics(bestPath, livingNodes, learnerProfile);

    return {
        id: generatePathId(),
        nodes: bestPath,
        metrics,
        derivation,
        optimizedFor: learnerProfile,
        alternatives,
        checkpoints,
        computedAt: Date.now(),
    };
}

// ============================================================================
// PATH FINDING
// ============================================================================

/**
 * Find candidate paths through the living graph.
 */
function findCandidatePaths(
    startNodeId: ChapterNodeId | null,
    goalNodeIds: ChapterNodeId[] | undefined,
    completedChapterIds: Set<ChapterNodeId>,
    livingNodes: Map<ChapterNodeId, LivingNode>,
    livingEdges: LivingEdge[],
    maxPathLength: number
): LivingNode[][] {
    const candidates: LivingNode[][] = [];

    // If no start, find available entry points
    const startNodes = startNodeId
        ? [livingNodes.get(startNodeId)].filter(Boolean) as LivingNode[]
        : Array.from(livingNodes.values()).filter(
            (node) =>
                !completedChapterIds.has(node.id) &&
                node.traversability.prerequisitesMet &&
                node.isEntryPoint
        );

    if (startNodes.length === 0) {
        // Fall back to any node with met prerequisites
        const availableNodes = Array.from(livingNodes.values()).filter(
            (node) =>
                !completedChapterIds.has(node.id) &&
                node.traversability.prerequisitesMet
        );
        startNodes.push(...availableNodes.slice(0, 3));
    }

    // Build adjacency for path finding
    const adjacency = buildAdjacencyMap(livingEdges);

    // Find paths using DFS with traversability heuristic
    for (const startNode of startNodes) {
        const paths = findPathsDFS(
            startNode.id,
            goalNodeIds,
            completedChapterIds,
            livingNodes,
            adjacency,
            maxPathLength
        );
        candidates.push(...paths);
    }

    return candidates;
}

/**
 * Build adjacency map from living edges.
 */
function buildAdjacencyMap(
    livingEdges: LivingEdge[]
): Map<ChapterNodeId, { to: ChapterNodeId; edge: LivingEdge }[]> {
    const adjacency = new Map<ChapterNodeId, { to: ChapterNodeId; edge: LivingEdge }[]>();

    for (const edge of livingEdges) {
        if (!adjacency.has(edge.from)) {
            adjacency.set(edge.from, []);
        }
        adjacency.get(edge.from)!.push({ to: edge.to, edge });
    }

    return adjacency;
}

/**
 * Find paths using depth-first search.
 */
function findPathsDFS(
    startId: ChapterNodeId,
    goalNodeIds: ChapterNodeId[] | undefined,
    completedChapterIds: Set<ChapterNodeId>,
    livingNodes: Map<ChapterNodeId, LivingNode>,
    adjacency: Map<ChapterNodeId, { to: ChapterNodeId; edge: LivingEdge }[]>,
    maxLength: number
): LivingNode[][] {
    const paths: LivingNode[][] = [];
    const visited = new Set<ChapterNodeId>(completedChapterIds);

    function dfs(currentId: ChapterNodeId, path: LivingNode[]) {
        const node = livingNodes.get(currentId);
        if (!node) return;

        visited.add(currentId);
        path.push(node);

        // Check if goal reached
        if (goalNodeIds && goalNodeIds.includes(currentId)) {
            paths.push([...path]);
        }

        // Check path length
        if (path.length >= maxLength) {
            paths.push([...path]); // Save partial path
            path.pop();
            visited.delete(currentId);
            return;
        }

        // No goals specified, any path is valid
        if (!goalNodeIds && path.length >= 3) {
            paths.push([...path]);
        }

        // Explore neighbors
        const neighbors = adjacency.get(currentId) ?? [];

        // Sort by traversability (prefer higher)
        const sortedNeighbors = neighbors
            .filter(
                ({ to }) =>
                    !visited.has(to) &&
                    (livingNodes.get(to)?.traversability.recommendation !== "blocked")
            )
            .sort((a, b) => {
                const aTraversability = livingNodes.get(a.to)?.traversability.score ?? 0;
                const bTraversability = livingNodes.get(b.to)?.traversability.score ?? 0;
                return bTraversability - aTraversability;
            });

        for (const { to } of sortedNeighbors) {
            dfs(to, path);
        }

        path.pop();
        visited.delete(currentId);
    }

    dfs(startId, []);

    return paths;
}

// ============================================================================
// PATH SCORING
// ============================================================================

/**
 * Score a path based on optimization target.
 */
function scorePathForTarget(
    path: LivingNode[],
    livingNodes: Map<ChapterNodeId, LivingNode>,
    target: PathOptimizationTarget,
    profile: LearnerProfileSummary
): number {
    const metrics = computePathMetrics(path, livingNodes, profile);

    switch (target) {
        case "fastest":
            // Higher score for lower duration
            return 1 / (1 + metrics.estimatedDuration / 60);

        case "easiest":
            // Higher score for lower struggle
            return 1 - metrics.avgStruggleScore;

        case "most_xp":
            // Higher score for more XP
            return metrics.totalXP / 1000;

        case "completion_rate":
            // Higher score for better completion probability
            return metrics.predictedCompletionRate;

        case "balanced":
        default:
            // Weighted combination
            return (
                (1 - metrics.avgStruggleScore) * 0.3 +
                metrics.predictedCompletionRate * 0.3 +
                metrics.efficiencyScore * 0.2 +
                (metrics.totalXP / 1000) * 0.2
            );
    }
}

// ============================================================================
// PATH METRICS
// ============================================================================

/**
 * Compute metrics for a path.
 */
function computePathMetrics(
    path: LivingNode[],
    livingNodes: Map<ChapterNodeId, LivingNode>,
    profile: LearnerProfileSummary
): AdaptivePathMetrics {
    if (path.length === 0) {
        return {
            estimatedDuration: 0,
            totalXP: 0,
            predictedCompletionRate: 0,
            avgStruggleScore: 0,
            efficiencyScore: 0,
            validationCount: 0,
        };
    }

    // Estimated duration
    const estimatedDuration = path.reduce(
        (sum, node) => sum + node.predictedDuration,
        0
    );

    // Total XP
    const totalXP = path.reduce((sum, node) => sum + node.xpReward, 0);

    // Average struggle
    const avgStruggleScore =
        path.reduce((sum, node) => sum + node.traversability.predictedStruggle, 0) /
        path.length;

    // Predicted completion rate
    const predictedCompletionRate =
        path.reduce((sum, node) => sum + node.predictedSuccessRate, 0) / path.length;

    // Efficiency (XP per minute)
    const efficiencyScore =
        estimatedDuration > 0 ? totalXP / estimatedDuration / 10 : 0;

    // Validation count from collective intelligence
    let validationCount = 0;
    for (const node of path) {
        if (node.collectiveInsight?.optimalPaths) {
            for (const optPath of node.collectiveInsight.optimalPaths) {
                if (optPath.sectionOrder.length > 0) {
                    validationCount += optPath.learnerCount;
                }
            }
        }
    }

    return {
        estimatedDuration,
        totalXP,
        predictedCompletionRate: Math.min(1, predictedCompletionRate),
        avgStruggleScore: Math.min(1, avgStruggleScore),
        efficiencyScore: Math.min(1, efficiencyScore),
        validationCount,
    };
}

// ============================================================================
// PATH DERIVATION
// ============================================================================

/**
 * Determine how a path was derived.
 */
function determineDerivation(
    path: LivingNode[],
    livingEdges: LivingEdge[],
    matchingOptimalPath: OptimalPath | null
): PathDerivation {
    if (matchingOptimalPath) {
        return "collective";
    }

    // Check if path uses any emergent edges
    const pathEdges = new Set<string>();
    for (let i = 0; i < path.length - 1; i++) {
        pathEdges.add(`${path[i]!.id}->${path[i + 1]!.id}`);
    }

    const usesEmergent = livingEdges.some(
        (edge) => edge.isEmergent && pathEdges.has(`${edge.from}->${edge.to}`)
    );

    const usesBehavior = livingEdges.some(
        (edge) =>
            edge.behaviorWeight &&
            pathEdges.has(`${edge.from}->${edge.to}`)
    );

    if (usesEmergent && usesBehavior) {
        return "hybrid";
    }
    if (usesBehavior) {
        return "personalized";
    }
    return "static";
}

/**
 * Find a matching optimal path from collective intelligence.
 */
function findMatchingOptimalPath(
    path: LivingNode[],
    optimalPaths: OptimalPath[],
    profile: LearnerProfileSummary
): OptimalPath | null {
    const pathSequence = path.map((n) => n.id);

    for (const optPath of optimalPaths) {
        // Check sequence overlap
        const overlap = pathSequence.filter((id) =>
            optPath.chapterSequence.includes(id)
        );

        if (overlap.length >= pathSequence.length * 0.7) {
            // Check profile suitability
            if (
                optPath.suitableFor.paces.includes(profile.pace) ||
                optPath.suitableFor.confidences.includes(profile.confidence)
            ) {
                return optPath;
            }
        }
    }

    return null;
}

// ============================================================================
// CHECKPOINTS
// ============================================================================

/**
 * Create checkpoints for progress tracking.
 */
function createPathCheckpoints(
    path: LivingNode[],
    livingNodes: Map<ChapterNodeId, LivingNode>
): PathCheckpoint[] {
    const checkpoints: PathCheckpoint[] = [];

    // Add checkpoint every 3 nodes or at high-struggle nodes
    for (let i = 0; i < path.length; i++) {
        const node = path[i]!;
        const isInterval = (i + 1) % 3 === 0;
        const isHighStruggle = node.traversability.predictedStruggle > 0.5;

        if (isInterval || isHighStruggle || i === path.length - 1) {
            const expectedProgress = (i + 1) / path.length;
            const minMastery = isHighStruggle ? 0.7 : 0.6;

            const onFailure: CheckpointAction[] = [];

            if (node.strugglePoints.length > 0) {
                onFailure.push("suggest_remedial");
            }
            if (node.traversability.predictedStruggle > 0.4) {
                onFailure.push("offer_peer_solution");
            }
            if (node.traversability.predictedStruggle > 0.6) {
                onFailure.push("slow_pace");
            }
            if (i < path.length - 1) {
                onFailure.push("suggest_alternative_path");
            }

            checkpoints.push({
                nodeId: node.id,
                expectedProgress,
                minMastery,
                onFailure: onFailure.length > 0 ? onFailure : ["allow_skip"],
            });
        }
    }

    return checkpoints;
}

// ============================================================================
// ALTERNATIVES
// ============================================================================

/**
 * Create alternative path summaries.
 */
function createAlternatives(
    alternativePaths: LivingNode[][],
    bestPath: LivingNode[],
    livingNodes: Map<ChapterNodeId, LivingNode>
): AdaptivePathAlternative[] {
    const profile: LearnerProfileSummary = {
        pace: "normal",
        confidence: "moderate",
        strengths: [],
        weaknesses: [],
    };

    const bestMetrics = computePathMetrics(bestPath, livingNodes, profile);

    return alternativePaths.map((altPath, index) => {
        const altMetrics = computePathMetrics(altPath, livingNodes, profile);

        const difficultyDelta =
            altMetrics.avgStruggleScore - bestMetrics.avgStruggleScore;
        const durationDelta =
            altMetrics.estimatedDuration - bestMetrics.estimatedDuration;

        let reason = "";
        if (difficultyDelta < -0.1) {
            reason = "Easier path with lower predicted struggle";
        } else if (difficultyDelta > 0.1) {
            reason = "More challenging path with higher XP";
        } else if (durationDelta < -10) {
            reason = "Faster path to completion";
        } else if (durationDelta > 10) {
            reason = "More thorough coverage";
        } else {
            reason = "Alternative sequence";
        }

        return {
            pathId: `alt-${index + 1}`,
            reason,
            difficultyDelta,
            durationDelta,
        };
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique path ID.
 */
function generatePathId(): string {
    return `path-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get recommended next node based on current position.
 */
export function getRecommendedNextNode(
    currentNodeId: ChapterNodeId | null,
    completedChapterIds: Set<ChapterNodeId>,
    livingNodes: Map<ChapterNodeId, LivingNode>,
    livingEdges: LivingEdge[]
): LivingNode | null {
    if (!currentNodeId) {
        // Find best entry point
        const entryPoints = Array.from(livingNodes.values())
            .filter(
                (node) =>
                    node.isEntryPoint &&
                    !completedChapterIds.has(node.id) &&
                    node.traversability.recommendation !== "blocked"
            )
            .sort((a, b) => b.traversability.score - a.traversability.score);

        return entryPoints[0] ?? null;
    }

    // Find next nodes from current
    const outgoingEdges = livingEdges.filter((e) => e.from === currentNodeId);
    const candidateNodes = outgoingEdges
        .map((e) => livingNodes.get(e.to))
        .filter(
            (node): node is LivingNode =>
                node !== undefined &&
                !completedChapterIds.has(node.id) &&
                node.traversability.recommendation !== "blocked"
        )
        .sort((a, b) => b.traversability.score - a.traversability.score);

    return candidateNodes[0] ?? null;
}

/**
 * Find paths that avoid high-struggle nodes.
 */
export function findLowStrugglePath(
    startNodeId: ChapterNodeId,
    goalNodeId: ChapterNodeId,
    completedChapterIds: Set<ChapterNodeId>,
    livingNodes: Map<ChapterNodeId, LivingNode>,
    livingEdges: LivingEdge[],
    maxStruggle: number
): LivingNode[] | null {
    // Filter nodes to those below struggle threshold
    const validNodes = new Map<ChapterNodeId, LivingNode>();
    for (const [id, node] of livingNodes) {
        if (node.traversability.predictedStruggle <= maxStruggle) {
            validNodes.set(id, node);
        }
    }

    // Filter edges to only connect valid nodes
    const validEdges = livingEdges.filter(
        (e) => validNodes.has(e.from) && validNodes.has(e.to)
    );

    const adjacency = buildAdjacencyMap(validEdges);
    const paths = findPathsDFS(
        startNodeId,
        [goalNodeId],
        completedChapterIds,
        validNodes,
        adjacency,
        15
    );

    return paths.length > 0 ? paths[0]! : null;
}
