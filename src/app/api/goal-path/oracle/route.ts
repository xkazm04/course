/**
 * Goal Path Oracle API Route
 *
 * POST /api/goal-path/oracle
 *
 * Handles Career Oracle predictions, path generation, and job matching.
 * Uses Claude claude-3-5-haiku-20241022 model for market intelligence.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildOraclePrompt, buildSystemMessage } from "../lib/promptBuilders";
import {
    validateOracleResponse,
    createAPIError,
    ErrorCodes,
} from "../lib/parsers";
import type { OracleRequest, OracleResponse } from "../lib/types";

// Model configuration
const MODEL_ID = "claude-3-5-haiku-20241022";
const MAX_TOKENS = 4096;

/**
 * POST handler for oracle operations
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
        const body = await request.json();
        const oracleRequest = body as OracleRequest;

        // Validate required fields
        if (!oracleRequest.action || !["predictions", "path", "jobs"].includes(oracleRequest.action)) {
            return NextResponse.json(
                createAPIError(
                    ErrorCodes.INVALID_REQUEST,
                    "Invalid or missing 'action' field. Must be 'predictions', 'path', or 'jobs'"
                ),
                { status: 400 }
            );
        }

        if (!oracleRequest.currentSkills || !Array.isArray(oracleRequest.currentSkills)) {
            return NextResponse.json(
                createAPIError(
                    ErrorCodes.INVALID_REQUEST,
                    "Missing or invalid 'currentSkills' field"
                ),
                { status: 400 }
            );
        }

        if (!oracleRequest.targetRole) {
            return NextResponse.json(
                createAPIError(
                    ErrorCodes.INVALID_REQUEST,
                    "Missing 'targetRole' field"
                ),
                { status: 400 }
            );
        }

        // Set defaults for optional fields
        const normalizedRequest: OracleRequest = {
            ...oracleRequest,
            weeklyHours: oracleRequest.weeklyHours ?? 10,
            learningStyle: oracleRequest.learningStyle ?? "project",
            riskTolerance: oracleRequest.riskTolerance ?? "moderate",
            remotePreference: oracleRequest.remotePreference ?? "any",
            horizon: oracleRequest.horizon ?? "12m",
        };

        // Build prompt
        const prompt = buildOraclePrompt(normalizedRequest);
        const systemMessage = buildSystemMessage("oracle");

        // Initialize Anthropic client
        const anthropic = new Anthropic({ apiKey });

        // Call Claude API
        const startTime = Date.now();
        const message = await anthropic.messages.create({
            model: MODEL_ID,
            max_tokens: MAX_TOKENS,
            system: systemMessage,
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const duration = Date.now() - startTime;

        // Extract response content
        const content = message.content[0];
        if (content.type !== "text") {
            return NextResponse.json(
                createAPIError(ErrorCodes.API_ERROR, "Unexpected response format from Claude"),
                { status: 500 }
            );
        }

        // Validate and parse response
        const result = validateOracleResponse(content.text);
        if (!result.valid) {
            return NextResponse.json(result.error, { status: 500 });
        }

        // Ensure the response action matches the request
        const responseData: OracleResponse = {
            ...result.data,
            action: normalizedRequest.action,
        };

        // Return successful response
        return NextResponse.json({
            success: true,
            action: normalizedRequest.action,
            data: responseData,
            meta: {
                model: MODEL_ID,
                duration,
                horizon: normalizedRequest.horizon,
                tokenUsage: {
                    input: message.usage.input_tokens,
                    output: message.usage.output_tokens,
                    total: message.usage.input_tokens + message.usage.output_tokens,
                },
            },
        });
    } catch (error) {
        console.error("Oracle API error:", error);

        // Handle Anthropic API errors
        if (error instanceof Anthropic.APIError) {
            if (error.status === 429) {
                return NextResponse.json(
                    createAPIError(ErrorCodes.RATE_LIMIT, "Rate limit exceeded. Please try again later."),
                    { status: 429 }
                );
            }
            return NextResponse.json(
                createAPIError(ErrorCodes.API_ERROR, error.message),
                { status: error.status || 500 }
            );
        }

        return NextResponse.json(
            createAPIError(
                ErrorCodes.API_ERROR,
                error instanceof Error ? error.message : "Unknown error occurred"
            ),
            { status: 500 }
        );
    }
}

/**
 * GET handler for API info
 */
export async function GET() {
    return NextResponse.json({
        endpoint: "/api/goal-path/oracle",
        method: "POST",
        description: "Career Oracle predictions, learning paths, and job matching",
        model: MODEL_ID,
        actions: {
            predictions: "Generate skill demand forecasts and industry trends",
            path: "Create optimized learning path with market timing",
            jobs: "Match job opportunities based on skills and preferences",
        },
        requestFormat: {
            action: "predictions | path | jobs",
            currentSkills: "Array of { name: string, proficiency: 1-5, yearsOfExperience?: number }",
            targetRole: "string",
            targetSector: "IndustrySector (optional)",
            weeklyHours: "number (default: 10)",
            learningStyle: "video | text | project | interactive",
            riskTolerance: "conservative | moderate | aggressive",
            remotePreference: "no | hybrid | full | any",
            horizon: "3m | 6m | 12m | 24m (default: 12m)",
            targetSalary: "number (optional)",
            location: "string (optional)",
        },
        responseFormat: {
            success: "boolean",
            action: "string",
            data: "OracleResponse",
            meta: {
                model: "string",
                duration: "number (ms)",
                horizon: "string",
                tokenUsage: { input: "number", output: "number", total: "number" },
            },
        },
    });
}
