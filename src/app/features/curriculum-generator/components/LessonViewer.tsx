"use client";

/**
 * Lesson Viewer Component
 *
 * Displays generated lesson content with sections, code snippets, and concepts.
 */

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
    BookOpen,
    Code,
    Lightbulb,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Check,
    Clock,
    Target,
    ArrowRight,
    ArrowLeft,
} from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { LessonOutline, LessonSection, Concept, CodeSnippet } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface LessonViewerProps {
    lesson: LessonOutline;
    onComplete?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    hasNext?: boolean;
    hasPrevious?: boolean;
    isCompleted?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LessonViewer = ({
    lesson,
    onComplete,
    onNext,
    onPrevious,
    hasNext = false,
    hasPrevious = false,
    isCompleted = false,
}: LessonViewerProps) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(lesson.sections.slice(0, 2).map((s) => s.id))
    );
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
    const prefersReducedMotion = useReducedMotion();

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    const markSectionRead = (sectionId: string) => {
        setCompletedSections((prev) => new Set([...prev, sectionId]));

        // Auto-expand next section
        const currentIndex = lesson.sections.findIndex((s) => s.id === sectionId);
        if (currentIndex !== -1 && currentIndex < lesson.sections.length - 1) {
            const nextSection = lesson.sections[currentIndex + 1];
            setExpandedSections((prev) => new Set([...prev, nextSection.id]));
        }
    };

    const allSectionsComplete = lesson.sections.every((s) =>
        completedSections.has(s.id)
    );

    return (
        <div className="space-y-6">
            {/* Lesson Header */}
            <PrismaticCard className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={ICON_SIZES.md} className="text-indigo-500" />
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                Lesson
                            </span>
                            {isCompleted && (
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                                    Completed
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">
                            {lesson.title}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300">{lesson.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Clock size={ICON_SIZES.sm} />
                        <span className="text-sm font-medium">{lesson.estimatedMinutes} min</span>
                    </div>
                </div>

                {/* Learning Objectives */}
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center gap-2 mb-3">
                        <Target size={ICON_SIZES.sm} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                            Learning Objectives
                        </span>
                    </div>
                    <ul className="space-y-2">
                        {lesson.learningObjectives.map((objective, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                            >
                                <Check
                                    size={ICON_SIZES.sm}
                                    className="text-indigo-500 mt-0.5 flex-shrink-0"
                                />
                                {objective}
                            </li>
                        ))}
                    </ul>
                </div>
            </PrismaticCard>

            {/* Lesson Sections */}
            <div className="space-y-4">
                {lesson.sections.map((section, index) => (
                    <LessonSectionCard
                        key={section.id}
                        section={section}
                        sectionNumber={index + 1}
                        isExpanded={expandedSections.has(section.id)}
                        isCompleted={completedSections.has(section.id)}
                        onToggle={() => toggleSection(section.id)}
                        onComplete={() => markSectionRead(section.id)}
                        prefersReducedMotion={prefersReducedMotion}
                    />
                ))}
            </div>

            {/* Key Concepts */}
            <PrismaticCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb size={ICON_SIZES.md} className="text-amber-500" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Key Concepts
                    </h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    {lesson.keyConcepts.map((concept) => (
                        <ConceptCard key={concept.name} concept={concept} />
                    ))}
                </div>
            </PrismaticCard>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                    data-testid="lesson-previous-btn"
                    className={cn(
                        "px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors",
                        hasPrevious
                            ? "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    )}
                >
                    <ArrowLeft size={ICON_SIZES.sm} />
                    Previous
                </button>

                <div className="flex items-center gap-3">
                    {!isCompleted && allSectionsComplete && (
                        <button
                            onClick={onComplete}
                            data-testid="lesson-complete-btn"
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                        >
                            <Check size={ICON_SIZES.sm} />
                            Mark Complete
                        </button>
                    )}

                    {hasNext && (
                        <button
                            onClick={onNext}
                            data-testid="lesson-next-btn"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            Next Lesson
                            <ArrowRight size={ICON_SIZES.sm} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// SECTION CARD
// ============================================================================

interface LessonSectionCardProps {
    section: LessonSection;
    sectionNumber: number;
    isExpanded: boolean;
    isCompleted: boolean;
    onToggle: () => void;
    onComplete: () => void;
    prefersReducedMotion?: boolean | null;
}

const LessonSectionCard = ({
    section,
    sectionNumber,
    isExpanded,
    isCompleted,
    onToggle,
    onComplete,
    prefersReducedMotion,
}: LessonSectionCardProps) => {
    const sectionTypeConfig = {
        theory: { icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
        example: { icon: Code, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
        practice: { icon: Target, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
        summary: { icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    };

    const config = sectionTypeConfig[section.type];
    const IconComponent = config.icon;

    return (
        <PrismaticCard className="overflow-hidden">
            {/* Section Header */}
            <button
                onClick={onToggle}
                data-testid={`section-toggle-${section.id}`}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bg)}>
                        <IconComponent size={ICON_SIZES.sm} className={config.color} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                {sectionNumber}.
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                {section.title}
                            </span>
                            {isCompleted && (
                                <Check size={ICON_SIZES.sm} className="text-emerald-500" />
                            )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                            {section.type}
                        </span>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronDown size={ICON_SIZES.md} className="text-slate-400" />
                ) : (
                    <ChevronRight size={ICON_SIZES.md} className="text-slate-400" />
                )}
            </button>

            {/* Section Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                    >
                        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                            {/* Main Content */}
                            <div
                                className="prose prose-slate dark:prose-invert max-w-none mb-4"
                                dangerouslySetInnerHTML={{
                                    __html: section.content.replace(/\n/g, "<br>"),
                                }}
                            />

                            {/* Code Snippets */}
                            {section.codeSnippets?.map((snippet) => (
                                <CodeSnippetBlock key={snippet.id} snippet={snippet} />
                            ))}

                            {/* Tips */}
                            {section.tips && section.tips.length > 0 && (
                                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lightbulb size={ICON_SIZES.sm} className="text-emerald-600 dark:text-emerald-400" />
                                        <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                                            Pro Tips
                                        </span>
                                    </div>
                                    <ul className="space-y-1">
                                        {section.tips.map((tip, i) => (
                                            <li
                                                key={i}
                                                className="text-sm text-emerald-700 dark:text-emerald-300"
                                            >
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Common Mistakes */}
                            {section.commonMistakes && section.commonMistakes.length > 0 && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle size={ICON_SIZES.sm} className="text-red-600 dark:text-red-400" />
                                        <span className="font-bold text-sm text-red-700 dark:text-red-400">
                                            Common Mistakes
                                        </span>
                                    </div>
                                    <ul className="space-y-1">
                                        {section.commonMistakes.map((mistake, i) => (
                                            <li
                                                key={i}
                                                className="text-sm text-red-700 dark:text-red-300"
                                            >
                                                {mistake}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Mark as Read */}
                            {!isCompleted && (
                                <button
                                    onClick={onComplete}
                                    data-testid={`section-complete-${section.id}`}
                                    className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                                >
                                    <Check size={ICON_SIZES.sm} />
                                    Mark as Read
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </PrismaticCard>
    );
};

// ============================================================================
// CODE SNIPPET
// ============================================================================

interface CodeSnippetBlockProps {
    snippet: CodeSnippet;
}

const CodeSnippetBlock = ({ snippet }: CodeSnippetBlockProps) => {
    const [showExplanations, setShowExplanations] = useState(false);

    return (
        <div className="my-4">
            {snippet.caption && (
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {snippet.caption}
                </div>
            )}
            <div className="relative">
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded font-mono">
                    {snippet.language}
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm font-mono">
                        {snippet.code.split("\n").map((line, lineNum) => (
                            <div
                                key={lineNum}
                                className={cn(
                                    "flex",
                                    snippet.highlightedLines?.includes(lineNum + 1) &&
                                        "bg-indigo-900/30 -mx-4 px-4"
                                )}
                            >
                                <span className="w-8 text-slate-500 select-none">
                                    {lineNum + 1}
                                </span>
                                <span>{line}</span>
                            </div>
                        ))}
                    </code>
                </pre>
            </div>

            {/* Explanations Toggle */}
            {snippet.explanations && Object.keys(snippet.explanations).length > 0 && (
                <div className="mt-2">
                    <button
                        onClick={() => setShowExplanations(!showExplanations)}
                        data-testid={`snippet-explain-${snippet.id}`}
                        className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                    >
                        {showExplanations ? "Hide" : "Show"} line explanations
                    </button>

                    {showExplanations && (
                        <div className="mt-2 space-y-2">
                            {Object.entries(snippet.explanations).map(([line, explanation]) => (
                                <div
                                    key={line}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded font-mono text-xs">
                                        L{line}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {explanation}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================================================================
// CONCEPT CARD
// ============================================================================

interface ConceptCardProps {
    concept: Concept;
}

const ConceptCard = ({ concept }: ConceptCardProps) => {
    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                {concept.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {concept.definition}
            </p>
            {concept.analogy && (
                <div className="text-sm text-indigo-600 dark:text-indigo-400 italic">
                    Think of it as: {concept.analogy}
                </div>
            )}
            {concept.relatedConcepts && concept.relatedConcepts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {concept.relatedConcepts.map((related) => (
                        <span
                            key={related}
                            className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded"
                        >
                            {related}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LessonViewer;
