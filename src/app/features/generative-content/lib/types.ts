/**
 * Generative Content Engine Types
 *
 * This module defines the types for AI-generated chapter content seeded by
 * user learning path decisions. When a learner navigates an unexplored path
 * (e.g., 'React + GraphQL + Testing'), the system generates scaffolded content
 * that includes video scripts, code examples, quizzes, and key points.
 */

import type { ChapterSection, SectionType, CourseInfo } from "@/app/features/chapter/lib/chapterData";
import type { ContentSlot, SlotType } from "@/app/features/chapter/lib/contentSlots";
import type { LearningDomainId } from "@/app/shared/lib/learningDomains";

// ============================================================================
// USER PATH TYPES
// ============================================================================

/**
 * A unique path through the learning graph based on user selections.
 * Example: ["React", "GraphQL", "Testing"] or ["Node.js", "PostgreSQL", "Docker"]
 */
export interface LearningPathSeed {
    /** Unique identifier for this path combination */
    pathId: string;

    /** Array of topic/skill identifiers that make up this path */
    topics: string[];

    /** Associated learning domain */
    domainId: LearningDomainId;

    /** User's stated goal or intent */
    userGoal?: string;

    /** Skill level of the user */
    skillLevel: "beginner" | "intermediate" | "advanced";

    /** Timestamp when the path was first explored */
    createdAt: string;

    /** User ID who created this path */
    createdBy: string;
}

/**
 * Parameters for generating content based on a path seed
 */
export interface ContentGenerationParams {
    /** The learning path seed */
    pathSeed: LearningPathSeed;

    /** Target chapter index (for multi-chapter courses) */
    chapterIndex: number;

    /** Preferred content density */
    contentDensity: "concise" | "standard" | "comprehensive";

    /** Include code examples */
    includeCode: boolean;

    /** Include quizzes */
    includeQuizzes: boolean;

    /** Include video scripts */
    includeVideoScripts: boolean;

    /** Language preference for code examples */
    codeLanguage?: string;

    /** Additional context from user */
    additionalContext?: string;
}

// ============================================================================
// GENERATED CONTENT TYPES
// ============================================================================

/**
 * A video script segment with timestamps
 */
export interface VideoScriptSegment {
    /** Start time in seconds */
    startTime: number;

    /** End time in seconds */
    endTime: number;

    /** Speaker notes/narration text */
    narration: string;

    /** Visual cues for video production */
    visualCues?: string[];

    /** Code to display during this segment */
    codeToShow?: string;

    /** Key point being made */
    keyPoint?: string;
}

/**
 * A complete video script for a chapter section
 */
export interface GeneratedVideoScript {
    /** Section this script belongs to */
    sectionId: string;

    /** Title for the video */
    title: string;

    /** Estimated duration in minutes */
    estimatedDuration: number;

    /** Script segments with timestamps */
    segments: VideoScriptSegment[];

    /** Production notes */
    productionNotes?: string;
}

/**
 * A code example that builds progressively
 */
export interface ProgressiveCodeExample {
    /** Unique identifier */
    id: string;

    /** Title of the code example */
    title: string;

    /** Programming language */
    language: string;

    /** File name to display */
    filename: string;

    /** Steps that build upon each other */
    steps: Array<{
        /** Step index */
        stepIndex: number;

        /** Explanation for this step */
        explanation: string;

        /** Code at this step (cumulative) */
        code: string;

        /** Lines added in this step (for highlighting) */
        linesAdded?: number[];

        /** Lines modified in this step */
        linesModified?: number[];
    }>;

    /** Final complete code */
    finalCode: string;

    /** Expected output when run */
    expectedOutput?: string;
}

/**
 * A generated quiz question calibrated to section type
 */
export interface GeneratedQuizQuestion {
    /** Unique identifier */
    id: string;

    /** Question text */
    question: string;

    /** Question type based on ChapterSection type */
    questionType: "multiple_choice" | "code_completion" | "true_false" | "ordering";

    /** Options for multiple choice */
    options?: Array<{
        id: string;
        text: string;
        isCorrect: boolean;
    }>;

    /** Correct answer for code completion */
    correctCode?: string;

    /** Explanation of the correct answer */
    explanation: string;

    /** Difficulty level */
    difficulty: "easy" | "medium" | "hard";

    /** XP reward for correct answer */
    xpReward: number;

    /** Related section ID */
    sectionId: string;
}

/**
 * Key points extracted from documentation or generated content
 */
export interface GeneratedKeyPoints {
    /** Section this belongs to */
    sectionId: string;

    /** Title for the key points section */
    title: string;

    /** Array of key points */
    points: Array<{
        /** The key point text */
        text: string;

        /** Importance level */
        importance: "essential" | "recommended" | "supplementary";

        /** Source reference if from documentation */
        sourceReference?: string;
    }>;

    /** Summary of all points */
    summary?: string;
}

/**
 * A complete generated chapter with all content
 */
export interface GeneratedChapter {
    /** Unique identifier */
    id: string;

    /** The path seed that generated this chapter */
    pathSeedId: string;

    /** Chapter metadata */
    courseInfo: CourseInfo;

    /** Generated sections */
    sections: GeneratedChapterSection[];

    /** Estimated total duration */
    totalDuration: string;

    /** Generation metadata */
    generationMeta: {
        /** Timestamp when generated */
        generatedAt: string;

        /** AI model used */
        modelVersion: string;

        /** Generation parameters */
        params: ContentGenerationParams;

        /** Generation status */
        status: "draft" | "published" | "archived";
    };

    /** Quality metrics */
    qualityMetrics: ContentQualityMetrics;

    /** Fork information if this is a fork */
    forkInfo?: {
        parentChapterId: string;
        forkDate: string;
        forkedBy: string;
    };
}

/**
 * A generated chapter section with all associated content
 */
export interface GeneratedChapterSection extends ChapterSection {
    /** Generated video script if available */
    videoScript?: GeneratedVideoScript;

    /** Progressive code examples */
    codeExamples: ProgressiveCodeExample[];

    /** Generated quiz questions */
    quizQuestions: GeneratedQuizQuestion[];

    /** Generated key points */
    keyPoints: GeneratedKeyPoints;

    /** Content slots derived from generated content */
    contentSlots: ContentSlot[];

    /** Source references used in generation */
    sourceReferences?: string[];
}

// ============================================================================
// CONTENT QUALITY & RATING TYPES
// ============================================================================

/**
 * Quality metrics for generated content
 */
export interface ContentQualityMetrics {
    /** Overall quality score (0-100) */
    overallScore: number;

    /** Number of user ratings */
    ratingCount: number;

    /** Average user rating (1-5) */
    averageRating: number;

    /** Completion rate by learners */
    completionRate: number;

    /** Quiz pass rate */
    quizPassRate: number;

    /** Number of forks */
    forkCount: number;

    /** Improvement trend */
    trend: "improving" | "stable" | "declining";
}

/**
 * A user's rating and feedback on generated content
 */
export interface ContentRating {
    /** Unique identifier */
    id: string;

    /** Chapter or section being rated */
    contentId: string;

    /** Content type */
    contentType: "chapter" | "section" | "quiz" | "code_example";

    /** User ID */
    userId: string;

    /** Rating (1-5 stars) */
    rating: number;

    /** Specific feedback categories */
    feedback: {
        accuracy: 1 | 2 | 3 | 4 | 5;
        clarity: 1 | 2 | 3 | 4 | 5;
        relevance: 1 | 2 | 3 | 4 | 5;
        difficulty: "too_easy" | "just_right" | "too_hard";
    };

    /** Written feedback */
    comments?: string;

    /** Specific issues reported */
    issues?: Array<{
        type: "incorrect" | "unclear" | "outdated" | "missing_content" | "typo";
        description: string;
        location?: string;
    }>;

    /** Timestamp */
    createdAt: string;
}

/**
 * A user annotation on generated content
 */
export interface ContentAnnotation {
    /** Unique identifier */
    id: string;

    /** Content being annotated */
    contentId: string;

    /** User ID */
    userId: string;

    /** Type of annotation */
    annotationType: "highlight" | "note" | "correction" | "question";

    /** Selected text or code being annotated */
    selectedContent: string;

    /** Start position in content */
    startOffset: number;

    /** End position in content */
    endOffset: number;

    /** Annotation text */
    annotationText: string;

    /** Visibility */
    visibility: "private" | "public";

    /** Upvotes from other users (for public annotations) */
    upvotes: number;

    /** Timestamp */
    createdAt: string;

    /** Whether incorporated into official content */
    incorporated: boolean;
}

// ============================================================================
// CONTENT VERSIONING TYPES
// ============================================================================

/**
 * A version of generated content
 */
export interface ContentVersion {
    /** Version identifier */
    versionId: string;

    /** Content identifier */
    contentId: string;

    /** Version number (semver-style) */
    version: string;

    /** Changes from previous version */
    changelog: string[];

    /** Quality score at this version */
    qualityScore: number;

    /** Snapshot of the content at this version */
    contentSnapshot: GeneratedChapter | GeneratedChapterSection;

    /** Timestamp */
    createdAt: string;

    /** Created by (AI or user ID) */
    createdBy: string;

    /** Is this the current version? */
    isCurrent: boolean;
}

/**
 * Fork metadata for tracking content lineage
 */
export interface ContentFork {
    /** Fork identifier */
    forkId: string;

    /** Original content ID */
    originalContentId: string;

    /** New forked content ID */
    forkedContentId: string;

    /** User who created the fork */
    forkedBy: string;

    /** Reason for forking */
    forkReason?: string;

    /** Customizations made */
    customizations: Array<{
        sectionId: string;
        changeType: "modified" | "added" | "removed";
        description: string;
    }>;

    /** Fork timestamp */
    forkedAt: string;

    /** Whether this fork has been merged back */
    mergedBack: boolean;
}

// ============================================================================
// GENERATION STATUS TYPES
// ============================================================================

/**
 * Status of a content generation job
 */
export interface GenerationJob {
    /** Job identifier */
    jobId: string;

    /** Path seed ID */
    pathSeedId: string;

    /** Current status */
    status: "queued" | "generating" | "completed" | "failed";

    /** Progress percentage */
    progress: number;

    /** Current step being processed */
    currentStep: string;

    /** Steps completed */
    stepsCompleted: string[];

    /** Error message if failed */
    errorMessage?: string;

    /** Started at */
    startedAt?: string;

    /** Completed at */
    completedAt?: string;

    /** Estimated time remaining in seconds */
    estimatedTimeRemaining?: number;

    /** Generated content ID once complete */
    generatedContentId?: string;
}

// ============================================================================
// SLOT SYSTEM INTEGRATION
// ============================================================================

/**
 * Configuration for how generated content maps to the slot system.
 * The slot system becomes a "generative grammar" where generated content
 * fills slots based on section type and content availability.
 */
export interface SlotGenerationConfig {
    /** Section type being generated for */
    sectionType: SectionType;

    /** Required slots that must be filled */
    requiredSlots: SlotType[];

    /** Optional slots that enhance the content */
    optionalSlots: SlotType[];

    /** Slot generation priority order */
    generationOrder: SlotType[];

    /** Custom slot mappings for this path */
    customMappings?: Record<SlotType, Partial<ContentSlot>>;
}

/**
 * Default slot configurations per section type
 */
export const SLOT_GENERATION_CONFIGS: Record<SectionType, SlotGenerationConfig> = {
    video: {
        sectionType: "video",
        requiredSlots: ["video", "keyPoints"],
        optionalSlots: ["code", "quiz", "navigation"],
        generationOrder: ["header", "video", "keyPoints", "code", "quiz", "navigation"],
    },
    lesson: {
        sectionType: "lesson",
        requiredSlots: ["text", "keyPoints"],
        optionalSlots: ["code", "quiz", "playground"],
        generationOrder: ["header", "text", "code", "keyPoints", "playground", "quiz", "navigation"],
    },
    interactive: {
        sectionType: "interactive",
        requiredSlots: ["playground", "keyPoints"],
        optionalSlots: ["text", "quiz"],
        generationOrder: ["header", "text", "playground", "keyPoints", "quiz", "navigation"],
    },
    exercise: {
        sectionType: "exercise",
        requiredSlots: ["quiz", "keyPoints"],
        optionalSlots: ["code", "playground"],
        generationOrder: ["header", "keyPoints", "quiz", "code", "playground", "navigation"],
    },
};

// ============================================================================
// EXPORT TYPE HELPERS
// ============================================================================

/**
 * Create a new learning path seed
 */
export function createPathSeed(
    topics: string[],
    domainId: LearningDomainId,
    userId: string,
    options?: {
        userGoal?: string;
        skillLevel?: LearningPathSeed["skillLevel"];
    }
): LearningPathSeed {
    const pathId = `path_${topics.join("-").toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;

    return {
        pathId,
        topics,
        domainId,
        userGoal: options?.userGoal,
        skillLevel: options?.skillLevel ?? "beginner",
        createdAt: new Date().toISOString(),
        createdBy: userId,
    };
}

/**
 * Create default generation params from a path seed
 */
export function createDefaultGenerationParams(
    pathSeed: LearningPathSeed,
    chapterIndex: number = 0
): ContentGenerationParams {
    return {
        pathSeed,
        chapterIndex,
        contentDensity: "standard",
        includeCode: true,
        includeQuizzes: true,
        includeVideoScripts: true,
        codeLanguage: inferCodeLanguage(pathSeed.topics),
    };
}

/**
 * Infer code language from topics
 */
function inferCodeLanguage(topics: string[]): string {
    const topicLower = topics.map((t) => t.toLowerCase()).join(" ");

    if (topicLower.includes("python")) return "python";
    if (topicLower.includes("java") && !topicLower.includes("javascript")) return "java";
    if (topicLower.includes("go") || topicLower.includes("golang")) return "go";
    if (topicLower.includes("rust")) return "rust";
    if (topicLower.includes("ruby")) return "ruby";
    if (topicLower.includes("php")) return "php";
    if (topicLower.includes("swift")) return "swift";
    if (topicLower.includes("kotlin")) return "kotlin";

    // Default to TypeScript for most web-related topics
    return "typescript";
}

/**
 * Calculate quality score from metrics
 */
export function calculateQualityScore(metrics: Partial<ContentQualityMetrics>): number {
    const weights = {
        averageRating: 0.4,
        completionRate: 0.3,
        quizPassRate: 0.2,
        forkCount: 0.1,
    };

    let score = 0;

    if (metrics.averageRating) {
        score += (metrics.averageRating / 5) * 100 * weights.averageRating;
    }

    if (metrics.completionRate) {
        score += metrics.completionRate * weights.completionRate;
    }

    if (metrics.quizPassRate) {
        score += metrics.quizPassRate * weights.quizPassRate;
    }

    if (metrics.forkCount && metrics.forkCount > 0) {
        // Diminishing returns for forks
        score += Math.min(metrics.forkCount / 10, 1) * 100 * weights.forkCount;
    }

    return Math.round(score);
}
