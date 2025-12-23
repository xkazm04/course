/**
 * Generative Content API Route - Learning Paths
 *
 * GET /api/generative-content/paths - Get all paths
 * POST /api/generative-content/paths - Create new path
 */

import { NextRequest, NextResponse } from "next/server";
import type { LearningPathSeed } from "@/app/features/generative-content/lib/types";
import { createPathSeed } from "@/app/features/generative-content/lib/types";
import type { LearningDomainId } from "@/app/shared/lib/learningDomains";

// In-memory storage for demo (would be replaced with actual DB in production)
const pathsStore: LearningPathSeed[] = [];

// ============================================================================
// GET Handler - Get All Paths
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const topics = searchParams.get("topics")?.split(",");

        let filteredPaths = [...pathsStore];

        // Filter by user
        if (userId) {
            filteredPaths = filteredPaths.filter((p) => p.createdBy === userId);
        }

        // Filter by topics
        if (topics && topics.length > 0) {
            const topicsLower = topics.map((t) => t.toLowerCase().trim());
            filteredPaths = filteredPaths.filter((path) =>
                topicsLower.every((topic) =>
                    path.topics.some((t) => t.toLowerCase().includes(topic))
                )
            );
        }

        return NextResponse.json({
            success: true,
            paths: filteredPaths,
            total: filteredPaths.length,
        });
    } catch (error) {
        console.error("Error fetching paths:", error);
        return NextResponse.json(
            { error: "Failed to fetch paths" },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST Handler - Create New Path
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        if (!body.topics || !Array.isArray(body.topics) || body.topics.length === 0) {
            return NextResponse.json(
                { error: "Missing or invalid topics array" },
                { status: 400 }
            );
        }

        if (!body.domainId) {
            return NextResponse.json(
                { error: "Missing domainId" },
                { status: 400 }
            );
        }

        if (!body.userId) {
            return NextResponse.json(
                { error: "Missing userId" },
                { status: 400 }
            );
        }

        // Check if path already exists
        const sortedTopics = [...body.topics].sort().map((t: string) => t.toLowerCase());
        const existingPath = pathsStore.find((path) => {
            const pathTopics = [...path.topics].sort().map((t) => t.toLowerCase());
            return (
                pathTopics.length === sortedTopics.length &&
                pathTopics.every((t, i) => t === sortedTopics[i])
            );
        });

        if (existingPath) {
            return NextResponse.json({
                success: true,
                path: existingPath,
                isExisting: true,
            });
        }

        // Create new path
        const newPath = createPathSeed(
            body.topics,
            body.domainId as LearningDomainId,
            body.userId,
            {
                userGoal: body.userGoal,
                skillLevel: body.skillLevel,
            }
        );

        pathsStore.push(newPath);

        return NextResponse.json({
            success: true,
            path: newPath,
            isExisting: false,
        });
    } catch (error) {
        console.error("Error creating path:", error);
        return NextResponse.json(
            { error: "Failed to create path" },
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
