// ============================================================================
// Lesson Content API
// GET /api/lessons/[nodeId] - Fetch lesson content by node ID or slug
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

interface RouteParams {
    params: Promise<{ nodeId: string }>;
}

// Types for database tables (not yet in generated types)
interface MapNode {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    depth: number;
    parent_id: string | null;
    domain_id: string;
    icon: string | null;
    color: string | null;
    estimated_hours: number | null;
    difficulty: string | null;
}

interface LessonContent {
    id: string;
    node_id: string;
    version: number;
    status: string;
    introduction: string | null;
    content_markdown: string;
    metadata: Record<string, unknown>;
    is_ai_generated: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

interface LessonSection {
    id: string;
    lesson_content_id: string;
    sort_order: number;
    title: string;
    section_type: string;
    duration_minutes: number | null;
    content_markdown: string;
    code_snippet: string | null;
    code_language: string | null;
    key_points: string[] | null;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { nodeId } = await params;
        const supabase = await createClient();

        // Check if nodeId is a UUID or a slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nodeId);

        // First, get the map_node to get full node info
        let nodeQuery = supabase
            .from("map_nodes")
            .select("id, slug, name, description, depth, parent_id, domain_id, icon, color, estimated_hours, difficulty");

        if (isUUID) {
            nodeQuery = nodeQuery.eq("id", nodeId);
        } else {
            nodeQuery = nodeQuery.eq("slug", nodeId);
        }

        const { data: node, error: nodeError } = await nodeQuery.single() as { data: MapNode | null; error: any };

        if (nodeError || !node) {
            return NextResponse.json(
                { error: "Lesson node not found", details: nodeError?.message },
                { status: 404 }
            );
        }

        // Get lesson content
        const { data: content, error: contentError } = await supabase
            .from("lesson_content")
            .select("*")
            .eq("node_id", node.id)
            .eq("status", "published")
            .order("version", { ascending: false })
            .limit(1)
            .single() as { data: LessonContent | null; error: any };

        if (contentError || !content) {
            return NextResponse.json(
                { error: "Lesson content not found", details: contentError?.message },
                { status: 404 }
            );
        }

        // Get lesson sections
        const { data: sections, error: sectionsError } = await supabase
            .from("lesson_sections")
            .select("*")
            .eq("lesson_content_id", content.id)
            .order("sort_order", { ascending: true }) as { data: LessonSection[] | null; error: any };

        if (sectionsError) {
            console.error("Error fetching sections:", sectionsError);
        }

        // Get breadcrumbs (parent hierarchy)
        const breadcrumbs = await getBreadcrumbs(supabase, node.parent_id, node.domain_id);

        // Get sibling lessons for navigation
        const siblings = await getSiblingLessons(supabase, node.parent_id, node.id);

        // Build full lesson response
        const fullLesson = {
            content: {
                id: content.id,
                node_id: content.node_id,
                version: content.version,
                status: content.status,
                introduction: content.introduction,
                content_markdown: content.content_markdown,
                metadata: content.metadata || {},
                is_ai_generated: content.is_ai_generated,
                published_at: content.published_at,
                created_at: content.created_at,
                updated_at: content.updated_at,
            },
            sections: (sections || []).map((s: LessonSection) => ({
                id: s.id,
                sort_order: s.sort_order,
                title: s.title,
                section_type: s.section_type,
                duration_minutes: s.duration_minutes,
                content_markdown: s.content_markdown,
                code_snippet: s.code_snippet,
                code_language: s.code_language,
                key_points: s.key_points,
            })),
            node: {
                id: node.id,
                slug: node.slug,
                name: node.name,
                description: node.description,
                depth: node.depth,
                parent_id: node.parent_id,
                domain_id: node.domain_id,
                icon: node.icon,
                color: node.color,
                estimated_hours: node.estimated_hours,
                difficulty: node.difficulty,
            },
            breadcrumbs,
            navigation: siblings,
        };

        return NextResponse.json(fullLesson);
    } catch (error) {
        console.error("Lesson API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch lesson", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

// Helper to get breadcrumb hierarchy
async function getBreadcrumbs(
    supabase: SupabaseClient,
    parentId: string | null,
    domainId: string
): Promise<{ domain: string; topic: string; skill: string; area: string }> {
    const breadcrumbs = {
        domain: "",
        topic: "",
        skill: "",
        area: "",
    };

    if (!parentId) return breadcrumbs;

    try {
        // Get area (parent of lesson, depth 3)
        const { data: area } = await supabase
            .from("map_nodes")
            .select("id, name, parent_id")
            .eq("id", parentId)
            .single();

        if (area) {
            breadcrumbs.area = area.name;

            // Get skill (parent of area, depth 2)
            if (area.parent_id) {
                const { data: skill } = await supabase
                    .from("map_nodes")
                    .select("id, name, parent_id")
                    .eq("id", area.parent_id)
                    .single();

                if (skill) {
                    breadcrumbs.skill = skill.name;

                    // Get topic (parent of skill, depth 1)
                    if (skill.parent_id) {
                        const { data: topic } = await supabase
                            .from("map_nodes")
                            .select("id, name, parent_id")
                            .eq("id", skill.parent_id)
                            .single();

                        if (topic) {
                            breadcrumbs.topic = topic.name;
                        }
                    }
                }
            }
        }

        // Get domain name
        const { data: domain } = await supabase
            .from("map_nodes")
            .select("name")
            .eq("slug", domainId)
            .eq("depth", 0)
            .single();

        if (domain) {
            breadcrumbs.domain = domain.name;
        }
    } catch (error) {
        console.error("Error fetching breadcrumbs:", error);
    }

    return breadcrumbs;
}

// Helper to get sibling lessons for navigation
async function getSiblingLessons(
    supabase: SupabaseClient,
    parentId: string | null,
    currentId: string
): Promise<{ prev: { id: string; name: string; slug: string } | null; next: { id: string; name: string; slug: string } | null }> {
    if (!parentId) {
        return { prev: null, next: null };
    }

    try {
        // Get all sibling lessons (same parent, depth 4)
        const { data: siblings } = await supabase
            .from("map_nodes")
            .select("id, name, slug, sort_order")
            .eq("parent_id", parentId)
            .eq("depth", 4)
            .order("sort_order", { ascending: true });

        if (!siblings || siblings.length === 0) {
            return { prev: null, next: null };
        }

        // Find current index
        const currentIndex = siblings.findIndex((s) => s.id === currentId);
        if (currentIndex === -1) {
            return { prev: null, next: null };
        }

        // Get prev and next (only if they have published content)
        const prev = currentIndex > 0 ? siblings[currentIndex - 1] : null;
        const next = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

        return {
            prev: prev ? { id: prev.id, name: prev.name, slug: prev.slug } : null,
            next: next ? { id: next.id, name: next.name, slug: next.slug } : null,
        };
    } catch (error) {
        console.error("Error fetching sibling lessons:", error);
        return { prev: null, next: null };
    }
}
