"use client";

// ============================================================================
// Realtime Chapter Status Hook
// Subscribes to chapter updates for event-driven UI updates
// Replaces polling pattern with Supabase Realtime subscriptions
// ============================================================================

import { useEffect, useState, useCallback } from "react";
import { createClient } from "./client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChapterRealtimeStatus {
    content_status: string | null;
    generated_at: string | null;
    content_metadata: Record<string, unknown> | null;
}

export interface UseRealtimeChapterResult {
    /** Current chapter status from Realtime updates */
    status: ChapterRealtimeStatus | null;
    /** Whether the subscription is active */
    isSubscribed: boolean;
    /** Any subscription error */
    error: string | null;
    /** Manually reconnect the subscription */
    reconnect: () => void;
}

/**
 * Hook to subscribe to real-time chapter status updates
 *
 * @example
 * ```tsx
 * const { status, isSubscribed } = useRealtimeChapterStatus(chapterId);
 *
 * useEffect(() => {
 *     if (status?.content_status === "ready") {
 *         // Content generation complete, refresh data
 *         refetch();
 *     }
 * }, [status]);
 * ```
 */
export function useRealtimeChapterStatus(
    chapterId: string | null
): UseRealtimeChapterResult {
    const [status, setStatus] = useState<ChapterRealtimeStatus | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reconnectKey, setReconnectKey] = useState(0);

    const reconnect = useCallback(() => {
        setReconnectKey((k) => k + 1);
    }, []);

    useEffect(() => {
        if (!chapterId) {
            setStatus(null);
            setIsSubscribed(false);
            return;
        }

        const supabase = createClient();
        let channel: RealtimeChannel | null = null;

        const setupSubscription = () => {
            setError(null);

            channel = supabase
                .channel(`chapter-status-${chapterId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "chapters",
                        filter: `id=eq.${chapterId}`,
                    },
                    (payload) => {
                        // Extract status fields from the update
                        const newRecord = payload.new as Record<string, unknown>;
                        const newStatus: ChapterRealtimeStatus = {
                            content_status: (newRecord.content_status as string) || null,
                            generated_at: (newRecord.generated_at as string) || null,
                            content_metadata: (newRecord.content_metadata as Record<string, unknown>) || null,
                        };
                        setStatus(newStatus);
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

        // Cleanup on unmount or chapterId change
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
            setIsSubscribed(false);
        };
    }, [chapterId, reconnectKey]);

    return { status, isSubscribed, error, reconnect };
}

/**
 * Hook to get initial chapter status and subscribe to updates
 * Combines initial fetch with realtime subscription
 */
export function useChapterStatusWithRealtime(chapterId: string | null) {
    const [initialStatus, setInitialStatus] = useState<ChapterRealtimeStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { status: realtimeStatus, isSubscribed, error, reconnect } = useRealtimeChapterStatus(chapterId);

    // Fetch initial status
    useEffect(() => {
        if (!chapterId) {
            setInitialStatus(null);
            setIsLoading(false);
            return;
        }

        const fetchInitialStatus = async () => {
            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data, error: fetchError } = await supabase
                    .from("chapters")
                    .select("content_status, generated_at, content_metadata")
                    .eq("id", chapterId)
                    .single();

                if (fetchError) {
                    console.error("Failed to fetch initial chapter status:", fetchError);
                } else if (data) {
                    setInitialStatus({
                        content_status: data.content_status,
                        generated_at: data.generated_at,
                        content_metadata: data.content_metadata as Record<string, unknown> | null,
                    });
                }
            } catch (err) {
                console.error("Error fetching chapter status:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialStatus();
    }, [chapterId]);

    // Prefer realtime status if available, fall back to initial
    const currentStatus = realtimeStatus || initialStatus;

    return {
        status: currentStatus,
        isLoading,
        isSubscribed,
        error,
        reconnect,
    };
}
