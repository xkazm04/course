#!/usr/bin/env npx tsx
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    // Get lessons with their parent hierarchy
    const { data: lessons, error } = await supabase
        .from("map_nodes")
        .select(`
            id,
            slug,
            name,
            difficulty,
            parent:parent_id (
                id,
                name,
                slug,
                parent:parent_id (
                    id,
                    name,
                    slug
                )
            )
        `)
        .eq("depth", 4)
        .order("slug");

    if (error) {
        console.log("Error:", error.message);
        return;
    }

    // Group by skill (grandparent)
    const bySkill: Record<string, typeof lessons> = {};

    lessons?.forEach(l => {
        const parent = l.parent as any;
        const skill = parent?.parent as any;
        const skillName = skill?.name || "Unknown";

        if (!bySkill[skillName]) bySkill[skillName] = [];
        bySkill[skillName].push(l);
    });

    console.log("=== CURRICULUM LESSONS BY SKILL ===\n");
    console.log("Total lessons:", lessons?.length);
    console.log("");

    // Output grouped by skill
    Object.keys(bySkill).sort().forEach(skill => {
        console.log(`\n### ${skill}`);
        bySkill[skill].forEach(l => {
            const parent = l.parent as any;
            const area = parent?.name || "";
            console.log(`  - ${l.slug} | ${l.name} | ${area} | ${l.difficulty}`);
        });
    });
}

main().catch(console.error);
