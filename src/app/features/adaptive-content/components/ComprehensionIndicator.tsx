"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Minus, Sparkles, ChevronRight } from "lucide-react";
import { useAdaptiveContentOptional } from "../lib/AdaptiveContentContext";
import type { ComprehensionLevel } from "../lib/types";
import type { ComprehensionState } from "../lib/comprehensionStateMachine";
import { STATE_DEFINITIONS, getProgressToNextState } from "../lib/comprehensionStateMachine";

// ============================================================================
// Level Configurations (Legacy - kept for backwards compatibility)
// ============================================================================

const LEVEL_CONFIG: Record<
    ComprehensionLevel,
    { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
    beginner: {
        label: "Building Foundation",
        color: "text-[var(--forge-info)]",
        bgColor: "bg-[var(--forge-info)]/10",
        icon: <span className="text-sm">📚</span>,
    },
    intermediate: {
        label: "Growing Skills",
        color: "text-[var(--forge-success)]",
        bgColor: "bg-[var(--forge-success)]/10",
        icon: <span className="text-sm">🌱</span>,
    },
    advanced: {
        label: "Mastering Concepts",
        color: "text-[var(--ember-glow)]",
        bgColor: "bg-[var(--ember)]/10",
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
            ? "text-[var(--forge-success)]"
            : trend === "struggling"
            ? "text-[var(--forge-warning)]"
            : "text-[var(--forge-text-muted)]";

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
            className={`rounded-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-anvil)] p-4 ${className}`}
            data-testid="comprehension-indicator"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[var(--forge-text-muted)]" />
                    <span className="text-sm font-medium text-[var(--forge-text-secondary)]">
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
                <div className="space-y-2 text-xs text-[var(--forge-text-muted)]">
                    <div className="flex items-center justify-between">
                        <span>Recent Performance</span>
                        <span className={config.color}>{recentPerformance}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Confidence</span>
                        <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-[var(--forge-bg-elevated)] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-[var(--forge-text-muted)] rounded-full"
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

            <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--forge-text-muted)]">
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
                        trend === "improving" ? "text-[var(--forge-success)]" : "text-[var(--forge-warning)]"
                    }`}
                />
            )}
        </motion.div>
    );
}

// ============================================================================
// State Machine Enhanced Indicator
// ============================================================================

interface StateMachineIndicatorProps {
    currentState: ComprehensionState;
    progress?: number;
    nextState?: ComprehensionState;
    requirements?: string[];
    showProgress?: boolean;
    className?: string;
}

export function StateMachineIndicator({
    currentState,
    progress = 0,
    nextState,
    requirements = [],
    showProgress = true,
    className = "",
}: StateMachineIndicatorProps) {
    const stateDef = STATE_DEFINITIONS[currentState];
    const nextStateDef = nextState ? STATE_DEFINITIONS[nextState] : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border ${stateDef.color.border} bg-gradient-to-br ${stateDef.color.gradient} backdrop-blur-sm p-4 ${className}`}
            data-testid="state-machine-indicator"
        >
            {/* Current State Display */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <motion.span
                        className="text-2xl"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                    >
                        {stateDef.icon}
                    </motion.span>
                    <div>
                        <h4 className={`text-sm font-semibold ${stateDef.color.text}`}>
                            {stateDef.label}
                        </h4>
                        <p className="text-xs text-[var(--forge-text-muted)]">{stateDef.description}</p>
                    </div>
                </div>
            </div>

            {/* Progress to Next State */}
            {showProgress && nextStateDef && currentState !== nextState && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--forge-text-muted)]">Progress to next level</span>
                        <div className="flex items-center gap-1">
                            <span className={nextStateDef.color.text}>{nextStateDef.label}</span>
                            <span className="text-lg">{nextStateDef.icon}</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2 bg-[var(--forge-bg-elevated)] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${nextStateDef.color.gradient.replace("/20", "")}`}
                        />

                        {/* Animated shine effect */}
                        <motion.div
                            className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{ x: ["-100%", "400%"] }}
                            transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                        />
                    </div>

                    <div className="text-xs text-[var(--forge-text-muted)]">{Math.round(progress)}% complete</div>

                    {/* Requirements */}
                    {requirements.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {requirements.map((req, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 text-xs text-[var(--forge-text-muted)]"
                                >
                                    <ChevronRight className="w-3 h-3" />
                                    <span>{req}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Mastery state */}
            {currentState === "mastery" && (
                <div className="flex items-center gap-2 mt-2">
                    <Sparkles className={`w-4 h-4 ${stateDef.color.text}`} />
                    <span className="text-xs text-[var(--forge-text-secondary)]">
                        You've achieved mastery! Ready for advanced challenges.
                    </span>
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// Compact State Badge
// ============================================================================

interface StateBadgeProps {
    state: ComprehensionState;
    showLabel?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function StateBadge({
    state,
    showLabel = true,
    size = "md",
    className = "",
}: StateBadgeProps) {
    const stateDef = STATE_DEFINITIONS[state];

    const sizeClasses = {
        sm: "px-1.5 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1.5 text-base",
    };

    const iconSizes = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-1.5 rounded-full ${stateDef.color.bg} ${stateDef.color.border} border ${sizeClasses[size]} ${className}`}
            data-testid="state-badge"
        >
            <span className={iconSizes[size]}>{stateDef.icon}</span>
            {showLabel && (
                <span className={`font-medium ${stateDef.color.text}`}>
                    {stateDef.label}
                </span>
            )}
        </motion.div>
    );
}

// ============================================================================
// State Journey Visualization
// ============================================================================

const STATE_ORDER: ComprehensionState[] = [
    "confusion",
    "struggling",
    "progressing",
    "breakthrough",
    "mastery",
];

interface StateJourneyVisualizationProps {
    currentState: ComprehensionState;
    className?: string;
}

export function StateJourneyVisualization({
    currentState,
    className = "",
}: StateJourneyVisualizationProps) {
    const currentIndex = STATE_ORDER.indexOf(currentState);

    return (
        <div className={`flex items-center gap-1 ${className}`} data-testid="state-journey-viz">
            {STATE_ORDER.map((state, index) => {
                const stateDef = STATE_DEFINITIONS[state];
                const isActive = index === currentIndex;
                const isPast = index < currentIndex;

                return (
                    <React.Fragment key={state}>
                        <motion.div
                            className={`flex items-center justify-center rounded-full transition-all ${
                                isActive
                                    ? `w-10 h-10 ${stateDef.color.bg} ${stateDef.color.border} border-2`
                                    : isPast
                                    ? `w-6 h-6 ${stateDef.color.bg} opacity-60`
                                    : "w-6 h-6 bg-[var(--forge-bg-elevated)] opacity-40"
                            }`}
                            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                            title={stateDef.label}
                        >
                            <span className={isActive ? "text-base" : "text-xs"}>
                                {stateDef.icon}
                            </span>
                        </motion.div>
                        {index < STATE_ORDER.length - 1 && (
                            <div
                                className={`h-0.5 w-4 rounded-full transition-colors ${
                                    isPast ? "bg-[var(--forge-text-muted)]" : "bg-[var(--forge-bg-elevated)]"
                                }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export default ComprehensionIndicator;
