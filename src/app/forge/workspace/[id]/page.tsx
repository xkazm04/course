"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Clock,
    Zap,
    Github,
    FileCode,
    Lightbulb,
    ChevronRight,
    Check,
    AlertCircle,
    Play,
    Pause,
    Send,
    MessageSquare,
    Eye,
    GitBranch,
    GitPullRequest,
    ExternalLink,
    CheckCircle,
    XCircle,
    Terminal,
    BookOpen,
    HelpCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../../layout";
import { mockChallenges, mockProjects, mockContributions } from "../../lib/mockData";

// ============================================================================
// TIMER COMPONENT
// ============================================================================

function WorkTimer() {
    const [isRunning, setIsRunning] = useState(true);
    const [seconds, setSeconds] = useState(847); // Mock 14:07

    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setSeconds((s) => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => setIsRunning(!isRunning)}
                className={cn(
                    "p-2 rounded-lg transition-colors",
                    isRunning
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                )}
            >
                {isRunning ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div>
                <div className="text-lg font-mono font-semibold text-[var(--text-primary)]">
                    {formatTime(seconds)}
                </div>
                <div className="text-xs text-[var(--text-muted)]">Time spent</div>
            </div>
        </div>
    );
}

// ============================================================================
// PROGRESS STEPS
// ============================================================================

function ProgressSteps({ currentStep }: { currentStep: number }) {
    const steps = [
        { id: 1, label: "Fork Repo", icon: GitBranch },
        { id: 2, label: "Implement", icon: FileCode },
        { id: 3, label: "Submit PR", icon: GitPullRequest },
        { id: 4, label: "Review", icon: MessageSquare },
        { id: 5, label: "Merge", icon: CheckCircle },
    ];

    return (
        <div className="flex items-center gap-2">
            {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;

                return (
                    <React.Fragment key={step.id}>
                        <div
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
                                isCompleted && "text-emerald-500",
                                isCurrent && "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",
                                !isCompleted && !isCurrent && "text-[var(--text-muted)]"
                            )}
                        >
                            {isCompleted ? (
                                <Check size={14} />
                            ) : (
                                <Icon size={14} />
                            )}
                            <span className="hidden sm:inline">{step.label}</span>
                        </div>
                        {index < steps.length - 1 && (
                            <ChevronRight
                                size={14}
                                className={cn(
                                    isCompleted ? "text-emerald-500" : "text-[var(--text-muted)]"
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ============================================================================
// AI CHAT
// ============================================================================

function AIChat() {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hi! I'm your AI tutor. I can help you understand the codebase, explain concepts, or give hints without giving away the solution. What would you like to know?",
        },
    ]);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;

        setMessages([
            ...messages,
            { role: "user", content: input },
            {
                role: "assistant",
                content: "Great question! Let me help you with that. Based on the challenge context, you should focus on the error handling in the async function. The current implementation doesn't properly catch errors from the API call. Consider wrapping the fetch in a try-catch block and handling the error state appropriately.",
            },
        ]);
        setInput("");
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex",
                            msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] px-4 py-2 rounded-xl text-sm",
                                msg.role === "user"
                                    ? "bg-[var(--accent-primary)] text-white"
                                    : "bg-[var(--surface-overlay)] text-[var(--text-secondary)]"
                            )}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Ask a question..."
                        className="flex-1 px-4 py-2 rounded-lg bg-[var(--surface-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <button
                        onClick={handleSend}
                        className="p-2 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                    <button className="hover:text-[var(--text-primary)]">
                        Explain this code
                    </button>
                    <button className="hover:text-[var(--text-primary)]">
                        What pattern should I use?
                    </button>
                    <button className="hover:text-[var(--text-primary)]">
                        Give me a hint
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// RESOURCES PANEL
// ============================================================================

function ResourcesPanel({ challenge }: { challenge: typeof mockChallenges[0] }) {
    const resources = [
        { title: "React Error Boundaries", type: "docs", url: "#" },
        { title: "Async/Await Best Practices", type: "article", url: "#" },
        { title: "TypeScript Error Handling", type: "video", url: "#" },
    ];

    return (
        <div className="p-4 space-y-4">
            <div>
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                    Required Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                    {challenge.skillsRequired.map((skill) => (
                        <span
                            key={skill}
                            className="px-2 py-1 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-secondary)]"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                    Helpful Resources
                </h4>
                <div className="space-y-2">
                    {resources.map((resource, i) => (
                        <a
                            key={i}
                            href={resource.url}
                            className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-overlay)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <BookOpen size={14} />
                            <span className="flex-1">{resource.title}</span>
                            <span className="text-xs text-[var(--text-muted)] capitalize">
                                {resource.type}
                            </span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN WORKSPACE
// ============================================================================

export default function WorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useForge();
    const challengeId = params.id as string;

    const [activeTab, setActiveTab] = useState<"chat" | "resources" | "hints">("chat");
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    const challenge = mockChallenges.find((c) => c.id === challengeId);
    const project = challenge ? mockProjects.find((p) => p.id === challenge.projectId) : null;

    // Mock contribution state
    const contribution = {
        status: "in_progress",
        forkUrl: "https://github.com/user/opencrm-fork",
        branchName: "fix/error-handling",
        hintsUsed: 0,
    };

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

    const typeEmojis: Record<string, string> = {
        bug: "🐛",
        feature: "✨",
        refactor: "🔧",
        test: "🧪",
        docs: "📚",
        performance: "⚡",
        security: "🔒",
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            {/* Top Bar */}
            <div className="flex-shrink-0 bg-[var(--surface-elevated)] border-b border-[var(--border-default)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Challenge info */}
                        <div className="flex items-center gap-4 min-w-0">
                            <Link
                                href={`/forge/challenges/${challengeId}`}
                                className="p-2 rounded-lg hover:bg-[var(--surface-overlay)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                                <ArrowLeft size={18} />
                            </Link>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{typeEmojis[challenge.type]}</span>
                                    <h1 className="font-semibold text-[var(--text-primary)] truncate">
                                        {challenge.title}
                                    </h1>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                                    <span>{project.name}</span>
                                    <span className="flex items-center gap-1">
                                        <Zap size={12} className="text-amber-500" />
                                        +{challenge.xpReward} XP
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Center: Progress */}
                        <div className="hidden lg:flex">
                            <ProgressSteps currentStep={2} />
                        </div>

                        {/* Right: Timer & Submit */}
                        <div className="flex items-center gap-4">
                            <WorkTimer />
                            <button
                                onClick={() => setShowSubmitModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90"
                            >
                                <Send size={16} />
                                <span className="hidden sm:inline">Submit PR</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Instructions */}
                <div className="w-1/2 border-r border-[var(--border-default)] overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Quick Actions */}
                        <div className="flex items-center gap-3">
                            <a
                                href={contribution.forkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-overlay)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <Github size={16} />
                                Open Fork
                                <ExternalLink size={12} />
                            </a>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-overlay)] text-sm text-[var(--text-muted)]">
                                <GitBranch size={16} />
                                {contribution.branchName}
                            </div>
                        </div>

                        {/* Context */}
                        <section>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                                Context
                            </h2>
                            <p className="text-[var(--text-secondary)]">
                                {challenge.context}
                            </p>
                        </section>

                        {/* Code Location */}
                        {challenge.codeSnippet && challenge.location && (
                            <section>
                                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                                    Code to Fix
                                </h2>
                                <div className="bg-[var(--surface-overlay)] rounded-lg border border-[var(--border-default)] overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-base)] border-b border-[var(--border-subtle)]">
                                        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                            <FileCode size={14} />
                                            {challenge.location.file}
                                        </div>
                                        <span className="text-xs text-[var(--text-muted)]">
                                            Lines {challenge.location.startLine}-{challenge.location.endLine}
                                        </span>
                                    </div>
                                    <pre className="p-4 overflow-x-auto">
                                        <code className="text-sm text-[var(--text-secondary)] font-mono">
                                            {challenge.codeSnippet}
                                        </code>
                                    </pre>
                                </div>
                            </section>
                        )}

                        {/* Instructions */}
                        <section>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                                Instructions
                            </h2>
                            <div className="prose prose-invert max-w-none text-[var(--text-secondary)] whitespace-pre-line">
                                {challenge.instructions}
                            </div>
                        </section>

                        {/* Expected Outcome */}
                        <section>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                                Expected Outcome
                            </h2>
                            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <Check size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[var(--text-secondary)]">
                                    {challenge.expectedOutcome}
                                </p>
                            </div>
                        </section>

                        {/* Hints */}
                        <section>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                                Hints
                            </h2>
                            <div className="space-y-2">
                                {challenge.hints.map((hint, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-3 bg-[var(--surface-overlay)] rounded-lg border border-[var(--border-default)]"
                                    >
                                        <span className="text-sm text-[var(--text-secondary)]">
                                            Hint {hint.level}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-rose-500">
                                                -{hint.xpPenalty} XP
                                            </span>
                                            <button className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400">
                                                <Eye size={12} />
                                                Reveal
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Right: AI Chat & Resources */}
                <div className="w-1/2 flex flex-col">
                    {/* Tabs */}
                    <div className="flex-shrink-0 border-b border-[var(--border-default)]">
                        <div className="flex">
                            {[
                                { id: "chat", label: "AI Tutor", icon: MessageSquare },
                                { id: "resources", label: "Resources", icon: BookOpen },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                            activeTab === tab.id
                                                ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        )}
                                    >
                                        <Icon size={16} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden">
                        {activeTab === "chat" && <AIChat />}
                        {activeTab === "resources" && <ResourcesPanel challenge={challenge} />}
                    </div>
                </div>
            </div>

            {/* Submit Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                            Submit Your Work
                        </h2>
                        <p className="text-[var(--text-secondary)] mb-6">
                            Ready to submit your pull request? Our AI tutor will review your code and provide feedback.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Pull Request URL
                                </label>
                                <input
                                    type="text"
                                    placeholder="https://github.com/org/repo/pull/123"
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--surface-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Notes (optional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Any additional context for the reviewer..."
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--surface-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 px-4 py-2 rounded-lg bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => router.push(`/forge/review/${challengeId}`)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90"
                            >
                                <Send size={16} />
                                Submit for Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
