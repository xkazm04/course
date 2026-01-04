"use client";

/**
 * Semantic Tooltip Component
 *
 * A zoom-level-aware tooltip that displays contextual information based on
 * the current progressive disclosure level. Shows different levels of detail
 * depending on how zoomed in the user is.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, BookOpen, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { TooltipInfo, FetchState } from "../lib/semanticZoomController";
import type { ZoomLevel } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface SemanticTooltipProps {
    /** Tooltip content from SemanticZoomController */
    content: TooltipInfo | null;
    /** Current zoom level for styling */
    zoomLevel: ZoomLevel;
    /** Screen X position */
    x: number;
    /** Screen Y position */
    y: number;
    /** Whether details are being loaded */
    fetchState?: FetchState;
    /** Additional className */
    className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SemanticTooltip({
    content,
    zoomLevel,
    x,
    y,
    fetchState = "loaded",
    className,
}: SemanticTooltipProps) {
    if (!content) return null;

    const isLoading = fetchState === "loading";
    const hasStats = content.stats && content.stats.length > 0;
    const hasProgress = content.progress !== undefined;
    const hasDescription = content.description && zoomLevel !== "galaxy";

    // Compute positioning to avoid going off-screen
    const tooltipStyle: React.CSSProperties = {
        left: x + 15,
        top: y + 15,
        transform: "translateY(-50%)",
        maxWidth: zoomLevel === "star" ? 280 : 220,
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={cn(
                    "absolute pointer-events-none z-50",
                    "bg-[var(--forge-bg-elevated)]/95 backdrop-blur-md",
                    "rounded-lg shadow-2xl",
                    "border border-[var(--forge-border-subtle)]",
                    className
                )}
                style={tooltipStyle}
                data-testid="semantic-tooltip"
                data-zoom-level={zoomLevel}
            >
                {/* Main content */}
                <div className="px-3 py-2">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="text-[var(--forge-text-primary)] font-medium text-sm truncate">
                                {content.title}
                            </div>
                            <div className="text-[var(--forge-text-muted)] text-xs capitalize">
                                {content.subtitle}
                            </div>
                        </div>
                        {isLoading && (
                            <Loader2
                                size={ICON_SIZES.sm}
                                className="animate-spin text-[var(--ember)]"
                                data-testid="tooltip-loading"
                            />
                        )}
                    </div>

                    {/* Description (constellation/star level) */}
                    {hasDescription && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-2 text-xs text-[var(--forge-text-secondary)] line-clamp-2"
                        >
                            {content.description}
                        </motion.p>
                    )}

                    {/* Stats row */}
                    {hasStats && (
                        <div className="mt-2 flex flex-wrap gap-3">
                            {content.stats!.map((stat, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-1.5 text-xs"
                                    data-testid={`tooltip-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
                                >
                                    {stat.label === "Duration" && (
                                        <Clock size={ICON_SIZES.xs} className="text-[var(--forge-text-muted)]" />
                                    )}
                                    {stat.label === "Lessons" && (
                                        <BookOpen size={ICON_SIZES.xs} className="text-[var(--forge-text-muted)]" />
                                    )}
                                    <span className="text-[var(--forge-text-muted)]">{stat.label}:</span>
                                    <span className="text-[var(--forge-text-primary)] font-medium">
                                        {stat.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Progress bar */}
                    {hasProgress && (
                        <div className="mt-2" data-testid="tooltip-progress">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-[var(--forge-text-muted)]">Progress</span>
                                <span className="text-[var(--ember)] font-medium">
                                    {content.progress!.current}/{content.progress!.total}
                                </span>
                            </div>
                            <div className="h-1.5 bg-[var(--forge-border-default)] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${(content.progress!.current / content.progress!.total) * 100}%`,
                                    }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="h-full bg-[var(--ember)] rounded-full"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Action hint */}
                {content.action && (
                    <div
                        className={cn(
                            "px-3 py-1.5 border-t border-[var(--forge-border-subtle)]",
                            "bg-[var(--forge-bg-workshop)]/50"
                        )}
                        data-testid="tooltip-action"
                    >
                        <div className="flex items-center gap-1.5 text-xs text-[var(--ember)]">
                            {content.progress?.current === content.progress?.total && (
                                <CheckCircle2 size={ICON_SIZES.xs} className="text-[var(--forge-success)]" />
                            )}
                            <span>{content.action}</span>
                            <ArrowRight size={ICON_SIZES.xs} className="opacity-60" />
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}

// ============================================================================
// MINI TOOLTIP (for compact display at galaxy level)
// ============================================================================

interface MiniTooltipProps {
    title: string;
    x: number;
    y: number;
    className?: string;
}

export function MiniTooltip({ title, x, y, className }: MiniTooltipProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "absolute pointer-events-none z-50",
                "bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm",
                "rounded-md px-2 py-1",
                "border border-[var(--forge-border-subtle)]",
                "shadow-lg",
                className
            )}
            style={{ left: x + 10, top: y + 10 }}
            data-testid="mini-tooltip"
        >
            <span className="text-[var(--forge-text-primary)] text-xs font-medium">
                {title}
            </span>
        </motion.div>
    );
}
