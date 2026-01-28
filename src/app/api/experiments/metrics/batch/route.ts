/**
 * Metrics Batch API
 *
 * POST /api/experiments/metrics/batch - Record batch of metric events
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface MetricEvent {
    experimentId: string;
    userId: string;
    variantId: string;
    metricName: string;
    value: number;
    timestamp: string;
    context?: Record<string, unknown>;
    sessionId?: string;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        if (!body.metrics || !Array.isArray(body.metrics)) {
            return NextResponse.json(
                { message: "metrics array is required" },
                { status: 400 }
            );
        }

        const metrics: MetricEvent[] = body.metrics;

        if (metrics.length === 0) {
            return NextResponse.json({ inserted: 0 });
        }

        // Limit batch size
        const limitedMetrics = metrics.slice(0, 100);

        // Transform to database format
        const records = limitedMetrics.map((m) => ({
            experiment_id: m.experimentId,
            user_id: m.userId,
            variant_id: m.variantId,
            metric_name: m.metricName,
            value: m.value,
            timestamp: m.timestamp || new Date().toISOString(),
            context: m.context || {},
            session_id: m.sessionId || null,
        }));

        const { data, error } = await supabase
            .from("experiment_metrics")
            .insert(records)
            .select("id");

        if (error) {
            console.error("Error inserting metrics:", error);
            return NextResponse.json(
                { message: "Failed to record metrics" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            inserted: data?.length || 0,
            message: "Metrics recorded successfully",
        });
    } catch (error) {
        console.error("Metrics batch error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
