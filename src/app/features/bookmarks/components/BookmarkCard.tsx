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
            className="bg-[var(--forge-bg-elevated)] rounded-2xl border border-[var(--forge-border-subtle)] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            data-testid={`bookmark-card-${bookmark.id}`}
        >
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        {showCourse && (
                            <p className="text-xs font-medium text-[var(--ember)] mb-1 truncate">
                                {bookmark.courseName}
                            </p>
                        )}
                        <h4 className="font-semibold text-[var(--forge-text-primary)] truncate">
                            {bookmark.chapterTitle}
                        </h4>
                        <p className="text-sm text-[var(--forge-text-secondary)] truncate">
                            {bookmark.sectionTitle}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="p-2 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] rounded-lg hover:bg-[var(--forge-bg-anvil)] transition-colors"
                            data-testid={`bookmark-edit-${bookmark.id}`}
                        >
                            <Edit2 size={ICON_SIZES.sm} />
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-2 text-[var(--forge-text-muted)] hover:text-[var(--forge-error)] rounded-lg hover:bg-[var(--forge-error)]/10 transition-colors"
                            data-testid={`bookmark-delete-${bookmark.id}`}
                        >
                            <Trash2 size={ICON_SIZES.sm} />
                        </button>
                    </div>
                </div>

                {/* Highlighted Text */}
                {bookmark.highlightedText && (
                    <div className="mb-3 p-3 bg-[var(--ember-dim)]/10 rounded-xl border-l-4 border-[var(--ember)]">
                        <p className="text-sm text-[var(--forge-text-primary)] italic line-clamp-3">
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
                                className="w-full px-3 py-2 rounded-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ember)] resize-none text-sm"
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
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ember)] text-sm"
                                        data-testid={`bookmark-edit-tag-input-${bookmark.id}`}
                                    />
                                    <button
                                        onClick={handleAddTag}
                                        className="px-3 py-1.5 bg-[var(--ember)] text-[var(--forge-text-primary)] rounded-lg text-sm hover:opacity-90 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                                {editTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {editTags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--forge-bg-anvil)] rounded text-xs font-medium text-[var(--forge-text-secondary)]"
                                            >
                                                #{tag}
                                                <button
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
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
                                    className="px-3 py-1.5 text-sm font-medium text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)] rounded-lg transition-colors"
                                    data-testid={`bookmark-edit-cancel-${bookmark.id}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-3 py-1.5 text-sm font-medium bg-[var(--ember)] text-[var(--forge-text-primary)] rounded-lg hover:opacity-90 transition-colors flex items-center gap-1"
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
                                <p className="text-sm text-[var(--forge-text-secondary)] mb-3 whitespace-pre-wrap">
                                    {bookmark.note}
                                </p>
                            )}

                            {/* Tags */}
                            {bookmark.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {bookmark.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--forge-bg-anvil)] rounded text-xs font-medium text-[var(--forge-text-secondary)]"
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
                <div className="flex items-center justify-between pt-3 border-t border-[var(--forge-border-subtle)]">
                    <div className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)]">
                        <Clock size={ICON_SIZES.xs} />
                        {formatDate(bookmark.createdAt)}
                    </div>
                    {onNavigate && (
                        <button
                            onClick={() => onNavigate(bookmark)}
                            className="flex items-center gap-1 text-xs font-medium text-[var(--ember)] hover:opacity-80 transition-colors"
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
                        <div className="p-4 bg-[var(--forge-error)]/10 border-t border-[var(--forge-error)]/30">
                            <p className="text-sm text-[var(--forge-error)] mb-3">
                                Delete this bookmark? This action cannot be undone.
                            </p>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-3 py-1.5 text-sm font-medium text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)] rounded-lg transition-colors"
                                    data-testid={`bookmark-delete-cancel-${bookmark.id}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-3 py-1.5 text-sm font-medium bg-[var(--forge-error)] text-[var(--forge-text-primary)] rounded-lg hover:opacity-90 transition-colors"
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
