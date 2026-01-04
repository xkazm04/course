"use client";

import { motion } from "framer-motion";
import { Flame, Trophy, AlertTriangle } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

interface StreakCardProps {
    currentStreak: number;
    longestStreak: number;
    atRisk: boolean;
    lastActivityDate: string | null;
}

export function StreakCard({
    currentStreak,
    longestStreak,
    atRisk,
    lastActivityDate,
}: StreakCardProps) {
    const isNewRecord = currentStreak > 0 && currentStreak >= longestStreak;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
                "bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border shadow-lg overflow-hidden",
                atRisk
                    ? "border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent"
                    : "border-[var(--forge-border-subtle)]"
            )}
        >
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-2 rounded-xl",
                            currentStreak > 0
                                ? "bg-orange-500/10"
                                : "bg-[var(--forge-bg-elevated)]"
                        )}>
                            <Flame className={cn(
                                "w-5 h-5",
                                currentStreak > 0
                                    ? "text-orange-500"
                                    : "text-[var(--forge-text-muted)]"
                            )} />
                        </div>
                        <h3 className="font-semibold text-[var(--forge-text-primary)]">
                            Learning Streak
                        </h3>
                    </div>

                    {isNewRecord && currentStreak > 1 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] text-xs font-medium"
                        >
                            <Trophy className="w-3 h-3" />
                            Record!
                        </motion.div>
                    )}
                </div>

                {/* Streak count */}
                <div className="flex items-end gap-2 mb-4">
                    <motion.span
                        key={currentStreak}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className={cn(
                            "text-5xl font-bold",
                            currentStreak > 0
                                ? "text-orange-500"
                                : "text-[var(--forge-text-muted)]"
                        )}
                    >
                        {currentStreak}
                    </motion.span>
                    <span className="text-lg text-[var(--forge-text-muted)] pb-1">
                        {currentStreak === 1 ? "day" : "days"}
                    </span>
                </div>

                {/* Warning if at risk */}
                {atRisk && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-4"
                    >
                        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                            Complete a chapter today to keep your streak!
                        </p>
                    </motion.div>
                )}

                {/* Longest streak */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--forge-text-muted)]">Longest streak</span>
                    <span className="font-medium text-[var(--forge-text-secondary)]">
                        {longestStreak} days
                    </span>
                </div>

                {/* Streak visualization */}
                <div className="mt-4 flex gap-1">
                    {[...Array(7)].map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex-1 h-2 rounded-full",
                                i < Math.min(currentStreak, 7)
                                    ? "bg-gradient-to-r from-orange-500 to-orange-400"
                                    : "bg-[var(--forge-bg-elevated)]"
                            )}
                        />
                    ))}
                </div>
                <div className="flex justify-between text-[10px] text-[var(--forge-text-muted)] mt-1">
                    <span>This week</span>
                    <span>{Math.min(currentStreak, 7)}/7</span>
                </div>
            </div>
        </motion.div>
    );
}
