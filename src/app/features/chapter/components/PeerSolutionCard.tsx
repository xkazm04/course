/**
 * Peer Solution Card Component
 *
 * Displays a peer-submitted solution with upvoting and helpfulness indicators.
 * Part of the AI Learning Conductor's collective intelligence system.
 */

"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ThumbsUp,
    User,
    Code,
    MessageSquare,
    Lightbulb,
    Bug,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    Star,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { PeerSolution, LearnerConfidence } from "../lib/conductorTypes";

// ============================================================================
// Types
// ============================================================================

export interface PeerSolutionCardProps {
    solution: PeerSolution;
    onUpvote?: (solutionId: string) => void;
    onView?: (solutionId: string) => void;
    compact?: boolean;
    className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

const SolutionTypeIcon: React.FC<{ type: PeerSolution["solutionType"] }> = ({ type }) => {
    const iconProps = { size: 16, className: "text-[var(--forge-text-muted)]" };

    switch (type) {
        case "code":
            return <Code {...iconProps} />;
        case "explanation":
            return <MessageSquare {...iconProps} />;
        case "approach":
            return <Lightbulb {...iconProps} />;
        case "debugging":
            return <Bug {...iconProps} />;
        default:
            return <MessageSquare {...iconProps} />;
    }
};

const ConfidenceBadge: React.FC<{ level: LearnerConfidence }> = ({ level }) => {
    const styles: Record<LearnerConfidence, { bg: string; text: string; label: string }> = {
        low: { bg: "bg-[var(--forge-bg-elevated)]", text: "text-[var(--forge-text-secondary)]", label: "Beginner" },
        moderate: { bg: "bg-[var(--forge-info)]/20", text: "text-[var(--forge-info)]", label: "Intermediate" },
        high: { bg: "bg-[var(--ember-glow)]/20", text: "text-[var(--ember-glow)]", label: "Advanced" },
        expert: { bg: "bg-[var(--ember)]/30", text: "text-[var(--ember)]", label: "Expert" },
    };

    const style = styles[level];

    return (
        <span
            className={cn(
                "px-2 py-0.5 text-xs rounded-full flex items-center gap-1",
                style.bg,
                style.text
            )}
            data-testid="peer-solution-confidence-badge"
        >
            {level === "expert" && <Star size={10} className="fill-current" />}
            {style.label}
        </span>
    );
};

// ============================================================================
// Main Component
// ============================================================================

export function PeerSolutionCard({
    solution,
    onUpvote,
    onView,
    compact = false,
    className,
}: PeerSolutionCardProps) {
    const [isExpanded, setIsExpanded] = useState(!compact);
    const [hasUpvoted, setHasUpvoted] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleUpvote = useCallback(() => {
        if (hasUpvoted) return;
        setHasUpvoted(true);
        onUpvote?.(solution.id);
    }, [hasUpvoted, onUpvote, solution.id]);

    const handleExpand = useCallback(() => {
        setIsExpanded((prev) => !prev);
        if (!isExpanded) {
            onView?.(solution.id);
        }
    }, [isExpanded, onView, solution.id]);

    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(solution.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [solution.content]);

    const formattedDate = new Date(solution.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });

    return (
        <motion.div
            layout
            className={cn(
                "bg-[var(--forge-bg-anvil)]/50 border border-[var(--forge-border-subtle)] rounded-lg overflow-hidden",
                "hover:border-[var(--forge-border-default)] transition-colors",
                className
            )}
            data-testid={`peer-solution-card-${solution.id}`}
        >
            {/* Header */}
            <button
                onClick={handleExpand}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
                data-testid={`peer-solution-expand-btn-${solution.id}`}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-[var(--forge-bg-elevated)]/50 rounded-lg">
                        <SolutionTypeIcon type={solution.solutionType} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[var(--forge-text-secondary)] truncate">
                                {getSolutionTitle(solution)}
                            </span>
                            <ConfidenceBadge level={solution.authorLevel} />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[var(--forge-text-muted)] mt-0.5">
                            <User size={12} />
                            <span>Anonymous Learner</span>
                            <span>•</span>
                            <span>{formattedDate}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Helpfulness indicator */}
                    <div
                        className="flex items-center gap-1 text-xs"
                        data-testid={`peer-solution-helpfulness-${solution.id}`}
                    >
                        <div
                            className={cn(
                                "w-2 h-2 rounded-full",
                                solution.helpfulnessScore >= 0.8
                                    ? "bg-[var(--forge-success)]"
                                    : solution.helpfulnessScore >= 0.5
                                    ? "bg-[var(--forge-warning)]"
                                    : "bg-[var(--forge-text-muted)]"
                            )}
                        />
                        <span className="text-[var(--forge-text-muted)]">
                            {Math.round(solution.helpfulnessScore * 100)}% helpful
                        </span>
                    </div>

                    {/* Expand/collapse indicator */}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown size={18} className="text-[var(--forge-text-muted)]" />
                    </motion.div>
                </div>
            </button>

            {/* Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="px-4 pb-4">
                            {/* Solution content */}
                            <div
                                className={cn(
                                    "p-3 rounded-lg text-sm",
                                    solution.solutionType === "code"
                                        ? "bg-[var(--forge-bg-void)] font-mono text-[var(--forge-text-secondary)]"
                                        : "bg-[var(--forge-bg-elevated)]/30 text-[var(--forge-text-secondary)]"
                                )}
                                data-testid={`peer-solution-content-${solution.id}`}
                            >
                                <pre className="whitespace-pre-wrap break-words">
                                    {solution.content}
                                </pre>
                            </div>

                            {/* Tags */}
                            {solution.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {solution.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-0.5 text-xs bg-[var(--forge-bg-elevated)]/50 text-[var(--forge-text-muted)] rounded"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--forge-border-subtle)]">
                                <button
                                    onClick={handleUpvote}
                                    disabled={hasUpvoted}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                                        hasUpvoted
                                            ? "bg-[var(--forge-success)]/20 text-[var(--forge-success)]"
                                            : "bg-[var(--forge-bg-elevated)]/50 text-[var(--forge-text-muted)] hover:bg-[var(--forge-bg-elevated)] hover:text-[var(--forge-text-secondary)]"
                                    )}
                                    data-testid={`peer-solution-upvote-btn-${solution.id}`}
                                >
                                    <ThumbsUp size={14} className={hasUpvoted ? "fill-current" : ""} />
                                    <span>{solution.upvotes + (hasUpvoted ? 1 : 0)}</span>
                                    {hasUpvoted && <span className="text-xs">Thanks!</span>}
                                </button>

                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-[var(--forge-bg-elevated)]/50 text-[var(--forge-text-muted)] hover:bg-[var(--forge-bg-elevated)] hover:text-[var(--forge-text-secondary)] transition-colors"
                                    data-testid={`peer-solution-copy-btn-${solution.id}`}
                                >
                                    {copied ? (
                                        <>
                                            <Check size={14} />
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getSolutionTitle(solution: PeerSolution): string {
    const typeLabels: Record<PeerSolution["solutionType"], string> = {
        code: "Code Solution",
        explanation: "Explanation",
        approach: "Alternative Approach",
        debugging: "Debug Tip",
    };

    return typeLabels[solution.solutionType] || "Solution";
}

export default PeerSolutionCard;
