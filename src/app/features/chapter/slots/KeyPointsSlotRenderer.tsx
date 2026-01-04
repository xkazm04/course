"use client";

import React, { useMemo, memo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
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
 * Hook to handle IntersectionObserver-based reveal animation for individual key points
 */
function useKeyPointReveal(index: number, enabled: boolean = true) {
    const [isRevealed, setIsRevealed] = useState(() => !enabled);
    const ref = useRef<HTMLLIElement>(null);
    const hasObserved = useRef(false);

    useEffect(() => {
        if (!enabled) return;

        const element = ref.current;
        if (!element || hasObserved.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Add staggered delay based on index (50ms each)
                        const delay = index * 50;
                        setTimeout(() => {
                            setIsRevealed(true);
                            hasObserved.current = true;
                        }, delay);
                        observer.unobserve(element);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: "20px 0px",
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [enabled, index]);

    return { ref, isRevealed };
}

// Spring animation variants for the checkmark icon
const checkmarkVariants = {
    hidden: {
        scale: 0.8,
        rotate: -10,
        opacity: 0,
    },
    visible: {
        scale: 1,
        rotate: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 20,
            duration: 0.35,
        },
    },
};

// Text fade-in variants
const textVariants = {
    hidden: {
        opacity: 0,
        x: -5,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.25,
            ease: "easeOut",
        },
    },
};

interface KeyPointItemProps {
    point: string;
    index: number;
    slotId: string;
}

/**
 * Individual key point item with IntersectionObserver-based reveal animation
 */
const KeyPointItem: React.FC<KeyPointItemProps> = ({ point, index, slotId }) => {
    const { ref, isRevealed } = useKeyPointReveal(index);

    return (
        <li
            ref={ref}
            className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]"
            data-testid={`key-point-item-${slotId}-${index}`}
        >
            <motion.div
                initial="hidden"
                animate={isRevealed ? "visible" : "hidden"}
                variants={checkmarkVariants}
                className="shrink-0 mt-0.5"
                data-testid={`key-point-checkmark-${slotId}-${index}`}
            >
                <CheckCircle
                    size={ICON_SIZES.sm}
                    className="text-[var(--ember)]"
                />
            </motion.div>
            <motion.span
                initial="hidden"
                animate={isRevealed ? "visible" : "hidden"}
                variants={textVariants}
            >
                {point}
            </motion.span>
        </li>
    );
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
            <h4
                className="font-bold text-[var(--forge-text-primary)] mb-2 flex items-center gap-2"
                data-testid={`key-points-title-${slot.id}`}
            >
                <Icon size={ICON_SIZES.sm} className="text-[var(--ember)]" />
                {title}
            </h4>
            <ul className="space-y-2" data-testid={`key-points-list-${slot.id}`}>
                {points.map((point, i) => (
                    <KeyPointItem
                        key={i}
                        point={point}
                        index={i}
                        slotId={slot.id}
                    />
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
