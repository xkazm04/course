/**
 * useContentGeneration Hook
 * React hook for managing content generation state with polling
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
    contentApi,
    ContentJob,
    GenerationType,
    GeneratedContent,
    JobStatus,
} from "./contentApi";

export interface ContentGenerationState {
    jobId: string | null;
    status: JobStatus | "idle";
    progress: number;
    progressMessage: string | null;
    generatedContent: GeneratedContent | null;
    generatedCourseId: string | null;
    isLoading: boolean;
    error: string | null;
}

export interface ContentGenerationActions {
    generate: (nodeId: string, type?: GenerationType) => Promise<void>;
    retry: () => Promise<void>;
    reset: () => void;
    checkStatus: () => Promise<void>;
}

const initialState: ContentGenerationState = {
    jobId: null,
    status: "idle",
    progress: 0,
    progressMessage: null,
    generatedContent: null,
    generatedCourseId: null,
    isLoading: false,
    error: null,
};

const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds

export function useContentGeneration(): [ContentGenerationState, ContentGenerationActions] {
    const [state, setState] = useState<ContentGenerationState>(initialState);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentJobIdRef = useRef<string | null>(null);

    // Clean up polling on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    /**
     * Start polling for job status
     */
    const startPolling = useCallback((jobId: string) => {
        // Clear any existing interval
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        currentJobIdRef.current = jobId;

        pollIntervalRef.current = setInterval(async () => {
            if (!currentJobIdRef.current) {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }
                return;
            }

            try {
                const job: ContentJob = await contentApi.getJobStatus(currentJobIdRef.current);

                setState(prev => ({
                    ...prev,
                    status: job.status,
                    progress: job.progress_percent,
                    progressMessage: job.progress_message || null,
                    generatedContent: job.generated_content || null,
                    generatedCourseId: job.generated_course_id || null,
                    error: job.error_message || null,
                }));

                // Stop polling if job is complete or failed
                if (job.status === "completed" || job.status === "failed") {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    currentJobIdRef.current = null;
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                console.error("Error polling job status:", error);
                // Don't stop polling on transient errors, but update error state
                setState(prev => ({
                    ...prev,
                    error: error instanceof Error ? error.message : "Failed to check status",
                }));
            }
        }, POLL_INTERVAL_MS);
    }, []);

    /**
     * Start content generation for a node
     */
    const generate = useCallback(async (
        nodeId: string,
        type: GenerationType = "full_course"
    ) => {
        setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
            status: "pending",
            progress: 0,
            progressMessage: "Starting content generation...",
            generatedContent: null,
            generatedCourseId: null,
        }));

        try {
            const response = await contentApi.createJob(nodeId, type);

            setState(prev => ({
                ...prev,
                jobId: response.job_id,
                status: response.status,
                progressMessage: response.message,
            }));

            // Start polling for status updates
            startPolling(response.job_id);
        } catch (error) {
            setState(prev => ({
                ...prev,
                status: "idle",
                isLoading: false,
                error: error instanceof Error ? error.message : "Failed to start generation",
            }));
        }
    }, [startPolling]);

    /**
     * Retry a failed job
     */
    const retry = useCallback(async () => {
        if (!state.jobId) {
            setState(prev => ({ ...prev, error: "No job to retry" }));
            return;
        }

        setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
            status: "pending",
            progress: 0,
            progressMessage: "Retrying content generation...",
        }));

        try {
            await contentApi.retryJob(state.jobId);
            startPolling(state.jobId);
        } catch (error) {
            setState(prev => ({
                ...prev,
                status: "failed",
                isLoading: false,
                error: error instanceof Error ? error.message : "Failed to retry",
            }));
        }
    }, [state.jobId, startPolling]);

    /**
     * Manually check job status
     */
    const checkStatus = useCallback(async () => {
        if (!state.jobId) {
            return;
        }

        try {
            const job = await contentApi.getJobStatus(state.jobId);
            setState(prev => ({
                ...prev,
                status: job.status,
                progress: job.progress_percent,
                progressMessage: job.progress_message || null,
                generatedContent: job.generated_content || null,
                generatedCourseId: job.generated_course_id || null,
                error: job.error_message || null,
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : "Failed to check status",
            }));
        }
    }, [state.jobId]);

    /**
     * Reset to initial state
     */
    const reset = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        currentJobIdRef.current = null;
        setState(initialState);
    }, []);

    return [
        state,
        { generate, retry, reset, checkStatus },
    ];
}
