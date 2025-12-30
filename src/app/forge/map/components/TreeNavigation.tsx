"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Home, Folder, File, FolderOpen } from "lucide-react";
import type { MapNode } from "@/app/features/knowledge-map/lib/types";
import { STATUS_STYLES } from "../lib/types";

interface BreadcrumbItem {
    id: string | null;
    title: string;
}

interface TreeNavigationProps {
    path: BreadcrumbItem[];
    currentNodes: MapNode[];
    allNodes: Map<string, MapNode>;
    onNavigate: (index: number) => void;
    onNodeSelect: (nodeId: string) => void;
}

export function TreeNavigation({
    path,
    currentNodes,
    allNodes,
    onNavigate,
    onNodeSelect
}: TreeNavigationProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed left-4 top-20 z-30 w-72"
        >
            <div className="bg-[var(--forge-bg-elevated)]/95 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] shadow-lg overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-[var(--forge-bg-elevated)] border-b border-[var(--forge-border-subtle)]">
                    <div className="flex items-center gap-2">
                        <Folder size={16} className="text-[var(--forge-text-muted)]" />
                        <span className="text-sm font-semibold text-[var(--forge-text-secondary)]">Navigation</span>
                    </div>
                </div>

                {/* Two-level tree */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {/* Level 1: Breadcrumb as tree nodes */}
                    {path.map((item, i) => {
                        const isCurrentLevel = i === path.length - 1;
                        const isRoot = i === 0;

                        return (
                            <div key={item.id ?? "root"}>
                                {/* Parent level node */}
                                <button
                                    onClick={() => onNavigate(i)}
                                    className={`
                                        w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm
                                        transition-colors duration-150 text-left
                                        ${isCurrentLevel
                                            ? "bg-[var(--ember)]/10 text-[var(--ember)] font-medium"
                                            : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)]"
                                        }
                                    `}
                                    style={{ paddingLeft: `${i * 12 + 8}px` }}
                                >
                                    {isRoot ? (
                                        <Home size={14} className="flex-shrink-0" />
                                    ) : isCurrentLevel ? (
                                        <FolderOpen size={14} className="flex-shrink-0 text-[var(--ember)]" />
                                    ) : (
                                        <Folder size={14} className="flex-shrink-0 text-[var(--forge-text-muted)]" />
                                    )}
                                    <span className="truncate">{item.title}</span>
                                    {!isCurrentLevel && (
                                        <ChevronRight size={12} className="ml-auto flex-shrink-0 text-[var(--forge-text-muted)]" />
                                    )}
                                    {isCurrentLevel && (
                                        <ChevronDown size={12} className="ml-auto flex-shrink-0 text-[var(--ember)]/70" />
                                    )}
                                </button>

                                {/* Level 2: Current nodes (only shown for current level) */}
                                {isCurrentLevel && (
                                    <AnimatePresence mode="popLayout">
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pl-4 py-1 space-y-0.5">
                                                {currentNodes.slice(0, 25).map((node, nodeIndex) => {
                                                    const hasChildren = node.childIds && node.childIds.length > 0;
                                                    const status = node.status ?? "available";
                                                    const statusStyle = STATUS_STYLES[status];

                                                    return (
                                                        <motion.button
                                                            key={node.id}
                                                            initial={{ opacity: 0, x: -5 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: nodeIndex * 0.015 }}
                                                            onClick={() => hasChildren && onNodeSelect(node.id)}
                                                            disabled={!hasChildren}
                                                            className={`
                                                                w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs
                                                                transition-colors duration-150 text-left group
                                                                ${hasChildren
                                                                    ? "hover:bg-[var(--forge-bg-elevated)] cursor-pointer"
                                                                    : "opacity-60 cursor-default"
                                                                }
                                                            `}
                                                            style={{ paddingLeft: `${(i + 1) * 12 + 8}px` }}
                                                        >
                                                            {/* Status indicator */}
                                                            <span
                                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: statusStyle.fill }}
                                                            />

                                                            {/* Icon */}
                                                            {hasChildren ? (
                                                                <Folder size={12} className="flex-shrink-0 text-[var(--forge-text-muted)] group-hover:text-[var(--forge-text-secondary)]" />
                                                            ) : (
                                                                <File size={12} className="flex-shrink-0 text-[var(--forge-text-muted)]" />
                                                            )}

                                                            {/* Name */}
                                                            <span className="truncate flex-1 text-[var(--forge-text-secondary)]">
                                                                {node.name}
                                                            </span>

                                                            {/* Child count */}
                                                            {hasChildren && (
                                                                <span className="text-xs text-[var(--forge-text-muted)] flex-shrink-0">
                                                                    {node.childIds!.length}
                                                                </span>
                                                            )}

                                                            {/* Arrow on hover */}
                                                            {hasChildren && (
                                                                <ChevronRight
                                                                    size={10}
                                                                    className="flex-shrink-0 text-[var(--forge-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
                                                                />
                                                            )}
                                                        </motion.button>
                                                    );
                                                })}

                                                {currentNodes.length > 25 && (
                                                    <div className="text-xs text-[var(--forge-text-muted)] text-center py-2">
                                                        +{currentNodes.length - 25} more items
                                                    </div>
                                                )}

                                                {currentNodes.length === 0 && (
                                                    <div className="text-xs text-[var(--forge-text-muted)] text-center py-4">
                                                        No items at this level
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2 bg-[var(--forge-bg-elevated)] border-t border-[var(--forge-border-subtle)] text-xs text-[var(--forge-text-muted)]">
                    Click to navigate • Right-click canvas to go back
                </div>
            </div>
        </motion.div>
    );
}
