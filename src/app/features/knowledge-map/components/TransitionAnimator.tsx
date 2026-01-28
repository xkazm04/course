"use client";

/**
 * TransitionAnimator Component
 *
 * Manages animated transitions for breadcrumb navigation:
 * - Zoom-in effect when drilling down into content
 * - Zoom-out effect when drilling up to parent levels
 * - Spring physics for natural feel
 * - Maintains spatial context during transitions
 *
 * This component wraps the map canvas and applies CSS transforms
 * based on the current transition state from the scene graph.
 */

import React, { memo, useMemo, useEffect, useState } from "react";
import { motion, useSpring, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import type { SceneTransitionType, SceneTransitionConfig } from "../lib/useSceneGraph";

// ============================================================================
// TYPES
// ============================================================================

export interface TransitionAnimatorProps {
    /** Whether a transition is in progress */
    isTransitioning: boolean;
    /** Current transition configuration */
    transition: SceneTransitionConfig | null;
    /** Previous state for interpolation */
    previousState: {
        depth: number;
        scale: number;
        offsetX: number;
        offsetY: number;
    } | null;
    /** Current state */
    currentState: {
        depth: number;
        scale: number;
        offsetX: number;
        offsetY: number;
    };
    /** Children to animate */
    children: React.ReactNode;
    /** Additional class names */
    className?: string;
    /** Callback when transition completes */
    onTransitionComplete?: () => void;
}

export interface TransitionState {
    /** Current scale factor */
    scale: number;
    /** X translation */
    x: number;
    /** Y translation */
    y: number;
    /** Opacity */
    opacity: number;
    /** Blur amount (for depth effect) */
    blur: number;
}

// ============================================================================
// SPRING CONFIGS
// ============================================================================

const SPRING_CONFIGS = {
    drill_down: {
        stiffness: 200,
        damping: 25,
        mass: 1,
    },
    drill_up: {
        stiffness: 180,
        damping: 22,
        mass: 0.9,
    },
    focus: {
        stiffness: 300,
        damping: 30,
        mass: 0.8,
    },
    reset: {
        stiffness: 250,
        damping: 28,
        mass: 0.85,
    },
    default: {
        stiffness: 200,
        damping: 25,
        mass: 1,
    },
};

// ============================================================================
// TRANSITION ANIMATOR COMPONENT
// ============================================================================

export const TransitionAnimator: React.FC<TransitionAnimatorProps> = memo(
    function TransitionAnimator({
        isTransitioning,
        transition,
        previousState,
        currentState,
        children,
        className,
        onTransitionComplete,
    }) {
        // Determine transition type
        const transitionType = transition?.type || "instant";
        const isDrillDown = transitionType === "drill_down";
        const isDrillUp = transitionType === "drill_up";

        // Get spring config for this transition type
        const springConfig = SPRING_CONFIGS[transitionType as keyof typeof SPRING_CONFIGS] || SPRING_CONFIGS.default;

        // Calculate animation values
        const animationState = useMemo(() => {
            if (!isTransitioning || !previousState || !transition) {
                return {
                    scale: 1,
                    x: 0,
                    y: 0,
                    opacity: 1,
                    blur: 0,
                };
            }

            // For drill down: start zoomed out, zoom in
            if (isDrillDown) {
                return {
                    initialScale: 0.8,
                    targetScale: 1,
                    initialOpacity: 0.5,
                    targetOpacity: 1,
                    initialBlur: 4,
                    targetBlur: 0,
                };
            }

            // For drill up: start zoomed in, zoom out
            if (isDrillUp) {
                return {
                    initialScale: 1.2,
                    targetScale: 1,
                    initialOpacity: 0.5,
                    targetOpacity: 1,
                    initialBlur: 4,
                    targetBlur: 0,
                };
            }

            return {
                scale: 1,
                x: 0,
                y: 0,
                opacity: 1,
                blur: 0,
            };
        }, [isTransitioning, previousState, transition, isDrillDown, isDrillUp]);

        // Handle transition completion
        useEffect(() => {
            if (!isTransitioning) return;

            const duration = transition?.duration || 400;
            const timer = setTimeout(() => {
                onTransitionComplete?.();
            }, duration);

            return () => clearTimeout(timer);
        }, [isTransitioning, transition, onTransitionComplete]);

        // Animation variants
        const variants = {
            drillDown: {
                initial: {
                    scale: 0.8,
                    opacity: 0.3,
                    filter: "blur(8px)",
                },
                animate: {
                    scale: 1,
                    opacity: 1,
                    filter: "blur(0px)",
                },
            },
            drillUp: {
                initial: {
                    scale: 1.2,
                    opacity: 0.3,
                    filter: "blur(8px)",
                },
                animate: {
                    scale: 1,
                    opacity: 1,
                    filter: "blur(0px)",
                },
            },
            focus: {
                initial: {
                    scale: 0.95,
                    opacity: 0.7,
                },
                animate: {
                    scale: 1,
                    opacity: 1,
                },
            },
            reset: {
                initial: {
                    scale: 0.9,
                    opacity: 0.5,
                },
                animate: {
                    scale: 1,
                    opacity: 1,
                },
            },
            instant: {
                initial: {},
                animate: {},
            },
        };

        const currentVariant = variants[transitionType as keyof typeof variants] || variants.instant;

        return (
            <motion.div
                className={cn("w-full h-full", className)}
                initial={isTransitioning ? currentVariant.initial : false}
                animate={currentVariant.animate}
                transition={{
                    type: "spring",
                    ...springConfig,
                    duration: transition?.duration ? transition.duration / 1000 : undefined,
                }}
                onAnimationComplete={() => onTransitionComplete?.()}
            >
                {children}
            </motion.div>
        );
    }
);

// ============================================================================
// TRANSITION OVERLAY
// ============================================================================

interface TransitionOverlayProps {
    isTransitioning: boolean;
    transitionType: SceneTransitionType | null;
    className?: string;
}

/**
 * Optional overlay that provides visual feedback during transitions
 */
export const TransitionOverlay: React.FC<TransitionOverlayProps> = memo(
    function TransitionOverlay({ isTransitioning, transitionType, className }) {
        if (!isTransitioning || !transitionType) return null;

        const isDrillDown = transitionType === "drill_down";
        const isDrillUp = transitionType === "drill_up";

        return (
            <motion.div
                className={cn(
                    "absolute inset-0 pointer-events-none z-10",
                    className
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: isTransitioning ? 0.1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
            >
                {/* Radial gradient for zoom effect */}
                <div
                    className={cn(
                        "absolute inset-0",
                        isDrillDown && "bg-gradient-radial from-[var(--ember)]/10 via-transparent to-transparent",
                        isDrillUp && "bg-gradient-radial from-transparent via-transparent to-[var(--forge-bg-primary)]/20"
                    )}
                />
            </motion.div>
        );
    }
);

// ============================================================================
// DEPTH INDICATOR
// ============================================================================

interface DepthIndicatorProps {
    currentDepth: number;
    maxDepth?: number;
    isTransitioning: boolean;
    transitionType: SceneTransitionType | null;
    className?: string;
}

/**
 * Visual indicator of current depth in the hierarchy
 */
export const DepthIndicator: React.FC<DepthIndicatorProps> = memo(
    function DepthIndicator({
        currentDepth,
        maxDepth = 5,
        isTransitioning,
        transitionType,
        className,
    }) {
        return (
            <div className={cn("flex items-center gap-1", className)}>
                {Array.from({ length: maxDepth }).map((_, index) => {
                    const isActive = index < currentDepth;
                    const isCurrent = index === currentDepth - 1;
                    const isAnimating = isTransitioning && (
                        (transitionType === "drill_down" && index === currentDepth - 1) ||
                        (transitionType === "drill_up" && index === currentDepth)
                    );

                    return (
                        <motion.div
                            key={index}
                            className={cn(
                                "w-2 h-2 rounded-full transition-colors duration-200",
                                isActive
                                    ? isCurrent
                                        ? "bg-[var(--ember)]"
                                        : "bg-[var(--ember)]/50"
                                    : "bg-[var(--forge-bg-anvil)]"
                            )}
                            animate={
                                isAnimating
                                    ? {
                                        scale: [1, 1.5, 1],
                                        opacity: [1, 0.8, 1],
                                    }
                                    : {}
                            }
                            transition={{ duration: 0.3 }}
                        />
                    );
                })}
            </div>
        );
    }
);

// ============================================================================
// USE TRANSITION ANIMATION HOOK
// ============================================================================

/**
 * Hook for programmatic control of transition animations
 */
export function useTransitionAnimation(
    isTransitioning: boolean,
    transition: SceneTransitionConfig | null
) {
    const [animationState, setAnimationState] = useState({
        isAnimating: false,
        progress: 0,
    });

    useEffect(() => {
        if (!isTransitioning || !transition) {
            setAnimationState({ isAnimating: false, progress: 0 });
            return;
        }

        setAnimationState({ isAnimating: true, progress: 0 });

        const duration = transition.duration;
        const startTime = Date.now();

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            setAnimationState({ isAnimating: progress < 1, progress });

            if (progress < 1) {
                requestAnimationFrame(updateProgress);
            }
        };

        requestAnimationFrame(updateProgress);
    }, [isTransitioning, transition]);

    return animationState;
}

export default TransitionAnimator;
