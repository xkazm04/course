"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle,
    Circle,
    Clock,
    AlertCircle,
    Star,
    DollarSign,
    Calendar,
    ChevronRight,
    Sparkles,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import {
    Requirement,
    RequirementPriority,
    RequirementStatus,
    BonusObjective,
    BudgetConstraint,
} from "../lib/types";

interface RequirementsPanelProps {
    requirements: Requirement[];
    bonusObjectives: BonusObjective[];
    budget?: BudgetConstraint;
    deadline?: string;
    currentPhase: number;
    totalPhases: number;
    onToggleRequirement?: (id: string, status: RequirementStatus) => void;
}

const PRIORITY_CONFIG: Record<RequirementPriority, {
    label: string;
    color: string;
    bgColor: string;
}> = {
    must: { label: "Must", color: "text-[var(--forge-error)]", bgColor: "bg-[var(--forge-error)]/20" },
    should: { label: "Should", color: "text-[var(--forge-warning)]", bgColor: "bg-[var(--forge-warning)]/20" },
    could: { label: "Could", color: "text-[var(--forge-info)]", bgColor: "bg-[var(--forge-info)]/20" },
    wont: { label: "Won't", color: "text-[var(--forge-text-muted)]", bgColor: "bg-[var(--forge-bg-elevated)]" },
};

const STATUS_CONFIG: Record<RequirementStatus, {
    icon: React.ElementType;
    color: string;
}> = {
    pending: { icon: Circle, color: "text-[var(--forge-text-muted)]" },
    in_progress: { icon: Clock, color: "text-[var(--forge-info)]" },
    completed: { icon: CheckCircle, color: "text-[var(--forge-success)]" },
    blocked: { icon: AlertCircle, color: "text-[var(--forge-error)]" },
};

export const RequirementsPanel: React.FC<RequirementsPanelProps> = ({
    requirements,
    bonusObjectives,
    budget,
    deadline,
    currentPhase,
    totalPhases,
    onToggleRequirement,
}) => {
    const completedCount = requirements.filter(r => r.status === "completed").length;
    const progress = requirements.length > 0
        ? Math.round((completedCount / requirements.length) * 100)
        : 0;

    // Group requirements by priority
    const groupedRequirements = requirements.reduce((acc, req) => {
        if (!acc[req.priority]) acc[req.priority] = [];
        acc[req.priority].push(req);
        return acc;
    }, {} as Record<RequirementPriority, Requirement[]>);

    return (
        <div className="h-full flex flex-col">
            {/* Header with progress */}
            <div className="p-4 border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[var(--forge-text-primary)]">
                        Requirements
                    </h3>
                    <span className="text-sm text-[var(--forge-text-muted)]">
                        {completedCount}/{requirements.length}
                    </span>
                </div>
                <div className="h-2 bg-[var(--forge-bg-elevated)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-[var(--forge-success)] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-[var(--forge-text-muted)]">
                    <span>Phase {currentPhase + 1} of {totalPhases}</span>
                    <span>{progress}% complete</span>
                </div>
            </div>

            {/* Requirements list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(["must", "should", "could", "wont"] as RequirementPriority[]).map(priority => {
                    const items = groupedRequirements[priority];
                    if (!items || items.length === 0) return null;

                    return (
                        <section key={priority}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium",
                                    PRIORITY_CONFIG[priority].bgColor,
                                    PRIORITY_CONFIG[priority].color
                                )}>
                                    {PRIORITY_CONFIG[priority].label}
                                </span>
                                <span className="text-xs text-[var(--forge-text-muted)]">
                                    ({items.length})
                                </span>
                            </div>
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {items.map(req => (
                                        <RequirementItem
                                            key={req.id}
                                            requirement={req}
                                            onToggle={onToggleRequirement}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    );
                })}
            </div>

            {/* Bonus objectives */}
            {bonusObjectives.length > 0 && (
                <div className="p-4 border-t border-[var(--forge-border-subtle)]">
                    <h4 className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase mb-2 flex items-center gap-1">
                        <Star size={ICON_SIZES.xs} className="text-[var(--forge-warning)]" />
                        Bonus Objectives
                    </h4>
                    <div className="space-y-2">
                        {bonusObjectives.map(bonus => (
                            <BonusItem key={bonus.id} bonus={bonus} />
                        ))}
                    </div>
                </div>
            )}

            {/* Budget and deadline */}
            <div className="p-4 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-workshop)]">
                <div className="flex gap-4">
                    {budget && (
                        <div className="flex items-center gap-2">
                            <DollarSign size={ICON_SIZES.sm} className="text-[var(--forge-success)]" />
                            <div>
                                <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                                    ${budget.remaining.toLocaleString()}
                                </span>
                                <span className="text-xs text-[var(--forge-text-muted)]"> / ${budget.initial.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                    {deadline && (
                        <div className="flex items-center gap-2">
                            <Calendar size={ICON_SIZES.sm} className="text-[var(--ember)]" />
                            <div>
                                <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                                    {formatDeadline(new Date(deadline))}
                                </span>
                                <span className="text-xs text-[var(--forge-text-muted)]"> deadline</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Requirement item component
interface RequirementItemProps {
    requirement: Requirement;
    onToggle?: (id: string, status: RequirementStatus) => void;
}

const RequirementItem: React.FC<RequirementItemProps> = ({
    requirement,
    onToggle,
}) => {
    const statusConfig = STATUS_CONFIG[requirement.status];
    const StatusIcon = statusConfig.icon;
    const isNew = requirement.addedInPhase > 0;

    const handleClick = () => {
        if (!onToggle) return;

        // Cycle through statuses
        const nextStatus: RequirementStatus =
            requirement.status === "pending" ? "in_progress" :
            requirement.status === "in_progress" ? "completed" :
            requirement.status === "completed" ? "pending" :
            "pending";

        onToggle(requirement.id, nextStatus);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={handleClick}
            className={cn(
                "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                "bg-[var(--forge-bg-elevated)] hover:bg-[var(--forge-bg-anvil)]",
                requirement.status === "completed" && "opacity-60"
            )}
        >
            <StatusIcon
                size={ICON_SIZES.md}
                className={cn("flex-shrink-0 mt-0.5", statusConfig.color)}
            />
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-sm text-[var(--forge-text-primary)]",
                    requirement.status === "completed" && "line-through"
                )}>
                    {requirement.description}
                </p>
                {isNew && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--ember)]">
                        <Sparkles size={ICON_SIZES.xs} />
                        Added in Phase {requirement.addedInPhase + 1}
                    </span>
                )}
            </div>
            <ChevronRight
                size={ICON_SIZES.sm}
                className="text-[var(--forge-text-muted)] flex-shrink-0"
            />
        </motion.div>
    );
};

// Bonus item component
interface BonusItemProps {
    bonus: BonusObjective;
}

const BonusItem: React.FC<BonusItemProps> = ({ bonus }) => {
    return (
        <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg",
            bonus.completed
                ? "bg-[var(--forge-warning)]/10 border border-[var(--forge-warning)]/20"
                : "bg-[var(--forge-bg-elevated)]"
        )}>
            {bonus.completed ? (
                <CheckCircle size={ICON_SIZES.sm} className="text-[var(--forge-warning)]" />
            ) : (
                <Star size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
            )}
            <span className={cn(
                "flex-1 text-sm",
                bonus.completed ? "text-[var(--forge-warning)]" : "text-[var(--forge-text-secondary)]"
            )}>
                {bonus.description}
            </span>
            <span className={cn(
                "text-xs font-medium",
                bonus.completed ? "text-[var(--forge-warning)]" : "text-[var(--forge-text-muted)]"
            )}>
                +{bonus.points}pts
            </span>
        </div>
    );
};

function formatDeadline(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `${diffDays} days`;
    return `${Math.ceil(diffDays / 7)} weeks`;
}
