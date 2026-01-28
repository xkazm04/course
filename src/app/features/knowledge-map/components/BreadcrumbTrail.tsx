"use client";

/**
 * BreadcrumbTrail Component
 *
 * Main breadcrumb navigation component that integrates:
 * - BreadcrumbItem with tooltips
 * - TruncatedBreadcrumbs for long paths
 * - Path history with back/forward navigation
 * - Keyboard navigation (Escape to go up)
 * - Animated transitions
 * - Mobile-responsive layout
 *
 * Usage:
 * ```tsx
 * <BreadcrumbTrail
 *   items={breadcrumbItems}
 *   onNavigate={drillUp}
 *   currentDepth={scene.depth}
 *   isTransitioning={scene.isTransitioning}
 * />
 * ```
 */

import React, { memo, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Home,
    History,
    X,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { BreadcrumbItem, type BreadcrumbItemData } from "./BreadcrumbItem";
import { TruncatedBreadcrumbs, MobileBreadcrumbs } from "./TruncatedBreadcrumbs";
import { DepthIndicator } from "./TransitionAnimator";
import {
    usePathHistory,
    type HistoryEntry,
} from "../lib/pathHistoryManager";
import type { BreadcrumbItem as BreadcrumbItemType, NodeLevel } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

export interface BreadcrumbTrailProps {
    /** Breadcrumb items from scene graph */
    items: BreadcrumbItemType[];
    /** Callback when navigating to a breadcrumb (index in viewStack, -1 for root) */
    onNavigate: (toIndex: number) => void;
    /** Current depth in hierarchy */
    currentDepth: number;
    /** Whether a transition is in progress */
    isTransitioning?: boolean;
    /** Current transition type */
    transitionType?: string | null;
    /** Whether to enable keyboard navigation */
    enableKeyboardNav?: boolean;
    /** Whether to show history buttons */
    showHistory?: boolean;
    /** Whether to show depth indicator */
    showDepthIndicator?: boolean;
    /** Maximum items before truncation */
    maxVisibleItems?: number;
    /** Mobile breakpoint (use media query) */
    isMobile?: boolean;
    /** Additional class names */
    className?: string;
}

// ============================================================================
// BREADCRUMB TRAIL COMPONENT
// ============================================================================

export const BreadcrumbTrail: React.FC<BreadcrumbTrailProps> = memo(
    function BreadcrumbTrail({
        items,
        onNavigate,
        currentDepth,
        isTransitioning = false,
        transitionType = null,
        enableKeyboardNav = true,
        showHistory = true,
        showDepthIndicator = false,
        maxVisibleItems = 5,
        isMobile = false,
        className,
    }) {
        // Path history management
        const {
            canGoBack,
            canGoForward,
            goBack,
            goForward,
            push: pushHistory,
            entries: historyEntries,
            currentIndex: historyIndex,
        } = usePathHistory();

        // Track history dropdown state
        const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

        // Convert items to enhanced data format
        const enhancedItems: BreadcrumbItemData[] = items.map((item) => ({
            nodeId: item.nodeId,
            label: item.label,
            level: item.level as NodeLevel | "root",
        }));

        // Push to history when navigation changes
        useEffect(() => {
            if (items.length > 0) {
                const viewStack = items.slice(1).map((item) => item.nodeId).filter(Boolean) as string[];
                pushHistory({
                    viewStack,
                    selectedNodeId: null,
                    title: items[items.length - 1]?.label,
                });
            }
        }, [items, pushHistory]);

        // Handle keyboard navigation
        useEffect(() => {
            if (!enableKeyboardNav) return;

            const handleKeyDown = (e: KeyboardEvent) => {
                // Don't handle if user is typing in an input
                if (
                    e.target instanceof HTMLInputElement ||
                    e.target instanceof HTMLTextAreaElement
                ) {
                    return;
                }

                switch (e.key) {
                    case "Escape":
                        // Go up one level
                        if (currentDepth > 0 && !isTransitioning) {
                            e.preventDefault();
                            onNavigate(items.length - 3); // Go to parent of current
                        }
                        break;
                    case "Backspace":
                        // Go back in history (with Alt/Meta modifier)
                        if ((e.altKey || e.metaKey) && canGoBack && !isTransitioning) {
                            e.preventDefault();
                            handleHistoryBack();
                        }
                        break;
                    case "ArrowLeft":
                        // Go back in history (with Alt modifier)
                        if (e.altKey && canGoBack && !isTransitioning) {
                            e.preventDefault();
                            handleHistoryBack();
                        }
                        break;
                    case "ArrowRight":
                        // Go forward in history (with Alt modifier)
                        if (e.altKey && canGoForward && !isTransitioning) {
                            e.preventDefault();
                            handleHistoryForward();
                        }
                        break;
                }
            };

            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }, [
            enableKeyboardNav,
            currentDepth,
            isTransitioning,
            items,
            onNavigate,
            canGoBack,
            canGoForward,
        ]);

        // Handle history navigation
        const handleHistoryBack = useCallback(() => {
            const entry = goBack();
            if (entry) {
                // Navigate to the history entry's state
                const targetIndex = entry.viewStack.length - 1;
                onNavigate(targetIndex);
            }
        }, [goBack, onNavigate]);

        const handleHistoryForward = useCallback(() => {
            const entry = goForward();
            if (entry) {
                const targetIndex = entry.viewStack.length - 1;
                onNavigate(targetIndex);
            }
        }, [goForward, onNavigate]);

        // Don't show breadcrumb at root level
        if (items.length <= 1) {
            return null;
        }

        return (
            <nav
                className={cn(
                    "flex items-center gap-2",
                    "px-3 py-2",
                    "bg-[var(--forge-bg-elevated)]/90 backdrop-blur-md",
                    "rounded-lg border border-[var(--forge-border-subtle)]",
                    "shadow-md",
                    isTransitioning && "pointer-events-none",
                    className
                )}
                aria-label="Breadcrumb navigation"
            >
                {/* History navigation buttons */}
                {showHistory && (
                    <div className="flex items-center gap-1 pr-2 border-r border-[var(--forge-border-subtle)]">
                        <HistoryButton
                            direction="back"
                            disabled={!canGoBack || isTransitioning}
                            onClick={handleHistoryBack}
                        />
                        <HistoryButton
                            direction="forward"
                            disabled={!canGoForward || isTransitioning}
                            onClick={handleHistoryForward}
                        />
                        {historyEntries.length > 1 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                                    className={cn(
                                        "p-1.5 rounded-md transition-colors",
                                        "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]",
                                        "hover:bg-[var(--forge-bg-anvil)]",
                                        showHistoryDropdown && "bg-[var(--forge-bg-anvil)]"
                                    )}
                                    aria-label="View history"
                                >
                                    <History size={ICON_SIZES.xs} />
                                </button>
                                <AnimatePresence>
                                    {showHistoryDropdown && (
                                        <HistoryDropdown
                                            entries={historyEntries}
                                            currentIndex={historyIndex}
                                            onSelect={(index) => {
                                                const entry = historyEntries[index];
                                                if (entry) {
                                                    const targetIndex = entry.viewStack.length - 1;
                                                    onNavigate(targetIndex);
                                                }
                                                setShowHistoryDropdown(false);
                                            }}
                                            onClose={() => setShowHistoryDropdown(false)}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                )}

                {/* Breadcrumb items */}
                <div className="flex-1 min-w-0">
                    {isMobile ? (
                        <MobileBreadcrumbs
                            items={enhancedItems}
                            onNavigate={onNavigate}
                        />
                    ) : (
                        <TruncatedBreadcrumbs
                            items={enhancedItems}
                            maxVisible={maxVisibleItems}
                            onNavigate={onNavigate}
                        />
                    )}
                </div>

                {/* Depth indicator */}
                {showDepthIndicator && (
                    <div className="pl-2 border-l border-[var(--forge-border-subtle)]">
                        <DepthIndicator
                            currentDepth={currentDepth}
                            isTransitioning={isTransitioning}
                            transitionType={transitionType as "drill_down" | "drill_up" | null}
                        />
                    </div>
                )}
            </nav>
        );
    }
);

// ============================================================================
// HISTORY BUTTON
// ============================================================================

interface HistoryButtonProps {
    direction: "back" | "forward";
    disabled: boolean;
    onClick: () => void;
}

const HistoryButton: React.FC<HistoryButtonProps> = memo(function HistoryButton({
    direction,
    disabled,
    onClick,
}) {
    const Icon = direction === "back" ? ChevronLeft : ChevronRight;
    const label = direction === "back" ? "Go back" : "Go forward";
    const shortcut = direction === "back" ? "Alt+←" : "Alt+→";

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "p-1.5 rounded-md transition-colors",
                disabled
                    ? "text-[var(--forge-text-muted)]/50 cursor-not-allowed"
                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-anvil)]"
            )}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            title={`${label} (${shortcut})`}
            aria-label={label}
        >
            <Icon size={ICON_SIZES.sm} />
        </motion.button>
    );
});

// ============================================================================
// HISTORY DROPDOWN
// ============================================================================

interface HistoryDropdownProps {
    entries: HistoryEntry[];
    currentIndex: number;
    onSelect: (index: number) => void;
    onClose: () => void;
}

const HistoryDropdown: React.FC<HistoryDropdownProps> = memo(function HistoryDropdown({
    entries,
    currentIndex,
    onSelect,
    onClose,
}) {
    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("[data-history-dropdown]")) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    // Show last 10 entries, reversed (most recent first)
    const visibleEntries = entries.slice(-10).reverse();
    const offset = Math.max(0, entries.length - 10);

    return (
        <motion.div
            data-history-dropdown
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
                "absolute top-full left-0 mt-2 z-50",
                "w-[280px] max-h-[320px] overflow-y-auto",
                "py-1 rounded-lg",
                "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]",
                "shadow-lg shadow-black/20"
            )}
        >
            <div className="px-3 py-2 border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wide">
                        Recent History
                    </span>
                    <button
                        onClick={onClose}
                        className="p-0.5 hover:bg-[var(--forge-bg-anvil)] rounded"
                    >
                        <X size={12} className="text-[var(--forge-text-muted)]" />
                    </button>
                </div>
            </div>

            {visibleEntries.map((entry, index) => {
                const realIndex = entries.length - 1 - index;
                const isCurrent = realIndex === currentIndex;

                return (
                    <button
                        key={entry.id}
                        onClick={() => onSelect(realIndex)}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-left text-sm",
                            "transition-colors",
                            isCurrent
                                ? "bg-[var(--ember)]/10 text-[var(--ember)]"
                                : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-anvil)]"
                        )}
                    >
                        {isCurrent ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--ember)]" />
                        ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--forge-bg-anvil)]" />
                        )}
                        <span className="flex-1 truncate">
                            {entry.title || entry.viewStack[entry.viewStack.length - 1] || "Root"}
                        </span>
                        <span className="text-[10px] text-[var(--forge-text-muted)]">
                            {formatRelativeTime(entry.timestamp)}
                        </span>
                    </button>
                );
            })}

            {entries.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-[var(--forge-text-muted)]">
                    No navigation history
                </div>
            )}
        </motion.div>
    );
});

// ============================================================================
// HELPERS
// ============================================================================

function formatRelativeTime(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default BreadcrumbTrail;
