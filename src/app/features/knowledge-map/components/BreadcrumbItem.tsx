"use client";

/**
 * BreadcrumbItem Component
 *
 * Individual breadcrumb item with:
 * - Hover tooltip showing preview info
 * - Click handler for navigation
 * - Animated entrance/exit
 * - Visual distinction for current vs clickable items
 * - Keyboard accessibility
 */

import React, { memo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Folder, BookOpen, FileText, Lightbulb } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { NodeLevel } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

export interface BreadcrumbItemData {
    /** Node ID (null for root) */
    nodeId: string | null;
    /** Display label */
    label: string;
    /** Hierarchy level */
    level: NodeLevel | "root";
    /** Optional description for tooltip */
    description?: string;
    /** Optional progress percentage */
    progress?: number;
    /** Optional child count */
    childCount?: number;
}

export interface BreadcrumbItemProps {
    /** Item data */
    item: BreadcrumbItemData;
    /** Position in breadcrumb trail */
    index: number;
    /** Whether this is the current/active item */
    isCurrent: boolean;
    /** Whether this is the first item (root) */
    isFirst: boolean;
    /** Click handler */
    onClick: () => void;
    /** Animation delay for stagger effect */
    animationDelay?: number;
    /** Additional class names */
    className?: string;
}

// ============================================================================
// LEVEL ICONS
// ============================================================================

const LEVEL_ICONS: Record<NodeLevel | "root", typeof Home> = {
    root: Home,
    domain: Folder,
    course: BookOpen,
    chapter: FileText,
    section: FileText,
    concept: Lightbulb,
};

const LEVEL_COLORS: Record<NodeLevel | "root", string> = {
    root: "text-[var(--forge-text-muted)]",
    domain: "text-blue-400",
    course: "text-purple-400",
    chapter: "text-emerald-400",
    section: "text-amber-400",
    concept: "text-rose-400",
};

// ============================================================================
// BREADCRUMB ITEM COMPONENT
// ============================================================================

export const BreadcrumbItem: React.FC<BreadcrumbItemProps> = memo(
    function BreadcrumbItem({
        item,
        index,
        isCurrent,
        isFirst,
        onClick,
        animationDelay = 0,
        className,
    }) {
        const [showTooltip, setShowTooltip] = useState(false);
        const buttonRef = useRef<HTMLButtonElement>(null);
        const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        const Icon = LEVEL_ICONS[item.level];
        const levelColor = LEVEL_COLORS[item.level];

        const handleMouseEnter = () => {
            // Delay tooltip appearance for better UX
            tooltipTimeoutRef.current = setTimeout(() => {
                setShowTooltip(true);
            }, 400);
        };

        const handleMouseLeave = () => {
            if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current);
            }
            setShowTooltip(false);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!isCurrent) {
                    onClick();
                }
            }
        };

        return (
            <motion.div
                className="relative"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{
                    duration: 0.2,
                    delay: animationDelay,
                    ease: "easeOut",
                }}
            >
                <motion.button
                    ref={buttonRef}
                    onClick={() => !isCurrent && onClick()}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onKeyDown={handleKeyDown}
                    disabled={isCurrent}
                    aria-current={isCurrent ? "page" : undefined}
                    className={cn(
                        "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-all duration-150",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forge-bg-primary)]",
                        isCurrent
                            ? "text-[var(--forge-text-primary)] font-medium cursor-default bg-[var(--forge-bg-anvil)]/50"
                            : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-anvil)] cursor-pointer",
                        className
                    )}
                    whileHover={!isCurrent ? { scale: 1.02 } : {}}
                    whileTap={!isCurrent ? { scale: 0.98 } : {}}
                >
                    {/* Icon */}
                    <Icon
                        size={ICON_SIZES.xs}
                        className={cn(
                            "flex-shrink-0 transition-colors",
                            isCurrent ? levelColor : "text-[var(--forge-text-muted)]"
                        )}
                    />

                    {/* Label */}
                    <span
                        className={cn(
                            "truncate",
                            isFirst ? "max-w-[80px]" : "max-w-[140px]"
                        )}
                    >
                        {item.label}
                    </span>
                </motion.button>

                {/* Tooltip */}
                <AnimatePresence>
                    {showTooltip && !isCurrent && item.nodeId && (
                        <BreadcrumbTooltip
                            item={item}
                            buttonRef={buttonRef}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }
);

// ============================================================================
// BREADCRUMB TOOLTIP
// ============================================================================

interface BreadcrumbTooltipProps {
    item: BreadcrumbItemData;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
}

const BreadcrumbTooltip: React.FC<BreadcrumbTooltipProps> = memo(
    function BreadcrumbTooltip({ item, buttonRef }) {
        const Icon = LEVEL_ICONS[item.level];
        const levelColor = LEVEL_COLORS[item.level];

        return (
            <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={cn(
                    "absolute top-full left-0 mt-2 z-50",
                    "min-w-[200px] max-w-[300px]",
                    "p-3 rounded-lg",
                    "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]",
                    "shadow-lg shadow-black/20"
                )}
                role="tooltip"
            >
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className={levelColor} />
                    <span className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wide">
                        {item.level}
                    </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-semibold text-[var(--forge-text-primary)] mb-1">
                    {item.label}
                </h4>

                {/* Description */}
                {item.description && (
                    <p className="text-xs text-[var(--forge-text-secondary)] mb-2 line-clamp-2">
                        {item.description}
                    </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-[var(--forge-text-muted)]">
                    {typeof item.progress === "number" && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-[var(--forge-bg-anvil)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--ember)]"
                                    style={{ width: `${item.progress}%` }}
                                />
                            </div>
                            <span>{item.progress}%</span>
                        </div>
                    )}
                    {typeof item.childCount === "number" && (
                        <span>
                            {item.childCount} {item.childCount === 1 ? "item" : "items"}
                        </span>
                    )}
                </div>

                {/* Click hint */}
                <div className="mt-2 pt-2 border-t border-[var(--forge-border-subtle)]">
                    <span className="text-[10px] text-[var(--forge-text-muted)]">
                        Click to navigate here
                    </span>
                </div>

                {/* Arrow pointer */}
                <div className="absolute -top-1.5 left-4 w-3 h-3 rotate-45 bg-[var(--forge-bg-elevated)] border-t border-l border-[var(--forge-border-subtle)]" />
            </motion.div>
        );
    }
);

export default BreadcrumbItem;
