"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Target,
    TrendingUp,
    Brain,
    Zap,
    Clock,
    ChevronRight,
    AlertCircle,
    X,
    RefreshCw,
    BarChart3,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { PrismaticCard } from "@/app/shared/components";
import { useAdaptiveLearning } from "../lib/AdaptiveLearningContext";
import type { PathRecommendation, CompletionPrediction, AdaptationSuggestion } from "../lib/types";
import { getNodeById } from "@/app/features/overview/lib/curriculumData";

interface AdaptiveLearningMapProps {
    onNavigateToNode?: (nodeId: string) => void;
    className?: string;
}

/**
 * AdaptiveLearningMap - AI-Powered Learning Path Visualization
 *
 * Displays personalized learning recommendations with real-time animations,
 * completion predictions, and adaptive suggestions.
 */
export const AdaptiveLearningMap: React.FC<AdaptiveLearningMapProps> = ({
    onNavigateToNode,
    className,
}) => {
    const {
        state,
        refreshRecommendations,
        getRecommendedPath,
        getPredictionForNode,
        dismissSuggestion,
    } = useAdaptiveLearning();

    const [selectedPath, setSelectedPath] = useState<PathRecommendation | null>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    // Auto-refresh recommendations on mount if needed
    useEffect(() => {
        if (!state.isLoading && state.recommendations.length === 0 && state.profile) {
            refreshRecommendations();
        }
    }, [state.isLoading, state.recommendations.length, state.profile, refreshRecommendations]);

    const topRecommendation = useMemo(() => getRecommendedPath(), [getRecommendedPath]);

    // Get prediction for hovered node
    const hoveredPrediction = useMemo(() => {
        if (!hoveredNodeId) return null;
        return getPredictionForNode(hoveredNodeId);
    }, [hoveredNodeId, getPredictionForNode]);

    return (
        <div className={cn("space-y-6", className)} data-testid="adaptive-learning-map">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-forge rounded-xl shadow-ember-sm">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--forge-text-primary)]">
                            AI Learning Path
                        </h2>
                        <p className="text-sm text-[var(--forge-text-secondary)]">
                            Personalized recommendations based on your goals
                        </p>
                    </div>
                </div>
                <button
                    onClick={refreshRecommendations}
                    disabled={state.isLoading}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
                        "bg-[var(--ember)]/10 text-[var(--ember)]",
                        "hover:bg-[var(--ember)]/20",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-all"
                    )}
                    data-testid="refresh-recommendations-btn"
                >
                    <RefreshCw className={cn("w-4 h-4", state.isLoading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* Active Suggestions */}
            <AnimatePresence mode="popLayout">
                {state.suggestions.slice(0, 3).map((suggestion, index) => (
                    <SuggestionCard
                        key={suggestion.title}
                        suggestion={suggestion}
                        onDismiss={() => dismissSuggestion(suggestion.title)}
                        onAction={() => {
                            if (suggestion.action.targetNodeId && onNavigateToNode) {
                                onNavigateToNode(suggestion.action.targetNodeId);
                            }
                        }}
                        index={index}
                    />
                ))}
            </AnimatePresence>

            {/* Main Recommendation */}
            {topRecommendation && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <PrismaticCard glowColor="indigo" intensity="medium">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <motion.div
                                            className="absolute inset-0 bg-[var(--ember)]/30 rounded-full blur-md"
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                        <div className="relative p-2 bg-gradient-forge rounded-full">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-[var(--forge-text-primary)]">
                                            {topRecommendation.name}
                                        </h3>
                                        <p className="text-sm text-[var(--forge-text-secondary)]">
                                            {topRecommendation.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-[var(--ember)]">
                                            {Math.round(topRecommendation.optimality * 100)}%
                                        </div>
                                        <div className="text-xs text-[var(--forge-text-secondary)]">
                                            Match Score
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Path Stats */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <PathStat
                                    icon={<Target className="w-4 h-4" />}
                                    label="Topics"
                                    value={topRecommendation.nodeIds.length}
                                    color="indigo"
                                />
                                <PathStat
                                    icon={<Clock className="w-4 h-4" />}
                                    label="Hours"
                                    value={topRecommendation.totalHours}
                                    color="purple"
                                />
                                <PathStat
                                    icon={<Zap className="w-4 h-4" />}
                                    label="Skills"
                                    value={topRecommendation.skillsGained.length}
                                    color="cyan"
                                />
                                <PathStat
                                    icon={<TrendingUp className="w-4 h-4" />}
                                    label="Alignment"
                                    value={`${Math.round(topRecommendation.goalAlignment * 100)}%`}
                                    color="emerald"
                                />
                            </div>

                            {/* Animated Path Preview */}
                            <div className="relative mb-6">
                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--ember)] via-[var(--molten)] to-[var(--gold)]" />
                                <div className="space-y-3">
                                    {topRecommendation.nodeIds.slice(0, 5).map((nodeId, index) => {
                                        const node = getNodeById(nodeId);
                                        const prediction = getPredictionForNode(nodeId);

                                        return (
                                            <motion.div
                                                key={nodeId}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 + index * 0.1 }}
                                                className="relative pl-10"
                                                onMouseEnter={() => setHoveredNodeId(nodeId)}
                                                onMouseLeave={() => setHoveredNodeId(null)}
                                            >
                                                {/* Node indicator */}
                                                <motion.div
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--forge-bg-workshop)] border-2 border-[var(--ember)]"
                                                    animate={hoveredNodeId === nodeId ? { scale: 1.2 } : { scale: 1 }}
                                                />

                                                <button
                                                    onClick={() => onNavigateToNode?.(nodeId)}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-3 rounded-xl",
                                                        "bg-[var(--forge-bg-workshop)]/50",
                                                        "border border-[var(--forge-border-subtle)]",
                                                        "hover:bg-[var(--ember)]/5",
                                                        "hover:border-[var(--ember)]/30",
                                                        "transition-all cursor-pointer"
                                                    )}
                                                    data-testid={`path-node-${nodeId}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                                                            {node?.title || nodeId}
                                                        </span>
                                                        {node && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)]">
                                                                {node.estimatedHours}h
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {prediction && (
                                                            <PredictionBadge prediction={prediction} />
                                                        )}
                                                        <ChevronRight className="w-4 h-4 text-[var(--forge-text-muted)]" />
                                                    </div>
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {topRecommendation.nodeIds.length > 5 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.8 }}
                                        className="pl-10 mt-3"
                                    >
                                        <button
                                            onClick={() => setSelectedPath(topRecommendation)}
                                            className="text-sm text-[var(--ember)] hover:underline"
                                            data-testid="view-full-path-btn"
                                        >
                                            + {topRecommendation.nodeIds.length - 5} more topics
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            {/* Reasoning */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-[var(--forge-text-secondary)]">
                                    Why this path?
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {topRecommendation.reasoning.map((reason, index) => (
                                        <span
                                            key={index}
                                            className="text-xs px-3 py-1.5 rounded-full bg-[var(--ember)]/10 text-[var(--ember)]"
                                        >
                                            {reason}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Start Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    const firstNode = topRecommendation.nodeIds[0];
                                    if (firstNode && onNavigateToNode) {
                                        onNavigateToNode(firstNode);
                                    }
                                }}
                                className={cn(
                                    "w-full mt-6 py-3 px-6 rounded-xl",
                                    "bg-gradient-forge",
                                    "text-white font-medium",
                                    "hover:shadow-lg shadow-ember",
                                    "transition-shadow"
                                )}
                                data-testid="start-path-btn"
                            >
                                Start This Path
                            </motion.button>
                        </div>
                    </PrismaticCard>
                </motion.div>
            )}

            {/* Other Recommendations */}
            {state.recommendations.length > 1 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                        Alternative Paths
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {state.recommendations.slice(1, 5).map((path, index) => (
                            <PathCard
                                key={path.id}
                                path={path}
                                index={index}
                                onSelect={() => setSelectedPath(path)}
                                onNavigate={onNavigateToNode}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Analytics Summary */}
            {state.analytics && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <PrismaticCard glowColor="purple">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <BarChart3 className="w-5 h-5 text-[var(--ember)]" />
                                <h3 className="font-bold text-[var(--forge-text-primary)]">
                                    Your Learning Analytics
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <AnalyticsStat
                                    label="Weekly Hours"
                                    value={state.analytics.velocity.hoursPerWeek.toFixed(1)}
                                    trend={state.analytics.velocity.classification}
                                />
                                <AnalyticsStat
                                    label="Completion Rate"
                                    value={`${Math.round(state.analytics.velocity.completionRate * 100)}%`}
                                    trend={state.analytics.velocity.completionRate > 0.7 ? "accelerating" : "steady"}
                                />
                                <AnalyticsStat
                                    label="Skill Gap"
                                    value={`${Math.round(state.analytics.skillGaps.overallGapScore)}%`}
                                    trend={state.analytics.skillGaps.overallGapScore < 50 ? "accelerating" : "decelerating"}
                                />
                                <AnalyticsStat
                                    label="Streak"
                                    value={`${state.analytics.engagement.streakDays} days`}
                                    trend={state.analytics.engagement.streakDays > 3 ? "accelerating" : "steady"}
                                />
                            </div>
                        </div>
                    </PrismaticCard>
                </motion.div>
            )}

            {/* Prediction Tooltip */}
            <AnimatePresence>
                {hoveredPrediction && (
                    <PredictionTooltip prediction={hoveredPrediction} />
                )}
            </AnimatePresence>

            {/* Loading State */}
            {state.isLoading && (
                <div className="flex items-center justify-center py-12">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Brain className="w-8 h-8 text-[var(--ember)]" />
                    </motion.div>
                    <span className="ml-3 text-[var(--forge-text-secondary)]">
                        Analyzing your learning patterns...
                    </span>
                </div>
            )}

            {/* Empty State */}
            {!state.isLoading && state.recommendations.length === 0 && (
                <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-[var(--forge-text-muted)] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[var(--forge-text-primary)] mb-2">
                        No recommendations yet
                    </h3>
                    <p className="text-[var(--forge-text-secondary)] mb-4">
                        Start exploring topics to get personalized learning paths
                    </p>
                    <button
                        onClick={refreshRecommendations}
                        className="text-[var(--ember)] hover:underline"
                        data-testid="generate-recommendations-btn"
                    >
                        Generate Recommendations
                    </button>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SuggestionCardProps {
    suggestion: AdaptationSuggestion;
    onDismiss: () => void;
    onAction: () => void;
    index: number;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
    suggestion,
    onDismiss,
    onAction,
    index,
}) => {
    const severityColors = {
        info: "bg-[var(--forge-info)]/10 border-[var(--forge-info)]/30",
        suggestion: "bg-[var(--ember)]/10 border-[var(--ember)]/30",
        recommendation: "bg-[var(--molten)]/10 border-[var(--molten)]/30",
        urgent: "bg-[var(--forge-warning)]/10 border-[var(--forge-warning)]/30",
    };

    const severityIcons = {
        info: <AlertCircle className="w-4 h-4 text-[var(--forge-info)]" />,
        suggestion: <Sparkles className="w-4 h-4 text-[var(--ember)]" />,
        recommendation: <Target className="w-4 h-4 text-[var(--molten)]" />,
        urgent: <Zap className="w-4 h-4 text-[var(--forge-warning)]" />,
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "flex items-start gap-3 p-4 rounded-xl border",
                severityColors[suggestion.severity]
            )}
            data-testid={`suggestion-card-${suggestion.type}`}
        >
            {severityIcons[suggestion.severity]}
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-[var(--forge-text-primary)]">
                    {suggestion.title}
                </h4>
                <p className="text-sm text-[var(--forge-text-secondary)] mt-0.5">
                    {suggestion.message}
                </p>
                {suggestion.action.targetNodeId && (
                    <button
                        onClick={onAction}
                        className="text-sm text-[var(--ember)] hover:underline mt-2"
                        data-testid="suggestion-action-btn"
                    >
                        Go to topic →
                    </button>
                )}
            </div>
            <button
                onClick={onDismiss}
                className="text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
                data-testid="dismiss-suggestion-btn"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

interface PathStatProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: "indigo" | "purple" | "cyan" | "emerald";
}

const PathStat: React.FC<PathStatProps> = ({ icon, label, value, color }) => {
    const colorClasses = {
        indigo: "text-[var(--ember)] bg-[var(--ember)]/10",
        purple: "text-[var(--molten)] bg-[var(--molten)]/10",
        cyan: "text-[var(--forge-info)] bg-[var(--forge-info)]/10",
        emerald: "text-[var(--forge-success)] bg-[var(--forge-success)]/10",
    };

    return (
        <div className="text-center">
            <div className={cn("inline-flex p-2 rounded-lg mb-1", colorClasses[color])}>
                {icon}
            </div>
            <div className="text-lg font-bold text-[var(--forge-text-primary)]">{value}</div>
            <div className="text-xs text-[var(--forge-text-secondary)]">{label}</div>
        </div>
    );
};

interface PredictionBadgeProps {
    prediction: CompletionPrediction;
}

const PredictionBadge: React.FC<PredictionBadgeProps> = ({ prediction }) => {
    const probability = prediction.probability;
    const color = probability > 0.7 ? "emerald" : probability > 0.4 ? "amber" : "red";

    const colorClasses = {
        emerald: "bg-[var(--forge-success)]/10 text-[var(--forge-success)]",
        amber: "bg-[var(--forge-warning)]/10 text-[var(--forge-warning)]",
        red: "bg-[var(--forge-error)]/10 text-[var(--forge-error)]",
    };

    return (
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", colorClasses[color])}>
            {Math.round(probability * 100)}%
        </span>
    );
};

interface PathCardProps {
    path: PathRecommendation;
    index: number;
    onSelect: () => void;
    onNavigate?: (nodeId: string) => void;
}

const PathCard: React.FC<PathCardProps> = ({ path, index, onSelect, onNavigate }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
        >
            <PrismaticCard static className="h-full">
                <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-[var(--forge-text-primary)]">
                            {path.name}
                        </h4>
                        <span className="text-sm font-medium text-[var(--ember)]">
                            {Math.round(path.optimality * 100)}%
                        </span>
                    </div>
                    <p className="text-sm text-[var(--forge-text-secondary)] mb-3 line-clamp-2">
                        {path.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[var(--forge-text-secondary)]">
                        <span>{path.nodeIds.length} topics</span>
                        <span>{path.totalHours}h</span>
                        <span className="capitalize">{path.difficulty}</span>
                    </div>
                    <button
                        onClick={() => {
                            if (path.nodeIds[0] && onNavigate) {
                                onNavigate(path.nodeIds[0]);
                            }
                        }}
                        className="w-full mt-4 py-2 text-sm font-medium text-[var(--ember)] hover:bg-[var(--ember)]/10 rounded-lg transition-colors"
                        data-testid={`start-path-${path.id}-btn`}
                    >
                        Start Path
                    </button>
                </div>
            </PrismaticCard>
        </motion.div>
    );
};

interface AnalyticsStatProps {
    label: string;
    value: string;
    trend: "slow" | "steady" | "fast" | "accelerating" | "decelerating";
}

const AnalyticsStat: React.FC<AnalyticsStatProps> = ({ label, value, trend }) => {
    const trendColors = {
        slow: "text-[var(--forge-warning)]",
        steady: "text-[var(--forge-info)]",
        fast: "text-[var(--forge-success)]",
        accelerating: "text-[var(--forge-success)]",
        decelerating: "text-[var(--forge-error)]",
    };

    const trendIcons = {
        slow: "→",
        steady: "→",
        fast: "↑",
        accelerating: "↑↑",
        decelerating: "↓",
    };

    return (
        <div className="text-center">
            <div className="text-2xl font-bold text-[var(--forge-text-primary)]">
                {value}
            </div>
            <div className="text-xs text-[var(--forge-text-secondary)]">{label}</div>
            <div className={cn("text-xs font-medium mt-1", trendColors[trend])}>
                {trendIcons[trend]} {trend}
            </div>
        </div>
    );
};

interface PredictionTooltipProps {
    prediction: CompletionPrediction;
}

const PredictionTooltip: React.FC<PredictionTooltipProps> = ({ prediction }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 right-4 max-w-sm p-4 bg-[var(--forge-bg-workshop)] rounded-xl shadow-xl border border-[var(--forge-border-subtle)] z-50"
            data-testid="prediction-tooltip"
        >
            <h4 className="font-semibold text-[var(--forge-text-primary)] mb-2">
                Completion Prediction
            </h4>
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-[var(--forge-text-secondary)]">Success probability:</span>
                    <span className="font-medium text-[var(--forge-text-primary)]">
                        {Math.round(prediction.probability * 100)}%
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-[var(--forge-text-secondary)]">Estimated time:</span>
                    <span className="font-medium text-[var(--forge-text-primary)]">
                        {prediction.estimatedHours.toFixed(1)}h
                    </span>
                </div>
                {prediction.potentialChallenges.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[var(--forge-border-subtle)]">
                        <span className="text-xs text-[var(--forge-warning)]">
                            ⚠️ {prediction.potentialChallenges[0]}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AdaptiveLearningMap;
