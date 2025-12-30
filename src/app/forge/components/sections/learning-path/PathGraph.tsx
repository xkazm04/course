"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { LearningPath, PathNode as PathNodeType } from "./pathData";

function PathNode({ node, pathColor }: { node: PathNodeType; pathColor: string }) {
    const isAI = node.type === "ai";

    return (
        <motion.g
            initial={isAI ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={isAI ? { delay: 0.5 + Math.random() * 0.5, duration: 0.5, type: "spring" } : {}}
        >
            {/* Glow for AI nodes */}
            {isAI && (
                <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={28}
                    fill="none"
                    stroke={pathColor}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity={0.4}
                    animate={{ r: [28, 32, 28], opacity: [0.3, 0.6, 0.3], rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                />
            )}

            {/* Node circle */}
            <motion.circle
                cx={node.x}
                cy={node.y}
                r={22}
                fill={node.completed ? pathColor : "#1a1a1a"}
                stroke={pathColor}
                strokeWidth={node.completed ? 0 : 2}
                whileHover={{ scale: 1.1 }}
            />

            {/* AI sparkle icon */}
            {isAI && !node.completed && (
                <motion.g animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                    <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize="14" fill={pathColor}>
                        ✨
                    </text>
                </motion.g>
            )}

            {/* Checkmark for completed */}
            {node.completed && (
                <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">
                    ✓
                </text>
            )}

            {/* Label */}
            <text x={node.x} y={node.y + 40} textAnchor="middle" fontSize="11" fill="white" fontWeight="500">
                {node.label}
            </text>
        </motion.g>
    );
}

function PathConnection({
    from,
    to,
    nodes,
    pathColor,
    index,
}: {
    from: string;
    to: string;
    nodes: PathNodeType[];
    pathColor: string;
    index: number;
}) {
    const fromNode = nodes.find(n => n.id === from);
    const toNode = nodes.find(n => n.id === to);
    if (!fromNode || !toNode) return null;

    const isAI = fromNode.type === "ai" || toNode.type === "ai";

    return (
        <motion.line
            x1={fromNode.x}
            y1={fromNode.y}
            x2={toNode.x}
            y2={toNode.y}
            stroke={pathColor}
            strokeWidth={2}
            strokeOpacity={isAI ? 0.4 : 0.6}
            strokeDasharray={isAI ? "6 4" : "none"}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
        />
    );
}

interface PathGraphProps {
    path: LearningPath;
}

export function PathGraph({ path }: PathGraphProps) {
    return (
        <div className="flex-1 bg-[var(--forge-bg-elevated)]/40 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden">
            <div className="p-4 border-b border-[var(--forge-border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[var(--gold)]" />
                    <span className="text-sm font-medium text-white">{path.name}</span>
                </div>
                <div className="text-xs text-[var(--forge-text-muted)]">
                    {path.nodes.filter(n => n.type === "ai").length} AI-generated modules
                </div>
            </div>

            <div className="relative h-[300px] overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.svg
                        key={path.id}
                        width="100%"
                        height="100%"
                        viewBox="0 0 820 200"
                        preserveAspectRatio="xMidYMid meet"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-4"
                    >
                        <g>
                            {path.connections.map(([from, to], i) => (
                                <PathConnection
                                    key={`${from}-${to}`}
                                    from={from}
                                    to={to}
                                    nodes={path.nodes}
                                    pathColor={path.color}
                                    index={i}
                                />
                            ))}
                        </g>
                        <g>
                            {path.nodes.map((node) => (
                                <PathNode key={node.id} node={node} pathColor={path.color} />
                            ))}
                        </g>
                    </motion.svg>
                </AnimatePresence>

                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--forge-bg-elevated)]/80 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--forge-bg-elevated)]/80 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
