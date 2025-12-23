/**
 * Curriculum Feedback API Route
 *
 * POST /api/curriculum/feedback
 * GET /api/curriculum/feedback?contentId=xxx
 *
 * Handles feedback submission and retrieval for curriculum content.
 * Powers the feedback loop for improving generated content.
 */

import { NextRequest, NextResponse } from "next/server";
import type {
    FeedbackSubmissionRequest,
    FeedbackSubmissionResponse,
    ContentFeedback,
    ContentQualityMetrics,
} from "@/app/features/curriculum-generator/lib/types";

// ============================================================================
// IN-MEMORY STORAGE (for demo - in production use database)
// ============================================================================

// Note: In production, this would be stored in a database
const feedbackStore: Map<string, ContentFeedback[]> = new Map();
const metricsStore: Map<string, ContentQualityMetrics> = new Map();

function generateId(): string {
    return `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// CALCULATE QUALITY METRICS
// ============================================================================

function calculateMetrics(
    contentId: string,
    contentType: ContentFeedback["contentType"],
    feedbackList: ContentFeedback[]
): ContentQualityMetrics {
    if (feedbackList.length === 0) {
        return {
            contentId,
            contentType,
            totalRatings: 0,
            averageRating: 0,
            averageClarity: 0,
            averageDifficultyMatch: 0,
            averageRelevance: 0,
            averageEngagement: 0,
            completionRate: 0,
            averageTimeSpent: 0,
            struggleRate: 0,
            lastUpdated: new Date().toISOString(),
        };
    }

    const totalRatings = feedbackList.length;
    const averageRating = feedbackList.reduce((sum, f) => sum + f.rating, 0) / totalRatings;
    const averageClarity = feedbackList.reduce((sum, f) => sum + f.feedback.clarity, 0) / totalRatings;
    const averageDifficultyMatch = feedbackList.reduce((sum, f) => sum + f.feedback.difficultyMatch, 0) / totalRatings;
    const averageRelevance = feedbackList.reduce((sum, f) => sum + f.feedback.relevance, 0) / totalRatings;
    const averageEngagement = feedbackList.reduce((sum, f) => sum + f.feedback.engagement, 0) / totalRatings;
    const completionRate = feedbackList.filter((f) => f.completed).length / totalRatings;
    const averageTimeSpent = feedbackList.reduce((sum, f) => sum + f.timeSpent, 0) / totalRatings;
    const struggleRate = feedbackList.filter((f) => f.struggled).length / totalRatings;

    return {
        contentId,
        contentType,
        totalRatings,
        averageRating,
        averageClarity,
        averageDifficultyMatch,
        averageRelevance,
        averageEngagement,
        completionRate,
        averageTimeSpent,
        struggleRate,
        lastUpdated: new Date().toISOString(),
    };
}

// ============================================================================
// POST HANDLER - Submit Feedback
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body: FeedbackSubmissionRequest = await request.json();

        // Validate request
        if (!body.contentId || !body.contentType || !body.rating) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "INVALID_REQUEST", message: "Missing required fields" },
                } as FeedbackSubmissionResponse,
                { status: 400 }
            );
        }

        // Validate rating range
        if (body.rating < 1 || body.rating > 5) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "INVALID_RATING", message: "Rating must be between 1 and 5" },
                } as FeedbackSubmissionResponse,
                { status: 400 }
            );
        }

        // Create feedback entry
        const feedbackEntry: ContentFeedback = {
            id: generateId(),
            contentId: body.contentId,
            contentType: body.contentType,
            userId: "anonymous", // In production, get from auth
            rating: body.rating,
            feedback: {
                clarity: body.feedback.clarity,
                difficultyMatch: body.feedback.difficultyMatch,
                relevance: body.feedback.relevance,
                engagement: body.feedback.engagement,
            },
            comment: body.comment,
            completed: body.completion.completed,
            timeSpent: body.completion.timeSpent,
            struggled: body.completion.struggled,
            suggestions: body.suggestions,
            createdAt: new Date().toISOString(),
        };

        // Store feedback
        const existingFeedback = feedbackStore.get(body.contentId) || [];
        existingFeedback.push(feedbackEntry);
        feedbackStore.set(body.contentId, existingFeedback);

        // Update metrics
        const updatedMetrics = calculateMetrics(body.contentId, body.contentType, existingFeedback);
        metricsStore.set(body.contentId, updatedMetrics);

        const response: FeedbackSubmissionResponse = {
            success: true,
            feedbackId: feedbackEntry.id,
            updatedMetrics,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Feedback submission error:", error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "SUBMISSION_ERROR",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            } as FeedbackSubmissionResponse,
            { status: 500 }
        );
    }
}

// ============================================================================
// GET HANDLER - Retrieve Feedback/Metrics
// ============================================================================

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");
    const action = searchParams.get("action") || "metrics";

    if (!contentId) {
        // Return API info
        return NextResponse.json({
            endpoint: "/api/curriculum/feedback",
            methods: {
                POST: {
                    description: "Submit feedback for curriculum content",
                    body: {
                        contentId: "string",
                        contentType: "lesson | exercise | quiz | project",
                        rating: "number (1-5)",
                        feedback: {
                            clarity: "number (1-5)",
                            difficultyMatch: "number (1-5)",
                            relevance: "number (1-5)",
                            engagement: "number (1-5)",
                        },
                        comment: "string (optional)",
                        completion: {
                            completed: "boolean",
                            timeSpent: "number (minutes)",
                            struggled: "boolean",
                            score: "number (optional)",
                        },
                        suggestions: "string[] (optional)",
                    },
                },
                GET: {
                    description: "Get feedback or metrics for content",
                    params: {
                        contentId: "string (required)",
                        action: "metrics | feedback (default: metrics)",
                    },
                },
            },
        });
    }

    if (action === "feedback") {
        // Return all feedback for content
        const feedback = feedbackStore.get(contentId) || [];
        return NextResponse.json({
            contentId,
            feedback,
            count: feedback.length,
        });
    } else {
        // Return metrics
        const metrics = metricsStore.get(contentId);
        if (!metrics) {
            return NextResponse.json({
                contentId,
                metrics: null,
                message: "No feedback collected yet",
            });
        }
        return NextResponse.json({
            contentId,
            metrics,
        });
    }
}

// ============================================================================
// GET HIGH QUALITY CONTENT
// ============================================================================

export async function highQualityContent(): Promise<ContentQualityMetrics[]> {
    return Array.from(metricsStore.values())
        .filter((m) => m.averageRating >= 4 && m.totalRatings >= 3)
        .sort((a, b) => b.averageRating - a.averageRating);
}
