/**
 * Animation Timing Tokens
 *
 * Unified animation timing scale for consistent motion feel across the application.
 * These values should be used for all framer-motion and CSS transitions to ensure
 * a cohesive, polished user experience.
 *
 * @example
 * ```tsx
 * import { DURATIONS, EASINGS, TRANSITIONS } from "@/app/shared/lib/animationTiming";
 *
 * // Using with framer-motion
 * <motion.div
 *   initial={{ opacity: 0 }}
 *   animate={{ opacity: 1 }}
 *   transition={TRANSITIONS.normal}
 * />
 *
 * // Using duration values directly
 * transition={{ duration: DURATIONS.fast, ease: EASINGS.easeOut }}
 * ```
 */

// =============================================================================
// DURATION TOKENS
// =============================================================================

/**
 * Duration values in seconds for framer-motion animations.
 * Maps to CSS custom properties: --duration-instant, --duration-fast, etc.
 */
export const DURATIONS = {
    /** Micro-interactions: toggles, focus states (0.1s) */
    instant: 0.1,
    /** Quick feedback: menu open/close, tooltips (0.2s) */
    fast: 0.2,
    /** Standard transitions: expansion, reveal (0.3s) */
    normal: 0.3,
    /** Deliberate animations: progress bars, onboarding (0.5s) */
    slow: 0.5,
    /** Ambient/decorative: background gradients (20s) */
    decorative: 20,
} as const;

export type DurationKey = keyof typeof DURATIONS;

// =============================================================================
// EASING CURVES
// =============================================================================

/**
 * Easing functions for framer-motion animations.
 * Provides both string values (for simple cases) and cubic-bezier arrays.
 */
export const EASINGS = {
    /** Standard ease-out for element appearances */
    easeOut: "easeOut",
    /** Symmetric ease for back-and-forth animations */
    easeInOut: "easeInOut",
    /** Linear for decorative/ambient animations */
    linear: "linear",
} as const;

/**
 * Cubic-bezier arrays for CSS or custom interpolation.
 * Matches CSS custom properties: --ease-out, --ease-in-out, --ease-spring
 */
export const EASING_BEZIERS = {
    easeOut: [0.0, 0.0, 0.2, 1] as const,
    easeInOut: [0.4, 0.0, 0.2, 1] as const,
    spring: [0.34, 1.56, 0.64, 1] as const,
};

// =============================================================================
// SPRING CONFIGURATIONS
// =============================================================================

/**
 * Spring configurations for framer-motion type: "spring" transitions.
 * Use these for interactive elements that need natural, bouncy motion.
 */
export const SPRINGS = {
    /** Snappy spring for toggles and micro-interactions */
    snappy: {
        type: "spring" as const,
        stiffness: 500,
        damping: 30,
    },
    /** Responsive spring for menu items and dropdowns */
    responsive: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
    },
    /** Gentle spring for larger elements */
    gentle: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
    },
    /** Bouncy spring for playful elements */
    bouncy: {
        type: "spring" as const,
        stiffness: 350,
        damping: 15,
    },
} as const;

// =============================================================================
// TRANSITION PRESETS
// =============================================================================

/**
 * Pre-configured transition objects for common animation patterns.
 * Use these for consistency across components.
 */
export const TRANSITIONS = {
    /** Instant micro-interactions (0.1s) */
    instant: {
        duration: DURATIONS.instant,
        ease: EASINGS.easeOut,
    },
    /** Fast feedback animations (0.2s) */
    fast: {
        duration: DURATIONS.fast,
        ease: EASINGS.easeOut,
    },
    /** Standard UI transitions (0.3s) */
    normal: {
        duration: DURATIONS.normal,
        ease: EASINGS.easeOut,
    },
    /** Slow, deliberate animations (0.5s) */
    slow: {
        duration: DURATIONS.slow,
        ease: EASINGS.easeOut,
    },
    /** Menu/dropdown animations */
    menu: {
        duration: DURATIONS.fast,
        ease: EASINGS.easeOut,
    },
    /** Content expansion (accordion, collapsible) */
    expand: {
        duration: DURATIONS.normal,
        ease: EASINGS.easeOut,
    },
    /** Progress bar animations */
    progress: {
        duration: DURATIONS.slow,
        ease: EASINGS.easeOut,
    },
    /** Decorative/ambient background animations */
    decorative: {
        duration: DURATIONS.decorative,
        repeat: Infinity,
        ease: EASINGS.linear,
    },
} as const;

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

/**
 * Pre-built animation variants for common patterns.
 * Use with framer-motion's variants prop.
 */
export const ANIMATION_VARIANTS = {
    /** Fade in from below (for list items, reveals) */
    fadeInUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
    },
    /** Fade in from above (for dropdowns, menus) */
    fadeInDown: {
        initial: { opacity: 0, y: -10, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.95 },
    },
    /** Simple fade */
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    /** Expand from zero height (for accordion/collapse) */
    expand: {
        initial: { height: 0, opacity: 0 },
        animate: { height: "auto", opacity: 1 },
        exit: { height: 0, opacity: 0 },
    },
    /** Scale in (for modals, popovers) */
    scaleIn: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
    },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a staggered delay based on item index.
 * Useful for list item animations.
 *
 * @param index - The item's index in the list
 * @param baseDelay - Initial delay before first item (default: 0)
 * @param staggerAmount - Delay between each item (default: 0.05s)
 */
export function getStaggerDelay(
    index: number,
    baseDelay: number = 0,
    staggerAmount: number = 0.05
): number {
    return baseDelay + index * staggerAmount;
}

/**
 * Creates transition config with staggered delay.
 *
 * @param index - The item's index
 * @param preset - Base transition preset to use
 */
export function createStaggeredTransition(
    index: number,
    preset: keyof typeof TRANSITIONS = "normal"
): { duration: number; ease: string; delay: number } {
    const baseTransition = TRANSITIONS[preset];
    return {
        duration: baseTransition.duration,
        ease: baseTransition.ease,
        delay: getStaggerDelay(index),
    };
}

// Default export for convenience
export default {
    DURATIONS,
    EASINGS,
    EASING_BEZIERS,
    SPRINGS,
    TRANSITIONS,
    ANIMATION_VARIANTS,
    getStaggerDelay,
    createStaggeredTransition,
};
