/**
 * Matrix Map Visual Constants
 */

import type { MatrixVariant } from "./types";

// ============================================================================
// DOMAIN COLORS
// ============================================================================

export const DOMAIN_COLORS = {
    frontend: { base: "#6366f1", glow: "rgba(99, 102, 241, 0.5)", light: "#e0e7ff" },
    backend: { base: "#10b981", glow: "rgba(16, 185, 129, 0.5)", light: "#d1fae5" },
    fullstack: { base: "#a855f7", glow: "rgba(168, 85, 247, 0.5)", light: "#f3e8ff" },
    databases: { base: "#06b6d4", glow: "rgba(6, 182, 212, 0.5)", light: "#cffafe" },
    mobile: { base: "#ec4899", glow: "rgba(236, 72, 153, 0.5)", light: "#fce7f3" },
    games: { base: "#f97316", glow: "rgba(249, 115, 22, 0.5)", light: "#ffedd5" },
} as const;

// ============================================================================
// STATUS COLORS
// ============================================================================

export const STATUS_COLORS = {
    completed: { fill: "#10b981", stroke: "#059669", bg: "#d1fae5" },
    in_progress: { fill: "#6366f1", stroke: "#4f46e5", bg: "#e0e7ff" },
    available: { fill: "#64748b", stroke: "#475569", bg: "#f1f5f9" },
    locked: { fill: "#cbd5e1", stroke: "#94a3b8", bg: "#f8fafc" },
} as const;

// ============================================================================
// VIEWPORT CONSTANTS
// ============================================================================

export const VIEWPORT = {
    MIN_SCALE: 0.4,
    MAX_SCALE: 2.5,
    ZOOM_SPEED: 0.002,
    PAN_THRESHOLD: 5,
} as const;

// ============================================================================
// NESTED BOXES CONSTANTS
// ============================================================================

export const NESTED = {
    MIN_BOX_SIZE: 60,
    HEADER_HEIGHT: 28,
    PADDING: 8,
    BORDER_RADIUS: 12,
    BORDER_WIDTH: 2,
    LABEL_FONT_SIZE: 12,
    ANIMATION_DURATION: 300,
} as const;

// ============================================================================
// HEX GRID CONSTANTS
// ============================================================================

export const HEX = {
    SIZE: 50, // Point-to-point radius
    CLUSTER_GAP: 2, // Hexes between clusters
    ANIMATION_DURATION: 400,
    RING_STROKE_WIDTH: 3,
    ICON_SIZE: 20,
} as const;

// ============================================================================
// METRO MAP CONSTANTS
// ============================================================================

export const METRO = {
    STATION_RADIUS: 16,
    INTERCHANGE_RADIUS: 24,
    LINE_WIDTH: 6,
    STATION_SPACING: 100,
    LINE_SPACING: 60,
    LABEL_OFFSET: 30,
    ANIMATION_DURATION: 500,
    CORNER_RADIUS: 20,
} as const;

// ============================================================================
// VARIANT LABELS
// ============================================================================

export const VARIANT_LABELS: Record<MatrixVariant, { label: string; description: string }> = {
    nested: { label: "Nested Boxes", description: "Hierarchical treemap layout" },
    hex: { label: "Hex Grid", description: "Honeycomb cluster visualization" },
    metro: { label: "Metro Map", description: "Transit-style path layout" },
} as const;
