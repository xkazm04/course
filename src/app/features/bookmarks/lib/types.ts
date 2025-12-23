export interface Bookmark {
    id: string;
    courseId: string;
    courseName: string;
    chapterId: string;
    chapterTitle: string;
    sectionId: string;
    sectionTitle: string;
    note: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    highlightedText?: string;
}

export interface BookmarkFilters {
    search: string;
    courseId: string | null;
    tags: string[];
    sortBy: "createdAt" | "updatedAt" | "courseName" | "chapterTitle";
    sortOrder: "asc" | "desc";
}

export const defaultFilters: BookmarkFilters = {
    search: "",
    courseId: null,
    tags: [],
    sortBy: "createdAt",
    sortOrder: "desc",
};
