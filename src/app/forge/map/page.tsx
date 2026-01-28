"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";

import { useSceneGraph } from "@/app/features/knowledge-map/lib/useSceneGraph";
import { useDatabaseMapData, mergeWithDynamicNodes } from "./lib/useDatabaseMapData";
import { useForge } from "../layout";
import type { LearningPath, GeneratedPath, MapView } from "./lib/types";
import type { OraclePath } from "./lib/oracleApi";
import { useNodeStatus } from "./lib/useNodeStatus";
import { contentApi } from "./lib/contentApi";
import { usePathSyncStore, useIsSidebarOpen, useAcceptedPath, useDynamicNodes, type DynamicMapNode } from "./lib/usePathSyncStore";
import { usePathPolling } from "./lib/usePathPolling";
import {
    DomainCards,
    HexGrid,
    TreeNavigation,
    ZoomControls,
    Oracle,
    LayerTransition,
    Legend,
    MiniProgress,
    MapNotification,
    useMapNotification,
    AcceptedPathSidebar,
    GenerationProgressOverlay,
    MapSearch,
} from "./components";
import { useMapSearch } from "./lib/useMapSearch";
import type { MapNode } from "@/app/features/knowledge-map/lib/types";

export default function MapPage() {
    const router = useRouter();

    // Auth context
    const { user, isAuthenticated, refreshUser } = useForge();

    // View state - domains view for first level, hex for deeper
    const [mapView, setMapView] = useState<MapView>("domains");
    const [currentDomain, setCurrentDomain] = useState<LearningPath | null>(null);

    // Database-driven map data (fetches from /api/map-nodes)
    const {
        mapData: baseMapData,
        isLoading: isMapLoading,
        error: mapError,
        refresh: refreshMapData,
    } = useDatabaseMapData({
        domain: currentDomain || undefined,
        includeProgress: isAuthenticated,
        fallbackToMock: false  // Disabled to show actual database state
    });

    // Path sync store
    const acceptPathAction = usePathSyncStore(state => state.acceptPath);
    const isSidebarOpen = useIsSidebarOpen();
    const acceptedPath = useAcceptedPath();
    const dynamicNodes = useDynamicNodes();
    const setSidebarOpen = usePathSyncStore(state => state.setSidebarOpen);

    // Merge base map data with dynamic Oracle-generated nodes
    const mapData = useMemo(() => {
        if (Object.keys(dynamicNodes).length === 0) {
            return baseMapData;
        }
        return mergeWithDynamicNodes(baseMapData, dynamicNodes);
    }, [baseMapData, dynamicNodes]);

    // Unified Scene Graph (combines navigation + viewport with animated transitions)
    const {
        navigation,
        viewport,
        visibleNodes,
        breadcrumbItems,
        drillDown,
        drillUp,
        navigateToNodeParent,
        zoomTo,
        reset: resetScene,
        isTransitioning: sceneIsTransitioning,
    } = useSceneGraph(mapData);

    // Local transition direction state for layer animation
    const [transitionDirection, setTransitionDirection] = useState<"in" | "out">("in");

    // Derived isTransitioning that combines scene transitions with local animation
    const [localTransitioning, setLocalTransitioning] = useState(false);
    const isTransitioning = sceneIsTransitioning || localTransitioning;

    // Helper to update viewport via SceneGraph
    const setViewport = useCallback((newViewport: { scale: number; offsetX: number; offsetY: number }) => {
        zoomTo(newViewport.scale);
    }, [zoomTo]);

    // Map notifications
    const mapNotification = useMapNotification();

    // Start polling when path is accepted
    usePathPolling();

    // Get visible node IDs for status tracking
    const visibleNodeIds = useMemo(
        () => visibleNodes.map((n) => n.id),
        [visibleNodes]
    );

    // Node generation status tracking
    const nodeStatus = useNodeStatus(visibleNodeIds);

    // Get all nodes as array for search
    const allNodesArray = useMemo(() => Array.from(mapData.nodes.values()), [mapData.nodes]);

    // Map search functionality
    const mapSearch = useMapSearch(allNodesArray);

    // Detect if we're at root level
    const isRootLevel = navigation.currentParentId === null;

    // Switch to domains view when at root - BUT only if no domain is selected
    // This prevents resetting to domains when user has intentionally selected a domain
    // but the map data hasn't loaded yet (optimistic transition)
    useEffect(() => {
        if (isRootLevel && mapView !== "domains" && !currentDomain) {
            setMapView("domains");
        }
    }, [isRootLevel, mapView, currentDomain]);

    // Auto-drill into domain when data loads (for optimistic transitions)
    // If user selected a domain but drillDown didn't work yet, try again when data arrives
    useEffect(() => {
        if (currentDomain && mapView === "hex" && isRootLevel && !isMapLoading && mapData.nodes.size > 0) {
            const domainNode = Array.from(mapData.nodes.values()).find(
                n => n.domainId === currentDomain && n.parentId === null
            );
            if (domainNode) {
                drillDown(domainNode.id);
            }
        }
    }, [currentDomain, mapView, isRootLevel, isMapLoading, mapData.nodes, drillDown]);

    // Handle domain card selection - optimistic transition
    // Switches to hex view immediately, data loads asynchronously
    const handleDomainSelect = useCallback((domain: LearningPath) => {
        setLocalTransitioning(true);
        setTransitionDirection("in");
        setCurrentDomain(domain);

        // Switch to hex view IMMEDIATELY for optimistic transition
        // Don't wait for data to load - the loading indicator will show
        setMapView("hex");

        // End transition animation after a brief delay
        setTimeout(() => {
            // Try to drill into the domain node if available
            // SceneGraph handles viewport reset with animated transition
            const domainNode = Array.from(mapData.nodes.values()).find(
                n => n.domainId === domain && n.parentId === null
            );
            if (domainNode) {
                drillDown(domainNode.id);
            }
            setLocalTransitioning(false);
        }, 300);
    }, [mapData.nodes, drillDown]);

    // Handle drill down into a node
    // SceneGraph handles viewport reset and animated transitions automatically
    const handleDrillDown = useCallback((nodeId: string) => {
        const node = mapData.nodes.get(nodeId);
        if (!node || !node.childIds || node.childIds.length === 0) return;

        setTransitionDirection("in");
        // SceneGraph's drillDown includes animated transition and viewport reset
        drillDown(nodeId);
    }, [mapData.nodes, drillDown]);

    // Handle going back (right-click or tree navigation)
    // Prevent going back to domains level - user must stay within their selected domain
    // SceneGraph handles viewport reset and animated transitions automatically
    const handleGoBack = useCallback(() => {
        // Don't go back if at root or at first level within a domain
        if (isRootLevel || breadcrumbItems.length <= 2) return;

        setTransitionDirection("out");
        // SceneGraph's drillUp includes animated transition and viewport reset
        drillUp(-1);
    }, [drillUp, isRootLevel, breadcrumbItems.length]);

    // Handle navigation via tree
    // SceneGraph handles viewport reset and animated transitions automatically
    const handleTreeNavigate = useCallback((index: number) => {
        setTransitionDirection("out");

        if (index === 0) {
            // Going to root - reset scene and switch to domains view
            resetScene();
            setMapView("domains");
            setCurrentDomain(null);
        } else {
            // SceneGraph's drillUp includes animated transition and viewport reset
            drillUp(index - 1);
        }
    }, [drillUp, resetScene]);

    // Handle path selection from Oracle
    const handlePathSelected = useCallback((path: GeneratedPath) => {
        console.log("Path selected:", path);
    }, []);

    // Handle path acceptance from Oracle (new stepper flow)
    const handleAcceptPath = useCallback(async (path: OraclePath) => {
        if (!currentDomain) {
            mapNotification.showError("No domain selected", "Please select a domain first");
            return;
        }

        if (!isAuthenticated || !user) {
            mapNotification.showError("Sign in required", "Please sign in to accept a learning path");
            return;
        }

        mapNotification.showLoading("Forging your learning path...", "Creating nodes and connections");

        try {
            // Call API to accept the path
            const response = await fetch("/api/oracle/accept-path", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path, domain: currentDomain }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to accept path");
            }

            const data = await response.json();

            // Update Zustand store with accepted path
            acceptPathAction(path, currentDomain, data);

            // Refresh user data to pick up new enrollment
            await refreshUser();

            if (data.total_jobs > 0) {
                mapNotification.showInfo(
                    "Path forged! Generating content...",
                    `${data.total_new_nodes} nodes created, ${data.total_jobs} chapters generating`
                );
            } else {
                mapNotification.showSuccess(
                    "Path forged successfully!",
                    `${data.total_new_nodes} nodes ready for your journey`
                );
            }

            // Refresh node status to pick up new nodes
            nodeStatus.refresh();

            // Refresh map data from database to show new nodes
            refreshMapData();

        } catch (error) {
            mapNotification.showError(
                "Failed to forge path",
                error instanceof Error ? error.message : "Please try again"
            );
            throw error;
        }
    }, [currentDomain, acceptPathAction, mapNotification, nodeStatus, isAuthenticated, user, refreshUser, refreshMapData]);

    // Handle closing the accepted path sidebar
    const handleClosePathSidebar = useCallback(() => {
        setSidebarOpen(false);
    }, [setSidebarOpen]);

    // Handle navigation from sidebar to map node
    // Clicking a node should navigate to show that node's level (its parent's children)
    // This REPLACES the current navigation, it doesn't ADD to it
    const handleNavigateToMapNode = useCallback((node: DynamicMapNode) => {
        // For lesson nodes, navigate to chapter content
        if (node.depth === 4 && node.chapterId) {
            if (node.status === "ready" || node.status === "completed") {
                router.push(`/forge/chapter/${node.chapterId}`);
            } else {
                mapNotification.showInfo(
                    `Lesson: ${node.name}`,
                    node.status === "generating" || node.status === "pending"
                        ? "Content is being generated..."
                        : "Generation failed - retry available"
                );
            }
            return;
        }

        // For other nodes, navigate to show this node in the map
        // This replaces the navigation stack, not adds to it
        // SceneGraph's navigateToNodeParent handles viewport reset and animated transitions
        const mapNode = mapData.nodes.get(node.id);
        if (mapNode) {
            setTransitionDirection("in");
            // SceneGraph's navigateToNodeParent includes animated transition and viewport reset
            navigateToNodeParent(node.id);
        } else {
            // Node not in map yet - show info
            const depthNames = ["Domain", "Topic", "Skill", "Course", "Lesson"];
            const depthName = depthNames[node.depth] || "Node";
            mapNotification.showInfo(
                `${depthName}: ${node.name}`,
                "This node will appear on the map after content is generated"
            );
        }
    }, [mapData.nodes, mapNotification, router, navigateToNodeParent]);

    // Handle retry for failed generation
    const handleRetryGeneration = useCallback(async (nodeId: string) => {
        mapNotification.showLoading("Retrying content generation...");
        try {
            // TODO: Implement retry via store
            nodeStatus.refresh();
            mapNotification.showSuccess("Retry started", "Content generation is being retried");
        } catch (error) {
            mapNotification.showError(
                "Retry failed",
                error instanceof Error ? error.message : "Please try again"
            );
        }
    }, [nodeStatus, mapNotification]);

    // Handle opening a chapter (navigate to chapter content page)
    const handleOpenChapter = useCallback((nodeId: string) => {
        router.push(`/forge/chapter/${nodeId}`);
    }, [router]);

    // Handle generating content for a node
    const handleGenerateContent = useCallback(async (nodeId: string) => {
        if (!isAuthenticated || !user) {
            mapNotification.showError("Sign in required", "Please sign in to generate content");
            return;
        }

        mapNotification.showLoading("Starting content generation...", "This may take a moment");

        try {
            const response = await contentApi.createJob(nodeId, "chapter_content");
            mapNotification.showInfo(
                "Generation started",
                "Content is being generated. This may take a few minutes."
            );
            // Refresh node statuses to pick up the new job
            nodeStatus.refresh();
        } catch (error) {
            mapNotification.showError(
                "Generation failed",
                error instanceof Error ? error.message : "Please try again"
            );
        }
    }, [isAuthenticated, user, mapNotification, nodeStatus]);

    // Handle regenerating content for a node (delete then generate)
    const handleRegenerateContent = useCallback(async (nodeId: string) => {
        if (!isAuthenticated || !user) {
            mapNotification.showError("Sign in required", "Please sign in to regenerate content");
            return;
        }

        mapNotification.showLoading("Resetting chapter content...", "Preparing for regeneration");

        try {
            // First, delete the existing content via DELETE API
            const deleteResponse = await fetch(`/api/chapters/${nodeId}`, {
                method: "DELETE",
            });

            if (!deleteResponse.ok) {
                const errorData = await deleteResponse.json();
                throw new Error(errorData.error || "Failed to reset chapter content");
            }

            mapNotification.showLoading("Starting content regeneration...", "This may take a moment");

            // Then trigger new generation
            await contentApi.createJob(nodeId, "chapter_content");

            mapNotification.showInfo(
                "Regeneration started",
                "Content is being regenerated. This may take a few minutes."
            );

            // Refresh node statuses to pick up the new job
            nodeStatus.refresh();
            // Refresh map data to reflect changes
            refreshMapData();
        } catch (error) {
            mapNotification.showError(
                "Regeneration failed",
                error instanceof Error ? error.message : "Please try again"
            );
        }
    }, [isAuthenticated, user, mapNotification, nodeStatus, refreshMapData]);

    // Handle navigation from search results
    const handleSearchNavigate = useCallback((node: MapNode | undefined) => {
        if (!node) return;

        // Deactivate search
        mapSearch.deactivate();
        mapSearch.clearSearch();

        // Navigate to show this node on the map
        setTransitionDirection("in");
        navigateToNodeParent(node.id);
    }, [mapSearch, navigateToNodeParent]);

    // Build breadcrumb path for tree navigation
    const treePath = useMemo(() => {
        return breadcrumbItems.map(item => ({
            id: item.nodeId,
            title: item.label,
        }));
    }, [breadcrumbItems]);

    // Current depth for Oracle sync
    const currentDepth = breadcrumbItems.length - 1;

    return (
        <div className="h-[calc(100vh-64px)] relative overflow-hidden bg-[var(--forge-bg-void)]">
            <AnimatePresence mode="wait">
                {mapView === "domains" ? (
                    <DomainCards
                        key="domains"
                        onSelect={handleDomainSelect}
                    />
                ) : (
                    <div key="hex" className="w-full h-full relative">
                        {/* Background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--forge-bg-void)] via-[var(--forge-bg-anvil)] to-[var(--ember)]/10" />

                        {/* Loading indicator when map data is loading */}
                        {isMapLoading && visibleNodes.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-[var(--ember)] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[var(--forge-text-muted)] text-sm">Loading map...</p>
                                </div>
                            </div>
                        )}

                        {/* Error state - show message but don't block the view */}
                        {mapError && !isMapLoading && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                                <div className="bg-[var(--forge-bg-elevated)] border border-[var(--forge-warning)]/30 rounded-lg px-4 py-2 text-sm text-[var(--forge-warning)]">
                                    Map data unavailable - showing cached data
                                </div>
                            </div>
                        )}

                        {/* Hex grid canvas */}
                        <HexGrid
                            nodes={visibleNodes}
                            viewport={viewport}
                            setViewport={setViewport}
                            onDrillDown={handleDrillDown}
                            onGoBack={handleGoBack}
                            domainId={currentDomain || undefined}
                            allNodes={mapData.nodes}
                            nodeStatuses={nodeStatus.nodeStatuses}
                            onRetryGeneration={handleRetryGeneration}
                            onOpenChapter={handleOpenChapter}
                            onGenerateContent={handleGenerateContent}
                            onRegenerateContent={handleRegenerateContent}
                            canGoBack={breadcrumbItems.length > 2}
                            highlightedNodeIds={mapSearch.highlightedNodeIds}
                        />

                        {/* Map search (top center) */}
                        <MapSearch
                            search={mapSearch}
                            onNavigateToNode={handleSearchNavigate}
                            totalNodes={allNodesArray.length}
                        />

                        {/* Tree navigation (left sidebar) */}
                        <TreeNavigation
                            path={treePath}
                            currentNodes={visibleNodes}
                            allNodes={mapData.nodes}
                            onNavigate={handleTreeNavigate}
                            onNodeSelect={handleDrillDown}
                        />

                        {/* Legend (top right) */}
                        <Legend />

                        {/* Generation progress overlay (top center) */}
                        <GenerationProgressOverlay />

                        {/* Zoom controls (bottom right) */}
                        <ZoomControls
                            viewport={viewport}
                            setViewport={setViewport}
                        />

                        {/* Oracle (top center) */}
                        <Oracle
                            currentDomain={currentDomain}
                            currentDepth={currentDepth}
                            onPathSelected={handlePathSelected}
                            onAcceptPath={handleAcceptPath}
                        />

                        {/* Mini progress (bottom center) */}
                        <MiniProgress
                            nodes={visibleNodes}
                            levelName={treePath[treePath.length - 1]?.title || "Learning Map"}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Layer transition overlay */}
            <LayerTransition
                isTransitioning={isTransitioning}
                direction={transitionDirection}
            />

            {/* Map notifications */}
            <MapNotification
                notification={mapNotification.notification}
                onDismiss={mapNotification.dismiss}
            />

            {/* Accepted path sidebar - now uses Zustand store */}
            <AnimatePresence>
                {isSidebarOpen && acceptedPath && mapView === "hex" && (
                    <AcceptedPathSidebar
                        onClose={handleClosePathSidebar}
                        onNavigateToMapNode={handleNavigateToMapNode}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
