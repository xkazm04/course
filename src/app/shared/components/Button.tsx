"use client";

import React from "react";
import { cn } from "@/app/shared/lib/utils";

/**
 * Button size variants with consistent padding and rounded corners.
 * All sizes use rounded-xl for visual consistency.
 */
export type ButtonSize = "sm" | "md" | "lg" | "full";

/**
 * Button visual variants for different contexts.
 *
 * - primary: Gradient background (indigo to purple) for main CTAs
 * - secondary: Solid background for important actions
 * - tertiary: Outline/ghost style for less prominent actions
 * - ghost: Minimal style for inline actions
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost";

/**
 * Button component props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Size variant: sm, md (default), lg, or full */
  size?: ButtonSize;
  /** Visual variant: primary (gradient), secondary (solid), tertiary (outline), or ghost */
  variant?: ButtonVariant;
  /** Additional class names */
  className?: string;
  /** Whether button is in a dark context */
  dark?: boolean;
  /** Children elements */
  children: React.ReactNode;
}

/**
 * Size class mappings - consistent rounded-xl across all sizes
 * sm: px-4 py-2 (compact actions, inline buttons)
 * md: px-6 py-3 (standard buttons)
 * lg: px-8 py-4 (hero CTAs, landing page buttons)
 * full: w-full py-4 (full-width CTAs)
 */
const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-base",
  full: "w-full py-4 text-base",
};

/**
 * Unified variant class mappings for consistent button hierarchy.
 *
 * Primary: Gradient background (indigo-purple) with shadow
 * Secondary: Solid background with CSS variable support
 * Tertiary: Outline style for less prominent actions
 * Ghost: Minimal style for inline actions
 */
const variantClasses: Record<ButtonVariant, { light: string; dark: string }> = {
  primary: {
    light: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:opacity-95",
    dark: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/30 hover:shadow-xl hover:shadow-indigo-900/40 hover:opacity-95",
  },
  secondary: {
    light: "bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800 hover:shadow-xl",
    dark: "bg-white text-slate-900 shadow-lg shadow-slate-900/30 hover:bg-slate-100 hover:shadow-xl",
  },
  tertiary: {
    light: "bg-transparent border-2 border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50",
    dark: "bg-transparent border-2 border-slate-600 text-slate-200 hover:border-indigo-400 hover:text-indigo-400 hover:bg-indigo-900/20",
  },
  ghost: {
    light: "text-slate-700 hover:bg-slate-100",
    dark: "text-white/80 hover:bg-white/10",
  },
};

/**
 * Reusable Button component with consistent sizing and styling.
 *
 * Use this component for all landing page CTAs and interactive buttons
 * to maintain visual consistency across the application.
 *
 * Button Hierarchy:
 * - primary: Gradient (indigo-purple) for main CTAs and generate actions
 * - secondary: Solid (dark bg) for important secondary actions
 * - tertiary: Outline for less prominent actions
 * - ghost: Minimal for inline/text actions
 *
 * @example
 * ```tsx
 * // Full-width primary CTA (gradient)
 * <Button size="full" variant="primary">
 *   <Sparkles size={16} /> Generate My Path
 * </Button>
 *
 * // Secondary action (solid)
 * <Button size="lg" variant="secondary" dark>
 *   <Zap size={16} /> Start Learning Now
 * </Button>
 *
 * // Tertiary action (outline)
 * <Button size="md" variant="tertiary">
 *   Learn More
 * </Button>
 *
 * // Ghost action (minimal)
 * <Button size="sm" variant="ghost">
 *   Cancel
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      size = "md",
      variant = "primary",
      dark = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const variantClass = dark
      ? variantClasses[variant].dark
      : variantClasses[variant].light;

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all",
          // Size-specific styles
          sizeClasses[size],
          // Variant-specific styles
          variantClass,
          // Hover scale effect for primary and secondary variants
          (variant === "primary" || variant === "secondary") && "hover:scale-[1.02]",
          // Disabled states
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          // Custom overrides
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
