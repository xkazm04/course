/**
 * Generative Content API Route - Chapters
 *
 * GET /api/generative-content/chapters - Get all chapters
 * POST /api/generative-content/chapters - Save a chapter
 */

import { NextRequest, NextResponse } from "next/server";
import type { GeneratedChapter } from "@/app/features/generative-content/lib/types";

// In-memory storage for demo (would be replaced with actual DB in production)
const chaptersStore: GeneratedChapter[] = [];

// ============================================================================
// GET Handler - Get Chapters
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pathSeedId = searchParams.get("pathSeedId");
        const chapterId = searchParams.get("chapterId");
        const status = searchParams.get("status");

        let filteredChapters = [...chaptersStore];

        // Filter by pathSeedId
        if (pathSeedId) {
            filteredChapters = filteredChapters.filter((c) => c.pathSeedId === pathSeedId);
        }

        // Filter by chapterId
        if (chapterId) {
            filteredChapters = filteredChapters.filter((c) => c.id === chapterId);

            if (filteredChapters.length === 1) {
                return NextResponse.json({
                    success: true,
                    chapter: filteredChapters[0],
                });
            }
        }

        // Filter by status
        if (status) {
            filteredChapters = filteredChapters.filter(
                (c) => c.generationMeta.status === status
            );
        }

        return NextResponse.json({
            success: true,
            chapters: filteredChapters,
            total: filteredChapters.length,
        });
    } catch (error) {
        console.error("Error fetching chapters:", error);
        return NextResponse.json(
            { error: "Failed to fetch chapters" },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST Handler - Save Chapter
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        if (!body.chapter) {
            return NextResponse.json(
                { error: "Missing chapter in request body" },
                { status: 400 }
            );
        }

        const chapter: GeneratedChapter = body.chapter;

        // Validate chapter
        if (!chapter.id || !chapter.pathSeedId || !chapter.sections) {
            return NextResponse.json(
                { error: "Invalid chapter: missing id, pathSeedId, or sections" },
                { status: 400 }
            );
        }

        // Check if chapter already exists
        const existingIndex = chaptersStore.findIndex((c) => c.id === chapter.id);

        if (existingIndex >= 0) {
            // Update existing chapter
            chaptersStore[existingIndex] = chapter;
        } else {
            // Add new chapter
            chaptersStore.push(chapter);
        }

        return NextResponse.json({
            success: true,
            chapter,
            isUpdate: existingIndex >= 0,
        });
    } catch (error) {
        console.error("Error saving chapter:", error);
        return NextResponse.json(
            { error: "Failed to save chapter" },
            { status: 500 }
        );
    }
}

// ============================================================================
// PUT Handler - Update Chapter Status
// ============================================================================

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        if (!body.chapterId || !body.status) {
            return NextResponse.json(
                { error: "Missing chapterId or status" },
                { status: 400 }
            );
        }

        const chapterIndex = chaptersStore.findIndex((c) => c.id === body.chapterId);

        if (chapterIndex < 0) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 }
            );
        }

        // Update status
        chaptersStore[chapterIndex]!.generationMeta.status = body.status;

        return NextResponse.json({
            success: true,
            chapter: chaptersStore[chapterIndex],
        });
    } catch (error) {
        console.error("Error updating chapter:", error);
        return NextResponse.json(
            { error: "Failed to update chapter" },
            { status: 500 }
        );
    }
}

// ============================================================================
// DELETE Handler - Delete Chapter
// ============================================================================

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const chapterId = searchParams.get("chapterId");

        if (!chapterId) {
            return NextResponse.json(
                { error: "Missing chapterId" },
                { status: 400 }
            );
        }

        const chapterIndex = chaptersStore.findIndex((c) => c.id === chapterId);

        if (chapterIndex < 0) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 }
            );
        }

        // Remove chapter
        chaptersStore.splice(chapterIndex, 1);

        return NextResponse.json({
            success: true,
            deleted: chapterId,
        });
    } catch (error) {
        console.error("Error deleting chapter:", error);
        return NextResponse.json(
            { error: "Failed to delete chapter" },
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
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
