"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, Download, Trash2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ContinueLearningItem } from "../lib/types";
import { formatWatchTime } from "../lib/progressStorage";
import { ContinueLearningButton } from "./ContinueLearningButton";
import { ProgressBar } from "./ProgressBar";

interface ContinueLearningSectionProps {
    items: ContinueLearningItem[];
    totalWatchTime: number;
    overallCompletion: number;
    onContinue?: (item: ContinueLearningItem) => void;
    onExport?: () => void;
    onClearAll?: () => void;
    className?: string;
}

export function ContinueLearningSection({
    items,
    totalWatchTime,
    overallCompletion,
    onContinue,
    onExport,
    onClearAll,
    className,
}: ContinueLearningSectionProps) {
    if (items.length === 0) {
        return null;
    }

    const primaryItem = items[0];
    const otherItems = items.slice(1, 4);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-white/60 dark:bg-slate-800/60 backdrop-blur-md",
                "border border-white/50 dark:border-slate-700/50 rounded-2xl p-6",
                className
            )}
            data-testid="continue-learning-section"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BookOpen className="text-indigo-500 dark:text-indigo-400" size={ICON_SIZES.md} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Continue Learning
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {onExport && (
                        <button
                            onClick={onExport}
                            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                            title="Export progress data"
                            data-testid="export-progress-btn"
                        >
                            <Download size={ICON_SIZES.md} />
                        </button>
                    )}
                    {onClearAll && (
                        <button
                            onClick={onClearAll}
                            className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                            title="Clear all progress"
                            data-testid="clear-progress-btn"
                        >
                            <Trash2 size={ICON_SIZES.md} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Clock size={ICON_SIZES.sm} />
                    <span>
                        <strong className="text-slate-900 dark:text-slate-100">
                            {formatWatchTime(totalWatchTime)}
                        </strong>{" "}
                        total watch time
                    </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span>
                        <strong className="text-slate-900 dark:text-slate-100">
                            {overallCompletion}%
                        </strong>{" "}
                        overall completion
                    </span>
                </div>
            </div>

            <ContinueLearningButton
                item={primaryItem}
                onClick={() => onContinue?.(primaryItem)}
                variant="full"
                className="mb-4"
            />

            {otherItems.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Also in progress
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {otherItems.map((item) => (
                            <button
                                key={item.courseId}
                                onClick={() => onContinue?.(item)}
                                className="p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl text-left hover:bg-white/80 dark:hover:bg-slate-600/80 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                data-testid={`continue-learning-item-${item.courseId}`}
                            >
                                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {item.courseName}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                    {item.chapterTitle}
                                </p>
                                <ProgressBar
                                    progress={item.progress}
                                    size="sm"
                                    className="mt-2"
                                    animate={false}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
