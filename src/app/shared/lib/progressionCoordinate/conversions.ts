/**
 * Progression Coordinate Conversions
 * Functions for converting between coordinate representations
 */

import type {
    ProgressionLevel,
    ProgressionBreadth,
    ProgressionPhase,
    ProgressionOptionality,
    ProgressionCoordinate,
    ProgressionLevelMeta,
    ProgressionBreadthMeta,
} from "./types";
import { PROGRESSION_LEVELS, PROGRESSION_BREADTHS } from "./constants";

// ============================================================================
// LEVEL CONVERSIONS
// ============================================================================

/**
 * Convert a numeric tier to a ProgressionLevel (clamped to valid range)
 */
export function toProgressionLevel(tier: number): ProgressionLevel {
    const clamped = Math.max(0, Math.min(4, Math.round(tier)));
    return clamped as ProgressionLevel;
}

/**
 * Get phase name from a progression level
 */
export function getPhase(level: ProgressionLevel): ProgressionPhase {
    return PROGRESSION_LEVELS[level].phase;
}

/**
 * Get display label for a progression level
 */
export function getProgressionLabel(level: ProgressionLevel): string {
    return PROGRESSION_LEVELS[level].label;
}

/**
 * Get full metadata for a progression level
 */
export function getProgressionMeta(level: ProgressionLevel): ProgressionLevelMeta {
    return PROGRESSION_LEVELS[level];
}

/**
 * Convert phase name to progression level
 */
export function phaseToLevel(phase: ProgressionPhase): ProgressionLevel {
    const entry = Object.values(PROGRESSION_LEVELS).find((m) => m.phase === phase);
    return entry?.level ?? 0;
}

// ============================================================================
// BREADTH CONVERSIONS
// ============================================================================

/**
 * Convert a numeric peer count to a ProgressionBreadth (clamped to valid range)
 */
export function toProgressionBreadth(peerCount: number): ProgressionBreadth {
    const clamped = Math.max(0, Math.min(4, Math.round(peerCount)));
    return clamped as ProgressionBreadth;
}

/**
 * Get optionality name from a progression breadth
 */
export function getOptionality(breadth: ProgressionBreadth): ProgressionOptionality {
    return PROGRESSION_BREADTHS[breadth].optionality;
}

/**
 * Get display label for a progression breadth
 */
export function getBreadthLabel(breadth: ProgressionBreadth): string {
    return PROGRESSION_BREADTHS[breadth].label;
}

/**
 * Get full metadata for a progression breadth
 */
export function getBreadthMeta(breadth: ProgressionBreadth): ProgressionBreadthMeta {
    return PROGRESSION_BREADTHS[breadth];
}

/**
 * Convert optionality name to progression breadth
 */
export function optionalityToBreadth(optionality: ProgressionOptionality): ProgressionBreadth {
    const entry = Object.values(PROGRESSION_BREADTHS).find((m) => m.optionality === optionality);
    return entry?.breadth ?? 2;
}

/**
 * Calculate breadth from peer count at the same level.
 */
export function peerCountToBreadth(peerCount: number): ProgressionBreadth {
    if (peerCount <= 1) return 0;
    if (peerCount <= 2) return 1;
    if (peerCount <= 4) return 2;
    if (peerCount <= 6) return 3;
    return 4;
}

// ============================================================================
// 2D COORDINATE CONVERSIONS
// ============================================================================

/**
 * Create a 2D progression coordinate from level and breadth values.
 */
export function createProgressionCoordinate(
    level: ProgressionLevel,
    breadth: ProgressionBreadth
): ProgressionCoordinate {
    return { level, breadth };
}

/**
 * Create a 2D progression coordinate from raw values (clamped).
 */
export function toProgressionCoordinate(
    level: number,
    breadth: number
): ProgressionCoordinate {
    return {
        level: toProgressionLevel(level),
        breadth: toProgressionBreadth(breadth),
    };
}

/**
 * Get a human-readable label for a 2D coordinate.
 */
export function getCoordinateLabel(coord: ProgressionCoordinate): string {
    const levelLabel = PROGRESSION_LEVELS[coord.level].label;
    const breadthLabel = PROGRESSION_BREADTHS[coord.breadth].label;
    return `${levelLabel} ${breadthLabel}`;
}

/**
 * Get full metadata for a 2D coordinate.
 */
export function getCoordinateMeta(coord: ProgressionCoordinate): {
    level: ProgressionLevelMeta;
    breadth: ProgressionBreadthMeta;
    label: string;
    description: string;
} {
    const levelMeta = PROGRESSION_LEVELS[coord.level];
    const breadthMeta = PROGRESSION_BREADTHS[coord.breadth];
    return {
        level: levelMeta,
        breadth: breadthMeta,
        label: getCoordinateLabel(coord),
        description: `${levelMeta.description}. ${breadthMeta.description}.`,
    };
}
