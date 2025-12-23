/**
 * Progression Coordinate Display Helpers
 * Functions for UI rendering and color classes
 */

import type {
    ProgressionLevel,
    ProgressionBreadth,
    ProgressionLevelMeta,
    ProgressionBreadthMeta,
} from "./types";
import { PROGRESSION_LEVELS, PROGRESSION_BREADTHS } from "./constants";

// ============================================================================
// LEVEL DISPLAY HELPERS
// ============================================================================

/**
 * Get a color class for a progression level (Tailwind-compatible)
 */
export function getProgressionColorClass(
    level: ProgressionLevel,
    variant: "bg" | "text" | "border" = "bg"
): string {
    const color = PROGRESSION_LEVELS[level].color;
    return `${variant}-${color}-500`;
}

/**
 * Get a gradient class for spanning multiple progression levels
 */
export function getProgressionGradient(
    from: ProgressionLevel,
    to: ProgressionLevel
): string {
    const fromColor = PROGRESSION_LEVELS[from].color;
    const toColor = PROGRESSION_LEVELS[to].color;
    return `from-${fromColor}-500 to-${toColor}-500`;
}

/**
 * Get all progression levels as an ordered array
 */
export function getAllProgressionLevels(): ProgressionLevelMeta[] {
    return [
        PROGRESSION_LEVELS[0],
        PROGRESSION_LEVELS[1],
        PROGRESSION_LEVELS[2],
        PROGRESSION_LEVELS[3],
        PROGRESSION_LEVELS[4],
    ];
}

/**
 * Check if a given level is a foundational level (0 or 1)
 */
export function isFoundationalLevel(level: ProgressionLevel): boolean {
    return level <= 1;
}

/**
 * Check if a given level is an advanced level (3 or 4)
 */
export function isAdvancedLevel(level: ProgressionLevel): boolean {
    return level >= 3;
}

// ============================================================================
// BREADTH DISPLAY HELPERS
// ============================================================================

/**
 * Get a color class for a progression breadth (Tailwind-compatible)
 */
export function getBreadthColorClass(
    breadth: ProgressionBreadth,
    variant: "bg" | "text" | "border" = "bg"
): string {
    const color = PROGRESSION_BREADTHS[breadth].color;
    return `${variant}-${color}-500`;
}

/**
 * Get all progression breadths as an ordered array
 */
export function getAllProgressionBreadths(): ProgressionBreadthMeta[] {
    return [
        PROGRESSION_BREADTHS[0],
        PROGRESSION_BREADTHS[1],
        PROGRESSION_BREADTHS[2],
        PROGRESSION_BREADTHS[3],
        PROGRESSION_BREADTHS[4],
    ];
}

/**
 * Check if a given breadth indicates mandatory content
 */
export function isMandatoryBreadth(breadth: ProgressionBreadth): boolean {
    return breadth <= 1;
}

/**
 * Check if a given breadth indicates elective content
 */
export function isElectiveBreadth(breadth: ProgressionBreadth): boolean {
    return breadth >= 3;
}
