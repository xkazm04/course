import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Recommendations API Route
 *
 * Generates personalized learning recommendations based on:
 * - Current position in the knowledge map
 * - Completed content
 * - Learning goals
 * - Collective learning patterns
 *
 * GET /api/recommendations
 * Query params:
 * - referenceNodeId: Current node position
 * - goalNodeId: Optional target goal
 * - limit: Max recommendations (default 10)
 *
 * POST /api/recommendations/dismiss
 * Body: { recommendationId: string }
 *
 * POST /api/recommendations/feedback
 * Body: { recommendationId: string, feedback: "helpful" | "not-helpful" }
 */

// ============================================================================
// TYPES
// ============================================================================

interface PathSegmentData {
    from_node_id: string;
    to_node_id: string;
    frequency: number;
    success_rate: number;
    average_time_minutes: number;
}

interface CurriculumNodeRow {
    id: string;
    name: string;
    description: string | null;
    level: string;
    domain_id: string | null;
    tags: string[] | null;
    status: string | null;
    progress: number | null;
    estimated_hours: number | null;
    parent_id: string | null;
    child_ids: string[] | null;
}

interface UserProgressRow {
    node_id: string;
    status: string;
    progress_percent: number | null;
    completed_at: string | null;
}

interface DismissalRow {
    recommendation_id: string;
}

interface PrereqEdgeRow {
    source_node_id: string;
    weight: number | null;
}

interface RecommendationItem {
    id: string;
    node: Record<string, unknown>;
    type: string;
    confidence: number;
    reason: string;
    explanation: string;
    priority: number;
    dismissable: boolean;
    metadata: Record<string, unknown>;
}

// ============================================================================
// GET - Fetch recommendations
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const referenceNodeId = searchParams.get("referenceNodeId");
        const goalNodeId = searchParams.get("goalNodeId");
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        // Fetch user's learning progress
        // Note: Using type assertion as the table may not be in generated types yet
        const { data: progressData, error: progressError } = await supabase
            .from("user_progress")
            .select("node_id, status, progress_percent, completed_at")
            .eq("user_id", user.id) as { data: UserProgressRow[] | null; error: unknown };

        if (progressError) {
            console.error("Error fetching progress:", progressError);
        }

        const completedNodeIds = new Set(
            (progressData || [])
                .filter((p) => p.status === "completed")
                .map((p) => p.node_id)
        );

        const inProgressNodeIds = new Set(
            (progressData || [])
                .filter((p) => p.status === "in_progress")
                .map((p) => p.node_id)
        );

        // Fetch popular path segments for recommendations
        // Note: This table tracks collective learning patterns
        const { data: pathSegments } = await supabase
            .from("learning_path_segments")
            .select("*")
            .order("frequency", { ascending: false })
            .limit(100) as { data: PathSegmentData[] | null };

        // Fetch dismissed recommendations
        const { data: dismissedData } = await supabase
            .from("recommendation_dismissals")
            .select("recommendation_id")
            .eq("user_id", user.id) as { data: DismissalRow[] | null };

        const dismissedIds = new Set(
            (dismissedData || []).map((d) => d.recommendation_id)
        );

        // Generate recommendations
        const recommendations = await generateRecommendations({
            referenceNodeId,
            goalNodeId,
            completedNodeIds,
            inProgressNodeIds,
            dismissedIds,
            pathSegments: pathSegments || [],
            limit,
            supabase,
        });

        // Generate prerequisite warnings for in-progress nodes
        const prerequisiteWarnings = await checkPrerequisites({
            inProgressNodeIds,
            completedNodeIds,
            supabase,
        });

        return NextResponse.json({
            recommendations,
            prerequisiteWarnings,
            metadata: {
                referenceNodeId,
                completedCount: completedNodeIds.size,
                inProgressCount: inProgressNodeIds.size,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Recommendations error:", error);
        return NextResponse.json(
            { error: "Failed to generate recommendations" },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST - Dismiss recommendation or record feedback
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action, recommendationId, feedback } = body;

        if (action === "dismiss") {
            // Record dismissal - logged for now, full implementation would persist to database
            // TODO: Create recommendation_dismissals table in Supabase migrations
            console.log("Dismissal recorded:", {
                user_id: user.id,
                recommendation_id: recommendationId,
                dismissed_at: new Date().toISOString(),
            });

            return NextResponse.json({ success: true });
        }

        if (action === "feedback") {
            // Record feedback for recommendation quality improvement
            // TODO: Create recommendation_feedback table in Supabase migrations
            console.log("Feedback recorded:", {
                user_id: user.id,
                recommendation_id: recommendationId,
                feedback,
                created_at: new Date().toISOString(),
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
        );
    } catch (error) {
        console.error("POST error:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}

// ============================================================================
// RECOMMENDATION GENERATION
// ============================================================================

interface GenerateRecommendationsParams {
    referenceNodeId: string | null;
    goalNodeId: string | null;
    completedNodeIds: Set<string>;
    inProgressNodeIds: Set<string>;
    dismissedIds: Set<string>;
    pathSegments: PathSegmentData[];
    limit: number;
    supabase: Awaited<ReturnType<typeof createClient>>;
}

async function generateRecommendations(
    params: GenerateRecommendationsParams
): Promise<RecommendationItem[]> {
    const {
        referenceNodeId,
        completedNodeIds,
        inProgressNodeIds,
        dismissedIds,
        pathSegments,
        limit,
        supabase,
    } = params;

    const recommendations: RecommendationItem[] = [];

    // 1. Continue recommendations (in-progress nodes)
    if (inProgressNodeIds.size > 0) {
        const { data: inProgressNodes } = await supabase
            .from("curriculum_nodes")
            .select("*")
            .in("id", [...inProgressNodeIds]) as { data: CurriculumNodeRow[] | null };

        for (const node of inProgressNodes || []) {
            if (dismissedIds.has(`continue-${node.id}`)) continue;

            recommendations.push({
                id: `continue-${node.id}`,
                node: formatNode(node),
                type: "continue",
                confidence: 0.95,
                reason: "Continue where you left off",
                explanation: `You've started "${node.name}". Keep going to build momentum!`,
                priority: 100,
                dismissable: false,
                metadata: {
                    algorithm: "in-progress-detection",
                    estimatedMinutes: (node.estimated_hours || 1) * 60,
                },
            });
        }
    }

    // 2. Up Next recommendations (from path segments)
    if (referenceNodeId) {
        const relevantSegments = pathSegments.filter(
            (s) =>
                s.from_node_id === referenceNodeId &&
                !completedNodeIds.has(s.to_node_id) &&
                !inProgressNodeIds.has(s.to_node_id)
        );

        const topSegments = relevantSegments.slice(0, 3);

        for (const segment of topSegments) {
            if (dismissedIds.has(`up-next-${segment.to_node_id}`)) continue;

            const { data: nextNode } = await supabase
                .from("curriculum_nodes")
                .select("*")
                .eq("id", segment.to_node_id)
                .single() as { data: CurriculumNodeRow | null };

            if (nextNode) {
                recommendations.push({
                    id: `up-next-${nextNode.id}`,
                    node: formatNode(nextNode),
                    type: "up-next",
                    confidence: segment.success_rate,
                    reason:
                        segment.frequency > 10
                            ? `${segment.frequency} learners chose this path`
                            : "Recommended next step",
                    explanation: `Based on learning patterns, "${nextNode.name}" is a great next step with ${Math.round(segment.success_rate * 100)}% success rate.`,
                    priority: 90,
                    dismissable: true,
                    metadata: {
                        algorithm: "path-frequency",
                        pathFrequency: segment.frequency,
                        successRate: segment.success_rate,
                        estimatedMinutes: segment.average_time_minutes,
                    },
                });
            }
        }
    }

    // 3. Popular recommendations
    const popularSegments = pathSegments
        .filter(
            (s) =>
                !completedNodeIds.has(s.to_node_id) &&
                !inProgressNodeIds.has(s.to_node_id) &&
                s.frequency > 5
        )
        .slice(0, 3);

    for (const segment of popularSegments) {
        // Skip if already recommended
        if (recommendations.some((r) => r.id.includes(segment.to_node_id)))
            continue;
        if (dismissedIds.has(`popular-${segment.to_node_id}`)) continue;

        const { data: popNode } = await supabase
            .from("curriculum_nodes")
            .select("*")
            .eq("id", segment.to_node_id)
            .single() as { data: CurriculumNodeRow | null };

        if (popNode) {
            recommendations.push({
                id: `popular-${popNode.id}`,
                node: formatNode(popNode),
                type: "popular",
                confidence: segment.success_rate,
                reason: `Trending with ${segment.frequency} learners`,
                explanation: `"${popNode.name}" is popular among learners with a ${Math.round(segment.success_rate * 100)}% completion rate.`,
                priority: 75,
                dismissable: true,
                metadata: {
                    algorithm: "trending-content",
                    pathFrequency: segment.frequency,
                    successRate: segment.success_rate,
                },
            });
        }
    }

    // 4. Hidden gems (high-value, low-traffic content)
    const { data: allNodes } = await supabase
        .from("curriculum_nodes")
        .select("*")
        .eq("level", "chapter")
        .limit(50) as { data: CurriculumNodeRow[] | null };

    const nodeTraffic = new Map<string, number>();
    for (const segment of pathSegments) {
        nodeTraffic.set(
            segment.to_node_id,
            (nodeTraffic.get(segment.to_node_id) || 0) + segment.frequency
        );
    }

    const hiddenGems = (allNodes || [])
        .filter((node) => {
            const traffic = nodeTraffic.get(node.id) || 0;
            return (
                traffic < 5 &&
                !completedNodeIds.has(node.id) &&
                !inProgressNodeIds.has(node.id)
            );
        })
        .slice(0, 2);

    for (const gem of hiddenGems) {
        if (dismissedIds.has(`gem-${gem.id}`)) continue;
        if (recommendations.some((r) => r.id.includes(gem.id))) continue;

        recommendations.push({
            id: `gem-${gem.id}`,
            node: formatNode(gem),
            type: "hidden-gem",
            confidence: 0.7,
            reason: "Undiscovered valuable content",
            explanation: `"${gem.name}" is an underexplored topic that could give you unique skills.`,
            priority: 65,
            dismissable: true,
            metadata: {
                algorithm: "hidden-gem-detector",
                relevantSkills: gem.tags || [],
            },
        });
    }

    // Sort by priority and limit
    recommendations.sort((a, b) => b.priority - a.priority);

    return recommendations.slice(0, limit);
}

// ============================================================================
// PREREQUISITE CHECKING
// ============================================================================

interface CheckPrerequisitesParams {
    inProgressNodeIds: Set<string>;
    completedNodeIds: Set<string>;
    supabase: Awaited<ReturnType<typeof createClient>>;
}

async function checkPrerequisites(
    params: CheckPrerequisitesParams
): Promise<unknown[]> {
    const { inProgressNodeIds, completedNodeIds, supabase } = params;
    const warnings: unknown[] = [];

    for (const nodeId of inProgressNodeIds) {
        // Fetch prerequisites for this node
        const { data: prereqEdges } = await supabase
            .from("node_connections")
            .select("source_node_id, weight")
            .eq("target_node_id", nodeId)
            .eq("connection_type", "prerequisite") as { data: PrereqEdgeRow[] | null };

        if (!prereqEdges || prereqEdges.length === 0) continue;

        const missingPrereqs = prereqEdges.filter(
            (edge) => !completedNodeIds.has(edge.source_node_id)
        );

        if (missingPrereqs.length === 0) continue;

        // Fetch node details
        const { data: targetNode } = await supabase
            .from("curriculum_nodes")
            .select("*")
            .eq("id", nodeId)
            .single() as { data: CurriculumNodeRow | null };

        const { data: prereqNodes } = await supabase
            .from("curriculum_nodes")
            .select("*")
            .in(
                "id",
                missingPrereqs.map((p) => p.source_node_id)
            ) as { data: CurriculumNodeRow[] | null };

        if (!targetNode || !prereqNodes) continue;

        // Calculate severity
        const criticalMissing = missingPrereqs.filter((p) => (p.weight || 0.5) > 0.7);
        const severity =
            criticalMissing.length > 0
                ? Math.min(
                      1,
                      criticalMissing.reduce((sum, p) => sum + (p.weight || 0.5), 0) /
                          criticalMissing.length
                  )
                : 0.3;

        warnings.push({
            targetNode: formatNode(targetNode),
            missingPrerequisites: prereqNodes.map((node) => {
                const edge = missingPrereqs.find(
                    (p) => p.source_node_id === node.id
                );
                return {
                    node: formatNode(node),
                    importance: edge?.weight || 0.5,
                    isSkippable: (edge?.weight || 0.5) < 0.7,
                    reason: `Foundational knowledge for ${targetNode.name}`,
                };
            }),
            severity,
            action: severity > 0.7 ? "stop" : severity > 0.4 ? "review" : "proceed",
        });
    }

    return warnings;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatNode(node: CurriculumNodeRow): Record<string, unknown> {
    return {
        id: node.id,
        name: node.name,
        description: node.description,
        level: node.level,
        domainId: node.domain_id,
        tags: node.tags || [],
        status: node.status || "available",
        progress: node.progress || 0,
        estimatedHours: node.estimated_hours,
        parentId: node.parent_id,
        childIds: node.child_ids || [],
    };
}
