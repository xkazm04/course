/**
 * Completion Prediction
 *
 * Functions for predicting node completion probability.
 */

import type {
    LearnerProfile,
    CompletionPrediction,
    PredictionFactor,
    LearningVelocity,
} from "../types";
import { getNodeById, getPrerequisites } from "@/app/features/overview/lib/curriculumData";
import type { CurriculumNode } from "@/app/features/overview/lib/curriculumTypes";
import { calculateLearningVelocity } from "./learningVelocity";

/**
 * Generate completion prediction for a specific node
 */
export function predictNodeCompletion(
    node: CurriculumNode,
    profile: LearnerProfile,
    velocity: LearningVelocity
): CompletionPrediction {
    const factors: PredictionFactor[] = [];

    // Factor 1: Skill match
    const userSkills = new Set(
        profile.completedNodes
            .map(id => getNodeById(id))
            .filter(Boolean)
            .flatMap(n => n!.skills)
    );
    const nodeSkillMatch = node.skills.filter(s => userSkills.has(s)).length / (node.skills.length || 1);
    factors.push({
        type: "skill_match",
        weight: 0.2,
        value: nodeSkillMatch,
        description: `${Math.round(nodeSkillMatch * 100)}% skill overlap with completed content`,
        impact: nodeSkillMatch > 0.5 ? "positive" : nodeSkillMatch < 0.2 ? "negative" : "neutral",
    });

    // Factor 2: Time available
    const weeklyHoursNeeded = node.estimatedHours / 2;
    const timeMatch = Math.min(1, profile.availableHoursPerWeek / weeklyHoursNeeded);
    factors.push({
        type: "time_available",
        weight: 0.25,
        value: timeMatch,
        description: `${profile.availableHoursPerWeek}h/week available, ${weeklyHoursNeeded}h/week needed`,
        impact: timeMatch > 0.8 ? "positive" : timeMatch < 0.5 ? "negative" : "neutral",
    });

    // Factor 3: Prerequisite completion
    const prerequisites = getPrerequisites(node.id);
    const completedPrereqs = prerequisites.filter(p => profile.completedNodes.includes(p.id));
    const prereqCompletion = prerequisites.length > 0
        ? completedPrereqs.length / prerequisites.length
        : 1;
    factors.push({
        type: "prerequisite_completion",
        weight: 0.25,
        value: prereqCompletion,
        description: `${completedPrereqs.length}/${prerequisites.length} prerequisites completed`,
        impact: prereqCompletion === 1 ? "positive" : prereqCompletion < 0.5 ? "negative" : "neutral",
    });

    // Factor 4: Learning velocity
    const velocityScore = velocity.completionRate * velocity.consistencyScore;
    factors.push({
        type: "learning_velocity",
        weight: 0.15,
        value: velocityScore,
        description: `${Math.round(velocity.completionRate * 100)}% completion rate, ${velocity.classification} pace`,
        impact: velocityScore > 0.7 ? "positive" : velocityScore < 0.3 ? "negative" : "neutral",
    });

    // Factor 5: Difficulty match
    const difficultyLevels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const preferenceMap = { easier: -1, optimal: 0, challenging: 1 };
    const userLevel = Math.ceil(profile.completedNodes.length / 20);
    const optimalDifficulty = Math.min(4, Math.max(1, userLevel + preferenceMap[profile.difficultyPreference]));
    const nodeDifficulty = difficultyLevels[node.difficulty];
    const difficultyMatch = 1 - Math.abs(optimalDifficulty - nodeDifficulty) / 3;
    factors.push({
        type: "difficulty_match",
        weight: 0.15,
        value: difficultyMatch,
        description: `${node.difficulty} difficulty vs ${profile.difficultyPreference} preference`,
        impact: difficultyMatch > 0.8 ? "positive" : difficultyMatch < 0.4 ? "negative" : "neutral",
    });

    // Calculate weighted probability
    const probability = factors.reduce((sum, f) => sum + f.weight * f.value, 0);

    // Calculate confidence
    const dataPoints = profile.sessions.length + profile.completedNodes.length;
    const confidence = Math.min(0.95, 0.3 + dataPoints * 0.05);

    // Adjust estimated hours based on velocity
    const baseHours = node.estimatedHours;
    const velocityMultiplier = velocity.classification === "fast" ? 0.8 :
        velocity.classification === "slow" ? 1.3 : 1;
    const estimatedHours = baseHours * velocityMultiplier;

    // Find recommended prerequisites
    const recommendedPrerequisites = prerequisites
        .filter(p => !profile.completedNodes.includes(p.id))
        .map(p => p.id);

    // Identify potential challenges
    const potentialChallenges: string[] = [];
    if (prereqCompletion < 1) {
        potentialChallenges.push("Some prerequisites are not yet completed");
    }
    if (timeMatch < 0.7) {
        potentialChallenges.push("May require more time than currently available");
    }
    if (difficultyMatch < 0.5) {
        potentialChallenges.push("Difficulty level may be challenging");
    }

    return {
        nodeId: node.id,
        probability,
        confidence,
        estimatedHours,
        factors,
        recommendedPrerequisites,
        potentialChallenges,
    };
}

/**
 * Generate predictions for multiple nodes
 */
export async function generatePredictions(
    profile: LearnerProfile,
    nodeIds: string[]
): Promise<Record<string, CompletionPrediction>> {
    const velocity = calculateLearningVelocity(profile);
    const predictions: Record<string, CompletionPrediction> = {};

    for (const nodeId of nodeIds) {
        const node = getNodeById(nodeId);
        if (node) {
            predictions[nodeId] = predictNodeCompletion(node, profile, velocity);
        }
    }

    return predictions;
}
