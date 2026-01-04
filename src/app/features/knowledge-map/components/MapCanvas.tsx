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
 * - Animated transitions between hierarchy levels via SceneGraph
 */

import React, { useRef, useEffect, useState, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import type { MapNode, MapConnection, ViewportState } from "../lib/types";
import { useMapLayout, type LayoutNode } from "../lib/useMapLayout";
import type { SceneTransitionConfig } from "../lib/useSceneGraph";
import { MapNode as MapNodeComponent } from "./MapNode";
import { MapConnections } from "./MapConnections";
import { HypotheticalNode } from "./HypotheticalNode";
import { EmptyStateIllustration } from "./EmptyStateIllustration";
import { HypotheticalMapNode } from "../lib/types";

// Stagger animation configuration for radial cascade reveal
const STAGGER_DELAY_MS = 50; // 50ms delay per node
const SPRING_CONFIG = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20,
};

/**
 * Calculate distance from center for radial reveal ordering
 * Nodes closer to the center appear first
 */
function calculateRadialIndex(
    node: LayoutNode,
    allNodes: LayoutNode[],
    containerWidth: number,
    containerHeight: number
): number {
    // Calculate center of the visible area
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // Calculate node's center position
    const nodeX = node.layoutPosition.x + node.width / 2;
    const nodeY = node.layoutPosition.y + node.height / 2;

    // Calculate distance from center
    const distance = Math.sqrt(
        Math.pow(nodeX - centerX, 2) + Math.pow(nodeY - centerY, 2)
    );

    return distance;
}

/**
 * Sort nodes by radial distance and return delay for each node
 */
function getNodeDelays(
    nodes: LayoutNode[],
    containerWidth: number,
    containerHeight: number
): Map<string, number> {
    const delays = new Map<string, number>();

    if (nodes.length === 0) return delays;

    // Calculate distances for all nodes
    const nodesWithDistance = nodes.map(node => ({
        id: node.id,
        distance: calculateRadialIndex(node, nodes, containerWidth, containerHeight),
    }));

    // Sort by distance (closest to center first)
    nodesWithDistance.sort((a, b) => a.distance - b.distance);

    // Assign delays based on sorted order
    nodesWithDistance.forEach((node, index) => {
        delays.set(node.id, index * (STAGGER_DELAY_MS / 1000)); // Convert to seconds
    });

    return delays;
}

// Gradient configurations for mesh background - using OpenForge ember color
const GRADIENT_VARIANTS = {
    default: {
        primary: "from-[var(--ember)]/10 via-[var(--ember-glow)]/15 to-[var(--forge-info)]/15",
        secondary: "from-[var(--forge-info)]/15 via-[var(--ember-glow)]/15 to-[var(--ember)]/10",
        tertiary: "from-[var(--ember-glow)]/10 via-[var(--ember)]/10 to-[var(--forge-error)]/10",
    },
};

/**
 * Map SceneGraph transition config to Framer Motion transition
 */
function getTransitionMotion(
    transition: SceneTransitionConfig | null | undefined,
    defaultDuration: number = 0.1
): Transition {
    if (!transition || transition.type === "instant" || transition.type === "pan") {
        return { duration: defaultDuration };
    }

    const durationSec = transition.duration / 1000;

    if (transition.easing === "spring") {
        return {
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: durationSec,
        };
    }

    return {
        duration: durationSec,
        ease: transition.easing === "ease-in-out" ? "easeInOut" : "easeOut",
    };
}

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
    /** Scene transition config for animated hierarchy changes */
    transition?: SceneTransitionConfig | null;
    /** Whether a scene transition is currently in progress */
    isTransitioning?: boolean;
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
    transition,
    isTransitioning = false,
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

    // Calculate radial delays for staggered animation
    const nodeDelays = useMemo(
        () => getNodeDelays(layoutNodes, containerSize.width, containerSize.height),
        [layoutNodes, containerSize.width, containerSize.height]
    );

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
                "bg-[var(--forge-bg-workshop)]",
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
                    opacity: isTransitioning && transition?.type === "drill_down" ? [0.8, 1] : 1,
                }}
                transition={getTransitionMotion(transition)}
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
                            animationDelay={nodeDelays.get(node.id) ?? 0}
                            springConfig={SPRING_CONFIG}
                        />
                    ))}
                    {/* Render Hypothetical Nodes */}
                    {hypotheticalNodes?.map((node, index) => (
                        <HypotheticalNode
                            key={node.id}
                            node={node}
                            isSelected={node.id === selectedNodeId}
                            onClick={() => onNodeSelect(node.id)}
                            animationDelay={(layoutNodes.length + index) * (STAGGER_DELAY_MS / 1000)}
                            springConfig={SPRING_CONFIG}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Empty state - Animated illustration */}
            {nodes.length === 0 && containerSize.width > 0 && (
                <EmptyStateIllustration />
            )}
        </div>
    );
});

export default MapCanvas;
