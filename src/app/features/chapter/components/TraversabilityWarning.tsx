"use client";

/**
 * TraversabilityWarning Component
 *
 * Enhanced warning component that uses the living graph system to display
 * traversability information. Combines static prerequisites with predicted
 * struggle from collective intelligence.
 *
 * This replaces the basic PrerequisiteWarning when using the living graph,
 * providing richer information about why a node may be difficult.
 */

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    Lock,
    ArrowRight,
    X,
    BookOpen,
    TrendingUp,
    Users,
    Clock,
    Brain,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Zap,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type {
    TraversabilityScore,
    TraversabilityFactor,
    TraversabilityRecommendation,
    LivingNode,
} from "../lib/livingGraph";

// ============================================================================
// TYPES
// ============================================================================

export interface TraversabilityWarningProps {
    /** The traversability score for the node */
    traversability: TraversabilityScore;

    /** Optional living node for additional context */
    node?: LivingNode;

    /** Variant of the warning display */
    variant?: "banner" | "inline" | "card" | "compact";

    /** Whether to show detailed factors */
    showFactors?: boolean;

    /** Whether the user can proceed despite warnings */
    allowSkip?: boolean;

    /** Callback when user clicks to navigate to a prerequisite */
    onNavigateToPrerequisite?: (prerequisiteId: string) => void;

    /** Callback when user chooses to skip */
    onSkip?: () => void;

    /** Callback when warning is dismissed */
    onDismiss?: () => void;

    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TraversabilityWarning({
    traversability,
    node,
    variant = "banner",
    showFactors = true,
    allowSkip = false,
    onNavigateToPrerequisite,
    onSkip,
    onDismiss,
    className,
}: TraversabilityWarningProps) {
    // Don't show warning for fully traversable nodes
    if (
        traversability.recommendation === "proceed" ||
        traversability.recommendation === "accelerate" ||
        traversability.recommendation === "skip"
    ) {
        return null;
    }

    const { icon: Icon, color, label } = getRecommendationConfig(
        traversability.recommendation
    );

    // Group factors by impact
    const { positive, neutral, negative } = useMemo(() => {
        return traversability.factors.reduce(
            (acc, factor) => {
                if (factor.value >= 0.7) {
                    acc.positive.push(factor);
                } else if (factor.value >= 0.4) {
                    acc.neutral.push(factor);
                } else {
                    acc.negative.push(factor);
                }
                return acc;
            },
            {
                positive: [] as TraversabilityFactor[],
                neutral: [] as TraversabilityFactor[],
                negative: [] as TraversabilityFactor[],
            }
        );
    }, [traversability.factors]);

    // Get prerequisite factor if any
    const prereqFactor = traversability.factors.find(
        (f) => f.type === "static_prerequisite" || f.type === "emergent_prerequisite"
    );

    if (variant === "compact") {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
                    `bg-${color}/10 text-${color}`,
                    className
                )}
                data-testid="traversability-warning-compact"
            >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{label}</span>
                {traversability.predictedStruggle > 0.5 && (
                    <span className="text-xs opacity-75">
                        ({Math.round(traversability.predictedStruggle * 100)}% difficulty)
                    </span>
                )}
            </motion.div>
        );
    }

    if (variant === "inline") {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn("flex items-center gap-2 text-sm", className)}
                data-testid="traversability-warning-inline"
            >
                <Icon className={`h-4 w-4 text-[var(--forge-${color === "warning" ? "warning" : "ember"})]`} />
                <span className="text-[var(--forge-text-secondary)]">
                    {label}
                    {prereqFactor && `: ${prereqFactor.description}`}
                </span>
            </motion.div>
        );
    }

    if (variant === "banner") {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                    "bg-[var(--forge-warning)]/10 border border-[var(--forge-warning)]/30 rounded-lg p-4",
                    className
                )}
                data-testid="traversability-warning-banner"
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <Icon className="h-5 w-5 text-[var(--forge-warning)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[var(--forge-warning)]">
                            {label}
                        </h3>

                        {/* Traversability Score Bar */}
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-[var(--forge-text-muted)]">
                                Accessibility:
                            </span>
                            <div className="flex-1 h-2 bg-[var(--forge-bg-elevated)] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${traversability.score * 100}%` }}
                                    className={cn(
                                        "h-full rounded-full",
                                        traversability.score >= 0.7
                                            ? "bg-[var(--forge-success)]"
                                            : traversability.score >= 0.4
                                            ? "bg-[var(--forge-warning)]"
                                            : "bg-[var(--ember)]"
                                    )}
                                />
                            </div>
                            <span className="text-xs font-medium text-[var(--forge-text-secondary)]">
                                {Math.round(traversability.score * 100)}%
                            </span>
                        </div>

                        {/* Factors */}
                        {showFactors && negative.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {negative.map((factor, index) => (
                                    <FactorItem
                                        key={`${factor.type}-${index}`}
                                        factor={factor}
                                        onNavigate={
                                            factor.type === "static_prerequisite" ||
                                            factor.type === "emergent_prerequisite"
                                                ? onNavigateToPrerequisite
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>
                        )}

                        {/* Predicted Struggle */}
                        {traversability.predictedStruggle > 0.3 && (
                            <div className="mt-3 flex items-center gap-2 text-sm">
                                <Brain className="h-4 w-4 text-[var(--forge-text-muted)]" />
                                <span className="text-[var(--forge-text-secondary)]">
                                    Predicted difficulty:{" "}
                                    <span
                                        className={cn(
                                            "font-medium",
                                            traversability.predictedStruggle > 0.6
                                                ? "text-[var(--ember)]"
                                                : "text-[var(--forge-warning)]"
                                        )}
                                    >
                                        {traversability.predictedStruggle > 0.6
                                            ? "High"
                                            : "Moderate"}
                                    </span>
                                </span>
                                {traversability.struggleConfidence > 0.5 && (
                                    <span className="text-xs text-[var(--forge-text-muted)]">
                                        (based on {Math.round(traversability.struggleConfidence * 100)}%
                                        confidence)
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Skip Option */}
                        {allowSkip && (
                            <div className="mt-3">
                                <button
                                    onClick={onSkip}
                                    className="text-xs text-[var(--forge-text-muted)] hover:underline font-medium"
                                    data-testid="skip-traversability-btn"
                                >
                                    Continue anyway (not recommended)
                                </button>
                            </div>
                        )}
                    </div>

                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="flex-shrink-0 text-[var(--forge-warning)] hover:text-[var(--forge-warning)]/80"
                            data-testid="dismiss-traversability-btn"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </motion.div>
        );
    }

    // Card variant
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "bg-[var(--forge-bg-workshop)] border border-[var(--forge-warning)]/30 rounded-xl p-6 shadow-lg",
                className
            )}
            data-testid="traversability-warning-card"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div
                    className={cn(
                        "p-2 rounded-lg",
                        traversability.recommendation === "blocked"
                            ? "bg-[var(--ember)]/10"
                            : "bg-[var(--forge-warning)]/10"
                    )}
                >
                    <Icon
                        className={cn(
                            "h-6 w-6",
                            traversability.recommendation === "blocked"
                                ? "text-[var(--ember)]"
                                : "text-[var(--forge-warning)]"
                        )}
                    />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                        {label}
                    </h3>
                    <p className="text-xs text-[var(--forge-text-muted)]">
                        {traversability.recommendation === "blocked"
                            ? "Complete prerequisites to unlock"
                            : "Consider these factors before proceeding"}
                    </p>
                </div>
            </div>

            {/* Traversability Gauge */}
            <div className="mb-4 p-3 bg-[var(--forge-bg-elevated)] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--forge-text-secondary)]">
                        Traversability Score
                    </span>
                    <span
                        className={cn(
                            "text-lg font-bold",
                            traversability.score >= 0.7
                                ? "text-[var(--forge-success)]"
                                : traversability.score >= 0.4
                                ? "text-[var(--forge-warning)]"
                                : "text-[var(--ember)]"
                        )}
                    >
                        {Math.round(traversability.score * 100)}%
                    </span>
                </div>
                <div className="h-3 bg-[var(--forge-bg-workshop)] rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${traversability.score * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cn(
                            "h-full rounded-full",
                            traversability.score >= 0.7
                                ? "bg-gradient-to-r from-[var(--forge-success)]/80 to-[var(--forge-success)]"
                                : traversability.score >= 0.4
                                ? "bg-gradient-to-r from-[var(--forge-warning)]/80 to-[var(--forge-warning)]"
                                : "bg-gradient-to-r from-[var(--ember)]/80 to-[var(--ember)]"
                        )}
                    />
                </div>
            </div>

            {/* Factors Grid */}
            {showFactors && (
                <div className="space-y-2 mb-4">
                    {negative.length > 0 && (
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-[var(--ember)]">
                                Blocking Factors
                            </span>
                            {negative.map((factor, index) => (
                                <FactorItem
                                    key={`neg-${index}`}
                                    factor={factor}
                                    variant="card"
                                    onNavigate={
                                        factor.type === "static_prerequisite" ||
                                        factor.type === "emergent_prerequisite"
                                            ? onNavigateToPrerequisite
                                            : undefined
                                    }
                                />
                            ))}
                        </div>
                    )}

                    {neutral.length > 0 && (
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-[var(--forge-warning)]">
                                Moderate Concerns
                            </span>
                            {neutral.map((factor, index) => (
                                <FactorItem
                                    key={`neu-${index}`}
                                    factor={factor}
                                    variant="card"
                                />
                            ))}
                        </div>
                    )}

                    {positive.length > 0 && (
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-[var(--forge-success)]">
                                Favorable Factors
                            </span>
                            {positive.map((factor, index) => (
                                <FactorItem
                                    key={`pos-${index}`}
                                    factor={factor}
                                    variant="card"
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Node-specific info */}
            {node && (
                <div className="flex items-center gap-4 p-3 bg-[var(--forge-bg-elevated)] rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-[var(--forge-text-muted)]" />
                        <span className="text-[var(--forge-text-secondary)]">
                            ~{node.predictedDuration} min
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-[var(--forge-text-muted)]" />
                        <span className="text-[var(--forge-text-secondary)]">
                            {node.xpReward} XP
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-[var(--forge-text-muted)]" />
                        <span className="text-[var(--forge-text-secondary)]">
                            {Math.round(node.predictedSuccessRate * 100)}% success rate
                        </span>
                    </div>
                </div>
            )}

            {/* Actions */}
            {allowSkip && (
                <div className="pt-4 border-t border-[var(--forge-border-subtle)]">
                    <button
                        onClick={onSkip}
                        className="text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-warning)] font-medium"
                        data-testid="skip-traversability-card-btn"
                    >
                        Skip warnings and continue anyway →
                    </button>
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// FACTOR ITEM COMPONENT
// ============================================================================

interface FactorItemProps {
    factor: TraversabilityFactor;
    variant?: "list" | "card";
    onNavigate?: (id: string) => void;
}

function FactorItem({ factor, variant = "list", onNavigate }: FactorItemProps) {
    const { icon: Icon, label } = getFactorConfig(factor.type);
    const isClickable =
        onNavigate &&
        (factor.type === "static_prerequisite" ||
            factor.type === "emergent_prerequisite");

    const content = (
        <>
            <Icon
                className={cn(
                    "h-4 w-4 flex-shrink-0",
                    factor.value >= 0.7
                        ? "text-[var(--forge-success)]"
                        : factor.value >= 0.4
                        ? "text-[var(--forge-warning)]"
                        : "text-[var(--ember)]"
                )}
            />
            <div className="flex-1 min-w-0">
                <span className="text-sm text-[var(--forge-text-secondary)] block truncate">
                    {factor.description}
                </span>
                {variant === "card" && (
                    <span className="text-xs text-[var(--forge-text-muted)]">
                        {label} · {Math.round(factor.value * 100)}%
                    </span>
                )}
            </div>
            {isClickable && <ChevronRight className="h-4 w-4 text-[var(--forge-text-muted)]" />}
        </>
    );

    if (isClickable) {
        return (
            <button
                onClick={() => onNavigate?.(factor.type)}
                className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--forge-warning)]/10 transition-colors text-left",
                    variant === "card" ? "bg-[var(--forge-bg-elevated)]" : ""
                )}
                data-testid={`factor-${factor.type}`}
            >
                {content}
            </button>
        );
    }

    return (
        <div
            className={cn(
                "flex items-center gap-2 p-2 rounded-lg",
                variant === "card" ? "bg-[var(--forge-bg-elevated)]" : ""
            )}
            data-testid={`factor-${factor.type}`}
        >
            {content}
        </div>
    );
}

// ============================================================================
// CONFIGURATION HELPERS
// ============================================================================

function getRecommendationConfig(recommendation: TraversabilityRecommendation): {
    icon: typeof AlertTriangle;
    color: string;
    label: string;
} {
    switch (recommendation) {
        case "blocked":
            return {
                icon: Lock,
                color: "ember",
                label: "Prerequisites Required",
            };
        case "consider_prerequisites":
            return {
                icon: AlertTriangle,
                color: "warning",
                label: "Prerequisites Recommended",
            };
        case "proceed_with_caution":
            return {
                icon: AlertCircle,
                color: "warning",
                label: "May Be Challenging",
            };
        case "proceed":
            return {
                icon: CheckCircle,
                color: "success",
                label: "Ready to Proceed",
            };
        case "accelerate":
            return {
                icon: Zap,
                color: "success",
                label: "Consider Accelerating",
            };
        case "skip":
            return {
                icon: TrendingUp,
                color: "info",
                label: "Could Skip",
            };
    }
}

function getFactorConfig(type: TraversabilityFactor["type"]): {
    icon: typeof BookOpen;
    label: string;
} {
    switch (type) {
        case "static_prerequisite":
            return { icon: Lock, label: "Prerequisite" };
        case "emergent_prerequisite":
            return { icon: Users, label: "Recommended by learners" };
        case "collective_struggle":
            return { icon: Brain, label: "Collective insight" };
        case "learner_profile":
            return { icon: TrendingUp, label: "Profile match" };
        case "past_performance":
            return { icon: Clock, label: "Past performance" };
        case "content_density":
            return { icon: BookOpen, label: "Content density" };
        case "time_since_prereq":
            return { icon: Clock, label: "Time factor" };
        case "peer_success":
            return { icon: Users, label: "Peer success" };
    }
}

export default TraversabilityWarning;
