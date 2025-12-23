/**
 * Pedagogical Topology Hooks
 *
 * React hooks for accessing pedagogical topology analysis
 * in UI components. Provides memoized access to teaching strategy
 * insights, path comparisons, and adaptive suggestions.
 */

"use client";

import { useMemo, useCallback } from "react";
import { PedagogicalTopologyAnalyzer } from "./PedagogicalTopologyAnalyzer";
import { LEARNING_PATH_GRAPH, type LearningDomainId } from "../learningPathGraph";
import type {
    TopologyAnalysis,
    PathInsight,
    PathComparison,
    AdaptiveSuggestion,
    TeachingStrategy,
    StructureCharacteristic,
} from "./types";

// ============================================================================
// SINGLETON ANALYZER INSTANCE
// ============================================================================

/**
 * Lazily initialized singleton analyzer instance.
 * Using a singleton avoids re-computing graph analysis on every render.
 */
let analyzerInstance: PedagogicalTopologyAnalyzer | null = null;

function getAnalyzer(): PedagogicalTopologyAnalyzer {
    if (!analyzerInstance) {
        analyzerInstance = new PedagogicalTopologyAnalyzer(LEARNING_PATH_GRAPH);
    }
    return analyzerInstance;
}

// ============================================================================
// PRIMARY ANALYSIS HOOK
// ============================================================================

/**
 * Hook to access the full topology analysis.
 *
 * @returns Complete topology analysis including teaching strategy,
 *          characteristics, tier statistics, and recommendations.
 *
 * @example
 * ```tsx
 * function CurriculumInsights() {
 *   const analysis = useTopologyAnalysis();
 *   return (
 *     <div>
 *       <h2>Teaching Strategy: {analysis.primaryStrategy}</h2>
 *       <p>{analysis.pedagogicalDescription}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTopologyAnalysis(): TopologyAnalysis {
    return useMemo(() => {
        const analyzer = getAnalyzer();
        return analyzer.analyze();
    }, []);
}

/**
 * Hook to get just the teaching strategy description.
 *
 * @returns Human-readable description of the curriculum's teaching approach.
 */
export function useTeachingStrategyDescription(): string {
    return useMemo(() => {
        const analyzer = getAnalyzer();
        return analyzer.getTeachingStrategyDescription();
    }, []);
}

/**
 * Hook to get the primary teaching strategy.
 *
 * @returns The detected teaching strategy type.
 */
export function usePrimaryStrategy(): TeachingStrategy {
    const analysis = useTopologyAnalysis();
    return analysis.primaryStrategy;
}

/**
 * Hook to get detected structure characteristics.
 *
 * @returns Array of structure characteristics found in the curriculum.
 */
export function useStructureCharacteristics(): StructureCharacteristic[] {
    const analysis = useTopologyAnalysis();
    return analysis.characteristics;
}

// ============================================================================
// PATH-SPECIFIC HOOKS
// ============================================================================

/**
 * Hook to get insights about a specific learning path.
 *
 * @param pathId - The learning domain ID to analyze
 * @returns Array of pedagogical insights about the path
 *
 * @example
 * ```tsx
 * function PathDetails({ pathId }) {
 *   const insights = usePathInsights(pathId);
 *   return (
 *     <ul>
 *       {insights.map(insight => (
 *         <li key={insight.title}>{insight.description}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function usePathInsights(pathId: LearningDomainId): PathInsight[] {
    return useMemo(() => {
        const analyzer = getAnalyzer();
        return analyzer.getPathInsights(pathId);
    }, [pathId]);
}

/**
 * Hook to compare two learning paths pedagogically.
 *
 * @param pathA - First path to compare
 * @param pathB - Second path to compare
 * @returns Comparison result with strategy and focus differences
 *
 * @example
 * ```tsx
 * function PathComparison({ pathA, pathB }) {
 *   const comparison = usePathComparison(pathA, pathB);
 *   return (
 *     <div>
 *       <p>{comparison.strategyDifference}</p>
 *       <p>{comparison.recommendation}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePathComparison(
    pathA: LearningDomainId,
    pathB: LearningDomainId
): PathComparison {
    return useMemo(() => {
        const analyzer = getAnalyzer();
        return analyzer.comparePaths(pathA, pathB);
    }, [pathA, pathB]);
}

// ============================================================================
// ADAPTIVE LEARNING HOOKS
// ============================================================================

/**
 * Hook to get adaptive suggestions based on current progress.
 *
 * @param currentNode - The node the user is currently viewing/working on
 * @param completedNodes - Array of completed node IDs
 * @returns Array of adaptive suggestions sorted by priority
 *
 * @example
 * ```tsx
 * function NextSteps({ currentPath, completed }) {
 *   const suggestions = useAdaptiveSuggestions(currentPath, completed);
 *   return (
 *     <div>
 *       {suggestions.map(suggestion => (
 *         <SuggestionCard key={suggestion.type} {...suggestion} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAdaptiveSuggestions(
    currentNode: LearningDomainId,
    completedNodes: LearningDomainId[] = []
): AdaptiveSuggestion[] {
    return useMemo(() => {
        const analyzer = getAnalyzer();
        return analyzer.getAdaptiveSuggestions(currentNode, completedNodes);
    }, [currentNode, completedNodes]);
}

/**
 * Hook providing a callback to get insights for any path.
 * Useful when you need to fetch insights on-demand rather than at render time.
 *
 * @returns A callback function that takes a path ID and returns insights
 */
export function usePathInsightsCallback(): (
    pathId: LearningDomainId
) => PathInsight[] {
    return useCallback((pathId: LearningDomainId) => {
        const analyzer = getAnalyzer();
        return analyzer.getPathInsights(pathId);
    }, []);
}

/**
 * Hook providing a callback for path comparison.
 * Useful for interactive comparison UI where paths change dynamically.
 *
 * @returns A callback function that takes two path IDs and returns comparison
 */
export function usePathComparisonCallback(): (
    pathA: LearningDomainId,
    pathB: LearningDomainId
) => PathComparison {
    return useCallback(
        (pathA: LearningDomainId, pathB: LearningDomainId) => {
            const analyzer = getAnalyzer();
            return analyzer.comparePaths(pathA, pathB);
        },
        []
    );
}

// ============================================================================
// TIER STATISTICS HOOKS
// ============================================================================

/**
 * Hook to get statistics for a specific progression tier.
 *
 * @param level - The progression level (0-4)
 * @returns Statistics for that tier or undefined if not found
 */
export function useTierStatistics(level: 0 | 1 | 2 | 3 | 4) {
    const analysis = useTopologyAnalysis();
    return useMemo(() => {
        return analysis.tierStatistics.find((s) => s.level === level);
    }, [analysis.tierStatistics, level]);
}

/**
 * Hook to get all tier statistics.
 *
 * @returns Array of statistics for all tiers
 */
export function useAllTierStatistics() {
    const analysis = useTopologyAnalysis();
    return analysis.tierStatistics;
}

// ============================================================================
// RECOMMENDATIONS HOOK
// ============================================================================

/**
 * Hook to get curriculum recommendations based on topology.
 *
 * @returns Array of recommendation strings
 */
export function useTopologyRecommendations(): string[] {
    const analysis = useTopologyAnalysis();
    return analysis.recommendations;
}

// ============================================================================
// METRICS HOOKS
// ============================================================================

/**
 * Hook to get raw topology metrics.
 *
 * @returns Raw metrics used in topology analysis
 */
export function useTopologyMetrics() {
    const analysis = useTopologyAnalysis();
    return analysis.metrics;
}

/**
 * Hook to check if the curriculum has a specific characteristic.
 *
 * @param characteristic - The characteristic to check for
 * @returns True if the curriculum has this characteristic
 */
export function useHasCharacteristic(
    characteristic: StructureCharacteristic
): boolean {
    const characteristics = useStructureCharacteristics();
    return characteristics.includes(characteristic);
}
