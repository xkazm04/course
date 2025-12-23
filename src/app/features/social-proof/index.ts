/**
 * Social Proof Feature
 *
 * Displays animated visualizations of real learner journeys through the
 * knowledge graph, providing social proof that the platform works.
 *
 * Features:
 * - Animated SVG paths showing skill trajectories
 * - Filtering by starting point (beginner, career switcher, etc.)
 * - Journey cards with testimonials
 * - Pulsing activity indicators
 * - Social proof statistics
 */

// Components
export {
  SocialProofVisualization,
  type SocialProofVisualizationProps,
  LearnerPath,
  JourneyCard,
  JourneyCardCompact,
  PathFilter,
  PathFilterCompact,
  SocialProofStats,
  SocialProofStatsCompact,
} from "./components";

// Types
export type {
  LearnerStartingPoint,
  CareerOutcome,
  JourneyNode,
  LearnerJourney,
  PathFilter as PathFilterType,
  PathStats,
  FilterOption,
} from "./lib/types";

// Data & utilities
export {
  mockLearnerJourneys,
  startingPointFilters,
  calculatePathStats,
  getOutcomeLabel,
  getStartingPointLabel,
} from "./lib/mockData";
