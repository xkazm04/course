"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MapNode } from "@/app/features/knowledge-map/lib/types";
import type { ViewportState, HexLayoutNode } from "../lib/types";
import { layoutHexPuzzle, MIN_SCALE, MAX_SCALE } from "../lib/hexUtils";
import { HexNode } from "./HexNode";
import type { NodeStatusMap } from "../lib/useNodeStatus";

interface HexGridProps {
    nodes: MapNode[];
    viewport: ViewportState;
    setViewport: (v: ViewportState | ((prev: ViewportState) => ViewportState)) => void;
    onDrillDown: (nodeId: string) => void;
    onGoBack: () => void;
    domainId?: string;
    allNodes?: Map<string, MapNode>;
    nodeStatuses?: NodeStatusMap;
    onRetryGeneration?: (nodeId: string) => void;
}

// Animated background component for visual polish
function AnimatedBackground({ viewport }: { viewport: ViewportState }) {
    return (
        <>
            {/* Ambient gradient blobs */}
            <motion.div
                animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    rotate: { duration: 60, repeat: Infinity, ease: "linear" },
                    scale: { duration: 20, repeat: Infinity },
                }}
                className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2
                           bg-gradient-to-br from-[var(--ember)]/15 via-[var(--ember-glow)]/10 to-transparent
                           rounded-full blur-3xl pointer-events-none"
            />
            <motion.div
                animate={{
                    rotate: -360,
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    rotate: { duration: 80, repeat: Infinity, ease: "linear" },
                    scale: { duration: 25, repeat: Infinity },
                }}
                className="absolute top-1/4 -right-1/4 w-2/3 h-2/3
                           bg-gradient-to-tl from-[var(--forge-info)]/12 via-[var(--forge-info)]/8 to-transparent
                           rounded-full blur-3xl pointer-events-none"
            />

            {/* Subtle radial vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 40%, rgba(15, 23, 42, 0.04) 100%)",
                }}
            />
        </>
    );
}

export function HexGrid({
    nodes,
    viewport,
    setViewport,
    onDrillDown,
    onGoBack,
    domainId,
    allNodes,
    nodeStatuses,
    onRetryGeneration,
}: HexGridProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragDistance, setDragDistance] = useState(0);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    // Right-click handler to go back
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        onGoBack();
    }, [onGoBack]);

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

    // Keyboard shortcuts for zoom and navigation
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
                // Escape key to go back
                e.preventDefault();
                onGoBack();
            } else if (e.key === "Backspace" && !e.ctrlKey && !e.metaKey) {
                // Backspace to go back (when not in an input)
                if (document.activeElement?.tagName !== "INPUT") {
                    e.preventDefault();
                    onGoBack();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setViewport, onGoBack]);

    // Layout nodes in hexagonal puzzle pattern
    const layoutNodes: HexLayoutNode[] = layoutHexPuzzle(
        nodes,
        dimensions.width,
        dimensions.height,
        viewport.scale
    );

    // Mouse handlers for panning
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

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Wheel handler for zooming
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale * delta));

        // Zoom toward mouse position
        const scaleRatio = newScale / viewport.scale;
        const newOffsetX = mouseX - (mouseX - viewport.offsetX) * scaleRatio;
        const newOffsetY = mouseY - (mouseY - viewport.offsetY) * scaleRatio;

        setViewport({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
    }, [viewport, setViewport]);

    // Click handler with drag detection
    const handleNodeClick = useCallback((nodeId: string) => {
        // Only trigger if minimal drag distance
        if (dragDistance < 5) {
            onDrillDown(nodeId);
        }
    }, [dragDistance, onDrillDown]);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden">
            {/* Animated ambient background */}
            <AnimatedBackground viewport={viewport} />

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
                        id="grid-dots"
                        width="32"
                        height="32"
                        patternUnits="userSpaceOnUse"
                        patternTransform={`translate(${viewport.offsetX % 32}, ${viewport.offsetY % 32})`}
                    >
                        <circle cx="16" cy="16" r="1" fill="rgba(100,116,139,0.15)" />
                    </pattern>
                    {/* Glow filter for highlighted nodes */}
                    <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-dots)" />

            {/* Transformed content group */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                transform={`translate(${viewport.offsetX}, ${viewport.offsetY}) scale(${viewport.scale})`}
            >
                {/* Connection lines between adjacent hexes - curved paths */}
                {layoutNodes.map((node, i) =>
                    layoutNodes.slice(i + 1).map((other) => {
                        const dist = Math.sqrt(
                            Math.pow(node.pixel.x - other.pixel.x, 2) +
                            Math.pow(node.pixel.y - other.pixel.y, 2)
                        );
                        // Only connect nearby nodes with curved paths
                        if (dist < 250) {
                            const midX = (node.pixel.x + other.pixel.x) / 2;
                            const midY = (node.pixel.y + other.pixel.y) / 2;
                            // Slight curve offset
                            const offsetX = (other.pixel.y - node.pixel.y) * 0.1;
                            const offsetY = (node.pixel.x - other.pixel.x) * 0.1;

                            return (
                                <motion.path
                                    key={`${node.id}-${other.id}`}
                                    d={`M ${node.pixel.x} ${node.pixel.y} Q ${midX + offsetX} ${midY + offsetY} ${other.pixel.x} ${other.pixel.y}`}
                                    stroke="rgba(100,116,139,0.12)"
                                    strokeWidth={1.5}
                                    fill="none"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: i * 0.02 }}
                                />
                            );
                        }
                        return null;
                    })
                )}

                {/* Hex nodes - render hovered node last for tooltip layering */}
                <AnimatePresence mode="popLayout">
                    {layoutNodes
                        .slice()
                        .sort((a, b) => {
                            if (a.id === hoveredNodeId) return 1;
                            if (b.id === hoveredNodeId) return -1;
                            return 0;
                        })
                        .map((node) => {
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
                                />
                            );
                        })}
                </AnimatePresence>
            </motion.g>
            </svg>

            {/* Keyboard shortcut hints */}
            <div className="absolute bottom-20 right-6 text-xs text-[var(--forge-text-muted)] pointer-events-none">
                <div className="flex items-center gap-2 opacity-60">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--forge-border-subtle)] font-mono">+</span>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--forge-border-subtle)] font-mono">-</span>
                    <span>Zoom</span>
                </div>
            </div>
        </div>
    );
}
