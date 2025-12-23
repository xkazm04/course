"use client";

/**
 * useMapLayout Hook
 *
 * Calculates grid layout positions for nodes based on hierarchy level
 * and container dimensions.
 */

import { useMemo } from "react";
import type { MapNode, NodeLevel, Point, LevelLayoutConfig } from "./types";
import { LAYOUT_CONFIG } from "./types";

/**
 * LayoutNode combines MapNode properties with computed layout properties.
 * Uses intersection type for proper union type handling.
 */
export type LayoutNode = MapNode & {
    /** Computed position in the grid */
    layoutPosition: Point;
    /** Width of the node card */
    width: number;
    /** Height of the node card */
    height: number;
};

export interface UseMapLayoutOptions {
    /** Container width */
    containerWidth: number;
    /** Container height */
    containerHeight: number;
    /** Padding around the grid */
    padding?: number;
}

export interface UseMapLayoutReturn {
    /** Nodes with computed layout positions */
    layoutNodes: LayoutNode[];
    /** Total content width */
    contentWidth: number;
    /** Total content height */
    contentHeight: number;
    /** Layout config for current level */
    layoutConfig: LevelLayoutConfig;
}

/**
 * Calculate responsive columns based on container width
 */
function getResponsiveColumns(
    config: LevelLayoutConfig,
    containerWidth: number,
    padding: number
): number {
    const availableWidth = containerWidth - padding * 2;
    const minColumns = 1;
    const maxColumns = config.columns;

    // Calculate how many columns fit
    const nodeWithGap = config.nodeWidth + config.gap;
    const fittingColumns = Math.floor((availableWidth + config.gap) / nodeWithGap);

    return Math.max(minColumns, Math.min(maxColumns, fittingColumns));
}

/**
 * Hook for calculating node layout positions
 */
export function useMapLayout(
    nodes: MapNode[],
    options: UseMapLayoutOptions
): UseMapLayoutReturn {
    const { containerWidth, containerHeight, padding = 40 } = options;

    const layoutResult = useMemo(() => {
        if (nodes.length === 0) {
            return {
                layoutNodes: [],
                contentWidth: 0,
                contentHeight: 0,
                layoutConfig: LAYOUT_CONFIG.domain,
            };
        }

        // Determine level from first node
        const level = nodes[0].level;
        const config = LAYOUT_CONFIG[level];

        // Calculate responsive columns
        const columns = getResponsiveColumns(config, containerWidth, padding);

        // Calculate positions
        const layoutNodes: LayoutNode[] = nodes.map((node, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;

            // Calculate total row width for centering
            const nodesInRow = Math.min(columns, nodes.length - row * columns);
            const rowWidth = nodesInRow * config.nodeWidth + (nodesInRow - 1) * config.gap;
            const rowStartX = (containerWidth - rowWidth) / 2;

            const x = rowStartX + col * (config.nodeWidth + config.gap);
            const y = padding + row * (config.nodeHeight + config.gap);

            return {
                ...node,
                layoutPosition: { x, y },
                width: config.nodeWidth,
                height: config.nodeHeight,
            };
        });

        // Calculate total content dimensions
        const rows = Math.ceil(nodes.length / columns);
        const contentWidth = containerWidth;
        const contentHeight = padding * 2 + rows * config.nodeHeight + (rows - 1) * config.gap;

        return {
            layoutNodes,
            contentWidth,
            contentHeight,
            layoutConfig: config,
        };
    }, [nodes, containerWidth, containerHeight, padding]);

    return layoutResult;
}

/**
 * Get center position for a node (for connection lines)
 */
export function getNodeCenter(node: LayoutNode): Point {
    return {
        x: node.layoutPosition.x + node.width / 2,
        y: node.layoutPosition.y + node.height / 2,
    };
}

/**
 * Get connection points for a node (top, bottom, left, right centers)
 */
export function getNodeConnectionPoints(node: LayoutNode): {
    top: Point;
    bottom: Point;
    left: Point;
    right: Point;
    center: Point;
} {
    const center = getNodeCenter(node);
    return {
        top: { x: center.x, y: node.layoutPosition.y },
        bottom: { x: center.x, y: node.layoutPosition.y + node.height },
        left: { x: node.layoutPosition.x, y: center.y },
        right: { x: node.layoutPosition.x + node.width, y: center.y },
        center,
    };
}
