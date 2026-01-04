import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/chapters/all
 * Get all chapters with learning outcomes and skills (for homework scanner prompt)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;

        // Optional filters
        const courseId = searchParams.get("course_id");
        const includeUnpublished = searchParams.get("include_unpublished") === "true";
        const limit = parseInt(searchParams.get("limit") || "500");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Build query for chapters
        let query = supabase
            .from("chapters")
            .select(`
                id,
                title,
                slug,
                description,
                sort_order,
                xp_reward,
                estimated_minutes,
                created_at,
                course:course_id (
                    id,
                    title,
                    slug
                )
            `, { count: "exact" })
            .order("sort_order", { ascending: true })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (courseId) {
            query = query.eq("course_id", courseId);
        }

        const { data: chapters, error, count } = await query;

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch chapters", details: error.message },
                { status: 500 }
            );
        }

        // Enhance chapters with learning outcomes and skills
        // This is mock data - in production, fetch from related tables
        const enhancedChapters = (chapters || []).map((chapter: any) => ({
            ...chapter,
            // These would come from actual chapter content or related tables
            learning_outcomes: extractLearningOutcomes(chapter),
            skills: extractSkills(chapter),
            topics: extractTopics(chapter),
        }));

        return NextResponse.json({
            chapters: enhancedChapters,
            total: count,
            limit,
            offset,
        });
    } catch (error) {
        console.error("GET /api/chapters/all error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Extract learning outcomes from chapter data
 * In production, this would query a learning_outcomes table
 */
function extractLearningOutcomes(chapter: any): string[] {
    // Placeholder - would be populated from actual chapter content
    const baseOutcomes: string[] = [];

    // Extract from description if available
    if (chapter.description) {
        // Simple heuristic: sentences starting with verbs are likely outcomes
        const sentences = chapter.description.split(/[.!?]+/);
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (
                trimmed.length > 10 &&
                /^(Understand|Learn|Build|Create|Implement|Design|Apply|Analyze|Develop)/i.test(
                    trimmed
                )
            ) {
                baseOutcomes.push(trimmed);
            }
        }
    }

    return baseOutcomes;
}

/**
 * Extract skills from chapter data
 * In production, this would query a chapter_skills junction table
 */
function extractSkills(chapter: any): string[] {
    // Placeholder - would be populated from actual skill mappings
    const skills: string[] = [];

    // Extract from title
    const title = chapter.title?.toLowerCase() || "";

    // Common skill patterns
    const skillPatterns: Record<string, string[]> = {
        react: ["react", "component", "hook", "state management"],
        typescript: ["typescript", "type", "interface", "generic"],
        css: ["css", "style", "layout", "responsive", "tailwind"],
        api: ["api", "rest", "fetch", "endpoint", "http"],
        database: ["database", "sql", "query", "supabase", "postgres"],
        authentication: ["auth", "login", "session", "oauth", "jwt"],
        testing: ["test", "jest", "vitest", "e2e", "unit test"],
        performance: ["performance", "optimization", "lazy", "cache"],
    };

    for (const [skill, keywords] of Object.entries(skillPatterns)) {
        if (keywords.some((kw) => title.includes(kw))) {
            skills.push(skill);
        }
    }

    return skills;
}

/**
 * Extract topics from chapter data
 */
function extractTopics(chapter: any): string[] {
    const topics: string[] = [];

    // Extract from title words
    const titleWords = (chapter.title || "")
        .split(/\s+/)
        .filter((w: string) => w.length > 3)
        .map((w: string) => w.toLowerCase());

    // Filter to meaningful topic words
    const stopWords = new Set([
        "the",
        "and",
        "for",
        "with",
        "from",
        "into",
        "your",
        "this",
        "that",
        "will",
        "have",
        "been",
    ]);

    for (const word of titleWords) {
        if (!stopWords.has(word) && word.length > 3) {
            topics.push(word);
        }
    }

    return topics.slice(0, 5); // Limit to 5 topics
}
