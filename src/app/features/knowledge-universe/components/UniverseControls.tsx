"use client";

/**
 * Universe Controls Component
 *
 * Provides navigation controls for the knowledge universe:
 * - Zoom level selector
 * - Zoom in/out buttons
 * - Reset view button
 * - Mini-map (optional)
 */

import React from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, RotateCcw, Compass, Layers, Star, Sun, Globe2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { ZoomLevel } from "../lib/types";
import { ZOOM_LEVEL_CONFIGS } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface UniverseControlsProps {
    currentZoomLevel: ZoomLevel;
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomLevelChange: (level: ZoomLevel) => void;
    onReset: () => void;
    className?: string;
}

// ============================================================================
// ZOOM LEVEL ICONS
// ============================================================================

const ZOOM_LEVEL_ICONS: Record<ZoomLevel, typeof Globe2> = {
    galaxy: Globe2,
    solar: Sun,
    constellation: Layers,
    star: Star,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function UniverseControls({
    currentZoomLevel,
    scale,
    onZoomIn,
    onZoomOut,
    onZoomLevelChange,
    onReset,
    className,
}: UniverseControlsProps) {
    return (
        <div
            className={cn(
                "absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2",
                className
            )}
            data-testid="universe-controls"
        >
            {/* Zoom Level Selector */}
            <div className="flex items-center gap-1 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm rounded-full px-2 py-1.5 border border-[var(--forge-border-subtle)] shadow-xl">
                {ZOOM_LEVEL_CONFIGS.map((config) => {
                    const Icon = ZOOM_LEVEL_ICONS[config.level];
                    const isActive = currentZoomLevel === config.level;

                    return (
                        <motion.button
                            key={config.level}
                            onClick={() => onZoomLevelChange(config.level)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                "relative p-2 rounded-full transition-colors",
                                isActive
                                    ? "bg-[var(--ember)] text-[var(--forge-text-primary)]"
                                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-white/10"
                            )}
                            title={`${config.label}: ${config.description}`}
                            data-testid={`zoom-level-${config.level}`}
                        >
                            <Icon size={ICON_SIZES.md} />
                            {isActive && (
                                <motion.div
                                    layoutId="activeZoomIndicator"
                                    className="absolute inset-0 bg-[var(--ember)] rounded-full -z-10"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Zoom Buttons */}
            <div className="flex items-center gap-1 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm rounded-full px-2 py-1.5 border border-[var(--forge-border-subtle)] shadow-xl">
                <motion.button
                    onClick={onZoomOut}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-white/10 transition-colors"
                    title="Zoom Out"
                    data-testid="zoom-out-btn"
                >
                    <ZoomOut size={ICON_SIZES.md} />
                </motion.button>

                <div className="w-16 h-1 bg-[var(--forge-border-default)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-[var(--ember)]"
                        style={{
                            width: `${Math.min(100, ((scale - 0.1) / (4 - 0.1)) * 100)}%`,
                        }}
                    />
                </div>

                <motion.button
                    onClick={onZoomIn}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-white/10 transition-colors"
                    title="Zoom In"
                    data-testid="zoom-in-btn"
                >
                    <ZoomIn size={ICON_SIZES.md} />
                </motion.button>
            </div>

            {/* Reset Button */}
            <motion.button
                onClick={onReset}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm border border-[var(--forge-border-subtle)] shadow-xl text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-white/10 transition-colors"
                title="Reset View"
                data-testid="reset-view-btn"
            >
                <RotateCcw size={ICON_SIZES.md} />
            </motion.button>
        </div>
    );
}

// ============================================================================
// ZOOM LEVEL INDICATOR
// ============================================================================

interface ZoomLevelIndicatorProps {
    level: ZoomLevel;
    className?: string;
}

export function ZoomLevelIndicator({ level, className }: ZoomLevelIndicatorProps) {
    const config = ZOOM_LEVEL_CONFIGS.find((c) => c.level === level);
    if (!config) return null;

    const Icon = ZOOM_LEVEL_ICONS[level];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm rounded-full px-4 py-2 border border-[var(--forge-border-subtle)] shadow-xl",
                className
            )}
            data-testid="zoom-level-indicator"
        >
            <Icon size={ICON_SIZES.sm} className="text-[var(--ember)]" />
            <div>
                <div className="text-[var(--forge-text-primary)] text-sm font-medium">{config.label}</div>
                <div className="text-[var(--forge-text-muted)] text-xs">{config.description}</div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// NAVIGATION BREADCRUMB
// ============================================================================

interface NavigationBreadcrumbProps {
    path: Array<{ id: string; name: string; type: string }>;
    onNavigate: (id: string) => void;
    className?: string;
}

export function NavigationBreadcrumb({
    path,
    onNavigate,
    className,
}: NavigationBreadcrumbProps) {
    if (path.length === 0) return null;

    return (
        <div
            className={cn(
                "absolute top-6 left-6 flex items-center gap-2 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-[var(--forge-border-subtle)] shadow-xl",
                className
            )}
            data-testid="navigation-breadcrumb"
        >
            <Compass size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
            {path.map((item, index) => (
                <React.Fragment key={item.id}>
                    {index > 0 && <span className="text-[var(--forge-text-muted)]">/</span>}
                    <button
                        onClick={() => onNavigate(item.id)}
                        className="text-sm text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] transition-colors"
                        data-testid={`breadcrumb-${item.id}`}
                    >
                        {item.name}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
}

// ============================================================================
// STATS DISPLAY
// ============================================================================

interface StatsDisplayProps {
    nodeCount: {
        planets: number;
        moons: number;
        stars: number;
        total: number;
    };
    visibleCount: number;
    fps?: number;
    className?: string;
}

export function StatsDisplay({
    nodeCount,
    visibleCount,
    fps,
    className,
}: StatsDisplayProps) {
    return (
        <div
            className={cn(
                "absolute bottom-6 right-6 flex flex-col gap-1 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-[var(--forge-border-subtle)] shadow-xl text-xs",
                className
            )}
            data-testid="universe-stats"
        >
            <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--forge-text-muted)]">Domains</span>
                <span className="text-[var(--forge-text-primary)] font-mono">{nodeCount.planets}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--forge-text-muted)]">Chapters</span>
                <span className="text-[var(--forge-text-primary)] font-mono">{nodeCount.moons}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--forge-text-muted)]">Lessons</span>
                <span className="text-[var(--forge-text-primary)] font-mono">{nodeCount.stars}</span>
            </div>
            <div className="border-t border-[var(--forge-border-subtle)] my-1" />
            <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--forge-text-muted)]">Visible</span>
                <span className="text-[var(--ember)] font-mono">{visibleCount}</span>
            </div>
            {fps !== undefined && (
                <div className="flex items-center justify-between gap-4">
                    <span className="text-[var(--forge-text-muted)]">FPS</span>
                    <span className={cn("font-mono", fps >= 55 ? "text-[var(--forge-success)]" : fps >= 30 ? "text-[var(--forge-warning)]" : "text-[var(--forge-error)]")}>
                        {fps}
                    </span>
                </div>
            )}
        </div>
    );
}
