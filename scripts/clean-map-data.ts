/**
 * Clean Map Data Script
 * Deletes all map-related data from Supabase to start fresh
 *
 * Run with: npx tsx scripts/clean-map-data.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanMapData() {
    console.log("🧹 Starting map data cleanup...\n");

    const tables = [
        { name: "chapter_content_jobs", filter: null },
        { name: "user_map_progress", filter: null },
        { name: "learning_path_enrollments", filter: null },
        { name: "learning_path_courses", filter: null },
        { name: "learning_paths", filter: null },
        { name: "chapters", filter: null },
        { name: "courses", filter: null },
        { name: "map_node_connections", filter: null },
        { name: "map_nodes", filter: null },
    ];

    for (const table of tables) {
        try {
            console.log(`  Deleting from ${table.name}...`);

            // Delete all rows - use neq on id to match all rows
            const { error, count } = await supabase
                .from(table.name)
                .delete({ count: "exact" })
                .neq("id", "00000000-0000-0000-0000-000000000000");

            if (error) {
                console.error(`  ❌ Error deleting from ${table.name}:`, error.message);
            } else {
                console.log(`  ✅ Deleted ${count ?? "all"} rows from ${table.name}`);
            }
        } catch (err) {
            console.error(`  ❌ Exception deleting from ${table.name}:`, err);
        }
    }

    console.log("\n✨ Map data cleanup complete!");
}

cleanMapData().catch(console.error);
