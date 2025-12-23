"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lightbulb,
    GitBranch,
    GitMerge,
    Target,
    Compass,
    BookOpen,
    ChevronRight,
    Info,
    Layers,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import {
    useTopologyAnalysis,
    usePathInsights,
    type TeachingStrategy,
    type PathInsight,
    type StructureCharacteristic,
} from "@/app/shared/lib/pedagogicalTopology";
import type { LearningDomainId } from "@/app/shared/lib/learningPathGraph";

// ============================================================================
// ICON MAPPING
// ============================================================================

const STRATEGY_ICONS: Record<TeachingStrategy, React.ReactNode> = {
    "breadth-first": <Layers className="w-4 h-4" />,
    "depth-first": <Target className="w-4 h-4" />,
    spiral: <TrendingUp className="w-4 h-4" />,
    "mastery-based": <BookOpen className="w-4 h-4" />,
    exploratory: <Compass className="w-4 h-4" />,
    convergent: <GitMerge className="w-4 h-4" />,
    divergent: <GitBranch className="w-4 h-4" />,
    hybrid: <Lightbulb className="w-4 h-4" />,
};

const STRATEGY_COLORS: Record<TeachingStrategy, string> = {
    "breadth-first": "emerald",
    "depth-first": "indigo",
    spiral: "purple",
    "mastery-based": "blue",
    exploratory: "amber",
    convergent: "teal",
    divergent: "rose",
    hybrid: "slate",
};

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
    GitBranch: <GitBranch className="w-4 h-4" />,
    GitMerge: <GitMerge className="w-4 h-4" />,
    Layers: <Layers className="w-4 h-4" />,
    Flag: <Target className="w-4 h-4" />,
    Target: <Target className="w-4 h-4" />,
};

// ============================================================================
// STRATEGY BADGE COMPONENT
// ============================================================================

interface StrategyBadgeProps {
    strategy: TeachingStrategy;
    confidence: number;
    className?: string;
}

function StrategyBadge({ strategy, confidence, className }: StrategyBadgeProps) {
    const color = STRATEGY_COLORS[strategy];
    const displayName = strategy
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
                `bg-${color}-100 dark:bg-${color}-900/30`,
                `text-${color}-700 dark:text-${color}-300`,
                "text-sm font-medium",
                className
            )}
            data-testid={`strategy-badge-${strategy}`}
        >
            {STRATEGY_ICONS[strategy]}
            <span>{displayName}</span>
            <span className="opacity-70 text-xs">
                {Math.round(confidence * 100)}%
            </span>
        </div>
    );
}

// ============================================================================
// CHARACTERISTIC TAG COMPONENT
// ============================================================================

interface CharacteristicTagProps {
    characteristic: StructureCharacteristic;
}

function CharacteristicTag({ characteristic }: CharacteristicTagProps) {
    const displayName = characteristic
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return (
        <span
            className={cn(
                "inline-flex px-2 py-0.5 rounded text-xs",
                "bg-slate-100 dark:bg-slate-800",
                "text-slate-600 dark:text-slate-400"
            )}
            data-testid={`characteristic-tag-${characteristic}`}
        >
            {displayName}
        </span>
    );
}

// ============================================================================
// INSIGHT CARD COMPONENT
// ============================================================================

interface InsightCardProps {
    insight: PathInsight;
    compact?: boolean;
}

function InsightCard({ insight, compact = false }: InsightCardProps) {
    const icon = INSIGHT_ICONS[insight.icon] || <Info className="w-4 h-4" />;

    if (compact) {
        return (
            <div
                className={cn(
                    "flex items-start gap-2 p-2 rounded-lg",
                    "bg-slate-50 dark:bg-slate-800/50"
                )}
                data-testid={`insight-card-${insight.category}`}
            >
                <span className="text-slate-400 mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                        {insight.title}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "p-3 rounded-xl",
                "bg-slate-50 dark:bg-slate-800/50",
                "border border-slate-100 dark:border-slate-700"
            )}
            data-testid={`insight-card-${insight.category}`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "p-2 rounded-lg flex-shrink-0",
                        "bg-slate-100 dark:bg-slate-700",
                        "text-slate-500 dark:text-slate-400"
                    )}
                >
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {insight.title}
                        </h4>
                        <span
                            className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide",
                                "bg-slate-200 dark:bg-slate-600",
                                "text-slate-500 dark:text-slate-400"
                            )}
                        >
                            {insight.category}
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {insight.description}
                    </p>
                    {insight.relatedStrategy && (
                        <div className="mt-2">
                            <StrategyBadge
                                strategy={insight.relatedStrategy}
                                confidence={insight.relevance}
                                className="text-xs py-1 px-2"
                            />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// MAIN COMPONENT: PEDAGOGICAL INSIGHTS PANEL
// ============================================================================

interface PedagogicalInsightsPanelProps {
    selectedPath?: LearningDomainId;
    compact?: boolean;
    className?: string;
    showRecommendations?: boolean;
}

/**
 * PedagogicalInsightsPanel
 *
 * Displays pedagogical insights about the curriculum topology and
 * specific path choices. Shows teaching strategy, structure characteristics,
 * and recommendations.
 */
export function PedagogicalInsightsPanel({
    selectedPath,
    compact = false,
    className,
    showRecommendations = true,
}: PedagogicalInsightsPanelProps) {
    const analysis = useTopologyAnalysis();
    const pathInsights = usePathInsights(selectedPath ?? ("frontend" as LearningDomainId));

    // Filter most relevant insights
    const topInsights = useMemo(() => {
        return pathInsights.slice(0, compact ? 2 : 4);
    }, [pathInsights, compact]);

    if (compact) {
        return (
            <div
                className={cn("space-y-3", className)}
                data-testid="pedagogical-insights-panel-compact"
            >
                {/* Strategy Summary */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Teaching Strategy
                        </span>
                    </div>
                    <StrategyBadge
                        strategy={analysis.primaryStrategy}
                        confidence={analysis.confidence}
                        className="text-xs py-0.5 px-2"
                    />
                </div>

                {/* Compact Insights */}
                {selectedPath && topInsights.length > 0 && (
                    <div className="space-y-1.5">
                        {topInsights.map((insight, idx) => (
                            <InsightCard
                                key={`${insight.category}-${idx}`}
                                insight={insight}
                                compact
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn("space-y-4", className)}
            data-testid="pedagogical-insights-panel"
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        Curriculum Pedagogy
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Teaching strategy analysis
                    </p>
                </div>
            </div>

            {/* Primary Strategy */}
            <div
                className={cn(
                    "p-4 rounded-xl",
                    "bg-gradient-to-br from-slate-50 to-slate-100",
                    "dark:from-slate-800/50 dark:to-slate-800"
                )}
                data-testid="primary-strategy-section"
            >
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Primary Strategy
                    </span>
                    <StrategyBadge
                        strategy={analysis.primaryStrategy}
                        confidence={analysis.confidence}
                    />
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {analysis.pedagogicalDescription}
                </p>
            </div>

            {/* Structure Characteristics */}
            {analysis.characteristics.length > 0 && (
                <div data-testid="characteristics-section">
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        Detected Characteristics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.characteristics.map((char) => (
                            <CharacteristicTag key={char} characteristic={char} />
                        ))}
                    </div>
                </div>
            )}

            {/* Path-Specific Insights */}
            {selectedPath && topInsights.length > 0 && (
                <div data-testid="path-insights-section">
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                        Path Insights: {selectedPath}
                    </h4>
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {topInsights.map((insight, idx) => (
                                <InsightCard
                                    key={`${insight.category}-${idx}`}
                                    insight={insight}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {showRecommendations && analysis.recommendations.length > 0 && (
                <div
                    className={cn(
                        "p-3 rounded-xl",
                        "bg-emerald-50 dark:bg-emerald-900/20",
                        "border border-emerald-100 dark:border-emerald-800"
                    )}
                    data-testid="recommendations-section"
                >
                    <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Recommendations
                    </h4>
                    <ul className="space-y-2">
                        {analysis.recommendations.map((rec, idx) => (
                            <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300"
                            >
                                <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Metrics Summary */}
            <div
                className={cn(
                    "grid grid-cols-3 gap-3 p-3 rounded-xl",
                    "bg-slate-50 dark:bg-slate-800/50"
                )}
                data-testid="metrics-summary"
            >
                <div className="text-center">
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {analysis.metrics.totalNodes}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Topics</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {analysis.metrics.totalEdges}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Connections
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {analysis.pathCharacteristics.depth}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tier Depth
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PedagogicalInsightsPanel;
