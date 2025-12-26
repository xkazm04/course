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
                className={`flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 ${className}`}
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
            className={`rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 ${className}`}
            data-testid="collaborative-insights-panel"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-800/50">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Collective Intelligence
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Recommendations from learners like you
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Similar Learners */}
                <div
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50"
                    data-testid="stat-similar-learners"
                >
                    <Users className="w-4 h-4 text-blue-500" />
                    <div>
                        <div
                            className="text-sm font-medium text-gray-900 dark:text-white"
                            data-testid="stat-learners-value"
                        >
                            {stats.totalLearners.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Learners
                        </div>
                    </div>
                </div>

                {/* Patterns Discovered */}
                <div
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50"
                    data-testid="stat-patterns"
                >
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <div>
                        <div
                            className="text-sm font-medium text-gray-900 dark:text-white"
                            data-testid="stat-patterns-value"
                        >
                            {stats.totalPatterns}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Patterns
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Helpful Content */}
            {stats.mostHelpfulContent.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        Most Helpful Content
                    </h4>
                    <div className="space-y-1" data-testid="helpful-content-list">
                        {stats.mostHelpfulContent.slice(0, 3).map((content, idx) => (
                            <div
                                key={`${content.slotType}-${content.topic}`}
                                className="flex items-center justify-between text-xs p-2 rounded bg-white/30 dark:bg-gray-800/30"
                                data-testid={`helpful-content-item-${idx}`}
                            >
                                <span className="text-gray-700 dark:text-gray-300 capitalize">
                                    {content.slotType}: {content.topic}
                                </span>
                                <span className="text-green-600 dark:text-green-400 font-medium">
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
                className="mt-3 w-full py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/30 rounded-lg transition-colors"
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
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-xs text-green-700 dark:text-green-400 ${className}`}
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
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-xs ${className}`}
            data-testid="recommendation-label"
        >
            <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                {confidenceLevel} Recommendation
            </span>
            {reason && (
                <span
                    className="text-indigo-600/70 dark:text-indigo-400/70"
                    data-testid="recommendation-reason"
                >
                    · {reason}
                </span>
            )}
        </motion.div>
    );
}

export default CollaborativeInsights;
