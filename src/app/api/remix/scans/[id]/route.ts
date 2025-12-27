import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/remix/scans/[id]
 * Get scan by ID with project and challenges
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: scan, error: scanError } = await supabase
            .from("remix_scans")
            .select(`
                *,
                project:remix_projects(*)
            `)
            .eq("id", id)
            .single();

        if (scanError) {
            if (scanError.code === "PGRST116") {
                return NextResponse.json(
                    { error: "Scan not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: "Failed to fetch scan", details: scanError.message },
                { status: 500 }
            );
        }

        // Get associated challenges
        const { data: challenges } = await supabase
            .from("remix_challenges")
            .select("id, title, type, severity, difficulty, status, created_at")
            .eq("project_id", scan.project_id)
            .order("created_at", { ascending: false });

        return NextResponse.json({
            scan,
            challenges: challenges || [],
        });
    } catch (error) {
        console.error("GET /api/remix/scans/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/remix/scans/[id]
 * Update scan (mark as complete, add results)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const body = await request.json();

        const updateData: Record<string, unknown> = {};

        // Allow updating these fields
        if (body.challenges_found !== undefined) {
            updateData.challenges_found = body.challenges_found;
        }
        if (body.challenges_submitted !== undefined) {
            updateData.challenges_submitted = body.challenges_submitted;
        }
        if (body.completed) {
            updateData.completed_at = new Date().toISOString();
            // Calculate duration if started_at exists
            const { data: scan } = await supabase
                .from("remix_scans")
                .select("started_at")
                .eq("id", id)
                .single();

            if (scan?.started_at) {
                const start = new Date(scan.started_at);
                const end = new Date();
                updateData.duration_seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
            }
        }
        if (body.scan_output) {
            updateData.scan_output = body.scan_output;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No valid fields to update" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("remix_scans")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: "Failed to update scan", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ scan: data });
    } catch (error) {
        console.error("PATCH /api/remix/scans/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
