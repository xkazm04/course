"use client";

// ============================================================================
// Realtime Job Progress Hook
// Subscribes to chapter_content_jobs updates for live progress tracking
// ============================================================================

import { useEffect, useState, useCallback } from "react";
import { createClient } from "./client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface JobProgress {
    status: "pending" | "processing" | "completed" | "failed" | "cancelled";
    progress_percent: number;
    progress_message: string | null;
    error_message: string | null;
    started_at: string | null;
    completed_at: string | null;
}

export interface UseRealtimeJobProgressResult {
    /** Current job progress from Realtime updates */
    progress: JobProgress | null;
    /** Whether the subscription is active */
    isSubscribed: boolean;
    /** Any subscription error */
    error: string | null;
}

/**
 * Hook to subscribe to real-time job progress updates
 *
 * @example
 * ```tsx
 * const { progress, isSubscribed } = useRealtimeJobProgress(jobId);
 *
 * return (
 *     <div>
 *         <ProgressBar value={progress?.progress_percent || 0} />
 *         <p>{progress?.progress_message}</p>
 *     </div>
 * );
 * ```
 */
export function useRealtimeJobProgress(
    jobId: string | null
): UseRealtimeJobProgressResult {
    const [progress, setProgress] = useState<JobProgress | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!jobId) {
            setProgress(null);
            setIsSubscribed(false);
            return;
        }

        const supabase = createClient();
        let channel: RealtimeChannel | null = null;

        const setupSubscription = () => {
            setError(null);

            channel = supabase
                .channel(`job-progress-${jobId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "chapter_content_jobs",
                        filter: `id=eq.${jobId}`,
                    },
                    (payload) => {
                        const newRecord = payload.new as Record<string, unknown>;
                        const newProgress: JobProgress = {
                            status: (newRecord.status as JobProgress["status"]) || "pending",
                            progress_percent: (newRecord.progress_percent as number) || 0,
                            progress_message: (newRecord.progress_message as string) || null,
                            error_message: (newRecord.error_message as string) || null,
                            started_at: (newRecord.started_at as string) || null,
                            completed_at: (newRecord.completed_at as string) || null,
                        };
                        setProgress(newProgress);
                    }
                )
                .subscribe((subscriptionStatus, err) => {
                    if (subscriptionStatus === "SUBSCRIBED") {
                        setIsSubscribed(true);
                        setError(null);
                    } else if (subscriptionStatus === "CHANNEL_ERROR") {
                        setIsSubscribed(false);
                        setError(err?.message || "Subscription error");
                    } else if (subscriptionStatus === "CLOSED") {
                        setIsSubscribed(false);
                    }
                });
        };

        setupSubscription();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
            setIsSubscribed(false);
        };
    }, [jobId]);

    return { progress, isSubscribed, error };
}

/**
 * Hook to subscribe to job progress by chapter ID
 * Useful when you don't have the job ID but know the chapter
 */
export function useRealtimeJobProgressByChapter(
    chapterId: string | null
): UseRealtimeJobProgressResult & { jobId: string | null } {
    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState<JobProgress | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!chapterId) {
            setJobId(null);
            setProgress(null);
            setIsSubscribed(false);
            return;
        }

        const supabase = createClient();
        let channel: RealtimeChannel | null = null;

        const setupSubscription = () => {
            setError(null);

            // Subscribe to all jobs for this chapter
            channel = supabase
                .channel(`chapter-jobs-${chapterId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*", // INSERT, UPDATE, DELETE
                        schema: "public",
                        table: "chapter_content_jobs",
                        filter: `chapter_id=eq.${chapterId}`,
                    },
                    (payload) => {
                        const newRecord = payload.new as Record<string, unknown>;

                        // Track the job ID
                        if (newRecord.id) {
                            setJobId(newRecord.id as string);
                        }

                        const newProgress: JobProgress = {
                            status: (newRecord.status as JobProgress["status"]) || "pending",
                            progress_percent: (newRecord.progress_percent as number) || 0,
                            progress_message: (newRecord.progress_message as string) || null,
                            error_message: (newRecord.error_message as string) || null,
                            started_at: (newRecord.started_at as string) || null,
                            completed_at: (newRecord.completed_at as string) || null,
                        };
                        setProgress(newProgress);
                    }
                )
                .subscribe((subscriptionStatus, err) => {
                    if (subscriptionStatus === "SUBSCRIBED") {
                        setIsSubscribed(true);
                        setError(null);
                    } else if (subscriptionStatus === "CHANNEL_ERROR") {
                        setIsSubscribed(false);
                        setError(err?.message || "Subscription error");
                    } else if (subscriptionStatus === "CLOSED") {
                        setIsSubscribed(false);
                    }
                });
        };

        setupSubscription();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
            setIsSubscribed(false);
        };
    }, [chapterId]);

    return { progress, isSubscribed, error, jobId };
}
