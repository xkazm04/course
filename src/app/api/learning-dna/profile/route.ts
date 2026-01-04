/**
 * Learning DNA Profile API Route
 *
 * Manages the user's Learning DNA profile in the database.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// GET - Fetch user's Learning DNA profile
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // In a full implementation, fetch from a learning_dna_profiles table
        // For now, return mock profile structure
        const profile = {
            userId: user.id,
            overallScore: 0,
            dimensions: {
                contribution: 0,
                problemSolving: 0,
                learning: 0,
                community: 0,
                breadth: 0,
                depth: 0,
            },
            connectedPlatforms: [],
            signals: [],
            derivedSkills: [],
            platformData: {
                courses: [],
            },
            lastSyncedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return NextResponse.json(profile);
    } catch (error) {
        console.error("[learning-dna/profile] GET error:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST - Create or update Learning DNA profile
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate required fields
        if (!body.dimensions || typeof body.overallScore !== "number") {
            return NextResponse.json(
                { error: "Invalid profile data" },
                { status: 400 }
            );
        }

        // In a full implementation, save to a learning_dna_profiles table
        // For now, return the received profile with updated timestamps
        const profile = {
            ...body,
            userId: user.id,
            updatedAt: new Date().toISOString(),
        };

        return NextResponse.json(profile);
    } catch (error) {
        console.error("[learning-dna/profile] POST error:", error);
        return NextResponse.json(
            { error: "Failed to save profile" },
            { status: 500 }
        );
    }
}

// ============================================================================
// DELETE - Remove Learning DNA profile
// ============================================================================

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // In a full implementation, delete from learning_dna_profiles table
        // Also disconnect all platform connections

        return NextResponse.json({
            success: true,
            message: "Profile deleted successfully",
        });
    } catch (error) {
        console.error("[learning-dna/profile] DELETE error:", error);
        return NextResponse.json(
            { error: "Failed to delete profile" },
            { status: 500 }
        );
    }
}
