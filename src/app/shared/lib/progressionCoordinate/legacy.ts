/**
 * Progression Coordinate Legacy Compatibility
 * Functions for backward compatibility with older data formats
 */

import type { ProgressionLevel } from "./types";
import { toProgressionLevel } from "./conversions";

// ============================================================================
// HIERARCHY LEVEL MAPPING
// ============================================================================

/**
 * Mapping from old hierarchyLevel (0-3) to new ProgressionLevel (0-4).
 * Used for backward compatibility with learningPathGraph.ts data.
 */
export function hierarchyLevelToProgression(
    hierarchyLevel: 0 | 1 | 2 | 3
): ProgressionLevel {
    return hierarchyLevel as ProgressionLevel;
}

// ============================================================================
// TIMELINE PHASE MAPPING
// ============================================================================

/**
 * Mapping from timeline phase to ProgressionLevel.
 * Used for backward compatibility with learningPathGraph.ts data.
 */
export function timelinePhaseToProgression(
    phase: "foundation" | "intermediate" | "advanced" | "specialization"
): ProgressionLevel {
    switch (phase) {
        case "foundation":
            return 0;
        case "intermediate":
            return 2;
        case "advanced":
            return 3;
        case "specialization":
            return 4;
        default:
            return 2;
    }
}

// ============================================================================
// TIER MAPPING
// ============================================================================

/**
 * Mapping from old tier (0-4) in curriculumData to ProgressionLevel.
 * This is a direct 1:1 mapping since they use the same scale.
 */
export function tierToProgression(tier: number): ProgressionLevel {
    return toProgressionLevel(tier);
}
