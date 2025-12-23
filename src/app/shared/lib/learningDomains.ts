/**
 * Learning Domain System
 *
 * This module defines the domain ontology for the learning platform.
 * Instead of scattered colorMap objects, we now have a first-class
 * type system that carries color, icon, and semantic meaning together.
 */

import {
    Monitor, Layers, Server, Database, Gamepad2, Smartphone,
    LucideIcon
} from "lucide-react";

// Domain identifiers - the semantic meaning behind colors
export type LearningDomainId =
    | "frontend"
    | "fullstack"
    | "backend"
    | "databases"
    | "games"
    | "mobile";

// Color keys used throughout the system
export type DomainColorKey =
    | "indigo"
    | "purple"
    | "emerald"
    | "cyan"
    | "orange"
    | "pink";

// Extended color keys for general use (skills, etc.)
export type ExtendedColorKey =
    | DomainColorKey
    | "blue"
    | "amber"
    | "slate"
    | "red"
    | "green"
    | "yellow"
    | "sky"
    | "lime"
    | "violet";

// Glow color subset supported by PrismaticCard
export type GlowColorKey = "indigo" | "purple" | "emerald" | "cyan" | "orange";

// Complete domain definition
export interface LearningDomain {
    id: LearningDomainId;
    name: string;
    description: string;
    color: DomainColorKey;
    icon: LucideIcon;
    iconName: string;
}

// The domain registry - single source of truth
export const LEARNING_DOMAINS: Record<LearningDomainId, LearningDomain> = {
    frontend: {
        id: "frontend",
        name: "Frontend Development",
        description: "Build beautiful, responsive user interfaces",
        color: "indigo",
        icon: Monitor,
        iconName: "Monitor",
    },
    fullstack: {
        id: "fullstack",
        name: "Full Stack Development",
        description: "Master both frontend and backend technologies",
        color: "purple",
        icon: Layers,
        iconName: "Layers",
    },
    backend: {
        id: "backend",
        name: "Backend Development",
        description: "Build scalable server-side applications",
        color: "emerald",
        icon: Server,
        iconName: "Server",
    },
    databases: {
        id: "databases",
        name: "Database Engineering",
        description: "Design and optimize data storage solutions",
        color: "cyan",
        icon: Database,
        iconName: "Database",
    },
    games: {
        id: "games",
        name: "Game Development",
        description: "Create immersive gaming experiences",
        color: "orange",
        icon: Gamepad2,
        iconName: "Gamepad2",
    },
    mobile: {
        id: "mobile",
        name: "Mobile Development",
        description: "Build native and cross-platform mobile apps",
        color: "pink",
        icon: Smartphone,
        iconName: "Smartphone",
    },
};

// Color style utilities - centralized color mappings

/**
 * Gradient colors for backgrounds (from-X-500 to-X-600)
 */
export const GRADIENT_COLORS: Record<ExtendedColorKey, string> = {
    indigo: "from-indigo-500 to-indigo-600",
    purple: "from-purple-500 to-purple-600",
    emerald: "from-emerald-500 to-emerald-600",
    cyan: "from-cyan-500 to-cyan-600",
    orange: "from-orange-500 to-orange-600",
    pink: "from-pink-500 to-pink-600",
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-amber-600",
    slate: "from-slate-500 to-slate-600",
    red: "from-red-500 to-red-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    sky: "from-sky-500 to-sky-600",
    lime: "from-lime-500 to-lime-600",
    violet: "from-violet-500 to-violet-600",
};

/**
 * Solid background colors (bg-X-500)
 */
export const BG_COLORS: Record<DomainColorKey, string> = {
    indigo: "bg-indigo-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-500",
    cyan: "bg-cyan-500",
    orange: "bg-orange-500",
    pink: "bg-pink-500",
};

/**
 * Light background colors for tags/badges
 */
export const BG_LIGHT_COLORS: Record<DomainColorKey, string> = {
    indigo: "bg-indigo-50",
    purple: "bg-purple-50",
    emerald: "bg-emerald-50",
    cyan: "bg-cyan-50",
    orange: "bg-orange-50",
    pink: "bg-pink-50",
};

/**
 * Text colors (text-X-500)
 */
export const TEXT_COLORS: Record<DomainColorKey, string> = {
    indigo: "text-indigo-500",
    purple: "text-purple-500",
    emerald: "text-emerald-500",
    cyan: "text-cyan-500",
    orange: "text-orange-500",
    pink: "text-pink-500",
};

/**
 * Dark text variant (text-X-700)
 */
export const TEXT_DARK_COLORS: Record<DomainColorKey, string> = {
    indigo: "text-indigo-700",
    purple: "text-purple-700",
    emerald: "text-emerald-700",
    cyan: "text-cyan-700",
    orange: "text-orange-700",
    pink: "text-pink-700",
};

/**
 * Maps extended colors to glow colors for PrismaticCard
 */
export const GLOW_COLOR_MAP: Record<ExtendedColorKey, GlowColorKey> = {
    indigo: "indigo",
    purple: "purple",
    emerald: "emerald",
    cyan: "cyan",
    orange: "orange",
    pink: "purple",
    blue: "indigo",
    amber: "orange",
    slate: "indigo",
    red: "orange",
    green: "emerald",
    yellow: "orange",
    sky: "cyan",
    lime: "emerald",
    violet: "purple",
};

/**
 * Hex color values for SVG/canvas rendering
 */
export const HEX_COLORS: Record<DomainColorKey | "blue", string> = {
    indigo: "#6366f1",
    purple: "#a855f7",
    blue: "#3b82f6",
    orange: "#f97316",
    emerald: "#10b981",
    cyan: "#06b6d4",
    pink: "#ec4899",
};

/**
 * Gradient hex values for certificate generation
 */
export const GRADIENT_HEX_COLORS: Record<string, { start: string; end: string }> = {
    "from-slate-50 to-slate-100": { start: "#f8fafc", end: "#f1f5f9" },
    "from-indigo-50 to-purple-50": { start: "#eef2ff", end: "#faf5ff" },
    "from-slate-100 to-blue-50": { start: "#f1f5f9", end: "#eff6ff" },
    "from-amber-50 to-orange-50": { start: "#fffbeb", end: "#fff7ed" },
};

// Helper functions

/**
 * Get a domain by its color key
 */
export function getDomainByColor(color: DomainColorKey): LearningDomain | undefined {
    return Object.values(LEARNING_DOMAINS).find(d => d.color === color);
}

/**
 * Get a domain by its ID
 */
export function getDomain(id: LearningDomainId): LearningDomain {
    return LEARNING_DOMAINS[id];
}

/**
 * Get gradient class for a color
 */
export function getGradientClass(color: ExtendedColorKey): string {
    return GRADIENT_COLORS[color] || GRADIENT_COLORS.indigo;
}

/**
 * Get glow color for PrismaticCard
 */
export function getGlowColor(color: ExtendedColorKey): GlowColorKey {
    return GLOW_COLOR_MAP[color] || "indigo";
}

/**
 * Get hex color value
 */
export function getHexColor(color: DomainColorKey | "blue"): string {
    return HEX_COLORS[color] || HEX_COLORS.indigo;
}

/**
 * Check if a string is a valid domain color key
 */
export function isDomainColorKey(value: string): value is DomainColorKey {
    return ["indigo", "purple", "emerald", "cyan", "orange", "pink"].includes(value);
}

/**
 * Check if a string is a valid extended color key
 */
export function isExtendedColorKey(value: string): value is ExtendedColorKey {
    return [
        "indigo", "purple", "emerald", "cyan", "orange", "pink",
        "blue", "amber", "slate", "red", "green", "yellow", "sky", "lime", "violet"
    ].includes(value);
}

/**
 * Safely get a domain color, defaulting to indigo
 */
export function toDomainColor(value: string | undefined): DomainColorKey {
    if (value && isDomainColorKey(value)) {
        return value;
    }
    return "indigo";
}

/**
 * Safely get an extended color, defaulting to indigo
 */
export function toExtendedColor(value: string | undefined): ExtendedColorKey {
    if (value && isExtendedColorKey(value)) {
        return value;
    }
    return "indigo";
}

/**
 * Get all learning domains as an array
 */
export function getAllDomains(): LearningDomain[] {
    return Object.values(LEARNING_DOMAINS);
}

/**
 * Get domain icon map for components that need string-based icon lookup
 */
export const DOMAIN_ICON_MAP: Record<string, LucideIcon> = {
    Monitor,
    Layers,
    Server,
    Database,
    Gamepad2,
    Smartphone,
};

/**
 * Focus area type for Goal Path selection UI
 */
export interface FocusArea {
    id: LearningDomainId;
    label: string;
    icon: LucideIcon;
}

/**
 * Focus areas derived from LEARNING_DOMAINS for Goal Path feature.
 * This ensures focus area selections stay synchronized with the platform's domain ontology.
 * Adding a new domain to LEARNING_DOMAINS automatically makes it available as a focus area.
 */
export const FOCUS_AREAS: FocusArea[] = Object.values(LEARNING_DOMAINS).map(domain => ({
    id: domain.id,
    label: domain.name.replace(" Development", "").replace(" Engineering", ""),
    icon: domain.icon,
}));
