"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { useAdaptiveContentOptional } from "../lib/AdaptiveContentContext";
import type { ComprehensionLevel } from "../lib/types";

// ============================================================================
// Level Configurations
// ============================================================================

const LEVEL_CONFIG: Record<
    ComprehensionLevel,
    { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
    beginner: {
        label: "Building Foundation",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        icon: <span className="text-sm">📚</span>,
    },
    intermediate: {
        label: "Growing Skills",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        icon: <span className="text-sm">🌱</span>,
    },
    advanced: {
        label: "Mastering Concepts",
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
        icon: <span className="text-sm">🚀</span>,
    },
};

// ============================================================================
// Main Component
// ============================================================================

interface ComprehensionIndicatorProps {
    className?: string;
    showDetails?: boolean;
    compact?: boolean;
}

export function ComprehensionIndicator({
    className = "",
    showDetails = false,
    compact = false,
}: ComprehensionIndicatorProps) {
    const context = useAdaptiveContentOptional();

    if (!context) {
        return null;
    }

    const { comprehensionLevel, confidence, trend, recentPerformance } = context;
    const config = LEVEL_CONFIG[comprehensionLevel];

    const TrendIcon =
        trend === "improving" ? TrendingUp : trend === "struggling" ? TrendingDown : Minus;

    const trendColor =
        trend === "improving"
            ? "text-green-400"
            : trend === "struggling"
            ? "text-amber-400"
            : "text-slate-400";

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-2 ${className}`}
                data-testid="comprehension-indicator-compact"
            >
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor}`}>
                    {config.icon}
                    <span className={`text-xs font-medium ${config.color}`}>
                        {comprehensionLevel}
                    </span>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg border border-slate-700/50 bg-slate-800/50 p-4 ${className}`}
            data-testid="comprehension-indicator"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-300">
                        Adaptive Learning
                    </span>
                </div>
                <div className={`flex items-center gap-1 ${trendColor}`}>
                    <TrendIcon className="w-3.5 h-3.5" />
                    <span className="text-xs capitalize">{trend}</span>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
                <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}
                >
                    {config.icon}
                    <span className={`text-sm font-medium ${config.color}`}>
                        {config.label}
                    </span>
                </div>
            </div>

            {showDetails && (
                <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                        <span>Recent Performance</span>
                        <span className={config.color}>{recentPerformance}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Confidence</span>
                        <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-slate-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${confidence * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <span>{Math.round(confidence * 100)}%</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Sparkles className="w-3 h-3" />
                <span>Content adapts to your learning pace</span>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Inline Badge Variant
// ============================================================================

interface ComprehensionBadgeProps {
    className?: string;
}

export function ComprehensionBadge({ className = "" }: ComprehensionBadgeProps) {
    const context = useAdaptiveContentOptional();

    if (!context) {
        return null;
    }

    const { comprehensionLevel, trend } = context;
    const config = LEVEL_CONFIG[comprehensionLevel];

    const TrendIcon =
        trend === "improving" ? TrendingUp : trend === "struggling" ? TrendingDown : null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${config.bgColor} ${className}`}
            data-testid="comprehension-badge"
        >
            <span className={`text-xs font-medium ${config.color}`}>
                {comprehensionLevel}
            </span>
            {TrendIcon && (
                <TrendIcon
                    className={`w-3 h-3 ${
                        trend === "improving" ? "text-green-400" : "text-amber-400"
                    }`}
                />
            )}
        </motion.div>
    );
}

export default ComprehensionIndicator;
