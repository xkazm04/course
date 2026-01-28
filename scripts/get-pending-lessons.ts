#!/usr/bin/env npx tsx
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    // Get all lesson nodes
    const { data: lessons } = await supabase
        .from("map_nodes")
        .select("id, slug, name, description, difficulty, estimated_hours, parent_id")
        .eq("depth", 4)
        .eq("node_type", "lesson")
        .eq("domain_id", "frontend")
        .order("sort_order");

    // Get existing content
    const { data: existing } = await supabase
        .from("lesson_content")
        .select("node_id");

    const existingIds = new Set(existing?.map((e) => e.node_id) || []);
    const needed = lessons?.filter((l) => !existingIds.has(l.id)) || [];

    // Get breadcrumbs for first 5
    for (const lesson of needed.slice(0, 5)) {
        // Get parent chain
        let current = lesson;
        const chain: string[] = [lesson.name];

        while (current.parent_id) {
            const { data: parent } = await supabase
                .from("map_nodes")
                .select("id, name, parent_id")
                .eq("id", current.parent_id)
                .single();

            if (parent) {
                chain.unshift(parent.name);
                current = parent as typeof current;
            } else {
                break;
            }
        }

        console.log(`\n--- ${lesson.slug} ---`);
        console.log(`ID: ${lesson.id}`);
        console.log(`Name: ${lesson.name}`);
        console.log(`Path: ${chain.join(" > ")}`);
        console.log(`Description: ${lesson.description || "N/A"}`);
        console.log(`Difficulty: ${lesson.difficulty || "intermediate"}`);
        console.log(`Duration: ${Math.round((lesson.estimated_hours || 0.5) * 60)} minutes`);
    }

    console.log(`\n\nTotal remaining: ${needed.length}`);
}

main().catch(console.error);
