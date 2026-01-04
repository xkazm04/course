"use client";

/**
 * AnimatedCounter Component
 *
 * Animates a number counting up from 0 to the target value on mount.
 * Uses tabular-nums font variant for clean alignment during animation.
 */

import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
    /** Target value to count to */
    value: number;
    /** Duration of the animation in seconds */
    duration?: number;
    /** Delay before animation starts in seconds */
    delay?: number;
    /** Suffix to append (e.g., "h" for hours) */
    suffix?: string;
    /** Additional className for the number */
    className?: string;
}

export function AnimatedCounter({
    value,
    duration = 1,
    delay = 0.3,
    suffix,
    className,
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);

    const springValue = useSpring(0, {
        duration: duration * 1000,
        bounce: 0,
    });

    const rounded = useTransform(springValue, (latest) => Math.round(latest));

    useEffect(() => {
        const unsubscribe = rounded.on("change", (latest) => {
            setDisplayValue(latest);
        });

        // Delay the animation start
        const timeout = setTimeout(() => {
            springValue.set(value);
        }, delay * 1000);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, [value, springValue, rounded, delay]);

    return (
        <motion.span
            className={className}
            style={{ fontVariantNumeric: "tabular-nums" }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            data-testid="animated-counter"
        >
            {displayValue}
            {suffix && <span className="text-[var(--forge-text-muted)]">{suffix}</span>}
        </motion.span>
    );
}
