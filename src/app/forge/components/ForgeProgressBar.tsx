"use client";

import React from "react";
import { cn } from "@/app/shared/lib/utils";

interface ForgeProgressBarProps {
    value: number;
    max?: number;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "success" | "warning";
    showLabel?: boolean;
    label?: string;
    animated?: boolean;
    className?: string;
}

export function ForgeProgressBar({
    value,
    max = 100,
    size = "md",
    variant = "default",
    showLabel = false,
    label,
    animated = true,
    className,
}: ForgeProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
        sm: "h-1.5",
        md: "h-2",
        lg: "h-3",
    };

    const gradientClasses = {
        default: "bg-gradient-to-r from-[var(--ember)] via-[var(--ember-glow)] to-[var(--ember)]",
        success: "bg-gradient-to-r from-[var(--forge-success)] via-[var(--forge-success)] to-[var(--forge-success)]",
        warning: "bg-gradient-to-r from-[var(--gold)] via-[var(--molten)] to-[var(--gold)]",
    };

    return (
        <div className={cn("w-full", className)}>
            {(showLabel || label) && (
                <div className="flex items-center justify-between mb-1.5">
                    {label && (
                        <span className="text-sm font-medium text-[var(--forge-text-secondary)]">{label}</span>
                    )}
                    {showLabel && (
                        <span className="text-sm text-[var(--forge-text-muted)]">{Math.round(percentage)}%</span>
                    )}
                </div>
            )}
            <div
                className={cn(
                    "w-full rounded-full bg-[var(--forge-border-subtle)] overflow-hidden",
                    sizeClasses[size]
                )}
            >
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        gradientClasses[variant],
                        animated && "relative overflow-hidden"
                    )}
                    style={{ width: `${percentage}%` }}
                >
                    {animated && percentage > 0 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    )}
                </div>
            </div>
        </div>
    );
}

interface ForgeXPBarProps {
    currentXP: number;
    xpToNextLevel: number;
    level: number;
    showLevel?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function ForgeXPBar({
    currentXP,
    xpToNextLevel,
    level,
    showLevel = true,
    size = "md",
    className,
}: ForgeXPBarProps) {
    const totalForLevel = currentXP + xpToNextLevel;
    const percentage = (currentXP / totalForLevel) * 100;

    return (
        <div className={cn("w-full", className)}>
            {showLevel && (
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-[var(--forge-text-secondary)]">Level {level}</span>
                    <span className="text-sm text-[var(--forge-text-muted)]">
                        {currentXP.toLocaleString()} / {totalForLevel.toLocaleString()} XP
                    </span>
                </div>
            )}
            <ForgeProgressBar value={percentage} size={size} animated />
        </div>
    );
}
