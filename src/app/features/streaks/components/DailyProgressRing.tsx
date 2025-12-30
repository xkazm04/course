"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, Check } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

interface DailyProgressRingProps {
    progress: number; // 0-100
    currentMinutes: number;
    goalMinutes: number;
    isGoalMet: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeConfig = {
    sm: { dimension: 80, stroke: 6, iconSize: 20, fontSize: "text-xs" },
    md: { dimension: 120, stroke: 8, iconSize: 28, fontSize: "text-sm" },
    lg: { dimension: 160, stroke: 10, iconSize: 36, fontSize: "text-base" },
};

export const DailyProgressRing = ({
    progress,
    currentMinutes,
    goalMinutes,
    isGoalMet,
    size = "md",
    className,
}: DailyProgressRingProps) => {
    const config = sizeConfig[size];
    const dimension = config.dimension;
    const stroke = config.stroke;
    const radius = (dimension - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const clampedProgress = Math.min(100, Math.max(0, progress));
    const offset = circumference - (clampedProgress / 100) * circumference;

    return (
        <div
            className={cn("relative inline-flex items-center justify-center", className)}
            data-testid="daily-progress-ring"
        >
            <svg
                width={dimension}
                height={dimension}
                className="transform -rotate-90"
            >
                <defs>
                    <linearGradient id="streak-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isGoalMet ? "#10b981" : "#fb923c"} />
                        <stop offset="100%" stopColor={isGoalMet ? "#059669" : "#f97316"} />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background circle */}
                <circle
                    cx={dimension / 2}
                    cy={dimension / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    className="stroke-[var(--forge-border-subtle)]"
                />

                {/* Progress circle */}
                <motion.circle
                    cx={dimension / 2}
                    cy={dimension / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    stroke="url(#streak-gradient)"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    filter={isGoalMet ? "url(#glow)" : undefined}
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isGoalMet ? (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                        className="flex flex-col items-center"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-[var(--forge-success)]/20 rounded-full blur-md" />
                            <Check
                                size={config.iconSize}
                                className="relative text-[var(--forge-success)]"
                            />
                        </div>
                        <span className={cn("font-bold text-[var(--forge-success)] mt-1", config.fontSize)}>
                            Done!
                        </span>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center"
                    >
                        <Flame
                            size={config.iconSize}
                            className="text-[var(--ember)]"
                        />
                        <span className={cn("font-bold text-[var(--forge-text-secondary)] mt-1", config.fontSize)}>
                            {currentMinutes}/{goalMinutes}
                        </span>
                        <span className="text-xs text-[var(--forge-text-muted)]">min</span>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
