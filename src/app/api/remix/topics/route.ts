import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/remix/topics
 * Get topics relevant to a detected tech stack
 *
 * Query params:
 * - stack: comma-separated list of technologies (e.g., "react,typescript,nextjs")
 * - language: primary language (e.g., "typescript")
 * - framework: detected framework (e.g., "nextjs")
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;

        const stack = searchParams.get("stack")?.split(",").map(s => s.trim().toLowerCase()) || [];
        const language = searchParams.get("language")?.toLowerCase();
        const framework = searchParams.get("framework")?.toLowerCase();

        // Build search terms
        const searchTerms = [...stack];
        if (language) searchTerms.push(language);
        if (framework) searchTerms.push(framework);

        if (searchTerms.length === 0) {
            return NextResponse.json(
                { error: "At least one of: stack, language, or framework is required" },
                { status: 400 }
            );
        }

        // Search topics by name matching
        // Using ILIKE for case-insensitive matching
        const { data: topics, error: topicsError } = await supabase
            .from("topics")
            .select(`
                id,
                slug,
                name,
                description,
                subcategory:subcategories(
                    id,
                    name,
                    category:categories(id, name)
                )
            `)
            .or(searchTerms.map(term => `name.ilike.%${term}%`).join(","))
            .limit(20);

        if (topicsError) {
            return NextResponse.json(
                { error: "Failed to fetch topics", details: topicsError.message },
                { status: 500 }
            );
        }

        // Also search skills
        const { data: skills, error: skillsError } = await supabase
            .from("skills")
            .select("id, slug, name, description, category")
            .or(searchTerms.map(term => `name.ilike.%${term}%`).join(","))
            .limit(20);

        if (skillsError) {
            return NextResponse.json(
                { error: "Failed to fetch skills", details: skillsError.message },
                { status: 500 }
            );
        }

        // Build tech stack mapping
        const stackMapping = buildStackMapping(searchTerms, topics || [], skills || []);

        return NextResponse.json({
            topics: topics || [],
            skills: skills || [],
            stackMapping,
            searchTerms,
        });
    } catch (error) {
        console.error("GET /api/remix/topics error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Build a mapping from detected tech to platform topics/skills
 */
function buildStackMapping(
    searchTerms: string[],
    topics: Array<{ id: string; name: string }>,
    skills: Array<{ id: string; name: string }>
): Record<string, { topicIds: string[]; skillIds: string[] }> {
    const mapping: Record<string, { topicIds: string[]; skillIds: string[] }> = {};

    for (const term of searchTerms) {
        const matchedTopics = topics
            .filter(t => t.name.toLowerCase().includes(term))
            .map(t => t.id);

        const matchedSkills = skills
            .filter(s => s.name.toLowerCase().includes(term))
            .map(s => s.id);

        if (matchedTopics.length > 0 || matchedSkills.length > 0) {
            mapping[term] = {
                topicIds: matchedTopics,
                skillIds: matchedSkills,
            };
        }
    }

    return mapping;
}

/**
 * POST /api/remix/topics/suggest
 * Get topic suggestions based on challenge content
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { title, description, code_snippet, tags } = body;

        if (!title && !description && !tags?.length) {
            return NextResponse.json(
                { error: "At least one of: title, description, or tags is required" },
                { status: 400 }
            );
        }

        // Extract keywords from content
        const keywords = extractKeywords(title, description, code_snippet, tags);

        // Search topics and skills by keywords
        const { data: topics } = await supabase
            .from("topics")
            .select("id, slug, name")
            .or(keywords.map(k => `name.ilike.%${k}%`).join(","))
            .limit(10);

        const { data: skills } = await supabase
            .from("skills")
            .select("id, slug, name")
            .or(keywords.map(k => `name.ilike.%${k}%`).join(","))
            .limit(10);

        return NextResponse.json({
            suggestedTopics: topics || [],
            suggestedSkills: skills || [],
            extractedKeywords: keywords,
        });
    } catch (error) {
        console.error("POST /api/remix/topics error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Extract relevant keywords from challenge content
 */
function extractKeywords(
    title?: string,
    description?: string,
    codeSnippet?: string,
    tags?: string[]
): string[] {
    const keywords = new Set<string>();

    // Add tags directly
    if (tags) {
        tags.forEach(tag => keywords.add(tag.toLowerCase()));
    }

    // Common tech terms to look for
    const techTerms = [
        "react", "vue", "angular", "svelte", "next", "nuxt",
        "node", "express", "fastify", "nest",
        "typescript", "javascript", "python", "rust", "go",
        "sql", "postgres", "mysql", "mongodb", "redis",
        "graphql", "rest", "api", "auth", "jwt",
        "css", "tailwind", "sass", "styled",
        "test", "jest", "vitest", "cypress",
        "docker", "kubernetes", "aws", "vercel",
    ];

    const content = `${title || ""} ${description || ""} ${codeSnippet || ""}`.toLowerCase();

    for (const term of techTerms) {
        if (content.includes(term)) {
            keywords.add(term);
        }
    }

    return Array.from(keywords).slice(0, 15);
}
