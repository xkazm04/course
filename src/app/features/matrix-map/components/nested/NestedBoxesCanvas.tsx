"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import type { MatrixCanvasProps } from "../../lib/types";
import { NESTED, DOMAIN_COLORS, STATUS_COLORS } from "../../lib/constants";
import type { MapNode, MapNodeBase } from "@/app/features/knowledge-map/lib/types";

interface NestedBoxBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface NestedLayoutNode extends MapNodeBase {
    bounds: NestedBoxBounds;
}

// Squarified treemap algorithm
function squarify(
    nodes: MapNode[],
    bounds: NestedBoxBounds,
    padding: number = NESTED.PADDING
): NestedLayoutNode[] {
    if (nodes.length === 0) return [];

    const innerBounds = {
        x: bounds.x + padding,
        y: bounds.y + padding,
        width: bounds.width - padding * 2,
        height: bounds.height - padding * 2,
    };

    // Calculate weights (equal for simplicity)
    const totalWeight = nodes.length;
    const result: NestedLayoutNode[] = [];

    // Determine layout direction based on aspect ratio
    const isHorizontal = innerBounds.width >= innerBounds.height;

    // Calculate grid layout
    const cols = isHorizontal
        ? Math.ceil(Math.sqrt(nodes.length * (innerBounds.width / innerBounds.height)))
        : Math.ceil(Math.sqrt(nodes.length * (innerBounds.height / innerBounds.width)));
    const rows = Math.ceil(nodes.length / cols);

    const cellWidth = innerBounds.width / cols;
    const cellHeight = innerBounds.height / rows;

    nodes.forEach((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        result.push({
            ...node,
            bounds: {
                x: innerBounds.x + col * cellWidth + padding / 2,
                y: innerBounds.y + row * cellHeight + padding / 2,
                width: cellWidth - padding,
                height: cellHeight - padding,
            },
        });
    });

    return result;
}

export function NestedBoxesCanvas({
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

        const bounds: NestedBoxBounds = {
            x: 0,
            y: 0,
            width: containerWidth / viewport.scale,
            height: containerHeight / viewport.scale,
        };

        return squarify(nodes, bounds);
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
                <g
                    transform={`translate(${viewport.offsetX}, ${viewport.offsetY}) scale(${viewport.scale})`}
                >
                    {layoutNodes.map((node) => {
                        const domainColor = getDomainColor(node.domainId);
                        const statusColor = getStatusColor(node.status);
                        const isSelected = node.id === selectedNodeId;
                        const hasChildren = node.childIds.length > 0;

                        return (
                            <g key={node.id}>
                                {/* Box background */}
                                <motion.rect
                                    x={node.bounds.x}
                                    y={node.bounds.y}
                                    width={node.bounds.width}
                                    height={node.bounds.height}
                                    rx={NESTED.BORDER_RADIUS}
                                    fill={statusColor.bg}
                                    stroke={isSelected ? domainColor.base : statusColor.stroke}
                                    strokeWidth={isSelected ? 3 : NESTED.BORDER_WIDTH}
                                    strokeDasharray={node.status === "locked" ? "4 4" : undefined}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
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
                                    style={{
                                        filter: isSelected
                                            ? `drop-shadow(0 4px 12px ${domainColor.glow})`
                                            : undefined,
                                    }}
                                />

                                {/* Domain color indicator */}
                                <rect
                                    x={node.bounds.x}
                                    y={node.bounds.y}
                                    width={node.bounds.width}
                                    height={4}
                                    fill={domainColor.base}
                                    rx={NESTED.BORDER_RADIUS}
                                    clipPath={`inset(0 0 ${node.bounds.height - NESTED.BORDER_RADIUS}px 0 round ${NESTED.BORDER_RADIUS}px)`}
                                />

                                {/* Progress indicator at bottom */}
                                {node.progress > 0 && (
                                    <rect
                                        x={node.bounds.x}
                                        y={node.bounds.y + node.bounds.height - 4}
                                        width={node.bounds.width * (node.progress / 100)}
                                        height={4}
                                        fill={statusColor.fill}
                                        rx={2}
                                    />
                                )}

                                {/* Label */}
                                <foreignObject
                                    x={node.bounds.x + 8}
                                    y={node.bounds.y + 8}
                                    width={node.bounds.width - 16}
                                    height={node.bounds.height - 16}
                                    className="pointer-events-none"
                                >
                                    <div className="h-full flex flex-col justify-between">
                                        <div>
                                            <div
                                                className="font-semibold text-[var(--forge-text-primary)] truncate"
                                                style={{ fontSize: Math.max(10, Math.min(14, node.bounds.width / 12)) }}
                                            >
                                                {node.name}
                                            </div>
                                            {node.bounds.height > 60 && (
                                                <div
                                                    className="text-[var(--forge-text-secondary)] line-clamp-2 mt-1"
                                                    style={{ fontSize: Math.max(9, Math.min(11, node.bounds.width / 15)) }}
                                                >
                                                    {node.description}
                                                </div>
                                            )}
                                        </div>

                                        {node.bounds.height > 50 && (
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className="text-[var(--forge-text-muted)]"
                                                    style={{ fontSize: 9 }}
                                                >
                                                    {node.childIds.length > 0
                                                        ? `${node.childIds.length} items`
                                                        : node.level}
                                                </span>
                                                {node.progress > 0 && (
                                                    <span
                                                        className="font-medium"
                                                        style={{
                                                            fontSize: 10,
                                                            color: statusColor.fill,
                                                        }}
                                                    >
                                                        {node.progress}%
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}
