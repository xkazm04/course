/**
 * Pedagogical Topology Module
 *
 * This module provides tools for analyzing the pedagogical structure
 * encoded in learning path graph topologies.
 *
 * The key insight is that the shape of a curriculum graph encodes
 * teaching strategies: breadth-first vs depth-first, spiral vs linear,
 * convergent vs divergent learning sequences.
 *
 * @example
 * ```typescript
 * // Direct analyzer usage
 * import { PedagogicalTopologyAnalyzer, LEARNING_PATH_GRAPH } from '@/app/shared/lib';
 *
 * const analyzer = new PedagogicalTopologyAnalyzer(LEARNING_PATH_GRAPH);
 * const analysis = analyzer.analyze();
 * console.log(analysis.pedagogicalDescription);
 *
 * // React hook usage
 * import { useTopologyAnalysis, usePathInsights } from '@/app/shared/lib';
 *
 * function MyComponent() {
 *   const analysis = useTopologyAnalysis();
 *   const insights = usePathInsights('frontend');
 *   // ...
 * }
 * ```
 */

// Core analyzer class
export { PedagogicalTopologyAnalyzer } from "./PedagogicalTopologyAnalyzer";

// Types
export type {
    // Strategy types
    TeachingStrategy,
    SequencePattern,
    StructureCharacteristic,

    // Analysis result types
    TopologyAnalysis,
    TopologyMetrics,
    TierStatistics,
    TierRelationship,
    PathCharacteristics,

    // User-facing insight types
    PathInsight,
    PathComparison,
    AdaptiveSuggestion,
} from "./types";

// React hooks
export {
    // Primary analysis
    useTopologyAnalysis,
    useTeachingStrategyDescription,
    usePrimaryStrategy,
    useStructureCharacteristics,

    // Path-specific
    usePathInsights,
    usePathComparison,
    usePathInsightsCallback,
    usePathComparisonCallback,

    // Adaptive learning
    useAdaptiveSuggestions,

    // Tier statistics
    useTierStatistics,
    useAllTierStatistics,

    // Recommendations and metrics
    useTopologyRecommendations,
    useTopologyMetrics,
    useHasCharacteristic,
} from "./hooks";
