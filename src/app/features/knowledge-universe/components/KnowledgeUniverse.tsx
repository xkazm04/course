"use client";

/**
 * Knowledge Universe Component
 *
 * The main component that assembles the zoomable knowledge universe.
 * Combines the canvas renderer, camera controls, and navigation UI.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { UniverseCanvas, NodeTooltip } from "./UniverseCanvas";
import {
    UniverseControls,
    ZoomLevelIndicator,
    StatsDisplay,
} from "./UniverseControls";
import { useUniverseCamera } from "../lib/useUniverseCamera";
import { generateUniverseData, type UniverseData } from "../lib/universeData";
import type { UniverseNode, ZoomLevel } from "../lib/types";
import { cn } from "@/app/shared/lib/utils";
import { useReducedMotion } from "@/app/shared/lib/motionPrimitives";

// ============================================================================
// TYPES
// ============================================================================

interface KnowledgeUniverseProps {
    className?: string;
    showControls?: boolean;
    showStats?: boolean;
    interactive?: boolean;
    initialZoomLevel?: ZoomLevel;
    onNodeSelect?: (node: UniverseNode) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function KnowledgeUniverse({
    className,
    showControls = true,
    showStats = false,
    interactive = true,
    initialZoomLevel = "solar",
    onNodeSelect,
}: KnowledgeUniverseProps) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    // Viewport dimensions
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Generate universe data (memoized)
    const universeData = useMemo(() => generateUniverseData(1000), []);

    // Camera state
    const camera = useUniverseCamera({
        initialScale: initialZoomLevel === "galaxy" ? 0.2 : initialZoomLevel === "solar" ? 0.5 : 1.0,
    });

    // Interaction state
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // FPS tracking (for stats display)
    const [fps, setFps] = useState(60);
    const frameTimesRef = useRef<number[]>([]);
    const lastFrameTimeRef = useRef<number>(performance.now());

    // ========================================================================
    // VIEWPORT SIZING
    // ========================================================================

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height });
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);

        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

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
    }, []);

    const handleNodeClick = useCallback(
        (nodeId: string) => {
            const node = universeData.allNodes.find((n) => n.id === nodeId);
            if (!node) return;

            setSelectedNodeId(nodeId);
            onNodeSelect?.(node);

            // Focus on the node
            camera.focusOn(node.x, node.y, camera.camera.scale * 1.5);

            // Navigate for planets (domains)
            if (node.type === "planet") {
                const planet = node as { domainId: string };
                router.push(`/overview?domain=${planet.domainId}`);
            }
        },
        [universeData.allNodes, camera, onNodeSelect, router]
    );

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    }, []);

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            if (!interactive) return;
            e.preventDefault();
            camera.zoom(e.deltaY);
        },
        [interactive, camera]
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!interactive) return;
            camera.handlePanStart(e.clientX, e.clientY);
        },
        [interactive, camera]
    );

    const handleMouseUp = useCallback(() => {
        camera.handlePanEnd();
    }, [camera]);

    const handleMouseMoveCanvas = useCallback(
        (e: React.MouseEvent) => {
            if (!interactive) return;
            camera.handlePanMove(e.clientX, e.clientY);
        },
        [interactive, camera]
    );

    const handleZoomIn = useCallback(() => {
        camera.zoomTo(camera.camera.scale * 1.5);
    }, [camera]);

    const handleZoomOut = useCallback(() => {
        camera.zoomTo(camera.camera.scale * 0.7);
    }, [camera]);

    // Get hovered node for tooltip
    const hoveredNode = hoveredNodeId
        ? universeData.allNodes.find((n) => n.id === hoveredNodeId)
        : null;

    // Count visible nodes
    const visibleCount = useMemo(() => {
        return universeData.allNodes.filter((n) =>
            n.visibleAtZoom.includes(camera.zoomLevel)
        ).length;
    }, [universeData.allNodes, camera.zoomLevel]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-full overflow-hidden bg-[var(--forge-bg-workshop)]",
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
                nodes={universeData.allNodes}
                connections={universeData.connections}
                cameraX={camera.camera.x}
                cameraY={camera.camera.y}
                scale={camera.camera.scale}
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
                <ZoomLevelIndicator key={camera.zoomLevel} level={camera.zoomLevel} />
            </AnimatePresence>

            {/* Controls */}
            {showControls && (
                <UniverseControls
                    currentZoomLevel={camera.zoomLevel}
                    scale={camera.camera.scale}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomLevelChange={camera.setZoomLevel}
                    onReset={camera.reset}
                />
            )}

            {/* Stats */}
            {showStats && (
                <StatsDisplay
                    nodeCount={universeData.nodeCount}
                    visibleCount={visibleCount}
                    fps={fps}
                />
            )}

            {/* Node Tooltip */}
            {hoveredNode && (
                <NodeTooltip
                    node={hoveredNode}
                    x={mousePosition.x}
                    y={mousePosition.y}
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

    // Generate universe data
    const universeData = useMemo(() => generateUniverseData(800), []);

    // Simple animated camera
    const [camera, setCamera] = useState({ x: 0, y: 0, scale: 0.4 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height });
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);

        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // Gentle auto-rotation (disabled if reduced motion)
    useEffect(() => {
        if (prefersReducedMotion) return;

        const interval = setInterval(() => {
            setCamera((prev) => ({
                ...prev,
                x: Math.sin(Date.now() * 0.0001) * 50,
                y: Math.cos(Date.now() * 0.00015) * 30,
            }));
        }, 50);

        return () => clearInterval(interval);
    }, [prefersReducedMotion]);

    return (
        <motion.div
            ref={containerRef}
            className={cn(
                "relative w-full h-full overflow-hidden rounded-2xl bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)] cursor-pointer group",
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
                cameraX={camera.x}
                cameraY={camera.y}
                scale={camera.scale}
                width={dimensions.width}
                height={dimensions.height}
                hoveredNodeId={null}
                selectedNodeId={null}
                onNodeHover={() => {}}
                onNodeClick={() => {}}
                reducedMotion={prefersReducedMotion}
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--forge-bg-workshop)] via-transparent to-transparent pointer-events-none" />

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
