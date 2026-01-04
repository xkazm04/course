"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useForge } from "../../layout";
import { XPLevelCard } from "./XPLevelCard";
import { StreakCard } from "./StreakCard";
import { AchievementsGrid } from "./AchievementsGrid";
import { LearningPathsSection } from "./LearningPathsSection";
import { SkillsOverview } from "./SkillsOverview";
import { EmptyState } from "./EmptyState";
import { StatsRow } from "./StatsRow";

export interface ProgressData {
    xp: {
        total: number;
        level: number;
        xpToNextLevel: number;
        xpForCurrentLevel: number;
        levelProgress: number;
        milestones: Array<{ level: number; totalXp: number; effort: string }>;
    };
    streak: {
        current: number;
        longest: number;
        lastActivityDate: string | null;
        atRisk: boolean;
    };
    achievements: {
        list: Array<{
            id: string;
            slug: string;
            title: string;
            description: string;
            type: string;
            xpReward: number;
            rarity: string;
            icon: string;
            color: string;
            progress: number;
            isUnlocked: boolean;
            unlockedAt: string | null;
        }>;
        unlockedCount: number;
        totalCount: number;
    };
    skills: {
        topSkills: Array<{
            id: string;
            name: string;
            category: string;
            proficiency: string;
            xpEarned: number;
        }>;
        totalSkills: number;
    };
    paths: {
        active: Array<{
            id: string;
            pathId: string;
            title: string;
            description: string | null;
            status: string;
            progressPercent: number;
            startedAt: string;
        }>;
        completed: Array<{
            id: string;
            pathId: string;
            title: string;
            description: string | null;
            status: string;
            progressPercent: number;
            startedAt: string;
            completedAt: string | null;
        }>;
    };
    stats: {
        chaptersCompleted: number;
        coursesCompleted: number;
        totalLearningTime: number;
    };
}

export function MyProgressView() {
    const { isAuthenticated, isLoading: authLoading } = useForge();
    const [progressData, setProgressData] = useState<ProgressData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProgress = async () => {
            if (!isAuthenticated) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch("/api/progress/summary");
                const data = await response.json();

                if (data.success && data.data) {
                    setProgressData(data.data);
                } else {
                    setError(data.error || "Failed to load progress");
                }
            } catch (err) {
                setError("Failed to load progress data");
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading) {
            fetchProgress();
        }
    }, [isAuthenticated, authLoading]);

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--ember)]" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <EmptyState type="not-authenticated" />;
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-[var(--forge-text-muted)]">{error}</p>
            </div>
        );
    }

    if (!progressData) {
        return <EmptyState type="no-progress" />;
    }

    const hasAnyProgress = progressData.xp.total > 0 ||
        progressData.streak.current > 0 ||
        progressData.achievements.unlockedCount > 0 ||
        progressData.paths.active.length > 0;

    if (!hasAnyProgress) {
        return <EmptyState type="no-progress" />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6"
        >
            {/* XP Level Hero Card */}
            <XPLevelCard
                level={progressData.xp.level}
                totalXp={progressData.xp.total}
                xpToNextLevel={progressData.xp.xpToNextLevel}
                xpForCurrentLevel={progressData.xp.xpForCurrentLevel}
                levelProgress={progressData.xp.levelProgress}
            />

            {/* Streak and Stats Row */}
            <div className="grid md:grid-cols-2 gap-6">
                <StreakCard
                    currentStreak={progressData.streak.current}
                    longestStreak={progressData.streak.longest}
                    atRisk={progressData.streak.atRisk}
                    lastActivityDate={progressData.streak.lastActivityDate}
                />
                <StatsRow
                    chaptersCompleted={progressData.stats.chaptersCompleted}
                    coursesCompleted={progressData.stats.coursesCompleted}
                    totalLearningTime={progressData.stats.totalLearningTime}
                    pathsActive={progressData.paths.active.length}
                />
            </div>

            {/* Achievements Section */}
            <AchievementsGrid achievements={progressData.achievements.list} />

            {/* Learning Paths Section */}
            <LearningPathsSection
                activePaths={progressData.paths.active}
                completedPaths={progressData.paths.completed}
            />

            {/* Skills Overview */}
            {progressData.skills.topSkills.length > 0 && (
                <SkillsOverview skills={progressData.skills.topSkills} />
            )}
        </motion.div>
    );
}

export default MyProgressView;
