/**
 * Oracle API Client
 * Communicates with the Oracle API for learning path generation
 *
 * Features:
 * - Automatic retry with exponential backoff for transient failures
 * - Error surfacing to UI via ProgressNotifications
 * - Graceful fallback handling
 *
 * Flow:
 * 1. Client calls local /api/oracle/generate endpoint
 * 2. Local endpoint fetches map_nodes context from Supabase
 * 3. Local endpoint calls external Oracle AI (if configured) with full context
 * 4. Falls back to local generation if no external Oracle configured
 */

import {
    fetchWithRetryGet,
    fetchWithRetryPost,
    type ApiResult,
    type RetryConfig,
} from "./apiUtils";

// External Oracle serverless function URL (optional - for AI-powered generation)
const EXTERNAL_ORACLE_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || "";

// Retry configuration for Oracle API - be patient with AI generation
const ORACLE_RETRY_CONFIG: Partial<RetryConfig> = {
    maxRetries: 3,
    baseDelayMs: 3000, // Start with 3s delay (AI is slow)
    maxDelayMs: 20000, // Max 20s delay
};

export interface OracleQuestion {
    id?: string;
    question: string;
    options: Array<{
        id: string;
        label: string;
        description: string;
    }>;
    reasoning?: string;
    type?: "question" | "path_suggestion";
}

/**
 * PathNode represents a node in the generated learning path
 * Maps to the 5-level map_nodes hierarchy:
 * - depth 0: domain
 * - depth 1: topic
 * - depth 2: skill
 * - depth 3: course (creates courses table entry)
 * - depth 4: lesson (creates chapters table entry as course content)
 */
export interface PathNode {
    id: string;                     // Generated ID for tracking within path
    map_node_id?: string;           // If existing: actual UUID from map_nodes table
    slug?: string;                  // If existing: actual slug from map_nodes
    name: string;
    description?: string;
    depth: number;                  // 0-4 matching map_nodes hierarchy
    node_type: string;              // "domain", "topic", "skill", "course", "lesson"
    parent_id: string | null;       // Reference to parent node in this path
    parent_slug?: string;           // Parent map_node slug for new nodes
    difficulty?: string;
    estimated_hours?: number;
    order: number;
    is_existing: boolean;           // true if node exists in map_nodes table
}

export interface OraclePath {
    id?: string;
    name: string;
    description?: string;
    node_ids: string[];
    nodes?: PathNode[];      // New hierarchical structure from LLM
    forge_suggestions: Array<{
        name: string;
        description: string;
        parent_slug: string;
    }>;
    estimated_weeks?: number;
    reasoning?: string;
    confidence?: number;
    color?: string;
}

export interface OracleSession {
    id: string;
    user_id?: string;
    status: "in_progress" | "completed" | "abandoned";
    domain_answer?: string;
    experience_answer?: string;
    goal_answer?: string;
    llm_questions: OracleQuestion[];
    llm_answers: string[];
}

export interface StartSessionResponse {
    session_id: string;
    question_index: number;
    question: OracleQuestion;
    total_static_questions: number;
}

export interface AnswerResponse {
    session_id: string;
    question_index: number;
    question?: OracleQuestion;
    phase: "static" | "llm" | "complete";
    paths?: OraclePath[];
}

export interface GeneratePathsRequest {
    domain: string;
    experience_level: string;
    motivation?: string | string[];
    learning_style?: string | string[];
    concerns?: string | string[];
    challenge?: string | string[];
    goal?: string | string[];
    interest?: string | string[];
    constraint?: string | string[];
    commitment: string;
    additional_context?: string;
    all_answers?: Record<string, string | string[]>;
}

export interface GeneratePathsResponse {
    paths: OraclePath[];
    reasoning?: string;
    metadata?: {
        model_used?: string;
        tokens_used?: number;
        grounding_sources?: unknown;
    };
}

class OracleApiClient {
    private externalUrl: string;

    constructor(externalUrl: string = EXTERNAL_ORACLE_URL) {
        this.externalUrl = externalUrl;
    }

    /**
     * Generate learning paths from collected answers
     *
     * Routes through local /api/oracle/generate endpoint which:
     * 1. Fetches map_nodes context from Supabase
     * 2. Calls external Oracle AI if ORACLE_API_URL is configured
     * 3. Falls back to local generation based on existing map structure
     *
     * Uses retry logic with error notification - this is a critical user action
     */
    async generatePaths(payload: GeneratePathsRequest): Promise<GeneratePathsResponse> {
        const result = await fetchWithRetryPost<GeneratePathsResponse>(
            "/api/oracle/generate",
            payload,
            {
                retryConfig: ORACLE_RETRY_CONFIG,
                context: "Generate Learning Paths",
                notifyOnError: true,
                timeoutMs: 120000, // 2 minute timeout for AI generation
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Failed to generate paths");
        }

        const data = result.data;

        // Validate response has proper structure
        if (!data.paths || !Array.isArray(data.paths)) {
            throw new Error("Invalid response from Oracle: missing paths array");
        }

        // Check if fallback was used (indicates external Oracle not available)
        if (data.metadata?.model_used === "fallback") {
            console.info("Oracle using local fallback generation based on existing map structure");
        }

        return data;
    }

    /**
     * Generate paths with result wrapper
     * Alternative method that returns ApiResult for more control over error handling
     */
    async generatePathsSafe(payload: GeneratePathsRequest): Promise<ApiResult<GeneratePathsResponse>> {
        const result = await fetchWithRetryPost<GeneratePathsResponse>(
            "/api/oracle/generate",
            payload,
            {
                retryConfig: ORACLE_RETRY_CONFIG,
                context: "Generate Learning Paths",
                notifyOnError: false, // Caller will handle errors
                timeoutMs: 120000,
            }
        );

        if (result.success && result.data) {
            // Validate response structure
            if (!result.data.paths || !Array.isArray(result.data.paths)) {
                return {
                    data: null,
                    error: {
                        type: "parse",
                        message: "Invalid response from Oracle: missing paths array",
                        retryable: true,
                    },
                    success: false,
                };
            }
        }

        return result;
    }

    /**
     * Start a new Oracle session (legacy - for backward compatibility)
     * Requires external Oracle API to be configured
     * Uses retry logic for reliability
     */
    async startSession(userId?: string): Promise<StartSessionResponse> {
        if (!this.externalUrl) {
            throw new Error("External Oracle API not configured for session-based flow");
        }

        const result = await fetchWithRetryPost<StartSessionResponse>(
            `${this.externalUrl}/oracle/start`,
            { user_id: userId },
            {
                retryConfig: { maxRetries: 2, baseDelayMs: 1000, maxDelayMs: 5000, backoffMultiplier: 2, retryableStatuses: [408, 429, 500, 502, 503, 504] },
                context: "Start Oracle Session",
                notifyOnError: true,
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Failed to start session");
        }

        return result.data;
    }

    /**
     * Submit an answer and get the next question or paths (legacy)
     * Requires external Oracle API to be configured
     * Uses retry logic for reliability
     */
    async submitAnswer(
        sessionId: string,
        answer: string,
        questionIndex: number
    ): Promise<AnswerResponse> {
        if (!this.externalUrl) {
            throw new Error("External Oracle API not configured for session-based flow");
        }

        const result = await fetchWithRetryPost<AnswerResponse>(
            `${this.externalUrl}/oracle/answer`,
            {
                session_id: sessionId,
                answer,
                question_index: questionIndex,
            },
            {
                retryConfig: ORACLE_RETRY_CONFIG,
                context: "Submit Answer",
                notifyOnError: true,
                timeoutMs: 90000, // 90s timeout for answers that trigger path generation
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Failed to submit answer");
        }

        return result.data;
    }

    /**
     * Get session details (legacy)
     * Requires external Oracle API to be configured
     * Uses retry logic for reliability
     */
    async getSession(sessionId: string): Promise<{
        session: OracleSession;
        paths: OraclePath[];
    }> {
        if (!this.externalUrl) {
            throw new Error("External Oracle API not configured for session-based flow");
        }

        const result = await fetchWithRetryGet<{
            session: OracleSession;
            paths: OraclePath[];
        }>(
            `${this.externalUrl}/oracle/session/${sessionId}`,
            {
                retryConfig: { maxRetries: 2, baseDelayMs: 1000, maxDelayMs: 5000, backoffMultiplier: 2, retryableStatuses: [408, 429, 500, 502, 503, 504] },
                context: "Get Session",
                notifyOnError: true,
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Failed to get session");
        }

        return result.data;
    }

    /**
     * Select a generated path (legacy)
     * Requires external Oracle API to be configured
     * Uses retry logic - path selection is a critical user action
     */
    async selectPath(
        sessionId: string,
        pathId: string
    ): Promise<{ success: boolean; path: OraclePath }> {
        if (!this.externalUrl) {
            throw new Error("External Oracle API not configured for session-based flow");
        }

        const result = await fetchWithRetryPost<{ success: boolean; path: OraclePath }>(
            `${this.externalUrl}/oracle/paths/${sessionId}/select`,
            { path_id: pathId },
            {
                retryConfig: ORACLE_RETRY_CONFIG,
                context: "Select Learning Path",
                notifyOnError: true,
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Failed to select path");
        }

        return result.data;
    }

    /**
     * Health check for external Oracle API
     * Uses retry logic but silent errors
     */
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        if (!this.externalUrl) {
            // Return local health status if no external URL
            return { status: "ok", timestamp: new Date().toISOString() };
        }

        const result = await fetchWithRetryGet<{ status: string; timestamp: string }>(
            `${this.externalUrl}/health`,
            {
                retryConfig: { maxRetries: 1, baseDelayMs: 1000, maxDelayMs: 3000, backoffMultiplier: 2, retryableStatuses: [408, 429, 500, 502, 503, 504] },
                context: "Oracle Health Check",
                notifyOnError: false, // Silent - health checks shouldn't spam errors
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Health check failed");
        }

        return result.data;
    }
}

// Export singleton instance
export const oracleApi = new OracleApiClient();

// Export class for testing/custom instances
export { OracleApiClient };
