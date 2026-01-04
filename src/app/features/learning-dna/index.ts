/**
 * Learning DNA Feature
 *
 * Cross-platform learning profile that aggregates achievements from
 * external platforms (GitHub, Stack Overflow, LeetCode, Coursera, etc.)
 * into a unified "Learning DNA" score.
 */

// Components
export {
    DNAScoreCard,
    PlatformConnectionCard,
    PlatformGrid,
    SkillRadar,
    SignalTimeline,
    LearningDNADashboard,
} from "./components";

// Library
export {
    // Types
    type ExternalPlatform,
    type ConnectionStatus,
    type PlatformConnection,
    type SignalCategory,
    type ExternalAchievementSignal,
    type GitHubSignals,
    type StackOverflowSignals,
    type LeetCodeSignals,
    type CourseSignals,
    type DerivedSkillProficiency,
    type LearningDNADimensions,
    type LearningDNAProfile,
    type CareerReadinessAssessment,
    type PlatformSyncStatus,
    type PlatformConfig,
    // Platform config
    PLATFORM_CONFIGS,
    getPlatformConfig,
    getAllPlatformConfigs,
    createInitialPlatformConnection,
    getOAuthPlatforms,
    getManualPlatforms,
    // Calculator
    extractGitHubSignals,
    extractStackOverflowSignals,
    extractLeetCodeSignals,
    extractCourseSignals,
    calculateDimensions,
    deriveSkillProficiencies,
    calculateOverallScore,
    buildLearningDNAProfile,
    // Storage
    saveLearningDNAProfile,
    loadLearningDNAProfile,
    clearLearningDNAProfile,
    getInitialPlatformConnections,
    savePlatformConnections,
    loadPlatformConnections,
    updatePlatformConnection,
    disconnectPlatform,
    getInitialSyncStatus,
    saveSyncStatus,
    loadSyncStatus,
    updateSyncStatus,
    generateMockLearningDNAProfile,
    // Hook
    useLearningDNA,
} from "./lib";

// Feature variant export for module system
export const learningDNAVariants = [
    { name: "Dashboard", key: "dashboard" },
];
