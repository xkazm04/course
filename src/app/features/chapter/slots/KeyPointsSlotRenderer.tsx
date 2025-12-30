"use client";

import React, { useMemo, memo } from "react";
import { MessageSquare, Sparkles, CheckCircle } from "lucide-react";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { elevation } from "@/app/shared/lib/utils";
import type { KeyPointsSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

export interface KeyPointsSlotRendererProps {
    slot: KeyPointsSlot;
    state: ChapterState;
    className?: string;
}

const iconMap = {
    message: MessageSquare,
    sparkles: Sparkles,
    check: CheckCircle,
};

/**
 * KeyPointsSlotRenderer - Renders key takeaways/learning points
 *
 * Memoized to prevent re-renders when unrelated ChapterState properties change.
 * This component only depends on slot data, not on state.
 */
const KeyPointsSlotRendererComponent: React.FC<KeyPointsSlotRendererProps> = ({ slot, className }) => {
    const { data } = slot;

    // Memoize derived data
    const keyPointsData = useMemo(() => ({
        Icon: iconMap[data.icon ?? "message"],
        title: data.title ?? "Key Takeaways",
        points: data.points,
    }), [data.icon, data.title, data.points]);

    const { Icon, title, points } = keyPointsData;

    return (
        <div
            className={`bg-[var(--ember)]/10 rounded-xl ${elevation.flat} ${className ?? ""}`}
            style={{ padding: "var(--slot-padding-sm)" }}
            data-testid={`key-points-slot-${slot.id}`}
        >
            <h4 className="font-bold text-[var(--forge-text-primary)] mb-2 flex items-center gap-2">
                <Icon size={ICON_SIZES.sm} className="text-[var(--ember)]" />
                {title}
            </h4>
            <ul className="space-y-2">
                {points.map((point, i) => (
                    <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]"
                    >
                        <CheckCircle
                            size={ICON_SIZES.sm}
                            className="text-[var(--ember)] mt-0.5 shrink-0"
                        />
                        {point}
                    </li>
                ))}
            </ul>
        </div>
    );
};

/**
 * Custom comparison function for KeyPointsSlotRenderer
 * Only re-renders when slot or className changes (not state)
 */
function areKeyPointsPropsEqual(
    prevProps: KeyPointsSlotRendererProps,
    nextProps: KeyPointsSlotRendererProps
): boolean {
    if (prevProps.slot.id !== nextProps.slot.id) return false;
    if (prevProps.className !== nextProps.className) return false;

    const prevData = prevProps.slot.data;
    const nextData = nextProps.slot.data;

    // Check points array equality (shallow compare since points are strings)
    if (prevData.points.length !== nextData.points.length) return false;
    for (let i = 0; i < prevData.points.length; i++) {
        if (prevData.points[i] !== nextData.points[i]) return false;
    }

    return (
        prevData.icon === nextData.icon &&
        prevData.title === nextData.title
    );
}

export const KeyPointsSlotRenderer = memo(KeyPointsSlotRendererComponent, areKeyPointsPropsEqual);

export default KeyPointsSlotRenderer;
