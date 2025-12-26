"use client";

/**
 * MapCanvas Component
 *
 * Main canvas container for the knowledge map.
 * Features:
 * - Mesh gradient background with animated orbs
 * - Grid overlay that scales with zoom
 * - Pan/zoom support with gesture handling
 * - SVG connections + DOM nodes hybrid rendering
 */

import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import { DURATION_SLOW } from "@/app/shared/lib/motionPrimitives";
import type { MapNode, MapConnection, ViewportState } from "../lib/types";
import { useMapLayout, type LayoutNode } from "../lib/useMapLayout";
import { MapNode as MapNodeComponent } from "./MapNode";
import { MapConnections } from "./MapConnections";
import { HypotheticalNode } from "./HypotheticalNode";
import { HypotheticalMapNode } from "../lib/types";

// Gradient configurations for mesh background
const GRADIENT_VARIANTS = {
    default: {
        primary: "from-indigo-200/20 via-purple-200/20 to-blue-200/20 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-blue-900/20",
        secondary: "from-cyan-200/20 via-pink-200/20 to-indigo-200/20 dark:from-cyan-900/20 dark:via-pink-900/20 dark:to-indigo-900/20",
        tertiary: "from-violet-200/15 via-fuchsia-200/15 to-rose-200/15 dark:from-violet-900/15 dark:via-fuchsia-900/15 dark:to-rose-900/15",
    },
};

interface MapCanvasProps {
    nodes: MapNode[];
    hypotheticalNodes?: HypotheticalMapNode[];
    connections: MapConnection[];
    viewport: ViewportState;
    selectedNodeId: string | null;
    onNodeSelect: (nodeId: string) => void;
    onNodeDrillDown: (nodeId: string) => void;
    onBackgroundClick: () => void;
    viewportHandlers: {
        onPointerDown: (e: React.PointerEvent) => void;
        onPointerMove: (e: React.PointerEvent) => void;
        onPointerUp: (e: React.PointerEvent) => void;
        onPointerLeave: (e: React.PointerEvent) => void;
        onWheel: (e: React.WheelEvent) => void;
    };
    isPanning: boolean;
    className?: string;
}

export const MapCanvas: React.FC<MapCanvasProps> = memo(function MapCanvas({
    nodes,
    hypotheticalNodes = [],
    connections,
    viewport,
    selectedNodeId,
    onNodeSelect,
    onNodeDrillDown,
    onBackgroundClick,
    viewportHandlers,
    isPanning,
    className,
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Measure container size
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };

        updateSize();
        window.addEventListener("resize", updateSize);

        // Use ResizeObserver for more accurate sizing
        const observer = new ResizeObserver(updateSize);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener("resize", updateSize);
            observer.disconnect();
        };
    }, []);

    // Calculate layout
    const { layoutNodes, contentWidth, contentHeight } = useMapLayout(nodes, {
        containerWidth: containerSize.width,
        containerHeight: containerSize.height,
    });

    // Handle background click
    const handleBackgroundClick = useCallback(
        (e: React.MouseEvent) => {
            // Only trigger if clicking directly on the background
            if (e.target === e.currentTarget) {
                onBackgroundClick();
            }
        },
        [onBackgroundClick]
    );

    // Prevent wheel scroll from bubbling
    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            e.preventDefault();
            viewportHandlers.onWheel(e);
        },
        [viewportHandlers]
    );

    // Cursor style based on state
    const cursorStyle = isPanning ? "cursor-grabbing" : "cursor-grab";

    const gradients = GRADIENT_VARIANTS.default;

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-full overflow-hidden",
                "bg-gradient-to-br from-slate-50 via-white to-slate-100",
                "dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
                cursorStyle,
                className
            )}
            onPointerDown={viewportHandlers.onPointerDown}
            onPointerMove={viewportHandlers.onPointerMove}
            onPointerUp={viewportHandlers.onPointerUp}
            onPointerLeave={viewportHandlers.onPointerLeave}
            onWheel={handleWheel}
            onClick={handleBackgroundClick}
            data-testid="map-canvas"
        >
            {/* Mesh gradient background - Primary orb (top-left) */}
            <motion.div
                animate={{
                    rotate: 360,
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    rotate: { duration: 45, repeat: Infinity, ease: "linear" },
                    scale: { duration: 25, repeat: Infinity, ease: "easeInOut" },
                }}
                className={cn(
                    "absolute -top-[30%] -left-[20%] w-[70%] h-[70%]",
                    "bg-gradient-to-br rounded-full blur-[100px]",
                    "pointer-events-none",
                    gradients.primary
                )}
            />

            {/* Secondary orb (bottom-right) */}
            <motion.div
                animate={{
                    rotate: -360,
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    rotate: { duration: 55, repeat: Infinity, ease: "linear" },
                    scale: { duration: 30, repeat: Infinity, ease: "easeInOut" },
                }}
                className={cn(
                    "absolute top-[40%] right-[-15%] w-[60%] h-[60%]",
                    "bg-gradient-to-tl rounded-full blur-[100px]",
                    "pointer-events-none",
                    gradients.secondary
                )}
            />

            {/* Tertiary orb (center) */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                    scale: { duration: 20, repeat: Infinity, ease: "easeInOut" },
                    opacity: { duration: 15, repeat: Infinity, ease: "easeInOut" },
                }}
                className={cn(
                    "absolute top-[20%] left-[30%] w-[40%] h-[40%]",
                    "bg-gradient-to-r rounded-full blur-[80px]",
                    "pointer-events-none",
                    gradients.tertiary
                )}
            />

            {/* Grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgb(148 163 184 / 0.15) 1px, transparent 1px),
                        linear-gradient(to bottom, rgb(148 163 184 / 0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: `${40 * viewport.scale}px ${40 * viewport.scale}px`,
                    backgroundPosition: `${-viewport.offsetX * viewport.scale}px ${-viewport.offsetY * viewport.scale}px`,
                }}
            />

            {/* Radial gradient vignette for depth */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(15, 23, 42, 0.03) 100%)",
                }}
            />

            {/* Transformed content container */}
            <motion.div
                className="relative"
                style={{
                    transform: `translate(${-viewport.offsetX * viewport.scale}px, ${-viewport.offsetY * viewport.scale}px) scale(${viewport.scale})`,
                    transformOrigin: "0 0",
                    width: Math.max(contentWidth, containerSize.width / viewport.scale),
                    height: Math.max(contentHeight, containerSize.height / viewport.scale),
                }}
                animate={{
                    transform: `translate(${-viewport.offsetX * viewport.scale}px, ${-viewport.offsetY * viewport.scale}px) scale(${viewport.scale})`,
                }}
                transition={{ duration: 0.1 }}
            >
                {/* Connections layer (behind nodes) */}
                <MapConnections
                    connections={connections}
                    nodes={layoutNodes}
                    width={contentWidth}
                    height={contentHeight}
                />

                {/* Nodes layer */}
                <AnimatePresence mode="popLayout">
                    {layoutNodes.map((node) => (
                        <MapNodeComponent
                            key={node.id}
                            node={node}
                            isSelected={node.id === selectedNodeId}
                            onSelect={() => onNodeSelect(node.id)}
                            onDrillDown={() => onNodeDrillDown(node.id)}
                        />
                    ))}
                    {/* Render Hypothetical Nodes */}
                    {hypotheticalNodes?.map((node) => (
                        <HypotheticalNode
                            key={node.id}
                            node={node}
                            isSelected={node.id === selectedNodeId}
                            onClick={() => onNodeSelect(node.id)}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Empty state */}
            {nodes.length === 0 && containerSize.width > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-slate-500 dark:text-slate-400">
                        <p className="text-lg font-medium">No content available</p>
                        <p className="text-sm">Select a domain to explore its courses</p>
                    </div>
                </div>
            )}
        </div>
    );
});

export default MapCanvas;
