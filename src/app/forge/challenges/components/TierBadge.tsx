"use client";

import React from "react";
import { Shield, Crown, Diamond, Flame } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { getTierConfig, type SkillTier } from "../lib/tierSystem";

interface TierBadgeProps {
    tier: SkillTier;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    className?: string;
}

const ICON_MAP = {
    Shield,
    Crown,
    Diamond,
    Flame,
};

const SIZE_CONFIG = {
    sm: {
        iconSize: 12,
        padding: "px-1.5 py-0.5",
        text: "text-[10px]",
        gap: "gap-1",
    },
    md: {
        iconSize: 14,
        padding: "px-2 py-1",
        text: "text-xs",
        gap: "gap-1.5",
    },
    lg: {
        iconSize: 16,
        padding: "px-2.5 py-1.5",
        text: "text-sm",
        gap: "gap-2",
    },
};

export function TierBadge({
    tier,
    size = "md",
    showLabel = true,
    className = "",
}: TierBadgeProps) {
    const config = getTierConfig(tier);
    const sizeConfig = SIZE_CONFIG[size];
    const IconComponent = ICON_MAP[config.icon];

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border font-medium",
                sizeConfig.padding,
                sizeConfig.gap,
                config.bgColor,
                config.borderColor,
                config.color,
                className
            )}
            title={`${config.label} tier`}
        >
            <IconComponent size={sizeConfig.iconSize} />
            {showLabel && <span className={sizeConfig.text}>{config.label}</span>}
        </div>
    );
}
