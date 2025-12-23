"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { TEXT_COLORS, type GlowColorKey } from "@/app/shared/lib/learningDomains";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useFloatLoop, useReducedMotion } from "@/app/shared/lib/motionPrimitives";
import { cn } from "@/app/shared/lib/utils";

/**
 * Theme configuration for FloatingBadge styling.
 * Used when integrating with ExtendedThemeScheme from variantMachine.
 */
export interface FloatingBadgeTheme {
    container: string;
    text: string;
    icon: string;
}

export interface FloatingBadgeProps {
    /** Icon component to display */
    icon: LucideIcon;
    /** Text label for the badge */
    text: string;
    /** CSS left position (e.g., "10%", "100px") */
    x: string;
    /** CSS top position (e.g., "20%", "50px") */
    y: string;
    /** Animation delay in seconds (default: 0) */
    delay?: number;
    /** Color variant for icon (used when theme is not provided) */
    color?: GlowColorKey;
    /** Theme object for custom styling (overrides default styles) */
    theme?: FloatingBadgeTheme;
    /** Override reduced motion detection (default: auto-detected) */
    reducedMotion?: boolean;
    /** Float animation X range in pixels (default: 10) */
    xRange?: number;
    /** Float animation Y range in pixels (default: 10) */
    yRange?: number;
}

// Map glow colors to text colors (glow colors are a subset)
const glowToTextColor: Record<GlowColorKey, string> = {
    indigo: TEXT_COLORS.indigo,
    emerald: TEXT_COLORS.emerald,
    orange: TEXT_COLORS.orange,
    cyan: TEXT_COLORS.cyan,
    purple: TEXT_COLORS.purple,
};

/**
 * Unified FloatingBadge component for decorative floating badges.
 *
 * Uses the useFloatLoop motion primitive for consistent floating animations
 * and supports both default styling and theme-injected styling for polymorphic components.
 *
 * @example Default usage (page.tsx style)
 * ```tsx
 * <FloatingBadge
 *   icon={Cpu}
 *   text="AI Powered"
 *   x="10%"
 *   y="20%"
 *   delay={0.2}
 * />
 * ```
 *
 * @example With theme (LandingPolymorphic style)
 * ```tsx
 * const theme = getExtendedTheme(mode);
 * <FloatingBadge
 *   icon={Cpu}
 *   text="AI Powered"
 *   x="10%"
 *   y="20%"
 *   delay={0.2}
 *   theme={theme.badge}
 * />
 * ```
 */
export const FloatingBadge = ({
    icon: Icon,
    text,
    x,
    y,
    delay = 0,
    color = "indigo",
    theme,
    reducedMotion: reducedMotionOverride,
    xRange = 10,
    yRange = 10,
}: FloatingBadgeProps) => {
    // Auto-detect reduced motion preference if not explicitly provided
    const prefersReducedMotion = useReducedMotion();
    const isReducedMotion = reducedMotionOverride ?? prefersReducedMotion;

    // Use centralized float loop animation
    const floatAnimation = useFloatLoop({
        delay,
        xRange,
        yRange,
        reducedMotion: isReducedMotion,
    });

    // Determine styling: use theme if provided, otherwise use default CSS variables
    const containerClass = theme?.container ?? "bg-[var(--surface-overlay)] border border-[var(--border-default)]";
    const textClass = theme?.text ?? "text-[var(--text-secondary)]";
    const iconClass = theme?.icon ?? glowToTextColor[color];

    return (
        <motion.div
            {...floatAnimation}
            className={cn(
                "absolute px-4 py-2 backdrop-blur-md rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold z-20 pointer-events-none",
                containerClass,
                textClass
            )}
            style={{ left: x, top: y }}
            data-testid={`floating-badge-${text.toLowerCase().replace(/\s+/g, '-')}`}
        >
            <Icon size={ICON_SIZES.sm} className={iconClass} />
            {text}
        </motion.div>
    );
};
