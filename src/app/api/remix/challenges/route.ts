// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Types for challenge data
interface ChallengeLocation {
    file: string;
    startLine: number;
    endLine: number;
}

interface ChallengeInput {
    project_id: string;
    type: "bug" | "smell" | "missing_feature" | "security" | "performance";
    severity: "low" | "medium" | "high" | "critical";
    difficulty: "beginner" | "intermediate" | "advanced";
    title: string;
    description: string;
    location: ChallengeLocation;
    code_snippet?: string;
    context_before?: string;
    context_after?: string;
    user_instructions: string;
    expected_output: string;
    hints?: string[];
    related_topic_ids?: string[];
    related_skill_ids?: string[];
    tags?: string[];
    estimated_minutes?: number;
}

/**
 * GET /api/remix/challenges
 * List challenges with filtering
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;

        // Parse query parameters
        const projectId = searchParams.get("project_id");
        const status = searchParams.get("status");
        const type = searchParams.get("type");
        const difficulty = searchParams.get("difficulty");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Build query
        let query = supabase
            .from("remix_challenges")
            .select(`
                *,
                project:remix_projects(id, name, language, framework)
            `, { count: "exact" });

        // Apply filters
        if (projectId) {
            query = query.eq("project_id", projectId);
        }
        if (status) {
            query = query.eq("status", status);
        }
        if (type) {
            query = query.eq("type", type);
        }
        if (difficulty) {
            query = query.eq("difficulty", difficulty);
        }

        // Pagination and ordering
        query = query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch challenges", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            challenges: data,
            total: count,
            limit,
            offset,
        });
    } catch (error) {
        console.error("GET /api/remix/challenges error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/remix/challenges
 * Create new challenge(s) from scanner
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        // Also check for API key in header (for MCP server)
        const apiKey = request.headers.get("x-api-key");

        if (!user && !apiKey) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Handle batch submission
        const challenges: ChallengeInput[] = Array.isArray(body) ? body : [body];

        if (challenges.length === 0) {
            return NextResponse.json(
                { error: "No challenges provided" },
                { status: 400 }
            );
        }

        // Validate required fields
        for (const challenge of challenges) {
            if (!challenge.project_id || !challenge.title || !challenge.description) {
                return NextResponse.json(
                    { error: "Missing required fields: project_id, title, description" },
                    { status: 400 }
                );
            }
            if (!challenge.user_instructions || !challenge.expected_output) {
                return NextResponse.json(
                    { error: "Missing required fields: user_instructions, expected_output" },
                    { status: 400 }
                );
            }
        }

        // Transform challenges for insertion
        const insertData = challenges.map((c) => ({
            project_id: c.project_id,
            type: c.type,
            severity: c.severity,
            difficulty: c.difficulty,
            title: c.title,
            description: c.description,
            location: c.location,
            code_snippet: c.code_snippet,
            context_before: c.context_before,
            context_after: c.context_after,
            user_instructions: c.user_instructions,
            expected_output: c.expected_output,
            hints: c.hints || [],
            related_topic_ids: c.related_topic_ids || [],
            related_skill_ids: c.related_skill_ids || [],
            tags: c.tags || [],
            estimated_minutes: c.estimated_minutes || 30,
            status: "pending" as const,  // All new challenges start as pending
        }));

        // Use admin client for API key auth, regular for user auth
        const insertClient = apiKey ? await createAdminClient() : supabase;

        const { data, error } = await insertClient
            .from("remix_challenges")
            .insert(insertData)
            .select();

        if (error) {
            return NextResponse.json(
                { error: "Failed to create challenges", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            challenges: data,
            count: data.length,
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/remix/challenges error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
