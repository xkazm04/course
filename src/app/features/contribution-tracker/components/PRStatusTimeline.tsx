"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Flag,
    Code,
    GitCommit,
    GitPullRequest,
    MessageSquare,
    RefreshCw,
    CheckCircle,
    GitMerge,
    XCircle,
    AlertTriangle,
    FileText,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ContributionEvent, ContributionEventType } from "../lib/types";

interface PRStatusTimelineProps {
    events: ContributionEvent[];
    compact?: boolean;
}

const EVENT_CONFIG: Record<ContributionEventType, {
    icon: React.ElementType;
    color: string;
    bgColor: string;
}> = {
    claimed: { icon: Flag, color: "text-[var(--forge-text-muted)]", bgColor: "bg-[var(--forge-text-muted)]/20" },
    started_work: { icon: Code, color: "text-[var(--forge-info)]", bgColor: "bg-[var(--forge-info)]/20" },
    pushed_commit: { icon: GitCommit, color: "text-[var(--forge-info)]", bgColor: "bg-[var(--forge-info)]/20" },
    opened_pr: { icon: GitPullRequest, color: "text-[var(--ember)]", bgColor: "bg-[var(--ember)]/20" },
    received_review: { icon: MessageSquare, color: "text-[var(--forge-warning)]", bgColor: "bg-[var(--forge-warning)]/20" },
    made_changes: { icon: RefreshCw, color: "text-[var(--forge-warning)]", bgColor: "bg-[var(--forge-warning)]/20" },
    approved: { icon: CheckCircle, color: "text-[var(--forge-success)]", bgColor: "bg-[var(--forge-success)]/20" },
    merged: { icon: GitMerge, color: "text-[var(--forge-success)]", bgColor: "bg-[var(--forge-success)]/20" },
    closed: { icon: XCircle, color: "text-[var(--forge-error)]", bgColor: "bg-[var(--forge-error)]/20" },
    abandoned: { icon: AlertTriangle, color: "text-[var(--forge-error)]", bgColor: "bg-[var(--forge-error)]/20" },
    note_added: { icon: FileText, color: "text-[var(--forge-text-muted)]", bgColor: "bg-[var(--forge-text-muted)]/20" },
};

export const PRStatusTimeline: React.FC<PRStatusTimelineProps> = ({
    events,
    compact = false,
}) => {
    const sortedEvents = [...events].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (compact) {
        return (
            <div className="flex items-center gap-1">
                {sortedEvents.map((event, index) => {
                    const config = EVENT_CONFIG[event.type];
                    const Icon = config.icon;
                    return (
                        <motion.div
                            key={event.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center",
                                config.bgColor
                            )}
                            title={event.description}
                        >
                            <Icon size={ICON_SIZES.xs} className={config.color} />
                        </motion.div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-[var(--forge-border-subtle)]" />

            {/* Events */}
            <div className="space-y-4">
                {sortedEvents.map((event, index) => (
                    <TimelineEvent
                        key={event.id}
                        event={event}
                        isFirst={index === 0}
                        isLast={index === sortedEvents.length - 1}
                    />
                ))}
            </div>
        </div>
    );
};

// Timeline event component
interface TimelineEventProps {
    event: ContributionEvent;
    isFirst: boolean;
    isLast: boolean;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({ event, isFirst, isLast }) => {
    const config = EVENT_CONFIG[event.type];
    const Icon = config.icon;
    const date = new Date(event.timestamp);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative flex gap-3"
        >
            {/* Icon */}
            <div
                className={cn(
                    "relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                    config.bgColor
                )}
            >
                <Icon size={ICON_SIZES.sm} className={config.color} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-[var(--forge-text-primary)]">
                        {event.description}
                    </span>
                </div>
                <span className="text-xs text-[var(--forge-text-muted)]">
                    {formatEventDate(date)}
                </span>

                {/* Metadata preview */}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-1 text-xs text-[var(--forge-text-muted)]">
                        {event.metadata.prNumber && (
                            <span className="text-[var(--ember)]">PR #{event.metadata.prNumber as number}</span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

function formatEventDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
