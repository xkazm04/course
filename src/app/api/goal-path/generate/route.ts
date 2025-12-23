/**
 * Goal Path Generate API Route
 *
 * POST /api/goal-path/generate
 *
 * Handles path generation for Live Form and Enhanced variants.
 * Uses Claude claude-3-5-haiku-20241022 model for efficient responses.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
    buildLiveFormPrompt,
    buildEnhancedPrompt,
    buildSystemMessage,
} from "../lib/promptBuilders";
import {
    validateLiveFormResponse,
    validateEnhancedResponse,
    createAPIError,
    ErrorCodes,
} from "../lib/parsers";
import type {
    LiveFormRequest,
    EnhancedRequest,
    LiveFormResponse,
    EnhancedResponse,
} from "../lib/types";

// Model configuration
const MODEL_ID = "claude-3-5-haiku-20241022";
const MAX_TOKENS = 4096;

/**
 * POST handler for path generation
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
        const variant = body.variant as "live-form" | "enhanced";

        if (!variant || !["live-form", "enhanced"].includes(variant)) {
            return NextResponse.json(
                createAPIError(
                    ErrorCodes.INVALID_REQUEST,
                    "Invalid or missing 'variant' field. Must be 'live-form' or 'enhanced'"
                ),
                { status: 400 }
            );
        }

        // Build prompt based on variant
        let prompt: string;
        let systemMessage: string;

        if (variant === "live-form") {
            const liveFormRequest = body.data as LiveFormRequest;

            // Validate required fields
            if (!liveFormRequest.goal || !liveFormRequest.focus || liveFormRequest.focus.length === 0) {
                return NextResponse.json(
                    createAPIError(
                        ErrorCodes.INVALID_REQUEST,
                        "Missing required fields: goal, focus"
                    ),
                    { status: 400 }
                );
            }

            prompt = buildLiveFormPrompt(liveFormRequest);
            systemMessage = buildSystemMessage("live-form");
        } else {
            const enhancedRequest = body.data as EnhancedRequest;

            // Validate required fields
            if (!enhancedRequest.goal || !enhancedRequest.learningStyle) {
                return NextResponse.json(
                    createAPIError(
                        ErrorCodes.INVALID_REQUEST,
                        "Missing required fields: goal, learningStyle"
                    ),
                    { status: 400 }
                );
            }

            prompt = buildEnhancedPrompt(enhancedRequest);
            systemMessage = buildSystemMessage("enhanced");
        }

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
        let validatedResponse: LiveFormResponse | EnhancedResponse;

        if (variant === "live-form") {
            const result = validateLiveFormResponse(content.text);
            if (!result.valid) {
                return NextResponse.json(result.error, { status: 500 });
            }
            validatedResponse = result.data;
        } else {
            const result = validateEnhancedResponse(content.text);
            if (!result.valid) {
                return NextResponse.json(result.error, { status: 500 });
            }
            validatedResponse = result.data;
        }

        // Return successful response with metadata
        return NextResponse.json({
            success: true,
            variant,
            data: validatedResponse,
            meta: {
                model: MODEL_ID,
                duration,
                tokenUsage: {
                    input: message.usage.input_tokens,
                    output: message.usage.output_tokens,
                    total: message.usage.input_tokens + message.usage.output_tokens,
                },
            },
        });
    } catch (error) {
        console.error("Goal path generation error:", error);

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
        endpoint: "/api/goal-path/generate",
        method: "POST",
        description: "Generate learning paths for Live Form and Enhanced variants",
        model: MODEL_ID,
        variants: ["live-form", "enhanced"],
        requestFormat: {
            variant: "live-form | enhanced",
            data: "LiveFormRequest | EnhancedRequest",
        },
        responseFormat: {
            success: "boolean",
            variant: "string",
            data: "LiveFormResponse | EnhancedResponse",
            meta: {
                model: "string",
                duration: "number (ms)",
                tokenUsage: { input: "number", output: "number", total: "number" },
            },
        },
    });
}
