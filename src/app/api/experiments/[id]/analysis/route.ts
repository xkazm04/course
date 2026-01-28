/**
 * Experiment Analysis API
 *
 * GET /api/experiments/[id]/analysis - Get statistical analysis for experiment
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeExperiment } from "@/app/features/experimentation/lib/statisticalAnalyzer";
import type { Experiment, VariantMetric } from "@/app/features/experimentation/lib/types";

interface RouteContext {
    params: Promise<{ id: string }>;
}

interface VariantStatsRow {
    experiment_id: string;
    variant_id: string;
    metric_name: string;
    sample_size: number;
    sum_value: number;
    mean_value: number;
    std_dev: number | null;
    min_value: number;
    max_value: number;
    median_value: number | null;
    conversions: number;
    conversion_rate: number | null;
}

export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        // Fetch experiment
        const { data: experimentRow, error: expError } = await supabase
            .from("experiments")
            .select("*")
            .eq("id", id)
            .single();

        if (expError || !experimentRow) {
            return NextResponse.json(
                { message: "Experiment not found" },
                { status: 404 }
            );
        }

        // Transform to Experiment type
        const experiment: Experiment = {
            id: experimentRow.id,
            name: experimentRow.name,
            description: experimentRow.description,
            type: experimentRow.type,
            targetArea: experimentRow.target_area,
            status: experimentRow.status,
            variants: experimentRow.variants as Experiment["variants"],
            trafficAllocation: experimentRow.traffic_allocation,
            targeting: experimentRow.targeting as Experiment["targeting"],
            primaryMetric: experimentRow.primary_metric,
            secondaryMetrics: experimentRow.secondary_metrics,
            minSampleSize: experimentRow.min_sample_size,
            significanceThreshold: experimentRow.significance_threshold,
            startedAt: experimentRow.started_at,
            endedAt: experimentRow.ended_at,
            createdAt: experimentRow.created_at,
            updatedAt: experimentRow.updated_at,
            version: experimentRow.version,
            winningVariantId: experimentRow.winning_variant_id,
            metadata: experimentRow.metadata as Record<string, unknown>,
        };

        // Fetch aggregated stats from view
        const { data: statsRows, error: statsError } = await supabase
            .from("experiment_variant_stats")
            .select("*")
            .eq("experiment_id", id);

        if (statsError) {
            console.error("Error fetching stats:", statsError);
            return NextResponse.json(
                { message: "Failed to fetch experiment stats" },
                { status: 500 }
            );
        }

        // Build variant metrics map
        const variantMetrics: Record<string, VariantMetric[]> = {};

        for (const row of (statsRows || []) as VariantStatsRow[]) {
            if (!variantMetrics[row.variant_id]) {
                variantMetrics[row.variant_id] = [];
            }

            // Calculate confidence interval
            const se = (row.std_dev || 0) / Math.sqrt(row.sample_size || 1);
            const z = 1.96; // 95% confidence

            variantMetrics[row.variant_id].push({
                variantId: row.variant_id,
                metricName: row.metric_name,
                sampleSize: row.sample_size || 0,
                sum: row.sum_value || 0,
                mean: row.mean_value || 0,
                stdDev: row.std_dev || 0,
                conversionRate: row.conversion_rate || 0,
                conversions: row.conversions || 0,
                confidenceInterval: {
                    lower: (row.mean_value || 0) - z * se,
                    upper: (row.mean_value || 0) + z * se,
                },
            });
        }

        // Run analysis
        const analysis = analyzeExperiment(
            experiment,
            variantMetrics,
            1 - experiment.significanceThreshold
        );

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("Analysis error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
