/**
 * Curriculum Generator Library Exports
 *
 * Central export for all curriculum generator library modules.
 */

// Types
export * from "./types";

// Curriculum Generation
export {
    generateCurriculum,
    generateLessons,
    generateExercises,
    generateQuiz,
    generateProject,
    generateMockCurriculum,
    generateCacheKey,
    assembleCurriculum,
} from "./curriculumGenerator";

// Prompt Building
export {
    CURRICULUM_SYSTEM_MESSAGE,
    buildLessonPrompt,
    buildExercisePrompt,
    buildQuizPrompt,
    buildProjectPrompt,
    buildFullCurriculumPrompt,
} from "./promptBuilder";

// Storage (includes semantic cache integration)
export {
    curriculumStorage,
    getCachedCurriculum,
    cacheCurriculum,
    removeCachedCurriculum,
    clearCurriculumCache,
    cleanupExpiredCache,
    getCacheStats,
    getSemanticCachedCurriculum,
    cacheSemanticCurriculum,
    getSemanticCacheStats,
    getCombinedCacheStats,
    clearAllCaches,
    cleanupAllCaches,
    type CombinedCacheStats,
} from "./curriculumStorage";

// Semantic Fingerprinting
export {
    generateSemanticFingerprint,
    getConceptEmbedding,
    getRoleEmbedding,
    cosineSimilarity,
    combineEmbeddings,
    findBestSemanticMatch,
    shouldUseDeltaRegeneration,
    createDeltaRequest,
    computeFingerprintSimilarity,
    areRequestsSemanticallySimilar,
    getRequestSimilarity,
    generateSemanticCacheMetadata,
    SEMANTIC_SIMILARITY_THRESHOLD,
    FULL_REUSE_THRESHOLD,
    type ConceptEmbedding,
    type ConceptDomain,
    type SemanticFingerprint,
    type SemanticCacheMatch,
    type DeltaGenerationRequest,
    type SemanticCacheMetadata,
} from "./semanticFingerprinting";

// Semantic Cache
export {
    semanticCache,
    semanticLookup,
    storeSemanticCache,
    getSemanticCacheByKey,
    removeSemanticCacheEntry,
    clearSemanticCache,
    cleanupSemanticCache,
    mergeDeltaCurriculum,
    getSemanticCacheStats as getSemanticCacheStatsDirectly,
    type SemanticCacheEntry,
    type SemanticLookupResult,
} from "./semanticCache";

// Hooks
export {
    useCurriculum,
    type UseCurriculumOptions,
    type UseCurriculumReturn,
    type CurriculumProgress,
} from "./useCurriculum";

export {
    useCareerOracleCurriculum,
    type UseCareerOracleCurriculumOptions,
    type UseCareerOracleCurriculumReturn,
    type OracleUserProfile,
    type PathCurriculumProgress,
    type ContentCompletionDetails,
} from "./useCareerOracleCurriculum";

// Mastery Signal System
export {
    // Signal generation
    generateMasterySignal,
    calculateCompletionMetrics,
    deriveMasteryLevel,
    aggregateSkillProficiency,
    // Path recalibration
    generateDifficultyAdjustment,
    generatePacingAdjustment,
    generatePathRecommendations,
    generatePathRecalibration,
    // Utilities
    masterySignalUtils,
    // Constants
    EXPECTED_TIMES,
    TYPICAL_HINTS,
    MASTERY_THRESHOLDS,
    // Types
    type MasteryLevel,
    type MasterySignal,
    type CompletionMetrics,
    type SkillProficiency,
    type ProficiencyHistoryPoint,
    type DifficultyAdjustment,
    type PacingAdjustment,
    type PathRecalibration,
    type PathRecommendation,
} from "./masterySignal";

// Mastery Storage
export {
    masteryStorage,
    storeMasterySignal,
    getUserMasterySignals,
    getSkillMasterySignals,
    getRecentMasterySignals,
    getContentMasterySignals,
    updateSkillProficiency,
    getSkillProficiency,
    getUserSkillProficiencies,
    recalculateUserProficiencies,
    generateAndStoreRecalibration,
    getPathRecalibration,
    getPathDifficultyAdjustments,
    getPathPacingAdjustments,
    getMasteryAnalytics,
    getSkillsNeedingAttention,
    getHighPerformingSkills,
    cleanupOldSignals,
    clearUserMasteryData,
    type MasteryAnalytics,
} from "./masteryStorage";
