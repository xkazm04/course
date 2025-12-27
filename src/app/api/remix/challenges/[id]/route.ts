import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/remix/challenges/[id]
 * Get single challenge by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("remix_challenges")
            .select(`
                *,
                project:remix_projects(*)
            `)
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json(
                    { error: "Challenge not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: "Failed to fetch challenge", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ challenge: data });
    } catch (error) {
        console.error("GET /api/remix/challenges/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/remix/challenges/[id]
 * Update a challenge
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Only allow updating certain fields
        const allowedFields = [
            "title", "description", "user_instructions", "expected_output",
            "hints", "estimated_minutes", "tags", "difficulty"
        ];

        const updateData: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No valid fields to update" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("remix_challenges")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: "Failed to update challenge", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ challenge: data });
    } catch (error) {
        console.error("PATCH /api/remix/challenges/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/remix/challenges/[id]
 * Delete a challenge (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { error } = await supabase
            .from("remix_challenges")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json(
                { error: "Failed to delete challenge", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/remix/challenges/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
