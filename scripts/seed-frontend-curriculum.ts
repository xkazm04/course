// ============================================================================
// Seed Frontend Curriculum Script
// Run with: npx dotenv -e .env.local -- tsx scripts/seed-frontend-curriculum.ts
// Or: set the env vars directly and run: npx tsx scripts/seed-frontend-curriculum.ts
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env or .env.local manually
let envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
    envPath = path.join(__dirname, "..", ".env");
}
if (fs.existsSync(envPath)) {
    console.log("Loading env from:", envPath);
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
            const eqIndex = trimmed.indexOf("=");
            if (eqIndex > 0) {
                const key = trimmed.substring(0, eqIndex).trim();
                let value = trimmed.substring(eqIndex + 1).trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        }
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables:");
    console.error("- NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "SET" : "MISSING");
    console.error("- SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "SET" : "MISSING");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Load curriculum data
const curriculumPath = path.join(__dirname, "..", "config", "frontend-curriculum.json");
console.log("Loading curriculum from:", curriculumPath);
const curriculumData = JSON.parse(fs.readFileSync(curriculumPath, "utf-8"));

interface LessonData {
    slug: string;
    name: string;
    description: string;
    estimated_hours: number;
}

interface AreaData {
    slug: string;
    name: string;
    depth: number;
    node_type: string;
    description: string;
    estimated_hours: number;
    difficulty: string;
    sort_order: number;
    lessons: LessonData[];
}

interface SkillData {
    slug: string;
    name: string;
    depth: number;
    node_type: string;
    icon: string;
    color: string;
    description: string;
    estimated_hours: number;
    difficulty: string;
    sort_order: number;
    areas: AreaData[];
}

interface TopicData {
    slug: string;
    name: string;
    depth: number;
    node_type: string;
    icon: string;
    color: string;
    description: string;
    estimated_hours: number;
    difficulty: string;
    sort_order: number;
    skills: SkillData[];
}

async function seedCurriculum() {
    const startTime = Date.now();
    const data = curriculumData;

    console.log("🚀 Starting curriculum seed...\n");

    // Stats tracking
    let domainCount = 0;
    let topicCount = 0;
    let skillCount = 0;
    let areaCount = 0;
    let lessonCount = 0;
    let errorCount = 0;

    // =========================================================================
    // Step 1: Insert Domain (depth 0)
    // =========================================================================
    console.log("📁 Inserting domain...");

    const { data: domainNode, error: domainError } = await supabase
        .from("map_nodes")
        .insert({
            slug: data.domain.slug,
            name: data.domain.name,
            description: data.domain.description,
            depth: 0,
            node_type: "domain",
            domain_id: data.domain.slug,
            parent_id: null,
            icon: data.domain.icon,
            color: data.domain.color,
            estimated_hours: data.domain.estimated_hours,
            difficulty: data.domain.difficulty,
            sort_order: 1,
            is_group_node: false,
            is_ai_generated: false,
        })
        .select("id")
        .single();

    if (domainError || !domainNode) {
        console.error("❌ Failed to create domain:", domainError?.message);
        process.exit(1);
    }

    const domainId = domainNode.id;
    domainCount = 1;
    console.log(`   ✅ Domain: ${data.domain.name} (${domainId})\n`);

    // =========================================================================
    // Step 2: Insert Topics (depth 1)
    // =========================================================================
    console.log("📂 Inserting topics...");

    for (const topic of data.topics as TopicData[]) {
        const { data: topicNode, error: topicError } = await supabase
            .from("map_nodes")
            .insert({
                slug: topic.slug,
                name: topic.name,
                description: topic.description,
                depth: 1,
                node_type: "topic",
                domain_id: data.domain.slug,
                parent_id: domainId,
                icon: topic.icon,
                color: topic.color,
                estimated_hours: topic.estimated_hours,
                difficulty: topic.difficulty,
                sort_order: topic.sort_order,
                is_group_node: false,
                is_ai_generated: false,
            })
            .select("id")
            .single();

        if (topicError || !topicNode) {
            console.error(`   ❌ Topic failed: ${topic.name} - ${topicError?.message}`);
            errorCount++;
            continue;
        }

        const topicId = topicNode.id;
        topicCount++;
        console.log(`   ✅ Topic: ${topic.name}`);

        // =====================================================================
        // Step 3: Insert Skills (depth 2)
        // =====================================================================
        for (const skill of topic.skills) {
            const { data: skillNode, error: skillError } = await supabase
                .from("map_nodes")
                .insert({
                    slug: skill.slug,
                    name: skill.name,
                    description: skill.description,
                    depth: 2,
                    node_type: "skill",
                    domain_id: data.domain.slug,
                    parent_id: topicId,
                    icon: skill.icon,
                    color: skill.color,
                    estimated_hours: skill.estimated_hours,
                    difficulty: skill.difficulty,
                    sort_order: skill.sort_order,
                    is_group_node: false,
                    is_ai_generated: false,
                })
                .select("id")
                .single();

            if (skillError || !skillNode) {
                console.error(`      ❌ Skill failed: ${skill.name} - ${skillError?.message}`);
                errorCount++;
                continue;
            }

            const skillId = skillNode.id;
            skillCount++;
            console.log(`      📚 Skill: ${skill.name}`);

            // =================================================================
            // Step 4: Insert Areas (depth 3) - node_type = 'course'
            // =================================================================
            for (const area of skill.areas) {
                const { data: areaNode, error: areaError } = await supabase
                    .from("map_nodes")
                    .insert({
                        slug: area.slug,
                        name: area.name,
                        description: area.description,
                        depth: 3,
                        node_type: "course",
                        domain_id: data.domain.slug,
                        parent_id: skillId,
                        icon: skill.icon,
                        color: skill.color,
                        estimated_hours: area.estimated_hours,
                        difficulty: area.difficulty,
                        sort_order: area.sort_order,
                        is_group_node: false,
                        is_ai_generated: false,
                    })
                    .select("id")
                    .single();

                if (areaError || !areaNode) {
                    console.error(`         ❌ Area failed: ${area.name} - ${areaError?.message}`);
                    errorCount++;
                    continue;
                }

                const areaId = areaNode.id;
                areaCount++;

                // =============================================================
                // Step 5: Insert Lessons (depth 4)
                // =============================================================
                const lessonInserts = area.lessons.map((lesson, index) => ({
                    slug: lesson.slug,
                    name: lesson.name,
                    description: lesson.description,
                    depth: 4,
                    node_type: "lesson",
                    domain_id: data.domain.slug,
                    parent_id: areaId,
                    icon: "BookOpen",
                    color: skill.color,
                    estimated_hours: lesson.estimated_hours,
                    difficulty: area.difficulty,
                    sort_order: index + 1,
                    is_group_node: false,
                    is_ai_generated: false,
                }));

                const { data: lessonNodes, error: lessonsError } = await supabase
                    .from("map_nodes")
                    .insert(lessonInserts)
                    .select("id");

                if (lessonsError) {
                    console.error(`         ❌ Lessons failed for ${area.name}: ${lessonsError.message}`);
                    errorCount += area.lessons.length;
                } else if (lessonNodes) {
                    lessonCount += lessonNodes.length;
                }
            }
        }
    }

    const duration = Date.now() - startTime;

    console.log("\n" + "=".repeat(60));
    console.log("📊 SEED COMPLETE");
    console.log("=".repeat(60));
    console.log(`   Domains:  ${domainCount}`);
    console.log(`   Topics:   ${topicCount}`);
    console.log(`   Skills:   ${skillCount}`);
    console.log(`   Areas:    ${areaCount}`);
    console.log(`   Lessons:  ${lessonCount}`);
    console.log("   " + "-".repeat(20));
    console.log(`   TOTAL:    ${domainCount + topicCount + skillCount + areaCount + lessonCount}`);
    console.log(`   Errors:   ${errorCount}`);
    console.log(`   Duration: ${duration}ms`);
    console.log("=".repeat(60));
}

seedCurriculum().catch(console.error);
