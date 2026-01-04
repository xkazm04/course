/**
 * useWorldCoordinator Hook
 *
 * A React hook that provides a unified interface for camera state and spatial queries.
 * Replaces the separate useUniverseCamera hook and SpatialIndex usage with a single
 * coordinated system.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
    WorldCoordinator,
    createWorldCoordinator,
    type WorldCoordinatorConfig,
    type VisibleBounds,
} from "./worldCoordinator";
import type { UniverseNode, CameraState, ZoomLevel, ViewportState } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface UseWorldCoordinatorOptions {
    initialX?: number;
    initialY?: number;
    initialScale?: number;
    config?: Partial<WorldCoordinatorConfig>;
}

export interface UseWorldCoordinatorReturn {
    // Coordinator instance (for advanced usage)
    coordinator: WorldCoordinator;

    // Camera state
    camera: CameraState;
    viewport: ViewportState;
    scale: number;
    zoomLevel: ZoomLevel;
    isAnimating: boolean;

    // Panning state
    isPanning: boolean;

    // Coordinate transforms
    screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
    worldToScreen: (worldX: number, worldY: number) => { x: number; y: number };
    worldRadiusToScreen: (worldRadius: number) => number;

    // Visibility queries
    getVisibleBounds: (margin?: number) => VisibleBounds;
    isNodeVisible: (node: UniverseNode, margin?: number) => boolean;

    // Spatial queries
    queryVisibleNodes: (zoomLevelFilter?: ZoomLevel) => UniverseNode[];
    findNodeAtScreenPosition: (screenX: number, screenY: number, hitMargin?: number) => UniverseNode | null;
    sortNodesByDepth: (nodes: UniverseNode[]) => UniverseNode[];
    buildIndex: (nodes: UniverseNode[]) => void;
    getStats: () => { nodeCount: number; depth: number; cellCount: number };

    // Camera controls
    pan: (deltaX: number, deltaY: number) => void;
    zoom: (delta: number, centerX?: number, centerY?: number) => void;
    zoomTo: (targetScale: number, x?: number, y?: number) => void;
    panTo: (x: number, y: number) => void;
    focusOn: (x: number, y: number, scale?: number) => void;
    reset: () => void;
    setZoomLevel: (level: ZoomLevel) => void;
    setViewport: (width: number, height: number) => void;

    // Event handlers (for easy binding to React elements)
    handleWheel: (e: WheelEvent | React.WheelEvent) => void;
    handlePanStart: (x: number, y: number) => void;
    handlePanMove: (x: number, y: number) => void;
    handlePanEnd: () => void;

    // Predictive viewport (for pan animations)
    getExpandedBounds: (velocityX: number, velocityY: number, expansionFactor?: number) => VisibleBounds;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useWorldCoordinator(
    options: UseWorldCoordinatorOptions = {}
): UseWorldCoordinatorReturn {
    const {
        initialX = 0,
        initialY = 0,
        initialScale = 0.5,
        config = {},
    } = options;

    // Create coordinator instance (stable reference)
    const coordinatorRef = useRef<WorldCoordinator | null>(null);
    if (!coordinatorRef.current) {
        coordinatorRef.current = createWorldCoordinator(config);
        coordinatorRef.current.setCameraImmediate(initialX, initialY, initialScale);
    }

    const coordinator = coordinatorRef.current;

    // Force re-render trigger
    const [, forceUpdate] = useState({});

    // Panning state (local to hook)
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef<{
        x: number;
        y: number;
        cameraX: number;
        cameraY: number;
    } | null>(null);

    // Subscribe to coordinator changes
    useEffect(() => {
        const unsubscribe = coordinator.subscribe(() => {
            forceUpdate({});
        });

        return () => {
            unsubscribe();
            coordinator.dispose();
        };
    }, [coordinator]);

    // ========================================================================
    // COORDINATE TRANSFORMS
    // ========================================================================

    const screenToWorld = useCallback(
        (screenX: number, screenY: number) => coordinator.screenToWorld(screenX, screenY),
        [coordinator]
    );

    const worldToScreen = useCallback(
        (worldX: number, worldY: number) => coordinator.worldToScreen(worldX, worldY),
        [coordinator]
    );

    const worldRadiusToScreen = useCallback(
        (worldRadius: number) => coordinator.worldRadiusToScreen(worldRadius),
        [coordinator]
    );

    // ========================================================================
    // VISIBILITY QUERIES
    // ========================================================================

    const getVisibleBounds = useCallback(
        (margin?: number) => coordinator.getVisibleBounds(margin),
        [coordinator]
    );

    const isNodeVisible = useCallback(
        (node: UniverseNode, margin?: number) => coordinator.isNodeVisible(node, margin),
        [coordinator]
    );

    // ========================================================================
    // SPATIAL QUERIES
    // ========================================================================

    const queryVisibleNodes = useCallback(
        (zoomLevelFilter?: ZoomLevel) => coordinator.queryVisibleNodes(zoomLevelFilter),
        [coordinator]
    );

    const findNodeAtScreenPosition = useCallback(
        (screenX: number, screenY: number, hitMargin?: number) =>
            coordinator.findNodeAtScreenPosition(screenX, screenY, hitMargin),
        [coordinator]
    );

    const sortNodesByDepth = useCallback(
        (nodes: UniverseNode[]) => coordinator.sortNodesByDepth(nodes),
        [coordinator]
    );

    const buildIndex = useCallback(
        (nodes: UniverseNode[]) => coordinator.buildIndex(nodes),
        [coordinator]
    );

    const getStats = useCallback(() => coordinator.getStats(), [coordinator]);

    // ========================================================================
    // CAMERA CONTROLS
    // ========================================================================

    const pan = useCallback(
        (deltaX: number, deltaY: number) => coordinator.pan(deltaX, deltaY),
        [coordinator]
    );

    const zoom = useCallback(
        (delta: number, centerX?: number, centerY?: number) =>
            coordinator.zoom(delta, centerX, centerY),
        [coordinator]
    );

    const zoomTo = useCallback(
        (targetScale: number, x?: number, y?: number) =>
            coordinator.zoomTo(targetScale, x, y),
        [coordinator]
    );

    const panTo = useCallback(
        (x: number, y: number) => coordinator.panTo(x, y),
        [coordinator]
    );

    const focusOn = useCallback(
        (x: number, y: number, scale?: number) => coordinator.focusOn(x, y, scale),
        [coordinator]
    );

    const reset = useCallback(
        () => coordinator.reset(initialX, initialY, initialScale),
        [coordinator, initialX, initialY, initialScale]
    );

    const setZoomLevel = useCallback(
        (level: ZoomLevel) => coordinator.setZoomLevel(level),
        [coordinator]
    );

    const setViewport = useCallback(
        (width: number, height: number) => coordinator.setViewport(width, height),
        [coordinator]
    );

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    const handleWheel = useCallback(
        (e: WheelEvent | React.WheelEvent) => {
            e.preventDefault();
            coordinator.zoom(e.deltaY);
        },
        [coordinator]
    );

    const handlePanStart = useCallback(
        (x: number, y: number) => {
            setIsPanning(true);
            panStartRef.current = {
                x,
                y,
                cameraX: coordinator.camera.x,
                cameraY: coordinator.camera.y,
            };
        },
        [coordinator]
    );

    const handlePanMove = useCallback(
        (x: number, y: number) => {
            const panStart = panStartRef.current;
            if (!panStart || !isPanning) return;

            const deltaX = x - panStart.x;
            const deltaY = y - panStart.y;

            // Calculate new camera position directly
            const scale = coordinator.camera.scale;
            const newX = panStart.cameraX - deltaX / scale;
            const newY = panStart.cameraY - deltaY / scale;

            coordinator.setCameraImmediate(newX, newY, scale);
        },
        [coordinator, isPanning]
    );

    const handlePanEnd = useCallback(() => {
        setIsPanning(false);
        panStartRef.current = null;
    }, []);

    // ========================================================================
    // PREDICTIVE VIEWPORT
    // ========================================================================

    const getExpandedBounds = useCallback(
        (velocityX: number, velocityY: number, expansionFactor?: number) =>
            coordinator.getExpandedBounds(velocityX, velocityY, expansionFactor),
        [coordinator]
    );

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        coordinator,
        camera: coordinator.camera,
        viewport: coordinator.viewport,
        scale: coordinator.scale,
        zoomLevel: coordinator.zoomLevel,
        isAnimating: coordinator.isAnimating(),
        isPanning,

        screenToWorld,
        worldToScreen,
        worldRadiusToScreen,

        getVisibleBounds,
        isNodeVisible,

        queryVisibleNodes,
        findNodeAtScreenPosition,
        sortNodesByDepth,
        buildIndex,
        getStats,

        pan,
        zoom,
        zoomTo,
        panTo,
        focusOn,
        reset,
        setZoomLevel,
        setViewport,

        handleWheel,
        handlePanStart,
        handlePanMove,
        handlePanEnd,

        getExpandedBounds,
    };
}
