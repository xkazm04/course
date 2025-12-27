"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Trophy,
    Users,
    Clock,
    ChevronRight,
    Zap,
    Target,
    CheckCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Challenge } from "../lib/types";
import { DIFFICULTY_CONFIG } from "../lib/tierSystem";
import { CountdownTimer } from "./CountdownTimer";
import { TierBadge } from "./TierBadge";

interface ChallengeCardProps {
    challenge: Challenge;
    userRank?: number;
    hasSubmission?: boolean;
    hasJoined?: boolean;
    onSelect?: (id: string) => void;
    onJoin?: (id: string) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
    challenge,
    userRank,
    hasSubmission = false,
    hasJoined = false,
    onSelect,
    onJoin,
}) => {
    const difficultyConfig = DIFFICULTY_CONFIG[challenge.difficulty];
    const isActive = challenge.status === "active";
    const isUpcoming = challenge.status === "upcoming";

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            className={cn(
                "rounded-xl border border-[var(--border-default)]",
                "bg-[var(--surface-elevated)] overflow-hidden cursor-pointer",
                elevation.hoverable
            )}
            onClick={() => onSelect?.(challenge.id)}
        >
            {/* Header with status indicator */}
            <div className="p-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status={challenge.status} />
                            <span
                                className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium",
                                    difficultyConfig.bgColor,
                                    difficultyConfig.color
                                )}
                            >
                                {difficultyConfig.label}
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate">
                            {challenge.title}
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
                            {challenge.description}
                        </p>
                    </div>
                    <CycleIcon type={challenge.cycle.type} />
                </div>
            </div>

            {/* Stats */}
            <div className="p-4 space-y-3">
                {/* Time remaining */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">
                        {isUpcoming ? "Starts in" : "Ends in"}
                    </span>
                    <CountdownTimer
                        endDate={isUpcoming ? challenge.startDate : challenge.endDate}
                        variant="compact"
                    />
                </div>

                {/* Participants */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Participants</span>
                    <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                        <Users size={ICON_SIZES.sm} />
                        <span>{challenge.participantCount}</span>
                    </div>
                </div>

                {/* User rank if participating */}
                {hasSubmission && userRank && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text-muted)]">Your Rank</span>
                        <div className="flex items-center gap-1 text-sm font-medium text-amber-400">
                            <Trophy size={ICON_SIZES.sm} />
                            <span>#{userRank}</span>
                        </div>
                    </div>
                )}

                {/* Tier restriction if any */}
                {challenge.skillTierRestriction && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text-muted)]">Tier Requirement</span>
                        <TierBadge tier={challenge.skillTierRestriction} size="sm" />
                    </div>
                )}

                {/* Required features preview */}
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <div className="flex flex-wrap gap-1">
                        {challenge.requiredFeatures.slice(0, 3).map((feature) => (
                            <span
                                key={feature.id}
                                className="px-2 py-0.5 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                            >
                                {feature.name}
                            </span>
                        ))}
                        {challenge.requiredFeatures.length > 3 && (
                            <span className="px-2 py-0.5 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]">
                                +{challenge.requiredFeatures.length - 3} more
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-base)]">
                {isActive && !hasJoined && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onJoin?.(challenge.id);
                        }}
                        className="w-full py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        Start Challenge
                    </button>
                )}
                {isActive && hasJoined && !hasSubmission && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect?.(challenge.id);
                        }}
                        className="w-full py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                        <Target size={ICON_SIZES.sm} />
                        Continue Working
                    </button>
                )}
                {isActive && hasSubmission && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect?.(challenge.id);
                        }}
                        className="w-full py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={ICON_SIZES.sm} />
                        View Submission
                    </button>
                )}
                {isUpcoming && (
                    <div className="text-center text-sm text-[var(--text-muted)]">
                        <Clock size={ICON_SIZES.sm} className="inline mr-1" />
                        Coming Soon
                    </div>
                )}
                {challenge.status === "completed" && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect?.(challenge.id);
                        }}
                        className="w-full py-2 rounded-lg bg-[var(--surface-overlay)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface-elevated)] transition-colors flex items-center justify-center gap-2"
                    >
                        View Results
                        <ChevronRight size={ICON_SIZES.sm} />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

// Status badge component
interface StatusBadgeProps {
    status: Challenge["status"];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const config = {
        upcoming: { label: "Upcoming", color: "text-blue-400", bg: "bg-blue-500/20" },
        active: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/20" },
        judging: { label: "Judging", color: "text-amber-400", bg: "bg-amber-500/20" },
        completed: { label: "Completed", color: "text-slate-400", bg: "bg-slate-500/20" },
    }[status];

    return (
        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", config.bg, config.color)}>
            {config.label}
        </span>
    );
};

// Cycle type icon
interface CycleIconProps {
    type: Challenge["cycle"]["type"];
}

const CycleIcon: React.FC<CycleIconProps> = ({ type }) => {
    const config = {
        sprint: { icon: Zap, label: "Sprint", color: "text-amber-400" },
        marathon: { icon: Target, label: "Marathon", color: "text-purple-400" },
        flash: { icon: Clock, label: "Flash", color: "text-red-400" },
    }[type];

    const Icon = config.icon;

    return (
        <div className="flex flex-col items-center">
            <div
                className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    "bg-[var(--surface-overlay)]"
                )}
            >
                <Icon size={ICON_SIZES.lg} className={config.color} />
            </div>
            <span className="text-xs text-[var(--text-muted)] mt-1">{config.label}</span>
        </div>
    );
};
