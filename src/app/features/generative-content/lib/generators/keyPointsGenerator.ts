/**
 * Key Points Generator
 * Generates key takeaways and summaries for sections
 */

import type {
    LearningPathSeed,
    ContentGenerationParams,
    GeneratedKeyPoints,
} from "../types";
import type { SectionType } from "@/app/features/chapter/lib/chapterData";
import { capitalize } from "./helpers";

/**
 * Generate key points for a section
 */
export function generateKeyPoints(
    topic: string,
    sectionId: string,
    title: string,
    sectionType: SectionType,
    params: ContentGenerationParams
): GeneratedKeyPoints {
    const allTopics = params.pathSeed.topics;
    const points = generateKeyPointsList(topic, sectionType, allTopics, params.pathSeed.skillLevel);

    return {
        sectionId,
        title: `Key Takeaways: ${title}`,
        points,
        summary: `In this section, we covered the fundamentals of ${topic} and how it integrates with ${allTopics.join(", ")}.`,
    };
}

/**
 * Generate list of key points
 */
function generateKeyPointsList(
    topic: string,
    sectionType: SectionType,
    allTopics: string[],
    skillLevel: LearningPathSeed["skillLevel"]
): GeneratedKeyPoints["points"] {
    const basePoints: GeneratedKeyPoints["points"] = [
        {
            text: `${capitalize(topic)} is a fundamental concept for building modern applications`,
            importance: "essential",
        },
        {
            text: `Understanding ${topic} helps you write more maintainable and scalable code`,
            importance: "essential",
        },
        {
            text: `Best practices include proper error handling and following established patterns`,
            importance: "recommended",
        },
    ];

    // Add section-type specific points
    if (sectionType === "interactive" || sectionType === "exercise") {
        basePoints.push({
            text: "Practice is essential - try modifying the examples to reinforce your understanding",
            importance: "recommended",
        });
    }

    if (sectionType === "video" || sectionType === "lesson") {
        basePoints.push({
            text: "Review the official documentation for more detailed information",
            importance: "supplementary",
            sourceReference: `https://docs.example.com/${topic.toLowerCase().replace(/\s+/g, "-")}`,
        });
    }

    // Add skill-level specific points
    if (skillLevel === "advanced") {
        basePoints.push({
            text: `Consider edge cases and performance implications when using ${topic}`,
            importance: "recommended",
        });
    }

    if (skillLevel === "beginner") {
        basePoints.push({
            text: "Don't worry about memorizing everything - focus on understanding the core concepts",
            importance: "supplementary",
        });
    }

    return basePoints;
}
