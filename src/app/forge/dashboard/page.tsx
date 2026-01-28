"use client";

import React, { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Zap, GitPullRequest, Target, Flame, Rocket, BookOpen } from "lucide-react";
import { useForge } from "../layout";
import { StatsCard } from "./components";
import { Skeleton, SkeletonCard } from "../components/LazySection";
import { PageHero, type PageHeroStat } from "../components/PageHero";
import { ForgeGlowButton } from "../components/ForgeGlowButton";
import { staggerContainer, staggerChild, fadeUpVariants, forgeEasing } from "../lib/animations";

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
// Quick Actions Component
// ============================================================================

function QuickActions() {
    return (
        <motion.div
            variants={fadeUpVariants}
            custom={3}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap items-center justify-center gap-4 mt-6"
        >
            <ForgeGlowButton href="/forge/challenges" icon="flame">
                Start a Challenge
            </ForgeGlowButton>
            <motion.a
                href="/forge/projects"
                className="flex items-center gap-2 px-6 py-4 rounded-xl bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm border border-[var(--forge-border-subtle)] text-[var(--forge-text-primary)] font-semibold hover:border-[var(--ember)]/30 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <BookOpen size={20} className="text-[var(--forge-info)]" />
                Browse Projects
            </motion.a>
        </motion.div>
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

    // Hero stats
    const heroStats: PageHeroStat[] = [
        { value: user.xp, label: "Total XP", suffix: "" },
        { value: mergedPRCount, label: "PRs Merged", suffix: "" },
        { value: contributionCount, label: "Challenges Done", suffix: "" },
        { value: user.currentStreak, label: "Day Streak", suffix: "" },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Hero Section */}
            <PageHero
                title={`Welcome back, ${user.displayName}!`}
                subtitle="Track your progress, complete challenges, and level up your skills."
                badge={{ icon: Rocket, text: `Level ${user.level}` }}
                stats={heroStats}
                compact
            >
                <QuickActions />
            </PageHero>

            {/* Stats Grid with Staggered Animation */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
                <motion.div variants={staggerChild}>
                    <StatsCard
                        icon={Zap}
                        label="Total XP"
                        value={user.xp}
                        trend="+12%"
                        iconColor="bg-[var(--gold)]"
                        animateValue
                    />
                </motion.div>
                <motion.div variants={staggerChild}>
                    <StatsCard
                        icon={GitPullRequest}
                        label="PRs Merged"
                        value={mergedPRCount}
                        subtext="this month"
                        iconColor="bg-[var(--forge-success)]"
                        animateValue
                    />
                </motion.div>
                <motion.div variants={staggerChild}>
                    <StatsCard
                        icon={Target}
                        label="Challenges"
                        value={contributionCount}
                        subtext="completed"
                        iconColor="bg-[var(--forge-info)]"
                        animateValue
                    />
                </motion.div>
                <motion.div variants={staggerChild}>
                    <StatsCard
                        icon={Flame}
                        label="Current Streak"
                        value={user.currentStreak}
                        suffix=" days"
                        iconColor="bg-[var(--ember)]"
                        animateValue
                    />
                </motion.div>
            </motion.div>

            {/* Main Content Grid - Lazy loaded sections */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4, ease: forgeEasing }}
                className="grid lg:grid-cols-3 gap-6 pb-12"
            >
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
            </motion.div>
        </div>
    );
}
