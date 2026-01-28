import type { MapNode, NodeStatus } from "@/app/features/knowledge-map/lib/types";
import type { LucideIcon } from "lucide-react";

// Re-export for convenience
export type { MapNode, NodeStatus };

// ============================================================================
// GENERATION STATUS TYPES (Canonical definition)
// ============================================================================

/**
 * Status of content generation for a map node.
 * This is the canonical definition - import from this file, not contentApi.ts
 *
 * - pending: Generation job created but not yet started
 * - generating: Content generation in progress
 * - ready: Content generation completed successfully
 * - completed: Node fully processed (used in path sync store)
 * - failed: Content generation failed
 */
export type NodeGenerationStatus = "pending" | "generating" | "ready" | "completed" | "failed";

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

/**
 * HexLayoutNode - MapNode with hex grid positioning
 *
 * Uses intersection type to preserve all MapNode properties with full type checking
 * while adding hex-specific fields for grid layout.
 */
export type HexLayoutNode = MapNode & {
    /** Hex grid coordinates (axial) */
    hex: HexCoord;
    /** Pixel position for rendering */
    pixel: Point;
};

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
// STYLE CONSTANTS (Re-exported from theme module)
// ============================================================================

export {
    DOMAIN_COLORS,
    STATUS_STYLES,
    getDomainColors,
    getStatusColors,
    getDomainBg,
    getStatusBg,
} from "@/app/features/theme";
export type { DomainColorConfig, StatusStyleConfig, ThemeMode } from "@/app/features/theme";
