"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
    Activity,
    GitPullRequest,
    MessageSquare,
    Award,
    BookCheck,
    Code2,
    Users,
    Briefcase,
} from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { ExternalAchievementSignal, SignalCategory } from "../lib/types";

interface SignalTimelineProps {
    signals: ExternalAchievementSignal[];
    maxSignals?: number;
    className?: string;
}

const CATEGORY_CONFIG: Record<
    SignalCategory,
    { icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; color: string; label: string }
> = {
    contribution: { icon: GitPullRequest, color: "var(--color-emerald)", label: "Contribution" },
    reputation: { icon: Award, color: "var(--color-amber)", label: "Reputation" },
    completion: { icon: BookCheck, color: "var(--color-cyan)", label: "Completion" },
    problem_solving: { icon: Code2, color: "var(--color-purple)", label: "Problem Solving" },
    community: { icon: Users, color: "var(--color-indigo)", label: "Community" },
    skill_validation: { icon: Award, color: "var(--color-orange)", label: "Skill Validation" },
    project_work: { icon: Briefcase, color: "var(--color-emerald)", label: "Project Work" },
};

/**
 * Signal Timeline - Displays recent achievement signals from connected platforms
 */
export function SignalTimeline({ signals, maxSignals = 10, className }: SignalTimelineProps) {
    const displaySignals = useMemo(() => {
        // Sort by earned date, most recent first
        return [...signals]
            .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
            .slice(0, maxSignals);
    }, [signals, maxSignals]);

    if (displaySignals.length === 0) {
        return null;
    }

    return (
        <PrismaticCard glowColor="indigo" className={className}>
            <div className="p-6" data-testid="signal-timeline">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background: `linear-gradient(135deg, var(--color-indigo), var(--color-purple))`,
                            }}
                        >
                            <Activity size={ICON_SIZES.md} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--text-primary)]">
                                Activity Signals
                            </h3>
                            <p className="text-xs text-[var(--text-muted-high)]">
                                {signals.length} signals from your platforms
                            </p>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--border-subtle)]" />

                    {/* Signals */}
                    <div className="space-y-4">
                        {displaySignals.map((signal, i) => {
                            const config = CATEGORY_CONFIG[signal.category];
                            const Icon = config.icon;

                            return (
                                <motion.div
                                    key={signal.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="relative flex items-start gap-4 pl-2"
                                    data-testid={`signal-item-${signal.id}`}
                                >
                                    {/* Icon */}
                                    <div
                                        className="relative z-10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                        style={{
                                            backgroundColor: `color-mix(in srgb, ${config.color} 20%, transparent)`,
                                        }}
                                    >
                                        <Icon
                                            size={ICON_SIZES.sm}
                                            style={{ color: config.color }}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pb-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h4 className="font-medium text-[var(--text-primary)] truncate">
                                                    {signal.title}
                                                </h4>
                                                <p className="text-sm text-[var(--text-muted-high)] line-clamp-2">
                                                    {signal.description}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <span
                                                    className="text-sm font-bold"
                                                    style={{ color: config.color }}
                                                >
                                                    +{signal.normalizedScore}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-inset)] text-[var(--text-muted)]">
                                                {signal.platform}
                                            </span>
                                            <span
                                                className="text-xs px-2 py-0.5 rounded-full"
                                                style={{
                                                    backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`,
                                                    color: config.color,
                                                }}
                                            >
                                                {config.label}
                                            </span>
                                            {signal.skills.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    {signal.skills.slice(0, 2).map((skill) => (
                                                        <span
                                                            key={skill}
                                                            className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-inset)] text-[var(--text-muted)]"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {signal.skills.length > 2 && (
                                                        <span className="text-xs text-[var(--text-muted)]">
                                                            +{signal.skills.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Show More */}
                {signals.length > maxSignals && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                        <button
                            className="w-full text-center text-sm text-[var(--color-indigo)] hover:underline"
                            data-testid="signal-timeline-show-more-btn"
                        >
                            View all {signals.length} signals
                        </button>
                    </div>
                )}
            </div>
        </PrismaticCard>
    );
}
