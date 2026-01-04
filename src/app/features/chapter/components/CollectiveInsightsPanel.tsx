"use client";

/**
 * CollectiveInsightsPanel Component
 *
 * Displays insights derived from collective learner behavior including:
 * - Implicit prerequisites discovered from learning patterns
 * - Struggle points identified from common issues
 * - Optimal paths discovered from successful learners
 */

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    TrendingUp,
    AlertCircle,
    Lightbulb,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Sparkles,
    BarChart3,
    GitBranch,
    Target,
    Zap,
    Info,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type {
    ImplicitPrerequisite,
    StrugglePoint,
    OptimalPath,
    EmergentCurriculum,
} from "../lib/collectiveIntelligence/types";

// ============================================================================
// TYPES
// ============================================================================

export interface CollectiveInsightsPanelProps {
    /** The emergent curriculum data */
    curriculum: EmergentCurriculum | null;

    /** Current chapter ID for context-specific insights */
    chapterId?: string;

    /** Whether to show compact mode */
    compact?: boolean;

    /** Callback when user clicks to navigate to a chapter */
    onNavigateToChapter?: (chapterId: string) => void;

    /** Callback when user selects an optimal path */
    onSelectPath?: (path: OptimalPath) => void;

    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CollectiveInsightsPanel({
    curriculum,
    chapterId,
    compact = false,
    onNavigateToChapter,
    onSelectPath,
    className,
}: CollectiveInsightsPanelProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    // Filter data for current chapter if provided
    const chapterPrerequisites = useMemo(() => {
        if (!curriculum || !chapterId) return [];
        return curriculum.implicitPrerequisites.filter(
            (p) => p.dependentChapterId === chapterId
        );
    }, [curriculum, chapterId]);

    const chapterStrugglePoints = useMemo(() => {
        if (!curriculum || !chapterId) return [];
        return curriculum.strugglePoints.filter((s) => s.chapterId === chapterId);
    }, [curriculum, chapterId]);

    const relevantPaths = useMemo(() => {
        if (!curriculum || !chapterId) return curriculum?.optimalPaths ?? [];
        return curriculum.optimalPaths.filter((p) =>
            p.chapterSequence.includes(chapterId)
        );
    }, [curriculum, chapterId]);

    if (!curriculum) {
        return (
            <div
                className={cn(
                    "bg-[var(--forge-bg-workshop)] rounded-xl p-4 border border-[var(--forge-border-subtle)]",
                    className
                )}
                data-testid="collective-insights-loading"
            >
                <div className="flex items-center gap-2 text-[var(--forge-text-muted)]">
                    <div className="animate-pulse">
                        <Users className="h-5 w-5" />
                    </div>
                    <span className="text-sm">Loading collective insights...</span>
                </div>
            </div>
        );
    }

    if (compact) {
        return (
            <CompactInsightsView
                curriculum={curriculum}
                chapterPrerequisites={chapterPrerequisites}
                chapterStrugglePoints={chapterStrugglePoints}
                onNavigateToChapter={onNavigateToChapter}
                className={className}
            />
        );
    }

    return (
        <div
            className={cn(
                "bg-[var(--forge-bg-workshop)] rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden",
                className
            )}
            data-testid="collective-insights-panel"
        >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-[var(--forge-bg-elevated)] to-[var(--forge-bg-workshop)] border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[var(--forge-primary)]/10 rounded-lg">
                        <Sparkles className="h-4 w-4 text-[var(--forge-primary)]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--forge-text-primary)]">
                            Collective Intelligence
                        </h3>
                        <p className="text-xs text-[var(--forge-text-muted)]">
                            Insights from {curriculum.healthMetrics.totalLearners} learners
                        </p>
                    </div>
                </div>
            </div>

            {/* Health Summary */}
            <HealthMetricsSummary metrics={curriculum.healthMetrics} />

            {/* Collapsible Sections */}
            <div className="divide-y divide-[var(--forge-border-subtle)]">
                {/* Implicit Prerequisites */}
                {chapterPrerequisites.length > 0 && (
                    <CollapsibleSection
                        title="Discovered Prerequisites"
                        subtitle={`${chapterPrerequisites.length} relationships found`}
                        icon={GitBranch}
                        iconColor="text-[var(--forge-info)]"
                        isExpanded={expandedSection === "prerequisites"}
                        onToggle={() =>
                            setExpandedSection(
                                expandedSection === "prerequisites" ? null : "prerequisites"
                            )
                        }
                    >
                        <PrerequisitesList
                            prerequisites={chapterPrerequisites}
                            onNavigate={onNavigateToChapter}
                        />
                    </CollapsibleSection>
                )}

                {/* Struggle Points */}
                {chapterStrugglePoints.length > 0 && (
                    <CollapsibleSection
                        title="Common Struggle Points"
                        subtitle={`${chapterStrugglePoints.length} areas identified`}
                        icon={AlertCircle}
                        iconColor="text-[var(--forge-warning)]"
                        isExpanded={expandedSection === "struggles"}
                        onToggle={() =>
                            setExpandedSection(
                                expandedSection === "struggles" ? null : "struggles"
                            )
                        }
                    >
                        <StrugglePointsList points={chapterStrugglePoints} />
                    </CollapsibleSection>
                )}

                {/* Optimal Paths */}
                {relevantPaths.length > 0 && (
                    <CollapsibleSection
                        title="Optimal Learning Paths"
                        subtitle={`${relevantPaths.length} successful patterns`}
                        icon={TrendingUp}
                        iconColor="text-[var(--forge-success)]"
                        isExpanded={expandedSection === "paths"}
                        onToggle={() =>
                            setExpandedSection(expandedSection === "paths" ? null : "paths")
                        }
                    >
                        <OptimalPathsList
                            paths={relevantPaths.slice(0, 3)}
                            onSelectPath={onSelectPath}
                        />
                    </CollapsibleSection>
                )}

                {/* Recommendations */}
                {curriculum.recommendations.length > 0 && (
                    <CollapsibleSection
                        title="Curriculum Insights"
                        subtitle={`${curriculum.recommendations.length} suggestions`}
                        icon={Lightbulb}
                        iconColor="text-[var(--ember)]"
                        isExpanded={expandedSection === "recommendations"}
                        onToggle={() =>
                            setExpandedSection(
                                expandedSection === "recommendations" ? null : "recommendations"
                            )
                        }
                    >
                        <RecommendationsList
                            recommendations={curriculum.recommendations.slice(0, 5)}
                        />
                    </CollapsibleSection>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CompactInsightsViewProps {
    curriculum: EmergentCurriculum;
    chapterPrerequisites: ImplicitPrerequisite[];
    chapterStrugglePoints: StrugglePoint[];
    onNavigateToChapter?: (chapterId: string) => void;
    className?: string;
}

function CompactInsightsView({
    curriculum,
    chapterPrerequisites,
    chapterStrugglePoints,
    onNavigateToChapter,
    className,
}: CompactInsightsViewProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-3 px-3 py-2 bg-[var(--forge-bg-elevated)] rounded-lg",
                className
            )}
            data-testid="collective-insights-compact"
        >
            <Users className="h-4 w-4 text-[var(--forge-primary)]" />
            <span className="text-xs text-[var(--forge-text-muted)]">
                Based on {curriculum.healthMetrics.totalLearners} learners
            </span>

            {chapterPrerequisites.length > 0 && (
                <div className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3 text-[var(--forge-info)]" />
                    <span className="text-xs text-[var(--forge-info)]">
                        {chapterPrerequisites.length} prereq
                    </span>
                </div>
            )}

            {chapterStrugglePoints.length > 0 && (
                <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-[var(--forge-warning)]" />
                    <span className="text-xs text-[var(--forge-warning)]">
                        {chapterStrugglePoints.length} struggle{chapterStrugglePoints.length > 1 ? "s" : ""}
                    </span>
                </div>
            )}
        </div>
    );
}

interface HealthMetricsSummaryProps {
    metrics: EmergentCurriculum["healthMetrics"];
}

function HealthMetricsSummary({ metrics }: HealthMetricsSummaryProps) {
    return (
        <div className="grid grid-cols-4 gap-2 p-3 bg-[var(--forge-bg-elevated)]/50">
            <MetricBadge
                label="Learners"
                value={metrics.totalLearners.toString()}
                icon={Users}
            />
            <MetricBadge
                label="Completion"
                value={`${Math.round(metrics.avgCompletionRate * 100)}%`}
                icon={Target}
                color={
                    metrics.avgCompletionRate > 0.7
                        ? "text-[var(--forge-success)]"
                        : metrics.avgCompletionRate > 0.4
                        ? "text-[var(--forge-warning)]"
                        : "text-[var(--forge-error)]"
                }
            />
            <MetricBadge
                label="Prerequisites"
                value={metrics.prerequisiteCount.toString()}
                icon={GitBranch}
            />
            <MetricBadge
                label="Confidence"
                value={`${Math.round(metrics.overallConfidence * 100)}%`}
                icon={Zap}
            />
        </div>
    );
}

interface MetricBadgeProps {
    label: string;
    value: string;
    icon: React.ElementType;
    color?: string;
}

function MetricBadge({ label, value, icon: Icon, color }: MetricBadgeProps) {
    return (
        <div className="text-center">
            <div className="flex items-center justify-center gap-1">
                <Icon className={cn("h-3 w-3", color || "text-[var(--forge-text-muted)]")} />
                <span className={cn("text-sm font-semibold", color || "text-[var(--forge-text-primary)]")}>
                    {value}
                </span>
            </div>
            <span className="text-[10px] text-[var(--forge-text-muted)]">{label}</span>
        </div>
    );
}

interface CollapsibleSectionProps {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    iconColor: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

function CollapsibleSection({
    title,
    subtitle,
    icon: Icon,
    iconColor,
    isExpanded,
    onToggle,
    children,
}: CollapsibleSectionProps) {
    return (
        <div>
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--forge-bg-elevated)]/50 transition-colors"
                data-testid={`section-toggle-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
                <Icon className={cn("h-4 w-4", iconColor)} />
                <div className="flex-1 text-left">
                    <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                        {title}
                    </span>
                    <span className="ml-2 text-xs text-[var(--forge-text-muted)]">
                        {subtitle}
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[var(--forge-text-muted)]" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--forge-text-muted)]" />
                )}
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface PrerequisitesListProps {
    prerequisites: ImplicitPrerequisite[];
    onNavigate?: (chapterId: string) => void;
}

function PrerequisitesList({ prerequisites, onNavigate }: PrerequisitesListProps) {
    return (
        <div className="space-y-2">
            {prerequisites.map((prereq, index) => (
                <motion.div
                    key={`${prereq.prerequisiteChapterId}-${prereq.dependentChapterId}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-[var(--forge-bg-elevated)] rounded-lg"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            onClick={() => onNavigate?.(prereq.prerequisiteChapterId)}
                            className="text-sm font-medium text-[var(--forge-info)] hover:underline"
                            data-testid={`prereq-${prereq.prerequisiteChapterId}`}
                        >
                            {prereq.prerequisiteChapterId}
                        </button>
                        <ArrowRight className="h-3 w-3 text-[var(--forge-text-muted)]" />
                        <span className="text-sm text-[var(--forge-text-secondary)]">
                            {prereq.dependentChapterId}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--forge-text-muted)]">
                        <span>
                            Confidence:{" "}
                            <span className="text-[var(--forge-text-primary)]">
                                {Math.round(prereq.confidence * 100)}%
                            </span>
                        </span>
                        <span>
                            Success rate improvement:{" "}
                            <span className="text-[var(--forge-success)]">
                                +{Math.round(
                                    (prereq.evidence.successRateWithPrereq -
                                        prereq.evidence.successRateWithoutPrereq) *
                                        100
                                )}%
                            </span>
                        </span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

interface StrugglePointsListProps {
    points: StrugglePoint[];
}

function StrugglePointsList({ points }: StrugglePointsListProps) {
    const getSeverityColor = (severity: number) => {
        if (severity > 0.7) return "text-[var(--forge-error)]";
        if (severity > 0.4) return "text-[var(--forge-warning)]";
        return "text-[var(--forge-text-muted)]";
    };

    return (
        <div className="space-y-2">
            {points.map((point, index) => (
                <motion.div
                    key={`${point.chapterId}-${point.sectionId}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-[var(--forge-bg-elevated)] rounded-lg"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                            {point.sectionId}
                        </span>
                        <span
                            className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full bg-current/10",
                                getSeverityColor(point.severity)
                            )}
                        >
                            {Math.round(point.severity * 100)}% severity
                        </span>
                    </div>
                    <div className="text-xs text-[var(--forge-text-muted)] mb-2">
                        Type: <span className="capitalize">{point.struggleType}</span> ·
                        Affects {Math.round(point.affectedPercentage * 100)}% of learners
                    </div>
                    {point.commonCauses.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {point.commonCauses.slice(0, 2).map((cause, i) => (
                                <span
                                    key={i}
                                    className="text-[10px] px-2 py-0.5 bg-[var(--forge-warning)]/10 text-[var(--forge-warning)] rounded"
                                >
                                    {cause}
                                </span>
                            ))}
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}

interface OptimalPathsListProps {
    paths: OptimalPath[];
    onSelectPath?: (path: OptimalPath) => void;
}

function OptimalPathsList({ paths, onSelectPath }: OptimalPathsListProps) {
    return (
        <div className="space-y-2">
            {paths.map((path, index) => (
                <motion.button
                    key={path.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectPath?.(path)}
                    className="w-full p-3 bg-[var(--forge-bg-elevated)] rounded-lg hover:bg-[var(--forge-success)]/5 transition-colors text-left"
                    data-testid={`optimal-path-${path.id}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-[var(--forge-success)]" />
                            <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                                {path.chapterSequence.length} chapters
                            </span>
                        </div>
                        <span className="text-xs text-[var(--forge-success)]">
                            {Math.round(path.metrics.completionRate * 100)}% success
                        </span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {path.chapterSequence.slice(0, 4).map((chapterId, i) => (
                            <React.Fragment key={chapterId}>
                                <span className="text-xs px-2 py-0.5 bg-[var(--forge-bg-workshop)] rounded whitespace-nowrap">
                                    {chapterId.split(":")[1] || chapterId}
                                </span>
                                {i < Math.min(path.chapterSequence.length - 1, 3) && (
                                    <ArrowRight className="h-3 w-3 text-[var(--forge-text-muted)] flex-shrink-0" />
                                )}
                            </React.Fragment>
                        ))}
                        {path.chapterSequence.length > 4 && (
                            <span className="text-xs text-[var(--forge-text-muted)]">
                                +{path.chapterSequence.length - 4} more
                            </span>
                        )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-[var(--forge-text-muted)]">
                        <span>{path.learnerCount} learners</span>
                        <span>~{Math.round(path.metrics.avgCompletionTimeMinutes)} min</span>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}

interface RecommendationsListProps {
    recommendations: EmergentCurriculum["recommendations"];
}

function RecommendationsList({ recommendations }: RecommendationsListProps) {
    const getTypeIcon = (type: string) => {
        switch (type) {
            case "add_prerequisite":
                return GitBranch;
            case "simplify_content":
            case "split_chapter":
                return Target;
            case "improve_explanation":
                return Info;
            default:
                return Lightbulb;
        }
    };

    return (
        <div className="space-y-2">
            {recommendations.map((rec, index) => {
                const Icon = getTypeIcon(rec.type);
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 bg-[var(--forge-bg-elevated)] rounded-lg"
                    >
                        <div className="flex items-start gap-2">
                            <Icon className="h-4 w-4 text-[var(--ember)] flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-[var(--ember)] capitalize">
                                        {rec.type.replace(/_/g, " ")}
                                    </span>
                                    <span className="text-[10px] text-[var(--forge-text-muted)]">
                                        Priority: {rec.priority}/10
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--forge-text-secondary)] mb-1">
                                    {rec.description}
                                </p>
                                <p className="text-xs text-[var(--forge-text-muted)]">
                                    Impact: {rec.expectedImpact}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CollectiveInsightsPanel;
