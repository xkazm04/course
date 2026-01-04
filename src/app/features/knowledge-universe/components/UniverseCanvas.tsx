"use client";

/**
 * Universe Canvas Component
 *
 * High-performance 2D canvas renderer for the knowledge universe.
 * Uses WorldCoordinator for unified camera/spatial management and
 * viewport culling for 60fps rendering with hundreds of nodes.
 */

import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { UniverseNode, UniverseConnection, ZoomLevel } from "../lib/types";
import { WorldCoordinator } from "../lib/worldCoordinator";
import { useNodeRevealAnimation, type NodeRevealState } from "../lib/useNodeRevealAnimation";
import { NodeTypeRegistry, type NodeRenderContext } from "../lib/nodeTypeRegistry";

// ============================================================================
// TYPES
// ============================================================================

interface UniverseCanvasProps {
    nodes: UniverseNode[];
    connections: UniverseConnection[];
    coordinator: WorldCoordinator;
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
 * Draw a glowing circle (planet/moon/star/asteroid/comet)
 * Uses NodeTypeRegistry for type-specific rendering strategies
 */
function drawNode(
    ctx: CanvasRenderingContext2D,
    node: UniverseNode,
    screenX: number,
    screenY: number,
    screenRadius: number,
    isHovered: boolean,
    isSelected: boolean,
    zoomLevel: ZoomLevel,
    revealState?: NodeRevealState
): void {
    // Skip if too small to see
    if (screenRadius < 0.5) return;

    // Check visibility rules from registry
    if (!NodeTypeRegistry.isVisible(node, zoomLevel, screenRadius)) return;

    // Apply reveal animation if present
    const animOpacity = revealState?.opacity ?? 1;
    const animScale = revealState?.scale ?? 1;

    // Skip drawing if not visible yet (during stagger delay)
    if (animOpacity <= 0) return;

    // Apply scale to radius
    const animatedRadius = screenRadius * animScale;

    // Create render context for registry strategies
    const renderContext: NodeRenderContext = {
        ctx,
        node,
        screenX,
        screenY,
        screenRadius,
        isHovered,
        isSelected,
        zoomLevel,
        revealState,
        animatedRadius,
        animOpacity,
    };

    // Save context for opacity
    ctx.save();
    ctx.globalAlpha = animOpacity;

    // Execute pre-render strategy from registry (e.g., comet tails, asteroid belts)
    NodeTypeRegistry.preRender(renderContext);

    const glowRadius = animatedRadius * (isHovered ? 2.5 : 2);

    // Outer glow - blend from glow color during reveal animation
    const glowAlpha = revealState && !revealState.complete ? 0.6 + 0.4 * animOpacity : 1;
    const gradient = ctx.createRadialGradient(
        screenX,
        screenY,
        animatedRadius * 0.5,
        screenX,
        screenY,
        glowRadius
    );
    gradient.addColorStop(0, node.glowColor);
    gradient.addColorStop(0.5, `${node.glowColor.replace(/[\d.]+\)$/, `${0.3 * glowAlpha})`)}`);
    gradient.addColorStop(1, "transparent");

    ctx.beginPath();
    ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main body
    ctx.beginPath();
    ctx.arc(screenX, screenY, animatedRadius, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Inner shine
    if (animatedRadius > 10) {
        const shineGradient = ctx.createRadialGradient(
            screenX - animatedRadius * 0.3,
            screenY - animatedRadius * 0.3,
            0,
            screenX,
            screenY,
            animatedRadius
        );
        shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        shineGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
        shineGradient.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.arc(screenX, screenY, animatedRadius, 0, Math.PI * 2);
        ctx.fillStyle = shineGradient;
        ctx.fill();
    }

    // Selection ring
    if (isSelected) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, animatedRadius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Hover ring
    if (isHovered && !isSelected) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, animatedRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Execute post-render strategy from registry (e.g., orbital rings, completion indicators)
    NodeTypeRegistry.postRender(renderContext);

    // Restore context state
    ctx.restore();
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
 * Draw background with Forge theme
 * Uses dark forge colors with ember/gold accents instead of blue space theme
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
    // Create gradient background - Forge dark theme
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#0a0a0b"); // forge-bg-void
    bgGradient.addColorStop(0.5, "#0f0f10"); // forge-bg-anvil
    bgGradient.addColorStop(1, "#0a0a0b");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw ember particles (smaller count for performance)
    const particleCount = 80;
    const parallaxFactor = 0.1;

    for (let i = 0; i < particleCount; i++) {
        // Deterministic random based on index
        const seed = i * 12345;
        const x = ((seed * 9301 + 49297) % 233280) / 233280;
        const y = ((seed * 4561 + 51349) % 233280) / 233280;
        const size = ((seed * 7919 + 12347) % 233280) / 233280;
        const twinkle = ((seed * 3571 + 98765) % 233280) / 233280;

        const particleX = (x * width * 2 - cameraX * parallaxFactor * scale) % width;
        const particleY = (y * height * 2 - cameraY * parallaxFactor * scale) % height;
        const particleRadius = 0.4 + size * 1.5;

        // Subtle twinkle effect
        const alpha = 0.15 + Math.sin(time * 0.0008 + twinkle * 8) * 0.1;

        // Mix of ember and gold colors
        const isEmber = i % 3 === 0;
        const color = isEmber
            ? `rgba(194, 65, 12, ${alpha})` // ember
            : `rgba(212, 168, 83, ${alpha * 0.7})`; // gold

        ctx.beginPath();
        ctx.arc(particleX, particleY, particleRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    // Ember glow in top-center (forge theme radial glow)
    const emberGlow = ctx.createRadialGradient(
        width * 0.5 - cameraX * 0.03,
        0 - cameraY * 0.03,
        0,
        width * 0.5 - cameraX * 0.03,
        0 - cameraY * 0.03,
        height * 0.6
    );
    emberGlow.addColorStop(0, "rgba(194, 65, 12, 0.08)"); // ember
    emberGlow.addColorStop(0.4, "rgba(194, 65, 12, 0.03)");
    emberGlow.addColorStop(1, "transparent");

    ctx.fillStyle = emberGlow;
    ctx.fillRect(0, 0, width, height);

    // Subtle vignette effect
    const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.7
    );
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
}

// ============================================================================
// CANVAS COMPONENT
// ============================================================================

export function UniverseCanvas({
    nodes,
    connections,
    coordinator,
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
    const renderRef = useRef<() => void>(() => {});

    // Get camera state and zoom level from coordinator
    const { x: cameraX, y: cameraY, scale } = coordinator.camera;
    const zoomLevel = coordinator.zoomLevel;

    // Build spatial index when nodes change
    useEffect(() => {
        coordinator.buildIndex(nodes);
    }, [coordinator, nodes]);

    // Node reveal animation system
    const {
        getNodeRevealState,
        registerNewlyVisibleNodes,
        isAnimating: isRevealAnimating,
        previousZoomLevel,
        setPreviousZoomLevel,
    } = useNodeRevealAnimation({
        reducedMotion,
        duration: 300,
        staggerInterval: 15,
        maxStaggerDelay: 200,
    });

    // Detect zoom level changes and register newly visible nodes
    useEffect(() => {
        if (previousZoomLevel !== null && previousZoomLevel !== zoomLevel) {
            // Find nodes that are now visible but weren't before
            const newlyVisibleNodes = nodes.filter((node) => {
                const wasVisible = node.visibleAtZoom.includes(previousZoomLevel);
                const isNowVisible = node.visibleAtZoom.includes(zoomLevel);
                return isNowVisible && !wasVisible;
            });

            if (newlyVisibleNodes.length > 0) {
                registerNewlyVisibleNodes(newlyVisibleNodes);
            }
        }
        setPreviousZoomLevel(zoomLevel);
    }, [zoomLevel, previousZoomLevel, nodes, registerNewlyVisibleNodes, setPreviousZoomLevel]);

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

        // Query visible nodes from coordinator (unified camera/spatial system)
        const viewportNodes = coordinator.queryVisibleNodes(zoomLevel);

        // Sort by depth for correct rendering order
        const sortedNodes = coordinator.sortNodesByDepth(viewportNodes);

        // Draw connections
        ctx.globalAlpha = 0.6;
        connections.forEach((conn) => {
            const fromNode = nodeMap.get(conn.fromId);
            const toNode = nodeMap.get(conn.toId);

            if (!fromNode || !toNode) return;
            if (!fromNode.visibleAtZoom.includes(zoomLevel)) return;
            if (!toNode.visibleAtZoom.includes(zoomLevel)) return;

            // Use coordinator for world-to-screen transformations
            const fromScreen = coordinator.worldToScreen(fromNode.x, fromNode.y);
            const toScreen = coordinator.worldToScreen(toNode.x, toNode.y);

            drawConnection(ctx, conn, fromScreen.x, fromScreen.y, toScreen.x, toScreen.y, scale);
        });
        ctx.globalAlpha = 1;

        // Draw nodes
        sortedNodes.forEach((node) => {
            // Use coordinator for world-to-screen transformations
            const screen = coordinator.worldToScreen(node.x, node.y);
            const screenRadius = coordinator.worldRadiusToScreen(node.radius);

            // Skip if completely off screen
            if (
                screen.x + screenRadius < 0 ||
                screen.x - screenRadius > width ||
                screen.y + screenRadius < 0 ||
                screen.y - screenRadius > height
            ) {
                return;
            }

            // Get reveal animation state for this node
            const revealState = getNodeRevealState(node.id);

            drawNode(
                ctx,
                node,
                screen.x,
                screen.y,
                screenRadius,
                node.id === hoveredNodeId,
                node.id === selectedNodeId,
                zoomLevel,
                revealState
            );
        });

        // Continue animation loop if not reduced motion or if reveal animation is running
        if (!reducedMotion || isRevealAnimating) {
            animationRef.current = requestAnimationFrame(() => renderRef.current());
        }
    }, [
        width,
        height,
        cameraX,
        cameraY,
        scale,
        coordinator,
        connections,
        nodeMap,
        hoveredNodeId,
        selectedNodeId,
        zoomLevel,
        reducedMotion,
        getNodeRevealState,
        isRevealAnimating,
    ]);

    // Keep renderRef in sync with render
    useEffect(() => {
        renderRef.current = render;
    }, [render]);

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
    // Also re-render when reveal animation state changes
    useEffect(() => {
        if (reducedMotion && !isRevealAnimating) {
            render();
        }
    }, [reducedMotion, isRevealAnimating, render, cameraX, cameraY, scale, hoveredNodeId, selectedNodeId]);

    // ========================================================================
    // HIT TESTING
    // ========================================================================

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Use coordinator for hit testing (unified world-to-screen system)
            const foundNode = coordinator.findNodeAtScreenPosition(mouseX, mouseY, 10);

            onNodeHover(foundNode?.id ?? null);
        },
        [coordinator, onNodeHover]
    );

    const handleClick = useCallback(() => {
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

    // Get tooltip content from registry
    const behavior = NodeTypeRegistry.getInteractionBehavior(node.type);
    const tooltipContent = behavior.getTooltipContent?.(node) ?? {
        title: node.name,
        subtitle: node.type,
    };

    if (!behavior.showTooltip) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute pointer-events-none z-50 bg-[var(--forge-bg-elevated)]/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-xl border border-[var(--forge-border-subtle)]"
                style={{
                    left: x + 15,
                    top: y + 15,
                    transform: "translateY(-50%)",
                }}
                data-testid="universe-tooltip"
            >
                <div className="text-[var(--forge-text-primary)] font-medium text-sm">{tooltipContent.title}</div>
                <div className="text-[var(--forge-text-muted)] text-xs capitalize">{tooltipContent.subtitle}</div>
                {tooltipContent.extra && (
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[var(--forge-text-muted)]">{tooltipContent.extra}</span>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
