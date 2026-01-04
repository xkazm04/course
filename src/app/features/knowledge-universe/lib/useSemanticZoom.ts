/**
 * useSemanticZoom Hook
 *
 * React hook that provides semantic zoom functionality, integrating the
 * SemanticZoomController with React component lifecycle and state management.
 *
 * This hook manages:
 * - Progressive data fetching based on zoom level
 * - Contextual tooltips and interaction affordances
 * - "You are here" breadcrumb navigation
 * - Coordination with WorldCoordinator for camera/spatial queries
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
    SemanticZoomController,
    createSemanticZoomController,
    type SemanticZoomControllerConfig,
    type NodeDetailData,
    type TooltipInfo,
    type BreadcrumbItem,
    type LearningContext,
    type ZoomLevelInteraction,
    type FetchState,
} from "./semanticZoomController";
import type { UniverseNode, ZoomLevel } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface UseSemanticZoomOptions {
    /** Initial zoom level */
    initialLevel?: ZoomLevel;
    /** All nodes in the universe (for hierarchy building) */
    nodes?: UniverseNode[];
    /** API function to fetch node details */
    fetchNodeDetails?: (nodeId: string, level: ZoomLevel) => Promise<NodeDetailData>;
    /** Callback when zoom level changes */
    onZoomLevelChange?: (newLevel: ZoomLevel, oldLevel: ZoomLevel) => void;
    /** Callback when focus changes */
    onFocusChange?: (node: UniverseNode | null, context: LearningContext) => void;
    /** Enable prefetching */
    prefetchEnabled?: boolean;
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
}

export interface UseSemanticZoomReturn {
    // Controller instance (for advanced usage)
    controller: SemanticZoomController;

    // Zoom level state
    currentLevel: ZoomLevel;
    previousLevel: ZoomLevel | null;
    transitionDirection: "zoom-in" | "zoom-out" | null;
    isTransitioning: boolean;

    // Learning context
    breadcrumbs: BreadcrumbItem[];
    focusedNode: UniverseNode | null;
    ancestors: UniverseNode[];
    suggestions: UniverseNode[];
    positionDescription: string;

    // Actions
    setZoomLevel: (level: ZoomLevel) => void;
    setFocusedNode: (node: UniverseNode | null) => void;
    navigateToBreadcrumb: (breadcrumbId: string) => { node: UniverseNode | null; zoomLevel: ZoomLevel };

    // Data fetching
    fetchNodeDetails: (nodeId: string) => Promise<NodeDetailData | undefined>;
    getNodeDetails: (nodeId: string) => NodeDetailData | undefined;
    getFetchState: (nodeId: string) => FetchState;
    clearCache: () => void;

    // Interaction affordances
    getTooltipContent: (node: UniverseNode) => TooltipInfo;
    getClickAction: (node: UniverseNode) => ZoomLevelInteraction["clickAction"];
    isHoverPreviewEnabled: () => boolean;
    getInteractionAffordances: (level: ZoomLevel) => ZoomLevelInteraction;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSemanticZoom(options: UseSemanticZoomOptions = {}): UseSemanticZoomReturn {
    const {
        initialLevel = "solar",
        nodes = [],
        fetchNodeDetails: fetchFn,
        onZoomLevelChange,
        onFocusChange,
        prefetchEnabled = true,
        cacheTTL = 5 * 60 * 1000,
    } = options;

    // Create controller configuration
    const configRef = useRef<SemanticZoomControllerConfig>({
        onFetchNodeDetails: fetchFn,
        onZoomLevelChange,
        onFocusChange,
        prefetchEnabled,
        cacheTTL,
    });

    // Create controller instance (stable reference)
    const controllerRef = useRef<SemanticZoomController | null>(null);
    if (!controllerRef.current) {
        controllerRef.current = createSemanticZoomController(configRef.current);
        // Set initial level
        if (initialLevel !== "solar") {
            controllerRef.current.setZoomLevel(initialLevel);
        }
    }

    const controller = controllerRef.current;

    // Force re-render trigger
    const [, forceUpdate] = useState({});

    // Update controller with nodes when they change
    useEffect(() => {
        controller.setNodes(nodes);
    }, [controller, nodes]);

    // Subscribe to controller changes
    useEffect(() => {
        const unsubscribe = controller.subscribe(() => {
            forceUpdate({});
        });

        return () => {
            unsubscribe();
            controller.dispose();
        };
    }, [controller]);

    // ========================================================================
    // ZOOM LEVEL ACTIONS
    // ========================================================================

    const setZoomLevel = useCallback(
        (level: ZoomLevel) => {
            controller.setZoomLevel(level);
        },
        [controller]
    );

    // ========================================================================
    // FOCUS ACTIONS
    // ========================================================================

    const setFocusedNode = useCallback(
        (node: UniverseNode | null) => {
            controller.setFocusedNode(node);
        },
        [controller]
    );

    const navigateToBreadcrumb = useCallback(
        (breadcrumbId: string) => {
            return controller.navigateToBreadcrumb(breadcrumbId);
        },
        [controller]
    );

    // ========================================================================
    // DATA FETCHING
    // ========================================================================

    const fetchDetails = useCallback(
        async (nodeId: string) => {
            return controller.fetchNodeDetails(nodeId);
        },
        [controller]
    );

    const getNodeDetails = useCallback(
        (nodeId: string) => {
            return controller.getNodeDetails(nodeId);
        },
        [controller]
    );

    const getFetchState = useCallback(
        (nodeId: string) => {
            return controller.getFetchState(nodeId);
        },
        [controller]
    );

    const clearCache = useCallback(() => {
        controller.clearCache();
    }, [controller]);

    // ========================================================================
    // INTERACTION AFFORDANCES
    // ========================================================================

    const getTooltipContent = useCallback(
        (node: UniverseNode) => {
            return controller.getTooltipContent(node);
        },
        [controller]
    );

    const getClickAction = useCallback(
        (node: UniverseNode) => {
            return controller.getClickAction(node);
        },
        [controller]
    );

    const isHoverPreviewEnabled = useCallback(() => {
        return controller.isHoverPreviewEnabled();
    }, [controller]);

    const getInteractionAffordances = useCallback(
        (level: ZoomLevel) => {
            return controller.getInteractionAffordances(level);
        },
        [controller]
    );

    // ========================================================================
    // MEMOIZED VALUES
    // ========================================================================

    const learningContext = controller.learningContext;

    const positionDescription = useMemo(() => {
        return controller.getPositionDescription();
    }, [controller, learningContext]);

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        controller,

        // Zoom level state
        currentLevel: controller.currentLevel,
        previousLevel: controller.previousLevel,
        transitionDirection: controller.transitionDirection,
        isTransitioning: controller.isTransitioning,

        // Learning context
        breadcrumbs: learningContext.breadcrumbs,
        focusedNode: learningContext.focusedNode,
        ancestors: learningContext.ancestors,
        suggestions: learningContext.suggestions,
        positionDescription,

        // Actions
        setZoomLevel,
        setFocusedNode,
        navigateToBreadcrumb,

        // Data fetching
        fetchNodeDetails: fetchDetails,
        getNodeDetails,
        getFetchState,
        clearCache,

        // Interaction affordances
        getTooltipContent,
        getClickAction,
        isHoverPreviewEnabled,
        getInteractionAffordances,
    };
}
