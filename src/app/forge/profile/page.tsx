"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Zap,
    Flame,
    Star,
    Award,
    ChevronRight,
    Play,
    Settings,
    LogIn,
    BookOpen,
    Map,
    Loader2,
} from "lucide-react";
import { CompetencyRadar, TopSkillsCard } from "./components";
import { cn } from "@/app/shared/lib/utils";
import { useForge, type UserLearningPath } from "../layout";

// ============================================================================
// COMPACT STATS ROW
// ============================================================================

function CompactStats() {
    const { user } = useForge();

    if (!user) return null;

    const stats = [
        { icon: Zap, value: user.xp.toLocaleString(), label: "XP", color: "text-[var(--ember)]" },
        { icon: BookOpen, value: user.learningPaths.length, label: "Paths", color: "text-[var(--forge-success)]" },
        { icon: Flame, value: user.currentStreak, label: "Streak", color: "text-[var(--ember)]" },
        { icon: Star, value: user.level, label: "Level", color: "text-[var(--ember-glow)]" },
    ];

    return (
        <div className="grid grid-cols-4 gap-2">
            {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                    <div key={i} className="text-center p-3 bg-[var(--forge-bg-daylight)]/60 rounded-xl border border-[var(--forge-border-subtle)]">
                        <Icon size={16} className={cn("mx-auto mb-1", stat.color)} />
                        <div className="text-lg font-bold text-[var(--forge-text-primary)]">{stat.value}</div>
                        <div className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-wide">{stat.label}</div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// LEVEL PROGRESS RING
// ============================================================================

function LevelRing() {
    const { user } = useForge();

    if (!user) return null;

    const progress = (user.xp / (user.xp + user.xpToNextLevel)) * 100;
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-[var(--forge-bg-elevated)]"
                />
                <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="url(#gradient)"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    style={{ strokeDasharray: circumference, strokeDashoffset }}
                    className="transition-all duration-500"
                />
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--ember)" />
                        <stop offset="100%" stopColor="var(--ember-glow)" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[var(--forge-text-primary)]">{user.level}</span>
                <span className="text-[10px] text-[var(--forge-text-muted)] uppercase">Level</span>
            </div>
        </div>
    );
}

// ============================================================================
// LEARNING PATH CARD
// ============================================================================

function LearningPathCard({ path }: { path: UserLearningPath }) {
    const statusColors = {
        active: "bg-[var(--ember)]/10 text-[var(--ember)] border-[var(--ember)]/20",
        completed: "bg-[var(--forge-success)]/10 text-[var(--forge-success)] border-[var(--forge-success)]/20",
        paused: "bg-[var(--forge-text-muted)]/10 text-[var(--forge-text-muted)] border-[var(--forge-border-subtle)]",
    };

    const statusLabels = {
        active: "In Progress",
        completed: "Completed",
        paused: "Paused",
    };

    const status = path.status as keyof typeof statusColors;

    return (
        <Link
            href={`/forge/paths/${path.pathId}`}
            className="group flex items-center gap-4 p-4 bg-[var(--forge-bg-daylight)]/60 rounded-xl border border-[var(--forge-border-subtle)] hover:bg-[var(--forge-bg-daylight)] hover:shadow-md transition-all"
        >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--ember)]/20 to-[var(--ember-glow)]/20 flex items-center justify-center border border-[var(--ember)]/10">
                <Map size={20} className="text-[var(--ember)]" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-[var(--forge-text-primary)] truncate group-hover:text-[var(--ember)] transition-colors">
                        {path.title}
                    </h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", statusColors[status] || statusColors.active)}>
                        {statusLabels[status] || "Active"}
                    </span>
                </div>

                {path.description && (
                    <p className="text-xs text-[var(--forge-text-muted)] truncate mb-2">
                        {path.description}
                    </p>
                )}

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--forge-bg-elevated)]">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] transition-all"
                            style={{ width: `${path.progressPercent}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-[var(--forge-text-secondary)]">
                        {path.progressPercent}%
                    </span>
                </div>
            </div>

            <ChevronRight size={16} className="text-[var(--forge-text-muted)] group-hover:text-[var(--ember)] transition-colors" />
        </Link>
    );
}

// ============================================================================
// LEARNING PATHS SECTION
// ============================================================================

function LearningPathsSection() {
    const { user } = useForge();

    if (!user) return null;

    const { learningPaths } = user;

    if (learningPaths.length === 0) {
        return (
            <section className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-[var(--forge-text-primary)] flex items-center gap-2">
                        <Map size={16} className="text-[var(--ember)]" />
                        Learning Paths
                    </h2>
                </div>

                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--ember)]/10 flex items-center justify-center">
                        <Map size={28} className="text-[var(--ember)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-2">
                        Start Your Learning Journey
                    </h3>
                    <p className="text-sm text-[var(--forge-text-muted)] mb-4 max-w-md mx-auto">
                        Explore the knowledge map and accept a learning path from the Oracle to begin your personalized learning experience.
                    </p>
                    <Link
                        href="/forge/map"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--ember)] text-white text-sm font-medium hover:bg-[var(--ember)]/90 transition-colors shadow-md shadow-[var(--ember)]/20"
                    >
                        <Map size={16} />
                        Explore Map
                    </Link>
                </div>
            </section>
        );
    }

    const activePaths = learningPaths.filter(p => p.status === "active");
    const completedPaths = learningPaths.filter(p => p.status === "completed");

    return (
        <section className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[var(--forge-text-primary)] flex items-center gap-2">
                    <Map size={16} className="text-[var(--ember)]" />
                    Learning Paths
                </h2>
                <Link href="/forge/map" className="text-xs text-[var(--ember)] hover:underline flex items-center gap-1">
                    Explore Map
                    <ChevronRight size={12} />
                </Link>
            </div>

            <div className="space-y-3">
                {activePaths.map((path) => (
                    <LearningPathCard key={path.id} path={path} />
                ))}

                {completedPaths.length > 0 && activePaths.length > 0 && (
                    <div className="border-t border-[var(--forge-border-subtle)] pt-3 mt-3">
                        <h3 className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wide mb-3">
                            Completed
                        </h3>
                        {completedPaths.slice(0, 2).map((path) => (
                            <LearningPathCard key={path.id} path={path} />
                        ))}
                    </div>
                )}

                {completedPaths.length === 0 && activePaths.length === 0 && learningPaths.map((path) => (
                    <LearningPathCard key={path.id} path={path} />
                ))}
            </div>
        </section>
    );
}

// ============================================================================
// ACHIEVEMENTS GRID
// ============================================================================

function AchievementsGrid() {
    const achievements = [
        { icon: "🎯", name: "First Steps", earned: true },
        { icon: "📚", name: "Learner", earned: true },
        { icon: "✨", name: "Creator", earned: false },
        { icon: "🔥", name: "Streak", earned: false },
        { icon: "🚀", name: "Pioneer", earned: false },
        { icon: "🏆", name: "Champion", earned: false },
    ];

    return (
        <div className="grid grid-cols-6 gap-2">
            {achievements.map((a, i) => (
                <div
                    key={i}
                    className={cn(
                        "aspect-square rounded-xl flex items-center justify-center text-xl transition-all",
                        a.earned
                            ? "bg-[var(--gold)]/10 border border-[var(--gold)]/20"
                            : "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] grayscale opacity-40"
                    )}
                    title={a.name}
                >
                    {a.icon}
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// RECOMMENDED NEXT
// ============================================================================

function RecommendedNext() {
    const { user } = useForge();

    if (!user || user.learningPaths.length > 0) {
        return null;
    }

    return (
        <section className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[var(--forge-text-primary)] flex items-center gap-2">
                    <TrendingUp size={16} className="text-[var(--forge-success)]" />
                    Get Started
                </h2>
            </div>

            <Link
                href="/forge/map"
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-[var(--ember)]/10 to-[var(--ember-glow)]/10 rounded-xl border border-[var(--ember)]/20 hover:shadow-md transition-all group"
            >
                <div className="w-12 h-12 rounded-lg bg-[var(--forge-bg-daylight)] shadow-sm flex items-center justify-center">
                    <Map size={24} className="text-[var(--ember)]" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--forge-text-primary)] group-hover:text-[var(--ember)] transition-colors">
                        Explore the Knowledge Map
                    </div>
                    <div className="text-xs text-[var(--forge-text-muted)]">
                        Discover domains and start your learning journey
                    </div>
                </div>
                <Play size={16} className="text-[var(--ember)]/60 group-hover:text-[var(--ember)] transition-colors" />
            </Link>
        </section>
    );
}

// ============================================================================
// SIGN IN PROMPT
// ============================================================================

function SignInPrompt() {
    const { signInWithGoogle } = useForge();

    return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
            <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-xl p-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] flex items-center justify-center shadow-lg shadow-[var(--ember)]/30">
                    <LogIn size={32} className="text-white" />
                </div>

                <h1 className="text-2xl font-bold text-[var(--forge-text-primary)] mb-2">
                    Sign In to OpenForge
                </h1>
                <p className="text-[var(--forge-text-muted)] mb-6">
                    Track your progress, earn XP, and personalize your learning journey.
                </p>

                <button
                    onClick={signInWithGoogle}
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[var(--ember)] text-white font-medium hover:bg-[var(--ember)]/90 transition-colors shadow-md shadow-[var(--ember)]/20"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ProfilePage() {
    const { user, isLoading, isAuthenticated } = useForge();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-[var(--ember)]" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <SignInPrompt />;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid lg:grid-cols-12 gap-6">
                {/* Left Column - Profile Card */}
                <div className="lg:col-span-4">
                    <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-xl shadow-[var(--forge-bg-void)]/5 overflow-hidden sticky top-24">
                        {/* Header gradient */}
                        <div className="h-20 bg-gradient-to-r from-[var(--ember)] via-[var(--ember-glow)] to-[var(--ember)]" />

                        {/* Avatar & Info */}
                        <div className="px-6 pb-6 -mt-10">
                            <div className="flex items-end gap-4 mb-4">
                                <img
                                    src={user.avatarUrl}
                                    alt={user.displayName}
                                    className="w-20 h-20 rounded-2xl border-4 border-[var(--forge-bg-elevated)] shadow-lg"
                                />
                                <div className="mb-1">
                                    <h1 className="text-xl font-bold text-[var(--forge-text-primary)]">
                                        {user.displayName}
                                    </h1>
                                    {user.email && (
                                        <p className="text-sm text-[var(--forge-text-muted)]">{user.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Level Ring & Progress */}
                            <div className="flex items-center gap-4 mb-4">
                                <LevelRing />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-[var(--forge-text-primary)] mb-1">
                                        {user.xpToNextLevel.toLocaleString()} XP to Level {user.level + 1}
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-[var(--forge-bg-elevated)]">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]"
                                            style={{ width: `${(user.xp / (user.xp + user.xpToNextLevel)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Compact Stats */}
                            <CompactStats />

                            {/* Settings Link */}
                            <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-elevated)] rounded-xl transition-colors">
                                <Settings size={14} />
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column - Dashboard Content */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Learning Paths */}
                    <LearningPathsSection />

                    {/* Skill Progress Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <CompetencyRadar />
                        <TopSkillsCard />
                    </div>

                    {/* Achievements */}
                    <section className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-sm p-5">
                        <h2 className="font-semibold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
                            <Award size={16} className="text-[var(--gold)]" />
                            Achievements
                        </h2>
                        <AchievementsGrid />
                    </section>

                    {/* Recommended Next - only show if no paths */}
                    <RecommendedNext />
                </div>
            </div>
        </div>
    );
}
