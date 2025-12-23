"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    ArrowLeft,
    Sparkles,
    CheckCircle2,
    PlayCircle,
    Lock,
    ChevronRight,
    Navigation,
    Compass,
    Keyboard,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { NavigationContext, NavigationTarget } from "../lib/NavigationService";
import { getCategoryMeta, CurriculumNode } from "../lib/curriculumTypes";

interface ConnectionsPanelProps {
    /** Navigation context for the current node */
    context: NavigationContext | null;
    /** Currently focused connection (from keyboard nav) */
    focusedConnection: CurriculumNode | null;
    /** Callback when a connection is clicked */
    onNavigate: (node: CurriculumNode) => void;
    /** Whether keyboard navigation is active */
    keyboardActive?: boolean;
    /** Additional className */
    className?: string;
}

const STATUS_ICONS = {
    completed: CheckCircle2,
    in_progress: PlayCircle,
    available: ChevronRight,
    locked: Lock,
};

const STATUS_COLORS = {
    completed: "text-emerald-500",
    in_progress: "text-indigo-500",
    available: "text-slate-400",
    locked: "text-slate-300 dark:text-slate-600",
};

/**
 * ConnectionsPanel displays the navigation options from the current node.
 *
 * This panel answers the key question: "Where can I go from here?"
 * It treats connections as first-class navigation primitives, not just visuals.
 */
export const ConnectionsPanel: React.FC<ConnectionsPanelProps> = ({
    context,
    focusedConnection,
    onNavigate,
    keyboardActive = false,
    className,
}) => {
    if (!context) {
        return null;
    }

    const {
        currentNode,
        forwardTargets,
        backwardTargets,
        suggestedNext,
        announcement,
    } = context;

    const hasConnections = forwardTargets.length > 0 || backwardTargets.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
                "bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm",
                "border border-slate-200 dark:border-slate-700",
                "rounded-xl shadow-lg overflow-hidden",
                "max-w-sm",
                className
            )}
            role="navigation"
            aria-label="Connected topics navigation"
            data-testid="connections-panel"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                        Navigation
                    </span>
                    {keyboardActive && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <Keyboard className="w-3 h-3" />
                            Active
                        </span>
                    )}
                </div>

                {/* Connection summary for screen readers */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {announcement.brief}
                </p>
            </div>

            {!hasConnections ? (
                <div className="px-4 py-6 text-center">
                    <Navigation className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        No connected topics
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {/* Suggested Next */}
                    {suggestedNext && (
                        <div className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mb-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                Suggested Next
                            </div>
                            <ConnectionItem
                                target={suggestedNext}
                                isFocused={focusedConnection?.id === suggestedNext.node.id}
                                onNavigate={onNavigate}
                                highlighted
                            />
                        </div>
                    )}

                    {/* Forward paths (where you can go) */}
                    {forwardTargets.length > 0 && (
                        <div className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
                                <ArrowRight className="w-3.5 h-3.5" />
                                Leads to ({forwardTargets.length})
                            </div>
                            <div className="space-y-1">
                                {forwardTargets.map((target) => (
                                    <ConnectionItem
                                        key={target.node.id}
                                        target={target}
                                        isFocused={focusedConnection?.id === target.node.id}
                                        onNavigate={onNavigate}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Backward paths (where you came from) */}
                    {backwardTargets.length > 0 && (
                        <div className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Prerequisites ({backwardTargets.length})
                            </div>
                            <div className="space-y-1">
                                {backwardTargets.map((target) => (
                                    <ConnectionItem
                                        key={target.node.id}
                                        target={target}
                                        isFocused={focusedConnection?.id === target.node.id}
                                        onNavigate={onNavigate}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Keyboard navigation hint */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                    Use <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 text-[10px]">Tab</kbd> to navigate • <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 text-[10px]">Enter</kbd> to select • <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 text-[10px]">?</kbd> for help
                </p>
            </div>
        </motion.div>
    );
};

/**
 * Individual connection item
 */
interface ConnectionItemProps {
    target: NavigationTarget;
    isFocused: boolean;
    onNavigate: (node: CurriculumNode) => void;
    highlighted?: boolean;
}

const ConnectionItem: React.FC<ConnectionItemProps> = ({
    target,
    isFocused,
    onNavigate,
    highlighted = false,
}) => {
    const { node, relationship, connection } = target;
    const categoryMeta = getCategoryMeta(node.category);
    const StatusIcon = STATUS_ICONS[node.status];
    const statusColor = STATUS_COLORS[node.status];

    const connectionTypeLabel = {
        required: "Required",
        recommended: "Recommended",
        optional: "Optional",
    }[connection.type];

    return (
        <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onNavigate(node)}
            className={cn(
                "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all",
                "hover:bg-slate-100 dark:hover:bg-slate-700",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
                isFocused && "bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500/50",
                highlighted && !isFocused && "bg-amber-50/50 dark:bg-amber-900/20",
                node.status === "locked" && "opacity-60"
            )}
            disabled={node.status === "locked"}
            aria-label={`${node.title}. ${relationship}. ${node.status.replace("_", " ")}.`}
            data-testid={`connection-item-${node.id}`}
        >
            {/* Category color indicator */}
            <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: categoryMeta.color }}
            />

            {/* Node info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {node.title}
                    </span>
                    {highlighted && (
                        <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span
                        className={cn(
                            "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                            connection.type === "required" && "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
                            connection.type === "recommended" && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                            connection.type === "optional" && "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                        )}
                    >
                        {connectionTypeLabel}
                    </span>
                    <span className="truncate">{node.estimatedHours}h</span>
                </div>
            </div>

            {/* Status icon */}
            <StatusIcon className={cn("w-4 h-4 flex-shrink-0", statusColor)} />
        </motion.button>
    );
};

export default ConnectionsPanel;
