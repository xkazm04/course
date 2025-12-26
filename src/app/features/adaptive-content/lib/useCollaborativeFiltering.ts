/**
 * useCollaborativeFiltering Hook
 *
 * React hook for integrating collaborative filtering recommendations
 * into the adaptive content system.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { AdaptiveSlot, ComprehensionScore, BehaviorSignal } from "./types";
import type {
    CollaborativeRecommendation,
    LearnerFingerprint,
} from "./collaborativeFiltering";
import {
    generateAdaptiveSlotsWithCollaborativeFiltering,
    trackContentView,
    recordContentImpact,
    type ContentViewTracker,
    type EnhancedAdaptationContext,
} from "./contentAdaptationEngine";
import { getCollectiveStats, loadCollectivePatterns } from "./collectivePatternsStorage";
import { useAdaptiveContentOptional } from "./AdaptiveContentContext";

// ============================================================================
// Types
// ============================================================================

export interface UseCollaborativeFilteringOptions {
    /** Course ID */
    courseId: string;
    /** User ID (optional for guest users) */
    userId?: string;
    /** Enable/disable collaborative filtering */
    enabled?: boolean;
    /** Minimum signals required before enabling CF */
    minSignals?: number;
}

export interface UseCollaborativeFilteringReturn {
    /** Whether collaborative filtering is active */
    isActive: boolean;
    /** Get enhanced adaptive slots for a section */
    getEnhancedSlots: (
        sectionId: string,
        topic: string,
        currentSlots: import("../../chapter/lib/contentSlots").ContentSlot[]
    ) => AdaptiveSlot[];
    /** Track when content is viewed (returns tracker for later impact recording) */
    trackView: (
        slotType: AdaptiveSlot["slotType"],
        sectionId: string,
        topic: string
    ) => ContentViewTracker | null;
    /** Record the impact of previously tracked content */
    recordImpact: (tracker: ContentViewTracker) => void;
    /** Current collective stats */
    stats: {
        totalLearners: number;
        totalPatterns: number;
        mostCommonStruggles: { sectionId: string; topic: string; frequency: number }[];
        mostHelpfulContent: { slotType: string; topic: string; avgImprovement: number }[];
    } | null;
    /** Refresh stats */
    refreshStats: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCollaborativeFiltering(
    options: UseCollaborativeFilteringOptions
): UseCollaborativeFilteringReturn {
    const { courseId, userId, enabled = true, minSignals = 5 } = options;

    // Get adaptive content context if available
    const adaptiveContext = useAdaptiveContentOptional();

    // Stats state
    const [stats, setStats] = useState<UseCollaborativeFilteringReturn["stats"]>(null);

    // Active content trackers
    const activeTrackers = useRef<Map<string, ContentViewTracker>>(new Map());

    // Check if CF should be active
    const signalCount = adaptiveContext?.model.signalHistory.length ?? 0;
    const isActive = enabled && !!userId && signalCount >= minSignals;

    // Refresh stats
    const refreshStats = useCallback(() => {
        try {
            const newStats = getCollectiveStats(courseId);
            setStats(newStats);
        } catch (error) {
            console.warn("Failed to refresh collective stats:", error);
        }
    }, [courseId]);

    // Load stats on mount
    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    // Get enhanced slots with collaborative filtering
    const getEnhancedSlots = useCallback(
        (
            sectionId: string,
            topic: string,
            currentSlots: import("../../chapter/lib/contentSlots").ContentSlot[]
        ): AdaptiveSlot[] => {
            if (!adaptiveContext) {
                return [];
            }

            const context: EnhancedAdaptationContext = {
                sectionId,
                topic,
                currentSlots,
                comprehensionLevel: adaptiveContext.model.overallScore.level,
                config: adaptiveContext.adaptationConfig,
                courseId,
                userId,
                signals: adaptiveContext.model.signalHistory,
                sectionScores: adaptiveContext.model.sectionScores,
                enableCollaborativeFiltering: isActive,
            };

            return generateAdaptiveSlotsWithCollaborativeFiltering(context);
        },
        [adaptiveContext, courseId, userId, isActive]
    );

    // Track content view
    const trackView = useCallback(
        (
            slotType: AdaptiveSlot["slotType"],
            sectionId: string,
            topic: string
        ): ContentViewTracker | null => {
            if (!userId || !adaptiveContext) {
                return null;
            }

            const currentScore = adaptiveContext.model.overallScore.score;
            const tracker = trackContentView(
                courseId,
                userId,
                slotType,
                sectionId,
                topic,
                currentScore
            );

            // Store tracker for later
            const key = `${slotType}-${sectionId}-${topic}`;
            activeTrackers.current.set(key, tracker);

            return tracker;
        },
        [courseId, userId, adaptiveContext]
    );

    // Record impact
    const recordImpact = useCallback(
        (tracker: ContentViewTracker): void => {
            if (!adaptiveContext) {
                return;
            }

            const scoreAfter = adaptiveContext.model.overallScore.score;
            recordContentImpact(tracker, scoreAfter);

            // Remove from active trackers
            const key = `${tracker.slotType}-${tracker.sectionId}-${tracker.topic}`;
            activeTrackers.current.delete(key);

            // Refresh stats after recording
            refreshStats();
        },
        [adaptiveContext, refreshStats]
    );

    return {
        isActive,
        getEnhancedSlots,
        trackView,
        recordImpact,
        stats,
        refreshStats,
    };
}

// ============================================================================
// Helper Hook: Auto-track content views
// ============================================================================

export interface UseContentTrackingOptions {
    courseId: string;
    userId?: string;
    sectionId: string;
    topic: string;
    slotType: AdaptiveSlot["slotType"];
    /** Whether this content is currently visible */
    isVisible: boolean;
    /** Minimum view time in ms before tracking (default 3000) */
    minViewTime?: number;
}

/**
 * Hook to automatically track content views and record impact
 */
export function useContentTracking(options: UseContentTrackingOptions): void {
    const {
        courseId,
        userId,
        sectionId,
        topic,
        slotType,
        isVisible,
        minViewTime = 3000,
    } = options;

    const adaptiveContext = useAdaptiveContentOptional();
    const trackerRef = useRef<ContentViewTracker | null>(null);
    const viewStartRef = useRef<number | null>(null);

    useEffect(() => {
        if (!userId || !adaptiveContext) {
            return;
        }

        if (isVisible) {
            // Start tracking
            viewStartRef.current = Date.now();
            trackerRef.current = trackContentView(
                courseId,
                userId,
                slotType,
                sectionId,
                topic,
                adaptiveContext.model.overallScore.score
            );
        } else if (trackerRef.current && viewStartRef.current) {
            // End tracking
            const viewDuration = Date.now() - viewStartRef.current;

            if (viewDuration >= minViewTime) {
                // Record impact if viewed long enough
                const scoreAfter = adaptiveContext.model.overallScore.score;
                recordContentImpact(trackerRef.current, scoreAfter);
            }

            trackerRef.current = null;
            viewStartRef.current = null;
        }

        // Cleanup on unmount
        return () => {
            if (trackerRef.current && viewStartRef.current) {
                const viewDuration = Date.now() - viewStartRef.current;
                if (viewDuration >= minViewTime && adaptiveContext) {
                    const scoreAfter = adaptiveContext.model.overallScore.score;
                    recordContentImpact(trackerRef.current, scoreAfter);
                }
            }
        };
    }, [
        isVisible,
        courseId,
        userId,
        sectionId,
        topic,
        slotType,
        minViewTime,
        adaptiveContext,
    ]);
}

// ============================================================================
// Helper Hook: Similar Learners Count
// ============================================================================

export interface UseSimilarLearnersReturn {
    count: number;
    loading: boolean;
}

/**
 * Get count of similar learners for social proof
 */
export function useSimilarLearners(
    courseId: string,
    userId?: string
): UseSimilarLearnersReturn {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const adaptiveContext = useAdaptiveContentOptional();

    useEffect(() => {
        if (!userId || !adaptiveContext) {
            setLoading(false);
            return;
        }

        try {
            const patterns = loadCollectivePatterns(courseId);
            // Count fingerprints as proxy for similar learners
            setCount(patterns.learnerCount);
        } catch (error) {
            console.warn("Failed to load similar learners count:", error);
        }

        setLoading(false);
    }, [courseId, userId, adaptiveContext]);

    return { count, loading };
}
