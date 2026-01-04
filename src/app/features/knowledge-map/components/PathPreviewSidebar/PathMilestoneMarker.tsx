"use client";

/**
 * PathMilestoneMarker Component
 *
 * Visual marker showing a milestone in the learning path timeline.
 */

import React from "react";
import { motion } from "framer-motion";
import { Flag, TrendingUp, Briefcase, DollarSign } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { PathMilestone } from "@/app/features/goal-path/lib/predictiveTypes";

// ============================================================================
// TYPES
// ============================================================================

export interface PathMilestoneMarkerProps {
    /** Milestone data */
    milestone: PathMilestone;
    /** Animation delay in seconds */
    animationDelay?: number;
    /** Whether to show the timeline node indicator */
    showTimelineNode?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PathMilestoneMarker({ milestone, animationDelay, showTimelineNode = false }: PathMilestoneMarkerProps) {
    const delay = animationDelay ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{
                delay,
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className={cn(
                "relative my-4 py-3 px-4 rounded-xl",
                "bg-[var(--forge-success)]/10",
                "border border-[var(--forge-success)]/30"
            )}
            data-testid={`milestone-${milestone.id}`}
        >
            {/* Timeline Node - Prominent milestone marker on the spine with pulse */}
            {showTimelineNode ? (
                <div className="absolute -left-[32px] top-1/2 -translate-y-1/2">
                    {/* Pulse ring animation */}
                    <motion.div
                        className="absolute inset-0 rounded-full bg-[var(--forge-success)]"
                        initial={{ scale: 1, opacity: 0.4 }}
                        animate={{
                            scale: [1, 1.8, 1],
                            opacity: [0.4, 0, 0.4],
                        }}
                        transition={{
                            delay: delay + 0.2,
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1,
                            ease: "easeOut",
                        }}
                        data-testid={`milestone-pulse-${milestone.id}`}
                    />
                    {/* Second pulse ring (offset) */}
                    <motion.div
                        className="absolute inset-0 rounded-full bg-[var(--forge-success)]"
                        initial={{ scale: 1, opacity: 0.3 }}
                        animate={{
                            scale: [1, 2.2, 1],
                            opacity: [0.3, 0, 0.3],
                        }}
                        transition={{
                            delay: delay + 0.5,
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1,
                            ease: "easeOut",
                        }}
                    />
                    {/* Main milestone node */}
                    <motion.div
                        className={cn(
                            "relative w-8 h-8 rounded-full",
                            "bg-[var(--forge-success)]",
                            "flex items-center justify-center",
                            "shadow-lg shadow-[var(--forge-success)]/30",
                            "ring-2 ring-[var(--forge-bg-elevated)]",
                            "z-10"
                        )}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            delay: delay + 0.1,
                            duration: 0.4,
                            ease: [0.34, 1.56, 0.64, 1] // Spring-like bounce
                        }}
                        data-testid={`milestone-node-${milestone.id}`}
                    >
                        <Flag size={14} className="text-white" />
                    </motion.div>
                </div>
            ) : (
                /* Legacy flag icon position */
                <div className="absolute -top-2 left-4">
                    <div className="w-4 h-4 rounded-full bg-[var(--forge-success)] flex items-center justify-center">
                        <Flag size={10} className="text-white" />
                    </div>
                </div>
            )}

            {/* Connector lines to/from milestone on the spine */}
            {showTimelineNode && (
                <>
                    {/* Line from previous module to milestone */}
                    <motion.div
                        className="absolute -left-[19px] top-0 w-0.5 h-[calc(50%-16px)] bg-[var(--forge-success)]/40"
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        transition={{
                            delay: delay,
                            duration: 0.2,
                            ease: "easeOut"
                        }}
                        style={{ transformOrigin: "top" }}
                    />
                    {/* Line from milestone to next module */}
                    <motion.div
                        className="absolute -left-[19px] bottom-0 w-0.5 h-[calc(50%-16px)] bg-[var(--forge-success)]/40"
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        transition={{
                            delay: delay + 0.1,
                            duration: 0.2,
                            ease: "easeOut"
                        }}
                        style={{ transformOrigin: "bottom" }}
                    />
                </>
            )}

            {/* Content */}
            <div className={showTimelineNode ? "" : "pl-2"}>
                <h5 className="text-sm font-semibold text-[var(--forge-success)]">
                    {milestone.title}
                </h5>
                <p className="text-xs text-[var(--forge-success)]/80 mt-0.5">
                    Week {milestone.targetWeek}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-[var(--forge-success)]/80">
                        <TrendingUp size={10} />
                        <span>+{milestone.jobMatchIncrease}% match</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--forge-success)]/80">
                        <Briefcase size={10} />
                        <span>{milestone.jobsUnlocked} jobs</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--forge-success)]/80">
                        <DollarSign size={10} />
                        <span>+{milestone.salaryIncreasePotential}%</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
