/**
 * Bandit Stats API
 *
 * GET /api/bandit/stats - Get arm statistics and health metrics
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { InterventionType } from "@/lib/bandit";

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
    retired_at: string | null;
    retirement_reason: string | null;
    created_at: string;
    updated_at: string;
}

interface HealthMetricsRow {
    total_selections: number;
    total_rewards: number;
    average_reward: number;
    recent_exploration_rate: number;
    active_arms: number;
    retired_arms: number;
    convergence_metric: number;
    recorded_at: string;
}

export async function GET() {
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

        // Fetch arm statistics
        const { data: armRows, error: armsError } = await supabase
            .from("bandit_arm_stats")
            .select("*")
            .order("average_reward", { ascending: false });

        if (armsError) {
            console.error("Error fetching arm stats:", armsError);
            return NextResponse.json(
                { message: "Failed to fetch arm statistics" },
                { status: 500 }
            );
        }

        // Fetch health metrics
        const { data: healthRow, error: healthError } = await supabase
            .from("bandit_health_metrics")
            .select("*")
            .eq("is_current", true)
            .single();

        if (healthError && healthError.code !== "PGRST116") {
            console.error("Error fetching health metrics:", healthError);
        }

        // Transform arm statistics
        const arms = (armRows as ArmStatsRow[]).map((row) => {
            // Calculate success rate from beta parameters
            const alpha = Number(row.beta_alpha);
            const beta = Number(row.beta_beta);
            const successRate = alpha / (alpha + beta);

            // Calculate 95% confidence interval for success rate
            // Using normal approximation to beta distribution
            const variance = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
            const stdDev = Math.sqrt(variance);
            const z = 1.96;

            // Determine trend based on recent performance
            // In production, this would compare recent vs historical average
            let trend: "improving" | "stable" | "declining" = "stable";
            const avgReward = Number(row.average_reward);
            if (row.total_pulls > 20) {
                if (avgReward > 0.6) trend = "improving";
                else if (avgReward < 0.3) trend = "declining";
            }

            return {
                armId: row.arm_id,
                interventionType: row.intervention_type as InterventionType,
                totalPulls: row.total_pulls,
                averageReward: avgReward,
                successRate,
                explorationRate: row.total_pulls > 0 ? 1 / row.total_pulls : 1,
                trend,
                confidenceInterval: {
                    lower: Math.max(0, successRate - z * stdDev),
                    upper: Math.min(1, successRate + z * stdDev),
                },
                lastPullAt: row.updated_at,
                isRetired: !row.is_active,
                retirementReason: row.retirement_reason,
                betaParams: {
                    alpha,
                    beta,
                },
            };
        });

        // Transform health metrics
        const health = healthRow
            ? {
                  totalSelections: (healthRow as HealthMetricsRow).total_selections,
                  totalRewards: Number((healthRow as HealthMetricsRow).total_rewards),
                  averageReward: Number((healthRow as HealthMetricsRow).average_reward),
                  recentExplorationRate: Number(
                      (healthRow as HealthMetricsRow).recent_exploration_rate
                  ),
                  activeArms: (healthRow as HealthMetricsRow).active_arms,
                  retiredArms: (healthRow as HealthMetricsRow).retired_arms,
                  convergenceMetric: Number(
                      (healthRow as HealthMetricsRow).convergence_metric
                  ),
                  lastUpdateAt: (healthRow as HealthMetricsRow).recorded_at,
              }
            : {
                  totalSelections: 0,
                  totalRewards: 0,
                  averageReward: 0,
                  recentExplorationRate: 0,
                  activeArms: arms.filter((a) => !a.isRetired).length,
                  retiredArms: arms.filter((a) => a.isRetired).length,
                  convergenceMetric: 0,
                  lastUpdateAt: new Date().toISOString(),
              };

        // Calculate summary statistics
        const activeArms = arms.filter((a) => !a.isRetired);
        const summary = {
            bestPerformingArm: activeArms[0]?.interventionType ?? null,
            bestAverageReward: activeArms[0]?.averageReward ?? 0,
            worstPerformingArm: activeArms[activeArms.length - 1]?.interventionType ?? null,
            worstAverageReward: activeArms[activeArms.length - 1]?.averageReward ?? 0,
            totalPulls: arms.reduce((sum, a) => sum + a.totalPulls, 0),
            armsNeedingExploration: activeArms.filter((a) => a.totalPulls < 10).length,
        };

        return NextResponse.json({
            arms,
            health,
            summary,
        });
    } catch (error) {
        console.error("Stats fetch error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
