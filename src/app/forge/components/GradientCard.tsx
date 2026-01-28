"use client";

/**
 * Gradient Card Component
 *
 * Domain-card style component with rich visual effects:
 * - Configurable gradient colors
 * - Pattern overlay option
 * - Hover scale/shadow effects
 * - Status indicator badge
 * - Optional icon with backdrop
 * - Progress indicator
 *
 * Based on gold standard: DomainCards.tsx
 */

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { forgeEasing, staggerDelay, cardHover, buttonTap } from "../lib/animations";

// ============================================================================
// GRADIENT PRESETS
// ============================================================================

export const gradientPresets = {
    ember: "from-[var(--ember)] via-[var(--ember-glow)] to-[var(--ember)]",
    gold: "from-[var(--gold)] via-amber-500 to-yellow-500",
    success: "from-[var(--forge-success)] via-emerald-400 to-teal-500",
    info: "from-[var(--forge-info)] via-cyan-400 to-sky-500",
    error: "from-[var(--forge-error)] via-red-400 to-pink-500",
    purple: "from-violet-500 via-purple-500 to-fuchsia-500",
    frontend: "from-[var(--ember)] via-[var(--ember-glow)] to-[var(--ember)]",
    fullstack: "from-[var(--ember-glow)] via-[var(--ember-glow)] to-[var(--ember)]",
    mobile: "from-[var(--forge-error)] via-[var(--forge-error)] to-[var(--ember-glow)]",
    games: "from-orange-500 via-amber-500 to-yellow-500",
    backend: "from-[var(--forge-success)] via-[var(--forge-success)] to-[var(--forge-info)]",
    databases: "from-[var(--forge-info)] via-[var(--forge-info)] to-[var(--forge-info)]",
} as const;

export type GradientPreset = keyof typeof gradientPresets;

export const patternPresets = {
    topLeft: "radial-gradient(circle at 10% 10%, rgba(255,255,255,0.15) 0%, transparent 45%)",
    topRight: "radial-gradient(circle at 90% 10%, rgba(255,255,255,0.12) 0%, transparent 50%)",
    bottomLeft: "radial-gradient(circle at 10% 90%, rgba(255,255,255,0.1) 0%, transparent 50%)",
    bottomRight: "radial-gradient(circle at 90% 90%, rgba(255,255,255,0.1) 0%, transparent 50%)",
    center: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
    topCenter: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 45%)",
    bottomCenter: "radial-gradient(circle at 50% 100%, rgba(255,255,255,0.1) 0%, transparent 40%)",
} as const;

export type PatternPreset = keyof typeof patternPresets;

// ============================================================================
// TYPES
// ============================================================================

export interface GradientCardProps {
    /** Card title */
    title: string;
    /** Subtitle or description */
    subtitle?: string;
    /** Icon to display */
    icon?: LucideIcon;
    /** Gradient preset or custom Tailwind gradient classes */
    gradient?: GradientPreset | string;
    /** Pattern overlay preset or custom CSS gradient */
    pattern?: PatternPreset | string;
    /** Whether to show hex pattern overlay */
    showHexPattern?: boolean;
    /** Progress value (0-100) */
    progress?: number;
    /** Progress label (e.g., "50% Complete") */
    progressLabel?: string;
    /** Status badge text */
    badge?: string;
    /** Badge variant */
    badgeVariant?: "default" | "success" | "warning" | "error";
    /** Click handler */
    onClick?: () => void;
    /** Link href (alternative to onClick) */
    href?: string;
    /** Animation delay index for staggered animations */
    index?: number;
    /** Additional CSS classes */
    className?: string;
    /** Unique ID for pattern SVG */
    id?: string;
    /** Card size variant */
    size?: "sm" | "md" | "lg";
    /** Disable hover effects */
    disableHover?: boolean;
    /** Children content (renders below subtitle) */
    children?: React.ReactNode;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function HexPatternOverlay({ id }: { id: string }) {
    return (
        <svg
            className="absolute inset-0 w-full h-full opacity-[0.07]"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <pattern
                    id={`hex-pattern-${id}`}
                    width="56"
                    height="100"
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d="M28 66L0 50V16L28 0L56 16V50L28 66ZM28 100L0 84V50L28 34L56 50V84L28 100Z"
                        fill="none"
                        stroke="white"
                        strokeWidth="1"
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#hex-pattern-${id})`} />
        </svg>
    );
}

function CardIcon({ icon: Icon, size }: { icon: LucideIcon; size: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        sm: "p-3 w-8 h-8",
        md: "p-4 w-10 h-10",
        lg: "p-5 w-12 h-12",
    };

    return (
        <motion.div
            className={cn(
                "rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20",
                "group-hover:bg-white/25 transition-colors duration-300",
                size === "sm" ? "p-3" : size === "md" ? "p-4" : "p-5"
            )}
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
        >
            <Icon
                className={cn(
                    "text-white drop-shadow-lg",
                    sizeClasses[size]
                )}
                strokeWidth={1.5}
            />
        </motion.div>
    );
}

function ProgressBar({ progress, label }: { progress: number; label?: string }) {
    return (
        <div className="flex items-center gap-2 text-white/60 text-sm">
            <div className="w-16 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    transition={{ duration: 0.8, ease: forgeEasing }}
                    className="h-full bg-white/60 rounded-full"
                />
            </div>
            {label && <span>{label}</span>}
        </div>
    );
}

function StatusBadge({
    text,
    variant = "default",
}: {
    text: string;
    variant?: "default" | "success" | "warning" | "error";
}) {
    const variantClasses = {
        default: "bg-white/20 text-white",
        success: "bg-emerald-500/30 text-emerald-200",
        warning: "bg-amber-500/30 text-amber-200",
        error: "bg-red-500/30 text-red-200",
    };

    return (
        <span
            className={cn(
                "absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm",
                variantClasses[variant]
            )}
        >
            {text}
        </span>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GradientCard({
    title,
    subtitle,
    icon,
    gradient = "ember",
    pattern = "topRight",
    showHexPattern = false,
    progress,
    progressLabel,
    badge,
    badgeVariant = "default",
    onClick,
    href,
    index = 0,
    className = "",
    id,
    size = "md",
    disableHover = false,
    children,
}: GradientCardProps) {
    // Resolve gradient classes
    const gradientClasses =
        gradient in gradientPresets
            ? gradientPresets[gradient as GradientPreset]
            : gradient;

    // Resolve pattern style
    const patternStyle =
        pattern in patternPresets
            ? patternPresets[pattern as PatternPreset]
            : pattern;

    // Generate unique ID for patterns
    const cardId = id || `card-${index}-${title.replace(/\s+/g, "-").toLowerCase()}`;

    // Size-based padding
    const sizeClasses = {
        sm: "p-4 min-h-[140px]",
        md: "p-6 min-h-[200px]",
        lg: "p-8 min-h-[280px]",
    };

    // Title size
    const titleClasses = {
        sm: "text-lg",
        md: "text-2xl",
        lg: "text-3xl",
    };

    const content = (
        <>
            {/* Gradient base */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-90",
                    gradientClasses
                )}
            />

            {/* Pattern overlay */}
            <div
                className="absolute inset-0 opacity-30"
                style={{ background: patternStyle }}
            />

            {/* Decorative shapes */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-black/10 blur-3xl" />

            {/* Hex pattern (optional) */}
            {showHexPattern && <HexPatternOverlay id={cardId} />}

            {/* Status badge */}
            {badge && <StatusBadge text={badge} variant={badgeVariant} />}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-3 h-full">
                {icon && <CardIcon icon={icon} size={size} />}

                <h3
                    className={cn(
                        "font-bold text-white tracking-tight drop-shadow-md text-center",
                        titleClasses[size]
                    )}
                >
                    {title}
                </h3>

                {subtitle && (
                    <p className="text-white/80 text-base font-medium text-center max-w-[90%]">
                        {subtitle}
                    </p>
                )}

                {children && <div className="mt-2">{children}</div>}

                {progress !== undefined && (
                    <div className="mt-4">
                        <ProgressBar progress={progress} label={progressLabel} />
                    </div>
                )}
            </div>

            {/* Hover shine effect */}
            {!disableHover && (
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100
                               bg-gradient-to-tr from-transparent via-white/10 to-transparent
                               -translate-x-full group-hover:translate-x-full
                               transition-all duration-1000 ease-out pointer-events-none"
                />
            )}
        </>
    );

    const baseClasses = cn(
        "relative overflow-hidden rounded-2xl",
        "flex flex-col items-center justify-center",
        "cursor-pointer group transition-shadow duration-300",
        !disableHover && "hover:shadow-2xl hover:shadow-black/20",
        sizeClasses[size],
        className
    );

    // Animation props
    const motionProps = {
        initial: { opacity: 0, scale: 0.9, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: {
            delay: staggerDelay(index),
            duration: 0.4,
            ease: forgeEasing,
        },
        whileHover: disableHover ? undefined : cardHover,
        whileTap: disableHover ? undefined : buttonTap,
    };

    // Render as link or button
    if (href) {
        return (
            <motion.a href={href} className={baseClasses} {...motionProps}>
                {content}
            </motion.a>
        );
    }

    return (
        <motion.button
            onClick={onClick}
            className={baseClasses}
            {...motionProps}
            disabled={!onClick && !href}
        >
            {content}
        </motion.button>
    );
}

// ============================================================================
// GRID LAYOUT HELPER
// ============================================================================

export interface GradientCardGridProps {
    children: React.ReactNode;
    columns?: 2 | 3 | 4 | 6;
    gap?: "sm" | "md" | "lg";
    className?: string;
}

/**
 * Grid layout for GradientCards with responsive columns
 */
export function GradientCardGrid({
    children,
    columns = 3,
    gap = "md",
    className = "",
}: GradientCardGridProps) {
    const columnClasses = {
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
    };

    const gapClasses = {
        sm: "gap-2",
        md: "gap-4",
        lg: "gap-6",
    };

    return (
        <div
            className={cn(
                "grid",
                columnClasses[columns],
                gapClasses[gap],
                className
            )}
        >
            {children}
        </div>
    );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

export interface CompactGradientCardProps {
    title: string;
    icon?: LucideIcon;
    gradient?: GradientPreset | string;
    onClick?: () => void;
    href?: string;
    index?: number;
    className?: string;
    active?: boolean;
}

/**
 * Compact gradient card for filter chips and small selections
 */
export function CompactGradientCard({
    title,
    icon: Icon,
    gradient = "ember",
    onClick,
    href,
    index = 0,
    className = "",
    active = false,
}: CompactGradientCardProps) {
    const gradientClasses =
        gradient in gradientPresets
            ? gradientPresets[gradient as GradientPreset]
            : gradient;

    const content = (
        <>
            {/* Gradient background (visible when active) */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity",
                    active && "opacity-100",
                    gradientClasses
                )}
            />

            {/* Default background */}
            <div
                className={cn(
                    "absolute inset-0 bg-[var(--forge-bg-elevated)]/80 transition-opacity",
                    active && "opacity-0"
                )}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-2">
                {Icon && (
                    <Icon
                        size={16}
                        className={cn(
                            "transition-colors",
                            active ? "text-white" : "text-[var(--forge-text-secondary)]"
                        )}
                    />
                )}
                <span
                    className={cn(
                        "font-medium transition-colors",
                        active ? "text-white" : "text-[var(--forge-text-primary)]"
                    )}
                >
                    {title}
                </span>
            </div>
        </>
    );

    const baseClasses = cn(
        "relative overflow-hidden rounded-lg px-4 py-2",
        "border transition-all duration-200",
        active
            ? "border-transparent shadow-lg"
            : "border-[var(--forge-border-subtle)] hover:border-[var(--ember)]/30",
        "cursor-pointer group",
        className
    );

    const motionProps = {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        transition: {
            delay: staggerDelay(index, 0.05),
            duration: 0.2,
        },
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
    };

    if (href) {
        return (
            <motion.a href={href} className={baseClasses} {...motionProps}>
                {content}
            </motion.a>
        );
    }

    return (
        <motion.button onClick={onClick} className={baseClasses} {...motionProps}>
            {content}
        </motion.button>
    );
}
