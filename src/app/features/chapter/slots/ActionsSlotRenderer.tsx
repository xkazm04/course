"use client";

import React, { useMemo, memo } from "react";
import { ThumbsUp } from "lucide-react";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { cn, buttonSizeClasses } from "@/app/shared/lib/utils";
import { BookmarkButton } from "@/app/features/bookmarks";
// Import directly from specific files to avoid circular dependency with chapterLayoutEngine
import { getSimplifiedSections } from "../lib/chapterData";
import type { ActionsSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

export interface ActionsSlotRendererProps {
    slot: ActionsSlot;
    state: ChapterState;
    className?: string;
}

/**
 * ActionsSlotRenderer - Renders action buttons (bookmark, like)
 *
 * Memoized to prevent re-renders when unrelated ChapterState properties change.
 * Only re-renders when action-specific state changes (courseInfo, currentSection).
 */
const ActionsSlotRendererComponent: React.FC<ActionsSlotRendererProps> = ({ slot, state, className }) => {
    const { data } = slot;
    const { courseInfo, currentSection } = state;

    // Memoize slot data defaults
    const actionsConfig = useMemo(() => ({
        showBookmark: data?.showBookmark ?? true,
        showLike: data?.showLike ?? true,
        variant: data?.variant ?? "full",
    }), [data?.showBookmark, data?.showLike, data?.variant]);

    const { showBookmark, showLike, variant } = actionsConfig;

    // Memoize sections lookup
    const sections = useMemo(() => getSimplifiedSections(), []);

    // Memoize current section data
    const currentSectionData = useMemo(() => sections[currentSection], [sections, currentSection]);

    return (
        <div className={cn("flex gap-2", className)} data-testid={`actions-slot-${slot.id}`}>
            {showBookmark && (
                <BookmarkButton
                    courseId={courseInfo.courseId}
                    courseName={courseInfo.courseName}
                    chapterId={courseInfo.chapterId}
                    chapterTitle={courseInfo.chapterTitle}
                    sectionId={currentSectionData?.id ?? ""}
                    sectionTitle={currentSectionData?.title ?? ""}
                    variant={variant}
                    className="flex-1"
                />
            )}
            {showLike && (
                <button
                    className={cn(
                        buttonSizeClasses.md,
                        "flex-1 bg-[var(--surface-overlay)] border border-[var(--border-strong)] rounded-xl font-medium text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors flex items-center justify-center gap-2"
                    )}
                    data-testid="actions-slot-like-btn"
                >
                    <ThumbsUp size={ICON_SIZES.sm} /> Like
                </button>
            )}
        </div>
    );
};

/**
 * Custom comparison function for ActionsSlotRenderer
 * Only re-renders when action-specific props change
 */
function areActionsPropsEqual(
    prevProps: ActionsSlotRendererProps,
    nextProps: ActionsSlotRendererProps
): boolean {
    if (prevProps.slot.id !== nextProps.slot.id) return false;
    if (prevProps.className !== nextProps.className) return false;

    // Check slot data
    const prevData = prevProps.slot.data;
    const nextData = nextProps.slot.data;
    if (
        prevData?.showBookmark !== nextData?.showBookmark ||
        prevData?.showLike !== nextData?.showLike ||
        prevData?.variant !== nextData?.variant
    ) {
        return false;
    }

    // Check state - only action-related properties
    const prevState = prevProps.state;
    const nextState = nextProps.state;
    return (
        prevState.currentSection === nextState.currentSection &&
        prevState.courseInfo.courseId === nextState.courseInfo.courseId &&
        prevState.courseInfo.courseName === nextState.courseInfo.courseName &&
        prevState.courseInfo.chapterId === nextState.courseInfo.chapterId &&
        prevState.courseInfo.chapterTitle === nextState.courseInfo.chapterTitle
    );
}

export const ActionsSlotRenderer = memo(ActionsSlotRendererComponent, areActionsPropsEqual);

export default ActionsSlotRenderer;
