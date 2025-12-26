import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Button sizing scale for consistent padding across the application.
 * Uses CSS variables defined in globals.css for easy theming.
 *
 * Sizes:
 * - sm: Compact actions, inline buttons (px-3 py-1.5)
 * - md: Standard buttons, form actions (px-4 py-2)
 * - lg: Primary CTAs, hero buttons (px-6 py-3)
 */
export type ButtonSize = "sm" | "md" | "lg";

export const buttonSizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5",
    md: "px-4 py-2",
    lg: "px-6 py-3",
};

/**
 * Get button padding classes for consistent sizing.
 * @param size - The button size (sm, md, lg)
 * @returns Tailwind CSS classes for padding
 */
export function getButtonSize(size: ButtonSize = "md"): string {
    return buttonSizeClasses[size];
}

/**
 * Compose button classes with size and additional classes.
 * @param size - The button size
 * @param additionalClasses - Additional Tailwind classes
 * @returns Merged class string
 */
export function buttonClasses(size: ButtonSize, ...additionalClasses: ClassValue[]): string {
    return cn(buttonSizeClasses[size], ...additionalClasses);
}

/**
 * Unified elevation system for consistent shadow depths across the application.
 * Uses CSS variables defined in globals.css for theme synchronization.
 *
 * Elevation levels:
 * - flat: Surface content with minimal elevation (shadow-sm)
 * - elevated: Standard cards with moderate elevation (shadow-md)
 * - hoverable: Interactive cards with hover lift effect (shadow-md -> shadow-lg on hover)
 * - modal: Modal/overlay content with high elevation (shadow-lg)
 *
 * @example
 * ```tsx
 * <div className={cn("rounded-xl", elevation.flat)}>Surface content</div>
 * <div className={cn("rounded-xl", elevation.hoverable)}>Interactive card</div>
 * ```
 */
export type ElevationLevel = "flat" | "elevated" | "hoverable" | "modal";

export const elevation: Record<ElevationLevel, string> = {
    flat: "shadow-[var(--shadow-sm)]",
    elevated: "shadow-[var(--shadow-md)]",
    hoverable: "shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-shadow duration-300",
    modal: "shadow-[var(--shadow-lg)]",
};

/**
 * Get elevation classes for consistent card shadows.
 * @param level - The elevation level (flat, elevated, hoverable, modal)
 * @returns Tailwind CSS classes for shadow
 */
export function getElevation(level: ElevationLevel = "elevated"): string {
    return elevation[level];
}

/**
 * Compose card classes with elevation and additional classes.
 * Useful for building card-like components with consistent shadows.
 * @param level - The elevation level
 * @param additionalClasses - Additional Tailwind classes
 * @returns Merged class string
 */
export function cardClasses(level: ElevationLevel, ...additionalClasses: ClassValue[]): string {
    return cn(elevation[level], ...additionalClasses);
}
