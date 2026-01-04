// ============================================================================
// User Learning Paths API
// GET /api/user/learning-paths - Get user's learning path enrollments
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { data, error } = await supabase
            .from("learning_path_enrollments")
            .select(`
                id,
                learning_path_id,
                status,
                progress_percent,
                started_at,
                completed_at,
                learning_paths (
                    id,
                    title,
                    description,
                    estimated_hours,
                    path_type
                )
            `)
            .eq("user_id", user.id)
            .order("started_at", { ascending: false });

        if (error) {
            console.error("Error fetching learning paths:", error);
            return NextResponse.json(
                { error: "Failed to fetch learning paths" },
                { status: 500 }
            );
        }

        const learningPaths = (data || []).map((enrollment: any) => ({
            id: enrollment.id,
            pathId: enrollment.learning_path_id,
            title: enrollment.learning_paths?.title || "Unknown Path",
            description: enrollment.learning_paths?.description || null,
            estimatedHours: enrollment.learning_paths?.estimated_hours || 0,
            pathType: enrollment.learning_paths?.path_type || "custom",
            status: enrollment.status,
            progressPercent: enrollment.progress_percent,
            startedAt: enrollment.started_at,
            completedAt: enrollment.completed_at,
        }));

        return NextResponse.json({ learningPaths });
    } catch (error) {
        console.error("Learning paths API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
