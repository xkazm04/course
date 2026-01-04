// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/features
 * Get project with all its features
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: projectId } = await params;
        const supabase = await createClient();

        // Fetch project with features
        const { data: project, error: projectError } = await supabase
            .from("project_repositories")
            .select(`
                id,
                name,
                owner,
                source_repo_url,
                default_branch,
                primary_language,
                framework,
                tech_stack,
                difficulty_tier,
                complexity_score,
                estimated_onboarding_hours,
                readme_summary,
                architecture_overview,
                feature_count,
                status,
                created_at,
                updated_at
            `)
            .eq("id", projectId)
            .single();

        if (projectError) {
            return NextResponse.json(
                { error: "Project not found", details: projectError.message },
                { status: 404 }
            );
        }

        // Fetch features separately with all details
        const { data: features, error: featuresError } = await supabase
            .from("project_features")
            .select(`
                id,
                name,
                slug,
                description,
                difficulty,
                complexity_score,
                estimated_hours,
                file_scope,
                entry_points,
                context_summary,
                prerequisites,
                learning_outcomes,
                acceptance_tests,
                chapter_mappings,
                primary_chapter_id,
                status,
                assignment_count,
                completion_count,
                avg_score,
                created_at
            `)
            .eq("repo_id", projectId)
            .in("status", ["approved", "assigned"])
            .order("complexity_score", { ascending: true });

        if (featuresError) {
            return NextResponse.json(
                { error: "Failed to fetch features", details: featuresError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            project: {
                ...project,
                features: features || [],
            },
        });
    } catch (error) {
        console.error("GET /api/projects/[id]/features error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
