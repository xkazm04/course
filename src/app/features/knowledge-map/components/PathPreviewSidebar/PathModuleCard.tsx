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
                        "border-dashed border-indigo-300 dark:border-indigo-600",
                        "bg-indigo-50/50 dark:bg-indigo-900/20",
                    ]
                    : [
                        "border-slate-200 dark:border-slate-700",
                        "bg-white dark:bg-slate-800",
                        "hover:border-slate-300 dark:hover:border-slate-600",
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
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                )}
            >
                {index + 1}
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-2 pl-3">
                <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {module.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Clock size={10} />
                            {duration}
                        </span>
                        {isHypothetical && (
                            <span className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
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
                        demandIndicator.color === "emerald" && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
                        demandIndicator.color === "blue" && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                        demandIndicator.color === "amber" && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
                        demandIndicator.color === "slate" && "bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300"
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
                        className="px-1.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    >
                        {skill}
                    </span>
                ))}
                {module.skills.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-500">
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {module.reasoning}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}
