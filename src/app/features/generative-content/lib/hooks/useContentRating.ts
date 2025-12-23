/**
 * Content Rating Hook
 *
 * Hook for rating content.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { ContentRating } from "../types";
import {
    saveRating,
    getRatingsForContent,
    getUserRating,
    updateQualityMetrics,
} from "../pathStorage";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Hook for rating content
 */
export function useContentRating(contentId: string) {
    const [ratings, setRatings] = useState<ContentRating[]>([]);
    const [userRating, setUserRating] = useState<ContentRating | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { userId } = useCurrentUser();

    // Load ratings
    useEffect(() => {
        const loadedRatings = getRatingsForContent(contentId);
        setRatings(loadedRatings);

        const existingUserRating = getUserRating(contentId, userId);
        setUserRating(existingUserRating || null);

        setIsLoading(false);
    }, [contentId, userId]);

    /**
     * Calculate average rating
     */
    const averageRating = useMemo(() => {
        if (ratings.length === 0) return 0;
        return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    }, [ratings]);

    /**
     * Submit or update a rating
     */
    const submitRating = useCallback(
        (
            rating: number,
            feedback: ContentRating["feedback"],
            comments?: string,
            issues?: ContentRating["issues"]
        ) => {
            const ratingId = userRating?.id || `rating_${Date.now()}`;

            const newRating: ContentRating = {
                id: ratingId,
                contentId,
                contentType: "chapter",
                userId,
                rating,
                feedback,
                comments,
                issues,
                createdAt: new Date().toISOString(),
            };

            saveRating(newRating);
            setUserRating(newRating);

            // Update ratings list
            const updatedRatings = getRatingsForContent(contentId);
            setRatings(updatedRatings);

            // Update quality metrics
            updateQualityMetrics(contentId);
        },
        [contentId, userId, userRating]
    );

    /**
     * Check if user has already rated
     */
    const hasRated = useMemo(() => userRating !== null, [userRating]);

    return {
        ratings,
        userRating,
        averageRating,
        ratingCount: ratings.length,
        hasRated,
        isLoading,
        submitRating,
    };
}
