"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Zap, Award, Trophy } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { SkillLevel, SKILL_LEVEL_CONFIG } from "../lib/types";

interface SkillLevelBadgeProps {
    level: SkillLevel;
    size?: "sm" | "md" | "lg";
    showIcon?: boolean;
    animated?: boolean;
    className?: string;
}

const sizeConfig = {
    sm: { padding: "px-2 py-0.5", text: "text-xs", iconSize: ICON_SIZES.xs },
    md: { padding: "px-3 py-1", text: "text-sm", iconSize: ICON_SIZES.sm },
    lg: { padding: "px-4 py-1.5", text: "text-base", iconSize: ICON_SIZES.sm },
};

const iconMap = {
    beginner: Star,
    intermediate: Zap,
    advanced: Award,
    expert: Trophy,
};

export const SkillLevelBadge = ({
    level,
    size = "md",
    showIcon = true,
    animated = true,
    className,
}: SkillLevelBadgeProps) => {
    const config = sizeConfig[size];
    const levelConfig = SKILL_LEVEL_CONFIG[level];
    const Icon = iconMap[level];

    const colorClasses: Record<string, string> = {
        slate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        indigo: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800",
        purple: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800",
        emerald: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800",
    };

    if (animated) {
        return (
            <motion.span
                className={cn(
                    "inline-flex items-center gap-1.5 font-bold rounded-full border",
                    config.padding,
                    config.text,
                    colorClasses[levelConfig.color],
                    className
                )}
                data-testid={`skill-level-badge-${level}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, type: "spring" }}
            >
                {showIcon && <Icon size={config.iconSize} />}
                {levelConfig.label}
            </motion.span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 font-bold rounded-full border",
                config.padding,
                config.text,
                colorClasses[levelConfig.color],
                className
            )}
            data-testid={`skill-level-badge-${level}`}
        >
            {showIcon && <Icon size={config.iconSize} />}
            {levelConfig.label}
        </span>
    );
};
