"use client";

/**
 * RecommendationPanel Component
 *
 * Displays smart node recommendations including:
 * - "Up Next" suggestions
 * - "Related Nodes" with similarity scores
 * - "Popular Paths" from current position
 * - "Hidden Gems" - underexplored content
 *
 * Features dismissable recommendations with feedback collection.
 */

import React, { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    ArrowRight,
    TrendingUp,
    Gem,
    Compass,
    Clock,
    Users,
    ChevronDown,
    ChevronUp,
    X,
    ThumbsUp,
    ThumbsDown,
    Star,
    Zap,
    PlayCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type {
    Recommendation,
    RecommendationType,
    RecommendationBatch,
    PrerequisiteWarning,
} from "../lib/recommendationEngine";
import type { MapNode } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface RecommendationPanelProps {
    /** Recommendations batch from engine */
    batch: RecommendationBatch | null;
    /** Currently selected node */
    selectedNode: MapNode | null;
    /** Whether the panel is loading */
    loading?: boolean;
    /** Callback when a recommendation is clicked */
    onRecommendationClick: (recommendation: Recommendation) => void;
    /** Callback when a recommendation is dismissed */
    onDismiss: (recommendationId: string) => void;
    /** Callback when feedback is given */
    onFeedback: (recommendationId: string, feedback: "helpful" | "not-helpful") => void;
    /** Callback to navigate to a node */
    onNavigateToNode: (nodeId: string) => void;
    /** Additional class name */
    className?: string;
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const TYPE_ICONS: Record<RecommendationType, typeof Sparkles> = {
    "up-next": ArrowRight,
    related: Star,
    prerequisite: Zap,
    popular: TrendingUp,
    "hidden-gem": Gem,
    continue: PlayCircle,
    explore: Compass,
};

const TYPE_COLORS: Record<RecommendationType, string> = {
    "up-next": "text-[var(--ember)] bg-[var(--ember)]/10 border-[var(--ember)]/30",
    related: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    prerequisite: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    popular: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    "hidden-gem": "text-purple-400 bg-purple-500/10 border-purple-500/30",
    continue: "text-green-400 bg-green-500/10 border-green-500/30",
    explore: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};

const TYPE_LABELS: Record<RecommendationType, string> = {
    "up-next": "Up Next",
    related: "Related",
    prerequisite: "Prerequisite",
    popular: "Popular Path",
    "hidden-gem": "Hidden Gem",
    continue: "Continue",
    explore: "Explore",
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RecommendationPanel: React.FC<RecommendationPanelProps> = memo(
    function RecommendationPanel({
        batch,
        selectedNode,
        loading = false,
        onRecommendationClick,
        onDismiss,
        onFeedback,
        onNavigateToNode,
        className,
    }) {
        const [expandedSection, setExpandedSection] = useState<string | null>("up-next");
        const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

        const handleFeedback = useCallback(
            (id: string, feedback: "helpful" | "not-helpful") => {
                onFeedback(id, feedback);
                setFeedbackGiven((prev) => new Set(prev).add(id));
            },
            [onFeedback]
        );

        // Loading state
        if (loading) {
            return (
                <div className={cn("p-4 space-y-4", className)}>
                    <SkeletonRecommendation />
                    <SkeletonRecommendation />
                    <SkeletonRecommendation />
                </div>
            );
        }

        // Empty state
        if (!batch || batch.recommendations.length === 0) {
            return (
                <div className={cn("p-6 text-center", className)}>
                    <Sparkles
                        size={32}
                        className="mx-auto mb-3 text-[var(--forge-text-muted)]"
                    />
                    <p className="text-sm text-[var(--forge-text-secondary)]">
                        {selectedNode
                            ? "No recommendations available for this node"
                            : "Select a node to see recommendations"}
                    </p>
                </div>
            );
        }

        // Group recommendations for display
        const upNext = batch.upNext;
        const continueRecs = batch.byType.continue || [];
        const relatedRecs = batch.byType.related || [];
        const popularRecs = batch.byType.popular || [];
        const hiddenGems = batch.hiddenGems || [];
        const exploreRecs = batch.byType.explore || [];

        return (
            <div className={cn("space-y-4", className)}>
                {/* Continue learning (highest priority) */}
                {continueRecs.length > 0 && (
                    <RecommendationSection
                        title="Continue Learning"
                        icon={PlayCircle}
                        recommendations={continueRecs}
                        expanded={expandedSection === "continue"}
                        onToggle={() =>
                            setExpandedSection((s) => (s === "continue" ? null : "continue"))
                        }
                        onRecommendationClick={onRecommendationClick}
                        onDismiss={onDismiss}
                        onFeedback={handleFeedback}
                        feedbackGiven={feedbackGiven}
                        accentColor="green"
                    />
                )}

                {/* Up Next (primary recommendation) */}
                {upNext && (
                    <FeaturedRecommendation
                        recommendation={upNext}
                        onClick={() => onRecommendationClick(upNext)}
                        onDismiss={() => onDismiss(upNext.id)}
                        onFeedback={(f) => handleFeedback(upNext.id, f)}
                        feedbackGiven={feedbackGiven.has(upNext.id)}
                    />
                )}

                {/* Popular paths */}
                {popularRecs.length > 0 && (
                    <RecommendationSection
                        title="Popular Paths"
                        icon={TrendingUp}
                        recommendations={popularRecs}
                        expanded={expandedSection === "popular"}
                        onToggle={() =>
                            setExpandedSection((s) => (s === "popular" ? null : "popular"))
                        }
                        onRecommendationClick={onRecommendationClick}
                        onDismiss={onDismiss}
                        onFeedback={handleFeedback}
                        feedbackGiven={feedbackGiven}
                        accentColor="cyan"
                    />
                )}

                {/* Related content */}
                {relatedRecs.length > 0 && (
                    <RecommendationSection
                        title="Related Content"
                        icon={Star}
                        recommendations={relatedRecs}
                        expanded={expandedSection === "related"}
                        onToggle={() =>
                            setExpandedSection((s) => (s === "related" ? null : "related"))
                        }
                        onRecommendationClick={onRecommendationClick}
                        onDismiss={onDismiss}
                        onFeedback={handleFeedback}
                        feedbackGiven={feedbackGiven}
                        accentColor="indigo"
                        showSimilarity
                    />
                )}

                {/* Hidden gems */}
                {hiddenGems.length > 0 && (
                    <RecommendationSection
                        title="Hidden Gems"
                        icon={Gem}
                        recommendations={hiddenGems}
                        expanded={expandedSection === "hidden-gem"}
                        onToggle={() =>
                            setExpandedSection((s) =>
                                s === "hidden-gem" ? null : "hidden-gem"
                            )
                        }
                        onRecommendationClick={onRecommendationClick}
                        onDismiss={onDismiss}
                        onFeedback={handleFeedback}
                        feedbackGiven={feedbackGiven}
                        accentColor="purple"
                    />
                )}

                {/* Explore other domains */}
                {exploreRecs.length > 0 && (
                    <RecommendationSection
                        title="Expand Your Horizons"
                        icon={Compass}
                        recommendations={exploreRecs}
                        expanded={expandedSection === "explore"}
                        onToggle={() =>
                            setExpandedSection((s) => (s === "explore" ? null : "explore"))
                        }
                        onRecommendationClick={onRecommendationClick}
                        onDismiss={onDismiss}
                        onFeedback={handleFeedback}
                        feedbackGiven={feedbackGiven}
                        accentColor="rose"
                    />
                )}

                {/* Prerequisite warnings */}
                {batch.prerequisiteWarnings.length > 0 && (
                    <PrerequisiteWarningsSection
                        warnings={batch.prerequisiteWarnings}
                        onNavigateToNode={onNavigateToNode}
                    />
                )}
            </div>
        );
    }
);

// ============================================================================
// FEATURED RECOMMENDATION (Up Next)
// ============================================================================

interface FeaturedRecommendationProps {
    recommendation: Recommendation;
    onClick: () => void;
    onDismiss: () => void;
    onFeedback: (feedback: "helpful" | "not-helpful") => void;
    feedbackGiven: boolean;
}

const FeaturedRecommendation: React.FC<FeaturedRecommendationProps> = memo(
    function FeaturedRecommendation({
        recommendation,
        onClick,
        onDismiss,
        onFeedback,
        feedbackGiven,
    }) {
        const Icon = TYPE_ICONS[recommendation.type];

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-xl border border-[var(--ember)]/30 bg-gradient-to-br from-[var(--ember)]/10 to-transparent"
            >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--ember)]/5 via-transparent to-[var(--ember)]/5 animate-pulse" />

                <div className="relative p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-[var(--ember)]/20">
                                <ArrowRight size={14} className="text-[var(--ember)]" />
                            </div>
                            <span className="text-xs font-semibold text-[var(--ember)] uppercase tracking-wide">
                                Up Next
                            </span>
                        </div>
                        {recommendation.dismissable && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDismiss();
                                }}
                                className="p-1 hover:bg-[var(--forge-bg-anvil)] rounded transition-colors"
                            >
                                <X size={14} className="text-[var(--forge-text-muted)]" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <button
                        onClick={onClick}
                        className="w-full text-left group"
                    >
                        <h3 className="text-base font-semibold text-[var(--forge-text-primary)] group-hover:text-[var(--ember)] transition-colors mb-1">
                            {recommendation.node.name}
                        </h3>
                        <p className="text-sm text-[var(--forge-text-secondary)] mb-3">
                            {recommendation.reason}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-[var(--forge-text-muted)]">
                            {recommendation.metadata.estimatedMinutes && (
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatDuration(recommendation.metadata.estimatedMinutes)}
                                </span>
                            )}
                            {recommendation.metadata.successRate && (
                                <span className="flex items-center gap-1">
                                    <TrendingUp size={12} />
                                    {Math.round(recommendation.metadata.successRate * 100)}% success
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Sparkles size={12} />
                                {Math.round(recommendation.confidence * 100)}% match
                            </span>
                        </div>
                    </button>

                    {/* Explanation tooltip */}
                    <div className="mt-3 pt-3 border-t border-[var(--forge-border-subtle)]">
                        <p className="text-xs text-[var(--forge-text-muted)] italic">
                            {recommendation.explanation}
                        </p>

                        {/* Feedback buttons */}
                        {!feedbackGiven && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-[var(--forge-text-muted)]">
                                    Helpful?
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFeedback("helpful");
                                    }}
                                    className="p-1 hover:bg-green-500/20 rounded transition-colors"
                                >
                                    <ThumbsUp size={12} className="text-[var(--forge-text-muted)] hover:text-green-400" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFeedback("not-helpful");
                                    }}
                                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                >
                                    <ThumbsDown size={12} className="text-[var(--forge-text-muted)] hover:text-red-400" />
                                </button>
                            </div>
                        )}
                        {feedbackGiven && (
                            <p className="text-xs text-green-400 mt-2">Thanks for your feedback!</p>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }
);

// ============================================================================
// RECOMMENDATION SECTION
// ============================================================================

interface RecommendationSectionProps {
    title: string;
    icon: typeof Sparkles;
    recommendations: Recommendation[];
    expanded: boolean;
    onToggle: () => void;
    onRecommendationClick: (rec: Recommendation) => void;
    onDismiss: (id: string) => void;
    onFeedback: (id: string, feedback: "helpful" | "not-helpful") => void;
    feedbackGiven: Set<string>;
    accentColor: string;
    showSimilarity?: boolean;
}

const RecommendationSection: React.FC<RecommendationSectionProps> = memo(
    function RecommendationSection({
        title,
        icon: Icon,
        recommendations,
        expanded,
        onToggle,
        onRecommendationClick,
        onDismiss,
        onFeedback,
        feedbackGiven,
        accentColor,
        showSimilarity = false,
    }) {
        return (
            <div className="rounded-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50 overflow-hidden">
                {/* Header */}
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-between p-3 hover:bg-[var(--forge-bg-anvil)] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Icon size={16} className={`text-${accentColor}-400`} />
                        <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                            {title}
                        </span>
                        <span className="text-xs text-[var(--forge-text-muted)] bg-[var(--forge-bg-anvil)] px-1.5 py-0.5 rounded">
                            {recommendations.length}
                        </span>
                    </div>
                    {expanded ? (
                        <ChevronUp size={16} className="text-[var(--forge-text-muted)]" />
                    ) : (
                        <ChevronDown size={16} className="text-[var(--forge-text-muted)]" />
                    )}
                </button>

                {/* Content */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="p-2 pt-0 space-y-1">
                                {recommendations.map((rec) => (
                                    <RecommendationCard
                                        key={rec.id}
                                        recommendation={rec}
                                        onClick={() => onRecommendationClick(rec)}
                                        onDismiss={() => onDismiss(rec.id)}
                                        onFeedback={(f) => onFeedback(rec.id, f)}
                                        feedbackGiven={feedbackGiven.has(rec.id)}
                                        showSimilarity={showSimilarity}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

// ============================================================================
// RECOMMENDATION CARD
// ============================================================================

interface RecommendationCardProps {
    recommendation: Recommendation;
    onClick: () => void;
    onDismiss: () => void;
    onFeedback: (feedback: "helpful" | "not-helpful") => void;
    feedbackGiven: boolean;
    showSimilarity?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = memo(
    function RecommendationCard({
        recommendation,
        onClick,
        onDismiss,
        onFeedback,
        feedbackGiven,
        showSimilarity = false,
    }) {
        const [showDetails, setShowDetails] = useState(false);
        const Icon = TYPE_ICONS[recommendation.type];
        const colorClass = TYPE_COLORS[recommendation.type];

        return (
            <div className="rounded-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-primary)] overflow-hidden">
                <button
                    onClick={onClick}
                    className="w-full p-3 text-left hover:bg-[var(--forge-bg-anvil)]/50 transition-colors"
                >
                    <div className="flex items-start gap-3">
                        {/* Type badge */}
                        <div className={cn("p-1.5 rounded-lg border", colorClass)}>
                            <Icon size={12} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-medium text-[var(--forge-text-primary)] truncate">
                                    {recommendation.node.name}
                                </h4>
                                {showSimilarity && recommendation.metadata.similarityScore && (
                                    <span className="text-xs text-[var(--forge-text-muted)] whitespace-nowrap">
                                        {Math.round(recommendation.metadata.similarityScore * 100)}% match
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[var(--forge-text-secondary)] mt-0.5">
                                {recommendation.reason}
                            </p>

                            {/* Metadata row */}
                            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--forge-text-muted)]">
                                {recommendation.metadata.estimatedMinutes && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={10} />
                                        {formatDuration(recommendation.metadata.estimatedMinutes)}
                                    </span>
                                )}
                                {recommendation.metadata.pathFrequency && (
                                    <span className="flex items-center gap-1">
                                        <Users size={10} />
                                        {recommendation.metadata.pathFrequency} learners
                                    </span>
                                )}
                                {recommendation.metadata.relevantSkills &&
                                    recommendation.metadata.relevantSkills.length > 0 && (
                                        <span className="truncate">
                                            {recommendation.metadata.relevantSkills.slice(0, 2).join(", ")}
                                        </span>
                                    )}
                            </div>
                        </div>

                        {/* Dismiss button */}
                        {recommendation.dismissable && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDismiss();
                                }}
                                className="p-1 hover:bg-[var(--forge-bg-anvil)] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} className="text-[var(--forge-text-muted)]" />
                            </button>
                        )}
                    </div>
                </button>

                {/* Expandable details */}
                {showDetails && (
                    <div className="px-3 pb-3 pt-0 border-t border-[var(--forge-border-subtle)]">
                        <p className="text-xs text-[var(--forge-text-muted)] italic mt-2">
                            {recommendation.explanation}
                        </p>

                        {/* Feedback */}
                        {!feedbackGiven && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-[var(--forge-text-muted)]">
                                    Was this helpful?
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFeedback("helpful");
                                    }}
                                    className="p-1 hover:bg-green-500/20 rounded"
                                >
                                    <ThumbsUp size={12} className="text-[var(--forge-text-muted)]" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFeedback("not-helpful");
                                    }}
                                    className="p-1 hover:bg-red-500/20 rounded"
                                >
                                    <ThumbsDown size={12} className="text-[var(--forge-text-muted)]" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

// ============================================================================
// PREREQUISITE WARNINGS SECTION
// ============================================================================

interface PrerequisiteWarningsSectionProps {
    warnings: PrerequisiteWarning[];
    onNavigateToNode: (nodeId: string) => void;
}

const PrerequisiteWarningsSection: React.FC<PrerequisiteWarningsSectionProps> = memo(
    function PrerequisiteWarningsSection({ warnings, onNavigateToNode }) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <Zap size={14} className="text-amber-400" />
                    <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
                        Prerequisite Gaps
                    </span>
                </div>

                {warnings.map((warning, index) => (
                    <div
                        key={`warning-${index}`}
                        className={cn(
                            "rounded-lg border p-3",
                            warning.severity > 0.7
                                ? "border-red-500/30 bg-red-500/10"
                                : warning.severity > 0.4
                                ? "border-amber-500/30 bg-amber-500/10"
                                : "border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50"
                        )}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                                {warning.targetNode.name}
                            </span>
                            <span
                                className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    warning.action === "stop"
                                        ? "bg-red-500/20 text-red-400"
                                        : warning.action === "review"
                                        ? "bg-amber-500/20 text-amber-400"
                                        : "bg-green-500/20 text-green-400"
                                )}
                            >
                                {warning.action === "stop"
                                    ? "Complete first"
                                    : warning.action === "review"
                                    ? "Recommended"
                                    : "Optional"}
                            </span>
                        </div>

                        <p className="text-xs text-[var(--forge-text-secondary)] mb-2">
                            Missing {warning.missingPrerequisites.length} prerequisite
                            {warning.missingPrerequisites.length > 1 ? "s" : ""}:
                        </p>

                        <div className="space-y-1">
                            {warning.missingPrerequisites.slice(0, 3).map((prereq, i) => (
                                <button
                                    key={`prereq-${i}`}
                                    onClick={() => onNavigateToNode(prereq.node.id)}
                                    className="w-full flex items-center justify-between p-2 text-left text-sm bg-[var(--forge-bg-primary)] hover:bg-[var(--forge-bg-anvil)] rounded transition-colors"
                                >
                                    <span className="text-[var(--forge-text-primary)]">
                                        {prereq.node.name}
                                    </span>
                                    <ArrowRight
                                        size={12}
                                        className="text-[var(--forge-text-muted)]"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
);

// ============================================================================
// SKELETON LOADER
// ============================================================================

const SkeletonRecommendation: React.FC = () => (
    <div className="rounded-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50 p-4 animate-pulse">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--forge-bg-anvil)]" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-[var(--forge-bg-anvil)] rounded" />
                <div className="h-3 w-1/2 bg-[var(--forge-bg-anvil)] rounded" />
            </div>
        </div>
    </div>
);

// ============================================================================
// HELPERS
// ============================================================================

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export default RecommendationPanel;
