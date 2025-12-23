/**
 * AI Curriculum Generator Types
 *
 * Type definitions for the LLM-powered curriculum content generation system.
 * Supports personalized lesson outlines, code exercises, quizzes, and project specifications.
 */

// ============================================================================
// CORE CURRICULUM TYPES
// ============================================================================

/**
 * Generated lesson outline with structured content
 */
export interface LessonOutline {
    /** Unique lesson identifier */
    id: string;
    /** Lesson title */
    title: string;
    /** Brief lesson summary */
    summary: string;
    /** Detailed learning objectives */
    learningObjectives: string[];
    /** Lesson sections with content */
    sections: LessonSection[];
    /** Key concepts covered */
    keyConcepts: Concept[];
    /** Estimated time to complete (minutes) */
    estimatedMinutes: number;
    /** Difficulty level */
    difficulty: DifficultyLevel;
    /** Prerequisites from other lessons */
    prerequisites: string[];
    /** Next suggested lessons */
    nextLessons: string[];
}

/**
 * Section within a lesson
 */
export interface LessonSection {
    /** Section ID */
    id: string;
    /** Section title */
    title: string;
    /** Section type */
    type: "theory" | "example" | "practice" | "summary";
    /** Text content (markdown) */
    content: string;
    /** Optional code snippets */
    codeSnippets?: CodeSnippet[];
    /** Tips and notes */
    tips?: string[];
    /** Common mistakes to avoid */
    commonMistakes?: string[];
}

/**
 * Code snippet with annotations
 */
export interface CodeSnippet {
    /** Code snippet ID */
    id: string;
    /** Programming language */
    language: string;
    /** The code */
    code: string;
    /** Line-by-line explanations */
    explanations?: Record<number, string>;
    /** Highlighted lines */
    highlightedLines?: number[];
    /** Caption or title */
    caption?: string;
}

/**
 * Key concept definition
 */
export interface Concept {
    /** Concept name */
    name: string;
    /** Brief definition */
    definition: string;
    /** Related concepts */
    relatedConcepts?: string[];
    /** Real-world analogy */
    analogy?: string;
}

/**
 * Difficulty level for content
 */
export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";

// ============================================================================
// CODE EXERCISE TYPES
// ============================================================================

/**
 * Interactive code exercise
 */
export interface CodeExercise {
    /** Exercise ID */
    id: string;
    /** Exercise title */
    title: string;
    /** Exercise description */
    description: string;
    /** Programming language */
    language: string;
    /** Difficulty level */
    difficulty: DifficultyLevel;
    /** Exercise type */
    type: ExerciseType;
    /** Starting code template */
    starterCode: string;
    /** Solution code */
    solutionCode: string;
    /** Test cases for validation */
    testCases: TestCase[];
    /** Hints (progressively revealed) */
    hints: string[];
    /** Concepts being practiced */
    concepts: string[];
    /** Estimated time (minutes) */
    estimatedMinutes: number;
    /** Common errors students make */
    commonErrors?: CommonError[];
}

/**
 * Type of code exercise
 */
export type ExerciseType =
    | "fill_in_blanks"
    | "fix_bug"
    | "implement_function"
    | "refactor"
    | "debug"
    | "extend_feature"
    | "from_scratch";

/**
 * Test case for exercise validation
 */
export interface TestCase {
    /** Test case ID */
    id: string;
    /** Test description */
    description: string;
    /** Input values */
    input: unknown;
    /** Expected output */
    expectedOutput: unknown;
    /** Is this a hidden test (not shown to user) */
    hidden?: boolean;
}

/**
 * Common error pattern in exercises
 */
export interface CommonError {
    /** Error pattern */
    pattern: string;
    /** Explanation of why this is wrong */
    explanation: string;
    /** Suggestion to fix */
    suggestion: string;
}

// ============================================================================
// QUIZ TYPES
// ============================================================================

/**
 * Quiz with multiple questions
 */
export interface Quiz {
    /** Quiz ID */
    id: string;
    /** Quiz title */
    title: string;
    /** Quiz description */
    description: string;
    /** Questions in the quiz */
    questions: QuizQuestion[];
    /** Passing score percentage */
    passingScore: number;
    /** Time limit in minutes (0 = no limit) */
    timeLimit: number;
    /** Topics covered */
    topics: string[];
    /** Difficulty level */
    difficulty: DifficultyLevel;
    /** Whether to shuffle questions */
    shuffleQuestions: boolean;
    /** Whether to show explanations after each question */
    showExplanationsImmediately: boolean;
}

/**
 * Quiz question with multiple types
 */
export interface QuizQuestion {
    /** Question ID */
    id: string;
    /** Question type */
    type: QuestionType;
    /** Question text */
    question: string;
    /** Optional code snippet context */
    codeContext?: string;
    /** Answer options (for multiple choice/multi-select) */
    options?: QuizOption[];
    /** Correct answer(s) */
    correctAnswer: string | string[] | boolean;
    /** Explanation of the correct answer */
    explanation: string;
    /** Points for this question */
    points: number;
    /** Hints */
    hints?: string[];
    /** Related concept */
    concept?: string;
}

/**
 * Quiz question type
 */
export type QuestionType =
    | "multiple_choice"
    | "multi_select"
    | "true_false"
    | "code_output"
    | "fill_blank"
    | "ordering";

/**
 * Option for multiple choice questions
 */
export interface QuizOption {
    /** Option ID */
    id: string;
    /** Option text */
    text: string;
    /** Optional code snippet */
    code?: string;
    /** Why this is wrong (for incorrect options) */
    whyWrong?: string;
}

// ============================================================================
// PROJECT SPECIFICATION TYPES
// ============================================================================

/**
 * Full project specification
 */
export interface ProjectSpecification {
    /** Project ID */
    id: string;
    /** Project title */
    title: string;
    /** Project overview */
    overview: string;
    /** Detailed description */
    description: string;
    /** Project goals */
    goals: string[];
    /** Technologies/skills used */
    technologies: string[];
    /** Difficulty level */
    difficulty: DifficultyLevel;
    /** Estimated hours to complete */
    estimatedHours: number;
    /** Project milestones */
    milestones: ProjectMilestone[];
    /** Deliverables */
    deliverables: ProjectDeliverable[];
    /** Starter resources */
    starterResources: StarterResource[];
    /** Evaluation criteria */
    evaluationCriteria: EvaluationCriterion[];
    /** Stretch goals */
    stretchGoals?: string[];
    /** Industry relevance */
    industryRelevance: string;
    /** Portfolio-worthy description */
    portfolioDescription: string;
}

/**
 * Milestone in a project
 */
export interface ProjectMilestone {
    /** Milestone ID */
    id: string;
    /** Milestone title */
    title: string;
    /** Milestone description */
    description: string;
    /** Tasks to complete */
    tasks: string[];
    /** Skills practiced */
    skillsPracticed: string[];
    /** Estimated hours */
    estimatedHours: number;
    /** Order in project */
    order: number;
}

/**
 * Project deliverable
 */
export interface ProjectDeliverable {
    /** Deliverable ID */
    id: string;
    /** Deliverable name */
    name: string;
    /** Description */
    description: string;
    /** Type of deliverable */
    type: "code" | "documentation" | "presentation" | "demo" | "design";
    /** Requirements */
    requirements: string[];
}

/**
 * Starter resource for projects
 */
export interface StarterResource {
    /** Resource name */
    name: string;
    /** Resource type */
    type: "template" | "api" | "dataset" | "documentation" | "tutorial";
    /** Resource URL or description */
    url?: string;
    /** Description */
    description: string;
}

/**
 * Evaluation criterion
 */
export interface EvaluationCriterion {
    /** Criterion name */
    name: string;
    /** Description */
    description: string;
    /** Weight (1-10) */
    weight: number;
    /** Rubric levels */
    rubric: {
        excellent: string;
        good: string;
        satisfactory: string;
        needsImprovement: string;
    };
}

// ============================================================================
// GENERATED CURRICULUM CONTENT
// ============================================================================

/**
 * Complete generated curriculum for a module
 */
export interface GeneratedCurriculum {
    /** Curriculum ID */
    id: string;
    /** Module ID this curriculum belongs to */
    moduleId: string;
    /** Module title */
    moduleTitle: string;
    /** Target skill */
    targetSkill: string;
    /** User's goal */
    userGoal: string;
    /** User's current level */
    currentLevel: DifficultyLevel;
    /** Generated lesson outlines */
    lessons: LessonOutline[];
    /** Generated code exercises */
    exercises: CodeExercise[];
    /** Generated quizzes */
    quizzes: Quiz[];
    /** Generated project specifications */
    projects: ProjectSpecification[];
    /** Generation metadata */
    metadata: GenerationMetadata;
    /** Estimated total hours */
    totalHours: number;
    /** Skills covered */
    skillsCovered: string[];
}

/**
 * Metadata about content generation
 */
export interface GenerationMetadata {
    /** When content was generated */
    generatedAt: string;
    /** LLM model used */
    model: string;
    /** Generation version */
    version: string;
    /** User ID who generated this */
    userId?: string;
    /** User's profile snapshot at generation time */
    userProfileSnapshot: UserProfileSnapshot;
    /** Token usage */
    tokenUsage: {
        input: number;
        output: number;
        total: number;
    };
    /** Quality score (from community feedback) */
    qualityScore?: number;
    /** Number of times this content has been used */
    useCount: number;
    /** Last updated time */
    lastUpdated: string;
}

/**
 * Snapshot of user profile for content generation
 */
export interface UserProfileSnapshot {
    /** User's current skills */
    currentSkills: string[];
    /** Target role */
    targetRole: string;
    /** Learning style preference */
    learningStyle: string;
    /** Weekly hours available */
    weeklyHours: number;
}

// ============================================================================
// FEEDBACK AND CURATION TYPES
// ============================================================================

/**
 * User feedback on generated content
 */
export interface ContentFeedback {
    /** Feedback ID */
    id: string;
    /** Content ID being rated */
    contentId: string;
    /** Content type */
    contentType: "lesson" | "exercise" | "quiz" | "project";
    /** User ID */
    userId: string;
    /** Rating (1-5) */
    rating: number;
    /** Specific feedback areas */
    feedback: {
        /** Was the content clear? */
        clarity: number;
        /** Was the difficulty appropriate? */
        difficultyMatch: number;
        /** Was it relevant to the goal? */
        relevance: number;
        /** Was it engaging? */
        engagement: number;
    };
    /** Text feedback */
    comment?: string;
    /** Completion status */
    completed: boolean;
    /** Time spent on content (minutes) */
    timeSpent: number;
    /** Whether user struggled */
    struggled: boolean;
    /** Suggested improvements */
    suggestions?: string[];
    /** Created at */
    createdAt: string;
}

/**
 * Aggregated quality metrics for content
 */
export interface ContentQualityMetrics {
    /** Content ID */
    contentId: string;
    /** Content type */
    contentType: "lesson" | "exercise" | "quiz" | "project";
    /** Total ratings count */
    totalRatings: number;
    /** Average rating */
    averageRating: number;
    /** Average clarity score */
    averageClarity: number;
    /** Average difficulty match */
    averageDifficultyMatch: number;
    /** Average relevance */
    averageRelevance: number;
    /** Average engagement */
    averageEngagement: number;
    /** Completion rate */
    completionRate: number;
    /** Average time spent */
    averageTimeSpent: number;
    /** Struggle rate */
    struggleRate: number;
    /** Last updated */
    lastUpdated: string;
}

/**
 * Completion data for feedback loop
 */
export interface CompletionData {
    /** Completion ID */
    id: string;
    /** User ID */
    userId: string;
    /** Curriculum ID */
    curriculumId: string;
    /** Content item ID */
    contentId: string;
    /** Content type */
    contentType: "lesson" | "exercise" | "quiz" | "project";
    /** Completion status */
    status: "not_started" | "in_progress" | "completed" | "skipped";
    /** Score (for quizzes/exercises) */
    score?: number;
    /** Attempts count */
    attempts: number;
    /** Time spent (minutes) */
    timeSpent: number;
    /** Hints used */
    hintsUsed: number;
    /** Started at */
    startedAt?: string;
    /** Completed at */
    completedAt?: string;
    /** Notes */
    notes?: string;
}

// ============================================================================
// GENERATION REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to generate curriculum content
 */
export interface CurriculumGenerationRequest {
    /** Module information */
    module: {
        id: string;
        title: string;
        skills: string[];
        estimatedHours: number;
        sequence: number;
    };
    /** User profile for personalization */
    userProfile: {
        currentSkills: string[];
        targetRole: string;
        targetSector?: string;
        learningStyle: string;
        weeklyHours: number;
        currentLevel: DifficultyLevel;
    };
    /** What to generate */
    generateOptions: {
        lessons: boolean;
        exercises: boolean;
        quizzes: boolean;
        projects: boolean;
    };
    /** Additional context */
    context?: {
        previousModules?: string[];
        userPreferences?: string[];
        focusAreas?: string[];
    };
}

/**
 * Response from curriculum generation
 */
export interface CurriculumGenerationResponse {
    /** Whether generation was successful */
    success: boolean;
    /** Generated curriculum */
    curriculum?: GeneratedCurriculum;
    /** Error if failed */
    error?: {
        code: string;
        message: string;
    };
    /** Generation stats */
    stats: {
        duration: number;
        tokenUsage: {
            input: number;
            output: number;
            total: number;
        };
    };
    /** Cached flag */
    fromCache: boolean;
}

/**
 * Request to submit feedback
 */
export interface FeedbackSubmissionRequest {
    /** Content ID */
    contentId: string;
    /** Content type */
    contentType: "lesson" | "exercise" | "quiz" | "project";
    /** Rating (1-5) */
    rating: number;
    /** Specific feedback */
    feedback: {
        clarity: number;
        difficultyMatch: number;
        relevance: number;
        engagement: number;
    };
    /** Optional comment */
    comment?: string;
    /** Completion data */
    completion: {
        completed: boolean;
        timeSpent: number;
        struggled: boolean;
        score?: number;
    };
    /** Suggestions */
    suggestions?: string[];
}

/**
 * Response from feedback submission
 */
export interface FeedbackSubmissionResponse {
    /** Whether submission was successful */
    success: boolean;
    /** Feedback ID */
    feedbackId?: string;
    /** Updated content quality metrics */
    updatedMetrics?: ContentQualityMetrics;
    /** Error if failed */
    error?: {
        code: string;
        message: string;
    };
}

// ============================================================================
// CACHE TYPES
// ============================================================================

/**
 * Cached curriculum entry
 */
export interface CurriculumCacheEntry {
    /** Cache key (hash of generation params) */
    cacheKey: string;
    /** The cached curriculum */
    curriculum: GeneratedCurriculum;
    /** When cached */
    cachedAt: string;
    /** Expiry time */
    expiresAt: string;
    /** Hit count */
    hitCount: number;
    /** Last accessed */
    lastAccessed: string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
    /** Total entries */
    totalEntries: number;
    /** Total size in bytes (estimated) */
    totalSize: number;
    /** Cache hit rate */
    hitRate: number;
    /** Most popular entries */
    popularEntries: {
        cacheKey: string;
        hitCount: number;
        moduleTitle: string;
    }[];
}
