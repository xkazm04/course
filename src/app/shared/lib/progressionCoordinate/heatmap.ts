/**
 * Progression Coordinate Heat Map Support
 * Functions for 2D visualization and heat map rendering
 */

import type {
    ProgressionLevel,
    ProgressionBreadth,
    ProgressionCoordinate,
    HeatMapCell,
    CoordinateZone,
} from "./types";
import { PROGRESSION_LEVELS, PROGRESSION_BREADTHS, COORDINATE_ZONES } from "./constants";
import { getCoordinateLabel } from "./conversions";

// ============================================================================
// HEAT MAP CELL GENERATION
// ============================================================================

/**
 * Generate heat map cell data for a coordinate.
 */
export function getHeatMapCell(coord: ProgressionCoordinate): HeatMapCell {
    const levelMeta = PROGRESSION_LEVELS[coord.level];
    const breadthMeta = PROGRESSION_BREADTHS[coord.breadth];

    const yPosition =
        levelMeta.yPositionRange.min +
        (levelMeta.yPositionRange.max - levelMeta.yPositionRange.min) * 0.5;
    const xPosition =
        breadthMeta.xPositionRange.min +
        (breadthMeta.xPositionRange.max - breadthMeta.xPositionRange.min) * 0.5;

    return {
        coord,
        label: getCoordinateLabel(coord),
        levelMeta,
        breadthMeta,
        opacity: breadthMeta.densityFactor,
        xPosition,
        yPosition,
        primaryColor: levelMeta.color,
        secondaryColor: breadthMeta.color,
    };
}

/**
 * Generate a full 5x5 heat map grid.
 */
export function generateHeatMapGrid(): HeatMapCell[][] {
    const grid: HeatMapCell[][] = [];

    for (const level of [0, 1, 2, 3, 4] as ProgressionLevel[]) {
        const row: HeatMapCell[] = [];
        for (const breadth of [0, 1, 2, 3, 4] as ProgressionBreadth[]) {
            row.push(getHeatMapCell({ level, breadth }));
        }
        grid.push(row);
    }

    return grid;
}

// ============================================================================
// COORDINATE STYLES
// ============================================================================

/**
 * Get coordinate-based styles for a node.
 */
export function getCoordinateStyles(coord: ProgressionCoordinate): {
    opacity: number;
    backgroundColor: string;
    borderColor: string;
    transform: string;
} {
    const cell = getHeatMapCell(coord);

    return {
        opacity: cell.opacity,
        backgroundColor: `var(--color-${cell.primaryColor}-500)`,
        borderColor: `var(--color-${cell.secondaryColor}-500)`,
        transform: `translate(${cell.xPosition}%, ${cell.yPosition}%)`,
    };
}

// ============================================================================
// COORDINATE IMPORTANCE & ORDERING
// ============================================================================

/**
 * Calculate relative importance of a coordinate.
 * Returns 0-1 scale where 0 is most important.
 */
export function getCoordinateImportance(coord: ProgressionCoordinate): number {
    const levelWeight = 0.6;
    const breadthWeight = 0.4;

    const normalizedLevel = coord.level / 4;
    const normalizedBreadth = coord.breadth / 4;

    return levelWeight * normalizedLevel + breadthWeight * normalizedBreadth;
}

/**
 * Get recommended learning order for coordinates.
 */
export function getRecommendedLearningOrder(
    coords: ProgressionCoordinate[]
): ProgressionCoordinate[] {
    return [...coords].sort(
        (a, b) => getCoordinateImportance(a) - getCoordinateImportance(b)
    );
}

// ============================================================================
// COORDINATE ZONES
// ============================================================================

/**
 * Classify a coordinate into a learning zone.
 */
export function getCoordinateZone(coord: ProgressionCoordinate): CoordinateZone {
    const { level, breadth } = coord;

    if (level <= 1 && breadth <= 1) {
        return "critical-path";
    }

    if (level <= 2 && breadth <= 2) {
        return "core-curriculum";
    }

    if (level <= 3 && breadth <= 2) {
        return "recommended";
    }

    if (level >= 3) {
        return "specialization";
    }

    return "exploratory";
}

/**
 * Get zone metadata for display purposes.
 */
export function getZoneMeta(zone: CoordinateZone) {
    return COORDINATE_ZONES[zone];
}
