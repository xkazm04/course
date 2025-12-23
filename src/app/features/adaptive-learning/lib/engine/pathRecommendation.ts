/**
 * Path Recommendation
 *
 * Functions for generating personalized learning path recommendations.
 */

import type {
    LearnerProfile,
    PathRecommendation,
    LearningVelocity,
} from "../types";
import { curriculumData, getNodeById, getPrerequisites } from "@/app/features/overview/lib/curriculumData";
import type { CurriculumNode } from "@/app/features/overview/lib/curriculumTypes";
import { calculateLearningVelocity } from "./learningVelocity";
import { analyzeSkillGaps } from "./skillGapAnalysis";

/**
 * Generate personalized learning path recommendations
 */
export async function generateRecommendations(
    profile: LearnerProfile
): Promise<PathRecommendation[]> {
    const velocity = calculateLearningVelocity(profile);
    const skillGaps = analyzeSkillGaps(profile);
    const recommendations: PathRecommendation[] = [];

    const uncompletedNodes = curriculumData.nodes.filter(
        n => !profile.completedNodes.includes(n.id)
    );

    // Strategy 1: Career Goal Focused Path
    if (profile.careerGoals.length > 0) {
        const primaryGoal = profile.careerGoals.find(g => g.priority === "primary") || profile.careerGoals[0];
        const relevantNodes = findNodesForSkills(primaryGoal.requiredSkills, uncompletedNodes, profile);

        if (relevantNodes.length > 0) {
            recommendations.push(createPathRecommendation(
                "Career Accelerator",
                `Optimal path to become a ${primaryGoal.targetRole}`,
                relevantNodes.slice(0, 15),
                profile,
                velocity,
                [primaryGoal.id],
                0.95
            ));
        }
    }

    // Strategy 2: Skill Gap Closure Path
    if (skillGaps.gaps.length > 0) {
        const criticalNodes = skillGaps.gaps
            .filter(g => g.priority === "critical" || g.priority === "important")
            .flatMap(g => g.relatedNodes);
        const uniqueNodes = [...new Set(criticalNodes)]
            .map(id => getNodeById(id))
            .filter(Boolean) as CurriculumNode[];

        if (uniqueNodes.length > 0) {
            recommendations.push(createPathRecommendation(
                "Skill Gap Closer",
                "Focus on the most critical skills for your career goals",
                uniqueNodes.slice(0, 10),
                profile,
                velocity,
                profile.careerGoals.map(g => g.id),
                0.88
            ));
        }
    }

    // Strategy 3: Quick Wins Path
    const quickWinNodes = uncompletedNodes
        .filter(n => n.estimatedHours <= 4)
        .filter(n => {
            const prereqs = getPrerequisites(n.id);
            return prereqs.every(p => profile.completedNodes.includes(p.id));
        })
        .sort((a, b) => a.estimatedHours - b.estimatedHours)
        .slice(0, 8);

    if (quickWinNodes.length > 0) {
        recommendations.push(createPathRecommendation(
            "Quick Wins",
            "Build momentum with short, completable topics",
            quickWinNodes,
            profile,
            velocity,
            [],
            0.72
        ));
    }

    // Strategy 4: Deep Dive Path (for advanced users)
    if (profile.completedNodes.length > 20) {
        const advancedNodes = uncompletedNodes
            .filter(n => n.difficulty === "advanced" || n.difficulty === "expert")
            .filter(n => {
                const prereqs = getPrerequisites(n.id);
                return prereqs.length > 0 && prereqs.every(p => profile.completedNodes.includes(p.id));
            })
            .slice(0, 12);

        if (advancedNodes.length > 0) {
            recommendations.push(createPathRecommendation(
                "Expert Track",
                "Challenge yourself with advanced topics",
                advancedNodes,
                profile,
                velocity,
                [],
                0.65
            ));
        }
    }

    // Strategy 5: Continuation Path
    if (profile.inProgressNodes.length > 0) {
        const continuationNodes = profile.inProgressNodes
            .map(id => getNodeById(id))
            .filter(Boolean) as CurriculumNode[];

        const nextSteps = continuationNodes.flatMap(n => {
            return curriculumData.connections
                .filter(c => c.from === n.id)
                .map(c => getNodeById(c.to))
                .filter(Boolean)
                .filter(n => !profile.completedNodes.includes(n!.id)) as CurriculumNode[];
        });

        const combinedNodes = [...continuationNodes, ...nextSteps.slice(0, 5)];

        if (combinedNodes.length > 0) {
            recommendations.push(createPathRecommendation(
                "Continue Your Journey",
                "Pick up where you left off",
                combinedNodes,
                profile,
                velocity,
                [],
                0.85
            ));
        }
    }

    return recommendations.sort((a, b) => b.optimality - a.optimality);
}

/**
 * Find nodes that teach specific skills
 */
export function findNodesForSkills(
    requiredSkills: string[],
    availableNodes: CurriculumNode[],
    profile: LearnerProfile
): CurriculumNode[] {
    const skillSet = new Set(requiredSkills.map(s => s.toLowerCase()));

    const scoredNodes = availableNodes.map(node => {
        const matchingSkills = node.skills.filter(s =>
            skillSet.has(s.toLowerCase()) || requiredSkills.some(rs =>
                rs.toLowerCase().includes(s.toLowerCase()) ||
                s.toLowerCase().includes(rs.toLowerCase())
            )
        );

        const prereqs = getPrerequisites(node.id);
        const prereqsComplete = prereqs.every(p => profile.completedNodes.includes(p.id));

        return {
            node,
            score: matchingSkills.length * (prereqsComplete ? 2 : 1),
            prereqsComplete,
        };
    });

    return scoredNodes
        .filter(s => s.score > 0)
        .sort((a, b) => {
            if (a.prereqsComplete !== b.prereqsComplete) {
                return a.prereqsComplete ? -1 : 1;
            }
            if (b.score !== a.score) return b.score - a.score;
            return a.node.tier - b.node.tier;
        })
        .map(s => s.node);
}

/**
 * Create a path recommendation object
 */
export function createPathRecommendation(
    name: string,
    description: string,
    nodes: CurriculumNode[],
    profile: LearnerProfile,
    velocity: LearningVelocity,
    supportsGoals: string[],
    baseOptimality: number
): PathRecommendation {
    const totalHours = nodes.reduce((sum, n) => sum + n.estimatedHours, 0);
    const skillsGained = [...new Set(nodes.flatMap(n => n.skills))];

    const weeksNeeded = velocity.hoursPerWeek > 0
        ? Math.ceil(totalHours / velocity.hoursPerWeek)
        : Math.ceil(totalHours / 10);
    const expectedCompletionDate = new Date();
    expectedCompletionDate.setDate(expectedCompletionDate.getDate() + weeksNeeded * 7);

    const goalAlignment = supportsGoals.length > 0
        ? Math.min(1, supportsGoals.length / profile.careerGoals.length || 0.5)
        : 0.3;

    const avgTier = nodes.reduce((sum, n) => sum + n.tier, 0) / nodes.length;
    const difficulty = avgTier < 1 ? "beginner" :
        avgTier < 2 ? "intermediate" :
            avgTier < 3 ? "advanced" : "expert";

    const reasoning: string[] = [];
    if (supportsGoals.length > 0) {
        reasoning.push(`Directly supports ${supportsGoals.length} of your career goals`);
    }
    if (nodes.some(n => getPrerequisites(n.id).every(p => profile.completedNodes.includes(p.id)))) {
        reasoning.push("Builds on your existing knowledge");
    }
    if (totalHours <= profile.availableHoursPerWeek * 4) {
        reasoning.push("Achievable within your available time");
    }
    if (skillsGained.length > 5) {
        reasoning.push(`Develops ${skillsGained.length} valuable skills`);
    }

    return {
        id: `path_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        description,
        nodeIds: nodes.map(n => n.id),
        totalHours,
        difficulty,
        goalAlignment,
        optimality: baseOptimality * (goalAlignment + 0.5) / 1.5,
        supportsGoals,
        skillsGained,
        targetRoles: profile.careerGoals.map(g => g.targetRole),
        reasoning,
        expectedCompletionDate,
    };
}
