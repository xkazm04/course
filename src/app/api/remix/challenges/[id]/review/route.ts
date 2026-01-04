// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

type ReviewAction = "approve" | "reject" | "archive";

interface ReviewInput {
    action: ReviewAction;
    notes?: string;
}

/**
 * POST /api/remix/challenges/[id]/review
 * Admin review action (approve, reject, archive)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        // TODO: Add admin role check here
        // For now, any authenticated user can review

        const body: ReviewInput = await request.json();

        if (!body.action) {
            return NextResponse.json(
                { error: "Missing required field: action" },
                { status: 400 }
            );
        }

        const validActions: ReviewAction[] = ["approve", "reject", "archive"];
        if (!validActions.includes(body.action)) {
            return NextResponse.json(
                { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
                { status: 400 }
            );
        }

        // Map action to status
        const statusMap: Record<ReviewAction, string> = {
            approve: "approved",
            reject: "rejected",
            archive: "archived",
        };

        const { data, error } = await supabase
            .from("remix_challenges")
            .update({
                status: statusMap[body.action],
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                review_notes: body.notes || null,
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json(
                    { error: "Challenge not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: "Failed to review challenge", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            challenge: data,
            action: body.action,
        });
    } catch (error) {
        console.error("POST /api/remix/challenges/[id]/review error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/remix/challenges/[id]/review
 * Get review status
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("remix_challenges")
            .select("id, status, reviewed_by, reviewed_at, review_notes")
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
                { error: "Failed to fetch review status", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ review: data });
    } catch (error) {
        console.error("GET /api/remix/challenges/[id]/review error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
