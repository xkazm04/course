// @ts-nocheck
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Star,
    MessageSquare,
    Clock,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Award,
    Target,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { SimulationState, ChatMessage } from "../lib/types";

interface FeedbackReviewProps {
    simulation: SimulationState;
    onClose?: () => void;
    onRetry?: () => void;
}

export const FeedbackReview: React.FC<FeedbackReviewProps> = ({
    simulation,
    onClose,
    onRetry,
}) => {
    const metrics = calculateMetrics(simulation);
    const insights = generateInsights(simulation, metrics);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-elevated)] overflow-hidden",
                elevation.elevated
            )}
        >
            {/* Header with overall score */}
            <div className="p-6 border-b border-[var(--forge-border-subtle)] bg-gradient-to-r from-[var(--ember)]/10 to-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--forge-text-primary)]">
                            Simulation Complete
                        </h3>
                        <p className="text-sm text-[var(--forge-text-muted)] mt-1">
                            Review your performance and insights
                        </p>
                    </div>
                    <ScoreRing score={metrics.overallScore} />
                </div>
            </div>

            {/* Metrics grid */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    icon={ThumbsUp}
                    label="Satisfaction"
                    value={`${simulation.clientSatisfaction}%`}
                    trend={simulation.clientSatisfaction >= 70 ? "up" : "down"}
                    color="success"
                />
                <MetricCard
                    icon={MessageSquare}
                    label="Messages"
                    value={metrics.messageCount.toString()}
                    color="info"
                />
                <MetricCard
                    icon={CheckCircle}
                    label="Requirements"
                    value={`${metrics.requirementsCompleted}/${metrics.totalRequirements}`}
                    trend={metrics.requirementsCompleted === metrics.totalRequirements ? "up" : "neutral"}
                    color="ember"
                />
                <MetricCard
                    icon={Clock}
                    label="Duration"
                    value={formatDuration(metrics.duration)}
                    color="warning"
                />
            </div>

            {/* Insights */}
            <div className="px-6 pb-6">
                <h4 className="text-sm font-semibold text-[var(--forge-text-muted)] uppercase mb-3">
                    Performance Insights
                </h4>
                <div className="space-y-3">
                    {insights.map((insight, index) => (
                        <InsightCard key={index} insight={insight} />
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-[var(--forge-border-subtle)] flex gap-3">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex-1 py-2 rounded-lg bg-[var(--ember)] text-white font-medium hover:bg-[var(--ember-glow)] transition-colors"
                    >
                        Try Again
                    </button>
                )}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-lg bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] font-medium hover:bg-[var(--forge-bg-anvil)] transition-colors"
                    >
                        Close Review
                    </button>
                )}
            </div>
        </motion.div>
    );
};

// Score ring visualization
interface ScoreRingProps {
    score: number;
}

const ScoreRing: React.FC<ScoreRingProps> = ({ score }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = score >= 80 ? "emerald" : score >= 60 ? "amber" : "red";

    return (
        <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90">
                <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    stroke="var(--forge-bg-elevated)"
                    strokeWidth="8"
                />
                <motion.circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    stroke={`var(--${color === "emerald" ? "accent-primary" : color === "amber" ? "amber-500" : "red-500"})`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`stroke-${color}-500`}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <span className={`text-2xl font-bold ${color === "emerald" ? "text-[var(--forge-success)]" : color === "amber" ? "text-[var(--forge-warning)]" : "text-[var(--forge-error)]"}`}>{score}</span>
                    <span className="text-xs text-[var(--forge-text-muted)] block">Score</span>
                </div>
            </div>
        </div>
    );
};

// Metric card
interface MetricCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    trend?: "up" | "down" | "neutral";
    color: "success" | "info" | "ember" | "warning";
}

const MetricCard: React.FC<MetricCardProps> = ({
    icon: Icon,
    label,
    value,
    trend,
    color,
}) => {
    const colorClasses = {
        success: "bg-[var(--forge-success)]/10 text-[var(--forge-success)]",
        info: "bg-[var(--forge-info)]/10 text-[var(--forge-info)]",
        ember: "bg-[var(--ember)]/10 text-[var(--ember)]",
        warning: "bg-[var(--forge-warning)]/10 text-[var(--forge-warning)]",
    };

    return (
        <div className="p-4 rounded-lg bg-[var(--forge-bg-elevated)]">
            <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-lg", colorClasses[color])}>
                    <Icon size={ICON_SIZES.sm} />
                </div>
                {trend && trend !== "neutral" && (
                    trend === "up"
                        ? <TrendingUp size={ICON_SIZES.xs} className="text-[var(--forge-success)]" />
                        : <TrendingDown size={ICON_SIZES.xs} className="text-[var(--forge-error)]" />
                )}
            </div>
            <p className="text-lg font-bold text-[var(--forge-text-primary)]">{value}</p>
            <p className="text-xs text-[var(--forge-text-muted)]">{label}</p>
        </div>
    );
};

// Insight card
interface Insight {
    type: "positive" | "negative" | "neutral";
    title: string;
    description: string;
}

interface InsightCardProps {
    insight: Insight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
    const config = {
        positive: { icon: Award, bg: "bg-[var(--forge-success)]/10", border: "border-[var(--forge-success)]/20", text: "text-[var(--forge-success)]" },
        negative: { icon: AlertTriangle, bg: "bg-[var(--forge-error)]/10", border: "border-[var(--forge-error)]/20", text: "text-[var(--forge-error)]" },
        neutral: { icon: Target, bg: "bg-[var(--forge-info)]/10", border: "border-[var(--forge-info)]/20", text: "text-[var(--forge-info)]" },
    }[insight.type];

    const Icon = config.icon;

    return (
        <div className={cn("flex gap-3 p-3 rounded-lg border", config.bg, config.border)}>
            <Icon size={ICON_SIZES.md} className={config.text} />
            <div>
                <p className={cn("font-medium text-sm", config.text)}>{insight.title}</p>
                <p className="text-xs text-[var(--forge-text-muted)] mt-0.5">{insight.description}</p>
            </div>
        </div>
    );
};

// Helper functions
interface Metrics {
    overallScore: number;
    messageCount: number;
    requirementsCompleted: number;
    totalRequirements: number;
    duration: number;
}

function calculateMetrics(simulation: SimulationState): Metrics {
    const userMessages = simulation.messages.filter(m => m.sender === "user");
    const completedReqs = simulation.requirements.filter(r => r.status === "completed");
    const startTime = simulation.messages[0]?.timestamp || simulation.startedAt;
    const endTime = simulation.completedAt || new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    const reqScore = simulation.requirements.length > 0
        ? (completedReqs.length / simulation.requirements.length) * 40
        : 40;
    const satisfactionScore = simulation.clientSatisfaction * 0.5;
    const overallScore = Math.round(reqScore + satisfactionScore + 10);

    return {
        overallScore: Math.min(100, overallScore),
        messageCount: userMessages.length,
        requirementsCompleted: completedReqs.length,
        totalRequirements: simulation.requirements.length,
        duration,
    };
}

function generateInsights(simulation: SimulationState, metrics: Metrics): Insight[] {
    const insights: Insight[] = [];

    if (simulation.clientSatisfaction >= 80) {
        insights.push({
            type: "positive",
            title: "Excellent Client Rapport",
            description: "You maintained high client satisfaction throughout the project.",
        });
    } else if (simulation.clientSatisfaction < 50) {
        insights.push({
            type: "negative",
            title: "Client Satisfaction Needs Work",
            description: "Focus on clearer communication and managing expectations.",
        });
    }

    if (metrics.requirementsCompleted === metrics.totalRequirements) {
        insights.push({
            type: "positive",
            title: "All Requirements Met",
            description: "You successfully addressed all client requirements.",
        });
    } else {
        insights.push({
            type: "neutral",
            title: "Partial Requirements",
            description: `${metrics.totalRequirements - metrics.requirementsCompleted} requirements still pending.`,
        });
    }

    return insights;
}

function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return "<1 min";
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
