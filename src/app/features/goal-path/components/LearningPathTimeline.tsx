"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
    ChevronDown,
    ChevronRight,
    Clock,
    Target,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Sparkles,
    Calendar,
    DollarSign,
    Briefcase,
    Shield,
    Lightbulb,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type {
    PredictiveLearningPath,
    PredictiveModule,
    PathMilestone,
    MarketTimingAdvice,
    PathRiskAssessment,
    AlternativePath,
} from "../lib/predictiveTypes";

// ============================================================================
// LEARNING PATH TIMELINE
// ============================================================================

interface LearningPathTimelineProps {
    path: PredictiveLearningPath;
    onModuleClick?: (module: PredictiveModule) => void;
}

export const LearningPathTimeline = ({ path, onModuleClick }: LearningPathTimelineProps) => {
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const prefersReducedMotion = useReducedMotion();

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) {
                next.delete(moduleId);
            } else {
                next.add(moduleId);
            }
            return next;
        });
    };

    return (
        <div className="space-y-6">
            {/* Path Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                        Your Path to {path.targetRole}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {path.estimatedWeeks} weeks • {path.modules.length} modules •{" "}
                        {path.modules.reduce((sum, m) => sum + m.estimatedHours, 0)} total hours
                    </p>
                </div>
                <div className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-bold",
                    path.confidence === "very_high" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    path.confidence === "high" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                    path.confidence === "medium" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    path.confidence === "low" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                    {path.confidence.replace("_", " ")} confidence
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500" />

                <div className="space-y-4">
                    {path.modules.map((module, index) => {
                        const isExpanded = expandedModules.has(module.id);
                        const milestone = path.milestones.find(
                            (m) => m.skillsAcquired.some((s) => module.skills.includes(s))
                        );

                        return (
                            <motion.div
                                key={module.id}
                                initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1 }}
                                className="relative pl-14"
                            >
                                {/* Timeline Node */}
                                <div className={cn(
                                    "absolute left-4 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-md",
                                    module.skillDemand === "rising" && "bg-emerald-500",
                                    module.skillDemand === "emerging" && "bg-purple-500",
                                    module.skillDemand === "stable" && "bg-blue-500",
                                    module.skillDemand === "declining" && "bg-red-500",
                                    module.skillDemand === "saturating" && "bg-amber-500"
                                )} />

                                {/* Module Card */}
                                <div
                                    data-testid={`module-card-${module.id}`}
                                    className={cn(
                                        "p-4 rounded-xl border transition-all cursor-pointer",
                                        "bg-white dark:bg-slate-800/50",
                                        "border-slate-200 dark:border-slate-700",
                                        "hover:border-indigo-400 dark:hover:border-indigo-500",
                                        "hover:shadow-lg"
                                    )}
                                    onClick={() => toggleModule(module.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                    MODULE {module.sequence}
                                                </span>
                                                {module.optimalWindow?.urgency === "critical" && (
                                                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full flex items-center gap-1">
                                                        <Sparkles size={ICON_SIZES.xs} />
                                                        Hot Skill
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                                                {module.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {module.reasoning}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    {module.estimatedHours}h
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    estimated
                                                </div>
                                            </div>
                                            <motion.div
                                                animate={prefersReducedMotion ? undefined : { rotate: isExpanded ? 180 : 0 }}
                                                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                                            >
                                                <ChevronDown size={ICON_SIZES.md} className="text-slate-400" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Skills Tags */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {module.skills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-lg"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                                                transition={prefersReducedMotion ? { duration: 0 } : undefined}
                                                className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700"
                                            >
                                                {module.prerequisites.length > 0 && (
                                                    <div className="mb-3">
                                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                            Prerequisites:
                                                        </span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {module.prerequisites.map((prereq) => (
                                                                <span
                                                                    key={prereq}
                                                                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full"
                                                                >
                                                                    {prereq}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {module.optimalWindow && (
                                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar size={ICON_SIZES.sm} className="text-indigo-500" />
                                                            <span className="text-slate-600 dark:text-slate-300">
                                                                Optimal learning window:{" "}
                                                                <span className="font-medium">
                                                                    {new Date(module.optimalWindow.recommendedStart).toLocaleDateString()} -{" "}
                                                                    {new Date(module.optimalWindow.windowCloses).toLocaleDateString()}
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            {module.optimalWindow.reasoning}
                                                        </p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Milestone Badge */}
                                {milestone && index === path.modules.findIndex((m) => m.skills.some((s) => milestone.skillsAcquired.includes(s))) && (
                                    <div className="mt-2 ml-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full">
                                        <Target size={ICON_SIZES.xs} />
                                        {milestone.title}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MILESTONE PROGRESS CARD
// ============================================================================

interface MilestoneProgressCardProps {
    milestones: PathMilestone[];
    currentWeek?: number;
}

export const MilestoneProgressCard = ({ milestones, currentWeek = 0 }: MilestoneProgressCardProps) => {
    const prefersReducedMotion = useReducedMotion();
    return (
        <div className="p-5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Target size={ICON_SIZES.md} className="text-indigo-500" />
                Path Milestones
            </h4>

            <div className="space-y-4">
                {milestones.map((milestone, index) => {
                    const isCompleted = currentWeek >= milestone.targetWeek;
                    const isCurrent = currentWeek > (milestones[index - 1]?.targetWeek ?? 0) && !isCompleted;

                    return (
                        <div
                            key={milestone.id}
                            data-testid={`milestone-${milestone.id}`}
                            className={cn(
                                "p-4 rounded-xl border transition-all",
                                isCompleted
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                                    : isCurrent
                                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            )}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {isCompleted ? (
                                        <CheckCircle size={ICON_SIZES.md} className="text-emerald-500" />
                                    ) : isCurrent ? (
                                        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 bg-white dark:bg-slate-800 flex items-center justify-center">
                                            <div className={cn("w-2 h-2 rounded-full bg-indigo-500", !prefersReducedMotion && "animate-pulse")} />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                                    )}
                                    <span className={cn(
                                        "font-bold",
                                        isCompleted ? "text-emerald-700 dark:text-emerald-400" :
                                        isCurrent ? "text-indigo-700 dark:text-indigo-400" :
                                        "text-slate-600 dark:text-slate-400"
                                    )}>
                                        {milestone.title}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Week {milestone.targetWeek}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-center text-sm">
                                <div>
                                    <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                                        +{milestone.jobMatchIncrease}%
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Job Match</div>
                                </div>
                                <div>
                                    <div className="text-blue-600 dark:text-blue-400 font-bold">
                                        +{milestone.jobsUnlocked}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">New Jobs</div>
                                </div>
                                <div>
                                    <div className="text-purple-600 dark:text-purple-400 font-bold">
                                        +{milestone.salaryIncreasePotential}%
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Salary Potential</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================================
// MARKET TIMING CARD
// ============================================================================

interface MarketTimingCardProps {
    advice: MarketTimingAdvice;
}

export const MarketTimingCard = ({ advice }: MarketTimingCardProps) => {
    const recommendationStyles = {
        start_now: {
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            border: "border-emerald-200 dark:border-emerald-800",
            icon: <TrendingUp className="text-emerald-500" size={ICON_SIZES.lg} />,
            title: "Start Now",
            titleColor: "text-emerald-700 dark:text-emerald-400",
        },
        wait: {
            bg: "bg-amber-50 dark:bg-amber-900/20",
            border: "border-amber-200 dark:border-amber-800",
            icon: <Clock className="text-amber-500" size={ICON_SIZES.lg} />,
            title: "Wait & Watch",
            titleColor: "text-amber-700 dark:text-amber-400",
        },
        accelerate: {
            bg: "bg-blue-50 dark:bg-blue-900/20",
            border: "border-blue-200 dark:border-blue-800",
            icon: <Sparkles className="text-blue-500" size={ICON_SIZES.lg} />,
            title: "Accelerate",
            titleColor: "text-blue-700 dark:text-blue-400",
        },
        pivot: {
            bg: "bg-purple-50 dark:bg-purple-900/20",
            border: "border-purple-200 dark:border-purple-800",
            icon: <AlertTriangle className="text-purple-500" size={ICON_SIZES.lg} />,
            title: "Consider Pivot",
            titleColor: "text-purple-700 dark:text-purple-400",
        },
    };

    const style = recommendationStyles[advice.recommendation];

    return (
        <div
            data-testid="market-timing-card"
            className={cn("p-5 rounded-xl border", style.bg, style.border)}
        >
            <div className="flex items-start gap-4 mb-4">
                {style.icon}
                <div>
                    <h4 className={cn("font-bold text-lg", style.titleColor)}>
                        Market Timing: {style.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {advice.reasoning}
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {/* Opportunity Signals */}
                <div>
                    <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                        Opportunity Signals
                    </h5>
                    <ul className="space-y-1">
                        {advice.opportunitySignals.map((signal, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <CheckCircle size={ICON_SIZES.sm} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                {signal}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Warning Signals */}
                <div>
                    <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                        Warning Signs
                    </h5>
                    <ul className="space-y-1">
                        {advice.warningSignals.map((signal, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <AlertTriangle size={ICON_SIZES.sm} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                {signal}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                    Next market review: {new Date(advice.nextReviewDate).toLocaleDateString()}
                </span>
                <button
                    data-testid="market-timing-refresh"
                    className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                    Refresh Analysis
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// RISK ASSESSMENT CARD
// ============================================================================

interface RiskAssessmentCardProps {
    assessment: PathRiskAssessment;
}

export const RiskAssessmentCard = ({ assessment }: RiskAssessmentCardProps) => {
    const riskLevelColors = {
        low: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30",
        moderate: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
        high: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
    };

    const riskItems = [
        { label: "Technology Obsolescence", value: assessment.techObsolescenceRisk },
        { label: "Market Saturation", value: assessment.marketSaturationRisk },
        { label: "AI Automation", value: assessment.automationRisk },
    ];

    return (
        <div
            data-testid="risk-assessment-card"
            className="p-5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
        >
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Shield size={ICON_SIZES.md} className="text-slate-400" />
                    Risk Assessment
                </h4>
                <span className={cn("px-3 py-1 rounded-full text-sm font-bold", riskLevelColors[assessment.overallRisk])}>
                    {assessment.overallRisk.charAt(0).toUpperCase() + assessment.overallRisk.slice(1)} Risk
                </span>
            </div>

            {/* Risk Factors */}
            <div className="space-y-3 mb-4">
                {riskItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", riskLevelColors[item.value])}>
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Mitigation Strategies */}
            <div className="mb-4">
                <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Mitigation Strategies
                </h5>
                <ul className="space-y-1">
                    {assessment.mitigationStrategies.map((strategy, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <Lightbulb size={ICON_SIZES.sm} className="text-amber-500 mt-0.5 flex-shrink-0" />
                            {strategy}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Hedge Skills */}
            <div>
                <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Recommended Hedge Skills
                </h5>
                <div className="flex flex-wrap gap-2">
                    {assessment.hedgeSkills.map((skill) => (
                        <span
                            key={skill}
                            className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-lg"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// ALTERNATIVE PATHS CARD
// ============================================================================

interface AlternativePathsCardProps {
    alternatives: AlternativePath[];
    onSelect?: (path: AlternativePath) => void;
}

export const AlternativePathsCard = ({ alternatives, onSelect }: AlternativePathsCardProps) => {
    return (
        <div
            data-testid="alternative-paths-card"
            className="p-5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
        >
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4">
                Alternative Career Paths
            </h4>

            <div className="space-y-3">
                {alternatives.map((alt) => (
                    <div
                        key={alt.name}
                        onClick={() => onSelect?.(alt)}
                        className={cn(
                            "p-4 rounded-xl border cursor-pointer transition-all",
                            "bg-slate-50 dark:bg-slate-800",
                            "border-slate-200 dark:border-slate-700",
                            "hover:border-indigo-400 dark:hover:border-indigo-500"
                        )}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h5 className="font-bold text-slate-900 dark:text-slate-100">{alt.name}</h5>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{alt.description}</p>
                            </div>
                            <ChevronRight size={ICON_SIZES.md} className="text-slate-400" />
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                            <div className={cn(
                                "flex items-center gap-1",
                                alt.riskComparison === "lower" && "text-emerald-600 dark:text-emerald-400",
                                alt.riskComparison === "similar" && "text-slate-600 dark:text-slate-400",
                                alt.riskComparison === "higher" && "text-red-600 dark:text-red-400"
                            )}>
                                <Shield size={ICON_SIZES.xs} />
                                {alt.riskComparison} risk
                            </div>
                            <div className={cn(
                                "flex items-center gap-1",
                                alt.timeComparison === "faster" && "text-emerald-600 dark:text-emerald-400",
                                alt.timeComparison === "similar" && "text-slate-600 dark:text-slate-400",
                                alt.timeComparison === "slower" && "text-amber-600 dark:text-amber-400"
                            )}>
                                <Clock size={ICON_SIZES.xs} />
                                {alt.timeComparison}
                            </div>
                            <div className={cn(
                                "flex items-center gap-1",
                                alt.salaryComparison === "higher" && "text-emerald-600 dark:text-emerald-400",
                                alt.salaryComparison === "similar" && "text-slate-600 dark:text-slate-400",
                                alt.salaryComparison === "lower" && "text-amber-600 dark:text-amber-400"
                            )}>
                                <DollarSign size={ICON_SIZES.xs} />
                                {alt.salaryComparison} salary
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
