/**
 * Quiz Question Generator
 * Generates quiz questions of various types with appropriate difficulty
 */

import type {
    LearningPathSeed,
    ContentGenerationParams,
    GeneratedQuizQuestion,
} from "../types";
import type { SectionType } from "@/app/features/chapter/lib/chapterData";
import { capitalize } from "./helpers";

/**
 * Generate quiz questions for a section
 */
export function generateQuizQuestions(
    topic: string,
    sectionId: string,
    sectionType: SectionType,
    params: ContentGenerationParams
): GeneratedQuizQuestion[] {
    const questions: GeneratedQuizQuestion[] = [];
    const allTopics = params.pathSeed.topics;
    const questionCount = sectionType === "exercise" ? 5 : 2;

    for (let i = 0; i < questionCount; i++) {
        const questionType = getQuestionTypeForSection(sectionType, i);
        const question = generateQuizQuestion(
            topic,
            sectionId,
            questionType,
            i,
            allTopics,
            params.pathSeed.skillLevel
        );
        questions.push(question);
    }

    return questions;
}

/**
 * Get appropriate question type based on section type
 */
function getQuestionTypeForSection(
    sectionType: SectionType,
    questionIndex: number
): GeneratedQuizQuestion["questionType"] {
    const typeMap: Record<SectionType, GeneratedQuizQuestion["questionType"][]> = {
        video: ["multiple_choice", "true_false"],
        lesson: ["multiple_choice", "code_completion"],
        interactive: ["code_completion", "ordering"],
        exercise: ["multiple_choice", "code_completion", "true_false", "ordering", "multiple_choice"],
    };

    const types = typeMap[sectionType];
    return types[questionIndex % types.length] || "multiple_choice";
}

/**
 * Generate a single quiz question
 */
function generateQuizQuestion(
    topic: string,
    sectionId: string,
    questionType: GeneratedQuizQuestion["questionType"],
    index: number,
    allTopics: string[],
    skillLevel: LearningPathSeed["skillLevel"]
): GeneratedQuizQuestion {
    const questionId = `${sectionId}_q${index + 1}`;

    switch (questionType) {
        case "multiple_choice":
            return generateMultipleChoiceQuestion(questionId, topic, sectionId, skillLevel);
        case "true_false":
            return generateTrueFalseQuestion(questionId, topic, sectionId, skillLevel);
        case "code_completion":
            return generateCodeCompletionQuestion(questionId, topic, sectionId, skillLevel);
        case "ordering":
            return generateOrderingQuestion(questionId, topic, sectionId, skillLevel);
        default:
            return generateMultipleChoiceQuestion(questionId, topic, sectionId, skillLevel);
    }
}

/**
 * Generate multiple choice question
 */
function generateMultipleChoiceQuestion(
    questionId: string,
    topic: string,
    sectionId: string,
    skillLevel: LearningPathSeed["skillLevel"]
): GeneratedQuizQuestion {
    return {
        id: questionId,
        question: `Which of the following best describes ${topic}?`,
        questionType: "multiple_choice",
        options: [
            { id: "a", text: `A core concept in ${topic} that enables better performance`, isCorrect: true },
            { id: "b", text: "An optional feature rarely used in practice", isCorrect: false },
            { id: "c", text: "A deprecated approach that should be avoided", isCorrect: false },
            { id: "d", text: "A third-party library for advanced use cases", isCorrect: false },
        ],
        explanation: `${topic} is indeed a core concept that enables better performance and maintainability in your applications.`,
        difficulty: skillLevel === "advanced" ? "hard" : skillLevel === "intermediate" ? "medium" : "easy",
        xpReward: skillLevel === "advanced" ? 30 : skillLevel === "intermediate" ? 20 : 10,
        sectionId,
    };
}

/**
 * Generate true/false question
 */
function generateTrueFalseQuestion(
    questionId: string,
    topic: string,
    sectionId: string,
    skillLevel: LearningPathSeed["skillLevel"]
): GeneratedQuizQuestion {
    return {
        id: questionId,
        question: `True or False: ${topic} can only be used in specific scenarios and has limited applicability.`,
        questionType: "true_false",
        options: [
            { id: "true", text: "True", isCorrect: false },
            { id: "false", text: "False", isCorrect: true },
        ],
        explanation: `This is false. ${topic} is widely applicable and can be used in many different scenarios to improve your code.`,
        difficulty: "easy",
        xpReward: 10,
        sectionId,
    };
}

/**
 * Generate code completion question
 */
function generateCodeCompletionQuestion(
    questionId: string,
    topic: string,
    sectionId: string,
    skillLevel: LearningPathSeed["skillLevel"]
): GeneratedQuizQuestion {
    return {
        id: questionId,
        question: `Complete the following code to properly implement ${topic}:`,
        questionType: "code_completion",
        correctCode: `// Correct implementation of ${topic}
const result = implement${capitalize(topic.replace(/\s+/g, ""))}();`,
        explanation: `The correct implementation uses the standard pattern for ${topic}, ensuring proper initialization and error handling.`,
        difficulty: skillLevel === "advanced" ? "hard" : "medium",
        xpReward: skillLevel === "advanced" ? 40 : 25,
        sectionId,
    };
}

/**
 * Generate ordering question
 */
function generateOrderingQuestion(
    questionId: string,
    topic: string,
    sectionId: string,
    skillLevel: LearningPathSeed["skillLevel"]
): GeneratedQuizQuestion {
    return {
        id: questionId,
        question: `Put the following steps in the correct order to implement ${topic}:`,
        questionType: "ordering",
        options: [
            { id: "1", text: "Initialize the configuration", isCorrect: true },
            { id: "2", text: "Set up dependencies", isCorrect: true },
            { id: "3", text: "Implement core logic", isCorrect: true },
            { id: "4", text: "Add error handling", isCorrect: true },
        ],
        explanation: `The correct order ensures proper initialization and dependency management before implementing the core logic.`,
        difficulty: "medium",
        xpReward: 20,
        sectionId,
    };
}
