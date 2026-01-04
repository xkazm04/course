"use client";

/**
 * PathModuleCard Component
 *
 * Card displaying a single module in the path preview.
 */

import React from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";
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
    /** Animation delay in seconds (overrides default stagger calculation) */
    animationDelay?: number;
    /** Hover callback */
    onHover?: (isHovering: boolean) => void;
    /** Whether to show the timeline node indicator */
    showTimelineNode?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PathModuleCard({
    module,
    index,
    isHypothetical,
    animationDelay,
    onHover,
    showTimelineNode = false,
}: PathModuleCardProps) {
    const demandIndicator = getSkillDemandIndicator(module.skillDemand);
    const duration = formatModuleDuration(module.estimatedHours);

    // Use provided delay or fallback to default stagger calculation
    const delay = animationDelay ?? index * 0.05;

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                delay,
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94] // Smooth ease-out curve
            }}
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
            {/* Timeline Node - Sequence number positioned ON the timeline spine */}
            {showTimelineNode ? (
                <motion.div
                    className={cn(
                        "absolute -left-[32px] top-3",
                        "w-6 h-6 rounded-full",
                        "flex items-center justify-center",
                        "text-xs font-bold",
                        "shadow-md ring-2 ring-[var(--forge-bg-elevated)]",
                        "z-10",
                        isHypothetical
                            ? "bg-[var(--ember)] text-white"
                            : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-primary)] border border-[var(--forge-border-subtle)]"
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        delay: delay + 0.05,
                        duration: 0.3,
                        ease: [0.34, 1.56, 0.64, 1] // Spring-like bounce
                    }}
                    data-testid={`timeline-node-${index}`}
                >
                    {index + 1}
                </motion.div>
            ) : (
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
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-2">
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
            <div className="flex flex-wrap gap-1">
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
                    className="overflow-hidden mt-2"
                >
                    <p className="text-xs text-[var(--forge-text-secondary)] line-clamp-2">
                        {module.reasoning}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}
