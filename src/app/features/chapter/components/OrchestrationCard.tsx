/**
 * Orchestration Card Component
 *
 * Displays AI Learning Conductor decisions and recommendations
 * with accept/dismiss actions.
 */

"use client";

import React, { useCallback } from "react";
import { motion } from "framer-motion";
import {
    Brain,
    Sparkles,
    BookOpen,
    FastForward,
    Coffee,
    Users,
    Zap,
    RotateCcw,
    Minimize2,
    Maximize2,
    Award,
    X,
    Check,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { OrchestrationDecision, OrchestrationAction } from "../lib/conductorTypes";

// ============================================================================
// Types
// ============================================================================

export interface OrchestrationCardProps {
    decision: OrchestrationDecision;
    onAccept?: () => void;
    onDismiss?: () => void;
    className?: string;
}

interface ActionConfig {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
    title: string;
    acceptLabel: string;
    dismissLabel: string;
}

// ============================================================================
// Action Configurations
// ============================================================================

const ACTION_CONFIGS: Record<OrchestrationAction, ActionConfig> = {
    inject_remedial: {
        icon: BookOpen,
        color: "text-[var(--forge-info)]",
        bgColor: "bg-[var(--forge-info)]/20",
        borderColor: "border-[var(--forge-info)]/30",
        title: "Learning Support Available",
        acceptLabel: "Show me",
        dismissLabel: "Skip for now",
    },
    skip_section: {
        icon: FastForward,
        color: "text-[var(--forge-success)]",
        bgColor: "bg-[var(--forge-success)]/20",
        borderColor: "border-[var(--forge-success)]/30",
        title: "Ready to Advance",
        acceptLabel: "Skip ahead",
        dismissLabel: "Stay here",
    },
    suggest_peer_solution: {
        icon: Users,
        color: "text-[var(--ember-glow)]",
        bgColor: "bg-[var(--ember-glow)]/20",
        borderColor: "border-[var(--ember-glow)]/30",
        title: "Peer Insights Available",
        acceptLabel: "Show solutions",
        dismissLabel: "Not now",
    },
    slow_down: {
        icon: RotateCcw,
        color: "text-[var(--forge-warning)]",
        bgColor: "bg-[var(--forge-warning)]/20",
        borderColor: "border-[var(--forge-warning)]/30",
        title: "Take Your Time",
        acceptLabel: "Slow down",
        dismissLabel: "Keep pace",
    },
    accelerate: {
        icon: Zap,
        color: "text-[var(--forge-info)]",
        bgColor: "bg-[var(--forge-info)]/20",
        borderColor: "border-[var(--forge-info)]/30",
        title: "You're Doing Great!",
        acceptLabel: "Speed up",
        dismissLabel: "Stay current",
    },
    reorder_sections: {
        icon: RotateCcw,
        color: "text-[var(--ember)]",
        bgColor: "bg-[var(--ember)]/20",
        borderColor: "border-[var(--ember)]/30",
        title: "Optimized Path Available",
        acceptLabel: "Optimize",
        dismissLabel: "Keep order",
    },
    add_practice: {
        icon: Sparkles,
        color: "text-[var(--ember-bright)]",
        bgColor: "bg-[var(--ember-bright)]/20",
        borderColor: "border-[var(--ember-bright)]/30",
        title: "Practice Opportunity",
        acceptLabel: "Practice",
        dismissLabel: "Skip",
    },
    reduce_content: {
        icon: Minimize2,
        color: "text-[var(--forge-text-muted)]",
        bgColor: "bg-[var(--forge-bg-anvil)]/50",
        borderColor: "border-[var(--forge-border-subtle)]",
        title: "Simplified View",
        acceptLabel: "Simplify",
        dismissLabel: "Full content",
    },
    expand_content: {
        icon: Maximize2,
        color: "text-[var(--forge-success)]",
        bgColor: "bg-[var(--forge-success)]/20",
        borderColor: "border-[var(--forge-success)]/30",
        title: "Deep Dive Available",
        acceptLabel: "Expand",
        dismissLabel: "Standard",
    },
    suggest_break: {
        icon: Coffee,
        color: "text-[var(--ember)]",
        bgColor: "bg-[var(--ember)]/20",
        borderColor: "border-[var(--ember)]/30",
        title: "Time for a Break?",
        acceptLabel: "Take break",
        dismissLabel: "Continue",
    },
    celebrate_progress: {
        icon: Award,
        color: "text-[var(--gold)]",
        bgColor: "bg-[var(--gold)]/20",
        borderColor: "border-[var(--gold)]/30",
        title: "Achievement Unlocked!",
        acceptLabel: "Awesome!",
        dismissLabel: "Continue",
    },
};

// ============================================================================
// Unified Animation Config
// ============================================================================

const UNIFIED_SPRING = {
    type: "spring" as const,
    stiffness: 300,
    damping: 25,
};

// ============================================================================
// Main Component
// ============================================================================

export function OrchestrationCard({
    decision,
    onAccept,
    onDismiss,
    className,
}: OrchestrationCardProps) {
    const config = ACTION_CONFIGS[decision.action];
    const Icon = config.icon;

    const handleAccept = useCallback(() => {
        onAccept?.();
    }, [onAccept]);

    const handleDismiss = useCallback(() => {
        onDismiss?.();
    }, [onDismiss]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={UNIFIED_SPRING}
            className={cn(
                "rounded-xl overflow-hidden",
                config.bgColor,
                "border",
                config.borderColor,
                className
            )}
            data-testid={`orchestration-card-${decision.id}`}
        >
            {/* Main Content */}
            <div className="p-4">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, ...UNIFIED_SPRING }}
                        className={cn(
                            "p-2 rounded-lg",
                            config.bgColor,
                            "border",
                            config.borderColor
                        )}
                    >
                        <Icon size={20} className={config.color} />
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Brain size={14} className="text-[var(--forge-text-muted)]" />
                            <span className="text-xs text-[var(--forge-text-muted)]">
                                AI Learning Conductor
                            </span>
                        </div>

                        <h4 className={cn("text-lg font-semibold mb-1", config.color)}>
                            {config.title}
                        </h4>

                        <p className="text-sm text-[var(--forge-text-secondary)] leading-relaxed">
                            {decision.reason}
                        </p>

                        {/* Priority indicator */}
                        {decision.priority >= 8 && (
                            <div className="flex items-center gap-1 mt-2">
                                <div className="flex gap-0.5">
                                    {[...Array(3)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                i < Math.min(decision.priority - 6, 3)
                                                    ? config.color.replace("text-", "bg-")
                                                    : "bg-[var(--forge-bg-elevated)]"
                                            )}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-[var(--forge-text-muted)]">High priority</span>
                            </div>
                        )}
                    </div>

                    {/* Dismiss button */}
                    <button
                        onClick={handleDismiss}
                        className="p-1 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors"
                        data-testid={`orchestration-card-dismiss-x-${decision.id}`}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex border-t border-[var(--forge-border-subtle)]">
                <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)]/50 transition-colors flex items-center justify-center gap-2"
                    data-testid={`orchestration-card-dismiss-btn-${decision.id}`}
                >
                    <X size={14} />
                    {config.dismissLabel}
                </button>

                <div className="w-px bg-[var(--forge-border-subtle)]" />

                <button
                    onClick={handleAccept}
                    className={cn(
                        "flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                        config.color,
                        "hover:bg-[var(--forge-bg-anvil)]/50"
                    )}
                    data-testid={`orchestration-card-accept-btn-${decision.id}`}
                >
                    <Check size={14} />
                    {config.acceptLabel}
                    <ChevronRight size={14} />
                </button>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Compact Variant
// ============================================================================

export function OrchestrationCardCompact({
    decision,
    onAccept,
    onDismiss,
    className,
}: OrchestrationCardProps) {
    const config = ACTION_CONFIGS[decision.action];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={UNIFIED_SPRING}
            className={cn(
                "flex items-center gap-4 px-3 py-2 rounded-lg",
                config.bgColor,
                "border",
                config.borderColor,
                className
            )}
            data-testid={`orchestration-card-compact-${decision.id}`}
        >
            <Icon size={16} className={config.color} />
            <span className="flex-1 text-sm text-[var(--forge-text-secondary)] truncate">
                {config.title}
            </span>
            <button
                onClick={onAccept}
                className={cn(
                    "px-2 py-1 text-xs rounded font-medium",
                    config.color,
                    "hover:bg-[var(--forge-bg-elevated)]/50 transition-colors"
                )}
                data-testid={`orchestration-card-compact-accept-${decision.id}`}
            >
                {config.acceptLabel}
            </button>
            <button
                onClick={onDismiss}
                className="p-1 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors"
                data-testid={`orchestration-card-compact-dismiss-${decision.id}`}
            >
                <X size={14} />
            </button>
        </motion.div>
    );
}

export default OrchestrationCard;
