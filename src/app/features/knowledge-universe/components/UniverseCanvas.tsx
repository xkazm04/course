"use client";

/**
 * Universe Canvas Component
 *
 * High-performance 2D canvas renderer for the knowledge universe.
 * Uses spatial indexing and viewport culling for 60fps rendering
 * with hundreds of nodes.
 */

import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { UniverseNode, UniverseConnection, ZoomLevel } from "../lib/types";
import { ZOOM_LEVEL_CONFIGS } from "../lib/types";
import { SpatialIndex, sortNodesByDepth } from "../lib/spatialIndex";
import { getZoomLevelFromScale } from "../lib/useUniverseCamera";

// ============================================================================
// TYPES
// ============================================================================

interface UniverseCanvasProps {
    nodes: UniverseNode[];
    connections: UniverseConnection[];
    cameraX: number;
    cameraY: number;
    scale: number;
    width: number;
    height: number;
    hoveredNodeId: string | null;
    selectedNodeId: string | null;
    onNodeHover: (nodeId: string | null) => void;
    onNodeClick: (nodeId: string) => void;
    reducedMotion?: boolean;
}

// ============================================================================
// RENDERING UTILITIES
// ============================================================================

/**
 * Draw a glowing circle (planet/moon/star)
 */
function drawNode(
    ctx: CanvasRenderingContext2D,
    node: UniverseNode,
    screenX: number,
    screenY: number,
    screenRadius: number,
    isHovered: boolean,
    isSelected: boolean,
    zoomLevel: ZoomLevel
): void {
    // Skip if too small to see
    if (screenRadius < 0.5) return;

    const glowRadius = screenRadius * (isHovered ? 2.5 : 2);

    // Outer glow
    const gradient = ctx.createRadialGradient(
        screenX,
        screenY,
        screenRadius * 0.5,
        screenX,
        screenY,
        glowRadius
    );
    gradient.addColorStop(0, node.glowColor);
    gradient.addColorStop(0.5, `${node.glowColor.replace(/[\d.]+\)$/, "0.3)")}`);
    gradient.addColorStop(1, "transparent");

    ctx.beginPath();
    ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main body
    ctx.beginPath();
    ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Inner shine
    if (screenRadius > 10) {
        const shineGradient = ctx.createRadialGradient(
            screenX - screenRadius * 0.3,
            screenY - screenRadius * 0.3,
            0,
            screenX,
            screenY,
            screenRadius
        );
        shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        shineGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
        shineGradient.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
        ctx.fillStyle = shineGradient;
        ctx.fill();
    }

    // Selection ring
    if (isSelected) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, screenRadius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Hover ring
    if (isHovered && !isSelected) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, screenRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw orbital rings for planets
    if (node.type === "planet" && screenRadius > 30 && zoomLevel !== "star") {
        const planet = node as { orbitalRings: number };
        for (let i = 1; i <= planet.orbitalRings; i++) {
            const ringRadius = screenRadius + 30 + i * 25;
            ctx.beginPath();
            ctx.arc(screenX, screenY, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - i * 0.02})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    }

    // Draw completion indicator for stars
    if (node.type === "star" && screenRadius > 3) {
        const star = node as { completed: boolean };
        if (star.completed) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, screenRadius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

/**
 * Draw connection between nodes
 */
function drawConnection(
    ctx: CanvasRenderingContext2D,
    conn: UniverseConnection,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    scale: number
): void {
    const lineWidth = Math.max(0.5, conn.strength * 2 * scale);

    // Create gradient along the connection
    const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
    gradient.addColorStop(0, `${conn.color}80`);
    gradient.addColorStop(0.5, `${conn.color}40`);
    gradient.addColorStop(1, `${conn.color}80`);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);

    // Curved connection
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const controlX = midX - dy * 0.2;
    const controlY = midY + dx * 0.2;

    ctx.quadraticCurveTo(controlX, controlY, toX, toY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

/**
 * Draw background stars
 */
function drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraX: number,
    cameraY: number,
    scale: number,
    time: number
): void {
    // Clear with dark background
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, width, height);

    // Draw distant stars (parallax effect)
    const starCount = 200;
    const parallaxFactor = 0.1;

    for (let i = 0; i < starCount; i++) {
        // Deterministic random based on index
        const seed = i * 12345;
        const x = ((seed * 9301 + 49297) % 233280) / 233280;
        const y = ((seed * 4561 + 51349) % 233280) / 233280;
        const size = ((seed * 7919 + 12347) % 233280) / 233280;
        const twinkle = ((seed * 3571 + 98765) % 233280) / 233280;

        const starX = (x * width * 2 - cameraX * parallaxFactor * scale) % width;
        const starY = (y * height * 2 - cameraY * parallaxFactor * scale) % height;
        const starRadius = 0.3 + size * 1.2;

        // Twinkle effect
        const alpha = 0.3 + Math.sin(time * 0.001 + twinkle * 10) * 0.2;

        ctx.beginPath();
        ctx.arc(starX, starY, starRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
    }

    // Nebula effect
    const nebulaGradient = ctx.createRadialGradient(
        width * 0.3 - cameraX * 0.05,
        height * 0.4 - cameraY * 0.05,
        0,
        width * 0.3 - cameraX * 0.05,
        height * 0.4 - cameraY * 0.05,
        300
    );
    nebulaGradient.addColorStop(0, "rgba(139, 92, 246, 0.05)");
    nebulaGradient.addColorStop(0.5, "rgba(79, 70, 229, 0.02)");
    nebulaGradient.addColorStop(1, "transparent");

    ctx.fillStyle = nebulaGradient;
    ctx.fillRect(0, 0, width, height);
}

// ============================================================================
// CANVAS COMPONENT
// ============================================================================

export function UniverseCanvas({
    nodes,
    connections,
    cameraX,
    cameraY,
    scale,
    width,
    height,
    hoveredNodeId,
    selectedNodeId,
    onNodeHover,
    onNodeClick,
    reducedMotion = false,
}: UniverseCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

    // Build spatial index
    const spatialIndex = useMemo(() => {
        const index = new SpatialIndex({
            worldBounds: { minX: -2000, maxX: 2000, minY: -2000, maxY: 2000 },
        });
        index.build(nodes);
        return index;
    }, [nodes]);

    // Get current zoom level
    const zoomLevel = getZoomLevelFromScale(scale);

    // Filter nodes by zoom level
    const visibleNodes = useMemo(() => {
        return nodes.filter((node) => node.visibleAtZoom.includes(zoomLevel));
    }, [nodes, zoomLevel]);

    // Create node lookup map
    const nodeMap = useMemo(() => {
        return new Map(nodes.map((n) => [n.id, n]));
    }, [nodes]);

    // ========================================================================
    // RENDERING
    // ========================================================================

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Update time for animations
        if (!reducedMotion) {
            timeRef.current = Date.now();
        }

        // Draw background
        drawBackground(ctx, width, height, cameraX, cameraY, scale, timeRef.current);

        // Query visible nodes from spatial index
        const viewportNodes = spatialIndex.queryViewport(
            cameraX - width / (2 * scale),
            cameraY - height / (2 * scale),
            width,
            height,
            scale
        );

        // Filter by zoom level and sort by depth
        const filteredNodes = viewportNodes.filter((n) => n.visibleAtZoom.includes(zoomLevel));
        const sortedNodes = sortNodesByDepth(filteredNodes, cameraX, cameraY);

        // Draw connections
        ctx.globalAlpha = 0.6;
        connections.forEach((conn) => {
            const fromNode = nodeMap.get(conn.fromId);
            const toNode = nodeMap.get(conn.toId);

            if (!fromNode || !toNode) return;
            if (!fromNode.visibleAtZoom.includes(zoomLevel)) return;
            if (!toNode.visibleAtZoom.includes(zoomLevel)) return;

            const fromScreen = {
                x: (fromNode.x - cameraX) * scale + width / 2,
                y: (fromNode.y - cameraY) * scale + height / 2,
            };
            const toScreen = {
                x: (toNode.x - cameraX) * scale + width / 2,
                y: (toNode.y - cameraY) * scale + height / 2,
            };

            drawConnection(ctx, conn, fromScreen.x, fromScreen.y, toScreen.x, toScreen.y, scale);
        });
        ctx.globalAlpha = 1;

        // Draw nodes
        sortedNodes.forEach((node) => {
            const screenX = (node.x - cameraX) * scale + width / 2;
            const screenY = (node.y - cameraY) * scale + height / 2;
            const screenRadius = node.radius * scale;

            // Skip if completely off screen
            if (
                screenX + screenRadius < 0 ||
                screenX - screenRadius > width ||
                screenY + screenRadius < 0 ||
                screenY - screenRadius > height
            ) {
                return;
            }

            drawNode(
                ctx,
                node,
                screenX,
                screenY,
                screenRadius,
                node.id === hoveredNodeId,
                node.id === selectedNodeId,
                zoomLevel
            );
        });

        // Continue animation loop if not reduced motion
        if (!reducedMotion) {
            animationRef.current = requestAnimationFrame(render);
        }
    }, [
        width,
        height,
        cameraX,
        cameraY,
        scale,
        spatialIndex,
        connections,
        nodeMap,
        hoveredNodeId,
        selectedNodeId,
        zoomLevel,
        reducedMotion,
    ]);

    // Start/stop render loop
    useEffect(() => {
        render();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [render]);

    // Force re-render when dependencies change (for reduced motion mode)
    useEffect(() => {
        if (reducedMotion) {
            render();
        }
    }, [reducedMotion, render, cameraX, cameraY, scale, hoveredNodeId, selectedNodeId]);

    // ========================================================================
    // HIT TESTING
    // ========================================================================

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Convert to world coordinates
            const worldX = cameraX + (mouseX - width / 2) / scale;
            const worldY = cameraY + (mouseY - height / 2) / scale;

            // Find node at position
            let foundNode: UniverseNode | null = null;

            for (let i = visibleNodes.length - 1; i >= 0; i--) {
                const node = visibleNodes[i];
                const dx = worldX - node.x;
                const dy = worldY - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= node.radius + 10 / scale) {
                    foundNode = node;
                    break;
                }
            }

            onNodeHover(foundNode?.id ?? null);
        },
        [cameraX, cameraY, width, height, scale, visibleNodes, onNodeHover]
    );

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (hoveredNodeId) {
                onNodeClick(hoveredNodeId);
            }
        },
        [hoveredNodeId, onNodeClick]
    );

    const handleMouseLeave = useCallback(() => {
        onNodeHover(null);
    }, [onNodeHover]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={handleMouseLeave}
            className="cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none" }}
            data-testid="universe-canvas"
        />
    );
}

// ============================================================================
// NODE TOOLTIP
// ============================================================================

interface NodeTooltipProps {
    node: UniverseNode | null;
    x: number;
    y: number;
}

export function NodeTooltip({ node, x, y }: NodeTooltipProps) {
    if (!node) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute pointer-events-none z-50 bg-slate-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-xl border border-white/10"
                style={{
                    left: x + 15,
                    top: y + 15,
                    transform: "translateY(-50%)",
                }}
                data-testid="universe-tooltip"
            >
                <div className="text-white font-medium text-sm">{node.name}</div>
                <div className="text-slate-400 text-xs capitalize">
                    {node.type === "planet" && "Learning Domain"}
                    {node.type === "moon" && "Chapter"}
                    {node.type === "star" && (node as { lessonType: string }).lessonType}
                </div>
                {node.type === "star" && (
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                            {(node as { duration: string }).duration}
                        </span>
                        {(node as { completed: boolean }).completed && (
                            <span className="text-xs text-green-400">Completed</span>
                        )}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
