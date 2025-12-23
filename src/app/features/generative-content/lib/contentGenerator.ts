/**
 * Content Generation Service
 *
 * This module provides the AI-powered content generation service that creates
 * scaffolded chapter content based on user learning path seeds. It leverages
 * the slot system as a generative grammar to produce consistent, high-quality
 * educational content.
 *
 * The implementation is split into focused modules for maintainability:
 * - jobManager: Generation job lifecycle management
 * - videoGenerator: Video script generation
 * - codeGenerator: Progressive code example generation
 * - quizGenerator: Quiz question generation
 * - keyPointsGenerator: Key points and summaries
 * - slotGenerator: Content slot assembly
 * - chapterGenerator: Main orchestration
 * - helpers: Shared utility functions
 */

// Re-export all generators from centralized location
export {
    // Job management
    createGenerationJob,
    getGenerationJob,
    updateJobProgress,
    removeJob,
    getAllJobs,
    getJobsByStatus,

    // Content generators
    generateVideoScript,
    generateCodeExamples,
    generateQuizQuestions,
    generateKeyPoints,
    generateContentSlots,
    generateChapter,

    // Helpers
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
} from "./generators";

// Re-export types for convenience
export type { SectionContent } from "./generators";
