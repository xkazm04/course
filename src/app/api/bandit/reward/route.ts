/**
 * Bandit Reward API
 *
 * POST /api/bandit/reward - Record outcome and calculate reward
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBanditOrchestrator, type RewardRequest } from "@/lib/bandit";

interface RewardRequestBody {
    outcomeId: string;
    rawOutcome: "helped" | "ignored" | "dismissed";
    signals?: Array<{
        type: "engagement" | "learning_gain" | "completion";
        value: number;
    }>;
}

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
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse request body
        const body: RewardRequestBody = await request.json();

        if (!body.outcomeId) {
            return NextResponse.json(
                { message: "outcomeId is required" },
                { status: 400 }
            );
        }

        if (!body.rawOutcome) {
            return NextResponse.json(
                { message: "rawOutcome is required" },
                { status: 400 }
            );
        }

        if (!["helped", "ignored", "dismissed"].includes(body.rawOutcome)) {
            return NextResponse.json(
                { message: "rawOutcome must be 'helped', 'ignored', or 'dismissed'" },
                { status: 400 }
            );
        }

        // Verify outcome belongs to user
        const { data: outcome, error: fetchError } = await supabase
            .from("bandit_outcomes")
            .select("user_id, arm_id, status")
            .eq("id", body.outcomeId)
            .single();

        if (fetchError || !outcome) {
            return NextResponse.json(
                { message: "Outcome not found" },
                { status: 404 }
            );
        }

        if (outcome.user_id !== user.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        if (outcome.status === "resolved") {
            return NextResponse.json(
                { message: "Outcome already resolved" },
                { status: 400 }
            );
        }

        // Get orchestrator
        const orchestrator = getBanditOrchestrator();

        if (!orchestrator.isInitialized()) {
            return NextResponse.json(
                { message: "Bandit system not initialized" },
                { status: 500 }
            );
        }

        // Build reward request
        const rewardRequest: RewardRequest = {
            outcomeId: body.outcomeId,
            rawOutcome: body.rawOutcome,
            signals: body.signals,
        };

        // Record reward
        const response = orchestrator.recordReward(rewardRequest);

        if (!response.success || !response.resolution) {
            return NextResponse.json(
                { message: response.error ?? "Reward recording failed" },
                { status: 500 }
            );
        }

        // Update outcome in database
        const { error: updateError } = await supabase
            .from("bandit_outcomes")
            .update({
                raw_outcome: body.rawOutcome,
                reward: response.resolution.reward,
                reward_components: response.resolution.components,
                resolved_at: new Date().toISOString(),
                attribution_confidence: response.resolution.confidence,
                status: "resolved",
            })
            .eq("id", body.outcomeId);

        if (updateError) {
            console.error("Error updating outcome:", updateError);
            // Continue - the local update succeeded
        }

        // Update arm statistics in database
        const { error: armUpdateError } = await supabase.rpc(
            "update_arm_statistics",
            {
                p_arm_id: outcome.arm_id,
                p_reward: response.resolution.reward,
                p_context_hash: null, // Could include context hash here
            }
        );

        if (armUpdateError) {
            console.error("Error updating arm stats:", armUpdateError);
        }

        return NextResponse.json({
            success: true,
            resolution: {
                outcomeId: response.resolution.outcomeId,
                reward: response.resolution.reward,
                components: response.resolution.components,
                confidence: response.resolution.confidence,
            },
        });
    } catch (error) {
        console.error("Reward recording error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
