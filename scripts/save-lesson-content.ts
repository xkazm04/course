#!/usr/bin/env npx tsx
/**
 * Save pre-generated lesson content to database
 * Usage: npx tsx scripts/save-lesson-content.ts <node_id> < content.json
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

async function saveContent(nodeId: string, content: GeneratedContent) {
    // Insert lesson_content
    const { data: lessonContent, error: contentError } = await supabase
        .from("lesson_content")
        .insert({
            node_id: nodeId,
            version: 1,
            status: "published",
            introduction: content.introduction,
            content_markdown: content.content_markdown,
            metadata: content.metadata,
            is_ai_generated: true,
            ai_model: "claude-code-opus",
            published_at: new Date().toISOString(),
        })
        .select("id")
        .single();

    if (contentError || !lessonContent) {
        throw new Error(`Failed to insert lesson_content: ${contentError?.message}`);
    }

    // Insert sections
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

async function main() {
    const nodeId = process.argv[2];

    if (!nodeId) {
        console.error("Usage: npx tsx scripts/save-lesson-content.ts <node_id> < content.json");
        process.exit(1);
    }

    // Read JSON from stdin
    let input = "";
    for await (const chunk of process.stdin) {
        input += chunk;
    }

    try {
        const content = JSON.parse(input) as GeneratedContent;
        const result = await saveContent(nodeId, content);
        console.log(`✅ Saved: ${result.contentId} (${result.sectionCount} sections)`);
    } catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
    }
}

main();
