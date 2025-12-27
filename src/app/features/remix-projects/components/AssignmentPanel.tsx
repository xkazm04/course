"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Target,
    Lightbulb,
    CheckCircle,
    Circle,
    Eye,
    Send,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Assignment, Objective, Hint } from "../lib/types";

interface AssignmentPanelProps {
    assignment: Assignment;
    onRevealHint: () => void;
    onCompleteObjective: (id: string) => void;
    onSubmit: () => void;
    canSubmit: boolean;
    isSubmitting: boolean;
}

export const AssignmentPanel: React.FC<AssignmentPanelProps> = ({
    assignment,
    onRevealHint,
    onCompleteObjective,
    onSubmit,
    canSubmit,
    isSubmitting,
}) => {
    const completedCount = assignment.objectives.filter((o) => o.completed).length;
    const progress = (completedCount / assignment.objectives.length) * 100;
    const revealedHints = assignment.hints.filter((h) => h.revealed);
    const hiddenHints = assignment.hints.filter((h) => !h.revealed);

    return (
        <div className="space-y-4">
            {/* Progress */}
            <div className={cn("rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4", elevation.elevated)}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">Progress</span>
                    <span className="text-sm text-[var(--text-muted)]">
                        {completedCount}/{assignment.objectives.length} objectives
                    </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-overlay)] overflow-hidden">
                    <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Objectives */}
            <div className={cn("rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4", elevation.elevated)}>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Target size={ICON_SIZES.sm} className="text-blue-400" />
                    Objectives
                </h4>
                <div className="space-y-2">
                    {assignment.objectives.map((objective) => (
                        <ObjectiveItem
                            key={objective.id}
                            objective={objective}
                            onComplete={() => onCompleteObjective(objective.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Hints */}
            <div className={cn("rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4", elevation.elevated)}>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Lightbulb size={ICON_SIZES.sm} className="text-amber-400" />
                        Hints
                    </h4>
                    {hiddenHints.length > 0 && (
                        <button
                            onClick={onRevealHint}
                            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                        >
                            <Eye size={ICON_SIZES.xs} />
                            Reveal ({hiddenHints.length} left)
                        </button>
                    )}
                </div>
                <AnimatePresence>
                    {revealedHints.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)] italic">
                            No hints revealed yet. Each hint costs points!
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {revealedHints.map((hint) => (
                                <HintItem key={hint.id} hint={hint} />
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Submit Button */}
            <button
                onClick={onSubmit}
                disabled={!canSubmit || isSubmitting}
                className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors",
                    canSubmit
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-[var(--surface-overlay)] text-[var(--text-muted)] cursor-not-allowed"
                )}
            >
                {isSubmitting ? (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Submitting...
                    </>
                ) : (
                    <>
                        <Send size={ICON_SIZES.sm} />
                        Submit Assignment
                    </>
                )}
            </button>

            {!canSubmit && assignment.status !== "submitted" && (
                <p className="text-xs text-[var(--text-muted)] text-center flex items-center justify-center gap-1">
                    <AlertCircle size={ICON_SIZES.xs} />
                    Make changes to the code to enable submission
                </p>
            )}
        </div>
    );
};

// Objective item
interface ObjectiveItemProps {
    objective: Objective;
    onComplete: () => void;
}

const ObjectiveItem: React.FC<ObjectiveItemProps> = ({ objective, onComplete }) => (
    <motion.button
        onClick={onComplete}
        disabled={objective.completed}
        className={cn(
            "w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors",
            objective.completed
                ? "bg-emerald-500/10"
                : "hover:bg-[var(--surface-overlay)]"
        )}
        whileHover={{ x: 2 }}
    >
        {objective.completed ? (
            <CheckCircle size={ICON_SIZES.sm} className="text-emerald-400 mt-0.5 flex-shrink-0" />
        ) : (
            <Circle size={ICON_SIZES.sm} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1">
            <p className={cn(
                "text-sm",
                objective.completed ? "text-emerald-400 line-through" : "text-[var(--text-primary)]"
            )}>
                {objective.description}
            </p>
            <span className="text-xs text-[var(--text-muted)]">+{objective.points} pts</span>
        </div>
    </motion.button>
);

// Hint item
interface HintItemProps {
    hint: Hint;
}

const HintItem: React.FC<HintItemProps> = ({ hint }) => (
    <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
    >
        <p className="text-sm text-amber-200">{hint.content}</p>
        <span className="text-xs text-amber-400/60">-{hint.penaltyPercent}% penalty</span>
    </motion.div>
);
