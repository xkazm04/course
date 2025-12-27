"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Terminal,
    Check,
    Circle,
    Copy,
    Clock,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { SetupGuide as SetupGuideType, SetupStep, CommonIssue } from "../lib/types";

interface SetupGuideProps {
    guide: SetupGuideType;
}

export const SetupGuide: React.FC<SetupGuideProps> = ({ guide }) => {
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const toggleStep = (order: number) => {
        setCompletedSteps(prev =>
            prev.includes(order)
                ? prev.filter(s => s !== order)
                : [...prev, order]
        );
    };

    const progress = Math.round((completedSteps.length / guide.steps.length) * 100);

    return (
        <div className="space-y-6">
            {/* Progress header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Clock size={ICON_SIZES.sm} />
                    Est. {guide.estimatedTimeMinutes} minutes
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-[var(--surface-overlay)]">
                        <motion.div
                            className="h-full rounded-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">{progress}%</span>
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
                {guide.steps.map((step) => (
                    <StepCard
                        key={step.order}
                        step={step}
                        isCompleted={completedSteps.includes(step.order)}
                        onToggle={() => toggleStep(step.order)}
                    />
                ))}
            </div>

            {/* Common issues */}
            {guide.commonIssues.length > 0 && (
                <section>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <AlertTriangle size={ICON_SIZES.sm} className="text-amber-400" />
                        Common Issues
                    </h4>
                    <div className="space-y-2">
                        {guide.commonIssues.map((issue, index) => (
                            <IssueCard key={index} issue={issue} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

// Step card component
interface StepCardProps {
    step: SetupStep;
    isCompleted: boolean;
    onToggle: () => void;
}

const StepCard: React.FC<StepCardProps> = ({ step, isCompleted, onToggle }) => {
    const [copied, setCopied] = useState(false);

    const copyCommand = async () => {
        if (step.command) {
            await navigator.clipboard.writeText(step.command);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <motion.div
            className={cn(
                "rounded-lg border overflow-hidden transition-colors",
                isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-[var(--border-subtle)] bg-[var(--surface-overlay)]"
            )}
        >
            <div className="flex items-start gap-3 p-4">
                <button
                    onClick={onToggle}
                    className={cn(
                        "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                        isCompleted
                            ? "bg-emerald-500 text-white"
                            : "border-2 border-[var(--border-default)] text-transparent hover:border-emerald-500"
                    )}
                >
                    <Check size={ICON_SIZES.sm} />
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-[var(--text-muted)]">Step {step.order}</span>
                        <h5 className={cn(
                            "font-medium",
                            isCompleted
                                ? "text-emerald-400 line-through"
                                : "text-[var(--text-primary)]"
                        )}>
                            {step.title}
                        </h5>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                        {step.description}
                    </p>

                    {step.command && (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-base)] font-mono text-sm">
                                <Terminal size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                                <code className="text-[var(--text-secondary)] truncate">
                                    {step.command}
                                </code>
                            </div>
                            <button
                                onClick={copyCommand}
                                className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    copied
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-[var(--surface-base)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                )}
                            >
                                {copied ? <Check size={ICON_SIZES.sm} /> : <Copy size={ICON_SIZES.sm} />}
                            </button>
                        </div>
                    )}

                    {step.expectedOutput && (
                        <div className="mt-2 text-xs text-[var(--text-muted)]">
                            Expected: <code className="text-emerald-400">{step.expectedOutput}</code>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Issue card component
interface IssueCardProps {
    issue: CommonIssue;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 p-3"
            >
                <AlertTriangle size={ICON_SIZES.sm} className="text-amber-400 flex-shrink-0" />
                <span className="text-sm text-[var(--text-secondary)] flex-1 text-left">
                    {issue.symptom}
                </span>
                {isExpanded ? (
                    <ChevronDown size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                ) : (
                    <ChevronRight size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                )}
            </button>
            {isExpanded && (
                <div className="px-3 pb-3 border-t border-amber-500/20 space-y-2">
                    <div className="pt-2">
                        <span className="text-xs text-[var(--text-muted)]">Cause:</span>
                        <p className="text-sm text-[var(--text-secondary)]">{issue.cause}</p>
                    </div>
                    <div>
                        <span className="text-xs text-emerald-400">Solution:</span>
                        <p className="text-sm text-emerald-300">{issue.solution}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
