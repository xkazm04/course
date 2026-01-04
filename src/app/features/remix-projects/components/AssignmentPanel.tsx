// @ts-nocheck
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
    Sparkles,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Assignment, Objective, Hint } from "../lib/types";
import { ObjectiveVerificationStatus } from "../lib/useObjectiveVerification";
import {
    ObjectiveVerificationIndicator,
    InlineVerificationBadge,
} from "./ObjectiveVerificationIndicator";

interface AssignmentPanelProps {
    assignment: Assignment;
    onRevealHint: () => void;
    onCompleteObjective: (id: string) => void;
    onSubmit: () => void;
    canSubmit: boolean;
    isSubmitting: boolean;
    verificationStatuses?: ObjectiveVerificationStatus[];
    isAnalyzing?: boolean;
}

export const AssignmentPanel: React.FC<AssignmentPanelProps> = ({
    assignment,
    onRevealHint,
    onCompleteObjective,
    onSubmit,
    canSubmit,
    isSubmitting,
    verificationStatuses = [],
    isAnalyzing = false,
}) => {
    // Calculate progress based on real-time verification instead of manual completion
    const confidentCount = verificationStatuses.filter((s) => s.state === "confident").length;
    const partialCount = verificationStatuses.filter((s) => s.state === "partial").length;
    const manualCompletedCount = assignment.objectives.filter((o) => o.completed).length;

    // Use verification-based progress or fall back to manual if no verification data
    const hasVerification = verificationStatuses.length > 0;
    const verificationProgress = hasVerification
        ? ((confidentCount * 100 + partialCount * 50) / assignment.objectives.length)
        : 0;
    const manualProgress = (manualCompletedCount / assignment.objectives.length) * 100;
    const progress = hasVerification ? Math.max(verificationProgress, manualProgress) : manualProgress;
    const revealedHints = assignment.hints.filter((h) => h.revealed);
    const hiddenHints = assignment.hints.filter((h) => !h.revealed);

    return (
        <div className="space-y-4" data-testid="assignment-panel">
            {/* Progress with real-time verification */}
            <div className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4", elevation.elevated)}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--forge-text-primary)]">Progress</span>
                        {isAnalyzing && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)]"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                >
                                    <Sparkles size={ICON_SIZES.xs} className="text-amber-400" />
                                </motion.div>
                                Analyzing...
                            </motion.div>
                        )}
                    </div>
                    <span className="text-sm text-[var(--forge-text-muted)]" data-testid="progress-count">
                        {hasVerification ? (
                            <>
                                {confidentCount} confident
                                {partialCount > 0 && <span className="text-amber-400"> · {partialCount} partial</span>}
                            </>
                        ) : (
                            <>{manualCompletedCount}/{assignment.objectives.length} objectives</>
                        )}
                    </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--forge-bg-anvil)] overflow-hidden relative">
                    {/* Partial progress (amber) */}
                    {hasVerification && partialCount > 0 && (
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-amber-400/50"
                            initial={{ width: 0 }}
                            animate={{ width: `${verificationProgress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    )}
                    {/* Confident progress (green) */}
                    <motion.div
                        className="h-full bg-[var(--forge-success)] relative z-10"
                        initial={{ width: 0 }}
                        animate={{ width: `${(confidentCount / assignment.objectives.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Objectives with real-time verification */}
            <div className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4", elevation.elevated)}>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[var(--forge-text-primary)] flex items-center gap-2">
                        <Target size={ICON_SIZES.sm} className="text-[var(--forge-info)]" />
                        Objectives
                    </h4>
                    {hasVerification && (
                        <span className="text-xs text-[var(--forge-text-muted)] flex items-center gap-1">
                            <Sparkles size={ICON_SIZES.xs} className="text-amber-400" />
                            Live detection
                        </span>
                    )}
                </div>
                <div className="space-y-2">
                    {assignment.objectives.map((objective) => {
                        const verificationStatus = verificationStatuses.find(
                            (s) => s.objectiveId === objective.id
                        );
                        return (
                            <ObjectiveItem
                                key={objective.id}
                                objective={objective}
                                verificationStatus={verificationStatus}
                                onComplete={() => onCompleteObjective(objective.id)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Hints */}
            <div className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4", elevation.elevated)}>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[var(--forge-text-primary)] flex items-center gap-2">
                        <Lightbulb size={ICON_SIZES.sm} className="text-[var(--forge-warning)]" />
                        Hints
                    </h4>
                    {hiddenHints.length > 0 && (
                        <button
                            onClick={onRevealHint}
                            className="flex items-center gap-1 text-xs text-[var(--forge-warning)] hover:opacity-80 transition-colors"
                        >
                            <Eye size={ICON_SIZES.xs} />
                            Reveal ({hiddenHints.length} left)
                        </button>
                    )}
                </div>
                <AnimatePresence>
                    {revealedHints.length === 0 ? (
                        <p className="text-sm text-[var(--forge-text-muted)] italic">
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
                        ? "bg-[var(--forge-success)] text-white hover:opacity-90"
                        : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] cursor-not-allowed"
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
                <p className="text-xs text-[var(--forge-text-muted)] text-center flex items-center justify-center gap-1">
                    <AlertCircle size={ICON_SIZES.xs} />
                    Make changes to the code to enable submission
                </p>
            )}
        </div>
    );
};

// Objective item with real-time verification
interface ObjectiveItemProps {
    objective: Objective;
    verificationStatus?: ObjectiveVerificationStatus;
    onComplete: () => void;
}

const ObjectiveItem: React.FC<ObjectiveItemProps> = ({ objective, verificationStatus, onComplete }) => {
    const isConfident = verificationStatus?.state === "confident";
    const isPartial = verificationStatus?.state === "partial";
    const isDetected = isConfident || isPartial;

    // Determine background based on verification state
    const getBgClass = () => {
        if (objective.completed || isConfident) return "bg-[var(--forge-success)]/10";
        if (isPartial) return "bg-amber-400/5";
        return "hover:bg-[var(--forge-bg-anvil)]";
    };

    return (
        <motion.div
            className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                getBgClass()
            )}
            layout
            data-testid={`objective-item-${objective.id}`}
        >
            {/* Verification indicator replaces manual checkbox */}
            <div className="mt-0.5 flex-shrink-0">
                {verificationStatus ? (
                    <ObjectiveVerificationIndicator
                        status={verificationStatus}
                        showConfidence={false}
                    />
                ) : objective.completed ? (
                    <CheckCircle size={ICON_SIZES.sm} className="text-[var(--forge-success)]" />
                ) : (
                    <Circle size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                        "text-sm",
                        isConfident || objective.completed
                            ? "text-[var(--forge-success)]"
                            : isPartial
                            ? "text-amber-400"
                            : "text-[var(--forge-text-primary)]"
                    )}>
                        {objective.description}
                    </p>
                    {/* Confidence badge */}
                    {verificationStatus && verificationStatus.confidence > 0 && (
                        <InlineVerificationBadge status={verificationStatus} />
                    )}
                </div>

                {/* Evidence hint when partially detected */}
                {verificationStatus?.evidence && isDetected && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-xs text-[var(--forge-text-muted)] mt-1"
                    >
                        {verificationStatus.evidence}
                    </motion.p>
                )}

                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[var(--forge-text-muted)]">
                        +{objective.weight || 10} pts
                    </span>
                    {!isConfident && !objective.completed && (
                        <button
                            onClick={onComplete}
                            className="text-xs text-[var(--forge-info)] hover:underline"
                            data-testid={`objective-manual-complete-${objective.id}`}
                        >
                            Mark complete
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Hint item
interface HintItemProps {
    hint: Hint;
}

const HintItem: React.FC<HintItemProps> = ({ hint }) => (
    <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="p-2 rounded-lg bg-[var(--forge-warning)]/10 border border-[var(--forge-warning)]/20"
    >
        <p className="text-sm text-[var(--forge-warning)]">{hint.content}</p>
        <span className="text-xs text-[var(--forge-warning)]/60">-{hint.penaltyPercent}% penalty</span>
    </motion.div>
);
