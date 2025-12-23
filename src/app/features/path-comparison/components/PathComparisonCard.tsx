"use client";

/**
 * PathComparisonCard Component
 *
 * Displays a single learning path with comparison metrics.
 * Shows visual diff indicators (green for advantage, amber for neutral/disadvantage).
 */

import React from "react";
import { motion } from "framer-motion";
import {
    Clock,
    GitBranch,
    TrendingUp,
    Users,
    ArrowUp,
    ArrowDown,
    Minus,
    X,
    Trophy,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { PrismaticCard } from "@/app/shared/components";
import {
    DOMAIN_ICON_MAP,
    BG_COLORS,
    getGlowColor,
    toDomainColor,
} from "@/app/shared/lib/learningDomains";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { PathComparisonData, ComparisonIndicator, ComparisonDimension } from "../lib/types";
import { getIndicatorColorClass, getIndicatorBgClass } from "../lib/comparisonUtils";

interface PathComparisonCardProps {
    /** Comparison data for this path */
    data: PathComparisonData;
    /** Whether this card is the top recommendation */
    isTopPick?: boolean;
    /** Handler to remove this path from comparison */
    onRemove?: () => void;
    /** Animation delay for staggered entrance */
    animationDelay?: number;
}

const DIMENSION_ICONS: Record<ComparisonDimension, React.ComponentType<{ size?: number; className?: string }>> = {
    time_investment: Clock,
    skill_overlap: GitBranch,
    career_outcomes: TrendingUp,
    squad_activity: Users,
};

const DIMENSION_LABELS: Record<ComparisonDimension, string> = {
    time_investment: "Time Investment",
    skill_overlap: "Skill Overlap",
    career_outcomes: "Career Demand",
    squad_activity: "Squad Activity",
};

const IndicatorIcon: React.FC<{ indicator: ComparisonIndicator; className?: string }> = ({
    indicator,
    className,
}) => {
    switch (indicator) {
        case "advantage":
            return <ArrowUp size={ICON_SIZES.xs} className={cn("text-green-500", className)} />;
        case "disadvantage":
            return <ArrowDown size={ICON_SIZES.xs} className={cn("text-amber-500", className)} />;
        case "neutral":
        default:
            return <Minus size={ICON_SIZES.xs} className={cn("text-[var(--text-muted)]", className)} />;
    }
};

export const PathComparisonCard: React.FC<PathComparisonCardProps> = ({
    data,
    isTopPick = false,
    onRemove,
    animationDelay = 0,
}) => {
    const { path, scores, overallScore } = data;
    const pathColor = toDomainColor(path.color);
    const PathIcon = DOMAIN_ICON_MAP[path.icon];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ delay: animationDelay, duration: 0.3, ease: "easeOut" }}
            className="relative"
            data-testid={`comparison-card-${path.id}`}
        >
            {/* Top Pick Badge */}
            {isTopPick && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: animationDelay + 0.2 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg"
                    data-testid={`top-pick-badge-${path.id}`}
                >
                    <Trophy size={ICON_SIZES.xs} />
                    <span>Best Match</span>
                </motion.div>
            )}

            <PrismaticCard
                glowColor={getGlowColor(pathColor)}
                elevation={isTopPick ? "modal" : "hoverable"}
                className={cn(
                    "h-full",
                    isTopPick && "ring-2 ring-green-500/30"
                )}
            >
                <div className="p-6 flex flex-col h-full">
                    {/* Remove Button */}
                    {onRemove && (
                        <button
                            onClick={onRemove}
                            className="absolute top-4 right-4 p-1.5 rounded-full bg-[var(--surface-inset)] hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                            data-testid={`remove-comparison-${path.id}`}
                            aria-label={`Remove ${path.name} from comparison`}
                        >
                            <X size={ICON_SIZES.sm} />
                        </button>
                    )}

                    {/* Path Header */}
                    <div className="flex items-start gap-4 mb-6">
                        <div
                            className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0",
                                BG_COLORS[pathColor]
                            )}
                        >
                            {PathIcon && <PathIcon size={ICON_SIZES.lg} />}
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">
                                {path.name}
                            </h3>
                            <p className="text-sm text-[var(--text-muted)] line-clamp-2">
                                {path.description}
                            </p>
                        </div>
                    </div>

                    {/* Overall Score */}
                    <div className="flex items-center justify-between mb-6 p-3 rounded-xl bg-[var(--surface-inset)]">
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                            Overall Score
                        </span>
                        <div className="flex items-center gap-2">
                            <div
                                className="h-2 w-24 rounded-full bg-[var(--border-default)] overflow-hidden"
                                role="progressbar"
                                aria-valuenow={overallScore}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            >
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${overallScore}%` }}
                                    transition={{ delay: animationDelay + 0.3, duration: 0.5 }}
                                    className={cn(
                                        "h-full rounded-full",
                                        overallScore >= 80
                                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                            : overallScore >= 60
                                              ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                              : "bg-gradient-to-r from-slate-400 to-slate-500"
                                    )}
                                />
                            </div>
                            <span
                                className={cn(
                                    "text-lg font-bold",
                                    overallScore >= 80
                                        ? "text-green-500"
                                        : overallScore >= 60
                                          ? "text-amber-500"
                                          : "text-[var(--text-secondary)]"
                                )}
                            >
                                {overallScore}
                            </span>
                        </div>
                    </div>

                    {/* Dimension Scores */}
                    <div className="space-y-3 flex-1">
                        {scores.map((score, index) => {
                            const DimensionIcon = DIMENSION_ICONS[score.dimension];
                            return (
                                <motion.div
                                    key={score.dimension}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: animationDelay + 0.1 * (index + 1) }}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl border",
                                        getIndicatorBgClass(score.indicator)
                                    )}
                                    data-testid={`dimension-${score.dimension}-${path.id}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <DimensionIcon
                                            size={ICON_SIZES.sm}
                                            className="text-[var(--text-muted)]"
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-[var(--text-primary)]">
                                                {DIMENSION_LABELS[score.dimension]}
                                            </div>
                                            {score.detail && (
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {score.detail}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("font-bold", getIndicatorColorClass(score.indicator))}>
                                            {score.label}
                                        </span>
                                        <IndicatorIcon indicator={score.indicator} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Skills Preview */}
                    <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                        <div className="text-xs text-[var(--text-muted)] mb-2">Core Skills</div>
                        <div className="flex flex-wrap gap-1.5">
                            {path.skills.slice(0, 4).map((skill) => (
                                <span
                                    key={skill}
                                    className="px-2 py-1 text-xs bg-[var(--surface-inset)] text-[var(--text-secondary)] rounded-md"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </PrismaticCard>
        </motion.div>
    );
};

export default PathComparisonCard;
