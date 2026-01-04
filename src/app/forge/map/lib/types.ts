import type { MapNode, NodeStatus } from "@/app/features/knowledge-map/lib/types";
import type { LucideIcon } from "lucide-react";

// Re-export for convenience
export type { MapNode, NodeStatus };
export type { NodeGenerationStatus } from "./contentApi";

// ============================================================================
// VIEW & NAVIGATION TYPES
// ============================================================================

export type MapView = "domains" | "hex";

export interface ViewportState {
    scale: number;
    offsetX: number;
    offsetY: number;
}

export interface HexCoord {
    q: number;
    r: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface HexLayoutNode {
    // Core properties from MapNode (explicit for TypeScript)
    id: string;
    level: "domain" | "course" | "chapter" | "section" | "concept";
    name: string;
    description: string;
    status: NodeStatus;
    progress: number;
    parentId: string | null;
    childIds: string[];
    estimatedHours?: number;
    // HexLayoutNode specific
    hex: HexCoord;
    pixel: Point;
    // Allow other properties from MapNode variants
    [key: string]: unknown;
}

// ============================================================================
// ORACLE TYPES
// ============================================================================

export type OracleStep = "idle" | "domain" | "experience" | "focus" | "generating" | "paths" | "complete";
export type LearningPath = "frontend" | "fullstack" | "backend" | "mobile" | "games" | "databases" | "data" | "devops";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface GeneratedPath {
    id: string;
    name: string;
    nodeIds: string[];
    forgeNodeIds: string[];
    duration: string;
    color: string;
}

export interface OracleState {
    step: OracleStep;
    domain: LearningPath | null;
    experience: ExperienceLevel | null;
    focus: string | null;
    paths: GeneratedPath[];
    selectedPath: GeneratedPath | null;
}

// ============================================================================
// DOMAIN CARD TYPES
// ============================================================================

export interface DomainCard {
    id: LearningPath;
    title: string;
    tagline: string;
    icon: LucideIcon;
    gradient: string;
    pattern: string;
    accent: string;
}

// ============================================================================
// STYLE CONSTANTS
// ============================================================================

// Domain colors with light and dark theme backgrounds
export const DOMAIN_COLORS: Record<string, { base: string; light: string; dark: string; darkBg: string }> = {
    frontend: { base: "#6366f1", light: "#eef2ff", dark: "#4338ca", darkBg: "#312e81" },
    backend: { base: "#10b981", light: "#ecfdf5", dark: "#047857", darkBg: "#064e3b" },
    fullstack: { base: "#a855f7", light: "#faf5ff", dark: "#7c3aed", darkBg: "#4c1d95" },
    databases: { base: "#06b6d4", light: "#ecfeff", dark: "#0891b2", darkBg: "#164e63" },
    mobile: { base: "#ec4899", light: "#fdf2f8", dark: "#be185d", darkBg: "#831843" },
    games: { base: "#f97316", light: "#fff7ed", dark: "#c2410c", darkBg: "#7c2d12" },
};

// Status styles with theme-aware backgrounds
// Light theme uses light backgrounds, dark theme uses darker tinted backgrounds
export const STATUS_STYLES: Record<NodeStatus, { fill: string; bg: string; darkBg: string }> = {
    completed: { fill: "#10b981", bg: "#d1fae5", darkBg: "#064e3b" },
    in_progress: { fill: "#6366f1", bg: "#e0e7ff", darkBg: "#312e81" },
    available: { fill: "#64748b", bg: "#f1f5f9", darkBg: "#1e293b" },
    locked: { fill: "#94a3b8", bg: "#e2e8f0", darkBg: "#0f172a" },
};

// Helper to get theme-aware background
export const getStatusBg = (status: NodeStatus, isDark: boolean): string => {
    const style = STATUS_STYLES[status];
    return isDark ? style.darkBg : style.bg;
};

export const getDomainBg = (domainId: string, isDark: boolean): string => {
    const colors = DOMAIN_COLORS[domainId];
    if (!colors) return isDark ? "#1e293b" : "#f1f5f9";
    return isDark ? colors.darkBg : colors.light;
};
