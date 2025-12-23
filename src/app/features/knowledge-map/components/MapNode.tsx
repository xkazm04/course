"use client";

/**
 * MapNode Component
 *
 * Title-focused card component for the knowledge map.
 * Simplified design prioritizing readability:
 * - Stack badge (top-left) with child count
 * - Full-width title that wraps to 2 lines
 * - Progression level bar (right side)
 * - Progress bar as bottom border
 */

import React, { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import { DURATION_NORMAL, DURATION_SLOW } from "@/app/shared/lib/motionPrimitives";
import { HEX_COLORS, type DomainColorKey } from "@/app/shared/lib/learningDomains";
import type { LayoutNode } from "../lib/useMapLayout";
import {
    isDomainNode,
    isCourseNode,
    isChapterNode,
    isSectionNode,
    getLevelDepth,
} from "../lib/types";

interface MapNodeProps {
    node: LayoutNode;
    isSelected: boolean;
    onSelect: () => void;
    onDrillDown: () => void;
}

// Status styling - simplified for title-focused design
const STATUS_STYLES = {
    completed: {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-800 dark:text-emerald-200",
        glow: "shadow-emerald-200/50 dark:shadow-emerald-900/50",
        progressBg: "bg-emerald-500",
    },
    in_progress: {
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
        text: "text-indigo-800 dark:text-indigo-200",
        glow: "shadow-indigo-200/50 dark:shadow-indigo-900/50",
        progressBg: "bg-indigo-500",
    },
    available: {
        bg: "bg-white dark:bg-slate-800/60",
        text: "text-slate-800 dark:text-slate-200",
        glow: "shadow-slate-200/50 dark:shadow-slate-800/50",
        progressBg: "bg-slate-300 dark:bg-slate-600",
    },
    locked: {
        bg: "bg-slate-100 dark:bg-slate-900/40",
        text: "text-slate-400 dark:text-slate-500",
        glow: "",
        progressBg: "bg-slate-200 dark:bg-slate-700",
    },
};

// Progression level colors (vertical bar on right)
const PROGRESSION_COLORS: Record<number, string> = {
    0: "bg-emerald-500", // Foundation (domain)
    1: "bg-blue-500",    // Core (course)
    2: "bg-indigo-500",  // Intermediate (chapter)
    3: "bg-purple-500",  // Advanced (section)
    4: "bg-rose-500",    // Expert (concept)
};

/**
 * Get domain color for stack badge
 */
function getDomainColor(node: LayoutNode): string {
    const colorKey = node.color as DomainColorKey;
    return HEX_COLORS[colorKey] || HEX_COLORS.indigo;
}

/**
 * Get child count for stack badge
 */
function getChildCount(node: LayoutNode): number | null {
    if (isDomainNode(node)) {
        return node.courseCount;
    }
    if (isCourseNode(node)) {
        return node.chapterCount;
    }
    if (isChapterNode(node)) {
        return node.sectionCount;
    }
    return null;
}

export const MapNode: React.FC<MapNodeProps> = memo(function MapNode({
    node,
    isSelected,
    onSelect,
    onDrillDown,
}) {
    const styles = STATUS_STYLES[node.status];
    const isInteractive = node.status !== "locked";
    const hasChildren = node.childIds.length > 0;
    const childCount = getChildCount(node);
    const progressionLevel = getLevelDepth(node.level);
    const domainColor = getDomainColor(node);

    // Calculate progress percentage (0-100)
    const progressPercent = node.progress || 0;
    const showProgress = node.status !== "locked" && progressPercent > 0;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isInteractive) return;
        onSelect();
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isInteractive || !hasChildren) return;
        onDrillDown();
    };

    return (
        <motion.div
            className={cn(
                "absolute cursor-pointer select-none",
                "rounded-xl overflow-hidden",
                "transition-all duration-200",
                styles.bg,
                // Only show border on sides and top - bottom is progress bar
                "border-l-2 border-r-2 border-t-2",
                node.status === "completed" && "border-emerald-300 dark:border-emerald-700",
                node.status === "in_progress" && "border-indigo-300 dark:border-indigo-700",
                node.status === "available" && "border-slate-200 dark:border-slate-700",
                node.status === "locked" && "border-slate-200 dark:border-slate-800",
                isSelected && `ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900`,
                isSelected && styles.glow && `shadow-lg ${styles.glow}`,
                node.status === "locked" && "opacity-60 cursor-not-allowed"
            )}
            style={{
                left: node.layoutPosition.x,
                top: node.layoutPosition.y,
                width: node.width,
                minHeight: node.height,
            }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClick(e as unknown as React.MouseEvent);
                }
            }}
            whileHover={isInteractive ? { scale: 1.03, zIndex: 50 } : {}}
            whileTap={isInteractive ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: node.status === "locked" ? 0.6 : 1, scale: 1 }}
            transition={{ duration: DURATION_NORMAL }}
            tabIndex={isInteractive ? 0 : -1}
            role="button"
            aria-label={`${node.name}, ${node.status}${childCount ? `, ${childCount} items` : ""}`}
            aria-pressed={isSelected}
            data-testid={`map-node-${node.id}`}
        >
            {/* Stack badge with child count (top-left) */}
            {childCount !== null && (
                <div
                    className={cn(
                        "absolute -top-2 -left-2 z-10",
                        "w-6 h-6 rounded-full",
                        "flex items-center justify-center",
                        "text-[10px] font-bold text-white",
                        "border-2 border-white dark:border-slate-900",
                        "shadow-sm"
                    )}
                    style={{ backgroundColor: domainColor }}
                    title={`${childCount} items`}
                >
                    {childCount}
                </div>
            )}

            {/* Progression level bar (right side) */}
            <div
                className={cn(
                    "absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full",
                    PROGRESSION_COLORS[progressionLevel]
                )}
                title={`Level ${progressionLevel}`}
            />

            {/* Card content - full width title */}
            <div className="px-3 py-2 h-full flex flex-col justify-center">
                <h4 className={cn(
                    "text-sm font-semibold leading-snug",
                    "line-clamp-2",
                    styles.text
                )}>
                    {node.name}
                </h4>
            </div>

            {/* Progress bar as bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-1">
                {/* Background track */}
                <div className={cn(
                    "absolute inset-0",
                    node.status === "locked"
                        ? "bg-slate-200 dark:bg-slate-700"
                        : "bg-slate-200/50 dark:bg-slate-700/50"
                )} />

                {/* Progress fill */}
                {showProgress && (
                    <motion.div
                        className={cn("absolute inset-y-0 left-0", styles.progressBg)}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: DURATION_SLOW, delay: 0.2 }}
                    />
                )}

                {/* Completed state - full bar */}
                {node.status === "completed" && (
                    <div className={cn("absolute inset-0", styles.progressBg)} />
                )}
            </div>
        </motion.div>
    );
});

export default MapNode;
