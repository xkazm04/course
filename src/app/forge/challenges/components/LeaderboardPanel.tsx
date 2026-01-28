"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, Clock, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { TierBadge } from "./TierBadge";
import { getMockLeaderboard, type LeaderboardEntry, type RankTrend } from "../lib/tierSystem";

interface LeaderboardPanelProps {
    challengeId: string;
    maxEntries?: number;
    className?: string;
}

const TREND_CONFIG: Record<RankTrend, { icon: typeof TrendingUp; color: string; label: string }> = {
    up: { icon: TrendingUp, color: "text-[var(--forge-success)]", label: "Moved up" },
    down: { icon: TrendingDown, color: "text-[var(--forge-error)]", label: "Moved down" },
    stable: { icon: Minus, color: "text-[var(--forge-text-muted)]", label: "Stable" },
    new: { icon: Sparkles, color: "text-[var(--gold)]", label: "New entry" },
};

const RANK_STYLES: Record<number, string> = {
    1: "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
    2: "bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/30",
    3: "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30",
};

export function LeaderboardPanel({
    challengeId,
    maxEntries = 10,
    className = "",
}: LeaderboardPanelProps) {
    // Use mock data - in production, this would be fetched from API
    const entries = getMockLeaderboard(challengeId).slice(0, maxEntries);

    return (
        <div
            className={cn(
                "bg-[var(--forge-bg-elevated)] rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-bench)]">
                <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-[var(--gold)]" />
                    <h3 className="font-semibold text-sm text-[var(--forge-text-primary)]">Leaderboard</h3>
                    <span className="text-xs text-[var(--forge-text-muted)]">({entries.length})</span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-xs text-[var(--forge-text-muted)] uppercase tracking-wider border-b border-[var(--forge-border-subtle)]">
                            <th className="px-4 py-2 text-left w-12">#</th>
                            <th className="px-4 py-2 text-left">User</th>
                            <th className="px-4 py-2 text-center w-20">Tier</th>
                            <th className="px-4 py-2 text-right w-16">Score</th>
                            <th className="px-4 py-2 text-right w-16">Time</th>
                            <th className="px-4 py-2 text-center w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--forge-border-subtle)]">
                        {entries.map((entry, index) => (
                            <LeaderboardRow key={entry.userId} entry={entry} index={index} />
                        ))}
                    </tbody>
                </table>
            </div>

            {entries.length === 0 && (
                <div className="px-4 py-8 text-center">
                    <Trophy size={24} className="text-[var(--forge-text-muted)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--forge-text-muted)]">No submissions yet</p>
                    <p className="text-xs text-[var(--forge-text-muted)] mt-1">Be the first to complete this challenge!</p>
                </div>
            )}
        </div>
    );
}

interface LeaderboardRowProps {
    entry: LeaderboardEntry;
    index: number;
}

function LeaderboardRow({ entry, index }: LeaderboardRowProps) {
    const trendConfig = TREND_CONFIG[entry.trend];
    const TrendIcon = trendConfig.icon;
    const rankStyle = RANK_STYLES[entry.rank] || "";

    return (
        <motion.tr
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "hover:bg-[var(--forge-bg-bench)]/50 transition-colors",
                rankStyle && `border-l-2 ${rankStyle}`
            )}
        >
            {/* Rank */}
            <td className="px-4 py-3">
                <span
                    className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                        entry.rank === 1 && "bg-yellow-500/20 text-yellow-400",
                        entry.rank === 2 && "bg-slate-400/20 text-slate-400",
                        entry.rank === 3 && "bg-amber-600/20 text-amber-600",
                        entry.rank > 3 && "text-[var(--forge-text-muted)]"
                    )}
                >
                    {entry.rank}
                </span>
            </td>

            {/* User */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--forge-bg-bench)] flex items-center justify-center text-xs font-medium text-[var(--forge-text-secondary)]">
                        {entry.displayName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                        {entry.displayName}
                    </span>
                </div>
            </td>

            {/* Tier */}
            <td className="px-4 py-3 text-center">
                <TierBadge tier={entry.tier} size="sm" showLabel={false} />
            </td>

            {/* Score */}
            <td className="px-4 py-3 text-right">
                <span className="text-sm font-semibold text-[var(--forge-text-primary)]">
                    {entry.score}
                </span>
            </td>

            {/* Time */}
            <td className="px-4 py-3 text-right">
                <span className="text-xs text-[var(--forge-text-muted)] flex items-center justify-end gap-1">
                    <Clock size={10} />
                    {entry.completionTime}m
                </span>
            </td>

            {/* Trend */}
            <td className="px-4 py-3 text-center" title={trendConfig.label}>
                <TrendIcon
                    size={14}
                    className={trendConfig.color}
                />
            </td>
        </motion.tr>
    );
}
