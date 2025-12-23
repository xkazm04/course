/**
 * Content Annotations Hook
 *
 * Hook for managing content annotations.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { ContentAnnotation } from "../types";
import {
    saveAnnotation,
    getPublicAnnotations,
    getUserAnnotations,
    upvoteAnnotation,
} from "../pathStorage";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Hook for managing content annotations
 */
export function useContentAnnotations(contentId: string) {
    const [annotations, setAnnotations] = useState<ContentAnnotation[]>([]);
    const [userAnnotations, setUserAnnotations] = useState<ContentAnnotation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userId } = useCurrentUser();

    // Load annotations
    useEffect(() => {
        const publicAnnotations = getPublicAnnotations(contentId);
        const userAnns = getUserAnnotations(userId).filter(
            (a) => a.contentId === contentId
        );

        // Combine and dedupe
        const allAnnotations = [...publicAnnotations];
        userAnns.forEach((ua) => {
            if (!allAnnotations.some((a) => a.id === ua.id)) {
                allAnnotations.push(ua);
            }
        });

        setAnnotations(allAnnotations);
        setUserAnnotations(userAnns);
        setIsLoading(false);
    }, [contentId, userId]);

    /**
     * Add a new annotation
     */
    const addAnnotation = useCallback(
        (
            selectedContent: string,
            startOffset: number,
            endOffset: number,
            annotationText: string,
            annotationType: ContentAnnotation["annotationType"],
            visibility: ContentAnnotation["visibility"] = "private"
        ) => {
            const annotation: ContentAnnotation = {
                id: `ann_${Date.now()}`,
                contentId,
                userId,
                annotationType,
                selectedContent,
                startOffset,
                endOffset,
                annotationText,
                visibility,
                upvotes: 0,
                createdAt: new Date().toISOString(),
                incorporated: false,
            };

            saveAnnotation(annotation);

            setAnnotations((prev) => [...prev, annotation]);
            setUserAnnotations((prev) => [...prev, annotation]);
        },
        [contentId, userId]
    );

    /**
     * Upvote a public annotation
     */
    const upvote = useCallback((annotationId: string) => {
        upvoteAnnotation(annotationId);

        setAnnotations((prev) =>
            prev.map((a) =>
                a.id === annotationId ? { ...a, upvotes: a.upvotes + 1 } : a
            )
        );
    }, []);

    /**
     * Get annotations for a specific range
     */
    const getAnnotationsInRange = useCallback(
        (start: number, end: number) => {
            return annotations.filter(
                (a) =>
                    (a.startOffset >= start && a.startOffset <= end) ||
                    (a.endOffset >= start && a.endOffset <= end) ||
                    (a.startOffset <= start && a.endOffset >= end)
            );
        },
        [annotations]
    );

    return {
        annotations,
        userAnnotations,
        isLoading,
        addAnnotation,
        upvote,
        getAnnotationsInRange,
    };
}
