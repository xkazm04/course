/**
 * Territory Zoom Hook
 *
 * Manages zoom state, navigation, and viewport calculations
 * for the territory map visualization.
 */

"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import type {
    TerritoryNode,
    TerritoryZoomState,
    BreadcrumbItem,
    TerritoryLevel,
    INITIAL_ZOOM_STATE,
} from "./territoryTypes";
import { computeHierarchicalLayout, getVisibleDepth } from "./treemapLayout";
import { DEFAULT_LAYOUT_CONFIG } from "./territoryTypes";

// ============================================================================
// TYPES
// ============================================================================

export interface TerritoryZoomConfig {
    minScale: number;
    maxScale: number;
    zoomSpeed: number;
    panSpeed: number;
    animationDuration: number;
}

export const DEFAULT_ZOOM_CONFIG: TerritoryZoomConfig = {
    minScale: 0.5,
    maxScale: 20,
    zoomSpeed: 0.002,
    panSpeed: 1,
    animationDuration: 300,
};

export interface ViewportInfo {
    width: number;
    height: number;
    worldX: number;
    worldY: number;
    worldWidth: number;
    worldHeight: number;
    scale: number;
}

// ============================================================================
// HOOK
// ============================================================================

export function useTerritoryZoom(
    rootNode: TerritoryNode | null,
    containerWidth: number,
    containerHeight: number,
    config: TerritoryZoomConfig = DEFAULT_ZOOM_CONFIG
) {
    // State
    const [scale, setScale] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);

    // Animation ref
    const animationRef = useRef<number | null>(null);

    // Computed layout
    const layoutRoot = useMemo(() => {
        if (!rootNode || containerWidth === 0 || containerHeight === 0) return null;

        return computeHierarchicalLayout(
            rootNode,
            { x: 0, y: 0, width: containerWidth, height: containerHeight },
            DEFAULT_LAYOUT_CONFIG
        );
    }, [rootNode, containerWidth, containerHeight]);

    // Viewport info
    const viewport: ViewportInfo = useMemo(() => ({
        width: containerWidth,
        height: containerHeight,
        worldX: -offsetX / scale,
        worldY: -offsetY / scale,
        worldWidth: containerWidth / scale,
        worldHeight: containerHeight / scale,
        scale,
    }), [containerWidth, containerHeight, offsetX, offsetY, scale]);

    // Visible depth based on scale
    const visibleDepth = useMemo(() => getVisibleDepth(scale), [scale]);

    // Current zoom level name
    const currentLevel: TerritoryLevel = useMemo(() => {
        if (scale < 1.5) return "world";
        if (scale < 3) return "domain";
        if (scale < 6) return "topic";
        if (scale < 12) return "skill";
        return "lesson";
    }, [scale]);

    // ========================================================================
    // ZOOM CONTROLS
    // ========================================================================

    const handleWheel = useCallback((e: WheelEvent, mouseX: number, mouseY: number) => {
        e.preventDefault();

        const delta = -e.deltaY * config.zoomSpeed;
        const newScale = Math.max(
            config.minScale,
            Math.min(config.maxScale, scale * (1 + delta))
        );

        if (newScale === scale) return;

        // Zoom toward mouse position
        const worldX = (mouseX - offsetX) / scale;
        const worldY = (mouseY - offsetY) / scale;

        const newOffsetX = mouseX - worldX * newScale;
        const newOffsetY = mouseY - worldY * newScale;

        setScale(newScale);
        setOffsetX(newOffsetX);
        setOffsetY(newOffsetY);
    }, [scale, offsetX, offsetY, config]);

    const handlePan = useCallback((deltaX: number, deltaY: number) => {
        setOffsetX((prev) => prev + deltaX * config.panSpeed);
        setOffsetY((prev) => prev + deltaY * config.panSpeed);
    }, [config.panSpeed]);

    // ========================================================================
    // NAVIGATION
    // ========================================================================

    /**
     * Find a node by ID in the hierarchy
     */
    const findNode = useCallback((nodeId: string, node: TerritoryNode | null = layoutRoot): TerritoryNode | null => {
        if (!node) return null;
        if (node.id === nodeId) return node;

        for (const child of node.children) {
            const found = findNode(nodeId, child);
            if (found) return found;
        }

        return null;
    }, [layoutRoot]);

    /**
     * Get path from root to a node
     */
    const getPathToNode = useCallback((nodeId: string): BreadcrumbItem[] => {
        const path: BreadcrumbItem[] = [];

        const traverse = (node: TerritoryNode | null, currentPath: BreadcrumbItem[]): boolean => {
            if (!node) return false;

            const newPath = [...currentPath, { id: node.id, label: node.label, level: node.level }];

            if (node.id === nodeId) {
                path.push(...newPath);
                return true;
            }

            for (const child of node.children) {
                if (traverse(child, newPath)) return true;
            }

            return false;
        };

        traverse(layoutRoot, []);
        return path;
    }, [layoutRoot]);

    /**
     * Animate to a specific node
     */
    const zoomToNode = useCallback((nodeId: string, immediate = false) => {
        const targetNode = findNode(nodeId);
        if (!targetNode) return;

        // Calculate target scale to make node fill ~60% of viewport
        const targetCoverage = 0.6;
        const scaleX = (containerWidth * targetCoverage) / targetNode.width;
        const scaleY = (containerHeight * targetCoverage) / targetNode.height;
        const targetScale = Math.min(scaleX, scaleY, config.maxScale);

        // Calculate target offset to center the node
        const nodeCenterX = targetNode.x + targetNode.width / 2;
        const nodeCenterY = targetNode.y + targetNode.height / 2;
        const targetOffsetX = containerWidth / 2 - nodeCenterX * targetScale;
        const targetOffsetY = containerHeight / 2 - nodeCenterY * targetScale;

        // Update breadcrumb
        const newBreadcrumb = getPathToNode(nodeId);
        setBreadcrumb(newBreadcrumb);
        setFocusNodeId(nodeId);

        if (immediate) {
            setScale(targetScale);
            setOffsetX(targetOffsetX);
            setOffsetY(targetOffsetY);
            return;
        }

        // Animate
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        const startScale = scale;
        const startOffsetX = offsetX;
        const startOffsetY = offsetY;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(1, elapsed / config.animationDuration);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);

            setScale(startScale + (targetScale - startScale) * eased);
            setOffsetX(startOffsetX + (targetOffsetX - startOffsetX) * eased);
            setOffsetY(startOffsetY + (targetOffsetY - startOffsetY) * eased);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [findNode, getPathToNode, containerWidth, containerHeight, scale, offsetX, offsetY, config]);

    /**
     * Zoom out one level
     */
    const zoomOut = useCallback(() => {
        if (breadcrumb.length <= 1) {
            // Reset to initial view
            setScale(1);
            setOffsetX(0);
            setOffsetY(0);
            setBreadcrumb([]);
            setFocusNodeId(null);
            return;
        }

        // Go to parent
        const parentItem = breadcrumb[breadcrumb.length - 2];
        zoomToNode(parentItem.id);
    }, [breadcrumb, zoomToNode]);

    /**
     * Reset to initial view
     */
    const reset = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        const startScale = scale;
        const startOffsetX = offsetX;
        const startOffsetY = offsetY;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(1, elapsed / config.animationDuration);
            const eased = 1 - Math.pow(1 - progress, 3);

            setScale(startScale + (1 - startScale) * eased);
            setOffsetX(startOffsetX * (1 - eased));
            setOffsetY(startOffsetY * (1 - eased));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
        setBreadcrumb([]);
        setFocusNodeId(null);
    }, [scale, offsetX, offsetY, config.animationDuration]);

    // ========================================================================
    // COORDINATE TRANSFORMS
    // ========================================================================

    /**
     * Convert screen coordinates to world coordinates
     */
    const screenToWorld = useCallback((screenX: number, screenY: number) => ({
        x: (screenX - offsetX) / scale,
        y: (screenY - offsetY) / scale,
    }), [scale, offsetX, offsetY]);

    /**
     * Convert world coordinates to screen coordinates
     */
    const worldToScreen = useCallback((worldX: number, worldY: number) => ({
        x: worldX * scale + offsetX,
        y: worldY * scale + offsetY,
    }), [scale, offsetX, offsetY]);

    // ========================================================================
    // CLEANUP
    // ========================================================================

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return {
        // State
        scale,
        offsetX,
        offsetY,
        focusNodeId,
        breadcrumb,
        viewport,
        visibleDepth,
        currentLevel,

        // Layout
        layoutRoot,

        // Controls
        handleWheel,
        handlePan,
        zoomToNode,
        zoomOut,
        reset,

        // Transforms
        screenToWorld,
        worldToScreen,

        // Utilities
        findNode,
    };
}
