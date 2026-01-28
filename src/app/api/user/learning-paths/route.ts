/**
 * User Learning Paths API Route
 *
 * Returns the authenticated user's learning path enrollments.
 * Uses curated_path_enrollments table joined with curated_paths.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            // Return empty array for unauthenticated users (not an error)
            // ForgeProvider expects this format and handles empty gracefully
            return NextResponse.json({ learningPaths: [] });
        }

        // Fetch user's path enrollments with path details
        const { data: enrollments, error: enrollmentsError } = await supabase
            .from("curated_path_enrollments")
            .select(`
                id,
                path_id,
                progress_percent,
                status,
                enrolled_at,
                started_at,
                completed_at,
                curated_paths (
                    id,
                    title,
                    description,
                    slug,
                    icon,
                    color,
                    estimated_hours,
                    path_type
                )
            `)
            .eq("user_id", user.id)
            .order("enrolled_at", { ascending: false });

        if (enrollmentsError) {
            console.error("Error fetching learning paths:", enrollmentsError);
            // Return empty array on error to avoid blocking the UI
            return NextResponse.json({ learningPaths: [] });
        }

        // Transform to expected format
        const learningPaths = (enrollments || []).map((enrollment) => {
            const path = enrollment.curated_paths as {
                id: string;
                title: string;
                description: string | null;
                slug: string;
                icon: string | null;
                color: string | null;
                estimated_hours: number | null;
                path_type: string | null;
            } | null;

            return {
                id: enrollment.id,
                pathId: enrollment.path_id,
                title: path?.title || "Unknown Path",
                description: path?.description || null,
                slug: path?.slug || "",
                icon: path?.icon || null,
                color: path?.color || null,
                estimatedHours: path?.estimated_hours || null,
                pathType: path?.path_type || "custom",
                status: enrollment.status,
                progressPercent: enrollment.progress_percent || 0,
                startedAt: enrollment.started_at || enrollment.enrolled_at,
                completedAt: enrollment.completed_at,
            };
        });

        return NextResponse.json({ learningPaths });
    } catch (error) {
        console.error("Unexpected error in learning paths API:", error);
        // Return empty array on error to avoid blocking the UI
        return NextResponse.json({ learningPaths: [] });
    }
}
