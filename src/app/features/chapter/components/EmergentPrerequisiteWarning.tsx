"use client";

/**
 * EmergentPrerequisiteWarning Component
 *
 * Displays warnings for implicit prerequisites derived from collective
 * learner behavior. Unlike static prerequisites, these are discovered
 * from patterns like "learners who skipped X failed more often at Y".
 *
 * Uses BaseWarning for consistent styling across warning types.
 */

import React from "react";
import {
    Users,
    TrendingUp,
    ArrowRight,
    Sparkles,
    CheckCircle,
    Info,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { BaseWarning, WarningSkipButton } from "./BaseWarning";
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

    // ========================================================================
    // TOOLTIP VARIANT
    // ========================================================================
    if (variant === "tooltip") {
        const avgImprovement =
            sortedPrerequisites.reduce(
                (sum, p) =>
                    sum +
                    (p.evidence.successRateWithPrereq - p.evidence.successRateWithoutPrereq),
                0
            ) / sortedPrerequisites.length;

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
                    {sortedPrerequisites.length} suggested prereq{sortedPrerequisites.length > 1 ? "s" : ""}
                </span>
                <span className="text-[var(--forge-success)] font-medium">
                    +{Math.round(avgImprovement * 100)}%
                </span>
            </div>
        );
    }

    // ========================================================================
    // INLINE VARIANT
    // ========================================================================
    if (variant === "inline") {
        const topPrereq = sortedPrerequisites[0];
        if (!topPrereq) return null;

        const improvement = Math.round(
            (topPrereq.evidence.successRateWithPrereq -
                topPrereq.evidence.successRateWithoutPrereq) *
                100
        );

        return (
            <BaseWarning
                type="emergent"
                variant="inline"
                icon={Sparkles}
                className={className}
                testId="emergent-prereq-warning-inline"
            >
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
            </BaseWarning>
        );
    }

    // ========================================================================
    // CARD VARIANT
    // ========================================================================
    if (variant === "card") {
        return (
            <BaseWarning
                type="emergent"
                variant="card"
                icon={Sparkles}
                title="Recommended First"
                subtitle="Based on successful learner patterns"
                className={className}
                testId="emergent-prereq-warning-card"
                footer={
                    allowSkip && (
                        <WarningSkipButton
                            onClick={onSkip}
                            label="Skip and continue anyway →"
                            type="emergent"
                            testId="skip-card-prereq-btn"
                        />
                    )
                }
            >
                <div className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)] mb-4">
                    <Users className="h-3 w-3" />
                    <span>Based on successful learner patterns</span>
                </div>
                <div className="space-y-2">
                    {sortedPrerequisites.map((prereq) => (
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
            </BaseWarning>
        );
    }

    // ========================================================================
    // BANNER VARIANT (default)
    // ========================================================================
    return (
        <BaseWarning
            type="emergent"
            variant="banner"
            icon={Sparkles}
            title="Community Insight"
            subtitle="Based on learner patterns"
            description={`Learners who completed the following chapter${sortedPrerequisites.length > 1 ? "s" : ""} first had significantly better success rates:`}
            dismissible={!!onDismiss}
            onDismiss={onDismiss}
            className={className}
            testId="emergent-prereq-warning-banner"
            footer={
                allowSkip && (
                    <WarningSkipButton
                        onClick={onSkip}
                        label="Continue anyway — I understand the risks"
                        type="emergent"
                        testId="skip-emergent-prereq-btn"
                    />
                )
            }
        >
            <div className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)] mb-3">
                <Users className="h-3 w-3" />
                <span>Based on learner patterns</span>
            </div>

            <div className="space-y-2">
                {sortedPrerequisites.slice(0, 3).map((prereq) => (
                    <PrerequisiteRow
                        key={prereq.prerequisiteChapterId}
                        prerequisite={prereq}
                        onNavigate={onNavigateToPrerequisite}
                    />
                ))}
            </div>

            {sortedPrerequisites.length > 3 && (
                <p className="mt-2 text-xs text-[var(--forge-text-muted)]">
                    +{sortedPrerequisites.length - 3} more suggested prerequisites
                </p>
            )}
        </BaseWarning>
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
