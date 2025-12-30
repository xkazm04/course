/**
 * Oracle API Client
 * Communicates with the Oracle Cloud Function for learning path generation
 */

const ORACLE_API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || "http://localhost:8080";

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

export interface PathNode {
    id: string;
    name: string;
    description?: string;
    level: number;           // 0=domain, 1=topic, 2=subtopic
    parent_id: string | null;
    difficulty?: string;
    estimated_hours?: number;
    order: number;
    is_existing: boolean;    // true if node already exists in the system
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
    private baseUrl: string;

    constructor(baseUrl: string = ORACLE_API_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Generate learning paths from collected answers (single API call)
     */
    async generatePaths(payload: GeneratePathsRequest): Promise<GeneratePathsResponse> {
        const response = await fetch(`${this.baseUrl}/oracle/generate`, {
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

        return response.json();
    }

    /**
     * Start a new Oracle session (legacy - for backward compatibility)
     */
    async startSession(userId?: string): Promise<StartSessionResponse> {
        const response = await fetch(`${this.baseUrl}/oracle/start`, {
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
     * Submit an answer and get the next question or paths
     */
    async submitAnswer(
        sessionId: string,
        answer: string,
        questionIndex: number
    ): Promise<AnswerResponse> {
        const response = await fetch(`${this.baseUrl}/oracle/answer`, {
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
     * Get session details
     */
    async getSession(sessionId: string): Promise<{
        session: OracleSession;
        paths: OraclePath[];
    }> {
        const response = await fetch(`${this.baseUrl}/oracle/session/${sessionId}`, {
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
     * Select a generated path
     */
    async selectPath(
        sessionId: string,
        pathId: string
    ): Promise<{ success: boolean; path: OraclePath }> {
        const response = await fetch(`${this.baseUrl}/oracle/paths/${sessionId}/select`, {
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
     * Health check
     */
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        const response = await fetch(`${this.baseUrl}/health`, {
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
