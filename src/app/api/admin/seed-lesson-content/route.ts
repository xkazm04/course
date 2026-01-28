// ============================================================================
// Admin: Seed Lesson Content
// POST /api/admin/seed-lesson-content - Generate and save lesson content for all lessons
//
// This endpoint uses Claude to generate comprehensive lesson content following
// the lesson-generator prompt format. It creates content for depth 4 lesson nodes.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

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

interface AreaNode {
    id: string;
    name: string;
    parent_id: string | null;
}

interface SkillNode {
    id: string;
    name: string;
    parent_id: string | null;
}

interface TopicNode {
    id: string;
    name: string;
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
    supabase: ReturnType<typeof createAdminClient> extends Promise<infer T> ? T : never,
    lessonNode: LessonNode
): Promise<{ topic: string; skill: string; area: string }> {
    const result = { topic: "", skill: "", area: "" };

    try {
        // Get area (parent of lesson)
        if (lessonNode.parent_id) {
            const { data: area } = await supabase
                .from("map_nodes")
                .select("id, name, parent_id")
                .eq("id", lessonNode.parent_id)
                .single();

            if (area) {
                result.area = area.name;

                // Get skill (parent of area)
                if (area.parent_id) {
                    const { data: skill } = await supabase
                        .from("map_nodes")
                        .select("id, name, parent_id")
                        .eq("id", area.parent_id)
                        .single();

                    if (skill) {
                        result.skill = skill.name;

                        // Get topic (parent of skill)
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

    // Extract text content
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in response");
    }

    // Parse JSON from response
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
    supabase: ReturnType<typeof createAdminClient> extends Promise<infer T> ? T : never,
    lessonNodeId: string,
    content: GeneratedContent
): Promise<{ contentId: string; sectionCount: number }> {
    // Insert lesson_content
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

    // Insert lesson_sections
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

// POST - Generate and seed lesson content
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const supabase = await createAdminClient();

        // Get request body for optional filtering
        const body = await request.json().catch(() => ({}));
        const { limit = 5, offset = 0, topicSlug, skillSlug, areaSlug, lessonSlug } = body;

        // Build query for lesson nodes (depth 4)
        let query = supabase
            .from("map_nodes")
            .select("id, slug, name, description, difficulty, estimated_hours, parent_id, domain_id")
            .eq("depth", 4)
            .eq("node_type", "lesson")
            .eq("domain_id", "frontend")
            .order("sort_order", { ascending: true });

        // Apply filters
        if (lessonSlug) {
            query = query.eq("slug", lessonSlug);
        }

        // Execute query
        const { data: lessonNodes, error: nodesError } = await query;

        if (nodesError) {
            return NextResponse.json(
                { error: "Failed to fetch lesson nodes", details: nodesError.message },
                { status: 500 }
            );
        }

        if (!lessonNodes || lessonNodes.length === 0) {
            return NextResponse.json(
                { error: "No lesson nodes found" },
                { status: 404 }
            );
        }

        // Filter out lessons that already have content
        const { data: existingContent } = await supabase
            .from("lesson_content")
            .select("node_id")
            .in("node_id", lessonNodes.map((n) => n.id));

        const existingNodeIds = new Set(existingContent?.map((c) => c.node_id) || []);
        const lessonsToGenerate = lessonNodes.filter((n) => !existingNodeIds.has(n.id));

        // Apply offset and limit
        const paginatedLessons = lessonsToGenerate.slice(offset, offset + limit);

        const results: Array<{
            slug: string;
            name: string;
            status: "success" | "error";
            contentId?: string;
            sectionCount?: number;
            error?: string;
        }> = [];

        // Generate content for each lesson
        for (const lesson of paginatedLessons) {
            try {
                console.log(`Generating content for: ${lesson.name} (${lesson.slug})`);

                // Get breadcrumbs
                const breadcrumbs = await getBreadcrumbs(supabase, lesson);

                // Generate content
                const content = await generateLessonContent(lesson, breadcrumbs);

                // Save to database
                const { contentId, sectionCount } = await saveLessonContent(
                    supabase,
                    lesson.id,
                    content
                );

                results.push({
                    slug: lesson.slug,
                    name: lesson.name,
                    status: "success",
                    contentId,
                    sectionCount,
                });

                console.log(`✓ Generated: ${lesson.name} (${sectionCount} sections)`);
            } catch (error) {
                console.error(`✗ Error for ${lesson.name}:`, error);
                results.push({
                    slug: lesson.slug,
                    name: lesson.name,
                    status: "error",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        const duration = Date.now() - startTime;
        const successCount = results.filter((r) => r.status === "success").length;
        const errorCount = results.filter((r) => r.status === "error").length;

        return NextResponse.json({
            success: errorCount === 0,
            message: `Generated ${successCount} lessons in ${duration}ms`,
            stats: {
                total_lessons: lessonNodes.length,
                already_have_content: existingNodeIds.size,
                remaining: lessonsToGenerate.length,
                generated: successCount,
                errors: errorCount,
                offset,
                limit,
            },
            duration: `${duration}ms`,
            results,
        });
    } catch (error) {
        console.error("Seed lesson content error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to seed lesson content",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// GET - Check current state
export async function GET() {
    try {
        const supabase = await createAdminClient();

        // Count lesson nodes
        const { data: lessonNodes } = await supabase
            .from("map_nodes")
            .select("id")
            .eq("depth", 4)
            .eq("node_type", "lesson")
            .eq("domain_id", "frontend");

        // Count existing content
        const { data: existingContent } = await supabase
            .from("lesson_content")
            .select("id, node_id, status");

        // Count sections
        const { data: sections } = await supabase
            .from("lesson_sections")
            .select("id");

        const stats = {
            total_lesson_nodes: lessonNodes?.length || 0,
            lessons_with_content: existingContent?.length || 0,
            lessons_without_content: (lessonNodes?.length || 0) - (existingContent?.length || 0),
            total_sections: sections?.length || 0,
            content_by_status: {} as Record<string, number>,
        };

        // Group by status
        for (const content of existingContent || []) {
            stats.content_by_status[content.status] = (stats.content_by_status[content.status] || 0) + 1;
        }

        return NextResponse.json({
            message: "Lesson content status",
            stats,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to check status" },
            { status: 500 }
        );
    }
}
