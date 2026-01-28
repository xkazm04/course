// ============================================================================
// Node Status API
// GET /api/nodes/status - Get generation status for map nodes
//
// This endpoint queries Supabase directly instead of calling external cloud
// functions. It returns the status of content generation for map_nodes.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type NodeGenerationStatus = "pending" | "generating" | "ready" | "failed";

interface NodeStatus {
    status: NodeGenerationStatus;
    course_id?: string;
    chapter_id?: string;
    progress?: number;
    message?: string;
    error?: string;
}

interface NodesStatusResponse {
    nodes: Record<string, NodeStatus>;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const idsParam = searchParams.get("ids");

        if (!idsParam) {
            return NextResponse.json({ nodes: {} });
        }

        const nodeIds = idsParam.split(",").filter(Boolean);
        if (nodeIds.length === 0) {
            return NextResponse.json({ nodes: {} });
        }

        const supabase = await createClient();

        // =====================================================================
        // Step 1: Fetch map_nodes to get course_id references
        // =====================================================================
        const { data: mapNodes, error: mapError } = await supabase
            .from("map_nodes")
            .select("id, course_id, node_type, depth")
            .in("id", nodeIds) as {
                data: Array<{
                    id: string;
                    course_id: string | null;
                    node_type: string;
                    depth: number;
                }> | null;
                error: any;
            };

        if (mapError) {
            console.error("Error fetching map nodes:", mapError);
        }

        const mapNodeById = new Map(
            (mapNodes || []).map(n => [n.id, n])
        );

        // =====================================================================
        // Step 2: Find chapters linked to these map_nodes (via courses)
        // For depth 4 (lesson) nodes, we need to check chapter status
        // =====================================================================

        // Get course IDs from nodes that have course_id
        const courseIds = (mapNodes || [])
            .filter(n => n.course_id)
            .map(n => n.course_id as string);

        // Map course_id -> chapters
        const chaptersByCourse = new Map<string, any[]>();
        let chapters: Array<{
            id: string;
            course_id: string;
            title: string;
            content_status: string | null;
            generated_content: any;
        }> = [];

        // Only query chapters if we have course IDs
        if (courseIds.length > 0) {
            const { data: chaptersData, error: chapterError } = await supabase
                .from("chapters")
                .select("id, course_id, title, content_status, generated_content")
                .in("course_id", courseIds) as {
                    data: typeof chapters | null;
                    error: any;
                };

            if (chapterError) {
                console.error("Error fetching chapters:", chapterError);
            }

            chapters = chaptersData || [];
            chapters.forEach(ch => {
                const list = chaptersByCourse.get(ch.course_id) || [];
                list.push(ch);
                chaptersByCourse.set(ch.course_id, list);
            });
        }

        // =====================================================================
        // Step 3: Check for active content generation jobs
        // =====================================================================
        const chapterIds = chapters.map(ch => ch.id);

        // Map chapter_id -> active job
        const jobByChapter = new Map<string, {
            id: string;
            chapter_id: string;
            status: string;
            progress_percent: number | null;
            progress_message: string | null;
            error_message: string | null;
        }>();

        // Only query jobs if we have chapter IDs
        if (chapterIds.length > 0) {
            const { data: jobs, error: jobsError } = await supabase
                .from("chapter_content_jobs")
                .select("id, chapter_id, status, progress_percent, progress_message, error_message")
                .in("chapter_id", chapterIds)
                .in("status", ["pending", "processing"]) as {
                    data: Array<{
                        id: string;
                        chapter_id: string;
                        status: string;
                        progress_percent: number | null;
                        progress_message: string | null;
                        error_message: string | null;
                    }> | null;
                    error: any;
                };

            if (jobsError) {
                console.error("Error fetching jobs:", jobsError);
            }

            (jobs || []).forEach(j => jobByChapter.set(j.chapter_id, j));
        }

        // =====================================================================
        // Step 4: Build response - determine status for each requested node
        // =====================================================================
        const nodes: Record<string, NodeStatus> = {};

        for (const nodeId of nodeIds) {
            const mapNode = mapNodeById.get(nodeId);

            if (!mapNode) {
                // Node not found - skip
                continue;
            }

            // Default status
            let status: NodeGenerationStatus = "ready";
            let progress: number | undefined;
            let message: string | undefined;
            let error: string | undefined;
            const courseId: string | undefined = mapNode.course_id || undefined;
            let chapterId: string | undefined;

            // For depth 3 (course) nodes - check if all chapters have content
            if (mapNode.depth === 3 && mapNode.course_id) {
                const courseChapters = chaptersByCourse.get(mapNode.course_id) || [];

                if (courseChapters.length === 0) {
                    status = "pending";
                    message = "No chapters created yet";
                } else {
                    const pendingChapters = courseChapters.filter(
                        ch => !ch.generated_content && ch.content_status !== "ready"
                    );
                    const generatingChapters = courseChapters.filter(
                        ch => ch.content_status === "generating" || jobByChapter.has(ch.id)
                    );

                    if (generatingChapters.length > 0) {
                        status = "generating";
                        progress = Math.round(
                            ((courseChapters.length - pendingChapters.length - generatingChapters.length) /
                                courseChapters.length) * 100
                        );
                        message = `Generating ${generatingChapters.length} of ${courseChapters.length} chapters`;
                    } else if (pendingChapters.length > 0) {
                        status = "pending";
                        message = `${pendingChapters.length} chapters pending`;
                    } else {
                        status = "ready";
                    }
                }
            }

            // For depth 4 (lesson/chapter) nodes - we'd need to track them differently
            // This would require storing the map_node_id -> chapter_id mapping
            // For now, depth 4 nodes inherit status from content generation

            nodes[nodeId] = {
                status,
                course_id: courseId,
                chapter_id: chapterId,
                progress,
                message,
                error,
            };
        }

        const response: NodesStatusResponse = { nodes };
        return NextResponse.json(response);

    } catch (error) {
        console.error("Nodes status API error:", error);
        return NextResponse.json(
            { error: "Failed to get node statuses", nodes: {} },
            { status: 500 }
        );
    }
}
