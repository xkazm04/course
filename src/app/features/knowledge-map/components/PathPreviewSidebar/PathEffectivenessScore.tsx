"use client";

/**
 * PathEffectivenessScore Component
 *
 * Displays a compound effectiveness metric combining module count, hours,
 * skill demand trends, and market fit into a single actionable score.
 * Features drill-down capability to show factor breakdown.
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp,
    Shield,
    Clock,
    Brain,
    Zap,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    AlertCircle,
    Info,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { PredictiveLearningPath } from "@/app/features/goal-path/lib/predictiveTypes";
import {
    calculatePathEffectiveness,
    getTierLabel,
    type EffectivenessFactor,
} from "../../lib/pathEffectiveness";
import { AnimatedCounter } from "./AnimatedCounter";

// ============================================================================
// TYPES
// ============================================================================

export interface PathEffectivenessScoreProps {
    /** Generated learning path */
    path: PredictiveLearningPath;
    /** Animation delay for stagger effects */
    animationDelay?: number;
}

// ============================================================================
// FACTOR ICONS
// ============================================================================

const FACTOR_ICONS: Record<string, React.ElementType> = {
    "Market Demand": TrendingUp,
    "Path Confidence": Brain,
    "Time Efficiency": Clock,
    "Risk Profile": Shield,
    "Market Timing": Zap,
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FactorRowProps {
    factor: EffectivenessFactor;
    index: number;
    isExpanded: boolean;
}

function FactorRow({ factor, index, isExpanded }: FactorRowProps) {
    const Icon = FACTOR_ICONS[factor.name] || Info;

    const statusColors = {
        positive: "text-[var(--forge-success)]",
        neutral: "text-[var(--forge-text-secondary)]",
        negative: "text-[var(--gold)]",
    };

    const statusBgColors = {
        positive: "bg-[var(--forge-success)]/10",
        neutral: "bg-[var(--forge-bg-anvil)]",
        negative: "bg-[var(--gold)]/10",
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className="py-2"
            data-testid={`factor-row-${factor.name.toLowerCase().replace(/\s+/g, "-")}`}
        >
            <div className="flex items-center justify-between gap-2">
                {/* Factor info */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                        className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0",
                            statusBgColors[factor.status]
                        )}
                    >
                        <Icon size={12} className={statusColors[factor.status]} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-[var(--forge-text-primary)] truncate">
                            {factor.name}
                        </span>
                        {isExpanded && (
                            <span className="text-[10px] text-[var(--forge-text-muted)] truncate">
                                {factor.description}
                            </span>
                        )}
                    </div>
                </div>

                {/* Score bar */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-16 h-1.5 bg-[var(--forge-bg-void)] rounded-full overflow-hidden">
                        <motion.div
                            className={cn(
                                "h-full rounded-full",
                                factor.status === "positive" && "bg-[var(--forge-success)]",
                                factor.status === "neutral" && "bg-[var(--forge-text-muted)]",
                                factor.status === "negative" && "bg-[var(--gold)]"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${factor.score}%` }}
                            transition={{ delay: index * 0.05 + 0.1, duration: 0.4 }}
                        />
                    </div>
                    <span
                        className="text-xs font-bold text-[var(--forge-text-primary)] w-7 text-right"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {factor.score}
                    </span>
                </div>
            </div>

            {/* Details (expanded) */}
            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1.5 ml-8"
                >
                    <p className="text-[10px] text-[var(--forge-text-secondary)] leading-relaxed">
                        {factor.details}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PathEffectivenessScore({
    path,
    animationDelay = 0,
}: PathEffectivenessScoreProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate effectiveness score
    const effectiveness = useMemo(() => {
        return calculatePathEffectiveness(path);
    }, [path]);

    const tierColorClass = useMemo(() => {
        switch (effectiveness.tier) {
            case "excellent":
                return "text-[var(--forge-success)]";
            case "good":
                return "text-[var(--forge-info)]";
            case "fair":
                return "text-[var(--gold)]";
            case "poor":
                return "text-[var(--forge-error)]";
        }
    }, [effectiveness.tier]);

    const tierBgClass = useMemo(() => {
        switch (effectiveness.tier) {
            case "excellent":
                return "from-[var(--forge-success)]/10 to-[var(--forge-success)]/5";
            case "good":
                return "from-[var(--forge-info)]/10 to-[var(--forge-info)]/5";
            case "fair":
                return "from-[var(--gold)]/10 to-[var(--gold)]/5";
            case "poor":
                return "from-[var(--forge-error)]/10 to-[var(--forge-error)]/5";
        }
    }, [effectiveness.tier]);

    const tierRingClass = useMemo(() => {
        switch (effectiveness.tier) {
            case "excellent":
                return "stroke-[var(--forge-success)]";
            case "good":
                return "stroke-[var(--forge-info)]";
            case "fair":
                return "stroke-[var(--gold)]";
            case "poor":
                return "stroke-[var(--forge-error)]";
        }
    }, [effectiveness.tier]);

    // SVG ring calculation
    const size = 72;
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (effectiveness.overallScore / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay, duration: 0.3 }}
            className={cn(
                "rounded-xl overflow-hidden",
                "bg-gradient-to-br",
                tierBgClass,
                "border border-[var(--forge-border-subtle)]"
            )}
            data-testid="path-effectiveness-score"
        >
            {/* Main score display (always visible) */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-full p-3 flex items-center gap-3",
                    "cursor-pointer transition-colors",
                    "hover:bg-white/5"
                )}
                data-testid="effectiveness-toggle-btn"
            >
                {/* Score ring */}
                <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
                    <svg
                        width={size}
                        height={size}
                        className="transform -rotate-90"
                    >
                        {/* Background track */}
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            strokeWidth={strokeWidth}
                            className="stroke-[var(--forge-border-subtle)]"
                            opacity={0.5}
                        />
                        {/* Progress */}
                        <motion.circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            strokeWidth={strokeWidth}
                            className={tierRingClass}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1, ease: "easeOut", delay: animationDelay + 0.2 }}
                        />
                    </svg>
                    {/* Center score */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <AnimatedCounter
                            value={effectiveness.overallScore}
                            duration={0.8}
                            delay={animationDelay + 0.3}
                            className={cn("text-lg font-bold", tierColorClass)}
                        />
                        <span className="text-[9px] text-[var(--forge-text-muted)] uppercase tracking-wider">
                            score
                        </span>
                    </div>
                </div>

                {/* Summary */}
                <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className={cn("text-sm font-bold", tierColorClass)}>
                            {getTierLabel(effectiveness.tier)}
                        </span>
                        <span className="text-xs text-[var(--forge-text-muted)]">
                            Path Effectiveness
                        </span>
                    </div>
                    <p className="text-[11px] text-[var(--forge-text-secondary)] mt-0.5 line-clamp-2">
                        {effectiveness.summary}
                    </p>
                </div>

                {/* Expand indicator */}
                <div className="flex-shrink-0 p-1">
                    {isExpanded ? (
                        <ChevronUp size={14} className="text-[var(--forge-text-muted)]" />
                    ) : (
                        <ChevronDown size={14} className="text-[var(--forge-text-muted)]" />
                    )}
                </div>
            </button>

            {/* Expanded details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                        data-testid="effectiveness-details"
                    >
                        <div className="px-3 pb-3 border-t border-[var(--forge-border-subtle)]/50">
                            {/* Factor breakdown */}
                            <div className="mt-2">
                                <h4 className="text-[10px] uppercase tracking-wider text-[var(--forge-text-muted)] mb-1">
                                    Factor Breakdown
                                </h4>
                                <div className="divide-y divide-[var(--forge-border-subtle)]/30">
                                    {effectiveness.factors.map((factor, index) => (
                                        <FactorRow
                                            key={factor.name}
                                            factor={factor}
                                            index={index}
                                            isExpanded={isExpanded}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Strengths & Concerns */}
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {/* Strengths */}
                                {effectiveness.strengths.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] uppercase tracking-wider text-[var(--forge-success)] mb-1 flex items-center gap-1">
                                            <CheckCircle size={10} />
                                            Strengths
                                        </h4>
                                        <ul className="space-y-0.5">
                                            {effectiveness.strengths.slice(0, 2).map((s, i) => (
                                                <li
                                                    key={i}
                                                    className="text-[10px] text-[var(--forge-text-secondary)] line-clamp-2"
                                                >
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Concerns */}
                                {effectiveness.concerns.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] uppercase tracking-wider text-[var(--gold)] mb-1 flex items-center gap-1">
                                            <AlertCircle size={10} />
                                            Watch
                                        </h4>
                                        <ul className="space-y-0.5">
                                            {effectiveness.concerns.slice(0, 2).map((c, i) => (
                                                <li
                                                    key={i}
                                                    className="text-[10px] text-[var(--forge-text-secondary)] line-clamp-2"
                                                >
                                                    {c}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Recommendation */}
                            <div className="mt-3 p-2 rounded-lg bg-[var(--forge-bg-anvil)]">
                                <p className="text-[11px] text-[var(--forge-text-primary)]">
                                    {effectiveness.recommendation}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
