"use client";

/**
 * Zoom Indicator Component
 *
 * Visual feedback component showing current semantic zoom level
 * with smooth animated transitions and contextual information.
 *
 * Features:
 * - Animated level indicator with progress bar
 * - Transition feedback during zoom
 * - Zoom level breadcrumbs
 * - Touch-friendly zoom gesture hints
 */

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe2,
    Sun,
    Layers,
    Star,
    ZoomIn,
    ZoomOut,
    ChevronRight,
    Sparkles,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { SemanticLevel, ZoomLevelTransition } from "../lib/zoomLevelManager";
import { SEMANTIC_LEVELS } from "../lib/zoomLevelManager";

// ============================================================================
// TYPES
// ============================================================================

interface ZoomIndicatorProps {
    /** Current semantic level */
    currentLevel: SemanticLevel;
    /** Current scale value */
    scale: number;
    /** Active transition (if any) */
    transition?: ZoomLevelTransition | null;
    /** Callback when user clicks a level to navigate */
    onLevelClick?: (levelId: SemanticLevel["id"]) => void;
    /** Whether to show the full expanded indicator */
    expanded?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Position variant */
    position?: "top" | "bottom" | "left" | "right";
}

interface ZoomProgressBarProps {
    /** Current scale */
    scale: number;
    /** Scale range */
    minScale: number;
    maxScale: number;
    /** Current level for coloring */
    level: SemanticLevel;
    /** Transition progress (0-1) */
    transitionProgress?: number;
}

interface ZoomLevelButtonProps {
    level: SemanticLevel;
    isActive: boolean;
    isTransitioning: boolean;
    transitionProgress?: number;
    onClick?: () => void;
}

// ============================================================================
// ICONS MAPPING
// ============================================================================

const LEVEL_ICONS: Record<SemanticLevel["id"], typeof Globe2> = {
    galaxy: Globe2,
    solar: Sun,
    constellation: Layers,
    star: Star,
};

const LEVEL_COLORS: Record<SemanticLevel["id"], { primary: string; glow: string }> = {
    galaxy: { primary: "var(--ember)", glow: "rgba(194, 65, 12, 0.3)" },
    solar: { primary: "var(--gold)", glow: "rgba(212, 168, 83, 0.3)" },
    constellation: { primary: "var(--forge-accent-1)", glow: "rgba(59, 130, 246, 0.3)" },
    star: { primary: "var(--forge-success)", glow: "rgba(34, 197, 94, 0.3)" },
};

// ============================================================================
// ZOOM PROGRESS BAR
// ============================================================================

function ZoomProgressBar({
    scale,
    minScale,
    maxScale,
    level,
    transitionProgress,
}: ZoomProgressBarProps) {
    // Calculate progress within the scale range
    const progress = useMemo(() => {
        const effectiveMax = maxScale === Infinity ? minScale * 4 : maxScale;
        const clampedScale = Math.max(minScale, Math.min(effectiveMax, scale));
        return ((clampedScale - minScale) / (effectiveMax - minScale)) * 100;
    }, [scale, minScale, maxScale]);

    const colors = LEVEL_COLORS[level.id];

    return (
        <div className="relative h-1.5 w-full bg-[var(--forge-border-default)] rounded-full overflow-hidden">
            {/* Background glow during transition */}
            {transitionProgress !== undefined && transitionProgress < 1 && (
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: colors.glow }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                />
            )}

            {/* Progress fill */}
            <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: colors.primary }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />

            {/* Level markers */}
            <div className="absolute inset-0 flex justify-between items-center px-0.5">
                {SEMANTIC_LEVELS.slice(0, -1).map((l, index) => (
                    <div
                        key={l.id}
                        className={cn(
                            "w-0.5 h-full",
                            index <= SEMANTIC_LEVELS.findIndex(sl => sl.id === level.id)
                                ? "bg-white/30"
                                : "bg-white/10"
                        )}
                        style={{
                            marginLeft: `${(index + 1) * 25 - 0.5}%`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// ZOOM LEVEL BUTTON
// ============================================================================

function ZoomLevelButton({
    level,
    isActive,
    isTransitioning,
    transitionProgress = 0,
    onClick,
}: ZoomLevelButtonProps) {
    const Icon = LEVEL_ICONS[level.id];
    const colors = LEVEL_COLORS[level.id];

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
                isActive
                    ? "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]"
                    : "hover:bg-white/5"
            )}
            title={level.description}
            data-testid={`zoom-level-button-${level.id}`}
        >
            {/* Active indicator */}
            {isActive && (
                <motion.div
                    layoutId="activeZoomLevel"
                    className="absolute inset-0 rounded-lg border-2"
                    style={{ borderColor: colors.primary }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
            )}

            {/* Transition pulse */}
            {isTransitioning && (
                <motion.div
                    className="absolute inset-0 rounded-lg"
                    style={{ backgroundColor: colors.glow }}
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                />
            )}

            {/* Icon */}
            <Icon
                size={ICON_SIZES.sm}
                className={cn(
                    "transition-colors",
                    isActive
                        ? "text-[var(--forge-text-primary)]"
                        : "text-[var(--forge-text-muted)]"
                )}
                style={isActive ? { color: colors.primary } : undefined}
            />

            {/* Label */}
            <span
                className={cn(
                    "text-xs font-medium transition-colors",
                    isActive
                        ? "text-[var(--forge-text-primary)]"
                        : "text-[var(--forge-text-muted)]"
                )}
            >
                {level.name}
            </span>
        </motion.button>
    );
}

// ============================================================================
// TRANSITION INDICATOR
// ============================================================================

function TransitionIndicator({
    transition,
}: {
    transition: ZoomLevelTransition;
}) {
    const FromIcon = LEVEL_ICONS[transition.from.id];
    const ToIcon = LEVEL_ICONS[transition.to.id];
    const isZoomingIn = transition.direction === "zoom-in";

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm rounded-lg border border-[var(--forge-border-subtle)]"
        >
            {/* Zoom direction icon */}
            {isZoomingIn ? (
                <ZoomIn size={ICON_SIZES.xs} className="text-[var(--forge-text-muted)]" />
            ) : (
                <ZoomOut size={ICON_SIZES.xs} className="text-[var(--forge-text-muted)]" />
            )}

            {/* From level */}
            <div className="flex items-center gap-1">
                <FromIcon size={ICON_SIZES.xs} className="text-[var(--forge-text-secondary)]" />
                <span className="text-xs text-[var(--forge-text-secondary)]">
                    {transition.from.name}
                </span>
            </div>

            {/* Arrow */}
            <ChevronRight size={ICON_SIZES.xs} className="text-[var(--forge-text-muted)]" />

            {/* To level */}
            <div className="flex items-center gap-1">
                <ToIcon size={ICON_SIZES.xs} className="text-[var(--forge-text-primary)]" />
                <span className="text-xs text-[var(--forge-text-primary)] font-medium">
                    {transition.to.name}
                </span>
            </div>

            {/* Progress indicator */}
            <div className="w-12 h-1 bg-[var(--forge-border-default)] rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-[var(--ember)] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${transition.progress * 100}%` }}
                />
            </div>
        </motion.div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ZoomIndicator({
    currentLevel,
    scale,
    transition,
    onLevelClick,
    expanded = false,
    className,
    position = "top",
}: ZoomIndicatorProps) {
    const [showHint, setShowHint] = useState(true);

    // Hide hint after first interaction
    useEffect(() => {
        const timer = setTimeout(() => setShowHint(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    // Get current level index for determining active states
    const currentLevelIndex = SEMANTIC_LEVELS.findIndex(l => l.id === currentLevel.id);

    // Position classes
    const positionClasses = {
        top: "top-4 left-1/2 -translate-x-1/2",
        bottom: "bottom-4 left-1/2 -translate-x-1/2",
        left: "left-4 top-1/2 -translate-y-1/2 flex-col",
        right: "right-4 top-1/2 -translate-y-1/2 flex-col",
    };

    const Icon = LEVEL_ICONS[currentLevel.id];
    const colors = LEVEL_COLORS[currentLevel.id];

    return (
        <div
            className={cn(
                "absolute z-50 flex items-center gap-3",
                positionClasses[position],
                className
            )}
            data-testid="zoom-indicator"
        >
            {/* Compact indicator (default) */}
            {!expanded && (
                <motion.div
                    layout
                    className="flex items-center gap-3 px-4 py-2 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm rounded-full border border-[var(--forge-border-subtle)] shadow-xl"
                >
                    {/* Current level icon */}
                    <motion.div
                        key={currentLevel.id}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2"
                    >
                        <Icon
                            size={ICON_SIZES.md}
                            style={{ color: colors.primary }}
                        />
                        <div>
                            <div className="text-sm font-medium text-[var(--forge-text-primary)]">
                                {currentLevel.name}
                            </div>
                            <div className="text-xs text-[var(--forge-text-muted)]">
                                {currentLevel.description}
                            </div>
                        </div>
                    </motion.div>

                    {/* Zoom progress */}
                    <div className="w-20">
                        <ZoomProgressBar
                            scale={scale}
                            minScale={currentLevel.scaleRange.min}
                            maxScale={currentLevel.scaleRange.max}
                            level={currentLevel}
                            transitionProgress={transition?.progress}
                        />
                    </div>
                </motion.div>
            )}

            {/* Expanded level selector */}
            {expanded && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1 px-2 py-1.5 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] shadow-xl"
                >
                    {SEMANTIC_LEVELS.map((level, index) => (
                        <React.Fragment key={level.id}>
                            <ZoomLevelButton
                                level={level}
                                isActive={currentLevel.id === level.id}
                                isTransitioning={
                                    transition?.from.id === level.id ||
                                    transition?.to.id === level.id
                                }
                                transitionProgress={transition?.progress}
                                onClick={() => onLevelClick?.(level.id)}
                            />

                            {/* Connector between levels */}
                            {index < SEMANTIC_LEVELS.length - 1 && (
                                <div
                                    className={cn(
                                        "w-4 h-0.5 rounded-full transition-colors",
                                        index < currentLevelIndex
                                            ? "bg-[var(--ember)]/50"
                                            : "bg-[var(--forge-border-default)]"
                                    )}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </motion.div>
            )}

            {/* Transition indicator */}
            <AnimatePresence>
                {transition && transition.progress < 1 && (
                    <TransitionIndicator transition={transition} />
                )}
            </AnimatePresence>

            {/* Zoom hint (fades out) */}
            <AnimatePresence>
                {showHint && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--forge-bg-elevated)]/80 backdrop-blur-sm rounded-lg text-xs text-[var(--forge-text-muted)]"
                    >
                        <Sparkles size={ICON_SIZES.xs} className="text-[var(--gold)]" />
                        Scroll to zoom through levels
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// MINI ZOOM INDICATOR
// ============================================================================

interface MiniZoomIndicatorProps {
    currentLevel: SemanticLevel;
    scale: number;
    className?: string;
}

/**
 * Compact zoom indicator for tight spaces
 */
export function MiniZoomIndicator({
    currentLevel,
    scale,
    className,
}: MiniZoomIndicatorProps) {
    const Icon = LEVEL_ICONS[currentLevel.id];
    const colors = LEVEL_COLORS[currentLevel.id];

    // Calculate scale percentage within level
    const { min, max } = currentLevel.scaleRange;
    const effectiveMax = max === Infinity ? min * 4 : max;
    const progress = Math.round(((scale - min) / (effectiveMax - min)) * 100);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
                "flex items-center gap-1.5 px-2 py-1 bg-[var(--forge-bg-elevated)]/80 backdrop-blur-sm rounded-full border border-[var(--forge-border-subtle)]",
                className
            )}
            data-testid="mini-zoom-indicator"
        >
            <Icon size={ICON_SIZES.xs} style={{ color: colors.primary }} />
            <span className="text-xs font-medium text-[var(--forge-text-primary)]">
                {progress}%
            </span>
        </motion.div>
    );
}

// ============================================================================
// ZOOM BREADCRUMB
// ============================================================================

interface ZoomBreadcrumbProps {
    currentLevel: SemanticLevel;
    onNavigate: (levelId: SemanticLevel["id"]) => void;
    className?: string;
}

/**
 * Breadcrumb navigation showing zoom level hierarchy
 */
export function ZoomBreadcrumb({
    currentLevel,
    onNavigate,
    className,
}: ZoomBreadcrumbProps) {
    const currentIndex = SEMANTIC_LEVELS.findIndex(l => l.id === currentLevel.id);
    const breadcrumbLevels = SEMANTIC_LEVELS.slice(0, currentIndex + 1);

    return (
        <div
            className={cn(
                "flex items-center gap-1 px-3 py-1.5 bg-[var(--forge-bg-elevated)]/80 backdrop-blur-sm rounded-lg border border-[var(--forge-border-subtle)]",
                className
            )}
            data-testid="zoom-breadcrumb"
        >
            {breadcrumbLevels.map((level, index) => {
                const Icon = LEVEL_ICONS[level.id];
                const colors = LEVEL_COLORS[level.id];
                const isLast = index === breadcrumbLevels.length - 1;

                return (
                    <React.Fragment key={level.id}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onNavigate(level.id)}
                            className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors",
                                isLast
                                    ? "text-[var(--forge-text-primary)]"
                                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                            )}
                        >
                            <Icon
                                size={ICON_SIZES.xs}
                                style={isLast ? { color: colors.primary } : undefined}
                            />
                            <span className="text-xs font-medium">{level.name}</span>
                        </motion.button>

                        {!isLast && (
                            <ChevronRight
                                size={ICON_SIZES.xs}
                                className="text-[var(--forge-text-muted)]"
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
