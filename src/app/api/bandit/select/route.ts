/**
 * Bandit Selection API
 *
 * POST /api/bandit/select - Select optimal intervention using Thompson Sampling
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
    getBanditOrchestrator,
    type SelectionRequest,
    type ArmStatistics,
    type InterventionType,
    type LearnerContext,
} from "@/lib/bandit";

// Valid intervention types
const VALID_INTERVENTION_TYPES: InterventionType[] = [
    "interactive_hint",
    "worked_example",
    "scaffolding_content",
    "simplified_example",
    "prerequisite_review",
    "visual_aid",
    "alternative_explanation",
    "concept_bridge",
    "pace_adjustment",
    "micro_practice",
];

interface SelectRequestBody {
    sectionId: string;
    availableInterventions: string[];
    learnerContext?: Partial<LearnerContext>;
}

interface ArmStatsRow {
    arm_id: string;
    intervention_type: string;
    total_pulls: number;
    total_reward: number;
    average_reward: number;
    beta_alpha: number;
    beta_beta: number;
    ucb1_value: number;
    is_active: boolean;
    updated_at: string;
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
        const body: SelectRequestBody = await request.json();

        if (!body.sectionId) {
            return NextResponse.json(
                { message: "sectionId is required" },
                { status: 400 }
            );
        }

        if (
            !body.availableInterventions ||
            body.availableInterventions.length === 0
        ) {
            return NextResponse.json(
                { message: "availableInterventions is required" },
                { status: 400 }
            );
        }

        // Validate intervention types
        const validInterventions = body.availableInterventions.filter(
            (type): type is InterventionType =>
                VALID_INTERVENTION_TYPES.includes(type as InterventionType)
        );

        if (validInterventions.length === 0) {
            return NextResponse.json(
                { message: "No valid intervention types provided" },
                { status: 400 }
            );
        }

        // Get orchestrator
        const orchestrator = getBanditOrchestrator();

        // Initialize if needed
        if (!orchestrator.isInitialized()) {
            // Fetch arm stats from database
            const { data: armRows, error: armsError } = await supabase
                .from("bandit_arm_stats")
                .select("*");

            if (armsError) {
                console.error("Error fetching arm stats:", armsError);
                // Initialize with defaults
                await orchestrator.initialize();
            } else {
                // Transform to ArmStatistics
                const armStats: ArmStatistics[] = (armRows as ArmStatsRow[]).map(
                    (row) => ({
                        armId: row.arm_id,
                        interventionType: row.intervention_type as InterventionType,
                        totalPulls: row.total_pulls,
                        totalReward: Number(row.total_reward),
                        betaParams: {
                            alpha: Number(row.beta_alpha),
                            beta: Number(row.beta_beta),
                        },
                        ucb1Value: Number(row.ucb1_value),
                        averageReward: Number(row.average_reward),
                        lastUpdated: row.updated_at,
                        isActive: row.is_active,
                        contextStats: new Map(),
                    })
                );

                await orchestrator.initialize(armStats);
            }
        }

        // Build selection request
        const selectionRequest: SelectionRequest = {
            userId: user.id,
            sectionId: body.sectionId,
            availableInterventions: validInterventions,
            learnerContext: body.learnerContext ?? {},
        };

        // Select intervention
        const response = orchestrator.selectIntervention(selectionRequest);

        if (!response.success || !response.selection) {
            return NextResponse.json(
                { message: response.error ?? "Selection failed" },
                { status: 500 }
            );
        }

        // Log selection to database
        const { error: insertError } = await supabase
            .from("bandit_outcomes")
            .insert({
                id: response.selection.outcomeId,
                user_id: user.id,
                section_id: body.sectionId,
                arm_id: response.selection.armId,
                intervention_type: response.selection.interventionType,
                context_hash: "default", // Would come from encoded context
                context_features: body.learnerContext ?? {},
                selection_reason: response.selection.reason,
                sampled_value: response.selection.sampledValue,
                confidence: response.selection.confidence,
                is_exploration: response.selection.isExploration,
                status: "pending",
            });

        if (insertError) {
            console.error("Error logging selection:", insertError);
            // Continue anyway - selection still valid
        }

        return NextResponse.json({
            success: true,
            selection: {
                outcomeId: response.selection.outcomeId,
                interventionType: response.selection.interventionType,
                confidence: response.selection.confidence,
                isExploration: response.selection.isExploration,
                reason: response.selection.reason,
            },
        });
    } catch (error) {
        console.error("Selection error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
