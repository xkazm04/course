"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Check,
    X,
    AlertTriangle,
    MessageSquare,
    FileCode,
    ThumbsUp,
    Lightbulb,
    ExternalLink,
    BookOpen,
    Zap,
    Trophy,
    Star,
    ChevronDown,
    ChevronUp,
    GitPullRequest,
    Clock,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../../layout";
import { mockChallenges, mockProjects, mockReviews } from "../../lib/mockData";

// ============================================================================
// SCORE CARD
// ============================================================================

function ScoreCard({ label, score, maxScore = 100 }: { label: string; score: number; maxScore?: number }) {
    const percentage = (score / maxScore) * 100;

    const getScoreColor = (pct: number) => {
        if (pct >= 80) return "text-emerald-500";
        if (pct >= 60) return "text-amber-500";
        return "text-rose-500";
    };

    const getBarColor = (pct: number) => {
        if (pct >= 80) return "bg-emerald-500";
        if (pct >= 60) return "bg-amber-500";
        return "bg-rose-500";
    };

    return (
        <div className="bg-[var(--surface-overlay)] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                <span className={cn("text-lg font-bold", getScoreColor(percentage))}>
                    {score}
                </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-base)]">
                <div
                    className={cn("h-full rounded-full transition-all", getBarColor(percentage))}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

// ============================================================================
// FEEDBACK ITEM
// ============================================================================

function FeedbackItem({ item }: { item: { type: string; file?: string; line?: number; content: string; codeSnippet?: string } }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const typeConfig = {
        praise: { icon: ThumbsUp, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Great work!" },
        suggestion: { icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-500/10", label: "Suggestion" },
        issue: { icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", label: "Issue" },
        question: { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10", label: "Question" },
    };

    const config = typeConfig[item.type as keyof typeof typeConfig] || typeConfig.suggestion;
    const Icon = config.icon;

    return (
        <div className="bg-[var(--surface-overlay)] rounded-lg border border-[var(--border-default)] overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-start gap-3 p-4 text-left"
            >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                    <Icon size={16} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs font-medium", config.color)}>
                            {config.label}
                        </span>
                        {item.file && (
                            <span className="text-xs text-[var(--text-muted)]">
                                {item.file}{item.line ? `:${item.line}` : ""}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                        {item.content}
                    </p>
                </div>
                {item.codeSnippet && (
                    isExpanded ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />
                )}
            </button>
            {isExpanded && item.codeSnippet && (
                <div className="px-4 pb-4">
                    <pre className="p-3 rounded bg-[var(--surface-base)] overflow-x-auto">
                        <code className="text-xs font-mono text-[var(--text-secondary)]">
                            {item.codeSnippet}
                        </code>
                    </pre>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// LEARNING POINTS
// ============================================================================

function LearningPoints({ points }: { points: string[] }) {
    return (
        <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
            <div className="flex items-center gap-2 mb-4">
                <BookOpen size={20} className="text-[var(--accent-primary)]" />
                <h3 className="font-semibold text-[var(--text-primary)]">What You Learned</h3>
            </div>
            <ul className="space-y-3">
                {points.map((point, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check size={12} className="text-emerald-500" />
                        </div>
                        <span className="text-sm text-[var(--text-secondary)]">{point}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ============================================================================
// SUGGESTED RESOURCES
// ============================================================================

function SuggestedResources({ resources }: { resources: { type: string; title: string; url: string; reason: string }[] }) {
    return (
        <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-blue-500" />
                <h3 className="font-semibold text-[var(--text-primary)]">Continue Learning</h3>
            </div>
            <div className="space-y-3">
                {resources.map((resource, i) => (
                    <a
                        key={i}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-[var(--surface-overlay)] rounded-lg hover:bg-[var(--surface-base)] transition-colors"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                                {resource.title}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] capitalize px-2 py-0.5 rounded bg-[var(--surface-base)]">
                                {resource.type}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                            {resource.reason}
                        </p>
                    </a>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ReviewPage() {
    const params = useParams();
    const router = useRouter();
    const { user, setUser } = useForge();
    const challengeId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);

    const challenge = mockChallenges.find((c) => c.id === challengeId);
    const project = challenge ? mockProjects.find((p) => p.id === challenge.projectId) : null;
    const review = mockReviews[0]; // Use first mock review

    useEffect(() => {
        // Simulate review loading
        const timer = setTimeout(() => {
            setIsLoading(false);
            // Show celebration if approved
            if (review.verdict === "approved") {
                setTimeout(() => setShowCelebration(true), 500);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    if (!challenge || !project) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                    Challenge Not Found
                </h1>
                <Link
                    href="/forge/challenges"
                    className="text-[var(--accent-primary)] hover:underline"
                >
                    Back to Challenges
                </Link>
            </div>
        );
    }

    const verdictConfig = {
        approved: {
            icon: Check,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/30",
            label: "Approved",
            message: "Excellent work! Your contribution meets all requirements.",
        },
        changes_requested: {
            icon: AlertTriangle,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/30",
            label: "Changes Requested",
            message: "Good progress! Please address the feedback below.",
        },
        needs_discussion: {
            icon: MessageSquare,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/30",
            label: "Needs Discussion",
            message: "Let's discuss some aspects of your implementation.",
        },
    };

    const verdict = verdictConfig[review.verdict];
    const VerdictIcon = verdict.icon;

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center mb-4">
                    <div className="w-8 h-8 border-3 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    Reviewing Your Code...
                </h2>
                <p className="text-[var(--text-secondary)]">
                    Our AI tutor is analyzing your submission
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Back Link */}
            <Link
                href={`/forge/challenges/${challengeId}`}
                className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
            >
                <ArrowLeft size={16} />
                Back to Challenge
            </Link>

            {/* Verdict Banner */}
            <div className={cn("rounded-xl border p-6 mb-8", verdict.bg, verdict.border)}>
                <div className="flex items-start gap-4">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", verdict.bg)}>
                        <VerdictIcon size={24} className={verdict.color} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className={cn("text-xl font-bold", verdict.color)}>
                                {verdict.label}
                            </h2>
                            <span className="text-sm text-[var(--text-muted)]">
                                {review.type === "ai_tutor" ? "AI Tutor Review" : "Maintainer Review"}
                            </span>
                        </div>
                        <p className="text-[var(--text-secondary)]">
                            {verdict.message}
                        </p>
                    </div>
                    {review.verdict === "approved" && (
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-2xl font-bold text-amber-500">
                                <Zap size={24} />
                                +{challenge.xpReward} XP
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                            Review Summary
                        </h3>
                        <p className="text-[var(--text-secondary)]">
                            {review.summary}
                        </p>
                    </div>

                    {/* Scores */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                            Scores
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <ScoreCard label="Code Quality" score={review.scores.codeQuality} />
                            <ScoreCard label="Completeness" score={review.scores.completeness} />
                            <ScoreCard label="Test Coverage" score={review.scores.testCoverage} />
                            <ScoreCard label="Documentation" score={review.scores.documentation} />
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-[var(--text-primary)]">Overall Score</span>
                                <span className="text-2xl font-bold text-[var(--accent-primary)]">
                                    {review.scores.overall}/100
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Items */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                            Detailed Feedback
                        </h3>
                        <div className="space-y-3">
                            {review.feedbackItems.map((item, i) => (
                                <FeedbackItem key={i} item={item} />
                            ))}
                        </div>
                    </div>

                    {/* Learning Points */}
                    <LearningPoints points={review.learningPoints} />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Challenge Info */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                            Challenge
                        </h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-2xl">
                                {challenge.type === "bug" ? "🐛" : "✨"}
                            </div>
                            <div>
                                <div className="font-medium text-[var(--text-primary)]">
                                    {challenge.title}
                                </div>
                                <div className="text-xs text-[var(--text-muted)]">
                                    {project.name}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--text-muted)]">Difficulty</span>
                                <span className="capitalize text-[var(--text-secondary)]">
                                    {challenge.difficulty}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--text-muted)]">Time Spent</span>
                                <span className="text-[var(--text-secondary)]">
                                    42 minutes
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--text-muted)]">Hints Used</span>
                                <span className="text-[var(--text-secondary)]">
                                    0
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Skills Gained */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                            Skills Demonstrated
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

                    {/* Suggested Resources */}
                    <SuggestedResources resources={review.suggestedResources} />

                    {/* Next Actions */}
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                            What's Next?
                        </h3>
                        <div className="space-y-3">
                            {review.verdict === "approved" ? (
                                <>
                                    <Link
                                        href="/forge/dashboard"
                                        className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90"
                                    >
                                        <Trophy size={18} />
                                        View Dashboard
                                    </Link>
                                    <Link
                                        href="/forge/challenges"
                                        className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    >
                                        Find Next Challenge
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href={`/forge/workspace/${challengeId}`}
                                        className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90"
                                    >
                                        Continue Working
                                    </Link>
                                    <button className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                        <MessageSquare size={18} />
                                        Ask AI Tutor
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Celebration Modal */}
            {showCelebration && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] max-w-md w-full p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
                            <Trophy size={40} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            Congratulations!
                        </h2>
                        <p className="text-[var(--text-secondary)] mb-6">
                            Your contribution has been approved! You've earned {challenge.xpReward} XP and improved your skills.
                        </p>

                        <div className="flex items-center justify-center gap-6 mb-6 p-4 bg-[var(--surface-overlay)] rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-amber-500">+{challenge.xpReward}</div>
                                <div className="text-xs text-[var(--text-muted)]">XP Earned</div>
                            </div>
                            <div className="w-px h-10 bg-[var(--border-default)]" />
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-500">+1</div>
                                <div className="text-xs text-[var(--text-muted)]">PR Merged</div>
                            </div>
                            <div className="w-px h-10 bg-[var(--border-default)]" />
                            <div className="text-center">
                                <div className="text-2xl font-bold text-[var(--accent-primary)]">+3</div>
                                <div className="text-xs text-[var(--text-muted)]">Day Streak</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowCelebration(false)}
                            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
