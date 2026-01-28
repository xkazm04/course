import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/chapters/[id]/homeworks
 * Get all open homeworks for a specific chapter, with user's progress
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: chapterId } = await params;
        const supabase = await createClient();

        // Get user if authenticated (for assignment status)
        const { data: { user } } = await supabase.auth.getUser();

        // Use the database function for efficient querying
        const { data: homeworks, error } = await (supabase.rpc as any)(
            "get_chapter_homeworks",
            {
                p_chapter_id: chapterId,
                p_user_id: user?.id || null,
            }
        );

        if (error) {
            console.error("get_chapter_homeworks error:", error);
            // Fallback to direct query if function doesn't exist
            return await fallbackQuery(supabase, chapterId, user?.id);
        }

        // Group by status for easier UI consumption
        const grouped = {
            available: homeworks?.filter(
                (h: any) => !h.user_assignment_status
            ) || [],
            in_progress: homeworks?.filter(
                (h: any) =>
                    h.user_assignment_status &&
                    !["completed", "submitted"].includes(h.user_assignment_status)
            ) || [],
            completed: homeworks?.filter(
                (h: any) =>
                    ["completed", "submitted"].includes(h.user_assignment_status)
            ) || [],
        };

        // Determine if chapter has required homework blocking completion
        const hasActiveHomework = grouped.in_progress.length > 0;
        const hasUnsubmittedPR = grouped.in_progress.some(
            (h: any) => !h.user_pr_status || h.user_pr_status === "pending"
        );

        return NextResponse.json({
            chapter_id: chapterId,
            homeworks: homeworks || [],
            grouped,
            total_count: homeworks?.length || 0,
            has_active_homework: hasActiveHomework,
            requires_pr: hasActiveHomework && hasUnsubmittedPR,
            can_complete_chapter: !hasUnsubmittedPR,
        });
    } catch (error) {
        console.error("GET /api/chapters/[id]/homeworks error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Fallback direct query if database function doesn't exist
 */
async function fallbackQuery(
    supabase: any,
    chapterId: string,
    userId: string | undefined
) {
    // Query homework definitions for this chapter
    const { data: definitions, error: defError } = await supabase
        .from("project_homework_definitions")
        .select(`
            id,
            name,
            slug,
            homework_type,
            difficulty,
            estimated_hours,
            xp_reward,
            description,
            branch_prefix,
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
        `)
        .eq("chapter_id", chapterId)
        .in("status", ["open", "active"]);

    if (defError) {
        return NextResponse.json(
            { error: "Failed to fetch homeworks", details: defError.message },
            { status: 500 }
        );
    }

    // If user is logged in, get their assignments
    const userAssignments: Record<string, any> = {};
    if (userId && definitions?.length > 0) {
        const defIds = definitions.map((d: any) => d.id);
        const { data: assignments } = await supabase
            .from("project_homework_assignments")
            .select("homework_definition_id, status, pr_status, branch_name, id")
            .eq("user_id", userId)
            .in("homework_definition_id", defIds);

        if (assignments) {
            for (const a of assignments) {
                userAssignments[a.homework_definition_id] = a;
            }
        }
    }

    // Merge assignment status into definitions
    const homeworks = (definitions || []).map((def: any) => {
        const assignment = userAssignments[def.id];
        return {
            homework_id: def.id,
            homework_name: def.name,
            homework_slug: def.slug,
            homework_type: def.homework_type,
            difficulty: def.difficulty,
            estimated_hours: def.estimated_hours,
            xp_reward: def.xp_reward,
            description: def.description,
            branch_prefix: def.branch_prefix,
            relevance_score: def.relevance_score,
            project_id: def.feature?.repo?.id,
            project_name: def.feature?.repo?.name,
            project_owner: def.feature?.repo?.owner,
            source_repo_url: def.feature?.repo?.source_repo_url,
            default_branch: def.feature?.repo?.default_branch,
            feature_id: def.feature?.id,
            feature_name: def.feature?.name,
            user_assignment_id: assignment?.id || null,
            user_assignment_status: assignment?.status || null,
            user_pr_status: assignment?.pr_status || null,
            user_branch_name: assignment?.branch_name || null,
        };
    });

    // Group by status
    const grouped = {
        available: homeworks.filter((h: any) => !h.user_assignment_status),
        in_progress: homeworks.filter(
            (h: any) =>
                h.user_assignment_status &&
                !["completed", "submitted"].includes(h.user_assignment_status)
        ),
        completed: homeworks.filter(
            (h: any) =>
                ["completed", "submitted"].includes(h.user_assignment_status)
        ),
    };

    const hasActiveHomework = grouped.in_progress.length > 0;
    const hasUnsubmittedPR = grouped.in_progress.some(
        (h: any) => !h.user_pr_status || h.user_pr_status === "pending"
    );

    return NextResponse.json({
        chapter_id: chapterId,
        homeworks,
        grouped,
        total_count: homeworks.length,
        has_active_homework: hasActiveHomework,
        requires_pr: hasActiveHomework && hasUnsubmittedPR,
        can_complete_chapter: !hasUnsubmittedPR,
    });
}
