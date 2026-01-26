/**
 * Layout Engine
 *
 * Computes treemap layout using d3-hierarchy's squarified algorithm.
 * Positions nodes within a bounded container with optimal aspect ratios.
 */

import * as d3 from "d3";
import type { TreemapNode, LayoutConfig } from "./types";
import { DEFAULT_LAYOUT_CONFIG } from "./types";

// ============================================================================
// TYPES
// ============================================================================

interface ContainerRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Internal type for d3 hierarchy
interface HierarchyNodeData {
  id: string;
  value?: number;
  children?: HierarchyNodeData[];
}

// Type for d3 hierarchy node after treemap layout (adds x0, y0, x1, y1)
type TreemapHierarchyNode = d3.HierarchyRectangularNode<HierarchyNodeData>;

// ============================================================================
// LAYOUT COMPUTATION
// ============================================================================

/**
 * Compute treemap layout for nodes within a bounded container.
 *
 * Uses d3-hierarchy's squarified treemap algorithm for optimal aspect ratios.
 * All positions are relative to the container (0,0 = top-left of container).
 *
 * @param nodes - Array of TreemapNode to layout
 * @param container - Bounding rectangle {x, y, width, height}
 * @param config - Layout configuration (padding, min sizes)
 * @returns New array of TreemapNode with computed x, y, width, height
 */
export function computeLayout(
  nodes: TreemapNode[],
  container: ContainerRect,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): TreemapNode[] {
  if (nodes.length === 0) return [];

  // Build hierarchical structure for d3
  // Create a virtual root with all nodes as children
  const hierarchyData: HierarchyNodeData = {
    id: "__root__",
    children: nodes.map((node) => ({
      id: node.id,
      // Use totalLessons as the sizing value (minimum 1)
      value: Math.max(1, node.totalLessons),
    })),
  };

  const root = d3
    .hierarchy(hierarchyData)
    .sum((d) => d.value || 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  // Create treemap layout with squarify tiling (best aspect ratios)
  const treemap = d3
    .treemap<HierarchyNodeData>()
    .size([container.width, container.height])
    .padding(config.padding)
    .tile(d3.treemapSquarify.ratio(1)); // Ratio of 1 = prefer squares

  // Compute layout - treemap() mutates the hierarchy to add x0, y0, x1, y1
  const layoutRoot = treemap(root) as TreemapHierarchyNode;

  // Extract positioned nodes (skip the virtual root)
  const positioned: TreemapNode[] = [];

  for (const child of layoutRoot.children || []) {
    const originalNode = nodes.find((n) => n.id === child.data.id);
    if (!originalNode) continue;

    // d3 provides x0, y0, x1, y1 - convert to x, y, width, height
    const x = child.x0 + container.x;
    const y = child.y0 + container.y;
    const width = Math.max(config.minWidth, child.x1 - child.x0);
    const height = Math.max(config.minHeight, child.y1 - child.y0);

    positioned.push({
      ...originalNode,
      x,
      y,
      width,
      height,
    });
  }

  return positioned;
}

// ============================================================================
// LABEL UTILITIES
// ============================================================================

/**
 * Check if a node is large enough to display its label.
 * Used to decide whether to show text or just a colored rectangle.
 *
 * @param node - TreemapNode with computed dimensions
 * @param minWidth - Minimum width to show label (default: 60)
 * @param minHeight - Minimum height to show label (default: 30)
 */
export function canShowLabel(
  node: TreemapNode,
  minWidth = 60,
  minHeight = 30
): boolean {
  return node.width >= minWidth && node.height >= minHeight;
}

/**
 * Calculate appropriate font size for a node's label.
 * Scales based on node dimensions.
 *
 * @param node - TreemapNode with computed dimensions
 * @returns Font size in pixels (10-18 range)
 */
export function calculateFontSize(node: TreemapNode): number {
  const minFont = 10;
  const maxFont = 18;

  // Scale based on smaller dimension
  const scale = Math.min(node.width, node.height);

  if (scale < 50) return minFont;
  if (scale > 200) return maxFont;

  // Linear interpolation
  return minFont + ((scale - 50) / 150) * (maxFont - minFont);
}
