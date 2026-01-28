"use client";

/**
 * WebGL Canvas Component
 *
 * High-performance WebGL-based canvas for the Knowledge Universe.
 * Renders 10k+ nodes at 60fps using instanced rendering and custom shaders.
 *
 * Features:
 * - WebGL 2.0 rendering with Three.js
 * - Automatic fallback to Canvas 2D
 * - Instanced rendering for nodes
 * - GPU particle effects
 * - Post-processing (bloom, glow)
 * - Context loss recovery
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { UniverseNode, UniverseConnection, ClusterNode, ZoomLevel } from "../lib/types";
import type { WorldCoordinator } from "../lib/worldCoordinator";
import {
    WebGLUniverseRenderer,
    detectWebGLSupport,
    type WebGLRendererConfig,
    type WebGLRendererStats,
} from "../lib/webglRenderer";
import { createDefaultParticleEngine, type ParticleEngine } from "../lib/particleEngine";

// ============================================================================
// TYPES
// ============================================================================

interface WebGLCanvasProps {
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
    /** Optional opacity overrides for LOD transitions */
    nodeOpacityOverrides?: Map<string, number>;
    /** WebGL renderer configuration */
    rendererConfig?: Partial<WebGLRendererConfig>;
    /** Callback when WebGL is not supported */
    onFallback?: () => void;
    /** Whether to show debug stats */
    showStats?: boolean;
    /** Enable particle effects */
    enableParticles?: boolean;
}

// ============================================================================
// FALLBACK DETECTION
// ============================================================================

function useWebGLSupport() {
    const [support, setSupport] = useState<ReturnType<typeof detectWebGLSupport> | null>(null);

    useEffect(() => {
        setSupport(detectWebGLSupport());
    }, []);

    return support;
}

// ============================================================================
// WEBGL CANVAS COMPONENT
// ============================================================================

export function WebGLCanvas({
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
    nodeOpacityOverrides,
    rendererConfig,
    onFallback,
    showStats = false,
    enableParticles = true,
}: WebGLCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<WebGLUniverseRenderer | null>(null);
    const particleEngineRef = useRef<ParticleEngine | null>(null);
    const animationFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    const [stats, setStats] = useState<WebGLRendererStats | null>(null);
    const [contextLost, setContextLost] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const webglSupport = useWebGLSupport();

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !webglSupport?.supported) {
            if (webglSupport && !webglSupport.supported) {
                onFallback?.();
            }
            return;
        }

        // Create WebGL renderer
        const renderer = new WebGLUniverseRenderer({
            ...rendererConfig,
            enableParticles: enableParticles && !reducedMotion,
        });

        const success = renderer.initialize(canvas);
        if (!success) {
            onFallback?.();
            return;
        }

        rendererRef.current = renderer;

        // Setup context loss handlers
        renderer.setContextLossHandlers(
            () => setContextLost(true),
            () => setContextLost(false)
        );

        // Create particle engine
        if (enableParticles && !reducedMotion) {
            const particleEngine = createDefaultParticleEngine();
            particleEngineRef.current = particleEngine;
        }

        setInitialized(true);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            renderer.dispose();
            particleEngineRef.current?.dispose();
            rendererRef.current = null;
            particleEngineRef.current = null;
        };
    }, [webglSupport, rendererConfig, enableParticles, reducedMotion, onFallback]);

    // ========================================================================
    // RESIZE HANDLING
    // ========================================================================

    useEffect(() => {
        if (rendererRef.current && initialized) {
            rendererRef.current.resize(width, height);
        }
    }, [width, height, initialized]);

    // ========================================================================
    // RENDER LOOP
    // ========================================================================

    const render = useCallback(() => {
        const renderer = rendererRef.current;
        if (!renderer || contextLost) return;

        const now = performance.now();
        const deltaTime = now - lastTimeRef.current;
        lastTimeRef.current = now;

        // Update camera from coordinator
        renderer.updateCamera(coordinator);

        // Filter visible nodes
        const zoomLevel = coordinator.zoomLevel;
        const visibleNodes = nodes.filter(n => n.visibleAtZoom.includes(zoomLevel));

        // Separate clusters from regular nodes
        const clusters = visibleNodes.filter(n => n.type === "cluster") as ClusterNode[];
        const regularNodes = visibleNodes.filter(n => n.type !== "cluster");

        // Update nodes
        renderer.updateNodes(regularNodes, hoveredNodeId, selectedNodeId, nodeOpacityOverrides);

        // Update clusters
        renderer.updateClusters(clusters, nodeOpacityOverrides);

        // Update particle engine
        if (particleEngineRef.current) {
            particleEngineRef.current.update(deltaTime, coordinator);
            particleEngineRef.current.updateUniforms();
        }

        // Render frame
        renderer.render();

        // Update stats
        if (showStats) {
            setStats(renderer.getStats());
        }

        // Continue render loop
        if (!reducedMotion) {
            animationFrameRef.current = requestAnimationFrame(render);
        }
    }, [
        coordinator,
        nodes,
        hoveredNodeId,
        selectedNodeId,
        nodeOpacityOverrides,
        contextLost,
        showStats,
        reducedMotion,
    ]);

    useEffect(() => {
        if (initialized && !contextLost) {
            lastTimeRef.current = performance.now();
            animationFrameRef.current = requestAnimationFrame(render);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [initialized, contextLost, render]);

    // ========================================================================
    // HIT TESTING
    // ========================================================================

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Use coordinator for hit testing
            const foundNode = coordinator.findNodeAtScreenPosition(mouseX, mouseY, 10);
            onNodeHover(foundNode?.id ?? null);
        },
        [coordinator, onNodeHover]
    );

    const handleClick = useCallback(() => {
        if (hoveredNodeId) {
            onNodeClick(hoveredNodeId);
        }
    }, [hoveredNodeId, onNodeClick]);

    const handleMouseLeave = useCallback(() => {
        onNodeHover(null);
    }, [onNodeHover]);

    // ========================================================================
    // RENDER
    // ========================================================================

    // Show loading while detecting WebGL support
    if (!webglSupport) {
        return (
            <div
                style={{ width, height }}
                className="flex items-center justify-center bg-[var(--forge-bg-void)]"
            >
                <div className="text-[var(--forge-text-muted)] text-sm">
                    Initializing renderer...
                </div>
            </div>
        );
    }

    // Show fallback message if WebGL not supported
    if (!webglSupport.supported) {
        return (
            <div
                style={{ width, height }}
                className="flex items-center justify-center bg-[var(--forge-bg-void)]"
            >
                <div className="text-center text-[var(--forge-text-muted)]">
                    <div className="text-sm">WebGL not supported</div>
                    <div className="text-xs mt-1">Using fallback renderer</div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative" style={{ width, height }}>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                onMouseLeave={handleMouseLeave}
                className="cursor-grab active:cursor-grabbing"
                style={{ touchAction: "none" }}
                data-testid="webgl-universe-canvas"
            />

            {/* Context lost overlay */}
            {contextLost && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-[var(--forge-bg-void)]/80 backdrop-blur-sm"
                >
                    <div className="text-center text-[var(--forge-text-muted)]">
                        <div className="text-sm">Restoring renderer...</div>
                    </div>
                </motion.div>
            )}

            {/* Debug stats overlay */}
            {showStats && stats && (
                <div className="absolute bottom-4 right-4 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs font-mono text-[var(--forge-text-muted)] border border-[var(--forge-border-subtle)]">
                    <div>FPS: {stats.fps}</div>
                    <div>Draw Calls: {stats.drawCalls}</div>
                    <div>Triangles: {stats.triangles.toLocaleString()}</div>
                    <div>Nodes: {stats.nodeCount.toLocaleString()}</div>
                    <div>Visible: {stats.visibleNodes.toLocaleString()}</div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// WEBGL SUPPORT BADGE
// ============================================================================

interface WebGLBadgeProps {
    className?: string;
}

/**
 * Small badge showing WebGL support status
 */
export function WebGLBadge({ className }: WebGLBadgeProps) {
    const support = useWebGLSupport();

    if (!support) return null;

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${className}`}
        >
            <div
                className={`w-1.5 h-1.5 rounded-full ${
                    support.supported ? "bg-[var(--forge-success)]" : "bg-[var(--forge-warning)]"
                }`}
            />
            <span className="text-[var(--forge-text-muted)]">
                {support.supported
                    ? `WebGL ${support.version}`
                    : "Canvas 2D"}
            </span>
        </div>
    );
}

// ============================================================================
// ADAPTIVE CANVAS - Auto-selects WebGL or Canvas 2D
// ============================================================================

interface AdaptiveCanvasProps extends Omit<WebGLCanvasProps, "onFallback"> {
    /** Force Canvas 2D renderer */
    forceCanvas2D?: boolean;
    /** Canvas 2D fallback component */
    fallbackComponent?: React.ReactNode;
}

/**
 * Automatically selects between WebGL and Canvas 2D based on support
 */
export function AdaptiveCanvas({
    forceCanvas2D = false,
    fallbackComponent,
    ...props
}: AdaptiveCanvasProps) {
    const [useFallback, setUseFallback] = useState(forceCanvas2D);

    const handleFallback = useCallback(() => {
        setUseFallback(true);
    }, []);

    if (useFallback) {
        // Render fallback (Canvas 2D UniverseCanvas)
        return (
            <>
                {fallbackComponent ?? (
                    <div
                        style={{ width: props.width, height: props.height }}
                        className="flex items-center justify-center bg-[var(--forge-bg-void)] text-[var(--forge-text-muted)] text-sm"
                    >
                        Canvas 2D fallback (implement UniverseCanvas here)
                    </div>
                )}
            </>
        );
    }

    return <WebGLCanvas {...props} onFallback={handleFallback} />;
}
