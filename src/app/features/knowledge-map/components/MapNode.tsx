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
        bg: "bg-[var(--forge-success)]/10",
        text: "text-[var(--forge-success)]",
        glow: "shadow-[var(--forge-success)]/30",
        progressBg: "bg-[var(--forge-success)]",
    },
    in_progress: {
        bg: "bg-[var(--ember)]/10",
        text: "text-[var(--ember)]",
        glow: "shadow-[var(--ember)]/30",
        progressBg: "bg-[var(--ember)]",
    },
    available: {
        bg: "bg-[var(--forge-bg-elevated)]",
        text: "text-[var(--forge-text-primary)]",
        glow: "shadow-[var(--forge-border-subtle)]",
        progressBg: "bg-[var(--forge-text-muted)]",
    },
    locked: {
        bg: "bg-[var(--forge-bg-anvil)]",
        text: "text-[var(--forge-text-muted)]",
        glow: "",
        progressBg: "bg-[var(--forge-border-subtle)]",
    },
};

// Progression level colors (vertical bar on right)
const PROGRESSION_COLORS: Record<number, string> = {
    0: "bg-[var(--forge-success)]", // Foundation (domain)
    1: "bg-[var(--forge-info)]",    // Core (course)
    2: "bg-[var(--ember)]",         // Intermediate (chapter)
    3: "bg-[var(--ember-glow)]",    // Advanced (section)
    4: "bg-[var(--forge-error)]",   // Expert (concept)
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
                node.status === "completed" && "border-[var(--forge-success)]/50",
                node.status === "in_progress" && "border-[var(--ember)]/50",
                node.status === "available" && "border-[var(--forge-border-subtle)]",
                node.status === "locked" && "border-[var(--forge-border-subtle)]",
                isSelected && `ring-2 ring-[var(--ember)] ring-offset-2 ring-offset-[var(--forge-bg-anvil)]`,
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
                        "text-[10px] font-bold text-[var(--forge-text-primary)]",
                        "border-2 border-[var(--forge-bg-elevated)]",
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
                        ? "bg-[var(--forge-border-subtle)]"
                        : "bg-[var(--forge-border-subtle)]/50"
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
