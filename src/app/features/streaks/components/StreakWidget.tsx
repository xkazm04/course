"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { StreakData } from "../lib/streakStorage";
import { DailyProgressRing } from "./DailyProgressRing";
import { DailyGoalSelector } from "./DailyGoalSelector";
import { StreakDisplay } from "./StreakDisplay";
import { MilestoneCelebration } from "./MilestoneCelebration";

interface StreakWidgetProps {
    streakData: StreakData;
    dailyProgress: number;
    isGoalMet: boolean;
    onRecordTime: (minutes: number) => number | null;
    onGoalChange: (minutes: number) => void;
    className?: string;
}

const QUICK_ADD_OPTIONS = [1, 5, 10, 15];

export const StreakWidget = ({
    streakData,
    dailyProgress,
    isGoalMet,
    onRecordTime,
    onGoalChange,
    className,
}: StreakWidgetProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [celebratingMilestone, setCelebratingMilestone] = useState<number | null>(null);

    const handleAddTime = (minutes: number) => {
        const milestone = onRecordTime(minutes);
        if (milestone) {
            setCelebratingMilestone(milestone);
        }
    };

    return (
        <>
            <motion.div
                layout
                className={cn(
                    "bg-[var(--forge-bg-elevated)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-lg overflow-hidden",
                    className
                )}
                data-testid="streak-widget"
            >
                {/* Collapsed View */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full p-4 flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--forge-accent)] rounded-t-2xl"
                    data-testid="streak-widget-toggle"
                >
                    <div className="flex items-center gap-4">
                        <DailyProgressRing
                            progress={dailyProgress}
                            currentMinutes={streakData.todayMinutes}
                            goalMinutes={streakData.dailyGoalMinutes}
                            isGoalMet={isGoalMet}
                            size="sm"
                        />
                        <div className="text-left">
                            <div className="flex items-center gap-2">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <Flame className="w-5 h-5 text-[var(--ember)]" />
                                </motion.div>
                                <span className="font-bold text-[var(--forge-text-primary)]">
                                    {streakData.currentStreak} day streak
                                </span>
                            </div>
                            <p className="text-sm text-[var(--forge-text-secondary)]">
                                {isGoalMet
                                    ? "Daily goal completed!"
                                    : `${streakData.todayMinutes}/${streakData.dailyGoalMinutes} min today`}
                            </p>
                        </div>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-5 h-5 text-[var(--forge-text-muted)]" />
                    </motion.div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 space-y-6 border-t border-[var(--forge-border-subtle)] pt-4">
                                {/* Streak Display */}
                                <StreakDisplay streakData={streakData} size="full" />

                                {/* Quick Add Buttons */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-[var(--forge-text-secondary)] flex items-center gap-2">
                                        <Plus size={ICON_SIZES.sm} className="text-[var(--forge-accent)]" />
                                        Add Learning Time
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {QUICK_ADD_OPTIONS.map((mins) => (
                                            <motion.button
                                                key={mins}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleAddTime(mins)}
                                                className="py-2 px-3 rounded-lg bg-[var(--forge-accent)]/10 hover:bg-[var(--forge-accent)]/20 border border-[var(--forge-border-subtle)] text-[var(--forge-accent)] font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forge-accent)] focus-visible:ring-offset-2"
                                                data-testid={`add-time-${mins}`}
                                            >
                                                +{mins} min
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Daily Goal Selector */}
                                <DailyGoalSelector
                                    currentGoal={streakData.dailyGoalMinutes}
                                    onGoalChange={onGoalChange}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Milestone Celebration Modal */}
            <MilestoneCelebration
                milestone={celebratingMilestone}
                onClose={() => setCelebratingMilestone(null)}
            />
        </>
    );
};
