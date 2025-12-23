/**
 * Insight Generation
 *
 * Functions for generating path insights, comparisons, and adaptive suggestions.
 */

import type { GraphNode, GraphEdge, LearningDomainId } from "../../learningPathGraph";
import { PROGRESSION_LEVELS } from "../../progressionCoordinate";
import type {
    PathInsight,
    PathComparison,
    AdaptiveSuggestion,
    TopologyAnalysis,
} from "../types";
import { getInDegree, getOutDegree, findConvergenceTargets } from "./graphHelpers";

export interface InsightParams {
    nodes: GraphNode[];
    edges: GraphEdge[];
    nodeMap: Map<LearningDomainId, GraphNode>;
    adjacencyList: Map<LearningDomainId, LearningDomainId[]>;
    reverseAdjacencyList: Map<LearningDomainId, LearningDomainId[]>;
}

/**
 * Get insights about a specific path choice.
 */
export function getPathInsights(
    selectedPath: LearningDomainId,
    params: InsightParams,
    analysis: TopologyAnalysis
): PathInsight[] {
    const { nodeMap, adjacencyList, reverseAdjacencyList } = params;
    const node = nodeMap.get(selectedPath);
    if (!node) return [];

    const insights: PathInsight[] = [];

    // Learning style insight
    const inDegree = getInDegree(selectedPath, reverseAdjacencyList);
    const outDegree = getOutDegree(selectedPath, adjacencyList);

    if (outDegree > inDegree) {
        insights.push({
            category: "learning-style",
            title: "Breadth-Building Path",
            description: `This path branches into ${outDegree} different specialization areas, prioritizing breadth over depth.`,
            relevance: 0.9,
            relatedStrategy: "breadth-first",
            icon: "GitBranch",
        });
    } else if (inDegree > outDegree) {
        insights.push({
            category: "learning-style",
            title: "Convergent Path",
            description:
                "This topic synthesizes knowledge from multiple prerequisites, representing a convergence point in your learning.",
            relevance: 0.85,
            relatedStrategy: "convergent",
            icon: "GitMerge",
        });
    }

    // Tier-based insight
    const tierMeta = PROGRESSION_LEVELS[node.progressionLevel];
    insights.push({
        category: "curriculum-structure",
        title: `${tierMeta.label} Level Content`,
        description: tierMeta.description,
        relevance: 0.8,
        icon: "Layers",
    });

    // Pace implication
    if (node.isEntryPoint) {
        insights.push({
            category: "pace-implication",
            title: "Recommended Starting Point",
            description:
                "This is a designated entry point, optimized for learners new to this domain.",
            relevance: 0.95,
            icon: "Flag",
        });
    }

    // Strategy alignment
    if (analysis.primaryStrategy === "depth-first" && outDegree === 0) {
        insights.push({
            category: "skill-development",
            title: "Deep Specialization Endpoint",
            description:
                "Choosing this path prioritizes depth-first learning, reaching specialized expertise.",
            relevance: 0.85,
            relatedStrategy: "depth-first",
            icon: "Target",
        });
    }

    return insights.sort((a, b) => b.relevance - a.relevance);
}

/**
 * Compare two path choices pedagogically.
 */
export function comparePaths(
    pathA: LearningDomainId,
    pathB: LearningDomainId,
    params: InsightParams
): PathComparison {
    const { nodeMap, adjacencyList } = params;
    const nodeA = nodeMap.get(pathA);
    const nodeB = nodeMap.get(pathB);

    if (!nodeA || !nodeB) {
        return {
            pathA,
            pathB,
            strategyDifference: "Unable to compare - path not found",
            timeImplication: "Unknown",
            focusDifference: "Unknown",
            recommendation: "Please select valid learning paths",
        };
    }

    const outDegreeA = getOutDegree(pathA, adjacencyList);
    const outDegreeB = getOutDegree(pathB, adjacencyList);
    const tierDiff = nodeB.progressionLevel - nodeA.progressionLevel;

    let strategyDifference: string;
    if (outDegreeA > outDegreeB) {
        strategyDifference = `${pathA} offers more branching options (breadth-first), while ${pathB} is more focused (depth-first).`;
    } else if (outDegreeB > outDegreeA) {
        strategyDifference = `${pathB} offers more branching options (breadth-first), while ${pathA} is more focused (depth-first).`;
    } else {
        strategyDifference = "Both paths offer similar branching structures.";
    }

    let timeImplication: string;
    if (tierDiff > 0) {
        timeImplication = `${pathB} is at a more advanced tier, typically requiring more prerequisite knowledge.`;
    } else if (tierDiff < 0) {
        timeImplication = `${pathA} is at a more advanced tier, typically requiring more prerequisite knowledge.`;
    } else {
        timeImplication = "Both paths are at similar progression levels.";
    }

    const focusDifference = `${pathA} focuses on ${PROGRESSION_LEVELS[nodeA.progressionLevel].phase} skills, while ${pathB} focuses on ${PROGRESSION_LEVELS[nodeB.progressionLevel].phase} skills.`;

    let recommendation: string;
    if (nodeA.isEntryPoint && !nodeB.isEntryPoint) {
        recommendation = `Consider starting with ${pathA} as it's a designated entry point.`;
    } else if (!nodeA.isEntryPoint && nodeB.isEntryPoint) {
        recommendation = `Consider starting with ${pathB} as it's a designated entry point.`;
    } else if (outDegreeA > outDegreeB) {
        recommendation = `Choose ${pathA} if you prefer exploring multiple directions; choose ${pathB} for focused expertise.`;
    } else {
        recommendation =
            "Both paths are valid starting points based on your learning goals.";
    }

    return {
        pathA,
        pathB,
        strategyDifference,
        timeImplication,
        focusDifference,
        recommendation,
    };
}

/**
 * Get adaptive suggestions based on current position.
 */
export function getAdaptiveSuggestions(
    currentNode: LearningDomainId,
    completedNodes: LearningDomainId[],
    params: InsightParams
): AdaptiveSuggestion[] {
    const { nodes, edges, nodeMap, adjacencyList, reverseAdjacencyList } = params;
    const suggestions: AdaptiveSuggestion[] = [];
    const completedSet = new Set(completedNodes);
    const node = nodeMap.get(currentNode);

    if (!node) return suggestions;

    // Get outgoing connections
    const nextNodes = adjacencyList.get(currentNode) || [];
    const availableNext = nextNodes.filter((n) => !completedSet.has(n));

    if (availableNext.length > 1) {
        suggestions.push({
            type: "branch-option",
            suggestedNodes: availableNext,
            reasoning: `You have ${availableNext.length} specialization paths available. The curriculum supports exploration at this point.`,
            basedOn: "specialization-divergence",
            priority: 4,
        });
    } else if (availableNext.length === 1) {
        suggestions.push({
            type: "next-topic",
            suggestedNodes: availableNext,
            reasoning:
                "This is the natural next step in the linear progression of this path.",
            basedOn: "mastery-based",
            priority: 5,
        });
    }

    // Check for convergence opportunities
    const nodesLeadingToConvergence = findConvergenceTargets(
        currentNode,
        nodes,
        nodeMap,
        reverseAdjacencyList
    );
    if (nodesLeadingToConvergence.length > 0) {
        suggestions.push({
            type: "convergence-point",
            suggestedNodes: nodesLeadingToConvergence,
            reasoning:
                "Completing these topics will unlock convergent advanced content that synthesizes multiple skill areas.",
            basedOn: "skill-convergence",
            priority: 3,
        });
    }

    // Check for review opportunities
    const prereqEdges = edges.filter(
        (e) => e.to === currentNode && e.type === "prerequisite"
    );
    const missingPrereqs = prereqEdges
        .map((e) => e.from)
        .filter((n) => !completedSet.has(n));

    if (missingPrereqs.length > 0) {
        suggestions.push({
            type: "review-topic",
            suggestedNodes: missingPrereqs,
            reasoning:
                "These prerequisite topics would strengthen your foundation before advancing.",
            basedOn: "mastery-based",
            priority: 5,
        });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
}
