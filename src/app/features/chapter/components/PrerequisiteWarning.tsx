"use client";

/**
 * PrerequisiteWarning Component
 *
 * Displays a warning when a chapter has unmet prerequisites.
 * Supports different variants: banner, inline, and modal.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Lock, ArrowRight, X, BookOpen } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
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
                data-testid="prerequisite-warning-banner"
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-[var(--forge-warning)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-[var(--forge-warning)]">
                            Prerequisites Required
                        </h3>
                        <p className="mt-1 text-sm text-[var(--forge-text-secondary)]">
                            Complete the following chapter{missingPrerequisites.length > 1 ? "s" : ""}{" "}
                            first for the best learning experience:
                        </p>
                        <ul className="mt-2 space-y-1">
                            {missingPrerequisites.map((prereq) => (
                                <li key={prereq.id} className="flex items-center gap-2">
                                    <Lock className="h-3 w-3 text-[var(--forge-warning)]" />
                                    <button
                                        onClick={() => onNavigateToPrerequisite?.(prereq.id)}
                                        className="text-sm text-[var(--forge-warning)] hover:underline font-medium flex items-center gap-1"
                                        data-testid={`prereq-link-${prereq.id}`}
                                    >
                                        {prereq.title}
                                        <ArrowRight className="h-3 w-3" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {allowSkip && (
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={onSkip}
                                    className="text-xs text-[var(--forge-warning)] hover:underline"
                                    data-testid="skip-prerequisites-btn"
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
                            data-testid="dismiss-warning-btn"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </motion.div>
        );
    }

    if (variant === "inline") {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                    "flex items-center gap-2 text-[var(--forge-warning)] text-sm",
                    className
                )}
                data-testid="prerequisite-warning-inline"
            >
                <Lock className="h-4 w-4" />
                <span>
                    Requires: {missingPrerequisites.map((p) => p.title).join(", ")}
                </span>
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
            data-testid="prerequisite-warning-card"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[var(--forge-warning)]/10 rounded-lg">
                    <Lock className="h-6 w-6 text-[var(--forge-warning)]" />
                </div>
                <div>
                    <h3 className="font-semibold text-[var(--forge-text-primary)]">
                        Chapter Locked
                    </h3>
                    <p className="text-sm text-[var(--forge-text-muted)]">
                        Complete prerequisites to unlock
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                {missingPrerequisites.map((prereq) => (
                    <button
                        key={prereq.id}
                        onClick={() => onNavigateToPrerequisite?.(prereq.id)}
                        className="w-full flex items-center gap-3 p-3 bg-[var(--forge-bg-elevated)] rounded-lg hover:bg-[var(--forge-warning)]/10 transition-colors group"
                        data-testid={`prereq-card-${prereq.id}`}
                    >
                        <BookOpen className="h-5 w-5 text-[var(--forge-text-muted)] group-hover:text-[var(--forge-warning)]" />
                        <span className="flex-1 text-left text-sm font-medium text-[var(--forge-text-secondary)]">
                            {prereq.title}
                        </span>
                        <ArrowRight className="h-4 w-4 text-[var(--forge-text-muted)] group-hover:text-[var(--forge-warning)] group-hover:translate-x-1 transition-transform" />
                    </button>
                ))}
            </div>

            {allowSkip && (
                <div className="mt-4 pt-4 border-t border-[var(--forge-border-subtle)]">
                    <button
                        onClick={onSkip}
                        className="text-sm text-[var(--forge-text-muted)] hover:text-[var(--forge-warning)]"
                        data-testid="skip-prerequisites-card-btn"
                    >
                        Skip prerequisites and continue anyway →
                    </button>
                </div>
            )}
        </motion.div>
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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-gradient-to-r from-[var(--forge-success)]/10 to-[var(--forge-success)]/20 border border-[var(--forge-success)]/30 rounded-lg p-4",
                className
            )}
            data-testid="suggested-next-chapters"
        >
            <h3 className="text-sm font-medium text-[var(--forge-success)] mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Suggested Next Steps
            </h3>
            <div className="space-y-2">
                {chapters.map((chapter) => (
                    <button
                        key={chapter.id}
                        onClick={() => onSelectChapter?.(chapter.id)}
                        className="w-full flex items-center gap-3 p-3 bg-[var(--forge-bg-workshop)] rounded-lg hover:bg-[var(--forge-success)]/10 transition-colors group"
                        data-testid={`suggested-chapter-${chapter.id}`}
                    >
                        <BookOpen className="h-4 w-4 text-[var(--forge-success)]" />
                        <div className="flex-1 text-left">
                            <span className="text-sm font-medium text-[var(--forge-text-secondary)] block">
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
        </motion.div>
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
