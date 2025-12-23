"use client";

import React, { useMemo, memo } from "react";
import type { TextSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

export interface TextSlotRendererProps {
    slot: TextSlot;
    state: ChapterState;
    className?: string;
}

/**
 * TextSlotRenderer - Renders text content blocks
 *
 * Memoized to prevent re-renders when unrelated ChapterState properties change.
 * This component only depends on slot data, not on state.
 */
const TextSlotRendererComponent: React.FC<TextSlotRendererProps> = ({ slot, className }) => {
    const { data } = slot;

    // Memoize derived data
    const textData = useMemo(() => ({
        variant: data.variant ?? "prose",
        title: data.title,
        content: data.content,
    }), [data.variant, data.title, data.content]);

    const { variant, title, content } = textData;

    if (variant === "prose") {
        return (
            <div
                className={`prose prose-slate dark:prose-invert max-w-none ${className ?? ""}`}
                data-testid={`text-slot-${slot.id}`}
            >
                {title && (
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
                )}
                <p className="text-[var(--text-secondary)]">{content}</p>
            </div>
        );
    }

    if (variant === "description") {
        return (
            <div className={className} data-testid={`text-slot-${slot.id}`}>
                {title && (
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                )}
                <p className="text-slate-600 dark:text-slate-400">{content}</p>
            </div>
        );
    }

    if (variant === "highlight") {
        return (
            <div
                className={`bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 ${className ?? ""}`}
                style={{ padding: "var(--slot-padding-lg)" }}
                data-testid={`text-slot-${slot.id}`}
            >
                {title && (
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-3">{title}</h3>
                )}
                <p className="text-slate-600 dark:text-slate-400">{content}</p>
            </div>
        );
    }

    return (
        <p className={`text-[var(--text-secondary)] ${className ?? ""}`} data-testid={`text-slot-${slot.id}`}>
            {content}
        </p>
    );
};

/**
 * Custom comparison function for TextSlotRenderer
 * Only re-renders when slot or className changes (not state)
 */
function areTextPropsEqual(
    prevProps: TextSlotRendererProps,
    nextProps: TextSlotRendererProps
): boolean {
    if (prevProps.slot.id !== nextProps.slot.id) return false;
    if (prevProps.className !== nextProps.className) return false;

    const prevData = prevProps.slot.data;
    const nextData = nextProps.slot.data;
    return (
        prevData.variant === nextData.variant &&
        prevData.title === nextData.title &&
        prevData.content === nextData.content
    );
}

export const TextSlotRenderer = memo(TextSlotRendererComponent, areTextPropsEqual);

export default TextSlotRenderer;
