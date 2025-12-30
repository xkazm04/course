"use client";

/**
 * PathModuleCard Component
 *
 * Card displaying a single module in the path preview.
 */

import React from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { PredictiveModule } from "@/app/features/goal-path/lib/predictiveTypes";
import { getSkillDemandIndicator, formatModuleDuration } from "../../lib/oracleNodeMapping";

// ============================================================================
// TYPES
// ============================================================================

export interface PathModuleCardProps {
    /** Module data */
    module: PredictiveModule;
    /** Module index (0-based) */
    index: number;
    /** Whether this creates a hypothetical node */
    isHypothetical: boolean;
    /** Hover callback */
    onHover?: (isHovering: boolean) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PathModuleCard({
    module,
    index,
    isHypothetical,
    onHover,
}: PathModuleCardProps) {
    const demandIndicator = getSkillDemandIndicator(module.skillDemand);
    const duration = formatModuleDuration(module.estimatedHours);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onMouseEnter={() => onHover?.(true)}
            onMouseLeave={() => onHover?.(false)}
            className={cn(
                "relative p-3 rounded-xl",
                "border-2 transition-all duration-200",
                "cursor-pointer",
                "hover:shadow-md",
                isHypothetical
                    ? [
                        "border-dashed border-[var(--ember)]/50",
                        "bg-[var(--ember)]/5",
                    ]
                    : [
                        "border-[var(--forge-border-subtle)]",
                        "bg-[var(--forge-bg-elevated)]",
                        "hover:border-[var(--forge-text-muted)]",
                    ]
            )}
            data-testid={`module-card-${index}`}
        >
            {/* Sequence number */}
            <div
                className={cn(
                    "absolute -left-2.5 top-3",
                    "w-5 h-5 rounded-full",
                    "flex items-center justify-center",
                    "text-xs font-bold",
                    "shadow-sm",
                    isHypothetical
                        ? "bg-[var(--ember)] text-white"
                        : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-secondary)]"
                )}
            >
                {index + 1}
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-2 pl-3">
                <div className="flex-1">
                    <h4 className="text-sm font-semibold text-[var(--forge-text-primary)] line-clamp-1">
                        {module.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-[var(--forge-text-secondary)]">
                            <Clock size={10} />
                            {duration}
                        </span>
                        {isHypothetical && (
                            <span className="flex items-center gap-1 text-xs text-[var(--ember)]">
                                <Sparkles size={10} />
                                New
                            </span>
                        )}
                    </div>
                </div>

                {/* Demand indicator */}
                <div
                    className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-medium",
                        demandIndicator.color === "emerald" && "bg-[var(--forge-success)]/20 text-[var(--forge-success)]",
                        demandIndicator.color === "blue" && "bg-[var(--forge-info)]/20 text-[var(--forge-info)]",
                        demandIndicator.color === "amber" && "bg-[var(--gold)]/20 text-[var(--gold)]",
                        demandIndicator.color === "slate" && "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-secondary)]"
                    )}
                >
                    {demandIndicator.label}
                </div>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1 pl-3">
                {module.skills.slice(0, 3).map(skill => (
                    <span
                        key={skill}
                        className="px-1.5 py-0.5 rounded text-xs bg-[var(--forge-bg-anvil)] text-[var(--forge-text-secondary)]"
                    >
                        {skill}
                    </span>
                ))}
                {module.skills.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)]">
                        +{module.skills.length - 3}
                    </span>
                )}
            </div>

            {/* Reasoning (on hover) */}
            {module.reasoning && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    whileHover={{ height: "auto", opacity: 1 }}
                    className="overflow-hidden pl-3 mt-2"
                >
                    <p className="text-xs text-[var(--forge-text-secondary)] line-clamp-2">
                        {module.reasoning}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}
