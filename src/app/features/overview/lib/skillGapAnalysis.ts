/**
 * Skill Gap Analysis for Knowledge Map
 *
 * Analyzes user's existing skills from completed nodes and computes
 * gap analysis against each curriculum node's required skills.
 */

import { CurriculumNode, CurriculumConnection } from "./curriculumTypes";

/**
 * Skill mastery level for a node
 * - mastered: User has all skills (completed or >80% progress)
 * - partial: User has some skills (40-80%)
 * - gap: User has few/no skills (<40%)
 */
export type SkillMasteryLevel = "mastered" | "partial" | "gap";

/**
 * Result of skill gap analysis for a single node
 */
export interface NodeSkillGapResult {
    nodeId: string;
    masteryLevel: SkillMasteryLevel;
    matchedSkills: string[];
    missingSkills: string[];
    matchPercentage: number;
}

/**
 * Complete skill gap analysis result
 */
export interface SkillGapAnalysis {
    nodeResults: Map<string, NodeSkillGapResult>;
    userMasteredSkills: Set<string>;
    recommendedPaths: Set<string>; // Connection IDs that lead to gaps
    totalMastered: number;
    totalPartial: number;
    totalGap: number;
}

/**
 * Build a set of mastered skills from completed curriculum nodes.
 * Skills from in_progress nodes contribute at reduced weight.
 */
export function buildMasteredSkillsSet(
    nodes: CurriculumNode[],
    completedNodeIds: Set<string>,
    inProgressNodeIds: Set<string>
): Set<string> {
    const masteredSkills = new Set<string>();

    for (const node of nodes) {
        if (completedNodeIds.has(node.id)) {
            // All skills from completed nodes are mastered
            node.skills.forEach(skill => masteredSkills.add(skill.toLowerCase()));
        } else if (inProgressNodeIds.has(node.id)) {
            // In-progress nodes contribute partial skills
            // For simplicity, we consider the first half of skills as learned
            const partialCount = Math.ceil(node.skills.length / 2);
            node.skills.slice(0, partialCount).forEach(skill =>
                masteredSkills.add(skill.toLowerCase())
            );
        }
    }

    return masteredSkills;
}

/**
 * Analyze a single node against user's mastered skills
 */
export function analyzeNodeSkillGap(
    node: CurriculumNode,
    masteredSkills: Set<string>
): NodeSkillGapResult {
    const nodeSkills = node.skills.map(s => s.toLowerCase());
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const skill of node.skills) {
        if (masteredSkills.has(skill.toLowerCase())) {
            matchedSkills.push(skill);
        } else {
            missingSkills.push(skill);
        }
    }

    const matchPercentage = nodeSkills.length > 0
        ? (matchedSkills.length / nodeSkills.length) * 100
        : 100; // Nodes with no skills are considered mastered

    let masteryLevel: SkillMasteryLevel;
    if (matchPercentage >= 80) {
        masteryLevel = "mastered";
    } else if (matchPercentage >= 40) {
        masteryLevel = "partial";
    } else {
        masteryLevel = "gap";
    }

    return {
        nodeId: node.id,
        masteryLevel,
        matchedSkills,
        missingSkills,
        matchPercentage,
    };
}

/**
 * Identify recommended paths - connections that lead to gap nodes from mastered/partial nodes.
 * These are priority learning paths that bridge skill gaps.
 */
export function identifyRecommendedPaths(
    connections: CurriculumConnection[],
    nodeResults: Map<string, NodeSkillGapResult>
): Set<string> {
    const recommendedPaths = new Set<string>();

    for (const conn of connections) {
        const fromResult = nodeResults.get(conn.from);
        const toResult = nodeResults.get(conn.to);

        if (!fromResult || !toResult) continue;

        // Recommended path: from mastered/partial to gap, or partial to gap
        const fromIsReady = fromResult.masteryLevel === "mastered" || fromResult.masteryLevel === "partial";
        const toIsGap = toResult.masteryLevel === "gap";
        const toIsPartial = toResult.masteryLevel === "partial";

        // Priority 1: mastered -> gap (bridge the gap!)
        // Priority 2: mastered -> partial (build on foundation)
        // Priority 3: partial -> gap (continue learning)
        if (fromResult.masteryLevel === "mastered" && toIsGap) {
            recommendedPaths.add(`${conn.from}->${conn.to}`);
        } else if (fromResult.masteryLevel === "mastered" && toIsPartial) {
            recommendedPaths.add(`${conn.from}->${conn.to}`);
        } else if (fromResult.masteryLevel === "partial" && toIsGap && conn.type === "required") {
            recommendedPaths.add(`${conn.from}->${conn.to}`);
        }
    }

    return recommendedPaths;
}

/**
 * Perform complete skill gap analysis for all nodes
 */
export function analyzeSkillGaps(
    nodes: CurriculumNode[],
    connections: CurriculumConnection[],
    completedNodeIds: Set<string>,
    inProgressNodeIds: Set<string>
): SkillGapAnalysis {
    // Build mastered skills set
    const userMasteredSkills = buildMasteredSkillsSet(
        nodes,
        completedNodeIds,
        inProgressNodeIds
    );

    // Analyze each node
    const nodeResults = new Map<string, NodeSkillGapResult>();
    let totalMastered = 0;
    let totalPartial = 0;
    let totalGap = 0;

    for (const node of nodes) {
        const result = analyzeNodeSkillGap(node, userMasteredSkills);
        nodeResults.set(node.id, result);

        switch (result.masteryLevel) {
            case "mastered":
                totalMastered++;
                break;
            case "partial":
                totalPartial++;
                break;
            case "gap":
                totalGap++;
                break;
        }
    }

    // Identify recommended paths
    const recommendedPaths = identifyRecommendedPaths(connections, nodeResults);

    return {
        nodeResults,
        userMasteredSkills,
        recommendedPaths,
        totalMastered,
        totalPartial,
        totalGap,
    };
}

/**
 * Get CSS color styles for skill gap visualization
 */
export const SKILL_GAP_COLORS = {
    mastered: {
        bg: "bg-[var(--forge-success)]/10",
        border: "border-[var(--forge-success)]",
        text: "text-[var(--forge-success)]",
        ring: "ring-[var(--forge-success)]",
        stroke: "var(--forge-success)",
    },
    partial: {
        bg: "bg-[var(--forge-warning)]/10",
        border: "border-[var(--forge-warning)]",
        text: "text-[var(--forge-warning)]",
        ring: "ring-[var(--forge-warning)]",
        stroke: "var(--forge-warning)",
    },
    gap: {
        bg: "bg-[var(--forge-error)]/10",
        border: "border-[var(--forge-error)]",
        text: "text-[var(--forge-error)]",
        ring: "ring-[var(--forge-error)]",
        stroke: "var(--forge-error)",
    },
};

/**
 * Determine connection stroke width based on recommendation status
 */
export function getRecommendedPathWidth(
    connectionId: string,
    recommendedPaths: Set<string>,
    baseWidth: number = 2
): number {
    return recommendedPaths.has(connectionId) ? baseWidth * 2.5 : baseWidth;
}
