"use client";

import { useState, useEffect, useCallback } from "react";
import {
    StreakData,
    loadStreakData,
    recordActivity,
    setDailyGoal,
    useStreakFreeze,
    addStreakFreezeTokens,
    getDailyGoalProgress,
    isDailyGoalMet,
    clearStreakData,
} from "./streakStorage";

export interface UseStreaksReturn {
    streakData: StreakData;
    dailyProgress: number;
    isGoalMet: boolean;
    isLoading: boolean;
    recordLearningTime: (minutes: number) => number | null; // Returns milestone if reached
    updateDailyGoal: (minutes: number) => void;
    useFreeze: () => boolean;
    addFreezeTokens: (count: number) => void;
    refresh: () => void;
    resetAll: () => void;
}

export const useStreaks = (): UseStreaksReturn => {
    const [streakData, setStreakData] = useState<StreakData>({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakFreezeTokens: 2,
        streakFreezeUsedDates: [],
        dailyGoalMinutes: 10,
        todayMinutes: 0,
        todayDate: null,
        milestonesReached: [],
        totalActiveDays: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(() => {
        const data = loadStreakData();
        setStreakData(data);
    }, []);

    // Load data on mount
    useEffect(() => {
        refresh();
        setIsLoading(false);
    }, [refresh]);

    const recordLearningTime = useCallback((minutes: number): number | null => {
        const { data, newMilestone } = recordActivity(minutes);
        setStreakData(data);
        return newMilestone;
    }, []);

    const updateDailyGoal = useCallback((minutes: number): void => {
        const data = setDailyGoal(minutes);
        setStreakData(data);
    }, []);

    const useFreeze = useCallback((): boolean => {
        const result = useStreakFreeze();
        if (result) {
            setStreakData(result);
            return true;
        }
        return false;
    }, []);

    const addFreezeTokens = useCallback((count: number): void => {
        const data = addStreakFreezeTokens(count);
        setStreakData(data);
    }, []);

    const resetAll = useCallback((): void => {
        clearStreakData();
        refresh();
    }, [refresh]);

    const dailyProgress = getDailyGoalProgress(streakData);
    const isGoalMet = isDailyGoalMet(streakData);

    return {
        streakData,
        dailyProgress,
        isGoalMet,
        isLoading,
        recordLearningTime,
        updateDailyGoal,
        useFreeze,
        addFreezeTokens,
        refresh,
        resetAll,
    };
};
