"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import type { MatrixCanvasProps, Point } from "../../lib/types";
import { METRO, DOMAIN_COLORS, STATUS_COLORS } from "../../lib/constants";
import type { MapNode, MapNodeBase } from "@/app/features/knowledge-map/lib/types";

interface MetroLayoutNode extends MapNodeBase {
    position: Point;
    lineIndex: number;
    stationIndex: number;
}

interface MetroLine {
    id: string;
    color: string;
    path: string;
    nodes: MetroLayoutNode[];
}

// Layout nodes along metro-style lines
function layoutMetroLines(
    nodes: MapNode[],
    containerWidth: number,
    containerHeight: number
): MetroLine[] {
    if (nodes.length === 0) return [];

    // Group nodes by domain
    const domainGroups = new Map<string, MapNode[]>();
    nodes.forEach((node) => {
        const existing = domainGroups.get(node.domainId) || [];
        existing.push(node);
        domainGroups.set(node.domainId, existing);
    });

    const lines: MetroLine[] = [];
    const startY = 80;
    const lineSpacing = METRO.LINE_SPACING;
    const startX = 60;

    let lineIndex = 0;
    domainGroups.forEach((domainNodes, domainId) => {
        const y = startY + lineIndex * lineSpacing;
        const color = DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS]?.base || "#6366f1";

        const layoutNodes: MetroLayoutNode[] = domainNodes.map((node, stationIndex) => ({
            ...node,
            position: {
                x: startX + stationIndex * METRO.STATION_SPACING,
                y,
            },
            lineIndex,
            stationIndex,
        }));

        // Create SVG path for the line
        const pathPoints = layoutNodes.map((n) => `${n.position.x},${n.position.y}`);
        const path = pathPoints.length > 0
            ? `M ${pathPoints[0]} ${pathPoints.slice(1).map((p) => `L ${p}`).join(" ")}`
            : "";

        lines.push({
            id: domainId,
            color,
            path,
            nodes: layoutNodes,
        });

        lineIndex++;
    });

    return lines;
}

export function MetroCanvas({
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
    const lines = useMemo(() => {
        if (!containerWidth || !containerHeight) return [];
        return layoutMetroLines(nodes, containerWidth / viewport.scale, containerHeight / viewport.scale);
    }, [nodes, containerWidth, containerHeight, viewport.scale]);

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
                    {/* Line glow filter */}
                    <filter id="metroGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <g
                    transform={`translate(${viewport.offsetX}, ${viewport.offsetY}) scale(${viewport.scale})`}
                >
                    {/* Draw lines first (behind stations) */}
                    {lines.map((line, lineIdx) => (
                        <motion.path
                            key={`line-${line.id}`}
                            d={line.path}
                            fill="none"
                            stroke={line.color}
                            strokeWidth={METRO.LINE_WIDTH}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{
                                duration: 0.8,
                                delay: lineIdx * 0.15,
                                ease: "easeOut",
                            }}
                        />
                    ))}

                    {/* Draw stations */}
                    {lines.map((line) =>
                        line.nodes.map((node, stationIdx) => {
                            const statusColor = getStatusColor(node.status);
                            const isSelected = node.id === selectedNodeId;
                            const hasChildren = node.childIds.length > 0;
                            const radius = hasChildren
                                ? METRO.INTERCHANGE_RADIUS
                                : METRO.STATION_RADIUS;

                            return (
                                <motion.g
                                    key={node.id}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: node.lineIndex * 0.15 + stationIdx * 0.05,
                                    }}
                                >
                                    {/* Outer ring for selected */}
                                    {isSelected && (
                                        <circle
                                            cx={node.position.x}
                                            cy={node.position.y}
                                            r={radius + 6}
                                            fill="none"
                                            stroke={line.color}
                                            strokeWidth={3}
                                            opacity={0.5}
                                            filter="url(#metroGlow)"
                                        />
                                    )}

                                    {/* Station outer circle (line color) */}
                                    <circle
                                        cx={node.position.x}
                                        cy={node.position.y}
                                        r={radius}
                                        fill="white"
                                        stroke={line.color}
                                        strokeWidth={METRO.LINE_WIDTH}
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
                                            hasChildren && "hover:stroke-[8px]"
                                        )}
                                    />

                                    {/* Inner status indicator */}
                                    <circle
                                        cx={node.position.x}
                                        cy={node.position.y}
                                        r={radius - 6}
                                        fill={node.status === "completed" ? statusColor.fill : statusColor.bg}
                                        className="pointer-events-none"
                                    />

                                    {/* Progress arc */}
                                    {node.progress > 0 && node.progress < 100 && (
                                        <circle
                                            cx={node.position.x}
                                            cy={node.position.y}
                                            r={radius - 6}
                                            fill="none"
                                            stroke={statusColor.fill}
                                            strokeWidth={3}
                                            strokeDasharray={`${(node.progress / 100) * 2 * Math.PI * (radius - 6)} ${2 * Math.PI * (radius - 6)}`}
                                            strokeLinecap="round"
                                            transform={`rotate(-90 ${node.position.x} ${node.position.y})`}
                                            className="pointer-events-none"
                                        />
                                    )}

                                    {/* Station label */}
                                    <foreignObject
                                        x={node.position.x - 60}
                                        y={node.position.y + radius + 8}
                                        width={120}
                                        height={40}
                                        className="pointer-events-none"
                                    >
                                        <div className="flex flex-col items-center text-center">
                                            <div
                                                className="font-semibold text-[var(--forge-text-primary)] truncate w-full px-1"
                                                style={{ fontSize: 11 }}
                                            >
                                                {node.name}
                                            </div>
                                            {hasChildren && (
                                                <div
                                                    className="text-[var(--forge-text-muted)]"
                                                    style={{ fontSize: 9 }}
                                                >
                                                    {node.childIds.length} stops
                                                </div>
                                            )}
                                        </div>
                                    </foreignObject>
                                </motion.g>
                            );
                        })
                    )}

                    {/* Line labels (domain names) */}
                    {lines.map((line, lineIdx) => {
                        const firstNode = line.nodes[0];
                        if (!firstNode) return null;

                        return (
                            <motion.g
                                key={`label-${line.id}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: lineIdx * 0.1 }}
                            >
                                <rect
                                    x={8}
                                    y={firstNode.position.y - 12}
                                    width={40}
                                    height={24}
                                    rx={4}
                                    fill={line.color}
                                />
                                <text
                                    x={28}
                                    y={firstNode.position.y + 4}
                                    fill="white"
                                    fontSize={10}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                >
                                    {line.id.slice(0, 2).toUpperCase()}
                                </text>
                            </motion.g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}
