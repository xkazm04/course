// ============================================================================
// Content Generation Job Status API
// POST /api/content/job-status - Get status of generation jobs
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface JobStatusRequest {
    job_ids: string[];
}

interface JobStatus {
    id: string;
    status: string;
    progress_percent?: number;
    progress_message?: string;
    error_message?: string;
    chapter_id?: string;
    completed_at?: string;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
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

        const body: JobStatusRequest = await request.json();
        const { job_ids } = body;

        if (!job_ids || !Array.isArray(job_ids) || job_ids.length === 0) {
            return NextResponse.json(
                { error: "job_ids array is required" },
                { status: 400 }
            );
        }

        // Limit to prevent abuse
        const limitedIds = job_ids.slice(0, 50);

        // Fetch job statuses
        const { data: jobs, error: queryError } = await supabase
            .from("chapter_content_jobs")
            .select(`
                id,
                status,
                progress_percent,
                progress_message,
                error_message,
                chapter_id,
                completed_at
            `)
            .in("id", limitedIds)
            .eq("requested_by_user_id", user.id) as {
                data: JobStatus[] | null;
                error: any;
            };

        if (queryError) {
            console.error("Error fetching job status:", queryError);
            return NextResponse.json(
                { error: "Failed to fetch job status" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            jobs: jobs || [],
        });
    } catch (error) {
        console.error("Job status error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
