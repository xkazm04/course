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
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PathMilestoneMarker({ milestone }: PathMilestoneMarkerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "relative my-4 py-3 px-4 rounded-xl",
                "bg-gradient-to-r from-emerald-50 to-teal-50",
                "dark:from-emerald-900/20 dark:to-teal-900/20",
                "border border-emerald-200 dark:border-emerald-800"
            )}
            data-testid={`milestone-${milestone.id}`}
        >
            {/* Flag icon */}
            <div className="absolute -top-2 left-4">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Flag size={10} className="text-white" />
                </div>
            </div>

            {/* Content */}
            <div className="pl-2">
                <h5 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    {milestone.title}
                </h5>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Week {milestone.targetWeek}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <TrendingUp size={10} />
                        <span>+{milestone.jobMatchIncrease}% match</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <Briefcase size={10} />
                        <span>{milestone.jobsUnlocked} jobs</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <DollarSign size={10} />
                        <span>+{milestone.salaryIncreasePotential}%</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
