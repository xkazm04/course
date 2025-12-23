/**
 * Goal Path Chat API Route
 *
 * POST /api/goal-path/chat
 *
 * Handles multi-turn conversation management for the AI Chat variant.
 * Uses Claude claude-3-5-haiku-20241022 model for efficient, conversational responses.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildChatPrompt, buildSystemMessage } from "../lib/promptBuilders";
import {
    validateChatResponse,
    createAPIError,
    ErrorCodes,
} from "../lib/parsers";
import type { ChatRequest, ChatResponse } from "../lib/types";

// Model configuration
const MODEL_ID = "claude-3-5-haiku-20241022";
const MAX_TOKENS = 2048;

/**
 * POST handler for chat continuation
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
        const chatRequest = body as ChatRequest;

        // Validate required fields
        if (!chatRequest.messages || !Array.isArray(chatRequest.messages)) {
            return NextResponse.json(
                createAPIError(
                    ErrorCodes.INVALID_REQUEST,
                    "Missing or invalid 'messages' field"
                ),
                { status: 400 }
            );
        }

        if (!chatRequest.stage) {
            return NextResponse.json(
                createAPIError(
                    ErrorCodes.INVALID_REQUEST,
                    "Missing 'stage' field"
                ),
                { status: 400 }
            );
        }

        // Initialize collected data if not present
        if (!chatRequest.collectedData) {
            chatRequest.collectedData = {};
        }

        // Build prompt
        const prompt = buildChatPrompt(chatRequest);
        const systemMessage = buildSystemMessage("ai-chat");

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
        const result = validateChatResponse(content.text);
        if (!result.valid) {
            // Try to recover by creating a fallback response
            const fallbackResponse: ChatResponse = {
                message: "I apologize, but I had trouble processing that. Could you please rephrase your response?",
                options: undefined,
                stage: chatRequest.stage,
                collectedData: chatRequest.collectedData,
                isComplete: false,
            };

            return NextResponse.json({
                success: true,
                data: fallbackResponse,
                meta: {
                    model: MODEL_ID,
                    duration,
                    recovered: true,
                    tokenUsage: {
                        input: message.usage.input_tokens,
                        output: message.usage.output_tokens,
                        total: message.usage.input_tokens + message.usage.output_tokens,
                    },
                },
            });
        }

        // Return successful response
        return NextResponse.json({
            success: true,
            data: result.data,
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
        console.error("Chat API error:", error);

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
        endpoint: "/api/goal-path/chat",
        method: "POST",
        description: "Multi-turn conversation management for AI Chat variant",
        model: MODEL_ID,
        stages: [
            "greeting",
            "goal_collection",
            "time_collection",
            "skill_level_collection",
            "deadline_collection",
            "generating",
            "presenting_path",
            "refinement",
        ],
        requestFormat: {
            messages: "Array of { role: 'user' | 'assistant' | 'system', content: string }",
            stage: "ConversationStage",
            collectedData: "CollectedUserData",
            sessionId: "string (optional)",
        },
        responseFormat: {
            success: "boolean",
            data: {
                message: "string",
                options: "string[] | null",
                stage: "ConversationStage",
                collectedData: "CollectedUserData",
                generatedPath: "LiveFormResponse | null",
                isComplete: "boolean",
            },
            meta: {
                model: "string",
                duration: "number (ms)",
                tokenUsage: { input: "number", output: "number", total: "number" },
            },
        },
    });
}
