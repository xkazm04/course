"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle, Play } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { CourseProgress } from "../lib/types";
import { formatWatchTime } from "../lib/progressStorage";
import { ProgressBar } from "./ProgressBar";
import { getGlowColor, toDomainColor } from "@/app/shared/lib/learningDomains";

interface CourseProgressCardProps {
    course: CourseProgress;
    onClick?: () => void;
    className?: string;
}

export function CourseProgressCard({ course, onClick, className }: CourseProgressCardProps) {
    const completedChapters = Object.values(course.chapterProgress).filter((c) => c.completed).length;
    const totalChapters = Object.keys(course.chapterProgress).length;
    const completedVideos = Object.values(course.videoProgress).filter((v) => v.completed).length;
    const totalVideos = Object.keys(course.videoProgress).length;

    const color = getGlowColor(toDomainColor(course.courseColor));

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "w-full text-left p-4 bg-[var(--forge-bg-elevated)] backdrop-blur-md",
                "border border-[var(--forge-border-subtle)] rounded-xl",
                "hover:bg-[var(--forge-bg-workshop)] transition-all",
                className
            )}
            data-testid={`course-progress-card-${course.courseId}`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold",
                        `bg-gradient-to-br from-${color}-500 to-${color}-600`
                    )}
                    style={{
                        background: `linear-gradient(135deg, var(--${color}-500, #6366f1), var(--${color}-600, #4f46e5))`,
                    }}
                >
                    {course.courseName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[var(--forge-text-primary)] truncate">
                        {course.courseName}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-[var(--forge-text-muted)] mt-1">
                        {totalChapters > 0 && (
                            <span className="flex items-center gap-1">
                                <CheckCircle size={ICON_SIZES.xs} />
                                {completedChapters}/{totalChapters} chapters
                            </span>
                        )}
                        {totalVideos > 0 && (
                            <span className="flex items-center gap-1">
                                <Play size={ICON_SIZES.xs} />
                                {completedVideos}/{totalVideos} videos
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock size={ICON_SIZES.xs} />
                            {formatWatchTime(course.totalWatchTimeSeconds)}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-lg font-bold text-[var(--forge-text-primary)]">
                        {course.overallProgress}%
                    </span>
                </div>
            </div>
            <div className="mt-3">
                <ProgressBar progress={course.overallProgress} size="sm" color={color} />
            </div>
        </motion.button>
    );
}
