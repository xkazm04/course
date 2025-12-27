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
    must: { label: "Must", color: "text-red-400", bgColor: "bg-red-500/20" },
    should: { label: "Should", color: "text-amber-400", bgColor: "bg-amber-500/20" },
    could: { label: "Could", color: "text-blue-400", bgColor: "bg-blue-500/20" },
    wont: { label: "Won't", color: "text-slate-400", bgColor: "bg-slate-500/20" },
};

const STATUS_CONFIG: Record<RequirementStatus, {
    icon: React.ElementType;
    color: string;
}> = {
    pending: { icon: Circle, color: "text-[var(--text-muted)]" },
    in_progress: { icon: Clock, color: "text-blue-400" },
    completed: { icon: CheckCircle, color: "text-emerald-400" },
    blocked: { icon: AlertCircle, color: "text-red-400" },
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
            <div className="p-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                        Requirements
                    </h3>
                    <span className="text-sm text-[var(--text-muted)]">
                        {completedCount}/{requirements.length}
                    </span>
                </div>
                <div className="h-2 bg-[var(--surface-overlay)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-[var(--text-muted)]">
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
                                <span className="text-xs text-[var(--text-muted)]">
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
                <div className="p-4 border-t border-[var(--border-subtle)]">
                    <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2 flex items-center gap-1">
                        <Star size={ICON_SIZES.xs} className="text-amber-400" />
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
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-base)]">
                <div className="flex gap-4">
                    {budget && (
                        <div className="flex items-center gap-2">
                            <DollarSign size={ICON_SIZES.sm} className="text-emerald-400" />
                            <div>
                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                    ${budget.remaining.toLocaleString()}
                                </span>
                                <span className="text-xs text-[var(--text-muted)]"> / ${budget.initial.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                    {deadline && (
                        <div className="flex items-center gap-2">
                            <Calendar size={ICON_SIZES.sm} className="text-purple-400" />
                            <div>
                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                    {formatDeadline(new Date(deadline))}
                                </span>
                                <span className="text-xs text-[var(--text-muted)]"> deadline</span>
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
                "bg-[var(--surface-overlay)] hover:bg-[var(--surface-elevated)]",
                requirement.status === "completed" && "opacity-60"
            )}
        >
            <StatusIcon
                size={ICON_SIZES.md}
                className={cn("flex-shrink-0 mt-0.5", statusConfig.color)}
            />
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-sm text-[var(--text-primary)]",
                    requirement.status === "completed" && "line-through"
                )}>
                    {requirement.description}
                </p>
                {isNew && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-purple-400">
                        <Sparkles size={ICON_SIZES.xs} />
                        Added in Phase {requirement.addedInPhase + 1}
                    </span>
                )}
            </div>
            <ChevronRight
                size={ICON_SIZES.sm}
                className="text-[var(--text-muted)] flex-shrink-0"
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
                ? "bg-amber-500/10 border border-amber-500/20"
                : "bg-[var(--surface-overlay)]"
        )}>
            {bonus.completed ? (
                <CheckCircle size={ICON_SIZES.sm} className="text-amber-400" />
            ) : (
                <Star size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
            )}
            <span className={cn(
                "flex-1 text-sm",
                bonus.completed ? "text-amber-400" : "text-[var(--text-secondary)]"
            )}>
                {bonus.description}
            </span>
            <span className={cn(
                "text-xs font-medium",
                bonus.completed ? "text-amber-400" : "text-[var(--text-muted)]"
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
