"use client";

import React, { Suspense, lazy } from "react";
import { Zap, GitPullRequest, Target, Flame } from "lucide-react";
import { useForge } from "../layout";
import { StatsCard } from "./components";
import { Skeleton, SkeletonCard } from "../components/LazySection";

// ============================================================================
// Lazy load heavy components for better initial load
// ============================================================================

const XPProgress = lazy(() => import("./components/XPProgress").then(m => ({ default: m.XPProgress })));
const StreakWidget = lazy(() => import("./components/StreakWidget").then(m => ({ default: m.StreakWidget })));
const ActiveContributions = lazy(() => import("./components/ActiveContributions").then(m => ({ default: m.ActiveContributions })));
const RecommendedChallenges = lazy(() => import("./components/RecommendedChallenges").then(m => ({ default: m.RecommendedChallenges })));
const SkillsOverview = lazy(() => import("./components/SkillsOverview").then(m => ({ default: m.SkillsOverview })));
const RecentActivity = lazy(() => import("./components/RecentActivity").then(m => ({ default: m.RecentActivity })));

// ============================================================================
// Section Skeletons
// ============================================================================

function XPProgressSkeleton() {
    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-end justify-between mb-3">
                <div>
                    <Skeleton className="h-9 w-24 mb-2" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <div className="text-right">
                    <Skeleton className="h-6 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-16" />
            </div>
            <div className="divide-y divide-[var(--forge-border-subtle)]">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1">
                            <Skeleton className="h-4 w-48 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function StreakSkeleton() {
    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-7 w-24" />
            </div>
            <div className="flex justify-between">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="text-center">
                        <Skeleton className="h-3 w-3 mx-auto mb-2" />
                        <Skeleton className="w-8 h-8 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// Main Page
// ============================================================================

export default function DashboardPage() {
    const { user, isLoading } = useForge();

    if (isLoading || !user) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-[var(--forge-bg-elevated)] rounded w-64 mb-2" />
                    <div className="h-4 bg-[var(--forge-bg-elevated)] rounded w-96 mb-8" />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-[var(--forge-bg-elevated)] rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Mock values for properties not in ForgeUser type
    const mergedPRCount = 12;
    const contributionCount = 24;

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

            {/* Stats Grid - Always render immediately */}
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
                    value={mergedPRCount}
                    subtext="this month"
                    iconColor="bg-[var(--forge-success)]"
                />
                <StatsCard
                    icon={Target}
                    label="Challenges"
                    value={contributionCount}
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

            {/* Main Content Grid - Lazy loaded sections */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Suspense fallback={<XPProgressSkeleton />}>
                        <XPProgress />
                    </Suspense>
                    <Suspense fallback={<ListSkeleton />}>
                        <ActiveContributions />
                    </Suspense>
                    <Suspense fallback={<ListSkeleton />}>
                        <RecommendedChallenges />
                    </Suspense>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Suspense fallback={<StreakSkeleton />}>
                        <StreakWidget />
                    </Suspense>
                    <Suspense fallback={<ListSkeleton />}>
                        <SkillsOverview />
                    </Suspense>
                    <Suspense fallback={<ListSkeleton />}>
                        <RecentActivity />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
