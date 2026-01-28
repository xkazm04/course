#!/usr/bin/env npx tsx
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data: nodes } = await supabase
        .from("map_nodes")
        .select("id, slug, name, node_type, parent_id, depth, domain_id, difficulty, estimated_hours")
        .eq("domain_id", "frontend")
        .order("depth")
        .order("sort_order");

    const topics = nodes?.filter(n => n.depth === 1) || [];
    const skills = nodes?.filter(n => n.depth === 2) || [];
    const areas = nodes?.filter(n => n.depth === 3) || [];
    const lessons = nodes?.filter(n => n.depth === 4) || [];

    console.log("=== CURRICULUM STRUCTURE ===");
    console.log("Topics (depth 1):", topics.length);
    console.log("Skills (depth 2):", skills.length);
    console.log("Areas (depth 3):", areas.length);
    console.log("Lessons (depth 4):", lessons.length);

    console.log("\n=== TOPICS AND SKILLS ===");
    for (const topic of topics) {
        const topicSkills = skills.filter(s => s.parent_id === topic.id);
        console.log("\n## " + topic.name + " (" + topicSkills.length + " skills)");
        for (const skill of topicSkills) {
            const skillAreas = areas.filter(a => a.parent_id === skill.id);
            const skillLessons = lessons.filter(l =>
                skillAreas.some(a => a.id === l.parent_id)
            );
            console.log("  - " + skill.name + ": " + skillAreas.length + " areas, " + skillLessons.length + " lessons");
        }
    }

    console.log("\n=== DIFFICULTY DISTRIBUTION ===");
    const byDifficulty: Record<string, number> = {};
    lessons.forEach(l => {
        const d = l.difficulty || "intermediate";
        byDifficulty[d] = (byDifficulty[d] || 0) + 1;
    });
    Object.entries(byDifficulty).forEach(([k, v]) => console.log("  " + k + ": " + v));

    console.log("\n=== TOTAL HOURS ===");
    const totalHours = lessons.reduce((sum, l) => sum + (l.estimated_hours || 0.5), 0);
    console.log("  Total: " + totalHours.toFixed(1) + " hours");
}

main().catch(console.error);
