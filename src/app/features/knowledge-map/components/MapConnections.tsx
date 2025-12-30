"use client";

/**
 * MapConnections Component
 *
 * SVG layer for rendering bezier curve connections between nodes.
 * Uses tree hierarchy pattern with:
 * - Curved bezier paths from parent to child
 * - Arrow markers for direction
 * - Connection type styling (contains, prerequisite, related, next)
 * - Gradient highlighting for selected node paths
 */

import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import type { MapConnection, ConnectionType } from "../lib/types";
import type { LayoutNode } from "../lib/useMapLayout";
import { getNodeConnectionPoints } from "../lib/useMapLayout";

interface MapConnectionsProps {
    connections: MapConnection[];
    nodes: LayoutNode[];
    width: number;
    height: number;
    selectedNodeId?: string | null;
}

// Connection color configurations - using OpenForge ember for primary connections
const CONNECTION_STYLES: Record<ConnectionType, {
    stroke: string;
    strokeWidth: number;
    opacity: number;
    dashArray?: string;
}> = {
    contains: {
        stroke: "var(--ember)",  // ember primary
        strokeWidth: 2,
        opacity: 0.5,
    },
    prerequisite: {
        stroke: "rgb(34, 197, 94)",   // emerald
        strokeWidth: 2.5,
        opacity: 0.6,
    },
    next: {
        stroke: "rgb(59, 130, 246)",  // blue
        strokeWidth: 2,
        opacity: 0.5,
    },
    related: {
        stroke: "var(--forge-text-muted)", // muted
        strokeWidth: 1.5,
        opacity: 0.3,
        dashArray: "4 3",
    },
};

/**
 * Generate SVG path for a curved bezier connection
 * Uses tree-hierarchy style curves
 */
function generateConnectionPath(
    fromNode: LayoutNode,
    toNode: LayoutNode
): string {
    const fromPoints = getNodeConnectionPoints(fromNode);
    const toPoints = getNodeConnectionPoints(toNode);

    // Calculate relative positions
    const dx = toPoints.center.x - fromPoints.center.x;
    const dy = toPoints.center.y - fromPoints.center.y;

    let start: { x: number; y: number };
    let end: { x: number; y: number };

    // For tree hierarchy: typically connect bottom-to-top
    if (dy > 30) {
        // Target is below - connect bottom to top
        start = fromPoints.bottom;
        end = toPoints.top;
    } else if (dy < -30) {
        // Target is above - connect top to bottom
        start = fromPoints.top;
        end = toPoints.bottom;
    } else if (dx > 0) {
        // Target is to the right
        start = fromPoints.right;
        end = toPoints.left;
    } else {
        // Target is to the left
        start = fromPoints.left;
        end = toPoints.right;
    }

    // Calculate control points for smooth bezier curve
    const deltaY = end.y - start.y;
    const deltaX = end.x - start.x;

    // For vertical connections (tree hierarchy), use S-curve
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
        const controlY1 = start.y + deltaY * 0.4;
        const controlY2 = end.y - deltaY * 0.4;
        return `M ${start.x} ${start.y} C ${start.x} ${controlY1}, ${end.x} ${controlY2}, ${end.x} ${end.y}`;
    }

    // For horizontal connections
    const controlX1 = start.x + deltaX * 0.4;
    const controlX2 = end.x - deltaX * 0.4;
    return `M ${start.x} ${start.y} C ${controlX1} ${start.y}, ${controlX2} ${end.y}, ${end.x} ${end.y}`;
}

export const MapConnections: React.FC<MapConnectionsProps> = memo(function MapConnections({
    connections,
    nodes,
    width,
    height,
    selectedNodeId,
}) {
    // Create node lookup map for performance
    const nodeMap = useMemo(() => {
        const map = new Map<string, LayoutNode>();
        nodes.forEach(node => map.set(node.id, node));
        return map;
    }, [nodes]);

    // Generate paths with highlighting information
    const connectionPaths = useMemo(() => {
        return connections
            .map(conn => {
                const fromNode = nodeMap.get(conn.fromId);
                const toNode = nodeMap.get(conn.toId);

                if (!fromNode || !toNode) return null;

                const path = generateConnectionPath(fromNode, toNode);
                const style = CONNECTION_STYLES[conn.type];

                // Check if connection involves selected node
                const isHighlighted = selectedNodeId && (
                    conn.fromId === selectedNodeId ||
                    conn.toId === selectedNodeId
                );

                return {
                    id: conn.id,
                    path,
                    style,
                    type: conn.type,
                    isHighlighted,
                };
            })
            .filter(Boolean) as Array<{
                id: string;
                path: string;
                style: typeof CONNECTION_STYLES["contains"];
                type: ConnectionType;
                isHighlighted: boolean;
            }>;
    }, [connections, nodeMap, selectedNodeId]);

    if (connectionPaths.length === 0) {
        return null;
    }

    return (
        <svg
            className="absolute inset-0 pointer-events-none"
            width={width}
            height={height}
            style={{ overflow: "visible" }}
            data-testid="map-connections-svg"
        >
            <defs>
                {/* Arrow markers for different connection types */}
                <marker
                    id="arrow-contains"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                >
                    <polygon
                        points="0 0, 8 3, 0 6"
                        fill="rgb(255, 107, 53)"
                        opacity="0.7"
                    />
                </marker>
                <marker
                    id="arrow-prerequisite"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                >
                    <polygon
                        points="0 0, 8 3, 0 6"
                        fill="rgb(34, 197, 94)"
                        opacity="0.8"
                    />
                </marker>
                <marker
                    id="arrow-next"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                >
                    <polygon
                        points="0 0, 8 3, 0 6"
                        fill="rgb(59, 130, 246)"
                        opacity="0.7"
                    />
                </marker>
                <marker
                    id="arrow-related"
                    markerWidth="6"
                    markerHeight="4"
                    refX="5"
                    refY="2"
                    orient="auto"
                >
                    <polygon
                        points="0 0, 6 2, 0 4"
                        fill="rgb(120, 113, 108)"
                        opacity="0.5"
                    />
                </marker>

                {/* Gradient for highlighted paths */}
                <linearGradient id="highlight-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(255, 107, 53)" />   {/* ember */}
                    <stop offset="50%" stopColor="rgb(249, 115, 22)" />  {/* orange */}
                    <stop offset="100%" stopColor="rgb(234, 88, 12)" />  {/* dark orange */}
                </linearGradient>

                {/* Recommended path gradient */}
                <linearGradient id="recommended-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(34, 197, 94)" />   {/* emerald */}
                    <stop offset="50%" stopColor="rgb(245, 158, 11)" /> {/* amber */}
                    <stop offset="100%" stopColor="rgb(239, 68, 68)" /> {/* red */}
                </linearGradient>
            </defs>

            {/* Render connections - non-highlighted first, then highlighted on top */}
            <g className="connections-group">
                {connectionPaths.map((conn, index) => {
                    const markerId = `arrow-${conn.type}`;

                    return (
                        <motion.path
                            key={conn.id}
                            d={conn.path}
                            fill="none"
                            stroke={conn.isHighlighted ? "url(#highlight-gradient)" : conn.style.stroke}
                            strokeWidth={conn.isHighlighted ? conn.style.strokeWidth + 1 : conn.style.strokeWidth}
                            strokeOpacity={conn.isHighlighted ? 1 : conn.style.opacity}
                            strokeDasharray={conn.style.dashArray}
                            strokeLinecap="round"
                            markerEnd={`url(#${markerId})`}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{
                                pathLength: 1,
                                opacity: conn.isHighlighted ? 1 : conn.style.opacity
                            }}
                            transition={{
                                pathLength: { duration: 0.5, delay: index * 0.02 },
                                opacity: { duration: 0.3, delay: index * 0.02 },
                            }}
                            data-testid={`connection-${conn.id}`}
                            data-highlighted={conn.isHighlighted}
                        />
                    );
                })}
            </g>
        </svg>
    );
});

export default MapConnections;
