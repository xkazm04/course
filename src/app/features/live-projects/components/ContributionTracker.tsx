"use client";

/**
 * Contribution Tracker Component
 *
 * Displays the scaffolded learning path and tracks progress through
 * a real open-source contribution with AI mentorship.
 */

import React, { useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
    GitPullRequest,
    CheckCircle2,
    Circle,
    PlayCircle,
    ChevronRight,
    ChevronDown,
    ExternalLink,
    Clock,
    BookOpen,
    Code,
    TestTube,
    Eye,
    Sparkles,
    MessageSquare,
    Bot,
    ThumbsUp,
    ThumbsDown,
    Award,
    Star,
    GitMerge,
    Target,
    Layers,
} from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type {
    Contribution,
    ContributionStatus,
    LearningPhase,
    PhaseTask,
    LearningCheckpoint,
    PhaseType,
    AIAssistanceType,
} from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface ContributionTrackerProps {
    contribution: Contribution;
    onCompleteTask: (phaseId: string, taskId: string) => void;
    onUpdateStatus: (status: ContributionStatus) => void;
    onLogAI: (type: AIAssistanceType, context: string) => string;
    onRateAI: (logId: string, wasHelpful: boolean) => void;
    onLinkPR?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PHASE_ICONS: Record<PhaseType, React.ElementType> = {
    exploration: BookOpen,
    learning: Layers,
    planning: Target,
    implementation: Code,
    testing: TestTube,
    review: Eye,
    refinement: Sparkles,
};

const STATUS_COLORS: Record<ContributionStatus, { bg: string; text: string }> = {
    exploring: { bg: "bg-[var(--forge-info)]/10", text: "text-[var(--forge-info)]" },
    in_progress: { bg: "bg-[var(--ember)]/10", text: "text-[var(--ember)]" },
    review_ready: { bg: "bg-[var(--forge-warning)]/10", text: "text-[var(--forge-warning)]" },
    changes_requested: { bg: "bg-[var(--forge-warning)]/10", text: "text-[var(--forge-warning)]" },
    approved: { bg: "bg-[var(--forge-success)]/10", text: "text-[var(--forge-success)]" },
    merged: { bg: "bg-[var(--ember)]/10", text: "text-[var(--ember)]" },
    abandoned: { bg: "bg-[var(--forge-bg-elevated)]", text: "text-[var(--forge-text-muted)]" },
    blocked: { bg: "bg-[var(--forge-error)]/10", text: "text-[var(--forge-error)]" },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ContributionTracker = ({
    contribution,
    onCompleteTask,
    onUpdateStatus,
    onLogAI,
    onRateAI,
    onLinkPR,
}: ContributionTrackerProps) => {
    const prefersReducedMotion = useReducedMotion();
    const { analyzedIssue, status, phaseProgress, pullRequest, outcome } = contribution;
    const { issue, learningPath } = analyzedIssue;

    const [expandedPhase, setExpandedPhase] = useState<string | null>(
        phaseProgress.find((p) => p.status === "in_progress")?.phaseId || learningPath.phases[0].id
    );
    const [showAIChat, setShowAIChat] = useState(false);
    const [aiContext, setAIContext] = useState<{ type: AIAssistanceType; context: string } | null>(null);

    // Calculate overall progress
    const totalTasks = phaseProgress.reduce((sum, p) => sum + p.totalTasks, 0);
    const completedTasks = phaseProgress.reduce((sum, p) => sum + p.tasksCompleted, 0);
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const handleRequestAI = useCallback(
        (type: AIAssistanceType, context: string) => {
            setAIContext({ type, context });
            setShowAIChat(true);
            onLogAI(type, context);
        },
        [onLogAI]
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <PrismaticCard className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        {/* Issue Link */}
                        <a
                            href={issue.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="issue-link"
                            className="flex items-center gap-2 text-sm font-medium text-[var(--ember)] hover:underline mb-2"
                        >
                            {issue.repository.fullName} #{issue.number}
                            <ExternalLink size={ICON_SIZES.xs} />
                        </a>

                        <h1 className="text-xl font-black text-[var(--forge-text-primary)] mb-2">
                            {issue.title}
                        </h1>

                        {/* Status Badge */}
                        <div className="flex items-center gap-3">
                            <span
                                className={cn(
                                    "px-3 py-1 rounded-full text-sm font-medium capitalize",
                                    STATUS_COLORS[status].bg,
                                    STATUS_COLORS[status].text
                                )}
                            >
                                {status.replace("_", " ")}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-[var(--forge-text-muted)]">
                                <Clock size={ICON_SIZES.sm} />
                                {analyzedIssue.estimatedHours}h estimated
                            </span>
                        </div>
                    </div>

                    {/* Progress Circle */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-20 h-20">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    className="text-[var(--forge-border-subtle)]"
                                />
                                <motion.circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    className="text-[var(--ember)]"
                                    initial={prefersReducedMotion ? false : { pathLength: 0 }}
                                    animate={{ pathLength: overallProgress / 100 }}
                                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
                                    style={{
                                        strokeDasharray: 226,
                                        strokeDashoffset: 0,
                                    }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-black text-[var(--forge-text-primary)]">
                                    {overallProgress}%
                                </span>
                            </div>
                        </div>
                        <span className="text-xs text-[var(--forge-text-muted)] mt-1">Progress</span>
                    </div>
                </div>

                {/* Pull Request Info */}
                {pullRequest && (
                    <div className="mt-4 p-4 rounded-xl bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]">
                        <div className="flex items-center justify-between">
                            <a
                                href={pullRequest.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid="pr-link"
                                className="flex items-center gap-2 font-medium text-[var(--ember)] hover:underline"
                            >
                                <GitPullRequest size={ICON_SIZES.md} />
                                PR #{pullRequest.number}: {pullRequest.title}
                                <ExternalLink size={ICON_SIZES.xs} />
                            </a>
                            <span
                                className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium capitalize",
                                    pullRequest.state === "merged"
                                        ? "bg-[var(--ember)]/10 text-[var(--ember)]"
                                        : pullRequest.state === "closed"
                                        ? "bg-[var(--forge-error)]/10 text-[var(--forge-error)]"
                                        : "bg-[var(--forge-success)]/10 text-[var(--forge-success)]"
                                )}
                            >
                                {pullRequest.state}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-[var(--forge-text-muted)]">
                            <span>+{pullRequest.additions} / -{pullRequest.deletions}</span>
                            <span>{pullRequest.filesChanged} files</span>
                            <span>{pullRequest.commentsCount} comments</span>
                        </div>
                    </div>
                )}

                {/* Link PR Button */}
                {!pullRequest && status === "in_progress" && onLinkPR && (
                    <button
                        onClick={onLinkPR}
                        data-testid="link-pr-btn"
                        className="mt-4 w-full py-3 border-2 border-dashed border-[var(--forge-border-default)] rounded-xl text-[var(--forge-text-secondary)] font-medium hover:border-[var(--ember)] hover:text-[var(--ember)] transition-colors flex items-center justify-center gap-2"
                    >
                        <GitPullRequest size={ICON_SIZES.md} />
                        Link Pull Request
                    </button>
                )}
            </PrismaticCard>

            {/* Success Outcome */}
            {outcome && outcome.success && (
                <PrismaticCard glowColor="emerald" className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[var(--forge-success)]/10 rounded-2xl flex items-center justify-center">
                            <GitMerge size={ICON_SIZES.lg} className="text-[var(--forge-success)]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-[var(--forge-text-primary)]">
                                Contribution Merged!
                            </h2>
                            <p className="text-sm text-[var(--forge-success)]">
                                Your code is now part of {issue.repository.name}
                            </p>
                        </div>
                    </div>

                    {/* Skills Demonstrated */}
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                            Skills Demonstrated
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {outcome.skillsDemonstrated.map((skill, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-[var(--forge-success)]/10 text-[var(--forge-success)] text-sm font-medium rounded-full"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Badge Earned */}
                    {outcome.badgeEarned && (
                        <div className="p-4 rounded-xl bg-[var(--forge-warning)]/10 border border-[var(--forge-border-subtle)] flex items-center gap-3">
                            <div className="w-12 h-12 bg-[var(--forge-warning)]/10 rounded-2xl flex items-center justify-center">
                                <Award size={ICON_SIZES.lg} className="text-[var(--forge-warning)]" />
                            </div>
                            <div>
                                <h4 className="font-bold text-[var(--forge-text-primary)]">
                                    {outcome.badgeEarned.name}
                                </h4>
                                <p className="text-sm text-[var(--forge-text-secondary)]">
                                    {outcome.badgeEarned.description}
                                </p>
                            </div>
                        </div>
                    )}
                </PrismaticCard>
            )}

            {/* Learning Path Phases */}
            <PrismaticCard className="p-6">
                <h2 className="text-lg font-bold text-[var(--forge-text-primary)] mb-4">
                    Learning Path
                </h2>

                <div className="space-y-3">
                    {learningPath.phases.map((phase, index) => {
                        const progress = phaseProgress.find((p) => p.phaseId === phase.id);
                        const isExpanded = expandedPhase === phase.id;
                        const isActive = progress?.status === "in_progress";
                        const isCompleted = progress?.status === "completed";

                        return (
                            <PhaseCard
                                key={phase.id}
                                phase={phase}
                                progress={progress}
                                isExpanded={isExpanded}
                                isActive={isActive}
                                isCompleted={isCompleted}
                                onToggle={() => setExpandedPhase(isExpanded ? null : phase.id)}
                                onCompleteTask={(taskId) => onCompleteTask(phase.id, taskId)}
                                onRequestAI={handleRequestAI}
                            />
                        );
                    })}
                </div>
            </PrismaticCard>

            {/* Checkpoints */}
            <PrismaticCard className="p-6">
                <h2 className="text-lg font-bold text-[var(--forge-text-primary)] mb-4">
                    Checkpoints
                </h2>

                <div className="space-y-4">
                    {learningPath.checkpoints.map((checkpoint) => (
                        <CheckpointCard key={checkpoint.id} checkpoint={checkpoint} />
                    ))}
                </div>
            </PrismaticCard>

            {/* AI Chat Modal */}
            {showAIChat && aiContext && (
                <AIAssistanceModal
                    type={aiContext.type}
                    context={aiContext.context}
                    onClose={() => setShowAIChat(false)}
                    onRate={onRateAI}
                />
            )}
        </div>
    );
};

// ============================================================================
// PHASE CARD
// ============================================================================

interface PhaseCardProps {
    phase: LearningPhase;
    progress?: { status: string; tasksCompleted: number; totalTasks: number };
    isExpanded: boolean;
    isActive: boolean;
    isCompleted: boolean;
    onToggle: () => void;
    onCompleteTask: (taskId: string) => void;
    onRequestAI: (type: AIAssistanceType, context: string) => void;
}

const PhaseCard = ({
    phase,
    progress,
    isExpanded,
    isActive,
    isCompleted,
    onToggle,
    onCompleteTask,
    onRequestAI,
}: PhaseCardProps) => {
    const prefersReducedMotion = useReducedMotion();
    const Icon = PHASE_ICONS[phase.type] || BookOpen;

    return (
        <div
            className={cn(
                "rounded-xl border transition-all",
                isActive
                    ? "border-[var(--ember)] bg-[var(--ember)]/5"
                    : isCompleted
                    ? "border-[var(--forge-success)] bg-[var(--forge-success)]/5"
                    : "border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]"
            )}
        >
            {/* Phase Header */}
            <button
                onClick={onToggle}
                data-testid={`phase-${phase.id}-btn`}
                className="w-full p-4 flex items-center gap-3 text-left"
            >
                {/* Status Icon */}
                <div
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isCompleted
                            ? "bg-[var(--forge-success)]/10"
                            : isActive
                            ? "bg-[var(--ember)]/10"
                            : "bg-[var(--forge-bg-anvil)]"
                    )}
                >
                    {isCompleted ? (
                        <CheckCircle2 size={ICON_SIZES.md} className="text-[var(--forge-success)]" />
                    ) : isActive ? (
                        <PlayCircle size={ICON_SIZES.md} className="text-[var(--ember)]" />
                    ) : (
                        <Icon size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
                    )}
                </div>

                {/* Phase Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3
                            className={cn(
                                "font-semibold",
                                isCompleted
                                    ? "text-[var(--forge-success)]"
                                    : isActive
                                    ? "text-[var(--ember)]"
                                    : "text-[var(--forge-text-secondary)]"
                            )}
                        >
                            {phase.title}
                        </h3>
                        {isActive && (
                            <span className="px-2 py-0.5 bg-gradient-forge text-white text-xs font-medium rounded-full shadow-ember-sm">
                                Current
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[var(--forge-text-muted)] mt-1">
                        <span>
                            {progress?.tasksCompleted || 0}/{progress?.totalTasks || phase.tasks.length} tasks
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={ICON_SIZES.xs} />
                            {phase.estimatedHours}h
                        </span>
                    </div>
                </div>

                {/* Expand Icon */}
                {isExpanded ? (
                    <ChevronDown size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
                ) : (
                    <ChevronRight size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
                )}
            </button>

            {/* Phase Content */}
            {isExpanded && (
                <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-4 pb-4"
                >
                    <p className="text-sm text-[var(--forge-text-secondary)] mb-4">{phase.description}</p>

                    {/* Tasks */}
                    <div className="space-y-2">
                        {phase.tasks.map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onComplete={() => onCompleteTask(task.id)}
                                onRequestAI={(type) => onRequestAI(type, `${phase.title}: ${task.title}`)}
                            />
                        ))}
                    </div>

                    {/* Mentorship Prompts */}
                    {phase.mentorshipPrompts.length > 0 && (
                        <div className="mt-4 p-3 rounded-xl bg-[var(--ember)]/5 border border-[var(--forge-border-subtle)]">
                            <h4 className="flex items-center gap-2 text-sm font-medium text-[var(--ember)] mb-2">
                                <Bot size={ICON_SIZES.sm} />
                                Ask AI Mentor
                            </h4>
                            <div className="space-y-1">
                                {phase.mentorshipPrompts.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onRequestAI("approach_guidance", prompt)}
                                        data-testid={`mentor-prompt-${i}-btn`}
                                        className="w-full text-left text-sm text-[var(--forge-text-secondary)] hover:text-[var(--ember)] transition-colors"
                                    >
                                        "{prompt}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

// ============================================================================
// TASK ITEM
// ============================================================================

interface TaskItemProps {
    task: PhaseTask;
    onComplete: () => void;
    onRequestAI: (type: AIAssistanceType) => void;
}

const TaskItem = ({ task, onComplete, onRequestAI }: TaskItemProps) => {
    return (
        <div
            className={cn(
                "p-3 rounded-xl flex items-start gap-3",
                task.completed
                    ? "bg-[var(--forge-success)]/5"
                    : "bg-[var(--forge-bg-workshop)]"
            )}
        >
            <button
                onClick={onComplete}
                disabled={task.completed}
                data-testid={`task-${task.id}-btn`}
                className="flex-shrink-0 mt-0.5"
            >
                {task.completed ? (
                    <CheckCircle2 size={ICON_SIZES.md} className="text-[var(--forge-success)]" />
                ) : (
                    <Circle
                        size={ICON_SIZES.md}
                        className="text-[var(--forge-border-default)] hover:text-[var(--ember)] transition-colors"
                    />
                )}
            </button>

            <div className="flex-1 min-w-0">
                <h4
                    className={cn(
                        "font-medium",
                        task.completed
                            ? "text-[var(--forge-success)] line-through"
                            : "text-[var(--forge-text-primary)]"
                    )}
                >
                    {task.title}
                </h4>
                <p className="text-sm text-[var(--forge-text-muted)] mt-0.5">{task.description}</p>

                {/* Resources */}
                {task.resources && task.resources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {task.resources.map((resource, i) => (
                            <a
                                key={i}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[var(--ember)] hover:underline flex items-center gap-1"
                            >
                                <ExternalLink size={10} />
                                {resource.title}
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Assistance Button */}
            {task.aiAssistanceType && !task.completed && (
                <button
                    onClick={() => onRequestAI(task.aiAssistanceType!)}
                    data-testid={`ai-assist-${task.id}-btn`}
                    className="flex-shrink-0 p-2 rounded-lg bg-[var(--ember)]/10 text-[var(--ember)] hover:bg-[var(--ember)]/20 transition-colors"
                    title="Get AI assistance"
                >
                    <Bot size={ICON_SIZES.sm} />
                </button>
            )}
        </div>
    );
};

// ============================================================================
// CHECKPOINT CARD
// ============================================================================

interface CheckpointCardProps {
    checkpoint: LearningCheckpoint;
}

const CheckpointCard = ({ checkpoint }: CheckpointCardProps) => {
    return (
        <div
            className={cn(
                "p-4 rounded-xl border",
                checkpoint.passed
                    ? "border-[var(--forge-success)] bg-[var(--forge-success)]/5"
                    : "border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]"
            )}
        >
            <div className="flex items-center gap-3 mb-3">
                {checkpoint.passed ? (
                    <CheckCircle2 size={ICON_SIZES.md} className="text-[var(--forge-success)]" />
                ) : (
                    <Circle size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
                )}
                <h3
                    className={cn(
                        "font-semibold",
                        checkpoint.passed
                            ? "text-[var(--forge-success)]"
                            : "text-[var(--forge-text-primary)]"
                    )}
                >
                    {checkpoint.title}
                </h3>
            </div>

            <div className="ml-8">
                <h4 className="text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                    Verification Criteria
                </h4>
                <ul className="space-y-1 mb-3">
                    {checkpoint.verificationCriteria.map((criteria, i) => (
                        <li key={i} className="text-sm text-[var(--forge-text-secondary)] flex items-start gap-2">
                            <span className="text-[var(--forge-text-muted)] mt-1">•</span>
                            {criteria}
                        </li>
                    ))}
                </ul>

                <h4 className="text-sm font-medium text-[var(--forge-text-secondary)] mb-2">Self Assessment</h4>
                <ul className="space-y-1">
                    {checkpoint.selfAssessment.map((question, i) => (
                        <li key={i} className="text-sm text-[var(--ember)] italic">
                            {question}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// ============================================================================
// AI ASSISTANCE MODAL
// ============================================================================

interface AIAssistanceModalProps {
    type: AIAssistanceType;
    context: string;
    onClose: () => void;
    onRate: (logId: string, wasHelpful: boolean) => void;
}

const AIAssistanceModal = ({ type, context, onClose, onRate }: AIAssistanceModalProps) => {
    const [rated, setRated] = useState(false);

    const handleRate = (helpful: boolean) => {
        onRate("current", helpful);
        setRated(true);
    };

    const getAIResponse = (type: AIAssistanceType, context: string): string => {
        const responses: Record<AIAssistanceType, string> = {
            code_explanation:
                "Let me explain this code for you. The implementation follows a common pattern where... [AI would provide detailed explanation based on actual code context]",
            approach_guidance:
                "Here's how I'd approach this task:\n\n1. First, understand the existing implementation\n2. Identify the specific changes needed\n3. Write tests first (TDD approach)\n4. Implement incrementally\n5. Review and refactor",
            code_review:
                "I've reviewed your code. Here are my observations:\n\n✓ Good: Clean structure and naming\n⚠ Consider: Adding error handling for edge cases\n📝 Suggestion: Extract this logic into a helper function",
            debugging_help:
                "Let's debug this together:\n\n1. Check the error message carefully\n2. Add logging to trace the flow\n3. Verify input data is correct\n4. Look for common issues like null/undefined",
            best_practices:
                "Here are some best practices for this task:\n\n• Follow the project's existing patterns\n• Write clear, descriptive commit messages\n• Add tests for your changes\n• Update documentation if needed",
        };

        return responses[type];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-[var(--forge-bg-workshop)] rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 border-b border-[var(--forge-border-subtle)] flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--ember)]/10 rounded-xl flex items-center justify-center">
                        <Bot size={ICON_SIZES.md} className="text-[var(--ember)]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--forge-text-primary)]">AI Mentor</h3>
                        <p className="text-sm text-[var(--forge-text-muted)]">{context}</p>
                    </div>
                </div>

                {/* Response */}
                <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert">
                        <pre className="whitespace-pre-wrap text-sm text-[var(--forge-text-secondary)] bg-[var(--forge-bg-elevated)] p-4 rounded-xl">
                            {getAIResponse(type, context)}
                        </pre>
                    </div>
                </div>

                {/* Rating */}
                {!rated && (
                    <div className="p-4 border-t border-[var(--forge-border-subtle)]">
                        <p className="text-sm text-[var(--forge-text-secondary)] mb-3">Was this helpful?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleRate(true)}
                                data-testid="rate-helpful-btn"
                                className="flex-1 py-2 bg-[var(--forge-success)]/10 text-[var(--forge-success)] rounded-xl font-medium hover:bg-[var(--forge-success)]/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <ThumbsUp size={ICON_SIZES.sm} />
                                Yes
                            </button>
                            <button
                                onClick={() => handleRate(false)}
                                data-testid="rate-not-helpful-btn"
                                className="flex-1 py-2 bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] rounded-xl font-medium hover:bg-[var(--forge-bg-anvil)] transition-colors flex items-center justify-center gap-2"
                            >
                                <ThumbsDown size={ICON_SIZES.sm} />
                                No
                            </button>
                        </div>
                    </div>
                )}

                {rated && (
                    <div className="p-4 border-t border-[var(--forge-border-subtle)] text-center">
                        <p className="text-sm text-[var(--forge-success)]">
                            Thanks for your feedback!
                        </p>
                    </div>
                )}

                {/* Close Button */}
                <div className="p-4 border-t border-[var(--forge-border-subtle)]">
                    <button
                        onClick={onClose}
                        data-testid="close-ai-modal-btn"
                        className="w-full py-3 bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] font-medium rounded-xl hover:bg-[var(--forge-bg-anvil)] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ContributionTracker;
