/**
 * Content Slot Generator
 * Generates content slots from section content for rendering
 */

import type {
    ContentGenerationParams,
    GeneratedVideoScript,
    ProgressiveCodeExample,
    GeneratedQuizQuestion,
    GeneratedKeyPoints,
} from "../types";
import type { SectionType } from "@/app/features/chapter/lib/chapterData";
import type { ContentSlot } from "@/app/features/chapter/lib/contentSlots";
import {
    createVideoSlot,
    createCodeSlot,
    createKeyPointsSlot,
    createQuizSlot,
    createTextSlot,
    createPlaygroundSlot,
    createNavigationSlot,
    createHeaderSlot,
} from "@/app/features/chapter/lib/contentSlots";
import { generateSectionDescription } from "./helpers";

export interface SectionContent {
    videoScript?: GeneratedVideoScript;
    codeExamples: ProgressiveCodeExample[];
    quizQuestions: GeneratedQuizQuestion[];
    keyPoints: GeneratedKeyPoints;
}

/**
 * Generate content slots from generated content
 */
export function generateContentSlots(
    sectionId: string,
    sectionType: SectionType,
    content: SectionContent,
    params: ContentGenerationParams
): ContentSlot[] {
    const slots: ContentSlot[] = [];

    // Header slot
    slots.push(
        createHeaderSlot(`${sectionId}_header`, {
            variant: "full",
            showProgress: true,
            showDuration: true,
        })
    );

    // Video slot if video script exists
    if (content.videoScript) {
        slots.push(
            createVideoSlot(`${sectionId}_video`, {
                totalTime: `${content.videoScript.estimatedDuration}:00`,
                progress: 0,
            })
        );
    }

    // Text slot for section description
    slots.push(
        createTextSlot(`${sectionId}_text`, {
            title: "Overview",
            content: generateSectionDescription(
                params.pathSeed.topics[0] || "this topic",
                sectionType,
                params
            ),
            variant: "prose",
        })
    );

    // Code slots for each code example
    content.codeExamples.forEach((example, index) => {
        const lastStep = example.steps[example.steps.length - 1];
        slots.push(
            createCodeSlot(`${sectionId}_code_${index}`, {
                code: lastStep?.code || example.finalCode,
                language: example.language,
                filename: example.filename,
                showLineNumbers: true,
                showCopy: true,
                showHeader: true,
            })
        );
    });

    // Key points slot
    slots.push(
        createKeyPointsSlot(`${sectionId}_keypoints`, {
            title: content.keyPoints.title,
            points: content.keyPoints.points.map((p) => p.text),
            icon: "sparkles",
        })
    );

    // Quiz slot if quiz questions exist
    if (content.quizQuestions.length > 0) {
        slots.push(
            createQuizSlot(`${sectionId}_quiz`, {
                sectionId,
                showButton: true,
            })
        );
    }

    // Playground slot for interactive sections
    if (sectionType === "interactive") {
        slots.push(
            createPlaygroundSlot(`${sectionId}_playground`, {
                playgroundId: `playground_${sectionId}`,
                title: "Try it yourself",
                showFileExplorer: true,
            })
        );
    }

    // Navigation slot
    slots.push(
        createNavigationSlot(`${sectionId}_nav`, {
            showPrevious: true,
            showNext: true,
        })
    );

    return slots;
}
