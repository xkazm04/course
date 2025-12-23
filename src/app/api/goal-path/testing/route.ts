/**
 * Goal Path Testing API Route
 *
 * GET /api/goal-path/testing - Get test results and statistics
 * POST /api/goal-path/testing - Run tests
 */

import { NextRequest, NextResponse } from "next/server";
import { createAPIError, ErrorCodes } from "../lib/parsers";
import { runAllTests, runVariantTests } from "./testRunner";
import {
    saveTestRun,
    getAllTestRuns,
    getLatestTestRun,
    getTestRun,
    getAggregateStats,
    getFailurePatterns,
    getPerformanceTrends,
    compareLatestRuns,
} from "./testResults";
import { getAllTestConfigs, getTestConfigsByVariant } from "./testConfigurations";

/**
 * GET handler for test results and statistics
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "latest";
    const runId = searchParams.get("runId");
    const variant = searchParams.get("variant") as "live-form" | "ai-chat" | "enhanced" | "oracle" | null;

    try {
        switch (action) {
            case "latest": {
                const latestRun = getLatestTestRun();
                return NextResponse.json({
                    success: true,
                    data: latestRun || null,
                    message: latestRun ? "Latest test run retrieved" : "No test runs available",
                });
            }

            case "run": {
                if (!runId) {
                    return NextResponse.json(
                        createAPIError(ErrorCodes.INVALID_REQUEST, "Missing runId parameter"),
                        { status: 400 }
                    );
                }
                const run = getTestRun(runId);
                if (!run) {
                    return NextResponse.json(
                        createAPIError(ErrorCodes.INVALID_REQUEST, "Test run not found"),
                        { status: 404 }
                    );
                }
                return NextResponse.json({ success: true, data: run });
            }

            case "all": {
                const runs = getAllTestRuns();
                return NextResponse.json({
                    success: true,
                    count: runs.length,
                    data: runs,
                });
            }

            case "stats": {
                return NextResponse.json({
                    success: true,
                    data: {
                        aggregate: getAggregateStats(),
                        failurePatterns: getFailurePatterns(),
                        trends: getPerformanceTrends(),
                    },
                });
            }

            case "compare": {
                const comparison = compareLatestRuns();
                return NextResponse.json({
                    success: true,
                    data: comparison,
                    message: comparison
                        ? "Comparison generated"
                        : "Not enough runs to compare (need at least 2)",
                });
            }

            case "configs": {
                const configs = variant
                    ? getTestConfigsByVariant(variant)
                    : getAllTestConfigs();
                return NextResponse.json({
                    success: true,
                    count: configs.length,
                    variant: variant || "all",
                    data: configs,
                });
            }

            default:
                return NextResponse.json(
                    createAPIError(
                        ErrorCodes.INVALID_REQUEST,
                        `Unknown action: ${action}. Valid actions: latest, run, all, stats, compare, configs`
                    ),
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("Testing GET error:", error);
        return NextResponse.json(
            createAPIError(
                ErrorCodes.API_ERROR,
                error instanceof Error ? error.message : "Unknown error"
            ),
            { status: 500 }
        );
    }
}

/**
 * POST handler for running tests
 */
export async function POST(request: NextRequest) {
    try {
        // Check for API key
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                createAPIError(
                    ErrorCodes.API_ERROR,
                    "ANTHROPIC_API_KEY environment variable is not set"
                ),
                { status: 500 }
            );
        }

        // Parse request body
        const body = await request.json().catch(() => ({}));
        const variant = body.variant as "live-form" | "ai-chat" | "enhanced" | "oracle" | undefined;
        const notes = body.notes as string | undefined;

        // Validate variant if specified
        if (variant && !["live-form", "ai-chat", "enhanced", "oracle"].includes(variant)) {
            return NextResponse.json(
                createAPIError(
                    ErrorCodes.INVALID_REQUEST,
                    "Invalid variant. Must be one of: live-form, ai-chat, enhanced, oracle"
                ),
                { status: 400 }
            );
        }

        // Run tests
        let results;
        if (variant) {
            results = await runVariantTests(variant, apiKey);
        } else {
            results = await runAllTests(apiKey);
        }

        // Save results
        const savedRun = saveTestRun(
            results.results,
            results.summary,
            variant || "all",
            {
                triggeredBy: "api",
                notes,
            }
        );

        // Return results
        return NextResponse.json({
            success: true,
            runId: savedRun.id,
            variant: variant || "all",
            summary: results.summary,
            results: results.results.map(r => ({
                configId: r.configId,
                success: r.success,
                duration: r.duration,
                tokenUsage: r.tokenUsage,
                validation: r.validation,
                error: r.error,
            })),
        });
    } catch (error) {
        console.error("Testing POST error:", error);
        return NextResponse.json(
            createAPIError(
                ErrorCodes.API_ERROR,
                error instanceof Error ? error.message : "Unknown error"
            ),
            { status: 500 }
        );
    }
}
