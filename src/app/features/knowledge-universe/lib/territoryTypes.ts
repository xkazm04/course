/**
 * Territory Map Types
 *
 * Google Maps-inspired territorial visualization for learning content.
 * Uses treemap-based layout with semantic zoom levels.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type TerritoryLevel = "world" | "domain" | "topic" | "skill" | "lesson";

export interface TerritoryNode {
    id: string;
    label: string;
    shortLabel?: string; // For small containers
    level: TerritoryLevel;
    parentId: string | null;
    children: TerritoryNode[];

    // Layout (computed by treemap algorithm)
    x: number;
    y: number;
    width: number;
    height: number;

    // Metrics
    metrics: TerritoryMetrics;

    // Visual properties
    color: string;
    borderColor: string;

    // Database reference
    dbNodeId?: string;
    dbData?: TerritoryNodeData;
}

export interface TerritoryMetrics {
    totalItems: number;      // Children count at next level
    totalLessons: number;    // All lessons in subtree
    estimatedHours: number;
    completedCount: number;
    completionPercent: number;
    difficulty?: "beginner" | "intermediate" | "advanced";
}

export interface TerritoryNodeData {
    what_you_will_learn?: string[];
    prerequisites?: string[];
    tags?: string[];
    estimated_hours?: number;
}

// ============================================================================
// LAYOUT CONFIGURATION
// ============================================================================

export interface TerritoryLayoutConfig {
    padding: number;         // Padding between territories
    minWidth: number;        // Minimum territory width
    minHeight: number;       // Minimum territory height
    labelMinFontSize: number;
    labelMaxFontSize: number;
    headerHeight: number;    // Height reserved for territory header
}

export const DEFAULT_LAYOUT_CONFIG: TerritoryLayoutConfig = {
    padding: 8,
    minWidth: 80,
    minHeight: 60,
    labelMinFontSize: 10,
    labelMaxFontSize: 32,
    headerHeight: 40,
};

// ============================================================================
// ZOOM STATE
// ============================================================================

export interface TerritoryZoomState {
    level: TerritoryLevel;
    focusNodeId: string | null;  // Currently focused territory
    scale: number;               // Zoom scale (1 = fit to viewport)
    offsetX: number;             // Pan offset
    offsetY: number;

    // Breadcrumb path
    breadcrumb: BreadcrumbItem[];
}

export interface BreadcrumbItem {
    id: string;
    label: string;
    level: TerritoryLevel;
}

export const INITIAL_ZOOM_STATE: TerritoryZoomState = {
    level: "world",
    focusNodeId: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    breadcrumb: [],
};

// ============================================================================
// COLOR SCHEMES
// ============================================================================

export interface TerritoryColorScheme {
    domain: string[];
    topic: string[];
    skill: string[];
    lesson: string[];
    border: string;
    text: string;
    textSecondary: string;
    background: string;
}

export const DEFAULT_COLOR_SCHEME: TerritoryColorScheme = {
    domain: [
        "#1e3a5f", // Deep blue
        "#2d4a3e", // Forest green
        "#4a3052", // Purple
        "#5a3d2b", // Brown
        "#3d4a5a", // Slate
        "#4a2d4a", // Magenta
    ],
    topic: [
        "#2a4a7a", // Lighter blue
        "#3d5a4e", // Lighter green
        "#5a4062", // Lighter purple
        "#6a4d3b", // Lighter brown
        "#4d5a6a", // Lighter slate
        "#5a3d5a", // Lighter magenta
    ],
    skill: [
        "#3a5a9a", // Even lighter
        "#4d6a5e",
        "#6a5072",
        "#7a5d4b",
        "#5d6a7a",
        "#6a4d6a",
    ],
    lesson: [
        "#4a6aaa",
        "#5d7a6e",
        "#7a6082",
        "#8a6d5b",
        "#6d7a8a",
        "#7a5d7a",
    ],
    border: "#ffffff20",
    text: "#ffffff",
    textSecondary: "#ffffffaa",
    background: "#0a0a0f",
};

// ============================================================================
// VISIBILITY RULES
// ============================================================================

export interface VisibilityConfig {
    // Minimum pixel dimensions to show content
    showLabel: { width: number; height: number };
    showMetrics: { width: number; height: number };
    showChildren: { width: number; height: number };
    showProgress: { width: number; height: number };
}

export const DEFAULT_VISIBILITY: VisibilityConfig = {
    showLabel: { width: 60, height: 40 },
    showMetrics: { width: 120, height: 80 },
    showChildren: { width: 200, height: 150 },
    showProgress: { width: 100, height: 60 },
};

// ============================================================================
// INTERACTION TYPES
// ============================================================================

export type TerritoryAction =
    | { type: "zoom_in"; nodeId: string }
    | { type: "zoom_out" }
    | { type: "pan"; deltaX: number; deltaY: number }
    | { type: "reset" }
    | { type: "navigate"; nodeId: string }
    | { type: "hover"; nodeId: string | null };

export interface TerritoryInteractionState {
    hoveredNodeId: string | null;
    selectedNodeId: string | null;
    isDragging: boolean;
    dragStartX: number;
    dragStartY: number;
}
