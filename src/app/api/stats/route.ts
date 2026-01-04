// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/stats
 * Returns platform statistics: user count, learning paths count, chapters count
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch counts in parallel
        const [usersResult, pathsResult, chaptersResult] = await Promise.all([
            supabase.from("user_profiles").select("id", { count: "exact", head: true }),
            supabase.from("learning_paths").select("id", { count: "exact", head: true }),
            supabase.from("chapters").select("id", { count: "exact", head: true }),
        ]);

        // Extract counts with fallbacks
        const users = usersResult.count ?? 0;
        const paths = pathsResult.count ?? 0;
        const chapters = chaptersResult.count ?? 0;

        return NextResponse.json({
            users,
            paths,
            chapters,
            // Add timestamp for caching purposes
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error fetching stats:", error);

        // Return fallback values on error
        return NextResponse.json(
            {
                users: 0,
                paths: 0,
                chapters: 0,
                error: "Failed to fetch stats",
            },
            { status: 500 }
        );
    }
}
