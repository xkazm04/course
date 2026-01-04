"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, CircleDot, CheckCircle2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { VerificationState, ObjectiveVerificationStatus } from "../lib/useObjectiveVerification";

interface ObjectiveVerificationIndicatorProps {
    status: ObjectiveVerificationStatus;
    showConfidence?: boolean;
    size?: "sm" | "md";
}

const stateConfig: Record<
    VerificationState,
    {
        icon: typeof Circle;
        colorClass: string;
        bgClass: string;
        ringClass: string;
        label: string;
    }
> = {
    not_started: {
        icon: Circle,
        colorClass: "text-[var(--forge-text-muted)]",
        bgClass: "bg-transparent",
        ringClass: "ring-[var(--forge-border-subtle)]",
        label: "Not detected",
    },
    partial: {
        icon: CircleDot,
        colorClass: "text-amber-400",
        bgClass: "bg-amber-400/10",
        ringClass: "ring-amber-400/50",
        label: "Partially detected",
    },
    confident: {
        icon: CheckCircle2,
        colorClass: "text-[var(--forge-success)]",
        bgClass: "bg-[var(--forge-success)]/10",
        ringClass: "ring-[var(--forge-success)]/50",
        label: "Confident match",
    },
};

export const ObjectiveVerificationIndicator: React.FC<ObjectiveVerificationIndicatorProps> = ({
    status,
    showConfidence = true,
    size = "sm",
}) => {
    const [showRingAnimation, setShowRingAnimation] = useState(false);
    const config = stateConfig[status.state];
    const Icon = config.icon;
    const iconSize = size === "sm" ? ICON_SIZES.sm : ICON_SIZES.md;

    // Trigger ring animation when state changes
    useEffect(() => {
        if (status.stateChangedAt) {
            setShowRingAnimation(true);
            const timer = setTimeout(() => setShowRingAnimation(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [status.stateChangedAt]);

    return (
        <div
            className="flex items-center gap-2"
            data-testid={`objective-verification-${status.objectiveId}`}
        >
            <div className="relative">
                {/* Ring animation on state change */}
                <AnimatePresence>
                    {showRingAnimation && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0.8 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={cn(
                                "absolute inset-0 rounded-full ring-2",
                                config.ringClass
                            )}
                            data-testid={`objective-ring-animation-${status.objectiveId}`}
                        />
                    )}
                </AnimatePresence>

                {/* Icon with background */}
                <motion.div
                    initial={false}
                    animate={{
                        scale: showRingAnimation ? [1, 1.1, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                        "relative flex items-center justify-center rounded-full p-0.5",
                        config.bgClass
                    )}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={status.state}
                            initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Icon
                                size={iconSize}
                                className={cn(config.colorClass, "flex-shrink-0")}
                                data-testid={`objective-icon-${status.objectiveId}`}
                            />
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Confidence percentage */}
            {showConfidence && status.confidence > 0 && (
                <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                        "text-xs font-medium tabular-nums",
                        status.state === "confident"
                            ? "text-[var(--forge-success)]"
                            : status.state === "partial"
                            ? "text-amber-400"
                            : "text-[var(--forge-text-muted)]"
                    )}
                    data-testid={`objective-confidence-${status.objectiveId}`}
                >
                    {Math.round(status.confidence * 100)}%
                </motion.span>
            )}
        </div>
    );
};

// Compact inline indicator for use in lists
interface InlineVerificationBadgeProps {
    status: ObjectiveVerificationStatus;
}

export const InlineVerificationBadge: React.FC<InlineVerificationBadgeProps> = ({ status }) => {
    const config = stateConfig[status.state];

    if (status.state === "not_started") {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                status.state === "confident"
                    ? "bg-[var(--forge-success)]/15 text-[var(--forge-success)]"
                    : "bg-amber-400/15 text-amber-400"
            )}
            data-testid={`objective-badge-${status.objectiveId}`}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {Math.round(status.confidence * 100)}%
        </motion.div>
    );
};

// Tooltip content for verification status
interface VerificationTooltipProps {
    status: ObjectiveVerificationStatus;
}

export const VerificationTooltipContent: React.FC<VerificationTooltipProps> = ({ status }) => {
    const config = stateConfig[status.state];

    return (
        <div
            className="max-w-xs p-2 space-y-1"
            data-testid={`objective-tooltip-${status.objectiveId}`}
        >
            <div className="flex items-center gap-2">
                <config.icon size={ICON_SIZES.sm} className={config.colorClass} />
                <span className="font-medium text-sm">{config.label}</span>
            </div>
            {status.evidence && (
                <p className="text-xs text-[var(--forge-text-muted)]">{status.evidence}</p>
            )}
            {status.confidence > 0 && (
                <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--forge-bg-anvil)] overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${status.confidence * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={cn(
                                "h-full rounded-full",
                                status.state === "confident"
                                    ? "bg-[var(--forge-success)]"
                                    : status.state === "partial"
                                    ? "bg-amber-400"
                                    : "bg-[var(--forge-text-muted)]"
                            )}
                        />
                    </div>
                    <span className="text-xs tabular-nums text-[var(--forge-text-muted)]">
                        {Math.round(status.confidence * 100)}%
                    </span>
                </div>
            )}
        </div>
    );
};
