"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import { DURATION_SLOW } from "@/app/shared/lib/motionPrimitives";

interface ProgressBarProps {
    progress: number;
    size?: "sm" | "md" | "lg";
    color?: "indigo" | "emerald" | "purple" | "cyan" | "orange";
    showLabel?: boolean;
    className?: string;
    animate?: boolean;
}

export function ProgressBar({
    progress,
    size = "md",
    color = "indigo",
    showLabel = false,
    className,
    animate = true,
}: ProgressBarProps) {
    const clampedProgress = Math.min(100, Math.max(0, progress));

    const sizeClasses = {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
    };

    const colorClasses = {
        indigo: "from-indigo-500 to-indigo-600",
        emerald: "from-emerald-500 to-emerald-600",
        purple: "from-purple-500 to-purple-600",
        cyan: "from-cyan-500 to-cyan-600",
        orange: "from-orange-500 to-orange-600",
    };

    return (
        <div className={cn("w-full", className)}>
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Progress
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {clampedProgress}%
                    </span>
                </div>
            )}
            <div
                className={cn(
                    "w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden",
                    sizeClasses[size]
                )}
                data-testid="progress-bar-track"
            >
                <motion.div
                    initial={animate ? { width: 0 } : { width: `${clampedProgress}%` }}
                    animate={{ width: `${clampedProgress}%` }}
                    transition={{ duration: DURATION_SLOW, ease: "easeOut" }}
                    className={cn(
                        "h-full bg-gradient-to-r rounded-full",
                        colorClasses[color]
                    )}
                    data-testid="progress-bar-fill"
                />
            </div>
        </div>
    );
}
