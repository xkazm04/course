export interface VideoProgress {
    videoId: string;
    watchedSeconds: number;
    totalSeconds: number;
    lastPosition: number;
    completed: boolean;
    lastWatchedAt: string;
}

export interface ChapterProgress {
    chapterId: string;
    completed: boolean;
    completedAt?: string;
    sectionsCompleted: string[];
}

export interface QuizScore {
    quizId: string;
    score: number;
    maxScore: number;
    completedAt: string;
    attempts: number;
}

export interface CourseProgress {
    courseId: string;
    courseName: string;
    courseIcon?: string;
    courseColor?: string;
    lastAccessedAt: string;
    lastChapterId?: string;
    lastSectionId?: string;
    lastVideoPosition?: number;
    videoProgress: Record<string, VideoProgress>;
    chapterProgress: Record<string, ChapterProgress>;
    quizScores: Record<string, QuizScore>;
    totalWatchTimeSeconds: number;
    overallProgress: number;
}

export interface ProgressData {
    version: string;
    lastUpdated: string;
    courses: Record<string, CourseProgress>;
}

export interface ContinueLearningItem {
    courseId: string;
    courseName: string;
    courseIcon?: string;
    courseColor?: string;
    chapterId: string;
    chapterTitle: string;
    sectionId?: string;
    sectionTitle?: string;
    lastPosition: number;
    progress: number;
    lastAccessedAt: string;
}

export const PROGRESS_VERSION = "1.0.0";
