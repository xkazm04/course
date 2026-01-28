"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Zap } from "lucide-react";
import { useForge } from "../../layout";
import { useAnimatedCounter } from "../../lib/useAnimatedCounter";
import { forgeEasing, textGradientEmber } from "../../lib/animations";

// ============================================================================
// Circular Progress Ring Component
// ============================================================================

interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

function ProgressRing({ progress, size = 120, strokeWidth = 8, className = "" }: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            {/* Background ring */}
            <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="var(--forge-bg-elevated)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
            </svg>

            {/* Animated progress ring */}
            <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
                <defs>
                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--ember)" />
                        <stop offset="50%" stopColor="var(--gold)" />
                        <stop offset="100%" stopColor="var(--ember-glow)" />
                    </linearGradient>
                </defs>
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#progress-gradient)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: forgeEasing }}
                    style={{
                        strokeDasharray: circumference,
                    }}
                />
            </svg>

            {/* Glow effect on progress end */}
            <motion.div
                className="absolute rounded-full blur-md"
                style={{
                    width: strokeWidth * 2,
                    height: strokeWidth * 2,
                    background: "var(--ember)",
                }}
                initial={{ opacity: 0 }}
                animate={{
                    opacity: [0.5, 0.8, 0.5],
                    rotate: progress * 3.6 - 90,
                }}
                transition={{
                    opacity: { duration: 2, repeat: Infinity },
                    rotate: { duration: 1.5, ease: forgeEasing },
                }}
            />
        </div>
    );
}

// ============================================================================
// Main XPProgress Component
// ============================================================================

export function XPProgress() {
    const { user } = useForge();

    if (!user) return null;

    const progress = (user.xp / (user.xp + user.xpToNextLevel)) * 100;

    const { count: xpCount } = useAnimatedCounter({
        target: user.xp,
        duration: 2000,
        increment: 10,
    });

    const { count: toNextCount } = useAnimatedCounter({
        target: user.xpToNextLevel,
        duration: 2000,
        increment: 10,
        delay: 200,
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: forgeEasing }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <motion.div
                        className="w-8 h-8 rounded-lg bg-[var(--gold)] flex items-center justify-center"
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                    >
                        <Zap size={16} className="text-white" />
                    </motion.div>
                    <h3 className="font-semibold text-[var(--forge-text-primary)]">Level Progress</h3>
                </div>
                <motion.span
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[var(--ember)]/10 to-[var(--gold)]/10 border border-[var(--ember)]/20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Sparkles size={14} className="text-[var(--gold)]" />
                    <span className={`text-sm font-bold ${textGradientEmber}`}>Level {user.level}</span>
                </motion.span>
            </div>

            {/* Main content - Ring + Stats */}
            <div className="flex items-center gap-8">
                {/* Progress Ring */}
                <div className="relative flex-shrink-0">
                    <ProgressRing progress={progress} size={120} strokeWidth={10} />
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            className={`text-2xl font-bold ${textGradientEmber}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            {Math.round(progress)}%
                        </motion.span>
                        <span className="text-xs text-[var(--forge-text-muted)]">complete</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex-1 space-y-4">
                    {/* Total XP */}
                    <div>
                        <div className="text-sm text-[var(--forge-text-muted)] mb-1">Total XP</div>
                        <div className="text-3xl font-bold text-[var(--forge-text-primary)]">
                            {xpCount.toLocaleString()}
                        </div>
                    </div>

                    {/* XP to Next Level */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-[var(--forge-text-muted)] mb-1">
                                To Level {user.level + 1}
                            </div>
                            <div className="text-xl font-semibold text-[var(--ember)]">
                                {toNextCount.toLocaleString()} XP
                            </div>
                        </div>
                        <motion.div
                            className="flex items-center gap-1 text-xs text-[var(--forge-success)] bg-[var(--forge-success)]/10 px-2 py-1 rounded-full"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <TrendingUp size={12} />
                            <span>+15% this week</span>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Linear progress bar (secondary) */}
            <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-[var(--forge-text-muted)] mb-2">
                    <span>Progress to next level</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--forge-bg-elevated)] overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--ember)] via-[var(--gold)] to-[var(--ember-glow)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: forgeEasing, delay: 0.3 }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
