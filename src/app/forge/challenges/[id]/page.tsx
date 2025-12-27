"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Clock,
    Zap,
    Target,
    Github,
    FileCode,
    Lightbulb,
    ChevronRight,
    ChevronDown,
    Check,
    AlertCircle,
    BookOpen,
    Users,
    Play,
    Eye,
    EyeOff,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../../layout";
import { mockChallenges, mockProjects } from "../../lib/mockData";
import type { ChallengeHint } from "../../lib/types";

// ============================================================================
// HINT COMPONENT
// ============================================================================

function HintSection({ hints }: { hints: ChallengeHint[] }) {
    const [revealedHints, setRevealedHints] = useState<number[]>([]);

    const revealHint = (level: number) => {
        if (!revealedHints.includes(level)) {
            setRevealedHints([...revealedHints, level]);
        }
    };

    return (
        <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={20} className="text-amber-500" />
                <h3 className="font-semibold text-[var(--text-primary)]">Hints</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
                Use hints if you get stuck. Each hint reduces XP reward.
            </p>
            <div className="space-y-3">
                {hints.map((hint, index) => {
                    const isRevealed = revealedHints.includes(hint.level);
                    return (
                        <div
                            key={hint.level}
                            className={cn(
                                "p-4 rounded-lg border transition-all",
                                isRevealed
                                    ? "bg-[var(--surface-overlay)] border-amber-500/30"
                                    : "bg-[var(--surface-base)] border-[var(--border-default)]"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                    Hint {hint.level}
                                </span>
                                <span className="text-xs text-rose-500">
                                    -{hint.xpPenalty} XP
                                </span>
                            </div>
                            {isRevealed ? (
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {hint.content}
                                </p>
                            ) : (
                                <button
                                    onClick={() => revealHint(hint.level)}
                                    className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400"
                                >
                                    <Eye size={14} />
                                    Reveal hint
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// CODE SNIPPET
// ============================================================================

function CodeSnippet({ code, file, startLine }: { code: string; file: string; startLine: number }) {
    return (
        <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-overlay)] border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                    <FileCode size={14} className="text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-secondary)]">{file}</span>
                </div>
                <span className="text-xs text-[var(--text-muted)]">Line {startLine}</span>
            </div>
            <pre className="p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-secondary)] font-mono">
                    {code}
                </code>
            </pre>
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ChallengeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useForge();
    const id = params.id as string;

    const challenge = mockChallenges.find((c) => c.id === id);
    const project = challenge ? mockProjects.find((p) => p.id === challenge.projectId) : null;

    const [isStarting, setIsStarting] = useState(false);

    if (!challenge || !project) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                    Challenge Not Found
                </h1>
                <p className="text-[var(--text-secondary)] mb-8">
                    The challenge you're looking for doesn't exist.
                </p>
                <Link
                    href="/forge/challenges"
                    className="text-[var(--accent-primary)] hover:underline"
                >
                    Back to Challenges
                </Link>
            </div>
        );
    }

    const difficultyColors = {
        beginner: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        intermediate: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        advanced: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    };

    const typeEmojis: Record<string, string> = {
        bug: "🐛",
        feature: "✨",
        refactor: "🔧",
        test: "🧪",
        docs: "📚",
        performance: "⚡",
        security: "🔒",
    };

    const handleStartChallenge = () => {
        setIsStarting(true);
        // Simulate starting - in real app would create contribution record
        setTimeout(() => {
            router.push(`/forge/workspace/${challenge.id}`);
        }, 1000);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Back Link */}
            <Link
                href="/forge/challenges"
                className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
            >
                <ArrowLeft size={16} />
                Back to Challenges
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="text-4xl">{typeEmojis[challenge.type]}</div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span
                                        className={cn(
                                            "px-2 py-0.5 rounded text-xs font-medium capitalize border",
                                            difficultyColors[challenge.difficulty]
                                        )}
                                    >
                                        {challenge.difficulty}
                                    </span>
                                    <span className="text-xs text-[var(--text-muted)] capitalize">
                                        {challenge.type}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                                    {challenge.title}
                                </h1>
                                <p className="text-[var(--text-secondary)]">
                                    {challenge.description}
                                </p>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[var(--border-subtle)]">
                            <div className="flex items-center gap-2">
                                <Zap size={16} className="text-amber-500" />
                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                    +{challenge.xpReward} XP
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-[var(--text-muted)]" />
                                <span className="text-sm text-[var(--text-secondary)]">
                                    ~{challenge.estimatedMinutes} minutes
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-[var(--text-muted)]" />
                                <span className="text-sm text-[var(--text-secondary)]">
                                    {challenge.timesCompleted} completed
                                </span>
                            </div>
                            {challenge.successRate && (
                                <div className="flex items-center gap-2">
                                    <Target size={16} className="text-[var(--text-muted)]" />
                                    <span className="text-sm text-[var(--text-secondary)]">
                                        {challenge.successRate}% success rate
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Context */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                            Context
                        </h2>
                        <p className="text-[var(--text-secondary)]">
                            {challenge.context}
                        </p>
                    </div>

                    {/* Code Location */}
                    {challenge.codeSnippet && challenge.location && (
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                                Code Location
                            </h2>
                            <CodeSnippet
                                code={challenge.codeSnippet}
                                file={challenge.location.file}
                                startLine={challenge.location.startLine}
                            />
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                            Instructions
                        </h2>
                        <div className="prose prose-invert max-w-none">
                            <div className="text-[var(--text-secondary)] whitespace-pre-line">
                                {challenge.instructions}
                            </div>
                        </div>
                    </div>

                    {/* Expected Outcome */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                            Expected Outcome
                        </h2>
                        <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <Check size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[var(--text-secondary)]">
                                {challenge.expectedOutcome}
                            </p>
                        </div>
                    </div>

                    {/* Hints */}
                    {challenge.hints.length > 0 && (
                        <HintSection hints={challenge.hints} />
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Start Button */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <button
                            onClick={handleStartChallenge}
                            disabled={isStarting || !user.githubConnected}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                                user.githubConnected
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90"
                                    : "bg-[var(--surface-overlay)] text-[var(--text-muted)] cursor-not-allowed"
                            )}
                        >
                            {isStarting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <Play size={18} />
                                    Start Challenge
                                </>
                            )}
                        </button>
                        {!user.githubConnected && (
                            <div className="flex items-start gap-2 mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Connect your GitHub account to start contributing.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Project Info */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                            Project
                        </h3>
                        <Link
                            href={`/forge/projects/${project.slug}`}
                            className="flex items-center gap-3 p-3 bg-[var(--surface-overlay)] rounded-lg hover:bg-[var(--surface-base)] transition-colors"
                        >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                                <Target size={20} className="text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-[var(--text-primary)]">
                                    {project.name}
                                </div>
                                <div className="text-xs text-[var(--text-muted)]">
                                    {project.targetProduct} alternative
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-[var(--text-muted)]" />
                        </Link>

                        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                            <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                                <Github size={16} />
                                View Repository
                            </a>
                        </div>
                    </div>

                    {/* Skills Required */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                            Skills Required
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {challenge.skillsRequired.map((skill) => (
                                <span
                                    key={skill}
                                    className="px-3 py-1.5 rounded-lg bg-[var(--surface-overlay)] text-sm text-[var(--text-secondary)]"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Skills You'll Learn */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                            Skills You'll Learn
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {challenge.skillsTaught.map((skill) => (
                                <span
                                    key={skill}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-sm text-emerald-500"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                            Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {challenge.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
