/**
 * Generative Content API Route - Ratings
 *
 * GET /api/generative-content/ratings - Get ratings for content
 * POST /api/generative-content/ratings - Submit a rating
 */

import { NextRequest, NextResponse } from "next/server";
import type { ContentRating } from "@/app/features/generative-content/lib/types";

// In-memory storage for demo (would be replaced with actual DB in production)
const ratingsStore: ContentRating[] = [];

// ============================================================================
// GET Handler - Get Ratings
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const contentId = searchParams.get("contentId");
        const userId = searchParams.get("userId");

        let filteredRatings = [...ratingsStore];

        // Filter by contentId
        if (contentId) {
            filteredRatings = filteredRatings.filter((r) => r.contentId === contentId);
        }

        // Filter by userId
        if (userId) {
            filteredRatings = filteredRatings.filter((r) => r.userId === userId);
        }

        // Calculate average rating if contentId is specified
        let averageRating = 0;
        if (contentId && filteredRatings.length > 0) {
            averageRating =
                filteredRatings.reduce((sum, r) => sum + r.rating, 0) / filteredRatings.length;
        }

        return NextResponse.json({
            success: true,
            ratings: filteredRatings,
            total: filteredRatings.length,
            averageRating: Math.round(averageRating * 10) / 10,
        });
    } catch (error) {
        console.error("Error fetching ratings:", error);
        return NextResponse.json(
            { error: "Failed to fetch ratings" },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST Handler - Submit Rating
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        if (!body.contentId || !body.userId || !body.rating) {
            return NextResponse.json(
                { error: "Missing contentId, userId, or rating" },
                { status: 400 }
            );
        }

        if (body.rating < 1 || body.rating > 5) {
            return NextResponse.json(
                { error: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }

        // Check if user already rated this content
        const existingIndex = ratingsStore.findIndex(
            (r) => r.contentId === body.contentId && r.userId === body.userId
        );

        const rating: ContentRating = {
            id: body.id || `rating_${Date.now()}`,
            contentId: body.contentId,
            contentType: body.contentType || "chapter",
            userId: body.userId,
            rating: body.rating,
            feedback: body.feedback || {
                accuracy: 3,
                clarity: 3,
                relevance: 3,
                difficulty: "just_right",
            },
            comments: body.comments,
            issues: body.issues,
            createdAt: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
            // Update existing rating
            ratingsStore[existingIndex] = rating;
        } else {
            // Add new rating
            ratingsStore.push(rating);
        }

        // Calculate new average
        const contentRatings = ratingsStore.filter((r) => r.contentId === body.contentId);
        const averageRating =
            contentRatings.reduce((sum, r) => sum + r.rating, 0) / contentRatings.length;

        return NextResponse.json({
            success: true,
            rating,
            isUpdate: existingIndex >= 0,
            averageRating: Math.round(averageRating * 10) / 10,
            totalRatings: contentRatings.length,
        });
    } catch (error) {
        console.error("Error submitting rating:", error);
        return NextResponse.json(
            { error: "Failed to submit rating" },
            { status: 500 }
        );
    }
}

// ============================================================================
// OPTIONS Handler - CORS
// ============================================================================

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
