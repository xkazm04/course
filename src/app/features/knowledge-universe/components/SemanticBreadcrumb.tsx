"use client";

/**
 * Semantic Breadcrumb Component
 *
 * A "you are here" navigation component that shows the user's current position
 * in the learning hierarchy. Integrates with SemanticZoomController to provide
 * contextual navigation through the knowledge universe.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Compass,
    ChevronRight,
    Globe2,
    Sun,
    Layers,
    Star,
    Home,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { BreadcrumbItem, LearningContext } from "../lib/semanticZoomController";
import type { ZoomLevel, UniverseNode } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface SemanticBreadcrumbProps {
    /** Breadcrumb items from SemanticZoomController */
    breadcrumbs: BreadcrumbItem[];
    /** Current zoom level */
    currentLevel: ZoomLevel;
    /** Callback when a breadcrumb is clicked */
    onNavigate: (breadcrumbId: string) => void;
    /** Additional className */
    className?: string;
}

interface LearningContextDisplayProps {
    /** Full learning context from SemanticZoomController */
    context: LearningContext;
    /** Current zoom level */
    currentLevel: ZoomLevel;
    /** Callback when a breadcrumb is clicked */
    onNavigate: (breadcrumbId: string) => void;
    /** Callback when a suggestion is clicked */
    onSuggestionClick?: (node: UniverseNode) => void;
    /** Additional className */
    className?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const BREADCRUMB_ICONS: Record<BreadcrumbItem["type"], typeof Globe2> = {
    universe: Globe2,
    domain: Sun,
    chapter: Layers,
    lesson: Star,
};

const ZOOM_LEVEL_ICONS: Record<ZoomLevel, typeof Globe2> = {
    galaxy: Globe2,
    solar: Sun,
    constellation: Layers,
    star: Star,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SemanticBreadcrumb({
    breadcrumbs,
    currentLevel,
    onNavigate,
    className,
}: SemanticBreadcrumbProps) {
    if (breadcrumbs.length <= 1) return null;

    return (
        <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex items-center gap-1 px-3 py-2",
                "bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm",
                "rounded-lg border border-[var(--forge-border-subtle)]",
                "shadow-xl",
                className
            )}
            aria-label="Learning path breadcrumb"
            data-testid="semantic-breadcrumb"
        >
            <Compass
                size={ICON_SIZES.sm}
                className="text-[var(--ember)] mr-1 flex-shrink-0"
            />

            <ol className="flex items-center gap-1 overflow-x-auto">
                {breadcrumbs.map((item, index) => {
                    const Icon = BREADCRUMB_ICONS[item.type];
                    const isLast = index === breadcrumbs.length - 1;
                    const isFirst = index === 0;

                    return (
                        <li key={item.id} className="flex items-center gap-1 min-w-0">
                            {index > 0 && (
                                <ChevronRight
                                    size={ICON_SIZES.xs}
                                    className="text-[var(--forge-text-muted)] flex-shrink-0"
                                />
                            )}

                            <motion.button
                                onClick={() => onNavigate(item.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-md",
                                    "text-sm transition-colors min-w-0",
                                    isLast
                                        ? "bg-[var(--ember)]/10 text-[var(--ember)] font-medium"
                                        : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-white/5"
                                )}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                data-testid={`breadcrumb-${item.id}`}
                            >
                                {isFirst ? (
                                    <Home size={ICON_SIZES.xs} className="flex-shrink-0" />
                                ) : (
                                    <Icon size={ICON_SIZES.xs} className="flex-shrink-0" />
                                )}
                                <span className="truncate max-w-[120px]">{item.name}</span>
                            </motion.button>
                        </li>
                    );
                })}
            </ol>
        </motion.nav>
    );
}

// ============================================================================
// FULL LEARNING CONTEXT DISPLAY
// ============================================================================

export function LearningContextDisplay({
    context,
    currentLevel,
    onNavigate,
    onSuggestionClick,
    className,
}: LearningContextDisplayProps) {
    const { breadcrumbs, focusedNode, suggestions } = context;
    const hasSuggestions = suggestions.length > 0;

    return (
        <div
            className={cn(
                "flex flex-col gap-2",
                "bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm",
                "rounded-lg border border-[var(--forge-border-subtle)]",
                "shadow-xl p-3",
                className
            )}
            data-testid="learning-context-display"
        >
            {/* Current position indicator */}
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        "bg-[var(--ember)]/20"
                    )}
                >
                    {React.createElement(ZOOM_LEVEL_ICONS[currentLevel], {
                        size: ICON_SIZES.md,
                        className: "text-[var(--ember)]",
                    })}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs text-[var(--forge-text-muted)]">You are here</div>
                    <div className="text-sm text-[var(--forge-text-primary)] font-medium truncate">
                        {focusedNode?.name ?? "Knowledge Universe"}
                    </div>
                </div>
            </div>

            {/* Breadcrumb trail */}
            {breadcrumbs.length > 1 && (
                <SemanticBreadcrumb
                    breadcrumbs={breadcrumbs}
                    currentLevel={currentLevel}
                    onNavigate={onNavigate}
                    className="bg-transparent border-0 shadow-none p-0"
                />
            )}

            {/* Next suggestions */}
            <AnimatePresence>
                {hasSuggestions && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-[var(--forge-border-subtle)] pt-2 mt-1"
                    >
                        <div className="text-xs text-[var(--forge-text-muted)] mb-1.5">
                            Up next
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {suggestions.slice(0, 3).map((node) => (
                                <motion.button
                                    key={node.id}
                                    onClick={() => onSuggestionClick?.(node)}
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-md",
                                        "text-xs bg-[var(--forge-bg-workshop)]/50",
                                        "text-[var(--forge-text-secondary)]",
                                        "hover:bg-[var(--ember)]/10 hover:text-[var(--ember)]",
                                        "transition-colors"
                                    )}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    data-testid={`suggestion-${node.id}`}
                                >
                                    <Star size={ICON_SIZES.xs} />
                                    <span className="truncate max-w-[100px]">{node.name}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// COMPACT BREADCRUMB (for mobile/small screens)
// ============================================================================

interface CompactBreadcrumbProps {
    breadcrumbs: BreadcrumbItem[];
    onNavigate: (breadcrumbId: string) => void;
    className?: string;
}

export function CompactBreadcrumb({
    breadcrumbs,
    onNavigate,
    className,
}: CompactBreadcrumbProps) {
    if (breadcrumbs.length <= 1) return null;

    const current = breadcrumbs[breadcrumbs.length - 1];
    const parent = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;
    const Icon = BREADCRUMB_ICONS[current.type];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex items-center gap-2 px-3 py-2",
                "bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm",
                "rounded-lg border border-[var(--forge-border-subtle)]",
                "shadow-xl",
                className
            )}
            data-testid="compact-breadcrumb"
        >
            {/* Back button */}
            {parent && (
                <motion.button
                    onClick={() => onNavigate(parent.id)}
                    className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-md",
                        "text-xs text-[var(--forge-text-muted)]",
                        "hover:text-[var(--forge-text-primary)] hover:bg-white/5",
                        "transition-colors"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    data-testid="breadcrumb-back"
                >
                    <ChevronRight size={ICON_SIZES.xs} className="rotate-180" />
                    <span>{parent.name}</span>
                </motion.button>
            )}

            {parent && (
                <div className="w-px h-4 bg-[var(--forge-border-subtle)]" />
            )}

            {/* Current item */}
            <div className="flex items-center gap-1.5 text-sm text-[var(--ember)]">
                <Icon size={ICON_SIZES.sm} />
                <span className="font-medium">{current.name}</span>
            </div>
        </motion.div>
    );
}

// ============================================================================
// FLOATING POSITION INDICATOR
// ============================================================================

interface PositionIndicatorProps {
    positionDescription: string;
    className?: string;
}

export function PositionIndicator({
    positionDescription,
    className,
}: PositionIndicatorProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5",
                "bg-[var(--forge-bg-elevated)]/80 backdrop-blur-sm",
                "rounded-full border border-[var(--forge-border-subtle)]",
                "shadow-lg",
                className
            )}
            data-testid="position-indicator"
        >
            <Compass size={ICON_SIZES.sm} className="text-[var(--ember)]" />
            <span className="text-xs text-[var(--forge-text-secondary)]">
                {positionDescription}
            </span>
        </motion.div>
    );
}
