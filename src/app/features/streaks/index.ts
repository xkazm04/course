// Components
export {
    DailyGoalSelector,
    DailyProgressRing,
    StreakDisplay,
    Confetti,
    MilestoneCelebration,
    StreakWidget,
} from "./components";

// Hooks
export { useStreaks } from "./lib/useStreaks";
export type { UseStreaksReturn } from "./lib/useStreaks";

// Storage utilities
export {
    loadStreakData,
    saveStreakData,
    recordActivity,
    setDailyGoal,
    useStreakFreeze,
    addStreakFreezeTokens,
    getDailyGoalProgress,
    isDailyGoalMet,
    getMilestoneThresholds,
    clearStreakData,
    getTodayDateString,
} from "./lib/streakStorage";
export type { StreakData } from "./lib/streakStorage";
