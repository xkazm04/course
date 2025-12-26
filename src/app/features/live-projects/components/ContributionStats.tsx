"use client";

/**
 * Contribution Stats Component
 *
 * Displays user contribution statistics, badges, certificates,
 * and the community leaderboard.
 */

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
    Trophy,
    GitMerge,
    FolderGit2,
    FileCode,
    Flame,
    Award,
    Medal,
    Briefcase,
    Link2,
    Share2,
    Crown,
    Star,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type {
    UserContributionStats,
    LeaderboardEntry,
    ContributionBadge,
    ContributionCertificate,
} from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface ContributionStatsProps {
    stats: UserContributionStats;
    leaderboard: LeaderboardEntry[];
    onLoadLeaderboard: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ContributionStats = ({
    stats,
    leaderboard,
    onLoadLeaderboard,
}: ContributionStatsProps) => {
    const prefersReducedMotion = useReducedMotion();
    const [activeTab, setActiveTab] = useState<"stats" | "badges" | "leaderboard">("stats");

    return (
        <div className="space-y-6">
            {/* Header */}
            <PrismaticCard className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <Trophy size={ICON_SIZES.xl} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                            Your Contribution Journey
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Track your open-source impact
                        </p>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <QuickStatCard
                        icon={GitMerge}
                        label="Merged PRs"
                        value={stats.mergedPRs}
                        color="text-purple-500"
                        bgColor="bg-purple-100 dark:bg-purple-900/30"
                    />
                    <QuickStatCard
                        icon={FolderGit2}
                        label="Repositories"
                        value={stats.repositoriesCount}
                        color="text-indigo-500"
                        bgColor="bg-indigo-100 dark:bg-indigo-900/30"
                    />
                    <QuickStatCard
                        icon={FileCode}
                        label="Lines Added"
                        value={stats.totalAdditions.toLocaleString()}
                        color="text-emerald-500"
                        bgColor="bg-emerald-100 dark:bg-emerald-900/30"
                    />
                    <QuickStatCard
                        icon={Flame}
                        label="Day Streak"
                        value={stats.currentStreak}
                        color="text-orange-500"
                        bgColor="bg-orange-100 dark:bg-orange-900/30"
                    />
                </div>
            </PrismaticCard>

            {/* Tabs */}
            <div className="flex gap-2">
                <TabButton
                    isActive={activeTab === "stats"}
                    onClick={() => setActiveTab("stats")}
                    label="Statistics"
                    testId="stats-tab-btn"
                />
                <TabButton
                    isActive={activeTab === "badges"}
                    onClick={() => setActiveTab("badges")}
                    label={`Badges (${stats.badges.length})`}
                    testId="badges-tab-btn"
                />
                <TabButton
                    isActive={activeTab === "leaderboard"}
                    onClick={() => {
                        setActiveTab("leaderboard");
                        onLoadLeaderboard();
                    }}
                    label="Leaderboard"
                    testId="leaderboard-tab-btn"
                />
            </div>

            {/* Tab Content */}
            {activeTab === "stats" && <StatsTab stats={stats} />}
            {activeTab === "badges" && <BadgesTab badges={stats.badges} certificates={stats.certificates} />}
            {activeTab === "leaderboard" && <LeaderboardTab leaderboard={leaderboard} userId={stats.userId} />}
        </div>
    );
};

// ============================================================================
// QUICK STAT CARD
// ============================================================================

interface QuickStatCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    bgColor: string;
}

const QuickStatCard = ({ icon: Icon, label, value, color, bgColor }: QuickStatCardProps) => {
    return (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bgColor)}>
                <Icon size={ICON_SIZES.md} className={color} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
        </div>
    );
};

// ============================================================================
// TAB BUTTON
// ============================================================================

interface TabButtonProps {
    isActive: boolean;
    onClick: () => void;
    label: string;
    testId: string;
}

const TabButton = ({ isActive, onClick, label, testId }: TabButtonProps) => {
    return (
        <button
            onClick={onClick}
            data-testid={testId}
            className={cn(
                "px-4 py-2 rounded-xl font-medium transition-all",
                isActive
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
            )}
        >
            {label}
        </button>
    );
};

// ============================================================================
// STATS TAB
// ============================================================================

interface StatsTabProps {
    stats: UserContributionStats;
}

const StatsTab = ({ stats }: StatsTabProps) => {
    const prefersReducedMotion = useReducedMotion();

    return (
        <div className="space-y-6">
            {/* Detailed Stats */}
            <PrismaticCard className="p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                    Contribution Details
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                    <DetailStatRow label="Total Contributions" value={stats.totalContributions} />
                    <DetailStatRow label="Merged Pull Requests" value={stats.mergedPRs} />
                    <DetailStatRow label="Repositories Contributed" value={stats.repositoriesCount} />
                    <DetailStatRow label="Lines Added" value={stats.totalAdditions.toLocaleString()} />
                    <DetailStatRow label="Lines Removed" value={stats.totalDeletions.toLocaleString()} />
                    <DetailStatRow label="Partner Contributions" value={stats.partnerContributions} />
                    <DetailStatRow label="Referrals Received" value={stats.referralsReceived} />
                    <DetailStatRow label="Longest Streak" value={`${stats.longestStreak} days`} />
                </div>
            </PrismaticCard>

            {/* Skills Used */}
            <PrismaticCard className="p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                    Skills Demonstrated
                </h2>

                <div className="flex flex-wrap gap-2">
                    {stats.skillsUsed.length > 0 ? (
                        stats.skillsUsed.map((skill) => (
                            <span
                                key={skill}
                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium rounded-lg border border-indigo-200 dark:border-indigo-800"
                            >
                                {skill}
                            </span>
                        ))
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400">
                            Complete contributions to demonstrate skills
                        </p>
                    )}
                </div>
            </PrismaticCard>

            {/* Streak Progress */}
            <PrismaticCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
                        <Flame size={ICON_SIZES.lg} className="text-orange-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            Contribution Streak
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Keep contributing daily to build your streak
                        </p>
                    </div>
                </div>

                <div className="flex items-end gap-4">
                    <div>
                        <div className="text-4xl font-black text-orange-500">{stats.currentStreak}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Current Streak</div>
                    </div>
                    <div className="flex-1">
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                                initial={prefersReducedMotion ? false : { width: 0 }}
                                animate={{ width: `${Math.min((stats.currentStreak / stats.longestStreak) * 100, 100)}%` }}
                            />
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
                            Best: {stats.longestStreak} days
                        </div>
                    </div>
                </div>
            </PrismaticCard>
        </div>
    );
};

interface DetailStatRowProps {
    label: string;
    value: string | number;
}

const DetailStatRow = ({ label, value }: DetailStatRowProps) => {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-600 dark:text-slate-400">{label}</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{value}</span>
        </div>
    );
};

// ============================================================================
// BADGES TAB
// ============================================================================

interface BadgesTabProps {
    badges: ContributionBadge[];
    certificates: ContributionCertificate[];
}

const BadgesTab = ({ badges, certificates }: BadgesTabProps) => {
    return (
        <div className="space-y-6">
            {/* Badges */}
            <PrismaticCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Award size={ICON_SIZES.md} className="text-amber-500" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Badges ({badges.length})
                    </h2>
                </div>

                {badges.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {badges.map((badge) => (
                            <BadgeCard key={badge.id} badge={badge} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Medal size={ICON_SIZES.xl} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">
                            Complete contributions to earn badges
                        </p>
                    </div>
                )}
            </PrismaticCard>

            {/* Certificates */}
            <PrismaticCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Briefcase size={ICON_SIZES.md} className="text-indigo-500" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Certificates ({certificates.length})
                    </h2>
                </div>

                {certificates.length > 0 ? (
                    <div className="space-y-4">
                        {certificates.map((cert) => (
                            <CertificateCard key={cert.id} certificate={cert} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Briefcase size={ICON_SIZES.xl} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">
                            Earn certificates by making consistent contributions
                        </p>
                    </div>
                )}
            </PrismaticCard>
        </div>
    );
};

interface BadgeCardProps {
    badge: ContributionBadge;
}

const BadgeCard = ({ badge }: BadgeCardProps) => {
    const levelColors = {
        bronze: "from-amber-600 to-orange-700",
        silver: "from-slate-400 to-slate-500",
        gold: "from-amber-400 to-yellow-500",
        platinum: "from-cyan-400 to-indigo-500",
    };

    return (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start gap-4">
            <div
                className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br",
                    levelColors[badge.level]
                )}
            >
                <Award size={ICON_SIZES.lg} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{badge.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{badge.description}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="capitalize">{badge.level}</span>
                    <span>•</span>
                    <span>{new Date(badge.earnedAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};

interface CertificateCardProps {
    certificate: ContributionCertificate;
}

const CertificateCard = ({ certificate }: CertificateCardProps) => {
    return (
        <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{certificate.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{certificate.description}</p>
                </div>
                {certificate.shareable && (
                    <button
                        data-testid={`share-cert-${certificate.id}-btn`}
                        className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                        <Share2 size={ICON_SIZES.sm} />
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
                {certificate.skills.map((skill) => (
                    <span
                        key={skill}
                        className="px-2 py-1 bg-white/50 dark:bg-slate-800/50 text-indigo-700 dark:text-indigo-400 text-xs font-medium rounded-full"
                    >
                        {skill}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    Issued by <span className="font-medium">{certificate.issuer}</span>
                </div>
                <a
                    href={certificate.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`verify-cert-${certificate.id}-link`}
                    className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    <Link2 size={ICON_SIZES.sm} />
                    Verify
                </a>
            </div>
        </div>
    );
};

// ============================================================================
// LEADERBOARD TAB
// ============================================================================

interface LeaderboardTabProps {
    leaderboard: LeaderboardEntry[];
    userId: string;
}

const LeaderboardTab = ({ leaderboard, userId }: LeaderboardTabProps) => {
    return (
        <PrismaticCard className="p-6">
            <div className="flex items-center gap-2 mb-6">
                <Crown size={ICON_SIZES.md} className="text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Top Contributors</h2>
            </div>

            {leaderboard.length > 0 ? (
                <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                        <LeaderboardRow
                            key={entry.userId}
                            entry={entry}
                            isCurrentUser={entry.userId === userId}
                            position={index}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Trophy size={ICON_SIZES.xl} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">
                        Leaderboard data not available
                    </p>
                </div>
            )}
        </PrismaticCard>
    );
};

interface LeaderboardRowProps {
    entry: LeaderboardEntry;
    isCurrentUser: boolean;
    position: number;
}

const LeaderboardRow = ({ entry, isCurrentUser, position }: LeaderboardRowProps) => {
    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown size={ICON_SIZES.md} className="text-amber-500" />;
        if (rank === 2) return <Medal size={ICON_SIZES.md} className="text-slate-400" />;
        if (rank === 3) return <Medal size={ICON_SIZES.md} className="text-amber-600" />;
        return null;
    };

    return (
        <div
            className={cn(
                "p-4 rounded-xl flex items-center gap-4",
                isCurrentUser
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-300 dark:border-indigo-700"
                    : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
            )}
        >
            {/* Rank */}
            <div className="w-10 text-center">
                {getRankIcon(entry.rank) || (
                    <span className="text-lg font-bold text-slate-400">#{entry.rank}</span>
                )}
            </div>

            {/* Avatar */}
            <img
                src={entry.avatarUrl}
                alt={entry.username}
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "font-semibold truncate",
                            isCurrentUser
                                ? "text-indigo-700 dark:text-indigo-400"
                                : "text-slate-900 dark:text-slate-100"
                        )}
                    >
                        {entry.username}
                    </span>
                    {isCurrentUser && (
                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded-full">
                            You
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                    {entry.topSkills.slice(0, 2).map((skill) => (
                        <span
                            key={skill}
                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="text-right">
                <div className="flex items-center gap-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                    <Star size={ICON_SIZES.sm} className="text-amber-500" />
                    {entry.points.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                    {entry.mergedPRs} PRs merged
                </div>
            </div>
        </div>
    );
};

export default ContributionStats;
