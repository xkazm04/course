"use client";

/**
 * Injected Slot Renderer
 *
 * Renders slots that have been injected by third-party providers.
 * Wraps each slot with metadata display and interaction handlers.
 */

import React, { memo, useCallback } from "react";
import { X, Sparkles, Users, Bot, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import type { InjectedSlot } from "../lib/slotProvider/types";
import type { ChapterState } from "../lib/useChapterState";
import { SlotRenderer } from "./SlotRenderer";
import { useInjectedSlotContext } from "../lib/slotProvider/SlotProviderContext";

// ============================================================================
// Types
// ============================================================================

export interface InjectedSlotRendererProps {
    /** The injected slot to render */
    injectedSlot: InjectedSlot;
    /** Chapter state for the slot renderer */
    state: ChapterState;
    /** Optional class name */
    className?: string;
    /** Show the provider badge */
    showProviderBadge?: boolean;
    /** Show the dismiss button */
    showDismiss?: boolean;
    /** Animation variants */
    animate?: boolean;
}

// ============================================================================
// Helper Components
// ============================================================================

function ProviderBadge({ providerId, confidence }: { providerId: string; confidence?: number }) {
    // Determine icon based on provider type
    const getIcon = () => {
        if (providerId.includes("ai") || providerId.includes("tutor")) {
            return <Bot className="w-3 h-3" />;
        }
        if (providerId.includes("community") || providerId.includes("peer")) {
            return <Users className="w-3 h-3" />;
        }
        return <Sparkles className="w-3 h-3" />;
    };

    // Format provider name
    const formatProviderName = () => {
        // Extract the last part of reverse-domain notation
        const parts = providerId.split(".");
        const name = parts[parts.length - 1];
        // Convert kebab-case to title case
        return name
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <div
            className={clsx(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                "bg-amber-500/10 text-amber-300 border border-amber-500/20"
            )}
            data-testid="injected-slot-provider-badge"
        >
            {getIcon()}
            <span>{formatProviderName()}</span>
            {confidence !== undefined && (
                <span className="text-amber-400/60 ml-1">
                    {Math.round(confidence * 100)}%
                </span>
            )}
        </div>
    );
}

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
    return (
        <button
            onClick={onDismiss}
            className={clsx(
                "p-1 rounded-full transition-colors",
                "text-white/40 hover:text-white/80",
                "hover:bg-white/10"
            )}
            aria-label="Dismiss"
            data-testid="injected-slot-dismiss-btn"
        >
            <X className="w-4 h-4" />
        </button>
    );
}

function ReasonTooltip({ reason }: { reason: string }) {
    return (
        <div
            className={clsx(
                "group relative inline-flex items-center",
                "cursor-help"
            )}
            data-testid="injected-slot-reason-tooltip"
        >
            <Info className="w-3 h-3 text-white/30" />
            <div
                className={clsx(
                    "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
                    "px-3 py-2 rounded-lg text-xs max-w-xs",
                    "bg-zinc-800 text-white/80 border border-white/10",
                    "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                    "transition-all duration-200 z-50",
                    "whitespace-normal"
                )}
            >
                {reason}
                <div
                    className={clsx(
                        "absolute top-full left-1/2 -translate-x-1/2",
                        "border-4 border-transparent border-t-zinc-800"
                    )}
                />
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

const InjectedSlotRendererComponent: React.FC<InjectedSlotRendererProps> = ({
    injectedSlot,
    state,
    className,
    showProviderBadge = true,
    showDismiss = true,
    animate = true,
}) => {
    const { slot, metadata, priority } = injectedSlot;
    const { dismiss, trackInteraction } = useInjectedSlotContext(slot.id);

    const handleDismiss = useCallback(() => {
        trackInteraction("dismiss");
        dismiss();
    }, [dismiss, trackInteraction]);

    const handleSlotClick = useCallback(() => {
        trackInteraction("click");
    }, [trackInteraction]);

    // Priority-based border color
    const priorityStyles = {
        critical: "border-l-red-500",
        high: "border-l-amber-500",
        normal: "border-l-blue-500",
        low: "border-l-zinc-500",
    };

    const content = (
        <div
            className={clsx(
                "relative group",
                "bg-zinc-900/50 rounded-lg overflow-hidden",
                "border-l-2",
                priorityStyles[priority],
                className
            )}
            onClick={handleSlotClick}
            data-testid={`injected-slot-${slot.id}`}
            data-provider={metadata.providerId}
            data-priority={priority}
        >
            {/* Header with provider info and dismiss */}
            {(showProviderBadge || showDismiss || metadata.reason) && (
                <div
                    className={clsx(
                        "flex items-center justify-between gap-2",
                        "px-3 py-1.5 bg-zinc-800/50",
                        "border-b border-white/5"
                    )}
                >
                    <div className="flex items-center gap-2">
                        {showProviderBadge && (
                            <ProviderBadge
                                providerId={metadata.providerId}
                                confidence={metadata.confidence}
                            />
                        )}
                        {metadata.reason && (
                            <ReasonTooltip reason={metadata.reason} />
                        )}
                    </div>
                    {showDismiss && (
                        <DismissButton onDismiss={handleDismiss} />
                    )}
                </div>
            )}

            {/* Slot content */}
            <div className="p-3">
                <SlotRenderer slot={slot} state={state} />
            </div>
        </div>
    );

    if (!animate) {
        return content;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            {content}
        </motion.div>
    );
};

export const InjectedSlotRenderer = memo(InjectedSlotRendererComponent);

// ============================================================================
// List Renderer
// ============================================================================

export interface InjectedSlotListProps {
    /** Injected slots to render */
    slots: InjectedSlot[];
    /** Chapter state */
    state: ChapterState;
    /** Optional class name for container */
    className?: string;
    /** Class name for each slot */
    slotClassName?: string;
    /** Show provider badges */
    showProviderBadges?: boolean;
    /** Show dismiss buttons */
    showDismiss?: boolean;
    /** Empty state content */
    emptyState?: React.ReactNode;
}

export const InjectedSlotList: React.FC<InjectedSlotListProps> = memo(
    ({
        slots,
        state,
        className,
        slotClassName,
        showProviderBadges = true,
        showDismiss = true,
        emptyState,
    }) => {
        if (slots.length === 0) {
            return emptyState ? <>{emptyState}</> : null;
        }

        return (
            <div className={clsx("space-y-3", className)} data-testid="injected-slot-list">
                <AnimatePresence mode="popLayout">
                    {slots.map((injectedSlot) => (
                        <InjectedSlotRenderer
                            key={injectedSlot.slot.id}
                            injectedSlot={injectedSlot}
                            state={state}
                            className={slotClassName}
                            showProviderBadge={showProviderBadges}
                            showDismiss={showDismiss}
                        />
                    ))}
                </AnimatePresence>
            </div>
        );
    }
);

InjectedSlotList.displayName = "InjectedSlotList";
