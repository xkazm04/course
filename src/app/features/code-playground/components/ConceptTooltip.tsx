"use client";

import React, { useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Link as LinkIcon, X } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { Concept } from "../lib/conceptBridge";
import { getConceptColor } from "../lib/conceptBridge";

export interface ConceptTooltipProps {
    /** Concepts to display */
    concepts: Concept[];
    /** Position of the tooltip */
    position: { x: number; y: number };
    /** Whether the tooltip is visible */
    isVisible: boolean;
    /** Callback when a concept is clicked */
    onConceptClick?: (concept: Concept) => void;
    /** Callback to close the tooltip */
    onClose?: () => void;
    /** Whether this is a sticky tooltip (clicked, not just hovered) */
    isSticky?: boolean;
}

export function ConceptTooltip({
    concepts,
    position,
    isVisible,
    onConceptClick,
    onClose,
    isSticky = false,
}: ConceptTooltipProps) {
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Calculate adjusted position to keep tooltip in viewport (memoized to avoid recalculating on every render)
    const adjustedPosition = useMemo(() => {
        // Start with provided position
        let newX = position.x;
        let newY = position.y;

        // Perform basic viewport bounds checking
        // Use a reasonable estimate for tooltip dimensions since we can't measure during render
        const estimatedWidth = 280;
        const estimatedHeight = 180;

        // Use typeof to safely access window on both client and server
        if (typeof window !== "undefined") {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Adjust horizontal position if needed
            if (newX + estimatedWidth > viewportWidth - 16) {
                newX = Math.max(16, viewportWidth - estimatedWidth - 16);
            }
            if (newX < 16) {
                newX = 16;
            }

            // Adjust vertical position if needed
            if (newY + estimatedHeight > viewportHeight - 16) {
                newY = Math.max(16, position.y - estimatedHeight - 8);
            }
        }

        return { x: newX, y: newY };
    }, [position]);

    if (concepts.length === 0) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    ref={tooltipRef}
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                        "fixed z-50 min-w-[200px] max-w-[300px]",
                        "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]",
                        "rounded-lg shadow-xl backdrop-blur-sm",
                        "overflow-hidden"
                    )}
                    style={{
                        left: adjustedPosition.x,
                        top: adjustedPosition.y,
                    }}
                    data-testid="concept-tooltip"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-[var(--forge-bg-forge)] border-b border-[var(--forge-border-subtle)]">
                        <div className="flex items-center gap-2 text-xs font-medium text-[var(--forge-text-muted)]">
                            <BookOpen size={ICON_SIZES.xs} />
                            <span>
                                {concepts.length === 1
                                    ? "Concept"
                                    : `${concepts.length} Concepts`}
                            </span>
                        </div>
                        {isSticky && onClose && (
                            <button
                                onClick={onClose}
                                className="p-0.5 rounded hover:bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
                                data-testid="concept-tooltip-close"
                            >
                                <X size={ICON_SIZES.xs} />
                            </button>
                        )}
                    </div>

                    {/* Concept list */}
                    <div className="p-2 space-y-1">
                        {concepts.map((concept) => {
                            const color = concept.color || getConceptColor(concept.id);
                            return (
                                <button
                                    key={concept.id}
                                    onClick={() => onConceptClick?.(concept)}
                                    className={cn(
                                        "w-full flex items-start gap-2 p-2 rounded-md",
                                        "hover:bg-[var(--forge-bg-anvil)] transition-colors",
                                        "text-left group"
                                    )}
                                    data-testid={`concept-item-${concept.id}`}
                                >
                                    {/* Color indicator */}
                                    <div
                                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                        style={{ backgroundColor: color }}
                                    />

                                    <div className="flex-1 min-w-0">
                                        {/* Concept name */}
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="font-medium text-sm truncate"
                                                style={{ color }}
                                            >
                                                {concept.name}
                                            </span>
                                            {concept.contentUrl && (
                                                <LinkIcon
                                                    size={ICON_SIZES.xs}
                                                    className="text-[var(--forge-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
                                                />
                                            )}
                                        </div>

                                        {/* Description */}
                                        {concept.description && (
                                            <p className="text-xs text-[var(--forge-text-muted)] mt-0.5 line-clamp-2">
                                                {concept.description}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer hint */}
                    {!isSticky && (
                        <div className="px-3 py-1.5 bg-[var(--forge-bg-forge)] border-t border-[var(--forge-border-subtle)]">
                            <p className="text-[10px] text-[var(--forge-text-muted)] text-center">
                                Click to navigate to concept
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ConceptTooltip;
