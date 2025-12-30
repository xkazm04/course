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
                "bg-[var(--forge-warning)]/10",
                "border border-[var(--forge-warning)]/30"
            )}
            data-testid="skill-gap-mode-banner"
        >
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[var(--forge-warning)]/20 rounded-lg">
                    <Target className="w-4 h-4 text-[var(--forge-warning)]" />
                </div>
                <div>
                    <p className="text-sm font-medium text-[var(--forge-warning)]">
                        Skill Gap Analysis Active
                    </p>
                    <p className="text-xs text-[var(--forge-warning)]/70">
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-[var(--forge-success)] rounded-full" />
                            {stats.totalMastered} mastered
                        </span>
                        <span className="mx-2">·</span>
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-[var(--forge-warning)] rounded-full" />
                            {stats.totalPartial} partial
                        </span>
                        <span className="mx-2">·</span>
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-[var(--forge-error)] rounded-full" />
                            {stats.totalGap} gaps
                        </span>
                    </p>
                </div>
            </div>
            <button
                onClick={onExit}
                className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg",
                    "bg-[var(--forge-warning)]/20",
                    "text-[var(--forge-warning)]",
                    "hover:bg-[var(--forge-warning)]/30",
                    "transition-colors"
                )}
                data-testid="exit-skill-gap-mode-btn"
            >
                Exit Skill Gap Mode
            </button>
        </motion.div>
    );
};
