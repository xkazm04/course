"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp,
    BookOpen,
    Clock,
    ChevronRight,
    ChevronDown,
    Sparkles,
    Play,
    CheckCircle,
    Target,
    Flame,
    Trophy,
    LogIn,
} from "lucide-react";
import { useForge, type UserLearningPath } from "../components/ForgeProvider";
import { cn } from "@/app/shared/lib/utils";

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
            className="bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden"
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
// Empty State Component
// ============================================================================

function EmptyState({ isAuthenticated }: { isAuthenticated: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-4"
        >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] flex items-center justify-center">
                <Target size={32} className="text-[var(--forge-text-muted)]" />
            </div>

            {isAuthenticated ? (
                <>
                    <h3 className="text-xl font-semibold text-[var(--forge-text-primary)] mb-2">
                        No learning paths yet
                    </h3>
                    <p className="text-[var(--forge-text-secondary)] mb-6 max-w-md mx-auto">
                        Start your journey by exploring the knowledge map and letting the Oracle
                        craft a personalized learning path for you.
                    </p>
                    <Link
                        href="/forge/map"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--ember)] text-[var(--oracle-text-on-ember)] font-medium hover:bg-[var(--ember)]/90 transition-colors shadow-lg shadow-[var(--ember)]/20"
                    >
                        <Sparkles size={18} />
                        Explore the Map
                    </Link>
                </>
            ) : (
                <>
                    <h3 className="text-xl font-semibold text-[var(--forge-text-primary)] mb-2">
                        Sign in to track progress
                    </h3>
                    <p className="text-[var(--forge-text-secondary)] mb-6 max-w-md mx-auto">
                        Create an account or sign in to save your progress, earn XP, and unlock achievements.
                    </p>
                    <button
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--ember)] text-[var(--oracle-text-on-ember)] font-medium hover:bg-[var(--ember)]/90 transition-colors shadow-lg shadow-[var(--ember)]/20"
                    >
                        <LogIn size={18} />
                        Sign In
                    </button>
                </>
            )}
        </motion.div>
    );
}

// ============================================================================
// Main View Component
// ============================================================================

export function UserProgressView() {
    const { user, isAuthenticated } = useForge();
    const learningPaths = user?.learningPaths || [];

    // Stats
    const totalPaths = learningPaths.length;
    const completedPaths = learningPaths.filter(p => p.status === "completed").length;
    const inProgressPaths = learningPaths.filter(p => p.status === "in_progress").length;
    const totalXP = user?.xp ?? 0;

    return (
        <section className="py-12 pb-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--ember)]/10 border border-[var(--ember)]/20 mb-6">
                        <TrendingUp size={16} className="text-[var(--ember)]" />
                        <span className="text-sm text-[var(--forge-text-secondary)]">
                            Your Learning Journey
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        My{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ember)] via-[var(--gold)] to-[var(--ember-glow)]">
                            Progress
                        </span>
                    </h1>
                    <p className="text-lg text-[var(--forge-text-secondary)] max-w-2xl mx-auto">
                        Track your learning paths, earned XP, and achievements.
                    </p>
                </motion.div>

                {/* Stats Cards (only show if has paths) */}
                {totalPaths > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
                    >
                        <div className="bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl p-4 border border-[var(--forge-border-subtle)] text-center">
                            <div className="text-3xl font-bold text-[var(--forge-text-primary)]">
                                {totalPaths}
                            </div>
                            <div className="text-sm text-[var(--forge-text-muted)]">Total Paths</div>
                        </div>
                        <div className="bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl p-4 border border-[var(--forge-border-subtle)] text-center">
                            <div className="text-3xl font-bold text-[var(--ember)]">
                                {inProgressPaths}
                            </div>
                            <div className="text-sm text-[var(--forge-text-muted)]">In Progress</div>
                        </div>
                        <div className="bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl p-4 border border-[var(--forge-border-subtle)] text-center">
                            <div className="text-3xl font-bold text-[var(--forge-success)]">
                                {completedPaths}
                            </div>
                            <div className="text-sm text-[var(--forge-text-muted)]">Completed</div>
                        </div>
                        <div className="bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl p-4 border border-[var(--forge-border-subtle)] text-center">
                            <div className="text-3xl font-bold text-[var(--gold)]">
                                {totalXP.toLocaleString()}
                            </div>
                            <div className="text-sm text-[var(--forge-text-muted)]">Total XP</div>
                        </div>
                    </motion.div>
                )}

                {/* Learning Paths List */}
                {totalPaths > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <h2 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4">
                            Your Learning Paths
                        </h2>
                        {learningPaths.map((path, index) => (
                            <motion.div
                                key={path.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
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
                        transition={{ delay: 0.4 }}
                        className="mt-8 text-center"
                    >
                        <Link
                            href="/forge/community"
                            className="inline-flex items-center gap-2 text-[var(--forge-text-secondary)] hover:text-[var(--ember)] transition-colors"
                        >
                            Explore more community paths
                            <ChevronRight size={16} />
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
