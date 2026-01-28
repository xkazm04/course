"use client";

/**
 * UpNextCard Component
 *
 * A prominent card displaying the recommended next step in the learning journey.
 * Shows the top "Up Next" recommendation with clear call-to-action.
 *
 * Features:
 * - Visual prominence with gradient/glow effects
 * - Confidence indicator
 * - Estimated time to complete
 * - Explanation of why this is recommended
 * - Dismissable with feedback option
 */

import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    Clock,
    Sparkles,
    TrendingUp,
    X,
    ThumbsUp,
    ThumbsDown,
    ChevronRight,
    Play,
    Zap,
    Target,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { Recommendation } from "../lib/recommendationEngine";
import type { MapNode } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface UpNextCardProps {
    /** The recommendation to display */
    recommendation: Recommendation | null;
    /** Whether the card is in compact mode */
    compact?: boolean;
    /** Loading state */
    loading?: boolean;
    /** Called when the card is clicked */
    onClick: () => void;
    /** Called when dismissed */
    onDismiss?: () => void;
    /** Called when feedback is given */
    onFeedback?: (feedback: "helpful" | "not-helpful") => void;
    /** Additional class names */
    className?: string;
}

interface UpNextMinimalProps {
    /** The recommendation to display */
    recommendation: Recommendation | null;
    /** Called when clicked */
    onClick: () => void;
    /** Additional class names */
    className?: string;
}

// ============================================================================
// UP NEXT CARD COMPONENT
// ============================================================================

export const UpNextCard: React.FC<UpNextCardProps> = memo(function UpNextCard({
    recommendation,
    compact = false,
    loading = false,
    onClick,
    onDismiss,
    onFeedback,
    className,
}) {
    const [feedbackGiven, setFeedbackGiven] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Loading state
    if (loading) {
        return <UpNextSkeleton compact={compact} className={className} />;
    }

    // Empty state
    if (!recommendation) {
        return (
            <div
                className={cn(
                    "rounded-xl border border-dashed border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30 p-6 text-center",
                    className
                )}
            >
                <Sparkles
                    size={24}
                    className="mx-auto mb-2 text-[var(--forge-text-muted)]"
                />
                <p className="text-sm text-[var(--forge-text-secondary)]">
                    Complete more content to get personalized recommendations
                </p>
            </div>
        );
    }

    const handleFeedback = (feedback: "helpful" | "not-helpful") => {
        onFeedback?.(feedback);
        setFeedbackGiven(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative overflow-hidden rounded-xl",
                "border border-[var(--ember)]/30",
                "bg-gradient-to-br from-[var(--ember)]/10 via-[var(--forge-bg-elevated)] to-[var(--ember)]/5",
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Animated glow */}
                <motion.div
                    className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--ember)]/20 rounded-full blur-3xl"
                    animate={{
                        scale: isHovered ? 1.2 : 1,
                        opacity: isHovered ? 0.4 : 0.2,
                    }}
                    transition={{ duration: 0.3 }}
                />
                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, var(--ember) 1px, transparent 1px)`,
                        backgroundSize: "24px 24px",
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between p-4 pb-0">
                    <div className="flex items-center gap-2">
                        <motion.div
                            className="p-1.5 rounded-lg bg-[var(--ember)]/20"
                            animate={{ rotate: isHovered ? 360 : 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        >
                            <Target size={14} className="text-[var(--ember)]" />
                        </motion.div>
                        <span className="text-xs font-semibold text-[var(--ember)] uppercase tracking-wider">
                            Up Next
                        </span>
                        {recommendation.confidence > 0.8 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-[var(--ember)]/20 text-[var(--ember)] rounded-full">
                                High Match
                            </span>
                        )}
                    </div>
                    {recommendation.dismissable && onDismiss && (
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

                {/* Main content - clickable */}
                <button
                    onClick={onClick}
                    className="w-full p-4 text-left group"
                >
                    <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] group-hover:text-[var(--ember)] transition-colors pr-8">
                        {recommendation.node.name}
                    </h3>

                    {!compact && (
                        <p className="text-sm text-[var(--forge-text-secondary)] mt-1 line-clamp-2">
                            {recommendation.reason}
                        </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-[var(--forge-text-muted)]">
                        {recommendation.metadata.estimatedMinutes && (
                            <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{formatDuration(recommendation.metadata.estimatedMinutes)}</span>
                            </div>
                        )}
                        {recommendation.metadata.successRate && (
                            <div className="flex items-center gap-1">
                                <TrendingUp size={12} />
                                <span>
                                    {Math.round(recommendation.metadata.successRate * 100)}% success
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Sparkles size={12} />
                            <span>{Math.round(recommendation.confidence * 100)}% match</span>
                        </div>
                    </div>

                    {/* CTA */}
                    <motion.div
                        className="flex items-center gap-2 mt-4 text-[var(--ember)] font-medium"
                        animate={{ x: isHovered ? 4 : 0 }}
                    >
                        <span>Start Learning</span>
                        <ArrowRight size={16} />
                    </motion.div>
                </button>

                {/* Explanation & feedback */}
                {!compact && (
                    <div className="px-4 pb-4 pt-0 border-t border-[var(--forge-border-subtle)] mx-4">
                        <p className="text-xs text-[var(--forge-text-muted)] italic pt-3">
                            {recommendation.explanation}
                        </p>

                        {/* Feedback */}
                        {onFeedback && !feedbackGiven && (
                            <div className="flex items-center gap-3 mt-3">
                                <span className="text-xs text-[var(--forge-text-muted)]">
                                    Was this helpful?
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFeedback("helpful");
                                        }}
                                        className="p-1.5 hover:bg-green-500/20 rounded transition-colors group"
                                    >
                                        <ThumbsUp
                                            size={14}
                                            className="text-[var(--forge-text-muted)] group-hover:text-green-400"
                                        />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFeedback("not-helpful");
                                        }}
                                        className="p-1.5 hover:bg-red-500/20 rounded transition-colors group"
                                    >
                                        <ThumbsDown
                                            size={14}
                                            className="text-[var(--forge-text-muted)] group-hover:text-red-400"
                                        />
                                    </button>
                                </div>
                            </div>
                        )}
                        {feedbackGiven && (
                            <p className="text-xs text-green-400 mt-3">
                                Thanks for your feedback!
                            </p>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
});

// ============================================================================
// UP NEXT MINIMAL (Inline version)
// ============================================================================

export const UpNextMinimal: React.FC<UpNextMinimalProps> = memo(
    function UpNextMinimal({ recommendation, onClick, className }) {
        if (!recommendation) return null;

        return (
            <button
                onClick={onClick}
                className={cn(
                    "flex items-center gap-3 p-3 w-full",
                    "bg-gradient-to-r from-[var(--ember)]/10 to-transparent",
                    "border border-[var(--ember)]/20 rounded-lg",
                    "hover:border-[var(--ember)]/40 transition-colors group",
                    className
                )}
            >
                <div className="p-1.5 rounded-lg bg-[var(--ember)]/20 flex-shrink-0">
                    <Zap size={14} className="text-[var(--ember)]" />
                </div>

                <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs text-[var(--ember)] font-medium">Up Next</p>
                    <p className="text-sm text-[var(--forge-text-primary)] truncate group-hover:text-[var(--ember)] transition-colors">
                        {recommendation.node.name}
                    </p>
                </div>

                <ChevronRight
                    size={16}
                    className="text-[var(--forge-text-muted)] group-hover:text-[var(--ember)] transition-colors flex-shrink-0"
                />
            </button>
        );
    }
);

// ============================================================================
// UP NEXT FLOATING (Bottom bar version)
// ============================================================================

interface UpNextFloatingProps {
    recommendation: Recommendation | null;
    visible: boolean;
    onClick: () => void;
    onDismiss: () => void;
    className?: string;
}

export const UpNextFloating: React.FC<UpNextFloatingProps> = memo(
    function UpNextFloating({ recommendation, visible, onClick, onDismiss, className }) {
        return (
            <AnimatePresence>
                {visible && recommendation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={cn(
                            "fixed bottom-4 left-1/2 -translate-x-1/2",
                            "flex items-center gap-4 px-4 py-3",
                            "bg-[var(--forge-bg-elevated)]/95 backdrop-blur-xl",
                            "border border-[var(--ember)]/30 rounded-full",
                            "shadow-lg shadow-black/20",
                            className
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-full bg-[var(--ember)]/20">
                                <Target size={14} className="text-[var(--ember)]" />
                            </div>
                            <div>
                                <p className="text-[10px] text-[var(--ember)] uppercase tracking-wide font-medium">
                                    Up Next
                                </p>
                                <p className="text-sm text-[var(--forge-text-primary)] font-medium max-w-[200px] truncate">
                                    {recommendation.node.name}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClick}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--ember)] hover:bg-[var(--ember)]/80 text-white rounded-full text-sm font-medium transition-colors"
                        >
                            <Play size={14} />
                            Start
                        </button>

                        <button
                            onClick={onDismiss}
                            className="p-1 hover:bg-[var(--forge-bg-anvil)] rounded-full transition-colors"
                        >
                            <X size={14} className="text-[var(--forge-text-muted)]" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }
);

// ============================================================================
// SKELETON LOADER
// ============================================================================

interface UpNextSkeletonProps {
    compact?: boolean;
    className?: string;
}

const UpNextSkeleton: React.FC<UpNextSkeletonProps> = ({ compact, className }) => (
    <div
        className={cn(
            "rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] p-4 animate-pulse",
            className
        )}
    >
        <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--forge-bg-anvil)]" />
            <div className="w-16 h-3 bg-[var(--forge-bg-anvil)] rounded" />
        </div>
        <div className="space-y-2">
            <div className="h-5 w-3/4 bg-[var(--forge-bg-anvil)] rounded" />
            {!compact && <div className="h-4 w-full bg-[var(--forge-bg-anvil)] rounded" />}
            <div className="flex gap-4 mt-3">
                <div className="h-3 w-16 bg-[var(--forge-bg-anvil)] rounded" />
                <div className="h-3 w-16 bg-[var(--forge-bg-anvil)] rounded" />
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

export default UpNextCard;
