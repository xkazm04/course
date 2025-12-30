"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GitMerge,
    Clock,
    TrendingUp,
    Award,
    GitPullRequest,
    History,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useContribution } from "../lib/useContribution";
import { ActiveContributionCard } from "./ActiveContributionCard";
import { ContributionHistory } from "./ContributionHistory";

type ViewMode = "active" | "history";

export const ContributionDashboard: React.FC = () => {
    const {
        activeContributions,
        completedContributions,
        stats,
        isLoading,
        updateStatus,
        updateNotes,
        markComplete,
        abandonContribution,
    } = useContribution();

    const [viewMode, setViewMode] = useState<ViewMode>("active");

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <GitPullRequest size={ICON_SIZES.xl} className="text-[var(--ember)]" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--forge-text-primary)]">
                        Your Contributions
                    </h2>
                    <p className="text-[var(--forge-text-muted)] mt-1">
                        Track your open-source journey
                    </p>
                </div>
                <div className="flex rounded-lg bg-[var(--forge-bg-elevated)] p-1">
                    <button
                        onClick={() => setViewMode("active")}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                            viewMode === "active"
                                ? "bg-[var(--ember)] text-white"
                                : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        )}
                    >
                        <GitPullRequest size={ICON_SIZES.sm} />
                        Active
                    </button>
                    <button
                        onClick={() => setViewMode("history")}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                            viewMode === "history"
                                ? "bg-[var(--ember)] text-white"
                                : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        )}
                    >
                        <History size={ICON_SIZES.sm} />
                        History
                    </button>
                </div>
            </div>

            {/* Stats overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<GitPullRequest size={ICON_SIZES.lg} />}
                    label="Total"
                    value={stats.totalContributions}
                    color="indigo"
                />
                <StatCard
                    icon={<GitMerge size={ICON_SIZES.lg} />}
                    label="Merged"
                    value={stats.mergedCount}
                    color="emerald"
                />
                <StatCard
                    icon={<Clock size={ICON_SIZES.lg} />}
                    label="Pending"
                    value={stats.pendingCount}
                    color="amber"
                />
                <StatCard
                    icon={<TrendingUp size={ICON_SIZES.lg} />}
                    label="Avg Time"
                    value={`${stats.avgTimeToMergeHours}h`}
                    color="purple"
                />
            </div>

            {/* Content based on view */}
            <AnimatePresence mode="wait">
                {viewMode === "active" ? (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {activeContributions.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {activeContributions.map(contribution => (
                                    <ActiveContributionCard
                                        key={contribution.id}
                                        contribution={contribution}
                                        onUpdateStatus={updateStatus}
                                        onUpdateNotes={updateNotes}
                                        onComplete={id => markComplete(id, "merged", [], "")}
                                        onAbandon={abandonContribution}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No active contributions"
                                description="Start contributing to open-source projects to see them here"
                            />
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <ContributionHistory contributions={completedContributions} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skills gained section */}
            {stats.skillsGained.length > 0 && (
                <section className={cn(
                    "rounded-xl border border-[var(--forge-border-default)]",
                    "bg-[var(--forge-bg-elevated)] p-4",
                    elevation.elevated
                )}>
                    <div className="flex items-center gap-2 mb-3">
                        <Award size={ICON_SIZES.md} className="text-[var(--forge-warning)]" />
                        <h3 className="font-semibold text-[var(--forge-text-primary)]">
                            Skills Gained
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {stats.skillsGained.map(({ skill, count }) => (
                            <span
                                key={skill}
                                className="px-3 py-1.5 rounded-lg text-sm bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]"
                            >
                                {skill}
                                {count > 1 && <span className="ml-1 opacity-60">×{count}</span>}
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

// Stat card component
interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: "indigo" | "emerald" | "amber" | "purple";
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
    const colorClasses = {
        indigo: "bg-[var(--ember)]/20 text-[var(--ember)]",
        emerald: "bg-[var(--forge-success)]/20 text-[var(--forge-success)]",
        amber: "bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]",
        purple: "bg-[var(--ember)]/20 text-[var(--ember)]",
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-elevated)] p-4",
                elevation.elevated
            )}
        >
            <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                colorClasses[color]
            )}>
                {icon}
            </div>
            <div className="text-2xl font-bold text-[var(--forge-text-primary)]">{value}</div>
            <div className="text-xs text-[var(--forge-text-muted)]">{label}</div>
        </motion.div>
    );
};

// Empty state component
interface EmptyStateProps {
    title: string;
    description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
    return (
        <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--forge-bg-elevated)] mb-4">
                <GitPullRequest size={ICON_SIZES.xl} className="text-[var(--forge-text-muted)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--forge-text-primary)]">{title}</h3>
            <p className="text-[var(--forge-text-muted)] mt-1">{description}</p>
        </div>
    );
};
