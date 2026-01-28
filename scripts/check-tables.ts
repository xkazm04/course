#!/usr/bin/env npx tsx
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log("=== TABLE CHECK ===\n");

    // Check homework_lesson_mappings
    const { error: mapError } = await supabase
        .from("homework_lesson_mappings")
        .select("id")
        .limit(1);

    if (mapError) {
        console.log("homework_lesson_mappings: NOT FOUND");
        console.log("  Error:", mapError.message);
        console.log("\n⚠️  Please run migration 018_homework_lesson_mapping.sql first");
    } else {
        console.log("homework_lesson_mappings: OK");
    }

    // Check project_homework_definitions
    const { error: hwError } = await supabase
        .from("project_homework_definitions")
        .select("id")
        .limit(1);

    if (hwError) {
        console.log("project_homework_definitions: NOT FOUND");
        console.log("  Error:", hwError.message);
    } else {
        console.log("project_homework_definitions: OK");
    }

    // Check project_repositories
    const { error: repoError } = await supabase
        .from("project_repositories")
        .select("id")
        .limit(1);

    if (repoError) {
        console.log("project_repositories: NOT FOUND");
    } else {
        console.log("project_repositories: OK");
    }

    // Check project_features
    const { error: featError } = await supabase
        .from("project_features")
        .select("id")
        .limit(1);

    if (featError) {
        console.log("project_features: NOT FOUND");
    } else {
        console.log("project_features: OK");
    }
}

main().catch(console.error);
