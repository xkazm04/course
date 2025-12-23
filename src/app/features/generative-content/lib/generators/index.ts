/**
 * Content Generators Index
 * Central exports for all content generation modules
 */

// Job management
export {
    createGenerationJob,
    getGenerationJob,
    updateJobProgress,
    removeJob,
    getAllJobs,
    getJobsByStatus,
} from "./jobManager";

// Video generation
export { generateVideoScript } from "./videoGenerator";

// Code example generation
export { generateCodeExamples } from "./codeGenerator";

// Quiz question generation
export { generateQuizQuestions } from "./quizGenerator";

// Key points generation
export { generateKeyPoints } from "./keyPointsGenerator";

// Content slot generation
export { generateContentSlots } from "./slotGenerator";
export type { SectionContent } from "./slotGenerator";

// Chapter generation (main orchestrator)
export { generateChapter } from "./chapterGenerator";

// Helper utilities
export {
    capitalize,
    getFileExtension,
    generateFilename,
    generateExpectedOutput,
    generateSectionDescription,
    generateConceptExplanation,
    generateCodeNarration,
    generateSampleCode,
    generateBestPractices,
    estimateSectionDuration,
    calculateTimeOffset,
    generateSectionTitle,
} from "./helpers";
