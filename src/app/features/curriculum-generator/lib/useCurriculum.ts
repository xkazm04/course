"use client";

/**
 * useCurriculum Hook
 *
 * React hook for managing curriculum generation, caching, and user progress.
 * Integrates with the Career Oracle for seamless path-to-content generation.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import type {
    GeneratedCurriculum,
    CurriculumGenerationRequest,
    ContentFeedback,
    CompletionData,
    DifficultyLevel,
    LessonOutline,
    CodeExercise,
    Quiz,
    ProjectSpecification,
} from "./types";
import {
    generateCurriculum,
    generateMockCurriculum,
    generateCacheKey,
} from "./curriculumGenerator";
import {
    curriculumStorage,
} from "./curriculumStorage";

// ============================================================================
// TYPES
// ============================================================================

export interface UseCurriculumOptions {
    /** Use mock data instead of real API calls */
    useMock?: boolean;
    /** Auto-save generated curriculum */
    autoSave?: boolean;
    /** User ID for tracking */
    userId?: string;
}

export interface UseCurriculumReturn {
    // State
    curriculum: GeneratedCurriculum | null;
    isGenerating: boolean;
    error: string | null;
    progress: CurriculumProgress;

    // Generation
    generateForModule: (request: CurriculumGenerationRequest) => Promise<void>;
    generateFromPath: (
        module: { id: string; title: string; skills: string[]; estimatedHours: number; sequence: number },
        userProfile: {
            currentSkills: string[];
            targetRole: string;
            targetSector?: string;
            learningStyle: string;
            weeklyHours: number;
            currentLevel: DifficultyLevel;
        }
    ) => Promise<void>;

    // Content access
    getCurrentLesson: () => LessonOutline | null;
    getNextLesson: () => LessonOutline | null;
    getExerciseById: (id: string) => CodeExercise | null;
    getQuizById: (id: string) => Quiz | null;
    getProjectById: (id: string) => ProjectSpecification | null;

    // Progress tracking
    markLessonComplete: (lessonId: string) => void;
    markExerciseComplete: (exerciseId: string, score?: number) => void;
    markQuizComplete: (quizId: string, score: number) => void;
    markProjectComplete: (projectId: string) => void;
    startContent: (contentId: string, contentType: ContentFeedback["contentType"]) => void;

    // Feedback
    submitFeedback: (
        contentId: string,
        contentType: ContentFeedback["contentType"],
        feedback: {
            rating: number;
            clarity: number;
            difficultyMatch: number;
            relevance: number;
            engagement: number;
            comment?: string;
            struggled?: boolean;
            suggestions?: string[];
        }
    ) => void;

    // Saved curricula
    savedCurricula: GeneratedCurriculum[];
    saveCurriculum: () => void;
    loadCurriculum: (id: string) => void;
    deleteCurriculum: (id: string) => void;

    // Cache
    clearCache: () => void;
    cacheStats: { hitRate: number; totalEntries: number };
}

export interface CurriculumProgress {
    lessonsCompleted: number;
    lessonsTotal: number;
    exercisesCompleted: number;
    exercisesTotal: number;
    quizzesCompleted: number;
    quizzesTotal: number;
    projectsCompleted: number;
    projectsTotal: number;
    overallProgress: number;
    currentLessonIndex: number;
    timeSpentMinutes: number;
    averageScore: number;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useCurriculum(options: UseCurriculumOptions = {}): UseCurriculumReturn {
    const { useMock = false, autoSave = true, userId = "anonymous" } = options;

    // State
    const [curriculum, setCurriculum] = useState<GeneratedCurriculum | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedCurricula, setSavedCurricula] = useState<GeneratedCurriculum[]>([]);
    const [completionState, setCompletionState] = useState<Record<string, CompletionData>>({});
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [timeTracking, setTimeTracking] = useState<{ contentId: string; startTime: number } | null>(null);

    // Load saved curricula on mount
    useEffect(() => {
        setSavedCurricula(curriculumStorage.getUserCurricula());
    }, []);

    // Load completion data when curriculum changes
    useEffect(() => {
        if (curriculum) {
            const completions = curriculumStorage.getUserCompletionData(userId, curriculum.id);
            const completionMap: Record<string, CompletionData> = {};
            completions.forEach((c) => {
                completionMap[c.contentId] = c;
            });
            setCompletionState(completionMap);
        }
    }, [curriculum, userId]);

    // ========================================================================
    // GENERATION
    // ========================================================================

    const generateForModule = useCallback(
        async (request: CurriculumGenerationRequest) => {
            setIsGenerating(true);
            setError(null);

            try {
                // Check cache first
                const cacheKey = generateCacheKey(request);
                const cached = curriculumStorage.getCached(cacheKey);

                if (cached) {
                    setCurriculum(cached);
                    setCurrentLessonIndex(0);
                    setIsGenerating(false);
                    return;
                }

                // Generate new curriculum
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

                // Cache the result
                curriculumStorage.cache(cacheKey, result);

                // Auto-save if enabled
                if (autoSave) {
                    curriculumStorage.saveUserCurriculum(result);
                    setSavedCurricula(curriculumStorage.getUserCurricula());
                }

                setCurriculum(result);
                setCurrentLessonIndex(0);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error occurred");
            } finally {
                setIsGenerating(false);
            }
        },
        [useMock, autoSave]
    );

    const generateFromPath = useCallback(
        async (
            module: { id: string; title: string; skills: string[]; estimatedHours: number; sequence: number },
            userProfile: {
                currentSkills: string[];
                targetRole: string;
                targetSector?: string;
                learningStyle: string;
                weeklyHours: number;
                currentLevel: DifficultyLevel;
            }
        ) => {
            const request: CurriculumGenerationRequest = {
                module,
                userProfile,
                generateOptions: {
                    lessons: true,
                    exercises: true,
                    quizzes: true,
                    projects: true,
                },
            };

            await generateForModule(request);
        },
        [generateForModule]
    );

    // ========================================================================
    // CONTENT ACCESS
    // ========================================================================

    const getCurrentLesson = useCallback((): LessonOutline | null => {
        if (!curriculum || !curriculum.lessons.length) return null;
        return curriculum.lessons[currentLessonIndex] || null;
    }, [curriculum, currentLessonIndex]);

    const getNextLesson = useCallback((): LessonOutline | null => {
        if (!curriculum || !curriculum.lessons.length) return null;
        const nextIndex = currentLessonIndex + 1;
        return nextIndex < curriculum.lessons.length ? curriculum.lessons[nextIndex] : null;
    }, [curriculum, currentLessonIndex]);

    const getExerciseById = useCallback(
        (id: string): CodeExercise | null => {
            if (!curriculum) return null;
            return curriculum.exercises.find((e) => e.id === id) || null;
        },
        [curriculum]
    );

    const getQuizById = useCallback(
        (id: string): Quiz | null => {
            if (!curriculum) return null;
            return curriculum.quizzes.find((q) => q.id === id) || null;
        },
        [curriculum]
    );

    const getProjectById = useCallback(
        (id: string): ProjectSpecification | null => {
            if (!curriculum) return null;
            return curriculum.projects.find((p) => p.id === id) || null;
        },
        [curriculum]
    );

    // ========================================================================
    // PROGRESS TRACKING
    // ========================================================================

    const startContent = useCallback(
        (contentId: string, contentType: ContentFeedback["contentType"]) => {
            setTimeTracking({ contentId, startTime: Date.now() });

            if (curriculum) {
                const existingCompletion = completionState[contentId];
                if (!existingCompletion || existingCompletion.status === "not_started") {
                    const newCompletion = curriculumStorage.trackCompletion({
                        userId,
                        curriculumId: curriculum.id,
                        contentId,
                        contentType,
                        status: "in_progress",
                        attempts: 1,
                        timeSpent: 0,
                        hintsUsed: 0,
                        startedAt: new Date().toISOString(),
                    });

                    setCompletionState((prev) => ({
                        ...prev,
                        [contentId]: newCompletion,
                    }));
                }
            }
        },
        [curriculum, userId, completionState]
    );

    const completeContent = useCallback(
        (
            contentId: string,
            contentType: ContentFeedback["contentType"],
            score?: number
        ) => {
            if (!curriculum) return;

            const timeSpent = timeTracking?.contentId === contentId
                ? Math.floor((Date.now() - timeTracking.startTime) / 60000)
                : 0;

            const newCompletion = curriculumStorage.trackCompletion({
                userId,
                curriculumId: curriculum.id,
                contentId,
                contentType,
                status: "completed",
                score,
                attempts: (completionState[contentId]?.attempts || 0) + 1,
                timeSpent: (completionState[contentId]?.timeSpent || 0) + timeSpent,
                hintsUsed: completionState[contentId]?.hintsUsed || 0,
                completedAt: new Date().toISOString(),
            });

            setCompletionState((prev) => ({
                ...prev,
                [contentId]: newCompletion,
            }));

            // Clear time tracking
            if (timeTracking?.contentId === contentId) {
                setTimeTracking(null);
            }
        },
        [curriculum, userId, completionState, timeTracking]
    );

    const markLessonComplete = useCallback(
        (lessonId: string) => {
            completeContent(lessonId, "lesson");

            // Move to next lesson
            if (curriculum) {
                const lessonIndex = curriculum.lessons.findIndex((l) => l.id === lessonId);
                if (lessonIndex !== -1 && lessonIndex === currentLessonIndex) {
                    setCurrentLessonIndex((prev) =>
                        Math.min(prev + 1, curriculum.lessons.length - 1)
                    );
                }
            }
        },
        [completeContent, curriculum, currentLessonIndex]
    );

    const markExerciseComplete = useCallback(
        (exerciseId: string, score?: number) => {
            completeContent(exerciseId, "exercise", score);
        },
        [completeContent]
    );

    const markQuizComplete = useCallback(
        (quizId: string, score: number) => {
            completeContent(quizId, "quiz", score);
        },
        [completeContent]
    );

    const markProjectComplete = useCallback(
        (projectId: string) => {
            completeContent(projectId, "project");
        },
        [completeContent]
    );

    // ========================================================================
    // FEEDBACK
    // ========================================================================

    const submitFeedback = useCallback(
        (
            contentId: string,
            contentType: ContentFeedback["contentType"],
            feedback: {
                rating: number;
                clarity: number;
                difficultyMatch: number;
                relevance: number;
                engagement: number;
                comment?: string;
                struggled?: boolean;
                suggestions?: string[];
            }
        ) => {
            const completion = completionState[contentId];

            curriculumStorage.submitFeedback({
                contentId,
                contentType,
                userId,
                rating: feedback.rating,
                feedback: {
                    clarity: feedback.clarity,
                    difficultyMatch: feedback.difficultyMatch,
                    relevance: feedback.relevance,
                    engagement: feedback.engagement,
                },
                comment: feedback.comment,
                completed: completion?.status === "completed",
                timeSpent: completion?.timeSpent || 0,
                struggled: feedback.struggled || false,
                suggestions: feedback.suggestions,
            });
        },
        [userId, completionState]
    );

    // ========================================================================
    // SAVED CURRICULA
    // ========================================================================

    const saveCurriculum = useCallback(() => {
        if (curriculum) {
            curriculumStorage.saveUserCurriculum(curriculum);
            setSavedCurricula(curriculumStorage.getUserCurricula());
        }
    }, [curriculum]);

    const loadCurriculum = useCallback((id: string) => {
        const loaded = curriculumStorage.getUserCurriculum(id);
        if (loaded) {
            setCurriculum(loaded);
            setCurrentLessonIndex(0);
            setError(null);
        }
    }, []);

    const deleteCurriculum = useCallback((id: string) => {
        curriculumStorage.deleteUserCurriculum(id);
        setSavedCurricula(curriculumStorage.getUserCurricula());

        if (curriculum?.id === id) {
            setCurriculum(null);
        }
    }, [curriculum]);

    // ========================================================================
    // CACHE
    // ========================================================================

    const clearCache = useCallback(() => {
        curriculumStorage.clearCache();
    }, []);

    const cacheStats = useMemo(() => {
        const stats = curriculumStorage.getCacheStats();
        return {
            hitRate: stats.hitRate,
            totalEntries: stats.totalEntries,
        };
    }, []);

    // ========================================================================
    // PROGRESS CALCULATION
    // ========================================================================

    const progress = useMemo((): CurriculumProgress => {
        if (!curriculum) {
            return {
                lessonsCompleted: 0,
                lessonsTotal: 0,
                exercisesCompleted: 0,
                exercisesTotal: 0,
                quizzesCompleted: 0,
                quizzesTotal: 0,
                projectsCompleted: 0,
                projectsTotal: 0,
                overallProgress: 0,
                currentLessonIndex: 0,
                timeSpentMinutes: 0,
                averageScore: 0,
            };
        }

        const isCompleted = (id: string) => completionState[id]?.status === "completed";

        const lessonsCompleted = curriculum.lessons.filter((l) => isCompleted(l.id)).length;
        const exercisesCompleted = curriculum.exercises.filter((e) => isCompleted(e.id)).length;
        const quizzesCompleted = curriculum.quizzes.filter((q) => isCompleted(q.id)).length;
        const projectsCompleted = curriculum.projects.filter((p) => isCompleted(p.id)).length;

        const totalItems =
            curriculum.lessons.length +
            curriculum.exercises.length +
            curriculum.quizzes.length +
            curriculum.projects.length;

        const completedItems =
            lessonsCompleted + exercisesCompleted + quizzesCompleted + projectsCompleted;

        const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

        const timeSpentMinutes = Object.values(completionState).reduce(
            (sum, c) => sum + (c.timeSpent || 0),
            0
        );

        const scores = Object.values(completionState)
            .filter((c) => c.score !== undefined)
            .map((c) => c.score as number);

        const averageScore =
            scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        return {
            lessonsCompleted,
            lessonsTotal: curriculum.lessons.length,
            exercisesCompleted,
            exercisesTotal: curriculum.exercises.length,
            quizzesCompleted,
            quizzesTotal: curriculum.quizzes.length,
            projectsCompleted,
            projectsTotal: curriculum.projects.length,
            overallProgress,
            currentLessonIndex,
            timeSpentMinutes,
            averageScore,
        };
    }, [curriculum, completionState, currentLessonIndex]);

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        // State
        curriculum,
        isGenerating,
        error,
        progress,

        // Generation
        generateForModule,
        generateFromPath,

        // Content access
        getCurrentLesson,
        getNextLesson,
        getExerciseById,
        getQuizById,
        getProjectById,

        // Progress tracking
        markLessonComplete,
        markExerciseComplete,
        markQuizComplete,
        markProjectComplete,
        startContent,

        // Feedback
        submitFeedback,

        // Saved curricula
        savedCurricula,
        saveCurriculum,
        loadCurriculum,
        deleteCurriculum,

        // Cache
        clearCache,
        cacheStats,
    };
}

export default useCurriculum;
