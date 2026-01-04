// @ts-nocheck
// ============================================================================
// Achievement Evaluator
// Server-side achievement checking and unlocking
// ============================================================================

import { createClient } from "@/lib/supabase/server";

export interface Achievement {
    id: string;
    slug: string;
    title: string;
    description: string;
    achievement_type: string;
    xp_reward: number;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    icon: string;
    color: string;
    requirement_json: AchievementCriteria;
}

export interface AchievementCriteria {
    type: "chapters_completed" | "streak_days" | "learning_paths_completed" | "skill_proficiency";
    count?: number;
    level?: string;
}

export interface UserAchievementProgress {
    achievementId: string;
    progress: number;
    isUnlocked: boolean;
    unlockedAt: string | null;
}

export interface AchievementCheckResult {
    newlyUnlocked: Achievement[];
    totalXpEarned: number;
    progressUpdates: Array<{
        achievement: Achievement;
        previousProgress: number;
        newProgress: number;
    }>;
}

export interface ProgressEvent {
    type: "chapter_completed" | "path_completed" | "streak_updated" | "skill_advanced";
    streakDays?: number;
    chaptersCompleted?: number;
    pathsCompleted?: number;
    advancedSkills?: number;
}

/**
 * Get all achievements from the database
 */
export async function getAllAchievements(): Promise<Achievement[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("rarity", { ascending: true });

    if (error) {
        console.error("Failed to fetch achievements:", error);
        return [];
    }

    return data as Achievement[];
}

/**
 * Get user's achievement progress
 */
export async function getUserAchievementProgress(userId: string): Promise<Map<string, UserAchievementProgress>> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_id, progress, is_unlocked, unlocked_at")
        .eq("user_id", userId);

    if (error) {
        console.error("Failed to fetch user achievements:", error);
        return new Map();
    }

    const progressMap = new Map<string, UserAchievementProgress>();
    for (const ua of data || []) {
        progressMap.set(ua.achievement_id, {
            achievementId: ua.achievement_id,
            progress: ua.progress || 0,
            isUnlocked: ua.is_unlocked || false,
            unlockedAt: ua.unlocked_at,
        });
    }

    return progressMap;
}

/**
 * Get user's current stats for achievement evaluation
 */
export async function getUserStats(userId: string): Promise<{
    chaptersCompleted: number;
    pathsCompleted: number;
    currentStreak: number;
    advancedSkills: number;
}> {
    const supabase = await createClient();

    // Get chapters completed count
    const { count: chaptersCount } = await supabase
        .from("chapter_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed");

    // Get learning paths completed count
    const { count: pathsCount } = await supabase
        .from("learning_path_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed");

    // Get current streak
    const { data: profile } = await supabase
        .from("user_profiles")
        .select("current_streak")
        .eq("id", userId)
        .single();

    // Get advanced skills count
    const { count: advancedSkillsCount } = await supabase
        .from("user_skills")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("proficiency", "advanced");

    return {
        chaptersCompleted: chaptersCount || 0,
        pathsCompleted: pathsCount || 0,
        currentStreak: profile?.current_streak || 0,
        advancedSkills: advancedSkillsCount || 0,
    };
}

/**
 * Calculate progress for a specific achievement
 */
function calculateProgress(criteria: AchievementCriteria, stats: ReturnType<typeof getUserStats> extends Promise<infer T> ? T : never): number {
    switch (criteria.type) {
        case "chapters_completed":
            return Math.min(100, Math.round((stats.chaptersCompleted / (criteria.count || 1)) * 100));

        case "streak_days":
            return Math.min(100, Math.round((stats.currentStreak / (criteria.count || 1)) * 100));

        case "learning_paths_completed":
            return Math.min(100, Math.round((stats.pathsCompleted / (criteria.count || 1)) * 100));

        case "skill_proficiency":
            return Math.min(100, Math.round((stats.advancedSkills / (criteria.count || 1)) * 100));

        default:
            return 0;
    }
}

/**
 * Check if achievement criteria is met
 */
function isCriteriaMet(criteria: AchievementCriteria, stats: ReturnType<typeof getUserStats> extends Promise<infer T> ? T : never): boolean {
    switch (criteria.type) {
        case "chapters_completed":
            return stats.chaptersCompleted >= (criteria.count || 1);

        case "streak_days":
            return stats.currentStreak >= (criteria.count || 1);

        case "learning_paths_completed":
            return stats.pathsCompleted >= (criteria.count || 1);

        case "skill_proficiency":
            // For skill proficiency, we need at least 1 advanced skill
            return stats.advancedSkills >= (criteria.count || 1);

        default:
            return false;
    }
}

/**
 * Evaluate all achievements for a user after a progress event
 */
export async function evaluateAchievements(userId: string, event: ProgressEvent): Promise<AchievementCheckResult> {
    const supabase = await createClient();

    // Get all achievements
    const achievements = await getAllAchievements();

    // Get user's current achievement progress
    const userProgress = await getUserAchievementProgress(userId);

    // Get user's current stats
    const stats = await getUserStats(userId);

    const newlyUnlocked: Achievement[] = [];
    const progressUpdates: AchievementCheckResult["progressUpdates"] = [];
    let totalXpEarned = 0;

    for (const achievement of achievements) {
        const currentProgress = userProgress.get(achievement.id);

        // Skip already unlocked achievements
        if (currentProgress?.isUnlocked) {
            continue;
        }

        const criteria = achievement.requirement_json as AchievementCriteria;
        const newProgress = calculateProgress(criteria, stats);
        const previousProgress = currentProgress?.progress || 0;

        // Check if newly unlocked
        if (isCriteriaMet(criteria, stats)) {
            // Unlock achievement
            await unlockAchievement(supabase, userId, achievement.id);
            newlyUnlocked.push(achievement);
            totalXpEarned += achievement.xp_reward;
        } else if (newProgress !== previousProgress) {
            // Update progress
            await updateAchievementProgress(supabase, userId, achievement.id, newProgress);
        }

        if (newProgress !== previousProgress || isCriteriaMet(criteria, stats)) {
            progressUpdates.push({
                achievement,
                previousProgress,
                newProgress: isCriteriaMet(criteria, stats) ? 100 : newProgress,
            });
        }
    }

    // Add achievement XP to user's total
    if (totalXpEarned > 0) {
        await addAchievementXp(supabase, userId, totalXpEarned);
    }

    return {
        newlyUnlocked,
        totalXpEarned,
        progressUpdates,
    };
}

/**
 * Unlock an achievement for a user
 */
async function unlockAchievement(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    achievementId: string
): Promise<void> {
    const { error } = await supabase
        .from("user_achievements")
        .upsert({
            user_id: userId,
            achievement_id: achievementId,
            progress: 100,
            is_unlocked: true,
            unlocked_at: new Date().toISOString(),
        }, {
            onConflict: "user_id,achievement_id",
        });

    if (error) {
        console.error("Failed to unlock achievement:", error);
    }
}

/**
 * Update achievement progress
 */
async function updateAchievementProgress(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    achievementId: string,
    progress: number
): Promise<void> {
    const { error } = await supabase
        .from("user_achievements")
        .upsert({
            user_id: userId,
            achievement_id: achievementId,
            progress,
            is_unlocked: false,
        }, {
            onConflict: "user_id,achievement_id",
        });

    if (error) {
        console.error("Failed to update achievement progress:", error);
    }
}

/**
 * Add achievement XP to user's total
 */
async function addAchievementXp(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    xp: number
): Promise<void> {
    const { data: profile } = await supabase
        .from("user_profiles")
        .select("total_xp")
        .eq("id", userId)
        .single();

    if (profile) {
        await supabase
            .from("user_profiles")
            .update({ total_xp: (profile.total_xp || 0) + xp })
            .eq("id", userId);
    }
}

/**
 * Get achievement with unlock status for a user
 */
export async function getAchievementsWithStatus(userId: string): Promise<Array<Achievement & { progress: number; isUnlocked: boolean; unlockedAt: string | null }>> {
    const achievements = await getAllAchievements();
    const userProgress = await getUserAchievementProgress(userId);
    const stats = await getUserStats(userId);

    return achievements.map(achievement => {
        const progress = userProgress.get(achievement.id);
        const criteria = achievement.requirement_json as AchievementCriteria;

        return {
            ...achievement,
            progress: progress?.isUnlocked ? 100 : (progress?.progress || calculateProgress(criteria, stats)),
            isUnlocked: progress?.isUnlocked || false,
            unlockedAt: progress?.unlockedAt || null,
        };
    });
}
