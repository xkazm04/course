"use client";

/**
 * Hook to fetch and manage lesson content
 */

import { useState, useEffect, useCallback } from "react";
import type { FullLesson } from "./types";

interface UseLessonContentOptions {
    /** Node ID or slug to fetch */
    nodeId: string;
    /** Whether to fetch immediately on mount */
    immediate?: boolean;
}

interface UseLessonContentReturn {
    /** The fetched lesson data */
    lesson: FullLesson | null;
    /** Loading state */
    loading: boolean;
    /** Error message if fetch failed */
    error: string | null;
    /** Refetch the lesson */
    refetch: () => Promise<void>;
}

export function useLessonContent({
    nodeId,
    immediate = true,
}: UseLessonContentOptions): UseLessonContentReturn {
    const [lesson, setLesson] = useState<FullLesson | null>(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState<string | null>(null);

    const fetchLesson = useCallback(async () => {
        if (!nodeId) {
            setError("No node ID provided");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/lessons/${nodeId}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch lesson: ${response.status}`);
            }

            const data = await response.json();
            setLesson(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setLesson(null);
        } finally {
            setLoading(false);
        }
    }, [nodeId]);

    useEffect(() => {
        if (immediate) {
            fetchLesson();
        }
    }, [immediate, fetchLesson]);

    return {
        lesson,
        loading,
        error,
        refetch: fetchLesson,
    };
}

/**
 * Fetch a list of available lessons (for navigation)
 */
export function useLessonList(domainId: string = "frontend") {
    const [lessons, setLessons] = useState<Array<{ id: string; slug: string; name: string; parent_name: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLessons() {
            try {
                const response = await fetch(`/api/map-nodes?domain=${domainId}&depth=4&limit=50`);
                if (response.ok) {
                    const data = await response.json();
                    setLessons(data.nodes || []);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch lessons");
            } finally {
                setLoading(false);
            }
        }

        fetchLessons();
    }, [domainId]);

    return { lessons, loading, error };
}
