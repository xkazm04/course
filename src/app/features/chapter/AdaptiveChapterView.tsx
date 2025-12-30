"use client";

import React, { useMemo, useEffect, useCallback } from "react";
import { ChapterView } from "./ChapterView";
import type { ChapterViewProps, ChapterViewVariantProps } from "./ChapterView";
import {
    AdaptiveContentProvider,
    useAdaptiveContent,
    useAdaptiveSlots,
    ComprehensionIndicator,
    LevelProgress,
} from "../adaptive-content";
import type { ComprehensionLevel } from "../adaptive-content";

// ============================================================================
// Adaptive Chapter View Props
// ============================================================================

export interface AdaptiveChapterViewProps extends ChapterViewProps {
    /**
     * Enable adaptive content density based on comprehension
     * @default true
     */
    enableAdaptation?: boolean;

    /**
     * Initial comprehension level override
     * If not provided, will be calculated from user behavior
     */
    initialLevel?: ComprehensionLevel;

    /**
     * Show the comprehension indicator in the sidebar
     * @default true
     */
    showComprehensionIndicator?: boolean;

    /**
     * Show the level progress card
     * @default false
     */
    showLevelProgress?: boolean;

    /**
     * User ID for persisting comprehension data
     */
    userId?: string;
}

// ============================================================================
// Inner Component with Adaptive Features
// ============================================================================

interface AdaptiveChapterViewInnerProps extends Omit<AdaptiveChapterViewProps, "userId" | "initialLevel"> {
    showComprehensionIndicator: boolean;
    showLevelProgress: boolean;
}

function AdaptiveChapterViewInner({
    showComprehensionIndicator,
    showLevelProgress,
    ...chapterProps
}: AdaptiveChapterViewInnerProps) {
    const adaptive = useAdaptiveContent();

    // Get the current section's topic for adaptive content
    const sectionId = `section-${chapterProps.initialSection ?? 0}`;
    const topic = "React Concepts"; // Could be derived from section data

    const { paceRecommendation, quizParams, comprehensionLevel } = useAdaptiveSlots({
        sectionId,
        topic,
    });

    // Log adaptation changes for debugging in development
    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            console.log("[Adaptive] Comprehension level:", comprehensionLevel);
            console.log("[Adaptive] Pace recommendation:", paceRecommendation);
        }
    }, [comprehensionLevel, paceRecommendation]);

    return (
        <div className="relative" data-testid="adaptive-chapter-view">
            {/* Comprehension Indicator - Fixed position */}
            {showComprehensionIndicator && (
                <div className="fixed top-4 right-4 z-50" data-testid="adaptive-chapter-indicator">
                    <ComprehensionIndicator compact />
                </div>
            )}

            {/* Level Progress - Above content */}
            {showLevelProgress && (
                <div className="mb-6">
                    <LevelProgress />
                </div>
            )}

            {/* Main Chapter Content */}
            <ChapterView {...chapterProps} />
        </div>
    );
}

// ============================================================================
// Adaptive Chapter View Component
// ============================================================================

/**
 * AdaptiveChapterView - ChapterView with intelligent content adaptation
 *
 * This component wraps ChapterView with the AdaptiveContentProvider to enable
 * dynamic content density based on learner behavior. The content automatically
 * reshapes itself to match each learner's comprehension level.
 *
 * @example
 * // Basic usage - enables all adaptive features
 * <AdaptiveChapterView mode="classic" />
 *
 * @example
 * // With initial level override
 * <AdaptiveChapterView
 *   mode="expandable"
 *   initialLevel="beginner"
 *   showLevelProgress
 * />
 *
 * @example
 * // Disable adaptation (uses standard ChapterView)
 * <AdaptiveChapterView
 *   mode="ide"
 *   enableAdaptation={false}
 * />
 */
export function AdaptiveChapterView({
    enableAdaptation = true,
    initialLevel,
    showComprehensionIndicator = true,
    showLevelProgress = false,
    userId,
    courseInfo,
    ...props
}: AdaptiveChapterViewProps) {
    // If adaptation is disabled, just render the standard ChapterView
    if (!enableAdaptation) {
        return <ChapterView courseInfo={courseInfo} {...props} />;
    }

    // Get course ID from props or default
    const courseId = courseInfo?.courseId ?? "default-course";

    return (
        <AdaptiveContentProvider
            courseId={courseId}
            userId={userId}
            initialLevel={initialLevel}
        >
            <AdaptiveChapterViewInner
                courseInfo={courseInfo}
                showComprehensionIndicator={showComprehensionIndicator}
                showLevelProgress={showLevelProgress}
                {...props}
            />
        </AdaptiveContentProvider>
    );
}

// ============================================================================
// Adaptive Mode Renderer Wrapper
// ============================================================================

interface AdaptiveModeRendererProps {
    sectionId: string;
    topic: string;
    children: React.ReactNode;
}

/**
 * Wrapper component for mode renderers to add adaptive content injection
 */
export function AdaptiveModeRenderer({
    sectionId,
    topic,
    children,
}: AdaptiveModeRendererProps) {
    const { enhanceTemplate, paceRecommendation, isAdaptive } = useAdaptiveSlots({
        sectionId,
        topic,
    });

    if (!isAdaptive) {
        return <>{children}</>;
    }

    return (
        <div className="adaptive-mode-wrapper" data-testid="adaptive-mode-wrapper">
            {/* Pace recommendation banner */}
            {paceRecommendation.message && (
                <div
                    className="mb-4 p-3 rounded-lg bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] flex items-center gap-3"
                    data-testid="adaptive-pace-banner"
                >
                    <span className="text-xl">{paceRecommendation.icon}</span>
                    <span className="text-sm text-[var(--forge-text-secondary)]">
                        {paceRecommendation.message}
                    </span>
                </div>
            )}

            {children}
        </div>
    );
}

// ============================================================================
// Exports
// ============================================================================

export default AdaptiveChapterView;
