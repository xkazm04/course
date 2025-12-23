/**
 * Pedagogical Topology Analyzer
 *
 * This analyzer extracts pedagogical meaning from the topology of learning path graphs.
 * The shape of the graph - node distribution, edge patterns, convergence/divergence points -
 * encodes a hidden curriculum theory.
 *
 * Key capabilities:
 * - Detect teaching strategies from graph structure
 * - Analyze tier distributions for curriculum balance
 * - Identify convergence and divergence patterns
 * - Generate human-readable pedagogical descriptions
 * - Provide adaptive learning recommendations
 */

import type {
    GraphNode,
    GraphEdge,
    LearningPathGraph,
    LearningDomainId,
} from "../learningPathGraph";
import type {
    TopologyAnalysis,
    PathInsight,
    PathComparison,
    AdaptiveSuggestion,
} from "./types";

// Import modular analysis functions
import {
    buildAdjacencyList,
    buildReverseAdjacencyList,
    computeMetrics,
    computeTierStatistics,
    computeTierRelationships,
    computePathCharacteristics,
    detectStructureCharacteristics,
    detectTeachingStrategy,
    generatePedagogicalDescription,
    generateRecommendations,
    getPathInsights as getInsights,
    comparePaths as comparePathsFn,
    getAdaptiveSuggestions as getSuggestions,
} from "./analyzer";

/**
 * Analyzes learning path graph topology to extract pedagogical structure.
 *
 * @example
 * ```typescript
 * const analyzer = new PedagogicalTopologyAnalyzer(LEARNING_PATH_GRAPH);
 * const analysis = analyzer.analyze();
 * console.log(analysis.pedagogicalDescription);
 * ```
 */
export class PedagogicalTopologyAnalyzer {
    private readonly nodes: GraphNode[];
    private readonly edges: GraphEdge[];
    private readonly nodeMap: Map<LearningDomainId, GraphNode>;
    private readonly adjacencyList: Map<LearningDomainId, LearningDomainId[]>;
    private readonly reverseAdjacencyList: Map<LearningDomainId, LearningDomainId[]>;

    constructor(graph: LearningPathGraph) {
        this.nodes = graph.nodes;
        this.edges = graph.edges;
        this.nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
        this.adjacencyList = buildAdjacencyList(this.nodes, this.edges);
        this.reverseAdjacencyList = buildReverseAdjacencyList(this.nodes, this.edges);
    }

    /**
     * Perform complete topology analysis.
     */
    public analyze(): TopologyAnalysis {
        const metricsParams = {
            nodes: this.nodes,
            edges: this.edges,
            adjacencyList: this.adjacencyList,
            reverseAdjacencyList: this.reverseAdjacencyList,
        };

        const tierParams = {
            nodes: this.nodes,
            edges: this.edges,
            nodeMap: this.nodeMap,
            adjacencyList: this.adjacencyList,
            reverseAdjacencyList: this.reverseAdjacencyList,
        };

        const strategyParams = {
            nodes: this.nodes,
            adjacencyList: this.adjacencyList,
            reverseAdjacencyList: this.reverseAdjacencyList,
        };

        const metrics = computeMetrics(metricsParams);
        const tierStatistics = computeTierStatistics(tierParams);
        const tierRelationships = computeTierRelationships(tierParams);
        const pathCharacteristics = computePathCharacteristics(tierParams, metrics);

        const characteristics = detectStructureCharacteristics(
            tierStatistics,
            metrics,
            strategyParams
        );

        const { primaryStrategy, secondaryStrategies, confidence } =
            detectTeachingStrategy(characteristics, tierStatistics, metrics);

        const pedagogicalDescription = generatePedagogicalDescription(
            primaryStrategy,
            characteristics,
            tierStatistics
        );

        const recommendations = generateRecommendations(
            primaryStrategy,
            characteristics
        );

        return {
            primaryStrategy,
            secondaryStrategies,
            confidence,
            characteristics,
            tierStatistics,
            tierRelationships,
            pathCharacteristics,
            pedagogicalDescription,
            recommendations,
            metrics,
        };
    }

    /**
     * Answer the key question: "What teaching strategy does this path shape represent?"
     */
    public getTeachingStrategyDescription(): string {
        const analysis = this.analyze();
        return analysis.pedagogicalDescription;
    }

    /**
     * Get insights about a specific path choice.
     */
    public getPathInsights(selectedPath: LearningDomainId): PathInsight[] {
        const params = {
            nodes: this.nodes,
            edges: this.edges,
            nodeMap: this.nodeMap,
            adjacencyList: this.adjacencyList,
            reverseAdjacencyList: this.reverseAdjacencyList,
        };
        return getInsights(selectedPath, params, this.analyze());
    }

    /**
     * Compare two path choices pedagogically.
     */
    public comparePaths(
        pathA: LearningDomainId,
        pathB: LearningDomainId
    ): PathComparison {
        const params = {
            nodes: this.nodes,
            edges: this.edges,
            nodeMap: this.nodeMap,
            adjacencyList: this.adjacencyList,
            reverseAdjacencyList: this.reverseAdjacencyList,
        };
        return comparePathsFn(pathA, pathB, params);
    }

    /**
     * Get adaptive suggestions based on current position.
     */
    public getAdaptiveSuggestions(
        currentNode: LearningDomainId,
        completedNodes: LearningDomainId[] = []
    ): AdaptiveSuggestion[] {
        const params = {
            nodes: this.nodes,
            edges: this.edges,
            nodeMap: this.nodeMap,
            adjacencyList: this.adjacencyList,
            reverseAdjacencyList: this.reverseAdjacencyList,
        };
        return getSuggestions(currentNode, completedNodes, params);
    }
}
