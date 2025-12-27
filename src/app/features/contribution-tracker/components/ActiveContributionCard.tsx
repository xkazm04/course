"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GitPullRequest,
    GitBranch,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    MoreVertical,
    Clock,
    Edit3,
    Trash2,
    CheckCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ActiveContribution, STATUS_CONFIG, ContributionStatus } from "../lib/types";
import { PRStatusTimeline } from "./PRStatusTimeline";

interface ActiveContributionCardProps {
    contribution: ActiveContribution;
    onUpdateStatus?: (id: string, status: ContributionStatus) => void;
    onUpdateNotes?: (id: string, notes: string) => void;
    onComplete?: (id: string) => void;
    onAbandon?: (id: string) => void;
}

export const ActiveContributionCard: React.FC<ActiveContributionCardProps> = ({
    contribution,
    onUpdateStatus,
    onUpdateNotes,
    onComplete,
    onAbandon,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notes, setNotes] = useState(contribution.notes);

    const statusConfig = STATUS_CONFIG[contribution.status];
    const timeAgo = getTimeAgo(new Date(contribution.lastUpdatedAt));

    const handleSaveNotes = () => {
        onUpdateNotes?.(contribution.id, notes);
        setIsEditingNotes(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
                "rounded-xl border border-[var(--border-default)]",
                "bg-[var(--surface-elevated)] overflow-hidden",
                elevation.hoverable
            )}
        >
            {/* Header */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-[var(--text-muted)]">
                                {contribution.repositoryOwner}/{contribution.repositoryName}
                            </span>
                            <StatusBadge status={contribution.status} />
                        </div>
                        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2">
                            {contribution.issueTitle}
                        </h3>
                    </div>

                    {/* Actions menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="p-1.5 rounded-lg hover:bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                        >
                            <MoreVertical size={ICON_SIZES.md} />
                        </button>
                        <AnimatePresence>
                            {showActions && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={cn(
                                        "absolute right-0 top-full mt-1 z-10",
                                        "w-48 rounded-lg border border-[var(--border-default)]",
                                        "bg-[var(--surface-elevated)] py-1",
                                        elevation.modal
                                    )}
                                >
                                    <button
                                        onClick={() => { setIsEditingNotes(true); setShowActions(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)]"
                                    >
                                        <Edit3 size={ICON_SIZES.sm} />
                                        Edit Notes
                                    </button>
                                    <button
                                        onClick={() => { onComplete?.(contribution.id); setShowActions(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-[var(--surface-overlay)]"
                                    >
                                        <CheckCircle size={ICON_SIZES.sm} />
                                        Mark Complete
                                    </button>
                                    <button
                                        onClick={() => { onAbandon?.(contribution.id); setShowActions(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[var(--surface-overlay)]"
                                    >
                                        <Trash2 size={ICON_SIZES.sm} />
                                        Abandon
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Branch and PR info */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[var(--text-muted)]">
                    {contribution.branchName && (
                        <span className="flex items-center gap-1">
                            <GitBranch size={ICON_SIZES.xs} />
                            <code>{contribution.branchName}</code>
                        </span>
                    )}
                    {contribution.prNumber && (
                        <a
                            href={contribution.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-purple-400 hover:underline"
                        >
                            <GitPullRequest size={ICON_SIZES.xs} />
                            #{contribution.prNumber}
                        </a>
                    )}
                    <span className="flex items-center gap-1">
                        <Clock size={ICON_SIZES.xs} />
                        Updated {timeAgo}
                    </span>
                </div>

                {/* Notes */}
                {(isEditingNotes || contribution.notes) && (
                    <div className="mt-3">
                        {isEditingNotes ? (
                            <div className="space-y-2">
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Add notes about your progress..."
                                    className={cn(
                                        "w-full px-3 py-2 rounded-lg text-sm",
                                        "bg-[var(--surface-overlay)] border border-[var(--border-default)]",
                                        "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                                        "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                                    )}
                                    rows={2}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveNotes}
                                        className="px-3 py-1 rounded text-xs font-medium bg-[var(--accent-primary)] text-white"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => { setNotes(contribution.notes); setIsEditingNotes(false); }}
                                        className="px-3 py-1 rounded text-xs font-medium text-[var(--text-muted)]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--text-muted)] italic">
                                {contribution.notes}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Expandable timeline */}
            <div className="border-t border-[var(--border-subtle)]">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full px-4 py-2 flex items-center justify-between text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] transition-colors"
                >
                    <span>Timeline ({contribution.timeline.length} events)</span>
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
                            className="overflow-hidden"
                        >
                            <div className="p-4 border-t border-[var(--border-subtle)]">
                                <PRStatusTimeline events={contribution.timeline} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Actions footer */}
            <div className="flex items-center gap-2 p-3 border-t border-[var(--border-subtle)] bg-[var(--surface-base)]">
                <a
                    href={contribution.issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2",
                        "px-4 py-2 rounded-lg text-sm font-medium",
                        "border border-[var(--border-default)]",
                        "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                        "hover:bg-[var(--surface-overlay)] transition-colors"
                    )}
                >
                    View Issue
                    <ExternalLink size={ICON_SIZES.sm} />
                </a>
                <StatusSelector
                    currentStatus={contribution.status}
                    onSelect={status => onUpdateStatus?.(contribution.id, status)}
                />
            </div>
        </motion.div>
    );
};

// Status badge
interface StatusBadgeProps {
    status: ContributionStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const config = STATUS_CONFIG[status];

    return (
        <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            config.bgColor,
            config.color
        )}>
            {config.label}
        </span>
    );
};

// Status selector
interface StatusSelectorProps {
    currentStatus: ContributionStatus;
    onSelect: (status: ContributionStatus) => void;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ currentStatus, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const statuses: ContributionStatus[] = [
        "claimed", "in_progress", "pr_submitted",
        "changes_requested", "approved", "merged", "closed"
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-[var(--accent-primary)] text-white",
                    "hover:bg-[var(--accent-primary-hover)] transition-colors"
                )}
            >
                Update Status
                <ChevronDown size={ICON_SIZES.sm} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            "absolute right-0 bottom-full mb-1 z-10",
                            "w-56 rounded-lg border border-[var(--border-default)]",
                            "bg-[var(--surface-elevated)] py-1",
                            elevation.modal
                        )}
                    >
                        {statuses.map(status => {
                            const config = STATUS_CONFIG[status];
                            return (
                                <button
                                    key={status}
                                    onClick={() => { onSelect(status); setIsOpen(false); }}
                                    disabled={status === currentStatus}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 text-sm",
                                        "hover:bg-[var(--surface-overlay)] transition-colors",
                                        status === currentStatus
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                    )}
                                >
                                    <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        config.bgColor.replace("/20", "")
                                    )} />
                                    <span className={config.color}>{config.label}</span>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
}
