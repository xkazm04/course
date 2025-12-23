/**
 * Predictive Data Helper Functions
 *
 * Utility functions for querying and analyzing predictive data.
 */

import type { SkillDemandPrediction, PredictiveJobPosting, IndustrySector } from "../predictiveTypes";
import { skillDemandPredictions } from "./skillDemandData";
import { industryTrends } from "./industryData";
import { predictiveJobPostings } from "./jobPostingsData";

/**
 * Get skills sorted by predicted demand growth
 */
export function getTopGrowingSkills(limit = 5): SkillDemandPrediction[] {
    return [...skillDemandPredictions]
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, limit);
}

/**
 * Get skills with lowest saturation (opportunity areas)
 */
export function getLowSaturationSkills(limit = 5): SkillDemandPrediction[] {
    return [...skillDemandPredictions]
        .filter((s) => s.trend !== "declining")
        .sort((a, b) => a.saturationLevel - b.saturationLevel)
        .slice(0, limit);
}

/**
 * Get skills by industry sector
 */
export function getSkillsForSector(sector: IndustrySector): string[] {
    const industry = industryTrends.find((t) => t.sector === sector);
    return industry?.topSkills ?? [];
}

/**
 * Get jobs matching user's skills
 */
export function getMatchingJobs(
    userSkills: string[],
    minMatch = 50
): PredictiveJobPosting[] {
    // In a real implementation, this would calculate actual match scores
    return predictiveJobPostings
        .filter((job) => job.matchScore >= minMatch)
        .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Calculate skill gap analysis
 */
export function analyzeSkillGaps(
    currentSkills: string[],
    targetRole: string
): { missing: string[]; improve: string[] } {
    // Find jobs matching target role
    const relevantJobs = predictiveJobPostings.filter((j) =>
        j.title.toLowerCase().includes(targetRole.toLowerCase())
    );

    const requiredSkills = new Set<string>();
    relevantJobs.forEach((job) => {
        job.requiredSkills.forEach((s) => requiredSkills.add(s.skill));
    });

    const currentSet = new Set(currentSkills.map((s) => s.toLowerCase()));
    const missing: string[] = [];
    const improve: string[] = [];

    requiredSkills.forEach((skill) => {
        if (!currentSet.has(skill.toLowerCase())) {
            missing.push(skill);
        }
    });

    return { missing, improve };
}

/**
 * Get market timing recommendation
 */
export function getMarketTimingAdvice(skillId: string): string {
    const skill = skillDemandPredictions.find((s) => s.skillId === skillId);
    if (!skill) return "No data available for this skill.";

    const window = skill.optimalLearningWindow;
    const now = new Date();
    const windowStart = new Date(window.recommendedStart);
    const windowEnd = new Date(window.windowCloses);

    if (now < windowStart) {
        return `Consider waiting until ${windowStart.toLocaleDateString()} to start learning ${skill.skillName}. ${window.reasoning}`;
    } else if (now > windowEnd) {
        return `The optimal learning window for ${skill.skillName} has passed. Market may be more saturated now.`;
    } else {
        return `Now is a good time to learn ${skill.skillName}! ${window.reasoning}`;
    }
}
