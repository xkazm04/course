import { NextRequest, NextResponse } from "next/server";
import type { LearnerProfile, SkillGapAnalysis } from "@/app/features/adaptive-learning/lib/types";

interface SkillGapRequest {
    profile: LearnerProfile;
    targetRole?: string;
}

/**
 * POST /api/adaptive-learning/skill-gap
 *
 * Analyzes skill gaps between current skills and career goal requirements.
 * Returns detailed gap analysis with recommendations for closing gaps.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as SkillGapRequest;
        const { profile, targetRole } = body;

        if (!profile) {
            return NextResponse.json(
                { error: "Profile is required" },
                { status: 400 }
            );
        }

        // Import the prediction engine dynamically
        const { analyzeSkillGaps } = await import(
            "@/app/features/adaptive-learning/lib/predictionEngine"
        );

        // If a specific target role is provided, temporarily modify the profile
        const profileForAnalysis = targetRole
            ? {
                ...profile,
                careerGoals: [
                    {
                        id: "temp-goal",
                        targetRole,
                        priority: "primary" as const,
                        targetTimelineMonths: 12,
                        requiredSkills: [],
                    },
                    ...profile.careerGoals.slice(1),
                ],
            }
            : profile;

        // Analyze skill gaps
        const skillGapAnalysis = analyzeSkillGaps(profileForAnalysis);

        // Add additional insights
        const insights = generateSkillGapInsights(skillGapAnalysis);

        return NextResponse.json({
            analysis: skillGapAnalysis,
            insights,
            targetRole: targetRole || profile.careerGoals[0]?.targetRole || "General",
        });
    } catch (error) {
        console.error("Error analyzing skill gaps:", error);
        return NextResponse.json(
            { error: "Failed to analyze skill gaps" },
            { status: 500 }
        );
    }
}

/**
 * Generate human-readable insights from skill gap analysis
 */
function generateSkillGapInsights(analysis: SkillGapAnalysis): string[] {
    const insights: string[] = [];

    // Overall assessment
    if (analysis.overallGapScore < 30) {
        insights.push("You're very close to your goal! Just a few more skills to polish.");
    } else if (analysis.overallGapScore < 60) {
        insights.push("You have a solid foundation. Focus on the critical skills to accelerate your progress.");
    } else {
        insights.push("There's room for growth, but with consistent effort, you can achieve your goals.");
    }

    // Critical gaps
    const criticalGaps = analysis.gaps.filter(g => g.priority === "critical");
    if (criticalGaps.length > 0) {
        insights.push(`Focus on ${criticalGaps.map(g => g.skill).join(", ")} - these are essential for your target role.`);
    }

    // Time estimate
    if (analysis.estimatedTimeToClose > 0) {
        const weeks = Math.ceil(analysis.estimatedTimeToClose / 10);
        insights.push(`At a steady pace, you could close these gaps in approximately ${weeks} weeks.`);
    }

    // Strengths
    const strongSkills = analysis.currentSkills.filter(s => s.level >= 70);
    if (strongSkills.length > 0) {
        insights.push(`Your strengths in ${strongSkills.slice(0, 3).map(s => s.skill).join(", ")} give you a great advantage.`);
    }

    return insights;
}
