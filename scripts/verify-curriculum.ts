// Quick verification script
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
let envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
    envPath = path.join(__dirname, "..", ".env");
}
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
            const key = trimmed.substring(0, eqIndex).trim();
            let value = trimmed.substring(eqIndex + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    }
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
    console.log("Verifying frontend curriculum...\n");

    const { data, error } = await supabase
        .from("map_nodes")
        .select("id, slug, name, depth, node_type, parent_id")
        .eq("domain_id", "frontend")
        .order("depth")
        .order("sort_order");

    if (error) {
        console.error("Error:", error);
        process.exit(1);
    }

    const byDepth: Record<number, number> = {};
    const byType: Record<string, number> = {};

    for (const row of data || []) {
        byDepth[row.depth] = (byDepth[row.depth] || 0) + 1;
        byType[row.node_type] = (byType[row.node_type] || 0) + 1;
    }

    console.log("=".repeat(50));
    console.log("Frontend Curriculum Verification");
    console.log("=".repeat(50));
    console.log(`Total nodes: ${data?.length || 0}`);
    console.log("\nBy Depth:");
    console.log(`  Depth 0 (Domain):  ${byDepth[0] || 0}`);
    console.log(`  Depth 1 (Topic):   ${byDepth[1] || 0}`);
    console.log(`  Depth 2 (Skill):   ${byDepth[2] || 0}`);
    console.log(`  Depth 3 (Area):    ${byDepth[3] || 0}`);
    console.log(`  Depth 4 (Lesson):  ${byDepth[4] || 0}`);
    console.log("\nBy Type:");
    for (const [type, count] of Object.entries(byType)) {
        console.log(`  ${type}: ${count}`);
    }

    // Show sample hierarchy
    console.log("\n" + "=".repeat(50));
    console.log("Sample Hierarchy (first topic)");
    console.log("=".repeat(50));

    const domain = data?.find(n => n.depth === 0);
    const firstTopic = data?.find(n => n.depth === 1);
    const firstSkill = data?.find(n => n.depth === 2 && n.parent_id === firstTopic?.id);
    const firstArea = data?.find(n => n.depth === 3 && n.parent_id === firstSkill?.id);
    const sampleLessons = data?.filter(n => n.depth === 4 && n.parent_id === firstArea?.id).slice(0, 3);

    if (domain) console.log(`Domain: ${domain.name}`);
    if (firstTopic) console.log(`  └─ Topic: ${firstTopic.name}`);
    if (firstSkill) console.log(`      └─ Skill: ${firstSkill.name}`);
    if (firstArea) console.log(`          └─ Area: ${firstArea.name}`);
    for (const lesson of sampleLessons || []) {
        console.log(`              └─ Lesson: ${lesson.name}`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ Verification complete!");
    console.log("=".repeat(50));
}

verify().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
