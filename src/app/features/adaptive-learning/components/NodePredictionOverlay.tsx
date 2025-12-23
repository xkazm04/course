"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import { useAdaptiveLearning } from "../lib/AdaptiveLearningContext";
import type { CompletionPrediction } from "../lib/types";

interface NodePredictionOverlayProps {
    nodeId: string;
    isVisible: boolean;
    position?: { x: number; y: number };
}

/**
 * NodePredictionOverlay - Displays AI prediction for a knowledge map node
 *
 * Shows completion probability as a circular indicator with animated
 * visual feedback based on the prediction confidence.
 */
export const NodePredictionOverlay: React.FC<NodePredictionOverlayProps> = ({
    nodeId,
    isVisible,
    position,
}) => {
    const { getPredictionForNode, state } = useAdaptiveLearning();
    const prediction = useMemo(() => getPredictionForNode(nodeId), [nodeId, getPredictionForNode]);

    if (!prediction || !isVisible) return null;

    const probability = prediction.probability;
    const circumference = 2 * Math.PI * 18; // radius = 18
    const strokeDashoffset = circumference * (1 - probability);

    // Color based on probability
    const getColor = () => {
        if (probability >= 0.7) return { stroke: "#10b981", glow: "rgba(16, 185, 129, 0.3)" };
        if (probability >= 0.4) return { stroke: "#f59e0b", glow: "rgba(245, 158, 11, 0.3)" };
        return { stroke: "#ef4444", glow: "rgba(239, 68, 68, 0.3)" };
    };

    const color = getColor();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute -top-2 -right-2 z-20"
                style={position ? { left: position.x, top: position.y } : undefined}
                data-testid={`node-prediction-${nodeId}`}
            >
                {/* Glow effect */}
                <motion.div
                    className="absolute inset-0 rounded-full blur-md"
                    style={{ backgroundColor: color.glow }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Circular progress indicator */}
                <div className="relative w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                        {/* Background circle */}
                        <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-slate-200 dark:text-slate-700"
                        />
                        {/* Progress circle */}
                        <motion.circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke={color.stroke}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </svg>

                    {/* Percentage text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                            {Math.round(probability * 100)}
                        </span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

interface PathVisualizerProps {
    nodeIds: string[];
    highlightedNodeId?: string;
    onNodeClick?: (nodeId: string) => void;
}

/**
 * PathVisualizer - Animated path recommendation overlay
 *
 * Renders animated connection lines between recommended nodes
 * to visualize the AI-suggested learning path.
 */
export const PathVisualizer: React.FC<PathVisualizerProps> = ({
    nodeIds,
    highlightedNodeId,
    onNodeClick,
}) => {
    const { getPredictionForNode } = useAdaptiveLearning();

    // Generate path segments with predictions
    const segments = useMemo(() => {
        return nodeIds.slice(0, -1).map((nodeId, index) => {
            const nextNodeId = nodeIds[index + 1];
            const prediction = getPredictionForNode(nodeId);

            return {
                from: nodeId,
                to: nextNodeId,
                probability: prediction?.probability || 0.5,
                index,
            };
        });
    }, [nodeIds, getPredictionForNode]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" data-testid="path-visualizer">
            <svg className="w-full h-full">
                <defs>
                    {/* Animated gradient for path lines */}
                    <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(99, 102, 241)">
                            <animate
                                attributeName="offset"
                                values="0;1;0"
                                dur="2s"
                                repeatCount="indefinite"
                            />
                        </stop>
                        <stop offset="50%" stopColor="rgb(139, 92, 246)">
                            <animate
                                attributeName="offset"
                                values="0.5;1.5;0.5"
                                dur="2s"
                                repeatCount="indefinite"
                            />
                        </stop>
                        <stop offset="100%" stopColor="rgb(99, 102, 241)">
                            <animate
                                attributeName="offset"
                                values="1;2;1"
                                dur="2s"
                                repeatCount="indefinite"
                            />
                        </stop>
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id="path-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Render path segments */}
                {segments.map((segment, index) => (
                    <motion.g
                        key={`${segment.from}-${segment.to}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        {/* This would need actual node positions from the canvas */}
                        {/* For now, we just show it's available as a concept */}
                    </motion.g>
                ))}
            </svg>
        </div>
    );
};

interface RecommendedPathIndicatorProps {
    isOnRecommendedPath: boolean;
    pathPosition?: number; // 1-based position in the path
    totalPathLength?: number;
}

/**
 * RecommendedPathIndicator - Badge showing node's position in recommended path
 */
export const RecommendedPathIndicator: React.FC<RecommendedPathIndicatorProps> = ({
    isOnRecommendedPath,
    pathPosition,
    totalPathLength,
}) => {
    if (!isOnRecommendedPath) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-1 -left-1 z-20"
            data-testid="recommended-path-indicator"
        >
            <div className={cn(
                "flex items-center justify-center",
                "w-6 h-6 rounded-full",
                "bg-gradient-to-r from-indigo-500 to-purple-500",
                "text-white text-xs font-bold",
                "shadow-lg shadow-indigo-500/30"
            )}>
                {pathPosition}
            </div>
            {totalPathLength && (
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "auto" }}
                    className="absolute left-full ml-1 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-full text-[10px] font-medium text-[var(--text-secondary)] shadow-sm border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                >
                    of {totalPathLength}
                </motion.div>
            )}
        </motion.div>
    );
};

interface AnimatedConnectionProps {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isHighlighted: boolean;
    animationDelay?: number;
}

/**
 * AnimatedConnection - SVG path with flowing animation for recommended paths
 */
export const AnimatedConnection: React.FC<AnimatedConnectionProps> = ({
    startX,
    startY,
    endX,
    endY,
    isHighlighted,
    animationDelay = 0,
}) => {
    // Calculate bezier curve control points
    const midY = (startY + endY) / 2;
    const controlY1 = startY + (midY - startY) * 0.8;
    const controlY2 = endY - (endY - midY) * 0.8;

    const pathD = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;

    return (
        <g data-testid="animated-connection">
            {/* Background path */}
            <path
                d={pathD}
                fill="none"
                stroke={isHighlighted ? "url(#path-gradient)" : "rgba(99, 102, 241, 0.3)"}
                strokeWidth={isHighlighted ? 4 : 2}
                strokeLinecap="round"
                filter={isHighlighted ? "url(#path-glow)" : undefined}
            />

            {/* Animated particle */}
            {isHighlighted && (
                <motion.circle
                    r="4"
                    fill="white"
                    filter="url(#path-glow)"
                    initial={{ offsetDistance: "0%" }}
                    animate={{ offsetDistance: "100%" }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: animationDelay,
                    }}
                    style={{
                        offsetPath: `path("${pathD}")`,
                    }}
                >
                    <animate
                        attributeName="opacity"
                        values="0;1;1;0"
                        dur="2s"
                        repeatCount="indefinite"
                        begin={`${animationDelay}s`}
                    />
                </motion.circle>
            )}
        </g>
    );
};

export default NodePredictionOverlay;
