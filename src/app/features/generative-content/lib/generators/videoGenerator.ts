/**
 * Video Script Generator
 * Generates video scripts with segments, narration, and production notes
 */

import type {
    ContentGenerationParams,
    GeneratedVideoScript,
    VideoScriptSegment,
} from "../types";
import type { SectionType } from "@/app/features/chapter/lib/chapterData";
import {
    generateConceptExplanation,
    generateCodeNarration,
    generateSampleCode,
    generateBestPractices,
} from "./helpers";

/**
 * Generate a video script for a section
 */
export function generateVideoScript(
    topic: string,
    sectionId: string,
    title: string,
    sectionType: SectionType,
    params: ContentGenerationParams
): GeneratedVideoScript {
    const segments = generateVideoSegments(topic, sectionType, params);

    return {
        sectionId,
        title,
        estimatedDuration: calculateScriptDuration(segments),
        segments,
        productionNotes: generateProductionNotes(sectionType),
    };
}

/**
 * Generate video script segments
 */
function generateVideoSegments(
    topic: string,
    sectionType: SectionType,
    params: ContentGenerationParams
): VideoScriptSegment[] {
    const { pathSeed, contentDensity } = params;
    const allTopics = pathSeed.topics.join(" and ");
    const segments: VideoScriptSegment[] = [];
    let currentTime = 0;

    // Intro segment
    const introDuration = contentDensity === "comprehensive" ? 60 : 30;
    segments.push({
        startTime: currentTime,
        endTime: currentTime + introDuration,
        narration: `Welcome! In this section, we'll explore ${topic} in the context of ${allTopics}. By the end, you'll understand the core concepts and be ready to apply them in practice.`,
        visualCues: ["Show title card", "Display learning objectives", "Animate topic overview"],
        keyPoint: `Introduction to ${topic}`,
    });
    currentTime += introDuration;

    // Main content segments based on type
    if (sectionType === "video" || sectionType === "lesson") {
        const conceptDuration = contentDensity === "comprehensive" ? 180 : 120;
        segments.push({
            startTime: currentTime,
            endTime: currentTime + conceptDuration,
            narration: `Let's start by understanding what ${topic} is and why it matters. ${generateConceptExplanation(topic, pathSeed.skillLevel)}`,
            visualCues: ["Show concept diagram", "Animate key terms", "Display real-world analogy"],
            keyPoint: `Core concepts of ${topic}`,
        });
        currentTime += conceptDuration;
    }

    if (params.includeCode && (sectionType === "lesson" || sectionType === "interactive")) {
        const codeDuration = contentDensity === "comprehensive" ? 240 : 150;
        segments.push({
            startTime: currentTime,
            endTime: currentTime + codeDuration,
            narration: `Now let's see ${topic} in action with a practical example. ${generateCodeNarration(topic, params.codeLanguage || "typescript")}`,
            visualCues: ["Show code editor", "Highlight key lines", "Show output preview"],
            codeToShow: generateSampleCode(topic, params.codeLanguage || "typescript"),
            keyPoint: `Practical implementation of ${topic}`,
        });
        currentTime += codeDuration;
    }

    // Best practices segment
    if (contentDensity !== "concise") {
        const practicesDuration = 90;
        segments.push({
            startTime: currentTime,
            endTime: currentTime + practicesDuration,
            narration: `Here are some best practices to keep in mind when working with ${topic}. ${generateBestPractices(topic)}`,
            visualCues: ["Show bullet points", "Animate checkmarks", "Display tip icons"],
            keyPoint: `Best practices for ${topic}`,
        });
        currentTime += practicesDuration;
    }

    // Summary segment
    const summaryDuration = 45;
    segments.push({
        startTime: currentTime,
        endTime: currentTime + summaryDuration,
        narration: `To summarize, we've covered the fundamentals of ${topic}, including its core concepts and practical applications. In the next section, we'll build on this knowledge.`,
        visualCues: ["Recap key points", "Show progress indicator", "Preview next section"],
        keyPoint: `Summary of ${topic}`,
    });

    return segments;
}

/**
 * Calculate total script duration from segments
 */
function calculateScriptDuration(segments: VideoScriptSegment[]): number {
    if (segments.length === 0) return 0;
    const lastSegment = segments[segments.length - 1];
    return Math.ceil((lastSegment?.endTime || 0) / 60);
}

/**
 * Generate production notes
 */
function generateProductionNotes(sectionType: SectionType): string {
    const notes: Record<SectionType, string> = {
        video: "Use animated diagrams for concepts. Include b-roll of related tools/interfaces.",
        lesson: "Focus on clear, step-by-step explanations. Use split-screen for code and output.",
        interactive: "Include pause points for viewer practice. Show expected vs. actual results.",
        exercise: "Provide clear problem statements. Include hints at strategic points.",
    };

    return notes[sectionType];
}
