/**
 * Generative Content Engine Feature
 *
 * This feature enables AI-generated chapter content seeded by user learning path decisions.
 * When a learner navigates an unexplored path (e.g., 'React + GraphQL + Testing'),
 * the system generates scaffolded content including:
 * - Video scripts with timestamps
 * - Code examples that build progressively
 * - Quizzes calibrated to ChapterSection types
 * - Key points extracted from relevant documentation
 *
 * Content quality improves as users rate, annotate, and fork generated chapters.
 * The slot system becomes a generative grammar for content creation.
 */

// Components
export {
    PathExplorer,
    GeneratedChapterViewer,
    ContentRatingModal,
    ForkContentModal,
} from "./components";

// Types
export type {
    LearningPathSeed,
    ContentGenerationParams,
    VideoScriptSegment,
    GeneratedVideoScript,
    ProgressiveCodeExample,
    GeneratedQuizQuestion,
    GeneratedKeyPoints,
    GeneratedChapter,
    GeneratedChapterSection,
    ContentQualityMetrics,
    ContentRating,
    ContentAnnotation,
    ContentVersion,
    ContentFork,
    GenerationJob,
    SlotGenerationConfig,
} from "./lib";

// Library functions
export {
    // Type helpers
    createPathSeed,
    createDefaultGenerationParams,
    calculateQualityScore,
    SLOT_GENERATION_CONFIGS,

    // Content Generator
    generateChapter,
    createGenerationJob,
    getGenerationJob,

    // Storage
    pathStorage,
    savePath,
    getAllPaths,
    getPathById,
    saveChapter,
    getAllChapters,
    getChapterById,
    getChaptersByPathSeed,
    saveRating,
    getRatingsForContent,
    saveAnnotation,
    getAnnotationsForContent,
    saveVersion,
    getVersionsForContent,
    saveFork,
    getForksOfChapter,
    trackUserPath,
    getUserExploredPaths,
    updateQualityMetrics,
} from "./lib";

// React Hooks
export {
    useCurrentUser,
    useLearningPaths,
    useContentGeneration,
    useGeneratedChapters,
    useContentRating,
    useContentAnnotations,
    useContentVersions,
    useContentForking,
    useGenerativeContentManager,
} from "./lib";
