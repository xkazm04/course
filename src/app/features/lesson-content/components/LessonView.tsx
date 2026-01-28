"use client";

/**
 * LessonView - Content-first lesson experience
 *
 * A comprehensive lesson viewing experience with:
 * - Horizontal tab-based section navigation with keyboard support (←/→)
 * - Video references as collapsible panel (not main content)
 * - Wide content area for detailed markdown content
 * - Progress tracking
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Play,
    BookOpen,
    Code2,
    CheckCircle2,
    Circle,
    Clock,
    ArrowLeft,
    ExternalLink,
    Loader2,
    AlertCircle,
    Zap,
    GraduationCap,
    Video,
    ChevronDown,
    ChevronUp,
    Keyboard,
    FileText,
    Github,
    Wrench,
    Newspaper,
    PlayCircle,
    Sparkles,
    Link2,
} from "lucide-react";
import type { FullLesson, LessonSection, VideoVariant, KeyReference } from "../lib/types";
import { parseMarkdownToBlocks } from "../lib/markdownParser";
import { ContentBlockRenderer } from "./LessonRenderer";
import { CodeBlock, KeypointsBlock } from "./CustomBlockRenderer";

// ============================================================================
// Types
// ============================================================================

interface LessonViewProps {
    lesson: FullLesson;
    onBack?: () => void;
    className?: string;
}

// ============================================================================
// Video References Panel (Collapsible)
// ============================================================================

interface VideoReferencesPanelProps {
    variants: VideoVariant[];
    lessonTitle: string;
}

function VideoReferencesPanel({ variants, lessonTitle }: VideoReferencesPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeVideo, setActiveVideo] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const currentVideo = variants[activeVideo];

    return (
        <div className="mb-8 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] overflow-hidden">
            {/* Header - always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-[var(--forge-bg-bench)] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--ember)]/10 flex items-center justify-center">
                        <Video className="w-5 h-5 text-[var(--ember)]" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-[var(--forge-text-primary)]">
                            Video References
                        </h3>
                        <p className="text-xs text-[var(--forge-text-muted)]">
                            {variants.length} video{variants.length !== 1 ? "s" : ""} from different instructors
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--forge-text-muted)] px-2 py-1 rounded-full bg-[var(--forge-bg-bench)]">
                        Optional
                    </span>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[var(--forge-text-muted)]" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--forge-text-muted)]" />
                    )}
                </div>
            </button>

            {/* Expandable content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 border-t border-[var(--forge-border-subtle)]">
                            {/* Video variant tabs */}
                            {variants.length > 1 && (
                                <div className="flex flex-wrap gap-2 mb-4 pt-4">
                                    {variants.map((variant, i) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => {
                                                setActiveVideo(i);
                                                setIsPlaying(false);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                                i === activeVideo
                                                    ? "bg-[var(--ember)] text-white"
                                                    : "bg-[var(--forge-bg-bench)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg)]"
                                            }`}
                                        >
                                            <Play className="w-3 h-3" />
                                            {variant.instructor || variant.title}
                                            {variant.duration && (
                                                <span className="opacity-70">({variant.duration})</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Video player */}
                            {currentVideo && (
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-[var(--forge-border-subtle)] bg-black">
                                    {!isPlaying && currentVideo.youtube_id ? (
                                        <button
                                            onClick={() => setIsPlaying(true)}
                                            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/60 to-black/40 hover:from-black/50 hover:to-black/30 transition-all group z-10"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-[var(--ember)] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                                <Play className="w-6 h-6 text-white ml-1" fill="white" />
                                            </div>
                                            <img
                                                src={`https://img.youtube.com/vi/${currentVideo.youtube_id}/maxresdefault.jpg`}
                                                alt={currentVideo.title}
                                                className="absolute inset-0 w-full h-full object-cover -z-10"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${currentVideo.youtube_id}/hqdefault.jpg`;
                                                }}
                                            />
                                        </button>
                                    ) : currentVideo.youtube_id ? (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${currentVideo.youtube_id}?autoplay=1&rel=0`}
                                            title={currentVideo.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute inset-0 w-full h-full"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--forge-text-muted)]">
                                            <ExternalLink className="w-8 h-8 mb-3" />
                                            <p className="text-sm">Search for: {currentVideo.search_query}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Video info */}
                            {currentVideo && (
                                <div className="mt-3 flex items-center justify-between text-sm text-[var(--forge-text-muted)]">
                                    <span>{currentVideo.title}</span>
                                    {currentVideo.style && (
                                        <span className="px-2 py-0.5 rounded-full bg-[var(--forge-bg-bench)] capitalize">
                                            {currentVideo.style}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Key References Table - Minimalistic reference links
// ============================================================================

interface KeyReferencesTableProps {
    references: KeyReference[];
}

const referenceIcons: Record<KeyReference["type"], React.ElementType> = {
    docs: FileText,
    repo: Github,
    tool: Wrench,
    article: Newspaper,
    video: PlayCircle,
    course: GraduationCap,
};

function KeyReferencesTable({ references }: KeyReferencesTableProps) {
    return (
        <div className="rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] overflow-hidden h-full">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-bench)]">
                <Link2 className="w-4 h-4 text-[var(--forge-text-muted)]" />
                <h4 className="text-sm font-medium text-[var(--forge-text-primary)]">References</h4>
            </div>
            <div className="divide-y divide-[var(--forge-border-subtle)]">
                {references.map((ref, i) => {
                    const Icon = referenceIcons[ref.type] || ExternalLink;
                    return (
                        <a
                            key={i}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--forge-bg-bench)] transition-colors group"
                        >
                            <Icon className="w-4 h-4 text-[var(--forge-text-muted)] group-hover:text-[var(--ember)] transition-colors flex-shrink-0" />
                            <span className="text-sm text-[var(--forge-text-secondary)] group-hover:text-[var(--forge-text-primary)] transition-colors truncate flex-1">
                                {ref.title}
                            </span>
                            <ExternalLink className="w-3 h-3 text-[var(--forge-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </a>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// Key Takeaways with References - Split layout
// ============================================================================

interface KeyTakeawaysWithRefsProps {
    takeaways: string[];
    references?: KeyReference[];
}

function KeyTakeawaysWithRefs({ takeaways, references }: KeyTakeawaysWithRefsProps) {
    const hasReferences = references && references.length > 0;

    return (
        <div className={`mb-8 grid gap-4 ${hasReferences ? "md:grid-cols-2" : ""}`}>
            {/* Key Takeaways - Left side */}
            <div className="rounded-xl border border-[var(--ember)]/30 bg-gradient-to-br from-[var(--ember)]/5 to-transparent p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[var(--ember)]" />
                    <h4 className="font-semibold text-[var(--forge-text-primary)]">Key Takeaways</h4>
                </div>
                <ul className="space-y-2">
                    {takeaways.map((point, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-[var(--ember)] flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-[var(--forge-text-secondary)]">{point}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* References - Right side */}
            {hasReferences && <KeyReferencesTable references={references} />}
        </div>
    );
}

// ============================================================================
// Section Tab Switcher with Keyboard Navigation
// ============================================================================

interface SectionTabsProps {
    sections: LessonSection[];
    activeIndex: number;
    onSelect: (index: number) => void;
    completedSections: Set<number>;
    onToggleComplete: (index: number) => void;
}

function SectionTabs({
    sections,
    activeIndex,
    onSelect,
    completedSections,
    onToggleComplete,
}: SectionTabsProps) {
    const tabsRef = useRef<HTMLDivElement>(null);
    const progress = (completedSections.size / sections.length) * 100;

    // Scroll active tab into view
    useEffect(() => {
        const activeTab = tabsRef.current?.querySelector(`[data-index="${activeIndex}"]`);
        if (activeTab) {
            activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    }, [activeIndex]);

    const getIcon = (type: string) => {
        switch (type) {
            case "video":
                return Play;
            case "exercise":
                return Code2;
            case "interactive":
                return Zap;
            default:
                return BookOpen;
        }
    };

    return (
        <div className="mb-8">
            {/* Progress bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--forge-text-secondary)]">
                        Progress
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--forge-text-muted)]">
                            {completedSections.size}/{sections.length} completed
                        </span>
                        <div className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)] px-2 py-1 rounded-md bg-[var(--forge-bg-bench)]">
                            <Keyboard className="w-3 h-3" />
                            <span>← →</span>
                        </div>
                    </div>
                </div>
                <div className="h-1.5 bg-[var(--forge-bg-bench)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div
                ref={tabsRef}
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[var(--forge-border-subtle)] scrollbar-track-transparent"
                role="tablist"
            >
                {sections.map((section, index) => {
                    const isActive = index === activeIndex;
                    const isCompleted = completedSections.has(index);
                    const Icon = getIcon(section.section_type);

                    return (
                        <button
                            key={section.id}
                            data-index={index}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onSelect(index)}
                            className={`group relative flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                isActive
                                    ? "bg-[var(--ember)] text-white shadow-lg shadow-[var(--ember)]/20"
                                    : isCompleted
                                    ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                    : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-bench)] border border-[var(--forge-border-subtle)]"
                            }`}
                        >
                            {/* Section number */}
                            <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isActive
                                        ? "bg-white/20"
                                        : isCompleted
                                        ? "bg-green-500/20"
                                        : "bg-[var(--forge-bg-bench)]"
                                }`}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    index + 1
                                )}
                            </span>

                            {/* Icon and title */}
                            <Icon className="w-4 h-4" />
                            <span className="max-w-[150px] truncate">{section.title}</span>

                            {/* Duration */}
                            {section.duration_minutes && (
                                <span className={`text-xs ${isActive ? "opacity-70" : "opacity-50"}`}>
                                    {section.duration_minutes}m
                                </span>
                            )}

                            {/* Complete toggle on hover */}
                            {!isCompleted && !isActive && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleComplete(index);
                                    }}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--forge-bg)] border border-[var(--forge-border-subtle)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-500 hover:text-white hover:border-green-500"
                                    title="Mark as complete"
                                >
                                    <CheckCircle2 className="w-3 h-3" />
                                </button>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// Main LessonView Component
// ============================================================================

export function LessonView({ lesson, onBack, className = "" }: LessonViewProps) {
    const [activeSection, setActiveSection] = useState(0);
    const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());

    const metadata = lesson.content.metadata;
    const sections = lesson.sections;
    const currentSection = sections[activeSection];

    // Parse content blocks
    const introBlocks = useMemo(
        () => (lesson.content.introduction ? parseMarkdownToBlocks(lesson.content.introduction) : []),
        [lesson.content.introduction]
    );

    const sectionBlocks = useMemo(
        () => (currentSection ? parseMarkdownToBlocks(currentSection.content_markdown) : []),
        [currentSection]
    );

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" && activeSection > 0) {
                e.preventDefault();
                setActiveSection(activeSection - 1);
            } else if (e.key === "ArrowRight" && activeSection < sections.length - 1) {
                e.preventDefault();
                setActiveSection(activeSection + 1);
            }
        },
        [activeSection, sections.length]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const handleToggleComplete = (index: number) => {
        setCompletedSections((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const handlePrevSection = () => {
        if (activeSection > 0) {
            setActiveSection(activeSection - 1);
        }
    };

    const handleNextSection = () => {
        if (activeSection < sections.length - 1) {
            // Mark current as complete when moving forward
            setCompletedSections((prev) => new Set([...prev, activeSection]));
            setActiveSection(activeSection + 1);
        }
    };

    return (
        <div className={`min-h-full bg-[var(--forge-bg)] ${className}`}>
            {/* Main content - wider layout */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-[var(--forge-text-muted)] mb-6">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1 hover:text-[var(--forge-text-secondary)] transition-colors mr-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    )}
                    {lesson.breadcrumbs.domain && (
                        <>
                            <span>{lesson.breadcrumbs.domain}</span>
                            <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                    {lesson.breadcrumbs.topic && (
                        <>
                            <span>{lesson.breadcrumbs.topic}</span>
                            <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                    {lesson.breadcrumbs.skill && (
                        <>
                            <span>{lesson.breadcrumbs.skill}</span>
                            <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                    {lesson.breadcrumbs.area && (
                        <span className="text-[var(--forge-text-secondary)]">{lesson.breadcrumbs.area}</span>
                    )}
                </div>

                {/* Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--forge-text-primary)] mb-3">
                        {lesson.node.name}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-[var(--forge-text-muted)]">
                        {metadata.estimated_minutes && (
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {metadata.estimated_minutes} min read
                            </div>
                        )}
                        {metadata.difficulty && (
                            <div className="flex items-center gap-1 capitalize">
                                <GraduationCap className="w-4 h-4" />
                                {metadata.difficulty}
                            </div>
                        )}
                        {sections.length > 0 && (
                            <div className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {sections.length} sections
                            </div>
                        )}
                    </div>
                </div>

                {/* Video references - at top as learning aid */}
                {metadata.video_variants && metadata.video_variants.length > 0 && (
                    <div className="mb-8">
                        <VideoReferencesPanel
                            variants={metadata.video_variants}
                            lessonTitle={lesson.node.name}
                        />
                    </div>
                )}

                {/* Introduction */}
                {introBlocks.length > 0 && (
                    <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-[var(--forge-bg-elevated)] to-[var(--forge-bg-bench)] border border-[var(--forge-border-subtle)]">
                        <ContentBlockRenderer blocks={introBlocks} />
                    </div>
                )}

                {/* Key takeaways & References - split layout */}
                {metadata.key_takeaways && metadata.key_takeaways.length > 0 && (
                    <KeyTakeawaysWithRefs
                        takeaways={metadata.key_takeaways}
                        references={metadata.key_references}
                    />
                )}

                {/* Section tabs */}
                {sections.length > 0 && (
                    <SectionTabs
                        sections={sections}
                        activeIndex={activeSection}
                        onSelect={setActiveSection}
                        completedSections={completedSections}
                        onToggleComplete={handleToggleComplete}
                    />
                )}

                {/* Section content */}
                {currentSection && (
                    <AnimatePresence mode="wait">
                        <motion.article
                            key={currentSection.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-[var(--forge-bg-elevated)] rounded-2xl border border-[var(--forge-border-subtle)] overflow-hidden"
                        >
                            {/* Section header */}
                            <div className="flex items-center gap-4 p-6 border-b border-[var(--forge-border-subtle)] bg-gradient-to-r from-[var(--forge-bg-bench)] to-transparent">
                                <div className="w-12 h-12 rounded-xl bg-[var(--ember)]/10 flex items-center justify-center">
                                    <span className="text-[var(--ember)] font-bold text-lg">{activeSection + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold text-[var(--forge-text-primary)]">
                                        {currentSection.title}
                                    </h2>
                                    <div className="flex items-center gap-3 text-sm text-[var(--forge-text-muted)] mt-1">
                                        <span className="capitalize px-2 py-0.5 rounded-full bg-[var(--forge-bg)] text-xs">
                                            {currentSection.section_type}
                                        </span>
                                        {currentSection.duration_minutes && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {currentSection.duration_minutes} min
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleComplete(activeSection)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        completedSections.has(activeSection)
                                            ? "bg-green-500/10 text-green-500"
                                            : "bg-[var(--forge-bg)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                                    }`}
                                >
                                    {completedSections.has(activeSection) ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Completed
                                        </>
                                    ) : (
                                        <>
                                            <Circle className="w-4 h-4" />
                                            Mark Complete
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Section content */}
                            <div className="p-8">
                                <div className="prose-content max-w-none">
                                    <ContentBlockRenderer blocks={sectionBlocks} />
                                </div>

                                {/* Section code snippet */}
                                {currentSection.code_snippet && (
                                    <div className="mt-8">
                                        <CodeBlock
                                            data={{
                                                type: "code",
                                                language: currentSection.code_language || "javascript",
                                                code: currentSection.code_snippet,
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Section key points */}
                                {currentSection.key_points && currentSection.key_points.length > 0 && (
                                    <div className="mt-8">
                                        <KeypointsBlock
                                            data={{ type: "keypoints", points: currentSection.key_points }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Section navigation */}
                            <div className="flex items-center justify-between p-6 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-bench)]/50">
                                <button
                                    onClick={handlePrevSection}
                                    disabled={activeSection === 0}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[var(--forge-bg)] hover:bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous Section
                                </button>

                                <div className="flex items-center gap-2">
                                    {sections.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveSection(i)}
                                            className={`w-2 h-2 rounded-full transition-all ${
                                                i === activeSection
                                                    ? "w-6 bg-[var(--ember)]"
                                                    : completedSections.has(i)
                                                    ? "bg-green-500"
                                                    : "bg-[var(--forge-border-subtle)] hover:bg-[var(--forge-text-muted)]"
                                            }`}
                                            aria-label={`Go to section ${i + 1}`}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={handleNextSection}
                                    disabled={activeSection === sections.length - 1}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--ember)] text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--ember-glow)] shadow-lg shadow-[var(--ember)]/20"
                                >
                                    Next Section
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.article>
                    </AnimatePresence>
                )}

            </main>
        </div>
    );
}

// ============================================================================
// Loading and Error States
// ============================================================================

export function LessonViewLoading() {
    return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[var(--ember)] animate-spin" />
                <span className="text-sm text-[var(--forge-text-muted)]">Loading lesson...</span>
            </div>
        </div>
    );
}

export function LessonViewError({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="flex flex-col items-center gap-4 text-center max-w-md p-6">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h3 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                    Failed to load lesson
                </h3>
                <p className="text-sm text-[var(--forge-text-muted)]">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 rounded-lg bg-[var(--ember)] text-white text-sm font-medium hover:bg-[var(--ember-glow)] transition-colors"
                    >
                        Try again
                    </button>
                )}
            </div>
        </div>
    );
}
