import { NextRequest, NextResponse } from "next/server";
import type { LearnerProfile, CompletionPrediction } from "@/app/features/adaptive-learning/lib/types";

interface PredictRequest {
    profile: LearnerProfile;
    nodeIds: string[];
}

/**
 * POST /api/adaptive-learning/predict
 *
 * Generates completion predictions for specific curriculum nodes
 * based on user profile and learning history.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as PredictRequest;
        const { profile, nodeIds } = body;

        if (!profile) {
            return NextResponse.json(
                { error: "Profile is required" },
                { status: 400 }
            );
        }

        if (!nodeIds || nodeIds.length === 0) {
            return NextResponse.json(
                { error: "Node IDs are required" },
                { status: 400 }
            );
        }

        // Limit the number of predictions per request
        const limitedNodeIds = nodeIds.slice(0, 50);

        // Import the prediction engine dynamically
        const { generatePredictions } = await import(
            "@/app/features/adaptive-learning/lib/predictionEngine"
        );

        // Generate predictions
        const predictions = await generatePredictions(profile, limitedNodeIds);

        return NextResponse.json({
            predictions,
            count: Object.keys(predictions).length,
            requestedCount: nodeIds.length,
            limitApplied: nodeIds.length > 50,
        });
    } catch (error) {
        console.error("Error generating predictions:", error);
        return NextResponse.json(
            { error: "Failed to generate predictions" },
            { status: 500 }
        );
    }
}
