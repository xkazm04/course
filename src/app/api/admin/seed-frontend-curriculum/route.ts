// ============================================================================
// Admin: Seed Frontend Curriculum
// POST /api/admin/seed-frontend-curriculum - Seed all frontend curriculum nodes
//
// This endpoint reads the frontend-curriculum.json and populates map_nodes
// with all levels: Domain -> Topics -> Skills -> Areas -> Lessons
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import curriculumData from "../../../../../config/frontend-curriculum.json";

interface LessonData {
    slug: string;
    name: string;
    description: string;
    estimated_hours: number;
}

interface AreaData {
    slug: string;
    name: string;
    depth: number;
    node_type: string;
    description: string;
    estimated_hours: number;
    difficulty: string;
    sort_order: number;
    lessons: LessonData[];
}

interface SkillData {
    slug: string;
    name: string;
    depth: number;
    node_type: string;
    icon: string;
    color: string;
    description: string;
    estimated_hours: number;
    difficulty: string;
    sort_order: number;
    areas: AreaData[];
}

interface TopicData {
    slug: string;
    name: string;
    depth: number;
    node_type: string;
    icon: string;
    color: string;
    description: string;
    estimated_hours: number;
    difficulty: string;
    sort_order: number;
    skills: SkillData[];
}

interface CurriculumData {
    domain: {
        slug: string;
        name: string;
        depth: number;
        node_type: string;
        icon: string;
        color: string;
        description: string;
        estimated_hours: number;
        difficulty: string;
    };
    topics: TopicData[];
}

interface InsertResult {
    slug: string;
    name: string;
    depth: number;
    status: "created" | "error";
    id?: string;
    error?: string;
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    const results: InsertResult[] = [];

    try {
        const supabase = await createAdminClient();
        const data = curriculumData as CurriculumData;

        // Stats tracking
        let domainCount = 0;
        let topicCount = 0;
        let skillCount = 0;
        let areaCount = 0;
        let lessonCount = 0;
        let errorCount = 0;

        // =====================================================================
        // Step 1: Insert Domain (depth 0)
        // =====================================================================
        console.log("Inserting domain...");

        const { data: domainNode, error: domainError } = await supabase
            .from("map_nodes")
            .insert({
                slug: data.domain.slug,
                name: data.domain.name,
                description: data.domain.description,
                depth: 0,
                node_type: "domain",
                domain_id: data.domain.slug,
                parent_id: null,
                icon: data.domain.icon,
                color: data.domain.color,
                estimated_hours: data.domain.estimated_hours,
                difficulty: data.domain.difficulty,
                sort_order: 1,
                is_group_node: false,
                is_ai_generated: false,
            } as any)
            .select("id")
            .single();

        if (domainError || !domainNode) {
            return NextResponse.json({
                success: false,
                error: "Failed to create domain node",
                details: domainError?.message,
            }, { status: 500 });
        }

        const domainId = domainNode.id;
        domainCount = 1;
        results.push({
            slug: data.domain.slug,
            name: data.domain.name,
            depth: 0,
            status: "created",
            id: domainId,
        });

        console.log(`Domain created: ${data.domain.name} (${domainId})`);

        // =====================================================================
        // Step 2: Insert Topics (depth 1)
        // =====================================================================
        console.log("Inserting topics...");

        for (const topic of data.topics) {
            const { data: topicNode, error: topicError } = await supabase
                .from("map_nodes")
                .insert({
                    slug: topic.slug,
                    name: topic.name,
                    description: topic.description,
                    depth: 1,
                    node_type: "topic",
                    domain_id: data.domain.slug,
                    parent_id: domainId,
                    icon: topic.icon,
                    color: topic.color,
                    estimated_hours: topic.estimated_hours,
                    difficulty: topic.difficulty,
                    sort_order: topic.sort_order,
                    is_group_node: false,
                    is_ai_generated: false,
                } as any)
                .select("id")
                .single();

            if (topicError || !topicNode) {
                results.push({
                    slug: topic.slug,
                    name: topic.name,
                    depth: 1,
                    status: "error",
                    error: topicError?.message,
                });
                errorCount++;
                continue;
            }

            const topicId = topicNode.id;
            topicCount++;
            results.push({
                slug: topic.slug,
                name: topic.name,
                depth: 1,
                status: "created",
                id: topicId,
            });

            // =================================================================
            // Step 3: Insert Skills (depth 2)
            // =================================================================
            for (const skill of topic.skills) {
                const { data: skillNode, error: skillError } = await supabase
                    .from("map_nodes")
                    .insert({
                        slug: skill.slug,
                        name: skill.name,
                        description: skill.description,
                        depth: 2,
                        node_type: "skill",
                        domain_id: data.domain.slug,
                        parent_id: topicId,
                        icon: skill.icon,
                        color: skill.color,
                        estimated_hours: skill.estimated_hours,
                        difficulty: skill.difficulty,
                        sort_order: skill.sort_order,
                        is_group_node: false,
                        is_ai_generated: false,
                    } as any)
                    .select("id")
                    .single();

                if (skillError || !skillNode) {
                    results.push({
                        slug: skill.slug,
                        name: skill.name,
                        depth: 2,
                        status: "error",
                        error: skillError?.message,
                    });
                    errorCount++;
                    continue;
                }

                const skillId = skillNode.id;
                skillCount++;
                results.push({
                    slug: skill.slug,
                    name: skill.name,
                    depth: 2,
                    status: "created",
                    id: skillId,
                });

                // =============================================================
                // Step 4: Insert Areas (depth 3) - node_type = 'course'
                // =============================================================
                for (const area of skill.areas) {
                    const { data: areaNode, error: areaError } = await supabase
                        .from("map_nodes")
                        .insert({
                            slug: area.slug,
                            name: area.name,
                            description: area.description,
                            depth: 3,
                            node_type: "course",
                            domain_id: data.domain.slug,
                            parent_id: skillId,
                            icon: skill.icon, // Inherit from skill
                            color: skill.color, // Inherit from skill
                            estimated_hours: area.estimated_hours,
                            difficulty: area.difficulty,
                            sort_order: area.sort_order,
                            is_group_node: false,
                            is_ai_generated: false,
                        } as any)
                        .select("id")
                        .single();

                    if (areaError || !areaNode) {
                        results.push({
                            slug: area.slug,
                            name: area.name,
                            depth: 3,
                            status: "error",
                            error: areaError?.message,
                        });
                        errorCount++;
                        continue;
                    }

                    const areaId = areaNode.id;
                    areaCount++;
                    results.push({
                        slug: area.slug,
                        name: area.name,
                        depth: 3,
                        status: "created",
                        id: areaId,
                    });

                    // =========================================================
                    // Step 5: Insert Lessons (depth 4)
                    // =========================================================
                    const lessonInserts = area.lessons.map((lesson, index) => ({
                        slug: lesson.slug,
                        name: lesson.name,
                        description: lesson.description,
                        depth: 4,
                        node_type: "lesson",
                        domain_id: data.domain.slug,
                        parent_id: areaId,
                        icon: "BookOpen",
                        color: skill.color,
                        estimated_hours: lesson.estimated_hours,
                        difficulty: area.difficulty,
                        sort_order: index + 1,
                        is_group_node: false,
                        is_ai_generated: false,
                    }));

                    // Batch insert lessons for better performance
                    const { data: lessonNodes, error: lessonsError } = await supabase
                        .from("map_nodes")
                        .insert(lessonInserts as any)
                        .select("id, slug, name");

                    if (lessonsError) {
                        for (const lesson of area.lessons) {
                            results.push({
                                slug: lesson.slug,
                                name: lesson.name,
                                depth: 4,
                                status: "error",
                                error: lessonsError.message,
                            });
                            errorCount++;
                        }
                    } else if (lessonNodes) {
                        lessonCount += lessonNodes.length;
                        for (const lesson of lessonNodes) {
                            results.push({
                                slug: lesson.slug,
                                name: lesson.name,
                                depth: 4,
                                status: "created",
                                id: lesson.id,
                            });
                        }
                    }
                }
            }
        }

        const duration = Date.now() - startTime;

        return NextResponse.json({
            success: errorCount === 0,
            message: `Seeded frontend curriculum in ${duration}ms`,
            stats: {
                domains: domainCount,
                topics: topicCount,
                skills: skillCount,
                areas: areaCount,
                lessons: lessonCount,
                total: domainCount + topicCount + skillCount + areaCount + lessonCount,
                errors: errorCount,
            },
            duration: `${duration}ms`,
            // Only include first 50 results to avoid huge response
            sampleResults: results.slice(0, 50),
            totalResults: results.length,
        });

    } catch (error) {
        console.error("Seed frontend curriculum error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to seed frontend curriculum",
                details: error instanceof Error ? error.message : "Unknown error",
                resultsBeforeError: results.length,
            },
            { status: 500 }
        );
    }
}

// GET endpoint to check current state
export async function GET() {
    try {
        const supabase = await createAdminClient();

        // Count nodes by depth
        const { data: counts } = await supabase
            .from("map_nodes")
            .select("depth, node_type")
            .eq("domain_id", "frontend");

        const stats = {
            total: counts?.length || 0,
            byDepth: {} as Record<number, number>,
            byType: {} as Record<string, number>,
        };

        for (const row of counts || []) {
            stats.byDepth[row.depth] = (stats.byDepth[row.depth] || 0) + 1;
            stats.byType[row.node_type] = (stats.byType[row.node_type] || 0) + 1;
        }

        return NextResponse.json({
            message: "Current frontend curriculum state",
            stats,
        });

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to check state" },
            { status: 500 }
        );
    }
}
