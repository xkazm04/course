// ============================================================================
// Admin: Full Reset API
// GET /api/admin/reset - Clears all map data, seeds domains, clears client cache
//
// This is a comprehensive reset endpoint for testing/development
// ============================================================================

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Hardcoded domains matching DomainCards.tsx
const DOMAINS = [
    {
        slug: "frontend",
        name: "Frontend",
        description: "Build beautiful, interactive user interfaces with modern web technologies",
        icon: "Monitor",
        color: "#6366f1",
        estimated_hours: 500,
        difficulty: "beginner",
    },
    {
        slug: "fullstack",
        name: "Fullstack",
        description: "Master the complete technology stack from UI to database",
        icon: "Layers",
        color: "#a855f7",
        estimated_hours: 800,
        difficulty: "intermediate",
    },
    {
        slug: "mobile",
        name: "Mobile",
        description: "Create native mobile experiences for iOS and Android",
        icon: "Smartphone",
        color: "#ec4899",
        estimated_hours: 600,
        difficulty: "intermediate",
    },
    {
        slug: "games",
        name: "Games",
        description: "Design and develop immersive gaming experiences",
        icon: "Gamepad2",
        color: "#f97316",
        estimated_hours: 700,
        difficulty: "intermediate",
    },
    {
        slug: "backend",
        name: "Backend",
        description: "Build scalable server infrastructure and APIs",
        icon: "Server",
        color: "#10b981",
        estimated_hours: 600,
        difficulty: "intermediate",
    },
    {
        slug: "databases",
        name: "Databases",
        description: "Design and optimize data storage systems",
        icon: "Database",
        color: "#06b6d4",
        estimated_hours: 400,
        difficulty: "intermediate",
    },
];

export async function GET() {
    const results: string[] = [];

    try {
        const supabase = await createAdminClient();

        // =====================================================================
        // Step 1: Delete all map-related data (order matters for FK constraints)
        // =====================================================================
        results.push("=== CLEARING DATABASE ===");

        const tables = [
            "chapter_content_jobs",
            "user_map_progress",
            "learning_path_enrollments",
            "learning_path_courses",
            "learning_paths",
            "chapters",
            "courses",
            "map_node_connections",
            "map_nodes",
        ];

        for (const table of tables) {
            const { error } = await supabase
                .from(table)
                .delete()
                .neq("id", "00000000-0000-0000-0000-000000000000");

            if (error) {
                results.push(`  ${table}: ERROR - ${error.message}`);
            } else {
                results.push(`  ${table}: Cleared`);
            }
        }

        // =====================================================================
        // Step 2: Seed domain nodes
        // =====================================================================
        results.push("");
        results.push("=== SEEDING DOMAINS ===");

        for (let i = 0; i < DOMAINS.length; i++) {
            const domain = DOMAINS[i];

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
                    sort_order: i + 1,
                    is_group_node: false,
                    is_ai_generated: false,
                    total_children: 0,
                } as any)
                .select("id")
                .single() as { data: { id: string } | null; error: any };

            if (error) {
                results.push(`  ${domain.slug}: ERROR - ${error.message}`);
            } else {
                results.push(`  ${domain.slug}: Created (${created?.id})`);
            }
        }

        // =====================================================================
        // Step 3: Verify domains
        // =====================================================================
        results.push("");
        results.push("=== VERIFICATION ===");

        const { data: verifyDomains, error: verifyError } = await supabase
            .from("map_nodes")
            .select("slug, name, domain_id")
            .eq("depth", 0)
            .eq("node_type", "domain") as { data: any[] | null; error: any };

        if (verifyError) {
            results.push(`  Verification failed: ${verifyError.message}`);
        } else {
            results.push(`  Found ${verifyDomains?.length || 0} domains in database:`);
            verifyDomains?.forEach(d => {
                results.push(`    - ${d.name} (slug: ${d.slug}, domain_id: ${d.domain_id})`);
            });
        }

        // =====================================================================
        // Step 4: Return HTML page that clears localStorage
        // =====================================================================
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Forge Reset Complete</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 40px;
            background: #1a1a2e;
            color: #e0e0e0;
            line-height: 1.6;
        }
        h1 { color: #f97316; margin-bottom: 20px; }
        pre {
            background: #0d0d1a;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid #333;
        }
        .success { color: #10b981; }
        .error { color: #ef4444; }
        a {
            color: #f97316;
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
        .actions {
            margin-top: 30px;
            display: flex;
            gap: 15px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #f97316;
            color: white;
            border-radius: 8px;
            font-weight: 500;
        }
        .btn:hover { background: #ea580c; }
    </style>
</head>
<body>
    <h1>Forge Reset Complete</h1>

    <h2>Database Operations:</h2>
    <pre>${results.join("\n")}</pre>

    <h2>Client Cache:</h2>
    <p id="cache-status">Clearing localStorage...</p>

    <div class="actions">
        <a href="/forge" class="btn">Go to Forge</a>
        <a href="/forge/map" class="btn">Go to Map</a>
    </div>

    <script>
        try {
            // Clear all forge-related localStorage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('forge-') || key.includes('oracle') || key.includes('path'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            document.getElementById('cache-status').innerHTML =
                '<span class="success">✓ Cleared ' + keysToRemove.length + ' localStorage keys</span>';
        } catch (e) {
            document.getElementById('cache-status').innerHTML =
                '<span class="error">✗ Error clearing cache: ' + e.message + '</span>';
        }
    </script>
</body>
</html>
        `;

        return new NextResponse(html, {
            headers: { "Content-Type": "text/html" },
        });

    } catch (error) {
        console.error("Reset error:", error);
        return NextResponse.json(
            {
                error: "Reset failed",
                details: error instanceof Error ? error.message : "Unknown error",
                results,
            },
            { status: 500 }
        );
    }
}
