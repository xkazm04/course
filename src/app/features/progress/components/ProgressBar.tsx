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
        indigo: "bg-[var(--ember)]",
        emerald: "bg-[var(--forge-success)]",
        purple: "bg-[var(--ember)]",
        cyan: "bg-[var(--ember)]",
        orange: "bg-[var(--forge-warning)]",
    };

    return (
        <div className={cn("w-full", className)}>
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-[var(--forge-text-secondary)]">
                        Progress
                    </span>
                    <span className="text-xs font-bold text-[var(--forge-text-primary)]">
                        {clampedProgress}%
                    </span>
                </div>
            )}
            <div
                className={cn(
                    "w-full bg-[var(--forge-bg-anvil)] rounded-full overflow-hidden",
                    sizeClasses[size]
                )}
                data-testid="progress-bar-track"
            >
                <motion.div
                    initial={animate ? { width: 0 } : { width: `${clampedProgress}%` }}
                    animate={{ width: `${clampedProgress}%` }}
                    transition={{ duration: DURATION_SLOW, ease: "easeOut" }}
                    className={cn(
                        "h-full rounded-full",
                        colorClasses[color]
                    )}
                    data-testid="progress-bar-fill"
                />
            </div>
        </div>
    );
}
