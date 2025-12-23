/**
 * Curriculum Generate API Route
 *
 * POST /api/curriculum/generate
 *
 * Generates personalized curriculum content using Claude AI.
 * Supports lessons, exercises, quizzes, and project specifications.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
    CurriculumGenerationRequest,
    CurriculumGenerationResponse,
    GeneratedCurriculum,
    LessonOutline,
    CodeExercise,
    Quiz,
    ProjectSpecification,
} from "@/app/features/curriculum-generator/lib/types";
import {
    CURRICULUM_SYSTEM_MESSAGE,
    buildFullCurriculumPrompt,
    buildLessonPrompt,
    buildExercisePrompt,
    buildQuizPrompt,
    buildProjectPrompt,
} from "@/app/features/curriculum-generator/lib/promptBuilder";

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODEL_ID = "claude-3-5-haiku-20241022";
const MAX_TOKENS = 8192;

// ============================================================================
// ERROR HANDLING
// ============================================================================

interface APIError {
    code: string;
    message: string;
}

function createError(code: string, message: string): APIError {
    return { code, message };
}

// ============================================================================
// RESPONSE PARSING
// ============================================================================

function parseJSONResponse(text: string): unknown {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    return JSON.parse(cleaned);
}

function generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Check for API key
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: createError("API_KEY_MISSING", "ANTHROPIC_API_KEY environment variable is not set"),
                    stats: { duration: Date.now() - startTime, tokenUsage: { input: 0, output: 0, total: 0 } },
                    fromCache: false,
                } as CurriculumGenerationResponse,
                { status: 500 }
            );
        }

        // Parse request body
        const body: CurriculumGenerationRequest = await request.json();

        // Validate request
        if (!body.module?.id || !body.module?.title || !body.module?.skills?.length) {
            return NextResponse.json(
                {
                    success: false,
                    error: createError("INVALID_REQUEST", "Missing required module information"),
                    stats: { duration: Date.now() - startTime, tokenUsage: { input: 0, output: 0, total: 0 } },
                    fromCache: false,
                } as CurriculumGenerationResponse,
                { status: 400 }
            );
        }

        if (!body.userProfile?.targetRole || !body.userProfile?.currentLevel) {
            return NextResponse.json(
                {
                    success: false,
                    error: createError("INVALID_REQUEST", "Missing required user profile information"),
                    stats: { duration: Date.now() - startTime, tokenUsage: { input: 0, output: 0, total: 0 } },
                    fromCache: false,
                } as CurriculumGenerationResponse,
                { status: 400 }
            );
        }

        // Initialize Anthropic client
        const anthropic = new Anthropic({ apiKey });

        // Track token usage
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        // Generate content based on options
        const { generateOptions } = body;
        let lessons: LessonOutline[] = [];
        let exercises: CodeExercise[] = [];
        let quizzes: Quiz[] = [];
        let projects: ProjectSpecification[] = [];

        // Generate lessons
        if (generateOptions.lessons) {
            const lessonPrompt = buildLessonPrompt(body);
            const lessonResponse = await anthropic.messages.create({
                model: MODEL_ID,
                max_tokens: MAX_TOKENS,
                system: CURRICULUM_SYSTEM_MESSAGE,
                messages: [{ role: "user", content: lessonPrompt }],
            });

            totalInputTokens += lessonResponse.usage.input_tokens;
            totalOutputTokens += lessonResponse.usage.output_tokens;

            const lessonContent = lessonResponse.content[0];
            if (lessonContent.type === "text") {
                try {
                    const parsed = parseJSONResponse(lessonContent.text) as { lessons: LessonOutline[] };
                    lessons = parsed.lessons || [];
                } catch {
                    console.error("Failed to parse lesson response");
                }
            }
        }

        // Generate exercises
        if (generateOptions.exercises) {
            const exercisePrompt = buildExercisePrompt(body);
            const exerciseResponse = await anthropic.messages.create({
                model: MODEL_ID,
                max_tokens: MAX_TOKENS,
                system: CURRICULUM_SYSTEM_MESSAGE,
                messages: [{ role: "user", content: exercisePrompt }],
            });

            totalInputTokens += exerciseResponse.usage.input_tokens;
            totalOutputTokens += exerciseResponse.usage.output_tokens;

            const exerciseContent = exerciseResponse.content[0];
            if (exerciseContent.type === "text") {
                try {
                    const parsed = parseJSONResponse(exerciseContent.text) as { exercises: CodeExercise[] };
                    exercises = parsed.exercises || [];
                } catch {
                    console.error("Failed to parse exercise response");
                }
            }
        }

        // Generate quiz
        if (generateOptions.quizzes) {
            const quizPrompt = buildQuizPrompt(body);
            const quizResponse = await anthropic.messages.create({
                model: MODEL_ID,
                max_tokens: MAX_TOKENS,
                system: CURRICULUM_SYSTEM_MESSAGE,
                messages: [{ role: "user", content: quizPrompt }],
            });

            totalInputTokens += quizResponse.usage.input_tokens;
            totalOutputTokens += quizResponse.usage.output_tokens;

            const quizContent = quizResponse.content[0];
            if (quizContent.type === "text") {
                try {
                    const parsed = parseJSONResponse(quizContent.text) as { quiz: Quiz };
                    if (parsed.quiz) {
                        quizzes = [parsed.quiz];
                    }
                } catch {
                    console.error("Failed to parse quiz response");
                }
            }
        }

        // Generate project
        if (generateOptions.projects) {
            const projectPrompt = buildProjectPrompt(body);
            const projectResponse = await anthropic.messages.create({
                model: MODEL_ID,
                max_tokens: MAX_TOKENS,
                system: CURRICULUM_SYSTEM_MESSAGE,
                messages: [{ role: "user", content: projectPrompt }],
            });

            totalInputTokens += projectResponse.usage.input_tokens;
            totalOutputTokens += projectResponse.usage.output_tokens;

            const projectContent = projectResponse.content[0];
            if (projectContent.type === "text") {
                try {
                    const parsed = parseJSONResponse(projectContent.text) as { project: ProjectSpecification };
                    if (parsed.project) {
                        projects = [parsed.project];
                    }
                } catch {
                    console.error("Failed to parse project response");
                }
            }
        }

        // Assemble curriculum
        const skillsCovered = new Set<string>();
        lessons.forEach((l) => l.keyConcepts?.forEach((c) => skillsCovered.add(c.name)));
        exercises.forEach((e) => e.concepts?.forEach((c) => skillsCovered.add(c)));

        const totalHours =
            lessons.reduce((sum, l) => sum + (l.estimatedMinutes || 0) / 60, 0) +
            exercises.reduce((sum, e) => sum + (e.estimatedMinutes || 0) / 60, 0) +
            quizzes.reduce((sum, q) => sum + (q.timeLimit || 0) / 60, 0) +
            projects.reduce((sum, p) => sum + (p.estimatedHours || 0), 0);

        const curriculum: GeneratedCurriculum = {
            id: generateId("curriculum"),
            moduleId: body.module.id,
            moduleTitle: body.module.title,
            targetSkill: body.module.skills[0] || "General",
            userGoal: body.userProfile.targetRole,
            currentLevel: body.userProfile.currentLevel,
            lessons,
            exercises,
            quizzes,
            projects,
            metadata: {
                generatedAt: new Date().toISOString(),
                model: MODEL_ID,
                version: "1.0.0",
                userProfileSnapshot: {
                    currentSkills: body.userProfile.currentSkills,
                    targetRole: body.userProfile.targetRole,
                    learningStyle: body.userProfile.learningStyle,
                    weeklyHours: body.userProfile.weeklyHours,
                },
                tokenUsage: {
                    input: totalInputTokens,
                    output: totalOutputTokens,
                    total: totalInputTokens + totalOutputTokens,
                },
                useCount: 0,
                lastUpdated: new Date().toISOString(),
            },
            totalHours,
            skillsCovered: Array.from(skillsCovered),
        };

        const response: CurriculumGenerationResponse = {
            success: true,
            curriculum,
            stats: {
                duration: Date.now() - startTime,
                tokenUsage: {
                    input: totalInputTokens,
                    output: totalOutputTokens,
                    total: totalInputTokens + totalOutputTokens,
                },
            },
            fromCache: false,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Curriculum generation error:", error);

        // Handle Anthropic API errors
        if (error instanceof Anthropic.APIError) {
            if (error.status === 429) {
                return NextResponse.json(
                    {
                        success: false,
                        error: createError("RATE_LIMIT", "Rate limit exceeded. Please try again later."),
                        stats: { duration: Date.now() - startTime, tokenUsage: { input: 0, output: 0, total: 0 } },
                        fromCache: false,
                    } as CurriculumGenerationResponse,
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: createError(
                    "GENERATION_ERROR",
                    error instanceof Error ? error.message : "Unknown error occurred"
                ),
                stats: { duration: Date.now() - startTime, tokenUsage: { input: 0, output: 0, total: 0 } },
                fromCache: false,
            } as CurriculumGenerationResponse,
            { status: 500 }
        );
    }
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET() {
    return NextResponse.json({
        endpoint: "/api/curriculum/generate",
        method: "POST",
        description: "Generate personalized curriculum content using AI",
        model: MODEL_ID,
        contentTypes: ["lessons", "exercises", "quizzes", "projects"],
        requestFormat: {
            module: {
                id: "string",
                title: "string",
                skills: "string[]",
                estimatedHours: "number",
                sequence: "number",
            },
            userProfile: {
                currentSkills: "string[]",
                targetRole: "string",
                targetSector: "string (optional)",
                learningStyle: "string",
                weeklyHours: "number",
                currentLevel: "beginner | intermediate | advanced | expert",
            },
            generateOptions: {
                lessons: "boolean",
                exercises: "boolean",
                quizzes: "boolean",
                projects: "boolean",
            },
        },
    });
}
