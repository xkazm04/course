"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lock, Unlock, Share2, Award, Zap, Shield, Trophy,
    Star, ChevronRight, Sparkles, Dna, TrendingUp, ExternalLink
} from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { levelThresholds } from "@/app/shared/lib/mockData";
import { useProgressContext } from "@/app/features/progress";
import { useLearningDNA } from "@/app/features/learning-dna";
import type { Achievement } from "@/app/shared/lib/types";

// XP calculation constants - now includes external platform bonuses
const XP_PER_MINUTE_WATCHED = 2;
const XP_PER_COMPLETED_CHAPTER = 50;
const XP_PER_COURSE_COMPLETION = 200;
const EXTERNAL_XP_MULTIPLIER = 0.5; // External achievements contribute 50% of their score

// Achievement thresholds
const ACHIEVEMENT_THRESHOLDS = {
    internshipReady: { minCompletion: 25, minWatchMinutes: 60 },
    juniorDeveloper: { minCompletion: 50, minWatchMinutes: 300 },
    midLevel: { minCompletion: 75, minWatchMinutes: 600 },
    senior: { minCompletion: 90, minWatchMinutes: 1200 },
};

/**
 * Enhanced Career Mapping with Learning DNA Integration
 *
 * This variant synthesizes OpenForge progress with external platform
 * achievements to create a unified career readiness picture.
 */
export const VariantE = () => {
    const { courses, totalWatchTime, overallCompletion, isLoading } = useProgressContext();
    const { profile: dnaProfile, connectedCount, topSkills } = useLearningDNA({ useMockData: true });

    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [showShareTooltip, setShowShareTooltip] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    // Calculate combined XP from OpenForge + external platforms
    const { openforgeXP, externalXP, totalXP } = useMemo(() => {
        // OpenForge XP
        const watchMinutes = Math.floor(totalWatchTime / 60);
        let ofXP = watchMinutes * XP_PER_MINUTE_WATCHED;

        courses.forEach(course => {
            const completedChapters = Object.values(course.chapterProgress || {}).filter(ch => ch.completed).length;
            ofXP += completedChapters * XP_PER_COMPLETED_CHAPTER;
            if (course.overallProgress >= 100) {
                ofXP += XP_PER_COURSE_COMPLETION;
            }
        });

        // External XP (from Learning DNA signals)
        let extXP = 0;
        if (dnaProfile) {
            const signalScores = dnaProfile.signals.reduce((acc, signal) => acc + signal.normalizedScore, 0);
            extXP = Math.round(signalScores * EXTERNAL_XP_MULTIPLIER);
        }

        return {
            openforgeXP: ofXP,
            externalXP: extXP,
            totalXP: ofXP + extXP,
        };
    }, [courses, totalWatchTime, dnaProfile]);

    // Calculate achievements with DNA boost
    const achievements: Achievement[] = useMemo(() => {
        const watchMinutes = Math.floor(totalWatchTime / 60);
        const dnaBoost = dnaProfile ? dnaProfile.overallScore / 100 : 0;

        const calculateProgress = (threshold: { minWatchMinutes: number; minCompletion: number }) => {
            const baseProgress =
                (Math.min(watchMinutes / threshold.minWatchMinutes, 1) * 50) +
                (Math.min(overallCompletion / threshold.minCompletion, 1) * 50);
            // DNA boost can add up to 10% to progress
            return Math.min(100, Math.round(baseProgress + (dnaBoost * 10)));
        };

        const internshipProgress = calculateProgress(ACHIEVEMENT_THRESHOLDS.internshipReady);
        const juniorProgress = calculateProgress(ACHIEVEMENT_THRESHOLDS.juniorDeveloper);
        const midLevelProgress = calculateProgress(ACHIEVEMENT_THRESHOLDS.midLevel);
        const seniorProgress = calculateProgress(ACHIEVEMENT_THRESHOLDS.senior);

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
    }, [totalWatchTime, overallCompletion, dnaProfile]);

    useEffect(() => {
        const timer = setTimeout(() => setIsHydrated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const currentLevel = levelThresholds.reduce((acc, threshold) =>
        totalXP >= threshold.minXp ? threshold : acc
    , levelThresholds[0]);

    const nextLevel = levelThresholds.find(t => t.minXp > totalXP) || levelThresholds[levelThresholds.length - 1];
    const progressToNextLevel = nextLevel.minXp > currentLevel.minXp
        ? ((totalXP - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100
        : 100;

    return (
        <div className="space-y-8" data-testid="career-dna-container">
            {/* XP Header Card with DNA Integration */}
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
                                    <span className="font-bold">{totalXP.toLocaleString()}</span> / {nextLevel.minXp.toLocaleString()} XP
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* DNA Score Badge */}
                            {dnaProfile && (
                                <motion.div
                                    className="px-4 py-2 rounded-xl flex items-center gap-2"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--color-purple), var(--color-indigo))'
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    data-testid="dna-score-badge"
                                >
                                    <Dna size={ICON_SIZES.sm} className="text-white" />
                                    <span className="text-white font-bold">{dnaProfile.overallScore}</span>
                                </motion.div>
                            )}

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
                                            className="absolute top-full right-0 mt-2 text-xs bg-[var(--forge-bg-anvil)] text-[var(--forge-text-primary)] px-3 py-1.5 rounded-lg whitespace-nowrap border border-[var(--forge-border-subtle)]"
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

                    {/* XP Breakdown */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-[var(--surface-inset)] rounded-xl p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[var(--text-muted-high)]">OpenForge XP</span>
                                <span className="font-bold text-[var(--color-emerald)]">{openforgeXP.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="bg-[var(--surface-inset)] rounded-xl p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[var(--text-muted-high)]">External XP</span>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-[var(--color-purple)]">{externalXP.toLocaleString()}</span>
                                    {connectedCount > 0 && (
                                        <span className="text-xs text-[var(--text-muted)]">({connectedCount} platforms)</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="space-y-2">
                        <div className="h-4 bg-[var(--surface-inset)] rounded-full overflow-hidden" data-testid="xp-progress-bar">
                            {!isHydrated ? (
                                <div className="h-full w-full bg-[var(--surface-inset)] relative overflow-hidden">
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent animate-shimmer"
                                        style={{ '--tw-gradient-via': 'color-mix(in srgb, var(--color-amber) 40%, transparent)' } as React.CSSProperties}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex">
                                    {/* OpenForge portion */}
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(openforgeXP / totalXP) * progressToNextLevel}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full relative"
                                        style={{ background: `linear-gradient(to right, var(--color-amber), var(--color-orange))` }}
                                    >
                                        <div className="absolute inset-0 bg-white/30 animate-pulse" />
                                    </motion.div>
                                    {/* External portion */}
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(externalXP / totalXP) * progressToNextLevel}%` }}
                                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                                        className="h-full relative"
                                        style={{ background: `linear-gradient(to right, var(--color-purple), var(--color-indigo))` }}
                                    >
                                        <div className="absolute inset-0 bg-white/30 animate-pulse" />
                                    </motion.div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between text-xs text-[var(--text-muted-high)]">
                            <span>Level {currentLevel.level}</span>
                            <span className="font-medium">{Math.round(progressToNextLevel)}% to Level {Math.min(currentLevel.level + 1, 5)}</span>
                        </div>
                    </div>
                </div>
            </PrismaticCard>

            {/* Top Skills from Learning DNA */}
            {topSkills.length > 0 && (
                <PrismaticCard glowColor="cyan">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <TrendingUp size={ICON_SIZES.md} style={{ color: 'var(--color-cyan)' }} />
                                Verified Skills
                            </h3>
                            <span className="text-sm text-[var(--text-muted-high)]">
                                From {connectedCount} platforms
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {topSkills.slice(0, 6).map((skill, i) => (
                                <motion.span
                                    key={skill.skillId}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="px-3 py-1.5 rounded-full text-sm font-medium"
                                    style={{
                                        backgroundColor: `color-mix(in srgb, var(--color-cyan) 15%, transparent)`,
                                        color: 'var(--color-cyan)'
                                    }}
                                    data-testid={`verified-skill-${skill.skillId}`}
                                >
                                    {skill.skillName} ({skill.confidence}%)
                                </motion.span>
                            ))}
                        </div>
                    </div>
                </PrismaticCard>
            )}

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
                                        {!item.locked && (
                                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                                <div
                                                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-8 -mt-8"
                                                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-emerald) 10%, transparent)' }}
                                                />
                                            </div>
                                        )}

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

                                                {item.locked && (
                                                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted-high)] mt-2">
                                                        <Shield size={ICON_SIZES.xs} />
                                                        Requires Level {Math.min(i + 1, 4)} and previous milestone
                                                    </div>
                                                )}
                                            </div>

                                            <div className="w-full md:w-48 space-y-2">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted-high)]">
                                                    <span>Progress</span>
                                                    <span>{item.progress}%</span>
                                                </div>
                                                <div className="h-3 bg-[var(--surface-inset)] rounded-full overflow-hidden">
                                                    {!isHydrated ? (
                                                        <div className="h-full w-full bg-[var(--surface-inset)] relative overflow-hidden">
                                                            <div
                                                                className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent animate-shimmer"
                                                                style={{
                                                                    '--tw-gradient-via': item.locked
                                                                        ? 'color-mix(in srgb, var(--text-muted) 40%, transparent)'
                                                                        : 'color-mix(in srgb, var(--color-emerald) 40%, transparent)'
                                                                } as React.CSSProperties}
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
                                                        >
                                                            {!item.locked && (
                                                                <div className="absolute inset-0 bg-white/30 animate-progress-shimmer" />
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

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

            {/* Stats Summary with DNA */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: "Total XP", value: totalXP.toLocaleString(), icon: Zap, color: "amber", cssColor: "var(--color-amber)" },
                    { label: "DNA Score", value: dnaProfile?.overallScore.toString() || "0", icon: Dna, color: "purple", cssColor: "var(--color-purple)" },
                    { label: "Achievements", value: `${achievements.filter(a => !a.locked).length}/${achievements.length}`, icon: Trophy, color: "emerald", cssColor: "var(--color-emerald)" },
                    { label: "Platforms", value: connectedCount.toString(), icon: ExternalLink, color: "indigo", cssColor: "var(--color-indigo)" },
                    { label: "Watch Time", value: `${Math.floor(totalWatchTime / 60)}m`, icon: ChevronRight, color: "cyan", cssColor: "var(--color-cyan)" },
                ].map((stat, i) => (
                    <PrismaticCard key={i} glowColor={stat.color as any} static>
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
