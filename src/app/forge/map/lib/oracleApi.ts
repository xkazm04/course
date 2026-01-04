/**
 * Oracle API Client
 * Communicates with the Oracle API for learning path generation
 *
 * Flow:
 * 1. Client calls local /api/oracle/generate endpoint
 * 2. Local endpoint fetches map_nodes context from Supabase
 * 3. Local endpoint calls external Oracle AI (if configured) with full context
 * 4. Falls back to local generation if no external Oracle configured
 */

// External Oracle serverless function URL (optional - for AI-powered generation)
const EXTERNAL_ORACLE_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || "";

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
     * This ensures the Oracle always has proper map_nodes context for
     * generating paths that align with the 5-level hierarchy.
     */
    async generatePaths(payload: GeneratePathsRequest): Promise<GeneratePathsResponse> {
        // Always route through local API which handles map_nodes context
        const response = await fetch("/api/oracle/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || `Failed to generate paths: ${response.statusText}`);
        }

        const data = await response.json();

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
     * Start a new Oracle session (legacy - for backward compatibility)
     * Requires external Oracle API to be configured
     */
    async startSession(userId?: string): Promise<StartSessionResponse> {
        if (!this.externalUrl) {
            throw new Error("External Oracle API not configured for session-based flow");
        }

        const response = await fetch(`${this.externalUrl}/oracle/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: userId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to start session: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Submit an answer and get the next question or paths (legacy)
     * Requires external Oracle API to be configured
     */
    async submitAnswer(
        sessionId: string,
        answer: string,
        questionIndex: number
    ): Promise<AnswerResponse> {
        if (!this.externalUrl) {
            throw new Error("External Oracle API not configured for session-based flow");
        }

        const response = await fetch(`${this.externalUrl}/oracle/answer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                session_id: sessionId,
                answer,
                question_index: questionIndex,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to submit answer: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get session details (legacy)
     * Requires external Oracle API to be configured
     */
    async getSession(sessionId: string): Promise<{
        session: OracleSession;
        paths: OraclePath[];
    }> {
        if (!this.externalUrl) {
            throw new Error("External Oracle API not configured for session-based flow");
        }

        const response = await fetch(`${this.externalUrl}/oracle/session/${sessionId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get session: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Select a generated path (legacy)
     * Requires external Oracle API to be configured
     */
    async selectPath(
        sessionId: string,
        pathId: string
    ): Promise<{ success: boolean; path: OraclePath }> {
        if (!this.externalUrl) {
            throw new Error("External Oracle API not configured for session-based flow");
        }

        const response = await fetch(`${this.externalUrl}/oracle/paths/${sessionId}/select`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ path_id: pathId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to select path: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Health check for external Oracle API
     */
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        if (!this.externalUrl) {
            // Return local health status if no external URL
            return { status: "ok", timestamp: new Date().toISOString() };
        }

        const response = await fetch(`${this.externalUrl}/health`, {
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`Health check failed: ${response.statusText}`);
        }

        return response.json();
    }
}

// Export singleton instance
export const oracleApi = new OracleApiClient();

// Export class for testing/custom instances
export { OracleApiClient };
