"use client";

import React, { useMemo, memo } from "react";
import { BookOpen } from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { HeaderSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

export interface HeaderSlotRendererProps {
    slot: HeaderSlot;
    state: ChapterState;
    className?: string;
}

/**
 * HeaderSlotRenderer - Renders chapter header with title and metadata
 *
 * Memoized to prevent re-renders when unrelated ChapterState properties change.
 * Only depends on courseInfo from state.
 */
const HeaderSlotRendererComponent: React.FC<HeaderSlotRendererProps> = ({ slot, state, className }) => {
    const { data } = slot;
    const { courseInfo } = state;

    // Memoize derived data
    const headerData = useMemo(() => ({
        variant: data?.variant ?? "compact",
        chapterTitle: courseInfo.chapterTitle,
        courseName: courseInfo.courseName,
    }), [data?.variant, courseInfo.chapterTitle, courseInfo.courseName]);

    const { variant, chapterTitle, courseName } = headerData;

    if (variant === "full") {
        return (
            <PrismaticCard className={className}>
                <div style={{ padding: "var(--slot-padding-lg)" }}>
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--ember)] mb-2">
                        <BookOpen size={ICON_SIZES.sm} />
                        CHAPTER
                    </div>
                    <h1 className="text-3xl font-black text-[var(--forge-text-primary)] mb-2">
                        {chapterTitle}
                    </h1>
                    <p className="text-[var(--forge-text-secondary)]">
                        {courseName}
                    </p>
                </div>
            </PrismaticCard>
        );
    }

    // Compact variant (in video player header)
    return (
        <div className={className} data-testid={`header-slot-${slot.id}`}>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-primary)] mb-2">
                <BookOpen size={ICON_SIZES.sm} />
                CHAPTER 3 • CUSTOM HOOKS
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">
                {chapterTitle}
            </h1>
            <p className="text-[var(--text-secondary)]">
                Learn how to extract component logic into reusable custom hooks for cleaner, more maintainable code.
            </p>
        </div>
    );
};

/**
 * Custom comparison function for HeaderSlotRenderer
 * Only re-renders when header-specific props change
 */
function areHeaderPropsEqual(
    prevProps: HeaderSlotRendererProps,
    nextProps: HeaderSlotRendererProps
): boolean {
    if (prevProps.slot.id !== nextProps.slot.id) return false;
    if (prevProps.className !== nextProps.className) return false;
    if (prevProps.slot.data?.variant !== nextProps.slot.data?.variant) return false;

    // Only check courseInfo fields that are used by this component
    return (
        prevProps.state.courseInfo.chapterTitle === nextProps.state.courseInfo.chapterTitle &&
        prevProps.state.courseInfo.courseName === nextProps.state.courseInfo.courseName
    );
}

export const HeaderSlotRenderer = memo(HeaderSlotRendererComponent, areHeaderPropsEqual);

export default HeaderSlotRenderer;
