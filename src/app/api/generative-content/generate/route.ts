/**
 * Generative Content API Route - Generate Chapter
 *
 * POST /api/generative-content/generate
 *
 * Generates a new chapter based on a learning path seed.
 */

import { NextRequest, NextResponse } from "next/server";
import type { LearningPathSeed, ContentGenerationParams } from "@/app/features/generative-content/lib/types";
import { createDefaultGenerationParams } from "@/app/features/generative-content/lib/types";
import { generateChapter, createGenerationJob } from "@/app/features/generative-content/lib/contentGenerator";

// ============================================================================
// POST Handler - Generate Content
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        if (!body.pathSeed) {
            return NextResponse.json(
                { error: "Missing pathSeed in request body" },
                { status: 400 }
            );
        }

        const pathSeed: LearningPathSeed = body.pathSeed;

        // Validate path seed
        if (!pathSeed.pathId || !pathSeed.topics || pathSeed.topics.length === 0) {
            return NextResponse.json(
                { error: "Invalid pathSeed: missing pathId or topics" },
                { status: 400 }
            );
        }

        // Create generation parameters
        const params: ContentGenerationParams = {
            ...createDefaultGenerationParams(pathSeed, body.chapterIndex || 0),
            ...body.options,
        };

        // Create a job to track progress
        const job = createGenerationJob(pathSeed.pathId);

        // Generate the chapter
        const chapter = await generateChapter(params, job.jobId);

        return NextResponse.json({
            success: true,
            chapter,
            jobId: job.jobId,
        });
    } catch (error) {
        console.error("Content generation error:", error);
        return NextResponse.json(
            {
                error: "Failed to generate content",
                details: error instanceof Error ? error.message : "Unknown error",
            },
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
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
