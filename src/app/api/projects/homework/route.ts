// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/projects/homework
 * Get user's homework assignments with optional filters
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get("status");
        const chapterId = searchParams.get("chapter_id");
        const homeworkDefId = searchParams.get("homework_definition_id");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Build query for assignments with homework definitions
        let query = supabase
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
                score,
                time_spent_minutes,
                xp_earned,
                is_winner,
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
                    branch_prefix,
                    chapter_id,
                    relevance_score,
                    feature:feature_id (
                        id,
                        name,
                        slug,
                        repo:repo_id (
                            id,
                            name,
                            owner,
                            source_repo_url,
                            default_branch
                        )
                    )
                )
            `, { count: "exact" })
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (status) {
            query = query.eq("status", status);
        }
        if (homeworkDefId) {
            query = query.eq("homework_definition_id", homeworkDefId);
        }

        const { data: assignments, error, count } = await query;

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch assignments", details: error.message },
                { status: 500 }
            );
        }

        // If chapter filter, filter in memory (nested filter not supported)
        let filteredAssignments = assignments;
        if (chapterId && assignments) {
            filteredAssignments = assignments.filter(
                (a: any) => a.homework_definition?.chapter_id === chapterId
            );
        }

        return NextResponse.json({
            assignments: filteredAssignments,
            total: count,
            limit,
            offset,
        });
    } catch (error) {
        console.error("GET /api/projects/homework error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/projects/homework
 * Create a new homework assignment for the current user
 */
export async function POST(request: NextRequest) {
    try {
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
        const { homework_definition_id, chapter_id } = body;

        if (!homework_definition_id) {
            return NextResponse.json(
                { error: "homework_definition_id is required" },
                { status: 400 }
            );
        }

        // Verify homework definition exists and is open
        const { data: homeworkDef, error: defError } = await supabase
            .from("project_homework_definitions")
            .select(`
                id,
                feature_id,
                status,
                branch_prefix,
                xp_reward,
                hints
            `)
            .eq("id", homework_definition_id)
            .single();

        if (defError || !homeworkDef) {
            return NextResponse.json(
                { error: "Homework definition not found" },
                { status: 404 }
            );
        }

        if (homeworkDef.status !== "open" && homeworkDef.status !== "active") {
            return NextResponse.json(
                { error: "Homework is not currently available", status: homeworkDef.status },
                { status: 400 }
            );
        }

        // Check for existing assignment
        const { data: existing } = await supabase
            .from("project_homework_assignments")
            .select("id, status")
            .eq("user_id", user.id)
            .eq("homework_definition_id", homework_definition_id)
            .single();

        if (existing) {
            return NextResponse.json(
                {
                    error: "Already assigned",
                    assignment_id: existing.id,
                    status: existing.status,
                },
                { status: 409 }
            );
        }

        // Generate branch name with username
        const username = user.email?.split("@")[0] || user.id.slice(0, 8);
        const branchName = `${homeworkDef.branch_prefix}:${username}`;

        // Create assignment
        const { data: assignment, error: insertError } = await supabase
            .from("project_homework_assignments")
            .insert({
                user_id: user.id,
                feature_id: homeworkDef.feature_id,
                homework_definition_id: homework_definition_id,
                chapter_id: chapter_id || null,
                status: "assigned",
                branch_name: branchName,
                hints_available: homeworkDef.hints,
                hints_revealed: [],
                hints_used: 0,
            })
            .select()
            .single();

        if (insertError) {
            return NextResponse.json(
                { error: "Failed to create assignment", details: insertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                assignment,
                branch_name: branchName,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/projects/homework error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
