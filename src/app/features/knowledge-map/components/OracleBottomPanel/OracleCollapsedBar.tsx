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
                "relative h-12 px-4",
                "flex items-center justify-between",
                "cursor-pointer",
                "group",
                // Glassmorphism base
                "backdrop-blur-xl",
                "bg-gradient-to-r from-transparent to-[var(--forge-bg-elevated)]/50",
                // Subtle inner border highlight
                "border border-white/5",
                "rounded-t-xl",
                // Smooth transitions
                "transition-all duration-300",
                "hover:border-white/10",
                "hover:bg-[var(--forge-bg-elevated)]/30"
            )}
            onClick={onToggle}
            data-testid="oracle-collapsed-bar"
        >
            {/* Top highlight line - visual affordance for clickability */}
            <div
                className={cn(
                    "absolute top-0 left-4 right-4 h-px",
                    "bg-gradient-to-r from-transparent via-white/20 to-transparent",
                    "group-hover:via-white/30",
                    "transition-all duration-300"
                )}
                aria-hidden="true"
            />
            {/* Left side - Oracle branding and status */}
            <div className="flex items-center gap-3">
                <motion.div
                    className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        "bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)]",
                        "shadow-lg shadow-[var(--ember)]/25"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Compass size={ICON_SIZES.sm} className="text-white" />
                </motion.div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[var(--forge-text-primary)]">
                        Career Oracle
                    </span>
                    <span className="text-xs text-[var(--forge-text-secondary)]">
                        {hasGeneratedPath ? (
                            <span className="flex items-center gap-1 text-[var(--forge-success)]">
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
                            "bg-[var(--ember)]/20",
                            "text-[var(--ember)]",
                            "hover:bg-[var(--ember)]/30",
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
                        "text-[var(--forge-text-muted)]",
                        "group-hover:text-[var(--forge-text-primary)]",
                        "group-hover:bg-[var(--forge-bg-anvil)]",
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
