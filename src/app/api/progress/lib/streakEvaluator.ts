// @ts-nocheck
// ============================================================================
// Streak Evaluator
// Server-side streak tracking and evaluation
// ============================================================================

import { createClient } from "@/lib/supabase/server";

export interface StreakResult {
    current: number;
    longest: number;
    updated: boolean;
    wasReset: boolean;
    isNewRecord: boolean;
}

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastCompletedAt: string | null;
    timezone: string | null;
}

/**
 * Get user's local date from their timezone
 */
export function getUserLocalDate(timezone: string | null): Date {
    const tz = timezone || "UTC";
    const now = new Date();

    try {
        // Get the date string in user's timezone
        const dateStr = now.toLocaleDateString("en-CA", { timeZone: tz }); // en-CA gives YYYY-MM-DD format
        return new Date(dateStr + "T00:00:00");
    } catch {
        // Fallback to UTC if timezone is invalid
        return new Date(now.toISOString().split("T")[0] + "T00:00:00");
    }
}

/**
 * Get the date portion only (YYYY-MM-DD) for a given date
 */
export function getDateOnly(date: Date): string {
    return date.toISOString().split("T")[0];
}

/**
 * Calculate days between two dates (ignoring time)
 */
export function daysBetween(date1: Date, date2: Date): number {
    const d1 = new Date(getDateOnly(date1));
    const d2 = new Date(getDateOnly(date2));
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date1 is yesterday relative to date2
 */
export function isYesterday(date1: Date, date2: Date): boolean {
    return daysBetween(date1, date2) === 1;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return getDateOnly(date1) === getDateOnly(date2);
}

/**
 * Evaluate and update user's streak based on completion
 * Returns the new streak state
 */
export async function evaluateStreak(userId: string): Promise<StreakResult> {
    const supabase = await createClient();

    // Get user's current streak data
    const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("current_streak, longest_streak, last_completed_at, timezone")
        .eq("id", userId)
        .single();

    if (profileError || !profile) {
        throw new Error("Failed to fetch user profile for streak evaluation");
    }

    const streakData: StreakData = {
        currentStreak: profile.current_streak || 0,
        longestStreak: profile.longest_streak || 0,
        lastCompletedAt: profile.last_completed_at,
        timezone: profile.timezone,
    };

    // Get user's local "today"
    const userToday = getUserLocalDate(streakData.timezone);

    // First completion ever
    if (!streakData.lastCompletedAt) {
        const newStreak = 1;
        await updateUserStreak(supabase, userId, newStreak, Math.max(newStreak, streakData.longestStreak));

        return {
            current: newStreak,
            longest: Math.max(newStreak, streakData.longestStreak),
            updated: true,
            wasReset: false,
            isNewRecord: newStreak > streakData.longestStreak,
        };
    }

    // Parse last completion date
    const lastCompletedDate = new Date(streakData.lastCompletedAt);
    const lastCompletedLocal = getUserLocalDate(streakData.timezone);

    // Adjust lastCompletedLocal to match the stored date
    const storedDateStr = streakData.lastCompletedAt.split("T")[0];
    const storedDate = new Date(storedDateStr + "T00:00:00");

    const daysDiff = daysBetween(storedDate, userToday);

    // Same day - no change (already counted today)
    if (daysDiff === 0) {
        return {
            current: streakData.currentStreak,
            longest: streakData.longestStreak,
            updated: false,
            wasReset: false,
            isNewRecord: false,
        };
    }

    // Yesterday - increment streak
    if (daysDiff === 1) {
        const newStreak = streakData.currentStreak + 1;
        const newLongest = Math.max(newStreak, streakData.longestStreak);
        await updateUserStreak(supabase, userId, newStreak, newLongest);

        return {
            current: newStreak,
            longest: newLongest,
            updated: true,
            wasReset: false,
            isNewRecord: newStreak > streakData.longestStreak,
        };
    }

    // More than 1 day gap - reset streak
    const newStreak = 1;
    await updateUserStreak(supabase, userId, newStreak, streakData.longestStreak);

    return {
        current: newStreak,
        longest: streakData.longestStreak,
        updated: true,
        wasReset: true,
        isNewRecord: false,
    };
}

/**
 * Update user's streak in database
 */
async function updateUserStreak(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    currentStreak: number,
    longestStreak: number
): Promise<void> {
    const { error } = await supabase
        .from("user_profiles")
        .update({
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_completed_at: new Date().toISOString(),
        })
        .eq("id", userId);

    if (error) {
        throw new Error(`Failed to update streak: ${error.message}`);
    }
}

/**
 * Get streak info without updating (for display purposes)
 */
export async function getStreakInfo(userId: string): Promise<StreakData> {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("current_streak, longest_streak, last_completed_at, timezone")
        .eq("id", userId)
        .single();

    if (error || !profile) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastCompletedAt: null,
            timezone: null,
        };
    }

    return {
        currentStreak: profile.current_streak || 0,
        longestStreak: profile.longest_streak || 0,
        lastCompletedAt: profile.last_completed_at,
        timezone: profile.timezone,
    };
}

/**
 * Check if user's streak is at risk (didn't complete today yet, last was yesterday)
 */
export function isStreakAtRisk(lastCompletedAt: string | null, timezone: string | null): boolean {
    if (!lastCompletedAt) return false;

    const userToday = getUserLocalDate(timezone);
    const storedDate = new Date(lastCompletedAt.split("T")[0] + "T00:00:00");
    const daysDiff = daysBetween(storedDate, userToday);

    // If last completion was yesterday and user hasn't completed today, streak is at risk
    return daysDiff === 1;
}
