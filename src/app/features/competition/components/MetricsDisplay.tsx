"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Clock,
    AlertTriangle,
    TrendingUp,
    Server,
    Cpu,
    HardDrive,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { PerformanceMetrics, SubmissionScores, CodeQualityScore } from "../lib/types";

interface MetricsDisplayProps {
    scores: SubmissionScores;
    variant?: "full" | "compact";
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
    scores,
    variant = "full",
}) => {
    if (variant === "compact") {
        return <CompactMetrics scores={scores} />;
    }

    return (
        <div className="space-y-6">
            {/* Overall score */}
            <div
                className={cn(
                    "rounded-xl border border-[var(--forge-border-default)]",
                    "bg-[var(--forge-bg-elevated)] p-6",
                    elevation.elevated
                )}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                            Overall Score
                        </h3>
                        <p className="text-sm text-[var(--forge-text-muted)]">
                            Combined performance metrics
                        </p>
                    </div>
                    <ScoreRing score={scores.overall} size={80} />
                </div>

                {/* Score breakdown */}
                <div className="mt-6 space-y-3">
                    {scores.breakdown.map((item) => (
                        <ScoreBreakdownItem key={item.criterionId} item={item} />
                    ))}
                </div>
            </div>

            {/* Performance metrics */}
            <PerformanceMetricsGrid metrics={scores.metrics} />

            {/* Code quality */}
            {scores.codeQuality && (
                <CodeQualityDisplay quality={scores.codeQuality} />
            )}
        </div>
    );
};

// Score ring visualization
interface ScoreRingProps {
    score: number;
    size?: number;
}

const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 80 }) => {
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;

    const getColor = () => {
        if (score >= 80) return "text-[var(--forge-success)]";
        if (score >= 60) return "text-[var(--forge-warning)]";
        return "text-[var(--forge-error)]";
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--forge-bg-anvil)"
                    strokeWidth="8"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={getColor()}
                    initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-2xl font-bold", getColor())}>
                    {score.toFixed(1)}
                </span>
            </div>
        </div>
    );
};

// Score breakdown item
interface ScoreBreakdownItemProps {
    item: SubmissionScores["breakdown"][0];
}

const ScoreBreakdownItem: React.FC<ScoreBreakdownItemProps> = ({ item }) => {
    const percentage = (item.score / item.maxScore) * 100;

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--forge-text-secondary)]">
                    {item.criterionName}
                </span>
                <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                    {item.score.toFixed(1)} / {item.maxScore}
                </span>
            </div>
            <div className="h-2 bg-[var(--forge-bg-anvil)] rounded-full overflow-hidden">
                <motion.div
                    className={cn(
                        "h-full rounded-full",
                        percentage >= 80 ? "bg-[var(--forge-success)]" :
                        percentage >= 60 ? "bg-[var(--forge-warning)]" : "bg-[var(--forge-error)]"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                />
            </div>
        </div>
    );
};

// Performance metrics grid
interface PerformanceMetricsGridProps {
    metrics: PerformanceMetrics;
}

const PerformanceMetricsGrid: React.FC<PerformanceMetricsGridProps> = ({ metrics }) => {
    return (
        <div
            className={cn(
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-elevated)] p-6",
                elevation.elevated
            )}
        >
            <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4">
                Performance Metrics
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    icon={Clock}
                    label="Response Time"
                    value={`${metrics.responseTimeP50.toFixed(0)}ms`}
                    subtext={`P95: ${metrics.responseTimeP95.toFixed(0)}ms`}
                    status={metrics.responseTimeP50 < 50 ? "good" : metrics.responseTimeP50 < 100 ? "warning" : "bad"}
                />
                <MetricCard
                    icon={AlertTriangle}
                    label="Error Rate"
                    value={`${metrics.errorRate.toFixed(2)}%`}
                    status={metrics.errorRate < 1 ? "good" : metrics.errorRate < 5 ? "warning" : "bad"}
                />
                <MetricCard
                    icon={TrendingUp}
                    label="Uptime"
                    value={`${metrics.uptime.toFixed(1)}%`}
                    status={metrics.uptime >= 99 ? "good" : metrics.uptime >= 95 ? "warning" : "bad"}
                />
                <MetricCard
                    icon={Server}
                    label="Throughput"
                    value={`${metrics.throughput.toFixed(0)}`}
                    subtext="req/sec"
                    status={metrics.throughput > 1000 ? "good" : metrics.throughput > 500 ? "warning" : "bad"}
                />
                <MetricCard
                    icon={Cpu}
                    label="CPU Usage"
                    value={`${metrics.cpuUsage.toFixed(1)}%`}
                    status={metrics.cpuUsage < 50 ? "good" : metrics.cpuUsage < 80 ? "warning" : "bad"}
                />
                <MetricCard
                    icon={HardDrive}
                    label="Memory"
                    value={`${metrics.memoryUsage.toFixed(1)}%`}
                    status={metrics.memoryUsage < 60 ? "good" : metrics.memoryUsage < 80 ? "warning" : "bad"}
                />
            </div>
        </div>
    );
};

// Metric card
interface MetricCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    subtext?: string;
    status: "good" | "warning" | "bad";
}

const MetricCard: React.FC<MetricCardProps> = ({
    icon: Icon,
    label,
    value,
    subtext,
    status,
}) => {
    const statusConfig = {
        good: { color: "text-[var(--forge-success)]", bg: "bg-[var(--forge-success)]/10" },
        warning: { color: "text-[var(--forge-warning)]", bg: "bg-[var(--forge-warning)]/10" },
        bad: { color: "text-[var(--forge-error)]", bg: "bg-[var(--forge-error)]/10" },
    }[status];

    return (
        <div className="p-4 rounded-lg bg-[var(--forge-bg-anvil)]">
            <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-lg", statusConfig.bg)}>
                    <Icon size={ICON_SIZES.sm} className={statusConfig.color} />
                </div>
            </div>
            <p className="text-xl font-bold text-[var(--forge-text-primary)]">{value}</p>
            <p className="text-xs text-[var(--forge-text-muted)]">
                {label}
                {subtext && <span className="ml-1">({subtext})</span>}
            </p>
        </div>
    );
};

// Code quality display
interface CodeQualityDisplayProps {
    quality: CodeQualityScore;
}

const CodeQualityDisplay: React.FC<CodeQualityDisplayProps> = ({ quality }) => {
    return (
        <div
            className={cn(
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-elevated)] p-6",
                elevation.elevated
            )}
        >
            <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4">
                Code Quality
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <QualityMetric label="Linting" value={quality.lintingScore} />
                {quality.typeScore !== undefined && (
                    <QualityMetric label="Types" value={quality.typeScore} />
                )}
                {quality.testCoverage !== undefined && (
                    <QualityMetric label="Tests" value={quality.testCoverage} />
                )}
                <QualityMetric label="Complexity" value={100 - quality.complexity} />
                <QualityMetric label="Duplication" value={100 - quality.duplication} />
            </div>

            {quality.securityIssues.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-[var(--forge-error)]/10 border border-[var(--forge-error)]/20">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={ICON_SIZES.sm} className="text-[var(--forge-error)]" />
                        <span className="text-sm font-medium text-[var(--forge-error)]">
                            {quality.securityIssues.length} Security Issue(s)
                        </span>
                    </div>
                    <ul className="space-y-1">
                        {quality.securityIssues.slice(0, 3).map((issue, i) => (
                            <li key={i} className="text-xs text-[var(--forge-error)]/80">
                                {issue.title}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Quality metric
interface QualityMetricProps {
    label: string;
    value: number;
}

const QualityMetric: React.FC<QualityMetricProps> = ({ label, value }) => (
    <div className="text-center">
        <div className="text-2xl font-bold text-[var(--forge-text-primary)]">{value}</div>
        <div className="text-xs text-[var(--forge-text-muted)]">{label}</div>
    </div>
);

// Compact metrics variant
const CompactMetrics: React.FC<{ scores: SubmissionScores }> = ({ scores }) => (
    <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
            <CheckCircle size={ICON_SIZES.sm} className="text-[var(--forge-success)]" />
            <span className="text-sm font-medium">{scores.overall.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)]">
            <Clock size={ICON_SIZES.xs} />
            <span>{scores.metrics.responseTimeP50.toFixed(0)}ms</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)]">
            <TrendingUp size={ICON_SIZES.xs} />
            <span>{scores.metrics.uptime.toFixed(1)}%</span>
        </div>
    </div>
);
