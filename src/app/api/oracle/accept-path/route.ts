// ============================================================================
// Oracle Path Acceptance API
// POST /api/oracle/accept-path - Accept an Oracle path and create nodes
//
// This API:
// 1. Validates path nodes against existing map_nodes
// 2. Creates new map_nodes for suggested nodes
// 3. Creates courses/chapters as needed and links to map_nodes
// 4. Creates learning path and enrollment
// 5. Queues content generation for new nodes
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

interface PathNode {
    id: string;                     // Tracking ID from Oracle
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

interface OraclePath {
    id?: string;
    name: string;
    description?: string;
    nodes: PathNode[];
    estimated_weeks?: number;
    reasoning?: string;
    confidence?: number;
    color?: string;
}

interface AcceptPathRequest {
    path: OraclePath;
    domain: string;
}

interface CreatedNode {
    path_node_id: string;       // Original path node ID
    map_node_id: string;        // Created/found map_node ID
    name: string;
    depth: number;
    node_type: string;
    course_id?: string;         // If course was created
    chapter_id?: string;        // If chapter was created
    is_new: boolean;
}

interface GenerationJob {
    job_id: string;
    map_node_id: string;
    chapter_id?: string;
    node_name: string;
    status: string;
}

interface AcceptPathResponse {
    success: boolean;
    batch_id: string;
    path_id: string;
    path_name: string;
    learning_path_id: string;
    created_nodes: CreatedNode[];
    generation_jobs: GenerationJob[];
    skipped_nodes: Array<{ path_node_id: string; name: string; reason: string }>;
    total_new_nodes: number;
    total_jobs: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

function generateUUID(): string {
    return crypto.randomUUID();
}

// Map depth to node_type if not provided
function depthToNodeType(depth: number): string {
    const types: Record<number, string> = {
        0: "domain",
        1: "topic",
        2: "skill",
        3: "course",
        4: "lesson",
    };
    return types[depth] || "lesson";
}

// ============================================================================
// API Handler
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body: AcceptPathRequest = await request.json();
        const { path, domain } = body;

        if (!path || !domain) {
            return NextResponse.json(
                { error: "path and domain are required" },
                { status: 400 }
            );
        }

        // Generate IDs for tracking
        const batchId = generateUUID();
        const learningPathId = generateUUID();

        const createdNodes: CreatedNode[] = [];
        const skippedNodes: Array<{ path_node_id: string; name: string; reason: string }> = [];
        const generationJobs: GenerationJob[] = [];

        // =====================================================================
        // Step 1: Build lookup maps for existing map_nodes
        // =====================================================================

        const { data: existingMapNodes, error: mapError } = await supabase
            .from("map_nodes")
            .select("id, slug, name, depth, node_type, parent_id, course_id")
            .eq("domain_id", domain) as {
                data: Array<{
                    id: string;
                    slug: string;
                    name: string;
                    depth: number;
                    node_type: string;
                    parent_id: string | null;
                    course_id: string | null;
                }> | null;
                error: any;
            };

        if (mapError) {
            console.error("Error fetching map nodes:", mapError);
        }

        const mapNodeBySlug = new Map<string, any>();
        const mapNodeById = new Map<string, any>();
        const mapNodeByName = new Map<string, any>();

        (existingMapNodes || []).forEach(node => {
            mapNodeBySlug.set(node.slug, node);
            mapNodeById.set(node.id, node);
            mapNodeByName.set(node.name.toLowerCase(), node);
        });

        // Track path_node_id -> map_node_id mapping
        const nodeIdMap = new Map<string, string>();

        // =====================================================================
        // Step 2: Process nodes - Sort by depth to process parents first
        // =====================================================================

        const sortedNodes = [...(path.nodes || [])].sort((a, b) => a.depth - b.depth);

        for (const node of sortedNodes) {
            console.log(`[AcceptPath] Processing node: ${node.name} (depth=${node.depth}, existing=${node.is_existing})`);

            // -----------------------------------------------------------------
            // Case 1: Existing node - find in map_nodes
            // -----------------------------------------------------------------
            if (node.is_existing) {
                let existingMapNode: any = null;

                // Try by map_node_id first
                if (node.map_node_id) {
                    existingMapNode = mapNodeById.get(node.map_node_id);
                }

                // Try by slug
                if (!existingMapNode && node.slug) {
                    existingMapNode = mapNodeBySlug.get(node.slug);
                }

                // Try by name (case-insensitive)
                if (!existingMapNode) {
                    existingMapNode = mapNodeByName.get(node.name.toLowerCase());
                }

                if (existingMapNode) {
                    nodeIdMap.set(node.id, existingMapNode.id);
                    createdNodes.push({
                        path_node_id: node.id,
                        map_node_id: existingMapNode.id,
                        name: node.name,
                        depth: existingMapNode.depth,
                        node_type: existingMapNode.node_type,
                        course_id: existingMapNode.course_id,
                        is_new: false,
                    });
                    console.log(`[AcceptPath] Found existing: ${node.name} -> ${existingMapNode.id}`);
                } else {
                    console.warn(`[AcceptPath] Existing node not found: ${node.name}`);
                    skippedNodes.push({
                        path_node_id: node.id,
                        name: node.name,
                        reason: "Referenced existing node not found in database",
                    });
                }
                continue;
            }

            // -----------------------------------------------------------------
            // Case 2: New node - create in map_nodes
            // -----------------------------------------------------------------

            // Find parent map_node_id
            let parentMapNodeId: string | null = null;

            if (node.parent_id) {
                parentMapNodeId = nodeIdMap.get(node.parent_id) || null;
            }

            if (!parentMapNodeId && node.parent_slug) {
                const parentNode = mapNodeBySlug.get(node.parent_slug);
                if (parentNode) {
                    parentMapNodeId = parentNode.id;
                }
            }

            // Generate unique slug
            const baseSlug = generateSlug(node.name);
            const nodeSlug = `${baseSlug}-${Date.now().toString(36)}`;

            // Create map_node entry
            const { data: newMapNode, error: createError } = await supabase
                .from("map_nodes")
                .insert({
                    slug: nodeSlug,
                    name: node.name,
                    description: node.description || `Learn ${node.name}`,
                    parent_id: parentMapNodeId,
                    domain_id: domain,
                    depth: node.depth,
                    node_type: node.node_type || depthToNodeType(node.depth),
                    estimated_hours: node.estimated_hours || 2,
                    difficulty: node.difficulty || "beginner",
                    is_ai_generated: true,
                    sort_order: node.order,
                } as any)
                .select("id, slug, depth, node_type")
                .single() as { data: { id: string; slug: string; depth: number; node_type: string } | null; error: any };

            if (createError || !newMapNode) {
                console.error(`[AcceptPath] Failed to create map_node: ${node.name}`, createError);
                skippedNodes.push({
                    path_node_id: node.id,
                    name: node.name,
                    reason: `Failed to create map_node: ${createError?.message}`,
                });
                continue;
            }

            nodeIdMap.set(node.id, newMapNode.id);
            console.log(`[AcceptPath] Created map_node: ${node.name} -> ${newMapNode.id}`);

            // Track created node
            const createdNode: CreatedNode = {
                path_node_id: node.id,
                map_node_id: newMapNode.id,
                name: node.name,
                depth: newMapNode.depth,
                node_type: newMapNode.node_type,
                is_new: true,
            };

            // -----------------------------------------------------------------
            // Step 2a: For depth 3 (course), create a course record
            // -----------------------------------------------------------------
            if (node.depth === 3) {
                const courseSlug = `${baseSlug}-course-${Date.now().toString(36)}`;

                const { data: course, error: courseError } = await supabase
                    .from("courses")
                    .insert({
                        slug: courseSlug,
                        title: node.name,
                        description: node.description || `Learn ${node.name}`,
                        difficulty: (node.difficulty as any) || "beginner",
                        status: "draft",
                        estimated_hours: node.estimated_hours || 4,
                        is_free: true,
                        is_user_created: true,
                        is_ai_generated: true,
                        created_by_user_id: user.id,
                        xp_reward: 100,
                    } as any)
                    .select("id")
                    .single() as { data: { id: string } | null; error: any };

                if (courseError || !course) {
                    console.error(`[AcceptPath] Failed to create course: ${node.name}`, courseError);
                } else {
                    // Link course to map_node
                    await (supabase as any)
                        .from("map_nodes")
                        .update({ course_id: course.id })
                        .eq("id", newMapNode.id);

                    createdNode.course_id = course.id;
                    console.log(`[AcceptPath] Created course: ${node.name} -> ${course.id}`);
                }
            }

            // -----------------------------------------------------------------
            // Step 2b: For depth 4 (lesson), create a chapter record
            // -----------------------------------------------------------------
            if (node.depth === 4) {
                // Find parent course
                let parentCourseId: string | null = null;

                // Look up parent map_node's course_id
                if (parentMapNodeId) {
                    const parentMapNode = mapNodeById.get(parentMapNodeId);
                    if (parentMapNode?.course_id) {
                        parentCourseId = parentMapNode.course_id;
                    } else {
                        // Parent might be newly created, check our created nodes
                        const parentCreated = createdNodes.find(
                            n => n.map_node_id === parentMapNodeId
                        );
                        if (parentCreated?.course_id) {
                            parentCourseId = parentCreated.course_id;
                        }
                    }
                }

                if (!parentCourseId) {
                    console.warn(`[AcceptPath] No parent course for lesson: ${node.name}`);
                    skippedNodes.push({
                        path_node_id: node.id,
                        name: node.name,
                        reason: "No parent course found for lesson",
                    });
                    continue;
                }

                const chapterSlug = generateSlug(node.name);

                const { data: chapter, error: chapterError } = await supabase
                    .from("chapters")
                    .insert({
                        course_id: parentCourseId,
                        slug: chapterSlug,
                        title: node.name,
                        description: node.description || `Learn about ${node.name}`,
                        sort_order: node.order || 1,
                        estimated_minutes: (node.estimated_hours || 0.5) * 60,
                        xp_reward: 50,
                        is_ai_generated: true,
                    } as any)
                    .select("id")
                    .single() as { data: { id: string } | null; error: any };

                if (chapterError || !chapter) {
                    console.error(`[AcceptPath] Failed to create chapter: ${node.name}`, chapterError);
                    skippedNodes.push({
                        path_node_id: node.id,
                        name: node.name,
                        reason: `Failed to create chapter: ${chapterError?.message}`,
                    });
                    continue;
                }

                createdNode.chapter_id = chapter.id;
                console.log(`[AcceptPath] Created chapter: ${node.name} -> ${chapter.id}`);

                // Queue content generation for this chapter
                const jobId = generateUUID();
                const { error: jobError } = await supabase
                    .from("chapter_content_jobs")
                    .insert({
                        id: jobId,
                        chapter_id: chapter.id,
                        batch_id: batchId,
                        requested_by_user_id: user.id,
                        chapter_context: {
                            chapter_title: node.name,
                            chapter_description: node.description,
                            parent_course_id: parentCourseId,
                            map_node_id: newMapNode.id,
                        },
                        status: "pending",
                    } as any);

                if (!jobError) {
                    generationJobs.push({
                        job_id: jobId,
                        map_node_id: newMapNode.id,
                        chapter_id: chapter.id,
                        node_name: node.name,
                        status: "pending",
                    });
                }
            }

            createdNodes.push(createdNode);
        }

        // =====================================================================
        // Step 3: Create Learning Path Record
        // =====================================================================

        const pathSlug = generateSlug(path.name) + "-" + Date.now().toString(36);

        const { error: pathError } = await supabase
            .from("learning_paths")
            .insert({
                id: learningPathId,
                slug: pathSlug,
                title: path.name,
                description: path.description || `AI-generated learning path for ${domain}`,
                path_type: "ai_generated",
                status: "published",
                estimated_weeks: path.estimated_weeks || 4,
                estimated_hours: (path.estimated_weeks || 4) * 10,
                created_by_user_id: user.id,
                ai_confidence_score: path.confidence,
                ai_reasoning: path.reasoning,
            } as any);

        if (pathError) {
            console.error("[AcceptPath] Failed to create learning path:", pathError);
        }

        // =====================================================================
        // Step 4: Link courses to learning path
        // =====================================================================

        const courseNodes = createdNodes.filter(n => n.course_id);
        for (let i = 0; i < courseNodes.length; i++) {
            const node = courseNodes[i];
            await supabase.from("learning_path_courses").insert({
                learning_path_id: learningPathId,
                course_id: node.course_id,
                sort_order: i + 1,
                is_required: true,
            } as any);
        }

        // =====================================================================
        // Step 5: Create User Enrollment
        // =====================================================================

        // Valid status values: enrolled, in_progress, completed, dropped
        const { error: enrollmentError } = await supabase
            .from("learning_path_enrollments")
            .upsert({
                user_id: user.id,
                learning_path_id: learningPathId,
                status: "enrolled",
                progress_percent: 0,
                started_at: new Date().toISOString(),
            } as any, {
                onConflict: "user_id,learning_path_id",
            });

        if (enrollmentError) {
            console.error("[AcceptPath] Failed to create enrollment:", enrollmentError);
        }

        // =====================================================================
        // Step 6: Trigger content generation (async)
        // =====================================================================

        if (generationJobs.length > 0) {
            console.log(`[AcceptPath] Triggering content generation for ${generationJobs.length} chapters`);
            triggerBatchContentGeneration(batchId, generationJobs, user.id).catch(err => {
                console.error("[AcceptPath] Background content generation error:", err);
            });
        }

        // =====================================================================
        // Step 7: Return Response
        // =====================================================================

        const response: AcceptPathResponse = {
            success: true,
            batch_id: batchId,
            path_id: path.id || generateUUID(),
            path_name: path.name,
            learning_path_id: learningPathId,
            created_nodes: createdNodes,
            generation_jobs: generationJobs,
            skipped_nodes: skippedNodes,
            total_new_nodes: createdNodes.filter(n => n.is_new).length,
            total_jobs: generationJobs.length,
        };

        return NextResponse.json(response, { status: 201 });

    } catch (error) {
        console.error("[AcceptPath] Error:", error);
        return NextResponse.json(
            {
                error: "Failed to accept path",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// ============================================================================
// Background Content Generation (using service role directly)
// ============================================================================

async function triggerBatchContentGeneration(
    batchId: string,
    jobs: GenerationJob[],
    userId: string
): Promise<void> {
    console.log(`[ContentGen] Starting batch ${batchId} with ${jobs.length} jobs`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[ContentGen] Missing Supabase credentials for content generation");
        return;
    }

    // Use service role for direct database access
    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey);

    for (const job of jobs) {
        try {
            if (!job.chapter_id) continue;

            console.log(`[ContentGen] Generating: ${job.node_name}`);

            // Update job to processing
            await supabase
                .from("chapter_content_jobs")
                .update({
                    status: "processing",
                    started_at: new Date().toISOString(),
                    progress_percent: 10,
                    progress_message: "Generating content...",
                })
                .eq("id", job.job_id);

            // Generate fallback content
            const generatedContent = generateChapterContent(job.node_name);

            // Update job as completed
            await supabase
                .from("chapter_content_jobs")
                .update({
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    progress_percent: 100,
                    progress_message: "Content generated successfully",
                    generated_content: generatedContent,
                    model_used: "local_fallback",
                })
                .eq("id", job.job_id);

            // Update chapter with generated content
            await supabase
                .from("chapters")
                .update({
                    generated_content: generatedContent.content,
                    content_status: "ready",
                })
                .eq("id", job.chapter_id);

            console.log(`[ContentGen] Completed: ${job.node_name}`);

            // Small delay between jobs
            await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
            console.error(`[ContentGen] Error for ${job.node_name}:`, error);

            // Mark job as failed
            await supabase
                .from("chapter_content_jobs")
                .update({
                    status: "failed",
                    completed_at: new Date().toISOString(),
                    error_message: error instanceof Error ? error.message : "Unknown error",
                })
                .eq("id", job.job_id);

            // Update chapter status
            await supabase
                .from("chapters")
                .update({
                    content_status: "failed",
                })
                .eq("id", job.chapter_id);
        }
    }

    console.log(`[ContentGen] Batch ${batchId} complete`);
}

// Generate placeholder chapter content
function generateChapterContent(chapterTitle: string): any {
    return {
        content: {
            title: chapterTitle,
            introduction: `Welcome to "${chapterTitle}"! In this lesson, you'll learn key concepts and practical techniques.`,
            sections: [
                {
                    title: "Introduction",
                    content: `This chapter covers the fundamentals of ${chapterTitle}. We'll explore core concepts and build a solid foundation.`,
                    type: "text",
                },
                {
                    title: "Key Concepts",
                    content: `Understanding ${chapterTitle} is essential. Here are the main topics:\n\n• Core principles and best practices\n• Common patterns and techniques\n• Practical examples and use cases`,
                    type: "text",
                },
                {
                    title: "Hands-On Practice",
                    content: `Now it's time to apply what you've learned. Try implementing the concepts from this chapter in a small project.`,
                    type: "exercise",
                },
                {
                    title: "Summary",
                    content: `In this chapter, you learned about ${chapterTitle}. These skills will help you as you continue your journey.`,
                    type: "text",
                },
            ],
            key_takeaways: [
                `Understanding the fundamentals of ${chapterTitle}`,
                `Applying best practices in real-world scenarios`,
                `Building upon these concepts in future lessons`,
            ],
            estimated_time_minutes: 30,
        },
        metadata: {
            model_used: "local_fallback",
            generated_at: new Date().toISOString(),
            placeholder: true,
        },
    };
}
