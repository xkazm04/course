// ============================================================================
// Admin: Clean Map Data API
// POST /api/admin/clean-map-data - Delete all map-related data to start fresh
//
// WARNING: This is a destructive operation!
// Deletes: map_nodes, map_node_connections, courses, chapters, learning_paths,
//          learning_path_courses, learning_path_enrollments, user_map_progress,
//          chapter_content_jobs
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface CleanupResult {
    table: string;
    deleted: number | null;
    error?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Verify request has confirmation
        const body = await request.json().catch(() => ({}));
        if (body.confirm !== "DELETE_ALL_MAP_DATA") {
            return NextResponse.json(
                {
                    error: "Confirmation required",
                    message: "Send { confirm: 'DELETE_ALL_MAP_DATA' } to proceed"
                },
                { status: 400 }
            );
        }

        const supabase = await createAdminClient();
        const results: CleanupResult[] = [];

        // Tables to clean in order (respecting foreign key constraints)
        const tables = [
            "chapter_content_jobs",
            "user_map_progress",
            "learning_path_enrollments",
            "learning_path_courses",
            "learning_paths",
            "chapters",
            "courses",
            "map_node_connections",
            "map_nodes",
        ];

        for (const table of tables) {
            try {
                // Delete all rows using neq on id (since we can't delete without a filter)
                const { count, error } = await supabase
                    .from(table)
                    .delete({ count: "exact" })
                    .neq("id", "00000000-0000-0000-0000-000000000000") as {
                        count: number | null;
                        error: any;
                    };

                if (error) {
                    results.push({
                        table,
                        deleted: null,
                        error: error.message,
                    });
                } else {
                    results.push({
                        table,
                        deleted: count,
                    });
                }
            } catch (err) {
                results.push({
                    table,
                    deleted: null,
                    error: err instanceof Error ? err.message : "Unknown error",
                });
            }
        }

        const totalDeleted = results.reduce((sum, r) => sum + (r.deleted || 0), 0);
        const hasErrors = results.some(r => r.error);

        return NextResponse.json({
            success: !hasErrors,
            message: hasErrors
                ? "Cleanup completed with some errors"
                : "All map data cleaned successfully",
            total_deleted: totalDeleted,
            results,
        });

    } catch (error) {
        console.error("Clean map data error:", error);
        return NextResponse.json(
            {
                error: "Failed to clean map data",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
