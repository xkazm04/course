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

    const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    const poll = useCallback(async () => {
        const jobIds = Object.keys(jobs);
        if (jobIds.length === 0) {
            setPolling(false);
            return;
        }

        // Only poll for jobs that aren't complete
        const pendingJobIds = Object.values(jobs)
            .filter(j => j.status === "pending" || j.status === "generating")
            .map(j => j.jobId);

        if (pendingJobIds.length === 0) {
            setPolling(false);
            return;
        }

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
                updateFromPoll(jobStatuses);
            }
        } catch (error) {
            console.error("[PathPolling] Error polling job status:", error);
        }
    }, [jobs, updateFromPoll, setPolling]);

    // Start/stop polling based on isPolling state
    useEffect(() => {
        isMountedRef.current = true;

        const schedulePoll = () => {
            if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
            }

            if (isPolling && isMountedRef.current) {
                pollTimeoutRef.current = setTimeout(async () => {
                    await poll();
                    schedulePoll();
                }, POLL_INTERVAL);
            }
        };

        if (isPolling) {
            // Initial poll immediately
            poll().then(() => schedulePoll());
        }

        return () => {
            isMountedRef.current = false;
            if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
                pollTimeoutRef.current = null;
            }
        };
    }, [isPolling, poll]);

    // Manual refresh
    const refresh = useCallback(() => {
        poll();
    }, [poll]);

    return { refresh };
}
