"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";

interface ProgressRingProps {
    progress: number; // 0-100
    size?: "sm" | "md" | "lg" | "xl";
    strokeWidth?: number;
    color?: string;
    showPercentage?: boolean;
    animated?: boolean;
    className?: string;
    children?: React.ReactNode;
}

const sizeConfig = {
    sm: { dimension: 48, stroke: 4, fontSize: "text-xs" },
    md: { dimension: 72, stroke: 6, fontSize: "text-sm" },
    lg: { dimension: 96, stroke: 8, fontSize: "text-lg" },
    xl: { dimension: 128, stroke: 10, fontSize: "text-2xl" },
};

const colorConfig: Record<string, { stroke: string; gradient: string }> = {
    indigo: {
        stroke: "stroke-indigo-500",
        gradient: "url(#gradient-indigo)",
    },
    purple: {
        stroke: "stroke-purple-500",
        gradient: "url(#gradient-purple)",
    },
    emerald: {
        stroke: "stroke-emerald-500",
        gradient: "url(#gradient-emerald)",
    },
    cyan: {
        stroke: "stroke-cyan-500",
        gradient: "url(#gradient-cyan)",
    },
    orange: {
        stroke: "stroke-orange-500",
        gradient: "url(#gradient-orange)",
    },
    pink: {
        stroke: "stroke-pink-500",
        gradient: "url(#gradient-pink)",
    },
    blue: {
        stroke: "stroke-blue-500",
        gradient: "url(#gradient-blue)",
    },
    amber: {
        stroke: "stroke-amber-500",
        gradient: "url(#gradient-amber)",
    },
};

export const ProgressRing = ({
    progress,
    size = "md",
    strokeWidth,
    color = "indigo",
    showPercentage = true,
    animated = true,
    className,
    children,
}: ProgressRingProps) => {
    const config = sizeConfig[size];
    const dimension = config.dimension;
    const stroke = strokeWidth || config.stroke;
    const radius = (dimension - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const clampedProgress = Math.min(100, Math.max(0, progress));
    const offset = circumference - (clampedProgress / 100) * circumference;
    const colorStyle = colorConfig[color] || colorConfig.indigo;

    return (
        <div
            className={cn("relative inline-flex items-center justify-center", className)}
            data-testid="progress-ring"
        >
            <svg
                width={dimension}
                height={dimension}
                className="transform -rotate-90"
            >
                <defs>
                    <linearGradient id="gradient-indigo" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="gradient-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="gradient-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="gradient-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fb923c" />
                        <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                    <linearGradient id="gradient-pink" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f472b6" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="gradient-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                </defs>

                {/* Background circle */}
                <circle
                    cx={dimension / 2}
                    cy={dimension / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    className="stroke-slate-200 dark:stroke-slate-700"
                />

                {/* Progress circle */}
                <motion.circle
                    cx={dimension / 2}
                    cy={dimension / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    stroke={colorStyle.gradient}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
                {children || (
                    showPercentage && (
                        <motion.span
                            className={cn(
                                "font-bold text-slate-900 dark:text-slate-100",
                                config.fontSize
                            )}
                            initial={animated ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            {Math.round(clampedProgress)}%
                        </motion.span>
                    )
                )}
            </div>
        </div>
    );
};
