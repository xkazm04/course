"use client";

import { createArrayStorage, generateId } from "@/app/shared/lib/storageFactory";
import { Bookmark, BookmarkFilters } from "./types";

// Create storage using the factory
const bookmarkStorage = createArrayStorage<Bookmark>({
    storageKey: "course-bookmarks",
    generateId,
});

export { generateId };

export function getBookmarks(): Bookmark[] {
    return bookmarkStorage.getAll();
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
    bookmarkStorage.save(bookmarks);
}

export function addBookmark(bookmark: Omit<Bookmark, "id" | "createdAt" | "updatedAt">): Bookmark {
    const now = new Date().toISOString();
    const newBookmark: Bookmark = {
        ...bookmark,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
    };
    bookmarkStorage.save([newBookmark, ...bookmarkStorage.getAll()]);
    return newBookmark;
}

export function updateBookmark(id: string, updates: Partial<Omit<Bookmark, "id" | "createdAt">>): Bookmark | null {
    const bookmarks = getBookmarks();
    const index = bookmarks.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const updated: Bookmark = {
        ...bookmarks[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    bookmarks[index] = updated;
    saveBookmarks(bookmarks);
    return updated;
}

export function deleteBookmark(id: string): boolean {
    return bookmarkStorage.delete(id);
}

export function getBookmarkById(id: string): Bookmark | null {
    return bookmarkStorage.getById(id);
}

export function getBookmarksBySection(courseId: string, chapterId: string, sectionId: string): Bookmark[] {
    const bookmarks = getBookmarks();
    return bookmarks.filter(
        (b) => b.courseId === courseId && b.chapterId === chapterId && b.sectionId === sectionId
    );
}

export function getBookmarksByChapter(courseId: string, chapterId: string): Bookmark[] {
    const bookmarks = getBookmarks();
    return bookmarks.filter((b) => b.courseId === courseId && b.chapterId === chapterId);
}

export function getBookmarksByCourse(courseId: string): Bookmark[] {
    const bookmarks = getBookmarks();
    return bookmarks.filter((b) => b.courseId === courseId);
}

export function getAllTags(): string[] {
    const bookmarks = getBookmarks();
    const tagSet = new Set<string>();
    bookmarks.forEach((b) => b.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
}

export function getAllCourses(): { id: string; name: string }[] {
    const bookmarks = getBookmarks();
    const courseMap = new Map<string, string>();
    bookmarks.forEach((b) => {
        if (!courseMap.has(b.courseId)) {
            courseMap.set(b.courseId, b.courseName);
        }
    });
    return Array.from(courseMap.entries()).map(([id, name]) => ({ id, name }));
}

export function filterBookmarks(filters: BookmarkFilters): Bookmark[] {
    let bookmarks = getBookmarks();

    // Search filter
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        bookmarks = bookmarks.filter(
            (b) =>
                b.note.toLowerCase().includes(searchLower) ||
                b.chapterTitle.toLowerCase().includes(searchLower) ||
                b.sectionTitle.toLowerCase().includes(searchLower) ||
                b.courseName.toLowerCase().includes(searchLower) ||
                b.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
                (b.highlightedText && b.highlightedText.toLowerCase().includes(searchLower))
        );
    }

    // Course filter
    if (filters.courseId) {
        bookmarks = bookmarks.filter((b) => b.courseId === filters.courseId);
    }

    // Tags filter
    if (filters.tags.length > 0) {
        bookmarks = bookmarks.filter((b) => filters.tags.some((tag) => b.tags.includes(tag)));
    }

    // Sort
    bookmarks.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
            case "createdAt":
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
            case "updatedAt":
                comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                break;
            case "courseName":
                comparison = a.courseName.localeCompare(b.courseName);
                break;
            case "chapterTitle":
                comparison = a.chapterTitle.localeCompare(b.chapterTitle);
                break;
        }
        return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return bookmarks;
}

export function exportToMarkdown(bookmarks?: Bookmark[]): string {
    const data = bookmarks || getBookmarks();
    if (data.length === 0) return "# My Notes\n\nNo bookmarks yet.";

    // Group by course
    const courseGroups = new Map<string, Bookmark[]>();
    data.forEach((b) => {
        const existing = courseGroups.get(b.courseId) || [];
        existing.push(b);
        courseGroups.set(b.courseId, existing);
    });

    let markdown = "# My Notes\n\n";
    markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;
    markdown += `**Total Bookmarks:** ${data.length}\n\n---\n\n`;

    courseGroups.forEach((bookmarks, courseId) => {
        const courseName = bookmarks[0]?.courseName || courseId;
        markdown += `## ${courseName}\n\n`;

        // Group by chapter
        const chapterGroups = new Map<string, Bookmark[]>();
        bookmarks.forEach((b) => {
            const existing = chapterGroups.get(b.chapterId) || [];
            existing.push(b);
            chapterGroups.set(b.chapterId, existing);
        });

        chapterGroups.forEach((chapterBookmarks) => {
            const chapterTitle = chapterBookmarks[0]?.chapterTitle || "";
            markdown += `### ${chapterTitle}\n\n`;

            chapterBookmarks.forEach((b) => {
                markdown += `#### ${b.sectionTitle}\n\n`;

                if (b.highlightedText) {
                    markdown += `> ${b.highlightedText}\n\n`;
                }

                if (b.note) {
                    markdown += `${b.note}\n\n`;
                }

                if (b.tags.length > 0) {
                    markdown += `**Tags:** ${b.tags.map((t) => `\`${t}\``).join(", ")}\n\n`;
                }

                markdown += `*Created: ${new Date(b.createdAt).toLocaleString()}*\n\n`;
                markdown += "---\n\n";
            });
        });
    });

    return markdown;
}

export function downloadMarkdown(filename: string = "my-notes.md"): void {
    const markdown = exportToMarkdown();
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
