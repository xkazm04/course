"use client";

import { motion } from "framer-motion";
import { Map, ChevronRight, CheckCircle2, Play } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import Link from "next/link";

interface LearningPath {
    id: string;
    pathId: string;
    title: string;
    description: string | null;
    status: string;
    progressPercent: number;
    startedAt: string;
    completedAt?: string | null;
}

interface LearningPathsSectionProps {
    activePaths: LearningPath[];
    completedPaths: LearningPath[];
}

function PathCard({ path, isCompleted }: { path: LearningPath; isCompleted: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.01 }}
            className={cn(
                "group relative p-4 rounded-xl border transition-all duration-300",
                isCompleted
                    ? "bg-[var(--forge-success)]/5 border-[var(--forge-success)]/20"
                    : "bg-[var(--forge-bg-elevated)]/50 border-[var(--forge-border-subtle)] hover:border-[var(--ember)]/30"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    isCompleted
                        ? "bg-[var(--forge-success)]/10"
                        : "bg-[var(--ember)]/10"
                )}>
                    {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--forge-success)]" />
                    ) : (
                        <Play className="w-5 h-5 text-[var(--ember)]" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--forge-text-primary)] truncate">
                        {path.title}
                    </h4>
                    {path.description && (
                        <p className="text-xs text-[var(--forge-text-muted)] truncate">
                            {path.description}
                        </p>
                    )}

                    {/* Progress bar for active paths */}
                    {!isCompleted && (
                        <div className="mt-2">
                            <div className="flex justify-between text-[10px] text-[var(--forge-text-muted)] mb-1">
                                <span>Progress</span>
                                <span>{path.progressPercent}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[var(--forge-bg-bench)]">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${path.progressPercent}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    )}

                    {isCompleted && path.completedAt && (
                        <p className="text-xs text-[var(--forge-success)] mt-1">
                            Completed {new Date(path.completedAt).toLocaleDateString()}
                        </p>
                    )}
                </div>

                <ChevronRight className="w-4 h-4 text-[var(--forge-text-muted)] group-hover:text-[var(--ember)] transition-colors flex-shrink-0" />
            </div>
        </motion.div>
    );
}

export function LearningPathsSection({ activePaths, completedPaths }: LearningPathsSectionProps) {
    const hasActivePaths = activePaths.length > 0;
    const hasCompletedPaths = completedPaths.length > 0;

    if (!hasActivePaths && !hasCompletedPaths) {
        return null;
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-lg overflow-hidden"
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-[var(--ember)]/10">
                            <Map className="w-5 h-5 text-[var(--ember)]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--forge-text-primary)]">
                                Learning Paths
                            </h3>
                            <p className="text-xs text-[var(--forge-text-muted)]">
                                {activePaths.length} active · {completedPaths.length} completed
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/forge/paths"
                        className="text-sm text-[var(--ember)] hover:text-[var(--ember-glow)] transition-colors flex items-center gap-1"
                    >
                        View All
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Active Paths */}
                {hasActivePaths && (
                    <div className="space-y-3 mb-6">
                        <h4 className="text-sm font-medium text-[var(--forge-text-secondary)]">
                            In Progress
                        </h4>
                        {activePaths.map((path, index) => (
                            <motion.div
                                key={path.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.05 }}
                            >
                                <PathCard path={path} isCompleted={false} />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Completed Paths */}
                {hasCompletedPaths && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-[var(--forge-text-secondary)]">
                            Completed
                        </h4>
                        {completedPaths.slice(0, 3).map((path, index) => (
                            <motion.div
                                key={path.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 + index * 0.05 }}
                            >
                                <PathCard path={path} isCompleted={true} />
                            </motion.div>
                        ))}
                        {completedPaths.length > 3 && (
                            <p className="text-sm text-[var(--forge-text-muted)] text-center pt-2">
                                +{completedPaths.length - 3} more completed
                            </p>
                        )}
                    </div>
                )}
            </div>
        </motion.section>
    );
}
