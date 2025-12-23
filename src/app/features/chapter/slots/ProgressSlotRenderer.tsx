"use client";

import React, { useMemo, memo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, List } from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn, buttonSizeClasses } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { TRANSITIONS } from "@/app/shared/lib/animationTiming";
import { BookmarkIndicator } from "@/app/features/bookmarks";
// Import directly from specific files to avoid circular dependency with chapterLayoutEngine
import { getSimplifiedSections } from "../lib/chapterData";
import type { ProgressSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

export interface ProgressSlotRendererProps {
    slot: ProgressSlot;
    state: ChapterState;
    className?: string;
}

/**
 * ProgressSlotRenderer - Renders progress indicator/sidebar
 *
 * Memoized to prevent re-renders when unrelated ChapterState properties change.
 * Only re-renders when progress-specific state changes.
 */
const ProgressSlotRendererComponent: React.FC<ProgressSlotRendererProps> = ({ slot, state, className }) => {
    const { data } = slot;
    const {
        currentSection,
        setCurrentSection,
        progress,
        totalDuration,
        courseInfo,
        sections,
    } = state;

    // Memoize slot data defaults
    const progressConfig = useMemo(() => ({
        variant: data?.variant ?? "sidebar",
        showSections: data?.showSections ?? true,
    }), [data?.variant, data?.showSections]);

    const { variant, showSections } = progressConfig;

    // Memoize simplified sections
    const simplifiedSections = useMemo(() => getSimplifiedSections(), []);

    if (variant === "header") {
        return (
            <div className={className} data-testid={`progress-slot-${slot.id}`}>
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                            {courseInfo.chapterTitle}
                        </h1>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{Math.round(progress)}%</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Complete</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={TRANSITIONS.progress}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                </div>

                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                            <Clock size={ICON_SIZES.sm} /> {totalDuration}
                        </span>
                        <span className="flex items-center gap-1">
                            <List size={ICON_SIZES.sm} /> {sections.length} sections
                        </span>
                    </div>
                    <button
                        className={cn(
                            buttonSizeClasses.sm,
                            "text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                        )}
                        data-testid="progress-resume-btn"
                    >
                        Resume Learning
                    </button>
                </div>
            </div>
        );
    }

    if (variant === "inline") {
        return (
            <div className={`flex items-center gap-4 ${className ?? ""}`} data-testid={`progress-slot-${slot.id}`}>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={TRANSITIONS.progress}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{Math.round(progress)}%</span>
            </div>
        );
    }

    // Sidebar variant (default)
    return (
        <div className={`space-y-6 ${className ?? ""}`} data-testid={`progress-slot-${slot.id}`}>
            {/* Chapter Progress Card */}
            {showSections && (
                <PrismaticCard glowColor="emerald">
                    <div style={{ padding: "var(--slot-padding-md)" }}>
                        <h3 className="font-bold text-[var(--text-primary)] mb-4">Chapter Progress</h3>
                        <div className="space-y-2">
                            {simplifiedSections.map((section, i) => (
                                <button
                                    key={section.id}
                                    onClick={() => setCurrentSection(i)}
                                    className={cn(
                                        "w-full p-3 rounded-xl text-left transition-all flex items-center gap-3",
                                        currentSection === i
                                            ? "bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                    )}
                                    data-testid={`progress-section-btn-${section.id}`}
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                        section.completed
                                            ? "bg-emerald-500 text-white"
                                            : currentSection === i
                                            ? "bg-indigo-500 text-white"
                                            : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                                    )}>
                                        {section.completed ? <CheckCircle size={ICON_SIZES.sm} /> : i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                                {section.title}
                                            </span>
                                            <BookmarkIndicator
                                                courseId={courseInfo.courseId}
                                                chapterId={courseInfo.chapterId}
                                                sectionId={section.id}
                                            />
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{section.time}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </PrismaticCard>
            )}
        </div>
    );
};

/**
 * Custom comparison function for ProgressSlotRenderer
 * Only re-renders when progress-specific props change
 */
function areProgressPropsEqual(
    prevProps: ProgressSlotRendererProps,
    nextProps: ProgressSlotRendererProps
): boolean {
    if (prevProps.slot.id !== nextProps.slot.id) return false;
    if (prevProps.className !== nextProps.className) return false;

    // Check slot data
    const prevData = prevProps.slot.data;
    const nextData = nextProps.slot.data;
    if (
        prevData?.variant !== nextData?.variant ||
        prevData?.showSections !== nextData?.showSections
    ) {
        return false;
    }

    // Check state - only progress-related properties
    const prevState = prevProps.state;
    const nextState = nextProps.state;

    // Check sections array length
    if (prevState.sections.length !== nextState.sections.length) return false;

    return (
        prevState.currentSection === nextState.currentSection &&
        prevState.progress === nextState.progress &&
        prevState.totalDuration === nextState.totalDuration &&
        prevState.courseInfo.courseId === nextState.courseInfo.courseId &&
        prevState.courseInfo.chapterId === nextState.courseInfo.chapterId &&
        prevState.courseInfo.chapterTitle === nextState.courseInfo.chapterTitle &&
        prevState.setCurrentSection === nextState.setCurrentSection
    );
}

export const ProgressSlotRenderer = memo(ProgressSlotRendererComponent, areProgressPropsEqual);

export default ProgressSlotRenderer;
