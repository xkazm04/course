"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bookmark,
    Edit2,
    Trash2,
    Tag,
    Clock,
    BookOpen,
    X,
    Check,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Bookmark as BookmarkType } from "../lib/types";
import { useBookmarks } from "../lib/useBookmarks";

interface BookmarkCardProps {
    bookmark: BookmarkType;
    onNavigate?: (bookmark: BookmarkType) => void;
    showCourse?: boolean;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
    bookmark,
    onNavigate,
    showCourse = true,
}) => {
    const { update, remove } = useBookmarks();
    const [isEditing, setIsEditing] = useState(false);
    const [editNote, setEditNote] = useState(bookmark.note);
    const [editTags, setEditTags] = useState<string[]>(bookmark.tags);
    const [tagInput, setTagInput] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSave = useCallback(() => {
        update(bookmark.id, { note: editNote, tags: editTags });
        setIsEditing(false);
    }, [update, bookmark.id, editNote, editTags]);

    const handleCancel = useCallback(() => {
        setEditNote(bookmark.note);
        setEditTags(bookmark.tags);
        setIsEditing(false);
    }, [bookmark.note, bookmark.tags]);

    const handleDelete = useCallback(() => {
        remove(bookmark.id);
        setShowDeleteConfirm(false);
    }, [remove, bookmark.id]);

    const handleAddTag = useCallback(() => {
        const trimmed = tagInput.trim().toLowerCase();
        if (trimmed && !editTags.includes(trimmed)) {
            setEditTags((prev) => [...prev, trimmed]);
        }
        setTagInput("");
    }, [tagInput, editTags]);

    const handleRemoveTag = useCallback((tagToRemove: string) => {
        setEditTags((prev) => prev.filter((t) => t !== tagToRemove));
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMins = Math.floor(diffMs / (1000 * 60));
                return `${diffMins} min ago`;
            }
            return `${diffHours} hr ago`;
        }
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            data-testid={`bookmark-card-${bookmark.id}`}
        >
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        {showCourse && (
                            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1 truncate">
                                {bookmark.courseName}
                            </p>
                        )}
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {bookmark.chapterTitle}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {bookmark.sectionTitle}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            data-testid={`bookmark-edit-${bookmark.id}`}
                        >
                            <Edit2 size={ICON_SIZES.sm} />
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            data-testid={`bookmark-delete-${bookmark.id}`}
                        >
                            <Trash2 size={ICON_SIZES.sm} />
                        </button>
                    </div>
                </div>

                {/* Highlighted Text */}
                {bookmark.highlightedText && (
                    <div className="mb-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border-l-4 border-indigo-500">
                        <p className="text-sm text-indigo-800 dark:text-indigo-200 italic line-clamp-3">
                            "{bookmark.highlightedText}"
                        </p>
                    </div>
                )}

                {/* Note - View or Edit */}
                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            <textarea
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                                rows={3}
                                placeholder="Add your notes..."
                                data-testid={`bookmark-edit-note-${bookmark.id}`}
                            />

                            {/* Tag editing */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === ",") {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                        placeholder="Add tag..."
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        data-testid={`bookmark-edit-tag-input-${bookmark.id}`}
                                    />
                                    <button
                                        onClick={handleAddTag}
                                        className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                                {editTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {editTags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium text-slate-600 dark:text-slate-300"
                                            >
                                                #{tag}
                                                <button
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                >
                                                    <X size={ICON_SIZES.xs} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={handleCancel}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    data-testid={`bookmark-edit-cancel-${bookmark.id}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-3 py-1.5 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-1"
                                    data-testid={`bookmark-edit-save-${bookmark.id}`}
                                >
                                    <Check size={ICON_SIZES.sm} />
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {bookmark.note && (
                                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 whitespace-pre-wrap">
                                    {bookmark.note}
                                </p>
                            )}

                            {/* Tags */}
                            {bookmark.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {bookmark.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium text-slate-600 dark:text-slate-300"
                                        >
                                            <Tag size={ICON_SIZES.xs} />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={ICON_SIZES.xs} />
                        {formatDate(bookmark.createdAt)}
                    </div>
                    {onNavigate && (
                        <button
                            onClick={() => onNavigate(bookmark)}
                            className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            data-testid={`bookmark-navigate-${bookmark.id}`}
                        >
                            <BookOpen size={ICON_SIZES.xs} />
                            Go to lesson
                            <ChevronRight size={ICON_SIZES.xs} />
                        </button>
                    )}
                </div>
            </div>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                                Delete this bookmark? This action cannot be undone.
                            </p>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    data-testid={`bookmark-delete-cancel-${bookmark.id}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    data-testid={`bookmark-delete-confirm-${bookmark.id}`}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
