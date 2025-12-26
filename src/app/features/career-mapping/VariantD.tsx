"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lock, Unlock, Share2, Award, Zap, Shield, Trophy,
    Star, ChevronRight, Sparkles
} from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { levelThresholds } from "@/app/shared/lib/mockData";
import { useProgressContext } from "@/app/features/progress";
import type { Achievement } from "@/app/shared/lib/types";

// XP calculation constants
const XP_PER_MINUTE_WATCHED = 2; // 2 XP per minute of content watched
const XP_PER_COMPLETED_CHAPTER = 50; // Bonus XP for completing chapters
const XP_PER_COURSE_COMPLETION = 200; // Bonus XP for completing a course

// Achievement thresholds based on learning milestones
const ACHIEVEMENT_THRESHOLDS = {
    internshipReady: { minCompletion: 25, minWatchMinutes: 60 }, // 1 hour watched, 25% overall
    juniorDeveloper: { minCompletion: 50, minWatchMinutes: 300 }, // 5 hours, 50% overall
    midLevel: { minCompletion: 75, minWatchMinutes: 600 }, // 10 hours, 75% overall
    senior: { minCompletion: 90, minWatchMinutes: 1200 }, // 20 hours, 90% overall
};

// Gamified Career Mapping - adapted from gemi/app career-mapping with Spatial theming

export const VariantD = () => {
    const { courses, totalWatchTime, overallCompletion, isLoading } = useProgressContext();
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [showShareTooltip, setShowShareTooltip] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    // Calculate XP from real progress data
    const xp = useMemo(() => {
        // Convert watch time from seconds to minutes
        const watchMinutes = Math.floor(totalWatchTime / 60);
        let calculatedXp = watchMinutes * XP_PER_MINUTE_WATCHED;

        // Add bonus XP for completed chapters and courses
        courses.forEach(course => {
            const completedChapters = Object.values(course.chapterProgress || {}).filter(ch => ch.completed).length;
            calculatedXp += completedChapters * XP_PER_COMPLETED_CHAPTER;

            // Full course completion bonus
            if (course.overallProgress >= 100) {
                calculatedXp += XP_PER_COURSE_COMPLETION;
            }
        });

        return calculatedXp;
    }, [courses, totalWatchTime]);

    // Calculate dynamic achievements based on real progress
    const achievements: Achievement[] = useMemo(() => {
        const watchMinutes = Math.floor(totalWatchTime / 60);

        // Calculate progress towards each milestone
        const internshipProgress = Math.min(100, Math.round(
            (Math.min(watchMinutes / ACHIEVEMENT_THRESHOLDS.internshipReady.minWatchMinutes, 1) * 50) +
            (Math.min(overallCompletion / ACHIEVEMENT_THRESHOLDS.internshipReady.minCompletion, 1) * 50)
        ));

        const juniorProgress = Math.min(100, Math.round(
            (Math.min(watchMinutes / ACHIEVEMENT_THRESHOLDS.juniorDeveloper.minWatchMinutes, 1) * 50) +
            (Math.min(overallCompletion / ACHIEVEMENT_THRESHOLDS.juniorDeveloper.minCompletion, 1) * 50)
        ));

        const midLevelProgress = Math.min(100, Math.round(
            (Math.min(watchMinutes / ACHIEVEMENT_THRESHOLDS.midLevel.minWatchMinutes, 1) * 50) +
            (Math.min(overallCompletion / ACHIEVEMENT_THRESHOLDS.midLevel.minCompletion, 1) * 50)
        ));

        const seniorProgress = Math.min(100, Math.round(
            (Math.min(watchMinutes / ACHIEVEMENT_THRESHOLDS.senior.minWatchMinutes, 1) * 50) +
            (Math.min(overallCompletion / ACHIEVEMENT_THRESHOLDS.senior.minCompletion, 1) * 50)
        ));

        return [
            {
                id: 1,
                title: "Internship Ready",
                progress: internshipProgress,
                locked: internshipProgress < 100,
                reward: "Unlock Job Board",
                xp: 500,
                description: `Complete ${ACHIEVEMENT_THRESHOLDS.internshipReady.minWatchMinutes} mins of content and reach ${ACHIEVEMENT_THRESHOLDS.internshipReady.minCompletion}% completion`
            },
            {
                id: 2,
                title: "Junior Developer",
                progress: juniorProgress,
                locked: internshipProgress < 100 || juniorProgress < 100,
                reward: "Unlock Salary Data",
                xp: 1200,
                description: `Complete ${ACHIEVEMENT_THRESHOLDS.juniorDeveloper.minWatchMinutes} mins of content and reach ${ACHIEVEMENT_THRESHOLDS.juniorDeveloper.minCompletion}% completion`
            },
            {
                id: 3,
                title: "Mid-Level Engineer",
                progress: midLevelProgress,
                locked: juniorProgress < 100 || midLevelProgress < 100,
                reward: "Unlock Client List",
                xp: 2000,
                description: `Complete ${ACHIEVEMENT_THRESHOLDS.midLevel.minWatchMinutes} mins of content and reach ${ACHIEVEMENT_THRESHOLDS.midLevel.minCompletion}% completion`
            },
            {
                id: 4,
                title: "Senior Developer",
                progress: seniorProgress,
                locked: midLevelProgress < 100 || seniorProgress < 100,
                reward: "Unlock Leadership Track",
                xp: 3500,
                description: `Complete ${ACHIEVEMENT_THRESHOLDS.senior.minWatchMinutes} mins of content and reach ${ACHIEVEMENT_THRESHOLDS.senior.minCompletion}% completion`
            },
        ];
    }, [courses, totalWatchTime, overallCompletion]);

    // Handle hydration to show skeleton during initial load
    useEffect(() => {
        // Small delay to ensure smooth transition from skeleton to animated bar
        const timer = setTimeout(() => setIsHydrated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const currentLevel = levelThresholds.reduce((acc, threshold) =>
        xp >= threshold.minXp ? threshold : acc
    , levelThresholds[0]);

    const nextLevel = levelThresholds.find(t => t.minXp > xp) || levelThresholds[levelThresholds.length - 1];
    const progressToNextLevel = nextLevel.minXp > currentLevel.minXp
        ? ((xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100
        : 100;

    return (
        <div className="space-y-8" data-testid="career-gamified-container">
            {/* XP Header Card */}
            <PrismaticCard glowColor="orange">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg"
                                style={{
                                    background: `linear-gradient(to bottom right, var(--color-amber), var(--color-orange))`,
                                    boxShadow: `0 10px 25px -5px color-mix(in srgb, var(--color-orange) 30%, transparent)`
                                }}
                                whileHover={{ scale: 1.05, rotate: 5 }}
                            >
                                {currentLevel.level}
                            </motion.div>
                            <div>
                                <h2 className="text-xl font-black text-[var(--text-primary)]">{currentLevel.title}</h2>
                                <div className="flex items-center gap-2 text-sm text-[var(--text-muted-high)]">
                                    <Zap size={ICON_SIZES.sm} style={{ color: 'var(--color-amber)' }} />
                                    <span className="font-bold">{xp.toLocaleString()}</span> / {nextLevel.minXp.toLocaleString()} XP
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    className="p-3 bg-[var(--surface-inset)] rounded-xl hover:bg-[var(--surface-overlay)] transition-colors"
                                    onMouseEnter={() => setShowShareTooltip(true)}
                                    onMouseLeave={() => setShowShareTooltip(false)}
                                    data-testid="share-progress-btn"
                                >
                                    <Share2 size={ICON_SIZES.md} className="text-[var(--text-secondary)]" />
                                </button>
                                <AnimatePresence>
                                    {showShareTooltip && (
                                        <motion.span
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute top-full right-0 mt-2 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg whitespace-nowrap"
                                        >
                                            Share Progress
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button
                                className="px-4 py-3 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                                style={{ background: `linear-gradient(to right, var(--color-amber), var(--color-orange))` }}
                                data-testid="leaderboard-btn"
                            >
                                <Trophy size={ICON_SIZES.sm} />
                                Leaderboard
                            </button>
                        </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="space-y-2">
                        <div className="h-4 bg-[var(--surface-inset)] rounded-full overflow-hidden" data-testid="xp-progress-bar">
                            {!isHydrated ? (
                                /* Shimmer skeleton during hydration */
                                <div className="h-full w-full bg-[var(--surface-inset)] relative overflow-hidden">
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent animate-shimmer"
                                        style={{ '--tw-gradient-via': 'color-mix(in srgb, var(--color-amber) 40%, transparent)' } as React.CSSProperties}
                                        data-testid="xp-progress-skeleton"
                                    />
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressToNextLevel}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full relative"
                                    style={{ background: `linear-gradient(to right, var(--color-amber), var(--color-orange))` }}
                                    data-testid="xp-progress-fill"
                                >
                                    <div className="absolute inset-0 bg-white/30 animate-pulse" />
                                </motion.div>
                            )}
                        </div>
                        <div className="flex justify-between text-xs text-[var(--text-muted-high)]">
                            <span>Level {currentLevel.level}</span>
                            <span className="font-medium">{Math.round(progressToNextLevel)}% to Level {Math.min(currentLevel.level + 1, 5)}</span>
                        </div>
                    </div>
                </div>
            </PrismaticCard>

            {/* Achievements Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">Career Milestones</h3>
                    <span className="text-sm text-[var(--text-muted-high)]">
                        {achievements.filter(a => !a.locked).length} / {achievements.length} unlocked
                    </span>
                </div>

                <div className="grid gap-4">
                    {achievements.map((item, i) => {
                        const isHovered = hoveredId === item.id;
                        const isNextMilestone = item.locked && achievements[i - 1] && !achievements[i - 1].locked;

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onMouseEnter={() => setHoveredId(item.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                data-testid={`achievement-card-${item.id}`}
                            >
                                <PrismaticCard
                                    glowColor={item.locked ? "purple" : "emerald"}
                                    className={cn(
                                        "transition-transform duration-300",
                                        isHovered && !item.locked && "scale-[1.01]"
                                    )}
                                >
                                    <div className={cn(
                                        "p-6 relative overflow-hidden",
                                        item.locked && "opacity-80"
                                    )}>
                                        {/* Particle Effect Background for unlocked */}
                                        {!item.locked && (
                                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                                <div
                                                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-8 -mt-8"
                                                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-emerald) 10%, transparent)' }}
                                                />
                                            </div>
                                        )}

                                        {/* Next Milestone Pulse */}
                                        {isNextMilestone && (
                                            <div className="absolute top-4 right-4">
                                                <span className="relative flex h-3 w-3">
                                                    <span
                                                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-indigo) 80%, transparent)' }}
                                                    ></span>
                                                    <span
                                                        className="relative inline-flex rounded-full h-3 w-3"
                                                        style={{ backgroundColor: 'var(--color-indigo)' }}
                                                    ></span>
                                                </span>
                                            </div>
                                        )}

                                        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                            {/* Icon Badge */}
                                            <motion.div
                                                className={cn(
                                                    "w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg",
                                                    item.locked
                                                        ? "bg-[var(--surface-inset)] text-[var(--text-muted)]"
                                                        : "text-white"
                                                )}
                                                style={!item.locked ? { background: 'linear-gradient(to bottom right, var(--color-emerald), var(--color-cyan))' } : undefined}
                                                whileHover={{ rotate: item.locked ? 0 : 5 }}
                                            >
                                                {item.locked
                                                    ? <Lock size={ICON_SIZES.xl} />
                                                    : <Unlock size={ICON_SIZES.xl} />
                                                }
                                            </motion.div>

                                            {/* Content */}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{item.title}</h3>
                                                    {!item.locked && (
                                                        <span
                                                            className="px-2 py-0.5 text-xs font-bold rounded-full"
                                                            style={{
                                                                backgroundColor: 'var(--status-success-bg)',
                                                                color: 'var(--status-success-text)'
                                                            }}
                                                        >
                                                            Achieved
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-[var(--text-muted-high)]">{item.description}</p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="flex items-center gap-1" style={{ color: 'var(--color-amber)' }}>
                                                        <Star size={ICON_SIZES.sm} /> +{item.xp} XP
                                                    </span>
                                                    <span className="flex items-center gap-1" style={{ color: 'var(--color-emerald)' }}>
                                                        <Award size={ICON_SIZES.sm} /> {item.reward}
                                                    </span>
                                                </div>

                                                {/* Requirements for locked items */}
                                                {item.locked && (
                                                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted-high)] mt-2">
                                                        <Shield size={ICON_SIZES.xs} />
                                                        Requires Level {Math.min(i + 1, 4)} and previous milestone
                                                    </div>
                                                )}
                                            </div>

                                            {/* Progress Section */}
                                            <div className="w-full md:w-48 space-y-2">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted-high)]">
                                                    <span>Progress</span>
                                                    <span>{item.progress}%</span>
                                                </div>
                                                <div className="h-3 bg-[var(--surface-inset)] rounded-full overflow-hidden" data-testid={`achievement-progress-bar-${item.id}`}>
                                                    {!isHydrated ? (
                                                        /* Shimmer skeleton during hydration */
                                                        <div className="h-full w-full bg-[var(--surface-inset)] relative overflow-hidden">
                                                            <div
                                                                className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent animate-shimmer"
                                                                style={{
                                                                    '--tw-gradient-via': item.locked
                                                                        ? 'color-mix(in srgb, var(--text-muted) 40%, transparent)'
                                                                        : 'color-mix(in srgb, var(--color-emerald) 40%, transparent)'
                                                                } as React.CSSProperties}
                                                                data-testid={`achievement-progress-skeleton-${item.id}`}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${item.progress}%` }}
                                                            transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.1 }}
                                                            className="h-full rounded-full relative overflow-hidden"
                                                            style={{
                                                                background: item.locked
                                                                    ? 'var(--text-muted)'
                                                                    : 'linear-gradient(to right, var(--color-emerald), var(--color-cyan))'
                                                            }}
                                                            data-testid={`achievement-progress-fill-${item.id}`}
                                                        >
                                                            {!item.locked && (
                                                                <div
                                                                    className="absolute inset-0 bg-white/30 animate-progress-shimmer"
                                                                    data-testid={`achievement-shimmer-${item.id}`}
                                                                />
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* View Certificate Button */}
                                        {!item.locked && (
                                            <motion.button
                                                className="absolute bottom-4 right-4 text-xs px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-1"
                                                style={{
                                                    backgroundColor: 'var(--status-success-bg)',
                                                    color: 'var(--status-success-text)'
                                                }}
                                                whileHover={{ scale: 1.05 }}
                                                data-testid={`view-certificate-btn-${item.id}`}
                                            >
                                                <Sparkles size={ICON_SIZES.xs} />
                                                View Certificate
                                            </motion.button>
                                        )}
                                    </div>
                                </PrismaticCard>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total XP", value: xp.toLocaleString(), icon: Zap, color: "amber", cssColor: "var(--color-amber)" },
                    { label: "Achievements", value: `${achievements.filter(a => !a.locked).length}/${achievements.length}`, icon: Trophy, color: "emerald", cssColor: "var(--color-emerald)" },
                    { label: "Courses Active", value: courses.length.toString(), icon: Star, color: "indigo", cssColor: "var(--color-indigo)" },
                    { label: "Watch Time", value: `${Math.floor(totalWatchTime / 60)}m`, icon: ChevronRight, color: "purple", cssColor: "var(--color-purple)" },
                ].map((stat, i) => (
                    <PrismaticCard key={i} glowColor={stat.color as any}>
                        <div className="p-4 text-center" data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                            <stat.icon size={ICON_SIZES.lg} className="mx-auto mb-2" style={{ color: stat.cssColor }} />
                            <div className="text-2xl font-black text-[var(--text-primary)]">{stat.value}</div>
                            <div className="text-xs text-[var(--text-muted-high)]">{stat.label}</div>
                        </div>
                    </PrismaticCard>
                ))}
            </div>
        </div>
    );
};
