"use client";

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/app/shared/lib/utils";
import {
    CurriculumNode,
    CurriculumConnection,
    CurriculumData,
    ViewportState,
    DEFAULT_VIEWPORT,
    getCategoryMeta,
} from "../lib/curriculumTypes";
import { calculateCanvasBounds, getVisibleNodes, getVisibleConnections } from "../lib/curriculumPositions";
import { KnowledgeMapNode } from "./KnowledgeMapNode";
import { SkillMasteryLevel, SKILL_GAP_COLORS } from "../lib/skillGapAnalysis";

interface KnowledgeMapCanvasProps {
    data: CurriculumData;
    selectedNode: CurriculumNode | null;
    onSelectNode: (node: CurriculumNode | null) => void;
    viewport: ViewportState;
    onViewportChange: (viewport: ViewportState) => void;
    categoryFilter: string | null;
    focusMode?: boolean;
    focusedNodeIds?: Set<string>;
    skillGapMode?: boolean;
    getNodeMastery?: (nodeId: string) => SkillMasteryLevel | null;
    isRecommendedPath?: (fromId: string, toId: string) => boolean;
}

const CONNECTION_COLORS = {
    required: { stroke: "rgb(99, 102, 241)", opacity: 0.6 },     // indigo
    recommended: { stroke: "rgb(34, 197, 94)", opacity: 0.4 },   // green
    optional: { stroke: "rgb(148, 163, 184)", opacity: 0.25 },   // slate
};

/**
 * CSS Custom Property names for zero-React-render panning
 * These are updated via element.style.setProperty() during drag for GPU-accelerated transforms
 */
const CSS_VAR_TRANSLATE_X = "--km-translate-x";
const CSS_VAR_TRANSLATE_Y = "--km-translate-y";
const CSS_VAR_SCALE = "--km-scale";
const CSS_VAR_GRID_POS_X = "--km-grid-pos-x";
const CSS_VAR_GRID_POS_Y = "--km-grid-pos-y";
const CSS_VAR_GRID_SIZE = "--km-grid-size";

export const KnowledgeMapCanvas: React.FC<KnowledgeMapCanvasProps> = ({
    data,
    selectedNode,
    onSelectNode,
    viewport,
    onViewportChange,
    categoryFilter,
    focusMode = false,
    focusedNodeIds,
    skillGapMode = false,
    getNodeMastery,
    isRecommendedPath,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const transformContainerRef = useRef<HTMLDivElement>(null);
    const gridBackgroundRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

    // Ref-based tracking for smooth panning (no React re-renders during drag)
    // These hold the current transform values during drag operations
    const currentTransformRef = useRef<ViewportState>({
        translateX: viewport.translateX,
        translateY: viewport.translateY,
        scale: viewport.scale,
    });
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialTranslateRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);

    // Filter nodes by category
    const filteredNodes = useMemo(() => {
        if (!categoryFilter) return data.nodes;
        return data.nodes.filter(node => node.category === categoryFilter);
    }, [data.nodes, categoryFilter]);

    // Pre-build stable lookup Map for O(1) node access - stabilizes callback identity
    // and reduces per-frame work from O(n) find() to O(1) Map.get() per connection
    const nodeMap = useMemo(() => {
        const map = new Map<string, CurriculumNode>();
        for (const node of filteredNodes) {
            map.set(node.id, node);
        }
        return map;
    }, [filteredNodes]);

    // Filter connections to only show those between visible nodes
    const filteredConnections = useMemo(() => {
        const nodeIds = new Set(filteredNodes.map(n => n.id));
        return data.connections.filter(
            conn => nodeIds.has(conn.from) && nodeIds.has(conn.to)
        );
    }, [data.connections, filteredNodes]);

    // Calculate canvas dimensions
    const bounds = useMemo(() => calculateCanvasBounds(filteredNodes), [filteredNodes]);

    // Get visible nodes for performance
    const visibleNodes = useMemo(() => {
        return getVisibleNodes(filteredNodes, viewport, containerSize);
    }, [filteredNodes, viewport, containerSize]);

    // Get visible connections for performance (only render connections within viewport)
    const visibleConnections = useMemo(() => {
        return getVisibleConnections(filteredConnections, filteredNodes, viewport, containerSize);
    }, [filteredConnections, filteredNodes, viewport, containerSize]);

    // Track container size
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    // Sync ref with viewport prop when it changes from parent
    useEffect(() => {
        currentTransformRef.current = {
            translateX: viewport.translateX,
            translateY: viewport.translateY,
            scale: viewport.scale,
        };
        // Also update CSS variables to match new viewport
        applyCSSTransform(viewport.translateX, viewport.translateY, viewport.scale);
    }, [viewport.translateX, viewport.translateY, viewport.scale]);

    /**
     * Apply transform via CSS custom properties for GPU-accelerated, zero-React-render panning.
     * This bypasses React's reconciliation entirely during drag operations.
     * Similar pattern used by react-zoom-pan-pinch and similar libraries.
     */
    const applyCSSTransform = useCallback((translateX: number, translateY: number, scale: number) => {
        const container = containerRef.current;
        if (!container) return;

        const gridSize = 40 * scale;
        const gridPosX = translateX % gridSize;
        const gridPosY = translateY % gridSize;

        // Update CSS custom properties on the container - this triggers GPU compositing only
        container.style.setProperty(CSS_VAR_TRANSLATE_X, `${translateX}px`);
        container.style.setProperty(CSS_VAR_TRANSLATE_Y, `${translateY}px`);
        container.style.setProperty(CSS_VAR_SCALE, `${scale}`);
        container.style.setProperty(CSS_VAR_GRID_POS_X, `${gridPosX}px`);
        container.style.setProperty(CSS_VAR_GRID_POS_Y, `${gridPosY}px`);
        container.style.setProperty(CSS_VAR_GRID_SIZE, `${gridSize}px`);
    }, []);

    // Get connection style based on type and connected nodes
    // Uses pre-built nodeMap for O(1) lookups instead of O(n) find()
    const getConnectionStyle = useCallback((connection: CurriculumConnection) => {
        const fromNode = nodeMap.get(connection.from);
        const toNode = nodeMap.get(connection.to);

        if (!fromNode || !toNode) return CONNECTION_COLORS.optional;

        // If source is completed, make connection more visible
        if (fromNode.status === "completed") {
            if (toNode.status === "completed") return CONNECTION_COLORS.required;
            if (toNode.status === "in_progress") return CONNECTION_COLORS.required;
        }

        return CONNECTION_COLORS[connection.type];
    }, [nodeMap]);

    // Generate SVG path for curved connections
    // Uses pre-built nodeMap for O(1) lookups instead of O(n) find()
    const generateConnectionPath = useCallback((connection: CurriculumConnection) => {
        const fromNode = nodeMap.get(connection.from);
        const toNode = nodeMap.get(connection.to);

        if (!fromNode || !toNode) return "";

        const startX = fromNode.position.x + 80; // center of node
        const startY = fromNode.position.y + 60; // bottom of node
        const endX = toNode.position.x + 80;
        const endY = toNode.position.y; // top of node

        // Calculate control points for bezier curve
        const midY = (startY + endY) / 2;
        const controlY1 = startY + (midY - startY) * 0.8;
        const controlY2 = endY - (endY - midY) * 0.8;

        return `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;
    }, [nodeMap]);

    /**
     * Mouse event handlers for panning using ref-based tracking.
     * During drag: only CSS custom properties are updated (zero React renders)
     * On drag end: sync final position to React state for consistency
     */
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        isDraggingRef.current = true;

        // Store drag start position in refs (not state) to avoid re-renders
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialTranslateRef.current = {
            x: currentTransformRef.current.translateX,
            y: currentTransformRef.current.translateY,
        };
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDraggingRef.current) return;

        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;

        const newTranslateX = initialTranslateRef.current.x + deltaX;
        const newTranslateY = initialTranslateRef.current.y + deltaY;
        const currentScale = currentTransformRef.current.scale;

        // Update ref with new position (no React state update = no re-render)
        currentTransformRef.current.translateX = newTranslateX;
        currentTransformRef.current.translateY = newTranslateY;

        // Apply transform via CSS variables - GPU-accelerated, bypasses React entirely
        applyCSSTransform(newTranslateX, newTranslateY, currentScale);
    }, [applyCSSTransform]);

    const handleMouseUp = useCallback(() => {
        const wasDragging = isDraggingRef.current;
        setIsDragging(false);
        isDraggingRef.current = false;

        // Only sync to React state on drag end for proper state consistency
        // This is the only React render triggered during the entire pan operation
        if (wasDragging) {
            onViewportChange({
                translateX: currentTransformRef.current.translateX,
                translateY: currentTransformRef.current.translateY,
                scale: currentTransformRef.current.scale,
            });
        }
    }, [onViewportChange]);

    /**
     * Wheel event for zooming using ref-based tracking with RAF throttling.
     * Uses CSS variables for smooth, GPU-accelerated zoom transforms.
     */
    const rafZoomRef = useRef<number | null>(null);

    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;

        // Use ref-based viewport for continuous scrolling
        const currentViewport = currentTransformRef.current;
        const newScale = Math.max(0.3, Math.min(2, currentViewport.scale + delta));

        // Zoom toward mouse position
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const scaleRatio = newScale / currentViewport.scale;
            const newTranslateX = mouseX - (mouseX - currentViewport.translateX) * scaleRatio;
            const newTranslateY = mouseY - (mouseY - currentViewport.translateY) * scaleRatio;

            // Update ref immediately
            currentTransformRef.current = {
                scale: newScale,
                translateX: newTranslateX,
                translateY: newTranslateY,
            };

            // Apply CSS transform immediately for visual feedback
            applyCSSTransform(newTranslateX, newTranslateY, newScale);

            // Debounce React state sync to reduce re-renders during rapid scrolling
            if (rafZoomRef.current !== null) {
                cancelAnimationFrame(rafZoomRef.current);
            }

            rafZoomRef.current = requestAnimationFrame(() => {
                rafZoomRef.current = null;
                // Sync to React state after zoom gesture settles
                onViewportChange({
                    translateX: currentTransformRef.current.translateX,
                    translateY: currentTransformRef.current.translateY,
                    scale: currentTransformRef.current.scale,
                });
            });
        }
    }, [applyCSSTransform, onViewportChange]);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener("wheel", handleWheel, { passive: false });
            return () => {
                container.removeEventListener("wheel", handleWheel);
                // Cleanup RAF on unmount
                if (rafZoomRef.current !== null) {
                    cancelAnimationFrame(rafZoomRef.current);
                }
            };
        }
    }, [handleWheel]);

    // Handle click on canvas background to deselect
    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onSelectNode(null);
        }
    }, [onSelectNode]);

    // Initial CSS variable values for SSR/hydration
    const initialGridSize = 40 * viewport.scale;
    const initialGridPosX = viewport.translateX % initialGridSize;
    const initialGridPosY = viewport.translateY % initialGridSize;

    return (
        <div
            ref={containerRef}
            role="application"
            aria-roledescription="interactive learning map"
            aria-label={`Knowledge map with ${filteredNodes.length} nodes and ${filteredConnections.length} connections. Use mouse to pan and scroll to zoom.`}
            className={cn(
                "relative w-full h-full overflow-hidden rounded-2xl",
                "bg-gradient-to-br from-slate-50 via-white to-slate-100",
                "dark:from-slate-900 dark:via-slate-800 dark:to-slate-900",
                isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
            data-testid="knowledge-map-canvas"
            style={{
                // Set initial CSS variable values - these are updated via setProperty() during drag
                [CSS_VAR_TRANSLATE_X]: `${viewport.translateX}px`,
                [CSS_VAR_TRANSLATE_Y]: `${viewport.translateY}px`,
                [CSS_VAR_SCALE]: `${viewport.scale}`,
                [CSS_VAR_GRID_POS_X]: `${initialGridPosX}px`,
                [CSS_VAR_GRID_POS_Y]: `${initialGridPosY}px`,
                [CSS_VAR_GRID_SIZE]: `${initialGridSize}px`,
            } as React.CSSProperties}
        >
            {/* Grid Background - uses CSS variables for GPU-accelerated updates */}
            <div
                ref={gridBackgroundRef}
                className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none"
                style={{
                    backgroundSize: `var(${CSS_VAR_GRID_SIZE}) var(${CSS_VAR_GRID_SIZE})`,
                    backgroundImage: `
                        linear-gradient(to right, rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
                    `,
                    backgroundPosition: `var(${CSS_VAR_GRID_POS_X}) var(${CSS_VAR_GRID_POS_Y})`,
                }}
                data-testid="knowledge-map-grid"
            />

            {/* Radial gradient overlay */}
            <div className="absolute inset-0 bg-gradient-radial from-indigo-50/30 via-transparent to-transparent dark:from-indigo-950/20 pointer-events-none" />

            {/* Transformable Container - uses CSS variables for zero-React-render transforms */}
            <div
                ref={transformContainerRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                    transform: `translate(var(${CSS_VAR_TRANSLATE_X}), var(${CSS_VAR_TRANSLATE_Y})) scale(var(${CSS_VAR_SCALE}))`,
                    transformOrigin: "0 0",
                    width: bounds.width,
                    height: bounds.height,
                    willChange: isDragging ? "transform" : "auto",
                }}
                data-testid="knowledge-map-transform-container"
            >
                {/* SVG for connections - virtualized to only render connections within viewport */}
                <svg
                    className="absolute inset-0 w-full h-full"
                    style={{ width: bounds.width, height: bounds.height }}
                    data-testid="knowledge-map-connections-svg"
                >
                    <defs>
                        {/* Arrow markers for different connection types */}
                        <marker
                            id="arrow-required"
                            markerWidth="8"
                            markerHeight="6"
                            refX="7"
                            refY="3"
                            orient="auto"
                        >
                            <polygon
                                points="0 0, 8 3, 0 6"
                                fill="rgb(99, 102, 241)"
                            />
                        </marker>
                        <marker
                            id="arrow-recommended"
                            markerWidth="8"
                            markerHeight="6"
                            refX="7"
                            refY="3"
                            orient="auto"
                        >
                            <polygon
                                points="0 0, 8 3, 0 6"
                                fill="rgb(34, 197, 94)"
                            />
                        </marker>
                        <marker
                            id="arrow-optional"
                            markerWidth="8"
                            markerHeight="6"
                            refX="7"
                            refY="3"
                            orient="auto"
                        >
                            <polygon
                                points="0 0, 8 3, 0 6"
                                fill="rgb(148, 163, 184)"
                            />
                        </marker>
                        {/* Gradient for recommended learning paths in skill gap mode */}
                        <linearGradient id="recommended-path-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgb(34, 197, 94)" /> {/* emerald-500 */}
                            <stop offset="50%" stopColor="rgb(245, 158, 11)" /> {/* amber-500 */}
                            <stop offset="100%" stopColor="rgb(239, 68, 68)" /> {/* red-500 */}
                        </linearGradient>
                    </defs>

                    {/* Render connections - virtualized to only show those within viewport */}
                    {/* Using static SVG paths with CSS animation for performance - avoids 150+ individual Framer Motion animation instances */}
                    <g className="km-connections-group">
                        {visibleConnections.map((connection) => {
                            const style = getConnectionStyle(connection);
                            const path = generateConnectionPath(connection);
                            const markerId = `arrow-${connection.type}`;

                            // Highlight connections to/from selected node
                            const isHighlighted = selectedNode && (
                                connection.from === selectedNode.id ||
                                connection.to === selectedNode.id
                            );

                            // Determine if connection is in focus path
                            const isInFocusPath = focusMode && focusedNodeIds
                                ? focusedNodeIds.has(connection.from) && focusedNodeIds.has(connection.to)
                                : true;

                            // Calculate opacity based on focus mode
                            const focusOpacity = focusMode && !isInFocusPath ? 0.1 : 1;

                            // Skill gap mode: thicker lines for recommended paths
                            const isRecommended = skillGapMode && isRecommendedPath?.(connection.from, connection.to);

                            // Determine stroke width: recommended paths are thicker
                            let strokeWidth = connection.type === "optional" ? 1 : 2;
                            if (isHighlighted) {
                                strokeWidth = 3;
                            }
                            if (isRecommended) {
                                strokeWidth = 5; // Thick line for recommended learning paths
                            }

                            // In skill gap mode, use gradient coloring for recommended paths
                            const strokeColor = isRecommended
                                ? "url(#recommended-path-gradient)"
                                : style.stroke;

                            return (
                                <path
                                    key={`${connection.from}-${connection.to}`}
                                    className={cn(
                                        "km-connection-path",
                                        isRecommended && "km-recommended-path"
                                    )}
                                    d={path}
                                    fill="none"
                                    stroke={strokeColor}
                                    strokeWidth={strokeWidth}
                                    strokeOpacity={(isHighlighted || isRecommended ? 1 : style.opacity) * focusOpacity}
                                    strokeDasharray={connection.type === "optional" && !isRecommended ? "4 3" : undefined}
                                    markerEnd={isRecommended ? undefined : `url(#${markerId})`}
                                    data-testid={`connection-${connection.from}-${connection.to}`}
                                    data-recommended={isRecommended}
                                />
                            );
                        })}
                    </g>
                </svg>

                {/* Render nodes */}
                <div className="pointer-events-auto" data-testid="knowledge-map-nodes-container">
                    {visibleNodes.map((node) => {
                        const isInFocusPath = focusMode && focusedNodeIds
                            ? focusedNodeIds.has(node.id)
                            : true;

                        // Get skill mastery level for skill gap mode
                        const masteryLevel = skillGapMode && getNodeMastery
                            ? getNodeMastery(node.id)
                            : null;

                        return (
                            <KnowledgeMapNode
                                key={node.id}
                                node={node}
                                isSelected={selectedNode?.id === node.id}
                                onSelect={onSelectNode}
                                scale={viewport.scale}
                                isFocused={!focusMode || isInFocusPath}
                                focusModeActive={focusMode}
                                skillGapMode={skillGapMode}
                                masteryLevel={masteryLevel}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Zoom indicator - aria-live announces zoom changes to screen readers */}
            <div
                className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 pointer-events-none"
                data-testid="knowledge-map-zoom-indicator"
                aria-live="polite"
                aria-atomic="true"
                role="status"
            >
                <span className="sr-only">Zoom level: </span>{Math.round(viewport.scale * 100)}%
            </div>

            {/* Node and connection count - aria-live announces count changes to screen readers */}
            <div
                className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 pointer-events-none"
                data-testid="knowledge-map-stats-indicator"
                aria-live="polite"
                aria-atomic="true"
                role="status"
            >
                <span data-testid="knowledge-map-node-count">
                    <span className="sr-only">Showing </span>{visibleNodes.length}/{filteredNodes.length} nodes
                </span>
                <span className="mx-1.5 text-slate-400 dark:text-slate-500" aria-hidden="true">|</span>
                <span data-testid="knowledge-map-connection-count">
                    <span className="sr-only"> and </span>{visibleConnections.length}/{filteredConnections.length} connections
                </span>
            </div>
        </div>
    );
};

export default KnowledgeMapCanvas;
