"use client";

/**
 * Custom Block Renderer Components
 *
 * Renders custom markdown blocks as rich interactive components.
 *
 * Basic Blocks: video, code, callout, keypoints, exercise, quiz
 * Extended Blocks: tabs, comparison, scenario, steps, pitfall, deepdive, realworld, syntax, checkpoint, protip
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    Copy,
    Check,
    Info,
    AlertTriangle,
    Lightbulb,
    BookOpen,
    Code2,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    XCircle,
    Sparkles,
    Target,
    Compass,
    Layers,
    AlertOctagon,
    Microscope,
    Building2,
    FileCode,
    HelpCircle,
    Star,
    ArrowRight,
    Eye,
    EyeOff,
    Zap,
    X,
} from "lucide-react";
import type {
    BlockData,
    VideoBlockData,
    CodeBlockData,
    CalloutBlockData,
    KeypointsBlockData,
    ExerciseBlockData,
    QuizBlockData,
    TabsBlockData,
    ComparisonBlockData,
    ScenarioBlockData,
    StepsBlockData,
    PitfallBlockData,
    DeepDiveBlockData,
    RealWorldBlockData,
    SyntaxBlockData,
    CheckpointBlockData,
    ProTipBlockData,
} from "../lib/markdownParser";

// ============================================================================
// Video Block
// ============================================================================

interface VideoBlockProps {
    data: VideoBlockData;
}

export function VideoBlock({ data }: VideoBlockProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    if (!data.youtubeId) {
        return (
            <div className="my-6 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] p-6">
                <div className="flex items-center gap-3 text-[var(--forge-text-muted)]">
                    <Play className="w-5 h-5" />
                    <span>{data.title || "Video content"}</span>
                </div>
                {data.description && (
                    <p className="mt-2 text-sm text-[var(--forge-text-secondary)]">{data.description}</p>
                )}
            </div>
        );
    }

    return (
        <div className="my-6">
            {data.title && (
                <h4 className="mb-3 text-sm font-medium text-[var(--forge-text-secondary)] flex items-center gap-2">
                    <Play className="w-4 h-4 text-[var(--ember)]" />
                    {data.title}
                </h4>
            )}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-[var(--forge-border-subtle)] bg-black">
                {!isPlaying ? (
                    <button
                        onClick={() => setIsPlaying(true)}
                        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/60 to-black/40 hover:from-black/50 hover:to-black/30 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-[var(--ember)] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-7 h-7 text-white ml-1" fill="white" />
                        </div>
                        <img
                            src={`https://img.youtube.com/vi/${data.youtubeId}/maxresdefault.jpg`}
                            alt={data.title || "Video thumbnail"}
                            className="absolute inset-0 w-full h-full object-cover -z-10"
                        />
                    </button>
                ) : (
                    <iframe
                        src={`https://www.youtube.com/embed/${data.youtubeId}?autoplay=1&rel=0`}
                        title={data.title || "Video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                )}
            </div>
            {data.description && (
                <p className="mt-3 text-sm text-[var(--forge-text-secondary)]">{data.description}</p>
            )}
        </div>
    );
}

// ============================================================================
// Code Block
// ============================================================================

interface CodeBlockProps {
    data: CodeBlockData;
}

export function CodeBlock({ data }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(data.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getLanguageColor = (lang: string) => {
        const colors: Record<string, string> = {
            javascript: "#f7df1e",
            typescript: "#3178c6",
            jsx: "#61dafb",
            tsx: "#61dafb",
            python: "#3776ab",
            rust: "#dea584",
            go: "#00add8",
            css: "#264de4",
            html: "#e34c26",
        };
        return colors[lang.toLowerCase()] || "#6b7280";
    };

    return (
        <div className="my-6 rounded-xl overflow-hidden border border-[var(--forge-border-subtle)] bg-[#0d1117]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    {(data.title || data.filename) && (
                        <span className="text-sm text-[var(--forge-text-secondary)]">{data.filename || data.title}</span>
                    )}
                    <span
                        className="text-xs px-2 py-0.5 rounded-full font-mono"
                        style={{ backgroundColor: `${getLanguageColor(data.language)}20`, color: getLanguageColor(data.language) }}
                    >
                        {data.language}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="text-sm leading-relaxed">
                    <code className="font-mono text-[#e6edf3]">
                        {data.code.split("\n").map((line, i) => (
                            <div
                                key={i}
                                className={`${
                                    data.highlightLines?.includes(i + 1)
                                        ? "bg-[var(--ember)]/10 -mx-4 px-4 border-l-2 border-[var(--ember)]"
                                        : ""
                                }`}
                            >
                                <span className="inline-block w-8 text-[#6e7681] select-none text-right mr-4">
                                    {i + 1}
                                </span>
                                {highlightSyntax(line, data.language)}
                            </div>
                        ))}
                    </code>
                </pre>
            </div>
        </div>
    );
}

function highlightSyntax(line: string, language: string): React.ReactNode {
    const keywords = /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof)\b/g;
    const strings = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g;
    const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
    const numbers = /\b(\d+\.?\d*)\b/g;

    let highlighted = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    highlighted = highlighted
        .replace(comments, '<span style="color: #6e7681">$1</span>')
        .replace(strings, '<span style="color: #a5d6ff">$&</span>')
        .replace(keywords, '<span style="color: #ff7b72">$1</span>')
        .replace(numbers, '<span style="color: #79c0ff">$1</span>');

    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
}

// ============================================================================
// Callout Block
// ============================================================================

interface CalloutBlockProps {
    data: CalloutBlockData;
}

const calloutConfig = {
    info: {
        icon: Info,
        bgClass: "bg-blue-500/10 border-blue-500/30",
        iconClass: "text-blue-500",
        titleClass: "text-blue-400",
    },
    warning: {
        icon: AlertTriangle,
        bgClass: "bg-amber-500/10 border-amber-500/30",
        iconClass: "text-amber-500",
        titleClass: "text-amber-400",
    },
    tip: {
        icon: Lightbulb,
        bgClass: "bg-green-500/10 border-green-500/30",
        iconClass: "text-green-500",
        titleClass: "text-green-400",
    },
    definition: {
        icon: BookOpen,
        bgClass: "bg-purple-500/10 border-purple-500/30",
        iconClass: "text-purple-500",
        titleClass: "text-purple-400",
    },
    example: {
        icon: Code2,
        bgClass: "bg-cyan-500/10 border-cyan-500/30",
        iconClass: "text-cyan-500",
        titleClass: "text-cyan-400",
    },
};

export function CalloutBlock({ data }: CalloutBlockProps) {
    const config = calloutConfig[data.variant] || calloutConfig.info;
    const Icon = config.icon;

    return (
        <div className={`my-6 rounded-xl border p-4 ${config.bgClass}`}>
            <div className="flex gap-3">
                <div className={`flex-shrink-0 mt-0.5 ${config.iconClass}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    {data.title && (
                        <h4 className={`font-semibold mb-1 ${config.titleClass}`}>{data.title}</h4>
                    )}
                    <div className="text-sm text-[var(--forge-text-secondary)] prose-sm prose-invert">
                        {data.content}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Keypoints Block
// ============================================================================

interface KeypointsBlockProps {
    data: KeypointsBlockData;
}

export function KeypointsBlock({ data }: KeypointsBlockProps) {
    return (
        <div className="my-6 rounded-xl border border-[var(--ember)]/30 bg-gradient-to-br from-[var(--ember)]/5 to-transparent p-5">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[var(--ember)]" />
                <h4 className="font-semibold text-[var(--forge-text-primary)]">
                    {data.title || "Key Takeaways"}
                </h4>
            </div>
            <ul className="space-y-2">
                {data.points.map((point, i) => (
                    <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-3"
                    >
                        <CheckCircle2 className="w-5 h-5 text-[var(--ember)] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[var(--forge-text-secondary)]">{point}</span>
                    </motion.li>
                ))}
            </ul>
        </div>
    );
}

// ============================================================================
// Exercise Block
// ============================================================================

interface ExerciseBlockProps {
    data: ExerciseBlockData;
}

export function ExerciseBlock({ data }: ExerciseBlockProps) {
    const [showHints, setShowHints] = useState(false);

    return (
        <div className="my-6 rounded-xl border-2 border-dashed border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] p-5">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--ember)]/20 flex items-center justify-center">
                    <Code2 className="w-4 h-4 text-[var(--ember)]" />
                </div>
                <div>
                    <span className="text-xs font-medium text-[var(--ember)] uppercase tracking-wider">Exercise</span>
                    {data.title && (
                        <h4 className="font-semibold text-[var(--forge-text-primary)]">{data.title}</h4>
                    )}
                </div>
            </div>
            <p className="text-sm text-[var(--forge-text-secondary)] mb-4">{data.description}</p>

            {data.hints && data.hints.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowHints(!showHints)}
                        className="flex items-center gap-2 text-sm text-[var(--ember)] hover:text-[var(--ember-glow)] transition-colors"
                    >
                        <ChevronRight className={`w-4 h-4 transition-transform ${showHints ? "rotate-90" : ""}`} />
                        {showHints ? "Hide hints" : "Show hints"}
                    </button>
                    <AnimatePresence>
                        {showHints && (
                            <motion.ul
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 space-y-2 overflow-hidden"
                            >
                                {data.hints.map((hint, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--forge-text-muted)]">
                                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                        {hint}
                                    </li>
                                ))}
                            </motion.ul>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Quiz Block
// ============================================================================

interface QuizBlockProps {
    data: QuizBlockData;
}

export function QuizBlock({ data }: QuizBlockProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
        setShowResult(true);
    };

    const isCorrect = selectedIndex !== null && data.options[selectedIndex]?.correct;

    return (
        <div className="my-6 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] p-5">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400 font-bold text-sm">?</span>
                </div>
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">Quiz</span>
            </div>

            <h4 className="font-semibold text-[var(--forge-text-primary)] mb-4">{data.question}</h4>

            <div className="space-y-2">
                {data.options.map((option, i) => {
                    const isSelected = selectedIndex === i;
                    const showCorrect = showResult && option.correct;
                    const showWrong = showResult && isSelected && !option.correct;

                    return (
                        <button
                            key={i}
                            onClick={() => !showResult && handleSelect(i)}
                            disabled={showResult}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                                showCorrect
                                    ? "border-green-500 bg-green-500/10"
                                    : showWrong
                                    ? "border-red-500 bg-red-500/10"
                                    : isSelected
                                    ? "border-[var(--ember)] bg-[var(--ember)]/10"
                                    : "border-[var(--forge-border-subtle)] hover:border-[var(--forge-border)] hover:bg-[var(--forge-bg-bench)]"
                            }`}
                        >
                            <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    showCorrect
                                        ? "border-green-500 bg-green-500"
                                        : showWrong
                                        ? "border-red-500 bg-red-500"
                                        : isSelected
                                        ? "border-[var(--ember)] bg-[var(--ember)]"
                                        : "border-[var(--forge-border)]"
                                }`}
                            >
                                {(showCorrect || (isSelected && !showResult)) && (
                                    <Check className="w-3 h-3 text-white" />
                                )}
                            </div>
                            <span className="text-sm text-[var(--forge-text-secondary)]">{option.text}</span>
                        </button>
                    );
                })}
            </div>

            {showResult && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-3 rounded-lg ${
                        isCorrect ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}
                >
                    {isCorrect ? "Correct! Great job." : "Not quite. Try reviewing the material above."}
                </motion.div>
            )}
        </div>
    );
}

// ============================================================================
// EXTENDED BLOCKS
// ============================================================================

// ============================================================================
// Tabs Block - Show content in different contexts
// ============================================================================

interface TabsBlockProps {
    data: TabsBlockData;
}

export function TabsBlock({ data }: TabsBlockProps) {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="my-6 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] overflow-hidden">
            {/* Tab headers */}
            <div className="flex border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-bench)] overflow-x-auto">
                {data.tabs.map((tab, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveTab(i)}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${
                            i === activeTab
                                ? "text-[var(--ember)]"
                                : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        }`}
                    >
                        {tab.label}
                        {tab.language && (
                            <span className="ml-2 text-xs opacity-60">[{tab.language}]</span>
                        )}
                        {i === activeTab && (
                            <motion.div
                                layoutId="tab-indicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ember)]"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="p-5"
                >
                    <div className="text-sm text-[var(--forge-text-secondary)] whitespace-pre-wrap font-mono">
                        {data.tabs[activeTab]?.content}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Comparison Block - Side-by-side comparison
// ============================================================================

interface ComparisonBlockProps {
    data: ComparisonBlockData;
}

export function ComparisonBlock({ data }: ComparisonBlockProps) {
    return (
        <div className="my-6 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] overflow-hidden">
            {data.title && (
                <div className="px-5 py-3 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-bench)]">
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-[var(--ember)]" />
                        <h4 className="font-semibold text-[var(--forge-text-primary)]">{data.title}</h4>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--forge-border-subtle)]">
                {/* Left side */}
                <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                            <X className="w-3 h-3 text-red-400" />
                        </div>
                        <span className="text-sm font-medium text-red-400">{data.leftLabel}</span>
                    </div>
                    <div className="text-sm text-[var(--forge-text-secondary)] whitespace-pre-wrap font-mono bg-[#0d1117] rounded-lg p-4">
                        {data.leftContent}
                    </div>
                </div>

                {/* Right side */}
                <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="text-sm font-medium text-green-400">{data.rightLabel}</span>
                    </div>
                    <div className="text-sm text-[var(--forge-text-secondary)] whitespace-pre-wrap font-mono bg-[#0d1117] rounded-lg p-4">
                        {data.rightContent}
                    </div>
                </div>
            </div>

            {data.verdict && (
                <div className="px-5 py-3 border-t border-[var(--forge-border-subtle)] bg-[var(--ember)]/5">
                    <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-[var(--ember)] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[var(--forge-text-secondary)]">{data.verdict}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Scenario Block - When to use guidance
// ============================================================================

interface ScenarioBlockProps {
    data: ScenarioBlockData;
}

export function ScenarioBlock({ data }: ScenarioBlockProps) {
    return (
        <div className="my-6 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--forge-border-subtle)] bg-gradient-to-r from-[var(--ember)]/10 to-transparent">
                <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[var(--ember)]" />
                    <h4 className="font-semibold text-[var(--forge-text-primary)]">{data.title}</h4>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {data.description && (
                    <p className="text-sm text-[var(--forge-text-secondary)]">{data.description}</p>
                )}

                {/* Use When */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-400">Use When</span>
                    </div>
                    <ul className="space-y-1.5 ml-6">
                        {data.useWhen.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]">
                                <ArrowRight className="w-3 h-3 text-green-500 flex-shrink-0 mt-1" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Avoid When */}
                {data.avoidWhen && data.avoidWhen.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium text-red-400">Avoid When</span>
                        </div>
                        <ul className="space-y-1.5 ml-6">
                            {data.avoidWhen.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]">
                                    <ArrowRight className="w-3 h-3 text-red-500 flex-shrink-0 mt-1" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Example */}
                {data.example && (
                    <div className="mt-4 p-4 rounded-lg bg-[#0d1117] border border-[var(--forge-border-subtle)]">
                        <div className="text-xs text-[var(--forge-text-muted)] mb-2">Example</div>
                        <pre className="text-sm text-[#e6edf3] font-mono whitespace-pre-wrap">{data.example}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Steps Block - Step-by-step guide
// ============================================================================

interface StepsBlockProps {
    data: StepsBlockData;
}

export function StepsBlock({ data }: StepsBlockProps) {
    const [activeStep, setActiveStep] = useState(0);

    return (
        <div className="my-6 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] overflow-hidden">
            {data.title && (
                <div className="px-5 py-3 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-bench)]">
                    <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-[var(--ember)]" />
                        <h4 className="font-semibold text-[var(--forge-text-primary)]">{data.title}</h4>
                    </div>
                </div>
            )}

            <div className="p-5">
                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    {data.steps.map((step, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveStep(i)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                i === activeStep
                                    ? "bg-[var(--ember)] text-white"
                                    : i < activeStep
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-[var(--forge-bg-bench)] text-[var(--forge-text-muted)]"
                            }`}
                        >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                i === activeStep
                                    ? "bg-white/20"
                                    : i < activeStep
                                    ? "bg-green-500/30"
                                    : "bg-[var(--forge-bg)]"
                            }`}>
                                {i < activeStep ? <Check className="w-3 h-3" /> : i + 1}
                            </span>
                            {step.title}
                        </button>
                    ))}
                </div>

                {/* Step content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <p className="text-sm text-[var(--forge-text-secondary)]">
                            {data.steps[activeStep]?.content}
                        </p>
                        {data.steps[activeStep]?.code && (
                            <div className="p-4 rounded-lg bg-[#0d1117] border border-[var(--forge-border-subtle)]">
                                <pre className="text-sm text-[#e6edf3] font-mono whitespace-pre-wrap overflow-x-auto">
                                    {data.steps[activeStep].code}
                                </pre>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between mt-6 pt-4 border-t border-[var(--forge-border-subtle)]">
                    <button
                        onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                        disabled={activeStep === 0}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 bg-[var(--forge-bg-bench)] hover:bg-[var(--forge-bg)]"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setActiveStep(Math.min(data.steps.length - 1, activeStep + 1))}
                        disabled={activeStep === data.steps.length - 1}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 bg-[var(--ember)] text-white hover:bg-[var(--ember-glow)]"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Pitfall Block - Common mistakes
// ============================================================================

interface PitfallBlockProps {
    data: PitfallBlockData;
}

export function PitfallBlock({ data }: PitfallBlockProps) {
    return (
        <div className="my-6 rounded-xl border border-red-500/30 bg-red-500/5 overflow-hidden">
            <div className="px-5 py-3 border-b border-red-500/20 bg-red-500/10">
                <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-red-400" />
                    <h4 className="font-semibold text-red-400">{data.title}</h4>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <p className="text-sm text-[var(--forge-text-secondary)]">{data.description}</p>

                {data.wrongCode && data.rightCode && (
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Wrong */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle className="w-4 h-4 text-red-400" />
                                <span className="text-xs font-medium text-red-400 uppercase">Don't</span>
                            </div>
                            <div className="p-4 rounded-lg bg-[#0d1117] border border-red-500/30">
                                <pre className="text-sm text-[#e6edf3] font-mono whitespace-pre-wrap">{data.wrongCode}</pre>
                            </div>
                        </div>

                        {/* Right */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span className="text-xs font-medium text-green-400 uppercase">Do</span>
                            </div>
                            <div className="p-4 rounded-lg bg-[#0d1117] border border-green-500/30">
                                <pre className="text-sm text-[#e6edf3] font-mono whitespace-pre-wrap">{data.rightCode}</pre>
                            </div>
                        </div>
                    </div>
                )}

                {data.explanation && (
                    <div className="p-4 rounded-lg bg-[var(--forge-bg-bench)] border border-[var(--forge-border-subtle)]">
                        <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-[var(--forge-text-secondary)]">{data.explanation}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// DeepDive Block - Collapsible advanced content
// ============================================================================

interface DeepDiveBlockProps {
    data: DeepDiveBlockData;
}

export function DeepDiveBlock({ data }: DeepDiveBlockProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="my-6 rounded-xl border border-purple-500/30 bg-purple-500/5 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-purple-500/10 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Microscope className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold text-purple-400">{data.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-400/60">Advanced</span>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-purple-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-purple-400" />
                    )}
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 pt-0 border-t border-purple-500/20">
                            <div className="text-sm text-[var(--forge-text-secondary)] whitespace-pre-wrap">
                                {data.content}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// RealWorld Block - Practical example
// ============================================================================

interface RealWorldBlockProps {
    data: RealWorldBlockData;
}

export function RealWorldBlock({ data }: RealWorldBlockProps) {
    return (
        <div className="my-6 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--forge-border-subtle)] bg-gradient-to-r from-cyan-500/10 to-transparent">
                <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-semibold text-cyan-400">{data.title}</h4>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <p className="text-sm text-[var(--forge-text-secondary)]">{data.context}</p>

                {data.code && (
                    <div className="p-4 rounded-lg bg-[#0d1117] border border-[var(--forge-border-subtle)]">
                        <pre className="text-sm text-[#e6edf3] font-mono whitespace-pre-wrap overflow-x-auto">{data.code}</pre>
                    </div>
                )}

                {data.explanation && (
                    <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                        <p className="text-sm text-[var(--forge-text-secondary)]">{data.explanation}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Syntax Block - API reference
// ============================================================================

interface SyntaxBlockProps {
    data: SyntaxBlockData;
}

export function SyntaxBlock({ data }: SyntaxBlockProps) {
    return (
        <div className="my-6 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-bench)]">
                <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-[var(--ember)]" />
                    <h4 className="font-mono font-semibold text-[var(--forge-text-primary)]">{data.name}</h4>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {data.description && (
                    <p className="text-sm text-[var(--forge-text-secondary)]">{data.description}</p>
                )}

                {/* Signature */}
                {data.signature && (
                    <div className="p-4 rounded-lg bg-[#0d1117] border border-[var(--forge-border-subtle)]">
                        <pre className="text-sm text-[var(--ember)] font-mono">{data.signature}</pre>
                    </div>
                )}

                {/* Parameters */}
                {data.parameters && data.parameters.length > 0 && (
                    <div>
                        <h5 className="text-sm font-medium text-[var(--forge-text-primary)] mb-2">Parameters</h5>
                        <div className="space-y-2">
                            {data.parameters.map((param, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--forge-bg-bench)]">
                                    <code className="text-sm font-mono text-[var(--ember)]">
                                        {param.name}{param.optional && "?"}
                                    </code>
                                    <code className="text-sm font-mono text-purple-400">{param.type}</code>
                                    <span className="text-sm text-[var(--forge-text-muted)]">{param.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Returns */}
                {data.returns && (
                    <div>
                        <h5 className="text-sm font-medium text-[var(--forge-text-primary)] mb-2">Returns</h5>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--forge-bg-bench)]">
                            <code className="text-sm font-mono text-purple-400">{data.returns.type}</code>
                            <span className="text-sm text-[var(--forge-text-muted)]">{data.returns.description}</span>
                        </div>
                    </div>
                )}

                {/* Examples */}
                {data.examples && data.examples.length > 0 && (
                    <div>
                        <h5 className="text-sm font-medium text-[var(--forge-text-primary)] mb-2">Examples</h5>
                        <div className="space-y-2">
                            {data.examples.map((example, i) => (
                                <div key={i} className="p-4 rounded-lg bg-[#0d1117] border border-[var(--forge-border-subtle)]">
                                    <pre className="text-sm text-[#e6edf3] font-mono whitespace-pre-wrap">{example}</pre>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Checkpoint Block - Quick understanding check
// ============================================================================

interface CheckpointBlockProps {
    data: CheckpointBlockData;
}

export function CheckpointBlock({ data }: CheckpointBlockProps) {
    const [showAnswer, setShowAnswer] = useState(false);
    const [showHint, setShowHint] = useState(false);

    return (
        <div className="my-6 rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
            <div className="px-5 py-3 border-b border-amber-500/20 bg-amber-500/10">
                <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">Quick Check</span>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <p className="text-sm text-[var(--forge-text-primary)] font-medium">{data.question}</p>

                <div className="flex gap-2">
                    {data.hint && (
                        <button
                            onClick={() => setShowHint(!showHint)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--forge-bg-bench)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        >
                            <Lightbulb className="w-3 h-3" />
                            Hint
                        </button>
                    )}
                    <button
                        onClick={() => setShowAnswer(!showAnswer)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--ember)]/20 text-[var(--ember)] hover:bg-[var(--ember)]/30"
                    >
                        {showAnswer ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showAnswer ? "Hide Answer" : "Show Answer"}
                    </button>
                </div>

                <AnimatePresence>
                    {showHint && data.hint && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <div className="flex items-start gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-[var(--forge-text-secondary)]">{data.hint}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showAnswer && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-[var(--forge-text-secondary)]">{data.answer}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ============================================================================
// ProTip Block - Expert insight
// ============================================================================

interface ProTipBlockProps {
    data: ProTipBlockData;
}

export function ProTipBlock({ data }: ProTipBlockProps) {
    return (
        <div className="my-6 rounded-xl border border-[var(--ember)]/30 bg-gradient-to-r from-[var(--ember)]/10 to-transparent overflow-hidden">
            <div className="p-5">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--ember)]/20 flex items-center justify-center flex-shrink-0">
                        <Star className="w-4 h-4 text-[var(--ember)]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-[var(--ember)] uppercase tracking-wider">Pro Tip</span>
                            {data.author && (
                                <span className="text-xs text-[var(--forge-text-muted)]">by {data.author}</span>
                            )}
                        </div>
                        <p className="text-sm text-[var(--forge-text-secondary)]">{data.content}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Main Block Renderer
// ============================================================================

interface BlockRendererProps {
    block: BlockData;
}

export function BlockRenderer({ block }: BlockRendererProps) {
    switch (block.type) {
        // Basic blocks
        case "video":
            return <VideoBlock data={block} />;
        case "code":
            return <CodeBlock data={block} />;
        case "callout":
            return <CalloutBlock data={block} />;
        case "keypoints":
            return <KeypointsBlock data={block} />;
        case "exercise":
            return <ExerciseBlock data={block} />;
        case "quiz":
            return <QuizBlock data={block} />;

        // Extended blocks
        case "tabs":
            return <TabsBlock data={block} />;
        case "comparison":
            return <ComparisonBlock data={block} />;
        case "scenario":
            return <ScenarioBlock data={block} />;
        case "steps":
            return <StepsBlock data={block} />;
        case "pitfall":
            return <PitfallBlock data={block} />;
        case "deepdive":
            return <DeepDiveBlock data={block} />;
        case "realworld":
            return <RealWorldBlock data={block} />;
        case "syntax":
            return <SyntaxBlock data={block} />;
        case "checkpoint":
            return <CheckpointBlock data={block} />;
        case "protip":
            return <ProTipBlock data={block} />;

        case "text":
            return null;
        default:
            return null;
    }
}
