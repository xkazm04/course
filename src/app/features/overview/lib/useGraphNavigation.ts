/**
 * useGraphNavigation - React Hook for Graph-Based Navigation
 *
 * This hook provides React components with navigation capabilities powered
 * by the NavigationService. It handles:
 *
 * 1. Keyboard navigation (Tab, Arrow keys, Enter, Escape)
 * 2. Accessibility announcements via ARIA live regions
 * 3. Breadcrumb trail tracking
 * 4. Focus management for connected nodes
 *
 * Usage:
 *   const { navigationContext, handlers, announce } = useGraphNavigation(data, selectedNodeId);
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    NavigationService,
    NavigationContext,
    NavigationAnnouncement,
    BreadcrumbEntry,
    getNavigationService,
} from "./NavigationService";
import { CurriculumNode, CurriculumData } from "./curriculumTypes";

// ============================================================================
// TYPES
// ============================================================================

export interface GraphNavigationOptions {
    /** Enable keyboard navigation */
    enableKeyboardNav?: boolean;
    /** Enable ARIA announcements */
    enableAnnouncements?: boolean;
    /** Enable breadcrumb tracking */
    enableBreadcrumbs?: boolean;
    /** Callback when a node is selected via keyboard */
    onNodeSelect?: (node: CurriculumNode) => void;
    /** Callback when navigation context changes */
    onContextChange?: (context: NavigationContext | null) => void;
}

export interface GraphNavigationResult {
    /** The complete navigation context for the current node */
    navigationContext: NavigationContext | null;
    /** The navigation service instance */
    navigationService: NavigationService;
    /** Current breadcrumb trail */
    breadcrumbs: BreadcrumbEntry[];
    /** Current accessibility announcement */
    announcement: NavigationAnnouncement | null;
    /** Currently focused connected node (for keyboard nav) */
    focusedConnection: CurriculumNode | null;
    /** Keyboard event handlers for the container */
    containerProps: {
        onKeyDown: (e: React.KeyboardEvent) => void;
        role: string;
        "aria-label": string;
        tabIndex: number;
    };
    /** ARIA live region props */
    liveRegionProps: {
        role: "status";
        "aria-live": "polite";
        "aria-atomic": "true";
        className: string;
    };
    /** The message to announce */
    liveMessage: string;
    /** Trigger an announcement programmatically */
    announce: (message: string) => void;
    /** Navigate to a specific node */
    navigateTo: (node: CurriculumNode) => void;
    /** Go back in navigation history */
    goBack: () => CurriculumNode | null;
    /** Get the tab order for keyboard navigation */
    getTabOrder: () => CurriculumNode[];
    /** Get suggested next node */
    getSuggestedNext: () => CurriculumNode | null;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useGraphNavigation(
    data: CurriculumData,
    selectedNodeId: string | null,
    options: GraphNavigationOptions = {}
): GraphNavigationResult {
    const {
        enableKeyboardNav = true,
        enableAnnouncements = true,
        enableBreadcrumbs = true,
        onNodeSelect,
        onContextChange,
    } = options;

    // Get or create navigation service
    const navigationService = useMemo(
        () => getNavigationService(data),
        [data]
    );

    // State
    const [focusedConnectionIndex, setFocusedConnectionIndex] = useState(0);
    const [liveMessage, setLiveMessage] = useState("");
    const announcementTimeoutRef = useRef<number | null>(null);

    // Compute navigation context
    const navigationContext = useMemo(() => {
        if (!selectedNodeId) return null;
        return navigationService.getNavigationContext(selectedNodeId);
    }, [navigationService, selectedNodeId]);

    // Get current announcement
    const announcement = useMemo(() => {
        if (!selectedNodeId) return null;
        return navigationService.getAnnouncement(selectedNodeId);
    }, [navigationService, selectedNodeId]);

    // Get breadcrumbs
    const breadcrumbs = useMemo(
        () => navigationService.getBreadcrumbs(),
        [navigationService, selectedNodeId]
    );

    // Currently focused connected node
    const focusedConnection = useMemo(() => {
        if (!navigationContext) return null;
        const tabOrder = navigationContext.tabOrder;
        return tabOrder[focusedConnectionIndex] || null;
    }, [navigationContext, focusedConnectionIndex]);

    // Record visit when node changes (breadcrumb tracking)
    useEffect(() => {
        if (enableBreadcrumbs && navigationContext) {
            navigationService.recordVisit(navigationContext.currentNode);
        }
    }, [navigationContext, navigationService, enableBreadcrumbs]);

    // Announce on node selection
    useEffect(() => {
        if (enableAnnouncements && announcement) {
            announce(announcement.brief);
        }
    }, [selectedNodeId, enableAnnouncements]);

    // Notify context change
    useEffect(() => {
        onContextChange?.(navigationContext);
    }, [navigationContext, onContextChange]);

    // Reset focused connection when node changes
    useEffect(() => {
        setFocusedConnectionIndex(0);
    }, [selectedNodeId]);

    // ========================================================================
    // NAVIGATION METHODS
    // ========================================================================

    const announce = useCallback((message: string) => {
        // Clear any pending announcement
        if (announcementTimeoutRef.current) {
            window.clearTimeout(announcementTimeoutRef.current);
        }

        // Set the message (triggers ARIA live region)
        setLiveMessage(message);

        // Clear after a delay to allow next announcement
        announcementTimeoutRef.current = window.setTimeout(() => {
            setLiveMessage("");
            announcementTimeoutRef.current = null;
        }, 1000);
    }, []);

    const navigateTo = useCallback((node: CurriculumNode) => {
        // Find the connection if navigating from current node
        if (selectedNodeId) {
            const connections = navigationService.getAllConnections(selectedNodeId);
            const connection = connections.find(c => c.node.id === node.id);
            if (connection) {
                navigationService.recordVisit(node, connection.connection);
            } else {
                navigationService.recordVisit(node);
            }
        } else {
            navigationService.recordVisit(node);
        }

        onNodeSelect?.(node);
    }, [navigationService, selectedNodeId, onNodeSelect]);

    const goBack = useCallback((): CurriculumNode | null => {
        const previousEntry = navigationService.goBack();
        if (previousEntry) {
            onNodeSelect?.(previousEntry.node);
            announce(`Returned to ${previousEntry.node.title}`);
            return previousEntry.node;
        }
        return null;
    }, [navigationService, onNodeSelect, announce]);

    const getTabOrder = useCallback((): CurriculumNode[] => {
        if (!selectedNodeId) return [];
        return navigationService.getTabOrder(selectedNodeId);
    }, [navigationService, selectedNodeId]);

    const getSuggestedNext = useCallback((): CurriculumNode | null => {
        if (!selectedNodeId) return null;
        const suggested = navigationService.getSuggestedNext(selectedNodeId);
        return suggested?.node || null;
    }, [navigationService, selectedNodeId]);

    // ========================================================================
    // KEYBOARD HANDLER
    // ========================================================================

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!enableKeyboardNav || !navigationContext) return;

        const tabOrder = navigationContext.tabOrder;
        if (tabOrder.length === 0) return;

        switch (e.key) {
            case "Tab": {
                // Cycle through connected nodes
                e.preventDefault();
                const direction = e.shiftKey ? -1 : 1;
                const newIndex = (focusedConnectionIndex + direction + tabOrder.length) % tabOrder.length;
                setFocusedConnectionIndex(newIndex);

                const focusedNode = tabOrder[newIndex];
                if (focusedNode) {
                    const conn = navigationContext.allConnections.find(c => c.node.id === focusedNode.id);
                    const relationship = conn ? conn.relationship : "";
                    announce(`${focusedNode.title}. ${relationship}. ${focusedNode.status.replace("_", " ")}.`);
                }
                break;
            }

            case "ArrowRight":
            case "ArrowDown": {
                // Move to next in tab order
                e.preventDefault();
                const newIndex = (focusedConnectionIndex + 1) % tabOrder.length;
                setFocusedConnectionIndex(newIndex);
                const focusedNode = tabOrder[newIndex];
                if (focusedNode) {
                    announce(`${focusedNode.title}`);
                }
                break;
            }

            case "ArrowLeft":
            case "ArrowUp": {
                // Move to previous in tab order
                e.preventDefault();
                const newIndex = (focusedConnectionIndex - 1 + tabOrder.length) % tabOrder.length;
                setFocusedConnectionIndex(newIndex);
                const focusedNode = tabOrder[newIndex];
                if (focusedNode) {
                    announce(`${focusedNode.title}`);
                }
                break;
            }

            case "Enter":
            case " ": {
                // Select the focused connection
                e.preventDefault();
                const focusedNode = tabOrder[focusedConnectionIndex];
                if (focusedNode) {
                    navigateTo(focusedNode);
                    announce(`Selected ${focusedNode.title}`);
                }
                break;
            }

            case "Escape": {
                // Clear selection or go back
                e.preventDefault();
                const previous = goBack();
                if (!previous) {
                    announce("At the start of navigation history");
                }
                break;
            }

            case "Home": {
                // Jump to first connection
                e.preventDefault();
                setFocusedConnectionIndex(0);
                const focusedNode = tabOrder[0];
                if (focusedNode) {
                    announce(`First connection: ${focusedNode.title}`);
                }
                break;
            }

            case "End": {
                // Jump to last connection
                e.preventDefault();
                setFocusedConnectionIndex(tabOrder.length - 1);
                const focusedNode = tabOrder[tabOrder.length - 1];
                if (focusedNode) {
                    announce(`Last connection: ${focusedNode.title}`);
                }
                break;
            }

            case "?": {
                // Announce current context (help)
                e.preventDefault();
                if (announcement) {
                    announce(announcement.detailed);
                }
                break;
            }

            default:
                // No action for other keys
                break;
        }
    }, [
        enableKeyboardNav,
        navigationContext,
        focusedConnectionIndex,
        announce,
        navigateTo,
        goBack,
        announcement,
    ]);

    // ========================================================================
    // RETURN VALUE
    // ========================================================================

    return {
        navigationContext,
        navigationService,
        breadcrumbs,
        announcement,
        focusedConnection,
        containerProps: {
            onKeyDown: handleKeyDown,
            role: "navigation",
            "aria-label": "Knowledge map navigation",
            tabIndex: 0,
        },
        liveRegionProps: {
            role: "status" as const,
            "aria-live": "polite" as const,
            "aria-atomic": "true" as const,
            className: "sr-only", // Screen reader only
        },
        liveMessage,
        announce,
        navigateTo,
        goBack,
        getTabOrder,
        getSuggestedNext,
    };
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook to get just the suggested next node
 */
export function useSuggestedNext(
    data: CurriculumData,
    nodeId: string | null
): CurriculumNode | null {
    const navigationService = useMemo(() => getNavigationService(data), [data]);

    return useMemo(() => {
        if (!nodeId) return null;
        const suggested = navigationService.getSuggestedNext(nodeId);
        return suggested?.node || null;
    }, [navigationService, nodeId]);
}

/**
 * Hook to get the breadcrumb trail as a formatted string
 */
export function useBreadcrumbString(
    data: CurriculumData,
    maxLength = 5
): string {
    const navigationService = useMemo(() => getNavigationService(data), [data]);
    return navigationService.getBreadcrumbString(maxLength);
}

/**
 * Hook to get connection counts for a node
 */
export function useConnectionCounts(
    data: CurriculumData,
    nodeId: string | null
): { incoming: number; outgoing: number; total: number } {
    const navigationService = useMemo(() => getNavigationService(data), [data]);

    return useMemo(() => {
        if (!nodeId) return { incoming: 0, outgoing: 0, total: 0 };

        const announcement = navigationService.getAnnouncement(nodeId);
        return {
            incoming: announcement.incomingCount,
            outgoing: announcement.outgoingCount,
            total: announcement.incomingCount + announcement.outgoingCount,
        };
    }, [navigationService, nodeId]);
}
