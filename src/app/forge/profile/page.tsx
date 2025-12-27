"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    Github,
    MapPin,
    Calendar,
    ExternalLink,
    Settings,
    Zap,
    GitPullRequest,
    Target,
    Flame,
    Trophy,
    Star,
    TrendingUp,
    CheckCircle,
    Clock,
    BookOpen,
    Award,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../layout";
import { mockContributions, mockProjects } from "../lib/mockData";

// ============================================================================
// TABS
// ============================================================================

type TabId = "overview" | "contributions" | "skills" | "achievements";

// ============================================================================
// CONTRIBUTION HISTORY
// ============================================================================

function ContributionHistory() {
    const completedContribs = mockContributions.filter((c) => c.status === "merged");

    return (
        <div className="space-y-4">
            {completedContribs.length > 0 ? (
                completedContribs.map((contrib) => (
                    <div
                        key={contrib.id}
                        className="flex items-center gap-4 p-4 bg-[var(--surface-overlay)] rounded-xl border border-[var(--border-default)]"
                    >
                        <div className="text-2xl">
                            {contrib.challenge.type === "bug" ? "🐛" : "✨"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-[var(--text-primary)]">
                                {contrib.challenge.title}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                <span>{contrib.projectName}</span>
                                <span>Merged {new Date(contrib.mergedAt!).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-amber-500">
                                +{contrib.xpEarned} XP
                            </span>
                            <a
                                href={contrib.prUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg hover:bg-[var(--surface-base)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-12">
                    <GitPullRequest size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                        No contributions yet
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-4">
                        Start working on challenges to build your contribution history.
                    </p>
                    <Link
                        href="/forge/challenges"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:opacity-90"
                    >
                        Find Challenges
                    </Link>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// SKILLS TAB
// ============================================================================

function SkillsTab() {
    const { user } = useForge();

    const levelColors = {
        beginner: { bar: "bg-emerald-500", text: "text-emerald-500", bg: "bg-emerald-500/10" },
        intermediate: { bar: "bg-amber-500", text: "text-amber-500", bg: "bg-amber-500/10" },
        advanced: { bar: "bg-orange-500", text: "text-orange-500", bg: "bg-orange-500/10" },
        expert: { bar: "bg-rose-500", text: "text-rose-500", bg: "bg-rose-500/10" },
    };

    return (
        <div className="grid sm:grid-cols-2 gap-4">
            {user.skills.map((skill) => {
                const colors = levelColors[skill.level];
                return (
                    <div
                        key={skill.id}
                        className="bg-[var(--surface-overlay)] rounded-xl border border-[var(--border-default)] p-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-[var(--text-primary)]">
                                {skill.name}
                            </h4>
                            <span className={cn("px-2 py-0.5 rounded text-xs font-medium capitalize", colors.bg, colors.text)}>
                                {skill.level}
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--surface-base)] mb-2">
                            <div
                                className={cn("h-full rounded-full transition-all", colors.bar)}
                                style={{ width: `${skill.proficiency}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                            <span>{skill.evidenceCount} demonstrations</span>
                            {skill.lastDemonstratedAt && (
                                <span>Last: {new Date(skill.lastDemonstratedAt).toLocaleDateString()}</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// ACHIEVEMENTS TAB
// ============================================================================

function AchievementsTab() {
    const achievements = [
        { id: "1", name: "First Steps", description: "Complete your first challenge", icon: "🎯", earned: true, earnedAt: "2024-01-15" },
        { id: "2", name: "Bug Squasher", description: "Fix 10 bugs", icon: "🐛", earned: true, earnedAt: "2024-02-20" },
        { id: "3", name: "Feature Creator", description: "Implement 5 features", icon: "✨", earned: true, earnedAt: "2024-03-10" },
        { id: "4", name: "Code Reviewer", description: "Get 10 PRs approved", icon: "👀", earned: true, earnedAt: "2024-04-05" },
        { id: "5", name: "Streak Master", description: "Maintain a 30-day streak", icon: "🔥", earned: false, progress: 18, total: 30 },
        { id: "6", name: "Project Pioneer", description: "Contribute to 5 projects", icon: "🚀", earned: false, progress: 3, total: 5 },
        { id: "7", name: "XP Legend", description: "Earn 10,000 XP", icon: "⚡", earned: false, progress: 4850, total: 10000 },
        { id: "8", name: "Community Hero", description: "Help 50 other learners", icon: "🦸", earned: false, progress: 12, total: 50 },
    ];

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
                <div
                    key={achievement.id}
                    className={cn(
                        "rounded-xl border p-4",
                        achievement.earned
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-[var(--surface-overlay)] border-[var(--border-default)]"
                    )}
                >
                    <div className="flex items-start gap-3">
                        <div className={cn(
                            "text-3xl",
                            !achievement.earned && "grayscale opacity-50"
                        )}>
                            {achievement.icon}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium text-[var(--text-primary)]">
                                    {achievement.name}
                                </h4>
                                {achievement.earned && (
                                    <CheckCircle size={14} className="text-amber-500" />
                                )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mb-2">
                                {achievement.description}
                            </p>
                            {achievement.earned ? (
                                <span className="text-xs text-amber-500">
                                    Earned {new Date(achievement.earnedAt!).toLocaleDateString()}
                                </span>
                            ) : (
                                <div>
                                    <div className="w-full h-1.5 rounded-full bg-[var(--surface-base)] mb-1">
                                        <div
                                            className="h-full rounded-full bg-[var(--accent-primary)]"
                                            style={{ width: `${(achievement.progress! / achievement.total!) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-[var(--text-muted)]">
                                        {achievement.progress} / {achievement.total}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ProfilePage() {
    const { user } = useForge();
    const [activeTab, setActiveTab] = useState<TabId>("overview");

    const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
        { id: "overview", label: "Overview", icon: BookOpen },
        { id: "contributions", label: "Contributions", icon: GitPullRequest },
        { id: "skills", label: "Skills", icon: Target },
        { id: "achievements", label: "Achievements", icon: Award },
    ];

    const projectContributions = mockProjects.slice(0, 3).map((p) => ({
        project: p,
        count: Math.floor(Math.random() * 20) + 5,
    }));

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Profile Header */}
            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6 mb-8">
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar & Basic Info */}
                    <div className="flex items-start gap-4">
                        <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="w-24 h-24 rounded-2xl"
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                                {user.displayName}
                            </h1>
                            <p className="text-[var(--text-muted)] mb-3">@{user.username}</p>
                            <div className="flex items-center gap-4 text-sm">
                                {user.githubUsername && (
                                    <a
                                        href={`https://github.com/${user.githubUsername}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    >
                                        <Github size={16} />
                                        {user.githubUsername}
                                    </a>
                                )}
                                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                                    <Calendar size={14} />
                                    Joined {new Date(user.joinedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:ml-auto">
                        <div className="text-center p-3 bg-[var(--surface-overlay)] rounded-lg">
                            <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                                <Zap size={16} />
                            </div>
                            <div className="text-xl font-bold text-[var(--text-primary)]">
                                {user.xp.toLocaleString()}
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">Total XP</div>
                        </div>
                        <div className="text-center p-3 bg-[var(--surface-overlay)] rounded-lg">
                            <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                                <GitPullRequest size={16} />
                            </div>
                            <div className="text-xl font-bold text-[var(--text-primary)]">
                                {user.mergedPRCount}
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">PRs Merged</div>
                        </div>
                        <div className="text-center p-3 bg-[var(--surface-overlay)] rounded-lg">
                            <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                                <Flame size={16} />
                            </div>
                            <div className="text-xl font-bold text-[var(--text-primary)]">
                                {user.currentStreak}
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">Day Streak</div>
                        </div>
                        <div className="text-center p-3 bg-[var(--surface-overlay)] rounded-lg">
                            <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                                <Star size={16} />
                            </div>
                            <div className="text-xl font-bold text-[var(--text-primary)]">
                                {user.level}
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">Level</div>
                        </div>
                    </div>
                </div>

                {/* Level Progress */}
                <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-[var(--text-muted)]">Level {user.level}</span>
                        <span className="text-[var(--text-muted)]">
                            {user.xpToNextLevel.toLocaleString()} XP to Level {user.level + 1}
                        </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--surface-overlay)]">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                            style={{ width: `${(user.xp / (user.xp + user.xpToNextLevel)) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[var(--border-default)] mb-8">
                <div className="flex gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                    activeTab === tab.id
                                        ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                                        : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                                Recent Activity
                            </h3>
                            <ContributionHistory />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                                Top Skills
                            </h3>
                            <div className="space-y-3">
                                {user.skills.slice(0, 5).map((skill) => (
                                    <div key={skill.id}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-[var(--text-secondary)]">{skill.name}</span>
                                            <span className="text-[var(--text-muted)] capitalize">{skill.level}</span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-[var(--surface-overlay)]">
                                            <div
                                                className="h-full rounded-full bg-[var(--accent-primary)]"
                                                style={{ width: `${skill.proficiency}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                                Projects Contributed To
                            </h3>
                            <div className="space-y-3">
                                {projectContributions.map(({ project, count }) => (
                                    <Link
                                        key={project.id}
                                        href={`/forge/projects/${project.slug}`}
                                        className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-[var(--surface-overlay)] transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                                            <Target size={16} className="text-orange-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                                                {project.name}
                                            </div>
                                        </div>
                                        <span className="text-xs text-[var(--text-muted)]">
                                            {count} contributions
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "contributions" && <ContributionHistory />}
            {activeTab === "skills" && <SkillsTab />}
            {activeTab === "achievements" && <AchievementsTab />}
        </div>
    );
}
