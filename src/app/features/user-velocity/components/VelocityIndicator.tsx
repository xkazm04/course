"use client";

import React from "react";
import { motion } from "framer-motion";
import { Gauge, Focus, Compass, Zap } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useUserVelocity, useVelocityAnimation } from "../lib/UserVelocityContext";
import { VelocityLevel } from "../lib/types";

interface VelocityIndicatorProps {
    /** Whether to show the full indicator or compact version */
    compact?: boolean;
    /** Additional class names */
    className?: string;
    /** Show override controls */
    showControls?: boolean;
}

const velocityConfig: Record<
    VelocityLevel,
    { icon: typeof Focus; label: string; color: string; bgColor: string }
> = {
    focused: {
        icon: Focus,
        label: "Focused",
        color: "text-blue-500 dark:text-blue-400",
        bgColor: "bg-blue-500/10 dark:bg-blue-400/10",
    },
    balanced: {
        icon: Gauge,
        label: "Balanced",
        color: "text-gray-500 dark:text-gray-400",
        bgColor: "bg-gray-500/10 dark:bg-gray-400/10",
    },
    exploring: {
        icon: Compass,
        label: "Exploring",
        color: "text-amber-500 dark:text-amber-400",
        bgColor: "bg-amber-500/10 dark:bg-amber-400/10",
    },
};

/**
 * Visual indicator showing current velocity level.
 * Can be used for debugging or as a user preference control.
 */
export function VelocityIndicator({
    compact = false,
    className,
    showControls = false,
}: VelocityIndicatorProps) {
    const { velocity, velocityOverride, setVelocityOverride, signals, isReady } =
        useUserVelocity();
    const { shouldAnimate } = useVelocityAnimation();

    if (!isReady) {
        return null;
    }

    const config = velocityConfig[velocity];
    const Icon = config.icon;
    const isOverridden = velocityOverride !== null;

    if (compact) {
        return (
            <motion.div
                initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : false}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
                    config.bgColor,
                    className
                )}
                title={`Velocity: ${config.label}${isOverridden ? " (manual)" : ""}`}
                data-testid="velocity-indicator-compact"
            >
                <Icon size={ICON_SIZES.xs} className={config.color} />
                {isOverridden && (
                    <Zap size={ICON_SIZES.xs} className="text-yellow-500" />
                )}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={shouldAnimate ? { opacity: 0, y: -10 } : false}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "p-4 rounded-xl border",
                "bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm",
                "border-gray-200/50 dark:border-gray-700/50",
                className
            )}
            data-testid="velocity-indicator"
        >
            {/* Current Status */}
            <div className="flex items-center gap-3 mb-3">
                <div
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        config.bgColor
                    )}
                >
                    <Icon size={ICON_SIZES.md} className={config.color} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {config.label}
                        </span>
                        {isOverridden && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                                Manual
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {velocity === "focused"
                            ? "High detail, efficient paths"
                            : velocity === "exploring"
                            ? "Discovery mode, full animations"
                            : "Standard experience"}
                    </span>
                </div>
            </div>

            {/* Signal Indicators */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Scroll</span>
                    <span className="font-mono">{Math.round(signals.scrollVelocity)} px/s</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Mouse</span>
                    <span className="font-mono">{Math.round(signals.mouseVelocity)} px/s</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Idle</span>
                    <span className="font-mono">{Math.round(signals.idleTime / 1000)}s</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Nav</span>
                    <span className="font-mono">{signals.rapidNavigationCount}</span>
                </div>
            </div>

            {/* Override Controls */}
            {showControls && (
                <div className="pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Override velocity:
                    </div>
                    <div className="flex gap-1">
                        {(["focused", "balanced", "exploring"] as VelocityLevel[]).map(
                            (level) => {
                                const levelConfig = velocityConfig[level];
                                const LevelIcon = levelConfig.icon;
                                const isSelected = velocityOverride === level;

                                return (
                                    <button
                                        key={level}
                                        onClick={() =>
                                            setVelocityOverride(isSelected ? null : level)
                                        }
                                        className={cn(
                                            "flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                            "flex items-center justify-center gap-1",
                                            isSelected
                                                ? cn(levelConfig.bgColor, levelConfig.color)
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                        )}
                                        data-testid={`velocity-override-${level}`}
                                    >
                                        <LevelIcon size={ICON_SIZES.xs} />
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </button>
                                );
                            }
                        )}
                    </div>
                    {velocityOverride && (
                        <button
                            onClick={() => setVelocityOverride(null)}
                            className="w-full mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            data-testid="velocity-clear-override"
                        >
                            Clear override (use auto-detection)
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}
