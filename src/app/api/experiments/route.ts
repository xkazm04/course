/**
 * Experiments API
 *
 * GET /api/experiments - List experiments
 * POST /api/experiments - Create experiment
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

// ============================================================================
// GET - List Experiments
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;

        // Parse filters
        const status = searchParams.get("status");
        const targetArea = searchParams.get("targetArea");
        const type = searchParams.get("type");
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        // Build query
        let query = supabase
            .from("experiments")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq("status", status);
        }
        if (targetArea) {
            query = query.eq("target_area", targetArea);
        }
        if (type) {
            query = query.eq("type", type);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error("Error fetching experiments:", error);
            return NextResponse.json(
                { message: "Failed to fetch experiments" },
                { status: 500 }
            );
        }

        // Transform to frontend format
        const experiments = (data as ExperimentRow[]).map(transformExperiment);

        return NextResponse.json({
            experiments,
            total: count || experiments.length,
            offset,
            limit,
        });
    } catch (error) {
        console.error("Experiments API error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST - Create Experiment
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { message: "Authentication required" },
                { status: 401 }
            );
        }

        // Validate required fields
        if (!body.name || !body.primaryMetric || !body.variants) {
            return NextResponse.json(
                { message: "Missing required fields: name, primaryMetric, variants" },
                { status: 400 }
            );
        }

        // Validate variants
        if (!Array.isArray(body.variants) || body.variants.length < 2) {
            return NextResponse.json(
                { message: "At least 2 variants are required" },
                { status: 400 }
            );
        }

        // Calculate total weight
        const totalWeight = body.variants.reduce(
            (sum: number, v: { weight: number }) => sum + (v.weight || 0),
            0
        );
        if (Math.abs(totalWeight - 100) > 0.01) {
            return NextResponse.json(
                { message: "Variant weights must sum to 100" },
                { status: 400 }
            );
        }

        // Check for control variant
        const hasControl = body.variants.some((v: { isControl: boolean }) => v.isControl);
        if (!hasControl) {
            return NextResponse.json(
                { message: "One variant must be marked as control" },
                { status: 400 }
            );
        }

        // Transform to database format
        const experimentData = {
            name: body.name,
            description: body.description || null,
            type: body.type || "ab_test",
            target_area: body.targetArea || "orchestration",
            status: "draft",
            variants: body.variants,
            traffic_allocation: body.trafficAllocation ?? 100,
            targeting: body.targeting || null,
            primary_metric: body.primaryMetric,
            secondary_metrics: body.secondaryMetrics || [],
            min_sample_size: body.minSampleSize ?? 100,
            significance_threshold: body.significanceThreshold ?? 0.05,
            metadata: body.metadata || {},
            created_by: user.id,
        };

        const { data, error } = await supabase
            .from("experiments")
            .insert(experimentData)
            .select()
            .single();

        if (error) {
            console.error("Error creating experiment:", error);
            return NextResponse.json(
                { message: "Failed to create experiment" },
                { status: 500 }
            );
        }

        return NextResponse.json(transformExperiment(data as ExperimentRow), { status: 201 });
    } catch (error) {
        console.error("Create experiment error:", error);
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
