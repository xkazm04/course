"use client";

import React, { useState } from "react";
import {
    Trophy,
    Medal,
    Crown,
    Users,
    GitPullRequest,
    Zap,
    Flame,
    Filter,
    ChevronDown,
    TrendingUp,
    Clock,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../layout";
import { mockLeaderboard } from "../lib/mockData";

// ============================================================================
// TYPES
// ============================================================================

type TimeRange = "week" | "month" | "all";
type LeaderboardType = "xp" | "contributions" | "streak";

// ============================================================================
// TOP 3 PODIUM
// ============================================================================

function TopThreePodium({ entries }: { entries: typeof mockLeaderboard }) {
    const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd for visual placement
    const topThree = entries.slice(0, 3);

    const rankConfig = {
        0: { height: "h-32", color: "from-amber-400 to-amber-600", icon: Crown, label: "1st" },
        1: { height: "h-24", color: "from-gray-300 to-gray-500", icon: Medal, label: "2nd" },
        2: { height: "h-20", color: "from-orange-400 to-orange-600", icon: Medal, label: "3rd" },
    };

    return (
        <div className="flex items-end justify-center gap-4 mb-8">
            {podiumOrder.map((rankIndex) => {
                const entry = topThree[rankIndex];
                if (!entry) return null;

                const config = rankConfig[rankIndex as keyof typeof rankConfig];
                const Icon = config.icon;

                return (
                    <div key={entry.userId} className="flex flex-col items-center">
                        {/* Avatar & Info */}
                        <div className="relative mb-3">
                            <img
                                src={entry.avatarUrl}
                                alt={entry.username}
                                className={cn(
                                    "rounded-full border-4",
                                    rankIndex === 0 ? "w-24 h-24 border-amber-400" : "w-20 h-20 border-gray-400"
                                )}
                            />
                            <div
                                className={cn(
                                    "absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br",
                                    config.color
                                )}
                            >
                                <Icon size={16} className="text-white" />
                            </div>
                        </div>
                        <div className="text-center mb-2">
                            <div className="font-semibold text-[var(--text-primary)]">
                                {entry.username}
                            </div>
                            <div className="text-sm text-[var(--text-muted)]">
                                Level {entry.level}
                            </div>
                        </div>

                        {/* Podium Base */}
                        <div
                            className={cn(
                                "w-24 rounded-t-lg flex items-center justify-center bg-gradient-to-b",
                                config.height,
                                config.color
                            )}
                        >
                            <div className="text-center text-white">
                                <div className="text-2xl font-bold">
                                    {entry.xp.toLocaleString()}
                                </div>
                                <div className="text-xs opacity-80">XP</div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// LEADERBOARD TABLE
// ============================================================================

function LeaderboardTable({ entries, currentUserId }: { entries: typeof mockLeaderboard; currentUserId: string }) {
    return (
        <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--border-subtle)]">
                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                Rank
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                Contributor
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                Level
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                PRs Merged
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                XP
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                        {entries.slice(3).map((entry) => {
                            const isCurrentUser = entry.userId === currentUserId;
                            return (
                                <tr
                                    key={entry.userId}
                                    className={cn(
                                        "hover:bg-[var(--surface-overlay)] transition-colors",
                                        isCurrentUser && "bg-[var(--accent-primary)]/5"
                                    )}
                                >
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                            entry.rank <= 10
                                                ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                                                : "bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                                        )}>
                                            {entry.rank}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={entry.avatarUrl}
                                                alt={entry.username}
                                                className="w-10 h-10 rounded-full"
                                            />
                                            <div>
                                                <div className="font-medium text-[var(--text-primary)]">
                                                    {entry.username}
                                                    {isCurrentUser && (
                                                        <span className="ml-2 text-xs text-[var(--accent-primary)]">
                                                            (You)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {entry.badges.slice(0, 3).map((badge, i) => (
                                                        <span key={i} className="text-xs">
                                                            {badge}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        <span className="px-2 py-1 rounded bg-[var(--surface-overlay)] text-sm font-medium text-[var(--text-primary)]">
                                            {entry.level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        <span className="text-sm text-[var(--text-secondary)]">
                                            {entry.mergedPRs}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                        <span className="font-semibold text-[var(--text-primary)]">
                                            {entry.xp.toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============================================================================
// YOUR RANK CARD
// ============================================================================

function YourRankCard({ user }: { user: any }) {
    // Find user in leaderboard or estimate rank
    const userRank = mockLeaderboard.findIndex((e) => e.userId === user.id);
    const rank = userRank >= 0 ? userRank + 1 : 42; // Default to 42 if not found

    return (
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl border border-orange-500/20 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="w-16 h-16 rounded-full border-4 border-orange-500/30"
                        />
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-xs font-bold">
                            #{rank}
                        </div>
                    </div>
                    <div>
                        <div className="font-semibold text-[var(--text-primary)]">
                            {user.displayName}
                        </div>
                        <div className="text-sm text-[var(--text-muted)]">
                            Level {user.level} • {user.xp.toLocaleString()} XP
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-[var(--text-muted)] mb-1">
                        {150} XP to next rank
                    </div>
                    <div className="flex items-center gap-1 text-emerald-500 text-sm">
                        <TrendingUp size={14} />
                        Up 3 positions this week
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function LeaderboardPage() {
    const { user } = useForge();
    const [timeRange, setTimeRange] = useState<TimeRange>("month");
    const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>("xp");

    const timeRanges: { value: TimeRange; label: string }[] = [
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "all", label: "All Time" },
    ];

    const leaderboardTypes: { value: LeaderboardType; label: string; icon: React.ElementType }[] = [
        { value: "xp", label: "XP Leaders", icon: Zap },
        { value: "contributions", label: "Top Contributors", icon: GitPullRequest },
        { value: "streak", label: "Longest Streaks", icon: Flame },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 mb-4">
                    <Trophy size={18} />
                    <span className="font-medium">Leaderboard</span>
                </div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                    Top Contributors
                </h1>
                <p className="text-[var(--text-secondary)]">
                    See who's leading the way in open-source contributions
                </p>
            </div>

            {/* Your Rank */}
            <YourRankCard user={user} />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-8">
                {/* Leaderboard Type */}
                <div className="flex gap-2">
                    {leaderboardTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.value}
                                onClick={() => setLeaderboardType(type.value)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    leaderboardType === type.value
                                        ? "bg-[var(--accent-primary)] text-white"
                                        : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]"
                                )}
                            >
                                <Icon size={16} />
                                {type.label}
                            </button>
                        );
                    })}
                </div>

                {/* Time Range */}
                <div className="flex gap-2">
                    {timeRanges.map((range) => (
                        <button
                            key={range.value}
                            onClick={() => setTimeRange(range.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                timeRange === range.value
                                    ? "bg-[var(--surface-overlay)] text-[var(--text-primary)]"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top 3 Podium */}
            <TopThreePodium entries={mockLeaderboard} />

            {/* Full Leaderboard */}
            <LeaderboardTable entries={mockLeaderboard} currentUserId={user.id} />

            {/* Stats Summary */}
            <div className="grid sm:grid-cols-3 gap-4 mt-8">
                <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Users size={20} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">2,847</div>
                    <div className="text-sm text-[var(--text-muted)]">Active Contributors</div>
                </div>
                <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <GitPullRequest size={20} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">1,234</div>
                    <div className="text-sm text-[var(--text-muted)]">PRs This Month</div>
                </div>
                <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Zap size={20} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">458K</div>
                    <div className="text-sm text-[var(--text-muted)]">Total XP Earned</div>
                </div>
            </div>
        </div>
    );
}
