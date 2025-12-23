/**
 * Curriculum Position Calculator
 *
 * Auto-layout algorithm for positioning curriculum nodes based on
 * category, tier, and prerequisites for optimal visualization.
 */

import { CurriculumNode, CurriculumCategory, CurriculumData, CurriculumConnection } from "./curriculumTypes";

interface LayoutConfig {
    categorySpacing: number;
    tierHeight: number;
    nodeWidth: number;
    nodeHeight: number;
    padding: number;
}

const DEFAULT_LAYOUT: LayoutConfig = {
    categorySpacing: 350,
    tierHeight: 80,
    nodeWidth: 160,
    nodeHeight: 60,
    padding: 50,
};

// Category column positions (left to right)
const CATEGORY_COLUMNS: Record<CurriculumCategory, number> = {
    "html-css": 0,
    "javascript": 1,
    "typescript": 2,
    "react": 3,
    "vue": 4,
    "angular": 5,
    "testing": 0,
    "build-tools": 1,
    "performance": 2,
    "accessibility": 3,
    "design-systems": 4,
    "state-management": 5,
};

// Category row groups (for multi-row layouts)
const CATEGORY_ROW_GROUPS: Record<CurriculumCategory, number> = {
    "html-css": 0,
    "javascript": 0,
    "typescript": 0,
    "react": 0,
    "vue": 0,
    "angular": 0,
    "testing": 1,
    "build-tools": 1,
    "performance": 1,
    "accessibility": 1,
    "design-systems": 1,
    "state-management": 1,
};

/**
 * Calculate the position for a single node based on its category and tier
 */
export function calculateNodePosition(
    node: CurriculumNode,
    categoryNodes: CurriculumNode[],
    config: LayoutConfig = DEFAULT_LAYOUT
): { x: number; y: number } {
    const column = CATEGORY_COLUMNS[node.category];
    const rowGroup = CATEGORY_ROW_GROUPS[node.category];

    // Group nodes by tier within category
    const tierNodes = categoryNodes.filter(n => n.tier === node.tier);
    const nodeIndexInTier = tierNodes.findIndex(n => n.id === node.id);

    // Calculate base position
    const baseX = config.padding + column * config.categorySpacing;
    const baseY = config.padding + rowGroup * 450 + node.tier * config.tierHeight;

    // Offset within tier to prevent overlap
    const xOffset = nodeIndexInTier * 150;
    const yOffset = (nodeIndexInTier % 2) * 40; // Stagger alternating nodes

    return {
        x: baseX + xOffset,
        y: baseY + yOffset,
    };
}

/**
 * Recalculate all node positions for a category
 */
export function calculateCategoryLayout(
    nodes: CurriculumNode[],
    category: CurriculumCategory,
    config: LayoutConfig = DEFAULT_LAYOUT
): Map<string, { x: number; y: number }> {
    const categoryNodes = nodes.filter(n => n.category === category);
    const positions = new Map<string, { x: number; y: number }>();

    categoryNodes.forEach(node => {
        positions.set(node.id, calculateNodePosition(node, categoryNodes, config));
    });

    return positions;
}

/**
 * Get bounding box for all nodes (used for canvas sizing)
 */
export function calculateCanvasBounds(nodes: CurriculumNode[]): {
    width: number;
    height: number;
    minX: number;
    minY: number;
} {
    if (nodes.length === 0) {
        return { width: 800, height: 600, minX: 0, minY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + 160); // node width
        maxY = Math.max(maxY, node.position.y + 60); // node height
    });

    return {
        width: maxX + 100, // padding
        height: maxY + 100,
        minX,
        minY,
    };
}

/**
 * Calculate viewport bounds with padding for visibility culling
 */
export function getViewportBounds(
    viewport: { translateX: number; translateY: number; scale: number },
    containerSize: { width: number; height: number },
    padding: number = 100
): { minX: number; maxX: number; minY: number; maxY: number } {
    return {
        minX: -viewport.translateX / viewport.scale - padding,
        maxX: (-viewport.translateX + containerSize.width) / viewport.scale + padding,
        minY: -viewport.translateY / viewport.scale - padding,
        maxY: (-viewport.translateY + containerSize.height) / viewport.scale + padding,
    };
}

/**
 * Check if a node is within viewport bounds
 */
function isNodeInBounds(
    node: CurriculumNode,
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
): boolean {
    const nodeRight = node.position.x + 160;
    const nodeBottom = node.position.y + 60;

    return (
        node.position.x < bounds.maxX &&
        nodeRight > bounds.minX &&
        node.position.y < bounds.maxY &&
        nodeBottom > bounds.minY
    );
}

/**
 * Filter nodes visible in current viewport for performance
 */
export function getVisibleNodes(
    nodes: CurriculumNode[],
    viewport: { translateX: number; translateY: number; scale: number },
    containerSize: { width: number; height: number },
    padding: number = 100
): CurriculumNode[] {
    const bounds = getViewportBounds(viewport, containerSize, padding);
    return nodes.filter(node => isNodeInBounds(node, bounds));
}

/**
 * Filter connections visible in current viewport for performance.
 * A connection is visible if BOTH its source and target nodes are within the viewport bounds.
 * This eliminates off-screen bezier path calculations and reduces SVG DOM element count.
 *
 * @param connections - All connections to filter
 * @param nodes - All nodes (needed to look up positions)
 * @param viewport - Current viewport state (pan/zoom)
 * @param containerSize - Size of the container element
 * @param padding - Extra padding around viewport for smoother scrolling (default 150 for connections)
 * @returns Connections where both source and target nodes are within viewport bounds
 */
export function getVisibleConnections(
    connections: CurriculumConnection[],
    nodes: CurriculumNode[],
    viewport: { translateX: number; translateY: number; scale: number },
    containerSize: { width: number; height: number },
    padding: number = 150 // Larger padding for connections to avoid pop-in effect
): CurriculumConnection[] {
    // Create a lookup map for O(1) node access
    const nodeMap = new Map<string, CurriculumNode>();
    nodes.forEach(node => nodeMap.set(node.id, node));

    // Use larger padding for connections to ensure smooth appearance during pan/zoom
    const bounds = getViewportBounds(viewport, containerSize, padding);

    return connections.filter(connection => {
        const fromNode = nodeMap.get(connection.from);
        const toNode = nodeMap.get(connection.to);

        // Skip if either node doesn't exist
        if (!fromNode || !toNode) return false;

        // Connection is visible only if BOTH endpoints are within viewport bounds
        return isNodeInBounds(fromNode, bounds) && isNodeInBounds(toNode, bounds);
    });
}

/**
 * Generate category navigation structure for multi-level nav
 */
export interface CategoryNavItem {
    id: CurriculumCategory;
    name: string;
    nodeCount: number;
    completedCount: number;
    subcategories: SubcategoryNavItem[];
}

export interface SubcategoryNavItem {
    id: string;
    name: string;
    nodeIds: string[];
    completedCount: number;
}

export function generateCategoryNav(data: CurriculumData): CategoryNavItem[] {
    const categoryMap = new Map<CurriculumCategory, CategoryNavItem>();

    // Initialize categories
    data.categories.forEach(cat => {
        categoryMap.set(cat.id, {
            id: cat.id,
            name: cat.name,
            nodeCount: 0,
            completedCount: 0,
            subcategories: [],
        });
    });

    // Group nodes by category and subcategory
    const subcategoryMap = new Map<string, SubcategoryNavItem>();

    data.nodes.forEach(node => {
        const catNav = categoryMap.get(node.category);
        if (!catNav) return;

        catNav.nodeCount++;
        if (node.status === "completed") {
            catNav.completedCount++;
        }

        // Handle subcategory
        const subKey = `${node.category}-${node.subcategory}`;
        let subNav = subcategoryMap.get(subKey);

        if (!subNav) {
            subNav = {
                id: subKey,
                name: node.subcategory,
                nodeIds: [],
                completedCount: 0,
            };
            subcategoryMap.set(subKey, subNav);
            catNav.subcategories.push(subNav);
        }

        subNav.nodeIds.push(node.id);
        if (node.status === "completed") {
            subNav.completedCount++;
        }
    });

    return Array.from(categoryMap.values());
}

/**
 * Calculate optimal initial viewport to show all content
 */
export function calculateFitViewport(
    nodes: CurriculumNode[],
    containerSize: { width: number; height: number }
): { scale: number; translateX: number; translateY: number } {
    const bounds = calculateCanvasBounds(nodes);

    const scaleX = containerSize.width / bounds.width;
    const scaleY = containerSize.height / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1) * 0.9; // 90% to add some padding

    const centerX = (bounds.width * scale - containerSize.width) / -2;
    const centerY = (bounds.height * scale - containerSize.height) / -2;

    return {
        scale: Math.max(0.3, scale),
        translateX: centerX + 50,
        translateY: centerY + 50,
    };
}
