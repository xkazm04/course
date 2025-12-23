/**
 * Social Proof Visualization Types
 *
 * Defines the data structures for displaying real learner journeys
 * as animated paths through the knowledge graph.
 */

/**
 * Starting point categories for filtering learner paths
 */
export type LearnerStartingPoint =
  | "beginner"
  | "career-switcher"
  | "intermediate"
  | "bootcamp-graduate"
  | "self-taught";

/**
 * Career outcome/destination after completing the learning path
 */
export type CareerOutcome =
  | "frontend-engineer"
  | "senior-engineer"
  | "fullstack-developer"
  | "data-scientist"
  | "tech-lead"
  | "product-engineer"
  | "devops-engineer";

/**
 * A single node in a learner's journey through the knowledge graph
 */
export interface JourneyNode {
  /** Unique identifier for the node */
  id: string;
  /** Display name of the skill/topic */
  name: string;
  /** Color for the node (matches knowledge graph domain) */
  color: string;
  /** X position percentage (0-100) */
  x: number;
  /** Y position percentage (0-100) */
  y: number;
  /** Time spent at this node (weeks) */
  duration: number;
  /** Whether this was a major milestone */
  isMilestone?: boolean;
}

/**
 * A complete learner journey through the platform
 */
export interface LearnerJourney {
  /** Unique journey identifier */
  id: string;
  /** Anonymous profile label */
  profileLabel: string;
  /** Starting background/context */
  startingPoint: LearnerStartingPoint;
  /** Previous field if career switcher */
  previousField?: string;
  /** Career outcome achieved */
  outcome: CareerOutcome;
  /** Total journey duration in months */
  durationMonths: number;
  /** Nodes visited in order */
  nodes: JourneyNode[];
  /** Primary color for path visualization */
  pathColor: string;
  /** Activity pulse intensity (0-1) */
  activityLevel: number;
  /** Short testimonial quote */
  testimonial?: string;
}

/**
 * Filter configuration for the path visualization
 */
export interface PathFilter {
  /** Filter by starting point (null = show all) */
  startingPoint: LearnerStartingPoint | null;
  /** Filter by career outcome (null = show all) */
  outcome: CareerOutcome | null;
  /** Minimum duration in months (null = no minimum) */
  minDuration: number | null;
  /** Maximum duration in months (null = no maximum) */
  maxDuration: number | null;
}

/**
 * Statistics about learner paths
 */
export interface PathStats {
  /** Total number of successful journeys */
  totalJourneys: number;
  /** Average completion time in months */
  averageMonths: number;
  /** Success rate percentage */
  successRate: number;
  /** Most common starting point */
  popularStartingPoint: LearnerStartingPoint;
  /** Most common outcome */
  popularOutcome: CareerOutcome;
}

/**
 * Props for path filter button
 */
export interface FilterOption {
  id: string;
  label: string;
  value: LearnerStartingPoint;
  icon: string;
  count: number;
}
