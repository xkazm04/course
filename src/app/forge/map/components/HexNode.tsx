"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, Play, BookOpen, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import type { HexLayoutNode, MapNode } from "../lib/types";
import { STATUS_STYLES, DOMAIN_COLORS, getStatusBg, getDomainBg } from "../lib/types";
import { getHexPoints, BASE_HEX_SIZE } from "../lib/hexUtils";
import type { NodeGenerationStatus } from "../lib/contentApi";

interface HexNodeProps {
    node: HexLayoutNode;
    scale: number;
    onDrillDown: (nodeId: string) => void;
    domainId?: string;
    allNodes?: Map<string, MapNode>;
    isGroupNode?: boolean;
    onHover?: (nodeId: string | null) => void;
    generationStatus?: NodeGenerationStatus;
    generationProgress?: number;
    onRetryGeneration?: (nodeId: string) => void;
}

export function HexNode({
    node,
    scale,
    onDrillDown,
    domainId,
    allNodes,
    isGroupNode,
    onHover,
    generationStatus,
    generationProgress,
    onRetryGeneration,
}: HexNodeProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Generation state flags
    const isGenerating = generationStatus === "generating" || generationStatus === "pending";
    const isFailed = generationStatus === "failed";
    const isReady = !generationStatus || generationStatus === "ready";

    // Detect dark mode
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        checkDarkMode();

        // Watch for theme changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const handleMouseEnter = () => {
        setIsHovered(true);
        onHover?.(node.id);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        onHover?.(null);
    };

    const status = node.status ?? "available";
    const style = STATUS_STYLES[status];
    const domainColor = domainId ? DOMAIN_COLORS[domainId] : null;
    const hasChildren = node.childIds && node.childIds.length > 0;

    // Inverse scale factor - when zoomed out, make things BIGGER in SVG coords
    // so they appear normal size on screen
    const inverseScale = 1 / scale;

    // Fixed hex size
    const hexSize = BASE_HEX_SIZE;

    // Font size scales inversely with zoom for readability
    const fontSize = 13 * inverseScale;

    const points = getHexPoints(node.pixel.x, node.pixel.y, hexSize);

    // Group nodes have special styling - theme aware
    // Generating nodes get grayed out appearance
    const baseFillColor = isGroupNode
        ? (isDarkMode ? "#9ca3af" : "#374151")
        : (domainColor?.base || style.fill);
    const baseBgColor = isGroupNode
        ? (isDarkMode ? "#1f2937" : "#f3f4f6")
        : (isDarkMode
            ? (domainColor?.darkBg || style.darkBg)
            : (domainColor?.light || style.bg));

    // Apply generation state styling
    const fillColor = isGenerating ? "#6b7280" : isFailed ? "#ef4444" : baseFillColor;
    const bgColor = isGenerating
        ? (isDarkMode ? "#374151" : "#e5e7eb")
        : isFailed
            ? (isDarkMode ? "#450a0a" : "#fef2f2")
            : baseBgColor;

    // Text color: white in dark mode for readability, otherwise use fill color
    const textColor = isDarkMode ? "#ffffff" : (isGroupNode ? "#374151" : fillColor);

    // Opacity for generating state
    const nodeOpacity = isGenerating ? 0.6 : 1;

    // Get child nodes for tooltip
    const childNodes = useMemo(() => {
        if (!allNodes || !node.childIds) return [];
        return node.childIds
            .map(id => allNodes.get(id))
            .filter(Boolean)
            .slice(0, 6) as MapNode[];
    }, [node.childIds, allNodes]);

    const completedCount = childNodes.filter(c => c.status === "completed").length;
    const inProgressCount = childNodes.filter(c => c.status === "in_progress").length;

    const handleClick = () => {
        // Handle retry for failed nodes
        if (isFailed && onRetryGeneration) {
            onRetryGeneration(node.id);
            return;
        }

        // Don't allow drilling down into generating nodes
        if (isGenerating) return;

        if (hasChildren && !isGroupNode) {
            onDrillDown(node.id);
        }
    };

    // Tooltip dimensions scale inversely with zoom
    const tooltipWidth = 260 * inverseScale;
    const tooltipHeight = 220 * inverseScale;
    const tooltipFontSize = 12 * inverseScale;
    const iconScale = inverseScale;

    // Title pill dimensions
    const titleWidth = Math.max(hexSize * 1.6, node.name.length * fontSize * 0.55);
    const pillHeight = fontSize * 2;

    // Determine cursor style
    const cursorStyle = isGenerating
        ? "wait"
        : isFailed
            ? "pointer"
            : hasChildren && !isGroupNode
                ? "pointer"
                : "default";

    return (
        <g
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            style={{ cursor: cursorStyle, opacity: nodeOpacity }}
        >
            {/* Glow effect on hover */}
            <AnimatePresence>
                {isHovered && !isGroupNode && (
                    <motion.polygon
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.25 }}
                        exit={{ opacity: 0 }}
                        points={getHexPoints(node.pixel.x, node.pixel.y, hexSize * 1.15)}
                        fill={fillColor}
                        filter="blur(12px)"
                    />
                )}
            </AnimatePresence>

            {/* Main hexagon */}
            <motion.polygon
                points={points}
                fill={bgColor}
                stroke={fillColor}
                strokeWidth={isHovered ? 3 : 2}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: isGroupNode ? 1 : 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />

            {/* Status ring for completed/in_progress */}
            {(status === "completed" || status === "in_progress") && !isGroupNode && !isGenerating && (
                <motion.polygon
                    points={getHexPoints(node.pixel.x, node.pixel.y, hexSize * 0.85)}
                    fill="none"
                    stroke={fillColor}
                    strokeWidth={2}
                    strokeDasharray={status === "in_progress" ? "6 4" : "none"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                />
            )}

            {/* Generating spinner overlay */}
            {isGenerating && !isGroupNode && (
                <foreignObject
                    x={node.pixel.x - 20 * inverseScale}
                    y={node.pixel.y - 20 * inverseScale}
                    width={40 * inverseScale}
                    height={40 * inverseScale}
                    style={{ pointerEvents: "none" }}
                >
                    <div className="w-full h-full flex items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        >
                            <Loader2
                                style={{
                                    width: `${24 * inverseScale}px`,
                                    height: `${24 * inverseScale}px`,
                                    color: "#6b7280",
                                }}
                            />
                        </motion.div>
                    </div>
                </foreignObject>
            )}

            {/* Progress indicator for generating nodes */}
            {isGenerating && generationProgress !== undefined && !isGroupNode && (
                <foreignObject
                    x={node.pixel.x - 30 * inverseScale}
                    y={node.pixel.y + 25 * inverseScale}
                    width={60 * inverseScale}
                    height={20 * inverseScale}
                    style={{ pointerEvents: "none" }}
                >
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ fontSize: `${10 * inverseScale}px` }}
                    >
                        <span className="text-[var(--forge-text-muted)] font-medium">
                            {generationProgress}%
                        </span>
                    </div>
                </foreignObject>
            )}

            {/* Failed state indicator */}
            {isFailed && !isGroupNode && (
                <foreignObject
                    x={node.pixel.x - 20 * inverseScale}
                    y={node.pixel.y - 20 * inverseScale}
                    width={40 * inverseScale}
                    height={40 * inverseScale}
                    style={{ pointerEvents: "none" }}
                >
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="relative">
                            <AlertCircle
                                style={{
                                    width: `${20 * inverseScale}px`,
                                    height: `${20 * inverseScale}px`,
                                    color: "#ef4444",
                                }}
                            />
                            {isHovered && (
                                <RefreshCw
                                    style={{
                                        width: `${12 * inverseScale}px`,
                                        height: `${12 * inverseScale}px`,
                                        color: "#ef4444",
                                        position: "absolute",
                                        bottom: `-${8 * inverseScale}px`,
                                        right: `-${8 * inverseScale}px`,
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </foreignObject>
            )}

            {/* Title pill - scales with zoom for readability */}
            <foreignObject
                x={node.pixel.x - titleWidth / 2}
                y={node.pixel.y - pillHeight / 2}
                width={titleWidth}
                height={pillHeight}
                style={{ pointerEvents: "none", overflow: "visible" }}
            >
                <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ fontSize: `${fontSize}px` }}
                >
                    <div
                        className="px-2 py-0.5 rounded-full backdrop-blur-sm"
                        style={{
                            backgroundColor: isGroupNode ? "rgba(31, 41, 55, 0.9)" : `${bgColor}f0`,
                            border: `1px solid ${fillColor}30`,
                        }}
                    >
                        <span
                            className="font-semibold text-center whitespace-nowrap"
                            style={{ color: textColor }}
                        >
                            {node.name}
                        </span>
                    </div>
                </div>
            </foreignObject>

            {/* Status badge - scales with zoom */}
            {!isGroupNode && (
                <g>
                    <circle
                        cx={node.pixel.x + hexSize * 0.6}
                        cy={node.pixel.y - hexSize * 0.6}
                        r={8 * inverseScale}
                        fill={status === "completed" ? "var(--forge-success)" : style.fill}
                        stroke="var(--forge-bg-elevated)"
                        strokeWidth={1.5 * inverseScale}
                    />
                </g>
            )}

            {/* Rich hover tooltip - scales inversely with zoom */}
            <AnimatePresence>
                {isHovered && hasChildren && !isGroupNode && (
                    <motion.foreignObject
                        x={node.pixel.x + hexSize + 10}
                        y={node.pixel.y - tooltipHeight / 2}
                        width={tooltipWidth}
                        height={tooltipHeight}
                        initial={{ opacity: 0, x: -10 * inverseScale }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 * inverseScale }}
                        transition={{ duration: 0.15 }}
                        style={{ pointerEvents: "none", overflow: "visible", zIndex: 9999 }}
                    >
                        <div
                            className="bg-[var(--forge-bg-elevated)] backdrop-blur-xl rounded-xl shadow-2xl border border-[var(--forge-border-subtle)] overflow-hidden h-full flex flex-col relative"
                            style={{ fontSize: `${tooltipFontSize}px`, zIndex: 9999 }}
                        >
                            {/* Header */}
                            <div
                                className="flex items-center gap-2 border-b border-[var(--forge-border-subtle)]"
                                style={{ padding: `${8 * iconScale}px ${10 * iconScale}px` }}
                            >
                                <div
                                    className="rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{
                                        backgroundColor: `${fillColor}20`,
                                        width: `${24 * iconScale}px`,
                                        height: `${24 * iconScale}px`,
                                    }}
                                >
                                    <BookOpen style={{ width: `${14 * iconScale}px`, height: `${14 * iconScale}px`, color: fillColor }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-[var(--forge-text-primary)] truncate">{node.name}</div>
                                    <div className="text-[var(--forge-text-muted)]" style={{ fontSize: `${10 * iconScale}px` }}>
                                        {node.childIds?.length || 0} items
                                    </div>
                                </div>
                                <div
                                    className="rounded-full font-medium flex-shrink-0"
                                    style={{
                                        backgroundColor: `${style.fill}20`,
                                        color: style.fill,
                                        padding: `${3 * iconScale}px ${8 * iconScale}px`,
                                        fontSize: `${10 * iconScale}px`,
                                    }}
                                >
                                    {node.progress || 0}%
                                </div>
                            </div>

                            {/* Stats row */}
                            <div
                                className="flex gap-4 border-b border-[var(--forge-border-subtle)]"
                                style={{ padding: `${6 * iconScale}px ${10 * iconScale}px` }}
                            >
                                <div className="flex items-center gap-1 text-[var(--forge-text-muted)]">
                                    <Clock style={{ width: `${12 * iconScale}px`, height: `${12 * iconScale}px` }} />
                                    <span>{node.estimatedHours || "—"}h</span>
                                </div>
                                <div className="flex items-center gap-1 text-[var(--forge-success)]">
                                    <CheckCircle style={{ width: `${12 * iconScale}px`, height: `${12 * iconScale}px` }} />
                                    <span>{completedCount}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[var(--ember)]">
                                    <Play style={{ width: `${12 * iconScale}px`, height: `${12 * iconScale}px` }} />
                                    <span>{inProgressCount}</span>
                                </div>
                            </div>

                            {/* Children list */}
                            <div className="flex-1 overflow-y-auto" style={{ padding: `${6 * iconScale}px` }}>
                                {childNodes.map((child) => (
                                    <div
                                        key={child.id}
                                        className="flex items-center gap-2"
                                        style={{ padding: `${4 * iconScale}px ${4 * iconScale}px` }}
                                    >
                                        <span
                                            className="rounded-full flex-shrink-0"
                                            style={{
                                                backgroundColor: STATUS_STYLES[child.status || "available"].fill,
                                                width: `${6 * iconScale}px`,
                                                height: `${6 * iconScale}px`,
                                            }}
                                        />
                                        <span className="text-[var(--forge-text-secondary)] truncate flex-1">{child.name}</span>
                                    </div>
                                ))}
                                {node.childIds && node.childIds.length > 6 && (
                                    <div className="text-[var(--forge-text-muted)] text-center" style={{ paddingTop: `${4 * iconScale}px` }}>
                                        +{node.childIds.length - 6} more
                                    </div>
                                )}
                            </div>

                            {/* Footer hint */}
                            <div
                                className="bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] text-center border-t border-[var(--forge-border-subtle)]"
                                style={{ padding: `${6 * iconScale}px` }}
                            >
                                Click to explore
                            </div>
                        </div>
                    </motion.foreignObject>
                )}
            </AnimatePresence>

            {/* Group node label */}
            {isGroupNode && (
                <foreignObject
                    x={node.pixel.x - hexSize}
                    y={node.pixel.y + hexSize * 0.6}
                    width={hexSize * 2}
                    height={20 * inverseScale}
                    style={{ pointerEvents: "none" }}
                >
                    <div
                        className="text-center text-[var(--forge-text-muted)] font-medium uppercase tracking-wide"
                        style={{ fontSize: `${10 * inverseScale}px` }}
                    >
                        Group
                    </div>
                </foreignObject>
            )}
        </g>
    );
}
