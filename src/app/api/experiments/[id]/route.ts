/**
 * Experiment by ID API
 *
 * GET /api/experiments/[id] - Get experiment
 * PATCH /api/experiments/[id] - Update experiment
 * DELETE /api/experiments/[id] - Delete experiment
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

interface ExperimentRow {
    id: string;
    name: string;
    description: string | null;
    type: string;
    target_area: string;
    status: string;
    variants: unknown;
    traffic_allocation: number;
    targeting: unknown | null;
    primary_metric: string;
    secondary_metrics: string[];
    min_sample_size: number;
    significance_threshold: number;
    started_at: string | null;
    ended_at: string | null;
    created_at: string;
    updated_at: string;
    version: number;
    winning_variant_id: string | null;
    metadata: unknown | null;
    created_by: string | null;
}

interface RouteContext {
    params: Promise<{ id: string }>;
}

// ============================================================================
// GET - Get Experiment
// ============================================================================

export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("experiments")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json(
                    { message: "Experiment not found" },
                    { status: 404 }
                );
            }
            console.error("Error fetching experiment:", error);
            return NextResponse.json(
                { message: "Failed to fetch experiment" },
                { status: 500 }
            );
        }

        return NextResponse.json(transformExperiment(data as ExperimentRow));
    } catch (error) {
        console.error("Get experiment error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================================
// PATCH - Update Experiment
// ============================================================================

export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();
        const body = await request.json();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { message: "Authentication required" },
                { status: 401 }
            );
        }

        // Optimistic locking check
        const expectedVersion = request.headers.get("If-Match");
        if (expectedVersion) {
            const { data: current } = await supabase
                .from("experiments")
                .select("version")
                .eq("id", id)
                .single();

            if (current && current.version !== parseInt(expectedVersion, 10)) {
                return NextResponse.json(
                    { message: "Experiment was modified by another user" },
                    { status: 409 }
                );
            }
        }

        // Build update object
        const updates: Record<string, unknown> = {};

        if (body.name !== undefined) updates.name = body.name;
        if (body.description !== undefined) updates.description = body.description;
        if (body.type !== undefined) updates.type = body.type;
        if (body.targetArea !== undefined) updates.target_area = body.targetArea;
        if (body.status !== undefined) updates.status = body.status;
        if (body.variants !== undefined) updates.variants = body.variants;
        if (body.trafficAllocation !== undefined) updates.traffic_allocation = body.trafficAllocation;
        if (body.targeting !== undefined) updates.targeting = body.targeting;
        if (body.primaryMetric !== undefined) updates.primary_metric = body.primaryMetric;
        if (body.secondaryMetrics !== undefined) updates.secondary_metrics = body.secondaryMetrics;
        if (body.minSampleSize !== undefined) updates.min_sample_size = body.minSampleSize;
        if (body.significanceThreshold !== undefined) updates.significance_threshold = body.significanceThreshold;
        if (body.startedAt !== undefined) updates.started_at = body.startedAt;
        if (body.endedAt !== undefined) updates.ended_at = body.endedAt;
        if (body.winningVariantId !== undefined) updates.winning_variant_id = body.winningVariantId;
        if (body.metadata !== undefined) updates.metadata = body.metadata;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { message: "No updates provided" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("experiments")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json(
                    { message: "Experiment not found" },
                    { status: 404 }
                );
            }
            console.error("Error updating experiment:", error);
            return NextResponse.json(
                { message: "Failed to update experiment" },
                { status: 500 }
            );
        }

        return NextResponse.json(transformExperiment(data as ExperimentRow));
    } catch (error) {
        console.error("Update experiment error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================================
// DELETE - Delete Experiment
// ============================================================================

export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { message: "Authentication required" },
                { status: 401 }
            );
        }

        // Check if experiment is in draft status
        const { data: experiment } = await supabase
            .from("experiments")
            .select("status")
            .eq("id", id)
            .single();

        if (!experiment) {
            return NextResponse.json(
                { message: "Experiment not found" },
                { status: 404 }
            );
        }

        if (experiment.status !== "draft") {
            return NextResponse.json(
                { message: "Can only delete draft experiments" },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from("experiments")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting experiment:", error);
            return NextResponse.json(
                { message: "Failed to delete experiment" },
                { status: 500 }
            );
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Delete experiment error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================================
// Helpers
// ============================================================================

function transformExperiment(row: ExperimentRow) {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type,
        targetArea: row.target_area,
        status: row.status,
        variants: row.variants,
        trafficAllocation: row.traffic_allocation,
        targeting: row.targeting,
        primaryMetric: row.primary_metric,
        secondaryMetrics: row.secondary_metrics,
        minSampleSize: row.min_sample_size,
        significanceThreshold: row.significance_threshold,
        startedAt: row.started_at,
        endedAt: row.ended_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        version: row.version,
        winningVariantId: row.winning_variant_id,
        metadata: row.metadata,
    };
}
