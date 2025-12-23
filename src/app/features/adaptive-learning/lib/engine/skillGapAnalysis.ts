/**
 * Skill Gap Analysis
 *
 * Functions for analyzing skill gaps between current skills and career goals.
 */

import type { LearnerProfile, SkillGapAnalysis } from "../types";
import { curriculumData, getNodeById } from "@/app/features/overview/lib/curriculumData";
import { mockJobMarketData } from "./mockData";

/**
 * Analyze skill gaps between current skills and career goal requirements
 */
export function analyzeSkillGaps(profile: LearnerProfile): SkillGapAnalysis {
    // Get the primary career goal
    const primaryGoal = profile.careerGoals.find(g => g.priority === "primary")
        || profile.careerGoals[0];

    if (!primaryGoal) {
        return {
            currentSkills: [],
            requiredSkills: [],
            gaps: [],
            overallGapScore: 0,
            estimatedTimeToClose: 0,
        };
    }

    // Map completed nodes to skills
    const currentSkillsMap = new Map<string, number>();
    profile.completedNodes.forEach(nodeId => {
        const node = getNodeById(nodeId);
        if (node) {
            node.skills.forEach(skill => {
                const currentLevel = currentSkillsMap.get(skill) || 0;
                currentSkillsMap.set(skill, Math.min(100, currentLevel + 25));
            });
        }
    });

    // Get job market data for the target role
    const targetRoleKey = primaryGoal.targetRole.toLowerCase().replace(/\s+/g, "-");
    const marketData = mockJobMarketData[targetRoleKey] || mockJobMarketData["frontend-developer"];

    // Build required skills list
    const requiredSkills = marketData.topSkills.map(s => ({
        skill: s.skill,
        minLevel: Math.round(s.frequency * 80),
    }));

    // Calculate gaps
    const gaps = requiredSkills.map(required => {
        const currentLevel = currentSkillsMap.get(required.skill) || 0;
        const gapSize = Math.max(0, required.minLevel - currentLevel);

        // Find related curriculum nodes
        const relatedNodes = curriculumData.nodes
            .filter(node => node.skills.includes(required.skill))
            .filter(node => !profile.completedNodes.includes(node.id))
            .sort((a, b) => a.tier - b.tier)
            .slice(0, 3)
            .map(n => n.id);

        return {
            skill: required.skill,
            currentLevel,
            requiredLevel: required.minLevel,
            gapSize,
            priority: gapSize > 50 ? "critical" as const :
                gapSize > 25 ? "important" as const : "nice-to-have" as const,
            relatedNodes,
        };
    }).filter(g => g.gapSize > 0);

    // Calculate overall gap score
    const totalGap = gaps.reduce((sum, g) => sum + g.gapSize, 0);
    const maxPossibleGap = requiredSkills.length * 100;
    const overallGapScore = (totalGap / maxPossibleGap) * 100;

    // Estimate time to close gaps
    const estimatedTimeToClose = gaps.reduce((sum, g) => {
        const avgTimePerGapPoint = 0.5;
        return sum + g.gapSize * avgTimePerGapPoint;
    }, 0);

    return {
        currentSkills: Array.from(currentSkillsMap.entries()).map(([skill, level]) => ({ skill, level })),
        requiredSkills,
        gaps,
        overallGapScore,
        estimatedTimeToClose,
    };
}
