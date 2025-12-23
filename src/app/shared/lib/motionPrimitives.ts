"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import {
    useMotionValue,
    useSpring,
    useTransform,
    MotionValue,
    SpringOptions,
    Easing,
} from "framer-motion";

// ============================================================================
// Motion Duration Tokens - Standardized animation timing across the app
// ============================================================================

/**
 * Motion duration tokens for consistent animation rhythm.
 * Use these constants instead of hardcoded duration values.
 *
 * @example
 * ```tsx
 * import { DURATION_NORMAL, DURATION_ENTRANCE } from '@/app/shared/lib/motionPrimitives';
 *
 * <motion.div
 *   initial={{ opacity: 0 }}
 *   animate={{ opacity: 1 }}
 *   transition={{ duration: DURATION_ENTRANCE }}
 * />
 * ```
 */

/** Fast micro-interactions: hover effects, button feedback (0.15s) */
export const DURATION_FAST = 0.15;

/** Normal transitions: state changes, toggles, simple animations (0.3s) */
export const DURATION_NORMAL = 0.3;

/** Slow transitions: complex state changes, panel slides (0.5s) */
export const DURATION_SLOW = 0.5;

/** Entrance animations: hero sections, page transitions, modals (0.6s) */
export const DURATION_ENTRANCE = 0.6;

/**
 * Motion duration token type for type-safe duration selection
 */
export type MotionDuration =
    | typeof DURATION_FAST
    | typeof DURATION_NORMAL
    | typeof DURATION_SLOW
    | typeof DURATION_ENTRANCE;

/**
 * Object containing all duration tokens for easy spreading/iteration
 */
export const MOTION_DURATIONS = {
    fast: DURATION_FAST,
    normal: DURATION_NORMAL,
    slow: DURATION_SLOW,
    entrance: DURATION_ENTRANCE,
} as const;

// ============================================================================
// useReducedMotion - Detect user's reduced motion preference
// ============================================================================

/**
 * Hook to detect if the user prefers reduced motion.
 * Uses the prefers-reduced-motion media query.
 *
 * @returns boolean indicating if reduced motion is preferred
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 *
 * return (
 *   <motion.div
 *     animate={{ x: prefersReducedMotion ? 0 : 100 }}
 *   />
 * );
 * ```
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Check if window is available (SSR safety)
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        // Set initial value
        setPrefersReducedMotion(mediaQuery.matches);

        // Listen for changes
        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        mediaQuery.addEventListener("change", handleChange);

        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, []);

    return prefersReducedMotion;
}

// ============================================================================
// use3DParallax - 3D mouse-tracking parallax effect
// ============================================================================

export interface Use3DParallaxOptions {
    /** Maximum rotation angle in degrees (default: 15) */
    rotationRange?: number;
    /** Maximum content translation in pixels (default: 10) */
    translationRange?: number;
    /** Spring stiffness (default: 300) */
    stiffness?: number;
    /** Spring damping (default: 30) */
    damping?: number;
}

export interface Use3DParallaxReturn {
    /** Ref to attach to the container element */
    ref: React.RefObject<HTMLDivElement | null>;
    /** X rotation transform for the container */
    rotateX: MotionValue<string>;
    /** Y rotation transform for the container */
    rotateY: MotionValue<string>;
    /** X translation for inner content parallax */
    contentX: MotionValue<string>;
    /** Y translation for inner content parallax */
    contentY: MotionValue<string>;
    /** Mouse move handler to attach to the container */
    handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    /** Mouse leave handler to reset position */
    handleMouseLeave: () => void;
}

/**
 * Creates a 3D parallax effect that responds to mouse movement.
 * Commonly used for interactive cards with depth and perspective.
 *
 * @example
 * ```tsx
 * const { ref, rotateX, rotateY, contentX, contentY, handleMouseMove, handleMouseLeave } = use3DParallax();
 *
 * return (
 *   <motion.div
 *     ref={ref}
 *     onMouseMove={handleMouseMove}
 *     onMouseLeave={handleMouseLeave}
 *     style={{ rotateY, rotateX, transformStyle: "preserve-3d" }}
 *   >
 *     <motion.div style={{ x: contentX, y: contentY }}>
 *       Content with parallax
 *     </motion.div>
 *   </motion.div>
 * );
 * ```
 */
export function use3DParallax(options: Use3DParallaxOptions = {}): Use3DParallaxReturn {
    const {
        rotationRange = 15,
        translationRange = 10,
        stiffness = 300,
        damping = 30,
    } = options;

    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig: SpringOptions = { stiffness, damping };
    const mouseXSpring = useSpring(x, springConfig);
    const mouseYSpring = useSpring(y, springConfig);

    const rotateX = useTransform(
        mouseYSpring,
        [-0.5, 0.5],
        [`${rotationRange}deg`, `-${rotationRange}deg`]
    );
    const rotateY = useTransform(
        mouseXSpring,
        [-0.5, 0.5],
        [`-${rotationRange}deg`, `${rotationRange}deg`]
    );
    const contentX = useTransform(
        mouseXSpring,
        [-0.5, 0.5],
        [`-${translationRange}px`, `${translationRange}px`]
    );
    const contentY = useTransform(
        mouseYSpring,
        [-0.5, 0.5],
        [`-${translationRange}px`, `${translationRange}px`]
    );

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const xPct = (e.clientX - rect.left) / rect.width - 0.5;
        const yPct = (e.clientY - rect.top) / rect.height - 0.5;
        x.set(xPct);
        y.set(yPct);
    }, [x, y]);

    const handleMouseLeave = useCallback(() => {
        x.set(0);
        y.set(0);
    }, [x, y]);

    return {
        ref,
        rotateX,
        rotateY,
        contentX,
        contentY,
        handleMouseMove,
        handleMouseLeave,
    };
}

// ============================================================================
// useFloatLoop - Infinite floating animation config generator
// ============================================================================

export interface UseFloatLoopOptions {
    /** Range of X movement in pixels (default: 10) */
    xRange?: number;
    /** Range of Y movement in pixels (default: 10) */
    yRange?: number;
    /** Base duration in seconds (default: 5) */
    baseDuration?: number;
    /** Random duration variance in seconds (default: 5) */
    durationVariance?: number;
    /** Initial delay before animation starts (default: 0) */
    delay?: number;
    /** Random delay variance in seconds (default: 2) */
    delayVariance?: number;
    /** Include initial fade-in and scale animation (default: true) */
    includeEntrance?: boolean;
    /** Duration of entrance animation in seconds (default: 0.5) */
    entranceDuration?: number;
    /** If true, disables floating animation for reduced motion preference (default: false) */
    reducedMotion?: boolean;
}

export interface FloatLoopAnimation {
    /** Initial animation state */
    initial: {
        opacity: number;
        scale: number;
    };
    /** Animate state with keyframe arrays */
    animate: {
        opacity: number;
        scale: number;
        x: number[];
        y: number[];
    };
    /** Transition configuration */
    transition: {
        opacity: { delay: number; duration: number };
        scale: { delay: number; duration: number };
        default: {
            repeat: number;
            duration: number;
            ease: Easing;
            delay: number;
        };
    };
}

/**
 * Generates animation props for infinite floating/bobbing effects.
 * Useful for decorative badges, icons, or ambient elements.
 *
 * @example
 * ```tsx
 * const floatAnimation = useFloatLoop({ delay: 0.2, xRange: 10, yRange: 10 });
 *
 * return (
 *   <motion.div {...floatAnimation}>
 *     <Badge>AI Powered</Badge>
 *   </motion.div>
 * );
 * ```
 */
export function useFloatLoop(options: UseFloatLoopOptions = {}): FloatLoopAnimation {
    const {
        xRange = 10,
        yRange = 10,
        baseDuration = 5,
        durationVariance = 5,
        delay = 0,
        delayVariance = 2,
        includeEntrance = true,
        entranceDuration = 0.5,
        reducedMotion = false,
    } = options;

    const randomDuration = baseDuration + Math.random() * durationVariance;
    const randomDelay = Math.random() * delayVariance;

    // If reduced motion is preferred, skip floating animation
    // but still allow subtle fade-in entrance
    if (reducedMotion) {
        return {
            initial: {
                opacity: includeEntrance ? 0 : 1,
                scale: 1,
            },
            animate: {
                opacity: 1,
                scale: 1,
                x: [0],
                y: [0],
            },
            transition: {
                opacity: { delay, duration: 0.2 },
                scale: { delay, duration: 0 },
                default: {
                    repeat: 0,
                    duration: 0,
                    ease: "linear",
                    delay: 0,
                },
            },
        };
    }

    return {
        initial: {
            opacity: includeEntrance ? 0 : 1,
            scale: includeEntrance ? 0 : 1,
        },
        animate: {
            opacity: 1,
            scale: 1,
            x: [0, xRange, 0],
            y: [0, -yRange, 0],
        },
        transition: {
            opacity: { delay, duration: entranceDuration },
            scale: { delay, duration: entranceDuration },
            default: {
                repeat: Infinity,
                duration: randomDuration,
                ease: "easeInOut",
                delay: randomDelay,
            },
        },
    };
}

// ============================================================================
// useVisibility - IntersectionObserver-based visibility detection
// ============================================================================

export interface UseVisibilityOptions {
    /** IntersectionObserver threshold (default: 0.1 - 10% visible) */
    threshold?: number;
    /** Root margin for IntersectionObserver (default: "0px") */
    rootMargin?: string;
}

/**
 * Hook to detect if an element is visible in the viewport using IntersectionObserver.
 * Also detects tab visibility using the Page Visibility API.
 *
 * @returns [ref, isVisible] - A ref to attach to the element and a boolean indicating visibility
 *
 * @example
 * ```tsx
 * const [ref, isVisible] = useVisibility();
 *
 * return (
 *   <div ref={ref}>
 *     {isVisible ? "I'm visible!" : "I'm hidden!"}
 *   </div>
 * );
 * ```
 */
export function useVisibility<T extends HTMLElement = HTMLDivElement>(
    options: UseVisibilityOptions = {}
): [React.RefObject<T | null>, boolean] {
    const { threshold = 0.1, rootMargin = "0px" } = options;

    const ref = useRef<T>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);
    // Initialize tab visibility state based on current document state (SSR-safe)
    const [isTabVisible, setIsTabVisible] = useState(() => {
        if (typeof document === "undefined") return true;
        return document.visibilityState === "visible";
    });

    // Track tab visibility using Page Visibility API
    useEffect(() => {
        if (typeof document === "undefined") return;

        const handleVisibilityChange = () => {
            setIsTabVisible(document.visibilityState === "visible");
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    // Track element visibility using IntersectionObserver
    useEffect(() => {
        if (typeof window === "undefined" || !ref.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry.isIntersecting);
            },
            { threshold, rootMargin }
        );

        observer.observe(ref.current);

        return () => {
            observer.disconnect();
        };
    }, [threshold, rootMargin]);

    // Element is only considered visible if both in viewport AND tab is visible
    const isVisible = isIntersecting && isTabVisible;

    return [ref, isVisible];
}

// ============================================================================
// useMeshGradient - Ambient rotating/scaling gradient animation config
// ============================================================================

export interface UseMeshGradientOptions {
    /** Rotation direction: 1 for clockwise, -1 for counter-clockwise (default: 1) */
    rotationDirection?: 1 | -1;
    /** Duration of full rotation in seconds (default: 30) */
    rotateDuration?: number;
    /** Scale keyframes array (default: [1, 1.2, 1]) */
    scaleKeyframes?: number[];
    /** If true, disables rotation/scale animation for reduced motion preference (default: false) */
    reducedMotion?: boolean;
    /** If true, animation is paused (for visibility-based lazy loading) (default: false) */
    isPaused?: boolean;
}

export interface MeshGradientAnimation {
    /** Animate state */
    animate: {
        rotate: number;
        scale: number[];
    };
    /** Transition configuration */
    transition: {
        duration: number;
        repeat: number;
        ease: Easing;
    };
}

/**
 * Generates animation props for ambient rotating/pulsing mesh gradient backgrounds.
 * Commonly used for large blurred gradient orbs that create depth and atmosphere.
 *
 * Supports lazy loading via the `isPaused` option - when true, animations are paused
 * to reduce CPU/GPU usage when the element is not visible.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const gradientAnimation = useMeshGradient({ rotationDirection: 1, rotateDuration: 30 });
 *
 * // With visibility-based lazy loading
 * const [ref, isVisible] = useVisibility();
 * const gradientAnimation = useMeshGradient({ isPaused: !isVisible });
 *
 * return (
 *   <motion.div
 *     ref={ref}
 *     {...gradientAnimation}
 *     className="absolute w-[100vw] h-[100vw] rounded-full blur-[120px] bg-gradient-to-br from-indigo-200/30 to-purple-200/30"
 *   />
 * );
 * ```
 */
export function useMeshGradient(options: UseMeshGradientOptions = {}): MeshGradientAnimation {
    const {
        rotationDirection = 1,
        rotateDuration = 30,
        scaleKeyframes = [1, 1.2, 1],
        reducedMotion = false,
        isPaused = false,
    } = options;

    // If reduced motion is preferred, return static values (no rotation/scaling)
    if (reducedMotion) {
        return {
            animate: {
                rotate: 0,
                scale: [1],
            },
            transition: {
                duration: 0,
                repeat: 0,
                ease: "linear",
            },
        };
    }

    // If paused, return static values but keep structure for smooth resume
    if (isPaused) {
        return {
            animate: {
                rotate: 0,
                scale: [1],
            },
            transition: {
                duration: 0,
                repeat: 0,
                ease: "linear",
            },
        };
    }

    return {
        animate: {
            rotate: 360 * rotationDirection,
            scale: scaleKeyframes,
        },
        transition: {
            duration: rotateDuration,
            repeat: Infinity,
            ease: "linear",
        },
    };
}

// ============================================================================
// Convenience Components - Declarative Motion Atoms
// ============================================================================

export { use3DParallax as default };
