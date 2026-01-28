/**
 * HierarchicalMap Component
 *
 * A hierarchical navigation map for exploring curriculum structure.
 * Displays one level at a time with drill-down navigation.
 *
 * Key design principles:
 * 1. Screen coordinates only - no world coordinate transforms
 * 2. Layout computed in useMemo, not useEffect
 * 3. D3 used only for zoom/pan, not positioning
 * 4. One level at a time display with breadcrumb navigation
 */

"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import * as d3 from "d3";
import { ChevronLeft, Home, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface SupabaseNode {
    id: string;
    parent_id: string | null;
    name: string;
    node_type: "domain" | "topic" | "skill" | "course" | "lesson";
    depth: number;
    sort_order: number;
    description?: string;
    estimated_hours?: number;
    metadata?: Record<string, unknown>;
}

interface DisplayNode extends SupabaseNode {
    x: number;
    y: number;
    radius: number;
    color: string;
    childCount: number;
}

interface Breadcrumb {
    id: string | null;
    name: string;
    depth: number;
}

interface HierarchicalMapProps {
    className?: string;
    onStartLesson?: (lessonId: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;

// Colors per node type
const NODE_COLORS: Record<string, string> = {
    domain: "#6366f1",   // indigo
    topic: "#8b5cf6",    // violet
    skill: "#22c55e",    // green
    course: "#f59e0b",   // amber
    lesson: "#06b6d4",   // cyan
};

// Radius per node type
const NODE_RADII: Record<string, number> = {
    domain: 90,
    topic: 65,
    skill: 50,
    course: 40,
    lesson: 30,
};

// ============================================================================
// LAYOUT ALGORITHM
// ============================================================================

function layoutNodes(
    nodes: SupabaseNode[],
    width: number,
    height: number,
    childCounts: Map<string, number>
): DisplayNode[] {
    const cx = width / 2;
    const cy = height / 2;
    const count = nodes.length;

    if (count === 0) return [];

    // Single node: center it
    if (count === 1) {
        const node = nodes[0];
        return [{
            ...node,
            x: cx,
            y: cy,
            radius: NODE_RADII[node.node_type] || 40,
            color: NODE_COLORS[node.node_type] || "#6366f1",
            childCount: childCounts.get(node.id) || 0,
        }];
    }

    // Circular layout for ≤12 nodes
    if (count <= 12) {
        const radius = Math.min(width, height) * 0.32;
        return nodes.map((node, i) => ({
            ...node,
            x: cx + Math.cos((i / count) * TAU - HALF_PI) * radius,
            y: cy + Math.sin((i / count) * TAU - HALF_PI) * radius,
            radius: NODE_RADII[node.node_type] || 40,
            color: NODE_COLORS[node.node_type] || "#6366f1",
            childCount: childCounts.get(node.id) || 0,
        }));
    }

    // Grid layout for >12 nodes
    const cols = Math.ceil(Math.sqrt(count * (width / height)));
    const rows = Math.ceil(count / cols);
    const cellW = (width * 0.85) / cols;
    const cellH = (height * 0.85) / rows;
    const startX = (width - cols * cellW) / 2 + cellW / 2;
    const startY = (height - rows * cellH) / 2 + cellH / 2;

    return nodes.map((node, i) => ({
        ...node,
        x: startX + (i % cols) * cellW,
        y: startY + Math.floor(i / cols) * cellH,
        radius: Math.min(NODE_RADII[node.node_type] || 40, cellW * 0.35, cellH * 0.35),
        color: NODE_COLORS[node.node_type] || "#6366f1",
        childCount: childCounts.get(node.id) || 0,
    }));
}

// ============================================================================
// HELPER: Hit test
// ============================================================================

function findNodeAtPoint(
    nodes: DisplayNode[],
    x: number,
    y: number,
    transform: d3.ZoomTransform
): DisplayNode | null {
    // Convert screen coordinates to content coordinates
    const [contentX, contentY] = transform.invert([x, y]);

    for (const node of nodes) {
        const dx = contentX - node.x;
        const dy = contentY - node.y;
        if (dx * dx + dy * dy <= node.radius * node.radius) {
            return node;
        }
    }
    return null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function HierarchicalMap({ className = "", onStartLesson }: HierarchicalMapProps) {
    // State
    const [allNodes, setAllNodes] = useState<SupabaseNode[]>([]);
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([
        { id: null, name: "All Domains", depth: -1 }
    ]);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selectedLeaf, setSelectedLeaf] = useState<SupabaseNode | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
    const zoomRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
    const renderRequestRef = useRef<number>(0);

    // Compute child counts for all nodes
    const childCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const node of allNodes) {
            if (node.parent_id) {
                counts.set(node.parent_id, (counts.get(node.parent_id) || 0) + 1);
            }
        }
        return counts;
    }, [allNodes]);

    // Filter visible nodes at current level
    const visibleNodes = useMemo(() => {
        if (currentParentId === null) {
            // Root level: show depth 0 nodes
            return allNodes.filter(n => n.depth === 0);
        }
        // Show children of current parent
        return allNodes.filter(n => n.parent_id === currentParentId);
    }, [allNodes, currentParentId]);

    // Calculate positioned nodes
    const displayNodes = useMemo(() => {
        return layoutNodes(visibleNodes, canvasSize.width, canvasSize.height, childCounts);
    }, [visibleNodes, canvasSize, childCounts]);

    // Request render
    const requestRender = useCallback(() => {
        if (renderRequestRef.current) return;
        renderRequestRef.current = requestAnimationFrame(() => {
            renderRequestRef.current = 0;
            render();
        });
    }, []);

    // Render function
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvasSize;
        const t = transformRef.current;

        // Clear canvas
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Background gradient
        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7);
        bgGrad.addColorStop(0, "#1a1a2e");
        bgGrad.addColorStop(1, "#0f0f1a");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Subtle grid pattern
        ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
        ctx.lineWidth = 1;
        const gridSize = 50 * t.k;
        const offsetX = t.x % gridSize;
        const offsetY = t.y % gridSize;
        for (let x = offsetX; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = offsetY; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Apply transform for content
        ctx.setTransform(dpr * t.k, 0, 0, dpr * t.k, dpr * t.x, dpr * t.y);

        // Draw nodes
        for (const node of displayNodes) {
            const isHovered = node.id === hoveredId;
            const baseRadius = node.radius;
            const drawRadius = isHovered ? baseRadius * 1.1 : baseRadius;

            // Glow
            const glowGrad = ctx.createRadialGradient(
                node.x, node.y, drawRadius * 0.5,
                node.x, node.y, drawRadius * 2
            );
            glowGrad.addColorStop(0, `${node.color}${isHovered ? "40" : "20"}`);
            glowGrad.addColorStop(1, "transparent");
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(node.x, node.y, drawRadius * 2, 0, TAU);
            ctx.fill();

            // Node fill with gradient
            const nodeGrad = ctx.createRadialGradient(
                node.x - drawRadius * 0.3, node.y - drawRadius * 0.3, 0,
                node.x, node.y, drawRadius
            );
            nodeGrad.addColorStop(0, `${node.color}ee`);
            nodeGrad.addColorStop(0.7, `${node.color}aa`);
            nodeGrad.addColorStop(1, `${node.color}66`);
            ctx.fillStyle = nodeGrad;
            ctx.beginPath();
            ctx.arc(node.x, node.y, drawRadius, 0, TAU);
            ctx.fill();

            // Border
            ctx.strokeStyle = isHovered ? "#ffffff" : `${node.color}88`;
            ctx.lineWidth = isHovered ? 3 / t.k : 2 / t.k;
            ctx.stroke();

            // Specular highlight
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.beginPath();
            ctx.ellipse(
                node.x - drawRadius * 0.25,
                node.y - drawRadius * 0.35,
                drawRadius * 0.35,
                drawRadius * 0.2,
                -0.5,
                0, TAU
            );
            ctx.fill();

            // Child count badge (if has children)
            if (node.childCount > 0) {
                const badgeX = node.x + drawRadius * 0.6;
                const badgeY = node.y - drawRadius * 0.6;
                const badgeRadius = Math.max(12, drawRadius * 0.25) / t.k;

                ctx.fillStyle = "#1f2937";
                ctx.beginPath();
                ctx.arc(badgeX, badgeY, badgeRadius + 2 / t.k, 0, TAU);
                ctx.fill();

                ctx.fillStyle = node.color;
                ctx.beginPath();
                ctx.arc(badgeX, badgeY, badgeRadius, 0, TAU);
                ctx.fill();

                ctx.fillStyle = "#ffffff";
                ctx.font = `bold ${Math.max(10, badgeRadius * 1.2)}px Inter, system-ui, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(String(node.childCount), badgeX, badgeY);
            }
        }

        // Labels (drawn after all nodes for z-ordering)
        ctx.setTransform(dpr * t.k, 0, 0, dpr * t.k, dpr * t.x, dpr * t.y);
        for (const node of displayNodes) {
            const isHovered = node.id === hoveredId;
            const drawRadius = isHovered ? node.radius * 1.1 : node.radius;
            const fontSize = Math.max(11, Math.min(14, drawRadius * 0.3)) / t.k;

            // Label background
            ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
            const textWidth = ctx.measureText(node.name).width;
            const labelY = node.y + drawRadius + 8 / t.k;
            const labelPadding = 6 / t.k;

            ctx.fillStyle = "rgba(15, 15, 26, 0.85)";
            ctx.beginPath();
            ctx.roundRect(
                node.x - textWidth / 2 - labelPadding,
                labelY - fontSize / 2 - labelPadding / 2,
                textWidth + labelPadding * 2,
                fontSize + labelPadding,
                4 / t.k
            );
            ctx.fill();

            // Label text
            ctx.fillStyle = isHovered ? "#ffffff" : "#e5e7eb";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(node.name, node.x, labelY);

            // Node type indicator
            if (isHovered || t.k > 0.8) {
                const typeY = labelY + fontSize + 4 / t.k;
                ctx.font = `${fontSize * 0.8}px Inter, system-ui, sans-serif`;
                ctx.fillStyle = node.color;
                ctx.fillText(node.node_type.toUpperCase(), node.x, typeY);
            }
        }

        // Empty state
        if (displayNodes.length === 0 && !isLoading) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.fillStyle = "#9ca3af";
            ctx.font = "16px Inter, system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("No items at this level", width / 2, height / 2);
        }

        // Loading state
        if (isLoading) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.fillStyle = "#9ca3af";
            ctx.font = "16px Inter, system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Loading...", width / 2, height / 2);
        }
    }, [canvasSize, displayNodes, hoveredId, isLoading]);

    // Fetch data
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch("/api/map/nodes");
                if (!response.ok) {
                    throw new Error("Failed to fetch map data");
                }
                const data = await response.json();
                setAllNodes(data.nodes || []);
            } catch (err) {
                console.error("Error fetching map data:", err);
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Resize observer
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const handleResize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (w === 0 || h === 0) return;

            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            setCanvasSize({ width: w, height: h });
        };

        handleResize();
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, []);

    // D3 zoom setup
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const zoom = d3.zoom<HTMLCanvasElement, unknown>()
            .scaleExtent([0.3, 3])
            .on("zoom", (event) => {
                transformRef.current = event.transform;
                requestRender();
            });

        zoomRef.current = zoom;
        d3.select(canvas).call(zoom);

        // Reset to identity
        d3.select(canvas).call(zoom.transform, d3.zoomIdentity);

        return () => {
            d3.select(canvas).on(".zoom", null);
        };
    }, [requestRender]);

    // Render on state changes
    useEffect(() => {
        requestRender();
    }, [displayNodes, hoveredId, isLoading, requestRender]);

    // Navigation functions
    const drillDown = useCallback((node: SupabaseNode) => {
        if (node.node_type === "lesson") {
            // Leaf node - show detail or trigger callback
            setSelectedLeaf(node);
            if (onStartLesson) {
                onStartLesson(node.id);
            }
            return;
        }

        // Drill into children
        setCurrentParentId(node.id);
        setBreadcrumbs(prev => [...prev, {
            id: node.id,
            name: node.name,
            depth: node.depth,
        }]);
        setSelectedLeaf(null);

        // Reset zoom
        const canvas = canvasRef.current;
        if (canvas && zoomRef.current) {
            d3.select(canvas)
                .transition()
                .duration(300)
                .call(zoomRef.current.transform, d3.zoomIdentity);
        }
    }, [onStartLesson]);

    const goBack = useCallback(() => {
        if (breadcrumbs.length <= 1) return;

        const newBreadcrumbs = breadcrumbs.slice(0, -1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentParentId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
        setSelectedLeaf(null);

        // Reset zoom
        const canvas = canvasRef.current;
        if (canvas && zoomRef.current) {
            d3.select(canvas)
                .transition()
                .duration(300)
                .call(zoomRef.current.transform, d3.zoomIdentity);
        }
    }, [breadcrumbs]);

    const goToRoot = useCallback(() => {
        setBreadcrumbs([{ id: null, name: "All Domains", depth: -1 }]);
        setCurrentParentId(null);
        setSelectedLeaf(null);

        // Reset zoom
        const canvas = canvasRef.current;
        if (canvas && zoomRef.current) {
            d3.select(canvas)
                .transition()
                .duration(300)
                .call(zoomRef.current.transform, d3.zoomIdentity);
        }
    }, []);

    const goToBreadcrumb = useCallback((index: number) => {
        if (index >= breadcrumbs.length - 1) return;

        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentParentId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
        setSelectedLeaf(null);

        // Reset zoom
        const canvas = canvasRef.current;
        if (canvas && zoomRef.current) {
            d3.select(canvas)
                .transition()
                .duration(300)
                .call(zoomRef.current.transform, d3.zoomIdentity);
        }
    }, [breadcrumbs]);

    // Click handler
    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const node = findNodeAtPoint(displayNodes, x, y, transformRef.current);

        if (node) {
            drillDown(node);
        }
    }, [displayNodes, drillDown]);

    // Mouse move handler
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const node = findNodeAtPoint(displayNodes, x, y, transformRef.current);

        setHoveredId(node?.id ?? null);

        if (canvasRef.current) {
            canvasRef.current.style.cursor = node ? "pointer" : "grab";
        }
    }, [displayNodes]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (selectedLeaf) {
                    setSelectedLeaf(null);
                } else {
                    goBack();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goBack, selectedLeaf]);

    // Zoom controls
    const zoomIn = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !zoomRef.current) return;
        d3.select(canvas)
            .transition()
            .duration(200)
            .call(zoomRef.current.scaleBy, 1.3);
    }, []);

    const zoomOut = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !zoomRef.current) return;
        d3.select(canvas)
            .transition()
            .duration(200)
            .call(zoomRef.current.scaleBy, 0.7);
    }, []);

    const resetZoom = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !zoomRef.current) return;
        d3.select(canvas)
            .transition()
            .duration(300)
            .call(zoomRef.current.transform, d3.zoomIdentity);
    }, []);

    return (
        <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredId(null)}
                className="absolute inset-0"
            />

            {/* Back button */}
            {breadcrumbs.length > 1 && (
                <button
                    onClick={goBack}
                    className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>
            )}

            {/* Breadcrumbs */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2 bg-zinc-900/80 border border-zinc-700 rounded-lg text-sm">
                <button
                    onClick={goToRoot}
                    className="p-1 hover:bg-zinc-700 rounded transition-colors"
                    title="Home"
                >
                    <Home className="w-4 h-4 text-zinc-400" />
                </button>
                {breadcrumbs.map((crumb, i) => (
                    <div key={crumb.id ?? "root"} className="flex items-center">
                        {i > 0 && <span className="mx-1 text-zinc-600">/</span>}
                        <button
                            onClick={() => goToBreadcrumb(i)}
                            className={`px-2 py-0.5 rounded transition-colors ${
                                i === breadcrumbs.length - 1
                                    ? "text-white bg-zinc-700"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-700"
                            }`}
                        >
                            {crumb.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* Zoom controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-1">
                <button
                    onClick={zoomIn}
                    className="p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
                    title="Zoom in"
                >
                    <ZoomIn className="w-4 h-4 text-zinc-300" />
                </button>
                <button
                    onClick={zoomOut}
                    className="p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
                    title="Zoom out"
                >
                    <ZoomOut className="w-4 h-4 text-zinc-300" />
                </button>
                <button
                    onClick={resetZoom}
                    className="p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
                    title="Reset zoom"
                >
                    <RotateCcw className="w-4 h-4 text-zinc-300" />
                </button>
            </div>

            {/* Node count indicator */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-zinc-900/80 border border-zinc-700 rounded-lg text-xs text-zinc-400">
                {displayNodes.length} items
            </div>

            {/* Error state */}
            {error && (
                <div className="absolute bottom-4 right-4 px-4 py-2 bg-red-900/80 border border-red-700 rounded-lg text-sm text-red-200">
                    {error}
                </div>
            )}

            {/* Leaf node detail panel */}
            {selectedLeaf && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-md w-full mx-4 p-4 bg-zinc-900/95 border border-zinc-700 rounded-xl shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white">{selectedLeaf.name}</h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                {selectedLeaf.node_type.charAt(0).toUpperCase() + selectedLeaf.node_type.slice(1)}
                                {selectedLeaf.estimated_hours && ` - ${selectedLeaf.estimated_hours}h`}
                            </p>
                            {selectedLeaf.description && (
                                <p className="text-sm text-zinc-300 mt-2">{selectedLeaf.description}</p>
                            )}
                        </div>
                        <button
                            onClick={() => setSelectedLeaf(null)}
                            className="p-1 hover:bg-zinc-700 rounded transition-colors text-zinc-400"
                        >
                            &times;
                        </button>
                    </div>
                    {selectedLeaf.node_type === "lesson" && (
                        <button
                            onClick={() => onStartLesson?.(selectedLeaf.id)}
                            className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-colors"
                        >
                            Start Learning
                        </button>
                    )}
                </div>
            )}

            {/* Keyboard hints */}
            <div className="absolute bottom-4 right-4 text-xs text-zinc-500">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Esc</kbd> to go back
            </div>
        </div>
    );
}
