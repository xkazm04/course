import { NextRequest, NextResponse } from "next/server";
import type {
    LearnerProfile,
    PathRecommendation,
    CompletionPrediction,
    LearningAnalytics,
    AdaptationSuggestion,
    GetRecommendationsRequest,
    GetRecommendationsResponse,
} from "@/app/features/adaptive-learning/lib/types";

/**
 * POST /api/adaptive-learning
 *
 * Generates AI-powered personalized learning path recommendations
 * based on user profile, behavior, and career goals.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as GetRecommendationsRequest;
        const { profile, currentNodeId, maxPaths = 5, focusGoalId } = body;

        if (!profile) {
            return NextResponse.json(
                { error: "Profile is required" },
                { status: 400 }
            );
        }

        // Import the prediction engine dynamically to avoid SSR issues
        const {
            generateRecommendations,
            generatePredictions,
            analyzeLearningData,
        } = await import("@/app/features/adaptive-learning/lib/predictionEngine");

        // Generate recommendations
        const allRecommendations = await generateRecommendations(profile);
        const recommendations = allRecommendations.slice(0, maxPaths);

        // Get all node IDs from recommendations
        const nodeIds = recommendations.flatMap(r => r.nodeIds);
        const uniqueNodeIds = [...new Set(nodeIds)];

        // Generate predictions for all nodes
        const predictions = await generatePredictions(profile, uniqueNodeIds);

        // Analyze learning data
        const analytics = await analyzeLearningData(profile);

        // Generate suggestions based on analytics
        const suggestions: AdaptationSuggestion[] = [];

        // Check for velocity issues
        if (analytics.velocity.classification === "decelerating") {
            suggestions.push({
                type: "pace_change",
                severity: "suggestion",
                title: "Your learning pace has slowed",
                message: "Consider adjusting your schedule or focusing on shorter topics to build momentum.",
                action: { type: "review_content" },
                generatedAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });
        }

        // Check for skill gap issues
        const criticalGap = analytics.skillGaps.gaps.find(g => g.priority === "critical");
        if (criticalGap && criticalGap.relatedNodes.length > 0) {
            suggestions.push({
                type: "skill_boost",
                severity: "recommendation",
                title: `Critical skill needed: ${criticalGap.skill}`,
                message: `This skill is essential for your career goal. We recommend prioritizing it.`,
                action: { type: "navigate", targetNodeId: criticalGap.relatedNodes[0] },
                generatedAt: new Date(),
                expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            });
        }

        // Check for streak celebration
        if (profile.currentStreak >= 7 && profile.currentStreak % 7 === 0) {
            suggestions.push({
                type: "path_adjustment",
                severity: "info",
                title: `${profile.currentStreak}-day streak achieved! 🔥`,
                message: "Your consistency is paying off. Keep up the great work!",
                action: { type: "review_content" },
                generatedAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            });
        }

        const response: GetRecommendationsResponse = {
            recommendations,
            predictions,
            suggestions,
            analytics,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error generating recommendations:", error);
        return NextResponse.json(
            { error: "Failed to generate recommendations" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/adaptive-learning
 *
 * Returns available prediction categories and API information.
 */
export async function GET() {
    return NextResponse.json({
        name: "Adaptive Learning API",
        version: "1.0.0",
        endpoints: {
            "POST /api/adaptive-learning": {
                description: "Generate personalized learning recommendations",
                body: {
                    profile: "LearnerProfile (required)",
                    currentNodeId: "string (optional)",
                    maxPaths: "number (optional, default: 5)",
                    focusGoalId: "string (optional)",
                },
                response: "GetRecommendationsResponse",
            },
            "POST /api/adaptive-learning/predict": {
                description: "Get completion predictions for specific nodes",
                body: {
                    profile: "LearnerProfile (required)",
                    nodeIds: "string[] (required)",
                },
                response: "Record<string, CompletionPrediction>",
            },
            "POST /api/adaptive-learning/skill-gap": {
                description: "Analyze skill gaps for career goals",
                body: {
                    profile: "LearnerProfile (required)",
                    targetRole: "string (optional)",
                },
                response: "SkillGapAnalysis",
            },
        },
        features: [
            "AI-powered path recommendations",
            "Completion probability predictions",
            "Learning velocity analysis",
            "Skill gap identification",
            "Adaptive suggestions",
            "Career goal alignment",
        ],
    });
}
