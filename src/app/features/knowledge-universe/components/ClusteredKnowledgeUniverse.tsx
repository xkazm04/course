"use client";

/**
 * Clustered Knowledge Universe Component
 *
 * An enhanced version of the Knowledge Universe that uses hierarchical clustering
 * with Level-of-Detail (LOD) rendering for handling 1000+ nodes efficiently.
 *
 * CLUSTER GALAXY PATTERN:
 * - At galaxy level (scale < 0.15): Show galaxy clusters (aggregated domains)
 * - At domain level (scale < 0.25): Show domain clusters (single domains with metrics)
 * - At topic level (scale < 0.5): Show topic clusters (aggregated skills/lessons)
 * - At full detail (scale >= 0.7): Show individual nodes
 *
 * Clusters display:
 * - Node count metrics
 * - Completion percentage
 * - Total estimated hours
 * - "Dive deeper" affordance on hover
 * - Smooth explosion/implosion animations during zoom transitions
 */

import React, { useState, useCallback, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Layers } from "lucide-react";
import { UniverseCanvas } from "./UniverseCanvas";
import {
    UniverseControls,
    ZoomLevelIndicator,
    StatsDisplay,
} from "./UniverseControls";
import { SemanticTooltip } from "./SemanticTooltip";
import { SemanticBreadcrumb, PositionIndicator } from "./SemanticBreadcrumb";
import { useLODCoordinator, getNodeOpacity, findClusterAtPosition } from "../lib/useLODCoordinator";
import { getLODLevel, type LODLevelName } from "../lib/clusteringStrategy";
import { DEFAULT_LOD_CONFIG } from "../lib/types";
import { useSemanticZoom } from "../lib/useSemanticZoom";
import { useUniverseDataProvider, createMockUniverseData } from "../lib/universeDataProvider";
import type { UniverseNode, ZoomLevel, ClusterNode } from "../lib/types";
import type { NodeDetailData } from "../lib/semanticZoomController";
import type { UniverseDataSourceType, LayoutStrategyType } from "../lib/universeDataProvider";
import { cn } from "@/app/shared/lib/utils";
import { useReducedMotion } from "@/app/shared/lib/motionPrimitives";

// ============================================================================
// TYPES
// ============================================================================

interface ClusteredKnowledgeUniverseProps {
    className?: string;
    showControls?: boolean;
    showStats?: boolean;
    showBreadcrumbs?: boolean;
    showPositionIndicator?: boolean;
    showLODIndicator?: boolean;
    interactive?: boolean;
    initialZoomLevel?: ZoomLevel;
    onNodeSelect?: (node: UniverseNode) => void;
    onNodeSelectChange?: (node: UniverseNode | null) => void;
    onNavigateToContent?: (node: UniverseNode) => void;
    onClusterClick?: (cluster: ClusterNode) => void;
    /** Data source: "auto" tries Supabase first, falls back to mock */
    dataSource?: UniverseDataSourceType;
    /** Layout strategy for positioning nodes */
    layoutStrategy?: LayoutStrategyType;
    /** Optional function to fetch node details for progressive disclosure */
    fetchNodeDetails?: (nodeId: string, level: ZoomLevel) => Promise<NodeDetailData>;
    /** Enable LOD clustering (default: true) */
    enableClustering?: boolean;
    /** Callback when data is loaded with source information */
    onDataLoaded?: (info: { source: string | null; nodeCount: number }) => void;
}

// ============================================================================
// LOD LEVEL INDICATOR COMPONENT
// ============================================================================

interface LODLevelIndicatorProps {
    level: LODLevelName;
    nodeCount: number;
    className?: string;
}

function LODLevelIndicator({ level, nodeCount, className }: LODLevelIndicatorProps) {
    const levelConfig: Record<LODLevelName, { label: string; description: string; icon: typeof Sparkles; color: string }> = {
        "galaxy-cluster": {
            label: "Galaxy View",
            description: "Exploring universe clusters",
            icon: Sparkles,
            color: "text-purple-400",
        },
        "domain-cluster": {
            label: "Domain View",
            description: "Learning domains",
            icon: Layers,
            color: "text-blue-400",
        },
        "topic-cluster": {
            label: "Topic View",
            description: "Topics & skills",
            icon: Layers,
            color: "text-cyan-400",
        },
        "skill-cluster": {
            label: "Skill View",
            description: "Skills & courses",
            icon: Layers,
            color: "text-teal-400",
        },
        "full-detail": {
            label: "Full Detail",
            description: "Individual lessons",
            icon: Sparkles,
            color: "text-emerald-400",
        },
    };

    const config = levelConfig[level];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
                "absolute top-4 right-4 flex items-center gap-3 px-4 py-2",
                "bg-[var(--forge-bg-card)]/80 backdrop-blur-sm rounded-lg",
                "border border-[var(--forge-border-subtle)]",
                className
            )}
        >
            <Icon size={16} className={config.color} />
            <div className="flex flex-col">
                <span className={cn("text-sm font-medium", config.color)}>
                    {config.label}
                </span>
                <span className="text-xs text-[var(--forge-text-muted)]">
                    {nodeCount} visible • {config.description}
                </span>
            </div>
        </motion.div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ClusteredKnowledgeUniverse({
    className,
    showControls = true,
    showStats = false,
    showBreadcrumbs = true,
    showPositionIndicator = false,
    showLODIndicator = true,
    interactive = true,
    initialZoomLevel = "galaxy",
    onNodeSelect,
    onNodeSelectChange,
    onNavigateToContent,
    onClusterClick,
    dataSource = "auto",
    layoutStrategy = "orbital",
    fetchNodeDetails: fetchNodeDetailsFn,
    enableClustering = true,
    onDataLoaded,
}: ClusteredKnowledgeUniverseProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    // Viewport dimensions
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Use unified data provider
    const {
        data: universeData,
        isLoading: isLoadingData,
        error: dataError,
        activeSource,
    } = useUniverseDataProvider({
        source: dataSource,
        layoutStrategy,
        worldScale: 1000,
    });

    // Fallback to mock data if provider returns null
    const effectiveUniverseData = useMemo(() => {
        if (universeData) return universeData;
        return createMockUniverseData({ worldScale: 1000 }, layoutStrategy);
    }, [universeData, layoutStrategy]);

    // LOD Coordinator (handles clustering + world coordination)
    const {
        world,
        state: lodState,
        clusteredData,
        setUniverseData,
        focusCluster,
        collapseToCluster,
    } = useLODCoordinator({
        worldConfig: {
            initialScale: initialZoomLevel === "galaxy" ? 0.12 : initialZoomLevel === "solar" ? 0.4 : 1.0,
            config: {
                minScale: 0.05, // Allow zooming out far enough to see galaxy clusters
            },
        },
        onLODChange: (level) => {
            console.log(`LOD level changed to: ${level}`);
        },
        onClusterClick: (cluster) => {
            onClusterClick?.(cluster);
        },
    });

    // Stable ref for world to avoid effect dependency loops
    // Must be defined before any hooks that use it in callbacks
    const worldRef = useRef(world);
    useLayoutEffect(() => {
        worldRef.current = world;
    });

    // Initialize clustered data when universe data changes
    useEffect(() => {
        if (effectiveUniverseData) {
            setUniverseData(effectiveUniverseData);
        }
    }, [effectiveUniverseData, setUniverseData]);

    // Notify parent when data is loaded
    useEffect(() => {
        if (!isLoadingData && onDataLoaded) {
            onDataLoaded({
                source: activeSource,
                nodeCount: effectiveUniverseData.nodeCount.total,
            });
        }
    }, [isLoadingData, activeSource, effectiveUniverseData.nodeCount.total, onDataLoaded]);

    // Semantic zoom controller (for non-cluster nodes)
    const semanticZoom = useSemanticZoom({
        initialLevel: initialZoomLevel,
        nodes: effectiveUniverseData.allNodes,
        fetchNodeDetails: fetchNodeDetailsFn,
        onZoomLevelChange: (newLevel) => {
            // Sync with world coordinator (use ref to avoid dependency issues)
            worldRef.current.setZoomLevel(newLevel);
        },
    });

    // Interaction state
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [cursorWorldPos, setCursorWorldPos] = useState<{ x: number; y: number } | null>(null);

    // FPS tracking (for stats display)
    const [fps, setFps] = useState(60);
    const frameTimesRef = useRef<number[]>([]);
    const lastFrameTimeRef = useRef<number>(0);

    // Initialize lastFrameTimeRef on client side only
    useEffect(() => {
        lastFrameTimeRef.current = performance.now();
    }, []);

    // Determine which nodes to render based on LOD state
    const nodesToRender = useMemo(() => {
        if (!enableClustering) {
            return effectiveUniverseData.allNodes;
        }
        return lodState.visibleNodes;
    }, [enableClustering, lodState.visibleNodes, effectiveUniverseData.allNodes]);

    // ========================================================================
    // VIEWPORT SIZING
    // ========================================================================

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height });
                worldRef.current.setViewport(rect.width, rect.height);
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);

        return () => window.removeEventListener("resize", updateDimensions);
    }, []); // Empty deps - uses ref for world access

    // ========================================================================
    // FPS TRACKING
    // ========================================================================

    useEffect(() => {
        if (!showStats) return;

        const measureFps = () => {
            const now = performance.now();
            const delta = now - lastFrameTimeRef.current;
            lastFrameTimeRef.current = now;

            frameTimesRef.current.push(delta);
            if (frameTimesRef.current.length > 60) {
                frameTimesRef.current.shift();
            }

            const avgDelta =
                frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
            setFps(Math.round(1000 / avgDelta));

            requestAnimationFrame(measureFps);
        };

        const id = requestAnimationFrame(measureFps);
        return () => cancelAnimationFrame(id);
    }, [showStats]);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    // Extract stable references to avoid dependency on whole semanticZoom object
    const { fetchNodeDetails: fetchSemanticDetails, isHoverPreviewEnabled } = semanticZoom;

    const handleNodeHover = useCallback((nodeId: string | null) => {
        setHoveredNodeId(nodeId);

        if (nodeId && isHoverPreviewEnabled()) {
            fetchSemanticDetails(nodeId);
        }
    }, [fetchSemanticDetails, isHoverPreviewEnabled]);

    const handleNodeClick = useCallback(
        (nodeId: string) => {
            // Check if this is a cluster node
            const node = nodesToRender.find((n) => n.id === nodeId);
            if (!node) return;

            setSelectedNodeId(nodeId);

            // Handle cluster clicks specially
            if (node.type === "cluster") {
                const cluster = node as ClusterNode;
                focusCluster(cluster.id);
                onClusterClick?.(cluster);
                return;
            }

            // Regular node handling
            onNodeSelect?.(node);
            onNodeSelectChange?.(node);
            semanticZoom.setFocusedNode(node);

            const clickAction = semanticZoom.getClickAction(node);

            switch (clickAction) {
                case "navigate-to-content":
                    onNavigateToContent?.(node);
                    break;

                case "zoom-to-children":
                default:
                    const w = worldRef.current;
                    w.focusOn(node.x, node.y, w.scale * 1.5);
                    break;
            }
        },
        [nodesToRender, onNodeSelect, onNodeSelectChange, onNavigateToContent, semanticZoom, focusCluster, onClusterClick]
    );

    const handleBreadcrumbNavigate = useCallback(
        (breadcrumbId: string) => {
            const { node, zoomLevel } = semanticZoom.navigateToBreadcrumb(breadcrumbId);
            const w = worldRef.current;
            w.setZoomLevel(zoomLevel);

            if (node) {
                w.focusOn(node.x, node.y);
                setSelectedNodeId(node.id);
            } else {
                w.reset();
                setSelectedNodeId(null);
            }
        },
        [semanticZoom]
    );

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            setMousePosition({ x: screenX, y: screenY });

            // Track cursor in world coordinates for cluster-following zoom
            const worldPos = worldRef.current.screenToWorld(screenX, screenY);
            setCursorWorldPos(worldPos);
        }
    }, []);

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            if (!interactive) return;
            e.preventDefault();

            const isZoomingIn = e.deltaY < 0;
            const currentScale = worldRef.current.scale;
            const currentLevel = getLODLevel(currentScale, DEFAULT_LOD_CONFIG);

            // Calculate what the next scale would be
            const zoomFactor = 1 - e.deltaY * 0.002;
            const nextScale = Math.max(0.05, Math.min(4, currentScale * zoomFactor));
            const nextLevel = getLODLevel(nextScale, DEFAULT_LOD_CONFIG);

            // If zooming in and crossing a LOD threshold, find cluster under cursor
            if (isZoomingIn && cursorWorldPos && clusteredData && nextLevel !== currentLevel) {
                const cluster = findClusterAtPosition(
                    cursorWorldPos.x,
                    cursorWorldPos.y,
                    clusteredData,
                    currentLevel
                );

                if (cluster) {
                    // Focus on the cluster under cursor with the new scale
                    worldRef.current.focusOn(cluster.x, cluster.y, nextScale);
                    return;
                }
            }

            // Default zoom behavior
            worldRef.current.zoom(e.deltaY);
        },
        [interactive, cursorWorldPos, clusteredData]
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!interactive) return;
            worldRef.current.handlePanStart(e.clientX, e.clientY);
        },
        [interactive]
    );

    const handleMouseUp = useCallback(() => {
        worldRef.current.handlePanEnd();
    }, []);

    const handleMouseMoveCanvas = useCallback(
        (e: React.MouseEvent) => {
            if (!interactive) return;
            worldRef.current.handlePanMove(e.clientX, e.clientY);
        },
        [interactive]
    );

    const handleZoomIn = useCallback(() => {
        const w = worldRef.current;
        w.zoomTo(w.scale * 1.5);
    }, []);

    const handleZoomOut = useCallback(() => {
        const w = worldRef.current;
        w.zoomTo(w.scale * 0.7);
    }, []);

    // Get hovered node for tooltip
    const hoveredNode = hoveredNodeId
        ? nodesToRender.find((n) => n.id === hoveredNodeId)
        : null;

    // Get semantic tooltip content for hovered node
    const tooltipContent = hoveredNode
        ? semanticZoom.getTooltipContent(hoveredNode)
        : null;

    const tooltipFetchState = hoveredNodeId
        ? semanticZoom.getFetchState(hoveredNodeId)
        : "loaded";

    // Loading state
    if (dataSource !== "mock" && isLoadingData) {
        return (
            <div className={cn(
                "relative w-full h-full overflow-hidden flex items-center justify-center",
                "bg-gradient-to-br from-[var(--forge-bg-workshop)] via-[var(--forge-bg-anvil)] to-[var(--forge-bg-void)]",
                className
            )}>
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-[var(--ember)] mx-auto mb-4" />
                    <p className="text-[var(--forge-text-secondary)]">Loading Cluster Galaxy...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-full overflow-hidden",
                "bg-gradient-to-br from-[var(--forge-bg-workshop)] via-[var(--forge-bg-anvil)] to-[var(--forge-bg-void)]",
                interactive && "cursor-grab active:cursor-grabbing",
                className
            )}
            onMouseMove={(e) => {
                handleMouseMove(e);
                handleMouseMoveCanvas(e);
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            data-testid="clustered-knowledge-universe"
        >
            {/* Canvas Renderer */}
            <UniverseCanvas
                nodes={nodesToRender}
                connections={effectiveUniverseData.connections}
                coordinator={world.coordinator}
                width={dimensions.width}
                height={dimensions.height}
                hoveredNodeId={hoveredNodeId}
                selectedNodeId={selectedNodeId}
                onNodeHover={handleNodeHover}
                onNodeClick={handleNodeClick}
                reducedMotion={prefersReducedMotion}
                nodeOpacityOverrides={lodState.nodeOpacities}
            />

            {/* LOD Level Indicator */}
            {showLODIndicator && enableClustering && (
                <AnimatePresence mode="wait">
                    <LODLevelIndicator
                        key={lodState.lodLevel}
                        level={lodState.lodLevel}
                        nodeCount={nodesToRender.length}
                    />
                </AnimatePresence>
            )}

            {/* Zoom Level Indicator (legacy) */}
            {!showLODIndicator && (
                <AnimatePresence mode="wait">
                    <ZoomLevelIndicator key={world.zoomLevel} level={world.zoomLevel} />
                </AnimatePresence>
            )}

            {/* Controls */}
            {showControls && (
                <UniverseControls
                    currentZoomLevel={world.zoomLevel}
                    scale={world.scale}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomLevelChange={(level) => worldRef.current.setZoomLevel(level)}
                    onReset={() => {
                        worldRef.current.reset();
                        // Reset to galaxy view when reset
                        collapseToCluster("galaxy-cluster");
                    }}
                />
            )}

            {/* Stats */}
            {showStats && (
                <StatsDisplay
                    nodeCount={effectiveUniverseData.nodeCount}
                    visibleCount={nodesToRender.length}
                    fps={fps}
                />
            )}

            {/* Semantic Breadcrumb Navigation */}
            {showBreadcrumbs && semanticZoom.breadcrumbs.length > 1 && (
                <div className="absolute top-6 left-6" data-testid="universe-breadcrumb-container">
                    <SemanticBreadcrumb
                        breadcrumbs={semanticZoom.breadcrumbs}
                        currentLevel={semanticZoom.currentLevel}
                        onNavigate={handleBreadcrumbNavigate}
                    />
                </div>
            )}

            {/* Position Indicator */}
            {showPositionIndicator && (
                <div className="absolute top-6 left-6" data-testid="universe-position-container">
                    <PositionIndicator
                        positionDescription={semanticZoom.positionDescription}
                    />
                </div>
            )}

            {/* Semantic Tooltip */}
            {hoveredNode && tooltipContent && (
                <SemanticTooltip
                    content={tooltipContent}
                    zoomLevel={semanticZoom.currentLevel}
                    x={mousePosition.x}
                    y={mousePosition.y}
                    fetchState={tooltipFetchState}
                />
            )}

            {/* LOD Transition Indicator */}
            {lodState.transition && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center"
                >
                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--forge-bg-card)]/90 backdrop-blur-sm rounded-full border border-[var(--ember)]/30">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Sparkles size={16} className="text-[var(--ember)]" />
                        </motion.div>
                        <span className="text-sm text-[var(--forge-text-secondary)]">
                            Transitioning view...
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Instructions overlay */}
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 4, duration: 1 }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center pointer-events-none"
            >
                <p className="text-[var(--forge-text-muted)] text-sm">
                    Scroll to zoom through cluster levels • Click clusters to explore • Drag to pan
                </p>
            </motion.div>
        </div>
    );
}

export default ClusteredKnowledgeUniverse;
