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
