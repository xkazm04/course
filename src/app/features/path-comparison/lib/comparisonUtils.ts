/**
 * Path Comparison Utilities
 *
 * Utilities for calculating comparison scores and indicators
 * for the path comparison matrix feature.
 */

import type { LearningPath, LearningDomainId } from "@/app/shared/lib/types";
import {
    getPrerequisites as getGraphPrerequisites,
    getDependents as getGraphDependents,
    GRAPH_NODES,
} from "@/app/shared/lib/learningPathGraph";
import type {
    PathComparisonData,
    DimensionScore,
    ComparisonIndicator,
    ComparisonDimension,
    SkillAnalysis,
    PrerequisiteInfo,
    CombinedPathAnalysis,
    ExtendedPathComparisonData,
} from "./types";

// Mock squad activity data (would come from backend in production)
const SQUAD_ACTIVITY_MAP: Record<string, number> = {
    frontend: 85,
    fullstack: 92,
    backend: 78,
    databases: 65,
    games: 55,
    mobile: 70,
};

// Mock career outcome scores (would come from job market API in production)
const CAREER_OUTCOME_MAP: Record<string, { score: number; demand: string; salary: string }> = {
    frontend: { score: 88, demand: "High", salary: "$95k-$160k" },
    fullstack: { score: 95, demand: "Very High", salary: "$110k-$180k" },
    backend: { score: 90, demand: "High", salary: "$100k-$170k" },
    databases: { score: 75, demand: "Medium", salary: "$85k-$140k" },
    games: { score: 60, demand: "Medium", salary: "$70k-$130k" },
    mobile: { score: 82, demand: "High", salary: "$90k-$155k" },
};

/**
 * Calculate skill overlap percentage between paths
 */
function calculateSkillOverlap(path: LearningPath, allPaths: LearningPath[]): number {
    const pathSkills = new Set(path.skills.map(s => s.toLowerCase()));
    let totalOverlap = 0;
    let comparisons = 0;

    for (const otherPath of allPaths) {
        if (otherPath.id === path.id) continue;
        const otherSkills = otherPath.skills.map(s => s.toLowerCase());
        const overlap = otherSkills.filter(s => pathSkills.has(s)).length;
        totalOverlap += (overlap / Math.max(pathSkills.size, otherSkills.length)) * 100;
        comparisons++;
    }

    return comparisons > 0 ? Math.round(totalOverlap / comparisons) : 0;
}

/**
 * Determine comparison indicator based on value ranking
 */
function getIndicator(
    value: number,
    allValues: number[],
    higherIsBetter: boolean = true
): ComparisonIndicator {
    const sorted = [...allValues].sort((a, b) => higherIsBetter ? b - a : a - b);
    const rank = sorted.indexOf(value);

    if (rank === 0) return "advantage";
    if (rank === sorted.length - 1 && sorted.length > 1) return "disadvantage";
    return "neutral";
}

/**
 * Calculate dimension scores for a path relative to comparison paths
 */
function calculateDimensionScores(
    path: LearningPath,
    comparisonPaths: LearningPath[],
    allPaths: LearningPath[]
): DimensionScore[] {
    const scores: DimensionScore[] = [];

    // Time Investment (lower is better)
    const timeValues = comparisonPaths.map(p => p.hours);
    scores.push({
        dimension: "time_investment",
        value: path.hours,
        label: `${path.hours}h`,
        indicator: getIndicator(path.hours, timeValues, false),
        detail: `${path.courses} courses`,
    });

    // Skill Overlap (higher is better)
    const overlapValue = calculateSkillOverlap(path, allPaths);
    const overlapValues = comparisonPaths.map(p => calculateSkillOverlap(p, allPaths));
    scores.push({
        dimension: "skill_overlap",
        value: overlapValue,
        label: `${overlapValue}%`,
        indicator: getIndicator(overlapValue, overlapValues, true),
        detail: `${path.skills.length} core skills`,
    });

    // Career Outcomes (higher is better)
    const careerData = CAREER_OUTCOME_MAP[path.id] || { score: 70, demand: "Medium", salary: "N/A" };
    const careerValues = comparisonPaths.map(p => CAREER_OUTCOME_MAP[p.id]?.score || 70);
    scores.push({
        dimension: "career_outcomes",
        value: careerData.score,
        label: careerData.demand,
        indicator: getIndicator(careerData.score, careerValues, true),
        detail: careerData.salary,
    });

    // Squad Activity (higher is better)
    const squadValue = SQUAD_ACTIVITY_MAP[path.id] || 50;
    const squadValues = comparisonPaths.map(p => SQUAD_ACTIVITY_MAP[p.id] || 50);
    scores.push({
        dimension: "squad_activity",
        value: squadValue,
        label: `${squadValue}%`,
        indicator: getIndicator(squadValue, squadValues, true),
        detail: "Active learners",
    });

    return scores;
}

/**
 * Calculate overall recommendation score for a path
 */
function calculateOverallScore(scores: DimensionScore[]): number {
    const weights: Record<ComparisonDimension, number> = {
        time_investment: 0.2,
        skill_overlap: 0.25,
        career_outcomes: 0.35,
        squad_activity: 0.2,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const score of scores) {
        const weight = weights[score.dimension];
        // Normalize time investment (invert since lower is better)
        const normalizedValue = score.dimension === "time_investment"
            ? Math.max(0, 100 - (score.value / 3.2)) // Normalize to 0-100 scale
            : score.value;
        weightedSum += normalizedValue * weight;
        totalWeight += weight;
    }

    return Math.round(weightedSum / totalWeight);
}

/**
 * Generate full comparison data for selected paths
 */
export function generateComparisonData(
    selectedPaths: LearningPath[],
    allPaths: LearningPath[]
): PathComparisonData[] {
    return selectedPaths.map(path => {
        const scores = calculateDimensionScores(path, selectedPaths, allPaths);
        const overallScore = calculateOverallScore(scores);

        return {
            path,
            scores,
            overallScore,
        };
    });
}

/**
 * Get indicator color class for styling
 */
export function getIndicatorColorClass(indicator: ComparisonIndicator): string {
    switch (indicator) {
        case "advantage":
            return "text-[var(--forge-success)]";
        case "disadvantage":
            return "text-[var(--forge-warning)]";
        case "neutral":
        default:
            return "text-[var(--forge-text-secondary)]";
    }
}

/**
 * Get indicator background class for styling
 */
export function getIndicatorBgClass(indicator: ComparisonIndicator): string {
    switch (indicator) {
        case "advantage":
            return "bg-[var(--forge-success)]/10 border-[var(--forge-success)]/20";
        case "disadvantage":
            return "bg-[var(--forge-warning)]/10 border-[var(--forge-warning)]/20";
        case "neutral":
        default:
            return "bg-[var(--forge-bg-elevated)] border-[var(--forge-border-default)]";
    }
}

/**
 * Get indicator icon for visual diff
 */
export function getIndicatorIcon(indicator: ComparisonIndicator): string {
    switch (indicator) {
        case "advantage":
            return "ArrowUp";
        case "disadvantage":
            return "ArrowDown";
        case "neutral":
        default:
            return "Minus";
    }
}

// ============================================================================
// SKILL ANALYSIS UTILITIES
// ============================================================================

/**
 * Analyze skills for a path relative to other selected paths.
 * Identifies unique skills vs shared skills.
 */
export function analyzePathSkills(
    path: LearningPath,
    selectedPaths: LearningPath[]
): SkillAnalysis {
    const pathSkillsLower = path.skills.map(s => s.toLowerCase());
    const pathSkillsSet = new Set(pathSkillsLower);

    // Collect all skills from other selected paths
    const otherSkillsSet = new Set<string>();
    selectedPaths.forEach(otherPath => {
        if (otherPath.id === path.id) return;
        otherPath.skills.forEach(s => otherSkillsSet.add(s.toLowerCase()));
    });

    const uniqueSkills: string[] = [];
    const sharedSkills: string[] = [];

    path.skills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        if (otherSkillsSet.has(skillLower)) {
            sharedSkills.push(skill);
        } else {
            uniqueSkills.push(skill);
        }
    });

    return {
        uniqueSkills,
        sharedSkills,
        allSkills: path.skills,
    };
}

/**
 * Get all unique skills across all selected paths
 */
export function getAllUniqueSkills(selectedPaths: LearningPath[]): string[] {
    const skillSet = new Set<string>();
    selectedPaths.forEach(path => {
        path.skills.forEach(skill => skillSet.add(skill));
    });
    return Array.from(skillSet);
}

/**
 * Get skills that appear in multiple paths
 */
export function getOverlappingSkills(selectedPaths: LearningPath[]): string[] {
    const skillCounts: Record<string, number> = {};
    const skillOriginal: Record<string, string> = {};

    selectedPaths.forEach(path => {
        const seenInPath = new Set<string>();
        path.skills.forEach(skill => {
            const lower = skill.toLowerCase();
            if (!seenInPath.has(lower)) {
                seenInPath.add(lower);
                skillCounts[lower] = (skillCounts[lower] || 0) + 1;
                skillOriginal[lower] = skill;
            }
        });
    });

    return Object.entries(skillCounts)
        .filter(([, count]) => count > 1)
        .map(([lower]) => skillOriginal[lower]);
}

// ============================================================================
// PREREQUISITE ANALYSIS UTILITIES
// ============================================================================

/**
 * Get prerequisite information for a path relative to selected paths
 */
export function getPrerequisiteInfo(
    path: LearningPath,
    selectedPaths: LearningPath[]
): PrerequisiteInfo {
    const selectedIds = new Set(selectedPaths.map(p => p.id));
    const pathPrereqs = getGraphPrerequisites(path.id as LearningDomainId);
    const pathDependents = getGraphDependents(path.id as LearningDomainId);

    const prerequisites = pathPrereqs;
    const dependents = pathDependents;

    const hasSelectedPrerequisites = pathPrereqs.some(prereqId => selectedIds.has(prereqId));
    const hasSelectedDependents = pathDependents.some(depId => selectedIds.has(depId));

    return {
        prerequisites,
        dependents,
        hasSelectedPrerequisites,
        hasSelectedDependents,
    };
}

/**
 * Determine optimal learning order for selected paths based on prerequisites
 */
export function getSuggestedLearningOrder(selectedPaths: LearningPath[]): string[] {
    const selectedIds = new Set(selectedPaths.map(p => p.id));

    // Build prerequisite map for selected paths only
    const prereqMap: Record<string, string[]> = {};
    selectedPaths.forEach(path => {
        const prereqs = getGraphPrerequisites(path.id as LearningDomainId);
        prereqMap[path.id] = prereqs.filter(prereqId => selectedIds.has(prereqId));
    });

    // Topological sort using Kahn's algorithm
    const inDegree: Record<string, number> = {};
    selectedPaths.forEach(path => {
        inDegree[path.id] = prereqMap[path.id]?.length || 0;
    });

    const queue: string[] = [];
    const result: string[] = [];

    // Find all paths with no prerequisites in the selection
    Object.entries(inDegree).forEach(([id, degree]) => {
        if (degree === 0) queue.push(id);
    });

    while (queue.length > 0) {
        const current = queue.shift()!;
        result.push(current);

        // Reduce in-degree for paths that depend on current
        selectedPaths.forEach(path => {
            if (prereqMap[path.id]?.includes(current)) {
                inDegree[path.id]--;
                if (inDegree[path.id] === 0) {
                    queue.push(path.id);
                }
            }
        });
    }

    // If we couldn't sort all paths (circular dependency), return original order
    if (result.length < selectedPaths.length) {
        return selectedPaths.map(p => p.id);
    }

    return result;
}

// ============================================================================
// COMBINED PATH ANALYSIS
// ============================================================================

/**
 * Analyze combined learning paths for efficiency and recommendations
 */
export function analyzeCombinedPaths(
    selectedPaths: LearningPath[],
    allPaths: LearningPath[]
): CombinedPathAnalysis {
    if (selectedPaths.length < 2) {
        return {
            totalHours: selectedPaths[0]?.hours || 0,
            effectiveHours: selectedPaths[0]?.hours || 0,
            hoursSaved: 0,
            efficiencyGain: 0,
            totalUniqueSkills: selectedPaths[0]?.skills || [],
            overlappingSkills: [],
            totalCourses: selectedPaths[0]?.courses || 0,
            suggestedOrder: selectedPaths.map(p => p.id),
            isRecommendedCombo: false,
            recommendation: "Select at least 2 paths to compare",
        };
    }

    const totalHours = selectedPaths.reduce((sum, p) => sum + p.hours, 0);
    const totalCourses = selectedPaths.reduce((sum, p) => sum + p.courses, 0);

    const totalUniqueSkills = getAllUniqueSkills(selectedPaths);
    const overlappingSkills = getOverlappingSkills(selectedPaths);

    // Estimate time saved based on skill overlap
    // More overlapping skills = less effective learning needed
    const overlapRatio = overlappingSkills.length / totalUniqueSkills.length;
    const estimatedTimeSavedRatio = overlapRatio * 0.3; // Assume up to 30% savings from overlap
    const hoursSaved = Math.round(totalHours * estimatedTimeSavedRatio);
    const effectiveHours = totalHours - hoursSaved;
    const efficiencyGain = Math.round(estimatedTimeSavedRatio * 100);

    const suggestedOrder = getSuggestedLearningOrder(selectedPaths);

    // Determine if this is a recommended combination
    const selectedIds = new Set(selectedPaths.map(p => p.id));

    // Check for synergistic combinations
    const hasFrontendBackend = selectedIds.has("frontend") && selectedIds.has("backend");
    const hasFullstack = selectedIds.has("fullstack");
    const hasDatabasesBackend = selectedIds.has("databases") && selectedIds.has("backend");

    let isRecommendedCombo = false;
    let recommendation = "";

    if (hasFrontendBackend && !hasFullstack) {
        isRecommendedCombo = true;
        recommendation = "Great combo! Frontend + Backend covers full stack development with clear specialization in each area.";
    } else if (hasFullstack && (selectedIds.has("mobile") || selectedIds.has("games"))) {
        isRecommendedCombo = true;
        recommendation = "Excellent expansion! Full Stack + specialization gives you broad coverage plus depth.";
    } else if (hasDatabasesBackend) {
        isRecommendedCombo = true;
        recommendation = "Strong foundation! Databases + Backend creates deep server-side expertise.";
    } else if (overlappingSkills.length > totalUniqueSkills.length * 0.4) {
        recommendation = "High overlap detected. Consider if you need both paths or if one would suffice.";
    } else if (overlappingSkills.length < totalUniqueSkills.length * 0.1) {
        recommendation = "Low overlap - these paths are quite different. Good for broad skill coverage.";
    } else {
        recommendation = "Moderate overlap. This combination gives you a balanced mix of shared and unique skills.";
    }

    return {
        totalHours,
        effectiveHours,
        hoursSaved,
        efficiencyGain,
        totalUniqueSkills,
        overlappingSkills,
        totalCourses,
        suggestedOrder,
        isRecommendedCombo,
        recommendation,
    };
}

// ============================================================================
// EXTENDED COMPARISON DATA
// ============================================================================

/**
 * Generate extended comparison data including skill and prerequisite analysis
 */
export function generateExtendedComparisonData(
    selectedPaths: LearningPath[],
    allPaths: LearningPath[]
): ExtendedPathComparisonData[] {
    const baseData = generateComparisonData(selectedPaths, allPaths);

    return baseData.map((data, index) => ({
        ...data,
        skillAnalysis: analyzePathSkills(selectedPaths[index], selectedPaths),
        prerequisiteInfo: getPrerequisiteInfo(selectedPaths[index], selectedPaths),
    }));
}
