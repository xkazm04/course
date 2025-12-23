/**
 * Description Generation
 *
 * Functions for generating human-readable pedagogical descriptions.
 */

import type {
    TeachingStrategy,
    StructureCharacteristic,
    TierStatistics,
} from "../types";

/**
 * Strategy descriptions mapping.
 */
const STRATEGY_DESCRIPTIONS: Record<TeachingStrategy, string> = {
    "breadth-first":
        "This curriculum follows a breadth-first approach, establishing a wide foundation before diving deep into specializations.",
    "depth-first":
        "This curriculum prioritizes depth-first learning, encouraging mastery of one track before branching to related areas.",
    spiral:
        "This curriculum uses a spiral approach, revisiting concepts at increasing levels of complexity throughout the journey.",
    "mastery-based":
        "This curriculum is mastery-based, requiring completion of prerequisites before advancing to more complex topics.",
    exploratory:
        "This curriculum supports exploratory learning with multiple valid entry points and self-directed paths.",
    convergent:
        "This curriculum employs a convergent structure where multiple skill tracks merge into unified advanced competencies.",
    divergent:
        "This curriculum has a divergent structure, with foundational content branching into multiple specialization tracks.",
    hybrid:
        "This curriculum combines multiple pedagogical approaches, offering both structure and flexibility.",
};

/**
 * Generate human-readable pedagogical description.
 */
export function generatePedagogicalDescription(
    strategy: TeachingStrategy,
    characteristics: StructureCharacteristic[],
    tierStats: TierStatistics[]
): string {
    const parts: string[] = [];

    // Strategy description
    parts.push(STRATEGY_DESCRIPTIONS[strategy]);

    // Characteristics elaboration
    if (characteristics.includes("foundational-breadth")) {
        const tier0 = tierStats.find((s) => s.level === 0);
        parts.push(
            `The structure emphasizes foundational breadth with ${tier0?.nodeCount || 0} entry-level topics.`
        );
    }

    if (characteristics.includes("skill-convergence")) {
        parts.push(
            "Skills converge at intermediate levels, synthesizing diverse knowledge into cohesive competencies."
        );
    }

    if (characteristics.includes("specialization-divergence")) {
        parts.push(
            "Advanced tiers branch into specialized tracks, allowing deep expertise in chosen areas."
        );
    }

    return parts.join(" ");
}

/**
 * Generate recommendations based on topology analysis.
 */
export function generateRecommendations(
    strategy: TeachingStrategy,
    characteristics: StructureCharacteristic[]
): string[] {
    const recommendations: string[] = [];

    // Strategy-based recommendations
    switch (strategy) {
        case "breadth-first":
            recommendations.push(
                "Complete all foundation topics before advancing to build a strong base."
            );
            break;
        case "depth-first":
            recommendations.push(
                "Choose one track and follow it deeply before exploring alternatives."
            );
            break;
        case "mastery-based":
            recommendations.push(
                "Don't skip prerequisites - each builds essential skills for the next level."
            );
            break;
        case "exploratory":
            recommendations.push(
                "Feel free to start with any topic that interests you - the structure supports multiple entry points."
            );
            break;
        case "convergent":
            recommendations.push(
                "Working on multiple foundational tracks in parallel will unlock powerful synthesis topics."
            );
            break;
        case "divergent":
            recommendations.push(
                "After mastering the core, choose a specialization aligned with your career goals."
            );
            break;
    }

    // Characteristic-based recommendations
    if (characteristics.includes("hub-and-spoke")) {
        recommendations.push(
            "The central topic connects to many others - consider starting there for maximum flexibility."
        );
    }

    if (characteristics.includes("top-heavy")) {
        recommendations.push(
            "This curriculum has substantial advanced content - foundation topics unlock significant depth."
        );
    }

    return recommendations;
}
