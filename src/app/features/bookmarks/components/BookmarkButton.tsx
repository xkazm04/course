"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookmarkCheck, X, Plus, Tag } from "lucide-react";
import { cn, buttonSizeClasses } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useBookmarks, useSectionBookmarks } from "../lib/useBookmarks";
import { Bookmark as BookmarkType } from "../lib/types";

interface BookmarkButtonProps {
    courseId: string;
    courseName: string;
    chapterId: string;
    chapterTitle: string;
    sectionId: string;
    sectionTitle: string;
    highlightedText?: string;
    className?: string;
    variant?: "icon" | "full";
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
    courseId,
    courseName,
    chapterId,
    chapterTitle,
    sectionId,
    sectionTitle,
    highlightedText,
    className,
    variant = "icon",
}) => {
    const { add, remove } = useBookmarks();
    const { bookmarks } = useSectionBookmarks(courseId, chapterId, sectionId);
    const [showModal, setShowModal] = useState(false);
    const [note, setNote] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const existingBookmark = bookmarks.length > 0 ? bookmarks[0] : null;
    const isBookmarked = !!existingBookmark;

    const handleAddTag = useCallback(() => {
        const trimmed = tagInput.trim().toLowerCase();
        if (trimmed && !tags.includes(trimmed)) {
            setTags((prev) => [...prev, trimmed]);
        }
        setTagInput("");
    }, [tagInput, tags]);

    const handleRemoveTag = useCallback((tagToRemove: string) => {
        setTags((prev) => prev.filter((t) => t !== tagToRemove));
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                handleAddTag();
            }
        },
        [handleAddTag]
    );

    const handleSave = useCallback(() => {
        add({
            courseId,
            courseName,
            chapterId,
            chapterTitle,
            sectionId,
            sectionTitle,
            note,
            tags,
            highlightedText,
        });
        setShowModal(false);
        setNote("");
        setTags([]);
    }, [add, courseId, courseName, chapterId, chapterTitle, sectionId, sectionTitle, note, tags, highlightedText]);

    const handleRemove = useCallback(() => {
        if (existingBookmark) {
            remove(existingBookmark.id);
        }
    }, [remove, existingBookmark]);

    const handleClick = useCallback(() => {
        if (isBookmarked) {
            handleRemove();
        } else {
            setShowModal(true);
        }
    }, [isBookmarked, handleRemove]);

    return (
        <>
            <button
                onClick={handleClick}
                className={cn(
                    "transition-all duration-200",
                    variant === "icon"
                        ? "p-2 rounded-lg hover:bg-[var(--forge-bg-bench)]"
                        : cn(buttonSizeClasses.md, "flex items-center gap-2 rounded-xl font-medium text-sm"),
                    isBookmarked
                        ? variant === "icon"
                            ? "text-[var(--ember)]"
                            : "bg-[var(--ember-dim)]/10 text-[var(--ember)] border border-[var(--ember)]/30"
                        : variant === "icon"
                        ? "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        : "bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-bench)]",
                    className
                )}
                data-testid={`bookmark-btn-${sectionId}`}
            >
                {isBookmarked ? (
                    <>
                        <BookmarkCheck size={variant === "icon" ? ICON_SIZES.md : ICON_SIZES.sm} />
                        {variant === "full" && "Bookmarked"}
                    </>
                ) : (
                    <>
                        <Bookmark size={variant === "icon" ? ICON_SIZES.md : ICON_SIZES.sm} />
                        {variant === "full" && "Bookmark"}
                    </>
                )}
            </button>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-[var(--forge-bg-workshop)] rounded-2xl shadow-2xl overflow-hidden"
                            data-testid="bookmark-modal"
                        >
                            <div className="p-6 border-b border-[var(--forge-border-subtle)]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-[var(--forge-text-primary)]">
                                        Add Bookmark
                                    </h3>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] rounded-lg hover:bg-[var(--forge-bg-bench)] transition-colors"
                                        data-testid="bookmark-modal-close"
                                    >
                                        <X size={ICON_SIZES.md} />
                                    </button>
                                </div>
                                <p className="text-sm text-[var(--forge-text-muted)] mt-1">
                                    {chapterTitle} - {sectionTitle}
                                </p>
                            </div>

                            <div className="p-6 space-y-4">
                                {highlightedText && (
                                    <div className="p-3 bg-[var(--ember-dim)]/10 rounded-xl border-l-4 border-[var(--ember)]">
                                        <p className="text-sm text-[var(--forge-text-primary)] italic">
                                            "{highlightedText}"
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                                        Personal Note
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Add your thoughts or notes..."
                                        className="w-full px-4 py-3 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ember)] focus:border-transparent resize-none"
                                        rows={4}
                                        data-testid="bookmark-note-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                                        Tags
                                    </label>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="relative flex-1">
                                            <Tag
                                                size={ICON_SIZES.sm}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]"
                                            />
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Add a tag..."
                                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ember)] focus:border-transparent text-sm"
                                                data-testid="bookmark-tag-input"
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddTag}
                                            className="p-2 bg-[var(--ember)] text-[var(--forge-text-primary)] rounded-lg hover:opacity-90 transition-colors"
                                            data-testid="bookmark-add-tag-btn"
                                        >
                                            <Plus size={ICON_SIZES.sm} />
                                        </button>
                                    </div>
                                    {tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--forge-bg-anvil)] rounded-lg text-xs font-medium text-[var(--forge-text-secondary)]"
                                                >
                                                    #{tag}
                                                    <button
                                                        onClick={() => handleRemoveTag(tag)}
                                                        className="text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                                                        data-testid={`bookmark-remove-tag-${tag}`}
                                                    >
                                                        <X size={ICON_SIZES.xs} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-[var(--forge-bg-bench)] flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className={cn(
                                        buttonSizeClasses.md,
                                        "text-sm font-medium text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)] rounded-lg transition-colors"
                                    )}
                                    data-testid="bookmark-cancel-btn"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className={cn(
                                        buttonSizeClasses.md,
                                        "text-sm font-medium bg-[var(--ember)] text-[var(--forge-text-primary)] rounded-lg hover:opacity-90 transition-colors"
                                    )}
                                    data-testid="bookmark-save-btn"
                                >
                                    Save Bookmark
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
