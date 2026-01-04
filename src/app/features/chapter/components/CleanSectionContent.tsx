"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen, ChevronDown, ChevronUp, Code2, FileText,
    CheckCircle, Clock, ArrowRight, Lightbulb, Video
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { CodeBlock } from "@/app/shared/components";
import { BookmarkButton, BookmarkIndicator } from "@/app/features/bookmarks";
import type { ChapterSection, CourseInfo } from "../lib/chapterData";

// ============================================================================
// Animation Variants for Progressive Disclosure
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1,
        },
    },
};

const itemVariants = {
    hidden: {
        opacity: 0,
        y: 12,
        scale: 0.98,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.25,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
    exit: {
        opacity: 0,
        y: -8,
        scale: 0.98,
        transition: {
            duration: 0.15,
        },
    },
};

// ============================================================================
// Skeleton Loading Components
// ============================================================================

function SkeletonPulse({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "relative overflow-hidden bg-[var(--forge-bg-elevated)] rounded",
                className
            )}
        >
            <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--forge-border-subtle)]/50 to-transparent"
                style={{
                    animation: "shimmer 1.5s ease-in-out infinite",
                }}
            />
        </div>
    );
}

function SectionContentSkeleton() {
    return (
        <div
            className="px-6 pb-6 pt-2 ml-14"
            data-testid="section-content-skeleton"
        >
            {/* Description skeleton */}
            <div className="mb-6 space-y-3">
                <SkeletonPulse className="h-4 w-full" />
                <SkeletonPulse className="h-4 w-11/12" />
                <SkeletonPulse className="h-4 w-4/5" />
                <SkeletonPulse className="h-4 w-3/4" />
            </div>

            {/* Code block skeleton */}
            <div className="mb-6 rounded-lg border border-[var(--forge-border-subtle)] overflow-hidden">
                <div className="h-8 bg-[var(--forge-bg-elevated)] flex items-center px-4 gap-2">
                    <SkeletonPulse className="h-3 w-3 rounded-full" />
                    <SkeletonPulse className="h-3 w-3 rounded-full" />
                    <SkeletonPulse className="h-3 w-3 rounded-full" />
                </div>
                <div className="p-4 bg-[var(--forge-bg-base)] space-y-2">
                    <SkeletonPulse className="h-3 w-3/4" />
                    <SkeletonPulse className="h-3 w-1/2" />
                    <SkeletonPulse className="h-3 w-5/6" />
                    <SkeletonPulse className="h-3 w-2/3" />
                </div>
            </div>

            {/* Key points skeleton */}
            <div className="mb-6 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                    <SkeletonPulse className="h-4 w-4 rounded" />
                    <SkeletonPulse className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <SkeletonPulse className="h-2 w-2 rounded-full" />
                        <SkeletonPulse className="h-3 w-4/5" />
                    </div>
                    <div className="flex items-center gap-2">
                        <SkeletonPulse className="h-2 w-2 rounded-full" />
                        <SkeletonPulse className="h-3 w-3/4" />
                    </div>
                    <div className="flex items-center gap-2">
                        <SkeletonPulse className="h-2 w-2 rounded-full" />
                        <SkeletonPulse className="h-3 w-2/3" />
                    </div>
                </div>
            </div>

            {/* Action row skeleton */}
            <div className="flex items-center gap-3">
                <SkeletonPulse className="flex-1 h-12 rounded-lg" />
                <SkeletonPulse className="h-10 w-10 rounded-lg" />
            </div>
        </div>
    );
}

// ============================================================================
// Clean Section Card - Minimal design focused on readability
// ============================================================================

interface CleanSectionCardProps {
    section: ChapterSection;
    courseInfo: CourseInfo;
    isExpanded: boolean;
    isActive: boolean;
    isLoading?: boolean;
    onToggle: () => void;
    onStart: () => void;
}

export function CleanSectionCard({
    section,
    courseInfo,
    isExpanded,
    isActive,
    isLoading = false,
    onToggle,
    onStart,
}: CleanSectionCardProps) {
    const typeConfig = {
        video: { icon: Video, label: "Video", color: "text-red-500" },
        lesson: { icon: FileText, label: "Lesson", color: "text-blue-500" },
        interactive: { icon: Code2, label: "Interactive", color: "text-purple-500" },
        exercise: { icon: BookOpen, label: "Exercise", color: "text-amber-500" },
    };

    const config = typeConfig[section.type] || typeConfig.lesson;
    const TypeIcon = config.icon;

    return (
        <article
            id={`section-${section.id}`}
            className={cn(
                "group border-b border-[var(--forge-border-subtle)] last:border-b-0 scroll-mt-24",
                isActive && "bg-[var(--ember)]/[0.02]"
            )}
            data-testid={`clean-section-${section.id}`}
        >
            {/* Section Header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-4 py-5 px-6 text-left hover:bg-[var(--forge-bg-elevated)]/30 transition-colors"
                data-testid={`section-toggle-btn-${section.id}`}
            >
                {/* Status/Type Indicator */}
                <div className="relative flex-shrink-0">
                    {section.completed ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                    ) : (
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            isActive ? "bg-[var(--ember)]/10" : "bg-[var(--forge-bg-elevated)]"
                        )}>
                            <TypeIcon className={cn("w-5 h-5", isActive ? "text-[var(--ember)]" : config.color)} />
                        </div>
                    )}
                    {isActive && !section.completed && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--ember)] rounded-full animate-pulse" />
                    )}
                </div>

                {/* Title and Meta */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn(
                            "font-semibold text-base",
                            section.completed
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-[var(--forge-text-primary)]"
                        )}>
                            {section.title}
                        </h3>
                        <BookmarkIndicator
                            courseId={courseInfo.courseId}
                            chapterId={courseInfo.chapterId}
                            sectionId={section.sectionId}
                        />
                        {isActive && !section.completed && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--ember)]/10 text-[var(--ember)]">
                                Current
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[var(--forge-text-muted)]">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {section.duration}
                        </span>
                        <span className={cn("flex items-center gap-1.5", config.color)}>
                            <TypeIcon className="w-3.5 h-3.5" />
                            {config.label}
                        </span>
                    </div>
                </div>

                {/* Expand Toggle */}
                <div className="text-[var(--forge-text-muted)] group-hover:text-[var(--forge-text-secondary)] transition-colors">
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                    ) : (
                        <ChevronDown className="w-5 h-5" />
                    )}
                </div>
            </button>

            {/* Expanded Content with Progressive Disclosure */}
            <AnimatePresence mode="wait">
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        {isLoading ? (
                            <SectionContentSkeleton />
                        ) : (
                            <motion.div
                                className="px-6 pb-6 pt-2 ml-14"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                data-testid={`section-content-${section.id}`}
                            >
                                {/* Main Content - Clean prose (First item) */}
                                <motion.div
                                    className="prose-section mb-6"
                                    variants={itemVariants}
                                    data-testid={`section-description-${section.id}`}
                                >
                                    <MarkdownRenderer content={section.content.description} />
                                </motion.div>

                                {/* Code Block (Second item - staggered 100ms) */}
                                {section.content.code && (
                                    <motion.div
                                        className="mb-6"
                                        variants={itemVariants}
                                        data-testid={`section-code-${section.id}`}
                                    >
                                        <CodeBlock
                                            code={section.content.code}
                                            language="typescript"
                                            showLineNumbers={true}
                                            showCopy={true}
                                            showHeader={true}
                                        />
                                    </motion.div>
                                )}

                                {/* Key Points (Third item - staggered another 100ms) */}
                                {section.content.keyPoints && section.content.keyPoints.length > 0 && (
                                    <motion.div
                                        className="mb-6 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20"
                                        variants={itemVariants}
                                        data-testid={`section-keypoints-${section.id}`}
                                    >
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3">
                                            <Lightbulb className="w-4 h-4" />
                                            Key Takeaways
                                        </h4>
                                        <ul className="space-y-2">
                                            {section.content.keyPoints.map((point, idx) => (
                                                <li
                                                    key={idx}
                                                    className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]"
                                                    data-testid={`keypoint-item-${section.id}-${idx}`}
                                                >
                                                    <span className="text-amber-500 mt-1">•</span>
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}

                                {/* Action Row (Fourth item - staggered) */}
                                <motion.div
                                    className="flex items-center gap-3"
                                    variants={itemVariants}
                                    data-testid={`section-actions-${section.id}`}
                                >
                                    <button
                                        onClick={onStart}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all",
                                            section.completed
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                                : "bg-[var(--ember)] text-white hover:bg-[var(--ember-glow)] shadow-sm"
                                        )}
                                        data-testid={`section-start-btn-${section.id}`}
                                    >
                                        {section.completed ? (
                                            "Review Section"
                                        ) : (
                                            <>
                                                {section.type === "video" && "Watch Video"}
                                                {section.type === "lesson" && "Start Reading"}
                                                {section.type === "interactive" && "Start Coding"}
                                                {section.type === "exercise" && "Begin Exercise"}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                    <BookmarkButton
                                        courseId={courseInfo.courseId}
                                        courseName={courseInfo.courseName}
                                        chapterId={courseInfo.chapterId}
                                        chapterTitle={courseInfo.chapterTitle}
                                        sectionId={section.sectionId}
                                        sectionTitle={section.title}
                                        variant="icon"
                                    />
                                </motion.div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </article>
    );
}

// ============================================================================
// Clean Section List - Container for multiple sections
// ============================================================================

interface CleanSectionListProps {
    sections: ChapterSection[];
    courseInfo: CourseInfo;
    activeSection: number;
    expandedSection: number | null;
    loadingSectionId?: number | null;
    onExpandSection: (id: number | null) => void;
    onActivateSection: (id: number) => void;
    className?: string;
}

export function CleanSectionList({
    sections,
    courseInfo,
    activeSection,
    expandedSection,
    loadingSectionId = null,
    onExpandSection,
    onActivateSection,
    className,
}: CleanSectionListProps) {
    return (
        <div
            className={cn(
                "bg-[var(--forge-bg-daylight)] rounded-2xl border border-[var(--forge-border-subtle)] overflow-hidden",
                className
            )}
            data-testid="clean-section-list"
        >
            {/* List Header */}
            <div className="px-6 py-4 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                        Chapter Content
                    </h2>
                    <span className="text-sm text-[var(--forge-text-muted)]">
                        {sections.filter(s => s.completed).length} / {sections.length} completed
                    </span>
                </div>
                {/* Progress Bar */}
                <div className="mt-3 h-1.5 bg-[var(--forge-bg-elevated)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                            width: `${(sections.filter(s => s.completed).length / sections.length) * 100}%`
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Section Cards */}
            <div data-testid="section-cards-container">
                {sections.map((section) => (
                    <CleanSectionCard
                        key={section.id}
                        section={section}
                        courseInfo={courseInfo}
                        isExpanded={expandedSection === section.id}
                        isActive={activeSection === section.id}
                        isLoading={loadingSectionId === section.id}
                        onToggle={() => onExpandSection(expandedSection === section.id ? null : section.id)}
                        onStart={() => onActivateSection(section.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default CleanSectionList;
