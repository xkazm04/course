"use client";

/**
 * Path Comparison Panel
 *
 * Minimalistic comparison panel that appears when 2+ paths are selected.
 * Shows dimension bars, overall scores, and recommendations.
 */

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Users, Layers, TrendingUp, Sparkles, Check } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { CommunityPath } from "../../lib/communityPathsTypes";

interface PathComparisonPanelProps {
    selectedPaths: CommunityPath[];
    onClearSelection: () => void;
    className?: string;
}

interface ComparisonScore {
    path: CommunityPath;
    overallScore: number;
    dimensions: {
        time: { value: number; normalized: number };
        content: { value: number; normalized: number };
        popularity: { value: number; normalized: number };
    };
}

/**
 * Calculate comparison scores for selected paths
 */
function calculateComparison(paths: CommunityPath[]): ComparisonScore[] {
    if (paths.length < 2) return [];

    // Find min/max for normalization
    const hours = paths.map((p) => p.estimatedHours);
    const chapters = paths.map((p) => p.chapterCount);
    const enrollments = paths.map((p) => p.enrollmentCount);

    const maxHours = Math.max(...hours);
    const minHours = Math.min(...hours);
    const maxChapters = Math.max(...chapters);
    const minChapters = Math.min(...chapters);
    const maxEnrollments = Math.max(...enrollments);
    const minEnrollments = Math.min(...enrollments);

    return paths.map((path) => {
        // Normalize values to 0-100 scale
        // Time: lower is better (invert)
        const timeNorm =
            maxHours === minHours
                ? 50
                : 100 - ((path.estimatedHours - minHours) / (maxHours - minHours)) * 100;

        // Content depth: more chapters is better
        const contentNorm =
            maxChapters === minChapters
                ? 50
                : ((path.chapterCount - minChapters) / (maxChapters - minChapters)) * 100;

        // Popularity: more enrollments is better
        const popularityNorm =
            maxEnrollments === minEnrollments
                ? 50
                : ((path.enrollmentCount - minEnrollments) / (maxEnrollments - minEnrollments)) * 100;

        // Overall score with weighted average
        const overallScore = Math.round(timeNorm * 0.3 + contentNorm * 0.35 + popularityNorm * 0.35);

        return {
            path,
            overallScore,
            dimensions: {
                time: { value: path.estimatedHours, normalized: timeNorm },
                content: { value: path.chapterCount, normalized: contentNorm },
                popularity: { value: path.enrollmentCount, normalized: popularityNorm },
            },
        };
    });
}

/**
 * Get recommendation text based on comparison
 */
function getRecommendation(scores: ComparisonScore[]): string {
    if (scores.length < 2) return "";

    const sorted = [...scores].sort((a, b) => b.overallScore - a.overallScore);
    const best = sorted[0];
    const diff = best.overallScore - sorted[1].overallScore;

    if (diff > 20) {
        return `${best.path.title} is the clear winner with strong scores across all dimensions.`;
    } else if (diff > 10) {
        return `${best.path.title} edges ahead with better overall balance.`;
    } else {
        return "These paths are closely matched. Consider your specific goals and time availability.";
    }
}

/**
 * Calculate combined stats for all selected paths
 */
function getCombinedStats(paths: CommunityPath[]): {
    totalHours: number;
    totalChapters: number;
    estimatedSavings: number;
} {
    const totalHours = paths.reduce((sum, p) => sum + p.estimatedHours, 0);
    const totalChapters = paths.reduce((sum, p) => sum + p.chapterCount, 0);

    // Estimate 10-20% savings from domain overlap
    const domains = new Set(paths.map((p) => p.domain));
    const overlapFactor = domains.size < paths.length ? 0.15 : 0.05;
    const estimatedSavings = Math.round(totalHours * overlapFactor);

    return { totalHours, totalChapters, estimatedSavings };
}

export function PathComparisonPanel({
    selectedPaths,
    onClearSelection,
    className = "",
}: PathComparisonPanelProps) {
    const scores = useMemo(() => calculateComparison(selectedPaths), [selectedPaths]);
    const recommendation = useMemo(() => getRecommendation(scores), [scores]);
    const combinedStats = useMemo(() => getCombinedStats(selectedPaths), [selectedPaths]);

    // Sort by score for display
    const sortedScores = useMemo(
        () => [...scores].sort((a, b) => b.overallScore - a.overallScore),
        [scores]
    );

    if (selectedPaths.length < 2) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className={cn(
                    "mb-4 rounded-xl border border-[var(--ember)]/30 bg-gradient-to-r from-[var(--ember)]/5 to-[var(--gold)]/5 backdrop-blur-sm overflow-hidden",
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--forge-border-subtle)]">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-[var(--ember)]" />
                        <span className="text-sm font-semibold text-[var(--forge-text-primary)]">
                            Compare Paths
                        </span>
                        <span className="text-xs text-[var(--forge-text-muted)]">
                            ({selectedPaths.length} selected)
                        </span>
                    </div>
                    <button
                        onClick={onClearSelection}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-elevated)] rounded transition-colors"
                    >
                        <X size={14} />
                        Clear
                    </button>
                </div>

                {/* Comparison Content */}
                <div className="p-4">
                    {/* Path Scores */}
                    <div className="space-y-3 mb-4">
                        {sortedScores.map((score, index) => (
                            <div key={score.path.id} className="flex items-center gap-3">
                                {/* Rank indicator */}
                                <div
                                    className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                                        index === 0
                                            ? "bg-[var(--ember)]/20 text-[var(--ember)] border border-[var(--ember)]/30"
                                            : "bg-[var(--forge-bg-bench)] text-[var(--forge-text-muted)]"
                                    )}
                                >
                                    {index === 0 ? <Check size={12} /> : index + 1}
                                </div>

                                {/* Path name */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-[var(--forge-text-primary)] truncate">
                                            {score.path.title}
                                        </span>
                                        {score.path.pathType === "ai_generated" && (
                                            <Sparkles size={10} className="text-[var(--gold)] flex-shrink-0" />
                                        )}
                                    </div>
                                </div>

                                {/* Score bar */}
                                <div className="w-24 flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-[var(--forge-bg-bench)] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${score.overallScore}%` }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            className={cn(
                                                "h-full rounded-full",
                                                index === 0
                                                    ? "bg-gradient-to-r from-[var(--ember)] to-[var(--gold)]"
                                                    : "bg-[var(--forge-text-muted)]"
                                            )}
                                        />
                                    </div>
                                    <span
                                        className={cn(
                                            "text-xs font-medium w-8 text-right",
                                            index === 0
                                                ? "text-[var(--ember)]"
                                                : "text-[var(--forge-text-secondary)]"
                                        )}
                                    >
                                        {score.overallScore}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 py-3 border-t border-b border-[var(--forge-border-subtle)] text-xs">
                        <div className="flex items-center gap-1.5 text-[var(--forge-text-muted)]">
                            <Clock size={12} />
                            <span>
                                Total:{" "}
                                <span className="text-[var(--forge-text-secondary)] font-medium">
                                    {combinedStats.totalHours}h
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--forge-text-muted)]">
                            <Layers size={12} />
                            <span>
                                Chapters:{" "}
                                <span className="text-[var(--forge-text-secondary)] font-medium">
                                    {combinedStats.totalChapters}
                                </span>
                            </span>
                        </div>
                        {combinedStats.estimatedSavings > 0 && (
                            <div className="flex items-center gap-1.5 text-[var(--forge-success)]">
                                <TrendingUp size={12} />
                                <span>~{combinedStats.estimatedSavings}h saved with overlap</span>
                            </div>
                        )}
                    </div>

                    {/* Recommendation */}
                    {recommendation && (
                        <p className="mt-3 text-xs text-[var(--forge-text-muted)] leading-relaxed">
                            {recommendation}
                        </p>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
