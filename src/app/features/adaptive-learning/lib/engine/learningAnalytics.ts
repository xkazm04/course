/**
 * Learning Analytics
 *
 * Functions for analyzing learning data and generating insights.
 */

import type { LearnerProfile, LearningAnalytics } from "../types";
import type { CurriculumCategory } from "@/app/features/overview/lib/curriculumTypes";
import { curriculumData, getNodeById } from "@/app/features/overview/lib/curriculumData";
import { calculateLearningVelocity } from "./learningVelocity";
import { analyzeSkillGaps } from "./skillGapAnalysis";

/**
 * Analyze learning data to generate comprehensive analytics
 */
export async function analyzeLearningData(
    profile: LearnerProfile
): Promise<LearningAnalytics> {
    const velocity = calculateLearningVelocity(profile);
    const skillGaps = analyzeSkillGaps(profile);

    // Analyze patterns
    const sessionsByDay: Record<string, number> = {};
    const sessionsByHour: Record<number, number> = {};
    const categoryCount: Record<string, number> = {};

    profile.sessions.forEach(session => {
        const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][session.startTime.getDay()];
        sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;

        const hour = session.startTime.getHours();
        sessionsByHour[hour] = (sessionsByHour[hour] || 0) + 1;

        session.nodesViewed.forEach(nodeId => {
            const node = getNodeById(nodeId);
            if (node) {
                categoryCount[node.category] = (categoryCount[node.category] || 0) + 1;
            }
        });
    });

    const mostProductiveDay = Object.entries(sessionsByDay)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const mostProductiveHour = Object.entries(sessionsByHour)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "12";

    const preferredCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat as CurriculumCategory);

    const avgSessionLength = profile.sessions.length > 0
        ? profile.sessions.reduce((sum, s) => {
            if (s.endTime) {
                return sum + (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60);
            }
            return sum;
        }, 0) / profile.sessions.length
        : 0;

    // Calculate engagement metrics
    const uniqueWeeks = new Set(
        profile.sessions.map(s => {
            const d = new Date(s.startTime);
            return `${d.getFullYear()}-${d.getMonth()}-${Math.floor(d.getDate() / 7)}`;
        })
    ).size;

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recentSessions = profile.sessions.filter(s => s.startTime >= twoWeeksAgo).length;
    const previousSessions = profile.sessions.filter(s =>
        s.startTime >= fourWeeksAgo && s.startTime < twoWeeksAgo
    ).length;

    const returnRate = previousSessions > 0
        ? Math.min(1, recentSessions / previousSessions)
        : recentSessions > 0 ? 1 : 0;

    // Calculate predictions
    const remainingNodes = curriculumData.nodes.filter(n => !profile.completedNodes.includes(n.id));
    const totalRemainingHours = remainingNodes.reduce((sum, n) => sum + n.estimatedHours, 0);
    const weeksToComplete = velocity.hoursPerWeek > 0
        ? Math.ceil(totalRemainingHours / velocity.hoursPerWeek)
        : null;

    const expectedCompletionDate = weeksToComplete !== null
        ? new Date(Date.now() + weeksToComplete * 7 * 24 * 60 * 60 * 1000)
        : null;

    const riskFactors: string[] = [];
    if (velocity.classification === "decelerating") {
        riskFactors.push("Declining learning velocity");
    }
    if (returnRate < 0.5) {
        riskFactors.push("Decreasing session frequency");
    }
    if (skillGaps.overallGapScore > 70) {
        riskFactors.push("Large skill gaps for career goals");
    }
    if (profile.currentStreak === 0) {
        riskFactors.push("Broken learning streak");
    }

    return {
        velocity,
        skillGaps,
        patterns: {
            mostProductiveDay,
            mostProductiveHour: parseInt(mostProductiveHour),
            averageSessionLength: avgSessionLength,
            preferredCategories,
        },
        engagement: {
            streakDays: profile.currentStreak,
            longestStreak: Math.max(profile.currentStreak, 7),
            activeWeeksCount: uniqueWeeks,
            returnRate,
        },
        predictions: {
            expectedCompletionDate,
            confidenceLevel: Math.min(0.9, 0.4 + profile.sessions.length * 0.03),
            riskFactors,
        },
    };
}
