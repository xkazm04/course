"use client";

/**
 * Knowledge Universe Component
 *
 * The main component that assembles the zoomable knowledge universe.
 * Uses WorldCoordinator for unified camera/spatial management,
 * SemanticZoomController for progressive disclosure, and navigation UI.
 *
 * SEMANTIC ZOOM PATTERN:
 * The zoom levels (galaxy/solar/constellation/star) represent progressive
 * information disclosure, not just visual scales. This component integrates:
 * - Data fetching granularity (lazy-load details only at star level)
 * - Interaction affordances (hover shows different info per level)
 * - Learning context ("you are here" breadcrumbs)
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { UniverseCanvas } from "./UniverseCanvas";
import {
    UniverseControls,
    ZoomLevelIndicator,
    StatsDisplay,
} from "./UniverseControls";
import { SemanticTooltip } from "./SemanticTooltip";
import { SemanticBreadcrumb, PositionIndicator } from "./SemanticBreadcrumb";
import { useWorldCoordinator } from "../lib/useWorldCoordinator";
import { useSemanticZoom } from "../lib/useSemanticZoom";
import { useUniverseDataProvider, createMockUniverseData } from "../lib/universeDataProvider";
import type { UniverseNode, ZoomLevel } from "../lib/types";
import type { NodeDetailData } from "../lib/semanticZoomController";
import type { UniverseDataSourceType, LayoutStrategyType } from "../lib/universeDataProvider";
import { cn } from "@/app/shared/lib/utils";
import { useReducedMotion } from "@/app/shared/lib/motionPrimitives";

// ============================================================================
// TYPES
// ============================================================================

interface KnowledgeUniverseProps {
    className?: string;
    showControls?: boolean;
    showStats?: boolean;
    showBreadcrumbs?: boolean;
    showPositionIndicator?: boolean;
    interactive?: boolean;
    initialZoomLevel?: ZoomLevel;
    onNodeSelect?: (node: UniverseNode) => void;
    onNodeSelectChange?: (node: UniverseNode | null) => void;
    onNavigateToContent?: (node: UniverseNode) => void;
    /** @deprecated Use dataSource instead */
    useRealData?: boolean;
    /** Data source: "auto" tries Supabase first, falls back to mock */
    dataSource?: UniverseDataSourceType;
    /** Layout strategy for positioning nodes */
    layoutStrategy?: LayoutStrategyType;
    /** Optional function to fetch node details for progressive disclosure */
    fetchNodeDetails?: (nodeId: string, level: ZoomLevel) => Promise<NodeDetailData>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function KnowledgeUniverse({
    className,
    showControls = true,
    showStats = false,
    showBreadcrumbs = true,
    showPositionIndicator = false,
    interactive = true,
    initialZoomLevel = "solar",
    onNodeSelect,
    onNodeSelectChange,
    onNavigateToContent,
    useRealData = true,
    dataSource,
    layoutStrategy = "orbital",
    fetchNodeDetails: fetchNodeDetailsFn,
}: KnowledgeUniverseProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    // Viewport dimensions
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Determine data source - support deprecated useRealData prop
    const effectiveDataSource: UniverseDataSourceType = useMemo(() => {
        if (dataSource) return dataSource;
        return useRealData ? "auto" : "mock";
    }, [dataSource, useRealData]);

    // Use unified data provider
    const {
        data: universeData,
        isLoading: isLoadingData,
        error: dataError,
        activeSource,
    } = useUniverseDataProvider({
        source: effectiveDataSource,
        layoutStrategy,
        worldScale: 1000,
    });

    // Fallback to mock data if provider returns null
    const effectiveUniverseData = useMemo(() => {
        if (universeData) return universeData;
        // Generate fallback mock data synchronously
        return createMockUniverseData({ worldScale: 1000 }, layoutStrategy);
    }, [universeData, layoutStrategy]);

    // World coordinator (unified camera + spatial system)
    const world = useWorldCoordinator({
        initialScale: initialZoomLevel === "galaxy" ? 0.2 : initialZoomLevel === "solar" ? 0.5 : 1.0,
    });

    // Semantic zoom controller (progressive disclosure)
    const semanticZoom = useSemanticZoom({
        initialLevel: initialZoomLevel,
        nodes: effectiveUniverseData.allNodes,
        fetchNodeDetails: fetchNodeDetailsFn,
        onZoomLevelChange: (newLevel, oldLevel) => {
            // Sync world coordinator with semantic zoom level changes
            world.setZoomLevel(newLevel);
        },
    });

    // Interaction state
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // FPS tracking (for stats display)
    const [fps, setFps] = useState(60);
    const frameTimesRef = useRef<number[]>([]);
    const lastFrameTimeRef = useRef<number>(performance.now());

    // Sync semantic zoom level with world coordinator zoom level
    useEffect(() => {
        if (world.zoomLevel !== semanticZoom.currentLevel) {
            semanticZoom.setZoomLevel(world.zoomLevel);
        }
    }, [world.zoomLevel, semanticZoom]);

    // ========================================================================
    // VIEWPORT SIZING
    // ========================================================================

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height });
                // Update coordinator viewport for consistent world-to-screen transforms
                world.setViewport(rect.width, rect.height);
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);

        return () => window.removeEventListener("resize", updateDimensions);
    }, [world]);

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

    const handleNodeHover = useCallback((nodeId: string | null) => {
        setHoveredNodeId(nodeId);

        // Fetch details for hovered node at deeper zoom levels (progressive disclosure)
        if (nodeId && semanticZoom.isHoverPreviewEnabled()) {
            semanticZoom.fetchNodeDetails(nodeId);
        }
    }, [semanticZoom]);

    const handleNodeClick = useCallback(
        (nodeId: string) => {
            const node = effectiveUniverseData.allNodes.find((n) => n.id === nodeId);
            if (!node) return;

            setSelectedNodeId(nodeId);
            onNodeSelect?.(node);
            onNodeSelectChange?.(node);

            // Update semantic zoom focus for breadcrumb navigation
            semanticZoom.setFocusedNode(node);

            // Get the click action from semantic zoom controller
            const clickAction = semanticZoom.getClickAction(node);

            switch (clickAction) {
                case "navigate-to-content":
                    // At star level, navigate to actual content
                    onNavigateToContent?.(node);
                    break;

                case "zoom-to-children":
                default:
                    // Zoom to node with intelligent scale calculation
                    world.zoomToNode(node);
                    break;
            }
        },
        [effectiveUniverseData.allNodes, world, onNodeSelect, onNodeSelectChange, onNavigateToContent, semanticZoom]
    );

    // Handle breadcrumb navigation
    const handleBreadcrumbNavigate = useCallback(
        (breadcrumbId: string) => {
            const { node, zoomLevel } = semanticZoom.navigateToBreadcrumb(breadcrumbId);

            // Update world coordinator to match navigation
            world.setZoomLevel(zoomLevel);

            if (node) {
                world.focusOn(node.x, node.y);
                setSelectedNodeId(node.id);
            } else {
                // Navigate to root (galaxy view)
                world.reset();
                setSelectedNodeId(null);
            }
        },
        [semanticZoom, world]
    );

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        // Use container-relative coordinates for tooltip positioning
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    }, []);

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            if (!interactive) return;
            e.preventDefault();
            world.zoom(e.deltaY);
        },
        [interactive, world]
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!interactive) return;
            world.handlePanStart(e.clientX, e.clientY);
        },
        [interactive, world]
    );

    const handleMouseUp = useCallback(() => {
        world.handlePanEnd();
    }, [world]);

    const handleMouseMoveCanvas = useCallback(
        (e: React.MouseEvent) => {
            if (!interactive) return;
            world.handlePanMove(e.clientX, e.clientY);
        },
        [interactive, world]
    );

    const handleZoomIn = useCallback(() => {
        world.zoomTo(world.scale * 1.5);
    }, [world]);

    const handleZoomOut = useCallback(() => {
        world.zoomTo(world.scale * 0.7);
    }, [world]);

    // Get hovered node for tooltip
    const hoveredNode = hoveredNodeId
        ? effectiveUniverseData.allNodes.find((n) => n.id === hoveredNodeId)
        : null;

    // Get semantic tooltip content for hovered node
    const tooltipContent = hoveredNode
        ? semanticZoom.getTooltipContent(hoveredNode)
        : null;

    // Get fetch state for tooltip loading indicator
    const tooltipFetchState = hoveredNodeId
        ? semanticZoom.getFetchState(hoveredNodeId)
        : "loaded";

    // Count visible nodes
    const visibleCount = useMemo(() => {
        return effectiveUniverseData.allNodes.filter((n) =>
            n.visibleAtZoom.includes(world.zoomLevel)
        ).length;
    }, [effectiveUniverseData.allNodes, world.zoomLevel]);

    // Loading state
    if (effectiveDataSource !== "mock" && isLoadingData) {
        return (
            <div className={cn(
                "relative w-full h-full overflow-hidden flex items-center justify-center",
                "bg-gradient-to-br from-[var(--forge-bg-workshop)] via-[var(--forge-bg-anvil)] to-[var(--forge-bg-void)]",
                className
            )}>
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-[var(--ember)] mx-auto mb-4" />
                    <p className="text-[var(--forge-text-secondary)]">Loading Knowledge Universe...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-full overflow-hidden",
                // Forge theme background with gradient
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
            data-testid="knowledge-universe"
        >
            {/* Canvas Renderer */}
            <UniverseCanvas
                nodes={effectiveUniverseData.allNodes}
                connections={effectiveUniverseData.connections}
                coordinator={world.coordinator}
                width={dimensions.width}
                height={dimensions.height}
                hoveredNodeId={hoveredNodeId}
                selectedNodeId={selectedNodeId}
                onNodeHover={handleNodeHover}
                onNodeClick={handleNodeClick}
                reducedMotion={prefersReducedMotion}
            />

            {/* Zoom Level Indicator */}
            <AnimatePresence mode="wait">
                <ZoomLevelIndicator key={world.zoomLevel} level={world.zoomLevel} />
            </AnimatePresence>

            {/* Controls */}
            {showControls && (
                <UniverseControls
                    currentZoomLevel={world.zoomLevel}
                    scale={world.scale}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomLevelChange={world.setZoomLevel}
                    onReset={world.reset}
                />
            )}

            {/* Stats */}
            {showStats && (
                <StatsDisplay
                    nodeCount={effectiveUniverseData.nodeCount}
                    visibleCount={visibleCount}
                    fps={fps}
                />
            )}

            {/* Semantic Breadcrumb Navigation (you are here) */}
            {showBreadcrumbs && semanticZoom.breadcrumbs.length > 1 && (
                <div className="absolute top-6 left-6" data-testid="universe-breadcrumb-container">
                    <SemanticBreadcrumb
                        breadcrumbs={semanticZoom.breadcrumbs}
                        currentLevel={semanticZoom.currentLevel}
                        onNavigate={handleBreadcrumbNavigate}
                    />
                </div>
            )}

            {/* Position Indicator (compact alternative to breadcrumbs) */}
            {showPositionIndicator && (
                <div className="absolute top-6 left-6" data-testid="universe-position-container">
                    <PositionIndicator
                        positionDescription={semanticZoom.positionDescription}
                    />
                </div>
            )}

            {/* Semantic Tooltip (zoom-level-aware) */}
            {hoveredNode && tooltipContent && (
                <SemanticTooltip
                    content={tooltipContent}
                    zoomLevel={semanticZoom.currentLevel}
                    x={mousePosition.x}
                    y={mousePosition.y}
                    fetchState={tooltipFetchState}
                />
            )}

            {/* Instructions overlay for first-time users */}
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 3, duration: 1 }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center pointer-events-none"
            >
                <p className="text-[var(--forge-text-muted)] text-sm">
                    Scroll to zoom • Drag to pan • Click a planet to explore
                </p>
            </motion.div>
        </div>
    );
}

// ============================================================================
// MINI PREVIEW COMPONENT
// ============================================================================

interface KnowledgeUniversePreviewProps {
    className?: string;
    onEnter?: () => void;
}

/**
 * A smaller, non-interactive preview of the universe for landing pages
 */
export function KnowledgeUniversePreview({
    className,
    onEnter,
}: KnowledgeUniversePreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
    const prefersReducedMotion = useReducedMotion();

    // Generate universe data using unified provider
    const universeData = useMemo(() => createMockUniverseData({ worldScale: 800 }), []);

    // Use world coordinator for unified camera/spatial management
    const world = useWorldCoordinator({ initialScale: 0.4 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height });
                world.setViewport(rect.width, rect.height);
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);

        return () => window.removeEventListener("resize", updateDimensions);
    }, [world]);

    // Gentle auto-rotation (disabled if reduced motion)
    useEffect(() => {
        if (prefersReducedMotion) return;

        const interval = setInterval(() => {
            const x = Math.sin(Date.now() * 0.0001) * 50;
            const y = Math.cos(Date.now() * 0.00015) * 30;
            world.coordinator.setCameraImmediate(x, y, 0.4);
        }, 50);

        return () => clearInterval(interval);
    }, [prefersReducedMotion, world.coordinator]);

    return (
        <motion.div
            ref={containerRef}
            className={cn(
                "relative w-full h-full overflow-hidden rounded-2xl cursor-pointer group",
                "bg-gradient-to-br from-[var(--forge-bg-workshop)] via-[var(--forge-bg-anvil)] to-[var(--forge-bg-void)]",
                "border border-[var(--forge-border-subtle)]",
                className
            )}
            onClick={onEnter}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            data-testid="knowledge-universe-preview"
        >
            <UniverseCanvas
                nodes={universeData.allNodes}
                connections={universeData.connections}
                coordinator={world.coordinator}
                width={dimensions.width}
                height={dimensions.height}
                hoveredNodeId={null}
                selectedNodeId={null}
                onNodeHover={() => {}}
                onNodeClick={() => {}}
                reducedMotion={prefersReducedMotion}
            />

            {/* Overlay gradient - Forge theme */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--forge-bg-void)] via-transparent to-transparent pointer-events-none" />

            {/* Call to action */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center bg-[var(--forge-bg-workshop)]/60 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={false}
            >
                <div className="text-center">
                    <p className="text-[var(--forge-text-primary)] font-bold text-lg">Explore the Knowledge Universe</p>
                    <p className="text-[var(--forge-text-muted)] text-sm">
                        {universeData.nodeCount.total} lessons across {universeData.nodeCount.planets} domains
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
