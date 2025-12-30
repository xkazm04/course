"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Award,
    Target,
    Shield,
    Zap,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Submission, QualityGateResult } from "../lib/types";

interface QualityReportProps {
    submission: Submission;
}

export const QualityReport: React.FC<QualityReportProps> = ({ submission }) => {
    const { scores, analysis } = submission;

    return (
        <div className="space-y-6">
            {/* Overall Score */}
            <div className={cn("rounded-xl border border-[var(--forge-border-default)] bg-gradient-to-br from-[var(--forge-bg-elevated)] to-[var(--ember)]/10 p-6 text-center", elevation.elevated)}>
                <Award size={48} className="mx-auto mb-3 text-[var(--forge-warning)]" />
                <div className="text-4xl font-bold text-[var(--forge-text-primary)] mb-1">
                    {scores.overall}
                </div>
                <p className="text-sm text-[var(--forge-text-muted)]">Overall Score</p>
                <ScoreGrade score={scores.overall} />
            </div>

            {/* Score Breakdown */}
            <div className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4", elevation.elevated)}>
                <h4 className="font-semibold text-[var(--forge-text-primary)] mb-4">Score Breakdown</h4>
                <div className="space-y-3">
                    <ScoreBar
                        icon={Target}
                        label="Objectives"
                        score={scores.objectivesScore}
                        maxScore={100}
                        color="blue"
                    />
                    <ScoreBar
                        icon={Shield}
                        label="Code Quality"
                        score={scores.qualityScore}
                        maxScore={100}
                        color="emerald"
                    />
                    <ScoreBar
                        icon={Zap}
                        label="Scope Control"
                        score={scores.scopeScore}
                        maxScore={100}
                        color="purple"
                    />
                    {scores.bonusPoints > 0 && (
                        <ScoreBar
                            icon={TrendingUp}
                            label="Bonus Points"
                            score={scores.bonusPoints}
                            maxScore={50}
                            color="amber"
                        />
                    )}
                </div>

                {scores.penalties > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-[var(--forge-error)]/10 border border-[var(--forge-error)]/20">
                        <div className="flex items-center gap-2 text-[var(--forge-error)]">
                            <AlertTriangle size={ICON_SIZES.sm} />
                            <span className="text-sm font-medium">Penalties: -{scores.penalties}%</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Analysis Details */}
            <div className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4", elevation.elevated)}>
                <h4 className="font-semibold text-[var(--forge-text-primary)] mb-4">Analysis</h4>
                <div className="grid grid-cols-2 gap-4">
                    <AnalysisStat label="Objectives Met" value={`${analysis.objectivesMet}/${analysis.objectivesTotal}`} />
                    <AnalysisStat label="Issues Fixed" value={`${analysis.issuesFixed}/${analysis.issuesTotal}`} />
                    <AnalysisStat label="Lines Changed" value={analysis.linesChanged.toString()} />
                    <AnalysisStat
                        label="Over-Engineering"
                        value={analysis.overEngineering ? "Detected" : "None"}
                        warning={analysis.overEngineering}
                    />
                </div>
            </div>
        </div>
    );
};

// Score grade badge
const ScoreGrade: React.FC<{ score: number }> = ({ score }) => {
    const getGrade = () => {
        if (score >= 90) return { label: "Excellent", color: "text-[var(--forge-success)] bg-[var(--forge-success)]/20" };
        if (score >= 80) return { label: "Great", color: "text-[var(--forge-info)] bg-[var(--forge-info)]/20" };
        if (score >= 70) return { label: "Good", color: "text-[var(--forge-warning)] bg-[var(--forge-warning)]/20" };
        if (score >= 60) return { label: "Fair", color: "text-[var(--ember)] bg-[var(--ember)]/20" };
        return { label: "Needs Work", color: "text-[var(--forge-error)] bg-[var(--forge-error)]/20" };
    };

    const grade = getGrade();
    return (
        <span className={cn("inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium", grade.color)}>
            {grade.label}
        </span>
    );
};

// Score bar component
interface ScoreBarProps {
    icon: React.ElementType;
    label: string;
    score: number;
    maxScore: number;
    color: "blue" | "emerald" | "purple" | "amber";
}

const ScoreBar: React.FC<ScoreBarProps> = ({ icon: Icon, label, score, maxScore, color }) => {
    const percentage = Math.min((score / maxScore) * 100, 100);
    const colorClasses = {
        blue: "bg-[var(--forge-info)]",
        emerald: "bg-[var(--forge-success)]",
        purple: "bg-[var(--ember)]",
        amber: "bg-[var(--forge-warning)]",
    }[color];

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Icon size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                    <span className="text-sm text-[var(--forge-text-secondary)]">{label}</span>
                </div>
                <span className="text-sm font-medium text-[var(--forge-text-primary)]">{score}</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--forge-bg-anvil)] overflow-hidden">
                <motion.div
                    className={cn("h-full rounded-full", colorClasses)}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        </div>
    );
};

// Analysis stat
interface AnalysisStatProps {
    label: string;
    value: string;
    warning?: boolean;
}

const AnalysisStat: React.FC<AnalysisStatProps> = ({ label, value, warning }) => (
    <div className="p-3 rounded-lg bg-[var(--forge-bg-anvil)]">
        <p className="text-xs text-[var(--forge-text-muted)] mb-1">{label}</p>
        <p className={cn("text-lg font-semibold", warning ? "text-[var(--forge-warning)]" : "text-[var(--forge-text-primary)]")}>
            {value}
        </p>
    </div>
);

// Quality gate results
interface QualityGatesProps {
    gates: QualityGateResult[];
}

export const QualityGates: React.FC<QualityGatesProps> = ({ gates }) => (
    <div className={cn("rounded-xl border border-[var(--forge-border-default)] bg-[var(--forge-bg-elevated)] p-4", elevation.elevated)}>
        <h4 className="font-semibold text-[var(--forge-text-primary)] mb-3">Quality Gates</h4>
        <div className="space-y-2">
            {gates.map((gate, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex items-center justify-between p-2 rounded-lg",
                        gate.passed ? "bg-[var(--forge-success)]/10" : "bg-[var(--forge-error)]/10"
                    )}
                >
                    <div className="flex items-center gap-2">
                        {gate.passed ? (
                            <CheckCircle size={ICON_SIZES.sm} className="text-[var(--forge-success)]" />
                        ) : (
                            <XCircle size={ICON_SIZES.sm} className="text-[var(--forge-error)]" />
                        )}
                        <span className="text-sm text-[var(--forge-text-primary)]">{gate.name}</span>
                    </div>
                    <span className="text-xs text-[var(--forge-text-muted)]">{gate.message}</span>
                </div>
            ))}
        </div>
    </div>
);
