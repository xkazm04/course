"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { formatSpeed } from "../lib/speedStorage";

interface SpeedIndicatorProps {
    speed: number;
    skipSilence?: boolean;
    show?: boolean;
    variant?: "overlay" | "badge" | "minimal";
    className?: string;
}

export const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({
    speed,
    skipSilence = false,
    show = true,
    variant = "badge",
    className,
}) => {
    const isNotNormalSpeed = speed !== 1.0;

    if (!show && !isNotNormalSpeed && !skipSilence) {
        return null;
    }

    if (variant === "overlay") {
        return (
            <AnimatePresence>
                {(isNotNormalSpeed || skipSilence) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={cn(
                            "absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full",
                            className
                        )}
                        data-testid="speed-indicator-overlay"
                    >
                        {isNotNormalSpeed && (
                            <span className="text-sm font-bold text-white">{speed}x</span>
                        )}
                        {skipSilence && <Zap size={ICON_SIZES.sm} className="text-[var(--gold)]" />}
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    if (variant === "minimal") {
        return (
            <span
                className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    isNotNormalSpeed ? "text-[var(--ember)]" : "text-white/50",
                    className
                )}
                data-testid="speed-indicator-minimal"
            >
                {speed}x
                {skipSilence && <Zap size={ICON_SIZES.xs} className="text-[var(--gold)]" />}
            </span>
        );
    }

    // Default badge variant
    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                isNotNormalSpeed
                    ? "bg-[var(--ember)]/20 text-[var(--ember)] border border-[var(--ember)]/30"
                    : "bg-white/10 text-white/60",
                className
            )}
            data-testid="speed-indicator-badge"
        >
            <span>{formatSpeed(speed)}</span>
            {skipSilence && <Zap size={ICON_SIZES.xs} className="text-[var(--gold)]" />}
        </div>
    );
};

// Toast notification for speed changes
interface SpeedChangeToastProps {
    speed: number;
    visible: boolean;
}

export const SpeedChangeToast: React.FC<SpeedChangeToastProps> = ({ speed, visible }) => {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                    data-testid="speed-change-toast"
                >
                    <div className="px-6 py-3 bg-black/80 backdrop-blur-sm rounded-xl">
                        <span className="text-2xl font-bold text-white">{speed}x</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SpeedIndicator;
