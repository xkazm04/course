/**
 * Assessment Storage - Persists assessment state and results
 */

import { createLocalStorage } from "@/app/shared/lib/storageFactory";
import {
    AssessmentStorageData,
    AssessmentState,
    AssessmentProfile,
    AssessmentAnswer,
} from "./types";

const STORAGE_KEY = "skill-assessment";
const STORAGE_VERSION = "1.0";

const defaultData: AssessmentStorageData = {
    currentAssessment: null,
    profile: null,
    hasCompletedOnboarding: false,
};

const storage = createLocalStorage<AssessmentStorageData>({
    storageKey: STORAGE_KEY,
    getDefault: () => defaultData,
    version: STORAGE_VERSION,
});

/**
 * Assessment storage module
 */
export const assessmentStorage = {
    /**
     * Get current assessment state
     */
    getCurrentAssessment: (): AssessmentState | null => {
        return storage.get().currentAssessment;
    },

    /**
     * Start a new assessment
     */
    startAssessment: (): AssessmentState => {
        const newAssessment: AssessmentState = {
            currentQuestionIndex: 0,
            answers: [],
            startedAt: Date.now(),
            isComplete: false,
        };
        storage.update((data) => ({
            ...data,
            currentAssessment: newAssessment,
        }));
        return newAssessment;
    },

    /**
     * Save an answer and advance
     */
    saveAnswer: (answer: AssessmentAnswer): AssessmentState | null => {
        const current = storage.get();
        if (!current.currentAssessment) return null;

        const existingIndex = current.currentAssessment.answers.findIndex(
            (a) => a.questionId === answer.questionId
        );

        const updatedAnswers =
            existingIndex >= 0
                ? current.currentAssessment.answers.map((a, i) =>
                      i === existingIndex ? answer : a
                  )
                : [...current.currentAssessment.answers, answer];

        const updatedAssessment: AssessmentState = {
            ...current.currentAssessment,
            answers: updatedAnswers,
            currentQuestionIndex: current.currentAssessment.currentQuestionIndex + 1,
        };

        storage.update((data) => ({
            ...data,
            currentAssessment: updatedAssessment,
        }));

        return updatedAssessment;
    },

    /**
     * Go back to previous question
     */
    goBack: (): AssessmentState | null => {
        const current = storage.get();
        if (!current.currentAssessment) return null;
        if (current.currentAssessment.currentQuestionIndex === 0) return current.currentAssessment;

        const updatedAssessment: AssessmentState = {
            ...current.currentAssessment,
            currentQuestionIndex: current.currentAssessment.currentQuestionIndex - 1,
        };

        storage.update((data) => ({
            ...data,
            currentAssessment: updatedAssessment,
        }));

        return updatedAssessment;
    },

    /**
     * Mark assessment as complete
     */
    completeAssessment: (): AssessmentState | null => {
        const current = storage.get();
        if (!current.currentAssessment) return null;

        const updatedAssessment: AssessmentState = {
            ...current.currentAssessment,
            completedAt: Date.now(),
            isComplete: true,
        };

        storage.update((data) => ({
            ...data,
            currentAssessment: updatedAssessment,
        }));

        return updatedAssessment;
    },

    /**
     * Save assessment profile (final results)
     */
    saveProfile: (profile: AssessmentProfile): void => {
        storage.update((data) => ({
            ...data,
            profile,
            currentAssessment: null,
            hasCompletedOnboarding: true,
        }));
    },

    /**
     * Get saved profile
     */
    getProfile: (): AssessmentProfile | null => {
        return storage.get().profile;
    },

    /**
     * Check if user has completed onboarding
     */
    hasCompletedOnboarding: (): boolean => {
        return storage.get().hasCompletedOnboarding;
    },

    /**
     * Reset assessment (start over)
     */
    resetAssessment: (): void => {
        storage.update((data) => ({
            ...data,
            currentAssessment: null,
        }));
    },

    /**
     * Clear all data
     */
    clearAll: (): void => {
        storage.save(defaultData);
    },
};
