"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import { RadarChartData, CATEGORY_CONFIG, SkillCategory } from "../lib/types";

interface SkillRadarChartProps {
    data: RadarChartData[];
    size?: number;
    showLabels?: boolean;
    animated?: boolean;
    className?: string;
    onCategoryClick?: (category: string) => void;
}

export const SkillRadarChart = ({
    data,
    size = 280,
    showLabels = true,
    animated = true,
    className,
    onCategoryClick,
}: SkillRadarChartProps) => {
    const center = size / 2;
    const maxRadius = (size / 2) - 40; // Leave room for labels
    const levels = 5; // Number of concentric circles
    const angleStep = (2 * Math.PI) / data.length;

    // Calculate polygon points for each level
    const getLevelPoints = (level: number) => {
        const radius = (maxRadius / levels) * level;
        return data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return `${x},${y}`;
        }).join(" ");
    };

    // Calculate data polygon points
    const dataPoints = useMemo(() => {
        return data.map((item, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const radius = (item.value / item.maxValue) * maxRadius;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return { x, y, value: item.value, category: item.category, label: item.label };
        });
    }, [data, angleStep, maxRadius, center]);

    const dataPointsString = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

    // Calculate label positions
    const labelPositions = useMemo(() => {
        return data.map((item, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const radius = maxRadius + 25;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return { x, y, label: item.label, category: item.category, value: item.value };
        });
    }, [data, angleStep, maxRadius, center]);

    return (
        <div className={cn("relative", className)} data-testid="skill-radar-chart">
            <svg width={size} height={size} className="overflow-visible">
                <defs>
                    <linearGradient id="radar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
                        <stop offset="100%" stopColor="rgba(168, 85, 247, 0.3)" />
                    </linearGradient>
                    <linearGradient id="radar-stroke-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                </defs>

                {/* Background levels */}
                {Array.from({ length: levels }, (_, i) => (
                    <polygon
                        key={`level-${i}`}
                        points={getLevelPoints(i + 1)}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1}
                        className="text-slate-200 dark:text-slate-700"
                    />
                ))}

                {/* Axis lines */}
                {data.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const x2 = center + maxRadius * Math.cos(angle);
                    const y2 = center + maxRadius * Math.sin(angle);
                    return (
                        <line
                            key={`axis-${i}`}
                            x1={center}
                            y1={center}
                            x2={x2}
                            y2={y2}
                            stroke="currentColor"
                            strokeWidth={1}
                            className="text-slate-200 dark:text-slate-700"
                        />
                    );
                })}

                {/* Data polygon */}
                <motion.polygon
                    points={dataPointsString}
                    fill="url(#radar-gradient)"
                    stroke="url(#radar-stroke-gradient)"
                    strokeWidth={2}
                    initial={animated ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ transformOrigin: `${center}px ${center}px` }}
                />

                {/* Data points */}
                {dataPoints.map((point, i) => (
                    <motion.circle
                        key={`point-${i}`}
                        cx={point.x}
                        cy={point.y}
                        r={6}
                        className="fill-white dark:fill-slate-900 stroke-indigo-500"
                        strokeWidth={2}
                        initial={animated ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: animated ? 0.8 + i * 0.1 : 0 }}
                        style={{ cursor: onCategoryClick ? "pointer" : "default" }}
                        onClick={() => onCategoryClick?.(point.category)}
                        data-testid={`radar-point-${point.category}`}
                    />
                ))}
            </svg>

            {/* Labels */}
            {showLabels && labelPositions.map((pos, i) => {
                const config = CATEGORY_CONFIG[pos.category as SkillCategory];
                return (
                    <motion.button
                        key={`label-${i}`}
                        className={cn(
                            "absolute transform -translate-x-1/2 -translate-y-1/2",
                            "text-xs font-semibold text-slate-600 dark:text-slate-400",
                            "hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors",
                            onCategoryClick && "cursor-pointer"
                        )}
                        style={{ left: pos.x, top: pos.y }}
                        initial={animated ? { opacity: 0 } : { opacity: 1 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: animated ? 1 + i * 0.05 : 0 }}
                        onClick={() => onCategoryClick?.(pos.category)}
                        data-testid={`radar-label-${pos.category}`}
                    >
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="whitespace-nowrap">{pos.label}</span>
                            <span
                                className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                    config?.color === "indigo" && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
                                    config?.color === "emerald" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                                    config?.color === "orange" && "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
                                    config?.color === "cyan" && "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
                                    config?.color === "pink" && "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
                                    config?.color === "purple" && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
                                    config?.color === "amber" && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                                    !config && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                )}
                            >
                                {pos.value}%
                            </span>
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
};
