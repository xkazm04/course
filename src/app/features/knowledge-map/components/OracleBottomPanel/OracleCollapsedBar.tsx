"use client";

/**
 * OracleCollapsedBar Component
 *
 * Thin 48px CTA bar shown when the Oracle panel is collapsed.
 * Displays status and expand/toggle controls.
 */

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronUp, ChevronDown, Eye, Compass } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { OracleWizardStep } from "../../lib/types";

// ============================================================================
// TYPES
// ============================================================================

export interface OracleCollapsedBarProps {
    /** Whether panel is expanded */
    isExpanded: boolean;
    /** Toggle expansion */
    onToggle: () => void;
    /** Whether path has been generated */
    hasGeneratedPath: boolean;
    /** Show path preview */
    onShowPathPreview: () => void;
    /** Current wizard step */
    activeStep: OracleWizardStep;
}

// ============================================================================
// STEP LABELS
// ============================================================================

const stepLabels: Record<OracleWizardStep, string> = {
    skills: "Enter your skills",
    goal: "Choose your goal",
    preferences: "Set preferences",
    generating: "Generating path...",
    complete: "Path ready!",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function OracleCollapsedBar({
    isExpanded,
    onToggle,
    hasGeneratedPath,
    onShowPathPreview,
    activeStep,
}: OracleCollapsedBarProps) {
    return (
        <div
            className={cn(
                "h-12 px-4",
                "flex items-center justify-between",
                "cursor-pointer",
                "group"
            )}
            onClick={onToggle}
            data-testid="oracle-collapsed-bar"
        >
            {/* Left side - Oracle branding and status */}
            <div className="flex items-center gap-3">
                <motion.div
                    className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        "bg-gradient-to-br from-indigo-500 to-purple-600",
                        "shadow-lg shadow-indigo-500/25"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Compass size={ICON_SIZES.sm} className="text-white" />
                </motion.div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Career Oracle
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {hasGeneratedPath ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <Sparkles size={10} />
                                Path generated - click to view
                            </span>
                        ) : (
                            stepLabels[activeStep]
                        )}
                    </span>
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
                {/* View Path button - only when path is generated */}
                {hasGeneratedPath && !isExpanded && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowPathPreview();
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-lg",
                            "text-xs font-medium",
                            "bg-indigo-100 dark:bg-indigo-900/40",
                            "text-indigo-700 dark:text-indigo-300",
                            "hover:bg-indigo-200 dark:hover:bg-indigo-900/60",
                            "transition-colors",
                            "flex items-center gap-1.5"
                        )}
                        data-testid="view-path-btn"
                    >
                        <Eye size={12} />
                        View Path
                    </button>
                )}

                {/* Expand/Collapse indicator */}
                <motion.div
                    className={cn(
                        "p-2 rounded-lg",
                        "text-slate-400 dark:text-slate-500",
                        "group-hover:text-slate-600 dark:group-hover:text-slate-300",
                        "group-hover:bg-slate-100 dark:group-hover:bg-slate-700/50",
                        "transition-colors"
                    )}
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronUp size={ICON_SIZES.sm} />
                </motion.div>
            </div>
        </div>
    );
}
