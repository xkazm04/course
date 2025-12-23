"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitFork, X, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { GeneratedChapter, ContentFork } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface ForkContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFork: (
        reason?: string,
        customizations?: ContentFork["customizations"]
    ) => void;
    chapter: GeneratedChapter;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ForkContentModal({
    isOpen,
    onClose,
    onFork,
    chapter,
}: ForkContentModalProps) {
    const [reason, setReason] = useState("");
    const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());

    /**
     * Toggle section selection
     */
    const toggleSection = (sectionId: string) => {
        setSelectedSections((prev) => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    /**
     * Handle fork submission
     */
    const handleFork = () => {
        const customizations: ContentFork["customizations"] = Array.from(selectedSections).map(
            (sectionId) => ({
                sectionId,
                changeType: "modified" as const,
                description: "Planned modification",
            })
        );

        onFork(reason || undefined, customizations.length > 0 ? customizations : undefined);
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
                        data-testid="fork-modal-backdrop"
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
                            data-testid="fork-modal"
                        >
                            {/* Header */}
                            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-[var(--border-default)] bg-[var(--surface-elevated)]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/20">
                                        <GitFork className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                            Fork This Chapter
                                        </h2>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            Create your own version to customize
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)]"
                                    data-testid="close-fork-modal"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-6">
                                {/* Info Box */}
                                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="text-[var(--text-primary)] font-medium mb-1">
                                                About Forking
                                            </p>
                                            <p className="text-[var(--text-secondary)]">
                                                Forking creates a copy of this chapter that you can modify.
                                                Your changes won't affect the original, and other users can
                                                discover your improved version.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Original Chapter Info */}
                                <div>
                                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                                        Original Chapter
                                    </h3>
                                    <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-default)]">
                                        <h4 className="font-medium text-[var(--text-primary)]">
                                            {chapter.courseInfo.chapterTitle}
                                        </h4>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                                            {chapter.courseInfo.courseName}
                                        </p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
                                            <span>{chapter.sections.length} sections</span>
                                            <span>{chapter.totalDuration}</span>
                                            {chapter.qualityMetrics.forkCount > 0 && (
                                                <span>{chapter.qualityMetrics.forkCount} forks</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Fork Reason */}
                                <div>
                                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                                        Why are you forking? (Optional)
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="e.g., Adding more examples, simplifying explanations, updating for newer versions..."
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                                        data-testid="fork-reason-input"
                                    />
                                </div>

                                {/* Section Selection */}
                                <div>
                                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                                        Select Sections to Modify (Optional)
                                    </h3>
                                    <div className="space-y-2">
                                        {chapter.sections.map((section) => (
                                            <button
                                                key={section.sectionId}
                                                onClick={() => toggleSection(section.sectionId)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                                                    selectedSections.has(section.sectionId)
                                                        ? "bg-purple-500/20 border border-purple-500/30"
                                                        : "bg-[var(--surface-sunken)] border border-transparent hover:bg-[var(--surface-hover)]"
                                                )}
                                                data-testid={`select-section-${section.sectionId}`}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                                                        selectedSections.has(section.sectionId)
                                                            ? "border-purple-400 bg-purple-400"
                                                            : "border-[var(--border-default)]"
                                                    )}
                                                >
                                                    {selectedSections.has(section.sectionId) && (
                                                        <svg
                                                            className="w-3 h-3 text-white"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={3}
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                                        {section.title}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        {section.type} • {section.duration}
                                                    </p>
                                                </div>
                                                <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                                            </button>
                                        ))}
                                    </div>
                                    {selectedSections.size > 0 && (
                                        <p className="text-xs text-[var(--text-muted)] mt-2">
                                            {selectedSections.size} section(s) selected for modification
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t border-[var(--border-default)] bg-[var(--surface-elevated)]">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                                    data-testid="cancel-fork-btn"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFork}
                                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600"
                                    data-testid="confirm-fork-btn"
                                >
                                    <GitFork className="w-4 h-4" />
                                    Create Fork
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default ForkContentModal;
