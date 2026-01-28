/**
 * Treemap Layout Algorithm
 *
 * Implements squarified treemap layout for territory visualization.
 * Optimizes for aspect ratios close to 1 (squares) for better label readability.
 */

import type {
    TerritoryNode,
    TerritoryLevel,
    TerritoryLayoutConfig,
    TerritoryMetrics,
    DEFAULT_LAYOUT_CONFIG,
} from "./territoryTypes";

// ============================================================================
// LAYOUT ALGORITHM
// ============================================================================

interface LayoutRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface WeightedItem {
    node: TerritoryNode;
    weight: number;
}

/**
 * Compute treemap layout for a list of nodes within a container
 */
export function computeTreemapLayout(
    nodes: TerritoryNode[],
    container: LayoutRect,
    config: TerritoryLayoutConfig
): TerritoryNode[] {
    if (nodes.length === 0) return [];

    // Calculate weights based on total lessons (or 1 if leaf)
    const weightedItems: WeightedItem[] = nodes.map((node) => ({
        node,
        weight: Math.max(1, node.metrics.totalLessons),
    }));

    const totalWeight = weightedItems.reduce((sum, item) => sum + item.weight, 0);

    // Apply padding to container
    const paddedContainer: LayoutRect = {
        x: container.x + config.padding,
        y: container.y + config.padding,
        width: container.width - config.padding * 2,
        height: container.height - config.padding * 2,
    };

    // Normalize weights to fill container area
    const containerArea = paddedContainer.width * paddedContainer.height;
    const normalizedItems = weightedItems.map((item) => ({
        ...item,
        area: (item.weight / totalWeight) * containerArea,
    }));

    // Apply squarified algorithm
    const rects = squarify(normalizedItems, paddedContainer, []);

    // Apply computed layout to nodes
    return nodes.map((node, index) => {
        const rect = rects[index];
        return {
            ...node,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
        };
    });
}

/**
 * Squarified treemap algorithm
 * Produces rectangles with aspect ratios as close to 1 as possible
 */
function squarify(
    items: Array<{ node: TerritoryNode; weight: number; area: number }>,
    container: LayoutRect,
    result: LayoutRect[]
): LayoutRect[] {
    if (items.length === 0) return result;
    if (items.length === 1) {
        return [...result, container];
    }

    // Sort by area descending for better layout
    const sortedItems = [...items].sort((a, b) => b.area - a.area);

    // Determine layout direction (horizontal or vertical strip)
    const isWide = container.width >= container.height;
    const side = isWide ? container.height : container.width;

    // Find the best row split
    let row: typeof sortedItems = [];
    let remaining = sortedItems;
    let currentWorst = Infinity;

    for (let i = 1; i <= sortedItems.length; i++) {
        const testRow = sortedItems.slice(0, i);
        const testRemaining = sortedItems.slice(i);
        const worst = worstRatio(testRow, side);

        if (worst <= currentWorst) {
            currentWorst = worst;
            row = testRow;
            remaining = testRemaining;
        } else {
            break;
        }
    }

    // Layout the row
    const rowArea = row.reduce((sum, item) => sum + item.area, 0);
    const rowSize = rowArea / side;

    let offset = 0;
    const rowRects: LayoutRect[] = row.map((item) => {
        const itemSize = item.area / rowSize;
        const rect: LayoutRect = isWide
            ? {
                  x: container.x,
                  y: container.y + offset,
                  width: rowSize,
                  height: itemSize,
              }
            : {
                  x: container.x + offset,
                  y: container.y,
                  width: itemSize,
                  height: rowSize,
              };
        offset += itemSize;
        return rect;
    });

    // Compute remaining container
    const remainingContainer: LayoutRect = isWide
        ? {
              x: container.x + rowSize,
              y: container.y,
              width: container.width - rowSize,
              height: container.height,
          }
        : {
              x: container.x,
              y: container.y + rowSize,
              width: container.width,
              height: container.height - rowSize,
          };

    // Recursively layout remaining items
    return squarify(remaining, remainingContainer, [...result, ...rowRects]);
}

/**
 * Calculate worst aspect ratio in a row
 */
function worstRatio(
    row: Array<{ area: number }>,
    side: number
): number {
    if (row.length === 0) return Infinity;

    const rowArea = row.reduce((sum, item) => sum + item.area, 0);
    const rowSize = rowArea / side;

    let worst = 0;
    for (const item of row) {
        const itemSize = item.area / rowSize;
        const ratio = Math.max(rowSize / itemSize, itemSize / rowSize);
        worst = Math.max(worst, ratio);
    }

    return worst;
}

// ============================================================================
// HIERARCHICAL LAYOUT
// ============================================================================

/**
 * Compute layout for entire hierarchy
 */
export function computeHierarchicalLayout(
    root: TerritoryNode,
    viewport: LayoutRect,
    config: TerritoryLayoutConfig
): TerritoryNode {
    // Apply layout to root
    const layoutRoot = {
        ...root,
        x: viewport.x,
        y: viewport.y,
        width: viewport.width,
        height: viewport.height,
    };

    // Recursively layout children
    if (root.children.length > 0) {
        const contentArea: LayoutRect = {
            x: viewport.x + config.padding,
            y: viewport.y + config.headerHeight + config.padding,
            width: viewport.width - config.padding * 2,
            height: viewport.height - config.headerHeight - config.padding * 2,
        };

        const layoutChildren = computeTreemapLayout(root.children, contentArea, config);

        // Recursively layout grandchildren
        layoutRoot.children = layoutChildren.map((child) =>
            computeHierarchicalLayout(child, child, config)
        );
    }

    return layoutRoot;
}

// ============================================================================
// LABEL SIZING
// ============================================================================

/**
 * Calculate optimal font size for a label within a container
 */
export function calculateLabelFontSize(
    text: string,
    containerWidth: number,
    containerHeight: number,
    config: TerritoryLayoutConfig
): number {
    // Approximate: each character is ~0.6x font size wide
    const charWidth = 0.6;
    const maxChars = text.length;

    // Calculate max font size that fits width
    const maxFontForWidth = (containerWidth * 0.8) / (maxChars * charWidth);

    // Calculate max font size that fits height (allow 2 lines)
    const maxFontForHeight = (containerHeight * 0.3) / 1.2;

    const computed = Math.min(maxFontForWidth, maxFontForHeight);

    return Math.max(
        config.labelMinFontSize,
        Math.min(config.labelMaxFontSize, computed)
    );
}

/**
 * Determine which label variant to show based on container size
 */
export function getLabelVariant(
    node: TerritoryNode,
    scale: number
): "full" | "short" | "icon" | "hidden" {
    const effectiveWidth = node.width * scale;
    const effectiveHeight = node.height * scale;

    if (effectiveWidth < 40 || effectiveHeight < 30) {
        return "hidden";
    }
    if (effectiveWidth < 80 || effectiveHeight < 50) {
        return "icon";
    }
    if (effectiveWidth < 150 || effectiveHeight < 80) {
        return "short";
    }
    return "full";
}

// ============================================================================
// VISIBILITY UTILITIES
// ============================================================================

/**
 * Check if a territory should show its children at current scale
 */
export function shouldShowChildren(
    node: TerritoryNode,
    scale: number,
    minWidth: number = 200,
    minHeight: number = 150
): boolean {
    const effectiveWidth = node.width * scale;
    const effectiveHeight = node.height * scale;

    return effectiveWidth >= minWidth && effectiveHeight >= minHeight;
}

/**
 * Check if a territory is visible in the viewport
 */
export function isInViewport(
    node: TerritoryNode,
    viewportX: number,
    viewportY: number,
    viewportWidth: number,
    viewportHeight: number,
    margin: number = 50
): boolean {
    return (
        node.x + node.width + margin >= viewportX &&
        node.x - margin <= viewportX + viewportWidth &&
        node.y + node.height + margin >= viewportY &&
        node.y - margin <= viewportY + viewportHeight
    );
}

/**
 * Get the depth level to show based on scale
 */
export function getVisibleDepth(scale: number): number {
    if (scale < 1.5) return 1;    // Only domains
    if (scale < 3) return 2;      // Domains + topics
    if (scale < 6) return 3;      // + skills
    return 4;                      // Full detail
}
