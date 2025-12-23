"use client";

/**
 * useAssessment Hook - Manages assessment state and flow
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { assessmentStorage } from "./assessmentStorage";
import { assessmentQuestions, getPathConfig, getIntensityConfig } from "./assessmentData";
import {
    AssessmentState,
    AssessmentAnswer,
    AssessmentResult,
    AssessmentProfile,
    LearningPath,
    LearningIntensity,
    SkillLevel,
    PrimaryGoal,
} from "./types";
import { generateId } from "@/app/shared/lib/storageFactory";

interface UseAssessmentReturn {
    /** Current assessment state */
    state: AssessmentState | null;
    /** Current question */
    currentQuestion: typeof assessmentQuestions[0] | null;
    /** Progress percentage (0-100) */
    progress: number;
    /** Total questions count */
    totalQuestions: number;
    /** Is assessment complete */
    isComplete: boolean;
    /** Has user completed onboarding before */
    hasCompletedOnboarding: boolean;
    /** Saved profile if exists */
    profile: AssessmentProfile | null;
    /** Generated result (available when complete) */
    result: AssessmentResult | null;
    /** Start a new assessment */
    startAssessment: () => void;
    /** Answer current question and advance */
    answerQuestion: (optionIds: string[]) => void;
    /** Go back to previous question */
    goBack: () => void;
    /** Reset assessment */
    reset: () => void;
    /** Finalize and save profile */
    saveProfile: () => void;
    /** Get previously selected options for current question */
    getCurrentAnswers: () => string[];
}

/**
 * Calculate recommended path based on answers
 */
function calculateResult(answers: AssessmentAnswer[]): AssessmentResult {
    // Path score accumulator
    const pathScores: Record<LearningPath, number> = {
        "frontend-mastery": 0,
        "fullstack-architect": 0,
        "backend-specialist": 0,
        "devops-engineer": 0,
        "mobile-developer": 0,
        "ai-ml-engineer": 0,
    };

    // Variables to track specific answers
    let skillLevel: SkillLevel = "beginner";
    let primaryGoal: PrimaryGoal = "skill-upgrade";
    let weeklyHours = 10;

    // Process answers
    answers.forEach((answer) => {
        const question = assessmentQuestions.find((q) => q.id === answer.questionId);
        if (!question) return;

        answer.selectedOptionIds.forEach((optionId) => {
            const option = question.options.find((o) => o.id === optionId);
            if (!option) return;

            // Accumulate path weights
            if (option.pathWeights) {
                Object.entries(option.pathWeights).forEach(([path, weight]) => {
                    pathScores[path as LearningPath] += weight;
                });
            }

            // Track experience level
            if (question.id === "experience-level") {
                if (optionId === "complete-beginner") skillLevel = "beginner";
                else if (optionId === "some-basics") skillLevel = "beginner";
                else if (optionId === "intermediate") skillLevel = "intermediate";
                else if (optionId === "advanced") skillLevel = "advanced";
            }

            // Track primary goal
            if (question.id === "primary-goal") {
                primaryGoal = optionId as PrimaryGoal;
            }

            // Track available time
            if (question.id === "available-time") {
                if (optionId === "5-hours") weeklyHours = 5;
                else if (optionId === "10-hours") weeklyHours = 10;
                else if (optionId === "20-hours") weeklyHours = 20;
                else if (optionId === "40-hours") weeklyHours = 40;
            }
        });
    });

    // Find highest scoring path
    const sortedPaths = Object.entries(pathScores).sort(([, a], [, b]) => b - a);
    const [topPathId, topScore] = sortedPaths[0];
    const totalScore = Object.values(pathScores).reduce((a, b) => a + b, 0);

    const recommendedPath = topPathId as LearningPath;
    const pathConfig = getPathConfig(recommendedPath);
    const confidence = totalScore > 0 ? Math.min(100, Math.round((topScore / totalScore) * 100 * 2)) : 50;

    // Determine intensity based on time and skill level
    let intensityId: LearningIntensity;
    if (weeklyHours >= 40) intensityId = "4-week-sprint";
    else if (weeklyHours >= 20) intensityId = "8-week-balanced";
    else if (weeklyHours >= 10) intensityId = "12-week-intensive";
    else intensityId = "16-week-comprehensive";

    const intensityConfig = getIntensityConfig(intensityId);

    // Generate personalized tags
    const personalizedTags = generatePersonalizedTags(
        recommendedPath,
        skillLevel,
        primaryGoal,
        intensityConfig.weeks
    );

    // Generate summary
    const summary = generateSummary(pathConfig.name, skillLevel, primaryGoal, intensityConfig.weeks);

    return {
        id: generateId(),
        recommendedPath,
        pathDisplayName: pathConfig.name,
        confidence,
        recommendedIntensity: intensityId,
        intensityDisplayName: intensityConfig.name,
        personalizedTags,
        moduleOrder: pathConfig.modules,
        summary,
        estimatedWeeks: intensityConfig.weeks,
        skillLevel,
        primaryGoal,
    };
}

function generatePersonalizedTags(
    path: LearningPath,
    skillLevel: SkillLevel,
    goal: PrimaryGoal,
    weeks: number
): string[] {
    const tags: string[] = [];
    const pathConfig = getPathConfig(path);

    // Path tag
    tags.push(`Your Path: ${pathConfig.shortName}`);

    // Intensity tag
    tags.push(`${weeks}-Week Plan`);

    // Level-based tag
    if (skillLevel === "beginner") {
        tags.push("Start from Zero");
    } else if (skillLevel === "intermediate") {
        tags.push("Level Up");
    } else {
        tags.push("Expert Track");
    }

    // Goal-based tag
    if (goal === "career-switch" || goal === "first-job") {
        tags.push("Career Ready");
    } else if (goal === "skill-upgrade") {
        tags.push("Skill Booster");
    } else {
        tags.push("Project Builder");
    }

    return tags;
}

function generateSummary(
    pathName: string,
    skillLevel: SkillLevel,
    goal: PrimaryGoal,
    weeks: number
): string {
    const levelPhrase =
        skillLevel === "beginner"
            ? "starting from the fundamentals"
            : skillLevel === "intermediate"
            ? "building on your foundation"
            : "accelerating your expertise";

    const goalPhrase =
        goal === "career-switch" || goal === "first-job"
            ? "landing your first tech role"
            : goal === "skill-upgrade"
            ? "advancing your career"
            : "bringing your ideas to life";

    return `Your personalized ${weeks}-week ${pathName} curriculum is designed for ${levelPhrase}, with a focus on ${goalPhrase}.`;
}

/**
 * React hook for managing the skill assessment flow
 */
export function useAssessment(): UseAssessmentReturn {
    const [state, setState] = useState<AssessmentState | null>(null);
    const [profile, setProfile] = useState<AssessmentProfile | null>(null);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

    // Load initial state
    useEffect(() => {
        const currentAssessment = assessmentStorage.getCurrentAssessment();
        const savedProfile = assessmentStorage.getProfile();
        const completed = assessmentStorage.hasCompletedOnboarding();

        setState(currentAssessment);
        setProfile(savedProfile);
        setHasCompletedOnboarding(completed);
    }, []);

    // Current question
    const currentQuestion = useMemo(() => {
        if (!state || state.isComplete) return null;
        return assessmentQuestions[state.currentQuestionIndex] || null;
    }, [state]);

    // Progress
    const progress = useMemo(() => {
        if (!state) return 0;
        return Math.round((state.currentQuestionIndex / assessmentQuestions.length) * 100);
    }, [state]);

    // Is complete
    const isComplete = state?.isComplete ?? false;

    // Calculate result when complete
    const result = useMemo(() => {
        if (!state?.isComplete) return null;
        return calculateResult(state.answers);
    }, [state]);

    // Start assessment
    const startAssessment = useCallback(() => {
        const newState = assessmentStorage.startAssessment();
        setState(newState);
    }, []);

    // Answer question
    const answerQuestion = useCallback((optionIds: string[]) => {
        if (!currentQuestion) return;

        const answer: AssessmentAnswer = {
            questionId: currentQuestion.id,
            selectedOptionIds: optionIds,
            timestamp: Date.now(),
        };

        const updatedState = assessmentStorage.saveAnswer(answer);

        // Check if we've answered all questions
        if (updatedState && updatedState.currentQuestionIndex >= assessmentQuestions.length) {
            const completedState = assessmentStorage.completeAssessment();
            setState(completedState);
        } else {
            setState(updatedState);
        }
    }, [currentQuestion]);

    // Go back
    const goBack = useCallback(() => {
        const updatedState = assessmentStorage.goBack();
        setState(updatedState);
    }, []);

    // Reset
    const reset = useCallback(() => {
        assessmentStorage.resetAssessment();
        setState(null);
    }, []);

    // Save profile
    const saveProfile = useCallback(() => {
        if (!state || !result) return;

        const newProfile: AssessmentProfile = {
            id: generateId(),
            result,
            answers: state.answers,
            completedAt: new Date().toISOString(),
            version: "1.0",
        };

        assessmentStorage.saveProfile(newProfile);
        setProfile(newProfile);
        setHasCompletedOnboarding(true);
        setState(null);
    }, [state, result]);

    // Get current answers for question
    const getCurrentAnswers = useCallback((): string[] => {
        if (!state || !currentQuestion) return [];
        const answer = state.answers.find((a) => a.questionId === currentQuestion.id);
        return answer?.selectedOptionIds ?? [];
    }, [state, currentQuestion]);

    return {
        state,
        currentQuestion,
        progress,
        totalQuestions: assessmentQuestions.length,
        isComplete,
        hasCompletedOnboarding,
        profile,
        result,
        startAssessment,
        answerQuestion,
        goBack,
        reset,
        saveProfile,
        getCurrentAnswers,
    };
}
