"use client";

import { createTimestampedStorage, generateId } from "@/app/shared/lib/storageFactory";
import {
    ProgressData,
    CourseProgress,
    VideoProgress,
    ChapterProgress,
    QuizScore,
    ContinueLearningItem,
    PROGRESS_VERSION,
} from "./types";

function getDefaultProgressData(): ProgressData {
    return {
        version: PROGRESS_VERSION,
        lastUpdated: new Date().toISOString(),
        courses: {},
    };
}

// Create storage using the factory with version migration support
const progressStorage = createTimestampedStorage<ProgressData>({
    storageKey: "course-progress",
    getDefault: getDefaultProgressData,
    version: PROGRESS_VERSION,
    migrate: (oldData: unknown) => {
        const data = oldData as ProgressData;
        return {
            ...getDefaultProgressData(),
            courses: data?.courses || {},
        };
    },
});

export function getProgressData(): ProgressData {
    return progressStorage.get();
}

export function saveProgressData(data: ProgressData): void {
    progressStorage.save(data);
}

export function getCourseProgress(courseId: string): CourseProgress | null {
    const data = getProgressData();
    return data.courses[courseId] || null;
}

export function initializeCourseProgress(
    courseId: string,
    courseName: string,
    courseIcon?: string,
    courseColor?: string
): CourseProgress {
    const data = getProgressData();
    if (!data.courses[courseId]) {
        data.courses[courseId] = {
            courseId,
            courseName,
            courseIcon,
            courseColor,
            lastAccessedAt: new Date().toISOString(),
            videoProgress: {},
            chapterProgress: {},
            quizScores: {},
            totalWatchTimeSeconds: 0,
            overallProgress: 0,
        };
        saveProgressData(data);
    }
    return data.courses[courseId];
}

export function updateVideoProgress(
    courseId: string,
    videoId: string,
    watchedSeconds: number,
    totalSeconds: number,
    currentPosition: number
): VideoProgress {
    const data = getProgressData();
    if (!data.courses[courseId]) {
        initializeCourseProgress(courseId, courseId);
    }

    const course = data.courses[courseId];
    const existingProgress = course.videoProgress[videoId];
    const previousWatched = existingProgress?.watchedSeconds || 0;

    const completed = watchedSeconds >= totalSeconds * 0.9;

    const videoProgress: VideoProgress = {
        videoId,
        watchedSeconds: Math.max(watchedSeconds, previousWatched),
        totalSeconds,
        lastPosition: currentPosition,
        completed,
        lastWatchedAt: new Date().toISOString(),
    };

    course.videoProgress[videoId] = videoProgress;
    course.lastAccessedAt = new Date().toISOString();
    course.lastVideoPosition = currentPosition;

    if (watchedSeconds > previousWatched) {
        course.totalWatchTimeSeconds += watchedSeconds - previousWatched;
    }

    recalculateCourseProgress(data, courseId);
    saveProgressData(data);

    return videoProgress;
}

export function setVideoPosition(
    courseId: string,
    videoId: string,
    position: number,
    totalSeconds: number
): void {
    const data = getProgressData();
    if (!data.courses[courseId]) {
        initializeCourseProgress(courseId, courseId);
    }

    const course = data.courses[courseId];
    if (!course.videoProgress[videoId]) {
        course.videoProgress[videoId] = {
            videoId,
            watchedSeconds: 0,
            totalSeconds,
            lastPosition: position,
            completed: false,
            lastWatchedAt: new Date().toISOString(),
        };
    } else {
        course.videoProgress[videoId].lastPosition = position;
        course.videoProgress[videoId].lastWatchedAt = new Date().toISOString();
    }

    course.lastAccessedAt = new Date().toISOString();
    course.lastVideoPosition = position;
    saveProgressData(data);
}

export function markChapterCompleted(
    courseId: string,
    chapterId: string,
    sectionsCompleted?: string[]
): ChapterProgress {
    const data = getProgressData();
    if (!data.courses[courseId]) {
        initializeCourseProgress(courseId, courseId);
    }

    const course = data.courses[courseId];
    const existingSections = course.chapterProgress[chapterId]?.sectionsCompleted || [];
    const allSections = [...new Set([...existingSections, ...(sectionsCompleted || [])])];

    const chapterProgress: ChapterProgress = {
        chapterId,
        completed: true,
        completedAt: new Date().toISOString(),
        sectionsCompleted: allSections,
    };

    course.chapterProgress[chapterId] = chapterProgress;
    course.lastAccessedAt = new Date().toISOString();
    course.lastChapterId = chapterId;

    recalculateCourseProgress(data, courseId);
    saveProgressData(data);

    return chapterProgress;
}

export function markSectionCompleted(
    courseId: string,
    chapterId: string,
    sectionId: string
): ChapterProgress {
    const data = getProgressData();
    if (!data.courses[courseId]) {
        initializeCourseProgress(courseId, courseId);
    }

    const course = data.courses[courseId];
    const existingChapter = course.chapterProgress[chapterId] || {
        chapterId,
        completed: false,
        sectionsCompleted: [],
    };

    if (!existingChapter.sectionsCompleted.includes(sectionId)) {
        existingChapter.sectionsCompleted.push(sectionId);
    }

    course.chapterProgress[chapterId] = existingChapter;
    course.lastAccessedAt = new Date().toISOString();
    course.lastChapterId = chapterId;
    course.lastSectionId = sectionId;

    recalculateCourseProgress(data, courseId);
    saveProgressData(data);

    return existingChapter;
}

export function saveQuizScore(
    courseId: string,
    quizId: string,
    score: number,
    maxScore: number
): QuizScore {
    const data = getProgressData();
    if (!data.courses[courseId]) {
        initializeCourseProgress(courseId, courseId);
    }

    const course = data.courses[courseId];
    const existingQuiz = course.quizScores[quizId];
    const attempts = (existingQuiz?.attempts || 0) + 1;

    const quizScore: QuizScore = {
        quizId,
        score: Math.max(score, existingQuiz?.score || 0),
        maxScore,
        completedAt: new Date().toISOString(),
        attempts,
    };

    course.quizScores[quizId] = quizScore;
    course.lastAccessedAt = new Date().toISOString();

    recalculateCourseProgress(data, courseId);
    saveProgressData(data);

    return quizScore;
}

export function updateLastAccessed(
    courseId: string,
    chapterId?: string,
    sectionId?: string
): void {
    const data = getProgressData();
    if (!data.courses[courseId]) return;

    const course = data.courses[courseId];
    course.lastAccessedAt = new Date().toISOString();
    if (chapterId) course.lastChapterId = chapterId;
    if (sectionId) course.lastSectionId = sectionId;

    saveProgressData(data);
}

function recalculateCourseProgress(data: ProgressData, courseId: string): void {
    const course = data.courses[courseId];
    if (!course) return;

    const videoEntries = Object.values(course.videoProgress);
    const chapterEntries = Object.values(course.chapterProgress);
    const quizEntries = Object.values(course.quizScores);

    let totalItems = 0;
    let completedItems = 0;

    videoEntries.forEach((v) => {
        totalItems++;
        if (v.completed) completedItems++;
    });

    chapterEntries.forEach((c) => {
        totalItems++;
        if (c.completed) completedItems++;
    });

    quizEntries.forEach((q) => {
        totalItems++;
        if (q.score >= q.maxScore * 0.7) completedItems++;
    });

    course.overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
}

export function getContinueLearningItems(limit: number = 5): ContinueLearningItem[] {
    const data = getProgressData();
    const items: ContinueLearningItem[] = [];

    Object.values(data.courses).forEach((course) => {
        if (course.overallProgress < 100) {
            items.push({
                courseId: course.courseId,
                courseName: course.courseName,
                courseIcon: course.courseIcon,
                courseColor: course.courseColor,
                chapterId: course.lastChapterId || "intro",
                chapterTitle: course.lastChapterId || "Introduction",
                sectionId: course.lastSectionId,
                sectionTitle: course.lastSectionId,
                lastPosition: course.lastVideoPosition || 0,
                progress: course.overallProgress,
                lastAccessedAt: course.lastAccessedAt,
            });
        }
    });

    items.sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());

    return items.slice(0, limit);
}

export function getAllCoursesProgress(): CourseProgress[] {
    const data = getProgressData();
    return Object.values(data.courses).sort(
        (a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );
}

export function getTotalWatchTime(): number {
    const data = getProgressData();
    return Object.values(data.courses).reduce((total, course) => total + course.totalWatchTimeSeconds, 0);
}

export function getOverallCompletionRate(): number {
    const courses = getAllCoursesProgress();
    if (courses.length === 0) return 0;
    const totalProgress = courses.reduce((sum, course) => sum + course.overallProgress, 0);
    return Math.round(totalProgress / courses.length);
}

export function exportProgressData(): string {
    const data = getProgressData();
    const exportData = {
        ...data,
        exportedAt: new Date().toISOString(),
        summary: {
            totalCourses: Object.keys(data.courses).length,
            totalWatchTimeSeconds: getTotalWatchTime(),
            overallCompletionRate: getOverallCompletionRate(),
        },
    };
    return JSON.stringify(exportData, null, 2);
}

export function downloadProgressData(filename: string = "course-progress.json"): void {
    const json = exportProgressData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function importProgressData(jsonString: string): boolean {
    try {
        const importedData = JSON.parse(jsonString) as ProgressData;
        if (!importedData.courses || typeof importedData.courses !== "object") {
            throw new Error("Invalid progress data format");
        }
        saveProgressData({
            ...importedData,
            version: PROGRESS_VERSION,
            lastUpdated: new Date().toISOString(),
        });
        return true;
    } catch (error) {
        console.error("Failed to import progress data:", error);
        return false;
    }
}

export function clearCourseProgress(courseId: string): void {
    const data = getProgressData();
    delete data.courses[courseId];
    saveProgressData(data);
}

export function clearAllProgress(): void {
    saveProgressData(getDefaultProgressData());
}

export function formatWatchTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}
