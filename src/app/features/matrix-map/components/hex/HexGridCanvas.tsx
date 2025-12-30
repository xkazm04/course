"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import type { MatrixCanvasProps, HexCoord, Point } from "../../lib/types";
import { HEX, DOMAIN_COLORS, STATUS_COLORS } from "../../lib/constants";
import type { MapNode, MapNodeBase } from "@/app/features/knowledge-map/lib/types";

interface HexLayoutNode extends MapNodeBase {
    hex: HexCoord;
    pixel: Point;
}

// Hex math utilities
function hexToPixel(hex: HexCoord, size: number, centerX: number, centerY: number): Point {
    const x = size * (3 / 2 * hex.q) + centerX;
    const y = size * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r) + centerY;
    return { x, y };
}

function getHexPoints(cx: number, cy: number, size: number): string {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i - 30);
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    return points.join(" ");
}

// Layout nodes in a hex grid pattern
function layoutHexGrid(
    nodes: MapNode[],
    containerWidth: number,
    containerHeight: number,
    hexSize: number
): HexLayoutNode[] {
    if (nodes.length === 0) return [];

    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // Calculate spiral positions
    const result: HexLayoutNode[] = [];
    const directions: HexCoord[] = [
        { q: 1, r: 0 },
        { q: 0, r: 1 },
        { q: -1, r: 1 },
        { q: -1, r: 0 },
        { q: 0, r: -1 },
        { q: 1, r: -1 },
    ];

    // Start from center
    let currentHex: HexCoord = { q: 0, r: 0 };
    let radius = 0;
    let direction = 0;
    let stepsInDirection = 0;
    let stepsUntilTurn = 0;

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const pixel = hexToPixel(currentHex, hexSize * 2, centerX, centerY);

        result.push({
            ...node,
            hex: { ...currentHex },
            pixel,
        });

        // Spiral outward
        if (i === 0) {
            // First step: move right
            currentHex = { q: 1, r: 0 };
            radius = 1;
            direction = 2; // Start going down-left
            stepsInDirection = 0;
            stepsUntilTurn = radius;
        } else {
            stepsInDirection++;
            if (stepsInDirection >= stepsUntilTurn) {
                // Turn
                direction = (direction + 1) % 6;
                stepsInDirection = 0;
                if (direction === 0) {
                    // Completed a ring, move out
                    radius++;
                    currentHex = { q: currentHex.q + 1, r: currentHex.r };
                    stepsUntilTurn = radius;
                    direction = 2;
                }
            } else {
                // Move in current direction
                currentHex = {
                    q: currentHex.q + directions[direction].q,
                    r: currentHex.r + directions[direction].r,
                };
            }
        }
    }

    return result;
}

export function HexGridCanvas({
    nodes,
    viewport,
    selectedNodeId,
    onNodeSelect,
    onNodeDrillDown,
    onBackgroundClick,
    containerWidth,
    containerHeight,
}: MatrixCanvasProps) {
    // Calculate layout
    const layoutNodes = useMemo(() => {
        if (!containerWidth || !containerHeight) return [];
        return layoutHexGrid(nodes, containerWidth / viewport.scale, containerHeight / viewport.scale, HEX.SIZE);
    }, [nodes, containerWidth, containerHeight, viewport.scale]);

    const getDomainColor = (domainId: string) => {
        const key = domainId as keyof typeof DOMAIN_COLORS;
        return DOMAIN_COLORS[key] || DOMAIN_COLORS.frontend;
    };

    const getStatusColor = (status: string) => {
        const key = status as keyof typeof STATUS_COLORS;
        return STATUS_COLORS[key] || STATUS_COLORS.available;
    };

    return (
        <div
            className="absolute inset-0 overflow-hidden"
            onClick={onBackgroundClick}
        >
            <svg
                width={containerWidth}
                height={containerHeight}
                className="absolute inset-0"
            >
                <defs>
                    {/* Glow filter */}
                    <filter id="hexGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <g
                    transform={`translate(${viewport.offsetX}, ${viewport.offsetY}) scale(${viewport.scale})`}
                >
                    {/* Connection lines between related hexes */}
                    {layoutNodes.map((node, index) => {
                        if (index === 0) return null;
                        const prevNode = layoutNodes[index - 1];
                        return (
                            <motion.line
                                key={`line-${node.id}`}
                                x1={prevNode.pixel.x}
                                y1={prevNode.pixel.y}
                                x2={node.pixel.x}
                                y2={node.pixel.y}
                                stroke="#e2e8f0"
                                strokeWidth={2}
                                strokeDasharray={node.status === "locked" ? "4 4" : undefined}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.02 }}
                            />
                        );
                    })}

                    {/* Hexagons */}
                    {layoutNodes.map((node, index) => {
                        const domainColor = getDomainColor(node.domainId);
                        const statusColor = getStatusColor(node.status);
                        const isSelected = node.id === selectedNodeId;
                        const hasChildren = node.childIds.length > 0;

                        return (
                            <motion.g
                                key={node.id}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.03 }}
                            >
                                {/* Hex shape */}
                                <polygon
                                    points={getHexPoints(node.pixel.x, node.pixel.y, HEX.SIZE)}
                                    fill={statusColor.bg}
                                    stroke={isSelected ? domainColor.base : statusColor.stroke}
                                    strokeWidth={isSelected ? 3 : 2}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNodeSelect(node.id);
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        if (hasChildren) {
                                            onNodeDrillDown(node.id);
                                        }
                                    }}
                                    className={cn(
                                        "cursor-pointer transition-all duration-200",
                                        hasChildren && "hover:stroke-[var(--ember)]"
                                    )}
                                    filter={isSelected ? "url(#hexGlow)" : undefined}
                                    style={{
                                        transformOrigin: `${node.pixel.x}px ${node.pixel.y}px`,
                                    }}
                                />

                                {/* Progress ring */}
                                {node.progress > 0 && (
                                    <circle
                                        cx={node.pixel.x}
                                        cy={node.pixel.y}
                                        r={HEX.SIZE + 4}
                                        fill="none"
                                        stroke={statusColor.fill}
                                        strokeWidth={HEX.RING_STROKE_WIDTH}
                                        strokeDasharray={`${(node.progress / 100) * 2 * Math.PI * (HEX.SIZE + 4)} ${2 * Math.PI * (HEX.SIZE + 4)}`}
                                        strokeLinecap="round"
                                        transform={`rotate(-90 ${node.pixel.x} ${node.pixel.y})`}
                                        opacity={0.8}
                                    />
                                )}

                                {/* Domain color dot */}
                                <circle
                                    cx={node.pixel.x}
                                    cy={node.pixel.y - HEX.SIZE + 10}
                                    r={6}
                                    fill={domainColor.base}
                                />

                                {/* Label */}
                                <foreignObject
                                    x={node.pixel.x - HEX.SIZE + 10}
                                    y={node.pixel.y - 15}
                                    width={HEX.SIZE * 2 - 20}
                                    height={40}
                                    className="pointer-events-none"
                                >
                                    <div className="flex flex-col items-center justify-center text-center h-full">
                                        <div
                                            className="font-semibold text-[var(--forge-text-primary)] truncate w-full px-1"
                                            style={{ fontSize: 11 }}
                                        >
                                            {node.name}
                                        </div>
                                        {node.childIds.length > 0 && (
                                            <div
                                                className="text-[var(--forge-text-muted)]"
                                                style={{ fontSize: 9 }}
                                            >
                                                {node.childIds.length} items
                                            </div>
                                        )}
                                    </div>
                                </foreignObject>
                            </motion.g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}
