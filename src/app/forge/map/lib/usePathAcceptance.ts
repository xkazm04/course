"use client";

/**
 * usePathAcceptance Hook
 * Handles accepting Oracle paths and polling for generation status
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { contentApi } from "./contentApi";
import type {
    AcceptPathResponse,
    BatchStatusResponse,
    GenerationJobInfo,
} from "./contentApi";
import type { OraclePath } from "./oracleApi";

export type AcceptancePhase =
    | "idle"
    | "accepting"
    | "generating"
    | "completed"
    | "error";

export interface PathAcceptanceState {
    phase: AcceptancePhase;
    batchId: string | null;
    acceptResponse: AcceptPathResponse | null;
    batchStatus: BatchStatusResponse | null;
    overallProgress: number;
    error: string | null;
    completedJobs: GenerationJobInfo[];
    failedJobs: GenerationJobInfo[];
}

const POLL_INTERVAL = 3000; // 3 seconds

export function usePathAcceptance() {
    const [state, setState] = useState<PathAcceptanceState>({
        phase: "idle",
        batchId: null,
        acceptResponse: null,
        batchStatus: null,
        overallProgress: 0,
        error: null,
        completedJobs: [],
        failedJobs: [],
    });

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    // Poll for batch status
    const pollBatchStatus = useCallback(async (batchId: string) => {
        if (!isMountedRef.current) return;

        try {
            const status = await contentApi.getBatchStatus(batchId);

            if (!isMountedRef.current) return;

            setState((prev) => ({
                ...prev,
                batchStatus: status,
                overallProgress: status.overall_progress,
                completedJobs: status.jobs.filter((j) => j.status === "completed"),
                failedJobs: status.jobs.filter((j) => j.status === "failed"),
                phase: status.all_completed ? "completed" : "generating",
            }));

            // Stop polling if all jobs are done
            if (status.all_completed && pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        } catch (error) {
            console.error("Error polling batch status:", error);
            // Don't stop polling on error, just log it
        }
    }, []);

    // Start polling
    const startPolling = useCallback(
        (batchId: string) => {
            // Clear any existing polling
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }

            // Poll immediately
            pollBatchStatus(batchId);

            // Then poll at interval
            pollIntervalRef.current = setInterval(() => {
                pollBatchStatus(batchId);
            }, POLL_INTERVAL);
        },
        [pollBatchStatus]
    );

    // Accept a path
    const acceptPath = useCallback(
        async (path: OraclePath, domain: string) => {
            // Clear any existing polling
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }

            setState({
                phase: "accepting",
                batchId: null,
                acceptResponse: null,
                batchStatus: null,
                overallProgress: 0,
                error: null,
                completedJobs: [],
                failedJobs: [],
            });

            try {
                const response = await contentApi.acceptPath(path, domain);

                if (!isMountedRef.current) return;

                setState((prev) => ({
                    ...prev,
                    phase: response.total_jobs > 0 ? "generating" : "completed",
                    batchId: response.batch_id,
                    acceptResponse: response,
                    overallProgress: response.total_jobs > 0 ? 0 : 100,
                }));

                // Start polling if there are jobs
                if (response.total_jobs > 0) {
                    startPolling(response.batch_id);
                }

                return response;
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : "Failed to accept path";

                if (!isMountedRef.current) return;

                setState((prev) => ({
                    ...prev,
                    phase: "error",
                    error: errorMessage,
                }));

                throw error;
            }
        },
        [startPolling]
    );

    // Reset state
    const reset = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        setState({
            phase: "idle",
            batchId: null,
            acceptResponse: null,
            batchStatus: null,
            overallProgress: 0,
            error: null,
            completedJobs: [],
            failedJobs: [],
        });
    }, []);

    // Retry failed jobs
    const retryFailedJobs = useCallback(async () => {
        const failedJobIds = state.failedJobs.map((j) => j.job_id);
        if (failedJobIds.length === 0) return;

        setState((prev) => ({ ...prev, phase: "generating" }));

        try {
            // Retry each failed job
            await Promise.all(failedJobIds.map((jobId) => contentApi.retryJob(jobId)));

            // Resume polling
            if (state.batchId) {
                startPolling(state.batchId);
            }
        } catch (error) {
            console.error("Error retrying jobs:", error);
            setState((prev) => ({
                ...prev,
                error:
                    error instanceof Error ? error.message : "Failed to retry jobs",
            }));
        }
    }, [state.failedJobs, state.batchId, startPolling]);

    return {
        ...state,
        acceptPath,
        reset,
        retryFailedJobs,
        isAccepting: state.phase === "accepting",
        isGenerating: state.phase === "generating",
        isCompleted: state.phase === "completed",
        hasError: state.phase === "error",
        hasFailed: state.failedJobs.length > 0,
    };
}
