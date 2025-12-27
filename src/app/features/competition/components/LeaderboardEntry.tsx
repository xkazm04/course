"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Star, Crown } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { LeaderboardEntry as LeaderboardEntryType } from "../lib/types";
import { TierIcon } from "./TierBadge";

interface LeaderboardEntryProps {
    entry: LeaderboardEntryType;
    isCurrentUser?: boolean;
    showMetrics?: boolean;
    onClick?: (entry: LeaderboardEntryType) => void;
}

export const LeaderboardEntry: React.FC<LeaderboardEntryProps> = ({
    entry,
    isCurrentUser = false,
    showMetrics = false,
    onClick,
}) => {
    const isTopThree = entry.rank <= 3;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ backgroundColor: "var(--surface-elevated)" }}
            onClick={() => onClick?.(entry)}
            className={cn(
                "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors",
                isCurrentUser && "bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30",
                !isCurrentUser && "hover:bg-[var(--surface-overlay)]"
            )}
        >
            {/* Rank */}
            <div className="w-10 flex-shrink-0 text-center">
                {isTopThree ? (
                    <RankMedal rank={entry.rank} />
                ) : (
                    <span className="text-lg font-bold text-[var(--text-muted)]">
                        {entry.rank}
                    </span>
                )}
            </div>

            {/* Trend indicator */}
            <div className="w-6 flex-shrink-0">
                <TrendIndicator trend={entry.trend} previousRank={entry.previousRank} />
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0 flex items-center gap-3">
                {/* Avatar */}
                {entry.avatarUrl ? (
                    <img
                        src={entry.avatarUrl}
                        alt={entry.displayName}
                        className="w-8 h-8 rounded-full"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-overlay)] flex items-center justify-center text-sm font-medium text-[var(--text-muted)]">
                        {entry.displayName.charAt(0).toUpperCase()}
                    </div>
                )}

                {/* Name and tier */}
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                "font-medium truncate",
                                isCurrentUser ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
                            )}
                        >
                            @{entry.displayName}
                        </span>
                        {isCurrentUser && (
                            <Star size={ICON_SIZES.xs} className="text-amber-400 flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <TierIcon tier={entry.tier} size={12} />
                        <span className="text-xs text-[var(--text-muted)] capitalize">
                            {entry.tier}
                        </span>
                    </div>
                </div>
            </div>

            {/* Score */}
            <div className="text-right">
                <span className="text-lg font-bold text-[var(--text-primary)]">
                    {entry.score.toFixed(1)}
                </span>
                <span className="text-xs text-[var(--text-muted)] block">pts</span>
            </div>

            {/* Metrics (optional) */}
            {showMetrics && (
                <div className="hidden md:flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <div className="text-center">
                        <span className="font-medium text-[var(--text-secondary)]">
                            {entry.metrics.responseTimeP50.toFixed(0)}ms
                        </span>
                        <span className="block">P50</span>
                    </div>
                    <div className="text-center">
                        <span className="font-medium text-[var(--text-secondary)]">
                            {entry.metrics.uptime.toFixed(1)}%
                        </span>
                        <span className="block">Uptime</span>
                    </div>
                    <div className="text-center">
                        <span className="font-medium text-[var(--text-secondary)]">
                            {entry.metrics.throughput.toFixed(0)}
                        </span>
                        <span className="block">RPS</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// Rank medal for top 3
interface RankMedalProps {
    rank: number;
}

const RankMedal: React.FC<RankMedalProps> = ({ rank }) => {
    const config = {
        1: { emoji: "🥇", color: "text-amber-400" },
        2: { emoji: "🥈", color: "text-slate-300" },
        3: { emoji: "🥉", color: "text-amber-600" },
    }[rank as 1 | 2 | 3];

    if (!config) return null;

    return (
        <motion.span
            className="text-2xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
        >
            {config.emoji}
        </motion.span>
    );
};

// Trend indicator
interface TrendIndicatorProps {
    trend: LeaderboardEntryType["trend"];
    previousRank?: number;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ trend, previousRank }) => {
    if (trend === "new") {
        return (
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                NEW
            </span>
        );
    }

    if (trend === "up") {
        return (
            <div className="flex items-center text-emerald-400">
                <TrendingUp size={ICON_SIZES.sm} />
            </div>
        );
    }

    if (trend === "down") {
        return (
            <div className="flex items-center text-red-400">
                <TrendingDown size={ICON_SIZES.sm} />
            </div>
        );
    }

    return (
        <div className="flex items-center text-[var(--text-muted)]">
            <Minus size={ICON_SIZES.sm} />
        </div>
    );
};

// Compact entry for mini leaderboards
interface CompactLeaderboardEntryProps {
    entry: LeaderboardEntryType;
    isCurrentUser?: boolean;
}

export const CompactLeaderboardEntry: React.FC<CompactLeaderboardEntryProps> = ({
    entry,
    isCurrentUser = false,
}) => {
    return (
        <div
            className={cn(
                "flex items-center gap-2 py-1.5",
                isCurrentUser && "font-medium"
            )}
        >
            <span className="w-6 text-right text-sm text-[var(--text-muted)]">
                {entry.rank <= 3 ? (
                    { 1: "🥇", 2: "🥈", 3: "🥉" }[entry.rank as 1 | 2 | 3]
                ) : (
                    entry.rank
                )}
            </span>
            <span
                className={cn(
                    "flex-1 truncate text-sm",
                    isCurrentUser ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"
                )}
            >
                @{entry.displayName}
            </span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
                {entry.score.toFixed(1)}
            </span>
        </div>
    );
};
