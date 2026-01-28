#!/usr/bin/env npx tsx
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data: paths, error } = await supabase
        .from("curated_paths")
        .select("slug, title, path_type, scope, lesson_count, estimated_hours, is_featured")
        .eq("status", "published")
        .order("lesson_count", { ascending: false });

    if (error) {
        console.log("Error:", error.message);
        return;
    }

    console.log("=== CREATED LEARNING PATHS ===\n");

    paths?.forEach((p, i) => {
        const star = p.is_featured ? " [FEATURED]" : "";
        console.log((i + 1) + ". " + p.title + star);
        console.log("   " + p.path_type + " | " + p.scope + " | " + p.lesson_count + " lessons | " + p.estimated_hours + "h");
        console.log("");
    });

    const { count } = await supabase.from("path_lessons").select("*", { count: "exact", head: true });
    console.log("Total path-lesson mappings: " + count);

    // Lesson usage stats
    const { data: usage } = await supabase.rpc("get_lesson_usage_stats");

    // Simple lesson count per path
    const { data: lessonCounts } = await supabase
        .from("path_lessons")
        .select("lesson_node_id")
        .limit(1000);

    const uniqueLessons = new Set(lessonCounts?.map(l => l.lesson_node_id));
    console.log("Unique lessons used: " + uniqueLessons.size + " / 265");
}

main().catch(console.error);
