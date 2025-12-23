/**
 * Learning Velocity Calculation
 *
 * Functions for calculating learning velocity from user sessions.
 */

import type { LearnerProfile, LearningVelocity } from "../types";

/**
 * Calculate learning velocity from user sessions and progress
 */
export function calculateLearningVelocity(profile: LearnerProfile): LearningVelocity {
    const recentSessions = profile.sessions.slice(0, 20);
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    // Group sessions by week
    const weeklyData: { nodes: number; hours: number }[] = [
        { nodes: 0, hours: 0 },
        { nodes: 0, hours: 0 },
        { nodes: 0, hours: 0 },
        { nodes: 0, hours: 0 },
    ];

    recentSessions.forEach(session => {
        if (session.endTime && session.startTime >= fourWeeksAgo) {
            const weekIndex = Math.min(3, Math.floor((Date.now() - session.startTime.getTime()) / (7 * 24 * 60 * 60 * 1000)));
            weeklyData[weekIndex].nodes += session.nodesViewed.length;
            weeklyData[weekIndex].hours += (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60);
        }
    });

    // Calculate averages
    const totalNodes = weeklyData.reduce((sum, w) => sum + w.nodes, 0);
    const totalHours = weeklyData.reduce((sum, w) => sum + w.hours, 0);
    const nodesPerWeek = totalNodes / 4;
    const hoursPerWeek = totalHours / 4;
    const averageTimePerNode = totalNodes > 0 ? totalHours / totalNodes : 2;

    // Calculate completion rate
    const startedNodes = new Set([...profile.completedNodes, ...profile.inProgressNodes]);
    const completionRate = startedNodes.size > 0
        ? profile.completedNodes.length / startedNodes.size
        : 0;

    // Calculate average quiz score
    const allQuizScores = recentSessions.flatMap(s => s.quizScores);
    const averageQuizScore = allQuizScores.length > 0
        ? allQuizScores.reduce((sum, s) => sum + s, 0) / allQuizScores.length
        : 0;

    // Calculate weekly trend
    const weeklyTrend = weeklyData.map(w => w.hours);

    // Determine classification
    let classification: LearningVelocity["classification"] = "steady";
    if (hoursPerWeek < 2) classification = "slow";
    else if (hoursPerWeek > 15) classification = "fast";
    else if (weeklyTrend[0] > weeklyTrend[3] * 1.3) classification = "accelerating";
    else if (weeklyTrend[0] < weeklyTrend[3] * 0.7) classification = "decelerating";

    // Calculate consistency score
    const hourVariance = weeklyData.reduce((sum, w) =>
        sum + Math.pow(w.hours - hoursPerWeek, 2), 0) / 4;
    const consistencyScore = Math.max(0, 1 - Math.sqrt(hourVariance) / (hoursPerWeek || 1));

    return {
        nodesPerWeek,
        hoursPerWeek,
        averageTimePerNode,
        completionRate,
        averageQuizScore,
        weeklyTrend,
        classification,
        consistencyScore,
    };
}
