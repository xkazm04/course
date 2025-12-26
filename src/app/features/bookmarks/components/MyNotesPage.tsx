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
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <Bookmark size={ICON_SIZES.lg} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">
                            My Notes
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            All your bookmarks and notes in one place
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <PrismaticCard glowColor="indigo" cardElevation="flat" className="!rounded-xl" data-testid="stats-bookmarks-card">
                    <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {stats.total}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Bookmarks</p>
                    </div>
                </PrismaticCard>
                <PrismaticCard glowColor="purple" cardElevation="flat" className="!rounded-xl" data-testid="stats-courses-card">
                    <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {stats.coursesCount}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Courses</p>
                    </div>
                </PrismaticCard>
                <PrismaticCard glowColor="cyan" cardElevation="flat" className="!rounded-xl" data-testid="stats-tags-card">
                    <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                            {stats.tagsCount}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Tags</p>
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
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => updateFilters({ search: e.target.value })}
                            placeholder="Search notes, tags, chapters..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            data-testid="notes-search-input"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-colors",
                            showFilters || hasActiveFilters
                                ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        )}
                        data-testid="notes-filter-toggle"
                    >
                        <Filter size={ICON_SIZES.sm} />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
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
                            className="appearance-none pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                    </div>

                    {/* Sort Order */}
                    <button
                        onClick={() =>
                            updateFilters({
                                sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
                            })
                        }
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium text-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
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
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                                {/* Course Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Filter by Course
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => updateFilters({ courseId: null })}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                                filters.courseId === null
                                                    ? "bg-indigo-500 text-white"
                                                    : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
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
                                                        ? "bg-indigo-500 text-white"
                                                        : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
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
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                                                            ? "bg-indigo-500 text-white"
                                                            : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
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
                                        className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
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
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : bookmarks.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                        <FileText size={ICON_SIZES.xl} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        {hasActiveFilters ? "No matching bookmarks" : "No bookmarks yet"}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        {hasActiveFilters
                            ? "Try adjusting your filters or search query."
                            : "Start adding bookmarks while learning to build your personal study notes."}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            data-testid="notes-empty-clear-filters"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
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
