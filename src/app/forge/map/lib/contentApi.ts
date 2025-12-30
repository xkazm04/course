/**
 * Content Generator API Client
 * Communicates with the Content Generator Cloud Function for course content generation
 */

import type { OraclePath } from "./oracleApi";

const CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_GENERATOR_URL || "http://localhost:8081";

export type GenerationType = "full_course" | "chapters_only" | "description" | "learning_outcomes" | "chapter_content";
export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface GeneratedCourse {
    title: string;
    subtitle?: string;
    description: string;
    long_description?: string;
    what_you_will_learn: string[];
    requirements: string[];
    target_audience: string[];
    difficulty: string;
    estimated_hours: number;
}

export interface GeneratedChapter {
    title: string;
    description: string;
    estimated_minutes: number;
    xp_reward: number;
    sort_order: number;
}

export interface GeneratedContent {
    course?: GeneratedCourse;
    chapters?: GeneratedChapter[];
    long_description?: string;
    what_you_will_learn?: string[];
    prerequisites?: string[];
}

export interface JobMetadata {
    model_used?: string;
    tokens_used?: number;
    latency_ms?: number;
    grounding_sources?: {
        search_queries?: string;
    };
}

export interface ContentJob {
    job_id: string;
    status: JobStatus;
    progress_percent: number;
    progress_message?: string;
    created_at?: string;
    completed_at?: string;
    generated_content?: GeneratedContent;
    generated_course_id?: string;
    error_message?: string;
    metadata?: JobMetadata;
}

export interface CreateJobResponse {
    job_id: string;
    status: JobStatus;
    estimated_time_seconds: number;
    message: string;
}

export interface ListJobsResponse {
    jobs: Array<{
        id: string;
        node_id: string;
        generation_type: GenerationType;
        status: JobStatus;
        progress_percent: number;
        progress_message?: string;
        created_at: string;
        completed_at?: string;
    }>;
    count: number;
}

// Path Acceptance Types
export interface CreatedNode {
    path_node_id: string;
    map_node_id: string;
    name: string;
    type: "course" | "chapter";
    course_id?: string;
    chapter_id?: string;
    parent_course_id?: string;
}

export interface GenerationJobInfo {
    job_id: string;
    node_id: string;
    node_name: string;
    status: JobStatus;
    progress_percent?: number;
    progress_message?: string;
    error_message?: string;
}

export interface SkippedNode {
    path_node_id: string;
    name: string;
    reason: string;
}

export interface AcceptPathResponse {
    success: boolean;
    batch_id: string;
    path_id: string;
    path_name: string;
    created_nodes: CreatedNode[];
    generation_jobs: GenerationJobInfo[];
    skipped_nodes: SkippedNode[];
    total_new_nodes: number;
    total_jobs: number;
}

export interface BatchStatusResponse {
    batch_id: string;
    overall_progress: number;
    completed_count: number;
    failed_count: number;
    total_count: number;
    all_completed: boolean;
    jobs: GenerationJobInfo[];
}

export type NodeGenerationStatus = "pending" | "generating" | "ready" | "failed";

export interface NodeStatus {
    status: NodeGenerationStatus;
    course_id?: string;
    progress?: number;
    message?: string;
    error?: string;
}

export interface NodesStatusResponse {
    nodes: Record<string, NodeStatus>;
}

class ContentApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = CONTENT_API_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Create a content generation job for a map node
     */
    async createJob(
        nodeId: string,
        generationType: GenerationType = "full_course",
        options?: Record<string, unknown>
    ): Promise<CreateJobResponse> {
        const response = await fetch(`${this.baseUrl}/content/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                node_id: nodeId,
                generation_type: generationType,
                options,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || `Failed to create job: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get the status of a content generation job
     */
    async getJobStatus(jobId: string): Promise<ContentJob> {
        const response = await fetch(`${this.baseUrl}/content/status/${jobId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || `Failed to get job status: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * List content generation jobs
     */
    async listJobs(options?: {
        nodeId?: string;
        status?: JobStatus;
        limit?: number;
    }): Promise<ListJobsResponse> {
        const params = new URLSearchParams();
        if (options?.nodeId) params.append("node_id", options.nodeId);
        if (options?.status) params.append("status", options.status);
        if (options?.limit) params.append("limit", options.limit.toString());

        const response = await fetch(`${this.baseUrl}/content/jobs?${params}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to list jobs: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Retry a failed job
     */
    async retryJob(jobId: string): Promise<{ job_id: string; status: string; message: string }> {
        const response = await fetch(`${this.baseUrl}/content/retry/${jobId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || `Failed to retry job: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Accept an Oracle path and start content generation for new nodes
     */
    async acceptPath(path: OraclePath, domain: string): Promise<AcceptPathResponse> {
        const response = await fetch(`${this.baseUrl}/api/path/accept`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ path, domain }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || `Failed to accept path: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get status of all jobs in a batch
     */
    async getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
        const response = await fetch(`${this.baseUrl}/api/content/status/batch`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ batch_id: batchId }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || `Failed to get batch status: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get generation status for multiple map nodes
     */
    async getNodesStatus(nodeIds: string[]): Promise<NodesStatusResponse> {
        if (nodeIds.length === 0) {
            return { nodes: {} };
        }

        const response = await fetch(
            `${this.baseUrl}/api/nodes/status?ids=${nodeIds.join(",")}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || `Failed to get nodes status: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
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
export const contentApi = new ContentApiClient();

// Export class for testing/custom instances
export { ContentApiClient };
