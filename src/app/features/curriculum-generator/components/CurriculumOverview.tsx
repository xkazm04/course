"use client";

/**
 * Curriculum Overview Component
 *
 * Displays an overview of generated curriculum with progress tracking
 * and navigation to individual content items.
 */

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
    BookOpen,
    Code,
    HelpCircle,
    Briefcase,
    Clock,
    Target,
    CheckCircle2,
    Circle,
    PlayCircle,
    Star,
    TrendingUp,
    Sparkles,
} from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { GeneratedCurriculum } from "../lib/types";
import type { CurriculumProgress } from "../lib/useCurriculum";

// ============================================================================
// TYPES
// ============================================================================

interface CurriculumOverviewProps {
    curriculum: GeneratedCurriculum;
    progress: CurriculumProgress;
    onSelectLesson?: (lessonId: string) => void;
    onSelectExercise?: (exerciseId: string) => void;
    onSelectQuiz?: (quizId: string) => void;
    onSelectProject?: (projectId: string) => void;
    completedItems?: Set<string>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CurriculumOverview = ({
    curriculum,
    progress,
    onSelectLesson,
    onSelectExercise,
    onSelectQuiz,
    onSelectProject,
    completedItems = new Set(),
}: CurriculumOverviewProps) => {
    const prefersReducedMotion = useReducedMotion();

    return (
        <div className="space-y-6">
            {/* Header */}
            <PrismaticCard className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={ICON_SIZES.md} className="text-indigo-500" />
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                AI-Generated Curriculum
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
                            {curriculum.moduleTitle}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300">
                            Personalized for {curriculum.userGoal}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                            {Math.round(progress.overallProgress)}%
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Complete</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full"
                            initial={prefersReducedMotion ? false : { width: 0 }}
                            animate={{ width: `${progress.overallProgress}%` }}
                            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Stats Row */}
                <div className="mt-6 grid grid-cols-4 gap-4">
                    <StatCard
                        icon={BookOpen}
                        label="Lessons"
                        value={`${progress.lessonsCompleted}/${progress.lessonsTotal}`}
                        color="text-blue-500"
                    />
                    <StatCard
                        icon={Code}
                        label="Exercises"
                        value={`${progress.exercisesCompleted}/${progress.exercisesTotal}`}
                        color="text-purple-500"
                    />
                    <StatCard
                        icon={HelpCircle}
                        label="Quizzes"
                        value={`${progress.quizzesCompleted}/${progress.quizzesTotal}`}
                        color="text-amber-500"
                    />
                    <StatCard
                        icon={Briefcase}
                        label="Projects"
                        value={`${progress.projectsCompleted}/${progress.projectsTotal}`}
                        color="text-emerald-500"
                    />
                </div>
            </PrismaticCard>

            {/* Time & Score Summary */}
            <div className="grid sm:grid-cols-2 gap-4">
                <PrismaticCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                            <Clock size={ICON_SIZES.md} className="text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                {Math.round(progress.timeSpentMinutes / 60 * 10) / 10}h
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Time Invested
                            </div>
                        </div>
                    </div>
                </PrismaticCard>

                <PrismaticCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                            <Star size={ICON_SIZES.md} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                {Math.round(progress.averageScore)}%
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Average Score
                            </div>
                        </div>
                    </div>
                </PrismaticCard>
            </div>

            {/* Lessons Section */}
            <ContentSection
                title="Lessons"
                icon={BookOpen}
                iconColor="text-blue-500"
                items={curriculum.lessons.map((lesson) => ({
                    id: lesson.id,
                    title: lesson.title,
                    subtitle: `${lesson.estimatedMinutes} min`,
                    isCompleted: completedItems.has(lesson.id),
                    onClick: () => onSelectLesson?.(lesson.id),
                }))}
                currentIndex={progress.currentLessonIndex}
            />

            {/* Exercises Section */}
            <ContentSection
                title="Code Exercises"
                icon={Code}
                iconColor="text-purple-500"
                items={curriculum.exercises.map((exercise) => ({
                    id: exercise.id,
                    title: exercise.title,
                    subtitle: `${exercise.estimatedMinutes} min | ${exercise.difficulty}`,
                    isCompleted: completedItems.has(exercise.id),
                    onClick: () => onSelectExercise?.(exercise.id),
                }))}
            />

            {/* Quizzes Section */}
            <ContentSection
                title="Quizzes"
                icon={HelpCircle}
                iconColor="text-amber-500"
                items={curriculum.quizzes.map((quiz) => ({
                    id: quiz.id,
                    title: quiz.title,
                    subtitle: `${quiz.questions.length} questions | Pass: ${quiz.passingScore}%`,
                    isCompleted: completedItems.has(quiz.id),
                    onClick: () => onSelectQuiz?.(quiz.id),
                }))}
            />

            {/* Projects Section */}
            <ContentSection
                title="Projects"
                icon={Briefcase}
                iconColor="text-emerald-500"
                items={curriculum.projects.map((project) => ({
                    id: project.id,
                    title: project.title,
                    subtitle: `${project.estimatedHours}h | ${project.milestones.length} milestones`,
                    isCompleted: completedItems.has(project.id),
                    onClick: () => onSelectProject?.(project.id),
                }))}
            />

            {/* Skills Covered */}
            <PrismaticCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={ICON_SIZES.md} className="text-indigo-500" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Skills You'll Master
                    </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    {curriculum.skillsCovered.map((skill) => (
                        <span
                            key={skill}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium rounded-lg border border-indigo-200 dark:border-indigo-800"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </PrismaticCard>
        </div>
    );
};

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => {
    return (
        <div className="text-center">
            <Icon size={ICON_SIZES.lg} className={cn("mx-auto mb-1", color)} />
            <div className="font-bold text-slate-900 dark:text-slate-100">{value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        </div>
    );
};

// ============================================================================
// CONTENT SECTION
// ============================================================================

interface ContentItem {
    id: string;
    title: string;
    subtitle: string;
    isCompleted: boolean;
    onClick: () => void;
}

interface ContentSectionProps {
    title: string;
    icon: React.ElementType;
    iconColor: string;
    items: ContentItem[];
    currentIndex?: number;
}

const ContentSection = ({
    title,
    icon: Icon,
    iconColor,
    items,
    currentIndex,
}: ContentSectionProps) => {
    if (items.length === 0) return null;

    return (
        <PrismaticCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
                <Icon size={ICON_SIZES.md} className={iconColor} />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    ({items.filter((i) => i.isCompleted).length}/{items.length})
                </span>
            </div>

            <div className="space-y-2">
                {items.map((item, index) => {
                    const isCurrent = currentIndex !== undefined && index === currentIndex;

                    return (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            data-testid={`curriculum-item-${item.id}`}
                            className={cn(
                                "w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all",
                                item.isCompleted
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                                    : isCurrent
                                    ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
                                    : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                            )}
                        >
                            {/* Status Icon */}
                            <div className="flex-shrink-0">
                                {item.isCompleted ? (
                                    <CheckCircle2 size={ICON_SIZES.md} className="text-emerald-500" />
                                ) : isCurrent ? (
                                    <PlayCircle size={ICON_SIZES.md} className="text-indigo-500" />
                                ) : (
                                    <Circle size={ICON_SIZES.md} className="text-slate-400" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div
                                    className={cn(
                                        "font-medium truncate",
                                        item.isCompleted
                                            ? "text-emerald-700 dark:text-emerald-400"
                                            : isCurrent
                                            ? "text-indigo-700 dark:text-indigo-400"
                                            : "text-slate-900 dark:text-slate-100"
                                    )}
                                >
                                    {item.title}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {item.subtitle}
                                </div>
                            </div>

                            {/* Current Badge */}
                            {isCurrent && !item.isCompleted && (
                                <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded-full">
                                    Current
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </PrismaticCard>
    );
};

export default CurriculumOverview;
