"use client";

/**
 * useCareerOracleCurriculum Hook
 *
 * Integrates the curriculum generator with the Career Oracle system.
 * Automatically generates curriculum content when a learning path is created.
 */

import { useState, useCallback, useMemo } from "react";
import type { PredictiveModule, PredictiveLearningPath } from "@/app/features/goal-path/lib/predictiveTypes";
import type {
    GeneratedCurriculum,
    CurriculumGenerationRequest,
    DifficultyLevel,
} from "./types";
import {
    generateCurriculum,
    generateMockCurriculum,
    generateCacheKey,
} from "./curriculumGenerator";
import { curriculumStorage } from "./curriculumStorage";

// ============================================================================
// TYPES
// ============================================================================

export interface UseCareerOracleCurriculumOptions {
    /** Use mock data instead of real API calls */
    useMock?: boolean;
    /** User ID for tracking */
    userId?: string;
    /** Auto-generate curriculum when path changes */
    autoGenerate?: boolean;
}

export interface UseCareerOracleCurriculumReturn {
    // State
    curricula: Record<string, GeneratedCurriculum>;
    currentModuleCurriculum: GeneratedCurriculum | null;
    isGenerating: boolean;
    generatingModuleId: string | null;
    error: string | null;

    // Actions
    generateCurriculumForModule: (module: PredictiveModule, userProfile: OracleUserProfile) => Promise<GeneratedCurriculum | null>;
    generateAllCurricula: (path: PredictiveLearningPath, userProfile: OracleUserProfile) => Promise<void>;
    getCurriculumForModule: (moduleId: string) => GeneratedCurriculum | null;
    setCurrentModule: (moduleId: string) => void;

    // Progress
    getPathProgress: () => PathCurriculumProgress;

    // Bulk operations
    preloadNextModule: (currentModuleId: string, path: PredictiveLearningPath, userProfile: OracleUserProfile) => void;
}

export interface OracleUserProfile {
    currentSkills: string[];
    targetRole: string;
    targetSector?: string;
    learningStyle: string;
    weeklyHours: number;
    currentLevel: DifficultyLevel;
}

export interface PathCurriculumProgress {
    totalModules: number;
    generatedModules: number;
    completedModules: number;
    totalLessons: number;
    completedLessons: number;
    totalExercises: number;
    completedExercises: number;
    overallProgress: number;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useCareerOracleCurriculum(
    options: UseCareerOracleCurriculumOptions = {}
): UseCareerOracleCurriculumReturn {
    const { useMock = false, userId = "anonymous", autoGenerate = false } = options;

    // State
    const [curricula, setCurricula] = useState<Record<string, GeneratedCurriculum>>({});
    const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingModuleId, setGeneratingModuleId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // ========================================================================
    // GENERATE CURRICULUM FOR SINGLE MODULE
    // ========================================================================

    const generateCurriculumForModule = useCallback(
        async (
            module: PredictiveModule,
            userProfile: OracleUserProfile
        ): Promise<GeneratedCurriculum | null> => {
            // Build request
            const request: CurriculumGenerationRequest = {
                module: {
                    id: module.id,
                    title: module.title,
                    skills: module.skills,
                    estimatedHours: module.estimatedHours,
                    sequence: module.sequence,
                },
                userProfile: {
                    currentSkills: userProfile.currentSkills,
                    targetRole: userProfile.targetRole,
                    targetSector: userProfile.targetSector,
                    learningStyle: userProfile.learningStyle,
                    weeklyHours: userProfile.weeklyHours,
                    currentLevel: userProfile.currentLevel,
                },
                generateOptions: {
                    lessons: true,
                    exercises: true,
                    quizzes: true,
                    projects: true,
                },
                context: {
                    previousModules: module.prerequisites,
                },
            };

            // Check cache first
            const cacheKey = generateCacheKey(request);
            const cached = curriculumStorage.getCached(cacheKey);

            if (cached) {
                setCurricula((prev) => ({ ...prev, [module.id]: cached }));
                return cached;
            }

            // Generate new curriculum
            setIsGenerating(true);
            setGeneratingModuleId(module.id);
            setError(null);

            try {
                let result: GeneratedCurriculum;

                if (useMock) {
                    result = generateMockCurriculum(request);
                } else {
                    const response = await generateCurriculum(request);

                    if (!response.success || !response.curriculum) {
                        throw new Error(response.error?.message || "Failed to generate curriculum");
                    }

                    result = response.curriculum;
                }

                // Cache and store
                curriculumStorage.cache(cacheKey, result);
                curriculumStorage.saveUserCurriculum(result);

                setCurricula((prev) => ({ ...prev, [module.id]: result }));
                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                setError(errorMessage);
                return null;
            } finally {
                setIsGenerating(false);
                setGeneratingModuleId(null);
            }
        },
        [useMock]
    );

    // ========================================================================
    // GENERATE ALL CURRICULA FOR PATH
    // ========================================================================

    const generateAllCurricula = useCallback(
        async (
            path: PredictiveLearningPath,
            userProfile: OracleUserProfile
        ): Promise<void> => {
            setError(null);

            for (const module of path.modules) {
                // Check if already generated
                if (curricula[module.id]) continue;

                // Generate curriculum for this module
                await generateCurriculumForModule(module, userProfile);

                // Small delay to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        },
        [curricula, generateCurriculumForModule]
    );

    // ========================================================================
    // GET CURRICULUM FOR MODULE
    // ========================================================================

    const getCurriculumForModule = useCallback(
        (moduleId: string): GeneratedCurriculum | null => {
            return curricula[moduleId] || null;
        },
        [curricula]
    );

    // ========================================================================
    // SET CURRENT MODULE
    // ========================================================================

    const setCurrentModule = useCallback((moduleId: string) => {
        setCurrentModuleId(moduleId);
    }, []);

    // ========================================================================
    // PRELOAD NEXT MODULE
    // ========================================================================

    const preloadNextModule = useCallback(
        (
            currentModuleId: string,
            path: PredictiveLearningPath,
            userProfile: OracleUserProfile
        ) => {
            const currentIndex = path.modules.findIndex((m) => m.id === currentModuleId);
            if (currentIndex === -1 || currentIndex >= path.modules.length - 1) return;

            const nextModule = path.modules[currentIndex + 1];
            if (curricula[nextModule.id]) return; // Already generated

            // Generate in background
            generateCurriculumForModule(nextModule, userProfile);
        },
        [curricula, generateCurriculumForModule]
    );

    // ========================================================================
    // GET PATH PROGRESS
    // ========================================================================

    const getPathProgress = useCallback((): PathCurriculumProgress => {
        const curriculaList = Object.values(curricula);

        const totalModules = curriculaList.length;
        const generatedModules = curriculaList.length;

        let totalLessons = 0;
        let completedLessons = 0;
        let totalExercises = 0;
        let completedExercises = 0;

        curriculaList.forEach((curriculum) => {
            totalLessons += curriculum.lessons.length;
            totalExercises += curriculum.exercises.length;

            // Get completion data
            const completions = curriculumStorage.getUserCompletionData(userId, curriculum.id);
            completions.forEach((c) => {
                if (c.status === "completed") {
                    if (c.contentType === "lesson") completedLessons++;
                    if (c.contentType === "exercise") completedExercises++;
                }
            });
        });

        const totalItems = totalLessons + totalExercises;
        const completedItems = completedLessons + completedExercises;
        const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

        // Calculate completed modules
        let completedModules = 0;
        curriculaList.forEach((curriculum) => {
            const rate = curriculumStorage.getCurriculumCompletionRate(userId, curriculum.id);
            if (rate >= 0.8) completedModules++; // Consider 80% as complete
        });

        return {
            totalModules,
            generatedModules,
            completedModules,
            totalLessons,
            completedLessons,
            totalExercises,
            completedExercises,
            overallProgress,
        };
    }, [curricula, userId]);

    // ========================================================================
    // CURRENT MODULE CURRICULUM
    // ========================================================================

    const currentModuleCurriculum = useMemo(() => {
        if (!currentModuleId) return null;
        return curricula[currentModuleId] || null;
    }, [currentModuleId, curricula]);

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        // State
        curricula,
        currentModuleCurriculum,
        isGenerating,
        generatingModuleId,
        error,

        // Actions
        generateCurriculumForModule,
        generateAllCurricula,
        getCurriculumForModule,
        setCurrentModule,

        // Progress
        getPathProgress,

        // Bulk operations
        preloadNextModule,
    };
}

export default useCareerOracleCurriculum;
