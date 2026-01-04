// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

const GITHUB_API_BASE = "https://api.github.com";

interface GitHubPR {
    number: number;
    html_url: string;
    title: string;
    state: string;
    draft: boolean;
    merged_at: string | null;
    created_at: string;
    updated_at: string;
    additions: number;
    deletions: number;
    commits: number;
    mergeable: boolean | null;
    mergeable_state: string;
}

/**
 * GET /api/projects/homework/[id]/pr-status
 * Check PR status from GitHub for an assignment
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: assignmentId } = await params;
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Fetch assignment with repo info
        const { data: assignment, error: assignError } = await supabase
            .from("project_homework_assignments")
            .select(`
                id,
                branch_name,
                pr_url,
                pr_number,
                pr_status,
                status,
                homework_definition:homework_definition_id (
                    feature:feature_id (
                        repo:repo_id (
                            owner,
                            name,
                            default_branch
                        )
                    )
                )
            `)
            .eq("id", assignmentId)
            .eq("user_id", user.id)
            .single();

        if (assignError || !assignment) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            );
        }

        const repo = (assignment.homework_definition as any)?.feature?.repo;
        if (!repo) {
            return NextResponse.json(
                { error: "Repository info not found" },
                { status: 404 }
            );
        }

        const branchName = assignment.branch_name;
        if (!branchName) {
            return NextResponse.json({
                pr_found: false,
                message: "No branch assigned",
                assignment_status: assignment.status,
            });
        }

        // Search for PR with matching branch
        // Using public API (no auth) - works for public repos
        // For private repos, would need GITHUB_TOKEN from env or user
        const searchUrl = `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.name}/pulls?head=${repo.owner}:${branchName}&state=all`;

        const headers: HeadersInit = {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Course-Platform",
        };

        // Add token if available
        const githubToken = process.env.GITHUB_TOKEN;
        if (githubToken) {
            headers.Authorization = `Bearer ${githubToken}`;
        }

        const searchResponse = await fetch(searchUrl, { headers });

        if (!searchResponse.ok) {
            console.error("GitHub API error:", await searchResponse.text());
            return NextResponse.json({
                pr_found: false,
                message: "Unable to check GitHub API",
                github_error: searchResponse.status,
                assignment_status: assignment.status,
            });
        }

        const prs: GitHubPR[] = await searchResponse.json();

        if (prs.length === 0) {
            return NextResponse.json({
                pr_found: false,
                expected_branch: branchName,
                repo_url: `https://github.com/${repo.owner}/${repo.name}`,
                instructions: `Create a PR from branch "${branchName}" to "${repo.default_branch}"`,
                assignment_status: assignment.status,
            });
        }

        // Found PR - get the most recent one
        const pr = prs[0];

        // Determine PR status for our system
        let prStatus: string;
        if (pr.merged_at) {
            prStatus = "approved";
        } else if (pr.state === "closed") {
            prStatus = "closed";
        } else if (pr.draft) {
            prStatus = "pending";
        } else {
            prStatus = "submitted";
        }

        // Update assignment with PR info
        const updateData: Record<string, any> = {
            pr_url: pr.html_url,
            pr_number: pr.number,
            pr_status: prStatus,
            pr_created_at: pr.created_at,
            pr_updated_at: pr.updated_at,
        };

        // Also update assignment status if appropriate
        if (assignment.status === "assigned") {
            updateData.status = "in_progress";
            updateData.started_at = new Date().toISOString();
        }

        await supabase
            .from("project_homework_assignments")
            .update(updateData)
            .eq("id", assignmentId);

        return NextResponse.json({
            pr_found: true,
            pr: {
                number: pr.number,
                url: pr.html_url,
                title: pr.title,
                state: pr.state,
                draft: pr.draft,
                merged: !!pr.merged_at,
                created_at: pr.created_at,
                updated_at: pr.updated_at,
                additions: pr.additions,
                deletions: pr.deletions,
                commits: pr.commits,
                mergeable: pr.mergeable,
                mergeable_state: pr.mergeable_state,
            },
            pr_status: prStatus,
            assignment_status: updateData.status || assignment.status,
        });
    } catch (error) {
        console.error("GET /api/projects/homework/[id]/pr-status error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/projects/homework/[id]/pr-status
 * Force refresh PR status (same as GET but explicit refresh action)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    // Same logic as GET - just a semantic difference for "refresh" action
    return GET(request, { params });
}
