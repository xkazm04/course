"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Bug,
    AlertTriangle,
    Sparkles,
    Shield,
    Zap,
    FileCode,
    CheckCircle,
    XCircle,
    Archive,
    ChevronDown,
    ChevronUp,
    Clock,
    MapPin,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

// Challenge types
interface ChallengeLocation {
    file: string;
    startLine: number;
    endLine: number;
}

interface Challenge {
    id: string;
    project_id: string;
    type: "bug" | "smell" | "missing_feature" | "security" | "performance";
    severity: "low" | "medium" | "high" | "critical";
    difficulty: "beginner" | "intermediate" | "advanced";
    title: string;
    description: string;
    location: ChallengeLocation;
    code_snippet?: string;
    context_before?: string;
    context_after?: string;
    user_instructions: string;
    expected_output: string;
    hints?: string[];
    tags?: string[];
    estimated_minutes?: number;
    status: "pending" | "approved" | "rejected" | "archived";
    created_at: string;
    project?: {
        id: string;
        name: string;
        language: string;
        framework?: string;
    };
}

interface ChallengeReviewCardProps {
    challenge: Challenge;
    onApprove: (id: string, notes?: string) => Promise<void>;
    onReject: (id: string, notes?: string) => Promise<void>;
    onArchive: (id: string) => Promise<void>;
}

const TYPE_CONFIG = {
    bug: { icon: Bug, color: "text-red-400", bg: "bg-red-500/10", label: "Bug" },
    smell: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", label: "Code Smell" },
    missing_feature: { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10", label: "Missing Feature" },
    security: { icon: Shield, color: "text-red-500", bg: "bg-red-500/20", label: "Security" },
    performance: { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Performance" },
};

const SEVERITY_CONFIG = {
    low: { color: "text-blue-400", bg: "bg-blue-500/10" },
    medium: { color: "text-amber-400", bg: "bg-amber-500/10" },
    high: { color: "text-orange-400", bg: "bg-orange-500/10" },
    critical: { color: "text-red-400", bg: "bg-red-500/10" },
};

const DIFFICULTY_CONFIG = {
    beginner: { color: "text-emerald-400", bg: "bg-emerald-500/10" },
    intermediate: { color: "text-amber-400", bg: "bg-amber-500/10" },
    advanced: { color: "text-red-400", bg: "bg-red-500/10" },
};

export const ChallengeReviewCard: React.FC<ChallengeReviewCardProps> = ({
    challenge,
    onApprove,
    onReject,
    onArchive,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [reviewNotes, setReviewNotes] = useState("");

    const typeConfig = TYPE_CONFIG[challenge.type];
    const severityConfig = SEVERITY_CONFIG[challenge.severity];
    const difficultyConfig = DIFFICULTY_CONFIG[challenge.difficulty];
    const TypeIcon = typeConfig.icon;

    const handleAction = async (action: "approve" | "reject" | "archive") => {
        setIsLoading(true);
        try {
            if (action === "approve") {
                await onApprove(challenge.id, reviewNotes);
            } else if (action === "reject") {
                await onReject(challenge.id, reviewNotes);
            } else {
                await onArchive(challenge.id);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            layout
            className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] overflow-hidden"
        >
            {/* Header */}
            <div
                className="p-4 cursor-pointer hover:bg-[var(--surface-overlay)] transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className={cn("p-2 rounded-lg", typeConfig.bg)}>
                        <TypeIcon size={ICON_SIZES.md} className={typeConfig.color} />
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-[var(--text-primary)] truncate">
                                {challenge.title}
                            </h3>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className={cn("px-2 py-0.5 rounded", typeConfig.bg, typeConfig.color)}>
                                {typeConfig.label}
                            </span>
                            <span className={cn("px-2 py-0.5 rounded capitalize", severityConfig.bg, severityConfig.color)}>
                                {challenge.severity}
                            </span>
                            <span className={cn("px-2 py-0.5 rounded capitalize", difficultyConfig.bg, difficultyConfig.color)}>
                                {challenge.difficulty}
                            </span>
                            {challenge.estimated_minutes && (
                                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                                    <Clock size={ICON_SIZES.xs} />
                                    {challenge.estimated_minutes}m
                                </span>
                            )}
                        </div>

                        {challenge.project && (
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                {challenge.project.name} ({challenge.project.language})
                            </p>
                        )}
                    </div>

                    {/* Expand Toggle */}
                    <div className="text-[var(--text-muted)]">
                        {isExpanded ? (
                            <ChevronUp size={ICON_SIZES.md} />
                        ) : (
                            <ChevronDown size={ICON_SIZES.md} />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-[var(--border-subtle)]"
                >
                    <div className="p-4 space-y-4">
                        {/* Description */}
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
                                Description
                            </h4>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {challenge.description}
                            </p>
                        </div>

                        {/* Location */}
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2 flex items-center gap-1">
                                <MapPin size={ICON_SIZES.xs} />
                                Location
                            </h4>
                            <div className="flex items-center gap-2 text-sm">
                                <FileCode size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                                <code className="text-[var(--accent-primary)]">
                                    {challenge.location.file}:{challenge.location.startLine}-{challenge.location.endLine}
                                </code>
                            </div>
                        </div>

                        {/* Code Snippet */}
                        {challenge.code_snippet && (
                            <div>
                                <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
                                    Code Snippet
                                </h4>
                                <pre className="p-3 rounded-lg bg-[var(--surface-base)] border border-[var(--border-subtle)] text-xs overflow-x-auto">
                                    <code className="text-[var(--text-secondary)]">
                                        {challenge.code_snippet}
                                    </code>
                                </pre>
                            </div>
                        )}

                        {/* Instructions */}
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
                                User Instructions
                            </h4>
                            <div className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                                {challenge.user_instructions}
                            </div>
                        </div>

                        {/* Expected Output */}
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
                                Expected Output
                            </h4>
                            <div className="text-sm text-[var(--text-secondary)]">
                                {challenge.expected_output}
                            </div>
                        </div>

                        {/* Hints */}
                        {challenge.hints && challenge.hints.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
                                    Hints ({challenge.hints.length})
                                </h4>
                                <ul className="space-y-1">
                                    {challenge.hints.map((hint, i) => (
                                        <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                                            <span className="text-[var(--text-muted)]">{i + 1}.</span>
                                            {hint}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Tags */}
                        {challenge.tags && challenge.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {challenge.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-0.5 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Review Notes */}
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
                                Review Notes (Optional)
                            </h4>
                            <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add notes about this review decision..."
                                className="w-full p-2 rounded-lg bg-[var(--surface-base)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none"
                                rows={2}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={() => handleAction("approve")}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            >
                                <CheckCircle size={ICON_SIZES.sm} />
                                Approve
                            </button>
                            <button
                                onClick={() => handleAction("reject")}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                <XCircle size={ICON_SIZES.sm} />
                                Reject
                            </button>
                            <button
                                onClick={() => handleAction("archive")}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-overlay)] text-[var(--text-secondary)] font-medium hover:bg-[var(--surface-base)] transition-colors disabled:opacity-50"
                            >
                                <Archive size={ICON_SIZES.sm} />
                                Archive
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};
