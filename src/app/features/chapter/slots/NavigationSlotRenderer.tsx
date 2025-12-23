"use client";

import React, { useMemo, memo } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { cn, buttonSizeClasses } from "@/app/shared/lib/utils";
import type { NavigationSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

export interface NavigationSlotRendererProps {
    slot: NavigationSlot;
    state: ChapterState;
    className?: string;
}

/**
 * NavigationSlotRenderer - Renders previous/next chapter navigation
 *
 * Memoized to prevent re-renders when unrelated ChapterState properties change.
 * This component only depends on slot data, not on state.
 */
const NavigationSlotRendererComponent: React.FC<NavigationSlotRendererProps> = ({ slot, className }) => {
    const { data } = slot;

    // Memoize derived navigation data
    const navData = useMemo(() => ({
        showPrevious: data?.showPrevious ?? true,
        showNext: data?.showNext ?? true,
        previousLabel: data?.previousLabel ?? "Previous",
        nextLabel: data?.nextLabel ?? "Next",
        compact: data?.compact ?? false,
    }), [data?.showPrevious, data?.showNext, data?.previousLabel, data?.nextLabel, data?.compact]);

    const { showPrevious, showNext, previousLabel, nextLabel, compact } = navData;

    if (compact) {
        return (
            <div className={cn("flex gap-2", className)} data-testid={`navigation-slot-${slot.id}`}>
                {showPrevious && (
                    <button
                        className={cn(
                            buttonSizeClasses.md,
                            "flex-1 bg-[var(--surface-inset)] rounded-xl font-medium text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] transition-colors flex items-center justify-center gap-2"
                        )}
                        data-testid="nav-slot-prev-btn"
                    >
                        <ChevronLeft size={ICON_SIZES.sm} /> {previousLabel}
                    </button>
                )}
                {showNext && (
                    <button
                        className={cn(
                            buttonSizeClasses.md,
                            "flex-1 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-xl font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        )}
                        data-testid="nav-slot-next-btn"
                    >
                        {nextLabel} <ChevronRight size={ICON_SIZES.sm} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={cn("flex justify-between", className)} data-testid={`navigation-slot-${slot.id}`}>
            {showPrevious && (
                <button
                    className={cn(
                        buttonSizeClasses.lg,
                        "bg-[var(--btn-secondary-bg)] rounded-xl font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] transition-colors border border-[var(--btn-secondary-border)]"
                    )}
                    data-testid="nav-slot-prev-btn"
                >
                    ← Previous Chapter
                </button>
            )}
            {showNext && (
                <button
                    className={cn(
                        buttonSizeClasses.lg,
                        "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                    )}
                    data-testid="nav-slot-next-btn"
                >
                    Next Chapter <ArrowRight size={ICON_SIZES.md} />
                </button>
            )}
        </div>
    );
};

/**
 * Custom comparison function for NavigationSlotRenderer
 * Only re-renders when slot or className changes (not state)
 */
function areNavigationPropsEqual(
    prevProps: NavigationSlotRendererProps,
    nextProps: NavigationSlotRendererProps
): boolean {
    if (prevProps.slot.id !== nextProps.slot.id) return false;
    if (prevProps.className !== nextProps.className) return false;

    const prevData = prevProps.slot.data;
    const nextData = nextProps.slot.data;
    return (
        prevData?.showPrevious === nextData?.showPrevious &&
        prevData?.showNext === nextData?.showNext &&
        prevData?.previousLabel === nextData?.previousLabel &&
        prevData?.nextLabel === nextData?.nextLabel &&
        prevData?.compact === nextData?.compact
    );
}

export const NavigationSlotRenderer = memo(NavigationSlotRendererComponent, areNavigationPropsEqual);

export default NavigationSlotRenderer;
