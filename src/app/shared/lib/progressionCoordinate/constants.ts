/**
 * Progression Coordinate Constants
 * Static definitions for levels, breadths, and zones
 */

import type {
    ProgressionLevel,
    ProgressionBreadth,
    ProgressionPhase,
    ProgressionOptionality,
    ProgressionLevelMeta,
    ProgressionBreadthMeta,
    CoordinateZone,
} from "./types";

// ============================================================================
// LEVEL DEFINITIONS
// ============================================================================

/**
 * Complete progression level metadata definitions.
 * This is the "Rosetta Stone" that translates between all representations.
 */
export const PROGRESSION_LEVELS: Record<ProgressionLevel, ProgressionLevelMeta> = {
    0: {
        level: 0,
        phase: "foundation",
        label: "Foundation",
        description: "Starting points and absolute prerequisites",
        color: "emerald",
        yPositionRange: { min: 0, max: 20 },
        sortPriority: 0,
        orbitalFactor: 0,
    },
    1: {
        level: 1,
        phase: "core",
        label: "Core",
        description: "Essential knowledge building on foundations",
        color: "blue",
        yPositionRange: { min: 20, max: 40 },
        sortPriority: 1,
        orbitalFactor: 0.25,
    },
    2: {
        level: 2,
        phase: "intermediate",
        label: "Intermediate",
        description: "Skills requiring core knowledge",
        color: "indigo",
        yPositionRange: { min: 40, max: 60 },
        sortPriority: 2,
        orbitalFactor: 0.5,
    },
    3: {
        level: 3,
        phase: "advanced",
        label: "Advanced",
        description: "Deep expertise topics",
        color: "purple",
        yPositionRange: { min: 60, max: 80 },
        sortPriority: 3,
        orbitalFactor: 0.75,
    },
    4: {
        level: 4,
        phase: "expert",
        label: "Expert",
        description: "Cutting-edge or highly specialized content",
        color: "rose",
        yPositionRange: { min: 80, max: 100 },
        sortPriority: 4,
        orbitalFactor: 1,
    },
};

// ============================================================================
// BREADTH DEFINITIONS
// ============================================================================

/**
 * Complete progression breadth metadata definitions.
 */
export const PROGRESSION_BREADTHS: Record<ProgressionBreadth, ProgressionBreadthMeta> = {
    0: {
        breadth: 0,
        optionality: "mandatory",
        label: "Mandatory",
        description: "Only path at this level - must complete",
        color: "red",
        xPositionRange: { min: 0, max: 20 },
        densityFactor: 1.0,
        iconHint: "lock",
    },
    1: {
        breadth: 1,
        optionality: "recommended",
        label: "Recommended",
        description: "Few alternatives - strongly suggested",
        color: "orange",
        xPositionRange: { min: 20, max: 40 },
        densityFactor: 0.85,
        iconHint: "star",
    },
    2: {
        breadth: 2,
        optionality: "suggested",
        label: "Suggested",
        description: "Several options - good choice",
        color: "yellow",
        xPositionRange: { min: 40, max: 60 },
        densityFactor: 0.7,
        iconHint: "lightbulb",
    },
    3: {
        breadth: 3,
        optionality: "optional",
        label: "Optional",
        description: "Many alternatives - choose based on interest",
        color: "lime",
        xPositionRange: { min: 60, max: 80 },
        densityFactor: 0.55,
        iconHint: "compass",
    },
    4: {
        breadth: 4,
        optionality: "elective",
        label: "Elective",
        description: "Very many alternatives - explore freely",
        color: "cyan",
        xPositionRange: { min: 80, max: 100 },
        densityFactor: 0.4,
        iconHint: "sparkles",
    },
};

// ============================================================================
// ZONE DEFINITIONS
// ============================================================================

/**
 * Zone metadata for display purposes.
 */
export const COORDINATE_ZONES: Record<
    CoordinateZone,
    { label: string; description: string; color: string; priority: number }
> = {
    "critical-path": {
        label: "Critical Path",
        description: "Must-learn foundational content - start here",
        color: "red",
        priority: 0,
    },
    "core-curriculum": {
        label: "Core Curriculum",
        description: "Essential knowledge for solid foundations",
        color: "orange",
        priority: 1,
    },
    recommended: {
        label: "Recommended",
        description: "Strongly suggested for well-rounded skills",
        color: "yellow",
        priority: 2,
    },
    exploratory: {
        label: "Exploratory",
        description: "Choose based on personal interest or goals",
        color: "lime",
        priority: 3,
    },
    specialization: {
        label: "Specialization",
        description: "Advanced topics for deep expertise",
        color: "purple",
        priority: 4,
    },
};

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const PROGRESSION_LABELS: Record<ProgressionLevel, string> = {
    0: "Foundation",
    1: "Core",
    2: "Intermediate",
    3: "Advanced",
    4: "Expert",
};

export const PROGRESSION_PHASES: ProgressionPhase[] = [
    "foundation",
    "core",
    "intermediate",
    "advanced",
    "expert",
];

export const BREADTH_LABELS: Record<ProgressionBreadth, string> = {
    0: "Mandatory",
    1: "Recommended",
    2: "Suggested",
    3: "Optional",
    4: "Elective",
};

export const BREADTH_OPTIONALITIES: ProgressionOptionality[] = [
    "mandatory",
    "recommended",
    "suggested",
    "optional",
    "elective",
];
