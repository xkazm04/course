"use client";

import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GitPullRequest,
    ExternalLink,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Trophy,
    GitBranch,
    Copy,
    Check,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { PRStatusResponse, PRStatus } from "../lib/useChapterHomework";

// ============================================================================
// Types
// ============================================================================

interface PRStatusIndicatorProps {
    prStatus: PRStatusResponse | null;
    branchName: string | null;
    repoUrl: string | null;
    defaultBranch: string | null;
    isChecking: boolean;
    onRefresh: () => void;
    variant?: "full" | "compact" | "badge";
    className?: string;
}

interface StatusConfig {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

// ============================================================================
// Status Configuration
// ============================================================================

const statusConfigs: Record<PRStatus, StatusConfig> = {
    pending: {
        icon: <Clock size={14} />,
        label: "Awaiting PR",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
    },
    submitted: {
        icon: <GitPullRequest size={14} />,
        label: "PR Submitted",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
    },
    reviewing: {
        icon: <AlertCircle size={14} />,
        label: "Under Review",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
    },
    approved: {
        icon: <CheckCircle2 size={14} />,
        label: "Approved",
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
    },
    changes_requested: {
        icon: <AlertCircle size={14} />,
        label: "Changes Requested",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
    },
    winner: {
        icon: <Trophy size={14} />,
        label: "Winner!",
        color: "text-[var(--gold)]",
        bgColor: "bg-[var(--gold)]/10",
        borderColor: "border-[var(--gold)]/30",
    },
    closed: {
        icon: <XCircle size={14} />,
        label: "Closed",
        color: "text-[var(--forge-text-muted)]",
        bgColor: "bg-[var(--forge-bg-elevated)]",
        borderColor: "border-[var(--forge-border-subtle)]",
    },
};

// ============================================================================
// Component
// ============================================================================

export const PRStatusIndicator: React.FC<PRStatusIndicatorProps> = ({
    prStatus,
    branchName,
    repoUrl,
    defaultBranch,
    isChecking,
    onRefresh,
    variant = "full",
    className,
}) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopyBranch = useCallback(async () => {
        if (!branchName) return;

        try {
            await navigator.clipboard.writeText(branchName);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy branch name:", err);
        }
    }, [branchName]);

    // Determine current status
    const currentStatus: PRStatus = prStatus?.pr_status || "pending";
    const config = statusConfigs[currentStatus];
    const hasPR = prStatus?.pr_found;

    // Badge variant - minimal display
    if (variant === "badge") {
        return (
            <div
                className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                    config.color,
                    config.bgColor,
                    config.borderColor,
                    className
                )}
                data-testid="pr-status-badge"
            >
                {config.icon}
                <span>{config.label}</span>
            </div>
        );
    }

    // Compact variant - one-line with refresh
    if (variant === "compact") {
        return (
            <div
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                    config.bgColor,
                    config.borderColor,
                    className
                )}
                data-testid="pr-status-compact"
            >
                <span className={cn("flex items-center gap-1.5 text-sm", config.color)}>
                    {config.icon}
                    {config.label}
                </span>

                {hasPR && prStatus?.pr && (
                    <a
                        href={prStatus.pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
                    >
                        #{prStatus.pr.number}
                        <ExternalLink size={10} />
                    </a>
                )}

                <button
                    onClick={onRefresh}
                    disabled={isChecking}
                    className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
                    title="Refresh PR status"
                >
                    <RefreshCw
                        size={12}
                        className={cn(
                            "text-[var(--forge-text-muted)]",
                            isChecking && "animate-spin"
                        )}
                    />
                </button>
            </div>
        );
    }

    // Full variant - detailed display with instructions
    return (
        <div
            className={cn(
                "rounded-xl border overflow-hidden",
                config.bgColor,
                config.borderColor,
                className
            )}
            data-testid="pr-status-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
                <div className="flex items-center gap-2">
                    <GitPullRequest size={ICON_SIZES.md} className={config.color} />
                    <span className="font-medium text-[var(--forge-text-primary)]">
                        Pull Request Status
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                            config.color,
                            config.bgColor,
                            config.borderColor
                        )}
                    >
                        {config.icon}
                        {config.label}
                    </span>

                    <button
                        onClick={onRefresh}
                        disabled={isChecking}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="Refresh PR status"
                    >
                        <RefreshCw
                            size={14}
                            className={cn(
                                "text-[var(--forge-text-muted)]",
                                isChecking && "animate-spin"
                            )}
                        />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Branch Information */}
                {branchName && (
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider">
                            Your Branch
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--forge-bg-anvil)] font-mono text-sm">
                                <GitBranch
                                    size={14}
                                    className="text-[var(--ember)] shrink-0"
                                />
                                <span className="text-[var(--forge-text-primary)] truncate">
                                    {branchName}
                                </span>
                            </div>
                            <button
                                onClick={handleCopyBranch}
                                className="p-2 rounded-lg bg-[var(--forge-bg-anvil)] hover:bg-[var(--forge-bg-elevated)] transition-colors"
                                title="Copy branch name"
                            >
                                <AnimatePresence mode="wait">
                                    {copied ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                        >
                                            <Check size={14} className="text-green-500" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="copy"
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                        >
                                            <Copy
                                                size={14}
                                                className="text-[var(--forge-text-muted)]"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>
                )}

                {/* PR Found - Show Details */}
                {hasPR && prStatus?.pr && (
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider">
                            Your Pull Request
                        </label>
                        <a
                            href={prStatus.pr.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 rounded-lg bg-[var(--forge-bg-anvil)] hover:bg-[var(--forge-bg-elevated)] transition-colors group"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-[var(--forge-text-primary)] truncate group-hover:text-[var(--ember)]">
                                        {prStatus.pr.title}
                                    </p>
                                    <p className="text-xs text-[var(--forge-text-muted)] mt-1">
                                        #{prStatus.pr.number} opened{" "}
                                        {formatRelativeTime(prStatus.pr.created_at)}
                                    </p>
                                </div>
                                <ExternalLink
                                    size={14}
                                    className="text-[var(--forge-text-muted)] group-hover:text-[var(--ember)] shrink-0"
                                />
                            </div>

                            {/* PR Metadata */}
                            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--forge-text-muted)]">
                                <span
                                    className={cn(
                                        "px-1.5 py-0.5 rounded",
                                        prStatus.pr.draft
                                            ? "bg-yellow-500/20 text-yellow-500"
                                            : prStatus.pr.merged
                                              ? "bg-purple-500/20 text-purple-500"
                                              : prStatus.pr.state === "open"
                                                ? "bg-green-500/20 text-green-500"
                                                : "bg-red-500/20 text-red-500"
                                    )}
                                >
                                    {prStatus.pr.draft
                                        ? "Draft"
                                        : prStatus.pr.merged
                                          ? "Merged"
                                          : prStatus.pr.state}
                                </span>
                            </div>
                        </a>
                    </div>
                )}

                {/* No PR Found - Show Instructions */}
                {!hasPR && (
                    <div className="space-y-3">
                        <p className="text-sm text-[var(--forge-text-secondary)]">
                            {prStatus?.message ||
                                "Create a pull request to submit your homework."}
                        </p>

                        {prStatus?.instructions && (
                            <div className="p-3 rounded-lg bg-[var(--forge-bg-anvil)] text-sm">
                                <p className="text-[var(--forge-text-primary)]">
                                    {prStatus.instructions}
                                </p>
                            </div>
                        )}

                        {repoUrl && (
                            <a
                                href={`${repoUrl}/compare/${defaultBranch || "main"}...${branchName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--ember)] text-white font-medium hover:bg-[var(--ember-hover)] transition-colors"
                            >
                                <GitPullRequest size={16} />
                                Create Pull Request
                                <ExternalLink size={12} />
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

export default PRStatusIndicator;
