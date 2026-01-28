/**
 * Theme Colors Module
 *
 * Centralized color definitions for domains and status styling.
 * Provides theme-aware accessors for consistent theming across the application.
 */

import type { NodeStatus } from "@/app/features/knowledge-map/lib/types";

// ============================================================================
// TYPES
// ============================================================================

export interface DomainColorConfig {
    base: string;
    light: string;
    dark: string;
    darkBg: string;
}

export interface StatusStyleConfig {
    fill: string;
    bg: string;
    darkBg: string;
}

export type DomainColorKey =
    | "frontend"
    | "backend"
    | "fullstack"
    | "databases"
    | "mobile"
    | "games";

export type ThemeMode = "light" | "dark";

// ============================================================================
// DOMAIN COLORS
// ============================================================================

/**
 * Domain colors with light and dark theme backgrounds
 */
export const DOMAIN_COLORS: Record<DomainColorKey, DomainColorConfig> = {
    frontend: { base: "#6366f1", light: "#eef2ff", dark: "#4338ca", darkBg: "#312e81" },
    backend: { base: "#10b981", light: "#ecfdf5", dark: "#047857", darkBg: "#064e3b" },
    fullstack: { base: "#a855f7", light: "#faf5ff", dark: "#7c3aed", darkBg: "#4c1d95" },
    databases: { base: "#06b6d4", light: "#ecfeff", dark: "#0891b2", darkBg: "#164e63" },
    mobile: { base: "#ec4899", light: "#fdf2f8", dark: "#be185d", darkBg: "#831843" },
    games: { base: "#f97316", light: "#fff7ed", dark: "#c2410c", darkBg: "#7c2d12" },
};

// ============================================================================
// STATUS STYLES
// ============================================================================

/**
 * Status styles with theme-aware backgrounds
 * Light theme uses light backgrounds, dark theme uses darker tinted backgrounds
 */
export const STATUS_STYLES: Record<NodeStatus, StatusStyleConfig> = {
    completed: { fill: "#10b981", bg: "#d1fae5", darkBg: "#064e3b" },
    in_progress: { fill: "#6366f1", bg: "#e0e7ff", darkBg: "#312e81" },
    available: { fill: "#64748b", bg: "#f1f5f9", darkBg: "#1e293b" },
    locked: { fill: "#94a3b8", bg: "#e2e8f0", darkBg: "#0f172a" },
};

// ============================================================================
// THEME-AWARE ACCESSORS
// ============================================================================

/**
 * Get domain colors with theme-aware background
 * @param domain - Domain identifier
 * @param theme - Current theme mode ('light' or 'dark')
 * @returns Domain color configuration or default colors if domain not found
 */
export function getDomainColors(
    domain: string,
    theme: ThemeMode
): { base: string; bg: string } {
    const colors = DOMAIN_COLORS[domain as DomainColorKey];
    if (!colors) {
        return {
            base: "#64748b",
            bg: theme === "dark" ? "#1e293b" : "#f1f5f9",
        };
    }
    return {
        base: colors.base,
        bg: theme === "dark" ? colors.darkBg : colors.light,
    };
}

/**
 * Get status colors with theme-aware background
 * @param status - Node status
 * @param theme - Current theme mode ('light' or 'dark')
 * @returns Status color configuration
 */
export function getStatusColors(
    status: NodeStatus,
    theme: ThemeMode
): { fill: string; bg: string } {
    const style = STATUS_STYLES[status];
    return {
        fill: style.fill,
        bg: theme === "dark" ? style.darkBg : style.bg,
    };
}

/**
 * Get theme-aware background color for a status
 * @deprecated Use getStatusColors instead for full color access
 */
export function getStatusBg(status: NodeStatus, isDark: boolean): string {
    const style = STATUS_STYLES[status];
    return isDark ? style.darkBg : style.bg;
}

/**
 * Get theme-aware background color for a domain
 * @deprecated Use getDomainColors instead for full color access
 */
export function getDomainBg(domainId: string, isDark: boolean): string {
    const colors = DOMAIN_COLORS[domainId as DomainColorKey];
    if (!colors) return isDark ? "#1e293b" : "#f1f5f9";
    return isDark ? colors.darkBg : colors.light;
}
