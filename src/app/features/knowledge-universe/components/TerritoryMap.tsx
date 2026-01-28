/**
 * Territory Map Component
 *
 * Google Maps-inspired visualization for learning content.
 * Uses SVG for crisp text and smooth zooming.
 */

"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ZoomIn, ZoomOut, Home, Clock, BookOpen, CheckCircle } from "lucide-react";

import type { TerritoryNode, TerritoryLevel, VisibilityConfig } from "../lib/territoryTypes";
import { DEFAULT_VISIBILITY, DEFAULT_LAYOUT_CONFIG } from "../lib/territoryTypes";
import { useTerritoryZoom } from "../lib/useTerritoryZoom";
import { getLabelVariant, shouldShowChildren } from "../lib/treemapLayout";

// ============================================================================
// TYPES
// ============================================================================

interface TerritoryMapProps {
    data: TerritoryNode;
    width?: number;
    height?: number;
    className?: string;
    onNodeSelect?: (node: TerritoryNode) => void;
    onNodeHover?: (node: TerritoryNode | null) => void;
}

// ============================================================================
// TERRITORY CARD COMPONENT
// ============================================================================

interface TerritoryCardProps {
    node: TerritoryNode;
    scale: number;
    isHovered: boolean;
    isFocused: boolean;
    visibleDepth: number;
    onNodeClick: (node: TerritoryNode) => void;
    onNodeHover: (node: TerritoryNode | null) => void;
}

function TerritoryCard({
    node,
    scale,
    isHovered,
    isFocused,
    visibleDepth,
    onNodeClick,
    onNodeHover,
}: TerritoryCardProps) {
    const effectiveWidth = node.width * scale;
    const effectiveHeight = node.height * scale;

    // Determine visibility levels
    const labelVariant = getLabelVariant(node, scale);
    const showMetrics = effectiveWidth >= DEFAULT_VISIBILITY.showMetrics.width &&
                        effectiveHeight >= DEFAULT_VISIBILITY.showMetrics.height;
    const showProgress = effectiveWidth >= DEFAULT_VISIBILITY.showProgress.width &&
                         effectiveHeight >= DEFAULT_VISIBILITY.showProgress.height;
    const showChildren = shouldShowChildren(node, scale);

    // Calculate font size based on container
    const baseFontSize = Math.min(
        Math.max(10, effectiveWidth / 10),
        Math.max(10, effectiveHeight / 4),
        32
    );

    // Level depth for rendering
    const levelDepth: Record<TerritoryLevel, number> = {
        world: 0,
        domain: 1,
        topic: 2,
        skill: 3,
        lesson: 4,
    };

    const nodeDepth = levelDepth[node.level];
    const shouldRenderContent = nodeDepth <= visibleDepth;

    if (!shouldRenderContent && node.level !== "world") {
        return null;
    }

    // Don't render if too small
    if (labelVariant === "hidden" && node.level !== "world") {
        return null;
    }

    return (
        <g
            className="territory-card"
            onMouseEnter={() => onNodeHover(node)}
            onMouseLeave={() => onNodeHover(null)}
            onClick={(e) => {
                e.stopPropagation();
                onNodeClick(node);
            }}
            style={{ cursor: node.children.length > 0 ? "pointer" : "default" }}
        >
            {/* Background */}
            <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                fill={node.color}
                stroke={isHovered || isFocused ? "#60a5fa" : node.borderColor}
                strokeWidth={isHovered || isFocused ? 2 / scale : 1 / scale}
                rx={4 / scale}
                className="transition-all duration-150"
            />

            {/* Header background */}
            {labelVariant !== "hidden" && labelVariant !== "icon" && (
                <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={Math.min(DEFAULT_LAYOUT_CONFIG.headerHeight / scale, node.height * 0.3)}
                    fill="rgba(0,0,0,0.3)"
                    rx={4 / scale}
                />
            )}

            {/* Label */}
            {labelVariant !== "hidden" && (
                <text
                    x={node.x + node.width / 2}
                    y={node.y + (labelVariant === "icon" ? node.height / 2 : DEFAULT_LAYOUT_CONFIG.headerHeight / scale / 2)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={baseFontSize / scale}
                    fontWeight={node.level === "domain" ? "bold" : "normal"}
                    className="pointer-events-none select-none"
                >
                    {labelVariant === "full" ? node.label : (node.shortLabel || node.label.slice(0, 8))}
                </text>
            )}

            {/* Metrics row */}
            {showMetrics && node.level !== "lesson" && (
                <g className="metrics-row">
                    {/* Items count */}
                    <text
                        x={node.x + 8 / scale}
                        y={node.y + node.height - 12 / scale}
                        fill="#ffffffaa"
                        fontSize={(baseFontSize * 0.6) / scale}
                        className="pointer-events-none select-none"
                    >
                        {node.metrics.totalItems} {node.level === "domain" ? "topics" : node.level === "topic" ? "skills" : "lessons"}
                    </text>

                    {/* Hours */}
                    <text
                        x={node.x + node.width - 8 / scale}
                        y={node.y + node.height - 12 / scale}
                        textAnchor="end"
                        fill="#ffffffaa"
                        fontSize={(baseFontSize * 0.6) / scale}
                        className="pointer-events-none select-none"
                    >
                        {Math.round(node.metrics.estimatedHours)}h
                    </text>
                </g>
            )}

            {/* Progress bar */}
            {showProgress && node.metrics.completionPercent > 0 && (
                <g className="progress-bar">
                    <rect
                        x={node.x + 8 / scale}
                        y={node.y + node.height - 6 / scale}
                        width={(node.width - 16 / scale) * 0.6}
                        height={3 / scale}
                        fill="rgba(255,255,255,0.2)"
                        rx={1.5 / scale}
                    />
                    <rect
                        x={node.x + 8 / scale}
                        y={node.y + node.height - 6 / scale}
                        width={(node.width - 16 / scale) * 0.6 * (node.metrics.completionPercent / 100)}
                        height={3 / scale}
                        fill="#22c55e"
                        rx={1.5 / scale}
                    />
                </g>
            )}

            {/* Hover overlay for zoom hint */}
            {isHovered && node.children.length > 0 && effectiveWidth > 100 && (
                <text
                    x={node.x + node.width / 2}
                    y={node.y + node.height / 2 + baseFontSize / scale}
                    textAnchor="middle"
                    fill="#60a5fa"
                    fontSize={(baseFontSize * 0.5) / scale}
                    className="pointer-events-none"
                >
                    Click to explore
                </text>
            )}

            {/* Render children if visible */}
            {showChildren && node.children.map((child) => (
                <TerritoryCard
                    key={child.id}
                    node={child}
                    scale={scale}
                    isHovered={false}
                    isFocused={false}
                    visibleDepth={visibleDepth}
                    onNodeClick={onNodeClick}
                    onNodeHover={onNodeHover}
                />
            ))}
        </g>
    );
}

// ============================================================================
// BREADCRUMB COMPONENT
// ============================================================================

interface BreadcrumbProps {
    items: Array<{ id: string; label: string; level: TerritoryLevel }>;
    onNavigate: (nodeId: string) => void;
    onReset: () => void;
}

function Breadcrumb({ items, onNavigate, onReset }: BreadcrumbProps) {
    if (items.length === 0) return null;

    return (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm">
            <button
                onClick={onReset}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
                title="Reset view"
            >
                <Home size={16} />
            </button>

            {items.map((item, index) => (
                <React.Fragment key={item.id}>
                    <ChevronRight size={14} className="text-gray-600" />
                    <button
                        onClick={() => onNavigate(item.id)}
                        className={`px-2 py-1 rounded transition-colors ${
                            index === items.length - 1
                                ? "text-white bg-blue-600"
                                : "text-gray-300 hover:text-white hover:bg-gray-800"
                        }`}
                    >
                        {item.label}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
}

// ============================================================================
// ZOOM CONTROLS
// ============================================================================

interface ZoomControlsProps {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    currentLevel: TerritoryLevel;
}

function ZoomControls({ scale, onZoomIn, onZoomOut, onReset, currentLevel }: ZoomControlsProps) {
    const levelLabels: Record<TerritoryLevel, string> = {
        world: "Overview",
        domain: "Domains",
        topic: "Topics",
        skill: "Skills",
        lesson: "Lessons",
    };

    return (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
            {/* Level indicator */}
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-center">
                <div className="text-gray-400 text-xs">Level</div>
                <div className="text-white font-medium">{levelLabels[currentLevel]}</div>
                <div className="text-gray-500 text-xs">{Math.round(scale * 100)}%</div>
            </div>

            {/* Zoom buttons */}
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg flex flex-col">
                <button
                    onClick={onZoomIn}
                    className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 rounded-t-lg"
                    title="Zoom in"
                >
                    <ZoomIn size={20} />
                </button>
                <div className="border-t border-gray-700" />
                <button
                    onClick={onZoomOut}
                    className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800"
                    title="Zoom out"
                >
                    <ZoomOut size={20} />
                </button>
                <div className="border-t border-gray-700" />
                <button
                    onClick={onReset}
                    className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 rounded-b-lg"
                    title="Reset view"
                >
                    <Home size={20} />
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// NODE DETAIL PANEL
// ============================================================================

interface NodeDetailPanelProps {
    node: TerritoryNode | null;
    onClose: () => void;
    onNavigate: (nodeId: string) => void;
}

function NodeDetailPanel({ node, onClose, onNavigate }: NodeDetailPanelProps) {
    if (!node) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-20 z-10 w-72 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                            {node.level}
                        </div>
                        <h3 className="text-lg font-semibold text-white">{node.label}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1"
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="p-4 grid grid-cols-3 gap-4 border-b border-gray-700">
                <div className="text-center">
                    <div className="text-2xl font-bold text-white">{node.metrics.totalLessons}</div>
                    <div className="text-xs text-gray-400">Lessons</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-white">{Math.round(node.metrics.estimatedHours)}</div>
                    <div className="text-xs text-gray-400">Hours</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{node.metrics.completionPercent}%</div>
                    <div className="text-xs text-gray-400">Complete</div>
                </div>
            </div>

            {/* Children preview */}
            {node.children.length > 0 && (
                <div className="p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                        Contains {node.children.length} {node.level === "domain" ? "topics" : node.level === "topic" ? "skills" : "items"}
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {node.children.slice(0, 5).map((child) => (
                            <button
                                key={child.id}
                                onClick={() => onNavigate(child.id)}
                                className="w-full text-left px-2 py-1 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center justify-between"
                            >
                                <span>{child.label}</span>
                                <span className="text-gray-500 text-xs">{child.metrics.totalLessons}</span>
                            </button>
                        ))}
                        {node.children.length > 5 && (
                            <div className="text-xs text-gray-500 px-2">
                                +{node.children.length - 5} more
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            {node.children.length > 0 && (
                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={() => onNavigate(node.id)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Explore {node.label}
                    </button>
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TerritoryMap({
    data,
    width,
    height,
    className = "",
    onNodeSelect,
    onNodeHover,
}: TerritoryMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [hoveredNode, setHoveredNode] = useState<TerritoryNode | null>(null);
    const [selectedNode, setSelectedNode] = useState<TerritoryNode | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Use provided dimensions or container size
    const effectiveWidth = width || containerSize.width;
    const effectiveHeight = height || containerSize.height;

    const {
        scale,
        offsetX,
        offsetY,
        breadcrumb,
        currentLevel,
        visibleDepth,
        layoutRoot,
        handleWheel,
        handlePan,
        zoomToNode,
        zoomOut,
        reset,
    } = useTerritoryZoom(data, effectiveWidth, effectiveHeight);

    // Observe container size
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Event handlers
    const handleWheelEvent = useCallback((e: React.WheelEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        handleWheel(e.nativeEvent, mouseX, mouseY);
    }, [handleWheel]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Left click only
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        handlePan(deltaX, deltaY);
        setDragStart({ x: e.clientX, y: e.clientY });
    }, [isDragging, dragStart, handlePan]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleNodeClick = useCallback((node: TerritoryNode) => {
        if (node.children.length > 0) {
            zoomToNode(node.id);
        }
        setSelectedNode(node);
        onNodeSelect?.(node);
    }, [zoomToNode, onNodeSelect]);

    const handleNodeHoverInternal = useCallback((node: TerritoryNode | null) => {
        setHoveredNode(node);
        onNodeHover?.(node);
    }, [onNodeHover]);

    const handleZoomIn = useCallback(() => {
        // Simulate zoom at center
        handleWheel({ deltaY: -100, preventDefault: () => {} } as WheelEvent, effectiveWidth / 2, effectiveHeight / 2);
    }, [handleWheel, effectiveWidth, effectiveHeight]);

    const handleZoomOut = useCallback(() => {
        handleWheel({ deltaY: 100, preventDefault: () => {} } as WheelEvent, effectiveWidth / 2, effectiveHeight / 2);
    }, [handleWheel, effectiveWidth, effectiveHeight]);

    if (!layoutRoot) {
        return (
            <div
                ref={containerRef}
                className={`w-full h-full flex items-center justify-center bg-gray-950 ${className}`}
            >
                <div className="text-gray-500">Loading territory map...</div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden bg-gray-950 ${className}`}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onWheel={handleWheelEvent}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* SVG Canvas */}
            <svg
                width={effectiveWidth}
                height={effectiveHeight}
                className="select-none"
            >
                <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
                    <TerritoryCard
                        node={layoutRoot}
                        scale={scale}
                        isHovered={hoveredNode?.id === layoutRoot.id}
                        isFocused={selectedNode?.id === layoutRoot.id}
                        visibleDepth={visibleDepth}
                        onNodeClick={handleNodeClick}
                        onNodeHover={handleNodeHoverInternal}
                    />
                </g>
            </svg>

            {/* Breadcrumb Navigation */}
            <Breadcrumb
                items={breadcrumb}
                onNavigate={zoomToNode}
                onReset={reset}
            />

            {/* Zoom Controls */}
            <ZoomControls
                scale={scale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onReset={reset}
                currentLevel={currentLevel}
            />

            {/* Node Detail Panel */}
            <AnimatePresence>
                {selectedNode && (
                    <NodeDetailPanel
                        node={selectedNode}
                        onClose={() => setSelectedNode(null)}
                        onNavigate={zoomToNode}
                    />
                )}
            </AnimatePresence>

            {/* Instructions overlay (shown initially) */}
            {scale === 1 && breadcrumb.length === 0 && (
                <div className="absolute bottom-20 left-4 z-10 bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-3 text-sm max-w-xs">
                    <div className="text-white font-medium mb-1">Navigate the Learning Map</div>
                    <ul className="text-gray-400 text-xs space-y-1">
                        <li>• Scroll to zoom in/out</li>
                        <li>• Drag to pan around</li>
                        <li>• Click territories to explore</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
