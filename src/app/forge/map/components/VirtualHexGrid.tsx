"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MapNode } from "@/app/features/knowledge-map/lib/types";
import type { ViewportState, HexLayoutNode } from "../lib/types";
import type { NodeCluster } from "../lib/lodController";
import type { VisibleConnection } from "../lib/connectionCuller";
import { useProgressiveMap } from "../lib/useProgressiveMap";
import { MIN_SCALE, MAX_SCALE } from "../lib/hexUtils";
import { HexNode } from "./HexNode";
import { NodeContextMenu } from "./NodeContextMenu";
import type { NodeStatusMap } from "../lib/useNodeStatus";
import { STATUS_STYLES } from "../lib/types";

interface VirtualHexGridProps {
    nodes: MapNode[];
    viewport: ViewportState;
    setViewport: (v: ViewportState | ((prev: ViewportState) => ViewportState)) => void;
    onDrillDown: (nodeId: string) => void;
    onGoBack: () => void;
    domainId?: string;
    allNodes?: Map<string, MapNode>;
    nodeStatuses?: NodeStatusMap;
    onRetryGeneration?: (nodeId: string) => void;
    onOpenChapter?: (nodeId: string) => void;
    onGenerateContent?: (nodeId: string) => void;
    onRegenerateContent?: (nodeId: string) => void;
    canGoBack?: boolean;
    highlightedNodeIds?: Set<string>;
    /** Enable progressive loading optimizations */
    enableProgressive?: boolean;
}

/**
 * Cluster node component for far zoom levels
 */
function ClusterNode({
    cluster,
    scale,
    onClick,
}: {
    cluster: NodeCluster;
    scale: number;
    onClick: () => void;
}) {
    const inverseScale = 1 / scale;
    const style = STATUS_STYLES[cluster.dominantStatus] ?? STATUS_STYLES.available;

    return (
        <g onClick={onClick} style={{ cursor: "pointer" }}>
            {/* Cluster background */}
            <motion.circle
                cx={cluster.center.x}
                cy={cluster.center.y}
                r={cluster.radius}
                fill={`${style.fill}20`}
                stroke={style.fill}
                strokeWidth={2}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.7 }}
                whileHover={{ scale: 1.05, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />

            {/* Count badge */}
            <text
                x={cluster.center.x}
                y={cluster.center.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={style.fill}
                fontSize={Math.max(14, 20 * inverseScale)}
                fontWeight="bold"
            >
                {cluster.count}
            </text>

            {/* Progress indicator */}
            {cluster.progress > 0 && (
                <circle
                    cx={cluster.center.x}
                    cy={cluster.center.y}
                    r={cluster.radius + 5}
                    fill="none"
                    stroke="var(--forge-success)"
                    strokeWidth={3}
                    strokeDasharray={`${(cluster.progress / 100) * 2 * Math.PI * (cluster.radius + 5)} ${2 * Math.PI * (cluster.radius + 5)}`}
                    transform={`rotate(-90 ${cluster.center.x} ${cluster.center.y})`}
                    opacity={0.6}
                />
            )}
        </g>
    );
}

/**
 * Connection line component with optional clipping
 */
function ConnectionLine({
    connection,
    index,
}: {
    connection: VisibleConnection;
    index: number;
}) {
    const { fromPoint, toPoint, clipStart, clipEnd } = connection;

    const startX = clipStart?.x ?? fromPoint.x;
    const startY = clipStart?.y ?? fromPoint.y;
    const endX = clipEnd?.x ?? toPoint.x;
    const endY = clipEnd?.y ?? toPoint.y;

    // Calculate curve control point
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const offsetX = (endY - startY) * 0.1;
    const offsetY = (startX - endX) * 0.1;

    return (
        <motion.path
            d={`M ${startX} ${startY} Q ${midX + offsetX} ${midY + offsetY} ${endX} ${endY}`}
            stroke="rgba(100,116,139,0.12)"
            strokeWidth={1.5}
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.01, 0.5) }}
        />
    );
}

/**
 * Performance overlay for debugging
 */
function PerformanceOverlay({
    metrics,
    visibleCount,
    totalCount,
    lodTier,
}: {
    metrics: { lastFrameTime: number; renderCount: number; cacheHitRate: number };
    visibleCount: number;
    totalCount: number;
    lodTier: string;
}) {
    return (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded font-mono pointer-events-none">
            <div>Frame: {metrics.lastFrameTime.toFixed(1)}ms</div>
            <div>Visible: {visibleCount}/{totalCount}</div>
            <div>LOD: {lodTier}</div>
            <div>Cache: {(metrics.cacheHitRate * 100).toFixed(0)}%</div>
        </div>
    );
}

export function VirtualHexGrid({
    nodes,
    viewport,
    setViewport,
    onDrillDown,
    onGoBack,
    domainId,
    allNodes,
    nodeStatuses,
    onRetryGeneration,
    onOpenChapter,
    onGenerateContent,
    onRegenerateContent,
    canGoBack = true,
    highlightedNodeIds,
    enableProgressive = true,
}: VirtualHexGridProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragDistance, setDragDistance] = useState(0);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [showPerf, setShowPerf] = useState(false);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        node: HexLayoutNode;
        position: { x: number; y: number };
    } | null>(null);

    // Progressive map hook
    const progressive = useProgressiveMap(
        nodes,
        viewport,
        dimensions,
        domainId,
        {
            enablePrefetch: enableProgressive,
            enableLOD: enableProgressive,
            enableConnectionCulling: enableProgressive,
            maxRenderNodes: 200,
        }
    );

    // Use progressive visible nodes or fall back to all layout nodes
    const visibleNodes = enableProgressive
        ? progressive.visibleNodes
        : progressive.allLayoutNodes;

    const visibleClusters = enableProgressive ? progressive.visibleClusters : [];
    const visibleConnections = enableProgressive ? progressive.visibleConnections : [];

    // Track dimensions
    useEffect(() => {
        const updateDimensions = () => {
            if (svgRef.current) {
                const rect = svgRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height });
            }
        };
        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "=" || e.key === "+") {
                e.preventDefault();
                setViewport(prev => ({
                    ...prev,
                    scale: Math.min(MAX_SCALE, prev.scale * 1.2),
                }));
            } else if (e.key === "-" || e.key === "_") {
                e.preventDefault();
                setViewport(prev => ({
                    ...prev,
                    scale: Math.max(MIN_SCALE, prev.scale / 1.2),
                }));
            } else if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                setViewport({ scale: 1, offsetX: 0, offsetY: 0 });
            } else if (e.key === "Escape") {
                e.preventDefault();
                onGoBack();
            } else if (e.key === "p" && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                setShowPerf(prev => !prev);
            } else if (e.key === "Backspace" && !e.ctrlKey && !e.metaKey) {
                if (document.activeElement?.tagName !== "INPUT") {
                    e.preventDefault();
                    onGoBack();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setViewport, onGoBack]);

    // Context menu handlers
    const handleNodeContextMenu = useCallback((e: React.MouseEvent, node: HexLayoutNode) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ node, position: { x: e.clientX, y: e.clientY } });
    }, []);

    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    const handleOpenChapter = useCallback((nodeId: string) => {
        onOpenChapter?.(nodeId);
        closeContextMenu();
    }, [onOpenChapter, closeContextMenu]);

    const handleGenerateContent = useCallback((nodeId: string) => {
        onGenerateContent?.(nodeId);
        closeContextMenu();
    }, [onGenerateContent, closeContextMenu]);

    const handleRegenerateContent = useCallback((nodeId: string) => {
        onRegenerateContent?.(nodeId);
        closeContextMenu();
    }, [onRegenerateContent, closeContextMenu]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (canGoBack) onGoBack();
    }, [onGoBack, canGoBack]);

    // Mouse handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - viewport.offsetX, y: e.clientY - viewport.offsetY });
        setDragDistance(0);
    }, [viewport.offsetX, viewport.offsetY]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        const newOffsetX = e.clientX - dragStart.x;
        const newOffsetY = e.clientY - dragStart.y;
        const dx = newOffsetX - viewport.offsetX;
        const dy = newOffsetY - viewport.offsetY;
        setDragDistance(prev => prev + Math.sqrt(dx * dx + dy * dy));
        setViewport(prev => ({ ...prev, offsetX: newOffsetX, offsetY: newOffsetY }));
    }, [isDragging, dragStart, viewport.offsetX, viewport.offsetY, setViewport]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale * delta));

        const scaleRatio = newScale / viewport.scale;
        const newOffsetX = mouseX - (mouseX - viewport.offsetX) * scaleRatio;
        const newOffsetY = mouseY - (mouseY - viewport.offsetY) * scaleRatio;

        setViewport({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
    }, [viewport, setViewport]);

    const handleNodeClick = useCallback((nodeId: string) => {
        if (dragDistance < 5) onDrillDown(nodeId);
    }, [dragDistance, onDrillDown]);

    // Handle cluster click - zoom into cluster area
    const handleClusterClick = useCallback((cluster: NodeCluster) => {
        if (cluster.nodeIds.length === 1) {
            onDrillDown(cluster.nodeIds[0]);
        } else {
            // Zoom to cluster center
            const targetScale = Math.min(1.5, viewport.scale * 2);
            setViewport({
                scale: targetScale,
                offsetX: dimensions.width / 2 - cluster.center.x * targetScale,
                offsetY: dimensions.height / 2 - cluster.center.y * targetScale,
            });
        }
    }, [viewport.scale, dimensions, setViewport, onDrillDown]);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden">
            {/* Background */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 40%, rgba(15, 23, 42, 0.04) 100%)",
                }}
            />

            <svg
                ref={svgRef}
                className="w-full h-full absolute inset-0"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onContextMenu={handleContextMenu}
                style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
                {/* Background pattern */}
                <defs>
                    <pattern
                        id="grid-dots-virtual"
                        width="32"
                        height="32"
                        patternUnits="userSpaceOnUse"
                        patternTransform={`translate(${viewport.offsetX % 32}, ${viewport.offsetY % 32})`}
                    >
                        <circle cx="16" cy="16" r="1" fill="rgba(100,116,139,0.15)" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-dots-virtual)" />

                {/* Transformed content */}
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    transform={`translate(${viewport.offsetX}, ${viewport.offsetY}) scale(${viewport.scale})`}
                >
                    {/* Connections - only visible ones */}
                    {visibleConnections.map((conn, i) => (
                        <ConnectionLine key={conn.id} connection={conn} index={i} />
                    ))}

                    {/* Clusters for far zoom */}
                    {visibleClusters.map(cluster => (
                        <ClusterNode
                            key={cluster.id}
                            cluster={cluster}
                            scale={viewport.scale}
                            onClick={() => handleClusterClick(cluster)}
                        />
                    ))}

                    {/* Nodes - only visible ones */}
                    <AnimatePresence mode="popLayout">
                        {visibleNodes
                            .slice()
                            .sort((a, b) => {
                                if (a.id === hoveredNodeId) return 1;
                                if (b.id === hoveredNodeId) return -1;
                                return 0;
                            })
                            .map(node => {
                                const status = nodeStatuses?.[node.id];
                                return (
                                    <HexNode
                                        key={node.id}
                                        node={node}
                                        scale={viewport.scale}
                                        onDrillDown={handleNodeClick}
                                        domainId={domainId}
                                        allNodes={allNodes}
                                        onHover={setHoveredNodeId}
                                        generationStatus={status?.status}
                                        generationProgress={status?.progress}
                                        onRetryGeneration={onRetryGeneration}
                                        onContextMenu={handleNodeContextMenu}
                                        isHighlighted={highlightedNodeIds?.has(node.id)}
                                    />
                                );
                            })}
                    </AnimatePresence>
                </motion.g>
            </svg>

            {/* Performance overlay (Ctrl+Shift+P to toggle) */}
            {showPerf && (
                <PerformanceOverlay
                    metrics={progressive.metrics}
                    visibleCount={progressive.visibleCount}
                    totalCount={progressive.totalNodes}
                    lodTier={progressive.lodTier}
                />
            )}

            {/* Keyboard hints */}
            <div className="absolute bottom-20 right-6 text-xs text-[var(--forge-text-muted)] pointer-events-none">
                <div className="flex items-center gap-2 opacity-60">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--forge-border-subtle)] font-mono">+</span>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--forge-border-subtle)] font-mono">-</span>
                    <span>Zoom</span>
                </div>
            </div>

            {/* Context menu */}
            {contextMenu && (
                <NodeContextMenu
                    node={contextMenu.node}
                    position={contextMenu.position}
                    onClose={closeContextMenu}
                    onOpenChapter={handleOpenChapter}
                    onGenerateContent={handleGenerateContent}
                    onRegenerateContent={handleRegenerateContent}
                    onDrillDown={(nodeId) => {
                        onDrillDown(nodeId);
                        closeContextMenu();
                    }}
                    onGoBack={() => {
                        onGoBack();
                        closeContextMenu();
                    }}
                    generationStatus={nodeStatuses?.[contextMenu.node.id]?.status}
                    generationProgress={nodeStatuses?.[contextMenu.node.id]?.progress}
                    canGoBack={canGoBack}
                />
            )}
        </div>
    );
}
