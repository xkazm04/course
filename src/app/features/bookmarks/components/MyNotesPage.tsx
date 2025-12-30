"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Filter,
    Tag,
    BookOpen,
    Download,
    X,
    SortAsc,
    SortDesc,
    ChevronDown,
    Bookmark,
    FileText,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { PrismaticCard } from "@/app/shared/components";
import { BookmarkCard } from "./BookmarkCard";
import {
    useFilteredBookmarks,
    useBookmarkTags,
    useBookmarkCourses,
    downloadMarkdown,
} from "../lib/useBookmarks";
import { Bookmark as BookmarkType, BookmarkFilters } from "../lib/types";

interface MyNotesPageProps {
    onNavigate?: (bookmark: BookmarkType) => void;
}

export const MyNotesPage: React.FC<MyNotesPageProps> = ({ onNavigate }) => {
    const { bookmarks, filters, updateFilters, resetFilters, loading } = useFilteredBookmarks();
    const { tags } = useBookmarkTags();
    const { courses } = useBookmarkCourses();
    const [showFilters, setShowFilters] = useState(false);

    const stats = useMemo(() => {
        return {
            total: bookmarks.length,
            coursesCount: courses.length,
            tagsCount: tags.length,
        };
    }, [bookmarks.length, courses.length, tags.length]);

    const sortOptions: { label: string; value: BookmarkFilters["sortBy"] }[] = [
        { label: "Date Created", value: "createdAt" },
        { label: "Date Updated", value: "updatedAt" },
        { label: "Course", value: "courseName" },
        { label: "Chapter", value: "chapterTitle" },
    ];

    const handleExport = () => {
        downloadMarkdown("my-notes.md");
    };

    const handleTagClick = (tag: string) => {
        const newTags = filters.tags.includes(tag)
            ? filters.tags.filter((t) => t !== tag)
            : [...filters.tags, tag];
        updateFilters({ tags: newTags });
    };

    const hasActiveFilters =
        filters.search !== "" ||
        filters.courseId !== null ||
        filters.tags.length > 0;

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--ember)] to-[var(--ember-dim)] rounded-2xl flex items-center justify-center">
                        <Bookmark size={ICON_SIZES.lg} className="text-[var(--forge-text-primary)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[var(--forge-text-primary)]">
                            My Notes
                        </h1>
                        <p className="text-[var(--forge-text-secondary)]">
                            All your bookmarks and notes in one place
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <PrismaticCard glowColor="indigo" cardElevation="flat" className="!rounded-xl" data-testid="stats-bookmarks-card">
                    <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-[var(--ember)]">
                            {stats.total}
                        </p>
                        <p className="text-xs text-[var(--forge-text-secondary)]">Bookmarks</p>
                    </div>
                </PrismaticCard>
                <PrismaticCard glowColor="purple" cardElevation="flat" className="!rounded-xl" data-testid="stats-courses-card">
                    <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-[var(--ember)]">
                            {stats.coursesCount}
                        </p>
                        <p className="text-xs text-[var(--forge-text-secondary)]">Courses</p>
                    </div>
                </PrismaticCard>
                <PrismaticCard glowColor="cyan" cardElevation="flat" className="!rounded-xl" data-testid="stats-tags-card">
                    <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-[var(--ember)]">
                            {stats.tagsCount}
                        </p>
                        <p className="text-xs text-[var(--forge-text-secondary)]">Tags</p>
                    </div>
                </PrismaticCard>
            </div>

            {/* Search & Controls */}
            <div className="mb-6 space-y-4">
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search
                            size={ICON_SIZES.md}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]"
                        />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => updateFilters({ search: e.target.value })}
                            placeholder="Search notes, tags, chapters..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ember)] focus:border-transparent"
                            data-testid="notes-search-input"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-colors",
                            showFilters || hasActiveFilters
                                ? "bg-[var(--ember-dim)]/10 border-[var(--ember)]/30 text-[var(--ember)]"
                                : "bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)]"
                        )}
                        data-testid="notes-filter-toggle"
                    >
                        <Filter size={ICON_SIZES.sm} />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 bg-[var(--ember)] rounded-full" />
                        )}
                    </button>

                    {/* Sort */}
                    <div className="relative">
                        <select
                            value={filters.sortBy}
                            onChange={(e) =>
                                updateFilters({
                                    sortBy: e.target.value as BookmarkFilters["sortBy"],
                                })
                            }
                            className="appearance-none pl-4 pr-10 py-3 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ember)]"
                            data-testid="notes-sort-select"
                        >
                            {sortOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={ICON_SIZES.sm}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)] pointer-events-none"
                        />
                    </div>

                    {/* Sort Order */}
                    <button
                        onClick={() =>
                            updateFilters({
                                sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
                            })
                        }
                        className="p-3 rounded-xl border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-anvil)] transition-colors"
                        data-testid="notes-sort-order-btn"
                    >
                        {filters.sortOrder === "asc" ? (
                            <SortAsc size={ICON_SIZES.md} />
                        ) : (
                            <SortDesc size={ICON_SIZES.md} />
                        )}
                    </button>

                    {/* Export */}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--ember)] text-[var(--forge-text-primary)] font-medium text-sm hover:opacity-90 transition-colors"
                        data-testid="notes-export-btn"
                    >
                        <Download size={ICON_SIZES.sm} />
                        Export
                    </button>
                </div>

                {/* Filter Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 bg-[var(--forge-bg-anvil)] rounded-xl border border-[var(--forge-border-subtle)] space-y-4">
                                {/* Course Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                                        Filter by Course
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => updateFilters({ courseId: null })}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                                filters.courseId === null
                                                    ? "bg-[var(--ember)] text-[var(--forge-text-primary)]"
                                                    : "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)]/80"
                                            )}
                                            data-testid="notes-filter-all-courses"
                                        >
                                            All Courses
                                        </button>
                                        {courses.map((course) => (
                                            <button
                                                key={course.id}
                                                onClick={() =>
                                                    updateFilters({
                                                        courseId:
                                                            filters.courseId === course.id
                                                                ? null
                                                                : course.id,
                                                    })
                                                }
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                                    filters.courseId === course.id
                                                        ? "bg-[var(--ember)] text-[var(--forge-text-primary)]"
                                                        : "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)]/80"
                                                )}
                                                data-testid={`notes-filter-course-${course.id}`}
                                            >
                                                {course.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tag Filter */}
                                {tags.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--forge-text-secondary)] mb-2">
                                            Filter by Tags
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((tag) => (
                                                <button
                                                    key={tag}
                                                    onClick={() => handleTagClick(tag)}
                                                    className={cn(
                                                        "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                                        filters.tags.includes(tag)
                                                            ? "bg-[var(--ember)] text-[var(--forge-text-primary)]"
                                                            : "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)]/80"
                                                    )}
                                                    data-testid={`notes-filter-tag-${tag}`}
                                                >
                                                    <Tag size={ICON_SIZES.xs} />
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <button
                                        onClick={resetFilters}
                                        className="flex items-center gap-1 text-sm font-medium text-[var(--forge-error)] hover:opacity-80 transition-colors"
                                        data-testid="notes-clear-filters"
                                    >
                                        <X size={ICON_SIZES.sm} />
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-[var(--ember)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : bookmarks.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 bg-[var(--forge-bg-anvil)] rounded-2xl flex items-center justify-center">
                        <FileText size={ICON_SIZES.xl} className="text-[var(--forge-text-muted)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--forge-text-primary)] mb-2">
                        {hasActiveFilters ? "No matching bookmarks" : "No bookmarks yet"}
                    </h3>
                    <p className="text-[var(--forge-text-secondary)] max-w-md mx-auto">
                        {hasActiveFilters
                            ? "Try adjusting your filters or search query."
                            : "Start adding bookmarks while learning to build your personal study notes."}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="mt-4 px-4 py-2 text-sm font-medium text-[var(--ember)] hover:opacity-80 transition-colors"
                            data-testid="notes-empty-clear-filters"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-[var(--forge-text-secondary)]">
                        Showing {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}
                    </p>
                    <AnimatePresence>
                        {bookmarks.map((bookmark) => (
                            <BookmarkCard
                                key={bookmark.id}
                                bookmark={bookmark}
                                onNavigate={onNavigate}
                                showCourse={true}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
