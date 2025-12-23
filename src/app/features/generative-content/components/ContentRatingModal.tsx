"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, AlertCircle, ThumbsUp, Send } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { ContentRating } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface ContentRatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (
        rating: number,
        feedback: ContentRating["feedback"],
        comments?: string,
        issues?: ContentRating["issues"]
    ) => void;
    existingRating?: ContentRating | null;
    contentTitle: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContentRatingModal({
    isOpen,
    onClose,
    onSubmit,
    existingRating,
    contentTitle,
}: ContentRatingModalProps) {
    const [rating, setRating] = useState(existingRating?.rating || 0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [accuracy, setAccuracy] = useState<1 | 2 | 3 | 4 | 5>(
        existingRating?.feedback.accuracy || 3
    );
    const [clarity, setClarity] = useState<1 | 2 | 3 | 4 | 5>(
        existingRating?.feedback.clarity || 3
    );
    const [relevance, setRelevance] = useState<1 | 2 | 3 | 4 | 5>(
        existingRating?.feedback.relevance || 3
    );
    const [difficulty, setDifficulty] = useState<ContentRating["feedback"]["difficulty"]>(
        existingRating?.feedback.difficulty || "just_right"
    );
    const [comments, setComments] = useState(existingRating?.comments || "");
    const [issues, setIssues] = useState<ContentRating["issues"]>(
        existingRating?.issues || []
    );
    const [showIssueForm, setShowIssueForm] = useState(false);
    const [newIssueType, setNewIssueType] = useState<NonNullable<ContentRating["issues"]>[0]["type"]>("unclear");
    const [newIssueDescription, setNewIssueDescription] = useState("");

    /**
     * Add a new issue
     */
    const handleAddIssue = () => {
        if (newIssueDescription.trim()) {
            setIssues((prev) => [
                ...(prev || []),
                { type: newIssueType, description: newIssueDescription.trim() },
            ]);
            setNewIssueDescription("");
            setShowIssueForm(false);
        }
    };

    /**
     * Remove an issue
     */
    const handleRemoveIssue = (index: number) => {
        setIssues((prev) => (prev || []).filter((_, i) => i !== index));
    };

    /**
     * Submit the rating
     */
    const handleSubmit = () => {
        if (rating === 0) return;

        onSubmit(
            rating,
            { accuracy, clarity, relevance, difficulty },
            comments || undefined,
            issues && issues.length > 0 ? issues : undefined
        );
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        data-testid="rating-modal-backdrop"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
                    >
                        <div
                            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-default)] shadow-xl pointer-events-auto"
                            data-testid="rating-modal"
                        >
                            {/* Header */}
                            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-[var(--border-default)] bg-[var(--surface-elevated)]">
                                <div>
                                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                        Rate This Content
                                    </h2>
                                    <p className="text-sm text-[var(--text-secondary)]">{contentTitle}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)]"
                                    data-testid="close-rating-modal"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-6">
                                {/* Star Rating */}
                                <div className="text-center">
                                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                                        How would you rate this content overall?
                                    </p>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoveredRating(star)}
                                                onMouseLeave={() => setHoveredRating(0)}
                                                className="p-1 transition-transform hover:scale-110"
                                                data-testid={`star-${star}`}
                                            >
                                                <Star
                                                    className={cn(
                                                        "w-10 h-10 transition-colors",
                                                        (hoveredRating || rating) >= star
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "text-[var(--text-muted)]"
                                                    )}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {rating > 0 && (
                                        <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                                            {rating === 5 && "Excellent!"}
                                            {rating === 4 && "Very Good"}
                                            {rating === 3 && "Good"}
                                            {rating === 2 && "Fair"}
                                            {rating === 1 && "Poor"}
                                        </p>
                                    )}
                                </div>

                                {/* Detailed Feedback */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                                        Detailed Feedback
                                    </h3>

                                    {/* Accuracy */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-[var(--text-primary)]">Accuracy</span>
                                            <div className="flex gap-1">
                                                {([1, 2, 3, 4, 5] as const).map((value) => (
                                                    <button
                                                        key={value}
                                                        onClick={() => setAccuracy(value)}
                                                        className={cn(
                                                            "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                                                            accuracy === value
                                                                ? "bg-indigo-500 text-white"
                                                                : "bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                                                        )}
                                                        data-testid={`accuracy-${value}`}
                                                    >
                                                        {value}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Clarity */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-[var(--text-primary)]">Clarity</span>
                                            <div className="flex gap-1">
                                                {([1, 2, 3, 4, 5] as const).map((value) => (
                                                    <button
                                                        key={value}
                                                        onClick={() => setClarity(value)}
                                                        className={cn(
                                                            "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                                                            clarity === value
                                                                ? "bg-indigo-500 text-white"
                                                                : "bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                                                        )}
                                                        data-testid={`clarity-${value}`}
                                                    >
                                                        {value}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Relevance */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-[var(--text-primary)]">Relevance</span>
                                            <div className="flex gap-1">
                                                {([1, 2, 3, 4, 5] as const).map((value) => (
                                                    <button
                                                        key={value}
                                                        onClick={() => setRelevance(value)}
                                                        className={cn(
                                                            "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                                                            relevance === value
                                                                ? "bg-indigo-500 text-white"
                                                                : "bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                                                        )}
                                                        data-testid={`relevance-${value}`}
                                                    >
                                                        {value}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Difficulty */}
                                    <div>
                                        <span className="text-sm text-[var(--text-primary)] block mb-2">
                                            Difficulty Level
                                        </span>
                                        <div className="flex gap-2">
                                            {[
                                                { value: "too_easy", label: "Too Easy" },
                                                { value: "just_right", label: "Just Right" },
                                                { value: "too_hard", label: "Too Hard" },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() =>
                                                        setDifficulty(
                                                            option.value as ContentRating["feedback"]["difficulty"]
                                                        )
                                                    }
                                                    className={cn(
                                                        "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                                                        difficulty === option.value
                                                            ? "bg-indigo-500 text-white"
                                                            : "bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                                                    )}
                                                    data-testid={`difficulty-${option.value}`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Comments */}
                                <div>
                                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                                        Additional Comments (Optional)
                                    </label>
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Share your thoughts about this content..."
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                        data-testid="rating-comments"
                                    />
                                </div>

                                {/* Report Issues */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                                            Report Issues
                                        </span>
                                        <button
                                            onClick={() => setShowIssueForm(!showIssueForm)}
                                            className="text-sm text-indigo-400 hover:text-indigo-300"
                                            data-testid="add-issue-btn"
                                        >
                                            + Add Issue
                                        </button>
                                    </div>

                                    {/* Issue List */}
                                    {issues && issues.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            {issues.map((issue, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-start justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="text-xs font-medium text-red-400 uppercase">
                                                                {issue.type.replace("_", " ")}
                                                            </span>
                                                            <p className="text-sm text-[var(--text-primary)] mt-0.5">
                                                                {issue.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveIssue(index)}
                                                        className="text-[var(--text-muted)] hover:text-red-400"
                                                        data-testid={`remove-issue-${index}`}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add Issue Form */}
                                    <AnimatePresence>
                                        {showIssueForm && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-3 p-3 rounded-lg bg-[var(--surface-sunken)]"
                                            >
                                                <select
                                                    value={newIssueType}
                                                    onChange={(e) =>
                                                        setNewIssueType(
                                                            e.target.value as NonNullable<ContentRating["issues"]>[0]["type"]
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm"
                                                    data-testid="issue-type-select"
                                                >
                                                    <option value="incorrect">Incorrect Information</option>
                                                    <option value="unclear">Unclear Explanation</option>
                                                    <option value="outdated">Outdated Content</option>
                                                    <option value="missing_content">Missing Content</option>
                                                    <option value="typo">Typo/Grammar</option>
                                                </select>
                                                <textarea
                                                    value={newIssueDescription}
                                                    onChange={(e) => setNewIssueDescription(e.target.value)}
                                                    placeholder="Describe the issue..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm resize-none"
                                                    data-testid="issue-description"
                                                />
                                                <button
                                                    onClick={handleAddIssue}
                                                    disabled={!newIssueDescription.trim()}
                                                    className="w-full py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                    data-testid="submit-issue-btn"
                                                >
                                                    Add Issue
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t border-[var(--border-default)] bg-[var(--surface-elevated)]">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                                    data-testid="cancel-rating-btn"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={rating === 0}
                                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-purple-600"
                                    data-testid="submit-rating-btn"
                                >
                                    <Send className="w-4 h-4" />
                                    Submit Rating
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default ContentRatingModal;
