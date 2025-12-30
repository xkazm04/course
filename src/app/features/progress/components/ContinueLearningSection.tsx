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
                "bg-[var(--forge-bg-elevated)] backdrop-blur-md",
                "border border-[var(--forge-border-subtle)] rounded-2xl p-6",
                className
            )}
            data-testid="continue-learning-section"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BookOpen className="text-[var(--ember)]" size={ICON_SIZES.md} />
                    <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">
                        Continue Learning
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {onExport && (
                        <button
                            onClick={onExport}
                            className="p-2 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-anvil)] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)] focus-visible:ring-offset-2"
                            title="Export progress data"
                            data-testid="export-progress-btn"
                        >
                            <Download size={ICON_SIZES.md} />
                        </button>
                    )}
                    {onClearAll && (
                        <button
                            onClick={onClearAll}
                            className="p-2 text-[var(--forge-text-muted)] hover:text-[var(--forge-error)] hover:bg-[var(--forge-bg-anvil)] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)] focus-visible:ring-offset-2"
                            title="Clear all progress"
                            data-testid="clear-progress-btn"
                        >
                            <Trash2 size={ICON_SIZES.md} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2 text-[var(--forge-text-secondary)]">
                    <Clock size={ICON_SIZES.sm} />
                    <span>
                        <strong className="text-[var(--forge-text-primary)]">
                            {formatWatchTime(totalWatchTime)}
                        </strong>{" "}
                        total watch time
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--forge-text-secondary)]">
                    <span>
                        <strong className="text-[var(--forge-text-primary)]">
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
                    <p className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider">
                        Also in progress
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {otherItems.map((item) => (
                            <button
                                key={item.courseId}
                                onClick={() => onContinue?.(item)}
                                className="p-3 bg-[var(--forge-bg-anvil)] rounded-xl text-left hover:bg-[var(--forge-bg-workshop)] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)] focus-visible:ring-offset-2"
                                data-testid={`continue-learning-item-${item.courseId}`}
                            >
                                <h4 className="font-medium text-sm text-[var(--forge-text-primary)] truncate group-hover:text-[var(--ember)]">
                                    {item.courseName}
                                </h4>
                                <p className="text-xs text-[var(--forge-text-muted)] mt-1 truncate">
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
