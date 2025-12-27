"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Leaf, Target, Flame, Rocket, Clock } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { TaskComplexity, COMPLEXITY_CONFIG } from "../lib/types";

interface TaskComplexityBadgeProps {
    complexity: TaskComplexity;
    estimatedHours?: number;
    showHours?: boolean;
    size?: "sm" | "md" | "lg";
    animated?: boolean;
}

const COMPLEXITY_ICONS = {
    trivial: Zap,
    simple: Leaf,
    moderate: Target,
    complex: Flame,
    expert: Rocket,
};

const SIZE_CLASSES = {
    sm: {
        badge: "px-2 py-0.5 text-xs gap-1",
        icon: ICON_SIZES.xs,
    },
    md: {
        badge: "px-2.5 py-1 text-sm gap-1.5",
        icon: ICON_SIZES.sm,
    },
    lg: {
        badge: "px-3 py-1.5 text-base gap-2",
        icon: ICON_SIZES.md,
    },
};

export const TaskComplexityBadge: React.FC<TaskComplexityBadgeProps> = ({
    complexity,
    estimatedHours,
    showHours = true,
    size = "md",
    animated = true,
}) => {
    const config = COMPLEXITY_CONFIG[complexity];
    const Icon = COMPLEXITY_ICONS[complexity];
    const sizeConfig = SIZE_CLASSES[size];

    const Component = animated ? motion.div : "div";
    const animationProps = animated ? {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        whileHover: { scale: 1.05 },
        transition: { duration: 0.2 },
    } : {};

    return (
        <Component
            className={cn(
                "inline-flex items-center rounded-full font-medium",
                config.bgColor,
                config.color,
                sizeConfig.badge
            )}
            {...animationProps}
        >
            <Icon size={sizeConfig.icon} className="flex-shrink-0" />
            <span>{config.label}</span>
            {showHours && estimatedHours !== undefined && (
                <span className="flex items-center gap-0.5 opacity-80">
                    <Clock size={sizeConfig.icon - 2} />
                    {estimatedHours}h
                </span>
            )}
        </Component>
    );
};

// Compact version showing just icon and hours
interface ComplexityIndicatorProps {
    complexity: TaskComplexity;
    estimatedHours: number;
    size?: "sm" | "md";
}

export const ComplexityIndicator: React.FC<ComplexityIndicatorProps> = ({
    complexity,
    estimatedHours,
    size = "sm",
}) => {
    const config = COMPLEXITY_CONFIG[complexity];
    const Icon = COMPLEXITY_ICONS[complexity];
    const iconSize = size === "sm" ? ICON_SIZES.sm : ICON_SIZES.md;

    return (
        <div className="flex items-center gap-2">
            <div
                className={cn(
                    "flex items-center justify-center rounded-full",
                    config.bgColor,
                    size === "sm" ? "w-6 h-6" : "w-8 h-8"
                )}
            >
                <Icon size={iconSize} className={config.color} />
            </div>
            <div className="flex flex-col">
                <span className={cn("font-medium", config.color, size === "sm" ? "text-xs" : "text-sm")}>
                    {config.label}
                </span>
                <span className="text-[var(--text-muted)] text-xs">
                    ~{estimatedHours}h
                </span>
            </div>
        </div>
    );
};

// Bar showing complexity distribution
interface ComplexityBarProps {
    complexity: TaskComplexity;
    confidence: number;
}

export const ComplexityBar: React.FC<ComplexityBarProps> = ({
    complexity,
    confidence,
}) => {
    const complexities: TaskComplexity[] = ["trivial", "simple", "moderate", "complex", "expert"];
    const currentIndex = complexities.indexOf(complexity);

    return (
        <div className="flex flex-col gap-1">
            <div className="flex gap-0.5 h-1.5">
                {complexities.map((c, index) => {
                    const config = COMPLEXITY_CONFIG[c];
                    const isActive = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                        <motion.div
                            key={c}
                            className={cn(
                                "flex-1 rounded-full transition-colors",
                                isActive
                                    ? config.bgColor.replace("/20", "/60")
                                    : "bg-[var(--surface-elevated)]"
                            )}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: index * 0.05 }}
                        />
                    );
                })}
            </div>
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Trivial</span>
                <span className="flex items-center gap-1">
                    <span className={COMPLEXITY_CONFIG[complexity].color}>
                        {Math.round(confidence * 100)}% confidence
                    </span>
                </span>
                <span>Expert</span>
            </div>
        </div>
    );
};
