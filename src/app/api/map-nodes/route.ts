// ============================================================================
// Map Nodes API
// GET /api/map-nodes - Fetch map nodes from database
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface MapNodeRow {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    parent_id: string | null;
    domain_id: string | null;
    depth: number;
    sort_order: number;
    node_type: string;
    is_group_node: boolean;
    icon: string | null;
    color: string | null;
    estimated_hours: number | null;
    difficulty: string | null;
    course_id: string | null;
    total_children: number;
    is_ai_generated: boolean;
    created_at: string;
}

interface UserProgressRow {
    node_id: string;
    status: string;
    progress_percent: number;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;

        // Query parameters
        const domainId = searchParams.get("domain");
        const includeProgress = searchParams.get("progress") === "true";
        const parentId = searchParams.get("parent_id");
        const maxDepth = parseInt(searchParams.get("max_depth") || "5", 10);

        // Check if user is authenticated (for progress)
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Build query for map nodes
        let query = supabase
            .from("map_nodes")
            .select(`
                id,
                slug,
                name,
                description,
                parent_id,
                domain_id,
                depth,
                sort_order,
                node_type,
                is_group_node,
                icon,
                color,
                estimated_hours,
                difficulty,
                course_id,
                total_children,
                is_ai_generated,
                created_at
            `)
            .lte("depth", maxDepth)
            .order("depth", { ascending: true })
            .order("sort_order", { ascending: true });

        // Filter by domain if specified
        if (domainId) {
            query = query.eq("domain_id", domainId);
        }

        // Filter by parent if specified
        if (parentId) {
            query = query.eq("parent_id", parentId);
        }

        const { data: nodes, error: nodesError } = await query as {
            data: MapNodeRow[] | null;
            error: any;
        };

        if (nodesError) {
            console.error("Error fetching map nodes:", nodesError);
            return NextResponse.json(
                { error: "Failed to fetch map nodes" },
                { status: 500 }
            );
        }

        // Fetch user progress if requested and user is authenticated
        let progressMap: Record<string, UserProgressRow> = {};
        if (includeProgress && user && nodes && nodes.length > 0) {
            const nodeIds = nodes.map((n) => n.id);

            const { data: progress } = await supabase
                .from("user_map_progress")
                .select("node_id, status, progress_percent")
                .eq("user_id", user.id)
                .in("node_id", nodeIds) as {
                    data: UserProgressRow[] | null;
                    error: any;
                };

            if (progress) {
                progressMap = Object.fromEntries(
                    progress.map((p) => [p.node_id, p])
                );
            }
        }

        // Build child ID maps for hierarchy
        const childrenMap: Record<string, string[]> = {};
        const rootNodeIds: string[] = [];

        for (const node of nodes || []) {
            if (node.parent_id) {
                if (!childrenMap[node.parent_id]) {
                    childrenMap[node.parent_id] = [];
                }
                childrenMap[node.parent_id].push(node.id);
            } else {
                rootNodeIds.push(node.id);
            }
        }

        // Transform nodes to frontend format
        const transformedNodes: Record<string, any> = {};

        for (const node of nodes || []) {
            const progress = progressMap[node.id];
            const childIds = childrenMap[node.id] || [];

            // Determine status
            let status = "available";
            let progressPercent = 0;

            if (progress) {
                status = progress.status;
                progressPercent = progress.progress_percent;
            } else {
                // Default status logic based on depth
                // Root nodes are available, deeper nodes depend on parent
                if (node.depth > 0 && node.parent_id) {
                    const parentProgress = progressMap[node.parent_id];
                    if (!parentProgress || parentProgress.status === "locked") {
                        status = "locked";
                    }
                }
            }

            // Map node_type to level for frontend compatibility
            const levelMap: Record<string, string> = {
                domain: "domain",
                topic: "course",
                skill: "chapter",
                course: "section",
                lesson: "concept",
                group: "domain",
            };

            transformedNodes[node.id] = {
                id: node.id,
                slug: node.slug,
                name: node.name,
                description: node.description || "",
                level: levelMap[node.node_type] || "concept",
                nodeType: node.node_type,
                status,
                progress: progressPercent,
                parentId: node.parent_id,
                childIds,
                domainId: node.domain_id || "unknown",
                color: node.domain_id || "frontend",
                depth: node.depth,
                sortOrder: node.sort_order,
                estimatedHours: node.estimated_hours,
                difficulty: node.difficulty,
                courseId: node.course_id,
                isGroupNode: node.is_group_node,
                isAiGenerated: node.is_ai_generated,
                icon: node.icon,
                totalChildren: node.total_children || childIds.length,
            };
        }

        // Fetch connections if needed
        const { data: connections } = await supabase
            .from("map_node_connections")
            .select("id, from_node_id, to_node_id, connection_type, label, weight")
            .in("from_node_id", nodes?.map((n) => n.id) || []) as {
                data: any[] | null;
                error: any;
            };

        const transformedConnections = (connections || []).map((c) => ({
            id: c.id,
            fromId: c.from_node_id,
            toId: c.to_node_id,
            type: c.connection_type,
            label: c.label,
            weight: c.weight,
        }));

        return NextResponse.json({
            nodes: transformedNodes,
            connections: transformedConnections,
            rootNodeIds,
            totalCount: nodes?.length || 0,
            domainId,
        });
    } catch (error) {
        console.error("Map nodes API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
