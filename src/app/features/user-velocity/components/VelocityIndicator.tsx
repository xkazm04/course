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
        color: "text-[var(--forge-info)]",
        bgColor: "bg-[var(--forge-info)]/10",
    },
    balanced: {
        icon: Gauge,
        label: "Balanced",
        color: "text-[var(--forge-text-secondary)]",
        bgColor: "bg-[var(--forge-bg-elevated)]",
    },
    exploring: {
        icon: Compass,
        label: "Exploring",
        color: "text-[var(--forge-warning)]",
        bgColor: "bg-[var(--forge-warning)]/10",
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
                    <Zap size={ICON_SIZES.xs} className="text-[var(--forge-warning)]" />
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
                "bg-[var(--forge-bg-elevated)]/50 backdrop-blur-sm",
                "border-[var(--forge-border-subtle)]",
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
                        <span className="font-semibold text-[var(--forge-text-primary)]">
                            {config.label}
                        </span>
                        {isOverridden && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--forge-warning)]/10 text-[var(--forge-warning)]">
                                Manual
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-[var(--forge-text-muted)]">
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
                <div className="flex justify-between text-[var(--forge-text-secondary)]">
                    <span>Scroll</span>
                    <span className="font-mono">{Math.round(signals.scrollVelocity)} px/s</span>
                </div>
                <div className="flex justify-between text-[var(--forge-text-secondary)]">
                    <span>Mouse</span>
                    <span className="font-mono">{Math.round(signals.mouseVelocity)} px/s</span>
                </div>
                <div className="flex justify-between text-[var(--forge-text-secondary)]">
                    <span>Idle</span>
                    <span className="font-mono">{Math.round(signals.idleTime / 1000)}s</span>
                </div>
                <div className="flex justify-between text-[var(--forge-text-secondary)]">
                    <span>Nav</span>
                    <span className="font-mono">{signals.rapidNavigationCount}</span>
                </div>
            </div>

            {/* Override Controls */}
            {showControls && (
                <div className="pt-3 border-t border-[var(--forge-border-subtle)]">
                    <div className="text-xs text-[var(--forge-text-muted)] mb-2">
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
                                                : "bg-[var(--forge-bg-workshop)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)]"
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
                            className="w-full mt-2 text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
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
