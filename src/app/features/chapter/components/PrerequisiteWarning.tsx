"use client";

/**
 * PrerequisiteWarning Component
 *
 * Displays a warning when a chapter has unmet prerequisites.
 * Uses BaseWarning for consistent styling across warning types.
 */

import React from "react";
import { AlertTriangle, Lock, ArrowRight, BookOpen } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { BaseWarning, WarningSkipButton } from "./BaseWarning";
import type { ChapterCurriculumNode } from "@/app/shared/lib/learningPathGraph";

// ============================================================================
// TYPES
// ============================================================================

export interface PrerequisiteWarningProps {
    /** List of prerequisite chapters that are not completed */
    missingPrerequisites: Array<{ id: string; title: string }>;

    /** Variant of the warning display */
    variant?: "banner" | "inline" | "card";

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

export function PrerequisiteWarning({
    missingPrerequisites,
    variant = "banner",
    allowSkip = false,
    onNavigateToPrerequisite,
    onSkip,
    onDismiss,
    className,
}: PrerequisiteWarningProps) {
    if (missingPrerequisites.length === 0) {
        return null;
    }

    const description = `Complete the following chapter${missingPrerequisites.length > 1 ? "s" : ""} first for the best learning experience:`;

    // ========================================================================
    // INLINE VARIANT
    // ========================================================================
    if (variant === "inline") {
        return (
            <BaseWarning
                type="prerequisite"
                variant="inline"
                icon={Lock}
                title={`Requires: ${missingPrerequisites.map((p) => p.title).join(", ")}`}
                className={className}
                testId="prerequisite-warning-inline"
            />
        );
    }

    // ========================================================================
    // CARD VARIANT
    // ========================================================================
    if (variant === "card") {
        return (
            <BaseWarning
                type="prerequisite"
                variant="card"
                icon={Lock}
                title="Chapter Locked"
                subtitle="Complete prerequisites to unlock"
                className={className}
                testId="prerequisite-warning-card"
                footer={
                    allowSkip && (
                        <WarningSkipButton
                            onClick={onSkip}
                            label="Skip prerequisites and continue anyway →"
                            type="prerequisite"
                            testId="skip-prerequisites-card-btn"
                        />
                    )
                }
            >
                <div className="space-y-2">
                    {missingPrerequisites.map((prereq) => (
                        <button
                            key={prereq.id}
                            onClick={() => onNavigateToPrerequisite?.(prereq.id)}
                            className="w-full flex items-center gap-3 p-3 bg-[var(--forge-bg-elevated)] rounded-lg hover:bg-[var(--forge-warning)]/10 transition-colors group"
                            data-testid={`prereq-card-${prereq.id}`}
                        >
                            <BookOpen className="h-5 w-5 text-[var(--forge-text-muted)] group-hover:text-[var(--forge-warning)]" />
                            <span className="flex-1 text-left text-sm font-medium text-[var(--forge-text-secondary)] leading-relaxed">
                                {prereq.title}
                            </span>
                            <ArrowRight className="h-4 w-4 text-[var(--forge-text-muted)] group-hover:text-[var(--forge-warning)] group-hover:translate-x-1 transition-transform" />
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
            type="prerequisite"
            variant="banner"
            icon={AlertTriangle}
            title="Prerequisites Required"
            description={description}
            dismissible={!!onDismiss}
            onDismiss={onDismiss}
            className={className}
            testId="prerequisite-warning-banner"
            footer={
                allowSkip && (
                    <WarningSkipButton
                        onClick={onSkip}
                        type="prerequisite"
                        testId="skip-prerequisites-btn"
                    />
                )
            }
        >
            <ul className="mt-2 space-y-1">
                {missingPrerequisites.map((prereq) => (
                    <li key={prereq.id} className="flex items-center gap-2">
                        <Lock className="h-3 w-3 text-[var(--forge-warning)]" />
                        <button
                            onClick={() => onNavigateToPrerequisite?.(prereq.id)}
                            className="text-xs text-[var(--forge-warning)] hover:underline font-medium flex items-center gap-1"
                            data-testid={`prereq-link-${prereq.id}`}
                        >
                            {prereq.title}
                            <ArrowRight className="h-3 w-3" />
                        </button>
                    </li>
                ))}
            </ul>
        </BaseWarning>
    );
}

// ============================================================================
// SUGGESTED NEXT CHAPTERS COMPONENT
// ============================================================================

export interface SuggestedNextChaptersProps {
    /** Chapters to suggest */
    chapters: ChapterCurriculumNode[];

    /** Callback when user clicks a chapter */
    onSelectChapter?: (chapterId: string) => void;

    /** Additional CSS classes */
    className?: string;
}

export function SuggestedNextChapters({
    chapters,
    onSelectChapter,
    className,
}: SuggestedNextChaptersProps) {
    if (chapters.length === 0) {
        return null;
    }

    return (
        <BaseWarning
            type="success"
            variant="banner"
            icon={ArrowRight}
            title="Suggested Next Steps"
            className={cn(
                "bg-gradient-to-r from-[var(--forge-success)]/10 to-[var(--forge-success)]/20",
                className
            )}
            testId="suggested-next-chapters"
        >
            <div className="space-y-2 mt-3">
                {chapters.map((chapter) => (
                    <button
                        key={chapter.id}
                        onClick={() => onSelectChapter?.(chapter.id)}
                        className="w-full flex items-center gap-3 p-3 bg-[var(--forge-bg-workshop)] rounded-lg hover:bg-[var(--forge-success)]/10 transition-colors group"
                        data-testid={`suggested-chapter-${chapter.id}`}
                    >
                        <BookOpen className="h-4 w-4 text-[var(--forge-success)]" />
                        <div className="flex-1 text-left">
                            <span className="text-sm font-medium text-[var(--forge-text-secondary)] leading-relaxed block">
                                {chapter.name}
                            </span>
                            <span className="text-xs text-[var(--forge-text-muted)]">
                                {chapter.durationMinutes} min · {chapter.xpReward} XP
                            </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[var(--forge-text-muted)] group-hover:text-[var(--forge-success)] group-hover:translate-x-1 transition-transform" />
                    </button>
                ))}
            </div>
        </BaseWarning>
    );
}

// ============================================================================
// CHAPTER STATUS BADGE
// ============================================================================

export interface ChapterStatusBadgeProps {
    status: "locked" | "available" | "in_progress" | "completed";
    className?: string;
}

export function ChapterStatusBadge({ status, className }: ChapterStatusBadgeProps) {
    const config = {
        locked: {
            bg: "bg-[var(--forge-bg-elevated)]",
            text: "text-[var(--forge-text-muted)]",
            icon: Lock,
            label: "Locked",
        },
        available: {
            bg: "bg-[var(--forge-info)]/10",
            text: "text-[var(--forge-info)]",
            icon: BookOpen,
            label: "Available",
        },
        in_progress: {
            bg: "bg-[var(--ember)]/10",
            text: "text-[var(--ember)]",
            icon: BookOpen,
            label: "In Progress",
        },
        completed: {
            bg: "bg-[var(--forge-success)]/10",
            text: "text-[var(--forge-success)]",
            icon: BookOpen,
            label: "Completed",
        },
    };

    const { bg, text, icon: Icon, label } = config[status];

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                bg,
                text,
                className
            )}
            data-testid={`chapter-status-${status}`}
        >
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}
