/**
 * Animated Counter Hook
 *
 * Smoothly animates numbers from 0 to target value with easing.
 * Extracted from HeroSection for reuse across all pages.
 *
 * @example
 * const { count, isAnimating } = useAnimatedCounter({
 *   target: 1234,
 *   duration: 2000,
 *   increment: 10,
 * });
 */

import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { textGradientStat } from "./animations";

export interface UseAnimatedCounterOptions {
    /** Target number to animate to */
    target: number;
    /** Animation duration in milliseconds (default: 2000) */
    duration?: number;
    /** Value increment step for smoother animation (default: 1) */
    increment?: number;
    /** Start animation on mount (default: true) */
    startOnMount?: boolean;
    /** Delay before starting animation in ms (default: 0) */
    delay?: number;
}

export interface UseAnimatedCounterReturn {
    /** Current animated count value */
    count: number;
    /** Whether animation is currently running */
    isAnimating: boolean;
    /** Restart the animation */
    restart: () => void;
    /** Stop the animation at current value */
    stop: () => void;
}

/**
 * Hook for animating numbers with smooth easing
 */
export function useAnimatedCounter({
    target,
    duration = 2000,
    increment = 1,
    startOnMount = true,
    delay = 0,
}: UseAnimatedCounterOptions): UseAnimatedCounterReturn {
    const [count, setCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasStarted = useRef(false);

    const stopAnimation = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        setIsAnimating(false);
    }, []);

    const startAnimation = useCallback(() => {
        if (target === 0) {
            setCount(0);
            return;
        }

        // Stop any existing animation
        stopAnimation();

        const runAnimation = () => {
            setIsAnimating(true);
            startTimeRef.current = Date.now();
            const startValue = 0;

            const animate = () => {
                const elapsed = Date.now() - startTimeRef.current;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic for smooth deceleration
                const eased = 1 - Math.pow(1 - progress, 3);

                // Calculate current value, snapping to increment steps
                const currentValue =
                    Math.floor((startValue + (target - startValue) * eased) / increment) *
                    increment;
                setCount(Math.min(currentValue, target));

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    setCount(target);
                    setIsAnimating(false);
                    animationRef.current = null;
                }
            };

            animationRef.current = requestAnimationFrame(animate);
        };

        if (delay > 0) {
            setTimeout(runAnimation, delay);
        } else {
            runAnimation();
        }
    }, [target, duration, increment, delay, stopAnimation]);

    // Auto-start on mount
    useEffect(() => {
        if (startOnMount && !hasStarted.current && target > 0) {
            hasStarted.current = true;
            startAnimation();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [startOnMount, target, startAnimation]);

    // Update if target changes after initial mount
    useEffect(() => {
        if (hasStarted.current && target !== count && !isAnimating) {
            startAnimation();
        }
    }, [target, count, isAnimating, startAnimation]);

    const restart = useCallback(() => {
        setCount(0);
        hasStarted.current = true;
        startAnimation();
    }, [startAnimation]);

    return {
        count,
        isAnimating,
        restart,
        stop: stopAnimation,
    };
}

// ============================================================================
// ANIMATED STAT DISPLAY COMPONENT
// ============================================================================

export interface AnimatedStatProps {
    /** Target value to animate to */
    value: number;
    /** Label text below the number */
    label: string;
    /** Suffix to append (e.g., "+", "%") */
    suffix?: string;
    /** Prefix to prepend (e.g., "$") */
    prefix?: string;
    /** Value increment step */
    increment?: number;
    /** Whether data is still loading */
    isLoading?: boolean;
    /** Animation duration in ms */
    duration?: number;
    /** Animation delay in ms */
    delay?: number;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Animated stat display with counter and label
 */
export function AnimatedStat({
    value,
    label,
    suffix = "",
    prefix = "",
    increment = 1,
    isLoading = false,
    duration = 2500,
    delay = 0,
    className = "",
}: AnimatedStatProps) {
    const { count } = useAnimatedCounter({
        target: value,
        duration,
        increment,
        startOnMount: !isLoading && value > 0,
        delay,
    });

    const displayValue = isLoading
        ? "..."
        : value > 0
          ? `${prefix}${count.toLocaleString()}${suffix}`
          : `${prefix}0${suffix}`;

    return (
        <div className={`text-center ${className}`}>
            <div className={`text-2xl font-bold ${textGradientStat}`}>{displayValue}</div>
            <div className="text-sm text-[var(--forge-text-muted)]">{label}</div>
        </div>
    );
}
