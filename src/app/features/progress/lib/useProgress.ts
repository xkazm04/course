"use client";

import { useState, useEffect, useCallback } from "react";
import {
    CourseProgress,
    VideoProgress,
    ChapterProgress,
    QuizScore,
    ContinueLearningItem,
} from "./types";
import {
    getCourseProgress,
    initializeCourseProgress,
    updateVideoProgress as updateVideoProgressStorage,
    setVideoPosition as setVideoPositionStorage,
    markChapterCompleted as markChapterCompletedStorage,
    markSectionCompleted as markSectionCompletedStorage,
    saveQuizScore as saveQuizScoreStorage,
    updateLastAccessed as updateLastAccessedStorage,
    getContinueLearningItems,
    getAllCoursesProgress,
    getTotalWatchTime,
    getOverallCompletionRate,
    clearCourseProgress,
    clearAllProgress,
} from "./progressStorage";

export function useCourseProgress(courseId: string, courseName?: string, courseIcon?: string, courseColor?: string) {
    const [progress, setProgress] = useState<CourseProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let existing = getCourseProgress(courseId);
        if (!existing && courseName) {
            existing = initializeCourseProgress(courseId, courseName, courseIcon, courseColor);
        }
        setProgress(existing);
        setIsLoading(false);
    }, [courseId, courseName, courseIcon, courseColor]);

    const updateVideoProgress = useCallback(
        (videoId: string, watchedSeconds: number, totalSeconds: number, currentPosition: number) => {
            const updated = updateVideoProgressStorage(courseId, videoId, watchedSeconds, totalSeconds, currentPosition);
            setProgress(getCourseProgress(courseId));
            return updated;
        },
        [courseId]
    );

    const setVideoPosition = useCallback(
        (videoId: string, position: number, totalSeconds: number) => {
            setVideoPositionStorage(courseId, videoId, position, totalSeconds);
            setProgress(getCourseProgress(courseId));
        },
        [courseId]
    );

    const markChapterComplete = useCallback(
        (chapterId: string, sectionsCompleted?: string[]) => {
            const updated = markChapterCompletedStorage(courseId, chapterId, sectionsCompleted);
            setProgress(getCourseProgress(courseId));
            return updated;
        },
        [courseId]
    );

    const markSectionComplete = useCallback(
        (chapterId: string, sectionId: string) => {
            const updated = markSectionCompletedStorage(courseId, chapterId, sectionId);
            setProgress(getCourseProgress(courseId));
            return updated;
        },
        [courseId]
    );

    const recordQuizScore = useCallback(
        (quizId: string, score: number, maxScore: number) => {
            const updated = saveQuizScoreStorage(courseId, quizId, score, maxScore);
            setProgress(getCourseProgress(courseId));
            return updated;
        },
        [courseId]
    );

    const updateAccess = useCallback(
        (chapterId?: string, sectionId?: string) => {
            updateLastAccessedStorage(courseId, chapterId, sectionId);
            setProgress(getCourseProgress(courseId));
        },
        [courseId]
    );

    const clearProgress = useCallback(() => {
        clearCourseProgress(courseId);
        setProgress(null);
    }, [courseId]);

    const getVideoProgress = useCallback(
        (videoId: string): VideoProgress | null => {
            return progress?.videoProgress[videoId] || null;
        },
        [progress]
    );

    const getChapterProgress = useCallback(
        (chapterId: string): ChapterProgress | null => {
            return progress?.chapterProgress[chapterId] || null;
        },
        [progress]
    );

    const getQuizScore = useCallback(
        (quizId: string): QuizScore | null => {
            return progress?.quizScores[quizId] || null;
        },
        [progress]
    );

    const isSectionCompleted = useCallback(
        (chapterId: string, sectionId: string): boolean => {
            const chapter = progress?.chapterProgress[chapterId];
            return chapter?.sectionsCompleted.includes(sectionId) || false;
        },
        [progress]
    );

    return {
        progress,
        isLoading,
        overallProgress: progress?.overallProgress || 0,
        totalWatchTime: progress?.totalWatchTimeSeconds || 0,
        lastAccessedAt: progress?.lastAccessedAt,
        updateVideoProgress,
        setVideoPosition,
        markChapterComplete,
        markSectionComplete,
        recordQuizScore,
        updateAccess,
        clearProgress,
        getVideoProgress,
        getChapterProgress,
        getQuizScore,
        isSectionCompleted,
    };
}

export function useProgressOverview() {
    const [courses, setCourses] = useState<CourseProgress[]>([]);
    const [continueLearning, setContinueLearning] = useState<ContinueLearningItem[]>([]);
    const [totalWatchTime, setTotalWatchTime] = useState(0);
    const [overallCompletion, setOverallCompletion] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(() => {
        setCourses(getAllCoursesProgress());
        setContinueLearning(getContinueLearningItems());
        setTotalWatchTime(getTotalWatchTime());
        setOverallCompletion(getOverallCompletionRate());
    }, []);

    useEffect(() => {
        refresh();
        setIsLoading(false);
    }, [refresh]);

    const clearAll = useCallback(() => {
        clearAllProgress();
        refresh();
    }, [refresh]);

    return {
        courses,
        continueLearning,
        totalWatchTime,
        overallCompletion,
        isLoading,
        refresh,
        clearAll,
    };
}
