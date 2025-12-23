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
    rising: <TrendingUp size={ICON_SIZES.sm} className="text-emerald-500" />,
    stable: <Minus size={ICON_SIZES.sm} className="text-slate-400" />,
    declining: <TrendingDown size={ICON_SIZES.sm} className="text-red-500" />,
    emerging: <Sparkles size={ICON_SIZES.sm} className="text-purple-500" />,
    saturating: <AlertTriangle size={ICON_SIZES.sm} className="text-amber-500" />,
};

const trendColors: Record<DemandTrend, string> = {
    rising: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30",
    stable: "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/50",
    declining: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30",
    emerging: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30",
    saturating: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30",
};

export const SkillDemandCard = ({
    prediction,
    isRecommended,
    onClick,
}: SkillDemandCardProps) => {
    const prefersReducedMotion = useReducedMotion();
    const urgencyColors = {
        low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
        moderate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        high: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };

    return (
        <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            onClick={onClick}
            data-testid={`skill-demand-card-${prediction.skillId}`}
            className={cn(
                "relative p-4 rounded-xl border cursor-pointer transition-all",
                "bg-white dark:bg-slate-800/50",
                "border-slate-200 dark:border-slate-700",
                "hover:border-indigo-400 dark:hover:border-indigo-500",
                "hover:shadow-lg hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/20"
            )}
        >
            {isRecommended && (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold rounded-full">
                    Recommended
                </span>
            )}

            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
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
                        prediction.changePercent > 0 ? "text-emerald-600 dark:text-emerald-400" :
                        prediction.changePercent < 0 ? "text-red-600 dark:text-red-400" :
                        "text-slate-600 dark:text-slate-400"
                    )}>
                        {prediction.changePercent > 0 ? "+" : ""}{prediction.changePercent}%
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {prediction.horizon} forecast
                    </div>
                </div>
            </div>

            {/* Demand Bars */}
            <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-16">Current</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-slate-400 dark:bg-slate-500 rounded-full transition-all"
                            style={{ width: `${prediction.currentDemand}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8">
                        {prediction.currentDemand}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-16">Predicted</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all",
                                prediction.predictedDemand > prediction.currentDemand
                                    ? "bg-emerald-500"
                                    : prediction.predictedDemand < prediction.currentDemand
                                    ? "bg-red-500"
                                    : "bg-slate-400"
                            )}
                            style={{ width: `${prediction.predictedDemand}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8">
                        {prediction.predictedDemand}
                    </span>
                </div>
            </div>

            {/* Saturation & Learning Window */}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
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
                "bg-white dark:bg-slate-800/50",
                "border-slate-200 dark:border-slate-700",
                "hover:border-cyan-400 dark:hover:border-cyan-500",
                "hover:shadow-lg hover:shadow-cyan-100/50 dark:hover:shadow-cyan-900/20"
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{trend.name}</h4>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={ICON_SIZES.sm} />
                    <span className="font-bold">+{trend.growthRate}%</span>
                </div>
            </div>

            {/* Salary Range */}
            <div className="flex items-center gap-2 mb-3 text-sm">
                <DollarSign size={ICON_SIZES.sm} className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">
                    ${(trend.salaryRange.min / 1000).toFixed(0)}k - ${(trend.salaryRange.max / 1000).toFixed(0)}k
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                    (median: ${(trend.salaryRange.median / 1000).toFixed(0)}k)
                </span>
            </div>

            {/* Top Skills */}
            <div className="flex flex-wrap gap-1 mb-3">
                {trend.topSkills.slice(0, 4).map((skill) => (
                    <span
                        key={skill}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full"
                    >
                        {skill}
                    </span>
                ))}
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                    <Briefcase size={ICON_SIZES.xs} />
                    <span>{trend.remoteAvailability}% remote</span>
                </div>
                <div className={cn(
                    "px-2 py-0.5 rounded-full",
                    trend.entryBarrier === "low" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    trend.entryBarrier === "medium" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    trend.entryBarrier === "high" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
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
    experimental: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    early_adoption: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    growth: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    mainstream: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    declining: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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
                "bg-white dark:bg-slate-800/50",
                "border-slate-200 dark:border-slate-700",
                "hover:border-purple-400 dark:hover:border-purple-500",
                "hover:shadow-lg hover:shadow-purple-100/50 dark:hover:shadow-purple-900/20"
            )}
        >
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{tech.name}</h4>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", maturityColors[tech.maturityStage])}>
                    {tech.maturityStage.replace("_", " ")}
                </span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{tech.description}</p>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                <div className="flex items-center gap-1">
                    <Clock size={ICON_SIZES.xs} />
                    <span>{tech.timeToMainstream}mo to mainstream</span>
                </div>
                <div className={cn(
                    "flex items-center gap-1",
                    tech.riskLevel === "low" && "text-emerald-600 dark:text-emerald-400",
                    tech.riskLevel === "medium" && "text-amber-600 dark:text-amber-400",
                    tech.riskLevel === "high" && "text-red-600 dark:text-red-400"
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
                        className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs rounded-full"
                    >
                        {prereq}
                    </span>
                ))}
            </div>

            {tech.disruptionPotential === "transformative" && (
                <div className="mt-3 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
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
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {horizonOptions.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    data-testid={`horizon-selector-${option.value}`}
                    className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                        value === option.value
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
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
        start_now: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
        wait: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
        accelerate: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        pivot: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
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
