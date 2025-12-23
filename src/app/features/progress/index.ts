// Types
export * from "./lib/types";

// Storage functions
export {
    getProgressData,
    getCourseProgress,
    initializeCourseProgress,
    updateVideoProgress,
    setVideoPosition,
    markChapterCompleted,
    markSectionCompleted,
    saveQuizScore,
    updateLastAccessed,
    getContinueLearningItems,
    getAllCoursesProgress,
    getTotalWatchTime,
    getOverallCompletionRate,
    exportProgressData,
    downloadProgressData,
    importProgressData,
    clearCourseProgress,
    clearAllProgress,
    formatWatchTime,
} from "./lib/progressStorage";

// Hooks
export { useCourseProgress, useProgressOverview } from "./lib/useProgress";

// Context
export { ProgressProvider, useProgressContext } from "./lib/ProgressContext";

// Components
export {
    ProgressBar,
    CourseProgressCard,
    ContinueLearningButton,
    ContinueLearningSection,
    ProgressExportModal,
} from "./components";
