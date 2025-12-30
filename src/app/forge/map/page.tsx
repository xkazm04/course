"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

import { generateKnowledgeMapData } from "@/app/features/knowledge-map/lib/mapData";
import { useMapNavigation } from "@/app/features/knowledge-map/lib/useMapNavigation";
import { createClient } from "@/lib/supabase/client";
import { useForge } from "../layout";
import type { ViewportState, LearningPath, GeneratedPath, MapView } from "./lib/types";
import type { OraclePath, PathNode } from "./lib/oracleApi";
import { usePathAcceptance } from "./lib/usePathAcceptance";
import { useNodeStatus } from "./lib/useNodeStatus";
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
} from "./components";

export default function MapPage() {
    // Auth context
    const { user, isAuthenticated, refreshUser } = useForge();

    // Map data and navigation
    const mapData = useMemo(() => generateKnowledgeMapData(), []);
    const { navigation, visibleNodes, breadcrumbItems, drillDown, drillUp } = useMapNavigation(mapData);

    // View state - domains view for first level, hex for deeper
    const [mapView, setMapView] = useState<MapView>("domains");
    const [currentDomain, setCurrentDomain] = useState<LearningPath | null>(null);

    // Viewport state for panning/zooming
    const [viewport, setViewport] = useState<ViewportState>({ scale: 1, offsetX: 0, offsetY: 0 });

    // Transition animation state
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionDirection, setTransitionDirection] = useState<"in" | "out">("in");

    // Map notifications
    const mapNotification = useMapNotification();

    // Path acceptance flow
    const pathAcceptance = usePathAcceptance();

    // Get visible node IDs for status tracking
    const visibleNodeIds = useMemo(
        () => visibleNodes.map((n) => n.id),
        [visibleNodes]
    );

    // Node generation status tracking
    const nodeStatus = useNodeStatus(visibleNodeIds);

    // Detect if we're at root level
    const isRootLevel = navigation.currentParentId === null;

    // Switch to domains view when at root
    useEffect(() => {
        if (isRootLevel && mapView !== "domains") {
            setMapView("domains");
            setCurrentDomain(null);
        }
    }, [isRootLevel, mapView]);

    // Handle domain card selection
    const handleDomainSelect = useCallback((domain: LearningPath) => {
        setIsTransitioning(true);
        setTransitionDirection("in");
        setCurrentDomain(domain);

        setTimeout(() => {
            // Find the domain node and drill into it
            const domainNode = Array.from(mapData.nodes.values()).find(
                n => n.domainId === domain && n.parentId === null
            );
            if (domainNode) {
                drillDown(domainNode.id);
            }
            setMapView("hex");
            setViewport({ scale: 1, offsetX: 0, offsetY: 0 });
            setIsTransitioning(false);
        }, 300);
    }, [mapData.nodes, drillDown]);

    // Handle drill down into a node
    const handleDrillDown = useCallback((nodeId: string) => {
        const node = mapData.nodes.get(nodeId);
        if (!node || !node.childIds || node.childIds.length === 0) return;

        setIsTransitioning(true);
        setTransitionDirection("in");

        setTimeout(() => {
            drillDown(nodeId);
            setViewport({ scale: 1, offsetX: 0, offsetY: 0 });
            setIsTransitioning(false);
        }, 250);
    }, [mapData.nodes, drillDown]);

    // Handle going back (right-click or tree navigation)
    // Prevent going back to domains level - user must stay within their selected domain
    const handleGoBack = useCallback(() => {
        // Don't go back if at root or at first level within a domain
        if (isRootLevel || breadcrumbItems.length <= 2) return;

        setIsTransitioning(true);
        setTransitionDirection("out");

        setTimeout(() => {
            drillUp(-1);
            setViewport({ scale: 1, offsetX: 0, offsetY: 0 });
            setIsTransitioning(false);
        }, 250);
    }, [drillUp, isRootLevel, breadcrumbItems.length]);

    // Handle navigation via tree
    const handleTreeNavigate = useCallback((index: number) => {
        setIsTransitioning(true);
        setTransitionDirection("out");

        setTimeout(() => {
            if (index === 0) {
                drillUp(-1);
                setMapView("domains");
                setCurrentDomain(null);
            } else {
                drillUp(index - 1);
            }
            setViewport({ scale: 1, offsetX: 0, offsetY: 0 });
            setIsTransitioning(false);
        }, 250);
    }, [drillUp]);

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
            const response = await pathAcceptance.acceptPath(path, currentDomain);

            // Create learning path enrollment for the user
            const supabase = createClient();

            // First, find or create the learning path record
            // Check if learning path exists
            let learningPathId = path.id;

            const { data: existingPath } = await supabase
                .from("learning_paths")
                .select("id")
                .eq("id", path.id)
                .single();

            if (!existingPath) {
                // Create learning path
                const { data: newPath, error: pathError } = await supabase
                    .from("learning_paths")
                    .insert({
                        id: path.id,
                        slug: path.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                        title: path.name,
                        description: path.description || null,
                        path_type: "ai_generated",
                        status: "published",
                        estimated_hours: Math.round(path.nodes.length * 2), // Rough estimate
                        created_by_user_id: user.id,
                    })
                    .select("id")
                    .single();

                if (pathError) {
                    console.error("Error creating learning path:", pathError);
                } else if (newPath) {
                    learningPathId = newPath.id;
                }
            }

            // Create enrollment
            const { error: enrollmentError } = await supabase
                .from("learning_path_enrollments")
                .upsert({
                    user_id: user.id,
                    learning_path_id: learningPathId,
                    status: "active",
                    progress_percent: 0,
                    current_course_index: 0,
                    started_at: new Date().toISOString(),
                }, {
                    onConflict: "user_id,learning_path_id"
                });

            if (enrollmentError) {
                console.error("Error creating enrollment:", enrollmentError);
            }

            // Refresh user data to pick up new enrollment
            await refreshUser();

            if (response.total_jobs > 0) {
                mapNotification.showInfo(
                    "Path forged! Generating content...",
                    `${response.total_new_nodes} nodes created, ${response.total_jobs} chapters generating`
                );
            } else {
                mapNotification.showSuccess(
                    "Path forged successfully!",
                    `${response.total_new_nodes} nodes ready for your journey`
                );
            }

            // Refresh node status to pick up new nodes
            nodeStatus.refresh();

        } catch (error) {
            mapNotification.showError(
                "Failed to forge path",
                error instanceof Error ? error.message : "Please try again"
            );
            throw error;
        }
    }, [currentDomain, pathAcceptance, mapNotification, nodeStatus, isAuthenticated, user, refreshUser]);

    // Handle navigation from Oracle path tree to specific node
    const handleNavigateToNode = useCallback((node: PathNode) => {
        mapNotification.showInfo("Navigation", `Navigating to: ${node.name}`);
        // TODO: Implement actual navigation to the node on the map
        // This would involve finding the node in the map and drilling down to it
        console.log("Navigate to node:", node);
    }, [mapNotification]);

    // Handle retry for failed generation
    const handleRetryGeneration = useCallback(async (nodeId: string) => {
        mapNotification.showLoading("Retrying content generation...");
        try {
            await pathAcceptance.retryFailedJobs();
            nodeStatus.refresh();
            mapNotification.showSuccess("Retry started", "Content generation is being retried");
        } catch (error) {
            mapNotification.showError(
                "Retry failed",
                error instanceof Error ? error.message : "Please try again"
            );
        }
    }, [pathAcceptance, nodeStatus, mapNotification]);

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
        </div>
    );
}
