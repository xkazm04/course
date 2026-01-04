// ============================================================================
// Map Nodes Context API
// GET /api/map-nodes/context - Get map structure for Oracle context
//
// Provides the existing map_nodes hierarchy to the Oracle AI so it can
// reference existing nodes and suggest new ones that fit the structure.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

export interface MapNodeContext {
    id: string;
    slug: string;
    name: string;
    depth: number;
    node_type: string;
    parent_id: string | null;
    parent_slug: string | null;
    domain_id: string | null;
    description: string | null;
    estimated_hours: number | null;
    difficulty: string | null;
    has_course: boolean;        // Has linked course content
    has_children: boolean;      // Has child nodes
    child_count: number;
}

export interface MapContextResponse {
    domain: string;
    nodes: MapNodeContext[];
    hierarchy: {
        depth_0: string;  // "domain"
        depth_1: string;  // "topic"
        depth_2: string;  // "skill"
        depth_3: string;  // "course"
        depth_4: string;  // "lesson"
    };
    total_nodes: number;
}

// ============================================================================
// API Handler
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        const domain = searchParams.get("domain");
        const maxDepth = parseInt(searchParams.get("max_depth") || "4");
        const includeEmpty = searchParams.get("include_empty") === "true";

        // Build query
        let query = supabase
            .from("map_nodes")
            .select(`
                id,
                slug,
                name,
                depth,
                node_type,
                parent_id,
                domain_id,
                description,
                estimated_hours,
                difficulty,
                course_id,
                total_children,
                is_group_node
            `)
            .lte("depth", maxDepth)
            .eq("is_group_node", false)  // Exclude group nodes
            .order("depth", { ascending: true })
            .order("sort_order", { ascending: true });

        // Filter by domain if specified
        if (domain) {
            query = query.eq("domain_id", domain);
        }

        const { data: nodes, error } = await query as {
            data: Array<{
                id: string;
                slug: string;
                name: string;
                depth: number;
                node_type: string;
                parent_id: string | null;
                domain_id: string;
                description: string | null;
                estimated_hours: number | null;
                difficulty: string | null;
                course_id: string | null;
                total_children: number;
                is_group_node: boolean;
            }> | null;
            error: any;
        };

        if (error) {
            console.error("Error fetching map nodes:", error);
            return NextResponse.json(
                { error: "Failed to fetch map nodes" },
                { status: 500 }
            );
        }

        // Build parent slug lookup
        const nodeById = new Map<string, any>();
        nodes?.forEach(node => nodeById.set(node.id, node));

        // Transform to context format
        const contextNodes: MapNodeContext[] = (nodes || [])
            .filter(node => includeEmpty || node.total_children > 0 || node.depth >= 2)
            .map(node => ({
                id: node.id,
                slug: node.slug,
                name: node.name,
                depth: node.depth,
                node_type: node.node_type,
                parent_id: node.parent_id,
                parent_slug: node.parent_id ? nodeById.get(node.parent_id)?.slug || null : null,
                domain_id: node.domain_id,
                description: node.description,
                estimated_hours: node.estimated_hours,
                difficulty: node.difficulty,
                has_course: !!node.course_id,
                has_children: node.total_children > 0,
                child_count: node.total_children,
            }));

        const response: MapContextResponse = {
            domain: domain || "all",
            nodes: contextNodes,
            hierarchy: {
                depth_0: "domain",
                depth_1: "topic",
                depth_2: "skill",
                depth_3: "course",
                depth_4: "lesson",
            },
            total_nodes: contextNodes.length,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Map context API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
