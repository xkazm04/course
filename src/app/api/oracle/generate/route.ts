// ============================================================================
// Oracle Path Generation API
// POST /api/oracle/generate - Generate learning paths using AI
//
// This endpoint:
// 1. Fetches existing map_nodes for context
// 2. Calls external AI (Gemini/OpenAI) with map structure
// 3. Returns paths with proper node references
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

interface GenerateRequest {
    domain: string;
    experience_level: string;
    motivation?: string | string[];
    learning_style?: string | string[];
    concerns?: string | string[];
    goal?: string | string[];
    commitment: string;
    additional_context?: string;
    all_answers?: Record<string, string | string[]>;
}

interface MapNodeRow {
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
}

interface PathNode {
    id: string;                     // Generated ID for tracking
    map_node_id?: string;           // If existing: actual UUID from map_nodes
    slug?: string;                  // If existing: actual slug
    name: string;
    description?: string;
    depth: number;                  // 0-4 matching map_nodes depth
    node_type: string;              // "domain", "topic", "skill", "course", "lesson"
    parent_id: string | null;       // Reference to parent node in this path
    parent_slug?: string;           // Parent map_node slug for new nodes
    difficulty?: string;
    estimated_hours?: number;
    order: number;
    is_existing: boolean;
}

interface GeneratedPath {
    id: string;
    name: string;
    description: string;
    reasoning?: string;
    confidence?: number;
    estimated_weeks?: number;
    nodes: PathNode[];
    color?: string;
}

interface GenerateResponse {
    paths: GeneratedPath[];
    metadata?: {
        model_used?: string;
        tokens_used?: number;
        map_nodes_provided?: number;
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
    return crypto.randomUUID();
}

// Map depth to node_type
function depthToNodeType(depth: number): string {
    const types = ["domain", "topic", "skill", "course", "lesson"];
    return types[depth] || "lesson";
}

// ============================================================================
// API Handler
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body: GenerateRequest = await request.json();
        const { domain, experience_level, commitment } = body;

        if (!domain) {
            return NextResponse.json(
                { error: "domain is required" },
                { status: 400 }
            );
        }

        // =====================================================================
        // Step 1: Fetch existing map_nodes for this domain
        // =====================================================================

        const { data: mapNodes, error: mapError } = await supabase
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
                total_children
            `)
            .eq("domain_id", domain)
            .eq("is_group_node", false)
            .order("depth")
            .order("sort_order") as { data: MapNodeRow[] | null; error: unknown };

        if (mapError) {
            console.error("Error fetching map nodes:", mapError);
        }

        const existingNodes: MapNodeRow[] = mapNodes || [];

        // Build lookup maps
        const nodeBySlug = new Map<string, MapNodeRow>();
        const nodeById = new Map<string, MapNodeRow>();
        existingNodes.forEach(node => {
            nodeBySlug.set(node.slug, node);
            nodeById.set(node.id, node);
        });

        // =====================================================================
        // Step 2: Build context for AI
        // =====================================================================

        const mapContext = existingNodes.map(node => ({
            slug: node.slug,
            name: node.name,
            depth: node.depth,
            type: node.node_type,
            parent: node.parent_id ? nodeById.get(node.parent_id)?.slug : null,
            has_content: !!node.course_id,
        }));

        // =====================================================================
        // Step 3: Call AI to generate paths
        // =====================================================================

        // External Oracle API is REQUIRED for proper path generation
        const externalOracleUrl = process.env.ORACLE_API_URL || process.env.NEXT_PUBLIC_ORACLE_API_URL;

        if (!externalOracleUrl) {
            console.error("[Oracle] ORACLE_API_URL not configured");
            return NextResponse.json(
                {
                    error: "Oracle API not configured",
                    details: "Set ORACLE_API_URL environment variable to enable AI path generation"
                },
                { status: 503 }
            );
        }

        console.log(`[Oracle] Calling external Oracle API at: ${externalOracleUrl}/oracle/generate`);

        // =====================================================================
        // Fetch the existing domain node for this domain
        // Domains are PRE-SEEDED and should NOT be generated by Oracle
        // =====================================================================
        const { data: domainNode, error: domainError } = await supabase
            .from("map_nodes")
            .select("id, slug, name")
            .eq("domain_id", domain)
            .eq("depth", 0)
            .eq("node_type", "domain")
            .single() as { data: { id: string; slug: string; name: string } | null; error: any };

        if (domainError || !domainNode) {
            console.error(`[Oracle] Domain not found: ${domain}`, domainError);
            return NextResponse.json(
                {
                    error: "Domain not found",
                    details: `The domain "${domain}" does not exist. Available domains: frontend, backend, fullstack, mobile, games, databases`
                },
                { status: 404 }
            );
        }

        console.log(`[Oracle] Using existing domain: ${domainNode.name} (${domainNode.id})`);

        // =====================================================================
        // Required 5-level hierarchy specification
        // IMPORTANT: Domain (depth 0) already exists - Oracle generates levels 1-4
        // =====================================================================
        const hierarchySpec = {
            depth_0: {
                type: "domain",
                description: "EXISTING - Do NOT generate. Reference provided domain node.",
                existing_node: {
                    id: domainNode.id,
                    slug: domainNode.slug,
                    name: domainNode.name,
                },
            },
            depth_1: {
                type: "topic",
                description: "Topic area within domain (e.g., React Ecosystem, Next.js, Node.js). Should be a broad learning area.",
                example: "React Ecosystem",
                required: true,
            },
            depth_2: {
                type: "skill",
                description: "Specific skill category (e.g., State Management, Routing, Performance). Groups related courses.",
                example: "State Management",
                required: true,
            },
            depth_3: {
                type: "course",
                description: "A cohesive learning course that creates a course entry. Contains 3-6 lessons.",
                example: "Modern State with Zustand",
                required: true,
                creates_db_entry: "courses",
            },
            depth_4: {
                type: "lesson",
                description: "Individual lesson that creates a chapter with AI-generated content. Should be completable in 30-60 min.",
                example: "Building a Global Store with Zustand",
                required: true,
                creates_db_entry: "chapters",
                ai_content_generated: true,
            },
        };

        // Call external Oracle AI service
        const aiResponse = await fetch(`${externalOracleUrl}/oracle/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...body,
                domain_node: domainNode, // Pass the existing domain node
                map_context: mapContext,
                hierarchy: hierarchySpec,
                required_levels: [1, 2, 3, 4], // Generate levels 1-4 (domain is provided)
                content_generation_level: 4,   // Content generated at lesson level
                instructions: `
CRITICAL REQUIREMENTS:
1. DO NOT generate a domain node (depth 0) - it already exists: "${domainNode.name}"
2. All path nodes MUST have the domain node as their root ancestor
3. You MUST generate ALL 4 levels: topic (1), skill (2), course (3), lesson (4)
4. Each course (depth 3) should have 3-6 lessons (depth 4)
5. Content will be AI-generated ONLY for lesson nodes (depth 4)
6. Set is_existing=true for the domain node reference, is_existing=false for new nodes

STRUCTURE EXAMPLE:
- Frontend (depth 0, EXISTING - reference only)
  └── React Ecosystem (depth 1, topic, NEW)
      └── State Management (depth 2, skill, NEW)
          └── Modern State with Zustand (depth 3, course, NEW)
              ├── Introduction to Zustand (depth 4, lesson, NEW)
              ├── Building a Global Store (depth 4, lesson, NEW)
              └── Async State with Zustand (depth 4, lesson, NEW)
`,
            }),
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text().catch(() => aiResponse.statusText);
            console.error(`[Oracle] External API error: ${aiResponse.status} ${errorText}`);
            return NextResponse.json(
                { error: "Oracle API request failed", details: errorText },
                { status: aiResponse.status }
            );
        }

        const aiData = await aiResponse.json();
        console.log(`[Oracle] External API returned ${aiData.paths?.length || 0} paths`);

        if (!aiData.paths || aiData.paths.length === 0) {
            return NextResponse.json(
                { error: "Oracle returned no paths", details: "The AI could not generate a learning path" },
                { status: 422 }
            );
        }

        // Normalize and validate response, inject domain node if missing
        const generatedPaths: GeneratedPath[] = (aiData.paths || []).map((path: any) => {
            const pathNodes = (path.nodes || []).map((node: any) => {
                const depth = node.depth ?? node.level ?? 0;
                return {
                    ...node,
                    depth,
                    node_type: node.node_type || depthToNodeType(depth),
                };
            });

            // Check if domain node is in the path
            const hasDomainNode = pathNodes.some((n: any) => n.depth === 0);

            // If no domain node, inject the existing one as the first node
            if (!hasDomainNode) {
                const domainPathNode: PathNode = {
                    id: `domain-${domainNode.id}`,
                    map_node_id: domainNode.id,
                    slug: domainNode.slug,
                    name: domainNode.name,
                    depth: 0,
                    node_type: "domain",
                    parent_id: null,
                    is_existing: true,
                    order: 0,
                };
                pathNodes.unshift(domainPathNode);

                // Update parent_id for depth 1 nodes to reference the domain
                pathNodes.forEach((node: any) => {
                    if (node.depth === 1 && !node.parent_id) {
                        node.parent_id = domainPathNode.id;
                    }
                });
            }

            return {
                ...path,
                nodes: pathNodes,
            };
        });

        // =====================================================================
        // Transform paths to ensure proper 5-level structure
        // If external Oracle returns only 3 levels, expand to 5 levels
        // =====================================================================
        const transformedPaths = generatedPaths.map(path => {
            const depths = new Set(path.nodes.map(n => n.depth));
            const maxDepth = Math.max(...path.nodes.map(n => n.depth));
            const hasAllLevels = [0, 1, 2, 3, 4].every(d => depths.has(d));

            // If all 5 levels present, no transformation needed
            if (hasAllLevels) {
                console.log(`[Oracle] Path "${path.name}" has proper 5-level structure`);
                return path;
            }

            console.log(`[Oracle] Path "${path.name}" has only ${depths.size} levels (max depth: ${maxDepth}), transforming...`);

            // Find leaf nodes (nodes with no children)
            const nodeById = new Map(path.nodes.map(n => [n.id, n]));
            const childrenByParent = new Map<string | null, PathNode[]>();
            path.nodes.forEach(n => {
                const parentId = n.parent_id;
                if (!childrenByParent.has(parentId)) {
                    childrenByParent.set(parentId, []);
                }
                childrenByParent.get(parentId)!.push(n);
            });

            const transformedNodes: PathNode[] = [...path.nodes];
            let nodeCounter = 0;

            // Strategy: The deepest existing nodes should become courses (depth 3)
            // and we add lessons (depth 4) under each course
            // Also, shift depths if needed

            // Case 1: Only depths 0, 1, 2 exist (domain, topic, skill)
            // Keep skill at depth 2, add course (depth 3) and lessons (depth 4) under each skill
            if (maxDepth === 2 && !depths.has(3) && !depths.has(4)) {
                console.log(`[Oracle] Transforming: adding course nodes (depth 3) and lessons (depth 4) under skill nodes (depth 2)`);

                // Find all depth 2 nodes (skills)
                const skillNodes = path.nodes.filter(n => n.depth === 2);

                for (const skill of skillNodes) {
                    // Create a course node under this skill
                    const courseId = `${skill.id}-course-${++nodeCounter}`;
                    const courseNode: PathNode = {
                        id: courseId,
                        name: `${skill.name} Course`,
                        description: `Complete course on ${skill.name}`,
                        depth: 3,
                        node_type: "course",
                        parent_id: skill.id,
                        estimated_hours: skill.estimated_hours || 4,
                        order: 1,
                        is_existing: false,
                    };
                    transformedNodes.push(courseNode);

                    // Add 3-5 lesson nodes under this course
                    const lessonCount = Math.min(5, Math.max(3, Math.ceil((skill.estimated_hours || 4) / 1)));
                    for (let i = 0; i < lessonCount; i++) {
                        const lessonId = `${courseId}-lesson-${++nodeCounter}`;
                        const lessonNode: PathNode = {
                            id: lessonId,
                            name: `${skill.name} - Part ${i + 1}`,
                            description: skill.description,
                            depth: 4,
                            node_type: "lesson",
                            parent_id: courseId,
                            estimated_hours: (skill.estimated_hours || 4) / lessonCount,
                            order: i + 1,
                            is_existing: false,
                        };
                        transformedNodes.push(lessonNode);
                    }
                }
            }

            // Case 2: Only depths 0, 1 exist - need to add skill, course, lesson
            if (maxDepth === 1 && !depths.has(2) && !depths.has(3) && !depths.has(4)) {
                console.log(`[Oracle] Transforming: topic nodes (depth 1) → expanding to skill/course/lesson`);

                const topicNodes = path.nodes.filter(n => n.depth === 1);

                for (const topic of topicNodes) {
                    // Create a skill node under this topic
                    const skillId = `${topic.id}-skill-${++nodeCounter}`;
                    const skillNode: PathNode = {
                        id: skillId,
                        name: `${topic.name} Fundamentals`,
                        description: `Core concepts of ${topic.name}`,
                        depth: 2,
                        node_type: "skill",
                        parent_id: topic.id,
                        estimated_hours: topic.estimated_hours || 8,
                        order: 1,
                        is_existing: false,
                    };
                    transformedNodes.push(skillNode);

                    // Create a course node under the skill
                    const courseId = `${skillId}-course-${++nodeCounter}`;
                    const courseNode: PathNode = {
                        id: courseId,
                        name: `${topic.name} Course`,
                        description: `Complete course on ${topic.name}`,
                        depth: 3,
                        node_type: "course",
                        parent_id: skillId,
                        estimated_hours: topic.estimated_hours || 8,
                        order: 1,
                        is_existing: false,
                    };
                    transformedNodes.push(courseNode);

                    // Add lessons under the course
                    const lessonCount = 4;
                    for (let i = 0; i < lessonCount; i++) {
                        const lessonId = `${courseId}-lesson-${++nodeCounter}`;
                        const lessonNode: PathNode = {
                            id: lessonId,
                            name: `${topic.name} - Lesson ${i + 1}`,
                            description: `Part ${i + 1} of ${topic.name}`,
                            depth: 4,
                            node_type: "lesson",
                            parent_id: courseId,
                            estimated_hours: (topic.estimated_hours || 8) / lessonCount,
                            order: i + 1,
                            is_existing: false,
                        };
                        transformedNodes.push(lessonNode);
                    }
                }
            }

            // Log the transformation result
            const newDepths = new Set(transformedNodes.map(n => n.depth));
            const newMaxDepth = Math.max(...transformedNodes.map(n => n.depth));
            console.log(`[Oracle] Transformed path now has ${newDepths.size} levels (depths: ${Array.from(newDepths).sort().join(', ')}), ${transformedNodes.length} nodes`);

            return {
                ...path,
                nodes: transformedNodes,
            };
        });

        // Final validation
        for (const path of transformedPaths) {
            const depths = new Set(path.nodes.map(n => n.depth));
            const hasContentNodes = path.nodes.some(n => n.depth === 4);

            if (!hasContentNodes) {
                console.warn(`[Oracle] WARNING: Path "${path.name}" still missing lesson nodes (depth 4) after transformation`);
            } else {
                const lessonCount = path.nodes.filter(n => n.depth === 4).length;
                console.log(`[Oracle] Path "${path.name}" ready with ${lessonCount} lessons for content generation`);
            }
        }

        // =====================================================================
        // Step 4: Validate and enrich paths with actual map_node references
        // =====================================================================

        const enrichedPaths = transformedPaths.map(path => ({
            ...path,
            nodes: path.nodes.map(node => {
                // Try to match existing node by slug or name
                let existingNode = node.slug ? nodeBySlug.get(node.slug) : null;

                if (!existingNode) {
                    // Try to find by name (case-insensitive)
                    existingNode = existingNodes.find(
                        n => n.name.toLowerCase() === node.name.toLowerCase()
                    );
                }

                if (existingNode) {
                    return {
                        ...node,
                        id: node.id || generateId(),
                        map_node_id: existingNode.id,
                        slug: existingNode.slug,
                        is_existing: true,
                        depth: existingNode.depth,
                        node_type: existingNode.node_type,
                    };
                }

                // New node - ensure it has proper structure
                return {
                    ...node,
                    id: node.id || generateId(),
                    is_existing: false,
                    node_type: node.node_type || depthToNodeType(node.depth),
                };
            }),
        }));

        // =====================================================================
        // Step 5: Return response
        // =====================================================================

        const response: GenerateResponse = {
            paths: enrichedPaths,
            metadata: {
                model_used: externalOracleUrl ? "external" : "fallback",
                map_nodes_provided: existingNodes.length,
            },
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error("Oracle generate error:", error);
        return NextResponse.json(
            { error: "Failed to generate paths", details: String(error) },
            { status: 500 }
        );
    }
}

// ============================================================================
// Note: Fallback generation removed - External Oracle API is required
// The external Oracle API must return paths with proper 5-level hierarchy:
//   depth 0: domain   - Top-level learning domain
//   depth 1: topic    - Topic area within domain
//   depth 2: skill    - Specific skill to learn
//   depth 3: course   - Cohesive learning course (creates courses table entry)
//   depth 4: lesson   - Individual lesson (creates chapter with AI content)
// ============================================================================
