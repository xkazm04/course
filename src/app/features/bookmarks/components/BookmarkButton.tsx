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
                        ? "p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        : cn(buttonSizeClasses.md, "flex items-center gap-2 rounded-xl font-medium text-sm"),
                    isBookmarked
                        ? variant === "icon"
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700"
                        : variant === "icon"
                        ? "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
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
                            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                            data-testid="bookmark-modal"
                        >
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        Add Bookmark
                                    </h3>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        data-testid="bookmark-modal-close"
                                    >
                                        <X size={ICON_SIZES.md} />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {chapterTitle} - {sectionTitle}
                                </p>
                            </div>

                            <div className="p-6 space-y-4">
                                {highlightedText && (
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border-l-4 border-indigo-500">
                                        <p className="text-sm text-indigo-800 dark:text-indigo-200 italic">
                                            "{highlightedText}"
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Personal Note
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Add your thoughts or notes..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        rows={4}
                                        data-testid="bookmark-note-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Tags
                                    </label>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="relative flex-1">
                                            <Tag
                                                size={ICON_SIZES.sm}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Add a tag..."
                                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                                data-testid="bookmark-tag-input"
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddTag}
                                            className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
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
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300"
                                                >
                                                    #{tag}
                                                    <button
                                                        onClick={() => handleRemoveTag(tag)}
                                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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

                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className={cn(
                                        buttonSizeClasses.md,
                                        "text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    )}
                                    data-testid="bookmark-cancel-btn"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className={cn(
                                        buttonSizeClasses.md,
                                        "text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
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
