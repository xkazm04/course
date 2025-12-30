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
                    <h3 className="text-xl font-black text-[var(--forge-text-primary)]">
                        Your Path to {path.targetRole}
                    </h3>
                    <p className="text-[var(--forge-text-muted)] mt-1">
                        {path.estimatedWeeks} weeks • {path.modules.length} modules •{" "}
                        {path.modules.reduce((sum, m) => sum + m.estimatedHours, 0)} total hours
                    </p>
                </div>
                <div className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-bold",
                    path.confidence === "very_high" && "bg-[var(--forge-success)]/10 text-[var(--forge-success)]",
                    path.confidence === "high" && "bg-[var(--forge-info)]/10 text-[var(--forge-info)]",
                    path.confidence === "medium" && "bg-[var(--forge-warning)]/10 text-[var(--forge-warning)]",
                    path.confidence === "low" && "bg-[var(--forge-error)]/10 text-[var(--forge-error)]"
                )}>
                    {path.confidence.replace("_", " ")} confidence
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--ember)] via-[var(--ember-glow)] to-[var(--forge-info)]" />

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
                                    "absolute left-4 w-5 h-5 rounded-full border-2 border-[var(--forge-bg-elevated)] shadow-md",
                                    module.skillDemand === "rising" && "bg-[var(--forge-success)]",
                                    module.skillDemand === "emerging" && "bg-[var(--ember-glow)]",
                                    module.skillDemand === "stable" && "bg-[var(--forge-info)]",
                                    module.skillDemand === "declining" && "bg-[var(--forge-error)]",
                                    module.skillDemand === "saturating" && "bg-[var(--forge-warning)]"
                                )} />

                                {/* Module Card */}
                                <div
                                    data-testid={`module-card-${module.id}`}
                                    className={cn(
                                        "p-4 rounded-xl border transition-all cursor-pointer",
                                        "bg-[var(--forge-bg-elevated)]",
                                        "border-[var(--forge-border-subtle)]",
                                        "hover:border-[var(--ember)]",
                                        "hover:shadow-lg"
                                    )}
                                    onClick={() => toggleModule(module.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-[var(--ember)]">
                                                    MODULE {module.sequence}
                                                </span>
                                                {module.optimalWindow?.urgency === "critical" && (
                                                    <span className="px-2 py-0.5 bg-[var(--forge-error)]/10 text-[var(--forge-error)] text-xs font-medium rounded-full flex items-center gap-1">
                                                        <Sparkles size={ICON_SIZES.xs} />
                                                        Hot Skill
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-[var(--forge-text-primary)] mb-1">
                                                {module.title}
                                            </h4>
                                            <p className="text-sm text-[var(--forge-text-muted)]">
                                                {module.reasoning}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-[var(--forge-text-primary)]">
                                                    {module.estimatedHours}h
                                                </div>
                                                <div className="text-xs text-[var(--forge-text-muted)]">
                                                    estimated
                                                </div>
                                            </div>
                                            <motion.div
                                                animate={prefersReducedMotion ? undefined : { rotate: isExpanded ? 180 : 0 }}
                                                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                                            >
                                                <ChevronDown size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Skills Tags */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {module.skills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-2 py-1 bg-[var(--ember)]/10 text-[var(--ember)] text-xs font-medium rounded-lg"
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
                                                className="mt-4 pt-4 border-t border-[var(--forge-border-subtle)]"
                                            >
                                                {module.prerequisites.length > 0 && (
                                                    <div className="mb-3">
                                                        <span className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wider">
                                                            Prerequisites:
                                                        </span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {module.prerequisites.map((prereq) => (
                                                                <span
                                                                    key={prereq}
                                                                    className="px-2 py-0.5 bg-[var(--forge-bg-anvil)] text-[var(--forge-text-secondary)] text-xs rounded-full"
                                                                >
                                                                    {prereq}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {module.optimalWindow && (
                                                    <div className="p-3 bg-[var(--forge-bg-anvil)] rounded-lg">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar size={ICON_SIZES.sm} className="text-[var(--ember)]" />
                                                            <span className="text-[var(--forge-text-secondary)]">
                                                                Optimal learning window:{" "}
                                                                <span className="font-medium">
                                                                    {new Date(module.optimalWindow.recommendedStart).toLocaleDateString()} -{" "}
                                                                    {new Date(module.optimalWindow.windowCloses).toLocaleDateString()}
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[var(--forge-text-muted)] mt-1">
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
                                    <div className="mt-2 ml-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-[var(--forge-text-primary)] text-xs font-bold rounded-full">
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
        <div className="p-5 bg-[var(--forge-bg-elevated)] rounded-xl border border-[var(--forge-border-subtle)]">
            <h4 className="font-bold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
                <Target size={ICON_SIZES.md} className="text-[var(--ember)]" />
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
                                    ? "bg-[var(--forge-success)]/10 border-[var(--forge-success)]/30"
                                    : isCurrent
                                    ? "bg-[var(--ember)]/10 border-[var(--ember)]/30"
                                    : "bg-[var(--forge-bg-anvil)] border-[var(--forge-border-subtle)]"
                            )}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {isCompleted ? (
                                        <CheckCircle size={ICON_SIZES.md} className="text-[var(--forge-success)]" />
                                    ) : isCurrent ? (
                                        <div className="w-5 h-5 rounded-full border-2 border-[var(--ember)] bg-[var(--forge-bg-elevated)] flex items-center justify-center">
                                            <div className={cn("w-2 h-2 rounded-full bg-[var(--ember)]", !prefersReducedMotion && "animate-pulse")} />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-[var(--forge-border-subtle)]" />
                                    )}
                                    <span className={cn(
                                        "font-bold",
                                        isCompleted ? "text-[var(--forge-success)]" :
                                        isCurrent ? "text-[var(--ember)]" :
                                        "text-[var(--forge-text-muted)]"
                                    )}>
                                        {milestone.title}
                                    </span>
                                </div>
                                <span className="text-xs text-[var(--forge-text-muted)]">
                                    Week {milestone.targetWeek}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-center text-sm">
                                <div>
                                    <div className="text-[var(--forge-success)] font-bold">
                                        +{milestone.jobMatchIncrease}%
                                    </div>
                                    <div className="text-xs text-[var(--forge-text-muted)]">Job Match</div>
                                </div>
                                <div>
                                    <div className="text-[var(--forge-info)] font-bold">
                                        +{milestone.jobsUnlocked}
                                    </div>
                                    <div className="text-xs text-[var(--forge-text-muted)]">New Jobs</div>
                                </div>
                                <div>
                                    <div className="text-[var(--ember-glow)] font-bold">
                                        +{milestone.salaryIncreasePotential}%
                                    </div>
                                    <div className="text-xs text-[var(--forge-text-muted)]">Salary Potential</div>
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
            bg: "bg-[var(--forge-success)]/10",
            border: "border-[var(--forge-success)]/30",
            icon: <TrendingUp className="text-[var(--forge-success)]" size={ICON_SIZES.lg} />,
            title: "Start Now",
            titleColor: "text-[var(--forge-success)]",
        },
        wait: {
            bg: "bg-[var(--forge-warning)]/10",
            border: "border-[var(--forge-warning)]/30",
            icon: <Clock className="text-[var(--forge-warning)]" size={ICON_SIZES.lg} />,
            title: "Wait & Watch",
            titleColor: "text-[var(--forge-warning)]",
        },
        accelerate: {
            bg: "bg-[var(--forge-info)]/10",
            border: "border-[var(--forge-info)]/30",
            icon: <Sparkles className="text-[var(--forge-info)]" size={ICON_SIZES.lg} />,
            title: "Accelerate",
            titleColor: "text-[var(--forge-info)]",
        },
        pivot: {
            bg: "bg-[var(--ember-glow)]/10",
            border: "border-[var(--ember-glow)]/30",
            icon: <AlertTriangle className="text-[var(--ember-glow)]" size={ICON_SIZES.lg} />,
            title: "Consider Pivot",
            titleColor: "text-[var(--ember-glow)]",
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
                    <p className="text-sm text-[var(--forge-text-secondary)] mt-1">
                        {advice.reasoning}
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {/* Opportunity Signals */}
                <div>
                    <h5 className="text-xs font-bold text-[var(--forge-success)] uppercase tracking-wider mb-2">
                        Opportunity Signals
                    </h5>
                    <ul className="space-y-1">
                        {advice.opportunitySignals.map((signal, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]">
                                <CheckCircle size={ICON_SIZES.sm} className="text-[var(--forge-success)] mt-0.5 flex-shrink-0" />
                                {signal}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Warning Signals */}
                <div>
                    <h5 className="text-xs font-bold text-[var(--forge-warning)] uppercase tracking-wider mb-2">
                        Warning Signs
                    </h5>
                    <ul className="space-y-1">
                        {advice.warningSignals.map((signal, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]">
                                <AlertTriangle size={ICON_SIZES.sm} className="text-[var(--forge-warning)] mt-0.5 flex-shrink-0" />
                                {signal}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--forge-border-subtle)] flex items-center justify-between text-sm">
                <span className="text-[var(--forge-text-muted)]">
                    Next market review: {new Date(advice.nextReviewDate).toLocaleDateString()}
                </span>
                <button
                    data-testid="market-timing-refresh"
                    className="text-[var(--ember)] font-medium hover:underline"
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
        low: "text-[var(--forge-success)] bg-[var(--forge-success)]/10",
        moderate: "text-[var(--forge-warning)] bg-[var(--forge-warning)]/10",
        high: "text-[var(--forge-error)] bg-[var(--forge-error)]/10",
    };

    const riskItems = [
        { label: "Technology Obsolescence", value: assessment.techObsolescenceRisk },
        { label: "Market Saturation", value: assessment.marketSaturationRisk },
        { label: "AI Automation", value: assessment.automationRisk },
    ];

    return (
        <div
            data-testid="risk-assessment-card"
            className="p-5 bg-[var(--forge-bg-elevated)] rounded-xl border border-[var(--forge-border-subtle)]"
        >
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-[var(--forge-text-primary)] flex items-center gap-2">
                    <Shield size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
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
                        <span className="text-sm text-[var(--forge-text-secondary)]">{item.label}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", riskLevelColors[item.value])}>
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Mitigation Strategies */}
            <div className="mb-4">
                <h5 className="text-xs font-bold text-[var(--forge-text-muted)] uppercase tracking-wider mb-2">
                    Mitigation Strategies
                </h5>
                <ul className="space-y-1">
                    {assessment.mitigationStrategies.map((strategy, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--forge-text-secondary)]">
                            <Lightbulb size={ICON_SIZES.sm} className="text-[var(--forge-warning)] mt-0.5 flex-shrink-0" />
                            {strategy}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Hedge Skills */}
            <div>
                <h5 className="text-xs font-bold text-[var(--forge-text-muted)] uppercase tracking-wider mb-2">
                    Recommended Hedge Skills
                </h5>
                <div className="flex flex-wrap gap-2">
                    {assessment.hedgeSkills.map((skill) => (
                        <span
                            key={skill}
                            className="px-2 py-1 bg-[var(--ember)]/10 text-[var(--ember)] text-xs font-medium rounded-lg"
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
            className="p-5 bg-[var(--forge-bg-elevated)] rounded-xl border border-[var(--forge-border-subtle)]"
        >
            <h4 className="font-bold text-[var(--forge-text-primary)] mb-4">
                Alternative Career Paths
            </h4>

            <div className="space-y-3">
                {alternatives.map((alt) => (
                    <div
                        key={alt.name}
                        onClick={() => onSelect?.(alt)}
                        className={cn(
                            "p-4 rounded-xl border cursor-pointer transition-all",
                            "bg-[var(--forge-bg-anvil)]",
                            "border-[var(--forge-border-subtle)]",
                            "hover:border-[var(--ember)]"
                        )}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h5 className="font-bold text-[var(--forge-text-primary)]">{alt.name}</h5>
                                <p className="text-sm text-[var(--forge-text-muted)]">{alt.description}</p>
                            </div>
                            <ChevronRight size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                            <div className={cn(
                                "flex items-center gap-1",
                                alt.riskComparison === "lower" && "text-[var(--forge-success)]",
                                alt.riskComparison === "similar" && "text-[var(--forge-text-muted)]",
                                alt.riskComparison === "higher" && "text-[var(--forge-error)]"
                            )}>
                                <Shield size={ICON_SIZES.xs} />
                                {alt.riskComparison} risk
                            </div>
                            <div className={cn(
                                "flex items-center gap-1",
                                alt.timeComparison === "faster" && "text-[var(--forge-success)]",
                                alt.timeComparison === "similar" && "text-[var(--forge-text-muted)]",
                                alt.timeComparison === "slower" && "text-[var(--forge-warning)]"
                            )}>
                                <Clock size={ICON_SIZES.xs} />
                                {alt.timeComparison}
                            </div>
                            <div className={cn(
                                "flex items-center gap-1",
                                alt.salaryComparison === "higher" && "text-[var(--forge-success)]",
                                alt.salaryComparison === "similar" && "text-[var(--forge-text-muted)]",
                                alt.salaryComparison === "lower" && "text-[var(--forge-warning)]"
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
