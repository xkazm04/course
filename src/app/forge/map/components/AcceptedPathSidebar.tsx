"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight,
    ChevronDown,
    Map as MapIcon,
    BookOpen,
    FileText,
    CheckCircle,
    Circle,
    Loader2,
    AlertCircle,
    Clock,
    Zap,
    X,
    ExternalLink,
    Sparkles,
} from "lucide-react";
import {
    usePathSyncStore,
    useAcceptedPath,
    useSortedDynamicNodes,
    useNodesByParent,
    useOverallProgress,
    useIsPolling,
    type DynamicMapNode,
    type NodeGenerationStatus,
} from "../lib/usePathSyncStore";
import { cn } from "@/app/shared/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface AcceptedPathSidebarProps {
    onClose?: () => void;
    onNavigateToMapNode?: (node: DynamicMapNode) => void;
}

// ============================================================================
// Component
// ============================================================================

export function AcceptedPathSidebar({ onClose, onNavigateToMapNode }: AcceptedPathSidebarProps) {
    const router = useRouter();

    // Store state
    const acceptedPath = useAcceptedPath();
    const dynamicNodes = useSortedDynamicNodes();
    const nodesByParent = useNodesByParent();
    const overallProgress = useOverallProgress();
    const isPolling = useIsPolling();
    const setSidebarOpen = usePathSyncStore(state => state.setSidebarOpen);
    const getChapterId = usePathSyncStore(state => state.getChapterId);

    // Local UI state - expand all nodes by default
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // Auto-expand all nodes that have children when nodes load/change
    useEffect(() => {
        const nodesWithChildren = new Set<string>();
        Object.keys(nodesByParent).forEach(parentId => {
            if (parentId !== "root" && nodesByParent[parentId]?.length > 0) {
                nodesWithChildren.add(parentId);
            }
        });
        // Also expand nodes that have children in the lookup
        dynamicNodes.forEach(node => {
            if (nodesByParent[node.id]?.length > 0) {
                nodesWithChildren.add(node.id);
            }
        });
        if (nodesWithChildren.size > 0) {
            setExpandedNodes(nodesWithChildren);
        }
    }, [dynamicNodes, nodesByParent]);

    // If no accepted path, don't render
    if (!acceptedPath) return null;

    // Build tree structure from flat nodes
    const rootNodes = useMemo(() => {
        return nodesByParent["root"] || [];
    }, [nodesByParent]);

    const toggleExpand = (nodeId: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    const handleClose = () => {
        setSidebarOpen(false);
        onClose?.();
    };

    // Handle node click - navigate to chapter content or manipulate map
    const handleNodeClick = (node: DynamicMapNode) => {
        // For lesson nodes (depth 4), navigate to chapter content
        if (node.depth === 4 && node.chapterId) {
            if (node.status === "ready" || node.status === "completed") {
                router.push(`/forge/chapter/${node.chapterId}`);
            }
            // Don't navigate if generating/pending
            return;
        }

        // For non-lesson nodes, trigger map navigation if callback provided
        if (onNavigateToMapNode) {
            onNavigateToMapNode(node);
        }

        // Also toggle expansion in the sidebar tree
        if (nodesByParent[node.id]?.length > 0) {
            toggleExpand(node.id);
        }
    };

    // Count stats
    const totalLessons = dynamicNodes.filter(n => n.depth === 4).length;
    const readyLessons = dynamicNodes.filter(n => n.depth === 4 && (n.status === "ready" || n.status === "completed")).length;
    const generatingLessons = dynamicNodes.filter(
        n => n.depth === 4 && (n.status === "pending" || n.status === "generating")
    ).length;

    const statusIcon: Record<NodeGenerationStatus, React.ReactNode> = {
        ready: <CheckCircle size={12} className="text-[var(--forge-success)]" />,
        completed: <CheckCircle size={12} className="text-[var(--forge-success)]" />,
        generating: <Loader2 size={12} className="text-[var(--ember)] animate-spin" />,
        pending: <Circle size={12} className="text-[var(--forge-text-muted)]" />,
        failed: <AlertCircle size={12} className="text-red-500" />,
    };

    // Icons for 5-level hierarchy
    const depthIcon: Record<number, React.ReactNode> = {
        0: <MapIcon size={14} className="text-[var(--ember)]" />,
        1: <BookOpen size={14} className="text-[var(--forge-info)]" />,
        2: <Zap size={14} className="text-purple-400" />,
        3: <BookOpen size={14} className="text-[var(--forge-success)]" />,
        4: <FileText size={14} className="text-cyan-400" />,
    };

    const renderNode = (node: DynamicMapNode, depth: number = 0) => {
        const children = nodesByParent[node.id] || [];
        const hasChildren = children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const isClickable = node.depth === 4 && (node.status === "ready" || node.status === "completed") && node.chapterId;

        return (
            <div key={node.id}>
                <div
                    className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors",
                        "hover:bg-[var(--forge-bg-elevated)]",
                        isClickable && "cursor-pointer",
                        depth === 0 && "font-medium"
                    )}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                >
                    {/* Expand/collapse toggle */}
                    {hasChildren ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(node.id);
                            }}
                            className="flex-shrink-0 p-0.5 rounded hover:bg-[var(--forge-border-subtle)] transition-colors"
                        >
                            <motion.div
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <ChevronRight size={12} className="text-[var(--forge-text-muted)]" />
                            </motion.div>
                        </button>
                    ) : (
                        <span className="w-4" />
                    )}

                    {/* Clickable content */}
                    <button
                        onClick={() => handleNodeClick(node)}
                        disabled={!isClickable && !hasChildren}
                        className={cn(
                            "flex-1 flex items-center gap-2 text-left min-w-0",
                            isClickable && "hover:underline"
                        )}
                    >
                        {/* Depth icon */}
                        <span className="flex-shrink-0">
                            {depthIcon[node.depth] || depthIcon[4]}
                        </span>

                        {/* Name */}
                        <span className={cn(
                            "flex-1 truncate text-sm",
                            (node.status === "ready" || node.status === "completed") && "text-[var(--forge-text-primary)]",
                            node.status === "generating" && "text-[var(--ember)]",
                            node.status === "pending" && "text-[var(--forge-text-muted)]",
                            node.status === "failed" && "text-red-500"
                        )}>
                            {node.name}
                        </span>

                        {/* Status icon */}
                        <span className="flex-shrink-0">
                            {statusIcon[node.status]}
                        </span>

                        {/* Progress for generating */}
                        {(node.status === "generating" || node.status === "pending") &&
                         node.progress !== undefined && (
                            <span className="text-xs text-[var(--ember)] flex-shrink-0">
                                {node.progress}%
                            </span>
                        )}

                        {/* New badge for AI-generated */}
                        {node.isNew && node.status === "ready" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--ember)]/10 text-[var(--ember)] flex-shrink-0 flex items-center gap-1">
                                <Sparkles size={8} />
                                New
                            </span>
                        )}

                        {/* Existing badge */}
                        {node.isExisting && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--forge-info)]/10 text-[var(--forge-info)] flex-shrink-0">
                                Existing
                            </span>
                        )}
                    </button>
                </div>

                {/* Children */}
                <AnimatePresence>
                    {hasChildren && isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            {children.map(child => renderNode(child, depth + 1))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed left-4 bottom-4 z-30 w-80"
        >
            <div className="bg-[var(--forge-bg-elevated)]/95 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] shadow-xl overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-[var(--ember)]/10 to-transparent border-b border-[var(--forge-border-subtle)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapIcon size={16} className="text-[var(--ember)]" />
                            <span className="text-sm font-semibold text-[var(--forge-text-primary)]">
                                Your Learning Path
                            </span>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1 rounded hover:bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-xs text-[var(--forge-text-muted)] mt-1">
                        {acceptedPath.name}
                    </p>
                </div>

                {/* Progress bar (when generating) */}
                {isPolling && totalLessons > 0 && (
                    <div className="px-4 py-2 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]">
                        <div className="flex items-center justify-between text-xs text-[var(--forge-text-muted)] mb-1.5">
                            <span className="flex items-center gap-1">
                                <Loader2 size={10} className="animate-spin" />
                                Generating content...
                            </span>
                            <span>{readyLessons}/{totalLessons}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[var(--forge-bg-bench)]">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${overallProgress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>
                )}

                {/* Path tree */}
                <div className="max-h-[40vh] overflow-y-auto p-2">
                    {rootNodes.map(node => renderNode(node, 0))}

                    {rootNodes.length === 0 && dynamicNodes.length > 0 && (
                        // Fallback: show flat list if hierarchy building failed
                        <div className="space-y-1">
                            {dynamicNodes.map(node => (
                                <div
                                    key={node.id}
                                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-[var(--forge-text-secondary)]"
                                    style={{ paddingLeft: `${node.depth * 12 + 8}px` }}
                                >
                                    <span className="w-2 h-2 rounded-full bg-[var(--forge-text-muted)]" />
                                    {node.name}
                                </div>
                            ))}
                        </div>
                    )}

                    {dynamicNodes.length === 0 && (
                        <div className="text-center text-sm text-[var(--forge-text-muted)] py-4">
                            No nodes in path
                        </div>
                    )}
                </div>

                {/* Footer stats */}
                <div className="px-4 py-3 bg-[var(--forge-bg-elevated)] border-t border-[var(--forge-border-subtle)]">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 text-[var(--forge-text-muted)]">
                            {acceptedPath.estimatedWeeks && (
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    ~{acceptedPath.estimatedWeeks}w
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <BookOpen size={12} />
                                {totalLessons} lessons
                            </span>
                            {generatingLessons > 0 && (
                                <span className="flex items-center gap-1 text-[var(--ember)]">
                                    <Loader2 size={12} className="animate-spin" />
                                    {generatingLessons}
                                </span>
                            )}
                        </div>

                        <Link
                            href={`/forge/paths/${acceptedPath.learningPathId}`}
                            className="flex items-center gap-1 text-[var(--ember)] hover:underline"
                        >
                            View Details
                            <ExternalLink size={10} />
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
