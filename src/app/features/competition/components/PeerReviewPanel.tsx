"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Star,
    Send,
    ExternalLink,
    User,
    Accessibility,
    Palette,
    ThumbsUp,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { PeerReview, Submission } from "../lib/types";
import { TierIcon } from "./TierBadge";

interface PeerReviewPanelProps {
    submission: Submission;
    existingReviews?: PeerReview[];
    canReview?: boolean;
    onSubmitReview?: (review: Omit<PeerReview, "id" | "reviewerId" | "reviewerName" | "submittedAt">) => void;
}

export const PeerReviewPanel: React.FC<PeerReviewPanelProps> = ({
    submission,
    existingReviews = [],
    canReview = true,
    onSubmitReview,
}) => {
    const [isReviewing, setIsReviewing] = useState(false);
    const [uxScore, setUxScore] = useState(0);
    const [accessibilityScore, setAccessibilityScore] = useState(0);
    const [designScore, setDesignScore] = useState(0);
    const [comments, setComments] = useState("");

    const handleSubmit = () => {
        if (uxScore === 0) return;

        onSubmitReview?.({
            uxScore,
            accessibilityScore: accessibilityScore || undefined,
            designScore: designScore || undefined,
            comments,
        });

        // Reset form
        setUxScore(0);
        setAccessibilityScore(0);
        setDesignScore(0);
        setComments("");
        setIsReviewing(false);
    };

    return (
        <div
            className={cn(
                "rounded-xl border border-[var(--border-default)]",
                "bg-[var(--surface-elevated)] overflow-hidden",
                elevation.elevated
            )}
        >
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ThumbsUp size={ICON_SIZES.md} className="text-[var(--ember-glow)]" />
                        <h3 className="font-semibold text-[var(--text-primary)]">
                            Peer Reviews
                        </h3>
                        <span className="text-sm text-[var(--text-muted)]">
                            ({existingReviews.length})
                        </span>
                    </div>
                    {submission.deploymentUrl && (
                        <a
                            href={submission.deploymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-[var(--accent-primary)] hover:underline"
                        >
                            View Deployment
                            <ExternalLink size={ICON_SIZES.sm} />
                        </a>
                    )}
                </div>
            </div>

            {/* Existing reviews */}
            {existingReviews.length > 0 && (
                <div className="p-4 border-b border-[var(--border-subtle)] space-y-4">
                    {existingReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            )}

            {/* Review form */}
            {canReview && (
                <div className="p-4">
                    {!isReviewing ? (
                        <button
                            onClick={() => setIsReviewing(true)}
                            className="w-full py-3 rounded-lg bg-[var(--ember-glow)]/20 text-[var(--ember-glow)] font-medium hover:bg-[var(--ember-glow)]/30 transition-colors"
                        >
                            Write a Review
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {/* UX Score (required) */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
                                    <User size={ICON_SIZES.sm} />
                                    User Experience *
                                </label>
                                <StarRating value={uxScore} onChange={setUxScore} />
                            </div>

                            {/* Accessibility Score (optional) */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
                                    <Accessibility size={ICON_SIZES.sm} />
                                    Accessibility
                                </label>
                                <StarRating value={accessibilityScore} onChange={setAccessibilityScore} />
                            </div>

                            {/* Design Score (optional) */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
                                    <Palette size={ICON_SIZES.sm} />
                                    Visual Design
                                </label>
                                <StarRating value={designScore} onChange={setDesignScore} />
                            </div>

                            {/* Comments */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                    Comments
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Share your thoughts on this submission..."
                                    rows={3}
                                    className={cn(
                                        "w-full px-3 py-2 rounded-lg resize-none",
                                        "bg-[var(--surface-base)] border border-[var(--border-default)]",
                                        "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                                        "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                                    )}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSubmit}
                                    disabled={uxScore === 0}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--ember-glow)] text-white font-medium hover:bg-[var(--ember-glow)]/90 transition-colors disabled:opacity-50"
                                >
                                    <Send size={ICON_SIZES.sm} />
                                    Submit Review
                                </button>
                                <button
                                    onClick={() => setIsReviewing(false)}
                                    className="px-4 py-2 rounded-lg bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:bg-[var(--surface-base)] transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {existingReviews.length === 0 && !canReview && (
                <div className="p-8 text-center">
                    <ThumbsUp size={ICON_SIZES.xl} className="text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-[var(--text-muted)]">No reviews yet</p>
                </div>
            )}
        </div>
    );
};

// Star rating component
interface StarRatingProps {
    value: number;
    onChange: (value: number) => void;
    max?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ value, onChange, max = 5 }) => {
    const [hoverValue, setHoverValue] = useState(0);

    return (
        <div className="flex gap-1">
            {Array.from({ length: max }).map((_, i) => {
                const starValue = i + 1;
                const isActive = starValue <= (hoverValue || value);

                return (
                    <motion.button
                        key={i}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onChange(starValue)}
                        onMouseEnter={() => setHoverValue(starValue)}
                        onMouseLeave={() => setHoverValue(0)}
                        className="p-1"
                    >
                        <Star
                            size={24}
                            className={cn(
                                "transition-colors",
                                isActive ? "text-[var(--gold)] fill-[var(--gold)]" : "text-[var(--text-muted)]"
                            )}
                        />
                    </motion.button>
                );
            })}
            {value > 0 && (
                <span className="ml-2 text-sm text-[var(--text-muted)]">
                    {value}/{max}
                </span>
            )}
        </div>
    );
};

// Review card component
interface ReviewCardProps {
    review: PeerReview;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
    const averageScore =
        (review.uxScore +
            (review.accessibilityScore || 0) +
            (review.designScore || 0)) /
        (1 + (review.accessibilityScore ? 1 : 0) + (review.designScore ? 1 : 0));

    return (
        <div className="p-3 rounded-lg bg-[var(--surface-overlay)]">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-base)] flex items-center justify-center text-sm font-medium text-[var(--text-muted)]">
                        {review.reviewerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                            @{review.reviewerName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                            {new Date(review.submittedAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Star size={ICON_SIZES.sm} className="text-[var(--gold)] fill-[var(--gold)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                        {averageScore.toFixed(1)}
                    </span>
                </div>
            </div>

            {/* Score breakdown */}
            <div className="flex gap-4 mb-2 text-xs">
                <span className="text-[var(--text-muted)]">
                    UX: <span className="text-[var(--text-secondary)]">{review.uxScore}/5</span>
                </span>
                {review.accessibilityScore && (
                    <span className="text-[var(--text-muted)]">
                        A11y: <span className="text-[var(--text-secondary)]">{review.accessibilityScore}/5</span>
                    </span>
                )}
                {review.designScore && (
                    <span className="text-[var(--text-muted)]">
                        Design: <span className="text-[var(--text-secondary)]">{review.designScore}/5</span>
                    </span>
                )}
            </div>

            {/* Comments */}
            {review.comments && (
                <p className="text-sm text-[var(--text-secondary)]">
                    "{review.comments}"
                </p>
            )}
        </div>
    );
};
