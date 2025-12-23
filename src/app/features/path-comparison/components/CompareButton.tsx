"use client";

/**
 * CompareButton Component
 *
 * A toggle button to add/remove a path from comparison selection.
 * Integrates with PathCard and shows selection state.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompare, Check, Plus } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { LearningPath } from "@/app/shared/lib/types";

interface CompareButtonProps {
    /** The path this button controls */
    path: LearningPath;
    /** Whether the path is currently selected for comparison */
    isSelected: boolean;
    /** Whether more paths can be added */
    canAddMore: boolean;
    /** Handler for toggling selection */
    onToggle: (path: LearningPath) => void;
    /** Size variant */
    size?: "sm" | "md";
    /** Additional class names */
    className?: string;
}

export const CompareButton: React.FC<CompareButtonProps> = ({
    path,
    isSelected,
    canAddMore,
    onToggle,
    size = "sm",
    className,
}) => {
    const isDisabled = !isSelected && !canAddMore;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isDisabled) {
            onToggle(path);
        }
    };

    return (
        <motion.button
            onClick={handleClick}
            disabled={isDisabled}
            whileHover={!isDisabled ? { scale: 1.05 } : undefined}
            whileTap={!isDisabled ? { scale: 0.95 } : undefined}
            className={cn(
                "flex items-center gap-1.5 rounded-full font-medium transition-all",
                size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
                isSelected
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/20"
                    : isDisabled
                      ? "bg-[var(--surface-inset)] text-[var(--text-muted)] cursor-not-allowed opacity-50"
                      : "bg-[var(--surface-inset)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--surface-overlay)] hover:border-[var(--accent-primary)]",
                className
            )}
            data-testid={`compare-toggle-${path.id}`}
            aria-pressed={isSelected}
            aria-label={isSelected ? `Remove ${path.name} from comparison` : `Add ${path.name} to comparison`}
        >
            <AnimatePresence mode="wait">
                {isSelected ? (
                    <motion.span
                        key="selected"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex items-center gap-1.5"
                    >
                        <Check size={size === "sm" ? ICON_SIZES.xs : ICON_SIZES.sm} />
                        <span>Comparing</span>
                    </motion.span>
                ) : (
                    <motion.span
                        key="unselected"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex items-center gap-1.5"
                    >
                        <Plus size={size === "sm" ? ICON_SIZES.xs : ICON_SIZES.sm} />
                        <span>Compare</span>
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
};

/**
 * Floating Compare Badge Component
 *
 * Shows the number of selected paths and opens the comparison modal.
 */
interface ComparisonBadgeProps {
    /** Number of paths selected for comparison */
    selectedCount: number;
    /** Maximum paths allowed */
    maxPaths: number;
    /** Whether comparison is possible */
    canCompare: boolean;
    /** Handler to open comparison modal */
    onOpenModal: () => void;
    /** Handler to clear selection */
    onClear: () => void;
}

export const ComparisonBadge: React.FC<ComparisonBadgeProps> = ({
    selectedCount,
    maxPaths,
    canCompare,
    onOpenModal,
    onClear,
}) => {
    if (selectedCount === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-[var(--surface-elevated)] backdrop-blur-xl border border-[var(--border-default)] rounded-2xl shadow-xl"
            data-testid="comparison-badge"
        >
            <div className="flex items-center gap-2 text-sm">
                <GitCompare size={ICON_SIZES.md} className="text-[var(--accent-primary)]" />
                <span className="font-medium text-[var(--text-primary)]">
                    {selectedCount} of {maxPaths}
                </span>
                <span className="text-[var(--text-muted)]">paths selected</span>
            </div>

            <div className="h-6 w-px bg-[var(--border-default)]" />

            <button
                onClick={onClear}
                className="px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-red-500 transition-colors"
                data-testid="clear-comparison-btn"
            >
                Clear
            </button>

            <button
                onClick={onOpenModal}
                disabled={!canCompare}
                className={cn(
                    "px-4 py-1.5 rounded-xl text-sm font-bold transition-all",
                    canCompare
                        ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90"
                        : "bg-[var(--surface-inset)] text-[var(--text-muted)] cursor-not-allowed"
                )}
                data-testid="open-comparison-modal-btn"
            >
                Compare {canCompare && `(${selectedCount})`}
            </button>
        </motion.div>
    );
};

export default CompareButton;
