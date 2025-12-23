"use client";

import { useMemo } from "react";
import type { Variants, Transition, TargetAndTransition } from "framer-motion";

/**
 * Animation preset types for common patterns
 */
export type AnimationPreset =
    | "stagger-fast"
    | "stagger-slow"
    | "stagger-medium"
    | "bounce"
    | "smooth"
    | "fade"
    | "slide-left"
    | "slide-right"
    | "slide-up"
    | "scale-fade";

/**
 * Direction for entry/exit animations
 */
export type AnimationDirection = "left" | "right" | "up" | "down";

/**
 * Spring configuration presets
 */
export interface SpringConfig {
    stiffness: number;
    damping: number;
    mass?: number;
}

/**
 * Configuration options for the useVariantAnimation hook
 */
export interface VariantAnimationConfig {
    /** Animation preset to use */
    preset?: AnimationPreset;
    /** Index for staggered animations (delay = index * staggerDelay) */
    index?: number;
    /** Custom stagger delay override (seconds) */
    staggerDelay?: number;
    /** Custom animation duration (seconds) */
    duration?: number;
    /** Base delay before animation starts (seconds) */
    baseDelay?: number;
    /** Scale factor for hover animations */
    hoverScale?: number;
    /** Custom spring configuration */
    springConfig?: Partial<SpringConfig>;
    /** Direction for slide animations */
    direction?: AnimationDirection;
    /** Enable exit animations */
    enableExit?: boolean;
}

/**
 * Return type for the useVariantAnimation hook
 */
export interface VariantAnimationResult {
    /** Initial animation state */
    initial: TargetAndTransition;
    /** Animate to state */
    animate: TargetAndTransition;
    /** Exit animation state */
    exit: TargetAndTransition;
    /** Hover animation state */
    whileHover: TargetAndTransition;
    /** Tap/press animation state */
    whileTap: TargetAndTransition;
    /** Transition configuration */
    transition: Transition;
    /** Framer Motion variants object */
    variants: Variants;
    /** Computed delay for this item */
    delay: number;
}

// Default spring configurations
const SPRING_CONFIGS: Record<string, SpringConfig> = {
    bounce: { stiffness: 400, damping: 15, mass: 1 },
    smooth: { stiffness: 200, damping: 30, mass: 1 },
    snappy: { stiffness: 500, damping: 25, mass: 0.8 },
    gentle: { stiffness: 150, damping: 20, mass: 1.2 },
};

// Default stagger delays for presets (seconds)
const STAGGER_DELAYS: Record<string, number> = {
    "stagger-fast": 0.05,
    "stagger-medium": 0.08,
    "stagger-slow": 0.1,
};

// Default durations for presets (seconds)
const PRESET_DURATIONS: Record<string, number> = {
    bounce: 0.5,
    smooth: 0.3,
    fade: 0.2,
    "slide-left": 0.3,
    "slide-right": 0.3,
    "slide-up": 0.3,
    "scale-fade": 0.25,
};

/**
 * Get direction offset for slide animations
 */
function getDirectionOffset(direction: AnimationDirection): { x: number; y: number } {
    switch (direction) {
        case "left":
            return { x: -20, y: 0 };
        case "right":
            return { x: 20, y: 0 };
        case "up":
            return { x: 0, y: -20 };
        case "down":
            return { x: 0, y: 20 };
        default:
            return { x: 0, y: 0 };
    }
}

/**
 * useVariantAnimation - Centralized hook for animation orchestration
 *
 * Provides consistent animation patterns across components with configurable presets.
 *
 * @example
 * ```tsx
 * // Basic staggered entry
 * const animation = useVariantAnimation({ preset: 'stagger-fast', index: 2 });
 * <motion.div {...animation} />
 *
 * // Bounce with custom hover
 * const animation = useVariantAnimation({
 *   preset: 'bounce',
 *   hoverScale: 1.1,
 * });
 *
 * // Custom spring config
 * const animation = useVariantAnimation({
 *   preset: 'smooth',
 *   springConfig: { stiffness: 300, damping: 25 },
 * });
 * ```
 */
export function useVariantAnimation(config: VariantAnimationConfig = {}): VariantAnimationResult {
    const {
        preset = "smooth",
        index = 0,
        staggerDelay,
        duration,
        baseDelay = 0,
        hoverScale = 1.05,
        springConfig,
        direction = "left",
        enableExit = true,
    } = config;

    return useMemo(() => {
        // Calculate delay based on preset and index
        const presetStaggerDelay = STAGGER_DELAYS[preset] ?? 0;
        const computedDelay = baseDelay + index * (staggerDelay ?? presetStaggerDelay);

        // Get duration from preset or use default
        const computedDuration = duration ?? PRESET_DURATIONS[preset] ?? 0.3;

        // Determine spring config based on preset
        let spring: SpringConfig;
        if (preset === "bounce") {
            spring = { ...SPRING_CONFIGS.bounce, ...springConfig };
        } else if (preset === "smooth") {
            spring = { ...SPRING_CONFIGS.smooth, ...springConfig };
        } else {
            spring = { ...SPRING_CONFIGS.gentle, ...springConfig };
        }

        // Build animation states based on preset
        let initial: TargetAndTransition = { opacity: 0 };
        let animate: TargetAndTransition = { opacity: 1 };
        let exit: TargetAndTransition = { opacity: 0 };

        // Configure based on preset type
        if (preset.startsWith("stagger") || preset === "slide-left") {
            const offset = getDirectionOffset(direction);
            initial = { opacity: 0, x: offset.x, y: offset.y };
            animate = { opacity: 1, x: 0, y: 0 };
            exit = enableExit ? { opacity: 0, x: offset.x, y: offset.y } : { opacity: 0 };
        } else if (preset === "slide-right") {
            initial = { opacity: 0, x: 20 };
            animate = { opacity: 1, x: 0 };
            exit = enableExit ? { opacity: 0, x: -20 } : { opacity: 0 };
        } else if (preset === "slide-up") {
            initial = { opacity: 0, y: 10 };
            animate = { opacity: 1, y: 0 };
            exit = enableExit ? { opacity: 0, y: -10 } : { opacity: 0 };
        } else if (preset === "bounce") {
            initial = { opacity: 0, scale: 0.8, y: 20 };
            animate = { opacity: 1, scale: 1, y: 0 };
            exit = enableExit ? { opacity: 0, scale: 0.8, y: -20 } : { opacity: 0 };
        } else if (preset === "scale-fade") {
            initial = { opacity: 0, scale: 0.9, y: 10 };
            animate = { opacity: 1, scale: 1, y: 0 };
            exit = enableExit ? { opacity: 0, scale: 0.9 } : { opacity: 0 };
        } else if (preset === "fade") {
            initial = { opacity: 0 };
            animate = { opacity: 1 };
            exit = { opacity: 0 };
        }

        // Build transition based on preset
        const transition: Transition =
            preset === "bounce"
                ? {
                      delay: computedDelay,
                      type: "spring",
                      ...spring,
                  }
                : preset === "smooth"
                  ? {
                        delay: computedDelay,
                        type: "spring",
                        ...spring,
                    }
                  : {
                        delay: computedDelay,
                        duration: computedDuration,
                        ease: "easeOut",
                    };

        // Hover and tap states
        const whileHover: TargetAndTransition = {
            scale: hoverScale,
            transition: { type: "spring", stiffness: 400, damping: 20 },
        };

        const whileTap: TargetAndTransition = {
            scale: hoverScale * 0.95,
        };

        // Build variants object for motion components
        const variants: Variants = {
            initial,
            animate,
            exit,
            hover: whileHover,
            tap: whileTap,
        };

        return {
            initial,
            animate,
            exit,
            whileHover,
            whileTap,
            transition,
            variants,
            delay: computedDelay,
        };
    }, [preset, index, staggerDelay, duration, baseDelay, hoverScale, springConfig, direction, enableExit]);
}

/**
 * Helper function to get stagger delay for a preset
 */
export function getStaggerDelay(preset: AnimationPreset): number {
    return STAGGER_DELAYS[preset] ?? 0.05;
}

/**
 * Helper function to get spring config for a preset
 */
export function getSpringConfig(preset: "bounce" | "smooth" | "snappy" | "gentle"): SpringConfig {
    return SPRING_CONFIGS[preset];
}

/**
 * Container animation variants for staggered children
 */
export const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

/**
 * Child item variants for use with containerVariants
 */
export const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 200,
            damping: 20,
        },
    },
};

export default useVariantAnimation;
