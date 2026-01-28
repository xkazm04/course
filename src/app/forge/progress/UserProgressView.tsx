"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp,
    BookOpen,
    ChevronRight,
    Sparkles,
    Play,
    CheckCircle,
    Target,
    Flame,
    Trophy,
    LogIn,
    Zap,
    Route,
    Loader2,
} from "lucide-react";
import { useForge, type UserLearningPath } from "../components/ForgeProvider";
import { cn } from "@/app/shared/lib/utils";
import { forgeEasing, staggerDelay } from "../lib/animations";
import { useAnimatedCounter } from "../lib/useAnimatedCounter";

// ============================================================================
// Progress Card Component
// ============================================================================

interface ProgressCardProps {
    path: UserLearningPath;
}

function ProgressCard({ path }: ProgressCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const progress = path.progressPercent;
    const isCompleted = path.status === "completed" || progress >= 100;

    const statusColor = {
        enrolled: "text-[var(--forge-info)]",
        in_progress: "text-[var(--ember)]",
        completed: "text-[var(--forge-success)]",
        dropped: "text-[var(--forge-text-muted)]",
    }[path.status] || "text-[var(--forge-text-secondary)]";

    const statusLabel = {
        enrolled: "Just Started",
        in_progress: "In Progress",
        completed: "Completed",
        dropped: "Paused",
    }[path.status] || path.status;

    return (
        <motion.div
            layout
            whileHover={{ y: -2 }}
            transition={{ ease: forgeEasing }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden shadow-sm hover:shadow-lg hover:border-[var(--ember)]/30 transition-shadow"
        >
            {/* Header - Clickable */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-[var(--forge-bg-bench)]/30 transition-colors"
            >
                {/* Progress Ring */}
                <div className="relative w-14 h-14 flex-shrink-0">
                    <svg className="w-14 h-14 -rotate-90">
                        <circle
                            cx="28"
                            cy="28"
                            r="24"
                            fill="none"
                            stroke="var(--forge-border-subtle)"
                            strokeWidth="4"
                        />
                        <circle
                            cx="28"
                            cy="28"
                            r="24"
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${progress * 1.5} 150`}
                        />
                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="var(--ember)" />
                                <stop offset="100%" stopColor="var(--ember-glow)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-[var(--forge-text-primary)]">
                            {progress}%
                        </span>
                    </div>
                </div>

                {/* Path Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] truncate">
                            {path.title}
                        </h3>
                        {isCompleted && (
                            <Trophy size={16} className="text-[var(--gold)] flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[var(--forge-text-secondary)]">
                        <span className={cn("flex items-center gap-1", statusColor)}>
                            {path.status === "in_progress" && <Play size={12} />}
                            {path.status === "completed" && <CheckCircle size={12} />}
                            {statusLabel}
                        </span>
                        {path.description && (
                            <span className="text-xs text-[var(--forge-text-muted)] truncate max-w-[200px]">
                                {path.description}
                            </span>
                        )}
                    </div>
                </div>

                {/* Expand Toggle */}
                <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 text-[var(--forge-text-muted)]"
                >
                    <ChevronRight size={20} />
                </motion.div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-0 border-t border-[var(--forge-border-subtle)]">
                            {/* Progress Bar */}
                            <div className="py-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-[var(--forge-text-secondary)]">Progress</span>
                                    <span className="text-[var(--forge-text-primary)] font-medium">{progress}%</span>
                                </div>
                                <div className="h-2 bg-[var(--forge-bg-bench)] rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs text-[var(--forge-text-muted)] mt-2">
                                    <span>Started {new Date(path.startedAt).toLocaleDateString()}</span>
                                    {path.completedAt && (
                                        <span>Completed {new Date(path.completedAt).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Link
                                    href={`/forge/paths/${path.pathId}`}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--ember)] text-[var(--oracle-text-on-ember)] text-sm font-medium hover:bg-[var(--ember)]/90 transition-colors"
                                >
                                    {!isCompleted ? (
                                        <>
                                            <Play size={14} />
                                            Continue Learning
                                        </>
                                    ) : (
                                        <>
                                            <Trophy size={14} />
                                            View Certificate
                                        </>
                                    )}
                                </Link>
                                <Link
                                    href={`/forge/map?path=${path.pathId}`}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--forge-border-subtle)] text-[var(--forge-text-secondary)] text-sm font-medium hover:bg-[var(--forge-bg-bench)]/50 hover:text-[var(--forge-text-primary)] transition-colors"
                                >
                                    View on Map
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================================
// Animated Stat Card Component
// ============================================================================

interface StatCardProps {
    icon: typeof Zap;
    label: string;
    value: number;
    color: string;
    bgColor: string;
    index: number;
}

function StatCard({ icon: Icon, label, value, color, bgColor, index }: StatCardProps) {
    const { count } = useAnimatedCounter({ target: value, duration: 1500, delay: index * 100 });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: staggerDelay(index, 0.08), ease: forgeEasing }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl p-4 border border-[var(--forge-border-subtle)] shadow-sm hover:shadow-lg transition-shadow"
        >
            <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgColor)}>
                    <Icon size={18} className={color} />
                </div>
                <div>
                    <div className={cn("text-2xl font-bold", color)}>
                        {count.toLocaleString()}
                    </div>
                    <div className="text-xs text-[var(--forge-text-muted)] uppercase tracking-wider">
                        {label}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({ isAuthenticated }: { isAuthenticated: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: forgeEasing }}
            className="text-center py-16 px-4 bg-[var(--forge-bg-daylight)]/60 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)]"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, ease: forgeEasing }}
                className="relative w-20 h-20 mx-auto mb-6"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--ember)]/30 to-[var(--gold)]/30 rounded-2xl blur-md" />
                <div className="relative w-full h-full rounded-2xl bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] flex items-center justify-center">
                    <Target size={32} className="text-[var(--forge-text-muted)]" />
                </div>
            </motion.div>

            {isAuthenticated ? (
                <>
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, ease: forgeEasing }}
                        className="text-xl font-semibold text-[var(--forge-text-primary)] mb-2"
                    >
                        No learning paths yet
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, ease: forgeEasing }}
                        className="text-[var(--forge-text-secondary)] mb-6 max-w-md mx-auto"
                    >
                        Start your journey by exploring the knowledge map and letting the Oracle
                        craft a personalized learning path for you.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, ease: forgeEasing }}
                    >
                        <Link
                            href="/forge/map"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white font-medium hover:shadow-lg hover:shadow-[var(--ember)]/30 transition-all"
                        >
                            <Sparkles size={18} />
                            Explore the Map
                        </Link>
                    </motion.div>
                </>
            ) : (
                <>
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, ease: forgeEasing }}
                        className="text-xl font-semibold text-[var(--forge-text-primary)] mb-2"
                    >
                        Sign in to track progress
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, ease: forgeEasing }}
                        className="text-[var(--forge-text-secondary)] mb-6 max-w-md mx-auto"
                    >
                        Create an account or sign in to save your progress, earn XP, and unlock achievements.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, ease: forgeEasing }}
                    >
                        <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white font-medium hover:shadow-lg hover:shadow-[var(--ember)]/30 transition-all">
                            <LogIn size={18} />
                            Sign In
                        </button>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}

// ============================================================================
// Main View Component
// ============================================================================

export function UserProgressView() {
    const { user, isAuthenticated, isLoading } = useForge();
    const learningPaths = user?.learningPaths || [];

    // Stats
    const totalPaths = learningPaths.length;
    const completedPaths = learningPaths.filter(p => p.status === "completed").length;
    const inProgressPaths = learningPaths.filter(p => p.status === "in_progress").length;
    const totalXP = user?.xp ?? 0;

    // Stats config with icons and colors
    const statsConfig = [
        { icon: Route, label: "Total Paths", value: totalPaths, color: "text-[var(--forge-text-primary)]", bgColor: "bg-[var(--forge-bg-elevated)]" },
        { icon: Flame, label: "In Progress", value: inProgressPaths, color: "text-[var(--ember)]", bgColor: "bg-[var(--ember)]/10" },
        { icon: CheckCircle, label: "Completed", value: completedPaths, color: "text-[var(--forge-success)]", bgColor: "bg-[var(--forge-success)]/10" },
        { icon: Zap, label: "Total XP", value: totalXP, color: "text-[var(--gold)]", bgColor: "bg-[var(--gold)]/10" },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-[var(--ember)]" />
            </div>
        );
    }

    return (
        <section className="py-8 pb-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ease: forgeEasing }}
                    className="text-center mb-8"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, ease: forgeEasing }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--ember)]/10 border border-[var(--ember)]/20 mb-5"
                    >
                        <TrendingUp size={16} className="text-[var(--ember)]" />
                        <span className="text-sm text-[var(--forge-text-secondary)]">
                            Your Learning Journey
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, ease: forgeEasing }}
                        className="text-3xl sm:text-4xl font-bold text-[var(--forge-text-primary)] mb-3"
                    >
                        My{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ember)] via-[var(--gold)] to-[var(--ember-glow)]">
                            Progress
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, ease: forgeEasing }}
                        className="text-base text-[var(--forge-text-secondary)] max-w-2xl mx-auto"
                    >
                        Track your learning paths, earned XP, and achievements.
                    </motion.p>
                </motion.div>

                {/* Stats Cards (only show if has paths) */}
                {totalPaths > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        {statsConfig.map((stat, index) => (
                            <StatCard
                                key={stat.label}
                                icon={stat.icon}
                                label={stat.label}
                                value={stat.value}
                                color={stat.color}
                                bgColor={stat.bgColor}
                                index={index}
                            />
                        ))}
                    </div>
                )}

                {/* Learning Paths List */}
                {totalPaths > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, ease: forgeEasing }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen size={18} className="text-[var(--ember)]" />
                            <h2 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                                Your Learning Paths
                            </h2>
                        </div>
                        {learningPaths.map((path, index) => (
                            <motion.div
                                key={path.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: staggerDelay(index, 0.08) + 0.35, ease: forgeEasing }}
                            >
                                <ProgressCard path={path} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <EmptyState isAuthenticated={isAuthenticated} />
                )}

                {/* CTA for more paths */}
                {totalPaths > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, ease: forgeEasing }}
                        className="mt-8 text-center"
                    >
                        <Link
                            href="/forge/community"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[var(--forge-text-secondary)] hover:text-[var(--ember)] hover:bg-[var(--forge-bg-elevated)]/50 transition-all"
                        >
                            <Sparkles size={16} />
                            Explore more community paths
                            <ChevronRight size={16} />
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
