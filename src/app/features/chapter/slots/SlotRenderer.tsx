"use client";

import React, { memo, useMemo } from "react";
import type { ContentSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

import { VideoSlotRenderer } from "./VideoSlotRenderer";
import { CodeSlotRenderer } from "./CodeSlotRenderer";
import { KeyPointsSlotRenderer } from "./KeyPointsSlotRenderer";
import { NavigationSlotRenderer } from "./NavigationSlotRenderer";
import { TextSlotRenderer } from "./TextSlotRenderer";
import { ProgressSlotRenderer } from "./ProgressSlotRenderer";
import { ActionsSlotRenderer } from "./ActionsSlotRenderer";
import { SectionListSlotRenderer } from "./SectionListSlotRenderer";
import { PlaygroundSlotRenderer } from "./PlaygroundSlotRenderer";
import { HeaderSlotRenderer } from "./HeaderSlotRenderer";

export interface SlotRendererComponentProps {
    slot: ContentSlot;
    state: ChapterState;
    className?: string;
}

/**
 * SlotRenderer - Universal slot renderer that delegates to the correct type-specific renderer
 *
 * Each individual renderer is memoized with custom comparison functions to only
 * re-render when their specific subset of ChapterState changes. This reduces
 * cascade re-renders from O(n) to O(1) when a single state property changes.
 */
const SlotRendererComponent: React.FC<SlotRendererComponentProps> = ({ slot, state, className }) => {
    switch (slot.type) {
        case "video":
            return <VideoSlotRenderer slot={slot} state={state} />;
        case "code":
            return <CodeSlotRenderer slot={slot} state={state} className={className} />;
        case "keyPoints":
            return <KeyPointsSlotRenderer slot={slot} state={state} className={className} />;
        case "quiz":
            // Quiz feature has been removed
            return null;
        case "navigation":
            return <NavigationSlotRenderer slot={slot} state={state} className={className} />;
        case "text":
            return <TextSlotRenderer slot={slot} state={state} className={className} />;
        case "progress":
            return <ProgressSlotRenderer slot={slot} state={state} className={className} />;
        case "actions":
            return <ActionsSlotRenderer slot={slot} state={state} className={className} />;
        case "sectionList":
            return <SectionListSlotRenderer slot={slot} state={state} className={className} />;
        case "playground":
            return <PlaygroundSlotRenderer slot={slot} state={state} className={className} />;
        case "header":
            return <HeaderSlotRenderer slot={slot} state={state} className={className} />;
        default:
            console.warn(`Unknown slot type: ${(slot as ContentSlot).type}`);
            return null;
    }
};

/**
 * Memoized SlotRenderer - prevents re-execution of switch statement
 * when props haven't changed. Each child renderer handles its own
 * fine-grained memoization based on the specific state it needs.
 */
export const SlotRenderer = memo(SlotRendererComponent, (prevProps, nextProps) => {
    // Basic equality checks
    if (prevProps.slot.id !== nextProps.slot.id) return false;
    if (prevProps.slot.type !== nextProps.slot.type) return false;
    if (prevProps.className !== nextProps.className) return false;

    // For the parent SlotRenderer, we let the child memoized components
    // handle the fine-grained state comparison. We only check if the
    // state object reference has changed as a basic optimization.
    // The child renderers will do the detailed comparison.
    return prevProps.state === nextProps.state;
});

/**
 * Render multiple slots in sequence
 */
export interface SlotListRendererProps {
    slots: ContentSlot[];
    state: ChapterState;
    className?: string;
    slotClassName?: string;
}

/**
 * SlotListRenderer - Renders multiple slots in sequence
 *
 * Memoized to prevent re-render when slots array reference is stable.
 */
const SlotListRendererComponent: React.FC<SlotListRendererProps> = ({
    slots,
    state,
    className,
    slotClassName,
}) => {
    // Memoize the slots array to prevent unnecessary re-renders
    // when parent re-renders with same slot data
    const memoizedSlots = useMemo(() => slots, [slots]);

    return (
        <div className={className}>
            {memoizedSlots.map((slot) => (
                <SlotRenderer
                    key={slot.id}
                    slot={slot}
                    state={state}
                    className={slotClassName}
                />
            ))}
        </div>
    );
};

export const SlotListRenderer = memo(SlotListRendererComponent, (prevProps, nextProps) => {
    if (prevProps.className !== nextProps.className) return false;
    if (prevProps.slotClassName !== nextProps.slotClassName) return false;

    // Check slots array - by reference first, then by length/ids
    if (prevProps.slots !== nextProps.slots) {
        if (prevProps.slots.length !== nextProps.slots.length) return false;
        for (let i = 0; i < prevProps.slots.length; i++) {
            if (prevProps.slots[i].id !== nextProps.slots[i].id) return false;
        }
    }

    // State reference check - child SlotRenderers will do detailed comparison
    return prevProps.state === nextProps.state;
});

export default SlotRenderer;
