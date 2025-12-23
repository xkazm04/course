/**
 * Helper Functions for Content Generation
 * Shared utilities used across generators
 */

import type { LearningPathSeed, ContentGenerationParams } from "../types";
import type { SectionType } from "@/app/features/chapter/lib/chapterData";

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get file extension for language
 */
export function getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
        typescript: "ts",
        javascript: "js",
        python: "py",
        java: "java",
        go: "go",
        rust: "rs",
        ruby: "rb",
        php: "php",
        swift: "swift",
        kotlin: "kt",
    };
    return extensions[language.toLowerCase()] || "txt";
}

/**
 * Generate filename based on topic and language
 */
export function generateFilename(topic: string, language: string): string {
    const baseName = topic.toLowerCase().replace(/\s+/g, "-");
    const ext = getFileExtension(language);
    return `${baseName}.${ext}`;
}

/**
 * Generate expected output
 */
export function generateExpectedOutput(topic: string, language: string): string {
    return `// Output: ${capitalize(topic)} initialized successfully\n// Ready to use`;
}

/**
 * Generate section description
 */
export function generateSectionDescription(
    topic: string,
    sectionType: SectionType,
    params: ContentGenerationParams
): string {
    const descriptions: Record<SectionType, string> = {
        video: `Watch this video to learn about ${topic} and understand its core concepts in the context of ${params.pathSeed.topics.join(" and ")}.`,
        lesson: `In this lesson, you'll learn the fundamentals of ${topic} through detailed explanations and practical examples.`,
        interactive: `Get hands-on experience with ${topic} in this interactive coding session. Try modifying the examples to deepen your understanding.`,
        exercise: `Test your knowledge of ${topic} with this exercise. Complete the challenges to earn XP and reinforce what you've learned.`,
    };

    return descriptions[sectionType];
}

/**
 * Generate concept explanation for narration
 */
export function generateConceptExplanation(
    topic: string,
    skillLevel: LearningPathSeed["skillLevel"]
): string {
    if (skillLevel === "beginner") {
        return `At its core, ${topic} is about simplifying complex operations. Think of it like a tool that helps you organize and manage your code more effectively.`;
    } else if (skillLevel === "intermediate") {
        return `${capitalize(topic)} provides a structured approach to handling common patterns. It builds on foundational concepts you already know and extends them for more complex scenarios.`;
    }
    return `${capitalize(topic)} enables advanced patterns and optimizations. We'll explore the underlying mechanisms and how to leverage them for production-grade applications.`;
}

/**
 * Generate code narration
 */
export function generateCodeNarration(topic: string, language: string): string {
    return `I'll walk you through implementing ${topic} in ${language}. Pay attention to the key patterns we use here, as they're applicable in many scenarios.`;
}

/**
 * Generate sample code snippet for video
 */
export function generateSampleCode(topic: string, language: string): string {
    return `// Example: ${topic}\nconst example = implement${capitalize(topic.replace(/\s+/g, ""))}();`;
}

/**
 * Generate best practices content
 */
export function generateBestPractices(topic: string): string {
    return `First, always start with a clear understanding of your requirements. Second, follow the established patterns for ${topic} to ensure maintainability. Third, write tests to verify your implementation works as expected.`;
}

/**
 * Estimate section duration based on type and density
 */
export function estimateSectionDuration(
    sectionType: SectionType,
    density: ContentGenerationParams["contentDensity"]
): string {
    const baseDurations: Record<SectionType, number> = {
        video: 10,
        lesson: 15,
        interactive: 20,
        exercise: 15,
    };

    const densityMultipliers = {
        concise: 0.7,
        standard: 1.0,
        comprehensive: 1.5,
    };

    const duration = Math.round(baseDurations[sectionType] * densityMultipliers[density]);
    return `${duration} min`;
}

/**
 * Calculate time offset for video timeline
 */
export function calculateTimeOffset(
    sectionIndex: number,
    density: ContentGenerationParams["contentDensity"]
): string {
    const baseMinutesPerSection = {
        concise: 7,
        standard: 12,
        comprehensive: 18,
    };

    const totalMinutes = sectionIndex * baseMinutesPerSection[density];
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, "0")}:00` : `${minutes}:00`;
}

/**
 * Generate a section title
 */
export function generateSectionTitle(
    topic: string,
    sectionType: SectionType,
    index: number,
    allTopics: string[]
): string {
    const prefixes: Record<SectionType, string[]> = {
        video: ["Introduction to", "Understanding", "Exploring", "Deep Dive into", "Mastering"],
        lesson: ["Learning", "Fundamentals of", "Working with", "Building with", "Advanced"],
        interactive: ["Hands-on", "Practice:", "Building", "Interactive:", "Lab:"],
        exercise: ["Challenge:", "Exercise:", "Quiz:", "Assessment:", "Review:"],
    };

    const prefix = prefixes[sectionType]?.[index % prefixes[sectionType].length] || "";
    const topicForSection = index < allTopics.length ? allTopics[index] : topic;

    return `${prefix} ${topicForSection}`.trim();
}
