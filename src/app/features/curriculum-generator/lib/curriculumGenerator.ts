/**
 * Curriculum Generator Service
 *
 * Core service for generating personalized curriculum content using LLM.
 * Handles content generation, caching, and integration with the Career Oracle.
 */

import type {
    CurriculumGenerationRequest,
    CurriculumGenerationResponse,
    GeneratedCurriculum,
    LessonOutline,
    CodeExercise,
    Quiz,
    ProjectSpecification,
    GenerationMetadata,
} from "./types";
import {
    CURRICULUM_SYSTEM_MESSAGE,
    buildLessonPrompt,
    buildExercisePrompt,
    buildQuizPrompt,
    buildProjectPrompt,
    buildFullCurriculumPrompt,
} from "./promptBuilder";

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODEL_ID = "claude-3-5-haiku-20241022";
const MAX_TOKENS = 8192;
const API_ENDPOINT = "/api/curriculum/generate";

// ============================================================================
// TYPES
// ============================================================================

interface GenerationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    tokenUsage: {
        input: number;
        output: number;
        total: number;
    };
}

// ============================================================================
// CLIENT-SIDE GENERATOR
// ============================================================================

/**
 * Generate curriculum content via API call
 */
export async function generateCurriculum(
    request: CurriculumGenerationRequest
): Promise<CurriculumGenerationResponse> {
    const startTime = Date.now();

    try {
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json();
            return {
                success: false,
                error: {
                    code: "API_ERROR",
                    message: error.message || "Failed to generate curriculum",
                },
                stats: {
                    duration: Date.now() - startTime,
                    tokenUsage: { input: 0, output: 0, total: 0 },
                },
                fromCache: false,
            };
        }

        const result = await response.json();
        return result as CurriculumGenerationResponse;
    } catch (error) {
        return {
            success: false,
            error: {
                code: "NETWORK_ERROR",
                message: error instanceof Error ? error.message : "Network error occurred",
            },
            stats: {
                duration: Date.now() - startTime,
                tokenUsage: { input: 0, output: 0, total: 0 },
            },
            fromCache: false,
        };
    }
}

/**
 * Generate lessons only
 */
export async function generateLessons(
    request: CurriculumGenerationRequest
): Promise<GenerationResult<LessonOutline[]>> {
    const response = await generateCurriculum({
        ...request,
        generateOptions: {
            lessons: true,
            exercises: false,
            quizzes: false,
            projects: false,
        },
    });

    if (!response.success || !response.curriculum) {
        return {
            success: false,
            error: response.error?.message || "Failed to generate lessons",
            tokenUsage: response.stats.tokenUsage,
        };
    }

    return {
        success: true,
        data: response.curriculum.lessons,
        tokenUsage: response.stats.tokenUsage,
    };
}

/**
 * Generate exercises only
 */
export async function generateExercises(
    request: CurriculumGenerationRequest,
    lessonContext?: string
): Promise<GenerationResult<CodeExercise[]>> {
    const response = await generateCurriculum({
        ...request,
        generateOptions: {
            lessons: false,
            exercises: true,
            quizzes: false,
            projects: false,
        },
        context: {
            ...request.context,
            focusAreas: lessonContext ? [lessonContext] : request.context?.focusAreas,
        },
    });

    if (!response.success || !response.curriculum) {
        return {
            success: false,
            error: response.error?.message || "Failed to generate exercises",
            tokenUsage: response.stats.tokenUsage,
        };
    }

    return {
        success: true,
        data: response.curriculum.exercises,
        tokenUsage: response.stats.tokenUsage,
    };
}

/**
 * Generate quiz only
 */
export async function generateQuiz(
    request: CurriculumGenerationRequest
): Promise<GenerationResult<Quiz[]>> {
    const response = await generateCurriculum({
        ...request,
        generateOptions: {
            lessons: false,
            exercises: false,
            quizzes: true,
            projects: false,
        },
    });

    if (!response.success || !response.curriculum) {
        return {
            success: false,
            error: response.error?.message || "Failed to generate quiz",
            tokenUsage: response.stats.tokenUsage,
        };
    }

    return {
        success: true,
        data: response.curriculum.quizzes,
        tokenUsage: response.stats.tokenUsage,
    };
}

/**
 * Generate project only
 */
export async function generateProject(
    request: CurriculumGenerationRequest
): Promise<GenerationResult<ProjectSpecification[]>> {
    const response = await generateCurriculum({
        ...request,
        generateOptions: {
            lessons: false,
            exercises: false,
            quizzes: false,
            projects: true,
        },
    });

    if (!response.success || !response.curriculum) {
        return {
            success: false,
            error: response.error?.message || "Failed to generate project",
            tokenUsage: response.stats.tokenUsage,
        };
    }

    return {
        success: true,
        data: response.curriculum.projects,
        tokenUsage: response.stats.tokenUsage,
    };
}

// ============================================================================
// CACHE KEY GENERATION
// ============================================================================

/**
 * Generate a cache key for curriculum content
 */
export function generateCacheKey(request: CurriculumGenerationRequest): string {
    const keyParts = [
        request.module.id,
        request.module.title,
        request.module.skills.sort().join(","),
        request.userProfile.currentLevel,
        request.userProfile.targetRole,
        request.userProfile.learningStyle,
        Object.entries(request.generateOptions)
            .filter(([_, v]) => v)
            .map(([k]) => k)
            .sort()
            .join(","),
    ];

    // Simple hash function
    const str = keyParts.join("|");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `curriculum-${Math.abs(hash).toString(36)}`;
}

// ============================================================================
// CONTENT ASSEMBLY
// ============================================================================

/**
 * Assemble generated content into a full curriculum
 */
export function assembleCurriculum(
    request: CurriculumGenerationRequest,
    lessons: LessonOutline[],
    exercises: CodeExercise[],
    quizzes: Quiz[],
    projects: ProjectSpecification[],
    tokenUsage: { input: number; output: number; total: number }
): GeneratedCurriculum {
    const skillsCovered = new Set<string>();

    lessons.forEach((l) => {
        l.keyConcepts.forEach((c) => skillsCovered.add(c.name));
    });
    exercises.forEach((e) => {
        e.concepts.forEach((c) => skillsCovered.add(c));
    });

    const totalHours =
        lessons.reduce((sum, l) => sum + l.estimatedMinutes / 60, 0) +
        exercises.reduce((sum, e) => sum + e.estimatedMinutes / 60, 0) +
        quizzes.reduce((sum, q) => sum + q.timeLimit / 60, 0) +
        projects.reduce((sum, p) => sum + p.estimatedHours, 0);

    const metadata: GenerationMetadata = {
        generatedAt: new Date().toISOString(),
        model: MODEL_ID,
        version: "1.0.0",
        userProfileSnapshot: {
            currentSkills: request.userProfile.currentSkills,
            targetRole: request.userProfile.targetRole,
            learningStyle: request.userProfile.learningStyle,
            weeklyHours: request.userProfile.weeklyHours,
        },
        tokenUsage,
        useCount: 0,
        lastUpdated: new Date().toISOString(),
    };

    return {
        id: generateCacheKey(request),
        moduleId: request.module.id,
        moduleTitle: request.module.title,
        targetSkill: request.module.skills[0] || "General",
        userGoal: request.userProfile.targetRole,
        currentLevel: request.userProfile.currentLevel,
        lessons,
        exercises,
        quizzes,
        projects,
        metadata,
        totalHours,
        skillsCovered: Array.from(skillsCovered),
    };
}

// ============================================================================
// MOCK GENERATOR (for development/testing)
// ============================================================================

/**
 * Generate mock curriculum for development
 */
export function generateMockCurriculum(
    request: CurriculumGenerationRequest
): GeneratedCurriculum {
    const { module, userProfile } = request;

    // Mock lessons
    const mockLessons: LessonOutline[] = [
        {
            id: "lesson-1",
            title: `Introduction to ${module.skills[0]}`,
            summary: `Learn the fundamentals of ${module.skills[0]} and how it applies to ${userProfile.targetRole} roles.`,
            learningObjectives: [
                `Understand the core concepts of ${module.skills[0]}`,
                `Set up a development environment for ${module.skills[0]}`,
                `Write your first ${module.skills[0]} code`,
            ],
            sections: [
                {
                    id: "section-1",
                    title: "What is " + module.skills[0] + "?",
                    type: "theory",
                    content: `${module.skills[0]} is a powerful technology used in modern software development. In this section, we'll explore its history, use cases, and why it's valuable for ${userProfile.targetRole} professionals.\n\n**Key Points:**\n- Industry adoption is growing rapidly\n- Essential for modern development workflows\n- Strong job market demand`,
                    tips: [
                        "Don't try to learn everything at once",
                        "Practice with small examples first",
                    ],
                },
                {
                    id: "section-2",
                    title: "Getting Started",
                    type: "example",
                    content: "Let's set up your environment and write your first code.",
                    codeSnippets: [
                        {
                            id: "snippet-1",
                            language: "typescript",
                            code: `// Your first ${module.skills[0]} example\nconsole.log("Hello, ${module.skills[0]}!");`,
                            explanations: {
                                1: "This is a comment explaining the code",
                                2: "This prints a greeting message",
                            },
                            caption: "A simple getting started example",
                        },
                    ],
                },
            ],
            keyConcepts: [
                {
                    name: module.skills[0],
                    definition: `The core technology we're learning in this module.`,
                    relatedConcepts: module.skills.slice(1),
                    analogy: "Think of it as a powerful tool in your developer toolbox.",
                },
            ],
            estimatedMinutes: 30,
            difficulty: userProfile.currentLevel,
            prerequisites: [],
            nextLessons: ["lesson-2"],
        },
    ];

    // Mock exercises
    const mockExercises: CodeExercise[] = [
        {
            id: "exercise-1",
            title: `${module.skills[0]} Fundamentals`,
            description: `Practice the basics of ${module.skills[0]} by completing this exercise.`,
            language: "typescript",
            difficulty: userProfile.currentLevel,
            type: "implement_function",
            starterCode: `// Implement the function below\nfunction greet(name: string): string {\n  // Your code here\n}`,
            solutionCode: `function greet(name: string): string {\n  return \`Hello, \${name}!\`;\n}`,
            testCases: [
                {
                    id: "test-1",
                    description: "Should greet with the given name",
                    input: "World",
                    expectedOutput: "Hello, World!",
                },
            ],
            hints: [
                "Use string interpolation",
                "Return the greeting string",
            ],
            concepts: [module.skills[0]],
            estimatedMinutes: 15,
        },
    ];

    // Mock quiz
    const mockQuizzes: Quiz[] = [
        {
            id: "quiz-1",
            title: `${module.title} Assessment`,
            description: `Test your understanding of ${module.skills.join(", ")}.`,
            questions: [
                {
                    id: "q-1",
                    type: "multiple_choice",
                    question: `What is the primary purpose of ${module.skills[0]}?`,
                    options: [
                        { id: "opt-1", text: "To make development faster", whyWrong: undefined },
                        { id: "opt-2", text: "To make code more readable", whyWrong: "While helpful, this isn't the primary purpose" },
                        { id: "opt-3", text: "To replace other technologies", whyWrong: "It complements, not replaces" },
                        { id: "opt-4", text: "None of the above", whyWrong: "One of the options is correct" },
                    ],
                    correctAnswer: "opt-1",
                    explanation: `${module.skills[0]} is primarily designed to increase development speed and efficiency.`,
                    points: 10,
                    concept: module.skills[0],
                },
            ],
            passingScore: 70,
            timeLimit: 0,
            topics: module.skills,
            difficulty: userProfile.currentLevel,
            shuffleQuestions: true,
            showExplanationsImmediately: false,
        },
    ];

    // Mock project
    const mockProjects: ProjectSpecification[] = [
        {
            id: "project-1",
            title: `Build a ${module.skills[0]} Application`,
            overview: `Create a practical application using ${module.skills[0]} skills.`,
            description: `In this project, you'll build a real-world application that demonstrates your ${module.skills[0]} abilities. This project is designed to be portfolio-worthy and relevant to ${userProfile.targetRole} positions.`,
            goals: [
                `Apply ${module.skills[0]} concepts in a real project`,
                "Build something you can showcase to employers",
                "Practice professional development workflows",
            ],
            technologies: module.skills,
            difficulty: userProfile.currentLevel,
            estimatedHours: Math.floor(module.estimatedHours * 0.4),
            milestones: [
                {
                    id: "milestone-1",
                    title: "Project Setup",
                    description: "Set up the project structure and development environment",
                    tasks: [
                        "Initialize the project",
                        "Configure development tools",
                        "Set up version control",
                    ],
                    skillsPracticed: ["Project setup", "Tool configuration"],
                    estimatedHours: 1,
                    order: 1,
                },
                {
                    id: "milestone-2",
                    title: "Core Implementation",
                    description: "Implement the main functionality",
                    tasks: [
                        "Build core features",
                        "Add error handling",
                        "Write tests",
                    ],
                    skillsPracticed: module.skills,
                    estimatedHours: Math.floor(module.estimatedHours * 0.25),
                    order: 2,
                },
            ],
            deliverables: [
                {
                    id: "deliverable-1",
                    name: "Working Application",
                    description: "A fully functional application",
                    type: "code",
                    requirements: ["All features working", "Tests passing", "Documentation complete"],
                },
            ],
            starterResources: [
                {
                    name: "Project Template",
                    type: "template",
                    description: "A starter template to help you get started quickly",
                },
            ],
            evaluationCriteria: [
                {
                    name: "Functionality",
                    description: "Does the application work as expected?",
                    weight: 8,
                    rubric: {
                        excellent: "All features work perfectly with edge cases handled",
                        good: "Core features work well with minor issues",
                        satisfactory: "Basic functionality works",
                        needsImprovement: "Major features are broken or missing",
                    },
                },
            ],
            stretchGoals: [
                "Add advanced features",
                "Implement performance optimizations",
                "Deploy to production",
            ],
            industryRelevance: `This type of project is commonly found in ${userProfile.targetRole} roles and demonstrates practical skills employers look for.`,
            portfolioDescription: `Built a ${module.skills[0]} application demonstrating proficiency in modern development practices.`,
        },
    ];

    return assembleCurriculum(
        request,
        mockLessons,
        mockExercises,
        mockQuizzes,
        mockProjects,
        { input: 0, output: 0, total: 0 }
    );
}
