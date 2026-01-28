"use client";

/**
 * PrerequisiteAlert Component
 *
 * Displays warnings about missing prerequisites before starting
 * a learning path or node. Shows severity levels and provides
 * quick navigation to required foundations.
 *
 * Features:
 * - Severity-based styling (critical, warning, info)
 * - One-click navigation to prerequisites
 * - Expandable details with reasoning
 * - Option to proceed anyway (for non-critical)
 */

import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    AlertCircle,
    Info,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    X,
    Zap,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { PrerequisiteWarning } from "../lib/recommendationEngine";
import type { MapNode } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface PrerequisiteAlertProps {
    /** The warning to display */
    warning: PrerequisiteWarning;
    /** Whether to show in compact mode */
    compact?: boolean;
    /** Callback when user navigates to a prerequisite */
    onNavigateToPrerequisite: (nodeId: string) => void;
    /** Callback when user chooses to proceed anyway */
    onProceedAnyway?: () => void;
    /** Callback to dismiss the alert */
    onDismiss?: () => void;
    /** Additional class names */
    className?: string;
}

interface PrerequisiteAlertBannerProps {
    /** Multiple warnings to display */
    warnings: PrerequisiteWarning[];
    /** Whether the banner is visible */
    visible: boolean;
    /** Callback when user navigates to a prerequisite */
    onNavigateToPrerequisite: (nodeId: string) => void;
    /** Callback to dismiss */
    onDismiss: () => void;
    /** Additional class names */
    className?: string;
}

// ============================================================================
// SEVERITY CONFIG
// ============================================================================

interface SeverityConfig {
    icon: typeof AlertTriangle;
    containerClass: string;
    iconClass: string;
    badgeClass: string;
    label: string;
}

const SEVERITY_CONFIGS: Record<PrerequisiteWarning["action"], SeverityConfig> = {
    stop: {
        icon: XCircle,
        containerClass:
            "border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-600/5",
        iconClass: "text-red-400 bg-red-500/20",
        badgeClass: "bg-red-500/20 text-red-400",
        label: "Required",
    },
    review: {
        icon: AlertTriangle,
        containerClass:
            "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5",
        iconClass: "text-amber-400 bg-amber-500/20",
        badgeClass: "bg-amber-500/20 text-amber-400",
        label: "Recommended",
    },
    proceed: {
        icon: Info,
        containerClass:
            "border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5",
        iconClass: "text-blue-400 bg-blue-500/20",
        badgeClass: "bg-blue-500/20 text-blue-400",
        label: "Optional",
    },
};

// ============================================================================
// PREREQUISITE ALERT COMPONENT
// ============================================================================

export const PrerequisiteAlert: React.FC<PrerequisiteAlertProps> = memo(
    function PrerequisiteAlert({
        warning,
        compact = false,
        onNavigateToPrerequisite,
        onProceedAnyway,
        onDismiss,
        className,
    }) {
        const [expanded, setExpanded] = useState(!compact);
        const config = SEVERITY_CONFIGS[warning.action];
        const Icon = config.icon;

        const criticalCount = warning.missingPrerequisites.filter(
            (p) => !p.isSkippable
        ).length;
        const optionalCount = warning.missingPrerequisites.length - criticalCount;

        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                    "rounded-xl border overflow-hidden",
                    config.containerClass,
                    className
                )}
            >
                {/* Header */}
                <div
                    className={cn(
                        "flex items-center justify-between p-4",
                        compact && "cursor-pointer"
                    )}
                    onClick={compact ? () => setExpanded(!expanded) : undefined}
                >
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", config.iconClass)}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-[var(--forge-text-primary)]">
                                    Missing Prerequisites
                                </h3>
                                <span className={cn("text-xs px-2 py-0.5 rounded-full", config.badgeClass)}>
                                    {config.label}
                                </span>
                            </div>
                            <p className="text-xs text-[var(--forge-text-secondary)] mt-0.5">
                                {criticalCount > 0 && (
                                    <span className="text-red-400">
                                        {criticalCount} required
                                    </span>
                                )}
                                {criticalCount > 0 && optionalCount > 0 && " • "}
                                {optionalCount > 0 && (
                                    <span className="text-amber-400">
                                        {optionalCount} recommended
                                    </span>
                                )}
                                {" "}for "{warning.targetNode.name}"
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {compact && (
                            <button className="p-1">
                                {expanded ? (
                                    <ChevronUp size={16} className="text-[var(--forge-text-muted)]" />
                                ) : (
                                    <ChevronDown size={16} className="text-[var(--forge-text-muted)]" />
                                )}
                            </button>
                        )}
                        {onDismiss && warning.action !== "stop" && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDismiss();
                                }}
                                className="p-1 hover:bg-[var(--forge-bg-anvil)] rounded transition-colors"
                            >
                                <X size={16} className="text-[var(--forge-text-muted)]" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Expandable content */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 space-y-3">
                                {/* Prerequisites list */}
                                <div className="space-y-2">
                                    {warning.missingPrerequisites.map((prereq, index) => (
                                        <PrerequisiteItem
                                            key={`prereq-${index}`}
                                            node={prereq.node}
                                            importance={prereq.importance}
                                            isSkippable={prereq.isSkippable}
                                            reason={prereq.reason}
                                            onNavigate={() =>
                                                onNavigateToPrerequisite(prereq.node.id)
                                            }
                                        />
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2 border-t border-[var(--forge-border-subtle)]">
                                    {warning.action !== "stop" && onProceedAnyway && (
                                        <button
                                            onClick={onProceedAnyway}
                                            className="flex-1 py-2 px-4 text-sm font-medium text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] bg-[var(--forge-bg-anvil)] hover:bg-[var(--forge-bg-primary)] rounded-lg transition-colors"
                                        >
                                            Continue Anyway
                                        </button>
                                    )}
                                    <button
                                        onClick={() =>
                                            onNavigateToPrerequisite(
                                                warning.missingPrerequisites[0].node.id
                                            )
                                        }
                                        className={cn(
                                            "flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2",
                                            warning.action === "stop"
                                                ? "bg-red-500 hover:bg-red-600 text-white"
                                                : warning.action === "review"
                                                ? "bg-amber-500 hover:bg-amber-600 text-white"
                                                : "bg-blue-500 hover:bg-blue-600 text-white"
                                        )}
                                    >
                                        Start Prerequisites
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }
);

// ============================================================================
// PREREQUISITE ITEM
// ============================================================================

interface PrerequisiteItemProps {
    node: MapNode;
    importance: number;
    isSkippable: boolean;
    reason: string;
    onNavigate: () => void;
}

const PrerequisiteItem: React.FC<PrerequisiteItemProps> = memo(
    function PrerequisiteItem({ node, importance, isSkippable, reason, onNavigate }) {
        return (
            <button
                onClick={onNavigate}
                className="w-full flex items-center gap-3 p-3 bg-[var(--forge-bg-primary)] hover:bg-[var(--forge-bg-anvil)] rounded-lg transition-colors group"
            >
                {/* Importance indicator */}
                <div
                    className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        importance > 0.7
                            ? "bg-red-400"
                            : importance > 0.4
                            ? "bg-amber-400"
                            : "bg-blue-400"
                    )}
                />

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--forge-text-primary)] truncate">
                            {node.name}
                        </span>
                        {!isSkippable && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                                Required
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-[var(--forge-text-muted)] truncate mt-0.5">
                        {reason}
                    </p>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {node.status === "completed" ? (
                        <CheckCircle size={16} className="text-green-400" />
                    ) : node.progress > 0 ? (
                        <div className="w-12 h-1.5 bg-[var(--forge-bg-anvil)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--ember)]"
                                style={{ width: `${node.progress}%` }}
                            />
                        </div>
                    ) : null}
                    <ArrowRight
                        size={14}
                        className="text-[var(--forge-text-muted)] group-hover:text-[var(--forge-text-primary)] transition-colors"
                    />
                </div>
            </button>
        );
    }
);

// ============================================================================
// PREREQUISITE ALERT BANNER
// ============================================================================

export const PrerequisiteAlertBanner: React.FC<PrerequisiteAlertBannerProps> = memo(
    function PrerequisiteAlertBanner({
        warnings,
        visible,
        onNavigateToPrerequisite,
        onDismiss,
        className,
    }) {
        const [expanded, setExpanded] = useState(false);

        if (!visible || warnings.length === 0) return null;

        // Get most critical warning
        const criticalWarning = warnings.find((w) => w.action === "stop");
        const primaryWarning = criticalWarning || warnings[0];
        const config = SEVERITY_CONFIGS[primaryWarning.action];
        const Icon = config.icon;

        const totalMissing = warnings.reduce(
            (sum, w) => sum + w.missingPrerequisites.length,
            0
        );

        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                        "border-b",
                        criticalWarning
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-amber-500/10 border-amber-500/30",
                        className
                    )}
                >
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-1.5 rounded-lg", config.iconClass)}>
                                    <Icon size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[var(--forge-text-primary)]">
                                        {totalMissing} missing prerequisite{totalMissing > 1 ? "s" : ""}
                                    </p>
                                    <p className="text-xs text-[var(--forge-text-secondary)]">
                                        {warnings.length > 1
                                            ? `Across ${warnings.length} topics`
                                            : `For "${primaryWarning.targetNode.name}"`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="text-xs text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] transition-colors"
                                >
                                    {expanded ? "Hide details" : "Show details"}
                                </button>
                                {!criticalWarning && (
                                    <button
                                        onClick={onDismiss}
                                        className="p-1 hover:bg-[var(--forge-bg-anvil)] rounded transition-colors"
                                    >
                                        <X size={14} className="text-[var(--forge-text-muted)]" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                            {expanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-3 space-y-2 overflow-hidden"
                                >
                                    {warnings.slice(0, 3).map((warning, index) => (
                                        <div
                                            key={`banner-warning-${index}`}
                                            className="flex items-center justify-between p-2 bg-[var(--forge-bg-primary)] rounded-lg"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-[var(--forge-text-primary)]">
                                                    {warning.targetNode.name}
                                                </p>
                                                <p className="text-xs text-[var(--forge-text-muted)]">
                                                    {warning.missingPrerequisites.length} prerequisite
                                                    {warning.missingPrerequisites.length > 1 ? "s" : ""}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    onNavigateToPrerequisite(
                                                        warning.missingPrerequisites[0].node.id
                                                    )
                                                }
                                                className="text-xs px-3 py-1.5 bg-[var(--ember)] hover:bg-[var(--ember)]/80 text-white rounded-lg transition-colors"
                                            >
                                                View
                                            </button>
                                        </div>
                                    ))}
                                    {warnings.length > 3 && (
                                        <p className="text-xs text-[var(--forge-text-muted)] text-center">
                                            +{warnings.length - 3} more
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }
);

export default PrerequisiteAlert;
