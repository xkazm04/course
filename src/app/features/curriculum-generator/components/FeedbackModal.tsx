"use client";

/**
 * Feedback Modal Component
 *
 * Collects user feedback on generated curriculum content
 * for the feedback loop system.
 */

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
    X,
    Star,
    ThumbsUp,
    ThumbsDown,
    MessageSquare,
    Send,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

// ============================================================================
// TYPES
// ============================================================================

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: FeedbackData) => void;
    contentTitle: string;
    contentType: "lesson" | "exercise" | "quiz" | "project";
}

export interface FeedbackData {
    rating: number;
    clarity: number;
    difficultyMatch: number;
    relevance: number;
    engagement: number;
    comment?: string;
    struggled: boolean;
    suggestions?: string[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FeedbackModal = ({
    isOpen,
    onClose,
    onSubmit,
    contentTitle,
    contentType,
}: FeedbackModalProps) => {
    const prefersReducedMotion = useReducedMotion();
    const [step, setStep] = useState(1);
    const [feedback, setFeedback] = useState<Partial<FeedbackData>>({
        rating: 0,
        clarity: 3,
        difficultyMatch: 3,
        relevance: 3,
        engagement: 3,
        struggled: false,
    });
    const [comment, setComment] = useState("");

    const handleSubmit = () => {
        onSubmit({
            rating: feedback.rating || 0,
            clarity: feedback.clarity || 3,
            difficultyMatch: feedback.difficultyMatch || 3,
            relevance: feedback.relevance || 3,
            engagement: feedback.engagement || 3,
            comment: comment || undefined,
            struggled: feedback.struggled || false,
        });
        onClose();
        // Reset state
        setStep(1);
        setFeedback({
            rating: 0,
            clarity: 3,
            difficultyMatch: 3,
            relevance: 3,
            engagement: 3,
            struggled: false,
        });
        setComment("");
    };

    const contentTypeLabels = {
        lesson: "this lesson",
        exercise: "this exercise",
        quiz: "this quiz",
        project: "this project",
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={prefersReducedMotion ? { duration: 0 } : undefined}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                        transition={prefersReducedMotion ? { duration: 0 } : undefined}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h2 className="font-bold text-slate-900 dark:text-slate-100">
                                        Share Your Feedback
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Help us improve {contentTypeLabels[contentType]}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    data-testid="feedback-close-btn"
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    <X size={ICON_SIZES.md} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {step === 1 && (
                                    <Step1Rating
                                        rating={feedback.rating || 0}
                                        onRatingChange={(rating) =>
                                            setFeedback({ ...feedback, rating })
                                        }
                                        contentTitle={contentTitle}
                                    />
                                )}

                                {step === 2 && (
                                    <Step2Details
                                        feedback={feedback}
                                        onFeedbackChange={(updates) =>
                                            setFeedback({ ...feedback, ...updates })
                                        }
                                    />
                                )}

                                {step === 3 && (
                                    <Step3Comment
                                        comment={comment}
                                        onCommentChange={setComment}
                                        struggled={feedback.struggled || false}
                                        onStruggledChange={(struggled) =>
                                            setFeedback({ ...feedback, struggled })
                                        }
                                    />
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                {/* Progress Indicator */}
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3].map((s) => (
                                        <div
                                            key={s}
                                            className={cn(
                                                "w-2 h-2 rounded-full transition-colors",
                                                s <= step
                                                    ? "bg-indigo-500"
                                                    : "bg-slate-200 dark:bg-slate-700"
                                            )}
                                        />
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {step > 1 && (
                                        <button
                                            onClick={() => setStep(step - 1)}
                                            data-testid="feedback-back-btn"
                                            className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                        >
                                            Back
                                        </button>
                                    )}
                                    {step < 3 ? (
                                        <button
                                            onClick={() => setStep(step + 1)}
                                            disabled={step === 1 && !feedback.rating}
                                            data-testid="feedback-next-btn"
                                            className={cn(
                                                "px-4 py-2 rounded-lg font-medium transition-colors",
                                                step === 1 && !feedback.rating
                                                    ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                                            )}
                                        >
                                            Next
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            data-testid="feedback-submit-btn"
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                        >
                                            <Send size={ICON_SIZES.sm} />
                                            Submit Feedback
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ============================================================================
// STEP 1: OVERALL RATING
// ============================================================================

interface Step1Props {
    rating: number;
    onRatingChange: (rating: number) => void;
    contentTitle: string;
}

const Step1Rating = ({ rating, onRatingChange, contentTitle }: Step1Props) => {
    return (
        <div className="text-center">
            <MessageSquare
                size={48}
                className="text-indigo-500 mx-auto mb-4"
            />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                How would you rate this content?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
                {contentTitle}
            </p>

            {/* Star Rating */}
            <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => onRatingChange(star)}
                        data-testid={`rating-star-${star}`}
                        className="p-1 transition-transform hover:scale-110"
                    >
                        <Star
                            size={32}
                            className={cn(
                                "transition-colors",
                                star <= rating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-300 dark:text-slate-600"
                            )}
                        />
                    </button>
                ))}
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-400">
                {rating === 0 && "Click a star to rate"}
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent!"}
            </div>
        </div>
    );
};

// ============================================================================
// STEP 2: DETAILED RATINGS
// ============================================================================

interface Step2Props {
    feedback: Partial<FeedbackData>;
    onFeedbackChange: (updates: Partial<FeedbackData>) => void;
}

const Step2Details = ({ feedback, onFeedbackChange }: Step2Props) => {
    const categories = [
        { key: "clarity" as const, label: "Clarity", description: "How clear was the explanation?" },
        {
            key: "difficultyMatch" as const,
            label: "Difficulty",
            description: "Was the difficulty appropriate?",
        },
        {
            key: "relevance" as const,
            label: "Relevance",
            description: "How relevant to your goals?",
        },
        { key: "engagement" as const, label: "Engagement", description: "How engaging was it?" },
    ];

    return (
        <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 text-center">
                Rate these aspects
            </h3>

            <div className="space-y-4">
                {categories.map(({ key, label, description }) => (
                    <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                {label}
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                {feedback[key] || 3}/5
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                            {description}
                        </p>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    onClick={() => onFeedbackChange({ [key]: value })}
                                    data-testid={`${key}-rating-${value}`}
                                    className={cn(
                                        "flex-1 h-8 rounded-lg transition-colors",
                                        value <= (feedback[key] || 3)
                                            ? "bg-indigo-500"
                                            : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// STEP 3: COMMENT & STRUGGLES
// ============================================================================

interface Step3Props {
    comment: string;
    onCommentChange: (comment: string) => void;
    struggled: boolean;
    onStruggledChange: (struggled: boolean) => void;
}

const Step3Comment = ({
    comment,
    onCommentChange,
    struggled,
    onStruggledChange,
}: Step3Props) => {
    return (
        <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 text-center">
                Any additional feedback?
            </h3>

            {/* Struggled Toggle */}
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <button
                    onClick={() => onStruggledChange(!struggled)}
                    data-testid="struggled-toggle"
                    className="w-full flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle
                            size={ICON_SIZES.md}
                            className={struggled ? "text-amber-500" : "text-slate-400"}
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            I struggled with this content
                        </span>
                    </div>
                    <div
                        className={cn(
                            "w-10 h-6 rounded-full p-0.5 transition-colors",
                            struggled ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                        )}
                    >
                        <div
                            className={cn(
                                "w-5 h-5 bg-white rounded-full transition-transform",
                                struggled && "translate-x-4"
                            )}
                        />
                    </div>
                </button>
            </div>

            {/* Comment Box */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Comments or suggestions (optional)
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => onCommentChange(e.target.value)}
                    data-testid="feedback-comment-input"
                    placeholder="What worked well? What could be improved?"
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
            </div>

            {/* Quick Suggestions */}
            <div className="mt-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Quick feedback:
                </div>
                <div className="flex flex-wrap gap-2">
                    {[
                        "Too fast",
                        "Too slow",
                        "More examples",
                        "Great content!",
                        "Confusing",
                    ].map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() =>
                                onCommentChange(comment ? `${comment} ${suggestion}` : suggestion)
                            }
                            data-testid={`quick-feedback-${suggestion.replace(/\s+/g, "-").toLowerCase()}`}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
