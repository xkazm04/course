"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, BookmarkFilters, defaultFilters } from "./types";
import {
    getBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    getBookmarksBySection,
    getBookmarksByChapter,
    getAllTags,
    getAllCourses,
    filterBookmarks,
    exportToMarkdown,
    downloadMarkdown,
} from "./bookmarkStorage";

export function useBookmarks() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(() => {
        setBookmarks(getBookmarks());
    }, []);

    useEffect(() => {
        refresh();
        setLoading(false);

        // Listen for storage changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "course-bookmarks") {
                refresh();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [refresh]);

    const add = useCallback(
        (bookmark: Omit<Bookmark, "id" | "createdAt" | "updatedAt">) => {
            const newBookmark = addBookmark(bookmark);
            refresh();
            return newBookmark;
        },
        [refresh]
    );

    const update = useCallback(
        (id: string, updates: Partial<Omit<Bookmark, "id" | "createdAt">>) => {
            const updated = updateBookmark(id, updates);
            if (updated) refresh();
            return updated;
        },
        [refresh]
    );

    const remove = useCallback(
        (id: string) => {
            const success = deleteBookmark(id);
            if (success) refresh();
            return success;
        },
        [refresh]
    );

    return {
        bookmarks,
        loading,
        add,
        update,
        remove,
        refresh,
    };
}

export function useFilteredBookmarks(initialFilters?: Partial<BookmarkFilters>) {
    const [filters, setFilters] = useState<BookmarkFilters>({
        ...defaultFilters,
        ...initialFilters,
    });
    const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(() => {
        setFilteredBookmarks(filterBookmarks(filters));
    }, [filters]);

    useEffect(() => {
        refresh();
        setLoading(false);

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "course-bookmarks") {
                refresh();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [refresh]);

    const updateFilters = useCallback((newFilters: Partial<BookmarkFilters>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, []);

    return {
        bookmarks: filteredBookmarks,
        filters,
        loading,
        updateFilters,
        resetFilters,
        refresh,
    };
}

export function useSectionBookmarks(courseId: string, chapterId: string, sectionId: string) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(() => {
        setBookmarks(getBookmarksBySection(courseId, chapterId, sectionId));
    }, [courseId, chapterId, sectionId]);

    useEffect(() => {
        refresh();
        setLoading(false);

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "course-bookmarks") {
                refresh();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [refresh]);

    return { bookmarks, loading, refresh };
}

export function useChapterBookmarks(courseId: string, chapterId: string) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(() => {
        setBookmarks(getBookmarksByChapter(courseId, chapterId));
    }, [courseId, chapterId]);

    useEffect(() => {
        refresh();
        setLoading(false);

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "course-bookmarks") {
                refresh();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [refresh]);

    return { bookmarks, loading, refresh };
}

export function useBookmarkTags() {
    const [tags, setTags] = useState<string[]>([]);

    const refresh = useCallback(() => {
        setTags(getAllTags());
    }, []);

    useEffect(() => {
        refresh();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "course-bookmarks") {
                refresh();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [refresh]);

    return { tags, refresh };
}

export function useBookmarkCourses() {
    const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);

    const refresh = useCallback(() => {
        setCourses(getAllCourses());
    }, []);

    useEffect(() => {
        refresh();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "course-bookmarks") {
                refresh();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [refresh]);

    return { courses, refresh };
}

export { exportToMarkdown, downloadMarkdown };
