/**
 * Progression Coordinate Spatial Helpers
 * Functions for converting coordinates to spatial positions
 */

import type { ProgressionLevel, ProgressionCoordinate } from "./types";
import { PROGRESSION_LEVELS } from "./constants";
import { getHeatMapCell } from "./heatmap";

// ============================================================================
// Y-POSITION (LEVEL-BASED)
// ============================================================================

/**
 * Convert progression level to Y-position (percentage-based).
 */
export function progressionToYPosition(
    level: ProgressionLevel,
    positionWithinLevel: number = 0.5
): number {
    const meta = PROGRESSION_LEVELS[level];
    const range = meta.yPositionRange.max - meta.yPositionRange.min;
    return meta.yPositionRange.min + range * positionWithinLevel;
}

/**
 * Convert Y-position (percentage) back to progression level.
 */
export function yPositionToProgression(yPosition: number): ProgressionLevel {
    for (const level of [0, 1, 2, 3, 4] as ProgressionLevel[]) {
        const meta = PROGRESSION_LEVELS[level];
        if (yPosition <= meta.yPositionRange.max) {
            return level;
        }
    }
    return 4;
}

// ============================================================================
// ORBITAL (RADIAL) POSITIONING
// ============================================================================

/**
 * Convert progression level to orbital ring distance.
 */
export function progressionToOrbitalRadius(
    level: ProgressionLevel,
    maxRadius: number = 100
): number {
    const meta = PROGRESSION_LEVELS[level];
    return meta.orbitalFactor * maxRadius;
}

// ============================================================================
// 2D COORDINATE POSITIONING
// ============================================================================

/**
 * Convert 2D coordinate to spatial position for map rendering.
 */
export function coordinateToPosition(
    coord: ProgressionCoordinate,
    width: number,
    height: number,
    padding: number = 0.1
): { x: number; y: number } {
    const cell = getHeatMapCell(coord);
    const usableWidth = width * (1 - 2 * padding);
    const usableHeight = height * (1 - 2 * padding);

    return {
        x: width * padding + (cell.xPosition / 100) * usableWidth,
        y: height * padding + (cell.yPosition / 100) * usableHeight,
    };
}

/**
 * Get a CSS gradient that represents the 2D coordinate space.
 */
export function get2DCoordinateGradient(): string {
    return "linear-gradient(135deg, var(--color-emerald-500) 0%, var(--color-cyan-500) 100%)";
}
