// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface ProjectInput {
    name: string;
    source_url?: string;
    language: string;
    framework?: string;
    tech_stack?: string[];
    readme_content?: string;
    package_json?: Record<string, unknown>;
    file_count?: number;
    total_lines?: number;
}

interface ScanInput {
    project: ProjectInput;
    scanner_version?: string;
    files_scanned?: number;
    scan_output?: Record<string, unknown>;
}

/**
 * GET /api/remix/scans
 * List scan sessions
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;

        const projectId = searchParams.get("project_id");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        let query = supabase
            .from("remix_scans")
            .select(`
                *,
                project:remix_projects(id, name, language)
            `, { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (projectId) {
            query = query.eq("project_id", projectId);
        }

        const { data, error, count } = await query;

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch scans", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            scans: data,
            total: count,
            limit,
            offset,
        });
    } catch (error) {
        console.error("GET /api/remix/scans error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/remix/scans
 * Start a new scan session (creates project if needed)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        const apiKey = request.headers.get("x-api-key");

        if (!user && !apiKey) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body: ScanInput = await request.json();

        if (!body.project?.name || !body.project?.language) {
            return NextResponse.json(
                { error: "Missing required fields: project.name, project.language" },
                { status: 400 }
            );
        }

        // Use admin client for API key auth
        const client = apiKey ? await createAdminClient() : supabase;

        // Create or find project
        const { data: existingProject } = await client
            .from("remix_projects")
            .select("id")
            .eq("name", body.project.name)
            .eq("source_url", body.project.source_url || "")
            .single();

        let projectId: string;

        if (existingProject) {
            projectId = existingProject.id;
        } else {
            // Create new project
            const { data: newProject, error: projectError } = await client
                .from("remix_projects")
                .insert({
                    name: body.project.name,
                    source_url: body.project.source_url,
                    language: body.project.language,
                    framework: body.project.framework,
                    tech_stack: body.project.tech_stack || [],
                    readme_content: body.project.readme_content,
                    package_json: body.project.package_json,
                    file_count: body.project.file_count || 0,
                    total_lines: body.project.total_lines || 0,
                    scanned_by: user?.id,
                })
                .select()
                .single();

            if (projectError) {
                return NextResponse.json(
                    { error: "Failed to create project", details: projectError.message },
                    { status: 500 }
                );
            }

            projectId = newProject.id;
        }

        // Create scan record
        const { data: scan, error: scanError } = await client
            .from("remix_scans")
            .insert({
                project_id: projectId,
                scanned_by: user?.id,
                scanner_version: body.scanner_version || "1.0.0",
                files_scanned: body.files_scanned || 0,
                scan_output: body.scan_output,
            })
            .select()
            .single();

        if (scanError) {
            return NextResponse.json(
                { error: "Failed to create scan", details: scanError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            scan,
            project_id: projectId,
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/remix/scans error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
