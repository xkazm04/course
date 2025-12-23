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
                    "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4",
                    className
                )}
                data-testid="prerequisite-warning-banner"
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Prerequisites Required
                        </h3>
                        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                            Complete the following chapter{missingPrerequisites.length > 1 ? "s" : ""}{" "}
                            first for the best learning experience:
                        </p>
                        <ul className="mt-2 space-y-1">
                            {missingPrerequisites.map((prereq) => (
                                <li key={prereq.id} className="flex items-center gap-2">
                                    <Lock className="h-3 w-3 text-amber-500" />
                                    <button
                                        onClick={() => onNavigateToPrerequisite?.(prereq.id)}
                                        className="text-sm text-amber-800 dark:text-amber-200 hover:underline font-medium flex items-center gap-1"
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
                                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
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
                            className="flex-shrink-0 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
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
                    "flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm",
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
                "bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-xl p-6 shadow-lg",
                className
            )}
            data-testid="prerequisite-warning-card"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Lock className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                        Chapter Locked
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Complete prerequisites to unlock
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                {missingPrerequisites.map((prereq) => (
                    <button
                        key={prereq.id}
                        onClick={() => onNavigateToPrerequisite?.(prereq.id)}
                        className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group"
                        data-testid={`prereq-card-${prereq.id}`}
                    >
                        <BookOpen className="h-5 w-5 text-slate-400 group-hover:text-amber-500" />
                        <span className="flex-1 text-left text-sm font-medium text-slate-700 dark:text-slate-200">
                            {prereq.title}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-transform" />
                    </button>
                ))}
            </div>

            {allowSkip && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={onSkip}
                        className="text-sm text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
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
                "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4",
                className
            )}
            data-testid="suggested-next-chapters"
        >
            <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Suggested Next Steps
            </h3>
            <div className="space-y-2">
                {chapters.map((chapter) => (
                    <button
                        key={chapter.id}
                        onClick={() => onSelectChapter?.(chapter.id)}
                        className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group"
                        data-testid={`suggested-chapter-${chapter.id}`}
                    >
                        <BookOpen className="h-4 w-4 text-emerald-500" />
                        <div className="flex-1 text-left">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block">
                                {chapter.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {chapter.durationMinutes} min · {chapter.xpReward} XP
                            </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-transform" />
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
            bg: "bg-slate-100 dark:bg-slate-700",
            text: "text-slate-500 dark:text-slate-400",
            icon: Lock,
            label: "Locked",
        },
        available: {
            bg: "bg-blue-100 dark:bg-blue-900/30",
            text: "text-blue-600 dark:text-blue-400",
            icon: BookOpen,
            label: "Available",
        },
        in_progress: {
            bg: "bg-amber-100 dark:bg-amber-900/30",
            text: "text-amber-600 dark:text-amber-400",
            icon: BookOpen,
            label: "In Progress",
        },
        completed: {
            bg: "bg-emerald-100 dark:bg-emerald-900/30",
            text: "text-emerald-600 dark:text-emerald-400",
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
