"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ContinueLearningItem } from "../lib/types";
import { formatWatchTime } from "../lib/progressStorage";
import { getGlowColor, toDomainColor } from "@/app/shared/lib/learningDomains";

interface ContinueLearningButtonProps {
    item: ContinueLearningItem;
    onClick?: () => void;
    variant?: "compact" | "full";
    className?: string;
}

export function ContinueLearningButton({
    item,
    onClick,
    variant = "full",
    className,
}: ContinueLearningButtonProps) {
    const color = getGlowColor(toDomainColor(item.courseColor));

    if (variant === "compact") {
        return (
            <motion.button
                onClick={onClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600",
                    "text-white rounded-xl shadow-lg hover:shadow-xl transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                    className
                )}
                data-testid="continue-learning-btn-compact"
            >
                <Play size={ICON_SIZES.md} className="fill-current" />
                <span className="font-bold">Continue Learning</span>
                <ArrowRight size={ICON_SIZES.sm} />
            </motion.button>
        );
    }

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
                "w-full text-left p-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600",
                "text-white rounded-2xl shadow-lg hover:shadow-xl transition-all relative overflow-hidden",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                className
            )}
            data-testid="continue-learning-btn-full"
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <Play size={ICON_SIZES.md} className="fill-current" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-white/80">Continue Learning</span>
                            <h3 className="font-bold text-lg">{item.courseName}</h3>
                        </div>
                    </div>
                    <ArrowRight size={ICON_SIZES.lg} className="opacity-80" />
                </div>

                <div className="flex items-center gap-4 text-sm text-white/80 mb-3">
                    <span>{item.chapterTitle}</span>
                    {item.sectionTitle && (
                        <>
                            <span className="w-1 h-1 bg-white/50 rounded-full" />
                            <span>{item.sectionTitle}</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4 mb-3">
                    {item.lastPosition > 0 && (
                        <span className="flex items-center gap-1 text-xs text-white/70">
                            <Clock size={ICON_SIZES.xs} />
                            Resume at {formatWatchTime(item.lastPosition)}
                        </span>
                    )}
                    <span className="text-xs text-white/70">{item.progress}% complete</span>
                </div>

                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white/80 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                    />
                </div>
            </div>
        </motion.button>
    );
}
