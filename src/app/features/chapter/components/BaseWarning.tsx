"use client";

/**
 * BaseWarning Component
 *
 * A composable warning component that provides the structural foundation for
 * all warning variants (prerequisite, emergent, traversability).
 *
 * Supports three display variants:
 * - banner: Full-width banner with icon, title, description, and actions
 * - inline: Compact single-line display
 * - card: Elevated card with richer content
 *
 * Each specific warning type (PrerequisiteWarning, EmergentPrerequisiteWarning,
 * TraversabilityWarning) wraps this component with preset styling and content.
 */

import React from "react";
import { motion, type Variants } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type WarningVariant = "banner" | "inline" | "card";

export type WarningType =
    | "prerequisite"
    | "emergent"
    | "traversability"
    | "info"
    | "success";

export interface BaseWarningProps {
    /** The type/theme of warning - determines colors */
    type?: WarningType;

    /** Display variant */
    variant?: WarningVariant;

    /** Icon to display */
    icon?: LucideIcon;

    /** Title text */
    title?: string;

    /** Subtitle/secondary text (shown below title in banner/card) */
    subtitle?: string;

    /** Main description text */
    description?: string;

    /** Custom content rendered after description */
    children?: React.ReactNode;

    /** Footer content (typically action buttons) */
    footer?: React.ReactNode;

    /** Whether dismiss button is shown */
    dismissible?: boolean;

    /** Callback when dismissed */
    onDismiss?: () => void;

    /** Additional CSS classes */
    className?: string;

    /** Test ID for the component */
    testId?: string;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const bannerAnimation: Variants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

const inlineAnimation: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

const cardAnimation: Variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
};

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

interface WarningTheme {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    titleColor: string;
}

const THEMES: Record<WarningType, WarningTheme> = {
    prerequisite: {
        bg: "bg-[var(--forge-warning)]/10",
        border: "border-[var(--forge-warning)]/30",
        iconBg: "bg-[var(--forge-warning)]/10",
        iconColor: "text-[var(--forge-warning)]",
        titleColor: "text-[var(--forge-warning)]",
    },
    emergent: {
        bg: "bg-gradient-to-r from-[var(--forge-primary)]/10 to-[var(--forge-info)]/10",
        border: "border-[var(--forge-primary)]/30",
        iconBg: "bg-[var(--forge-primary)]/20",
        iconColor: "text-[var(--forge-primary)]",
        titleColor: "text-[var(--forge-primary)]",
    },
    traversability: {
        bg: "bg-[var(--forge-warning)]/10",
        border: "border-[var(--forge-warning)]/30",
        iconBg: "bg-[var(--forge-warning)]/10",
        iconColor: "text-[var(--forge-warning)]",
        titleColor: "text-[var(--forge-warning)]",
    },
    info: {
        bg: "bg-[var(--forge-info)]/10",
        border: "border-[var(--forge-info)]/30",
        iconBg: "bg-[var(--forge-info)]/10",
        iconColor: "text-[var(--forge-info)]",
        titleColor: "text-[var(--forge-info)]",
    },
    success: {
        bg: "bg-[var(--forge-success)]/10",
        border: "border-[var(--forge-success)]/30",
        iconBg: "bg-[var(--forge-success)]/10",
        iconColor: "text-[var(--forge-success)]",
        titleColor: "text-[var(--forge-success)]",
    },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function BaseWarning({
    type = "prerequisite",
    variant = "banner",
    icon: Icon,
    title,
    subtitle,
    description,
    children,
    footer,
    dismissible = false,
    onDismiss,
    className,
    testId,
}: BaseWarningProps) {
    const theme = THEMES[type];
    const animation =
        variant === "inline"
            ? inlineAnimation
            : variant === "card"
            ? cardAnimation
            : bannerAnimation;

    // ========================================================================
    // INLINE VARIANT
    // ========================================================================
    if (variant === "inline") {
        return (
            <motion.div
                variants={animation}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                    "flex items-center gap-2 text-sm",
                    className
                )}
                data-testid={testId || `${type}-warning-inline`}
            >
                {Icon && <Icon className={cn("h-4 w-4", theme.iconColor)} />}
                <span className="text-[var(--forge-text-secondary)]">
                    {title}
                    {description && `: ${description}`}
                </span>
                {children}
            </motion.div>
        );
    }

    // ========================================================================
    // CARD VARIANT
    // ========================================================================
    if (variant === "card") {
        return (
            <motion.div
                variants={animation}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                    "bg-[var(--forge-bg-workshop)] border rounded-xl p-6 shadow-lg",
                    theme.border,
                    className
                )}
                data-testid={testId || `${type}-warning-card`}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    {Icon && (
                        <div className={cn("p-2 rounded-lg", theme.iconBg)}>
                            <Icon className={cn("h-6 w-6", theme.iconColor)} />
                        </div>
                    )}
                    <div className="flex-1">
                        {title && (
                            <h3 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-xs text-[var(--forge-text-muted)]">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {dismissible && onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="flex-shrink-0 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors"
                            data-testid="dismiss-warning-btn"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Description */}
                {description && (
                    <p className="text-sm text-[var(--forge-text-secondary)] leading-relaxed mb-4">
                        {description}
                    </p>
                )}

                {/* Custom Content */}
                {children}

                {/* Footer */}
                {footer && (
                    <div className="mt-4 pt-4 border-t border-[var(--forge-border-subtle)]">
                        {footer}
                    </div>
                )}
            </motion.div>
        );
    }

    // ========================================================================
    // BANNER VARIANT (default)
    // ========================================================================
    return (
        <motion.div
            variants={animation}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
                "border rounded-lg p-4",
                theme.bg,
                theme.border,
                className
            )}
            data-testid={testId || `${type}-warning-banner`}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                {Icon && (
                    <div className="flex-shrink-0">
                        <Icon className={cn("h-5 w-5", theme.iconColor)} />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title & Subtitle */}
                    {title && (
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className={cn("text-lg font-semibold", theme.titleColor)}>
                                {title}
                            </h3>
                            {subtitle && (
                                <span className="text-xs text-[var(--forge-text-muted)]">
                                    {subtitle}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Description */}
                    {description && (
                        <p className="text-sm text-[var(--forge-text-secondary)] leading-relaxed">
                            {description}
                        </p>
                    )}

                    {/* Custom Content */}
                    {children}

                    {/* Footer */}
                    {footer && <div className="mt-3">{footer}</div>}
                </div>

                {/* Dismiss Button */}
                {dismissible && onDismiss && (
                    <button
                        onClick={onDismiss}
                        className={cn(
                            "flex-shrink-0 transition-colors",
                            theme.iconColor,
                            `hover:${theme.iconColor}/80`
                        )}
                        data-testid="dismiss-warning-btn"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

export interface WarningItemProps {
    /** Icon for the item */
    icon?: LucideIcon;

    /** Main text */
    text: string;

    /** Secondary text */
    secondary?: string;

    /** Whether item is clickable */
    onClick?: () => void;

    /** Type for color theming */
    type?: WarningType;

    /** Additional CSS classes */
    className?: string;

    /** Test ID */
    testId?: string;
}

/**
 * WarningItem - A list item within a warning component
 * Used for displaying prerequisites, factors, or other actionable items
 */
export function WarningItem({
    icon: Icon,
    text,
    secondary,
    onClick,
    type = "prerequisite",
    className,
    testId,
}: WarningItemProps) {
    const theme = THEMES[type];
    const Component = onClick ? "button" : "div";

    return (
        <Component
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 p-3 bg-[var(--forge-bg-elevated)] rounded-lg transition-colors text-left",
                onClick && `hover:${theme.bg} cursor-pointer group`,
                className
            )}
            data-testid={testId}
        >
            {Icon && (
                <Icon
                    className={cn(
                        "h-5 w-5 flex-shrink-0 text-[var(--forge-text-muted)]",
                        onClick && `group-hover:${theme.iconColor}`
                    )}
                />
            )}
            <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-[var(--forge-text-secondary)] block truncate">
                    {text}
                </span>
                {secondary && (
                    <span className="text-xs text-[var(--forge-text-muted)]">
                        {secondary}
                    </span>
                )}
            </div>
            {onClick && (
                <span className={cn(
                    "h-4 w-4 text-[var(--forge-text-muted)] transition-transform",
                    `group-hover:${theme.iconColor} group-hover:translate-x-1`
                )}>
                    →
                </span>
            )}
        </Component>
    );
}

/**
 * WarningSkipButton - A standardized skip/continue button for warnings
 */
export interface WarningSkipButtonProps {
    onClick?: () => void;
    label?: string;
    type?: WarningType;
    testId?: string;
}

export function WarningSkipButton({
    onClick,
    label = "Continue anyway (not recommended)",
    type = "prerequisite",
    testId,
}: WarningSkipButtonProps) {
    const theme = THEMES[type];

    return (
        <button
            onClick={onClick}
            className={cn(
                "text-xs text-[var(--forge-text-muted)] hover:underline font-medium transition-colors",
                `hover:${theme.titleColor}`
            )}
            data-testid={testId || "skip-warning-btn"}
        >
            {label}
        </button>
    );
}

export default BaseWarning;
