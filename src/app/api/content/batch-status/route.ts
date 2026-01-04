// ============================================================================
// Batch Status API
// POST /api/content/batch-status - Get status of all jobs in a batch
//
// This endpoint queries Supabase directly instead of calling external cloud
// functions. Returns aggregated status of content generation jobs.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface GenerationJobInfo {
    job_id: string;
    node_id: string;
    node_name: string;
    status: string;
    progress_percent?: number;
    progress_message?: string;
    error_message?: string;
}

interface BatchStatusResponse {
    batch_id: string;
    overall_progress: number;
    completed_count: number;
    failed_count: number;
    total_count: number;
    all_completed: boolean;
    jobs: GenerationJobInfo[];
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { batch_id } = body;

        if (!batch_id) {
            return NextResponse.json(
                { error: "batch_id is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Fetch all jobs in this batch
        const { data: jobs, error } = await supabase
            .from("chapter_content_jobs")
            .select(`
                id,
                chapter_id,
                status,
                progress_percent,
                progress_message,
                error_message,
                chapter_context
            `)
            .eq("batch_id", batch_id) as {
                data: Array<{
                    id: string;
                    chapter_id: string;
                    status: string;
                    progress_percent: number | null;
                    progress_message: string | null;
                    error_message: string | null;
                    chapter_context: any;
                }> | null;
                error: any;
            };

        if (error) {
            console.error("Error fetching batch jobs:", error);
            return NextResponse.json(
                { error: "Failed to fetch batch status" },
                { status: 500 }
            );
        }

        const jobsList = jobs || [];
        const totalCount = jobsList.length;
        const completedCount = jobsList.filter(j => j.status === "completed").length;
        const failedCount = jobsList.filter(j => j.status === "failed").length;

        // Calculate overall progress
        let overallProgress = 0;
        if (totalCount > 0) {
            const totalProgress = jobsList.reduce((sum, job) => {
                if (job.status === "completed") return sum + 100;
                if (job.status === "failed") return sum + 100; // Failed jobs count as complete for progress
                return sum + (job.progress_percent || 0);
            }, 0);
            overallProgress = Math.round(totalProgress / totalCount);
        }

        const allCompleted = totalCount > 0 && completedCount + failedCount === totalCount;

        // Transform jobs to response format
        const jobsResponse: GenerationJobInfo[] = jobsList.map(job => ({
            job_id: job.id,
            node_id: job.chapter_context?.map_node_id || "",
            node_name: job.chapter_context?.chapter_title || "Unknown",
            status: job.status,
            progress_percent: job.progress_percent || undefined,
            progress_message: job.progress_message || undefined,
            error_message: job.error_message || undefined,
        }));

        const response: BatchStatusResponse = {
            batch_id,
            overall_progress: overallProgress,
            completed_count: completedCount,
            failed_count: failedCount,
            total_count: totalCount,
            all_completed: allCompleted,
            jobs: jobsResponse,
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error("Batch status API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
