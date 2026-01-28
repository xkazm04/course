/**
 * Content Generator API Client
 * Communicates with the Content Generator Cloud Function for course content generation
 *
 * Features:
 * - Automatic retry with exponential backoff for transient failures
 * - Error surfacing to UI via ProgressNotifications
 * - Graceful degradation for non-critical operations
 */

import type { OraclePath } from "./oracleApi";
import type { NodeGenerationStatus } from "./types";
import {
    fetchWithRetryGet,
    fetchWithRetryPost,
    type ApiResult,
    type RetryConfig,
} from "./apiUtils";

// Re-export for backward compatibility
export type { NodeGenerationStatus };

// Use local API as fallback if external content generator is not configured
const CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_GENERATOR_URL || "";

// Retry configuration for content API - be more aggressive for content generation
const CONTENT_RETRY_CONFIG: Partial<RetryConfig> = {
    maxRetries: 3,
    baseDelayMs: 2000, // Start with 2s delay
    maxDelayMs: 15000, // Max 15s delay
};

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

// NodeGenerationStatus imported from ./types (canonical definition)

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
     * Uses retry logic with error notification
     */
    async createJob(
        nodeId: string,
        generationType: GenerationType = "full_course",
        options?: Record<string, unknown>
    ): Promise<CreateJobResponse> {
        const result = await fetchWithRetryPost<CreateJobResponse>(
            `${this.baseUrl}/content/generate`,
            {
                node_id: nodeId,
                generation_type: generationType,
                options,
            },
            {
                retryConfig: CONTENT_RETRY_CONFIG,
                context: "Content Generation",
                notifyOnError: true,
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Failed to create job");
        }

        return result.data;
    }

    /**
     * Get the status of a content generation job
     * Uses retry logic - job status is important for progress tracking
     */
    async getJobStatus(jobId: string): Promise<ContentJob> {
        const result = await fetchWithRetryGet<ContentJob>(
            `${this.baseUrl}/content/status/${jobId}`,
            {
                retryConfig: { maxRetries: 2, baseDelayMs: 1000, maxDelayMs: 5000, backoffMultiplier: 2, retryableStatuses: [408, 429, 500, 502, 503, 504] },
                context: "Job Status",
                notifyOnError: true,
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Failed to get job status");
        }

        return result.data;
    }

    /**
     * List content generation jobs
     * Uses retry logic for reliability
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

        const result = await fetchWithRetryGet<ListJobsResponse>(
            `${this.baseUrl}/content/jobs?${params}`,
            {
                retryConfig: { maxRetries: 2, baseDelayMs: 1000, maxDelayMs: 5000, backoffMultiplier: 2, retryableStatuses: [408, 429, 500, 502, 503, 504] },
                context: "List Jobs",
                notifyOnError: true,
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Failed to list jobs");
        }

        return result.data;
    }

    /**
     * Retry a failed job
     * Uses retry logic - retrying a job is an important user action
     */
    async retryJob(jobId: string): Promise<{ job_id: string; status: string; message: string }> {
        const result = await fetchWithRetryPost<{ job_id: string; status: string; message: string }>(
            `${this.baseUrl}/content/retry/${jobId}`,
            {},
            {
                retryConfig: CONTENT_RETRY_CONFIG,
                context: "Retry Job",
                notifyOnError: true,
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Failed to retry job");
        }

        return result.data;
    }

    /**
     * Accept an Oracle path and save to Supabase
     * Always uses local API route for path acceptance
     * Uses retry logic - path acceptance is a critical user action
     */
    async acceptPath(path: OraclePath, domain: string): Promise<AcceptPathResponse> {
        const result = await fetchWithRetryPost<AcceptPathResponse>(
            "/api/oracle/accept-path",
            { path, domain },
            {
                retryConfig: CONTENT_RETRY_CONFIG,
                context: "Accept Learning Path",
                notifyOnError: true,
                timeoutMs: 60000, // 60s timeout for path acceptance
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Failed to accept path");
        }

        return result.data;
    }

    /**
     * Get status of all jobs in a batch
     * Uses LOCAL NextJS API against Supabase
     * Uses retry logic for reliability
     */
    async getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
        const result = await fetchWithRetryPost<BatchStatusResponse>(
            "/api/content/batch-status",
            { batch_id: batchId },
            {
                retryConfig: { maxRetries: 2, baseDelayMs: 1000, maxDelayMs: 5000, backoffMultiplier: 2, retryableStatuses: [408, 429, 500, 502, 503, 504] },
                context: "Batch Status",
                notifyOnError: true,
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Failed to get batch status");
        }

        return result.data;
    }

    /**
     * Get generation status for multiple map nodes
     * Uses LOCAL NextJS API against Supabase (not external cloud function)
     * Returns empty result on failure to avoid blocking the map UI
     * Uses silent retry - this is polled frequently so we don't want to spam errors
     */
    async getNodesStatus(nodeIds: string[]): Promise<NodesStatusResponse> {
        if (nodeIds.length === 0) {
            return { nodes: {} };
        }

        const result = await fetchWithRetryGet<NodesStatusResponse>(
            `/api/nodes/status?ids=${nodeIds.join(",")}`,
            {
                retryConfig: { maxRetries: 1, baseDelayMs: 500, maxDelayMs: 2000, backoffMultiplier: 2, retryableStatuses: [408, 429, 500, 502, 503, 504] },
                context: "Node Status",
                notifyOnError: false, // Silent - this is polled frequently
                silentRetry: true,
            }
        );

        // Return empty result on failure to avoid blocking UI
        if (!result.success || !result.data) {
            console.warn("Failed to fetch node statuses:", result.error?.message);
            return { nodes: {} };
        }

        return result.data;
    }

    /**
     * Get generation status with result wrapper
     * Alternative method that returns ApiResult for more control
     */
    async getNodesStatusSafe(nodeIds: string[]): Promise<ApiResult<NodesStatusResponse>> {
        if (nodeIds.length === 0) {
            return { data: { nodes: {} }, error: null, success: true };
        }

        return fetchWithRetryGet<NodesStatusResponse>(
            `/api/nodes/status?ids=${nodeIds.join(",")}`,
            {
                retryConfig: { maxRetries: 1, baseDelayMs: 500, maxDelayMs: 2000, backoffMultiplier: 2, retryableStatuses: [408, 429, 500, 502, 503, 504] },
                context: "Node Status",
                notifyOnError: false,
            }
        );
    }

    /**
     * Health check
     * Uses retry logic for reliability
     */
    async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
        const result = await fetchWithRetryGet<{ status: string; service: string; timestamp: string }>(
            `${this.baseUrl}/health`,
            {
                retryConfig: { maxRetries: 2, baseDelayMs: 1000, maxDelayMs: 5000, backoffMultiplier: 2, retryableStatuses: [408, 429, 500, 502, 503, 504] },
                context: "Health Check",
                notifyOnError: false, // Health checks should be silent
            }
        );

        if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Health check failed");
        }

        return result.data;
    }
}

// Export singleton instance
export const contentApi = new ContentApiClient();

// Export class for testing/custom instances
export { ContentApiClient };
