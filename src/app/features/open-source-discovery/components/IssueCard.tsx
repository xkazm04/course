"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GitPullRequest,
    MessageSquare,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Sparkles,
    AlertCircle,
    BookOpen,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { DiscoverableIssue } from "../lib/types";
import { TaskComplexityBadge, ComplexityBar } from "./TaskComplexityBadge";

interface IssueCardProps {
    issue: DiscoverableIssue;
    matchScore?: number;
    stretchOpportunities?: string[];
    onClaim?: (issue: DiscoverableIssue) => void;
    onViewDetails?: (issue: DiscoverableIssue) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({
    issue,
    matchScore,
    stretchOpportunities = [],
    onClaim,
    onViewDetails,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasGoodFirstIssue = issue.labels.includes("good first issue");
    const timeAgo = getTimeAgo(new Date(issue.updatedAt));

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-elevated)] overflow-hidden",
                elevation.hoverable
            )}
        >
            {/* Header */}
            <div className="p-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-[var(--forge-text-muted)]">
                                {issue.repositoryOwner}/{issue.repositoryName}
                            </span>
                            {matchScore !== undefined && (
                                <span className={cn(
                                    "text-xs font-medium px-1.5 py-0.5 rounded",
                                    matchScore >= 70 ? "bg-[var(--forge-success)]/20 text-[var(--forge-success)]" :
                                    matchScore >= 50 ? "bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]" :
                                    "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
                                )}>
                                    {matchScore}% match
                                </span>
                            )}
                        </div>
                        <h3 className="font-semibold text-[var(--forge-text-primary)] line-clamp-2">
                            {issue.title}
                        </h3>
                    </div>
                    <TaskComplexityBadge
                        complexity={issue.analysis.complexity}
                        estimatedHours={issue.analysis.estimatedHours}
                        size="sm"
                    />
                </div>

                {/* Labels */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {hasGoodFirstIssue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--forge-success)]/20 text-[var(--forge-success)]">
                            <Sparkles size={ICON_SIZES.xs} />
                            Good First Issue
                        </span>
                    )}
                    {issue.labels
                        .filter(l => l !== "good first issue")
                        .slice(0, 3)
                        .map(label => (
                            <span
                                key={label}
                                className="px-2 py-0.5 rounded-full text-xs bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)]"
                            >
                                {label}
                            </span>
                        ))}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--forge-text-muted)]">
                    <span className="flex items-center gap-1">
                        <MessageSquare size={ICON_SIZES.xs} />
                        {issue.commentCount} comments
                    </span>
                    <span>Updated {timeAgo}</span>
                </div>
            </div>

            {/* Expandable Details */}
            <div className="border-t border-[var(--forge-border-subtle)]">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full px-4 py-2 flex items-center justify-between text-sm text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)] transition-colors"
                >
                    <span>View analysis & skills</span>
                    {isExpanded ? (
                        <ChevronUp size={ICON_SIZES.sm} />
                    ) : (
                        <ChevronDown size={ICON_SIZES.sm} />
                    )}
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
                            <IssueAnalysisDetails
                                issue={issue}
                                stretchOpportunities={stretchOpportunities}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 p-3 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-workshop)]">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onClaim?.(issue)}
                    className={cn(
                        "flex-1 px-4 py-2 rounded-lg font-medium text-sm",
                        "bg-[var(--ember)] text-white",
                        "hover:brightness-110 transition-colors"
                    )}
                >
                    Start Contributing
                </motion.button>
                <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "p-2 rounded-lg border border-[var(--forge-border-default)]",
                        "hover:bg-[var(--forge-bg-elevated)] transition-colors",
                        "text-[var(--forge-text-secondary)]"
                    )}
                >
                    <ExternalLink size={ICON_SIZES.md} />
                </motion.a>
            </div>
        </motion.div>
    );
};

// Analysis details sub-component
interface IssueAnalysisDetailsProps {
    issue: DiscoverableIssue;
    stretchOpportunities: string[];
}

const IssueAnalysisDetails: React.FC<IssueAnalysisDetailsProps> = ({
    issue,
    stretchOpportunities,
}) => {
    const { analysis } = issue;

    return (
        <div className="px-4 pb-4 space-y-4">
            {/* Complexity visualization */}
            <div>
                <h4 className="text-xs font-medium text-[var(--forge-text-muted)] uppercase mb-2">
                    Complexity Analysis
                </h4>
                <ComplexityBar
                    complexity={analysis.complexity}
                    confidence={analysis.confidence}
                />
            </div>

            {/* Required skills */}
            <div>
                <h4 className="text-xs font-medium text-[var(--forge-text-muted)] uppercase mb-2">
                    Required Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                    {analysis.requiredSkills.map(skill => (
                        <div
                            key={skill.skillId}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs",
                                skill.isStretch
                                    ? "bg-[var(--ember)]/20 text-[var(--ember)] border border-[var(--ember)]/30"
                                    : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)]"
                            )}
                        >
                            <span className="font-medium">{skill.skillName}</span>
                            <span className="opacity-60">({skill.level})</span>
                            {skill.isStretch && (
                                <Sparkles size={ICON_SIZES.xs} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Learning opportunities */}
            {analysis.learningOpportunities.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-[var(--forge-text-muted)] uppercase mb-2 flex items-center gap-1">
                        <BookOpen size={ICON_SIZES.xs} />
                        What You'll Learn
                    </h4>
                    <ul className="space-y-1">
                        {analysis.learningOpportunities.map((opp, index) => (
                            <li key={index} className="text-sm text-[var(--forge-text-secondary)] flex items-start gap-2">
                                <span className="text-[var(--forge-success)] mt-1">+</span>
                                {opp}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Suggested approach */}
            <div>
                <h4 className="text-xs font-medium text-[var(--forge-text-muted)] uppercase mb-2">
                    Suggested Approach
                </h4>
                <p className="text-sm text-[var(--forge-text-secondary)]">
                    {analysis.suggestedApproach}
                </p>
            </div>

            {/* Potential blockers */}
            {analysis.potentialBlockers.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-[var(--forge-warning)] uppercase mb-2 flex items-center gap-1">
                        <AlertCircle size={ICON_SIZES.xs} />
                        Potential Blockers
                    </h4>
                    <ul className="space-y-1">
                        {analysis.potentialBlockers.map((blocker, index) => (
                            <li key={index} className="text-sm text-[var(--forge-text-muted)] flex items-start gap-2">
                                <span className="text-[var(--forge-warning)]">!</span>
                                {blocker}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}
