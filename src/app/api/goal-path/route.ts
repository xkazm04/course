/**
 * Goal Path API Root Route
 *
 * GET /api/goal-path
 *
 * Returns API documentation and available endpoints.
 */

import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        name: "Goal Path API",
        version: "1.0.0",
        description: "AI-powered learning path generation for software developers",
        model: "claude-3-5-haiku-20241022",
        endpoints: {
            generate: {
                path: "/api/goal-path/generate",
                method: "POST",
                description: "Generate learning paths for Live Form and Enhanced variants",
                variants: ["live-form", "enhanced"],
            },
            chat: {
                path: "/api/goal-path/chat",
                method: "POST",
                description: "Multi-turn conversation management for AI Chat variant",
            },
            oracle: {
                path: "/api/goal-path/oracle",
                method: "POST",
                description: "Career Oracle predictions, paths, and job matching",
                actions: ["predictions", "path", "jobs"],
            },
            testing: {
                path: "/api/goal-path/testing",
                method: "GET | POST",
                description: "Run and view test results for all variants",
            },
        },
        authentication: {
            required: true,
            method: "ANTHROPIC_API_KEY environment variable",
        },
        rateLimit: {
            note: "Rate limiting is handled by the Anthropic API",
        },
    });
}
