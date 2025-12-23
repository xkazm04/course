"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    Play,
    Bookmark,
    SkipForward,
    RotateCcw,
    GitBranch,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { UserNodeStatus } from "../lib/types";

// ============================================================================
// STATUS INDICATOR
// ============================================================================

interface NodeStatusIndicatorProps {
    status: UserNodeStatus;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    className?: string;
}

const STATUS_CONFIG: Record<
    UserNodeStatus,
    {
        icon: typeof Check;
        color: string;
        bgColor: string;
        label: string;
    }
> = {
    completed: {
        icon: Check,
        color: "text-emerald-500",
        bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
        label: "Completed",
    },
    in_progress: {
        icon: Play,
        color: "text-indigo-500",
        bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
        label: "In Progress",
    },
    bookmarked: {
        icon: Bookmark,
        color: "text-amber-500",
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
        label: "Bookmarked",
    },
    skipped: {
        icon: SkipForward,
        color: "text-slate-400",
        bgColor: "bg-slate-100 dark:bg-slate-800/50",
        label: "Skipped",
    },
    unlocked: {
        icon: GitBranch,
        color: "text-cyan-500",
        bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
        label: "Available",
    },
    not_started: {
        icon: RotateCcw,
        color: "text-slate-300 dark:text-slate-600",
        bgColor: "bg-slate-50 dark:bg-slate-800/30",
        label: "Not Started",
    },
};

const SIZE_CONFIG = {
    sm: { icon: 12, container: "w-5 h-5", text: "text-xs" },
    md: { icon: 16, container: "w-7 h-7", text: "text-sm" },
    lg: { icon: 20, container: "w-9 h-9", text: "text-base" },
};

export function NodeStatusIndicator({
    status,
    size = "md",
    showLabel = false,
    className,
}: NodeStatusIndicatorProps) {
    const config = STATUS_CONFIG[status];
    const sizeConfig = SIZE_CONFIG[size];
    const Icon = config.icon;

    return (
        <div className={cn("flex items-center gap-2", className)} data-testid={`node-status-${status}`}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                    "rounded-full flex items-center justify-center",
                    config.bgColor,
                    sizeConfig.container
                )}
            >
                <Icon size={sizeConfig.icon} className={config.color} />
            </motion.div>
            {showLabel && (
                <span className={cn("font-medium", config.color, sizeConfig.text)}>
                    {config.label}
                </span>
            )}
        </div>
    );
}

// ============================================================================
// MUTATION TOAST
// ============================================================================

interface MutationToastProps {
    type: "path_selected" | "node_started" | "node_completed" | "node_skipped" | "node_bookmarked";
    nodeId?: string;
    pathId?: string;
    isVisible: boolean;
    onClose: () => void;
}

const MUTATION_MESSAGES: Record<string, { icon: typeof Check; message: string; color: string }> = {
    path_selected: {
        icon: GitBranch,
        message: "Learning path selected!",
        color: "text-indigo-500",
    },
    node_started: {
        icon: Play,
        message: "Started learning",
        color: "text-indigo-500",
    },
    node_completed: {
        icon: Check,
        message: "Node completed!",
        color: "text-emerald-500",
    },
    node_skipped: {
        icon: SkipForward,
        message: "Prerequisite skipped",
        color: "text-slate-400",
    },
    node_bookmarked: {
        icon: Bookmark,
        message: "Added to bookmarks",
        color: "text-amber-500",
    },
};

export function MutationToast({
    type,
    nodeId,
    pathId,
    isVisible,
    onClose,
}: MutationToastProps) {
    const config = MUTATION_MESSAGES[type];
    const Icon = config.icon;

    React.useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className={cn(
                        "fixed bottom-6 right-6 z-50",
                        "flex items-center gap-3 px-4 py-3",
                        "bg-white dark:bg-slate-800",
                        "rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"
                    )}
                    data-testid="mutation-toast"
                >
                    <div
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            "bg-slate-100 dark:bg-slate-700"
                        )}
                    >
                        <Icon size={16} className={config.color} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {config.message}
                        </p>
                        {(nodeId || pathId) && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {pathId || nodeId}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        data-testid="mutation-toast-close-btn"
                    >
                        <span className="sr-only">Close</span>
                        <span className="text-slate-400">&times;</span>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ============================================================================
// PATH PROGRESS INDICATOR
// ============================================================================

interface PathProgressIndicatorProps {
    pathId: string;
    progress: number;
    isPrimary?: boolean;
    isSelected?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function PathProgressIndicator({
    pathId,
    progress,
    isPrimary = false,
    isSelected = false,
    size = "md",
    className,
}: PathProgressIndicatorProps) {
    const progressWidth = Math.min(100, Math.max(0, progress));

    return (
        <div
            className={cn("relative", className)}
            data-testid={`path-progress-${pathId}`}
        >
            {/* Background bar */}
            <div
                className={cn(
                    "rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden",
                    size === "sm" && "h-1.5",
                    size === "md" && "h-2",
                    size === "lg" && "h-3"
                )}
            >
                {/* Progress fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressWidth}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={cn(
                        "h-full rounded-full",
                        isPrimary
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                            : isSelected
                                ? "bg-indigo-500"
                                : "bg-slate-400"
                    )}
                />
            </div>

            {/* Primary indicator */}
            {isPrimary && (
                <div
                    className={cn(
                        "absolute -top-1 -right-1 w-3 h-3 rounded-full",
                        "bg-amber-400 border-2 border-white dark:border-slate-800"
                    )}
                    title="Primary path"
                />
            )}

            {/* Progress label */}
            {progress > 0 && (
                <span
                    className={cn(
                        "absolute right-0 -top-5",
                        "text-xs font-medium text-slate-500 dark:text-slate-400"
                    )}
                >
                    {Math.round(progress)}%
                </span>
            )}
        </div>
    );
}

// ============================================================================
// STRATEGY PROFILE BADGE
// ============================================================================

interface StrategyProfileBadgeProps {
    depthVsBreadth: number; // 0-1, where 1 = depth-focused
    className?: string;
}

export function StrategyProfileBadge({
    depthVsBreadth,
    className,
}: StrategyProfileBadgeProps) {
    const isDepthFocused = depthVsBreadth > 0.6;
    const isBreadthFocused = depthVsBreadth < 0.4;
    const isBalanced = !isDepthFocused && !isBreadthFocused;

    const label = isDepthFocused
        ? "Deep Diver"
        : isBreadthFocused
            ? "Explorer"
            : "Balanced";

    const color = isDepthFocused
        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
        : isBreadthFocused
            ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                color,
                className
            )}
            title={`Learning style: ${label} (${Math.round(depthVsBreadth * 100)}% depth-focused)`}
            data-testid="strategy-profile-badge"
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {label}
        </div>
    );
}

// ============================================================================
// ACTIVITY FEED ITEM
// ============================================================================

interface ActivityFeedItemProps {
    mutation: {
        type: string;
        nodeId: string;
        pathId?: string;
        timestamp: string;
    };
    className?: string;
}

export function ActivityFeedItem({ mutation, className }: ActivityFeedItemProps) {
    const config = MUTATION_MESSAGES[mutation.type as keyof typeof MUTATION_MESSAGES] || {
        icon: GitBranch,
        message: "Graph updated",
        color: "text-slate-400",
    };
    const Icon = config.icon;

    const timeAgo = getTimeAgo(mutation.timestamp);

    return (
        <div
            className={cn(
                "flex items-center gap-3 p-2 rounded-lg",
                "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                "transition-colors",
                className
            )}
            data-testid={`activity-item-${mutation.nodeId}`}
        >
            <div
                className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "bg-slate-100 dark:bg-slate-700"
                )}
            >
                <Icon size={14} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                    {config.message}
                </p>
                <p className="text-xs text-slate-400 truncate">
                    {mutation.pathId || mutation.nodeId}
                </p>
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo}</span>
        </div>
    );
}

/**
 * Format timestamp to relative time
 */
function getTimeAgo(timestamp: string): string {
    const seconds = Math.floor(
        (new Date().getTime() - new Date(timestamp).getTime()) / 1000
    );

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
}
