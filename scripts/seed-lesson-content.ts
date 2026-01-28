#!/usr/bin/env npx tsx
/**
 * Lesson Content Seeder Script
 *
 * Generates and saves comprehensive lesson content for all curriculum lessons.
 * Run with: npx tsx scripts/seed-lesson-content.ts
 *
 * Options:
 *   --limit=N     Limit number of lessons to generate (default: 5)
 *   --offset=N    Skip N lessons (default: 0)
 *   --lesson=slug Generate content for a specific lesson
 *   --dry-run     Show what would be generated without saving
 *   --check       Just check the current state, don't generate
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// Load environment variables from .env
config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase environment variables");
    process.exit(1);
}

if (!anthropicApiKey) {
    console.error("Missing ANTHROPIC_API_KEY environment variable");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const anthropic = new Anthropic({ apiKey: anthropicApiKey });

interface LessonNode {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    difficulty: string | null;
    estimated_hours: number | null;
    parent_id: string | null;
    domain_id: string;
}

interface GeneratedContent {
    introduction: string;
    content_markdown: string;
    metadata: {
        estimated_minutes: number;
        difficulty: string;
        key_takeaways: string[];
        key_references: Array<{
            title: string;
            url: string;
            type: string;
        }>;
        video_variants: Array<{
            id: string;
            title: string;
            search_query: string;
            instructor?: string;
            style?: string;
            duration?: string;
        }>;
        tags: string[];
    };
    sections: Array<{
        title: string;
        section_type: string;
        duration_minutes: number;
        content_markdown: string;
        code_snippet?: string;
        code_language?: string;
        key_points: string[];
    }>;
}

// Get breadcrumb info for a lesson
async function getBreadcrumbs(
    lessonNode: LessonNode
): Promise<{ topic: string; skill: string; area: string }> {
    const result = { topic: "", skill: "", area: "" };

    try {
        if (lessonNode.parent_id) {
            const { data: area } = await supabase
                .from("map_nodes")
                .select("id, name, parent_id")
                .eq("id", lessonNode.parent_id)
                .single();

            if (area) {
                result.area = area.name;

                if (area.parent_id) {
                    const { data: skill } = await supabase
                        .from("map_nodes")
                        .select("id, name, parent_id")
                        .eq("id", area.parent_id)
                        .single();

                    if (skill) {
                        result.skill = skill.name;

                        if (skill.parent_id) {
                            const { data: topic } = await supabase
                                .from("map_nodes")
                                .select("id, name")
                                .eq("id", skill.parent_id)
                                .single();

                            if (topic) {
                                result.topic = topic.name;
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error getting breadcrumbs:", error);
    }

    return result;
}

// Generate lesson content using Claude
async function generateLessonContent(
    lessonNode: LessonNode,
    breadcrumbs: { topic: string; skill: string; area: string }
): Promise<GeneratedContent> {
    const estimatedMinutes = Math.round((lessonNode.estimated_hours || 0.5) * 60);
    const difficulty = lessonNode.difficulty || "intermediate";

    const prompt = `You are an expert curriculum designer creating a comprehensive programming lesson.

## Lesson Details
- **Topic**: ${lessonNode.name}
- **Description**: ${lessonNode.description || ""}
- **Domain**: ${breadcrumbs.topic}
- **Skill Area**: ${breadcrumbs.skill}
- **Sub-Area**: ${breadcrumbs.area}
- **Difficulty**: ${difficulty}
- **Target Duration**: ${estimatedMinutes} minutes

## Your Task
Generate a complete lesson with rich content using custom markdown blocks. The content should be practical, accurate, and engaging.

## Output Format
Return a valid JSON object with this exact structure (no markdown code fences, just raw JSON):

{
  "introduction": "2-3 paragraph introduction with **bold** key terms. Explain why this matters and what learners will master.",
  "content_markdown": "Main content with custom blocks (see below)",
  "metadata": {
    "estimated_minutes": ${estimatedMinutes},
    "difficulty": "${difficulty}",
    "key_takeaways": ["4-6 concise takeaway strings"],
    "key_references": [
      {"title": "Reference Name", "url": "https://...", "type": "docs|repo|tool|article"}
    ],
    "video_variants": [
      {"id": "unique-id", "title": "Video Title", "search_query": "search terms", "instructor": "Name", "style": "animated|lecture|tutorial", "duration": "5:00"}
    ],
    "tags": ["5-8 relevant tags"]
  },
  "sections": [
    {
      "title": "Section Title",
      "section_type": "lesson|interactive|exercise",
      "duration_minutes": 5,
      "content_markdown": "Section content with custom blocks",
      "code_snippet": "optional main code example",
      "code_language": "javascript",
      "key_points": ["3-5 key points for this section"]
    }
  ]
}

## Custom Markdown Blocks to Use

Use these in content_markdown and section content_markdown:

:::definition[title="Term"]
Clear definition text.
:::

:::code[language="javascript" title="Example"]
// code here
:::

:::keypoints
- Point 1
- Point 2
:::

:::tabs
## JavaScript [javascript]
// JS code

## TypeScript [typescript]
// TS code
:::

:::comparison[title="Title" left="Option A" right="Option B"]
LEFT:
// Left side code/explanation

RIGHT:
// Right side code/explanation

VERDICT:
When to use each.
:::

:::pitfall[title="Common Mistake"]
WRONG:
\`\`\`javascript
// bad code
\`\`\`

RIGHT:
\`\`\`javascript
// good code
\`\`\`

WHY:
Explanation.
:::

:::steps[title="How to Do X"]
## Step 1
Description and code.

## Step 2
Description and code.
:::

:::realworld[title="Real Implementation"]
Show how this is used in real libraries/frameworks with code example.
:::

:::checkpoint[question="Question?" hint="Hint"]
Answer explanation.
:::

:::protip[author="Expert Name"]
Expert insight or best practice.
:::

:::warning[title="Warning"]
Important caution.
:::

:::deepdive[title="Advanced Topic"]
Deeper technical explanation for curious learners.
:::

## Requirements
1. Create 3-5 detailed sections
2. Use at least 6 different custom block types
3. Include practical code examples that are syntactically correct
4. Add real-world context and applications
5. Include common mistakes and how to avoid them
6. Make content progressively more complex
7. All code must be runnable and accurate

Generate the JSON now:`;

    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in response");
    }

    let jsonStr = textContent.text.trim();

    // Remove markdown code fences if present
    if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
    }

    const content = JSON.parse(jsonStr.trim()) as GeneratedContent;
    return content;
}

// Save lesson content to database
async function saveLessonContent(
    lessonNodeId: string,
    content: GeneratedContent
): Promise<{ contentId: string; sectionCount: number }> {
    const { data: lessonContent, error: contentError } = await supabase
        .from("lesson_content")
        .insert({
            node_id: lessonNodeId,
            version: 1,
            status: "published",
            introduction: content.introduction,
            content_markdown: content.content_markdown,
            metadata: content.metadata,
            is_ai_generated: true,
            ai_model: "claude-sonnet-4-20250514",
            published_at: new Date().toISOString(),
        })
        .select("id")
        .single();

    if (contentError || !lessonContent) {
        throw new Error(`Failed to insert lesson_content: ${contentError?.message}`);
    }

    const sectionInserts = content.sections.map((section, index) => ({
        lesson_content_id: lessonContent.id,
        sort_order: index + 1,
        title: section.title,
        section_type: section.section_type,
        duration_minutes: section.duration_minutes,
        content_markdown: section.content_markdown,
        code_snippet: section.code_snippet || null,
        code_language: section.code_language || null,
        key_points: section.key_points,
    }));

    const { error: sectionsError } = await supabase
        .from("lesson_sections")
        .insert(sectionInserts);

    if (sectionsError) {
        throw new Error(`Failed to insert lesson_sections: ${sectionsError.message}`);
    }

    return { contentId: lessonContent.id, sectionCount: content.sections.length };
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    const options = {
        limit: 5,
        offset: 0,
        lesson: null as string | null,
        dryRun: false,
        checkOnly: false,
    };

    // Parse arguments
    for (const arg of args) {
        if (arg.startsWith("--limit=")) {
            options.limit = parseInt(arg.split("=")[1], 10);
        } else if (arg.startsWith("--offset=")) {
            options.offset = parseInt(arg.split("=")[1], 10);
        } else if (arg.startsWith("--lesson=")) {
            options.lesson = arg.split("=")[1];
        } else if (arg === "--dry-run") {
            options.dryRun = true;
        } else if (arg === "--check") {
            options.checkOnly = true;
        }
    }

    // Check-only mode
    if (options.checkOnly) {
        console.log("\n📊 Checking curriculum state...\n");

        const { data: nodes } = await supabase
            .from("map_nodes")
            .select("depth, node_type")
            .eq("domain_id", "frontend");

        const stats: Record<string, number> = {};
        nodes?.forEach(r => {
            const k = `depth ${r.depth} (${r.node_type})`;
            stats[k] = (stats[k] || 0) + 1;
        });

        console.log("Curriculum nodes:");
        Object.entries(stats).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));

        const { data: content } = await supabase.from("lesson_content").select("id");
        console.log(`\nLesson content records: ${content?.length || 0}`);

        const { data: sections } = await supabase.from("lesson_sections").select("id");
        console.log(`Lesson sections: ${sections?.length || 0}`);

        return;
    }

    console.log("\n🎓 Lesson Content Seeder");
    console.log("========================\n");
    console.log(`Options: limit=${options.limit}, offset=${options.offset}, dryRun=${options.dryRun}`);
    if (options.lesson) {
        console.log(`Targeting specific lesson: ${options.lesson}`);
    }
    console.log("");

    // Build query for lesson nodes (depth 4)
    let query = supabase
        .from("map_nodes")
        .select("id, slug, name, description, difficulty, estimated_hours, parent_id, domain_id")
        .eq("depth", 4)
        .eq("node_type", "lesson")
        .eq("domain_id", "frontend")
        .order("sort_order", { ascending: true });

    if (options.lesson) {
        query = query.eq("slug", options.lesson);
    }

    const { data: lessonNodes, error: nodesError } = await query;

    if (nodesError) {
        console.error("Failed to fetch lesson nodes:", nodesError.message);
        process.exit(1);
    }

    if (!lessonNodes || lessonNodes.length === 0) {
        console.log("No lesson nodes found. Make sure to seed the curriculum first.");
        console.log("Run: curl -X POST http://localhost:3000/api/admin/seed-frontend-curriculum");
        process.exit(0);
    }

    console.log(`Found ${lessonNodes.length} total lesson nodes\n`);

    // Filter out lessons that already have content
    const { data: existingContent } = await supabase
        .from("lesson_content")
        .select("node_id")
        .in("node_id", lessonNodes.map((n) => n.id));

    const existingNodeIds = new Set(existingContent?.map((c) => c.node_id) || []);
    const lessonsToGenerate = lessonNodes.filter((n) => !existingNodeIds.has(n.id));

    console.log(`${existingNodeIds.size} lessons already have content`);
    console.log(`${lessonsToGenerate.length} lessons need content\n`);

    // Apply offset and limit
    const paginatedLessons = lessonsToGenerate.slice(options.offset, options.offset + options.limit);

    if (paginatedLessons.length === 0) {
        console.log("No lessons to generate (all done or check offset/limit)");
        process.exit(0);
    }

    console.log(`Generating content for ${paginatedLessons.length} lessons:\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const lesson of paginatedLessons) {
        const startTime = Date.now();

        try {
            console.log(`📝 Generating: ${lesson.name} (${lesson.slug})`);

            const breadcrumbs = await getBreadcrumbs(lesson);
            console.log(`   Path: ${breadcrumbs.topic} > ${breadcrumbs.skill} > ${breadcrumbs.area}`);

            if (options.dryRun) {
                console.log(`   [DRY RUN] Would generate content here`);
                successCount++;
                continue;
            }

            const content = await generateLessonContent(lesson, breadcrumbs);
            const { contentId, sectionCount } = await saveLessonContent(lesson.id, content);

            const duration = Date.now() - startTime;
            console.log(`   ✅ Generated ${sectionCount} sections in ${duration}ms`);
            console.log(`   ID: ${contentId}\n`);

            successCount++;

            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
            errorCount++;
            console.log(`   ❌ Error: ${error instanceof Error ? error.message : "Unknown error"}\n`);
        }
    }

    console.log("\n========================");
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Remaining: ${lessonsToGenerate.length - options.offset - options.limit}`);
    console.log("\nTo generate more, run again with --offset=" + (options.offset + options.limit));
}

main().catch(console.error);
