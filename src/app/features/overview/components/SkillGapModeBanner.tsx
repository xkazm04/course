/**
 * Skill Gap Mode Banner
 *
 * Banner component displayed when skill gap analysis mode is active.
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

interface SkillGapStats {
    totalMastered: number;
    totalPartial: number;
    totalGap: number;
}

interface SkillGapModeBannerProps {
    stats: SkillGapStats;
    onExit: () => void;
}

export const SkillGapModeBanner: React.FC<SkillGapModeBannerProps> = ({
    stats,
    onExit,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl",
                "bg-gradient-to-r from-emerald-50 via-amber-50 to-red-50",
                "dark:from-emerald-950/40 dark:via-amber-950/40 dark:to-red-950/40",
                "border border-amber-200 dark:border-amber-800"
            )}
            data-testid="skill-gap-mode-banner"
        >
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        Skill Gap Analysis Active
                    </p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                            {stats.totalMastered} mastered
                        </span>
                        <span className="mx-2">·</span>
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-amber-500 rounded-full" />
                            {stats.totalPartial} partial
                        </span>
                        <span className="mx-2">·</span>
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-red-500 rounded-full" />
                            {stats.totalGap} gaps
                        </span>
                    </p>
                </div>
            </div>
            <button
                onClick={onExit}
                className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg",
                    "bg-amber-100 dark:bg-amber-900/50",
                    "text-amber-700 dark:text-amber-300",
                    "hover:bg-amber-200 dark:hover:bg-amber-800/50",
                    "transition-colors"
                )}
                data-testid="exit-skill-gap-mode-btn"
            >
                Exit Skill Gap Mode
            </button>
        </motion.div>
    );
};
