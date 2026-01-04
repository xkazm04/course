// ============================================================================
// Admin: Seed Domain Nodes
// POST /api/admin/seed-domains - Create hardcoded domain nodes in map_nodes
//
// Domains are the top-level (depth 0) categories that Oracle paths attach to.
// These should exist before users can generate learning paths.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Hardcoded domains matching DomainCards.tsx
const DOMAINS = [
    {
        slug: "frontend",
        name: "Frontend",
        description: "Build beautiful, interactive user interfaces with modern web technologies",
        icon: "Monitor",
        color: "#6366f1", // Indigo
        estimated_hours: 500,
        difficulty: "beginner",
    },
    {
        slug: "fullstack",
        name: "Fullstack",
        description: "Master the complete technology stack from UI to database",
        icon: "Layers",
        color: "#a855f7", // Purple
        estimated_hours: 800,
        difficulty: "intermediate",
    },
    {
        slug: "mobile",
        name: "Mobile",
        description: "Create native mobile experiences for iOS and Android",
        icon: "Smartphone",
        color: "#ec4899", // Pink
        estimated_hours: 600,
        difficulty: "intermediate",
    },
    {
        slug: "games",
        name: "Games",
        description: "Design and develop immersive gaming experiences",
        icon: "Gamepad2",
        color: "#f97316", // Orange
        estimated_hours: 700,
        difficulty: "intermediate",
    },
    {
        slug: "backend",
        name: "Backend",
        description: "Build scalable server infrastructure and APIs",
        icon: "Server",
        color: "#10b981", // Emerald
        estimated_hours: 600,
        difficulty: "intermediate",
    },
    {
        slug: "databases",
        name: "Databases",
        description: "Design and optimize data storage systems",
        icon: "Database",
        color: "#06b6d4", // Cyan
        estimated_hours: 400,
        difficulty: "intermediate",
    },
];

export async function POST(request: NextRequest) {
    try {
        const supabase = await createAdminClient();
        const results: Array<{ domain: string; status: string; id?: string; error?: string }> = [];

        for (const domain of DOMAINS) {
            // Check if domain already exists
            const { data: existing } = await supabase
                .from("map_nodes")
                .select("id")
                .eq("slug", domain.slug)
                .eq("depth", 0)
                .single() as { data: { id: string } | null; error: any };

            if (existing) {
                results.push({
                    domain: domain.slug,
                    status: "exists",
                    id: existing.id,
                });
                continue;
            }

            // Create domain node
            const { data: created, error } = await supabase
                .from("map_nodes")
                .insert({
                    slug: domain.slug,
                    name: domain.name,
                    description: domain.description,
                    depth: 0,
                    node_type: "domain",
                    domain_id: domain.slug, // Self-reference for domain
                    parent_id: null,
                    icon: domain.icon,
                    color: domain.color,
                    estimated_hours: domain.estimated_hours,
                    difficulty: domain.difficulty,
                    sort_order: DOMAINS.indexOf(domain) + 1,
                    is_group_node: false,
                    is_ai_generated: false,
                    total_children: 0,
                } as any)
                .select("id")
                .single() as { data: { id: string } | null; error: any };

            if (error) {
                results.push({
                    domain: domain.slug,
                    status: "error",
                    error: error.message,
                });
            } else {
                results.push({
                    domain: domain.slug,
                    status: "created",
                    id: created?.id,
                });
            }
        }

        const created = results.filter(r => r.status === "created").length;
        const existing = results.filter(r => r.status === "exists").length;
        const errors = results.filter(r => r.status === "error").length;

        return NextResponse.json({
            success: errors === 0,
            message: `Domains: ${created} created, ${existing} existing, ${errors} errors`,
            results,
        });

    } catch (error) {
        console.error("Seed domains error:", error);
        return NextResponse.json(
            {
                error: "Failed to seed domains",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
