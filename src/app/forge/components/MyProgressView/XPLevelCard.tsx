"use client";

import { motion } from "framer-motion";
import { Zap, TrendingUp } from "lucide-react";

interface XPLevelCardProps {
    level: number;
    totalXp: number;
    xpToNextLevel: number;
    xpForCurrentLevel: number;
    levelProgress: number;
}

export function XPLevelCard({
    level,
    totalXp,
    xpToNextLevel,
    xpForCurrentLevel,
    levelProgress,
}: XPLevelCardProps) {
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (levelProgress / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[var(--forge-bg-daylight)]/90 via-[var(--forge-bg-elevated)]/80 to-[var(--ember)]/5 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-xl overflow-hidden"
        >
            <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                    {/* Level Ring */}
                    <div className="relative flex-shrink-0">
                        <svg
                            width="140"
                            height="140"
                            viewBox="0 0 120 120"
                            className="transform -rotate-90"
                        >
                            {/* Background ring */}
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-[var(--forge-bg-elevated)]"
                            />
                            {/* Progress ring */}
                            <motion.circle
                                cx="60"
                                cy="60"
                                r="54"
                                stroke="url(#xpGradient)"
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                style={{ strokeDasharray: circumference }}
                            />
                            <defs>
                                <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="var(--ember)" />
                                    <stop offset="100%" stopColor="var(--ember-glow)" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ scale: 0.5 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="text-4xl font-bold text-[var(--forge-text-primary)]"
                            >
                                {level}
                            </motion.span>
                            <span className="text-xs uppercase tracking-wide text-[var(--forge-text-muted)]">
                                Level
                            </span>
                        </div>
                    </div>

                    {/* XP Info */}
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                            <Zap className="w-5 h-5 text-[var(--ember)]" />
                            <h2 className="text-xl font-semibold text-[var(--forge-text-primary)]">
                                Experience Points
                            </h2>
                        </div>

                        <div className="mb-4">
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] bg-clip-text text-transparent"
                            >
                                {totalXp.toLocaleString()}
                            </motion.span>
                            <span className="text-lg text-[var(--forge-text-muted)] ml-2">XP</span>
                        </div>

                        {/* Progress bar */}
                        <div className="max-w-sm mx-auto sm:mx-0">
                            <div className="flex justify-between text-sm text-[var(--forge-text-muted)] mb-2">
                                <span>Progress to Level {level + 1}</span>
                                <span>{levelProgress}%</span>
                            </div>
                            <div className="h-3 rounded-full bg-[var(--forge-bg-elevated)] overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${levelProgress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-[var(--forge-text-muted)] mt-1">
                                <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {xpToNextLevel.toLocaleString()} XP to go
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
