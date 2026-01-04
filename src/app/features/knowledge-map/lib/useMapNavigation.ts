"use client";

/**
 * useMapNavigation Hook
 *
 * Manages drill-down navigation state for the knowledge map.
 * Handles view stack, breadcrumb generation, and visible node computation.
 */

import { useState, useCallback, useMemo } from "react";
import type {
    NavigationState,
    BreadcrumbItem,
    MapNode,
    MapConnection,
    KnowledgeMapData,
} from "./types";
import { getNodeChildren, getVisibleConnections, getNodeAncestors } from "./mapData";

export interface UseMapNavigationOptions {
    /** Initial parent node to start at (null = root/domains) */
    initialParentId?: string | null;
    /** Callback when navigation changes */
    onNavigationChange?: (state: NavigationState) => void;
}

export interface UseMapNavigationReturn {
    /** Current navigation state */
    navigation: NavigationState;
    /** Visible nodes at current level */
    visibleNodes: MapNode[];
    /** Visible connections between current nodes */
    visibleConnections: MapConnection[];
    /** Breadcrumb items for navigation */
    breadcrumbItems: BreadcrumbItem[];
    /** Drill down into a node (show its children) */
    drillDown: (nodeId: string) => void;
    /** Drill up to a previous level (index in breadcrumb, -1 for root) */
    drillUp: (toIndex?: number) => void;
    /** Navigate to show a node's parent level (replaces navigation, doesn't add) */
    navigateToNodeParent: (nodeId: string) => void;
    /** Select a node for details panel */
    selectNode: (nodeId: string | null) => void;
    /** Reset to root level */
    resetNavigation: () => void;
    /** Currently selected node */
    selectedNode: MapNode | null;
    /** Current parent node (null at root) */
    currentParent: MapNode | null;
    /** Current hierarchy level depth (0 = root/domains) */
    currentDepth: number;
}

/**
 * Hook for managing knowledge map navigation
 */
export function useMapNavigation(
    data: KnowledgeMapData,
    options: UseMapNavigationOptions = {}
): UseMapNavigationReturn {
    const { initialParentId = null, onNavigationChange } = options;

    // Navigation state
    const [navigation, setNavigation] = useState<NavigationState>({
        viewStack: initialParentId ? [initialParentId] : [],
        currentParentId: initialParentId,
        selectedNodeId: null,
    });

    // Update navigation with callback
    const updateNavigation = useCallback(
        (newState: NavigationState) => {
            setNavigation(newState);
            onNavigationChange?.(newState);
        },
        [onNavigationChange]
    );

    // Compute visible nodes at current level
    const visibleNodes = useMemo(() => {
        return getNodeChildren(data, navigation.currentParentId);
    }, [data, navigation.currentParentId]);

    // Compute visible connections
    const visibleConnections = useMemo(() => {
        const visibleIds = new Set(visibleNodes.map(n => n.id));
        return getVisibleConnections(data, visibleIds);
    }, [data, visibleNodes]);

    // Compute breadcrumb items
    const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [
            { nodeId: null, label: "Domains", level: "root" },
        ];

        // Add ancestors from view stack
        navigation.viewStack.forEach(nodeId => {
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
    }, [data, navigation.viewStack]);

    // Drill down into a node
    const drillDown = useCallback(
        (nodeId: string) => {
            const node = data.nodes.get(nodeId);
            if (!node || node.childIds.length === 0) {
                // Can't drill into nodes without children
                // Instead, select it
                updateNavigation({
                    ...navigation,
                    selectedNodeId: nodeId,
                });
                return;
            }

            updateNavigation({
                viewStack: [...navigation.viewStack, nodeId],
                currentParentId: nodeId,
                selectedNodeId: null, // Clear selection when drilling
            });
        },
        [data, navigation, updateNavigation]
    );

    // Drill up to a previous level
    const drillUp = useCallback(
        (toIndex?: number) => {
            const targetIndex = toIndex ?? navigation.viewStack.length - 2;

            if (targetIndex < 0) {
                // Go to root
                updateNavigation({
                    viewStack: [],
                    currentParentId: null,
                    selectedNodeId: null,
                });
                return;
            }

            const newStack = navigation.viewStack.slice(0, targetIndex + 1);
            updateNavigation({
                viewStack: newStack,
                currentParentId: newStack[newStack.length - 1] || null,
                selectedNodeId: null,
            });
        },
        [navigation, updateNavigation]
    );

    // Navigate directly to show a node's parent level (replaces entire navigation)
    // This builds the path from root to the node's parent and sets it as the view
    const navigateToNodeParent = useCallback(
        (nodeId: string) => {
            const node = data.nodes.get(nodeId);
            if (!node) return;

            // Build path from root to this node's parent
            const ancestors = getNodeAncestors(data, nodeId);

            // ancestors includes the node itself, we want to navigate to its parent level
            // So if node is at depth 2, we want viewStack = [depth0, depth1] to show depth2 nodes
            // Remove the node itself from ancestors to get the path to parent
            const pathToParent = ancestors.slice(0, -1);

            if (pathToParent.length === 0) {
                // Node is at root level (domain), navigate to root
                updateNavigation({
                    viewStack: [],
                    currentParentId: null,
                    selectedNodeId: nodeId, // Select this node
                });
            } else {
                // Navigate to parent level
                const viewStack = pathToParent.map(n => n.id);
                updateNavigation({
                    viewStack,
                    currentParentId: viewStack[viewStack.length - 1],
                    selectedNodeId: nodeId, // Select the clicked node
                });
            }
        },
        [data, updateNavigation]
    );

    // Select a node for details panel
    const selectNode = useCallback(
        (nodeId: string | null) => {
            updateNavigation({
                ...navigation,
                selectedNodeId: nodeId,
            });
        },
        [navigation, updateNavigation]
    );

    // Reset to root level
    const resetNavigation = useCallback(() => {
        updateNavigation({
            viewStack: [],
            currentParentId: null,
            selectedNodeId: null,
        });
    }, [updateNavigation]);

    // Get selected node
    const selectedNode = useMemo(() => {
        if (!navigation.selectedNodeId) return null;
        return data.nodes.get(navigation.selectedNodeId) || null;
    }, [data, navigation.selectedNodeId]);

    // Get current parent node
    const currentParent = useMemo(() => {
        if (!navigation.currentParentId) return null;
        return data.nodes.get(navigation.currentParentId) || null;
    }, [data, navigation.currentParentId]);

    // Current depth (0 = root)
    const currentDepth = navigation.viewStack.length;

    return {
        navigation,
        visibleNodes,
        visibleConnections,
        breadcrumbItems,
        drillDown,
        drillUp,
        navigateToNodeParent,
        selectNode,
        resetNavigation,
        selectedNode,
        currentParent,
        currentDepth,
    };
}
