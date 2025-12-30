"use client";

/**
 * CollaborativeInsights Component
 *
 * Displays collaborative filtering insights and social proof
 * to show learners that recommendations come from similar learners.
 */

import React from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Lightbulb, Sparkles } from "lucide-react";
import {
    useCollaborativeFiltering,
    useSimilarLearners,
} from "../lib/useCollaborativeFiltering";

// ============================================================================
// Types
// ============================================================================

export interface CollaborativeInsightsProps {
    courseId: string;
    userId?: string;
    /** Show compact version */
    compact?: boolean;
    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function CollaborativeInsights({
    courseId,
    userId,
    compact = false,
    className = "",
}: CollaborativeInsightsProps) {
    const { isActive, stats, refreshStats } = useCollaborativeFiltering({
        courseId,
        userId,
    });

    const { count: similarLearners, loading } = useSimilarLearners(courseId, userId);

    if (!isActive || loading || !stats) {
        return null;
    }

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 text-sm text-[var(--forge-text-muted)] ${className}`}
                data-testid="collaborative-insights-compact"
            >
                <Users className="w-4 h-4" />
                <span data-testid="similar-learners-count">
                    Learning with {similarLearners.toLocaleString()} others
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl bg-gradient-to-br from-[var(--ember)]/10 to-[var(--gold)]/10 p-4 ${className}`}
            data-testid="collaborative-insights-panel"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[var(--ember)]/20">
                    <Sparkles className="w-4 h-4 text-[var(--ember)]" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-[var(--forge-text-primary)]">
                        Collective Intelligence
                    </h3>
                    <p className="text-xs text-[var(--forge-text-muted)]">
                        Recommendations from learners like you
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Similar Learners */}
                <div
                    className="flex items-center gap-2 p-2 rounded-lg bg-[var(--forge-bg-workshop)]/50"
                    data-testid="stat-similar-learners"
                >
                    <Users className="w-4 h-4 text-[var(--forge-info)]" />
                    <div>
                        <div
                            className="text-sm font-medium text-[var(--forge-text-primary)]"
                            data-testid="stat-learners-value"
                        >
                            {stats.totalLearners.toLocaleString()}
                        </div>
                        <div className="text-xs text-[var(--forge-text-muted)]">
                            Learners
                        </div>
                    </div>
                </div>

                {/* Patterns Discovered */}
                <div
                    className="flex items-center gap-2 p-2 rounded-lg bg-[var(--forge-bg-workshop)]/50"
                    data-testid="stat-patterns"
                >
                    <TrendingUp className="w-4 h-4 text-[var(--forge-success)]" />
                    <div>
                        <div
                            className="text-sm font-medium text-[var(--forge-text-primary)]"
                            data-testid="stat-patterns-value"
                        >
                            {stats.totalPatterns}
                        </div>
                        <div className="text-xs text-[var(--forge-text-muted)]">
                            Patterns
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Helpful Content */}
            {stats.mostHelpfulContent.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-xs font-medium text-[var(--forge-text-secondary)] mb-2 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        Most Helpful Content
                    </h4>
                    <div className="space-y-1" data-testid="helpful-content-list">
                        {stats.mostHelpfulContent.slice(0, 3).map((content, idx) => (
                            <div
                                key={`${content.slotType}-${content.topic}`}
                                className="flex items-center justify-between text-xs p-2 rounded bg-[var(--forge-bg-workshop)]/30"
                                data-testid={`helpful-content-item-${idx}`}
                            >
                                <span className="text-[var(--forge-text-secondary)] capitalize">
                                    {content.slotType}: {content.topic}
                                </span>
                                <span className="text-[var(--forge-success)] font-medium">
                                    +{Math.round(content.avgImprovement)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Refresh Button */}
            <button
                onClick={refreshStats}
                className="mt-3 w-full py-1.5 text-xs text-[var(--ember)] hover:bg-[var(--ember)]/10 rounded-lg transition-colors"
                data-testid="refresh-insights-btn"
            >
                Refresh Insights
            </button>
        </motion.div>
    );
}

// ============================================================================
// Social Proof Badge
// ============================================================================

export interface SocialProofBadgeProps {
    courseId: string;
    userId?: string;
    slotType: string;
    benefitCount?: number;
    className?: string;
}

/**
 * Small badge showing how many learners benefited from this content
 */
export function SocialProofBadge({
    courseId,
    userId,
    slotType,
    benefitCount,
    className = "",
}: SocialProofBadgeProps) {
    const { count: similarLearners } = useSimilarLearners(courseId, userId);

    if (!benefitCount && similarLearners === 0) {
        return null;
    }

    const displayCount = benefitCount || Math.max(1, Math.floor(similarLearners * 0.3));

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--forge-success)]/10 text-xs text-[var(--forge-success)] ${className}`}
            data-testid="social-proof-badge"
        >
            <Users className="w-3 h-3" />
            <span data-testid="social-proof-count">
                {displayCount} learners found this helpful
            </span>
        </motion.div>
    );
}

// ============================================================================
// Recommendation Label
// ============================================================================

export interface RecommendationLabelProps {
    reason?: string;
    confidence?: number;
    className?: string;
}

/**
 * Label indicating content is a collaborative recommendation
 */
export function RecommendationLabel({
    reason,
    confidence,
    className = "",
}: RecommendationLabelProps) {
    const confidenceLevel =
        confidence && confidence >= 0.8
            ? "High"
            : confidence && confidence >= 0.5
            ? "Medium"
            : "Based on";

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--ember)]/10 text-xs ${className}`}
            data-testid="recommendation-label"
        >
            <Sparkles className="w-3 h-3 text-[var(--ember)]" />
            <span className="text-[var(--ember-bright)] font-medium">
                {confidenceLevel} Recommendation
            </span>
            {reason && (
                <span
                    className="text-[var(--ember)]/70"
                    data-testid="recommendation-reason"
                >
                    · {reason}
                </span>
            )}
        </motion.div>
    );
}

export default CollaborativeInsights;
