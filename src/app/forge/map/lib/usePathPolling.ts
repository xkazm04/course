// ============================================================================
// Path Polling Hook - Polls for generation job status updates
// ============================================================================

import { useEffect, useRef, useCallback } from "react";
import { usePathSyncStore, useIsPolling, useGenerationJobs } from "./usePathSyncStore";

const POLL_INTERVAL = 3000; // 3 seconds

interface JobStatusResponse {
    id: string;
    status: string;
    progress_percent?: number;
    progress_message?: string;
    error_message?: string;
    chapter_id?: string;
    completed_at?: string;
}

export function usePathPolling() {
    const isPolling = useIsPolling();
    const jobs = useGenerationJobs();
    const updateFromPoll = usePathSyncStore(state => state.updateFromPoll);
    const setPolling = usePathSyncStore(state => state.setPolling);

    // Use refs to track interval ID and mounted state to prevent memory leaks
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);
    // Track if a poll is currently in progress to prevent overlapping polls
    const isPollingInProgressRef = useRef(false);

    // Use refs for callbacks to avoid stale closures in interval
    const jobsRef = useRef(jobs);
    const updateFromPollRef = useRef(updateFromPoll);
    const setPollingRef = useRef(setPolling);

    // Keep refs in sync with latest values
    useEffect(() => {
        jobsRef.current = jobs;
    }, [jobs]);

    useEffect(() => {
        updateFromPollRef.current = updateFromPoll;
    }, [updateFromPoll]);

    useEffect(() => {
        setPollingRef.current = setPolling;
    }, [setPolling]);

    // Clear any existing interval - helper function
    const clearPollingInterval = useCallback(() => {
        if (intervalIdRef.current !== null) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
        }
    }, []);

    const poll = useCallback(async () => {
        // Prevent overlapping polls
        if (isPollingInProgressRef.current) {
            return;
        }

        const currentJobs = jobsRef.current;
        const jobIds = Object.keys(currentJobs);
        if (jobIds.length === 0) {
            setPollingRef.current(false);
            return;
        }

        // Only poll for jobs that aren't complete
        const pendingJobIds = Object.values(currentJobs)
            .filter(j => j.status === "pending" || j.status === "generating")
            .map(j => j.jobId);

        if (pendingJobIds.length === 0) {
            setPollingRef.current(false);
            return;
        }

        isPollingInProgressRef.current = true;

        try {
            const response = await fetch("/api/content/job-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ job_ids: pendingJobIds }),
            });

            if (!response.ok) {
                console.warn("[PathPolling] Status check failed:", response.status);
                return;
            }

            const data = await response.json();
            const jobStatuses: JobStatusResponse[] = data.jobs || [];

            if (isMountedRef.current && jobStatuses.length > 0) {
                updateFromPollRef.current(jobStatuses);
            }
        } catch (error) {
            console.error("[PathPolling] Error polling job status:", error);
        } finally {
            isPollingInProgressRef.current = false;
        }
    }, []); // No dependencies - uses refs for latest values

    // Start/stop polling based on isPolling state
    useEffect(() => {
        isMountedRef.current = true;

        // Always clear existing interval first to prevent stacking
        clearPollingInterval();

        if (isPolling) {
            // Initial poll immediately
            poll();

            // Set up interval for subsequent polls
            intervalIdRef.current = setInterval(() => {
                if (isMountedRef.current) {
                    poll();
                }
            }, POLL_INTERVAL);
        }

        // Cleanup function - CRITICAL for preventing memory leaks
        return () => {
            isMountedRef.current = false;
            clearPollingInterval();
        };
    }, [isPolling, poll, clearPollingInterval]);

    // Manual refresh
    const refresh = useCallback(() => {
        poll();
    }, [poll]);

    return { refresh };
}
