#!/usr/bin/env node
/**
 * Course Connector MCP Server
 *
 * Provides Claude Code with tools to interact with the Course platform's
 * Remix Challenges system. This server enables:
 * - Fetching relevant topics for detected tech stacks
 * - Submitting detected challenges from code scans
 * - Checking for duplicate challenges
 * - Getting skill mappings
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Configuration from environment
const COURSE_API_URL = process.env.COURSE_API_URL || "http://localhost:3000";
const COURSE_API_KEY = process.env.COURSE_API_KEY || "";

// API client helper
async function apiRequest(
    endpoint: string,
    method: "GET" | "POST" | "PATCH" = "GET",
    body?: unknown
): Promise<unknown> {
    const url = `${COURSE_API_URL}${endpoint}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (COURSE_API_KEY) {
        headers["x-api-key"] = COURSE_API_KEY;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error (${response.status}): ${error}`);
    }

    return response.json();
}

// Tool definitions
const tools: Tool[] = [
    {
        name: "get_topics_for_stack",
        description:
            "Fetch Course platform topics and skills that match the detected technology stack. " +
            "Use this to map detected technologies to learning topics for challenge tagging.",
        inputSchema: {
            type: "object" as const,
            properties: {
                stack: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of detected technologies (e.g., ['react', 'typescript', 'nextjs'])",
                },
                language: {
                    type: "string",
                    description: "Primary programming language (e.g., 'typescript')",
                },
                framework: {
                    type: "string",
                    description: "Detected framework (e.g., 'nextjs')",
                },
            },
            required: ["stack"],
        },
    },
    {
        name: "submit_challenge",
        description:
            "Submit a detected code challenge to the Course platform. " +
            "The challenge will be added with 'pending' status for admin review.",
        inputSchema: {
            type: "object" as const,
            properties: {
                project_id: {
                    type: "string",
                    description: "UUID of the project this challenge belongs to",
                },
                type: {
                    type: "string",
                    enum: ["bug", "smell", "missing_feature", "security", "performance"],
                    description: "Type of challenge detected",
                },
                severity: {
                    type: "string",
                    enum: ["low", "medium", "high", "critical"],
                    description: "Severity level of the issue",
                },
                difficulty: {
                    type: "string",
                    enum: ["beginner", "intermediate", "advanced"],
                    description: "Difficulty level for learners to fix",
                },
                title: {
                    type: "string",
                    description: "Short, descriptive title (max 100 chars)",
                },
                description: {
                    type: "string",
                    description: "Detailed description of the issue and why it matters",
                },
                location: {
                    type: "object",
                    properties: {
                        file: { type: "string" },
                        startLine: { type: "number" },
                        endLine: { type: "number" },
                    },
                    required: ["file", "startLine", "endLine"],
                    description: "Location of the issue in the codebase",
                },
                code_snippet: {
                    type: "string",
                    description: "The problematic code snippet",
                },
                context_before: {
                    type: "string",
                    description: "5-10 lines of context before the issue",
                },
                context_after: {
                    type: "string",
                    description: "5-10 lines of context after the issue",
                },
                user_instructions: {
                    type: "string",
                    description: "Step-by-step instructions for learners to fix the issue",
                },
                expected_output: {
                    type: "string",
                    description: "Description of what success looks like",
                },
                hints: {
                    type: "array",
                    items: { type: "string" },
                    description: "Progressive hints (will incur score penalties if used)",
                },
                related_topic_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "UUIDs of related topics from get_topics_for_stack",
                },
                related_skill_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "UUIDs of related skills from get_topics_for_stack",
                },
                tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Free-form tags for categorization",
                },
                estimated_minutes: {
                    type: "number",
                    description: "Estimated time to complete (default: 30)",
                },
            },
            required: [
                "project_id",
                "type",
                "severity",
                "difficulty",
                "title",
                "description",
                "location",
                "user_instructions",
                "expected_output",
            ],
        },
    },
    {
        name: "start_scan",
        description:
            "Start a new scan session and create/find a project record. " +
            "Call this before submitting challenges to get a project_id.",
        inputSchema: {
            type: "object" as const,
            properties: {
                name: {
                    type: "string",
                    description: "Project name (e.g., from package.json)",
                },
                source_url: {
                    type: "string",
                    description: "GitHub URL or local path",
                },
                language: {
                    type: "string",
                    description: "Primary programming language",
                },
                framework: {
                    type: "string",
                    description: "Detected framework",
                },
                tech_stack: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of detected technologies",
                },
                file_count: {
                    type: "number",
                    description: "Number of files in the project",
                },
                total_lines: {
                    type: "number",
                    description: "Total lines of code",
                },
            },
            required: ["name", "language"],
        },
    },
    {
        name: "complete_scan",
        description: "Mark a scan session as complete with final statistics.",
        inputSchema: {
            type: "object" as const,
            properties: {
                scan_id: {
                    type: "string",
                    description: "UUID of the scan from start_scan",
                },
                challenges_found: {
                    type: "number",
                    description: "Total challenges detected",
                },
                challenges_submitted: {
                    type: "number",
                    description: "Challenges actually submitted",
                },
            },
            required: ["scan_id"],
        },
    },
    {
        name: "get_existing_challenges",
        description:
            "Check for existing challenges in a project to avoid duplicates. " +
            "Use before submitting to prevent duplicate reports.",
        inputSchema: {
            type: "object" as const,
            properties: {
                project_id: {
                    type: "string",
                    description: "UUID of the project to check",
                },
                file: {
                    type: "string",
                    description: "Optional: filter by file path",
                },
            },
            required: ["project_id"],
        },
    },
];

// Tool handlers
async function handleGetTopicsForStack(args: {
    stack: string[];
    language?: string;
    framework?: string;
}): Promise<string> {
    const params = new URLSearchParams();
    params.set("stack", args.stack.join(","));
    if (args.language) params.set("language", args.language);
    if (args.framework) params.set("framework", args.framework);

    const result = await apiRequest(`/api/remix/topics?${params.toString()}`);
    return JSON.stringify(result, null, 2);
}

async function handleSubmitChallenge(args: Record<string, unknown>): Promise<string> {
    const result = await apiRequest("/api/remix/challenges", "POST", args);
    return JSON.stringify(result, null, 2);
}

async function handleStartScan(args: {
    name: string;
    source_url?: string;
    language: string;
    framework?: string;
    tech_stack?: string[];
    file_count?: number;
    total_lines?: number;
}): Promise<string> {
    const result = await apiRequest("/api/remix/scans", "POST", {
        project: args,
    });
    return JSON.stringify(result, null, 2);
}

async function handleCompleteScan(args: {
    scan_id: string;
    challenges_found?: number;
    challenges_submitted?: number;
}): Promise<string> {
    const result = await apiRequest(`/api/remix/scans/${args.scan_id}`, "PATCH", {
        completed: true,
        challenges_found: args.challenges_found,
        challenges_submitted: args.challenges_submitted,
    });
    return JSON.stringify(result, null, 2);
}

async function handleGetExistingChallenges(args: {
    project_id: string;
    file?: string;
}): Promise<string> {
    const params = new URLSearchParams();
    params.set("project_id", args.project_id);

    const result = await apiRequest(`/api/remix/challenges?${params.toString()}`);

    // If file filter provided, filter client-side
    if (args.file && typeof result === "object" && result !== null) {
        const data = result as { challenges: Array<{ location: { file: string } }> };
        data.challenges = data.challenges.filter(
            (c) => c.location?.file === args.file
        );
    }

    return JSON.stringify(result, null, 2);
}

// Main server setup
async function main() {
    const server = new Server(
        {
            name: "course-connector",
            version: "1.0.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    // List available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools,
    }));

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        try {
            let result: string;

            switch (name) {
                case "get_topics_for_stack":
                    result = await handleGetTopicsForStack(
                        args as { stack: string[]; language?: string; framework?: string }
                    );
                    break;
                case "submit_challenge":
                    result = await handleSubmitChallenge(args as Record<string, unknown>);
                    break;
                case "start_scan":
                    result = await handleStartScan(
                        args as {
                            name: string;
                            source_url?: string;
                            language: string;
                            framework?: string;
                            tech_stack?: string[];
                            file_count?: number;
                            total_lines?: number;
                        }
                    );
                    break;
                case "complete_scan":
                    result = await handleCompleteScan(
                        args as {
                            scan_id: string;
                            challenges_found?: number;
                            challenges_submitted?: number;
                        }
                    );
                    break;
                case "get_existing_challenges":
                    result = await handleGetExistingChallenges(
                        args as { project_id: string; file?: string }
                    );
                    break;
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }

            return {
                content: [{ type: "text", text: result }],
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [{ type: "text", text: `Error: ${errorMessage}` }],
                isError: true,
            };
        }
    });

    // Start server
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("Course Connector MCP Server running...");
    console.error(`API URL: ${COURSE_API_URL}`);
    console.error(`API Key: ${COURSE_API_KEY ? "configured" : "not configured"}`);
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
