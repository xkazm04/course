"use client";

import React from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface SkillCrownProps {
    crowns: number; // 0-5
    maxCrowns?: number;
    size?: "sm" | "md" | "lg";
    animated?: boolean;
    className?: string;
}

const sizeConfig = {
    sm: { iconSize: ICON_SIZES.xs, gap: "gap-0.5" },
    md: { iconSize: ICON_SIZES.sm, gap: "gap-1" },
    lg: { iconSize: ICON_SIZES.md, gap: "gap-1.5" },
};

export const SkillCrown = ({
    crowns,
    maxCrowns = 5,
    size = "md",
    animated = true,
    className,
}: SkillCrownProps) => {
    const config = sizeConfig[size];
    const clampedCrowns = Math.min(maxCrowns, Math.max(0, crowns));

    return (
        <div
            className={cn("flex items-center", config.gap, className)}
            data-testid="skill-crown"
        >
            {Array.from({ length: maxCrowns }, (_, i) => {
                const isEarned = i < clampedCrowns;
                return (
                    <motion.div
                        key={i}
                        initial={animated ? { opacity: 0, scale: 0, rotate: -45 } : { opacity: 1, scale: 1, rotate: 0 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{
                            duration: 0.4,
                            delay: animated ? i * 0.1 : 0,
                            type: "spring",
                            stiffness: 200,
                        }}
                    >
                        <Crown
                            size={config.iconSize}
                            className={cn(
                                "transition-colors",
                                isEarned
                                    ? "fill-amber-400 text-amber-500"
                                    : "fill-slate-200 text-slate-300 dark:fill-slate-700 dark:text-slate-600"
                            )}
                            data-testid={`crown-${i}-${isEarned ? "earned" : "empty"}`}
                        />
                    </motion.div>
                );
            })}
        </div>
    );
};
