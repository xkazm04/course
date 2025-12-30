"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, Snowflake, Trophy, Calendar } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { StreakData } from "../lib/streakStorage";

interface StreakDisplayProps {
    streakData: StreakData;
    size?: "compact" | "full";
    className?: string;
}

export const StreakDisplay = ({
    streakData,
    size = "full",
    className,
}: StreakDisplayProps) => {
    const { currentStreak, longestStreak, streakFreezeTokens, totalActiveDays } = streakData;

    if (size === "compact") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                    "bg-gradient-to-r from-[var(--ember)]/10 to-[var(--forge-warning)]/10",
                    "border border-[var(--ember)]/30",
                    className
                )}
                data-testid="streak-display-compact"
            >
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Flame className="w-5 h-5 text-[var(--ember)]" />
                </motion.div>
                <span className="font-bold text-[var(--ember)]">
                    {currentStreak} day{currentStreak !== 1 ? "s" : ""}
                </span>
                {streakFreezeTokens > 0 && (
                    <div className="flex items-center gap-1 ml-1 text-[var(--forge-info)]">
                        <Snowflake className="w-4 h-4" />
                        <span className="text-xs font-medium">{streakFreezeTokens}</span>
                    </div>
                )}
            </motion.div>
        );
    }

    return (
        <div className={cn("space-y-4", className)} data-testid="streak-display-full">
            {/* Main Streak Counter */}
            <div className="flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
                    className="relative"
                >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-[var(--ember)]/30 rounded-full blur-2xl" />

                    <div className="relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-[var(--ember)] to-[var(--forge-warning)] text-white shadow-lg shadow-[var(--ember)]/30">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Flame className="w-12 h-12 mb-2" />
                        </motion.div>
                        <span className="text-4xl font-black">{currentStreak}</span>
                        <span className="text-sm font-medium opacity-90">
                            day streak
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
                {/* Longest Streak */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center p-3 rounded-xl bg-[var(--forge-bg-elevated)]/60 border border-[var(--forge-border-subtle)]"
                    data-testid="longest-streak-stat"
                >
                    <Trophy className="w-5 h-5 text-[var(--forge-warning)] mb-1" />
                    <span className="text-lg font-bold text-[var(--forge-text-primary)]">
                        {longestStreak}
                    </span>
                    <span className="text-xs text-[var(--forge-text-muted)]">Best</span>
                </motion.div>

                {/* Total Active Days */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center p-3 rounded-xl bg-[var(--forge-bg-elevated)]/60 border border-[var(--forge-border-subtle)]"
                    data-testid="total-days-stat"
                >
                    <Calendar className="w-5 h-5 text-[var(--forge-accent)] mb-1" />
                    <span className="text-lg font-bold text-[var(--forge-text-primary)]">
                        {totalActiveDays}
                    </span>
                    <span className="text-xs text-[var(--forge-text-muted)]">Total</span>
                </motion.div>

                {/* Streak Freeze Tokens */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center p-3 rounded-xl bg-[var(--forge-bg-elevated)]/60 border border-[var(--forge-border-subtle)]"
                    data-testid="freeze-tokens-stat"
                >
                    <Snowflake className="w-5 h-5 text-[var(--forge-info)] mb-1" />
                    <span className="text-lg font-bold text-[var(--forge-text-primary)]">
                        {streakFreezeTokens}
                    </span>
                    <span className="text-xs text-[var(--forge-text-muted)]">Freezes</span>
                </motion.div>
            </div>

            {/* Freeze Info */}
            {streakFreezeTokens > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                >
                    <p className="text-xs text-[var(--forge-text-muted)]">
                        <Snowflake className="inline w-3 h-3 mr-1" />
                        Streak freezes protect your streak if you miss a day
                    </p>
                </motion.div>
            )}
        </div>
    );
};
