"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Sparkles,
    AlertTriangle,
    CheckCircle,
    Clock,
    Users,
    DollarSign,
    Briefcase,
    ArrowUpRight,
    Info,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type {
    SkillDemandPrediction,
    IndustryTrend,
    EmergingTechTrend,
    DemandTrend,
    PredictionHorizon,
} from "../lib/predictiveTypes";

// ============================================================================
// SKILL DEMAND CARD
// ============================================================================

interface SkillDemandCardProps {
    prediction: SkillDemandPrediction;
    isRecommended?: boolean;
    onClick?: () => void;
}

const trendIcons: Record<DemandTrend, React.ReactNode> = {
    rising: <TrendingUp size={ICON_SIZES.sm} className="text-[var(--forge-success)]" />,
    stable: <Minus size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />,
    declining: <TrendingDown size={ICON_SIZES.sm} className="text-[var(--forge-error)]" />,
    emerging: <Sparkles size={ICON_SIZES.sm} className="text-[var(--ember-glow)]" />,
    saturating: <AlertTriangle size={ICON_SIZES.sm} className="text-[var(--forge-warning)]" />,
};

const trendColors: Record<DemandTrend, string> = {
    rising: "text-[var(--forge-success)] bg-[var(--forge-success)]/10",
    stable: "text-[var(--forge-text-muted)] bg-[var(--forge-bg-elevated)]",
    declining: "text-[var(--forge-error)] bg-[var(--forge-error)]/10",
    emerging: "text-[var(--ember-glow)] bg-[var(--ember-glow)]/10",
    saturating: "text-[var(--forge-warning)] bg-[var(--forge-warning)]/10",
};

export const SkillDemandCard = ({
    prediction,
    isRecommended,
    onClick,
}: SkillDemandCardProps) => {
    const prefersReducedMotion = useReducedMotion();
    const urgencyColors = {
        low: "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]",
        moderate: "bg-[var(--forge-info)]/10 text-[var(--forge-info)]",
        high: "bg-[var(--forge-warning)]/10 text-[var(--forge-warning)]",
        critical: "bg-[var(--forge-error)]/10 text-[var(--forge-error)]",
    };

    return (
        <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            onClick={onClick}
            data-testid={`skill-demand-card-${prediction.skillId}`}
            className={cn(
                "relative p-4 rounded-xl border cursor-pointer transition-all",
                "bg-[var(--forge-bg-elevated)]",
                "border-[var(--forge-border-subtle)]",
                "hover:border-[var(--ember)]",
                "hover:shadow-lg hover:shadow-[var(--ember)]/10"
            )}
        >
            {isRecommended && (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white text-[10px] font-bold rounded-full">
                    Recommended
                </span>
            )}

            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-bold text-[var(--forge-text-primary)]">
                        {prediction.skillName}
                    </h4>
                    <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1", trendColors[prediction.trend])}>
                        {trendIcons[prediction.trend]}
                        <span className="capitalize">{prediction.trend}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className={cn(
                        "text-lg font-black",
                        prediction.changePercent > 0 ? "text-[var(--forge-success)]" :
                        prediction.changePercent < 0 ? "text-[var(--forge-error)]" :
                        "text-[var(--forge-text-muted)]"
                    )}>
                        {prediction.changePercent > 0 ? "+" : ""}{prediction.changePercent}%
                    </div>
                    <div className="text-xs text-[var(--forge-text-muted)]">
                        {prediction.horizon} forecast
                    </div>
                </div>
            </div>

            {/* Demand Bars */}
            <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--forge-text-muted)] w-16">Current</span>
                    <div className="flex-1 h-2 bg-[var(--forge-bg-anvil)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--forge-text-muted)] rounded-full transition-all"
                            style={{ width: `${prediction.currentDemand}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-[var(--forge-text-muted)] w-8">
                        {prediction.currentDemand}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--forge-text-muted)] w-16">Predicted</span>
                    <div className="flex-1 h-2 bg-[var(--forge-bg-anvil)] rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all",
                                prediction.predictedDemand > prediction.currentDemand
                                    ? "bg-[var(--forge-success)]"
                                    : prediction.predictedDemand < prediction.currentDemand
                                    ? "bg-[var(--forge-error)]"
                                    : "bg-[var(--forge-text-muted)]"
                            )}
                            style={{ width: `${prediction.predictedDemand}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-[var(--forge-text-muted)] w-8">
                        {prediction.predictedDemand}
                    </span>
                </div>
            </div>

            {/* Saturation & Learning Window */}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-[var(--forge-text-muted)]">
                    <Users size={ICON_SIZES.xs} />
                    <span>Saturation: {prediction.saturationLevel}%</span>
                </div>
                <div className={cn("px-2 py-0.5 rounded-full text-xs font-medium", urgencyColors[prediction.optimalLearningWindow.urgency])}>
                    {prediction.optimalLearningWindow.urgency === "critical" && "Act Now"}
                    {prediction.optimalLearningWindow.urgency === "high" && "High Priority"}
                    {prediction.optimalLearningWindow.urgency === "moderate" && "Good Timing"}
                    {prediction.optimalLearningWindow.urgency === "low" && "Can Wait"}
                </div>
            </div>
        </motion.div>
    );
};

// ============================================================================
// INDUSTRY TREND CARD
// ============================================================================

interface IndustryTrendCardProps {
    trend: IndustryTrend;
    onClick?: () => void;
}

export const IndustryTrendCard = ({ trend, onClick }: IndustryTrendCardProps) => {
    const prefersReducedMotion = useReducedMotion();
    return (
        <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
            onClick={onClick}
            data-testid={`industry-trend-card-${trend.sector}`}
            className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all",
                "bg-[var(--forge-bg-elevated)]",
                "border-[var(--forge-border-subtle)]",
                "hover:border-[var(--forge-info)]",
                "hover:shadow-lg hover:shadow-[var(--forge-info)]/10"
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-[var(--forge-text-primary)]">{trend.name}</h4>
                <div className="flex items-center gap-1 text-[var(--forge-success)]">
                    <TrendingUp size={ICON_SIZES.sm} />
                    <span className="font-bold">+{trend.growthRate}%</span>
                </div>
            </div>

            {/* Salary Range */}
            <div className="flex items-center gap-2 mb-3 text-sm">
                <DollarSign size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                <span className="text-[var(--forge-text-secondary)]">
                    ${(trend.salaryRange.min / 1000).toFixed(0)}k - ${(trend.salaryRange.max / 1000).toFixed(0)}k
                </span>
                <span className="text-xs text-[var(--forge-text-muted)]">
                    (median: ${(trend.salaryRange.median / 1000).toFixed(0)}k)
                </span>
            </div>

            {/* Top Skills */}
            <div className="flex flex-wrap gap-1 mb-3">
                {trend.topSkills.slice(0, 4).map((skill) => (
                    <span
                        key={skill}
                        className="px-2 py-0.5 bg-[var(--forge-bg-anvil)] text-[var(--forge-text-secondary)] text-xs rounded-full"
                    >
                        {skill}
                    </span>
                ))}
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between text-xs text-[var(--forge-text-muted)]">
                <div className="flex items-center gap-1">
                    <Briefcase size={ICON_SIZES.xs} />
                    <span>{trend.remoteAvailability}% remote</span>
                </div>
                <div className={cn(
                    "px-2 py-0.5 rounded-full",
                    trend.entryBarrier === "low" && "bg-[var(--forge-success)]/10 text-[var(--forge-success)]",
                    trend.entryBarrier === "medium" && "bg-[var(--forge-warning)]/10 text-[var(--forge-warning)]",
                    trend.entryBarrier === "high" && "bg-[var(--forge-error)]/10 text-[var(--forge-error)]"
                )}>
                    {trend.entryBarrier} barrier
                </div>
            </div>
        </motion.div>
    );
};

// ============================================================================
// EMERGING TECH CARD
// ============================================================================

interface EmergingTechCardProps {
    tech: EmergingTechTrend;
    onClick?: () => void;
}

const maturityColors = {
    experimental: "bg-[var(--ember-glow)]/10 text-[var(--ember-glow)]",
    early_adoption: "bg-[var(--forge-info)]/10 text-[var(--forge-info)]",
    growth: "bg-[var(--forge-success)]/10 text-[var(--forge-success)]",
    mainstream: "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)]",
    declining: "bg-[var(--forge-error)]/10 text-[var(--forge-error)]",
};

export const EmergingTechCard = ({ tech, onClick }: EmergingTechCardProps) => {
    const prefersReducedMotion = useReducedMotion();
    return (
        <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
            onClick={onClick}
            data-testid={`emerging-tech-card-${tech.name.toLowerCase().replace(/\s+/g, '-')}`}
            className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all",
                "bg-[var(--forge-bg-elevated)]",
                "border-[var(--forge-border-subtle)]",
                "hover:border-[var(--ember-glow)]",
                "hover:shadow-lg hover:shadow-[var(--ember-glow)]/10"
            )}
        >
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-[var(--forge-text-primary)]">{tech.name}</h4>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", maturityColors[tech.maturityStage])}>
                    {tech.maturityStage.replace("_", " ")}
                </span>
            </div>

            <p className="text-sm text-[var(--forge-text-secondary)] mb-3">{tech.description}</p>

            <div className="flex items-center gap-4 text-xs text-[var(--forge-text-muted)] mb-3">
                <div className="flex items-center gap-1">
                    <Clock size={ICON_SIZES.xs} />
                    <span>{tech.timeToMainstream}mo to mainstream</span>
                </div>
                <div className={cn(
                    "flex items-center gap-1",
                    tech.riskLevel === "low" && "text-[var(--forge-success)]",
                    tech.riskLevel === "medium" && "text-[var(--forge-warning)]",
                    tech.riskLevel === "high" && "text-[var(--forge-error)]"
                )}>
                    {tech.riskLevel === "low" && <CheckCircle size={ICON_SIZES.xs} />}
                    {tech.riskLevel === "medium" && <Info size={ICON_SIZES.xs} />}
                    {tech.riskLevel === "high" && <AlertTriangle size={ICON_SIZES.xs} />}
                    <span>{tech.riskLevel} risk</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-1">
                {tech.prerequisites.map((prereq) => (
                    <span
                        key={prereq}
                        className="px-2 py-0.5 bg-[var(--ember-glow)]/10 text-[var(--ember-glow)] text-xs rounded-full"
                    >
                        {prereq}
                    </span>
                ))}
            </div>

            {tech.disruptionPotential === "transformative" && (
                <div className="mt-3 flex items-center gap-1 text-xs text-[var(--ember-glow)] font-medium">
                    <Sparkles size={ICON_SIZES.xs} />
                    <span>Transformative potential</span>
                </div>
            )}
        </motion.div>
    );
};

// ============================================================================
// HORIZON SELECTOR
// ============================================================================

interface HorizonSelectorProps {
    value: PredictionHorizon;
    onChange: (horizon: PredictionHorizon) => void;
}

const horizonOptions: { value: PredictionHorizon; label: string }[] = [
    { value: "3m", label: "3 months" },
    { value: "6m", label: "6 months" },
    { value: "12m", label: "12 months" },
    { value: "24m", label: "24 months" },
];

export const HorizonSelector = ({ value, onChange }: HorizonSelectorProps) => {
    return (
        <div className="inline-flex bg-[var(--forge-bg-elevated)] rounded-lg p-1">
            {horizonOptions.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    data-testid={`horizon-selector-${option.value}`}
                    className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                        value === option.value
                            ? "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-primary)] shadow-sm"
                            : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

// ============================================================================
// MARKET TIMING BADGE
// ============================================================================

interface MarketTimingBadgeProps {
    recommendation: "start_now" | "wait" | "accelerate" | "pivot";
}

export const MarketTimingBadge = ({ recommendation }: MarketTimingBadgeProps) => {
    const styles = {
        start_now: "bg-[var(--forge-success)]/10 text-[var(--forge-success)] border-[var(--forge-success)]/30",
        wait: "bg-[var(--forge-warning)]/10 text-[var(--forge-warning)] border-[var(--forge-warning)]/30",
        accelerate: "bg-[var(--forge-info)]/10 text-[var(--forge-info)] border-[var(--forge-info)]/30",
        pivot: "bg-[var(--ember-glow)]/10 text-[var(--ember-glow)] border-[var(--ember-glow)]/30",
    };

    const labels = {
        start_now: "Start Now",
        wait: "Wait & Watch",
        accelerate: "Accelerate",
        pivot: "Consider Pivot",
    };

    return (
        <span className={cn("px-3 py-1 rounded-full text-sm font-bold border", styles[recommendation])}>
            {labels[recommendation]}
        </span>
    );
};
