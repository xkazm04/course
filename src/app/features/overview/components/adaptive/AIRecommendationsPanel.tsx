"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, TrendingUp } from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { getNodeById } from "../../lib/curriculumData";
import type { PathRecommendation } from "@/app/features/adaptive-learning/lib/types";
import { PredictionIndicator } from "./PredictionIndicator";
import { AnalyticsBar } from "./AnalyticsBar";

export interface AIRecommendationsPanelProps {
    recommendedPath: PathRecommendation | null;
    showRecommendedPath: boolean;
    isLoading: boolean;
    analytics: {
        velocity: {
            completionRate: number;
            consistencyScore: number;
        };
        skillGaps: {
            overallGapScore: number;
        };
    } | null;
    onRefresh: () => void;
    onTogglePathHighlight: () => void;
    onNavigateToNode: (nodeId: string) => void;
    getPredictionForNode: (nodeId: string) => { probability: number } | null;
}

/**
 * Panel showing AI-powered learning path recommendations and analytics.
 */
export const AIRecommendationsPanel: React.FC<AIRecommendationsPanelProps> = ({
    recommendedPath,
    showRecommendedPath,
    isLoading,
    analytics,
    onRefresh,
    onTogglePathHighlight,
    onNavigateToNode,
    getPredictionForNode,
}) => {
    return (
        <PrismaticCard className="h-[600px] overflow-y-auto" glowColor="indigo">
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Brain className="w-5 h-5 text-indigo-500" />
                        Your Path
                    </h3>
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        data-testid="refresh-path-btn"
                    >
                        {isLoading ? "Analyzing..." : "Refresh"}
                    </button>
                </div>

                {/* Recommended Path */}
                {recommendedPath ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                                {recommendedPath.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full">
                                {Math.round(recommendedPath.optimality * 100)}% match
                            </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                            {recommendedPath.description}
                        </p>

                        {/* Path Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div className="text-lg font-bold text-[var(--text-primary)]">
                                    {recommendedPath.nodeIds.length}
                                </div>
                                <div className="text-[10px] text-[var(--text-secondary)]">Topics</div>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div className="text-lg font-bold text-[var(--text-primary)]">
                                    {recommendedPath.totalHours}h
                                </div>
                                <div className="text-[10px] text-[var(--text-secondary)]">Hours</div>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div className="text-lg font-bold text-[var(--text-primary)]">
                                    {recommendedPath.skillsGained.length}
                                </div>
                                <div className="text-[10px] text-[var(--text-secondary)]">Skills</div>
                            </div>
                        </div>

                        {/* Show/Hide Path Toggle */}
                        <button
                            onClick={onTogglePathHighlight}
                            className={cn(
                                "w-full py-2 text-sm font-medium rounded-lg transition-colors",
                                showRecommendedPath
                                    ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            )}
                            data-testid="toggle-path-highlight-btn"
                        >
                            {showRecommendedPath ? "Hide Path Highlight" : "Show Path Highlight"}
                        </button>

                        {/* Path Nodes List */}
                        <div className="space-y-2 max-h-[280px] overflow-y-auto">
                            {recommendedPath.nodeIds.slice(0, 8).map((nodeId, index) => {
                                const node = getNodeById(nodeId);
                                const prediction = getPredictionForNode(nodeId);

                                if (!node) return null;

                                return (
                                    <motion.button
                                        key={nodeId}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => onNavigateToNode(nodeId)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-lg",
                                            "bg-white/50 dark:bg-slate-800/50",
                                            "border border-slate-200 dark:border-slate-700",
                                            "hover:bg-indigo-50 dark:hover:bg-indigo-950/30",
                                            "hover:border-indigo-300 dark:hover:border-indigo-700",
                                            "transition-all text-left"
                                        )}
                                        data-testid={`path-node-btn-${nodeId}`}
                                    >
                                        <div className={cn(
                                            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                            "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                                        )}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                                                {node.title}
                                            </p>
                                            <p className="text-[10px] text-[var(--text-secondary)]">
                                                {node.estimatedHours}h - {node.difficulty}
                                            </p>
                                        </div>
                                        {prediction && (
                                            <PredictionIndicator probability={prediction.probability} />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {recommendedPath.nodeIds.length > 8 && (
                            <p className="text-xs text-center text-[var(--text-secondary)]">
                                +{recommendedPath.nodeIds.length - 8} more topics
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-[var(--text-secondary)]">
                            {isLoading
                                ? "Analyzing your learning patterns..."
                                : "No path generated yet"}
                        </p>
                    </div>
                )}

                {/* Analytics Preview */}
                {analytics && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-500" />
                            Your Progress
                        </h4>
                        <div className="space-y-2">
                            <AnalyticsBar
                                label="Completion Rate"
                                value={analytics.velocity.completionRate}
                                color="emerald"
                            />
                            <AnalyticsBar
                                label="Consistency"
                                value={analytics.velocity.consistencyScore}
                                color="indigo"
                            />
                            <AnalyticsBar
                                label="Goal Alignment"
                                value={1 - analytics.skillGaps.overallGapScore / 100}
                                color="purple"
                            />
                        </div>
                    </div>
                )}
            </div>
        </PrismaticCard>
    );
};
