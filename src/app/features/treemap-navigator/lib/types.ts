/**
 * Treemap Navigator Types
 *
 * Core type definitions for the treemap navigation feature.
 * Simpler than TerritoryNode - focused on drill-down navigation.
 */

// ============================================================================
// CORE NODE TYPES
// ============================================================================

/**
 * TreemapNode - represents a node in the treemap
 * Simpler than TerritoryNode, focused on navigation
 */
export interface TreemapNode {
  id: string;
  label: string;
  parentId: string | null;
  childCount: number; // Count of immediate children (for badge display)
  totalLessons: number; // Total lessons in subtree (for sizing weight)

  // Layout computed fields (0,0,0,0 before layout)
  x: number;
  y: number;
  width: number;
  height: number;

  // Visual
  color: string;
  nodeType: "domain" | "topic" | "skill" | "course" | "lesson";
  depth: number;
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

/**
 * BreadcrumbItem - for navigation path display
 */
export interface BreadcrumbItem {
  id: string;
  label: string;
  depth: number;
}

/**
 * TransitionDirection - animation direction for navigation
 */
export type TransitionDirection = "drillDown" | "drillUp" | null;

/**
 * NavigationState - what the store manages
 */
export interface NavigationState {
  currentPath: BreadcrumbItem[]; // Path from root to current level
  currentNodes: TreemapNode[]; // Nodes displayed at current level
  isLoading: boolean;
  error: string | null;
  transitionDirection: TransitionDirection; // For animation variants
  selectedNode: TreemapNode | null; // For detail panel
}

// ============================================================================
// LAYOUT CONFIGURATION
// ============================================================================

/**
 * LayoutConfig - treemap layout parameters
 */
export interface LayoutConfig {
  padding: number; // Space between nodes
  minWidth: number; // Minimum node width
  minHeight: number; // Minimum node height
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  padding: 4,
  minWidth: 60,
  minHeight: 40,
};

// ============================================================================
// API TYPES
// ============================================================================

/**
 * ApiNode - shape returned by /api/map-nodes
 * Used for transforming API responses to TreemapNode
 *
 * Matches TransformedNode from route.ts but we only use the fields we need.
 */
export interface ApiNode {
  id: string;
  name: string;
  parentId: string | null;
  nodeType: string;
  depth: number;
  totalChildren: number;
  color: string;
  // Additional fields from API (not all used in transform)
  slug?: string;
  description?: string;
  status?: string;
  progress?: number;
  childIds?: string[];
  domainId?: string;
  sortOrder?: number;
  estimatedHours?: number | null;
  difficulty?: string | null;
  courseId?: string | null;
  isGroupNode?: boolean;
  isAiGenerated?: boolean;
  icon?: string | null;
  level?: string;
}
