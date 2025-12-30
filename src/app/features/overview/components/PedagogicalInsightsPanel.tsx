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

const STRATEGY_COLORS: Record<TeachingStrategy, { bg: string; text: string }> = {
    "breadth-first": { bg: "bg-[var(--forge-success)]/20", text: "text-[var(--forge-success)]" },
    "depth-first": { bg: "bg-[var(--ember)]/20", text: "text-[var(--ember)]" },
    spiral: { bg: "bg-[var(--forge-accent)]/20", text: "text-[var(--forge-accent)]" },
    "mastery-based": { bg: "bg-[var(--forge-accent)]/20", text: "text-[var(--forge-accent)]" },
    exploratory: { bg: "bg-[var(--forge-warning)]/20", text: "text-[var(--forge-warning)]" },
    convergent: { bg: "bg-[var(--forge-success)]/20", text: "text-[var(--forge-success)]" },
    divergent: { bg: "bg-[var(--forge-error)]/20", text: "text-[var(--forge-error)]" },
    hybrid: { bg: "bg-[var(--forge-bg-workshop)]", text: "text-[var(--forge-text-secondary)]" },
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
    const colorStyles = STRATEGY_COLORS[strategy];
    const displayName = strategy
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
                colorStyles.bg,
                colorStyles.text,
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
                "bg-[var(--forge-bg-workshop)]",
                "text-[var(--forge-text-secondary)]"
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
                    "bg-[var(--forge-bg-workshop)]"
                )}
                data-testid={`insight-card-${insight.category}`}
            >
                <span className="text-[var(--forge-text-muted)] mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--forge-text-primary)] truncate">
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
                "bg-[var(--forge-bg-workshop)]",
                "border border-[var(--forge-border-subtle)]"
            )}
            data-testid={`insight-card-${insight.category}`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "p-2 rounded-lg flex-shrink-0",
                        "bg-[var(--forge-bg-elevated)]",
                        "text-[var(--forge-text-muted)]"
                    )}
                >
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-[var(--forge-text-primary)]">
                            {insight.title}
                        </h4>
                        <span
                            className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide",
                                "bg-[var(--forge-bg-elevated)]",
                                "text-[var(--forge-text-muted)]"
                            )}
                        >
                            {insight.category}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--forge-text-secondary)] leading-relaxed">
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
                        <Lightbulb className="w-4 h-4 text-[var(--forge-warning)]" />
                        <span className="text-xs font-medium text-[var(--forge-text-secondary)]">
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
                <div className="p-2 bg-[var(--forge-warning)]/20 rounded-xl">
                    <Lightbulb className="w-5 h-5 text-[var(--forge-warning)]" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[var(--forge-text-primary)]">
                        Curriculum Pedagogy
                    </h3>
                    <p className="text-xs text-[var(--forge-text-muted)]">
                        Teaching strategy analysis
                    </p>
                </div>
            </div>

            {/* Primary Strategy */}
            <div
                className={cn(
                    "p-4 rounded-xl",
                    "bg-[var(--forge-bg-workshop)]"
                )}
                data-testid="primary-strategy-section"
            >
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--forge-text-secondary)]">
                        Primary Strategy
                    </span>
                    <StrategyBadge
                        strategy={analysis.primaryStrategy}
                        confidence={analysis.confidence}
                    />
                </div>
                <p className="text-sm text-[var(--forge-text-primary)] leading-relaxed">
                    {analysis.pedagogicalDescription}
                </p>
            </div>

            {/* Structure Characteristics */}
            {analysis.characteristics.length > 0 && (
                <div data-testid="characteristics-section">
                    <h4 className="text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
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
                    <h4 className="text-sm font-medium text-[var(--forge-text-secondary)] mb-3">
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
                        "bg-[var(--forge-success)]/10",
                        "border border-[var(--forge-success)]/30"
                    )}
                    data-testid="recommendations-section"
                >
                    <h4 className="text-sm font-semibold text-[var(--forge-success)] mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Recommendations
                    </h4>
                    <ul className="space-y-2">
                        {analysis.recommendations.map((rec, idx) => (
                            <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-[var(--forge-success)]"
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
                    "bg-[var(--forge-bg-workshop)]"
                )}
                data-testid="metrics-summary"
            >
                <div className="text-center">
                    <p className="text-lg font-bold text-[var(--forge-text-primary)]">
                        {analysis.metrics.totalNodes}
                    </p>
                    <p className="text-xs text-[var(--forge-text-muted)]">Topics</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-[var(--forge-text-primary)]">
                        {analysis.metrics.totalEdges}
                    </p>
                    <p className="text-xs text-[var(--forge-text-muted)]">
                        Connections
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-[var(--forge-text-primary)]">
                        {analysis.pathCharacteristics.depth}
                    </p>
                    <p className="text-xs text-[var(--forge-text-muted)]">
                        Tier Depth
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PedagogicalInsightsPanel;
