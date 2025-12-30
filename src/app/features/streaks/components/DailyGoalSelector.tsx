"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, Check } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface DailyGoalSelectorProps {
    currentGoal: number;
    onGoalChange: (minutes: number) => void;
    className?: string;
}

const GOAL_OPTIONS = [5, 10, 15, 30];

export const DailyGoalSelector = ({
    currentGoal,
    onGoalChange,
    className,
}: DailyGoalSelectorProps) => {
    return (
        <div className={cn("space-y-3", className)} data-testid="daily-goal-selector">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--forge-text-secondary)]">
                <Clock size={ICON_SIZES.sm} className="text-[var(--forge-accent)]" />
                <span>Daily Goal</span>
            </div>

            <div className="flex gap-2">
                {GOAL_OPTIONS.map((minutes) => {
                    const isSelected = currentGoal === minutes;
                    return (
                        <motion.button
                            key={minutes}
                            onClick={() => onGoalChange(minutes)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                "relative flex-1 py-3 px-2 rounded-xl font-bold text-sm transition-all duration-200",
                                "border-2",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forge-accent)] focus-visible:ring-offset-2",
                                isSelected
                                    ? "bg-[var(--forge-accent)] border-[var(--forge-accent)] text-white"
                                    : "bg-[var(--forge-bg-elevated)]/60 border-[var(--forge-border-subtle)] text-[var(--forge-text-muted)] hover:border-[var(--forge-accent)]/50"
                            )}
                            data-testid={`goal-option-${minutes}`}
                        >
                            {isSelected && (
                                <motion.div
                                    layoutId="goal-selected"
                                    className="absolute inset-0 bg-[var(--forge-accent)] rounded-xl"
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                />
                            )}
                            <span className="relative flex items-center justify-center gap-1">
                                {isSelected && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <Check size={ICON_SIZES.sm} />
                                    </motion.span>
                                )}
                                {minutes} min
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
