"use client";

/**
 * useSceneGraph Hook
 *
 * Unified Scene Graph abstraction that combines hierarchical position (navigation)
 * with viewport position (pan/zoom) into a single coherent state model.
 *
 * This enables:
 * - Animated transitions between hierarchy levels that maintain spatial context
 * - Semantic zoom where drilling down feels like zooming in
 * - Declarative state management instead of imperative coordination
 * - Reduced state synchronization bugs
 *
 * The SceneGraph represents "where you are looking in the knowledge space" as a
 * single concept, unifying the previously separate NavigationState and ViewportState.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type {
    NavigationState,
    ViewportState,
    BreadcrumbItem,
    MapNode,
    MapConnection,
    KnowledgeMapData,
    NodeLevel,
    Point,
} from "./types";
import { getNodeChildren, getVisibleConnections, getNodeAncestors } from "./mapData";

// ============================================================================
// SCENE GRAPH TYPES
// ============================================================================

/**
 * Transition type for animated movements in the scene graph
 */
export type SceneTransitionType =
    | "drill_down"      // Zooming into a node's children
    | "drill_up"        // Zooming out to parent level
    | "pan"             // Moving within current level
    | "zoom"            // Scaling current view
    | "focus"           // Centering on a specific node
    | "reset"           // Returning to initial state
    | "instant";        // No animation

/**
 * Configuration for scene transitions
 */
export interface SceneTransitionConfig {
    /** Type of transition */
    type: SceneTransitionType;
    /** Duration in milliseconds */
    duration: number;
    /** Easing function name */
    easing: "ease-out" | "ease-in-out" | "spring";
    /** Whether to maintain spatial context during transition */
    preserveContext: boolean;
}

/**
 * Unified Scene Graph State
 * Combines hierarchical position with viewport position
 */
export interface SceneGraphState {
    // Navigation (hierarchical position)
    /** Stack of parent node IDs (breadcrumb trail) */
    viewStack: string[];
    /** Current view's parent node ID (null = root/domains view) */
    currentParentId: string | null;
    /** Currently selected node for details panel */
    selectedNodeId: string | null;
    /** Current hierarchy level depth (0 = root/domains) */
    depth: number;

    // Viewport (spatial position)
    /** Current zoom scale (0.5 to 2.0) */
    scale: number;
    /** X offset for panning */
    offsetX: number;
    /** Y offset for panning */
    offsetY: number;

    // Transition state
    /** Whether a transition is currently in progress */
    isTransitioning: boolean;
    /** Current transition configuration */
    currentTransition: SceneTransitionConfig | null;
    /** Previous state for animated transitions */
    previousState: {
        depth: number;
        scale: number;
        offsetX: number;
        offsetY: number;
    } | null;
}

/**
 * Default transition configurations for different scene changes
 */
export const TRANSITION_CONFIGS: Record<SceneTransitionType, SceneTransitionConfig> = {
    drill_down: {
        type: "drill_down",
        duration: 400,
        easing: "spring",
        preserveContext: true,
    },
    drill_up: {
        type: "drill_up",
        duration: 350,
        easing: "spring",
        preserveContext: true,
    },
    pan: {
        type: "pan",
        duration: 0,
        easing: "ease-out",
        preserveContext: true,
    },
    zoom: {
        type: "zoom",
        duration: 100,
        easing: "ease-out",
        preserveContext: true,
    },
    focus: {
        type: "focus",
        duration: 300,
        easing: "ease-in-out",
        preserveContext: false,
    },
    reset: {
        type: "reset",
        duration: 250,
        easing: "ease-out",
        preserveContext: false,
    },
    instant: {
        type: "instant",
        duration: 0,
        easing: "ease-out",
        preserveContext: false,
    },
};

// Viewport constraints
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const ZOOM_SPEED = 0.002;

// Scale adjustments for semantic zoom
const SEMANTIC_ZOOM_SCALE_FACTOR = 0.85; // Scale multiplier per level depth

/**
 * Default initial scene graph state
 */
const DEFAULT_STATE: SceneGraphState = {
    // Navigation
    viewStack: [],
    currentParentId: null,
    selectedNodeId: null,
    depth: 0,

    // Viewport
    scale: 1,
    offsetX: 0,
    offsetY: 0,

    // Transition
    isTransitioning: false,
    currentTransition: null,
    previousState: null,
};

// ============================================================================
// HOOK OPTIONS AND RETURN TYPES
// ============================================================================

export interface UseSceneGraphOptions {
    /** Initial parent node to start at (null = root/domains) */
    initialParentId?: string | null;
    /** Initial viewport state */
    initialViewport?: Partial<ViewportState>;
    /** Callback when scene graph changes */
    onSceneChange?: (state: SceneGraphState) => void;
    /** Enable semantic zoom (scale adjusts with depth) */
    enableSemanticZoom?: boolean;
}

export interface UseSceneGraphReturn {
    /** Current scene graph state */
    scene: SceneGraphState;

    // Computed values from data
    /** Visible nodes at current level */
    visibleNodes: MapNode[];
    /** Visible connections between current nodes */
    visibleConnections: MapConnection[];
    /** Breadcrumb items for navigation */
    breadcrumbItems: BreadcrumbItem[];
    /** Currently selected node */
    selectedNode: MapNode | null;
    /** Current parent node (null at root) */
    currentParent: MapNode | null;
    /** Current level (domain, course, chapter, section, concept) */
    currentLevel: NodeLevel | "root";

    // Navigation actions (hierarchical)
    /** Drill down into a node (show its children) */
    drillDown: (nodeId: string) => void;
    /** Drill up to a previous level (index in breadcrumb, -1 for root) */
    drillUp: (toIndex?: number) => void;
    /** Navigate to show a node's parent level */
    navigateToNodeParent: (nodeId: string) => void;
    /** Select a node for details panel */
    selectNode: (nodeId: string | null) => void;
    /** Reset to initial state */
    reset: () => void;

    // Viewport actions (spatial)
    /** Pan by delta */
    panBy: (deltaX: number, deltaY: number) => void;
    /** Zoom by delta at a point */
    zoomBy: (delta: number, centerX: number, centerY: number) => void;
    /** Zoom to a specific scale at a point */
    zoomTo: (scale: number, centerX?: number, centerY?: number) => void;
    /** Focus on a specific node */
    focusOnNode: (nodeId: string, scale?: number) => void;

    // Gesture handlers
    handlers: {
        onPointerDown: (e: React.PointerEvent) => void;
        onPointerMove: (e: React.PointerEvent) => void;
        onPointerUp: (e: React.PointerEvent) => void;
        onPointerLeave: (e: React.PointerEvent) => void;
        onWheel: (e: React.WheelEvent) => void;
    };

    // State flags
    isPanning: boolean;
    isTransitioning: boolean;

    // Transition info for animations
    transition: SceneTransitionConfig | null;
    previousState: SceneGraphState["previousState"];

    // Legacy compatibility (deprecated, use scene directly)
    /** @deprecated Use scene.viewStack, scene.currentParentId, scene.selectedNodeId */
    navigation: NavigationState;
    /** @deprecated Use scene.scale, scene.offsetX, scene.offsetY */
    viewport: ViewportState;
    /** @deprecated Use reset() */
    resetViewport: () => void;
    /** @deprecated Use reset() */
    resetNavigation: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Unified Scene Graph Hook
 *
 * Combines navigation and viewport into a single state model with
 * animated transitions and semantic zoom support.
 */
export function useSceneGraph(
    data: KnowledgeMapData,
    options: UseSceneGraphOptions = {}
): UseSceneGraphReturn {
    const {
        initialParentId = null,
        initialViewport,
        onSceneChange,
        enableSemanticZoom = true,
    } = options;

    // Calculate initial depth based on initial parent
    const initialDepth = useMemo(() => {
        if (!initialParentId) return 0;
        const ancestors = getNodeAncestors(data, initialParentId);
        return ancestors.length;
    }, [data, initialParentId]);

    // Build initial state
    const initialState = useMemo((): SceneGraphState => ({
        ...DEFAULT_STATE,
        viewStack: initialParentId ? [initialParentId] : [],
        currentParentId: initialParentId,
        depth: initialDepth,
        ...(initialViewport && {
            scale: initialViewport.scale ?? DEFAULT_STATE.scale,
            offsetX: initialViewport.offsetX ?? DEFAULT_STATE.offsetX,
            offsetY: initialViewport.offsetY ?? DEFAULT_STATE.offsetY,
        }),
    }), [initialParentId, initialDepth, initialViewport]);

    // Scene graph state
    const [scene, setScene] = useState<SceneGraphState>(initialState);

    // Panning state
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef<Point | null>(null);
    const sceneRef = useRef<SceneGraphState>(scene);

    // Keep ref in sync
    useEffect(() => {
        sceneRef.current = scene;
    }, [scene]);

    // Transition timeout ref
    const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Helper to update scene with transition
    const updateScene = useCallback(
        (
            updater: (prev: SceneGraphState) => Partial<SceneGraphState>,
            transitionType: SceneTransitionType = "instant"
        ) => {
            setScene((prev) => {
                const updates = updater(prev);
                const transition = TRANSITION_CONFIGS[transitionType];

                const newState: SceneGraphState = {
                    ...prev,
                    ...updates,
                    isTransitioning: transition.duration > 0,
                    currentTransition: transition.duration > 0 ? transition : null,
                    previousState: transition.preserveContext
                        ? {
                            depth: prev.depth,
                            scale: prev.scale,
                            offsetX: prev.offsetX,
                            offsetY: prev.offsetY,
                        }
                        : null,
                };

                // Schedule end of transition
                if (transition.duration > 0) {
                    if (transitionTimeoutRef.current) {
                        clearTimeout(transitionTimeoutRef.current);
                    }
                    transitionTimeoutRef.current = setTimeout(() => {
                        setScene((s) => ({
                            ...s,
                            isTransitioning: false,
                            currentTransition: null,
                            previousState: null,
                        }));
                    }, transition.duration);
                }

                onSceneChange?.(newState);
                return newState;
            });
        },
        [onSceneChange]
    );

    // Cleanup transition timeout on unmount
    useEffect(() => {
        return () => {
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
        };
    }, []);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    // Compute visible nodes at current level
    const visibleNodes = useMemo(() => {
        return getNodeChildren(data, scene.currentParentId);
    }, [data, scene.currentParentId]);

    // Compute visible connections
    const visibleConnections = useMemo(() => {
        const visibleIds = new Set(visibleNodes.map((n) => n.id));
        return getVisibleConnections(data, visibleIds);
    }, [data, visibleNodes]);

    // Compute breadcrumb items
    const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [
            { nodeId: null, label: "Domains", level: "root" },
        ];

        scene.viewStack.forEach((nodeId) => {
            const node = data.nodes.get(nodeId);
            if (node) {
                items.push({
                    nodeId: node.id,
                    label: node.name,
                    level: node.level,
                });
            }
        });

        return items;
    }, [data, scene.viewStack]);

    // Get selected node
    const selectedNode = useMemo(() => {
        if (!scene.selectedNodeId) return null;
        return data.nodes.get(scene.selectedNodeId) || null;
    }, [data, scene.selectedNodeId]);

    // Get current parent node
    const currentParent = useMemo(() => {
        if (!scene.currentParentId) return null;
        return data.nodes.get(scene.currentParentId) || null;
    }, [data, scene.currentParentId]);

    // Determine current level
    const currentLevel = useMemo((): NodeLevel | "root" => {
        if (!currentParent) return "root";
        const levelMap: Record<NodeLevel, NodeLevel> = {
            domain: "course",
            course: "chapter",
            chapter: "section",
            section: "concept",
            concept: "concept", // Leaf level
        };
        return levelMap[currentParent.level] || "root";
    }, [currentParent]);

    // ========================================================================
    // NAVIGATION ACTIONS
    // ========================================================================

    // Drill down into a node
    const drillDown = useCallback(
        (nodeId: string) => {
            const node = data.nodes.get(nodeId);
            if (!node || node.childIds.length === 0) {
                // Can't drill into nodes without children - select instead
                updateScene(
                    () => ({ selectedNodeId: nodeId }),
                    "instant"
                );
                return;
            }

            // Calculate semantic zoom scale for new depth
            const newDepth = scene.depth + 1;
            const semanticScale = enableSemanticZoom
                ? Math.pow(SEMANTIC_ZOOM_SCALE_FACTOR, newDepth - 1)
                : 1;

            updateScene(
                (prev) => ({
                    viewStack: [...prev.viewStack, nodeId],
                    currentParentId: nodeId,
                    selectedNodeId: null,
                    depth: newDepth,
                    // Reset viewport with semantic zoom
                    scale: semanticScale,
                    offsetX: 0,
                    offsetY: 0,
                }),
                "drill_down"
            );
        },
        [data, scene.depth, enableSemanticZoom, updateScene]
    );

    // Drill up to a previous level
    const drillUp = useCallback(
        (toIndex?: number) => {
            const targetIndex = toIndex ?? scene.viewStack.length - 2;

            if (targetIndex < 0) {
                // Go to root
                updateScene(
                    () => ({
                        viewStack: [],
                        currentParentId: null,
                        selectedNodeId: null,
                        depth: 0,
                        scale: 1,
                        offsetX: 0,
                        offsetY: 0,
                    }),
                    "drill_up"
                );
                return;
            }

            const newStack = scene.viewStack.slice(0, targetIndex + 1);
            const newDepth = newStack.length;
            const semanticScale = enableSemanticZoom
                ? Math.pow(SEMANTIC_ZOOM_SCALE_FACTOR, newDepth - 1)
                : 1;

            updateScene(
                () => ({
                    viewStack: newStack,
                    currentParentId: newStack[newStack.length - 1] || null,
                    selectedNodeId: null,
                    depth: newDepth,
                    scale: Math.max(semanticScale, 1), // Don't zoom out past 1
                    offsetX: 0,
                    offsetY: 0,
                }),
                "drill_up"
            );
        },
        [scene.viewStack, enableSemanticZoom, updateScene]
    );

    // Navigate to a node's parent level
    const navigateToNodeParent = useCallback(
        (nodeId: string) => {
            const node = data.nodes.get(nodeId);
            if (!node) return;

            const ancestors = getNodeAncestors(data, nodeId);
            const pathToParent = ancestors.slice(0, -1);

            if (pathToParent.length === 0) {
                // Node is at root level
                updateScene(
                    () => ({
                        viewStack: [],
                        currentParentId: null,
                        selectedNodeId: nodeId,
                        depth: 0,
                        scale: 1,
                        offsetX: 0,
                        offsetY: 0,
                    }),
                    "focus"
                );
            } else {
                const viewStack = pathToParent.map((n) => n.id);
                const newDepth = viewStack.length;
                const semanticScale = enableSemanticZoom
                    ? Math.pow(SEMANTIC_ZOOM_SCALE_FACTOR, newDepth - 1)
                    : 1;

                updateScene(
                    () => ({
                        viewStack,
                        currentParentId: viewStack[viewStack.length - 1],
                        selectedNodeId: nodeId,
                        depth: newDepth,
                        scale: Math.max(semanticScale, 1),
                        offsetX: 0,
                        offsetY: 0,
                    }),
                    "focus"
                );
            }
        },
        [data, enableSemanticZoom, updateScene]
    );

    // Select a node
    const selectNode = useCallback(
        (nodeId: string | null) => {
            updateScene(() => ({ selectedNodeId: nodeId }), "instant");
        },
        [updateScene]
    );

    // Reset to initial state
    const reset = useCallback(() => {
        updateScene(() => initialState, "reset");
    }, [initialState, updateScene]);

    // ========================================================================
    // VIEWPORT ACTIONS
    // ========================================================================

    // Pan by delta
    const panBy = useCallback(
        (deltaX: number, deltaY: number) => {
            updateScene(
                (prev) => ({
                    offsetX: prev.offsetX - deltaX / prev.scale,
                    offsetY: prev.offsetY - deltaY / prev.scale,
                }),
                "pan"
            );
        },
        [updateScene]
    );

    // Zoom by delta at a center point
    const zoomBy = useCallback(
        (delta: number, centerX: number, centerY: number) => {
            const currentScale = sceneRef.current.scale;
            const newScale = Math.max(
                MIN_SCALE,
                Math.min(MAX_SCALE, currentScale - delta * ZOOM_SPEED)
            );

            if (newScale === currentScale) return;

            const scaleFactor = newScale / currentScale;
            const newOffsetX =
                centerX - (centerX - sceneRef.current.offsetX) * scaleFactor;
            const newOffsetY =
                centerY - (centerY - sceneRef.current.offsetY) * scaleFactor;

            updateScene(
                () => ({
                    scale: newScale,
                    offsetX: newOffsetX,
                    offsetY: newOffsetY,
                }),
                "zoom"
            );
        },
        [updateScene]
    );

    // Zoom to a specific scale
    const zoomTo = useCallback(
        (scale: number, centerX?: number, centerY?: number) => {
            const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
            const cx = centerX ?? 0;
            const cy = centerY ?? 0;

            const currentScale = sceneRef.current.scale;
            const scaleFactor = newScale / currentScale;
            const newOffsetX =
                cx - (cx - sceneRef.current.offsetX) * scaleFactor;
            const newOffsetY =
                cy - (cy - sceneRef.current.offsetY) * scaleFactor;

            updateScene(
                () => ({
                    scale: newScale,
                    offsetX: newOffsetX,
                    offsetY: newOffsetY,
                }),
                "zoom"
            );
        },
        [updateScene]
    );

    // Focus on a specific node (pan to center it)
    const focusOnNode = useCallback(
        (nodeId: string, targetScale?: number) => {
            const node = visibleNodes.find((n) => n.id === nodeId);
            if (!node?.position) return;

            // TODO: Calculate offset to center the node
            // This would need container dimensions
            updateScene(
                (prev) => ({
                    selectedNodeId: nodeId,
                    scale: targetScale ?? prev.scale,
                    // Offset calculation would go here
                }),
                "focus"
            );
        },
        [visibleNodes, updateScene]
    );

    // ========================================================================
    // GESTURE HANDLERS
    // ========================================================================

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (e.button !== 0) return;
        panStartRef.current = { x: e.clientX, y: e.clientY };
        setIsPanning(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!isPanning || !panStartRef.current) return;

            const deltaX = e.clientX - panStartRef.current.x;
            const deltaY = e.clientY - panStartRef.current.y;

            panStartRef.current = { x: e.clientX, y: e.clientY };
            panBy(deltaX, deltaY);
        },
        [isPanning, panBy]
    );

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        setIsPanning(false);
        panStartRef.current = null;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    const handlePointerLeave = useCallback(() => {
        if (isPanning) {
            setIsPanning(false);
            panStartRef.current = null;
        }
    }, [isPanning]);

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            e.preventDefault();
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            const centerX = e.clientX - rect.left;
            const centerY = e.clientY - rect.top;
            zoomBy(e.deltaY, centerX, centerY);
        },
        [zoomBy]
    );

    // ========================================================================
    // LEGACY COMPATIBILITY
    // ========================================================================

    const navigation: NavigationState = useMemo(
        () => ({
            viewStack: scene.viewStack,
            currentParentId: scene.currentParentId,
            selectedNodeId: scene.selectedNodeId,
        }),
        [scene.viewStack, scene.currentParentId, scene.selectedNodeId]
    );

    const viewport: ViewportState = useMemo(
        () => ({
            scale: scene.scale,
            offsetX: scene.offsetX,
            offsetY: scene.offsetY,
        }),
        [scene.scale, scene.offsetX, scene.offsetY]
    );

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        scene,

        // Computed
        visibleNodes,
        visibleConnections,
        breadcrumbItems,
        selectedNode,
        currentParent,
        currentLevel,

        // Navigation actions
        drillDown,
        drillUp,
        navigateToNodeParent,
        selectNode,
        reset,

        // Viewport actions
        panBy,
        zoomBy,
        zoomTo,
        focusOnNode,

        // Handlers
        handlers: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerLeave: handlePointerLeave,
            onWheel: handleWheel,
        },

        // State flags
        isPanning,
        isTransitioning: scene.isTransitioning,

        // Transition info
        transition: scene.currentTransition,
        previousState: scene.previousState,

        // Legacy compatibility
        navigation,
        viewport,
        resetViewport: reset,
        resetNavigation: reset,
    };
}
