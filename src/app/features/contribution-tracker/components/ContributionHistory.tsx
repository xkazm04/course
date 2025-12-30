"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    GitMerge,
    XCircle,
    AlertTriangle,
    ExternalLink,
    Clock,
    Award,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { CompletedContribution } from "../lib/types";

interface ContributionHistoryProps {
    contributions: CompletedContribution[];
}

export const ContributionHistory: React.FC<ContributionHistoryProps> = ({
    contributions,
}) => {
    if (contributions.length === 0) {
        return (
            <div className="text-center py-12 text-[var(--forge-text-muted)]">
                <Clock size={ICON_SIZES.xl} className="mx-auto mb-3 opacity-50" />
                <p>No completed contributions yet</p>
                <p className="text-sm mt-1">Complete your first contribution to see it here</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {contributions.map((contribution, index) => (
                <HistoryCard key={contribution.id} contribution={contribution} index={index} />
            ))}
        </div>
    );
};

// History card component
interface HistoryCardProps {
    contribution: CompletedContribution;
    index: number;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ contribution, index }) => {
    const outcomeConfig = {
        merged: {
            icon: GitMerge,
            label: "Merged",
            color: "text-[var(--forge-success)]",
            bgColor: "bg-[var(--forge-success)]/20",
        },
        closed: {
            icon: XCircle,
            label: "Closed",
            color: "text-[var(--forge-error)]",
            bgColor: "bg-[var(--forge-error)]/20",
        },
        abandoned: {
            icon: AlertTriangle,
            label: "Abandoned",
            color: "text-[var(--forge-warning)]",
            bgColor: "bg-[var(--forge-warning)]/20",
        },
    };

    const config = outcomeConfig[contribution.outcome];
    const Icon = config.icon;
    const completedDate = new Date(contribution.completedAt);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-elevated)] p-4"
            )}
        >
            <div className="flex items-start gap-4">
                {/* Outcome icon */}
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    config.bgColor
                )}>
                    <Icon size={ICON_SIZES.lg} className={config.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-[var(--forge-text-muted)]">
                            {contribution.repositoryOwner}/{contribution.repositoryName}
                        </span>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            config.bgColor,
                            config.color
                        )}>
                            {config.label}
                        </span>
                    </div>

                    <h4 className="font-medium text-[var(--forge-text-primary)] line-clamp-1">
                        {contribution.issueTitle}
                    </h4>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--forge-text-muted)]">
                        <span className="flex items-center gap-1">
                            <Clock size={ICON_SIZES.xs} />
                            {contribution.totalTimeSpentHours}h spent
                        </span>
                        <span>
                            Completed {completedDate.toLocaleDateString()}
                        </span>
                        {contribution.prNumber && contribution.prUrl && (
                            <a
                                href={contribution.prUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[var(--ember)] hover:underline"
                            >
                                PR #{contribution.prNumber}
                                <ExternalLink size={ICON_SIZES.xs} />
                            </a>
                        )}
                    </div>

                    {/* Skills gained */}
                    {contribution.skillsGained.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                            <Award size={ICON_SIZES.sm} className="text-[var(--forge-warning)]" />
                            <div className="flex flex-wrap gap-1">
                                {contribution.skillsGained.map(skill => (
                                    <span
                                        key={skill}
                                        className="px-2 py-0.5 rounded text-xs bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reflection */}
                    {contribution.reflection && (
                        <div className="mt-3 p-3 rounded-lg bg-[var(--forge-bg-anvil)]">
                            <p className="text-sm text-[var(--forge-text-secondary)] italic">
                                "{contribution.reflection}"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
