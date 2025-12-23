"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type SemanticZone = "low" | "optimal" | "high" | "extreme";

export interface SemanticRange {
    min: number;
    max: number;
    zone: SemanticZone;
    label: string;
    color: string;
    trackColor: string;
}

export interface SemanticSliderProps {
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
    ranges: SemanticRange[];
    unit?: string;
    showMinMaxLabels?: boolean;
    minLabel?: string;
    maxLabel?: string;
    className?: string;
    "data-testid"?: string;
}

// ============================================================================
// Predefined Range Configurations
// ============================================================================

/**
 * Time commitment ranges (5-40 hours per week)
 * - 5-10h: Casual (green) - sustainable pace
 * - 10-20h: Balanced (green) - optimal learning
 * - 20-30h: Ambitious (yellow) - intensive but manageable
 * - 30-40h: Intensive (red) - extreme commitment warning
 */
export const timeCommitmentRanges: SemanticRange[] = [
    {
        min: 5,
        max: 10,
        zone: "low",
        label: "Casual",
        color: "text-emerald-600 dark:text-emerald-400",
        trackColor: "bg-emerald-500",
    },
    {
        min: 10,
        max: 20,
        zone: "optimal",
        label: "Balanced",
        color: "text-emerald-600 dark:text-emerald-400",
        trackColor: "bg-emerald-500",
    },
    {
        min: 20,
        max: 30,
        zone: "high",
        label: "Ambitious",
        color: "text-amber-600 dark:text-amber-400",
        trackColor: "bg-amber-500",
    },
    {
        min: 30,
        max: 40,
        zone: "extreme",
        label: "Intensive",
        color: "text-red-600 dark:text-red-400",
        trackColor: "bg-red-500",
    },
];

/**
 * Deadline ranges (1-24 months)
 * - 1-3m: Sprint (red) - very aggressive timeline
 * - 3-6m: Fast Track (yellow) - challenging but achievable
 * - 6-12m: Steady (green) - optimal learning pace
 * - 12-24m: Relaxed (green) - comfortable timeline
 */
export const deadlineRanges: SemanticRange[] = [
    {
        min: 1,
        max: 3,
        zone: "extreme",
        label: "Sprint",
        color: "text-red-600 dark:text-red-400",
        trackColor: "bg-red-500",
    },
    {
        min: 3,
        max: 6,
        zone: "high",
        label: "Fast Track",
        color: "text-amber-600 dark:text-amber-400",
        trackColor: "bg-amber-500",
    },
    {
        min: 6,
        max: 12,
        zone: "optimal",
        label: "Steady",
        color: "text-emerald-600 dark:text-emerald-400",
        trackColor: "bg-emerald-500",
    },
    {
        min: 12,
        max: 24,
        zone: "low",
        label: "Relaxed",
        color: "text-emerald-600 dark:text-emerald-400",
        trackColor: "bg-emerald-500",
    },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the current semantic range based on value
 */
export const getCurrentRange = (
    value: number,
    ranges: SemanticRange[]
): SemanticRange => {
    for (const range of ranges) {
        if (value >= range.min && value <= range.max) {
            return range;
        }
    }
    // Fallback to last range if value is out of bounds
    return ranges[ranges.length - 1];
};

/**
 * Calculate the gradient for the slider track based on ranges
 */
const calculateGradient = (ranges: SemanticRange[], min: number, max: number): string => {
    const totalRange = max - min;
    const gradientStops: string[] = [];

    ranges.forEach((range) => {
        const startPercent = ((range.min - min) / totalRange) * 100;
        const endPercent = ((range.max - min) / totalRange) * 100;

        // Get the color class and extract the color
        const colorMap: Record<string, string> = {
            "bg-emerald-500": "#10b981",
            "bg-amber-500": "#f59e0b",
            "bg-red-500": "#ef4444",
        };

        const color = colorMap[range.trackColor] || "#6366f1";

        gradientStops.push(`${color} ${startPercent}%`);
        gradientStops.push(`${color} ${endPercent}%`);
    });

    return `linear-gradient(to right, ${gradientStops.join(", ")})`;
};

// ============================================================================
// SemanticSlider Component
// ============================================================================

/**
 * SemanticSlider - A slider with color feedback based on value zones
 *
 * Features:
 * - Color transitions based on value ranges (green/yellow/red)
 * - Contextual labels showing the current zone
 * - Smooth animations between zones
 * - Accessible with proper labeling
 */
export const SemanticSlider = ({
    value,
    min,
    max,
    onChange,
    ranges,
    unit = "",
    showMinMaxLabels = true,
    minLabel,
    maxLabel,
    className,
    "data-testid": testId,
}: SemanticSliderProps) => {
    // Get current range information
    const currentRange = useMemo(() => getCurrentRange(value, ranges), [value, ranges]);

    // Calculate gradient for the track
    const gradient = useMemo(() => calculateGradient(ranges, min, max), [ranges, min, max]);

    // Calculate fill percentage for the active portion
    const fillPercent = ((value - min) / (max - min)) * 100;

    return (
        <div className={cn("space-y-2", className)}>
            {/* Value Display with Semantic Label */}
            <div className="flex items-center justify-between">
                <motion.div
                    key={currentRange.label}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                >
                    <span
                        className={cn(
                            "text-lg font-bold transition-colors duration-300",
                            currentRange.color
                        )}
                        data-testid={testId ? `${testId}-value` : undefined}
                    >
                        {value}{unit}
                    </span>
                    <span
                        className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-semibold transition-colors duration-300",
                            currentRange.zone === "optimal" || currentRange.zone === "low"
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                : currentRange.zone === "high"
                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        )}
                        data-testid={testId ? `${testId}-label` : undefined}
                    >
                        {currentRange.label}
                    </span>
                </motion.div>
            </div>

            {/* Slider Track with Gradient */}
            <div className="relative">
                {/* Background track with gradient showing zones */}
                <div
                    className="absolute inset-0 h-2 rounded-full opacity-30"
                    style={{ background: gradient }}
                />

                {/* Filled portion */}
                <div
                    className="absolute left-0 top-0 h-2 rounded-full transition-all duration-150"
                    style={{
                        width: `${fillPercent}%`,
                        background: gradient,
                        clipPath: `polygon(0 0, ${fillPercent}% 0, ${fillPercent}% 100%, 0 100%)`,
                    }}
                />

                {/* Native range input */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className={cn(
                        "relative w-full h-2 bg-transparent rounded-full appearance-none cursor-pointer",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500",
                        // Thumb styling
                        "[&::-webkit-slider-thumb]:appearance-none",
                        "[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
                        "[&::-webkit-slider-thumb]:rounded-full",
                        "[&::-webkit-slider-thumb]:bg-white",
                        "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-300 dark:[&::-webkit-slider-thumb]:border-slate-600",
                        "[&::-webkit-slider-thumb]:shadow-lg",
                        "[&::-webkit-slider-thumb]:cursor-pointer",
                        "[&::-webkit-slider-thumb]:transition-transform",
                        "[&::-webkit-slider-thumb]:hover:scale-110",
                        "[&::-webkit-slider-thumb]:active:scale-95",
                        // Firefox thumb
                        "[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5",
                        "[&::-moz-range-thumb]:rounded-full",
                        "[&::-moz-range-thumb]:bg-white",
                        "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-300 dark:[&::-moz-range-thumb]:border-slate-600",
                        "[&::-moz-range-thumb]:shadow-lg",
                        "[&::-moz-range-thumb]:cursor-pointer"
                    )}
                    data-testid={testId}
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={value}
                    aria-valuetext={`${value}${unit} - ${currentRange.label}`}
                />
            </div>

            {/* Min/Max Labels */}
            {showMinMaxLabels && (
                <div className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span data-testid={testId ? `${testId}-min-label` : undefined}>
                        {minLabel || `${min}${unit}`}
                    </span>
                    <span data-testid={testId ? `${testId}-max-label` : undefined}>
                        {maxLabel || `${max}${unit}`}
                    </span>
                </div>
            )}
        </div>
    );
};

export default SemanticSlider;
