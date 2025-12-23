/**
 * Rating Storage
 *
 * Storage operations for content ratings.
 */

import type { ContentRating } from "../types";
import { STORAGE_KEYS } from "./constants";
import { getStorageItem, setStorageItem } from "./helpers";

/**
 * Save a content rating (without triggering quality metrics update)
 */
export function saveRatingOnly(rating: ContentRating): void {
    const ratings = getStorageItem<ContentRating[]>(STORAGE_KEYS.RATINGS, []);
    const existingIndex = ratings.findIndex((r) => r.id === rating.id);

    if (existingIndex >= 0) {
        ratings[existingIndex] = rating;
    } else {
        ratings.push(rating);
    }

    setStorageItem(STORAGE_KEYS.RATINGS, ratings);
}

/**
 * Get all ratings
 */
export function getAllRatings(): ContentRating[] {
    return getStorageItem<ContentRating[]>(STORAGE_KEYS.RATINGS, []);
}

/**
 * Get ratings for a specific content
 */
export function getRatingsForContent(contentId: string): ContentRating[] {
    const ratings = getAllRatings();
    return ratings.filter((r) => r.contentId === contentId);
}

/**
 * Get average rating for content
 */
export function getAverageRating(contentId: string): number {
    const ratings = getRatingsForContent(contentId);
    if (ratings.length === 0) return 0;

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return sum / ratings.length;
}

/**
 * Check if user has rated content
 */
export function hasUserRated(contentId: string, userId: string): boolean {
    const ratings = getRatingsForContent(contentId);
    return ratings.some((r) => r.userId === userId);
}

/**
 * Get user's rating for content
 */
export function getUserRating(contentId: string, userId: string): ContentRating | undefined {
    const ratings = getRatingsForContent(contentId);
    return ratings.find((r) => r.userId === userId);
}
