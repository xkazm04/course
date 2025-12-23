/**
 * Chapter Generator
 * Orchestrates the generation of complete chapters from learning path seeds
 */

import type {
    LearningPathSeed,
    ContentGenerationParams,
    GeneratedChapter,
    GeneratedChapterSection,
} from "../types";
import type { SectionType, CourseInfo } from "@/app/features/chapter/lib/chapterData";
import { updateJobProgress } from "./jobManager";
import { generateVideoScript } from "./videoGenerator";
import { generateCodeExamples } from "./codeGenerator";
import { generateQuizQuestions } from "./quizGenerator";
import { generateKeyPoints } from "./keyPointsGenerator";
import { generateContentSlots } from "./slotGenerator";
import {
    generateSectionTitle,
    generateSectionDescription,
    estimateSectionDuration,
    calculateTimeOffset,
} from "./helpers";

/**
 * Generate a complete chapter from a learning path seed
 */
export async function generateChapter(
    params: ContentGenerationParams,
    jobId?: string
): Promise<GeneratedChapter> {
    const { pathSeed, chapterIndex } = params;

    if (jobId) {
        updateJobProgress(jobId, {
            status: "generating",
            currentStep: "Preparing chapter structure",
            startedAt: new Date().toISOString(),
        });
    }

    const courseInfo = createCourseInfo(pathSeed, chapterIndex);
    const sectionTypes = determineSectionTypes(pathSeed, chapterIndex);

    // Generate sections
    const sections: GeneratedChapterSection[] = [];
    for (let i = 0; i < sectionTypes.length; i++) {
        if (jobId) {
            updateJobProgress(jobId, {
                progress: Math.round(((i + 1) / sectionTypes.length) * 80),
                currentStep: `Generating section ${i + 1} of ${sectionTypes.length}`,
            });
        }

        const topic = pathSeed.topics[i % pathSeed.topics.length] || pathSeed.topics[0] || "topic";
        const section = await generateSection(topic, i, sectionTypes[i]!, params, sections);
        sections.push(section);
    }

    const totalMinutes = calculateTotalDuration(sections);
    const chapter = buildChapter(pathSeed, courseInfo, sections, totalMinutes, params);

    if (jobId) {
        updateJobProgress(jobId, {
            status: "completed",
            progress: 100,
            currentStep: "Generation complete",
            completedAt: new Date().toISOString(),
            generatedContentId: chapter.id,
            stepsCompleted: ["structure", "sections", "slots", "validation"],
        });
    }

    return chapter;
}

/**
 * Create course info for the chapter
 */
function createCourseInfo(pathSeed: LearningPathSeed, chapterIndex: number): CourseInfo {
    return {
        courseId: `gen_${pathSeed.pathId}`,
        courseName: `${pathSeed.topics.join(" + ")} Learning Path`,
        chapterId: `chapter_${chapterIndex + 1}`,
        chapterTitle: generateChapterTitle(pathSeed.topics, chapterIndex),
    };
}

/**
 * Generate chapter title from topics
 */
function generateChapterTitle(topics: string[], chapterIndex: number): string {
    const prefixes = ["Introduction to", "Working with", "Advanced", "Mastering", "Deep Dive:"];
    const prefix = prefixes[chapterIndex % prefixes.length];

    if (topics.length === 1) {
        return `${prefix} ${topics[0]}`;
    }

    return `${prefix} ${topics.slice(0, 2).join(" & ")}`;
}

/**
 * Determine section types for a chapter
 */
function determineSectionTypes(
    pathSeed: LearningPathSeed,
    chapterIndex: number
): SectionType[] {
    const baseTypes: SectionType[] = ["video", "lesson", "interactive", "lesson", "exercise"];

    if (pathSeed.skillLevel === "beginner") {
        return ["video", "lesson", "video", "lesson", "exercise"];
    } else if (pathSeed.skillLevel === "advanced") {
        return ["lesson", "interactive", "exercise", "interactive", "exercise"];
    }

    return baseTypes;
}

/**
 * Generate a chapter section based on topic and type
 */
async function generateSection(
    topic: string,
    sectionIndex: number,
    sectionType: SectionType,
    params: ContentGenerationParams,
    previousSections: GeneratedChapterSection[]
): Promise<GeneratedChapterSection> {
    const sectionId = `section_${sectionIndex + 1}`;
    const title = generateSectionTitle(topic, sectionType, sectionIndex, params.pathSeed.topics);
    const duration = estimateSectionDuration(sectionType, params.contentDensity);

    const videoScript = params.includeVideoScripts
        ? generateVideoScript(topic, sectionId, title, sectionType, params)
        : undefined;

    const codeExamples = params.includeCode
        ? generateCodeExamples(topic, sectionId, sectionType, params, previousSections)
        : [];

    const quizQuestions = params.includeQuizzes
        ? generateQuizQuestions(topic, sectionId, sectionType, params)
        : [];

    const keyPoints = generateKeyPoints(topic, sectionId, title, sectionType, params);

    const contentSlots = generateContentSlots(
        sectionId,
        sectionType,
        { videoScript, codeExamples, quizQuestions, keyPoints },
        params
    );

    const description = generateSectionDescription(topic, sectionType, params);
    const code = codeExamples.length > 0 ? codeExamples[0]?.finalCode : undefined;

    return {
        id: sectionIndex + 1,
        sectionId,
        title,
        duration,
        time: calculateTimeOffset(sectionIndex, params.contentDensity),
        type: sectionType,
        completed: false,
        content: {
            description,
            code,
            keyPoints: keyPoints.points.map((p) => p.text),
        },
        videoScript,
        codeExamples,
        quizQuestions,
        keyPoints,
        contentSlots,
    };
}

/**
 * Calculate total duration from sections
 */
function calculateTotalDuration(sections: GeneratedChapterSection[]): number {
    return sections.reduce((sum, s) => {
        const mins = parseInt(s.duration, 10);
        return sum + (isNaN(mins) ? 0 : mins);
    }, 0);
}

/**
 * Build the final chapter object
 */
function buildChapter(
    pathSeed: LearningPathSeed,
    courseInfo: CourseInfo,
    sections: GeneratedChapterSection[],
    totalMinutes: number,
    params: ContentGenerationParams
): GeneratedChapter {
    return {
        id: `gen_chapter_${Date.now()}`,
        pathSeedId: pathSeed.pathId,
        courseInfo,
        sections,
        totalDuration: `~${totalMinutes} min`,
        generationMeta: {
            generatedAt: new Date().toISOString(),
            modelVersion: "v1.0.0",
            params,
            status: "draft",
        },
        qualityMetrics: {
            overallScore: 0,
            ratingCount: 0,
            averageRating: 0,
            completionRate: 0,
            quizPassRate: 0,
            forkCount: 0,
            trend: "stable",
        },
    };
}
