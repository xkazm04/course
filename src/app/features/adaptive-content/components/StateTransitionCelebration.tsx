"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUp, ArrowDown, Minus, X } from "lucide-react";
import type {
    StateTransitionEvent,
    ComprehensionState,
} from "../lib/comprehensionStateMachine";
import {
    STATE_DEFINITIONS,
    TRANSITION_MESSAGES,
} from "../lib/comprehensionStateMachine";

// ============================================================================
// Types
// ============================================================================

interface StateTransitionCelebrationProps {
    transition: StateTransitionEvent | null;
    onDismiss?: () => void;
    autoHideMs?: number;
}

// ============================================================================
// Celebration Component
// ============================================================================

export function StateTransitionCelebration({
    transition,
    onDismiss,
    autoHideMs = 5000,
}: StateTransitionCelebrationProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (transition) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                onDismiss?.();
            }, autoHideMs);
            return () => clearTimeout(timer);
        }
    }, [transition, autoHideMs, onDismiss]);

    if (!transition) return null;

    const message = TRANSITION_MESSAGES[transition.transition];
    const toStateDef = STATE_DEFINITIONS[transition.toState];
    const fromStateDef = STATE_DEFINITIONS[transition.fromState];

    const isPositiveTransition = message.celebration;

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-6 right-6 z-50 max-w-sm"
                    data-testid="state-transition-celebration"
                >
                    <div
                        className={`relative overflow-hidden rounded-xl border backdrop-blur-md shadow-2xl ${
                            isPositiveTransition
                                ? `${toStateDef.color.bg} ${toStateDef.color.border}`
                                : "bg-slate-800/90 border-slate-700/50"
                        }`}
                    >
                        {/* Celebration particles for positive transitions */}
                        {isPositiveTransition && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{
                                            x: "50%",
                                            y: "100%",
                                            opacity: 1,
                                            scale: 0,
                                        }}
                                        animate={{
                                            x: `${20 + Math.random() * 60}%`,
                                            y: `${-20 - Math.random() * 40}%`,
                                            opacity: 0,
                                            scale: 1,
                                        }}
                                        transition={{
                                            duration: 1 + Math.random() * 0.5,
                                            delay: Math.random() * 0.3,
                                            ease: "easeOut",
                                        }}
                                        className={`absolute w-2 h-2 rounded-full ${toStateDef.color.bg.replace("/10", "")}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Header with transition direction */}
                        <div className="flex items-center justify-between p-4 pb-2">
                            <div className="flex items-center gap-2">
                                {isPositiveTransition ? (
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ repeat: 2, duration: 0.3 }}
                                    >
                                        <Sparkles className={`w-5 h-5 ${toStateDef.color.text}`} />
                                    </motion.div>
                                ) : (
                                    <Minus className="w-5 h-5 text-slate-400" />
                                )}
                                <span
                                    className={`font-semibold ${
                                        isPositiveTransition ? toStateDef.color.text : "text-slate-300"
                                    }`}
                                >
                                    {message.title}
                                </span>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="p-1 rounded-full hover:bg-slate-700/50 transition-colors"
                                data-testid="dismiss-celebration-btn"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        {/* State transition visualization */}
                        <div className="px-4 py-2">
                            <div className="flex items-center gap-3 justify-center">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg">{fromStateDef.icon}</span>
                                    <span className="text-xs text-slate-400">{fromStateDef.label}</span>
                                </div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                >
                                    {isPositiveTransition ? (
                                        <ArrowUp className={`w-5 h-5 ${toStateDef.color.text}`} />
                                    ) : (
                                        <ArrowDown className="w-5 h-5 text-slate-400" />
                                    )}
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <span className="text-lg">{toStateDef.icon}</span>
                                    <span className={`text-xs font-medium ${toStateDef.color.text}`}>
                                        {toStateDef.label}
                                    </span>
                                </motion.div>
                            </div>
                        </div>

                        {/* Message */}
                        <div className="px-4 pb-4">
                            <p className="text-sm text-slate-300 mb-1">{message.message}</p>
                            <p className="text-xs text-slate-400">{message.encouragement}</p>
                        </div>

                        {/* Progress bar animation */}
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: autoHideMs / 1000, ease: "linear" }}
                            className={`h-0.5 ${
                                isPositiveTransition
                                    ? toStateDef.color.bg.replace("/10", "")
                                    : "bg-slate-600"
                            }`}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ============================================================================
// State Progress Component
// ============================================================================

interface StateProgressProps {
    currentState: ComprehensionState;
    progress: number;
    nextState: ComprehensionState;
    requirements: string[];
    className?: string;
}

export function StateProgress({
    currentState,
    progress,
    nextState,
    requirements,
    className = "",
}: StateProgressProps) {
    const currentDef = STATE_DEFINITIONS[currentState];
    const nextDef = STATE_DEFINITIONS[nextState];

    return (
        <div
            className={`rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 ${className}`}
            data-testid="state-progress"
        >
            {/* Current to Next State */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{currentDef.icon}</span>
                    <span className={`text-sm font-medium ${currentDef.color.text}`}>
                        {currentDef.label}
                    </span>
                </div>
                <span className="text-xs text-slate-400">→</span>
                <div className="flex items-center gap-2">
                    <span className="text-lg">{nextDef.icon}</span>
                    <span className={`text-sm font-medium ${nextDef.color.text}`}>
                        {nextDef.label}
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden mb-3">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${nextDef.color.gradient}`}
                />
            </div>

            {/* Requirements */}
            {requirements.length > 0 && currentState !== nextState && (
                <div className="space-y-1">
                    <span className="text-xs text-slate-500">To advance:</span>
                    {requirements.map((req, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-1 h-1 rounded-full bg-slate-500" />
                            <span>{req}</span>
                        </div>
                    ))}
                </div>
            )}

            {currentState === nextState && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Sparkles className="w-3 h-3" />
                    <span>You've reached the highest state!</span>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// State Journey Timeline
// ============================================================================

interface StateJourneyTimelineProps {
    transitions: StateTransitionEvent[];
    className?: string;
    maxItems?: number;
}

export function StateJourneyTimeline({
    transitions,
    className = "",
    maxItems = 5,
}: StateJourneyTimelineProps) {
    const recentTransitions = transitions.slice(-maxItems).reverse();

    if (recentTransitions.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-2 ${className}`} data-testid="state-journey-timeline">
            <span className="text-xs font-medium text-slate-400">Recent Journey</span>
            <div className="space-y-1">
                {recentTransitions.map((t) => {
                    const message = TRANSITION_MESSAGES[t.transition];
                    const toDef = STATE_DEFINITIONS[t.toState];
                    const timeAgo = formatTimeAgo(t.timestamp);

                    return (
                        <div
                            key={t.id}
                            className="flex items-center gap-2 text-xs"
                            data-testid={`timeline-item-${t.id}`}
                        >
                            <span>{toDef.icon}</span>
                            <span className={toDef.color.text}>{message.title}</span>
                            <span className="text-slate-500">{timeAgo}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// Helpers
// ============================================================================

function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default StateTransitionCelebration;
