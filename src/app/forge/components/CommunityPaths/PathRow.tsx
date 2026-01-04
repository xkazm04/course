"use client";

import { Fragment } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, Target, Zap, BookOpen, Eye } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { EnrollButton } from "./EnrollButton";
import { DOMAIN_CONFIG, DIFFICULTY_CONFIG, type CommunityPath } from "../../lib/communityPathsTypes";

interface PathRowProps {
    path: CommunityPath;
    isExpanded: boolean;
    onToggle: () => void;
    index: number;
}

// Icon mapping for path types
const PATH_TYPE_ICONS: Record<string, typeof Target> = {
    career: Target,
    skill: Zap,
    custom: BookOpen,
    ai_generated: Sparkles,
};

export function PathRow({ path, isExpanded, onToggle, index }: PathRowProps) {
    const domainConfig = DOMAIN_CONFIG[path.domain];
    const difficultyConfig = DIFFICULTY_CONFIG[path.difficulty];
    const PathIcon = PATH_TYPE_ICONS[path.pathType] || BookOpen;

    return (
        <Fragment>
            {/* Main Row */}
            <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={onToggle}
                className={cn(
                    "cursor-pointer transition-colors",
                    isExpanded
                        ? "bg-[var(--forge-bg-elevated)]/30"
                        : "hover:bg-[var(--forge-bg-elevated)]/40"
                )}
            >
                {/* Path Info - Always visible */}
                <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                        {/* Expand icon */}
                        <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-[var(--forge-text-muted)] flex-shrink-0"
                        >
                            <ChevronRight size={18} />
                        </motion.div>

                        {/* Path icon */}
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            "bg-gradient-to-br from-[var(--ember)]/20 to-[var(--gold)]/20",
                            "border border-[var(--ember)]/20"
                        )}>
                            <PathIcon size={18} className="text-[var(--ember)]" />
                        </div>

                        {/* Title & metadata */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-[var(--forge-text-primary)] truncate">
                                    {path.title}
                                </h3>
                                {path.pathType === "ai_generated" && (
                                    <Sparkles size={12} className="text-[var(--gold)] flex-shrink-0" />
                                )}
                            </div>
                            {path.subtitle && (
                                <p className="text-xs text-[var(--forge-text-muted)] truncate">
                                    {path.subtitle}
                                </p>
                            )}
                            {/* Mobile-only domain badge */}
                            <div className="flex items-center gap-2 mt-1 md:hidden">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-medium",
                                    domainConfig?.bgColor,
                                    domainConfig?.color
                                )}>
                                    {domainConfig?.label}
                                </span>
                                <span className={cn("text-[10px]", difficultyConfig?.color)}>
                                    {difficultyConfig?.label}
                                </span>
                            </div>
                        </div>
                    </div>
                </td>

                {/* Domain */}
                <td className="hidden md:table-cell px-4 py-4 text-center">
                    <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium inline-block",
                        domainConfig?.bgColor,
                        domainConfig?.color
                    )}>
                        {domainConfig?.label}
                    </span>
                </td>

                {/* Courses count */}
                <td className="hidden md:table-cell px-4 py-4 text-center">
                    <span className="text-sm text-[var(--forge-text-secondary)]">
                        {path.courseCount}
                    </span>
                </td>

                {/* Chapters count */}
                <td className="hidden md:table-cell px-4 py-4 text-center">
                    <span className="text-sm text-[var(--forge-text-secondary)]">
                        {path.chapterCount}
                    </span>
                </td>

                {/* Duration */}
                <td className="hidden md:table-cell px-4 py-4 text-center">
                    <span className="text-sm text-[var(--forge-text-secondary)]">
                        {path.estimatedHours}h
                    </span>
                </td>

                {/* Enrolled */}
                <td className="hidden md:table-cell px-4 py-4 text-center">
                    <span className="text-sm text-[var(--forge-text-secondary)]">
                        {path.enrollmentCount.toLocaleString()}
                    </span>
                </td>

                {/* Enroll button */}
                <td className="px-4 py-4 text-right md:text-center" onClick={(e) => e.stopPropagation()}>
                    <EnrollButton pathId={path.id} isEnrolled={path.isEnrolled} />
                </td>
            </motion.tr>

            {/* Expanded Content Row */}
            <AnimatePresence>
                {isExpanded && path.courses.length > 0 && (
                    <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <td colSpan={7} className="p-0">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden bg-[var(--forge-bg-elevated)]/20"
                            >
                                <div className="px-4 py-4 pl-14">
                                    <div className="rounded-xl bg-[var(--forge-bg-forge)]/50 border border-[var(--forge-border-subtle)] overflow-hidden">
                                        {path.courses.map((course, courseIndex) => (
                                            <div key={course.id}>
                                                {/* Course row */}
                                                <div className={cn(
                                                    "flex items-center gap-3 px-4 py-3",
                                                    courseIndex > 0 && "border-t border-[var(--forge-border-subtle)]"
                                                )}>
                                                    <div className="w-6 h-6 rounded-lg bg-[var(--ember)]/10 flex items-center justify-center text-xs font-bold text-[var(--ember)]">
                                                        {courseIndex + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-[var(--forge-text-primary)] truncate">
                                                            {course.title}
                                                        </p>
                                                        <p className="text-xs text-[var(--forge-text-muted)]">
                                                            {course.chapterCount} chapters · {course.estimatedHours}h
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Chapters */}
                                                {course.chapters.length > 0 && (
                                                    <div className="border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-void)]/30">
                                                        {course.chapters.map((chapter, chapterIndex) => (
                                                            <Link
                                                                key={chapter.id}
                                                                href={`/forge/chapter/${chapter.id}?preview=true`}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-4 py-2 pl-14 group cursor-pointer",
                                                                    "hover:bg-[var(--forge-bg-elevated)]/50 transition-colors",
                                                                    chapterIndex > 0 && "border-t border-[var(--forge-border-subtle)]/50"
                                                                )}
                                                            >
                                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--forge-text-muted)] group-hover:bg-[var(--ember)] transition-colors" />
                                                                <span className="flex-1 text-xs text-[var(--forge-text-secondary)] truncate group-hover:text-[var(--forge-text-primary)] transition-colors">
                                                                    {chapter.title}
                                                                </span>
                                                                <Eye size={12} className="text-[var(--forge-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                <span className="text-xs text-[var(--forge-text-muted)]">
                                                                    {Math.round(chapter.estimatedMinutes / 60 * 10) / 10}h
                                                                </span>
                                                                <span className="text-xs text-[var(--ember)]">
                                                                    +{chapter.xpReward} XP
                                                                </span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Path description */}
                                    {path.description && (
                                        <p className="mt-3 text-sm text-[var(--forge-text-muted)] leading-relaxed">
                                            {path.description}
                                        </p>
                                    )}

                                    {/* Creator info */}
                                    {path.creator && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--forge-text-muted)]">
                                            <div className="w-5 h-5 rounded-full bg-[var(--forge-bg-bench)] flex items-center justify-center text-[10px] font-medium text-[var(--forge-text-secondary)]">
                                                {path.creator.displayName.charAt(0)}
                                            </div>
                                            <span>Created by {path.creator.displayName}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </td>
                    </motion.tr>
                )}
            </AnimatePresence>
        </Fragment>
    );
}
