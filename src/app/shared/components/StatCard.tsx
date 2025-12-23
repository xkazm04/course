"use client";

import React from "react";
import { PrismaticCard } from "./PrismaticCard";
import { cn } from "../lib/utils";

export type StatCardSize = "sm" | "md" | "lg";
export type StatCardGlowColor = "indigo" | "purple" | "cyan" | "emerald" | "orange";

export interface StatCardProps {
    /** The main value to display (e.g., "42", "120h", "87%") */
    value: React.ReactNode;
    /** Label describing the value */
    label: string;
    /** Optional icon to display above the value */
    icon?: React.ReactNode;
    /** Size variant - affects padding and text sizes */
    size?: StatCardSize;
    /** Glow color for the card */
    glowColor?: StatCardGlowColor;
    /** Optional progress bar (0-100) */
    progress?: number;
    /** Additional className for customization */
    className?: string;
    /** Test ID for automated testing */
    "data-testid"?: string;
}

// Size-based styling configuration
const sizeConfig = {
    sm: {
        padding: "p-3",
        valueText: "text-xl",
        labelText: "text-xs",
        iconMargin: "mb-1",
        gap: "gap-4", // 16px - for grid context
    },
    md: {
        padding: "p-4",
        valueText: "text-2xl",
        labelText: "text-xs",
        iconMargin: "mb-2",
        gap: "gap-6", // 24px - for grid context
    },
    lg: {
        padding: "p-6",
        valueText: "text-3xl",
        labelText: "text-sm",
        iconMargin: "mb-3",
        gap: "gap-6", // 24px - for grid context
    },
};

/**
 * StatCard - Unified statistics display component
 *
 * Provides consistent spacing and styling for stat cards across all variants.
 * Uses standardized 16px (p-4) internal padding, 24px (gap-6) between cards,
 * and text-2xl for values with text-xs for labels.
 *
 * @example
 * ```tsx
 * <StatCard
 *   icon={<Clock className="w-5 h-5 text-indigo-500" />}
 *   value="120h"
 *   label="Total Duration"
 *   glowColor="indigo"
 * />
 * ```
 */
export const StatCard: React.FC<StatCardProps> = ({
    value,
    label,
    icon,
    size = "md",
    glowColor = "indigo",
    progress,
    className,
    "data-testid": testId,
}) => {
    const config = sizeConfig[size];

    return (
        <PrismaticCard glowColor={glowColor} data-testid={testId}>
            <div className={cn(config.padding, "text-center", className)}>
                {icon && (
                    <div className={cn("flex items-center justify-center", config.iconMargin)}>
                        {icon}
                    </div>
                )}
                <div className={cn("font-bold text-[var(--text-primary)]", config.valueText)}>
                    {value}
                </div>
                <div className={cn("text-[var(--text-muted)]", config.labelText)}>
                    {label}
                </div>
                {progress !== undefined && (
                    <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-500",
                                glowColor === "emerald" && "bg-emerald-500",
                                glowColor === "indigo" && "bg-indigo-500",
                                glowColor === "purple" && "bg-purple-500",
                                glowColor === "cyan" && "bg-cyan-500",
                                glowColor === "orange" && "bg-orange-500"
                            )}
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    </div>
                )}
            </div>
        </PrismaticCard>
    );
};

/**
 * StatCardGrid - Container for consistent spacing between StatCards
 *
 * Provides the standardized 24px (gap-6) spacing between cards.
 *
 * @example
 * ```tsx
 * <StatCardGrid columns={3}>
 *   <StatCard value="42" label="Courses" />
 *   <StatCard value="120h" label="Duration" />
 *   <StatCard value="87%" label="Complete" />
 * </StatCardGrid>
 * ```
 */
export interface StatCardGridProps {
    children: React.ReactNode;
    /** Number of columns (responsive) */
    columns?: 2 | 3 | 4;
    /** Override gap (defaults to gap-6 for 24px spacing) */
    gap?: "gap-4" | "gap-6";
    className?: string;
    "data-testid"?: string;
}

export const StatCardGrid: React.FC<StatCardGridProps> = ({
    children,
    columns = 3,
    gap = "gap-6",
    className,
    "data-testid": testId,
}) => {
    const columnClasses = {
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-2 md:grid-cols-4",
    };

    return (
        <div
            className={cn("grid", columnClasses[columns], gap, className)}
            data-testid={testId}
        >
            {children}
        </div>
    );
};

export default StatCard;
