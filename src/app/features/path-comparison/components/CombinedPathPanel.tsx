"use client";

/**
 * CombinedPathPanel Component
 *
 * Shows the combined analysis when learning multiple paths together.
 * Displays total time, efficiency gains, suggested order, and recommendations.
 */

import React from "react";
import { motion } from "framer-motion";
import {
    Clock,
    Zap,
    TrendingUp,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    BookOpen,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { CombinedPathAnalysis } from "../lib/types";
import type { LearningPath } from "@/app/shared/lib/types";
import {
    toDomainColor,
    BG_COLORS,
    DOMAIN_ICON_MAP,
} from "@/app/shared/lib/learningDomains";

interface CombinedPathPanelProps {
    /** Combined path analysis */
    analysis: CombinedPathAnalysis;
    /** Selected learning paths for icon/name display */
    selectedPaths: LearningPath[];
}

const StatBlock: React.FC<{
    icon: React.ReactNode;
    value: string | number;
    label: string;
    subtext?: string;
    variant?: "default" | "success" | "warning";
}> = ({ icon, value, label, subtext, variant = "default" }) => (
    <div
        className={cn(
            "flex items-center gap-3 p-3 rounded-xl",
            variant === "success" && "bg-green-500/10 border border-green-500/20",
            variant === "warning" && "bg-amber-500/10 border border-amber-500/20",
            variant === "default" && "bg-[var(--surface-elevated)] border border-[var(--border-default)]"
        )}
    >
        <div
            className={cn(
                "p-2 rounded-lg",
                variant === "success" && "bg-green-500/20 text-green-500",
                variant === "warning" && "bg-amber-500/20 text-amber-500",
                variant === "default" && "bg-[var(--surface-inset)] text-[var(--text-muted)]"
            )}
        >
            {icon}
        </div>
        <div>
            <div className="text-lg font-bold text-[var(--text-primary)]">{value}</div>
            <div className="text-xs text-[var(--text-muted)]">{label}</div>
            {subtext && <div className="text-xs text-[var(--text-muted)] mt-0.5">{subtext}</div>}
        </div>
    </div>
);

export const CombinedPathPanel: React.FC<CombinedPathPanelProps> = ({
    analysis,
    selectedPaths,
}) => {
    const {
        totalHours,
        effectiveHours,
        hoursSaved,
        efficiencyGain,
        totalUniqueSkills,
        totalCourses,
        suggestedOrder,
        isRecommendedCombo,
        recommendation,
    } = analysis;

    // Get path objects in suggested order
    const orderedPaths = suggestedOrder
        .map(id => selectedPaths.find(p => p.id === id))
        .filter((p): p is LearningPath => p !== undefined);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 p-4 bg-[var(--surface-inset)] rounded-xl"
            data-testid="combined-path-panel"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap size={ICON_SIZES.md} className="text-amber-500" />
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                        Combined Path Analysis
                    </h3>
                </div>
                {isRecommendedCombo && (
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-medium border border-green-500/20"
                    >
                        <Sparkles size={ICON_SIZES.xs} />
                        Recommended Combo
                    </motion.div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="combined-stats-grid">
                <StatBlock
                    icon={<Clock size={ICON_SIZES.sm} />}
                    value={`${totalHours}h`}
                    label="Total Time"
                    subtext={`${totalCourses} courses`}
                />
                <StatBlock
                    icon={<TrendingUp size={ICON_SIZES.sm} />}
                    value={`${effectiveHours}h`}
                    label="Effective Time"
                    subtext={hoursSaved > 0 ? `Save ~${hoursSaved}h` : "No overlap savings"}
                    variant={hoursSaved > 0 ? "success" : "default"}
                />
                <StatBlock
                    icon={<Zap size={ICON_SIZES.sm} />}
                    value={`${efficiencyGain}%`}
                    label="Efficiency Gain"
                    variant={efficiencyGain > 10 ? "success" : "default"}
                />
                <StatBlock
                    icon={<BookOpen size={ICON_SIZES.sm} />}
                    value={totalUniqueSkills.length}
                    label="Total Skills"
                    subtext="Unique skills gained"
                />
            </div>

            {/* Suggested Learning Order */}
            <div className="space-y-3" data-testid="suggested-order-section">
                <div className="flex items-center gap-2">
                    <ArrowRight size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">
                        Suggested Learning Order
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {orderedPaths.map((path, index) => {
                        const PathIcon = DOMAIN_ICON_MAP[path.icon];
                        const pathColor = toDomainColor(path.color);
                        return (
                            <React.Fragment key={path.id}>
                                {index > 0 && (
                                    <ArrowRight
                                        size={ICON_SIZES.sm}
                                        className="text-[var(--text-muted)]"
                                    />
                                )}
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-xl border",
                                        "bg-[var(--surface-elevated)] border-[var(--border-default)]"
                                    )}
                                    data-testid={`order-step-${index + 1}`}
                                >
                                    <span className="text-xs font-bold text-[var(--text-muted)] w-5 h-5 flex items-center justify-center bg-[var(--surface-inset)] rounded-full">
                                        {index + 1}
                                    </span>
                                    <div
                                        className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center text-white",
                                            BG_COLORS[pathColor]
                                        )}
                                    >
                                        {PathIcon && <PathIcon size={ICON_SIZES.xs} />}
                                    </div>
                                    <span className="text-sm font-medium text-[var(--text-primary)]">
                                        {path.name.split(' ')[0]}
                                    </span>
                                </motion.div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Recommendation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={cn(
                    "flex items-start gap-3 p-4 rounded-xl",
                    isRecommendedCombo
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-[var(--surface-elevated)] border border-[var(--border-default)]"
                )}
                data-testid="recommendation-section"
            >
                {isRecommendedCombo ? (
                    <CheckCircle2 size={ICON_SIZES.md} className="text-green-500 shrink-0 mt-0.5" />
                ) : (
                    <AlertCircle size={ICON_SIZES.md} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                )}
                <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                        {recommendation}
                    </p>
                    {hoursSaved > 0 && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            Overlapping content means you can learn both paths in less time than taking them separately.
                        </p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CombinedPathPanel;
