"use client";

/**
 * PathRecommendation Component
 *
 * Displays adaptive learning path recommendations based on the living graph.
 * Shows the recommended sequence of chapters with traversability information
 * and collective intelligence insights.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    Clock,
    Zap,
    TrendingUp,
    Users,
    Brain,
    CheckCircle,
    Circle,
    Lock,
    AlertTriangle,
    ChevronRight,
    Target,
    Sparkles,
    Route,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type {
    AdaptivePath,
    LivingNode,
    PathCheckpoint,
    PathDerivation,
} from "../lib/livingGraph";

// ============================================================================
// TYPES
// ============================================================================

export interface PathRecommendationProps {
    /** The recommended adaptive path */
    path: AdaptivePath | null;

    /** Completed node IDs */
    completedNodeIds: Set<string>;

    /** Current node ID (if any) */
    currentNodeId?: string;

    /** Variant of the display */
    variant?: "full" | "compact" | "minimal";

    /** Whether to show checkpoints */
    showCheckpoints?: boolean;

    /** Whether to show alternatives */
    showAlternatives?: boolean;

    /** Callback when user clicks a node */
    onSelectNode?: (nodeId: string) => void;

    /** Callback when user selects an alternative path */
    onSelectAlternative?: (pathId: string) => void;

    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PathRecommendation({
    path,
    completedNodeIds,
    currentNodeId,
    variant = "full",
    showCheckpoints = true,
    showAlternatives = false,
    onSelectNode,
    onSelectAlternative,
    className,
}: PathRecommendationProps) {
    if (!path || path.nodes.length === 0) {
        return (
            <EmptyState
                message="No path recommendation available"
                variant={variant}
                className={className}
            />
        );
    }

    if (variant === "minimal") {
        return (
            <MinimalPath
                path={path}
                completedNodeIds={completedNodeIds}
                currentNodeId={currentNodeId}
                onSelectNode={onSelectNode}
                className={className}
            />
        );
    }

    if (variant === "compact") {
        return (
            <CompactPath
                path={path}
                completedNodeIds={completedNodeIds}
                currentNodeId={currentNodeId}
                onSelectNode={onSelectNode}
                className={className}
            />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)] rounded-xl overflow-hidden",
                className
            )}
            data-testid="path-recommendation"
        >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[var(--ember)]/10 to-[var(--forge-accent)]/10 border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--ember)]/20 rounded-lg">
                        <Route className="h-5 w-5 text-[var(--ember)]" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] flex items-center gap-2">
                            Recommended Learning Path
                            <DerivationBadge derivation={path.derivation} />
                        </h3>
                        <p className="text-sm text-[var(--forge-text-muted)]">
                            Optimized for your learning profile
                        </p>
                    </div>
                </div>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard
                        icon={Clock}
                        label="Duration"
                        value={formatDuration(path.metrics.estimatedDuration)}
                    />
                    <MetricCard
                        icon={Zap}
                        label="Total XP"
                        value={`${path.metrics.totalXP} XP`}
                    />
                    <MetricCard
                        icon={TrendingUp}
                        label="Success Rate"
                        value={`${Math.round(path.metrics.predictedCompletionRate * 100)}%`}
                    />
                    <MetricCard
                        icon={Users}
                        label="Validated By"
                        value={`${path.metrics.validationCount} learners`}
                    />
                </div>
            </div>

            {/* Path Visualization */}
            <div className="p-4">
                <div className="space-y-2">
                    {path.nodes.map((node, index) => {
                        const isCompleted = completedNodeIds.has(node.id);
                        const isCurrent = node.id === currentNodeId;
                        const isCheckpoint = showCheckpoints && path.checkpoints.some(
                            (cp) => cp.nodeId === node.id
                        );
                        const checkpoint = path.checkpoints.find(
                            (cp) => cp.nodeId === node.id
                        );

                        return (
                            <PathNode
                                key={node.id}
                                node={node}
                                index={index}
                                isCompleted={isCompleted}
                                isCurrent={isCurrent}
                                isLast={index === path.nodes.length - 1}
                                checkpoint={isCheckpoint ? checkpoint : undefined}
                                onSelect={() => onSelectNode?.(node.id)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Alternatives */}
            {showAlternatives && path.alternatives.length > 0 && (
                <div className="p-4 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]">
                    <h4 className="text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                        Alternative Paths
                    </h4>
                    <div className="space-y-2">
                        {path.alternatives.map((alt) => (
                            <button
                                key={alt.pathId}
                                onClick={() => onSelectAlternative?.(alt.pathId)}
                                className="w-full p-3 bg-[var(--forge-bg-workshop)] rounded-lg hover:bg-[var(--forge-bg-elevated)] transition-colors text-left group"
                                data-testid={`alternative-path-${alt.pathId}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--forge-text-secondary)]">
                                        {alt.reason}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-[var(--forge-text-muted)] group-hover:text-[var(--forge-accent)] transition-colors" />
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-[var(--forge-text-muted)]">
                                    <span
                                        className={cn(
                                            alt.difficultyDelta < 0
                                                ? "text-[var(--forge-success)]"
                                                : alt.difficultyDelta > 0
                                                ? "text-[var(--ember)]"
                                                : ""
                                        )}
                                    >
                                        {alt.difficultyDelta < 0
                                            ? `${Math.abs(Math.round(alt.difficultyDelta * 100))}% easier`
                                            : alt.difficultyDelta > 0
                                            ? `${Math.round(alt.difficultyDelta * 100)}% harder`
                                            : "Same difficulty"}
                                    </span>
                                    <span>
                                        {alt.durationDelta < 0
                                            ? `${Math.abs(Math.round(alt.durationDelta))} min faster`
                                            : alt.durationDelta > 0
                                            ? `${Math.round(alt.durationDelta)} min longer`
                                            : "Same duration"}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface PathNodeProps {
    node: LivingNode;
    index: number;
    isCompleted: boolean;
    isCurrent: boolean;
    isLast: boolean;
    checkpoint?: PathCheckpoint;
    onSelect: () => void;
}

function PathNode({
    node,
    index,
    isCompleted,
    isCurrent,
    isLast,
    checkpoint,
    onSelect,
}: PathNodeProps) {
    const isAccessible =
        node.traversability.recommendation !== "blocked";

    return (
        <div className="relative">
            {/* Connection line */}
            {!isLast && (
                <div
                    className={cn(
                        "absolute left-5 top-12 w-0.5 h-6",
                        isCompleted
                            ? "bg-[var(--forge-success)]"
                            : "bg-[var(--forge-border-subtle)]"
                    )}
                />
            )}

            <button
                onClick={onSelect}
                disabled={!isAccessible && !isCompleted}
                className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left group",
                    isCurrent
                        ? "bg-[var(--ember)]/10 border border-[var(--ember)]/30"
                        : isCompleted
                        ? "bg-[var(--forge-success)]/5 hover:bg-[var(--forge-success)]/10"
                        : isAccessible
                        ? "bg-[var(--forge-bg-elevated)] hover:bg-[var(--forge-accent)]/10"
                        : "bg-[var(--forge-bg-elevated)] opacity-60 cursor-not-allowed"
                )}
                data-testid={`path-node-${node.id}`}
            >
                {/* Status Icon */}
                <div
                    className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                        isCompleted
                            ? "bg-[var(--forge-success)] text-white"
                            : isCurrent
                            ? "bg-[var(--ember)] text-white"
                            : isAccessible
                            ? "bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)]"
                            : "bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)]"
                    )}
                >
                    {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : !isAccessible ? (
                        <Lock className="h-4 w-4 text-[var(--forge-text-muted)]" />
                    ) : (
                        <span className="text-sm font-medium text-[var(--forge-text-secondary)]">
                            {index + 1}
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-[var(--forge-text-primary)] truncate">
                            {node.title}
                        </h4>
                        {checkpoint && (
                            <span className="px-1.5 py-0.5 bg-[var(--forge-accent)]/20 text-[var(--forge-accent)] text-xs rounded">
                                Checkpoint
                            </span>
                        )}
                        {node.traversability.predictedStruggle > 0.5 && !isCompleted && (
                            <AlertTriangle className="h-4 w-4 text-[var(--forge-warning)]" />
                        )}
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-xs text-[var(--forge-text-muted)]">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {node.predictedDuration} min
                        </span>
                        <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {node.xpReward} XP
                        </span>
                        {!isCompleted && (
                            <span
                                className={cn(
                                    "flex items-center gap-1",
                                    node.predictedSuccessRate >= 0.7
                                        ? "text-[var(--forge-success)]"
                                        : node.predictedSuccessRate >= 0.5
                                        ? "text-[var(--forge-warning)]"
                                        : "text-[var(--ember)]"
                                )}
                            >
                                <TrendingUp className="h-3 w-3" />
                                {Math.round(node.predictedSuccessRate * 100)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 text-[var(--forge-text-muted)] group-hover:text-[var(--forge-accent)] transition-colors flex-shrink-0" />
            </button>
        </div>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Clock;
    label: string;
    value: string;
}) {
    return (
        <div className="p-2 bg-[var(--forge-bg-elevated)] rounded-lg">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[var(--forge-text-muted)]" />
                <span className="text-xs text-[var(--forge-text-muted)]">{label}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-[var(--forge-text-primary)]">
                {value}
            </p>
        </div>
    );
}

function DerivationBadge({ derivation }: { derivation: PathDerivation }) {
    const config = {
        static: { label: "Curriculum", icon: Target },
        collective: { label: "Community", icon: Users },
        personalized: { label: "Personalized", icon: Sparkles },
        hybrid: { label: "Hybrid", icon: Brain },
    };

    const { label, icon: Icon } = config[derivation];

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--forge-accent)]/20 text-[var(--forge-accent)] text-xs rounded-full">
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}

function EmptyState({
    message,
    variant,
    className,
}: {
    message: string;
    variant: string;
    className?: string;
}) {
    if (variant === "minimal") {
        return (
            <div className={cn("text-sm text-[var(--forge-text-muted)]", className)}>
                {message}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "p-6 bg-[var(--forge-bg-elevated)] rounded-xl text-center",
                className
            )}
        >
            <Route className="h-8 w-8 text-[var(--forge-text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--forge-text-muted)]">{message}</p>
        </div>
    );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

function CompactPath({
    path,
    completedNodeIds,
    currentNodeId,
    onSelectNode,
    className,
}: Pick<
    PathRecommendationProps,
    "path" | "completedNodeIds" | "currentNodeId" | "onSelectNode" | "className"
>) {
    if (!path) return null;

    return (
        <div
            className={cn(
                "p-3 bg-[var(--forge-bg-elevated)] rounded-lg",
                className
            )}
            data-testid="path-recommendation-compact"
        >
            <div className="flex items-center gap-2 mb-2">
                <Route className="h-4 w-4 text-[var(--ember)]" />
                <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                    Recommended Path
                </span>
                <span className="text-xs text-[var(--forge-text-muted)]">
                    ({path.nodes.length} chapters)
                </span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {path.nodes.slice(0, 5).map((node, index) => {
                    const isCompleted = completedNodeIds.has(node.id);
                    const isCurrent = node.id === currentNodeId;

                    return (
                        <React.Fragment key={node.id}>
                            <button
                                onClick={() => onSelectNode?.(node.id)}
                                className={cn(
                                    "flex-shrink-0 px-2 py-1 rounded text-xs transition-colors",
                                    isCompleted
                                        ? "bg-[var(--forge-success)]/20 text-[var(--forge-success)]"
                                        : isCurrent
                                        ? "bg-[var(--ember)]/20 text-[var(--ember)]"
                                        : "bg-[var(--forge-bg-workshop)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-accent)]/20"
                                )}
                                data-testid={`compact-node-${node.id}`}
                            >
                                {node.title.length > 15
                                    ? `${node.title.substring(0, 15)}...`
                                    : node.title}
                            </button>
                            {index < Math.min(path.nodes.length - 1, 4) && (
                                <ArrowRight className="h-3 w-3 text-[var(--forge-text-muted)] flex-shrink-0" />
                            )}
                        </React.Fragment>
                    );
                })}
                {path.nodes.length > 5 && (
                    <span className="text-xs text-[var(--forge-text-muted)] flex-shrink-0">
                        +{path.nodes.length - 5} more
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-[var(--forge-text-muted)]">
                <span>{formatDuration(path.metrics.estimatedDuration)}</span>
                <span>{path.metrics.totalXP} XP</span>
            </div>
        </div>
    );
}

// ============================================================================
// MINIMAL VARIANT
// ============================================================================

function MinimalPath({
    path,
    completedNodeIds,
    currentNodeId,
    onSelectNode,
    className,
}: Pick<
    PathRecommendationProps,
    "path" | "completedNodeIds" | "currentNodeId" | "onSelectNode" | "className"
>) {
    if (!path) return null;

    const nextNode = path.nodes.find(
        (n) => !completedNodeIds.has(n.id) && n.id !== currentNodeId
    );

    return (
        <div className={cn("flex items-center gap-2", className)} data-testid="path-recommendation-minimal">
            <Route className="h-4 w-4 text-[var(--forge-text-muted)]" />
            <span className="text-sm text-[var(--forge-text-secondary)]">Next:</span>
            {nextNode ? (
                <button
                    onClick={() => onSelectNode?.(nextNode.id)}
                    className="text-sm font-medium text-[var(--ember)] hover:underline"
                    data-testid="next-node-link"
                >
                    {nextNode.title}
                </button>
            ) : (
                <span className="text-sm text-[var(--forge-success)]">Path complete!</span>
            )}
        </div>
    );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
}

export default PathRecommendation;
