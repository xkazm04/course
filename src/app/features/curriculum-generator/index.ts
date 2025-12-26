/**
 * AI Curriculum Generator Feature
 *
 * This feature provides LLM-powered curriculum content generation
 * integrated with the Career Oracle learning path system.
 *
 * Key capabilities:
 * - Personalized lesson outlines with sections and code snippets
 * - Code exercises with test cases and progressive hints
 * - Quizzes testing understanding with multiple question types
 * - Portfolio-worthy project specifications with milestones
 * - Content caching and reuse for community curation
 * - Feedback loop for continuous improvement
 * - Semantic deduplication for intelligent cache reuse (30-50% API reduction)
 */

// Types
export type {
    // Core curriculum types
    LessonOutline,
    LessonSection,
    CodeSnippet,
    Concept,
    DifficultyLevel,
    // Exercise types
    CodeExercise,
    ExerciseType,
    TestCase,
    CommonError,
    // Quiz types
    Quiz,
    QuizQuestion,
    QuestionType,
    QuizOption,
    // Project types
    ProjectSpecification,
    ProjectMilestone,
    ProjectDeliverable,
    StarterResource,
    EvaluationCriterion,
    // Generated curriculum
    GeneratedCurriculum,
    GenerationMetadata,
    UserProfileSnapshot,
    // Feedback types
    ContentFeedback,
    ContentQualityMetrics,
    CompletionData,
    // Request/Response types
    CurriculumGenerationRequest,
    CurriculumGenerationResponse,
    FeedbackSubmissionRequest,
    FeedbackSubmissionResponse,
    // Cache types
    CurriculumCacheEntry,
    CacheStats,
} from "./lib/types";

// Generator functions
export {
    generateCurriculum,
    generateLessons,
    generateExercises,
    generateQuiz,
    generateProject,
    generateMockCurriculum,
    generateCacheKey,
    assembleCurriculum,
} from "./lib/curriculumGenerator";

// Storage functions (includes semantic cache integration)
export {
    curriculumStorage,
    type CombinedCacheStats,
} from "./lib/curriculumStorage";

// Semantic Fingerprinting & Cache
export {
    // Fingerprinting functions
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
    // Thresholds
    SEMANTIC_SIMILARITY_THRESHOLD,
    FULL_REUSE_THRESHOLD,
    // Types
    type ConceptEmbedding,
    type ConceptDomain,
    type SemanticFingerprint,
    type SemanticCacheMatch,
    type DeltaGenerationRequest,
    type SemanticCacheMetadata,
} from "./lib/semanticFingerprinting";

export {
    // Semantic cache operations
    semanticCache,
    semanticLookup,
    storeSemanticCache,
    mergeDeltaCurriculum,
    // Types
    type SemanticCacheEntry,
    type SemanticLookupResult,
} from "./lib/semanticCache";

// Hooks
export {
    useCurriculum,
    type UseCurriculumOptions,
    type UseCurriculumReturn,
    type CurriculumProgress,
} from "./lib/useCurriculum";

export {
    useCareerOracleCurriculum,
    type UseCareerOracleCurriculumOptions,
    type UseCareerOracleCurriculumReturn,
    type OracleUserProfile,
    type PathCurriculumProgress,
    type ContentCompletionDetails,
} from "./lib/useCareerOracleCurriculum";

// Mastery Signal System - Implicit Skill Validation
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
} from "./lib/masterySignal";

// Mastery Storage
export {
    masteryStorage,
    storeMasterySignal,
    getUserMasterySignals,
    getSkillMasterySignals,
    getRecentMasterySignals,
    updateSkillProficiency,
    getSkillProficiency,
    getUserSkillProficiencies,
    recalculateUserProficiencies,
    generateAndStoreRecalibration,
    getPathRecalibration,
    getMasteryAnalytics,
    getSkillsNeedingAttention,
    getHighPerformingSkills,
    type MasteryAnalytics,
} from "./lib/masteryStorage";

// Components
export {
    LessonViewer,
    CurriculumOverview,
    FeedbackModal,
    type FeedbackData,
} from "./components";
