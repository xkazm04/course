"use client";

/**
 * TruncatedBreadcrumbs Component
 *
 * Handles display of long breadcrumb paths by:
 * - Showing first and last few items
 * - Collapsing middle items into an expandable dropdown
 * - Providing mobile-friendly touch targets
 * - Supporting keyboard navigation
 */

import React, { memo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, ChevronRight } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { BreadcrumbItem, type BreadcrumbItemData } from "./BreadcrumbItem";

// ============================================================================
// TYPES
// ============================================================================

export interface TruncatedBreadcrumbsProps {
    /** All breadcrumb items */
    items: BreadcrumbItemData[];
    /** Maximum items to show before truncating */
    maxVisible?: number;
    /** Items to always show at start (including root) */
    showStart?: number;
    /** Items to always show at end (including current) */
    showEnd?: number;
    /** Callback when an item is clicked */
    onNavigate: (index: number) => void;
    /** Whether in mobile mode */
    isMobile?: boolean;
    /** Additional class names */
    className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_VISIBLE = 5;
const DEFAULT_SHOW_START = 2;
const DEFAULT_SHOW_END = 2;

// ============================================================================
// TRUNCATED BREADCRUMBS COMPONENT
// ============================================================================

export const TruncatedBreadcrumbs: React.FC<TruncatedBreadcrumbsProps> = memo(
    function TruncatedBreadcrumbs({
        items,
        maxVisible = DEFAULT_MAX_VISIBLE,
        showStart = DEFAULT_SHOW_START,
        showEnd = DEFAULT_SHOW_END,
        onNavigate,
        isMobile = false,
        className,
    }) {
        const [expanded, setExpanded] = useState(false);
        const dropdownRef = useRef<HTMLDivElement>(null);
        const buttonRef = useRef<HTMLButtonElement>(null);

        // Calculate which items to show
        const needsTruncation = items.length > maxVisible;
        const hiddenCount = needsTruncation ? items.length - showStart - showEnd : 0;

        // Close dropdown when clicking outside
        useEffect(() => {
            if (!expanded) return;

            const handleClickOutside = (e: MouseEvent) => {
                if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(e.target as Node) &&
                    buttonRef.current &&
                    !buttonRef.current.contains(e.target as Node)
                ) {
                    setExpanded(false);
                }
            };

            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    setExpanded(false);
                    buttonRef.current?.focus();
                }
            };

            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscape);

            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("keydown", handleEscape);
            };
        }, [expanded]);

        // If no truncation needed, render all items normally
        if (!needsTruncation) {
            return (
                <div className={cn("flex items-center gap-1", className)}>
                    {items.map((item, index) => (
                        <React.Fragment key={item.nodeId ?? "root"}>
                            {index > 0 && (
                                <ChevronRight
                                    size={ICON_SIZES.xs}
                                    className="text-[var(--forge-text-muted)] flex-shrink-0"
                                />
                            )}
                            <BreadcrumbItem
                                item={item}
                                index={index}
                                isCurrent={index === items.length - 1}
                                isFirst={index === 0}
                                onClick={() => onNavigate(index - 1)}
                                animationDelay={index * 0.05}
                            />
                        </React.Fragment>
                    ))}
                </div>
            );
        }

        // Split items for truncation
        const startItems = items.slice(0, showStart);
        const hiddenItems = items.slice(showStart, items.length - showEnd);
        const endItems = items.slice(items.length - showEnd);

        return (
            <div className={cn("flex items-center gap-1", className)}>
                {/* Start items (always visible) */}
                {startItems.map((item, index) => (
                    <React.Fragment key={item.nodeId ?? "root"}>
                        {index > 0 && (
                            <ChevronRight
                                size={ICON_SIZES.xs}
                                className="text-[var(--forge-text-muted)] flex-shrink-0"
                            />
                        )}
                        <BreadcrumbItem
                            item={item}
                            index={index}
                            isCurrent={false}
                            isFirst={index === 0}
                            onClick={() => onNavigate(index - 1)}
                            animationDelay={index * 0.05}
                        />
                    </React.Fragment>
                ))}

                {/* Collapsed items (ellipsis) */}
                {hiddenItems.length > 0 && (
                    <>
                        <ChevronRight
                            size={ICON_SIZES.xs}
                            className="text-[var(--forge-text-muted)] flex-shrink-0"
                        />

                        <div className="relative">
                            <motion.button
                                ref={buttonRef}
                                onClick={() => setExpanded(!expanded)}
                                className={cn(
                                    "flex items-center justify-center",
                                    "w-8 h-8 rounded-md",
                                    "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]",
                                    "hover:bg-[var(--forge-bg-anvil)] transition-colors",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)]",
                                    expanded && "bg-[var(--forge-bg-anvil)]"
                                )}
                                aria-expanded={expanded}
                                aria-haspopup="true"
                                aria-label={`${hiddenCount} hidden items`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <MoreHorizontal size={ICON_SIZES.sm} />
                            </motion.button>

                            {/* Dropdown menu */}
                            <AnimatePresence>
                                {expanded && (
                                    <CollapsedItemsDropdown
                                        ref={dropdownRef}
                                        items={hiddenItems}
                                        startOffset={showStart}
                                        onSelect={(index) => {
                                            onNavigate(showStart + index - 1);
                                            setExpanded(false);
                                        }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                )}

                {/* End items (always visible) */}
                {endItems.map((item, idx) => {
                    const realIndex = items.length - showEnd + idx;
                    const isCurrent = realIndex === items.length - 1;

                    return (
                        <React.Fragment key={item.nodeId ?? `end-${idx}`}>
                            <ChevronRight
                                size={ICON_SIZES.xs}
                                className="text-[var(--forge-text-muted)] flex-shrink-0"
                            />
                            <BreadcrumbItem
                                item={item}
                                index={realIndex}
                                isCurrent={isCurrent}
                                isFirst={false}
                                onClick={() => onNavigate(realIndex - 1)}
                                animationDelay={0.1 + idx * 0.05}
                            />
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }
);

// ============================================================================
// COLLAPSED ITEMS DROPDOWN
// ============================================================================

interface CollapsedItemsDropdownProps {
    items: BreadcrumbItemData[];
    startOffset: number;
    onSelect: (index: number) => void;
}

const CollapsedItemsDropdown = React.forwardRef<HTMLDivElement, CollapsedItemsDropdownProps>(
    function CollapsedItemsDropdown({ items, startOffset, onSelect }, ref) {
        const [focusedIndex, setFocusedIndex] = useState(-1);
        const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

        const handleKeyDown = (e: React.KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setFocusedIndex((prev) => Math.max(prev - 1, 0));
                    break;
                case "Enter":
                case " ":
                    e.preventDefault();
                    if (focusedIndex >= 0) {
                        onSelect(focusedIndex);
                    }
                    break;
                case "Home":
                    e.preventDefault();
                    setFocusedIndex(0);
                    break;
                case "End":
                    e.preventDefault();
                    setFocusedIndex(items.length - 1);
                    break;
            }
        };

        // Focus the focused item
        useEffect(() => {
            if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
                itemRefs.current[focusedIndex]?.focus();
            }
        }, [focusedIndex]);

        // Focus first item on open
        useEffect(() => {
            const timer = setTimeout(() => {
                setFocusedIndex(0);
            }, 50);
            return () => clearTimeout(timer);
        }, []);

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={cn(
                    "absolute top-full left-0 mt-2 z-50",
                    "min-w-[180px] max-w-[280px]",
                    "py-1 rounded-lg",
                    "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]",
                    "shadow-lg shadow-black/20",
                    "max-h-[240px] overflow-y-auto"
                )}
                role="menu"
                onKeyDown={handleKeyDown}
            >
                {items.map((item, index) => (
                    <button
                        key={item.nodeId ?? `collapsed-${index}`}
                        ref={(el) => {
                            itemRefs.current[index] = el;
                        }}
                        onClick={() => onSelect(index)}
                        role="menuitem"
                        tabIndex={focusedIndex === index ? 0 : -1}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-left text-sm",
                            "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)]",
                            "hover:bg-[var(--forge-bg-anvil)] transition-colors",
                            "focus:outline-none focus:bg-[var(--forge-bg-anvil)]",
                            focusedIndex === index && "bg-[var(--forge-bg-anvil)]"
                        )}
                    >
                        <ChevronRight
                            size={10}
                            className="text-[var(--forge-text-muted)] flex-shrink-0"
                        />
                        <span className="truncate">{item.label}</span>
                        <span className="ml-auto text-xs text-[var(--forge-text-muted)]">
                            {item.level}
                        </span>
                    </button>
                ))}

                {/* Arrow pointer */}
                <div className="absolute -top-1.5 left-3 w-3 h-3 rotate-45 bg-[var(--forge-bg-elevated)] border-t border-l border-[var(--forge-border-subtle)]" />
            </motion.div>
        );
    }
);

// ============================================================================
// MOBILE BREADCRUMBS
// ============================================================================

interface MobileBreadcrumbsProps {
    items: BreadcrumbItemData[];
    onNavigate: (index: number) => void;
    className?: string;
}

export const MobileBreadcrumbs: React.FC<MobileBreadcrumbsProps> = memo(
    function MobileBreadcrumbs({ items, onNavigate, className }) {
        const [expanded, setExpanded] = useState(false);

        if (items.length <= 1) return null;

        const currentItem = items[items.length - 1];
        const parentItem = items.length > 1 ? items[items.length - 2] : null;

        return (
            <div className={cn("relative", className)}>
                {/* Compact view - just parent and current */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2",
                        "bg-[var(--forge-bg-elevated)] rounded-lg",
                        "border border-[var(--forge-border-subtle)]",
                        "text-sm"
                    )}
                >
                    {parentItem && (
                        <>
                            <span className="text-[var(--forge-text-muted)] truncate max-w-[80px]">
                                {parentItem.label}
                            </span>
                            <ChevronRight
                                size={12}
                                className="text-[var(--forge-text-muted)]"
                            />
                        </>
                    )}
                    <span className="text-[var(--forge-text-primary)] font-medium truncate max-w-[120px]">
                        {currentItem.label}
                    </span>
                    <motion.div
                        animate={{ rotate: expanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight
                            size={12}
                            className="text-[var(--forge-text-muted)] rotate-90"
                        />
                    </motion.div>
                </button>

                {/* Expanded full path */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className={cn(
                                "absolute top-full left-0 right-0 mt-2 z-50",
                                "bg-[var(--forge-bg-elevated)] rounded-lg",
                                "border border-[var(--forge-border-subtle)]",
                                "shadow-lg shadow-black/20",
                                "p-2"
                            )}
                        >
                            {items.map((item, index) => {
                                const isCurrent = index === items.length - 1;
                                return (
                                    <button
                                        key={item.nodeId ?? "root"}
                                        onClick={() => {
                                            if (!isCurrent) {
                                                onNavigate(index - 1);
                                            }
                                            setExpanded(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-left",
                                            isCurrent
                                                ? "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-primary)]"
                                                : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)]"
                                        )}
                                        style={{ paddingLeft: `${12 + index * 12}px` }}
                                    >
                                        <span className="truncate">{item.label}</span>
                                        <span className="ml-auto text-xs text-[var(--forge-text-muted)]">
                                            {item.level}
                                        </span>
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

export default TruncatedBreadcrumbs;
