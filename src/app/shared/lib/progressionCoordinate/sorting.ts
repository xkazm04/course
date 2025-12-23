/**
 * Progression Coordinate Sorting & Grouping
 * Functions for sorting and grouping items by progression coordinates
 */

import type {
    ProgressionLevel,
    ProgressionBreadth,
    ProgressionCoordinate,
} from "./types";
import { PROGRESSION_LEVELS } from "./constants";
import { peerCountToBreadth } from "./conversions";

// ============================================================================
// COMPARISON FUNCTIONS
// ============================================================================

/**
 * Compare two progression coordinates.
 * Primary sort by level, secondary sort by breadth.
 */
export function compareProgressionCoordinates(
    a: ProgressionCoordinate,
    b: ProgressionCoordinate
): number {
    const levelDiff = a.level - b.level;
    if (levelDiff !== 0) return levelDiff;
    return a.breadth - b.breadth;
}

/**
 * Check if two coordinates are equal.
 */
export function coordinatesEqual(
    a: ProgressionCoordinate,
    b: ProgressionCoordinate
): boolean {
    return a.level === b.level && a.breadth === b.breadth;
}

/**
 * Compare two progression levels for sorting.
 */
export function compareProgressionLevels(
    a: ProgressionLevel,
    b: ProgressionLevel
): number {
    return PROGRESSION_LEVELS[a].sortPriority - PROGRESSION_LEVELS[b].sortPriority;
}

// ============================================================================
// SORTING FUNCTIONS
// ============================================================================

/**
 * Sort an array of items by their progression level.
 */
export function sortByProgression<T>(
    items: T[],
    getLevel: (item: T) => ProgressionLevel
): T[] {
    return [...items].sort((a, b) => compareProgressionLevels(getLevel(a), getLevel(b)));
}

/**
 * Sort items by 2D progression coordinate (level first, then breadth).
 */
export function sortByProgressionCoordinate<T>(
    items: T[],
    getCoord: (item: T) => ProgressionCoordinate
): T[] {
    return [...items].sort((a, b) =>
        compareProgressionCoordinates(getCoord(a), getCoord(b))
    );
}

/**
 * Sort items by breadth within a single level.
 */
export function sortByBreadth<T>(
    items: T[],
    getBreadth: (item: T) => ProgressionBreadth
): T[] {
    return [...items].sort((a, b) => getBreadth(a) - getBreadth(b));
}

// ============================================================================
// GROUPING FUNCTIONS
// ============================================================================

/**
 * Group items by their progression level.
 */
export function groupByProgression<T>(
    items: T[],
    getLevel: (item: T) => ProgressionLevel
): Map<ProgressionLevel, T[]> {
    const groups = new Map<ProgressionLevel, T[]>();

    for (const level of [0, 1, 2, 3, 4] as ProgressionLevel[]) {
        groups.set(level, []);
    }

    for (const item of items) {
        const level = getLevel(item);
        groups.get(level)?.push(item);
    }

    return groups;
}

/**
 * Group items by their progression breadth.
 */
export function groupByBreadth<T>(
    items: T[],
    getBreadth: (item: T) => ProgressionBreadth
): Map<ProgressionBreadth, T[]> {
    const groups = new Map<ProgressionBreadth, T[]>();

    for (const breadth of [0, 1, 2, 3, 4] as ProgressionBreadth[]) {
        groups.set(breadth, []);
    }

    for (const item of items) {
        const breadth = getBreadth(item);
        groups.get(breadth)?.push(item);
    }

    return groups;
}

/**
 * Group items by their full 2D coordinate.
 */
export function groupByCoordinate<T>(
    items: T[],
    getCoord: (item: T) => ProgressionCoordinate
): Map<ProgressionLevel, Map<ProgressionBreadth, T[]>> {
    const groups = new Map<ProgressionLevel, Map<ProgressionBreadth, T[]>>();

    for (const level of [0, 1, 2, 3, 4] as ProgressionLevel[]) {
        const breadthMap = new Map<ProgressionBreadth, T[]>();
        for (const breadth of [0, 1, 2, 3, 4] as ProgressionBreadth[]) {
            breadthMap.set(breadth, []);
        }
        groups.set(level, breadthMap);
    }

    for (const item of items) {
        const coord = getCoord(item);
        groups.get(coord.level)?.get(coord.breadth)?.push(item);
    }

    return groups;
}

/**
 * Get a flat list of all coordinate cells that contain items.
 */
export function getPopulatedCoordinates<T>(
    items: T[],
    getCoord: (item: T) => ProgressionCoordinate
): Array<{ coord: ProgressionCoordinate; items: T[] }> {
    const grid = groupByCoordinate(items, getCoord);
    const result: Array<{ coord: ProgressionCoordinate; items: T[] }> = [];

    Array.from(grid.entries()).forEach(([level, breadthMap]) => {
        Array.from(breadthMap.entries()).forEach(([breadth, cellItems]) => {
            if (cellItems.length > 0) {
                result.push({
                    coord: { level, breadth },
                    items: cellItems,
                });
            }
        });
    });

    return result.sort((a, b) => compareProgressionCoordinates(a.coord, b.coord));
}

/**
 * Calculate breadth values for items based on peer count at each level.
 */
export function computeBreadthFromPeerCount<T>(
    items: T[],
    getLevel: (item: T) => ProgressionLevel
): Map<T, ProgressionBreadth> {
    const levelCounts = new Map<ProgressionLevel, number>();
    for (const level of [0, 1, 2, 3, 4] as ProgressionLevel[]) {
        levelCounts.set(level, 0);
    }
    for (const item of items) {
        const level = getLevel(item);
        levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1);
    }

    const result = new Map<T, ProgressionBreadth>();
    for (const item of items) {
        const level = getLevel(item);
        const peerCount = levelCounts.get(level) ?? 1;
        result.set(item, peerCountToBreadth(peerCount));
    }

    return result;
}
