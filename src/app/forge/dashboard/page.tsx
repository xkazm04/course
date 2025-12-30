"use client";

import React from "react";
import Link from "next/link";
import {
    Zap,
    Flame,
    Target,
    Trophy,
    GitPullRequest,
    Clock,
    ChevronRight,
    TrendingUp,
    Calendar,
    Star,
    ArrowUpRight,
    Play,
    CheckCircle,
    AlertCircle,
    BookOpen,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../layout";
import { mockChallenges, mockProjects, mockContributions } from "../lib/mockData";

// ============================================================================
// STATS CARDS
// ============================================================================

function StatsCard({
    icon: Icon,
    label,
    value,
    subtext,
    trend,
    iconColor,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subtext?: string;
    trend?: string;
    iconColor?: string;
}) {
    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconColor || "bg-[var(--forge-bg-elevated)]")}>
                    <Icon size={20} className={iconColor ? "text-white" : "text-[var(--forge-text-muted)]"} />
                </div>
                {trend && (
                    <span className="flex items-center gap-1 text-xs text-[var(--forge-success)]">
                        <TrendingUp size={12} />
                        {trend}
                    </span>
                )}
            </div>
            <div className="text-2xl font-bold text-[var(--forge-text-primary)] mb-1">
                {value}
            </div>
            <div className="text-sm text-[var(--forge-text-muted)]">{label}</div>
            {subtext && (
                <div className="text-xs text-[var(--forge-text-muted)] mt-1">{subtext}</div>
            )}
        </div>
    );
}

// ============================================================================
// XP PROGRESS
// ============================================================================

function XPProgress() {
    const { user } = useForge();
    const progress = (user.xp / (user.xp + user.xpToNextLevel)) * 100;

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--forge-text-primary)]">Level Progress</h3>
                <span className="text-sm text-[var(--forge-text-muted)]">Level {user.level}</span>
            </div>
            <div className="flex items-end justify-between mb-3">
                <div>
                    <div className="text-3xl font-bold text-[var(--forge-text-primary)]">
                        {user.xp.toLocaleString()}
                    </div>
                    <div className="text-sm text-[var(--forge-text-muted)]">Total XP</div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-semibold text-[var(--ember)]">
                        {user.xpToNextLevel.toLocaleString()}
                    </div>
                    <div className="text-xs text-[var(--forge-text-muted)]">to Level {user.level + 1}</div>
                </div>
            </div>
            <div className="w-full h-3 rounded-full bg-[var(--forge-bg-elevated)]">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

// ============================================================================
// STREAK WIDGET
// ============================================================================

function StreakWidget() {
    const { user } = useForge();
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const activity = [true, true, true, false, true, true, true]; // Mock week activity

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Flame size={20} className="text-[var(--ember)]" />
                    <h3 className="font-semibold text-[var(--forge-text-primary)]">Streak</h3>
                </div>
                <div className="text-2xl font-bold text-[var(--ember)]">
                    {user.currentStreak} days
                </div>
            </div>
            <div className="flex justify-between">
                {days.map((day, i) => (
                    <div key={i} className="text-center">
                        <div className="text-xs text-[var(--forge-text-muted)] mb-2">{day}</div>
                        <div
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                activity[i]
                                    ? "bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] text-white"
                                    : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
                            )}
                        >
                            {activity[i] ? <Flame size={14} /> : ""}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// ACTIVE CONTRIBUTIONS
// ============================================================================

function ActiveContributions() {
    const activeContribs = mockContributions.filter(
        (c) => c.status !== "merged" && c.status !== "closed"
    );

    const statusConfig = {
        claimed: { label: "Claimed", color: "text-[var(--forge-info)]", bg: "bg-[var(--forge-info)]/10" },
        in_progress: { label: "In Progress", color: "text-[var(--gold)]", bg: "bg-[var(--gold)]/10" },
        submitted: { label: "Submitted", color: "text-[var(--ember-glow)]", bg: "bg-[var(--ember-glow)]/10" },
        in_review: { label: "In Review", color: "text-[var(--forge-info)]", bg: "bg-[var(--forge-info)]/10" },
        changes_requested: { label: "Changes Requested", color: "text-[var(--forge-error)]", bg: "bg-[var(--forge-error)]/10" },
        approved: { label: "Approved", color: "text-[var(--forge-success)]", bg: "bg-[var(--forge-success)]/10" },
    };

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                <h3 className="font-semibold text-[var(--forge-text-primary)]">Active Work</h3>
                <Link
                    href="/forge/contributions"
                    className="text-sm text-[var(--ember)] hover:underline"
                >
                    View All
                </Link>
            </div>
            {activeContribs.length > 0 ? (
                <div className="divide-y divide-[var(--forge-border-subtle)]">
                    {activeContribs.map((contrib) => {
                        const status = statusConfig[contrib.status as keyof typeof statusConfig] || statusConfig.in_progress;
                        return (
                            <Link
                                key={contrib.id}
                                href={`/forge/workspace/${contrib.challengeId}`}
                                className="flex items-center gap-4 p-4 hover:bg-[var(--forge-bg-elevated)] transition-colors"
                            >
                                <div className="text-2xl">
                                    {contrib.challenge.type === "bug" ? "🐛" : "✨"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-[var(--forge-text-primary)] truncate">
                                        {contrib.challenge.title}
                                    </div>
                                    <div className="text-xs text-[var(--forge-text-muted)]">
                                        {contrib.projectName}
                                    </div>
                                </div>
                                <span className={cn("px-2 py-1 rounded text-xs font-medium", status.bg, status.color)}>
                                    {status.label}
                                </span>
                                <ChevronRight size={16} className="text-[var(--forge-text-muted)]" />
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="p-8 text-center">
                    <Target size={32} className="mx-auto text-[var(--forge-text-muted)] mb-3" />
                    <p className="text-[var(--forge-text-secondary)] mb-4">No active work</p>
                    <Link
                        href="/forge/challenges"
                        className="text-sm text-[var(--ember)] hover:underline"
                    >
                        Find a challenge
                    </Link>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// RECOMMENDED CHALLENGES
// ============================================================================

function RecommendedChallenges() {
    const recommended = mockChallenges.filter((c) => c.difficulty === "beginner").slice(0, 3);

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-2">
                    <Star size={18} className="text-[var(--ember)]" />
                    <h3 className="font-semibold text-[var(--forge-text-primary)]">Recommended</h3>
                </div>
                <Link
                    href="/forge/challenges"
                    className="text-sm text-[var(--ember)] hover:underline"
                >
                    See All
                </Link>
            </div>
            <div className="divide-y divide-[var(--forge-border-subtle)]">
                {recommended.map((challenge) => (
                    <Link
                        key={challenge.id}
                        href={`/forge/challenges/${challenge.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-[var(--forge-bg-elevated)] transition-colors"
                    >
                        <div className="text-xl">
                            {challenge.type === "bug" ? "🐛" : challenge.type === "feature" ? "✨" : "🔧"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-[var(--forge-text-primary)] truncate">
                                {challenge.title}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[var(--forge-text-muted)]">
                                <span>{challenge.projectName}</span>
                                <span>~{challenge.estimatedMinutes}min</span>
                            </div>
                        </div>
                        <span className="text-sm font-medium text-[var(--ember)]">
                            +{challenge.xpReward} XP
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// SKILLS OVERVIEW
// ============================================================================

function SkillsOverview() {
    const { user } = useForge();

    const levelColors = {
        beginner: "bg-[var(--forge-success)]",
        intermediate: "bg-[var(--gold)]",
        advanced: "bg-[var(--ember)]",
        expert: "bg-[var(--ember-glow)]",
    };

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                <h3 className="font-semibold text-[var(--forge-text-primary)]">Your Skills</h3>
                <Link
                    href="/forge/profile"
                    className="text-sm text-[var(--ember)] hover:underline"
                >
                    View All
                </Link>
            </div>
            <div className="p-4 space-y-4">
                {user.skills.slice(0, 4).map((skill) => (
                    <div key={skill.id}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                                {skill.name}
                            </span>
                            <span className="text-xs text-[var(--forge-text-muted)] capitalize">
                                {skill.level}
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--forge-bg-elevated)]">
                            <div
                                className={cn("h-full rounded-full", levelColors[skill.level])}
                                style={{ width: `${skill.proficiency}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// RECENT ACTIVITY
// ============================================================================

function RecentActivity() {
    const activities = [
        { type: "merged", title: "PR merged: Fix auth error handling", project: "OpenCRM", time: "2 hours ago", xp: 150 },
        { type: "submitted", title: "Submitted PR for review", project: "OpenTasks", time: "Yesterday" },
        { type: "started", title: "Started challenge: Add dark mode", project: "OpenForms", time: "2 days ago" },
        { type: "level_up", title: "Reached Level 7!", time: "3 days ago" },
    ];

    const activityIcons = {
        merged: { icon: CheckCircle, color: "text-[var(--forge-success)]", bg: "bg-[var(--forge-success)]/10" },
        submitted: { icon: GitPullRequest, color: "text-[var(--ember-glow)]", bg: "bg-[var(--ember-glow)]/10" },
        started: { icon: Play, color: "text-[var(--forge-info)]", bg: "bg-[var(--forge-info)]/10" },
        level_up: { icon: Trophy, color: "text-[var(--ember)]", bg: "bg-[var(--ember)]/10" },
    };

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm">
            <div className="p-4 border-b border-[var(--forge-border-subtle)]">
                <h3 className="font-semibold text-[var(--forge-text-primary)]">Recent Activity</h3>
            </div>
            <div className="divide-y divide-[var(--forge-border-subtle)]">
                {activities.map((activity, i) => {
                    const config = activityIcons[activity.type as keyof typeof activityIcons];
                    const Icon = config.icon;
                    return (
                        <div key={i} className="flex items-start gap-3 p-4">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                                <Icon size={16} className={config.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-[var(--forge-text-primary)]">
                                    {activity.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--forge-text-muted)]">
                                    {activity.project && <span>{activity.project}</span>}
                                    <span>{activity.time}</span>
                                </div>
                            </div>
                            {activity.xp && (
                                <span className="text-sm font-medium text-[var(--ember)]">
                                    +{activity.xp} XP
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function DashboardPage() {
    const { user } = useForge();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--forge-text-primary)] mb-1">
                    Welcome back, {user.displayName}!
                </h1>
                <p className="text-[var(--forge-text-secondary)]">
                    Here's your progress and what to work on next.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard
                    icon={Zap}
                    label="Total XP"
                    value={user.xp.toLocaleString()}
                    trend="+12%"
                    iconColor="bg-[var(--gold)]"
                />
                <StatsCard
                    icon={GitPullRequest}
                    label="PRs Merged"
                    value={user.mergedPRCount}
                    subtext="this month"
                    iconColor="bg-[var(--forge-success)]"
                />
                <StatsCard
                    icon={Target}
                    label="Challenges"
                    value={user.contributionCount}
                    subtext="completed"
                    iconColor="bg-[var(--forge-info)]"
                />
                <StatsCard
                    icon={Flame}
                    label="Current Streak"
                    value={`${user.currentStreak} days`}
                    iconColor="bg-[var(--ember)]"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <XPProgress />
                    <ActiveContributions />
                    <RecommendedChallenges />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <StreakWidget />
                    <SkillsOverview />
                    <RecentActivity />
                </div>
            </div>
        </div>
    );
}
