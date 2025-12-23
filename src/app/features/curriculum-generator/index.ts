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

// Storage functions
export { curriculumStorage } from "./lib/curriculumStorage";

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
} from "./lib/useCareerOracleCurriculum";

// Components
export {
    LessonViewer,
    CurriculumOverview,
    FeedbackModal,
    type FeedbackData,
} from "./components";
