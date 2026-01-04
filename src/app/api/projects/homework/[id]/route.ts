// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/homework/[id]
 * Get a single homework assignment with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: assignmentId } = await params;
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Fetch assignment with all related data
        const { data: assignment, error } = await supabase
            .from("project_homework_assignments")
            .select(`
                id,
                status,
                pr_status,
                pr_url,
                pr_number,
                branch_name,
                hints_used,
                hints_revealed,
                hints_available,
                score,
                score_breakdown,
                ai_feedback,
                time_spent_minutes,
                xp_earned,
                is_winner,
                instructions,
                custom_context,
                submission_url,
                submission_notes,
                created_at,
                started_at,
                submitted_at,
                completed_at,
                homework_definition:homework_definition_id (
                    id,
                    name,
                    slug,
                    homework_type,
                    difficulty,
                    estimated_hours,
                    xp_reward,
                    description,
                    instructions,
                    acceptance_criteria,
                    hints,
                    file_scope,
                    skills_reinforced,
                    branch_prefix,
                    chapter_id,
                    relevance_score,
                    total_submissions,
                    avg_score,
                    feature:feature_id (
                        id,
                        name,
                        slug,
                        description,
                        file_scope,
                        learning_outcomes,
                        repo:repo_id (
                            id,
                            name,
                            owner,
                            source_repo_url,
                            default_branch,
                            tech_stack
                        )
                    )
                )
            `)
            .eq("id", assignmentId)
            .eq("user_id", user.id)
            .single();

        if (error || !assignment) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ assignment });
    } catch (error) {
        console.error("GET /api/projects/homework/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/projects/homework/[id]
 * Update a homework assignment (status, hints, submission, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: assignmentId } = await params;
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
        const allowedFields = [
            "status",
            "hints_revealed",
            "hints_used",
            "time_spent_minutes",
            "submission_url",
            "submission_notes",
            "started_at",
            "submitted_at",
        ];

        // Filter to only allowed fields
        const updateData: Record<string, any> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        // Handle status transitions
        if (updateData.status === "in_progress" && !updateData.started_at) {
            updateData.started_at = new Date().toISOString();
        }
        if (updateData.status === "submitted" && !updateData.submitted_at) {
            updateData.submitted_at = new Date().toISOString();
        }

        // Update assignment
        const { data: assignment, error } = await supabase
            .from("project_homework_assignments")
            .update(updateData)
            .eq("id", assignmentId)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: "Failed to update assignment", details: error.message },
                { status: 500 }
            );
        }

        if (!assignment) {
            return NextResponse.json(
                { error: "Assignment not found or not owned by user" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            assignment,
        });
    } catch (error) {
        console.error("PATCH /api/projects/homework/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
