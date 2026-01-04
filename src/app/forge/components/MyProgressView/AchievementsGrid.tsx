"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { AchievementCard } from "./AchievementCard";

interface Achievement {
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
}

interface AchievementsGridProps {
    achievements: Achievement[];
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

    // Sort: unlocked first, then by rarity (legendary > epic > rare > uncommon > common)
    const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
    const sortedAchievements = [...achievements].sort((a, b) => {
        if (a.isUnlocked !== b.isUnlocked) {
            return a.isUnlocked ? -1 : 1;
        }
        return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) -
               (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0);
    });

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-lg overflow-hidden"
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-[var(--gold)]/10">
                            <Trophy className="w-5 h-5 text-[var(--gold)]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--forge-text-primary)]">
                                Achievements
                            </h3>
                            <p className="text-xs text-[var(--forge-text-muted)]">
                                {unlockedCount} of {achievements.length} unlocked
                            </p>
                        </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-[var(--forge-bg-elevated)]">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-[var(--gold)] to-orange-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <span className="text-sm font-medium text-[var(--forge-text-secondary)]">
                            {Math.round((unlockedCount / achievements.length) * 100)}%
                        </span>
                    </div>
                </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedAchievements.map((achievement, index) => (
                        <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                        >
                            <AchievementCard {...achievement} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}
