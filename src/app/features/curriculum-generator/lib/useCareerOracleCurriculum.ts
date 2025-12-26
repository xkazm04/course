"use client";

/**
 * useCareerOracleCurriculum Hook
 *
 * Integrates the curriculum generator with the Career Oracle system.
 * Automatically generates curriculum content when a learning path is created.
 *
 * Enhanced with mastery signal derivation for implicit skill validation.
 * Completion patterns feed back to the Career Oracle to recalibrate
 * learning path difficulty and pacing dynamically.
 */

import { useState, useCallback, useMemo } from "react";
import type { PredictiveModule, PredictiveLearningPath } from "@/app/features/goal-path/lib/predictiveTypes";
import type {
    GeneratedCurriculum,
    CurriculumGenerationRequest,
    DifficultyLevel,
    CompletionData,
} from "./types";
import {
    generateCurriculum,
    generateMockCurriculum,
    generateCacheKey,
} from "./curriculumGenerator";
import { curriculumStorage } from "./curriculumStorage";
import type {
    MasterySignal,
    SkillProficiency,
    PathRecalibration,
    MasteryAnalytics,
} from "./masterySignal";
import { masteryStorage } from "./masteryStorage";

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

    // Mastery Signal Integration
    trackContentCompletion: (
        contentId: string,
        contentType: CompletionData["contentType"],
        curriculumId: string,
        completionDetails: ContentCompletionDetails
    ) => MasterySignal[];
    getSkillProficiencies: () => SkillProficiency[];
    getPathRecalibration: (pathId: string) => PathRecalibration | null;
    getMasteryAnalytics: () => MasteryAnalytics;
    getSkillsNeedingAttention: () => SkillProficiency[];
    recalibratePath: (
        pathId: string,
        moduleDifficulties: Record<string, DifficultyLevel>,
        moduleEstimatedHours: Record<string, number>
    ) => PathRecalibration;
}

/**
 * Details for tracking content completion with mastery signals
 */
export interface ContentCompletionDetails {
    /** Time spent on the content in minutes */
    timeSpent: number;
    /** Score if applicable (0-100) */
    score?: number;
    /** Number of hints used */
    hintsUsed: number;
    /** Number of attempts made */
    attempts: number;
    /** Skills covered by this content */
    skills: Array<{ id: string; name: string }>;
    /** Difficulty level of the content */
    difficulty: DifficultyLevel;
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
    // MASTERY SIGNAL INTEGRATION
    // ========================================================================

    /**
     * Track content completion and generate mastery signals.
     * This is the key function that derives implicit skill proficiency
     * from completion patterns.
     */
    const trackContentCompletion = useCallback(
        (
            contentId: string,
            contentType: CompletionData["contentType"],
            curriculumId: string,
            details: ContentCompletionDetails
        ): MasterySignal[] => {
            // Track the completion with mastery signal generation
            const { signals } = curriculumStorage.trackCompletionWithMastery(
                {
                    userId,
                    curriculumId,
                    contentId,
                    contentType,
                    status: "completed",
                    timeSpent: details.timeSpent,
                    score: details.score,
                    hintsUsed: details.hintsUsed,
                    attempts: details.attempts,
                    completedAt: new Date().toISOString(),
                },
                details.skills,
                details.difficulty
            );

            return signals;
        },
        [userId]
    );

    /**
     * Get all skill proficiencies for the current user
     */
    const getSkillProficiencies = useCallback((): SkillProficiency[] => {
        return masteryStorage.getUserSkillProficiencies(userId);
    }, [userId]);

    /**
     * Get path recalibration recommendations
     */
    const getPathRecalibrationData = useCallback(
        (pathId: string): PathRecalibration | null => {
            return masteryStorage.getPathRecalibration(userId, pathId);
        },
        [userId]
    );

    /**
     * Get mastery analytics for the current user
     */
    const getMasteryAnalyticsData = useCallback((): MasteryAnalytics => {
        return masteryStorage.getMasteryAnalytics(userId);
    }, [userId]);

    /**
     * Get skills that need attention (struggling or declining)
     */
    const getSkillsNeedingAttentionData = useCallback((): SkillProficiency[] => {
        return masteryStorage.getSkillsNeedingAttention(userId);
    }, [userId]);

    /**
     * Generate and store a path recalibration based on mastery signals.
     * This feeds the derived proficiency back to the Career Oracle
     * to adjust difficulty and pacing dynamically.
     */
    const recalibratePath = useCallback(
        (
            pathId: string,
            moduleDifficulties: Record<string, DifficultyLevel>,
            moduleEstimatedHours: Record<string, number>
        ): PathRecalibration => {
            return masteryStorage.generateAndStoreRecalibration(
                userId,
                pathId,
                moduleDifficulties,
                moduleEstimatedHours
            );
        },
        [userId]
    );

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

        // Mastery Signal Integration
        trackContentCompletion,
        getSkillProficiencies,
        getPathRecalibration: getPathRecalibrationData,
        getMasteryAnalytics: getMasteryAnalyticsData,
        getSkillsNeedingAttention: getSkillsNeedingAttentionData,
        recalibratePath,
    };
}

export default useCareerOracleCurriculum;
