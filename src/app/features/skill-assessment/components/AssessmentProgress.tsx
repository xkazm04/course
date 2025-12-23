"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";

interface AssessmentProgressProps {
    current: number;
    total: number;
    className?: string;
}

/**
 * Animated progress indicator for the skill assessment
 */
export const AssessmentProgress = ({
    current,
    total,
    className,
}: AssessmentProgressProps) => {
    const progress = Math.round((current / total) * 100);

    return (
        <div className={cn("w-full", className)} data-testid="assessment-progress">
            {/* Progress bar container */}
            <div className="relative h-1.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                />
                {/* Shimmer effect */}
                <motion.div
                    className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: [-80, 400] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                    }}
                />
            </div>

            {/* Question counter */}
            <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Question {current + 1} of {total}
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {progress}%
                </span>
            </div>
        </div>
    );
};
