"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    BookOpen,
    CheckCircle,
    Circle,
    Play,
    Lock,
    Loader2,
    Map,
    TrendingUp,
    Award,
    Zap,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useForge } from "../../layout";

// ============================================================================
// TYPES
// ============================================================================

interface Chapter {
    id: string;
    title: string;
    description: string | null;
    estimatedMinutes: number;
    xpReward: number;
    sortOrder: number;
    status: "locked" | "available" | "in_progress" | "completed";
    courseId: string;
    courseTitle: string;
}

interface Course {
    id: string;
    title: string;
    description: string | null;
    estimatedHours: number;
    chapters: Chapter[];
    status: "locked" | "available" | "in_progress" | "completed";
    sortOrder: number;
}

interface LearningPathData {
    id: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    estimatedHours: number | null;
    pathType: string;
    icon: string | null;
    color: string | null;
    courses: Course[];
    enrollment: {
        id: string;
        status: string;
        progressPercent: number;
        currentCourseIndex: number;
        startedAt: string;
    } | null;
}

// ============================================================================
// CHAPTER CARD
// ============================================================================

function ChapterCard({ chapter, pathId, isFirst }: { chapter: Chapter; pathId: string; isFirst: boolean }) {
    const statusIcons = {
        locked: Lock,
        available: Circle,
        in_progress: Play,
        completed: CheckCircle,
    };

    const StatusIcon = statusIcons[chapter.status];

    const isAccessible = chapter.status !== "locked";

    return (
        <div className="relative pl-8">
            {/* Connection line */}
            {!isFirst && (
                <div className="absolute left-3 -top-4 w-0.5 h-4 bg-[var(--forge-border-subtle)]" />
            )}

            {/* Status indicator */}
            <div className={cn(
                "absolute left-0 top-4 w-6 h-6 rounded-full flex items-center justify-center border-2",
                chapter.status === "completed" && "bg-[var(--forge-success)] border-[var(--forge-success)] text-white",
                chapter.status === "in_progress" && "bg-[var(--ember)] border-[var(--ember)] text-white",
                chapter.status === "available" && "bg-[var(--forge-bg-elevated)] border-[var(--ember)]/50 text-[var(--ember)]",
                chapter.status === "locked" && "bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)] text-[var(--forge-text-muted)]",
            )}>
                <StatusIcon size={12} />
            </div>

            {isAccessible ? (
                <Link
                    href={`/forge/chapter/${chapter.id}`}
                    className={cn(
                        "block p-4 rounded-xl border transition-all group",
                        chapter.status === "completed" && "bg-[var(--forge-success)]/5 border-[var(--forge-success)]/20 hover:bg-[var(--forge-success)]/10",
                        chapter.status === "in_progress" && "bg-[var(--ember)]/5 border-[var(--ember)]/20 hover:bg-[var(--ember)]/10",
                        chapter.status === "available" && "bg-[var(--forge-bg-daylight)]/60 border-[var(--forge-border-subtle)] hover:bg-[var(--forge-bg-daylight)] hover:shadow-sm",
                    )}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h4 className={cn(
                                "font-medium text-sm mb-1 transition-colors",
                                chapter.status === "completed" && "text-[var(--forge-success)]",
                                chapter.status === "in_progress" && "text-[var(--ember)] group-hover:text-[var(--ember)]",
                                chapter.status === "available" && "text-[var(--forge-text-primary)] group-hover:text-[var(--ember)]",
                            )}>
                                {chapter.title}
                            </h4>
                            {chapter.description && (
                                <p className="text-xs text-[var(--forge-text-muted)] line-clamp-2">
                                    {chapter.description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--forge-text-muted)]">
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {chapter.estimatedMinutes}m
                            </span>
                            <span className="flex items-center gap-1 text-[var(--ember)]">
                                <Zap size={12} />
                                +{chapter.xpReward}
                            </span>
                            <ChevronRight size={14} className="text-[var(--forge-text-muted)] group-hover:text-[var(--ember)] transition-colors" />
                        </div>
                    </div>
                </Link>
            ) : (
                <div className="p-4 rounded-xl border bg-[var(--forge-bg-elevated)]/50 border-[var(--forge-border-subtle)] opacity-60">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1 text-[var(--forge-text-muted)]">
                                {chapter.title}
                            </h4>
                            {chapter.description && (
                                <p className="text-xs text-[var(--forge-text-muted)] line-clamp-2">
                                    {chapter.description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--forge-text-muted)]">
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {chapter.estimatedMinutes}m
                            </span>
                            <Lock size={14} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// COURSE SECTION
// ============================================================================

function CourseSection({ course, pathId, isExpanded, onToggle }: {
    course: Course;
    pathId: string;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const completedChapters = course.chapters.filter(c => c.status === "completed").length;
    const totalChapters = course.chapters.length;
    const progressPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    const statusColors = {
        locked: "bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)] text-[var(--forge-text-muted)]",
        available: "bg-[var(--forge-bg-daylight)] border-[var(--forge-border-subtle)] text-[var(--forge-text-primary)]",
        in_progress: "bg-[var(--ember)]/5 border-[var(--ember)]/20 text-[var(--ember)]",
        completed: "bg-[var(--forge-success)]/5 border-[var(--forge-success)]/20 text-[var(--forge-success)]",
    };

    return (
        <div className="rounded-2xl border border-[var(--forge-border-subtle)] overflow-hidden bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl">
            {/* Course header */}
            <button
                onClick={onToggle}
                className={cn(
                    "w-full p-5 flex items-center gap-4 transition-colors text-left",
                    isExpanded ? "bg-[var(--forge-bg-elevated)]/50" : "hover:bg-[var(--forge-bg-elevated)]/30"
                )}
            >
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border",
                    statusColors[course.status]
                )}>
                    {course.status === "completed" ? (
                        <CheckCircle size={20} />
                    ) : course.status === "locked" ? (
                        <Lock size={20} />
                    ) : (
                        <BookOpen size={20} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[var(--forge-text-primary)]">
                            {course.title}
                        </h3>
                        {course.status === "in_progress" && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--ember)]/10 text-[var(--ember)] text-xs font-medium">
                                In Progress
                            </span>
                        )}
                    </div>
                    {course.description && (
                        <p className="text-sm text-[var(--forge-text-muted)] line-clamp-1">
                            {course.description}
                        </p>
                    )}

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--forge-bg-elevated)]">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    course.status === "completed" ? "bg-[var(--forge-success)]" : "bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]"
                                )}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className="text-xs text-[var(--forge-text-muted)] whitespace-nowrap">
                            {completedChapters}/{totalChapters} chapters
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-[var(--forge-text-muted)]">
                    <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {course.estimatedHours}h
                    </span>
                    <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight size={20} />
                    </motion.div>
                </div>
            </button>

            {/* Chapters list */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 pt-0 space-y-3">
                            {course.chapters.map((chapter, idx) => (
                                <ChapterCard
                                    key={chapter.id}
                                    chapter={chapter}
                                    pathId={pathId}
                                    isFirst={idx === 0}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// PROGRESS SIDEBAR
// ============================================================================

function ProgressSidebar({ path }: { path: LearningPathData }) {
    const totalChapters = path.courses.reduce((sum, c) => sum + c.chapters.length, 0);
    const completedChapters = path.courses.reduce(
        (sum, c) => sum + c.chapters.filter(ch => ch.status === "completed").length,
        0
    );
    const progressPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    const totalXP = path.courses.reduce(
        (sum, c) => sum + c.chapters.reduce((s, ch) => s + ch.xpReward, 0),
        0
    );
    const earnedXP = path.courses.reduce(
        (sum, c) => sum + c.chapters
            .filter(ch => ch.status === "completed")
            .reduce((s, ch) => s + ch.xpReward, 0),
        0
    );

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] p-6 sticky top-24">
            <h3 className="font-semibold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--ember)]" />
                Progress
            </h3>

            {/* Main progress ring */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-[var(--forge-bg-elevated)]"
                        />
                        <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="url(#pathGradient)"
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 34}
                            strokeDashoffset={2 * Math.PI * 34 * (1 - progressPercent / 100)}
                            className="transition-all duration-500"
                        />
                        <defs>
                            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="var(--ember)" />
                                <stop offset="100%" stopColor="var(--ember-glow)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-[var(--forge-text-primary)]">{progressPercent}%</span>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="text-sm text-[var(--forge-text-muted)] mb-1">
                        {completedChapters} of {totalChapters} chapters
                    </div>
                    <div className="text-sm text-[var(--forge-text-muted)]">
                        {path.courses.filter(c => c.status === "completed").length} of {path.courses.length} courses
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]">
                    <div className="flex items-center gap-2 text-[var(--ember)] mb-1">
                        <Zap size={14} />
                        <span className="text-xs font-medium">XP Earned</span>
                    </div>
                    <div className="text-lg font-bold text-[var(--forge-text-primary)]">
                        {earnedXP.toLocaleString()}
                    </div>
                    <div className="text-xs text-[var(--forge-text-muted)]">
                        of {totalXP.toLocaleString()}
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]">
                    <div className="flex items-center gap-2 text-[var(--forge-info)] mb-1">
                        <Clock size={14} />
                        <span className="text-xs font-medium">Est. Time</span>
                    </div>
                    <div className="text-lg font-bold text-[var(--forge-text-primary)]">
                        {path.estimatedHours || 0}h
                    </div>
                    <div className="text-xs text-[var(--forge-text-muted)]">
                        remaining
                    </div>
                </div>
            </div>

            {/* Continue button */}
            {path.enrollment && (
                <Link
                    href={`/forge/map`}
                    className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--ember)] text-white font-medium hover:bg-[var(--ember)]/90 transition-colors shadow-md shadow-[var(--ember)]/20"
                >
                    <Map size={16} />
                    View on Map
                </Link>
            )}
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function LearningPathPage() {
    const params = useParams();
    const pathId = params.pathId as string;
    const { user, isLoading: isAuthLoading } = useForge();

    const [pathData, setPathData] = useState<LearningPathData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

    // Fetch learning path data
    useEffect(() => {
        async function fetchPath() {
            const supabase = createClient();

            try {
                // Fetch learning path
                const { data: path, error: pathError } = await supabase
                    .from("learning_paths")
                    .select("*")
                    .eq("id", pathId)
                    .single() as { data: any; error: any };

                if (pathError) throw pathError;

                // Fetch courses for this path
                const { data: pathCourses, error: coursesError } = await supabase
                    .from("learning_path_courses")
                    .select(`
                        id,
                        sort_order,
                        is_required,
                        courses (
                            id,
                            title,
                            description,
                            estimated_hours,
                            chapters (
                                id,
                                title,
                                description,
                                estimated_minutes,
                                xp_reward,
                                sort_order
                            )
                        )
                    `)
                    .eq("learning_path_id", pathId)
                    .order("sort_order") as { data: any[] | null; error: any };

                if (coursesError) throw coursesError;

                // Fetch enrollment if user is logged in
                let enrollment = null;
                if (user) {
                    const { data: enrollmentData } = await supabase
                        .from("learning_path_enrollments")
                        .select("*")
                        .eq("learning_path_id", pathId)
                        .eq("user_id", user.id)
                        .single() as { data: any };

                    enrollment = enrollmentData ? {
                        id: enrollmentData.id,
                        status: enrollmentData.status,
                        progressPercent: enrollmentData.progress_percent,
                        currentCourseIndex: enrollmentData.current_course_index,
                        startedAt: enrollmentData.started_at,
                    } : null;
                }

                // Transform courses data
                const courses: Course[] = (pathCourses || []).map((pc: any, idx: number) => {
                    const course = pc.courses;
                    const chapters = (course.chapters || [])
                        .sort((a: any, b: any) => a.sort_order - b.sort_order)
                        .map((ch: any, chIdx: number) => ({
                            id: ch.id,
                            title: ch.title,
                            description: ch.description,
                            estimatedMinutes: ch.estimated_minutes,
                            xpReward: ch.xp_reward,
                            sortOrder: ch.sort_order,
                            status: chIdx === 0 && idx === 0 ? "available" : "locked", // First chapter of first course available
                            courseId: course.id,
                            courseTitle: course.title,
                        }));

                    return {
                        id: course.id,
                        title: course.title,
                        description: course.description,
                        estimatedHours: course.estimated_hours,
                        chapters,
                        status: idx === 0 ? "available" : "locked",
                        sortOrder: pc.sort_order,
                    };
                });

                // Auto-expand first course
                if (courses.length > 0) {
                    setExpandedCourses(new Set([courses[0].id]));
                }

                setPathData({
                    id: path.id,
                    title: path.title,
                    subtitle: path.subtitle,
                    description: path.description,
                    estimatedHours: path.estimated_hours,
                    pathType: path.path_type,
                    icon: path.icon,
                    color: path.color,
                    courses,
                    enrollment,
                });
            } catch (err) {
                console.error("Error fetching path:", err);
                setError("Failed to load learning path");
            } finally {
                setIsLoading(false);
            }
        }

        if (pathId) {
            fetchPath();
        }
    }, [pathId, user]);

    const toggleCourse = (courseId: string) => {
        setExpandedCourses(prev => {
            const next = new Set(prev);
            if (next.has(courseId)) {
                next.delete(courseId);
            } else {
                next.add(courseId);
            }
            return next;
        });
    };

    if (isLoading || isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-[var(--ember)]" />
            </div>
        );
    }

    if (error || !pathData) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] p-8">
                    <h1 className="text-xl font-bold text-[var(--forge-text-primary)] mb-2">
                        Path Not Found
                    </h1>
                    <p className="text-[var(--forge-text-muted)] mb-6">
                        {error || "This learning path doesn't exist or you don't have access."}
                    </p>
                    <Link
                        href="/forge/profile"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--ember)] text-white text-sm font-medium hover:bg-[var(--ember)]/90 transition-colors"
                    >
                        <ChevronLeft size={16} />
                        Back to Profile
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/forge/profile"
                    className="inline-flex items-center gap-1 text-sm text-[var(--forge-text-muted)] hover:text-[var(--ember)] transition-colors mb-4"
                >
                    <ChevronLeft size={16} />
                    Back to Profile
                </Link>

                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--ember)]/20 to-[var(--ember-glow)]/20 flex items-center justify-center border border-[var(--ember)]/10">
                        <Map size={28} className="text-[var(--ember)]" />
                    </div>

                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-[var(--forge-text-primary)] mb-1">
                            {pathData.title}
                        </h1>
                        {pathData.subtitle && (
                            <p className="text-lg text-[var(--forge-text-muted)] mb-2">
                                {pathData.subtitle}
                            </p>
                        )}
                        {pathData.description && (
                            <p className="text-sm text-[var(--forge-text-secondary)] max-w-2xl">
                                {pathData.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Main content - Courses */}
                <div className="lg:col-span-8 space-y-4">
                    {pathData.courses.length === 0 ? (
                        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] p-8 text-center">
                            <BookOpen size={32} className="mx-auto mb-4 text-[var(--forge-text-muted)]" />
                            <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-2">
                                Content Coming Soon
                            </h3>
                            <p className="text-sm text-[var(--forge-text-muted)]">
                                Chapters for this learning path are being generated.
                            </p>
                        </div>
                    ) : (
                        pathData.courses.map((course) => (
                            <CourseSection
                                key={course.id}
                                course={course}
                                pathId={pathData.id}
                                isExpanded={expandedCourses.has(course.id)}
                                onToggle={() => toggleCourse(course.id)}
                            />
                        ))
                    )}
                </div>

                {/* Sidebar - Progress */}
                <div className="lg:col-span-4">
                    <ProgressSidebar path={pathData} />
                </div>
            </div>
        </div>
    );
}
