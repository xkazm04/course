/**
 * Streak Storage Library
 * Handles localStorage persistence for learning streaks with date-based tracking
 */

import { createLocalStorage } from "@/app/shared/lib/storageFactory";

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null; // ISO date string (YYYY-MM-DD)
    streakFreezeTokens: number;
    streakFreezeUsedDates: string[]; // ISO date strings when freeze was used
    dailyGoalMinutes: number; // 5, 10, 15, or 30
    todayMinutes: number;
    todayDate: string | null; // ISO date string
    milestonesReached: number[]; // Array of streak numbers achieved (7, 30, etc.)
    totalActiveDays: number;
}

const DEFAULT_STREAK_DATA: StreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    streakFreezeTokens: 2, // Start with 2 freeze tokens
    streakFreezeUsedDates: [],
    dailyGoalMinutes: 10,
    todayMinutes: 0,
    todayDate: null,
    milestonesReached: [],
    totalActiveDays: 0,
};

const MILESTONE_THRESHOLDS = [7, 14, 30, 60, 100, 365];

// Create storage using the factory
const streakStorage = createLocalStorage<StreakData>({
    storageKey: "learning-streaks",
    getDefault: () => DEFAULT_STREAK_DATA,
});

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export const getTodayDateString = (): string => {
    const now = new Date();
    return now.toISOString().split("T")[0];
};

/**
 * Get yesterday's date in ISO format (YYYY-MM-DD)
 */
export const getYesterdayDateString = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
};

/**
 * Calculate the day difference between two ISO date strings
 */
export const getDaysDifference = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Load streak data from localStorage
 */
export const loadStreakData = (): StreakData => {
    const data = streakStorage.get();
    return validateAndUpdateStreak(data);
};

/**
 * Save streak data to localStorage
 */
export const saveStreakData = (data: StreakData): void => {
    streakStorage.save(data);
};

/**
 * Validate and update streak based on current date
 * This handles streak continuation, breaking, and freeze usage
 */
export const validateAndUpdateStreak = (data: StreakData): StreakData => {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    const updatedData = { ...data };

    // Reset today's minutes if it's a new day
    if (data.todayDate !== today) {
        updatedData.todayMinutes = 0;
        updatedData.todayDate = today;
    }

    // If no activity ever, return as-is
    if (!data.lastActivityDate) {
        return updatedData;
    }

    // Check if streak should be broken
    const daysSinceLastActivity = getDaysDifference(data.lastActivityDate, today);

    // If last activity was today or yesterday, streak is fine
    if (data.lastActivityDate === today || data.lastActivityDate === yesterday) {
        return updatedData;
    }

    // If more than 1 day has passed, check for streak freeze
    if (daysSinceLastActivity > 1) {
        // Check if freeze was used yesterday (covers the gap)
        const freezeUsedYesterday = data.streakFreezeUsedDates.includes(yesterday);

        if (freezeUsedYesterday) {
            // Streak was saved by freeze
            return updatedData;
        }

        // Check if we can use a freeze now (auto-use if available)
        if (data.streakFreezeTokens > 0 && daysSinceLastActivity === 2) {
            // Auto-use freeze token to save streak
            updatedData.streakFreezeTokens = data.streakFreezeTokens - 1;
            updatedData.streakFreezeUsedDates = [...data.streakFreezeUsedDates, yesterday];
            return updatedData;
        }

        // Streak is broken
        updatedData.currentStreak = 0;
        return updatedData;
    }

    return updatedData;
};

/**
 * Record learning activity (minutes spent learning)
 */
export const recordActivity = (minutes: number): { data: StreakData; newMilestone: number | null } => {
    const data = loadStreakData();
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    const updatedData: StreakData = { ...data };

    // Update today's minutes
    if (data.todayDate === today) {
        updatedData.todayMinutes = data.todayMinutes + minutes;
    } else {
        updatedData.todayMinutes = minutes;
        updatedData.todayDate = today;
    }

    // Check if daily goal is met and we should extend the streak
    const goalMet = updatedData.todayMinutes >= data.dailyGoalMinutes;
    const wasGoalMet = data.todayDate === today && data.todayMinutes >= data.dailyGoalMinutes;

    // Only count the first time goal is met today
    if (goalMet && !wasGoalMet) {
        // Determine if this extends the streak or starts a new one
        if (data.lastActivityDate === yesterday || data.lastActivityDate === today) {
            // Continuing streak
            if (data.lastActivityDate !== today) {
                updatedData.currentStreak = data.currentStreak + 1;
                updatedData.totalActiveDays = data.totalActiveDays + 1;
            }
        } else if (data.lastActivityDate === null || getDaysDifference(data.lastActivityDate, today) > 1) {
            // Starting new streak (or first ever)
            updatedData.currentStreak = 1;
            updatedData.totalActiveDays = data.totalActiveDays + 1;
        }

        updatedData.lastActivityDate = today;

        // Update longest streak
        if (updatedData.currentStreak > updatedData.longestStreak) {
            updatedData.longestStreak = updatedData.currentStreak;
        }
    }

    // Check for new milestones
    let newMilestone: number | null = null;
    for (const milestone of MILESTONE_THRESHOLDS) {
        if (updatedData.currentStreak >= milestone && !data.milestonesReached.includes(milestone)) {
            updatedData.milestonesReached = [...data.milestonesReached, milestone];
            newMilestone = milestone;
            break;
        }
    }

    saveStreakData(updatedData);
    return { data: updatedData, newMilestone };
};

/**
 * Set the daily goal in minutes
 */
export const setDailyGoal = (minutes: number): StreakData => {
    const data = loadStreakData();
    const updatedData: StreakData = {
        ...data,
        dailyGoalMinutes: minutes,
    };
    saveStreakData(updatedData);
    return updatedData;
};

/**
 * Use a streak freeze token (manually)
 */
export const useStreakFreeze = (): StreakData | null => {
    const data = loadStreakData();

    if (data.streakFreezeTokens <= 0) {
        return null;
    }

    const today = getTodayDateString();
    const updatedData: StreakData = {
        ...data,
        streakFreezeTokens: data.streakFreezeTokens - 1,
        streakFreezeUsedDates: [...data.streakFreezeUsedDates, today],
    };

    saveStreakData(updatedData);
    return updatedData;
};

/**
 * Add streak freeze tokens (reward for milestones, etc.)
 */
export const addStreakFreezeTokens = (count: number): StreakData => {
    const data = loadStreakData();
    const updatedData: StreakData = {
        ...data,
        streakFreezeTokens: data.streakFreezeTokens + count,
    };
    saveStreakData(updatedData);
    return updatedData;
};

/**
 * Get the progress percentage toward daily goal
 */
export const getDailyGoalProgress = (data: StreakData): number => {
    if (data.dailyGoalMinutes === 0) return 100;
    return Math.min(100, Math.round((data.todayMinutes / data.dailyGoalMinutes) * 100));
};

/**
 * Check if daily goal is met for today
 */
export const isDailyGoalMet = (data: StreakData): boolean => {
    return data.todayMinutes >= data.dailyGoalMinutes;
};

/**
 * Get milestone thresholds
 */
export const getMilestoneThresholds = (): number[] => {
    return MILESTONE_THRESHOLDS;
};

/**
 * Clear all streak data (for testing/reset)
 */
export const clearStreakData = (): void => {
    streakStorage.clear();
};
