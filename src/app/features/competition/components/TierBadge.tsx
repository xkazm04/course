"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Crown, Diamond, Flame } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { SkillTier } from "../lib/types";
import { getTierConfig, getTierProgress, TierConfig } from "../lib/tierSystem";

interface TierBadgeProps {
    tier: SkillTier;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    showProgress?: boolean;
    points?: number;
    animated?: boolean;
}

const ICON_MAP = {
    Shield,
    Crown,
    Diamond,
    Flame,
};

const SIZE_CONFIG = {
    sm: { icon: ICON_SIZES.sm, text: "text-xs", padding: "px-2 py-0.5" },
    md: { icon: ICON_SIZES.md, text: "text-sm", padding: "px-3 py-1" },
    lg: { icon: ICON_SIZES.lg, text: "text-base", padding: "px-4 py-1.5" },
};

export const TierBadge: React.FC<TierBadgeProps> = ({
    tier,
    size = "md",
    showLabel = true,
    showProgress = false,
    points,
    animated = true,
}) => {
    const config = getTierConfig(tier);
    const Icon = ICON_MAP[config.icon];
    const sizeConfig = SIZE_CONFIG[size];
    const progress = points !== undefined ? getTierProgress(points) : 0;

    const content = (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full font-medium",
                sizeConfig.padding,
                sizeConfig.text
            )}
            style={{
                backgroundColor: config.bgColor,
                color: config.color,
            }}
        >
            <Icon size={sizeConfig.icon} style={{ color: config.color }} />
            {showLabel && (
                <span className="capitalize">{tier}</span>
            )}
        </div>
    );

    if (!animated) {
        return (
            <div>
                {content}
                {showProgress && points !== undefined && (
                    <TierProgressBar progress={progress} color={config.color} />
                )}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
        >
            {content}
            {showProgress && points !== undefined && (
                <TierProgressBar progress={progress} color={config.color} />
            )}
        </motion.div>
    );
};

// Progress bar component
interface TierProgressBarProps {
    progress: number;
    color: string;
}

const TierProgressBar: React.FC<TierProgressBarProps> = ({ progress, color }) => {
    return (
        <div className="mt-1.5 w-full">
            <div className="h-1.5 bg-[var(--surface-overlay)] rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 text-right">
                {progress}% to next tier
            </p>
        </div>
    );
};

// Large tier display for profile/stats
interface TierDisplayProps {
    tier: SkillTier;
    points: number;
    pointsToNext: number;
}

export const TierDisplay: React.FC<TierDisplayProps> = ({
    tier,
    points,
    pointsToNext,
}) => {
    const config = getTierConfig(tier);
    const Icon = ICON_MAP[config.icon];
    const progress = getTierProgress(points);

    return (
        <div className="flex items-center gap-4">
            <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: config.bgColor }}
                whileHover={{ scale: 1.1, rotate: 5 }}
            >
                <Icon size={32} style={{ color: config.color }} />
            </motion.div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span
                        className="text-xl font-bold capitalize"
                        style={{ color: config.color }}
                    >
                        {tier}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">
                        {points.toLocaleString()} pts
                    </span>
                </div>
                <div className="mt-2">
                    <div className="h-2 bg-[var(--surface-overlay)] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: config.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    </div>
                    {tier !== "master" && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            {pointsToNext.toLocaleString()} points to next tier
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Mini tier icon for compact displays
interface TierIconProps {
    tier: SkillTier;
    size?: number;
}

export const TierIcon: React.FC<TierIconProps> = ({ tier, size = 16 }) => {
    const config = getTierConfig(tier);
    const Icon = ICON_MAP[config.icon];

    return <Icon size={size} style={{ color: config.color }} />;
};
