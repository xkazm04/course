/**
 * Progression Coordinate Types
 * Core type definitions for the 2D progression coordinate system
 */

// ============================================================================
// PROGRESSION LEVEL TYPE (Y-AXIS)
// ============================================================================

/**
 * Progression level values (0-4) - THE Y-AXIS
 *
 * 0 = Foundation - Absolute prerequisites, starting points
 * 1 = Core - Essential knowledge building on foundations
 * 2 = Intermediate - Skills that require core knowledge
 * 3 = Advanced - Deep expertise topics
 * 4 = Expert - Cutting-edge or highly specialized content
 */
export type ProgressionLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Semantic phase names that map to progression levels.
 */
export type ProgressionPhase =
    | "foundation"
    | "core"
    | "intermediate"
    | "advanced"
    | "expert";

// ============================================================================
// PROGRESSION BREADTH TYPE (X-AXIS)
// ============================================================================

/**
 * Progression breadth values (0-4) - THE X-AXIS
 *
 * 0 = Singular - Only path at this level (mandatory)
 * 1 = Narrow - Few alternatives (strongly recommended)
 * 2 = Moderate - Several options (recommended)
 * 3 = Broad - Many alternatives (optional)
 * 4 = Expansive - Very many alternatives (highly elective)
 */
export type ProgressionBreadth = 0 | 1 | 2 | 3 | 4;

/**
 * Semantic optionality names that map to progression breadth.
 */
export type ProgressionOptionality =
    | "mandatory"
    | "recommended"
    | "suggested"
    | "optional"
    | "elective";

// ============================================================================
// COORDINATE TYPES
// ============================================================================

/**
 * Complete 2D progression coordinate.
 */
export interface ProgressionCoordinate {
    /** Vertical axis: How advanced is this topic? (0-4) */
    level: ProgressionLevel;
    /** Horizontal axis: How many peer topics exist at this level? (0-4) */
    breadth: ProgressionBreadth;
}

// ============================================================================
// METADATA TYPES
// ============================================================================

/**
 * Complete metadata for each progression level.
 */
export interface ProgressionLevelMeta {
    level: ProgressionLevel;
    phase: ProgressionPhase;
    label: string;
    description: string;
    color: string;
    yPositionRange: { min: number; max: number };
    sortPriority: number;
    orbitalFactor: number;
}

/**
 * Complete metadata for each progression breadth level.
 */
export interface ProgressionBreadthMeta {
    breadth: ProgressionBreadth;
    optionality: ProgressionOptionality;
    label: string;
    description: string;
    color: string;
    xPositionRange: { min: number; max: number };
    densityFactor: number;
    iconHint: string;
}

/**
 * Coordinate zone classification for quick categorization.
 */
export type CoordinateZone =
    | "critical-path"     // Level 0-1, Breadth 0-1: Must-learn foundations
    | "core-curriculum"   // Level 1-2, Breadth 0-2: Essential learning
    | "recommended"       // Level 2-3, Breadth 1-2: Strongly suggested
    | "exploratory"       // Level 2-3, Breadth 3-4: Choose based on interest
    | "specialization";   // Level 3-4, Breadth 2-4: Advanced electives

/**
 * Heat map cell data for visualization.
 */
export interface HeatMapCell {
    coord: ProgressionCoordinate;
    label: string;
    levelMeta: ProgressionLevelMeta;
    breadthMeta: ProgressionBreadthMeta;
    opacity: number;
    xPosition: number;
    yPosition: number;
    primaryColor: string;
    secondaryColor: string;
}
