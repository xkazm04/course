/**
 * Learning DNA Library Exports
 */

// Types
export type {
    ExternalPlatform,
    ConnectionStatus,
    PlatformConnection,
    SignalCategory,
    ExternalAchievementSignal,
    GitHubSignals,
    StackOverflowSignals,
    LeetCodeSignals,
    CourseSignals,
    DerivedSkillProficiency,
    LearningDNADimensions,
    LearningDNAProfile,
    CareerReadinessAssessment,
    PlatformSyncStatus,
} from './types';

// Platform config
export {
    PLATFORM_CONFIGS,
    getPlatformConfig,
    getAllPlatformConfigs,
    createInitialPlatformConnection,
    getOAuthPlatforms,
    getManualPlatforms,
} from './platformConfig';
export type { PlatformConfig } from './platformConfig';

// Calculator
export {
    extractGitHubSignals,
    extractStackOverflowSignals,
    extractLeetCodeSignals,
    extractCourseSignals,
    calculateDimensions,
    deriveSkillProficiencies,
    calculateOverallScore,
    buildLearningDNAProfile,
} from './dnaCalculator';

// Storage
export {
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
} from './dnaStorage';

// Hook
export { useLearningDNA } from './useLearningDNA';
