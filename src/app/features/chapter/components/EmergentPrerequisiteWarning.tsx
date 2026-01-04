"use client";

/**
 * EmergentPrerequisiteWarning Component
 *
 * Displays warnings for implicit prerequisites derived from collective
 * learner behavior. Unlike static prerequisites, these are discovered
 * from patterns like "learners who skipped X failed more often at Y".
 */

import React from "react";
import { motion } from "framer-motion";
import {
    Users,
    TrendingUp,
    ArrowRight,
    X,
    Sparkles,
    CheckCircle,
    Info,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { ImplicitPrerequisite } from "../lib/collectiveIntelligence/types";

// ============================================================================
// TYPES
// ============================================================================

export interface EmergentPrerequisiteWarningProps {
    /** Implicit prerequisites discovered from collective behavior */
    implicitPrerequisites: ImplicitPrerequisite[];

    /** IDs of already completed chapters */
    completedChapterIds?: Set<string>;

    /** Variant of the warning display */
    variant?: "banner" | "inline" | "card" | "tooltip";

    /** Whether the user can proceed despite warnings */
    allowSkip?: boolean;

    /** Callback when user clicks to navigate to a prerequisite */
    onNavigateToPrerequisite?: (prerequisiteId: string) => void;

    /** Callback when user chooses to skip prerequisites */
    onSkip?: () => void;

    /** Callback when warning is dismissed */
    onDismiss?: () => void;

    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmergentPrerequisiteWarning({
    implicitPrerequisites,
    completedChapterIds = new Set(),
    variant = "banner",
    allowSkip = true,
    onNavigateToPrerequisite,
    onSkip,
    onDismiss,
    className,
}: EmergentPrerequisiteWarningProps) {
    // Filter to only show unmet prerequisites
    const unmetPrerequisites = implicitPrerequisites.filter(
        (p) => !completedChapterIds.has(p.prerequisiteChapterId)
    );

    if (unmetPrerequisites.length === 0) {
        return null;
    }

    // Sort by confidence and strength
    const sortedPrerequisites = [...unmetPrerequisites].sort(
        (a, b) => b.confidence * b.strength - a.confidence * a.strength
    );

    if (variant === "tooltip") {
        return (
            <TooltipVariant
                prerequisites={sortedPrerequisites}
                className={className}
            />
        );
    }

    if (variant === "inline") {
        return (
            <InlineVariant
                prerequisites={sortedPrerequisites}
                onNavigateToPrerequisite={onNavigateToPrerequisite}
                className={className}
            />
        );
    }

    if (variant === "card") {
        return (
            <CardVariant
                prerequisites={sortedPrerequisites}
                allowSkip={allowSkip}
                onNavigateToPrerequisite={onNavigateToPrerequisite}
                onSkip={onSkip}
                className={className}
            />
        );
    }

    // Banner variant (default)
    return (
        <BannerVariant
            prerequisites={sortedPrerequisites}
            allowSkip={allowSkip}
            onNavigateToPrerequisite={onNavigateToPrerequisite}
            onSkip={onSkip}
            onDismiss={onDismiss}
            className={className}
        />
    );
}

// ============================================================================
// VARIANT COMPONENTS
// ============================================================================

interface VariantProps {
    prerequisites: ImplicitPrerequisite[];
    allowSkip?: boolean;
    onNavigateToPrerequisite?: (id: string) => void;
    onSkip?: () => void;
    onDismiss?: () => void;
    className?: string;
}

function BannerVariant({
    prerequisites,
    allowSkip,
    onNavigateToPrerequisite,
    onSkip,
    onDismiss,
    className,
}: VariantProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
                "bg-gradient-to-r from-[var(--forge-primary)]/10 to-[var(--forge-info)]/10",
                "border border-[var(--forge-primary)]/30 rounded-lg p-4",
                className
            )}
            data-testid="emergent-prereq-warning-banner"
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-1.5 bg-[var(--forge-primary)]/20 rounded-lg">
                    <Sparkles className="h-4 w-4 text-[var(--forge-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-[var(--forge-primary)]">
                            Community Insight
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)]">
                            <Users className="h-3 w-3" />
                            <span>Based on learner patterns</span>
                        </div>
                    </div>
                    <p className="text-sm text-[var(--forge-text-secondary)] leading-relaxed mb-3">
                        Learners who completed the following chapter{prerequisites.length > 1 ? "s" : ""} first
                        had significantly better success rates:
                    </p>

                    <div className="space-y-2">
                        {prerequisites.slice(0, 3).map((prereq) => (
                            <PrerequisiteRow
                                key={prereq.prerequisiteChapterId}
                                prerequisite={prereq}
                                onNavigate={onNavigateToPrerequisite}
                            />
                        ))}
                    </div>

                    {prerequisites.length > 3 && (
                        <p className="mt-2 text-xs text-[var(--forge-text-muted)]">
                            +{prerequisites.length - 3} more suggested prerequisites
                        </p>
                    )}

                    {allowSkip && (
                        <div className="mt-3 pt-3 border-t border-[var(--forge-border-subtle)]">
                            <button
                                onClick={onSkip}
                                className="text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-primary)] transition-colors"
                                data-testid="skip-emergent-prereq-btn"
                            >
                                Continue anyway — I understand the risks
                            </button>
                        </div>
                    )}
                </div>

                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="flex-shrink-0 text-[var(--forge-text-muted)] hover:text-[var(--forge-primary)] transition-colors"
                        data-testid="dismiss-emergent-warning-btn"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

function InlineVariant({
    prerequisites,
    onNavigateToPrerequisite,
    className,
}: VariantProps) {
    const topPrereq = prerequisites[0];
    if (!topPrereq) return null;

    const improvement = Math.round(
        (topPrereq.evidence.successRateWithPrereq -
            topPrereq.evidence.successRateWithoutPrereq) *
            100
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
                "flex items-center gap-2 text-sm",
                className
            )}
            data-testid="emergent-prereq-warning-inline"
        >
            <Sparkles className="h-4 w-4 text-[var(--forge-primary)]" />
            <span className="text-[var(--forge-text-muted)]">
                Tip: Complete{" "}
                <button
                    onClick={() => onNavigateToPrerequisite?.(topPrereq.prerequisiteChapterId)}
                    className="text-[var(--forge-primary)] hover:underline font-medium"
                    data-testid="inline-prereq-link"
                >
                    {topPrereq.prerequisiteChapterId.split(":")[1] || topPrereq.prerequisiteChapterId}
                </button>{" "}
                first for{" "}
                <span className="text-[var(--forge-success)] font-medium">
                    +{improvement}%
                </span>{" "}
                success rate
            </span>
        </motion.div>
    );
}

function CardVariant({
    prerequisites,
    allowSkip,
    onNavigateToPrerequisite,
    onSkip,
    className,
}: VariantProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "bg-[var(--forge-bg-workshop)] border border-[var(--forge-primary)]/30 rounded-xl p-5 shadow-lg",
                className
            )}
            data-testid="emergent-prereq-warning-card"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-[var(--forge-primary)]/20 to-[var(--forge-info)]/20 rounded-lg">
                    <Sparkles className="h-5 w-5 text-[var(--forge-primary)]" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-[var(--forge-text-primary)]">
                        Recommended First
                    </h3>
                    <p className="text-xs text-[var(--forge-text-muted)] flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Based on successful learner patterns
                    </p>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                {prerequisites.map((prereq) => (
                    <button
                        key={prereq.prerequisiteChapterId}
                        onClick={() => onNavigateToPrerequisite?.(prereq.prerequisiteChapterId)}
                        className="w-full flex items-center gap-3 p-3 bg-[var(--forge-bg-elevated)] rounded-lg hover:bg-[var(--forge-primary)]/10 transition-colors group"
                        data-testid={`card-prereq-${prereq.prerequisiteChapterId}`}
                    >
                        <TrendingUp className="h-5 w-5 text-[var(--forge-success)] flex-shrink-0" />
                        <div className="flex-1 text-left">
                            <span className="text-sm font-medium text-[var(--forge-text-secondary)] block">
                                {prereq.prerequisiteChapterId.split(":")[1] || prereq.prerequisiteChapterId}
                            </span>
                            <span className="text-xs text-[var(--forge-text-muted)]">
                                {Math.round(prereq.confidence * 100)}% confidence ·{" "}
                                <span className="text-[var(--forge-success)]">
                                    +{Math.round(
                                        (prereq.evidence.successRateWithPrereq -
                                            prereq.evidence.successRateWithoutPrereq) *
                                            100
                                    )}%
                                </span>{" "}
                                success rate
                            </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[var(--forge-text-muted)] group-hover:text-[var(--forge-primary)] group-hover:translate-x-1 transition-all" />
                    </button>
                ))}
            </div>

            {allowSkip && (
                <button
                    onClick={onSkip}
                    className="w-full text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-primary)] py-2 transition-colors"
                    data-testid="skip-card-prereq-btn"
                >
                    Skip and continue anyway →
                </button>
            )}
        </motion.div>
    );
}

function TooltipVariant({ prerequisites, className }: VariantProps) {
    const avgImprovement =
        prerequisites.reduce(
            (sum, p) =>
                sum +
                (p.evidence.successRateWithPrereq - p.evidence.successRateWithoutPrereq),
            0
        ) / prerequisites.length;

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 bg-[var(--forge-primary)]/10 rounded-full text-xs",
                className
            )}
            data-testid="emergent-prereq-tooltip"
        >
            <Sparkles className="h-3 w-3 text-[var(--forge-primary)]" />
            <span className="text-[var(--forge-text-muted)]">
                {prerequisites.length} suggested prereq{prerequisites.length > 1 ? "s" : ""}
            </span>
            <span className="text-[var(--forge-success)] font-medium">
                +{Math.round(avgImprovement * 100)}%
            </span>
        </div>
    );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface PrerequisiteRowProps {
    prerequisite: ImplicitPrerequisite;
    onNavigate?: (id: string) => void;
}

function PrerequisiteRow({ prerequisite, onNavigate }: PrerequisiteRowProps) {
    const improvement = Math.round(
        (prerequisite.evidence.successRateWithPrereq -
            prerequisite.evidence.successRateWithoutPrereq) *
            100
    );

    const confidenceLevel =
        prerequisite.confidence > 0.9
            ? "Very High"
            : prerequisite.confidence > 0.8
            ? "High"
            : prerequisite.confidence > 0.7
            ? "Good"
            : "Moderate";

    return (
        <button
            onClick={() => onNavigate?.(prerequisite.prerequisiteChapterId)}
            className="w-full flex items-center gap-3 p-2.5 bg-[var(--forge-bg-elevated)] rounded-lg hover:bg-[var(--forge-primary)]/10 transition-colors group"
            data-testid={`prereq-row-${prerequisite.prerequisiteChapterId}`}
        >
            <div className="p-1 bg-[var(--forge-success)]/10 rounded">
                <TrendingUp className="h-4 w-4 text-[var(--forge-success)]" />
            </div>
            <div className="flex-1 text-left">
                <span className="text-sm font-medium text-[var(--forge-text-primary)] group-hover:text-[var(--forge-primary)] transition-colors">
                    {prerequisite.prerequisiteChapterId.split(":")[1] || prerequisite.prerequisiteChapterId}
                </span>
                <div className="flex items-center gap-3 text-xs text-[var(--forge-text-muted)]">
                    <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-[var(--forge-success)]" />
                        +{improvement}% success
                    </span>
                    <span className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {confidenceLevel}
                    </span>
                    <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {prerequisite.evidence.learnersWithPrereq +
                            prerequisite.evidence.learnersWithoutPrereq}{" "}
                        learners
                    </span>
                </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--forge-text-muted)] group-hover:text-[var(--forge-primary)] group-hover:translate-x-1 transition-all" />
        </button>
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default EmergentPrerequisiteWarning;
