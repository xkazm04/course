"use client";

/**
 * ProgressRing Component
 *
 * Circular progress indicator with gradient stroke and glow effects.
 * Designed to show path completion potential with animated progress on mount.
 */

import React from "react";
import { motion } from "framer-motion";

interface ProgressRingProps {
    /** Progress percentage (0-100) */
    progress: number;
    /** Size of the ring in pixels */
    size?: number;
    /** Stroke width */
    strokeWidth?: number;
    /** Center content */
    children?: React.ReactNode;
    /** Additional className */
    className?: string;
}

export function ProgressRing({
    progress,
    size = 100,
    strokeWidth = 8,
    children,
    className,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const clampedProgress = Math.min(100, Math.max(0, progress));
    const offset = circumference - (clampedProgress / 100) * circumference;

    // Generate unique IDs for SVG elements to prevent conflicts
    const gradientId = React.useId();
    const glowId = React.useId();

    return (
        <div
            className={className}
            style={{ width: size, height: size }}
            data-testid="progress-ring"
        >
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                <defs>
                    {/* Gradient for the progress stroke - forge ember theme */}
                    <linearGradient
                        id={gradientId}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="var(--ember-bright, #DC5A1A)" />
                        <stop offset="50%" stopColor="var(--ember, #C2410C)" />
                        <stop offset="100%" stopColor="var(--molten, #F59E5E)" />
                    </linearGradient>

                    {/* Glow effect filter */}
                    <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background track circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    className="stroke-[var(--forge-border-subtle)]"
                    opacity={0.5}
                />

                {/* Subtle secondary glow track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth + 4}
                    stroke="var(--ember)"
                    opacity={0.05}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />

                {/* Main progress circle with gradient */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    stroke={`url(#${gradientId})`}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{
                        duration: 1.2,
                        ease: [0.4, 0, 0.2, 1],
                        delay: 0.2,
                    }}
                    filter={`url(#${glowId})`}
                />
            </svg>

            {/* Center content slot */}
            {children && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {children}
                </div>
            )}
        </div>
    );
}
