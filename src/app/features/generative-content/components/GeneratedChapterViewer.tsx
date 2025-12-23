"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    Pause,
    ChevronLeft,
    ChevronRight,
    Code,
    FileText,
    HelpCircle,
    Lightbulb,
    Star,
    GitFork,
    MessageSquare,
    History,
    CheckCircle2,
    Clock,
    Zap,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { PrismaticCard } from "@/app/shared/components";
import type { GeneratedChapter, GeneratedChapterSection, ProgressiveCodeExample } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface GeneratedChapterViewerProps {
    chapter: GeneratedChapter;
    className?: string;
    onRate?: () => void;
    onFork?: () => void;
    onAnnotate?: () => void;
    onViewHistory?: () => void;
}

interface SectionViewerProps {
    section: GeneratedChapterSection;
    isActive: boolean;
    onComplete: () => void;
}

// ============================================================================
// CHAPTER VIEWER COMPONENT
// ============================================================================

export function GeneratedChapterViewer({
    chapter,
    className,
    onRate,
    onFork,
    onAnnotate,
    onViewHistory,
}: GeneratedChapterViewerProps) {
    const [activeSection, setActiveSection] = useState(0);
    const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());

    const currentSection = chapter.sections[activeSection];
    const progress = (completedSections.size / chapter.sections.length) * 100;

    /**
     * Mark section as complete
     */
    const handleCompleteSection = useCallback(() => {
        setCompletedSections((prev) => new Set(prev).add(activeSection));
    }, [activeSection]);

    /**
     * Navigate to next section
     */
    const handleNext = useCallback(() => {
        if (activeSection < chapter.sections.length - 1) {
            setActiveSection((prev) => prev + 1);
        }
    }, [activeSection, chapter.sections.length]);

    /**
     * Navigate to previous section
     */
    const handlePrevious = useCallback(() => {
        if (activeSection > 0) {
            setActiveSection((prev) => prev - 1);
        }
    }, [activeSection]);

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        {chapter.courseInfo.chapterTitle}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        {chapter.courseInfo.courseName}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {chapter.totalDuration}
                        </span>
                        <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {chapter.sections.length} sections
                        </span>
                        {chapter.qualityMetrics.averageRating > 0 && (
                            <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400" />
                                {chapter.qualityMetrics.averageRating.toFixed(1)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRate}
                        className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title="Rate this chapter"
                        data-testid="rate-chapter-btn"
                    >
                        <Star className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onFork}
                        className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title="Fork this chapter"
                        data-testid="fork-chapter-btn"
                    >
                        <GitFork className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onAnnotate}
                        className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title="Add annotation"
                        data-testid="annotate-chapter-btn"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onViewHistory}
                        className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title="View version history"
                        data-testid="history-chapter-btn"
                    >
                        <History className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Chapter Progress</span>
                    <span className="text-[var(--text-primary)] font-medium">
                        {Math.round(progress)}%
                    </span>
                </div>
                <div className="h-2 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Section Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {chapter.sections.map((section, index) => (
                    <button
                        key={section.sectionId}
                        onClick={() => setActiveSection(index)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm",
                            activeSection === index
                                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        )}
                        data-testid={`section-nav-${section.sectionId}`}
                    >
                        {completedSections.has(index) ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                            <span className="w-5 h-5 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-xs">
                                {index + 1}
                            </span>
                        )}
                        {section.title}
                    </button>
                ))}
            </div>

            {/* Section Content */}
            <AnimatePresence mode="wait">
                {currentSection && (
                    <SectionViewer
                        key={currentSection.sectionId}
                        section={currentSection}
                        isActive={true}
                        onComplete={handleCompleteSection}
                    />
                )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
                <button
                    onClick={handlePrevious}
                    disabled={activeSection === 0}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl transition-colors",
                        activeSection === 0
                            ? "text-[var(--text-muted)] cursor-not-allowed"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                    )}
                    data-testid="previous-section-btn"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                </button>

                <button
                    onClick={() => {
                        handleCompleteSection();
                        handleNext();
                    }}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all",
                        activeSection === chapter.sections.length - 1
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                    )}
                    data-testid="next-section-btn"
                >
                    {activeSection === chapter.sections.length - 1 ? (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            Complete Chapter
                        </>
                    ) : (
                        <>
                            Next Section
                            <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// SECTION VIEWER COMPONENT
// ============================================================================

function SectionViewer({ section, onComplete }: SectionViewerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [expandedCodeStep, setExpandedCodeStep] = useState<number | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <PrismaticCard glowColor="cyan" className="p-6" data-testid="section-viewer-card">
                {/* Section Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span
                                className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                    section.type === "video" && "bg-red-500/20 text-red-400",
                                    section.type === "lesson" && "bg-blue-500/20 text-blue-400",
                                    section.type === "interactive" && "bg-green-500/20 text-green-400",
                                    section.type === "exercise" && "bg-purple-500/20 text-purple-400"
                                )}
                            >
                                {section.type}
                            </span>
                            <span className="text-sm text-[var(--text-muted)]">{section.duration}</span>
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                            {section.title}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                            +{section.quizQuestions.reduce((sum, q) => sum + q.xpReward, 0)} XP
                        </span>
                    </div>
                </div>

                {/* Video Script Preview (for video sections) */}
                {section.videoScript && (
                    <div className="mb-6">
                        <div className="relative aspect-video bg-[var(--surface-sunken)] rounded-xl overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="p-4 rounded-full bg-indigo-500/90 text-white hover:bg-indigo-500 transition-colors"
                                    data-testid="video-play-btn"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-8 h-8" />
                                    ) : (
                                        <Play className="w-8 h-8" />
                                    )}
                                </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-sm text-white/90 line-clamp-2">
                                    {section.videoScript.segments[0]?.narration}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Overview
                    </h3>
                    <p className="text-[var(--text-primary)] leading-relaxed">
                        {section.content.description}
                    </p>
                </div>

                {/* Code Examples */}
                {section.codeExamples.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Code Examples
                        </h3>
                        <div className="space-y-4">
                            {section.codeExamples.map((example) => (
                                <CodeExampleViewer
                                    key={example.id}
                                    example={example}
                                    expandedStep={expandedCodeStep}
                                    onExpandStep={setExpandedCodeStep}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Key Points */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        {section.keyPoints.title}
                    </h3>
                    <ul className="space-y-2">
                        {section.keyPoints.points.map((point, index) => (
                            <li
                                key={index}
                                className={cn(
                                    "flex items-start gap-2 text-[var(--text-primary)]",
                                    point.importance === "essential" && "font-medium",
                                    point.importance === "supplementary" && "text-[var(--text-secondary)]"
                                )}
                            >
                                <CheckCircle2
                                    className={cn(
                                        "w-4 h-4 mt-1 shrink-0",
                                        point.importance === "essential" && "text-green-400",
                                        point.importance === "recommended" && "text-blue-400",
                                        point.importance === "supplementary" && "text-[var(--text-muted)]"
                                    )}
                                />
                                {point.text}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Quiz Section */}
                {section.quizQuestions.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowQuiz(!showQuiz)}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--surface-sunken)] hover:bg-[var(--surface-hover)] transition-colors"
                            data-testid="toggle-quiz-btn"
                        >
                            <span className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                                <HelpCircle className="w-5 h-5 text-purple-400" />
                                Practice Quiz ({section.quizQuestions.length} questions)
                            </span>
                            <ChevronDown
                                className={cn(
                                    "w-5 h-5 text-[var(--text-muted)] transition-transform",
                                    showQuiz && "rotate-180"
                                )}
                            />
                        </button>

                        <AnimatePresence>
                            {showQuiz && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 space-y-4"
                                >
                                    {section.quizQuestions.slice(0, 2).map((question) => (
                                        <QuizQuestionCard
                                            key={question.id}
                                            question={question}
                                            selectedAnswer={selectedAnswer}
                                            onSelectAnswer={setSelectedAnswer}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </PrismaticCard>
        </motion.div>
    );
}

// ============================================================================
// CODE EXAMPLE VIEWER
// ============================================================================

interface CodeExampleViewerProps {
    example: ProgressiveCodeExample;
    expandedStep: number | null;
    onExpandStep: (step: number | null) => void;
}

function CodeExampleViewer({ example, expandedStep, onExpandStep }: CodeExampleViewerProps) {
    const [currentStep, setCurrentStep] = useState(example.steps.length - 1);
    const step = example.steps[currentStep];

    return (
        <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-sunken)]">
                <span className="text-sm font-mono text-[var(--text-secondary)]">
                    {example.filename}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                    Step {currentStep + 1} of {example.steps.length}
                </span>
            </div>

            {/* Step Explanation */}
            <div className="px-4 py-3 bg-indigo-500/10 border-b border-[var(--border-default)]">
                <p className="text-sm text-indigo-300">{step?.explanation}</p>
            </div>

            {/* Code */}
            <div className="relative">
                <pre className="p-4 overflow-x-auto text-sm font-mono bg-[#1e1e1e]">
                    <code className="text-gray-300">{step?.code || example.finalCode}</code>
                </pre>
            </div>

            {/* Step Navigation */}
            {example.steps.length > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--surface-sunken)] border-t border-[var(--border-default)]">
                    {example.steps.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentStep(index)}
                            className={cn(
                                "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                                currentStep === index
                                    ? "bg-indigo-500 text-white"
                                    : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                            )}
                            data-testid={`code-step-${index}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// QUIZ QUESTION CARD
// ============================================================================

interface QuizQuestionCardProps {
    question: GeneratedChapterSection["quizQuestions"][0];
    selectedAnswer: string | null;
    onSelectAnswer: (answer: string) => void;
}

function QuizQuestionCard({
    question,
    selectedAnswer,
    onSelectAnswer,
}: QuizQuestionCardProps) {
    const [showResult, setShowResult] = useState(false);

    const handleSelect = (optionId: string) => {
        onSelectAnswer(optionId);
        setShowResult(true);
    };

    const isCorrect =
        question.options?.find((o) => o.id === selectedAnswer)?.isCorrect || false;

    return (
        <div
            className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-default)]"
            data-testid={`quiz-question-${question.id}`}
        >
            <div className="flex items-start justify-between mb-3">
                <p className="text-[var(--text-primary)] font-medium">{question.question}</p>
                <span
                    className={cn(
                        "px-2 py-0.5 rounded text-xs",
                        question.difficulty === "easy" && "bg-green-500/20 text-green-400",
                        question.difficulty === "medium" && "bg-yellow-500/20 text-yellow-400",
                        question.difficulty === "hard" && "bg-red-500/20 text-red-400"
                    )}
                >
                    {question.difficulty}
                </span>
            </div>

            {question.options && (
                <div className="space-y-2">
                    {question.options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => handleSelect(option.id)}
                            disabled={showResult}
                            className={cn(
                                "w-full p-3 rounded-lg text-left text-sm transition-all",
                                !showResult &&
                                    "bg-[var(--surface-sunken)] hover:bg-[var(--surface-hover)]",
                                showResult &&
                                    option.isCorrect &&
                                    "bg-green-500/20 border border-green-500/50",
                                showResult &&
                                    !option.isCorrect &&
                                    selectedAnswer === option.id &&
                                    "bg-red-500/20 border border-red-500/50",
                                showResult &&
                                    !option.isCorrect &&
                                    selectedAnswer !== option.id &&
                                    "opacity-50"
                            )}
                            data-testid={`quiz-option-${option.id}`}
                        >
                            <span className="font-medium mr-2">{option.id.toUpperCase()}.</span>
                            {option.text}
                        </button>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showResult && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className={cn(
                            "mt-4 p-3 rounded-lg text-sm",
                            isCorrect ? "bg-green-500/20" : "bg-red-500/20"
                        )}
                    >
                        <p className={cn("font-medium mb-1", isCorrect ? "text-green-400" : "text-red-400")}>
                            {isCorrect ? "Correct!" : "Incorrect"}
                            {isCorrect && ` +${question.xpReward} XP`}
                        </p>
                        <p className="text-[var(--text-secondary)]">{question.explanation}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default GeneratedChapterViewer;
