/**
 * Forge Animation Utilities
 *
 * Shared animation configs, variants, and utilities for consistent
 * animations across all Forge pages. Extracted from gold standard
 * components (HeroSection, DomainCards).
 */

import type { Variants, Transition } from "framer-motion";

// ============================================================================
// TIMING & EASING
// ============================================================================

/**
 * Custom easing curve for smooth, professional animations
 * Ease-out cubic with slight overshoot feel
 */
export const forgeEasing = [0.23, 1, 0.32, 1] as const;

/**
 * Calculate staggered delay for list animations
 * @param index - Item index in list
 * @param base - Base delay increment (default 0.08s)
 */
export const staggerDelay = (index: number, base = 0.08) => index * base;

/**
 * Viewport trigger config for whileInView animations
 */
export const viewportConfig = {
    once: true,
    margin: "-50px",
} as const;

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

/**
 * Standard animation timing presets
 */
export const timing = {
    fast: 0.2,
    normal: 0.3,
    slow: 0.4,
    verySlow: 0.6,
} as const;

/**
 * Standard transition configs
 */
export const transitions = {
    /** Fast hover/interaction transitions */
    fast: {
        duration: timing.fast,
        ease: "easeOut",
    } as Transition,

    /** Normal content transitions */
    normal: {
        duration: timing.normal,
        ease: forgeEasing,
    } as Transition,

    /** Smooth page/section transitions */
    smooth: {
        duration: timing.slow,
        ease: forgeEasing,
    } as Transition,

    /** Spring animation for interactive elements */
    spring: {
        type: "spring",
        stiffness: 400,
        damping: 30,
    } as Transition,

    /** Bounce animation for celebratory moments */
    bounce: {
        type: "spring",
        stiffness: 500,
        damping: 15,
    } as Transition,
} as const;

// ============================================================================
// MOTION VARIANTS
// ============================================================================

/**
 * Fade up animation - most common entry animation
 * Usage: <motion.div variants={fadeUpVariants} initial="hidden" animate="visible" custom={index} />
 */
export const fadeUpVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
    },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: staggerDelay(i),
            duration: timing.normal,
            ease: forgeEasing,
        },
    }),
};

/**
 * Fade in with scale - for cards and modal content
 */
export const fadeScaleVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
    },
    visible: (i: number = 0) => ({
        opacity: 1,
        scale: 1,
        transition: {
            delay: staggerDelay(i),
            duration: timing.normal,
            ease: forgeEasing,
        },
    }),
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: timing.fast,
        },
    },
};

/**
 * Slide from left - for sidebars and navigation
 */
export const slideLeftVariants: Variants = {
    hidden: {
        opacity: 0,
        x: -20,
    },
    visible: (i: number = 0) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: staggerDelay(i),
            duration: timing.normal,
            ease: forgeEasing,
        },
    }),
};

/**
 * Slide from right - for detail panels
 */
export const slideRightVariants: Variants = {
    hidden: {
        opacity: 0,
        x: 20,
    },
    visible: (i: number = 0) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: staggerDelay(i),
            duration: timing.normal,
            ease: forgeEasing,
        },
    }),
};

/**
 * Container variant for staggered children
 * Usage: <motion.div variants={staggerContainer} initial="hidden" animate="visible">
 */
export const staggerContainer: Variants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

/**
 * Child variant for use with staggerContainer
 */
export const staggerChild: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: timing.normal,
            ease: forgeEasing,
        },
    },
};

// ============================================================================
// HOVER EFFECTS
// ============================================================================

/**
 * Card hover effect - scale up with shadow
 */
export const cardHover = {
    scale: 1.02,
    y: -4,
    transition: transitions.fast,
};

/**
 * Button hover effect - subtle scale
 */
export const buttonHover = {
    scale: 1.02,
    transition: transitions.fast,
};

/**
 * Button tap effect
 */
export const buttonTap = {
    scale: 0.98,
};

/**
 * Icon wiggle effect on hover
 */
export const iconWiggle = {
    rotate: [0, -5, 5, 0],
    transition: { duration: 0.5 },
};

// ============================================================================
// GRADIENT PRESETS
// ============================================================================

/**
 * Ember gradient - primary brand gradient
 */
export const gradients = {
    ember: "from-[var(--ember)] via-[var(--gold)] to-[var(--ember-glow)]",
    gold: "from-[var(--gold)] via-amber-400 to-yellow-500",
    success: "from-[var(--forge-success)] via-emerald-400 to-teal-500",
    info: "from-[var(--forge-info)] via-cyan-400 to-sky-500",
    error: "from-[var(--forge-error)] via-red-400 to-pink-500",
    purple: "from-violet-500 via-purple-500 to-fuchsia-500",
} as const;

/**
 * Text gradient class string for ember gradient text
 */
export const textGradientEmber =
    "text-transparent bg-clip-text bg-gradient-to-r from-[var(--ember)] via-[var(--gold)] to-[var(--ember-glow)]";

/**
 * Stat number gradient (white to secondary)
 */
export const textGradientStat =
    "text-transparent bg-clip-text bg-gradient-to-b from-white to-[var(--forge-text-secondary)]";

// ============================================================================
// CSS CLASS HELPERS
// ============================================================================

/**
 * Standard card styling classes
 */
export const cardClasses = {
    base: "bg-[var(--forge-bg-elevated)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)]",
    hover: "hover:border-[var(--ember)]/30 hover:shadow-lg transition-all duration-200",
    elevated: "shadow-lg shadow-black/10",
} as const;

/**
 * Standard button styling classes
 */
export const buttonClasses = {
    secondary:
        "px-4 py-2 rounded-lg bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm border border-[var(--forge-border-subtle)] text-[var(--forge-text-primary)] font-medium hover:border-[var(--ember)]/30 transition-all",
} as const;
