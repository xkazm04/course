/**
 * Quality Metrics
 *
 * Functions for calculating and updating content quality metrics.
 */

import type { ContentQualityMetrics } from "../types";
import { STORAGE_KEYS } from "./constants";
import { getStorageItem, setStorageItem } from "./helpers";
import { getAllChapters } from "./chapterStorage";
import { getRatingsForContent } from "./ratingStorage";
import { getForksOfChapter } from "./forkStorage";

/**
 * Update quality metrics for a chapter
 */
export function updateQualityMetrics(chapterId: string): void {
    const chapters = getAllChapters();
    const chapter = chapters.find((c) => c.id === chapterId);

    if (!chapter) return;

    const ratings = getRatingsForContent(chapterId);
    const forks = getForksOfChapter(chapterId);

    // Calculate metrics
    const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    // Update chapter metrics
    chapter.qualityMetrics = {
        ...chapter.qualityMetrics,
        ratingCount: ratings.length,
        averageRating: Math.round(avgRating * 10) / 10,
        forkCount: forks.length,
        overallScore: calculateOverallScore(chapter.qualityMetrics, avgRating, ratings.length),
        trend: determineTrend(chapter.qualityMetrics, avgRating),
    };

    setStorageItem(STORAGE_KEYS.CHAPTERS, chapters);
}

/**
 * Update fork count for a chapter
 */
export function updateForkCount(chapterId: string): void {
    const chapters = getAllChapters();
    const chapter = chapters.find((c) => c.id === chapterId);

    if (chapter) {
        const forks = getForksOfChapter(chapterId);
        chapter.qualityMetrics.forkCount = forks.length;
        setStorageItem(STORAGE_KEYS.CHAPTERS, chapters);
    }
}

/**
 * Calculate overall quality score
 */
export function calculateOverallScore(
    currentMetrics: ContentQualityMetrics,
    avgRating: number,
    ratingCount: number
): number {
    const weights = {
        rating: 0.4,
        completion: 0.3,
        quizPass: 0.2,
        engagement: 0.1,
    };

    let score = 0;

    // Rating component (0-100)
    if (ratingCount > 0) {
        score += (avgRating / 5) * 100 * weights.rating;
    }

    // Completion rate component
    score += currentMetrics.completionRate * weights.completion;

    // Quiz pass rate component
    score += currentMetrics.quizPassRate * weights.quizPass;

    // Engagement component (based on fork count)
    const engagementScore = Math.min(currentMetrics.forkCount * 10, 100);
    score += engagementScore * weights.engagement;

    return Math.round(score);
}

/**
 * Determine trend based on recent ratings
 */
export function determineTrend(
    currentMetrics: ContentQualityMetrics,
    newAvgRating: number
): ContentQualityMetrics["trend"] {
    const ratingDiff = newAvgRating - currentMetrics.averageRating;

    if (Math.abs(ratingDiff) < 0.2) {
        return "stable";
    }

    return ratingDiff > 0 ? "improving" : "declining";
}
