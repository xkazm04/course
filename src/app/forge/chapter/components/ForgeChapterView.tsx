"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, Award, BookOpen, ChevronRight, Home, Keyboard } from "lucide-react";
import Link from "next/link";
import { cn } from "@/app/shared/lib/utils";
import { VideoPlayer } from "@/app/features/chapter/components/VideoPlayer";
import { CleanSectionList } from "@/app/features/chapter/components/CleanSectionContent";
import { MarkdownRenderer } from "@/app/features/chapter/components/MarkdownRenderer";
import { TableOfContents } from "./TableOfContents";
import { useKeyboardNavigation } from "./KeyboardNavigation";
import { ReadingControlsButton } from "./ReadingControls";
import {
    ReadingPreferencesProvider,
    useReadingPreferences,
    readingModeClasses,
} from "./ReadingPreferences";
import type { ChapterData } from "../lib/useChapterData";
import type { VideoVariant } from "@/app/features/chapter/lib/contentSlots";

// ============================================================================
// Types
// ============================================================================

interface ForgeChapterViewProps {
    data: ChapterData;
    contentMetadata?: {
        key_takeaways?: string[];
        video_variants?: VideoVariant[];
        estimated_time_minutes?: number;
        difficulty?: string;
        introduction?: string;
    } | null;
    isPreviewMode?: boolean;
    // Regenerate props (passed to TOC)
    isRegenerating?: boolean;
    onRegenerate?: () => void;
    isRealtimeConnected?: boolean;
    regenerateProgress?: { percent: number; message: string } | null;
}

// ============================================================================
// Introduction Section - Now with Markdown support
// ============================================================================

interface IntroductionProps {
    content?: string;
    keyTakeaways?: string[];
}

function Introduction({ content, keyTakeaways }: IntroductionProps) {
    if (!content && (!keyTakeaways || keyTakeaways.length === 0)) return null;

    return (
        <div className="mb-8">
            {/* Introduction content with full markdown support */}
            {content && (
                <div className="prose-section mb-6">
                    <MarkdownRenderer content={content} />
                </div>
            )}

            {/* Key takeaways as compact grid */}
            {keyTakeaways && keyTakeaways.length > 0 && (
                <div className="p-4 bg-[var(--forge-bg-elevated)]/50 rounded-xl border border-[var(--forge-border-subtle)]">
                    <h3 className="text-sm font-semibold text-[var(--forge-text-primary)] mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[var(--ember)]/10 flex items-center justify-center">
                            <BookOpen className="w-3 h-3 text-[var(--ember)]" />
                        </span>
                        What you'll learn
                    </h3>
                    <ul className="grid gap-2 sm:grid-cols-2">
                        {keyTakeaways.map((point, idx) => (
                            <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]"
                            >
                                <span className="w-5 h-5 rounded-full bg-[var(--ember)]/10 text-[var(--ember)] flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Main ForgeChapterView - Inner Component (uses reading preferences context)
// ============================================================================

function ForgeChapterViewInner({
    data,
    contentMetadata,
    isPreviewMode,
    isRegenerating,
    onRegenerate,
    isRealtimeConnected,
    regenerateProgress,
}: ForgeChapterViewProps) {
    const [expandedSection, setExpandedSection] = useState<number | null>(null);
    const [activeSection, setActiveSection] = useState<number>(data.sections[0]?.id || 1);

    // Reading preferences
    const {
        fontSize,
        readingMode,
        increaseFontSize,
        decreaseFontSize,
        toggleReadingMode,
    } = useReadingPreferences();

    // Extract video variants from content metadata or use default empty
    const videoVariants: VideoVariant[] = useMemo(() => {
        if (contentMetadata?.video_variants && contentMetadata.video_variants.length > 0) {
            return contentMetadata.video_variants;
        }
        // Default placeholder variant when no videos in DB
        return [{
            id: "placeholder",
            title: data.courseInfo.chapterTitle,
            searchQuery: `${data.courseInfo.courseName} ${data.courseInfo.chapterTitle} tutorial`,
            style: "tutorial" as const,
        }];
    }, [contentMetadata?.video_variants, data.courseInfo]);

    // Navigation handlers
    const navigateToSection = useCallback((sectionId: number) => {
        setActiveSection(sectionId);
        // Scroll to section
        const element = document.getElementById(`section-${sectionId}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, []);

    const navigateNext = useCallback(() => {
        const currentIndex = data.sections.findIndex(s => s.id === activeSection);
        if (currentIndex < data.sections.length - 1) {
            navigateToSection(data.sections[currentIndex + 1].id);
        }
    }, [activeSection, data.sections, navigateToSection]);

    const navigatePrev = useCallback(() => {
        const currentIndex = data.sections.findIndex(s => s.id === activeSection);
        if (currentIndex > 0) {
            navigateToSection(data.sections[currentIndex - 1].id);
        }
    }, [activeSection, data.sections, navigateToSection]);

    const handleMarkComplete = useCallback(() => {
        // This would typically call an API to mark the section complete
        console.log("Mark section complete:", activeSection);
    }, [activeSection]);

    // Keyboard navigation
    const { ShortcutsModal, Toast, setShowShortcuts } = useKeyboardNavigation({
        sections: data.sections.map(s => ({ id: s.id })),
        activeSection,
        expandedSection,
        onNavigateNext: navigateNext,
        onNavigatePrev: navigatePrev,
        onExpandSection: setExpandedSection,
        onMarkComplete: handleMarkComplete,
        onIncreaseFontSize: increaseFontSize,
        onDecreaseFontSize: decreaseFontSize,
        onToggleReadingMode: toggleReadingMode,
    });

    // Font size CSS class
    const fontSizeClass = `reading-font-${fontSize}`;

    return (
        <div className={cn(
            "reading-transition",
            readingModeClasses[readingMode]
        )}>
            {/* Table of Contents - Unified with Learning Path */}
            <TableOfContents
                sections={data.sections}
                activeSection={activeSection}
                expandedSection={expandedSection}
                onNavigate={navigateToSection}
                onActiveSectionChange={setActiveSection}
                courseName={data.courseInfo.courseName}
                chapterTitle={data.courseInfo.chapterTitle}
                chapterId={data.courseInfo.chapterId}
                isRegenerating={isRegenerating}
                onRegenerate={onRegenerate}
                isRealtimeConnected={isRealtimeConnected}
                regenerateProgress={regenerateProgress}
            />

            {/* Main Content - Wider, no right sidebar needed */}
            <div className="max-w-6xl mx-auto px-4 py-8 lg:pl-80">
                {/* Header with Reading Controls */}
                <div className="chapter-header-nav">
                    <div className="flex items-center justify-between mb-4">
                        <nav className="flex items-center gap-2 text-sm text-[var(--forge-text-muted)]">
                            <Link href="/forge" className="hover:text-[var(--ember)] transition-colors flex items-center gap-1">
                                <Home className="w-3.5 h-3.5" />
                                Forge
                            </Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <Link href="/forge/map" className="hover:text-[var(--ember)] transition-colors">
                                Learning Map
                            </Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="text-[var(--forge-text-secondary)]">{data.courseInfo.courseName}</span>
                        </nav>
                        <div className="flex items-center gap-2">
                            <ReadingControlsButton />
                            <button
                                onClick={() => setShowShortcuts(true)}
                                className="p-2 rounded-lg hover:bg-[var(--forge-bg-elevated)] transition-colors text-[var(--forge-text-muted)]"
                                title="Keyboard shortcuts (?)"
                            >
                                <Keyboard className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Title & Meta */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--forge-text-primary)] mb-3">
                        {data.courseInfo.chapterTitle}
                    </h1>
                    <div className="chapter-meta flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-[var(--forge-text-muted)]">
                            <Clock className="w-4 h-4" />
                            <span>{contentMetadata?.estimated_time_minutes || data.sections.reduce((acc, s) => acc + (parseInt(s.duration.replace(/\D/g, "")) || 5), 0)} min</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--forge-text-muted)]">
                            <BookOpen className="w-4 h-4" />
                            <span>{data.sections.length} sections</span>
                        </div>
                        {contentMetadata?.difficulty && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                                contentMetadata.difficulty === "beginner" && "bg-green-500/10 text-green-600 dark:text-green-400",
                                contentMetadata.difficulty === "intermediate" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                contentMetadata.difficulty === "advanced" && "bg-red-500/10 text-red-600 dark:text-red-400"
                            )}>
                                {contentMetadata.difficulty}
                            </span>
                        )}
                        <div className="flex items-center gap-1.5 text-[var(--ember)]">
                            <Award className="w-4 h-4" />
                            <span>{data.sections.filter(s => s.completed).length}/{data.sections.length} completed</span>
                        </div>
                    </div>
                </div>

                {/* Video Player */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                >
                    <VideoPlayer variants={videoVariants} />
                </motion.div>

                {/* Introduction */}
                <Introduction
                    content={contentMetadata?.introduction}
                    keyTakeaways={contentMetadata?.key_takeaways}
                />

                {/* Section List with dynamic font size */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className={cn("reading-content", fontSizeClass)}
                >
                    <CleanSectionList
                        sections={data.sections}
                        courseInfo={data.courseInfo}
                        activeSection={activeSection}
                        expandedSection={expandedSection}
                        onExpandSection={setExpandedSection}
                        onActivateSection={setActiveSection}
                    />
                </motion.div>

                {/* Preview Mode Notice */}
                {isPreviewMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center"
                    >
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            You're viewing this chapter in preview mode.
                            <Link href="/forge/map" className="ml-1 underline hover:no-underline">
                                Enroll in this path
                            </Link>
                            {" "}to track your progress and earn XP.
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Keyboard shortcuts modal & toast */}
            <ShortcutsModal />
            <Toast />
        </div>
    );
}

// ============================================================================
// Main ForgeChapterView - Wrapper with Provider
// ============================================================================

export function ForgeChapterView(props: ForgeChapterViewProps) {
    return (
        <ReadingPreferencesProvider>
            <ForgeChapterViewInner {...props} />
        </ReadingPreferencesProvider>
    );
}

export default ForgeChapterView;
